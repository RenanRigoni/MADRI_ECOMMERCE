-- Adds Pix as a second payment method (Orders API, payment_method.type = "bank_transfer")
-- alongside the existing credit_card / debit_card flow. Card payments are unaffected.

do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.payment_attempts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%payment_type_id%'
  loop
    execute format('alter table public.payment_attempts drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.payment_attempts
  add constraint payment_attempts_payment_type_id_check
  check (payment_type_id in ('credit_card', 'debit_card', 'bank_transfer'));

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
  if p_payment_type_id not in ('credit_card', 'debit_card', 'bank_transfer') then raise exception 'invalid_payment_type'; end if;
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
