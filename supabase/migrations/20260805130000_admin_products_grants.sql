-- The base commerce migration revoked ALL table privileges from service_role
-- on purpose, funneling payment writes through SECURITY DEFINER RPCs only.
-- The admin panel (src/lib/admin/products.ts) writes to `products` directly
-- via the service-role client instead — it's already gated by
-- requireAdminUser() (Supabase Auth session check) before any DB call, so
-- this is a deliberate, scoped exception: service_role gets direct
-- read/write on products, nothing else changes.
grant select, insert, update on table public.products to service_role;
