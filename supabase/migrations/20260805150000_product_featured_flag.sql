-- "Destaque" is a distinct manual curation flag from "Novidade" (is_new,
-- already existed but was never wired to the admin) and "Mais vendidos"
-- (computed from real sales in inventory_movements, not stored on the row).
alter table public.products
  add column is_featured boolean not null default false;
