# Plano: tela de pedidos no admin (`/admin/pedidos`)

Contexto: hoje o admin (`/admin/produtos`) só gerencia produtos. Não existe nenhuma
tela pra ver pedidos recebidos — a única forma de checar o que foi vendido é consulta
SQL manual. Como a loja precisa enviar os perfumes fisicamente, precisa de uma tela
pra ver pedido pago, dados do cliente e endereço de entrega.

## Já feito

- `src/lib/admin/orders.ts` **já criado** — módulo de dados completo:
  - `AdminOrderRow` (tipo com tudo: status, endereço, itens, forma de pagamento)
  - `listAdminOrders(client, limit=200)` — lista pedidos mais recentes primeiro, com
    itens (`order_items`) e forma de pagamento (deduzida do `payment_attempts` mais
    recente: `bank_transfer` → `'pix'`, resto → `'card'`) via embedding do Supabase.
  - `setAdminOrderFulfilled(client, id)` — marca `fulfillment_status = 'FULFILLED'`,
    só se estava `'READY'` (evita marcar como enviado pedido que não tá pronto).
  - `AdminOrderError` (`not_found` | `persistence_failure`), mesmo padrão de
    `src/lib/admin/products.ts`.

## Falta fazer

### 1. `src/app/admin/(dashboard)/pedidos/actions.ts`

Server action, mesmo padrão de `src/app/admin/(dashboard)/produtos/actions.ts`:

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { setAdminOrderFulfilled } from '@/lib/admin/orders'

export async function markOrderFulfilled(id: number): Promise<void> {
  await requireAdminUser()
  const supabase = createSupabaseAdmin(readCommerceConfig())
  await setAdminOrderFulfilled(supabase, id)
  revalidatePath('/admin/pedidos')
}
```

### 2. `src/app/admin/(dashboard)/pedidos/page.tsx`

Server component, seguir **exatamente** o padrão de
`src/app/admin/(dashboard)/produtos/page.tsx` (já lido nesta sessão, é a referência de
estilo/estrutura): `requireAdminUser()` no topo, `createSupabaseAdmin(readCommerceConfig())`,
filtro via GET form com `key` no form pra resetar campos (bug já resolvido nos produtos,
não repetir), paleta de cores igual (`#0A0A0A`, `#E8E0D4`, `#6B7280`, `#FAF6F0`,
`#D7CFC0`, `#B5363A` erro, `#2D6A4F` sucesso).

**Conteúdo de cada linha de pedido:**
- ID curto (`publicId.slice(0, 8)`) + badge de status (`PAID` verde, `PROCESSING`
  amarelo/neutro, `EXPIRED`/`REJECTED`/`CANCELLED`/`FAILED` vermelho, `REVIEW_REQUIRED`
  destaque forte — esse é o caso "pago mas com problema de estoque", precisa de atenção
  manual).
- Nome, e-mail, telefone do cliente.
- **Endereço completo de entrega** (`address.street`, `number`, `complement`,
  `neighborhood`, `city`, `state`, `postalCode`) — é o motivo principal dessa tela existir.
- Lista de itens (`quantity`× `productName` — `unitPriceCents`).
- Total (`totalCents`), frete (`shippingCents`).
- Forma de pagamento: badge "Pix" ou "Cartão" (`paymentMethod`).
- Data do pedido (`createdAt`) e data de pagamento (`paidAt`, se houver).
- **Botão "Marcar como enviado"** — só aparece quando `status === 'PAID'` e
  `fulfillmentStatus === 'READY'`. Usa `<form action={markOrderFulfilled.bind(null, order.id)}>`
  igual ao padrão de toggle em produtos.

**Filtro sugerido** (reaproveitar padrão de `applyFilters`/`applySort` de produtos):
- Por status: Todos / Pago (`PAID`) / Processando (`PROCESSING`) / Precisa atenção
  (`REVIEW_REQUIRED`) / Cancelado ou expirado.
- Busca por nome/e-mail do cliente.
- Padrão: mostrar `PAID` primeiro (é o que precisa ser enviado).

### 2.1. Botão "Imprimir Etiqueta"

Em cada pedido (pelo menos os `PAID`), botão/link "Imprimir Etiqueta" que abre uma
página de impressão com os dados de envio: nome do cliente, endereço completo
(rua, número, complemento, bairro, cidade, estado, CEP), telefone, e talvez o
número curto do pedido como referência.

Sugestão de implementação: rota separada `src/app/admin/(dashboard)/pedidos/[id]/etiqueta/page.tsx`,
layout simples (texto grande, sem header/menu do admin — só o conteúdo da etiqueta),
usando `@media print` no CSS pra esconder qualquer botão na hora de imprimir e o
usuário aciona "Imprimir" do próprio navegador (`Ctrl+P` / `window.print()`).

**Tamanho em cm**: o usuário (Renan) vai definir depois — deixar isso configurável
via CSS (`@page { size: ... }` ou classe com largura/altura em `cm`) fácil de ajustar
quando ele passar a medida exata. Não travar em um tamanho específico agora.

**Nota importante:** essa etiqueta caseira é um tapa-buraco (recibo simples com
nome/endereço, sem rastreio). Quando integrar frete de verdade (Mercado Envio ou
Melhor Envio — já tem `MELHOR_ENVIO_TOKEN` vazio no `.env.local`, sinal de que já era
plano), essas plataformas geram etiqueta oficial com código de rastreio e integração
com transportadora (Correios etc), muito melhor que essa. Não investir tempo demais
nessa versão caseira — construir simples, ciente que provavelmente vira dispensável
assim que o frete de verdade entrar.

### 3. Link no menu

Adicionar link "Pedidos" no header do admin, em
`src/app/admin/(dashboard)/layout.tsx:9` (hoje só tem "Painel MADRI" apontando pra
produtos) — adicionar nav com "Produtos" e "Pedidos".

### 4. Rodar `npm run typecheck` e `npm test` antes de commitar (padrão do projeto).

## Referências úteis já levantadas nesta sessão

- Schema de `orders`: `id, public_id, external_reference, status, fulfillment_status,
  subtotal_cents, shipping_cents, total_cents, currency, customer_name, customer_email,
  customer_phone, shipping_address (jsonb), created_at, paid_at, provider_order_id,
  expires_at, inventory_applied_at, reservation_released_at`.
- Enums: `status` (`payment_status`) = `PENDING, PROCESSING, PAID, REJECTED, CANCELLED,
  REFUNDED, PARTIALLY_REFUNDED, EXPIRED, CHARGEBACK, FAILED, UNKNOWN`.
  `fulfillment_status` = `NOT_READY, READY, FULFILLED, REVIEW_REQUIRED`.
- `order_items`: `id, order_id, product_id, product_name, quantity, unit_price_cents,
  line_total_cents`.
- `payment_attempts.payment_type_id`: `credit_card`, `debit_card`, `bank_transfer` (pix).
