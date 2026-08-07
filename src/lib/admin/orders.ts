import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdminOrderAddress {
  postalCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export interface AdminOrderItem {
  productId: string
  productName: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
}

export interface AdminOrderRow {
  id: number
  publicId: string
  externalReference: string
  status: string
  fulfillmentStatus: string
  subtotalCents: number
  shippingCents: number
  totalCents: number
  currency: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  address: AdminOrderAddress | null
  createdAt: string
  paidAt: string | null
  providerOrderId: string | null
  paymentMethod: 'pix' | 'card' | null
  items: AdminOrderItem[]
}

export class AdminOrderError extends Error {
  constructor(readonly code: 'not_found' | 'persistence_failure') {
    super('Admin order operation failed')
    this.name = 'AdminOrderError'
  }
}

interface RawOrder {
  id: number
  public_id: string
  external_reference: string
  status: string
  fulfillment_status: string
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  currency: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  shipping_address: Record<string, unknown> | null
  created_at: string
  paid_at: string | null
  provider_order_id: string | null
  payment_method: string | null
  items: AdminOrderItem[]
}

function parseAddress(value: Record<string, unknown> | null): AdminOrderAddress | null {
  if (!value) return null
  return {
    postalCode: String(value.postalCode ?? ''),
    street: String(value.street ?? ''),
    number: String(value.number ?? ''),
    complement: String(value.complement ?? ''),
    neighborhood: String(value.neighborhood ?? ''),
    city: String(value.city ?? ''),
    state: String(value.state ?? ''),
  }
}

function toRow(raw: RawOrder): AdminOrderRow {
  return {
    id: raw.id,
    publicId: raw.public_id,
    externalReference: raw.external_reference,
    status: raw.status,
    fulfillmentStatus: raw.fulfillment_status,
    subtotalCents: raw.subtotal_cents,
    shippingCents: raw.shipping_cents,
    totalCents: raw.total_cents,
    currency: raw.currency,
    customerName: raw.customer_name,
    customerEmail: raw.customer_email,
    customerPhone: raw.customer_phone,
    address: parseAddress(raw.shipping_address),
    createdAt: raw.created_at,
    paidAt: raw.paid_at,
    providerOrderId: raw.provider_order_id,
    paymentMethod: raw.payment_method === 'pix' ? 'pix' : raw.payment_method === 'card' ? 'card' : null,
    items: raw.items ?? [],
  }
}

// orders/order_items/payment_attempts have direct table access revoked even from
// service_role — all reads/writes go through security definer RPCs
// (supabase/migrations/20260807130000_admin_orders_rpc.sql), same pattern as the
// rest of the payments schema.
export async function listAdminOrders(client: SupabaseClient, limit = 200): Promise<AdminOrderRow[]> {
  const { data, error } = await client.rpc('admin_list_orders', { p_limit: limit })
  if (error) throw new AdminOrderError('persistence_failure')
  return ((data ?? []) as RawOrder[]).map(toRow)
}

export async function getAdminOrder(client: SupabaseClient, id: number): Promise<AdminOrderRow | null> {
  const { data, error } = await client.rpc('admin_get_order', { p_id: id })
  if (error) throw new AdminOrderError('persistence_failure')
  const row = Array.isArray(data) ? data[0] : data
  return row ? toRow(row as RawOrder) : null
}

export async function setAdminOrderFulfilled(client: SupabaseClient, id: number): Promise<void> {
  const { data, error } = await client.rpc('admin_mark_order_fulfilled', { p_id: id })
  if (error) throw new AdminOrderError('persistence_failure')
  if (!data) throw new AdminOrderError('not_found')
}
