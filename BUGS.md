# Bugs em investigação — Integração Mercado Pago

Última atualização: 2026-08-06

## Status geral

Pagamento é criado e aprovado de verdade no Mercado Pago (confirmado múltiplas vezes,
`status: processed`, `status_detail: accredited`). Os dois caminhos que deveriam marcar
o pedido como PAGO no nosso banco têm problema, então **não há garantia hoje de que um
pedido pago fique refletido no sistema**. Por isso `MERCADO_PAGO_ENABLE_PRODUCTION=false`
e não deve ser ligado até o Bug #1 ser resolvido.

---

## Bug #1 — Reconciliação síncrona trava intermitentemente (CRÍTICO, em investigação)

**Sintoma:** cliente recebe "Serviço temporariamente indisponível" (503) mesmo com o
pagamento aprovado no Mercado Pago. Pedido fica com `status: PROCESSING`,
`provider_order_id: null` no nosso banco — órfão, sem saber que foi pago.

**Onde:** `src/app/api/payments/mercadopago/route.ts`, função `POST`.

**Evidência (checkpoints de diagnóstico já commitados):**
```
event: checkpoint_order_created   -> dispara, providerOrderId presente, status: 'processed'
event: checkpoint_status_mapped   -> dispara, status: 'PAID'
event: checkpoint_order_applied   -> NUNCA dispara
```
Ou seja, trava dentro de `repository.applyProviderOrder(authoritative, status)`
(`src/lib/payments/repository.ts:178`), que chama a RPC `apply_mercado_pago_order`
no Postgres. Nenhum log de erro nosso dispara (nem `provider_request_failed` nem
`payment_route_failed`) — sugere que a função Vercel foi encerrada pela plataforma
enquanto ainda aguardava a RPC (await nunca resolve nem rejeita a tempo), não uma
exceção tratada pelo nosso `catch`.

**Hipóteses ainda não confirmadas:**
1. Lock/contenção no Postgres — descartado parcialmente: `pg_stat_activity` checado
   logo após reproduzir mostrou 0 queries ativas e só 13 conexões totais (não parece
   esgotamento de pool no momento verificado, mas pool poderia ter estado saturado
   *durante* o request e já ter liberado quando chequei).
2. RPC realmente lenta por causa de volume de queries manuais rodadas durante a sessão
   de debug (auto-inflingido, não bug de produção real) — precisa reproduzir em
   ambiente "limpo" (sem MCP rodando queries em paralelo) pra confirmar/descartar.
3. Algum caminho dentro da função `apply_mercado_pago_order` (ver definição completa
   abaixo) que pode demorar mais que o esperado sob certas condições de estoque/lock.

**Definição atual da RPC** (`apply_mercado_pago_order`, Postgres, `SECURITY DEFINER`):
- Faz `select ... for update` em `orders` (por `external_reference`) e em
  `payment_attempts` (por `order_id`, mais recente) — locks de linha únicos por
  tentativa, não deveriam colidir entre tentativas diferentes.
- Valida valores (amount, currency, provider_order_id, provider_payment_id).
- Se `PAID` e inventário ainda não aplicado: confere se as reservas (`inventory_reservations`,
  status `RESERVED`) batem com os itens do pedido antes de decrementar estoque.
- Decrementa `products.stock_on_hand`/`stock_reserved`, marca reserva como `CONSUMED`,
  grava em `inventory_movements`.
- Insere em `fulfillment_outbox` quando aplicável.

**Próximos passos sugeridos:**
- Reproduzir o teste de compra em um momento SEM nenhuma query manual concorrente via
  MCP, pra isolar se é sobrecarga da sessão de debug ou bug real.
- Adicionar timing/instrumentação dentro da própria função SQL (ou logar
  `NOW()` antes/depois de cada bloco) pra ver qual trecho está lento.
- Considerar adicionar `export const maxDuration = 30` (ou mais) na rota, como rede de
  segurança — não resolve a causa raiz mas evita truncamento silencioso pela plataforma.
- Verificar limite de conexões do plano Supabase atual (free tier costuma ser baixo)
  e se o app usa um client novo por request sem pooling adequado
  (`createSupabaseAdmin` — checar se reaproveita conexão ou abre nova toda vez).

**Arquivos relevantes:**
- `src/app/api/payments/mercadopago/route.ts` (checkpoints de diagnóstico já adicionados,
  linhas com `checkpoint_order_created`/`checkpoint_status_mapped`/`checkpoint_order_applied`)
- `src/lib/payments/repository.ts:178` (`applyProviderOrder`)
- `src/lib/server/supabase-admin.ts` (como o client é criado por request)
- Migração original da função `apply_mercado_pago_order` em `supabase/migrations/`

---

## Bug #2 — Reserva de estoque nunca expira/libera automaticamente (CONFIRMADO, mitigado manualmente)

**Sintoma:** toda tentativa de pagamento que falha/trava no meio do caminho deixa a
reserva de estoque (`inventory_reservations.status = 'RESERVED'`) presa para sempre.
`products.stock_reserved` nunca volta a diminuir, produto fica "sem estoque disponível"
mesmo tendo unidades físicas livres.

