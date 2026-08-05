create extension if not exists pgcrypto;

create type public.payment_status as enum (
  'PENDING',
  'PROCESSING',
  'PAID',
  'REJECTED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'EXPIRED',
  'CHARGEBACK',
  'FAILED',
  'UNKNOWN'
);

create type public.payment_request_state as enum (
  'PENDING',
  'SUBMITTING',
  'RETRYABLE',
  'COMPLETED'
);

create type public.inventory_reservation_status as enum (
  'RESERVED',
  'CONSUMED',
  'RELEASED'
);

create type public.fulfillment_status as enum (
  'NOT_READY',
  'READY',
  'FULFILLED',
  'REVIEW_REQUIRED'
);

create table public.products (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{1,160}$'),
  name text not null check (char_length(name) between 1 and 240),
  price_cents bigint check (price_cents > 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  active boolean not null default false,
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  stock_reserved integer not null default 0 check (
    stock_reserved >= 0 and stock_reserved <= stock_on_hand
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not active or price_cents is not null)
);

create table public.orders (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  external_reference text not null default ('ord_' || encode(gen_random_bytes(16), 'hex')) unique,
  guest_session_hash text not null check (guest_session_hash ~ '^[a-f0-9]{64}$'),
  status public.payment_status not null default 'PENDING',
  fulfillment_status public.fulfillment_status not null default 'NOT_READY',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  subtotal_cents bigint not null check (subtotal_cents >= 0),
  shipping_cents bigint not null default 0 check (shipping_cents >= 0),
  total_cents bigint not null check (total_cents > 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  provider text not null default 'mercado_pago' check (provider = 'mercado_pago'),
  provider_order_id text unique,
  paid_at timestamptz,
  inventory_applied_at timestamptz,
  reservation_released_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete restrict,
  product_id text not null references public.products(id) on delete restrict,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 10),
  unit_price_cents bigint not null check (unit_price_cents > 0),
  line_total_cents bigint generated always as (unit_price_cents * quantity) stored,
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id bigint not null references public.orders(id) on delete restrict,
  client_attempt_id uuid not null,
  idempotency_key uuid not null default gen_random_uuid() unique,
  request_fingerprint text not null check (request_fingerprint ~ '^[a-f0-9]{64}$'),
  request_state public.payment_request_state not null default 'PENDING',
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  payment_method_id text not null,
  payment_type_id text not null check (payment_type_id in ('credit_card', 'debit_card')),
  installments integer not null check (installments between 1 and 24),
  status public.payment_status not null default 'PENDING',
  provider_order_id text unique,
  provider_payment_id text unique,
  provider_status text,
  provider_status_detail text,
  provider_error_code text,
  processing_started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, client_attempt_id)
);

create table public.inventory_reservations (
  id bigint generated always as identity primary key,
  payment_attempt_id uuid not null references public.payment_attempts(id) on delete restrict,
  order_item_id bigint not null references public.order_items(id) on delete restrict,
  product_id text not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status public.inventory_reservation_status not null default 'RESERVED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payment_attempt_id, order_item_id)
);

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete restrict,
  order_item_id bigint not null references public.order_items(id) on delete restrict,
  product_id text not null references public.products(id) on delete restrict,
  movement_type text not null check (movement_type in ('SALE', 'RELEASE')),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (order_item_id, movement_type)
);

