begin;
create schema if not exists extensions;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(18);

select has_table('public', 'payment_attempts', 'payment attempts are persisted');
select has_table('public', 'inventory_reservations', 'inventory reservations are persisted');
select has_table('public', 'fulfillment_outbox', 'fulfillment uses a transactional outbox');
select has_function('public', 'start_payment_attempt', 'payment attempt creation is atomic');
select has_function('public', 'apply_mercado_pago_order', 'provider reconciliation is atomic');
select has_function('public', 'apply_mercado_pago_chargeback', array['text', 'text[]', 'bigint', 'text', 'text'], 'chargeback reconciliation is atomic');
select col_is_unique('public', 'orders', 'external_reference', 'external references are unique');
select col_is_unique('public', 'payment_attempts', 'idempotency_key', 'provider idempotency keys are unique');
select policies_are('public', 'orders', array[]::text[], 'orders have no browser-readable RLS policy');
select has_function('public', 'fail_payment_attempt', array['uuid', 'text'], 'terminal pre-provider failure is atomic');
select has_function('public', 'expire_unsubmitted_payment_attempts', array['integer'], 'safe unsubmitted reservations can expire');
select has_function('public', 'cleanup_api_rate_limits', array['timestamp with time zone'], 'rate-limit buckets can be cleaned');
select ok((select relrowsecurity from pg_catalog.pg_class where oid = 'public.orders'::regclass), 'orders RLS is enabled');
select ok(not has_table_privilege('anon', 'public.orders', 'select'), 'anon cannot read orders');
select ok(not has_table_privilege('authenticated', 'public.orders', 'select'), 'authenticated users cannot read orders directly');
select has_function('public', 'claim_fulfillment_events', array['integer'], 'fulfillment workers can atomically claim outbox events');
select has_function('public', 'complete_fulfillment_event', array['bigint', 'uuid'], 'fulfillment workers can acknowledge a claimed event');
select has_function('public', 'purge_abandoned_checkout_quotes', array['timestamp with time zone', 'integer'], 'abandoned drafts with personal data can be purged');

select * from finish();
rollback;
