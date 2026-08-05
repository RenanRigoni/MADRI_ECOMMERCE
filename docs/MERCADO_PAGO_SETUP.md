# Mercado Pago Checkout Transparente — instalação e operação

## Estado seguro atual

A integração usa Card Payment Brick no navegador e a Orders API (`/v1/orders`) no servidor. Ela nasce desativada e não aceita pagamentos reais automaticamente.

Há duas pendências reais do catálogo atual que impedem um teste de ponta a ponta: os 159 produtos em `src/data/perfumes.json` têm preço zero e a tabela `public.products` ainda precisa receber preços/estoque autoritativos. Além disso, o projeto não tinha cálculo de frete; `CHECKOUT_SHIPPING_CENTS` deve ser definido explicitamente em centavos (`0` significa frete grátis confirmado pelo operador).

Não ative `MERCADO_PAGO_PAYMENTS_ENABLED=true` antes de aplicar a migração, cadastrar produtos com preços positivos, definir o frete e usar credenciais de teste.

## Arquitetura

1. O carrinho local guarda somente `productId` e quantidade.
2. `POST /api/checkout/quote` valida entrada, identifica a sessão guest por cookie HttpOnly e pede ao PostgreSQL uma cotação atômica.
3. O PostgreSQL lê preço/estoque de `public.products`, salva snapshots em `orders`/`order_items` e devolve apenas uma cotação sanitizada.
4. O Card Payment Brick coleta e tokeniza o cartão diretamente no Mercado Pago. Número, CVV e validade não atravessam a API da loja.
5. `POST /api/payments/mercadopago` revalida cotação e estoque, reserva inventário e cria/reutiliza uma tentativa com chave de idempotência estável.
6. O servidor cria a Order em `POST https://api.mercadopago.com/v1/orders` com `type=online`, `processing_mode=automatic`, valor server-side e `external_reference` opaca.
7. A resposta é normalizada e aplicada por uma RPC transacional. Somente `processed/accredited` vira `PAID`.
8. `POST /api/webhooks/mercadopago` valida `x-signature`, `x-request-id` e `data.id` com o SDK Node oficial; depois faz `GET /v1/orders/{id}` e aplica a mesma reconciliação.
9. A transição inédita para `PAID` consome a reserva uma vez e grava `ORDER_PAID` em `fulfillment_outbox` na mesma transação.

Referências oficiais: [cartões com Orders API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/cards), [Create Order](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-api/create-order/post), [Get Order](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-api/get-order/get), [webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks) e [notificações de Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/notifications).

## Variáveis de ambiente

Copie `.env.example` para `.env.local` sem versionar o arquivo.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CHECKOUT_SHIPPING_CENTS=

NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
MERCADO_PAGO_MODE=test
MERCADO_PAGO_PAYMENTS_ENABLED=false
MERCADO_PAGO_ENABLE_PRODUCTION=false
```

- `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` é a única credencial Mercado Pago permitida no navegador.
- `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` são somente servidor.
- `CHECKOUT_SHIPPING_CENTS` é o frete fixo autoritativo temporário. Exemplo: `1590` = R$ 15,90; use `0` somente se a política da loja realmente for frete grátis.
- `MERCADO_PAGO_MODE` permanece `test` até a ativação formal de produção.
- `MERCADO_PAGO_PAYMENTS_ENABLED=true` é a trava final de pagamento.
- Mesmo com credenciais de produção, `MERCADO_PAGO_ENABLE_PRODUCTION=true` também é necessário. Essa dupla trava evita ativação acidental.

Nunca registre valores dessas variáveis em tickets, logs, commits ou capturas de tela.

## Banco Supabase

Aplique `supabase/migrations/20260805110000_commerce_payments.sql` no projeto correto por um fluxo de migração revisado. Não use reset no banco de produção. A migração cria:

- `products`, `orders`, `order_items` e `payment_attempts`;
- reservas e movimentos de inventário;
- recibos idempotentes de webhook;
- outbox transacional de fulfillment;
- rate limit durável por janela;
- RPCs atômicas para cotação, tentativa, reconciliação e consulta guest;
- RPCs com claim token para consumir/confirmar eventos da outbox sem acesso direto às tabelas;
- RLS sem políticas de leitura pública e grants somente para `service_role`.

Antes da ativação:

1. Faça backup e revise o projeto Supabase selecionado.
2. Aplique a migração em ambiente de teste.
3. Execute `supabase/tests/commerce_payments.sql` com pgTAP (ou `supabase test db` em um ambiente local compatível).
4. Atualize o campo visual `price` em `src/data/perfumes.json` somente com preços comerciais aprovados; sem isso, o botão de compra continua bloqueado.
5. Importe os mesmos IDs para `public.products`, fornecendo `price_cents > 0`, `stock_on_hand`, `active` e `currency='BRL'`. O JSON serve para apresentação; o banco continua sendo a autoridade cobrada.
6. Compare contagem, IDs, preços e estoque entre as duas fontes antes de liberar o checkout.
7. Agende `expire_unsubmitted_payment_attempts(100)` em intervalo curto (por exemplo, cinco minutos), e diariamente `cleanup_api_rate_limits(now() - interval '1 day')` e `purge_abandoned_checkout_quotes(now() - interval '1 day', 500)` via Supabase Cron ou job operacional. A primeira função só libera tentativas `PENDING` que comprovadamente ainda não chegaram ao provedor; a última apaga somente drafts sem tentativa de pagamento. Estados incertos e pedidos financeiros não são eliminados às cegas.

O código não inventa preços nem cria seed executável com valores fictícios. Até essa carga ser aprovada, “Preço indisponível” é o comportamento correto.

## Configuração local

1. Instale dependências com `npm ci`.
2. Aplique a migração no Supabase de teste e cadastre produtos de teste com preço positivo.
3. Preencha Supabase e `CHECKOUT_SHIPPING_CENTS` em `.env.local`.
4. Depois de obter acesso ao Mercado Pago, preencha a Public Key e o Access Token de teste.
5. Mantenha `MERCADO_PAGO_MODE=test`, `MERCADO_PAGO_ENABLE_PRODUCTION=false` e, até estar pronto para testar, `MERCADO_PAGO_PAYMENTS_ENABLED=false`.
6. Inicie `npm run dev`, revise a cotação e só então mude `MERCADO_PAGO_PAYMENTS_ENABLED=true`.

## Passos no painel Mercado Pago

Quando o acesso estiver disponível:

1. Abra **Suas integrações** e selecione **Criar aplicação** (ou abra a aplicação existente).
2. Escolha **Pagamentos online** e informe que a integração foi desenvolvida pela própria equipe.
3. Em **Checkouts**, escolha **Checkout Transparente** e a opção **API de Orders**.
4. Entre em **Dados da integração → Testes → Credenciais de teste**.
5. Copie a **Public Key** para `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`.
6. Copie o **Access Token** para `MERCADO_PAGO_ACCESS_TOKEN`.
7. Faça o primeiro deploy de teste com a rota de webhook publicada.
8. Na aplicação, abra **Webhooks → Configurar notificações**.
9. Cadastre a URL HTTPS terminada em `/api/webhooks/mercadopago` e selecione **Order (Mercado Pago)**.
10. Salve, copie a chave secreta gerada para `MERCADO_PAGO_WEBHOOK_SECRET` e redeploye.
11. Use **Simular** no painel para enviar uma notificação de teste e confirme resposta HTTP 200 nos logs.

Documentação oficial: [criar aplicação](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/create-application), [credenciais](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/resources/credentials) e [ir para produção](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/go-to-production).

## URL de webhook

A rota exata criada é:

```text
/api/webhooks/mercadopago
```

Cadastre:

```text
https://SEU_DOMINIO_CANONICO/api/webhooks/mercadopago
```

O repositório contém referências conflitantes a `madriperfumaria.com.br` e `madriperfumes.com.br`, e não contém vínculo Vercel que prove qual é o domínio publicado. Confirme em **Vercel → Project → Settings → Domains** e use o domínio marcado como produção. Não use URL de Preview como webhook definitivo.

## Configuração na Vercel

Abra **Project → Settings → Environment Variables**.

- **Development** e **Preview**: Supabase de teste, frete de teste explicitamente definido, credenciais Mercado Pago de teste, `MERCADO_PAGO_MODE=test`, `MERCADO_PAGO_PAYMENTS_ENABLED=true` somente durante os testes autorizados e `MERCADO_PAGO_ENABLE_PRODUCTION=false`.
- **Production antes da aprovação**: Supabase de produção se o catálogo precisar funcionar, frete confirmado, nenhuma credencial Mercado Pago de produção, `MERCADO_PAGO_MODE=test`, `MERCADO_PAGO_PAYMENTS_ENABLED=false` e `MERCADO_PAGO_ENABLE_PRODUCTION=false`.
- **Production após aprovação**: credenciais de produção apenas no escopo Production. Faça um deploy ainda com `MERCADO_PAGO_PAYMENTS_ENABLED=false`, configure/teste o webhook de produção e habilite a flag apenas no último deploy.

Marque Access Token, Webhook Secret e Service Role como valores sensíveis. A Public Key Mercado Pago pode ser pública; não transforme nenhum outro segredo em `NEXT_PUBLIC_*`. Toda mudança em variável pública exige novo deploy para atualizar o bundle do navegador.

## Testes com cartões oficiais

Use somente credenciais de teste e os dados da [documentação oficial de cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/integration-test/cards). Na documentação consultada:

| Bandeira | Número | Validade | CVV |
|---|---:|---:|---:|
| Mastercard crédito | `5480 8328 0103 3311` | `11/30` | `123` |
| Visa crédito | `4235 6477 2802 5682` | `11/30` | `123` |
| American Express | `3753 651535 56885` | `11/30` | `1234` |
| Elo débito | `5067 7667 8388 8311` | `11/30` | `123` |

Use `test@testuser.com`, CPF `12345678909` e titular `APRO` para aprovação. Use titular `OTHE` para recusa genérica. Confirme esses dados novamente na página oficial antes do teste, pois o provedor pode atualizá-los.

### Aprovação

1. Abra o checkout com um produto de teste cadastrado e estoque disponível.
2. Use um cartão oficial, titular `APRO` e dados de teste.
3. Confirme `PAID` na tela do pedido.
4. No Supabase, confirme uma única reserva `CONSUMED`, um único movimento `SALE` e um único `ORDER_PAID` na outbox.

### Recusa

Repita com titular `OTHE`. O pedido deve permanecer não pago, mostrar mensagem humana, liberar a reserva uma única vez e não criar `ORDER_PAID`.

### Webhook

Use **Webhooks → Simular**. Verifique assinatura válida, `GET /v1/orders/{id}`, recibo em `webhook_receipts` e reconciliação. Repita a mesma entrega: não pode ocorrer nova baixa nem novo evento de fulfillment. Assinatura ausente/inválida deve retornar 401 quando a configuração está presente.

### Idempotência e retry

No DevTools, capture uma submissão e repita o mesmo POST mantendo `publicOrderId` e `attemptId`. A tentativa deve reutilizar a mesma `idempotency_key`. Para timeout/rede, repita a mesma tentativa; a API usa a mesma chave Mercado Pago. Um payload diferente com o mesmo `attemptId` deve retornar conflito e nunca gerar segunda cobrança.

### Verificação do pedido armazenado

Compare, sem copiar dados sensíveis:

- `orders.external_reference` com a Order no Mercado Pago;
- `orders.provider_order_id` com o ID retornado por `GET /v1/orders/{id}`;
- `orders.total_cents`, `payment_attempts.amount_cents` e valor da transação;
- `orders.status='PAID'` apenas quando o provedor estiver `processed/accredited`.

## Checklist mínimo antes de produção

- [ ] Brick renderiza com Public Key de teste.
- [ ] Cartão aprovado e recusado.
- [ ] Dados inválidos e erro de API/rede.
- [ ] Botão duplo, POST duplicado, retry e timeout.
- [ ] Preço do frontend ignorado; quantidade, produto e estoque inválidos rejeitados.
- [ ] Webhook válido, inválido, ausente, duplicado e Order desconhecida.
- [ ] Divergência de `external_reference`, valor e moeda bloqueada.
- [ ] Sincronização de status e baixa de inventário exatamente uma vez.
- [ ] Build e páginas públicas funcionam sem credenciais.
- [ ] Migração e pgTAP executados no Supabase de teste.
- [ ] Rate limit do banco observado e regras adicionais configuradas no Vercel Firewall, se necessário.
- [ ] Consumidor operacional de `fulfillment_outbox` definido para e-mail/faturamento/expedição.

## Troca segura para produção

1. Conclua o checklist em teste e obtenha aprovação comercial/operacional.
2. Em **Dados da integração → Credenciais → Produção**, faça a ativação solicitada pelo Mercado Pago, informando setor/site e aceitando os termos/reCAPTCHA.
3. Adicione Public Key, Access Token e Webhook Secret de produção somente ao ambiente Production da Vercel.
4. Defina `MERCADO_PAGO_MODE=production`, mantenha as duas flags de ativação falsas e faça deploy.
5. Cadastre/teste o webhook de produção no domínio canônico.
6. Defina `MERCADO_PAGO_ENABLE_PRODUCTION=true`; mantenha `MERCADO_PAGO_PAYMENTS_ENABLED=false` e faça uma verificação final.
7. Só então defina `MERCADO_PAGO_PAYMENTS_ENABLED=true` e redeploye.
8. Para rollback imediato, volte `MERCADO_PAGO_PAYMENTS_ENABLED=false` e redeploye. Isso não substitui reconciliação de pagamentos já enviados.

## Segurança e limitações conhecidas

- O cookie guest é aleatório, HttpOnly, Secure em produção e SameSite=Lax; apenas o hash é persistido.
- Rotas de quote/pagamento validam origem, corpo, tamanho e rate limit durável. Webhook não recebe validação de origem.
- Tokens de cartão não são persistidos/logados. CPF é enviado ao provedor para pagamento, mas não é salvo nas tabelas locais.
- A aplicação não confia em total do Brick e nem aceita total no payload de pagamento.
- Status desconhecido fica não pago. Reembolso/chargeback exige revisão e não repõe estoque automaticamente.
- Não foi adicionado CSP por tentativa: o projeto não possuía política e o allowlist exato do Brick deve ser observado com credenciais de teste, sem `script-src *`. Foram adicionados HSTS, Referrer-Policy, `nosniff`, proteção contra framing e Permissions-Policy restritiva.
- Reservas em estado `SUBMITTING`/incerto não são liberadas às cegas, pois a cobrança pode ter ocorrido antes de a resposta ser persistida. Operação deve reconciliar usando a mesma idempotency key.
- O outbox impede duplicidade e expõe `claim_fulfillment_events`/`complete_fulfillment_event`, mas o projeto não possuía e-mail, fiscal, WhatsApp, analytics ou expedição. Esses efeitos secundários ainda precisam de um worker operacional que confirme cada evento usando o `claim_token` recebido.
- O valor fixo de frete é uma trava temporária. Integração dinâmica com Melhor Envio deve substituir essa configuração antes de usar fretes variáveis.

## Revisão jurídica e operacional do responsável pela loja

Antes de vendas reais, revise sem presumir conformidade automática: Política de Privacidade, Termos de Uso/Compra, troca/devolução/cancelamento, entrega, identificação/CNPJ, canais de suporte, retenção de dados, cookies/analytics e canal de direitos LGPD. A integração técnica não certifica PCI DSS, LGPD, regras fiscais ou consumeristas.

## Comandos de validação

```powershell
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run test:e2e
npm run build
npm audit --omit=dev
```

O teste real do Brick/Orders fica bloqueado até existirem aplicação Mercado Pago, credenciais de teste, webhook secret, catálogo autoritativo e Supabase migrado.