create table public.webhook_receipts (
  id bigint generated always as identity primary key,
  provider text not null default 'mercado_pago' check (provider = 'mercado_pago'),
  request_id text not null unique,
  provider_order_id text not null,
  provider_status text,
  provider_status_detail text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.fulfillment_outbox (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete restrict,
  event_type text not null check (event_type in ('ORDER_PAID', 'PAYMENT_REVIEW')),
  dedupe_key text not null default 'default' check (char_length(dedupe_key) between 1 and 120),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  claim_token uuid,
  processed_at timestamptz,
  unique (order_id, event_type, dedupe_key)
);

create table public.api_rate_limits (
  key_hash text not null,
  bucket_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (key_hash, bucket_started_at)
);

create index orders_guest_created_idx on public.orders (guest_session_hash, created_at desc);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_processing_expiry_idx on public.orders (expires_at)
  where status = 'PROCESSING' and inventory_applied_at is null and reservation_released_at is null;
create index orders_pending_cleanup_idx on public.orders (created_at)
  where status = 'PENDING';
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index payment_attempts_order_idx on public.payment_attempts (order_id, created_at desc);
create index payment_attempts_retry_idx on public.payment_attempts (request_state, processing_started_at)
  where request_state in ('SUBMITTING', 'RETRYABLE');
create index reservations_product_status_idx on public.inventory_reservations (product_id, status);
create index reservations_order_item_idx on public.inventory_reservations (order_item_id);
create index movements_order_idx on public.inventory_movements (order_id);
create index movements_product_idx on public.inventory_movements (product_id);
create index webhook_provider_order_idx on public.webhook_receipts (provider_order_id, received_at desc);
create index outbox_unprocessed_idx on public.fulfillment_outbox (created_at)
  where processed_at is null;
create index rate_limits_expiry_idx on public.api_rate_limits (bucket_started_at);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.webhook_receipts enable row level security;
alter table public.fulfillment_outbox enable row level security;
alter table public.api_rate_limits enable row level security;

revoke all on table public.products from public, anon, authenticated, service_role;
revoke all on table public.orders from public, anon, authenticated, service_role;
revoke all on table public.order_items from public, anon, authenticated, service_role;
revoke all on table public.payment_attempts from public, anon, authenticated, service_role;
revoke all on table public.inventory_reservations from public, anon, authenticated, service_role;
revoke all on table public.inventory_movements from public, anon, authenticated, service_role;
revoke all on table public.webhook_receipts from public, anon, authenticated, service_role;
revoke all on table public.fulfillment_outbox from public, anon, authenticated, service_role;
revoke all on table public.api_rate_limits from public, anon, authenticated, service_role;

revoke all on sequence public.orders_id_seq from public, anon, authenticated, service_role;
revoke all on sequence public.order_items_id_seq from public, anon, authenticated, service_role;
revoke all on sequence public.inventory_reservations_id_seq from public, anon, authenticated, service_role;
revoke all on sequence public.inventory_movements_id_seq from public, anon, authenticated, service_role;
revoke all on sequence public.webhook_receipts_id_seq from public, anon, authenticated, service_role;
revoke all on sequence public.fulfillment_outbox_id_seq from public, anon, authenticated, service_role;

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bucket timestamptz;
  v_count integer;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit_input';
  end if;

  v_bucket := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits (key_hash, bucket_started_at, request_count)
  values (p_key_hash, v_bucket, 1)
  on conflict (key_hash, bucket_started_at)
  do update set request_count = public.api_rate_limits.request_count + 1
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

create or replace function public.create_checkout_quote(
  p_guest_session_hash text,
  p_items jsonb,
  p_customer jsonb,
  p_shipping_cents bigint
)
returns table (
  public_order_id uuid,
  external_reference text,
  items jsonb,
  subtotal_cents bigint,
  shipping_cents bigint,
  total_cents bigint,
  currency text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id bigint;
  v_public_id uuid;
  v_external_reference text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id text;
  v_quantity integer;
  v_subtotal bigint := 0;
  v_expires_at timestamptz;
begin
  if p_guest_session_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_session';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'invalid_cart';
  end if;
  if jsonb_typeof(p_customer) <> 'object' then
    raise exception 'invalid_customer';
  end if;
  if p_shipping_cents is null or p_shipping_cents < 0 then
    raise exception 'invalid_shipping';
  end if;

  insert into public.orders (
    guest_session_hash,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    subtotal_cents,
    shipping_cents,
    total_cents
  ) values (
    p_guest_session_hash,
    p_customer ->> 'name',
    lower(p_customer ->> 'email'),
    p_customer ->> 'phone',
    p_customer -> 'address',
    0,
    0,
    1
  )
  returning id, public_id, orders.external_reference, orders.expires_at
  into v_order_id, v_public_id, v_external_reference, v_expires_at;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := v_item ->> 'productId';
    begin
      v_quantity := (v_item ->> 'quantity')::integer;
    exception when others then
      raise exception 'invalid_quantity';
    end;

    if v_quantity not between 1 and 10 then
      raise exception 'invalid_quantity';
    end if;

    select * into v_product
    from public.products
    where id = v_product_id
    for share;

    if not found then raise exception 'unknown_product'; end if;
    if not v_product.active or v_product.price_cents is null then
      raise exception 'product_not_priced';
    end if;
    if v_product.stock_on_hand - v_product.stock_reserved < v_quantity then
      raise exception 'out_of_stock';
    end if;

    insert into public.order_items (
      order_id, product_id, product_name, quantity, unit_price_cents
    ) values (
      v_order_id, v_product.id, v_product.name, v_quantity, v_product.price_cents
    );
    v_subtotal := v_subtotal + (v_product.price_cents * v_quantity);
  end loop;

  update public.orders
  set subtotal_cents = v_subtotal,
      shipping_cents = p_shipping_cents,
      total_cents = v_subtotal + p_shipping_cents,
      updated_at = now()
  where id = v_order_id;

  return query
  select
    v_public_id,
    v_external_reference,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'productId', oi.product_id,
          'name', oi.product_name,
          'quantity', oi.quantity,
          'unitPriceCents', oi.unit_price_cents,
          'lineTotalCents', oi.line_total_cents
        ) order by oi.id
      ),
      '[]'::jsonb
    ),
    v_subtotal,
    p_shipping_cents,
    v_subtotal + p_shipping_cents,
    'BRL'::text,
    v_expires_at
  from public.order_items oi
  where oi.order_id = v_order_id;
