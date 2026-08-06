-- Fix "column reference \"status\" is ambiguous" in apply_mercado_pago_order.
--
-- RETURNS TABLE(..., status payment_status, ...) implicitly declares a plpgsql
-- variable named `status` in the function's scope. Several queries against
-- public.inventory_reservations referenced its `status` column unqualified,
-- colliding with that OUT variable and raising a runtime error on every
-- attempt to reconcile a PAID order. This made the synchronous payment route
-- silently fall through to a generic 503 (persistenceFailure() only logs a
-- handful of known error codes; this ambiguous-column error wasn't one of
-- them), leaving approved Mercado Pago payments unrecorded in our database.
create or replace function public.apply_mercado_pago_order(
  p_provider_order_id text,
  p_provider_payment_id text,
  p_external_reference text,
  p_total_cents bigint,
  p_payment_amount_cents bigint,
  p_currency text,
  p_local_status payment_status,
  p_provider_status text,
  p_provider_status_detail text
)
returns table(public_order_id uuid, status payment_status, fulfillment_status fulfillment_status, transitioned_to_paid boolean)
language plpgsql
security definer
set search_path to ''
as $function$
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

    select count(*), coalesce(sum(ir.quantity), 0)
    into v_reserved_count, v_reserved_quantity
    from public.inventory_reservations ir
    where ir.payment_attempt_id = v_attempt.id and ir.status = 'RESERVED';

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
        else public.orders.fulfillment_status
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
      select * from public.inventory_reservations ir
      where ir.payment_attempt_id = v_attempt.id and ir.status = 'RESERVED'
      order by ir.product_id
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
      select * from public.inventory_reservations ir
      where ir.payment_attempt_id = v_attempt.id and ir.status = 'RESERVED'
      order by ir.product_id
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
$function$;
