-- v2 of the admin orders RPCs (supersedes 20260807130000_admin_orders_rpc.sql):
-- adds server-side filtering/pagination to admin_list_orders, adds safe payment
-- detail + fulfillment_updated_at to admin_get_order, replaces the single
-- mark-fulfilled action with a validated forward-only fulfillment state machine,
-- and adds a cheap counters RPC for the list page header.
-- Same lockdown pattern as the rest of the payments schema: orders/order_items/
-- payment_attempts have direct table access revoked even from service_role, so
-- every access path is a security definer function.

drop function if exists public.admin_mark_order_fulfilled(bigint);
drop function if exists public.admin_get_order(bigint);
drop function if exists public.admin_list_orders(integer);

create or replace function public.admin_list_orders(
  p_payment_status text[] default null,
  p_method text default null,
  p_fulfillment_status text default null,
  p_search text default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id bigint, public_id uuid, external_reference text, status text, fulfillment_status text,
  subtotal_cents bigint, shipping_cents bigint, total_cents bigint, currency text,
  customer_name text, customer_email text, customer_phone text, shipping_address jsonb,
  created_at timestamptz, paid_at timestamptz, provider_order_id text,
  payment_method text, items jsonb, fulfillment_updated_at timestamptz, total_count bigint
)
language sql
security definer
set search_path = ''
stable
as $$
  with base as (
    select
      o.*,
      (
        select case when pa.payment_type_id = 'bank_transfer' then 'pix' else 'card' end
        from public.payment_attempts pa
        where pa.order_id = o.id
        order by pa.created_at desc
        limit 1
      ) as derived_payment_method
    from public.orders o
    where (p_payment_status is null or o.status::text = any(p_payment_status))
      and (p_fulfillment_status is null or o.fulfillment_status::text = p_fulfillment_status)
      and (p_date_from is null or o.created_at >= p_date_from)
      and (p_date_to is null or o.created_at < p_date_to)
      and (
        p_search is null or p_search = '' or
        o.customer_name ilike '%' || p_search || '%' or
        o.customer_email ilike '%' || p_search || '%' or
        o.customer_phone ilike '%' || p_search || '%' or
        o.public_id::text ilike '%' || p_search || '%' or
        o.external_reference ilike '%' || p_search || '%'
      )
  ),
  filtered as (
    select * from base
    where p_method is null or derived_payment_method = p_method
  )
  select
    f.id, f.public_id, f.external_reference, f.status::text, f.fulfillment_status::text,
    f.subtotal_cents, f.shipping_cents, f.total_cents, f.currency,
    f.customer_name, f.customer_email, f.customer_phone, f.shipping_address,
    f.created_at, f.paid_at, f.provider_order_id,
    f.derived_payment_method,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'productId', oi.product_id, 'productName', oi.product_name,
        'quantity', oi.quantity, 'unitPriceCents', oi.unit_price_cents, 'lineTotalCents', oi.line_total_cents
      ) order by oi.id)
      from public.order_items oi where oi.order_id = f.id
    ), '[]'::jsonb) as items,
    f.fulfillment_updated_at,
    count(*) over() as total_count
  from filtered f
  order by f.created_at desc
  limit p_limit offset p_offset;
$$;

revoke all on function public.admin_list_orders(text[], text, text, text, timestamptz, timestamptz, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_list_orders(text[], text, text, text, timestamptz, timestamptz, integer, integer) to service_role;

create or replace function public.admin_get_order(p_id bigint)
returns table (
  id bigint, public_id uuid, external_reference text, status text, fulfillment_status text,
  subtotal_cents bigint, shipping_cents bigint, total_cents bigint, currency text,
  customer_name text, customer_email text, customer_phone text, shipping_address jsonb,
  created_at timestamptz, paid_at timestamptz, provider_order_id text,
  payment_method text, items jsonb, fulfillment_updated_at timestamptz, payment jsonb
)
language sql
security definer
set search_path = ''
stable
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
    ), '[]'::jsonb) as items,
    o.fulfillment_updated_at,
    (
      select jsonb_build_object(
        'paymentTypeId', pa.payment_type_id,
        'installments', pa.installments,
        'providerStatus', pa.provider_status,
        'providerStatusDetail', pa.provider_status_detail,
        'providerOrderId', pa.provider_order_id,
        'providerPaymentId', pa.provider_payment_id,
        'amountCents', pa.amount_cents,
        'createdAt', pa.created_at,
        'completedAt', pa.completed_at
      )
      from public.payment_attempts pa
      where pa.order_id = o.id
      order by pa.created_at desc
      limit 1
    ) as payment
  from public.orders o
  where o.id = p_id;
$$;

revoke all on function public.admin_get_order(bigint) from public, anon, authenticated;
grant execute on function public.admin_get_order(bigint) to service_role;

-- Forward-only fulfillment state machine: READY -> SEPARATING -> PACKED -> FULFILLED -> DELIVERED.
-- Only reachable for orders whose payment_status is already PAID (Mercado Pago remains
-- authoritative for payment state; this function never touches orders.status).
create or replace function public.admin_update_order_fulfillment(
  p_id bigint,
  p_new_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_expected_current text;
begin
  if p_new_status not in ('SEPARATING', 'PACKED', 'FULFILLED', 'DELIVERED') then
    raise exception 'invalid_fulfillment_status';
  end if;

  select * into v_order from public.orders where id = p_id for update;
  if not found then return false; end if;
  if v_order.status <> 'PAID' then return false; end if;

  v_expected_current := case p_new_status
    when 'SEPARATING' then 'READY'
    when 'PACKED' then 'SEPARATING'
    when 'FULFILLED' then 'PACKED'
    when 'DELIVERED' then 'FULFILLED'
  end;

  if v_order.fulfillment_status::text <> v_expected_current then
    return false;
  end if;

  update public.orders
  set fulfillment_status = p_new_status::public.fulfillment_status,
      fulfillment_updated_at = now(),
      updated_at = now()
  where id = p_id;

  return true;
end;
$$;

revoke all on function public.admin_update_order_fulfillment(bigint, text) from public, anon, authenticated;
grant execute on function public.admin_update_order_fulfillment(bigint, text) to service_role;

create or replace function public.admin_order_counters()
returns table (orders_today bigint, awaiting_payment bigint, paid_to_process bigint)
language sql
security definer
set search_path = ''
stable
as $$
  select
    (select count(*) from public.orders where created_at >= date_trunc('day', now())),
    (select count(*) from public.orders where status in ('PENDING', 'PROCESSING')),
    (select count(*) from public.orders where status = 'PAID' and fulfillment_status = 'READY');
$$;

revoke all on function public.admin_order_counters() from public, anon, authenticated;
grant execute on function public.admin_order_counters() to service_role;
