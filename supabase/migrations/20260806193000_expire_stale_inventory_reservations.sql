-- Bug #2 (BUGS.md): inventory_reservations never expired automatically. A checkout
-- that never completed (customer closes tab mid-payment, abandons the Mercado Pago
-- card form, etc.) left stock_reserved permanently incremented, making products look
-- out of stock even with physical units free. Only a full happy-path completion or an
-- explicit rejection ever released a reservation.
--
-- This adds a function that releases RESERVED reservations for orders whose checkout
-- quote (orders.expires_at) has passed without payment completing, and schedules it
-- to run every 5 minutes via pg_cron.

create extension if not exists pg_cron;

create or replace function public.release_expired_inventory_reservations()
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_order record;
  v_reservation record;
  v_released_orders integer := 0;
begin
  for v_order in
    select o.id
    from public.orders o
    where o.expires_at < now()
      and o.status in ('PENDING', 'PROCESSING')
      and o.inventory_applied_at is null
      and o.reservation_released_at is null
      and exists (
        select 1
        from public.payment_attempts pa
        join public.inventory_reservations ir on ir.payment_attempt_id = pa.id
        where pa.order_id = o.id and ir.status = 'RESERVED'
      )
    for update of o skip locked
  loop
    for v_reservation in
      select ir.*
      from public.inventory_reservations ir
      join public.payment_attempts pa on pa.id = ir.payment_attempt_id
      where pa.order_id = v_order.id and ir.status = 'RESERVED'
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

    update public.orders
    set status = 'EXPIRED', reservation_released_at = now(), updated_at = now()
    where id = v_order.id;

    v_released_orders := v_released_orders + 1;
  end loop;

  return v_released_orders;
end;
$function$;

select cron.schedule(
  'release-expired-inventory-reservations',
  '*/5 * * * *',
  $$select public.release_expired_inventory_reservations()$$
);
