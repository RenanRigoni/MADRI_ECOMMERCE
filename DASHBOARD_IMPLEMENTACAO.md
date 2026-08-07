# Plano: Dashboard interativo de vendas (`/admin/dashboard`)

Objetivo: substituir o painel vazio de hoje (`/admin` só redireciona pra `/admin/produtos`)
por um dashboard de verdade — visão mensal, filtros por status, métricas de vendas,
pronto pra facilitar análise de dados conforme a loja cresce.

## O que já existe (reaproveitar)

- `orders.status` (enum `payment_status`): `PENDING, PROCESSING, PAID, REJECTED,
  CANCELLED, REFUNDED, PARTIALLY_REFUNDED, EXPIRED, CHARGEBACK, FAILED, UNKNOWN`.
- `orders.fulfillment_status`: `NOT_READY, READY, FULFILLED, REVIEW_REQUIRED`.
- `payment_attempts.provider_status_detail`: valor bruto do Mercado Pago (ex.:
  `in_review`, `waiting_transfer`, `accredited`, `rejected_by_issuer` etc.) — hoje
  colapsado em `PROCESSING` no nosso enum. Pra distinguir "em análise" de
  "aguardando Pix" de verdade no dashboard, vale expor esse campo bruto também,
  não só o status local.
- `payment_attempts.payment_type_id`: `credit_card`, `debit_card`, `bank_transfer` (pix).
- `orders.created_at`, `orders.paid_at`, `orders.total_cents`, `orders.subtotal_cents`,
  `orders.shipping_cents`.
- `order_items` → pra métricas de produto mais vendido.
- Padrão de acesso: `requireAdminUser()` + `createSupabaseAdmin(readCommerceConfig())`,
  igual `/admin/produtos` e `/admin/pedidos`.

## Mapeamento pedido do usuário → dado real

| Pedido do usuário | Fonte |
|---|---|
| Visão mensal | `date_trunc('month', created_at)` agrupado |
| Vendas | soma de `total_cents` onde `status = 'PAID'` |
| Recusadas | `status = 'REJECTED'` |
| Canceladas | `status = 'CANCELLED'` |
| Concluídas | `status = 'PAID'` e `fulfillment_status = 'FULFILLED'` (pago **e** enviado) |
| Paga | `status = 'PAID'` |
| Em processamento | `status = 'PROCESSING'` |
| Em análise | `payment_attempts.provider_status_detail = 'in_review'` (sub-categoria de PROCESSING) |
| Chargeback | `status = 'CHARGEBACK'` |
| (bônus, já existe no enum) | `EXPIRED`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `UNKNOWN` — incluir todos no filtro |

## Arquitetura da agregação

Com o volume de pedidos ainda pequeno, **não** criar pipeline de BI/data warehouse —
seria over-engineering agora (YAGNI). Fazer agregação direto no Postgres via função
SQL (`security definer`, mesmo padrão das outras), retornando já os números prontos
pro frontend — evita puxar todo `orders`/`order_items` pra somar em JS.

### Nova função SQL: `admin_sales_summary(p_from date, p_to date)`

Retorna, agrupado por mês dentro do range:
- `month` (date truncado)
- `status`
- `order_count`
- `total_cents` (soma)

```sql
create or replace function public.admin_sales_summary(p_from date, p_to date)
returns table (month date, status public.payment_status, order_count bigint, total_cents bigint)
language sql security definer set search_path = ''
as $$
  select date_trunc('month', created_at)::date, status, count(*), coalesce(sum(total_cents), 0)
  from public.orders
  where created_at::date between p_from and p_to
  group by 1, 2
  order by 1;
$$;
```

Revoke de `public/anon/authenticated`, grant só pra `service_role` — mesmo padrão de
`start_payment_attempt` etc.

### Métricas adicionais (funções ou queries separadas, decidir na implementação)

- Forma de pagamento (Pix vs Cartão) por mês.
- Top produtos vendidos (join `order_items` + `products`, só pedidos `PAID`).
- Contagem de "em análise" via `payment_attempts.provider_status_detail`.

## `src/lib/admin/dashboard.ts` (novo)

Módulo de dados, mesmo padrão de `src/lib/admin/orders.ts`:
- `getSalesSummary(client, from, to)` → chama `admin_sales_summary`, retorna tipado.
- `getPaymentMethodBreakdown(client, from, to)`.
- `getTopProducts(client, from, to, limit)`.

## `src/app/admin/(dashboard)/dashboard/page.tsx` (novo)

- `requireAdminUser()` no topo.
- Filtros via GET form (mesmo padrão de `/admin/pedidos`): seletor de mês/ano ou range
  de datas, multi-select de status.
- Cards de resumo no topo: Total vendido (mês atual), nº pedidos pagos, ticket médio,
  taxa de recusa/cancelamento.
- Gráfico de vendas por mês (linha ou barra).
- Gráfico de distribuição por status (pizza ou barra horizontal).
- Gráfico Pix vs Cartão.
- Tabela/lista de top produtos.

**Importante:** antes de escrever qualquer gráfico, carregar a skill `dataviz`
(já disponível no ambiente) — ela define paleta, formas e regras de acessibilidade
pra gráfico, evita reinventar do zero. Não instalar biblioteca pesada de charts sem
necessidade — avaliar se dá pra fazer com SVG/CSS simples primeiro (poucos meses de
dado ainda), só migrar pra uma lib tipo Recharts se a complexidade justificar.

## Trocar landing do admin

Hoje `/admin/page.tsx` só faz `redirect('/admin/produtos')`. Trocar pra
`redirect('/admin/dashboard')` (ou renderizar o dashboard direto nessa rota) depois
que o dashboard existir — e adicionar "Dashboard" no menu (`layout.tsx`, ao lado de
"Produtos"/"Pedidos").

## Ordem de implementação sugerida

1. Migration com `admin_sales_summary` (+ funções auxiliares que forem necessárias).
2. `src/lib/admin/dashboard.ts`.
3. `src/app/admin/(dashboard)/dashboard/page.tsx` com filtros + cards (sem gráfico ainda,
   só números) — já entrega valor rápido.
4. Adicionar gráficos (carregar skill `dataviz` antes).
5. Link no menu + trocar redirect de `/admin`.
6. `npm run typecheck` + `npm test`.
