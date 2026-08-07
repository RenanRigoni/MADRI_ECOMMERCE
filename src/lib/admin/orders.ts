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

interface RawOrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price_cents: number
  line_total_cents: number
}

interface RawPaymentAttempt {
  payment_type_id: string
  created_at: string
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
  order_items: RawOrderItem[]
  payment_attempts: RawPaymentAttempt[]
}

const ADMIN_ORDER_COLUMNS = `
  id, public_id, external_reference, status, fulfillment_status,
  subtotal_cents, shipping_cents, total_cents, currency,
  customer_name, customer_email, customer_phone, shipping_address,
  created_at, paid_at, provider_order_id,
  order_items ( product_id, product_name, quantity, unit_price_cents, line_total_cents ),
  payment_attempts ( payment_type_id, created_at )
`

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

function latestPaymentMethod(attempts: RawPaymentAttempt[]): 'pix' | 'card' | null {
  if (attempts.length === 0) return null
  const latest = [...attempts].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  return latest.payment_type_id === 'bank_transfer' ? 'pix' : 'card'
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
    paymentMethod: latestPaymentMethod(raw.payment_attempts ?? []),
    items: (raw.order_items ?? []).map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      lineTotalCents: item.line_total_cents,
    })),
  }
}

export async function listAdminOrders(client: SupabaseClient, limit = 200): Promise<AdminOrderRow[]> {
  const { data, error } = await client
    .from('orders')
    .select(ADMIN_ORDER_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new AdminOrderError('persistence_failure')
  return ((data ?? []) as unknown as RawOrder[]).map(toRow)
}

export async function getAdminOrder(client: SupabaseClient, id: number): Promise<AdminOrderRow | null> {
  const { data, error } = await client.from('orders').select(ADMIN_ORDER_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new AdminOrderError('persistence_failure')
  return data ? toRow(data as unknown as RawOrder) : null
}

export async function setAdminOrderFulfilled(client: SupabaseClient, id: number): Promise<void> {
  const { error, count } = await client
    .from('orders')
    .update({ fulfillment_status: 'FULFILLED', updated_at: new Date().toISOString() }, { count: 'exact' })
    .eq('id', id)
    .eq('fulfillment_status', 'READY')
  if (error) throw new AdminOrderError('persistence_failure')
  if (!count) throw new AdminOrderError('not_found')
}
