-- "Mais vendidos" reads real sales instead of a manual toggle. A SALE
-- inventory_movement row only exists once a payment is confirmed PAID
-- (see apply_mercado_pago_order), so this view is an accurate, tamper-proof
-- ranking — nobody can inflate it from the admin panel.
create view public.top_selling_products as
select product_id, sum(quantity)::bigint as total_quantity
from public.inventory_movements
where movement_type = 'SALE'
group by product_id
order by total_quantity desc;

revoke all on public.top_selling_products from public, anon, authenticated;
grant select on public.top_selling_products to service_role;