exception
  when unique_violation then
    raise exception 'duplicate_product';
end;
$$;

create or replace function public.start_payment_attempt(
  p_public_order_id uuid,
  p_guest_session_hash text,
  p_client_attempt_id uuid,
  p_request_fingerprint text,
  p_payment_method_id text,
  p_payment_type_id text,
  p_installments integer
)
returns table (
  payment_attempt_id uuid,
  idempotency_key uuid,
  external_reference text,
  total_cents bigint,
  currency text,
  payer_email text,
  provider_order_id text,
  status public.payment_status,
  request_state public.payment_request_state,
  is_new boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
  v_item record;
begin
  select * into v_order
  from public.orders
  where public_id = p_public_order_id
    and guest_session_hash = p_guest_session_hash
  for update;

  if not found then raise exception 'order_not_found'; end if;

  select * into v_attempt
  from public.payment_attempts
  where order_id = v_order.id and client_attempt_id = p_client_attempt_id
  for update;

  if found then
    if v_attempt.request_fingerprint <> p_request_fingerprint then
      raise exception 'attempt_conflict';
    end if;
    return query select
      v_attempt.id,
      v_attempt.idempotency_key,
      v_order.external_reference,
      v_attempt.amount_cents,
      v_attempt.currency,
      v_order.customer_email,
      v_attempt.provider_order_id,
      v_attempt.status,
      v_attempt.request_state,
      false;
    return;
  end if;

  if v_order.expires_at <= now() then raise exception 'quote_expired'; end if;
  if v_order.status not in ('PENDING', 'PROCESSING') then raise exception 'order_not_payable'; end if;
  if exists (
    select 1 from public.payment_attempts
    where order_id = v_order.id and client_attempt_id <> p_client_attempt_id
  ) then
    raise exception 'payment_in_progress';
  end if;
  if p_request_fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'invalid_fingerprint'; end if;
  if p_payment_type_id not in ('credit_card', 'debit_card') then raise exception 'invalid_payment_type'; end if;
  if p_installments not between 1 and 24 then raise exception 'invalid_installments'; end if;

  for v_item in
    select oi.id as order_item_id, oi.product_id, oi.quantity, oi.unit_price_cents,
           p.price_cents, p.currency, p.active, p.stock_on_hand, p.stock_reserved
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = v_order.id
    order by p.id
    for update of p
  loop
    if not v_item.active or v_item.price_cents is null or v_item.price_cents <> v_item.unit_price_cents then
      raise exception 'quote_changed';
    end if;
    if v_item.currency <> v_order.currency then raise exception 'currency_mismatch'; end if;
    if v_item.stock_on_hand - v_item.stock_reserved < v_item.quantity then
      raise exception 'out_of_stock';
    end if;
  end loop;

  insert into public.payment_attempts (
    order_id,
    client_attempt_id,
    request_fingerprint,
    amount_cents,
    currency,
    payment_method_id,
    payment_type_id,
    installments
  ) values (
    v_order.id,
    p_client_attempt_id,
    p_request_fingerprint,
    v_order.total_cents,
    v_order.currency,
    p_payment_method_id,
    p_payment_type_id,
    p_installments
  ) returning * into v_attempt;

  for v_item in
    select id, product_id, quantity
    from public.order_items
    where order_id = v_order.id
    order by product_id
  loop
    update public.products
    set stock_reserved = stock_reserved + v_item.quantity,
        updated_at = now()
    where id = v_item.product_id;

    insert into public.inventory_reservations (
      payment_attempt_id, order_item_id, product_id, quantity
    ) values (
      v_attempt.id, v_item.id, v_item.product_id, v_item.quantity
    );
  end loop;

  update public.orders set status = 'PROCESSING', updated_at = now() where id = v_order.id;

  return query select
    v_attempt.id,
    v_attempt.idempotency_key,
    v_order.external_reference,
    v_attempt.amount_cents,
    v_attempt.currency,
    v_order.customer_email,
    v_attempt.provider_order_id,
    v_attempt.status,
    v_attempt.request_state,
    true;
end;
$$;

create or replace function public.claim_payment_attempt(
  p_payment_attempt_id uuid,
  p_guest_session_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed uuid;
begin
  update public.payment_attempts pa
  set request_state = 'SUBMITTING',
      processing_started_at = now(),
      updated_at = now()
  from public.orders o
  where pa.id = p_payment_attempt_id
    and o.id = pa.order_id
    and o.guest_session_hash = p_guest_session_hash
    and pa.provider_order_id is null
    and o.status = 'PROCESSING'
    and o.inventory_applied_at is null
    and o.reservation_released_at is null
    and (
      pa.request_state in ('PENDING', 'RETRYABLE')
      or (pa.request_state = 'SUBMITTING' and pa.processing_started_at < now() - interval '20 seconds')
    )
  returning pa.id into v_claimed;

  return v_claimed is not null;
end;
$$;

create or replace function public.mark_payment_attempt_retryable(
  p_payment_attempt_id uuid,
  p_provider_error_code text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payment_attempts
  set request_state = 'RETRYABLE',
      provider_error_code = left(p_provider_error_code, 80),
      updated_at = now()
  where id = p_payment_attempt_id
    and provider_order_id is null
    and request_state = 'SUBMITTING';
$$;

create or replace function public.fail_payment_attempt(
  p_payment_attempt_id uuid,
  p_provider_error_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.payment_attempts%rowtype;
  v_order public.orders%rowtype;
  v_order_id bigint;
  v_reservation record;
begin
  select order_id into v_order_id
  from public.payment_attempts
  where id = p_payment_attempt_id;

  if not found then return; end if;

  select * into v_order from public.orders where id = v_order_id for update;
  select * into v_attempt
  from public.payment_attempts
  where id = p_payment_attempt_id and order_id = v_order.id
  for update;

  if not found or v_attempt.provider_order_id is not null or v_attempt.request_state <> 'SUBMITTING' then return; end if;
  if v_order.inventory_applied_at is not null then return; end if;

  for v_reservation in
    select * from public.inventory_reservations
    where payment_attempt_id = v_attempt.id and status = 'RESERVED'
    order by product_id
    for update
  loop
    update public.products
    set stock_reserved = stock_reserved - v_reservation.quantity,
        updated_at = now()
    where id = v_reservation.product_id
      and stock_reserved >= v_reservation.quantity;
    if not found then raise exception 'inventory_invariant_failed'; end if;

    update public.inventory_reservations
    set status = 'RELEASED', updated_at = now()
    where id = v_reservation.id;

    insert into public.inventory_movements (
      order_id, order_item_id, product_id, movement_type, quantity
    ) values (
      v_order.id, v_reservation.order_item_id, v_reservation.product_id, 'RELEASE', v_reservation.quantity
    ) on conflict (order_item_id, movement_type) do nothing;
  end loop;

  update public.payment_attempts
  set status = 'FAILED',
      request_state = 'COMPLETED',
      provider_error_code = left(p_provider_error_code, 80),
      completed_at = now(),
      updated_at = now()
  where id = v_attempt.id;

  update public.orders
  set status = 'FAILED', reservation_released_at = coalesce(reservation_released_at, now()), updated_at = now()
  where id = v_order.id;
end;
$$;

create or replace function public.apply_mercado_pago_order(
  p_provider_order_id text,
  p_provider_payment_id text,
  p_external_reference text,
  p_total_cents bigint,
  p_payment_amount_cents bigint,
  p_currency text,
  p_local_status public.payment_status,
  p_provider_status text,
  p_provider_status_detail text
)
returns table (
  public_order_id uuid,
  status public.payment_status,
  fulfillment_status public.fulfillment_status,
  transitioned_to_paid boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
  v_effective_status public.payment_status;
  v_transitioned_to_paid boolean := false;
  v_payment_needs_review boolean := false;
  v_expected_count integer;
  v_expected_quantity bigint;
  v_reserved_count integer;
  v_reserved_quantity bigint;
  v_reservation record;
begin
  select * into v_order
  from public.orders
  where external_reference = p_external_reference
  for update;

  if not found then raise exception 'order_not_found'; end if;

  select * into v_attempt
  from public.payment_attempts
  where order_id = v_order.id
  order by created_at desc
  limit 1
  for update;

  if not found then raise exception 'attempt_not_found'; end if;
  if v_order.total_cents <> p_total_cents or v_attempt.amount_cents <> p_total_cents then
    raise exception 'amount_mismatch';
  end if;
  if p_payment_amount_cents is not null and p_payment_amount_cents <> p_total_cents then
    raise exception 'payment_amount_mismatch';
  end if;
  if p_currency <> 'BRL' or v_order.currency <> p_currency then raise exception 'currency_mismatch'; end if;
  if v_attempt.provider_order_id is not null and v_attempt.provider_order_id <> p_provider_order_id then
    raise exception 'provider_order_mismatch';
  end if;
  if v_attempt.provider_payment_id is not null
     and p_provider_payment_id is not null
     and v_attempt.provider_payment_id <> p_provider_payment_id then
    raise exception 'provider_payment_mismatch';
  end if;
  if p_local_status = 'PAID' and not (
    p_provider_status = 'processed' and p_provider_status_detail = 'accredited'
  ) then
    raise exception 'invalid_paid_transition';
  end if;

  v_effective_status := p_local_status;
  if v_order.status = 'CHARGEBACK' then
    v_effective_status := v_order.status;
  elsif v_order.status = 'REFUNDED' and p_local_status <> 'CHARGEBACK' then
    v_effective_status := v_order.status;
  elsif v_order.status = 'PARTIALLY_REFUNDED'
        and p_local_status not in ('REFUNDED', 'CHARGEBACK') then
    v_effective_status := v_order.status;
  elsif v_order.status = 'PAID'
        and p_local_status not in ('PARTIALLY_REFUNDED', 'REFUNDED', 'CHARGEBACK') then
    v_effective_status := v_order.status;
  elsif v_order.status in ('REJECTED', 'CANCELLED', 'EXPIRED', 'FAILED')
        and p_local_status not in ('PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'CHARGEBACK') then
    v_effective_status := v_order.status;
  elsif v_order.status = 'PROCESSING' and p_local_status = 'PENDING' then
    v_effective_status := v_order.status;
  end if;

  if v_effective_status = 'PAID' and v_order.inventory_applied_at is null then
    select count(*), coalesce(sum(quantity), 0)
    into v_expected_count, v_expected_quantity
    from public.order_items where order_id = v_order.id;

    select count(*), coalesce(sum(quantity), 0)
    into v_reserved_count, v_reserved_quantity
    from public.inventory_reservations
    where payment_attempt_id = v_attempt.id and status = 'RESERVED';

    v_transitioned_to_paid :=
      v_expected_count > 0
      and v_reserved_count = v_expected_count
      and v_reserved_quantity = v_expected_quantity;
    v_payment_needs_review := not v_transitioned_to_paid;
  end if;

  update public.payment_attempts
  set provider_order_id = p_provider_order_id,
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      provider_status = left(p_provider_status, 80),
      provider_status_detail = left(p_provider_status_detail, 120),
      status = v_effective_status,
      request_state = 'COMPLETED',
      completed_at = now(),
      updated_at = now()
  where id = v_attempt.id;

  update public.orders
  set provider_order_id = p_provider_order_id,
      status = v_effective_status,
      paid_at = case when v_effective_status = 'PAID' then coalesce(paid_at, now()) else paid_at end,
      fulfillment_status = case
        when v_payment_needs_review
          or v_effective_status in ('PARTIALLY_REFUNDED', 'REFUNDED', 'CHARGEBACK') then 'REVIEW_REQUIRED'
        else fulfillment_status
      end,
      updated_at = now()
  where id = v_order.id;

  if v_effective_status in ('PARTIALLY_REFUNDED', 'REFUNDED', 'CHARGEBACK') then
    insert into public.fulfillment_outbox (order_id, event_type, dedupe_key, payload)
    values (
      v_order.id,
      'PAYMENT_REVIEW',
      lower(v_effective_status::text),
      jsonb_build_object('publicOrderId', v_order.public_id, 'reason', lower(v_effective_status::text))
    ) on conflict (order_id, event_type, dedupe_key) do nothing;
  end if;

  if v_transitioned_to_paid then
    for v_reservation in
      select * from public.inventory_reservations
      where payment_attempt_id = v_attempt.id and status = 'RESERVED'
      order by product_id
      for update
    loop
      update public.products
      set stock_on_hand = stock_on_hand - v_reservation.quantity,
          stock_reserved = stock_reserved - v_reservation.quantity,
          updated_at = now()
      where id = v_reservation.product_id
        and stock_on_hand >= v_reservation.quantity
        and stock_reserved >= v_reservation.quantity;
      if not found then raise exception 'inventory_invariant_failed'; end if;

      update public.inventory_reservations
      set status = 'CONSUMED', updated_at = now()
      where id = v_reservation.id;

      insert into public.inventory_movements (
        order_id, order_item_id, product_id, movement_type, quantity
      ) values (
        v_order.id, v_reservation.order_item_id, v_reservation.product_id, 'SALE', v_reservation.quantity
      ) on conflict (order_item_id, movement_type) do nothing;
    end loop;

    update public.orders
    set inventory_applied_at = now(), fulfillment_status = 'READY', updated_at = now()
    where id = v_order.id;

    insert into public.fulfillment_outbox (order_id, event_type, dedupe_key, payload)
    values (v_order.id, 'ORDER_PAID', 'paid', jsonb_build_object('publicOrderId', v_order.public_id))
    on conflict (order_id, event_type, dedupe_key) do nothing;
  elsif v_payment_needs_review then
    insert into public.fulfillment_outbox (order_id, event_type, dedupe_key, payload)
    values (
      v_order.id,
      'PAYMENT_REVIEW',
      'paid_without_reserved_inventory',
      jsonb_build_object('publicOrderId', v_order.public_id, 'reason', 'paid_without_reserved_inventory')
    ) on conflict (order_id, event_type, dedupe_key) do nothing;
  elsif v_effective_status in ('REJECTED', 'CANCELLED', 'REFUNDED', 'CHARGEBACK', 'EXPIRED', 'FAILED')
        and v_order.inventory_applied_at is null
        and v_order.reservation_released_at is null then
    for v_reservation in
      select * from public.inventory_reservations
      where payment_attempt_id = v_attempt.id and status = 'RESERVED'
      order by product_id
      for update
    loop
      update public.products
      set stock_reserved = stock_reserved - v_reservation.quantity,
          updated_at = now()
      where id = v_reservation.product_id
        and stock_reserved >= v_reservation.quantity;
      if not found then raise exception 'inventory_invariant_failed'; end if;

      update public.inventory_reservations
      set status = 'RELEASED', updated_at = now()
      where id = v_reservation.id;

      insert into public.inventory_movements (
        order_id, order_item_id, product_id, movement_type, quantity
      ) values (
        v_order.id, v_reservation.order_item_id, v_reservation.product_id, 'RELEASE', v_reservation.quantity
      ) on conflict (order_item_id, movement_type) do nothing;
    end loop;

    update public.orders set reservation_released_at = now(), updated_at = now() where id = v_order.id;
  end if;

  select * into v_order from public.orders where id = v_order.id;
  return query select v_order.public_id, v_order.status, v_order.fulfillment_status, v_transitioned_to_paid;
end;
$$;

create or replace function public.apply_mercado_pago_chargeback(
  p_chargeback_id text,
  p_provider_payment_ids text[],
  p_amount_cents bigint,
  p_currency text,
  p_provider_status_detail text
)
returns table (
  public_order_id uuid,
  status public.payment_status,
  fulfillment_status public.fulfillment_status,
  transitioned_to_paid boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
  v_order_id bigint;
  v_matching_orders integer;
  v_reservation record;
begin
  if p_chargeback_id is null or char_length(p_chargeback_id) not between 1 and 160 then
    raise exception 'invalid_chargeback_id';
  end if;
  if coalesce(array_length(p_provider_payment_ids, 1), 0) = 0 then
    raise exception 'chargeback_not_found';
  end if;

  select count(distinct pa.order_id), min(pa.order_id)
  into v_matching_orders, v_order_id
  from public.payment_attempts pa
  where pa.provider_payment_id = any(p_provider_payment_ids);

  if v_matching_orders = 0 then raise exception 'chargeback_not_found'; end if;
  if v_matching_orders > 1 then raise exception 'ambiguous_chargeback'; end if;

  select * into v_order
  from public.orders
  where id = v_order_id
  for update;

  select * into v_attempt
  from public.payment_attempts
  where order_id = v_order.id
    and provider_payment_id = any(p_provider_payment_ids)
  order by created_at desc
  limit 1
  for update;

  if not found then raise exception 'chargeback_not_found'; end if;
  if p_currency <> 'BRL' or v_order.currency <> p_currency then raise exception 'currency_mismatch'; end if;
  if p_amount_cents <= 0 or p_amount_cents > v_attempt.amount_cents then
    raise exception 'chargeback_amount_mismatch';
  end if;

  update public.payment_attempts
  set status = 'CHARGEBACK',
      provider_status = 'chargeback',
      provider_status_detail = left(p_provider_status_detail, 120),
      request_state = 'COMPLETED',
      completed_at = coalesce(completed_at, now()),
      updated_at = now()
  where id = v_attempt.id;

  update public.orders
  set status = 'CHARGEBACK',
      fulfillment_status = 'REVIEW_REQUIRED',
      updated_at = now()
  where id = v_order.id;

  insert into public.fulfillment_outbox (order_id, event_type, dedupe_key, payload)
  values (
    v_order.id,
    'PAYMENT_REVIEW',
    'chargeback:' || encode(digest(p_chargeback_id, 'sha256'), 'hex'),
    jsonb_build_object(
      'publicOrderId', v_order.public_id,
      'reason', 'chargeback',
      'chargebackId', p_chargeback_id
    )
  ) on conflict (order_id, event_type, dedupe_key) do nothing;

  if v_order.inventory_applied_at is null and v_order.reservation_released_at is null then
    for v_reservation in
      select * from public.inventory_reservations
      where payment_attempt_id = v_attempt.id and status = 'RESERVED'
      order by product_id
      for update
    loop
      update public.products
      set stock_reserved = stock_reserved - v_reservation.quantity,
          updated_at = now()
      where id = v_reservation.product_id
        and stock_reserved >= v_reservation.quantity;
      if not found then raise exception 'inventory_invariant_failed'; end if;

      update public.inventory_reservations
      set status = 'RELEASED', updated_at = now()
      where id = v_reservation.id;

      insert into public.inventory_movements (
        order_id, order_item_id, product_id, movement_type, quantity
      ) values (
        v_order.id, v_reservation.order_item_id, v_reservation.product_id, 'RELEASE', v_reservation.quantity
      ) on conflict (order_item_id, movement_type) do nothing;
    end loop;

    update public.orders
    set reservation_released_at = now(), updated_at = now()
    where id = v_order.id;
  end if;

  select * into v_order from public.orders where id = v_order.id;
  return query select v_order.public_id, v_order.status, v_order.fulfillment_status, false;
end;
$$;

create or replace function public.record_mercado_pago_webhook(
  p_request_id text,
  p_provider_order_id text,
  p_provider_status text,
  p_provider_status_detail text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_request_id is null or char_length(p_request_id) not between 1 and 200 then
    raise exception 'invalid_webhook_request_id';
  end if;
  if p_provider_order_id is null or char_length(p_provider_order_id) not between 1 and 160 then
    raise exception 'invalid_provider_order_id';
  end if;

  insert into public.webhook_receipts (
    request_id, provider_order_id, provider_status, provider_status_detail, processed_at
  ) values (
    p_request_id,
    p_provider_order_id,
    left(p_provider_status, 80),
    left(p_provider_status_detail, 120),
    now()
  );
  return true;
exception when unique_violation then
  return false;
end;
$$;

create or replace function public.expire_unsubmitted_payment_attempts(
  p_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
  v_reservation record;
  v_expired integer := 0;
begin
  if p_limit is null or p_limit not between 1 and 1000 then raise exception 'invalid_limit'; end if;

  for v_order in
    select o.* from public.orders o
    where o.status = 'PROCESSING'
      and o.expires_at < now()
      and o.inventory_applied_at is null
      and o.reservation_released_at is null
    order by o.expires_at
    limit p_limit
    for update of o skip locked
  loop
    select * into v_attempt
    from public.payment_attempts
    where order_id = v_order.id
      and request_state = 'PENDING'
      and provider_order_id is null
      and processing_started_at is null
    for update;

    if not found then continue; end if;

    for v_reservation in
      select * from public.inventory_reservations
      where payment_attempt_id = v_attempt.id and status = 'RESERVED'
      order by product_id
      for update
    loop
      update public.products
      set stock_reserved = stock_reserved - v_reservation.quantity,
          updated_at = now()
      where id = v_reservation.product_id and stock_reserved >= v_reservation.quantity;
      if not found then raise exception 'inventory_invariant_failed'; end if;

      update public.inventory_reservations
      set status = 'RELEASED', updated_at = now()
      where id = v_reservation.id;

      insert into public.inventory_movements (
        order_id, order_item_id, product_id, movement_type, quantity
      ) values (
        v_order.id, v_reservation.order_item_id, v_reservation.product_id, 'RELEASE', v_reservation.quantity
      ) on conflict (order_item_id, movement_type) do nothing;
    end loop;

    update public.payment_attempts
    set status = 'EXPIRED', request_state = 'COMPLETED', provider_error_code = 'quote_expired',
        completed_at = now(), updated_at = now()
    where id = v_attempt.id;

    update public.orders
    set status = 'EXPIRED', reservation_released_at = now(), updated_at = now()
    where id = v_order.id;

    v_expired := v_expired + 1;
  end loop;

  return v_expired;
end;
$$;

create or replace function public.cleanup_api_rate_limits(
  p_before timestamptz default (now() - interval '1 day')
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint;
begin
  if p_before is null then raise exception 'invalid_before'; end if;
  delete from public.api_rate_limits where bucket_started_at < p_before;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

create or replace function public.purge_abandoned_checkout_quotes(
  p_before timestamptz default (now() - interval '1 day'),
  p_limit integer default 500
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_ids bigint[];
  v_deleted integer;
begin
  if p_before is null then raise exception 'invalid_before'; end if;
  if p_limit is null or p_limit not between 1 and 5000 then raise exception 'invalid_limit'; end if;

  select array_agg(candidate.id) into v_order_ids
  from (
    select o.id
    from public.orders o
    where o.status = 'PENDING'
      and o.created_at < p_before
      and not exists (select 1 from public.payment_attempts pa where pa.order_id = o.id)
    order by o.created_at
    limit p_limit
    for update of o skip locked
  ) candidate;

  if v_order_ids is null then return 0; end if;

  delete from public.order_items where order_id = any(v_order_ids);
  delete from public.orders where id = any(v_order_ids);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

create or replace function public.claim_fulfillment_events(
  p_limit integer default 25
)
returns table (
  event_id bigint,
  claim_token uuid,
  public_order_id uuid,
  event_type text,
  payload jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid_limit'; end if;

  return query
  with candidates as (
    select f.id
    from public.fulfillment_outbox f
    where f.processed_at is null
      and (f.claimed_at is null or f.claimed_at < now() - interval '15 minutes')
    order by f.created_at
    limit p_limit
    for update skip locked
  ), claimed as (
    update public.fulfillment_outbox f
    set claimed_at = now(), claim_token = gen_random_uuid()
    from candidates c
    where f.id = c.id
    returning f.id, f.claim_token, f.order_id, f.event_type, f.payload
  )
  select c.id, c.claim_token, o.public_id, c.event_type, c.payload
  from claimed c
  join public.orders o on o.id = c.order_id
  order by c.id;
end;
$$;

create or replace function public.complete_fulfillment_event(
  p_event_id bigint,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completed bigint;
begin
  if p_event_id is null or p_claim_token is null then return false; end if;

  update public.fulfillment_outbox
  set processed_at = now(), claim_token = null
  where id = p_event_id
    and claim_token = p_claim_token
    and processed_at is null
  returning id into v_completed;

  return v_completed is not null;
end;
$$;

create or replace function public.get_public_order_status(
  p_public_order_id uuid,
  p_guest_session_hash text
)
returns table (
  public_order_id uuid,
  status public.payment_status,
  fulfillment_status public.fulfillment_status,
  total_cents bigint,
  currency text,
  provider_order_id text,
  created_at timestamptz,
  items jsonb
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    o.public_id,
    o.status,
    o.fulfillment_status,
    o.total_cents,
    o.currency,
    o.provider_order_id,
    o.created_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'productId', oi.product_id,
          'name', oi.product_name,
          'quantity', oi.quantity,
          'unitPriceCents', oi.unit_price_cents,
          'lineTotalCents', oi.line_total_cents
        ) order by oi.id
      ) filter (where oi.id is not null),
      '[]'::jsonb
    )
  from public.orders o
  left join public.order_items oi on oi.order_id = o.id
  where o.public_id = p_public_order_id
    and o.guest_session_hash = p_guest_session_hash
  group by o.id;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.create_checkout_quote(text, jsonb, jsonb, bigint) from public, anon, authenticated;
revoke all on function public.start_payment_attempt(uuid, text, uuid, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.claim_payment_attempt(uuid, text) from public, anon, authenticated;
revoke all on function public.mark_payment_attempt_retryable(uuid, text) from public, anon, authenticated;
revoke all on function public.fail_payment_attempt(uuid, text) from public, anon, authenticated;
revoke all on function public.apply_mercado_pago_order(text, text, text, bigint, bigint, text, public.payment_status, text, text) from public, anon, authenticated;
revoke all on function public.apply_mercado_pago_chargeback(text, text[], bigint, text, text) from public, anon, authenticated;
revoke all on function public.record_mercado_pago_webhook(text, text, text, text) from public, anon, authenticated;
revoke all on function public.expire_unsubmitted_payment_attempts(integer) from public, anon, authenticated;
revoke all on function public.cleanup_api_rate_limits(timestamptz) from public, anon, authenticated;
revoke all on function public.purge_abandoned_checkout_quotes(timestamptz, integer) from public, anon, authenticated;
revoke all on function public.claim_fulfillment_events(integer) from public, anon, authenticated;
revoke all on function public.complete_fulfillment_event(bigint, uuid) from public, anon, authenticated;
revoke all on function public.get_public_order_status(uuid, text) from public, anon, authenticated;

grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;
grant execute on function public.create_checkout_quote(text, jsonb, jsonb, bigint) to service_role;
grant execute on function public.start_payment_attempt(uuid, text, uuid, text, text, text, integer) to service_role;
grant execute on function public.claim_payment_attempt(uuid, text) to service_role;
grant execute on function public.mark_payment_attempt_retryable(uuid, text) to service_role;
grant execute on function public.fail_payment_attempt(uuid, text) to service_role;
grant execute on function public.apply_mercado_pago_order(text, text, text, bigint, bigint, text, public.payment_status, text, text) to service_role;
grant execute on function public.apply_mercado_pago_chargeback(text, text[], bigint, text, text) to service_role;
grant execute on function public.record_mercado_pago_webhook(text, text, text, text) to service_role;
grant execute on function public.expire_unsubmitted_payment_attempts(integer) to service_role;
grant execute on function public.cleanup_api_rate_limits(timestamptz) to service_role;
grant execute on function public.purge_abandoned_checkout_quotes(timestamptz, integer) to service_role;
grant execute on function public.claim_fulfillment_events(integer) to service_role;
grant execute on function public.complete_fulfillment_event(bigint, uuid) to service_role;
grant execute on function public.get_public_order_status(uuid, text) to service_role;
