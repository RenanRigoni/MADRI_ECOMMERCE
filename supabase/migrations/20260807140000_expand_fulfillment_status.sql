-- Expands fulfillment_status from 2 usable stages (READY/FULFILLED) to 5
-- (READY/SEPARATING/PACKED/FULFILLED/DELIVERED) for the admin orders redesign.
-- Enum additions are additive/non-destructive; existing rows keep their current
-- values unchanged. Kept in its own migration because a newly-added enum value
-- cannot be referenced in the same transaction that adds it.

alter type public.fulfillment_status add value if not exists 'SEPARATING' after 'READY';
alter type public.fulfillment_status add value if not exists 'PACKED' after 'SEPARATING';
alter type public.fulfillment_status add value if not exists 'DELIVERED' after 'FULFILLED';

alter table public.orders add column if not exists fulfillment_updated_at timestamptz;
