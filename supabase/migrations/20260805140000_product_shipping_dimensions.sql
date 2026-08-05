-- Package weight/dimensions, captured now so every product already has what
-- the future Melhor Envio integration needs (avoids retrofitting 159+ rows
-- later). Nullable at the DB level (the 159 seeded products have no physical
-- data yet), but required by the admin form and enforced the same way price
-- already is: a product can't go `active` without it.
alter table public.products
  add column weight_grams integer check (weight_grams is null or weight_grams > 0),
  add column height_cm integer check (height_cm is null or height_cm > 0),
  add column width_cm integer check (width_cm is null or width_cm > 0),
  add column length_cm integer check (length_cm is null or length_cm > 0);

alter table public.products
  add constraint products_active_requires_shipping_data check (
    not active or (
      weight_grams is not null and height_cm is not null
      and width_cm is not null and length_cm is not null
    )
  );
