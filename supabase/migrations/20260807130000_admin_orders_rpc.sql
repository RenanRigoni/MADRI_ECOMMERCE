-- orders/order_items/payment_attempts have direct table access revoked even from
-- service_role (see 20260805110000_commerce_payments.sql) — all access must go through
-- security definer RPCs, same pattern as the rest of the payments schema. The admin
-- orders page (src/lib/admin/orders.ts) was using direct .from('orders').select(...)
-- and .update(...), which returns 403. These RPCs fix that.

create or replace function public.admin_list_orders(p_limit integer default 200)
returns table (
  id bigint, public_id uuid, external_reference text, status text, fulfillment_status text,
  subtotal_cents bigint, shipping_cents bigint, total_cents bigint, currency text,
  customer_name text, customer_email text, customer_phone text, shipping_address jsonb,
  created_at timestamptz, paid_at timestamptz, provider_order_id text,
  payment_method text, items jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    o.id, o.public_id, o.external_reference, o.status::text, o.fulfillment_status::text,
    o.subtotal_cents, o.shipping_cents, o.total_cents, o.currency,
    o.customer_name, o.customer_email, o.customer_phone, o.shipping_address,
    o.created_at, o.paid_at, o.provider_order_id,
    (
      select case when pa.payment_type_id = 'bank_transfer' then 'pix' else 'card' end
      from public.payment_attempts pa
      where pa.order_id = o.id
      order by pa.created_at desc
      limit 1
    ) as payment_method,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'productId', oi.product_id, 'productName', oi.product_name,
        'quantity', oi.quantity, 'unitPriceCents', oi.unit_price_cents, 'lineTotalCents', oi.line_total_cents
      ) order by oi.id)
      from public.order_items oi where oi.order_id = o.id
    ), '[]'::jsonb) as items
  from public.orders o
  order by o.created_at desc
  limit p_limit;
$$;

revoke all on function public.admin_list_orders(integer) from public, anon, authenticated;
grant execute on function public.admin_list_orders(integer) to service_role;

create or replace function public.admin_get_order(p_id bigint)
returns table (
  id bigint, public_id uuid, external_reference text, status text, fulfillment_status text,
  subtotal_cents bigint, shipping_cents bigint, total_cents bigint, currency text,
  customer_name text, customer_email text, customer_phone text, shipping_address jsonb,
  created_at timestamptz, paid_at timestamptz, provider_order_id text,
  payment_method text, items jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    o.id, o.public_id, o.external_reference, o.status::text, o.fulfillment_status::text,
    o.subtotal_cents, o.shipping_cents, o.total_cents, o.currency,
    o.customer_name, o.customer_email, o.customer_phone, o.shipping_address,
    o.created_at, o.paid_at, o.provider_order_id,
    (
      select case when pa.payment_type_id = 'bank_transfer' then 'pix' else 'card' end
      from public.payment_attempts pa
      where pa.order_id = o.id
      order by pa.created_at desc
      limit 1
    ) as payment_method,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'productId', oi.product_id, 'productName', oi.product_name,
        'quantity', oi.quantity, 'unitPriceCents', oi.unit_price_cents, 'lineTotalCents', oi.line_total_cents
      ) order by oi.id)
      from public.order_items oi where oi.order_id = o.id
    ), '[]'::jsonb) as items
  from public.orders o
  where o.id = p_id;
$$;

revoke all on function public.admin_get_order(bigint) from public, anon, authenticated;
grant execute on function public.admin_get_order(bigint) to service_role;

create or replace function public.admin_mark_order_fulfilled(p_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.orders
  set fulfillment_status = 'FULFILLED', updated_at = now()
  where id = p_id and fulfillment_status = 'READY';
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.admin_mark_order_fulfilled(bigint) from public, anon, authenticated;
grant execute on function public.admin_mark_order_fulfilled(bigint) to service_role;
