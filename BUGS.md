# Bugs em investigação — Integração Mercado Pago

Última atualização: 2026-08-06

## Status geral

Pagamento é criado e aprovado de verdade no Mercado Pago (confirmado múltiplas vezes,
`status: processed`, `status_detail: accredited`). **Bug #1 (o crítico, que impedia o
pedido pago de ficar registrado no banco) foi encontrado e corrigido nesta sessão.**
Bug #2 tem mitigação manual mas ainda falta o fix definitivo (expiração automática).
Bug #3 (webhook) segue sem solução do nosso lado.

`MERCADO_PAGO_ENABLE_PRODUCTION` ainda está `false` — só deve ser ligado depois de rodar
mais uma compra E2E real do zero (não reconciliação manual) pra validar o fluxo completo
com o fix aplicado, e idealmente depois de decidir o que fazer com Bug #2/#3.

---

## Bug #1 — RPC `apply_mercado_pago_order` sempre falhava por coluna ambígua (RESOLVIDO 2026-08-06)

**Sintoma:** cliente recebia "Serviço temporariamente indisponível" (503) mesmo com o
pagamento aprovado no Mercado Pago. Pedido ficava com `status: PROCESSING`,
`provider_order_id: null` no nosso banco — órfão, sem saber que foi pago. Acontecia
em **100% das vezes** que um pagamento chegava a `PAID` (não era intermitente, e nunca
foi — só parecia intermitente porque a maioria dos testes anteriores falhava antes
disso por outros motivos, como `out_of_stock` ou email inválido).

**Causa raiz real:** a função `apply_mercado_pago_order` é declarada como
`RETURNS TABLE(public_order_id uuid, status payment_status, fulfillment_status fulfillment_status, transitioned_to_paid boolean)`.
Em PL/pgSQL, os nomes de colunas de `RETURNS TABLE` viram variáveis automáticas no
escopo da função. O corpo da função tinha referências **não qualificadas** a `status` e
`fulfillment_status` que colidiam com essas variáveis:
- três queries em `inventory_reservations` com `where ... and status = 'RESERVED'`
  (sem alias de tabela) — Postgres não sabia se `status` era a variável de saída ou a
  coluna da tabela → `ERROR: column reference "status" is ambiguous`.
- um `else fulfillment_status` dentro de um `CASE` no `UPDATE public.orders` — mesmo
  problema com `fulfillment_status`.

Como é uma exceção do Postgres levantada dentro de uma transação de RPC, **a transação
inteira sofria rollback** — nada era persistido, nem o `provider_order_id` no
`payment_attempts`. O erro não batia com nenhum código conhecido em
`PERSISTENCE_CODES` (`src/lib/payments/repository.ts`), então virava
`PaymentPersistenceError('persistence_failure')`, e a função `persistenceFailure()` em
`src/app/api/payments/mercadopago/route.ts` só loga para 4 códigos específicos — para
qualquer outro código (incluindo `persistence_failure`), ela retornava `503` **sem
logar nada**. Foi por isso que nenhum log de erro nosso aparecia — não era hang nem
timeout, era um erro real do Postgres sendo engolido silenciosamente por design.

**Como foi encontrado:** os checkpoints de diagnóstico mostravam que a execução parava
entre `checkpoint_status_mapped` e `checkpoint_order_applied`, mas a query de logs do
Vercel só buscava por `"checkpoint"` — mascarando qualquer outro log na mesma
invocação. Ao buscar os logs da rota sem filtro, nada adicional apareceu (confirmando
o "silêncio" do `persistenceFailure`). A pista real veio de `get_logs` do Supabase
(`service: postgres`), que mostrava `ERROR: column reference "status" is ambiguous`
recorrente há dias, em vários horários — sempre que uma tentativa de pagamento
alcançava `PAID`.

**Fix aplicado:**
1. Migração `supabase/migrations/20260806190000_fix_apply_mercado_pago_order_ambiguous_status.sql`
   — recria a função com `inventory_reservations` aliasada (`ir`) e todas as referências
   a `status`/`quantity`/`product_id` qualificadas via `ir.`, e `fulfillment_status`
   qualificado como `public.orders.fulfillment_status` no `CASE`.
2. `src/app/api/payments/mercadopago/route.ts`: `persistenceFailure()` agora loga
   `payment_persistence_failed` com o `code` para **qualquer** código não tratado
   explicitamente, antes de cair no 503 genérico — para nunca mais termos um erro de
   pagamento 100% silencioso, seja qual for a causa futura.
3. Checkpoints de diagnóstico temporários (`checkpoint_order_created`,
   `checkpoint_status_mapped`, `checkpoint_order_applied`) removidos — cumpriram o
   papel de isolar o problema.

**Validação:** o pedido real que ficou órfão durante o teste desta sessão
(`external_reference: ord_2f52b3713c882a3d43c200f0426704f3`, Mercado Pago
`ORDTST01KZC4NS4HWSMZK6QV41K0C2PP`, pagamento `PAY01KZC4NS52YWHWSDB99M9002NS`,
R$ 221,90, `accredited`) foi reconciliado manualmente chamando a RPC corrigida
com os dados reais obtidos direto da API do Mercado Pago. Resultado:
`status: PAID`, `fulfillment_status: READY`, `transitioned_to_paid: true` — estoque do
Armaf Club de Nuit decrementado corretamente (`stock_on_hand: 0`), reserva marcada
`CONSUMED`, pedido com `paid_at`/`inventory_applied_at` preenchidos.

**Ainda pendente:** essa validação usou uma chamada direta à RPC (via SQL), não uma
compra nova de ponta a ponta pela rota real. Recomendado rodar mais um teste E2E
completo (Playwright, cartão de teste, produto com estoque disponível) para confirmar
que o caminho da aplicação inteiro (`POST /api/payments/mercadopago` → `applyProviderOrder`)
funciona sem intervenção manual antes de considerar ligar `MERCADO_PAGO_ENABLE_PRODUCTION`.

**Arquivos relevantes:**
- `supabase/migrations/20260806190000_fix_apply_mercado_pago_order_ambiguous_status.sql`
- `src/app/api/payments/mercadopago/route.ts` (`persistenceFailure`)
- `src/lib/payments/repository.ts:178` (`applyProviderOrder`)

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
- [x] Remover checkpoints `checkpoint_order_created`/`checkpoint_status_mapped`/
      `checkpoint_order_applied` de `src/app/api/payments/mercadopago/route.ts` —
      removidos ao resolver Bug #1 (2026-08-06).
- [ ] Rodar mais um teste E2E completo pela rota real (não RPC manual) para validar
      o fix do Bug #1 de ponta a ponta antes de considerar produção.
- [ ] Implementar expiração/liberação automática de reservas de estoque (Bug #2).