**Causa:** não existe função de release automático nem cron/expiração. A única forma de
uma reserva sair de `RESERVED` é o fluxo feliz completo (`apply_mercado_pago_order`
marcando como `CONSUMED`) ou uma rejeição explícita tratada (`RELEASED`). Se a request
trava/morre no meio (como no Bug #1), a reserva fica órfã.

**Mitigação aplicada hoje (manual, via SQL):** liberadas manualmente as reservas órfãs
de ids 3, 4, 5, 6 e recalculado `stock_reserved` dos 3 produtos ativos.

**Fix real ainda não implementado:** precisa de uma expiração (ex.: reserva expira depois
de N minutos sem confirmação) rodando via cron/Edge Function, ou um mecanismo de
liberação no próprio `startAttempt`/checkout quando detecta reserva antiga do mesmo
carrinho/sessão.

**Arquivos relevantes:**
- Tabela `inventory_reservations` (colunas: `id`, `payment_attempt_id`, `order_item_id`,
  `product_id`, `quantity`, `status`, `created_at`, `updated_at`)
- `src/lib/payments/repository.ts` (`startAttempt`, onde a reserva é criada)

---

## Bug #3 — Webhook do Mercado Pago sempre rejeita assinatura (NÃO RESOLVIDO)

**Sintoma:** toda notificação real que a MP envia pro nosso endpoint
(`/api/webhooks/mercadopago`) retorna 401 (`webhook_signature_rejected`). Painel da MP
mostra "0% Notificações entregues".

**O que já foi descartado:**
- Não é bug no nosso código de validação — manifest reconstruído manualmente bate
  exatamente com o algoritmo oficial da lib `mercadopago` (`WebhookSignatureValidator`)
  e com a documentação oficial.
- Não é secret desatualizado — regenerei o secret ("Redefinir" no painel MP) e testei
  de novo, resultado idêntico (nenhuma combinação de manifest bate).
- Não é `data.id` ausente — confirmado presente na query string
  (`?data.id=ORDTST...&type=order`).
- Não é múltiplos webhooks conflitantes — só existe 1 webhook configurado
  (URL: `madriperfumaria.com.br/api/webhooks/mercadopago`, evento `Order (Mercado Pago)`).
- Secret é idêntico entre aba "Modo de teste" e "Modo de produção" no painel MP.
- Testei recalculando HMAC manualmente com: dataId maiúsculo/minúsculo, com/sem
  `request-id` no manifest, com/sem `;` final, secret como string ASCII vs bytes
  hex-decodificados — nenhuma combinação bate com a assinatura real recebida.

**Evidência (exemplo real, 2026-08-06 18:05 UTC):**
```
dataId: ORDTST01KZC403T9DR0RWHMAJBAV7J0A
requestId: e619ce3c-196b-43ba-905d-4a37b7c5089b
ts: 1786039507
v1 recebido: fadb0913b15f70c93c3720ffa4cda7b23aeca1572e34764aeff886b6acd50137
secret usado: 054bb6baba16c28a7c83f2d7aa4d5e774f3c6bf06f3937d74907b36a7a984bab (recém-regenerado)
manifest: id:ordtst01kzc403t9dr0rwhmajbav7j0a;request-id:e619ce3c-196b-43ba-905d-4a37b7c5089b;ts:1786039507;
resultado: não bate com nenhuma variação testada
```

**Hipótese atual:** provável inconsistência do lado da Mercado Pago especificamente
para notificações tipo `order` no Checkout Transparente — não é algo que dá pra
resolver só no nosso código.

**Próximo passo:** abrir chamado com o suporte da Mercado Pago com essa evidência
(dataId + requestId + ts + assinatura recebida + secret usado + manifest calculado).
Como o pagamento síncrono já retorna o status final direto pro cliente (quando o
Bug #1 não trava), o webhook não é estritamente necessário pro fluxo feliz — serve
como reconciliação de segurança para eventos assíncronos futuros (chargeback, etc).

**Arquivos relevantes:**
- `src/app/api/webhooks/mercadopago/route.ts` (tem log de diagnóstico temporário
  `webhook_debug_diagnostic` — remover depois de resolvido ou de abrir o chamado)
- `src/lib/mercadopago/webhook-signature.ts`
- `node_modules/mercadopago/dist/utils/webhook/index.js` (implementação oficial de referência)

---

## Débito técnico / limpeza pendente

- [ ] Remover log de diagnóstico `webhook_debug_diagnostic` de
      `src/app/api/webhooks/mercadopago/route.ts` (linha ~24) depois de resolver Bug #3
      ou de ter evidência suficiente pro chamado da MP.
- [ ] Remover checkpoints `checkpoint_order_created`/`checkpoint_status_mapped`/
      `checkpoint_order_applied` de `src/app/api/payments/mercadopago/route.ts` depois
      de resolver Bug #1 (ou promovê-los a logging permanente se fizer sentido manter
      visibilidade nesse trecho).
- [ ] Implementar expiração/liberação automática de reservas de estoque (Bug #2).
