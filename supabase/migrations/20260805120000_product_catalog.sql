-- Extends the commerce `products` table (created in 20260805110000) with the
-- full storefront catalog fields, so it becomes the single source of truth
-- for both checkout (price/stock) and display (name/photos/description).
-- The admin panel writes here through the service-role client after the
-- app's own session check — see src/app/admin/**/actions.ts — so no
-- authenticated-write RLS policy is needed, only a public read policy for
-- active products.

alter table public.products
  add column slug text,
  add column brand text,
  add column product_name text,
  add column product_line text,
  add column version text,
  add column concentration text,
  add column volume_ml integer check (volume_ml is null or volume_ml > 0),
  add column gender text check (gender is null or gender in ('masculino', 'feminino', 'unissex')),
  add column product_type text not null default 'Perfume'
    check (product_type in ('Perfume', 'Body Splash', 'Hidratante', 'Perfume Mist')),
  add column discount_percent integer check (discount_percent is null or discount_percent between 0 and 100),
  add column is_new boolean not null default false,
  add column is_best_seller boolean not null default false,
  add column is_giftable boolean not null default false,
  add column fragrance_family text check (
    fragrance_family is null or fragrance_family in (
      'floral', 'amadeirado', 'citrico', 'oriental', 'frutal', 'aromatico', 'gourmand', 'musk'
    )
  ),
  add column fragrance_family_label text,
  add column notes_top text[] not null default '{}',
  add column notes_heart text[] not null default '{}',
  add column notes_base text[] not null default '{}',
  add column style_tags text[] not null default '{}',
  add column intensity text check (intensity is null or intensity in ('leve', 'moderada', 'marcante')),
  add column occasion text[] not null default '{}',
  add column short_description text,
  add column description text,
  add column meta_title text,
  add column meta_description text,
  add column images text[] not null default '{}',
  add column research_verified boolean not null default true;

alter table public.products
  add constraint products_slug_format check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

create unique index products_slug_key on public.products (slug) where slug is not null;

comment on column public.products.name is 'Full display/SEO title (kept for checkout line items); admin form derives it from brand + product_name + version.';

-- Storefront visitors (anon) may read published products only. Writes stay
-- funneled through the service-role client in server actions, gated by the
-- app's own Supabase Auth session check — RLS grants no write access here.
create policy "public_can_read_active_products" on public.products
  for select
  to anon, authenticated
  using (active = true);

grant select on table public.products to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
