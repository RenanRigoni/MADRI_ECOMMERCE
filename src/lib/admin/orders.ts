import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LocalPaymentStatus } from '@/lib/payments/status'

export const ORDERS_PAGE_SIZE = 25

export type AdminFulfillmentStatus =
  | 'NOT_READY'
  | 'READY'
  | 'SEPARATING'
  | 'PACKED'
  | 'FULFILLED'
  | 'DELIVERED'
  | 'REVIEW_REQUIRED'

export type AdminOrderPeriod = 'today' | '7d' | '30d'

export interface AdminOrderFilters {
  q?: string
  paymentStatus?: LocalPaymentStatus[]
  method?: 'pix' | 'card'
  fulfillmentStatus?: AdminFulfillmentStatus
  period?: AdminOrderPeriod
  page?: number
}

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
  status: LocalPaymentStatus
  fulfillmentStatus: AdminFulfillmentStatus
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
  fulfillmentUpdatedAt: string | null
}

export interface AdminOrderPayment {
  paymentTypeId: string | null
  installments: number | null
  providerStatus: string | null
  providerStatusDetail: string | null
  providerOrderId: string | null
  providerPaymentId: string | null
  amountCents: number | null
  createdAt: string | null
  completedAt: string | null
}

export interface AdminOrderDetail extends AdminOrderRow {
  payment: AdminOrderPayment | null
}

export interface AdminOrderCounters {
  ordersToday: number
  awaitingPayment: number
  paidToProcess: number
}

export class AdminOrderError extends Error {
  constructor(readonly code: 'not_found' | 'persistence_failure' | 'invalid_transition') {
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
  fulfillment_updated_at: string | null
}

interface RawOrderListRow extends RawOrder {
  total_count: number
}

interface RawOrderPayment {
  paymentTypeId: string | null
  installments: number | null
  providerStatus: string | null
  providerStatusDetail: string | null
  providerOrderId: string | null
  providerPaymentId: string | null
  amountCents: number | null
  createdAt: string | null
  completedAt: string | null
}

interface RawOrderDetail extends RawOrder {
  payment: RawOrderPayment | null
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
    status: raw.status as LocalPaymentStatus,
    fulfillmentStatus: raw.fulfillment_status as AdminFulfillmentStatus,
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
    fulfillmentUpdatedAt: raw.fulfillment_updated_at,
  }
}

function periodToRange(period: AdminOrderPeriod | undefined): { from: string | null; to: null } {
  if (!period) return { from: null, to: null }
  const now = new Date()
  const from = new Date(now)
  if (period === 'today') {
    from.setHours(0, 0, 0, 0)
  } else if (period === '7d') {
    from.setDate(from.getDate() - 7)
  } else {
    from.setDate(from.getDate() - 30)
  }
  return { from: from.toISOString(), to: null }
}

// orders/order_items/payment_attempts have direct table access revoked even from
// service_role — all reads/writes go through security definer RPCs
// (supabase/migrations/20260807150000_admin_orders_v2_rpc.sql), same pattern as the
// rest of the payments schema.
export async function listAdminOrders(
  client: SupabaseClient,
  filters: AdminOrderFilters = {},
): Promise<{ orders: AdminOrderRow[]; total: number }> {
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const { from, to } = periodToRange(filters.period)
  const { data, error } = await client.rpc('admin_list_orders', {
    p_payment_status: filters.paymentStatus?.length ? filters.paymentStatus : null,
    p_method: filters.method ?? null,
    p_fulfillment_status: filters.fulfillmentStatus ?? null,
    p_search: filters.q?.trim() || null,
    p_date_from: from,
    p_date_to: to,
    p_limit: ORDERS_PAGE_SIZE,
    p_offset: (page - 1) * ORDERS_PAGE_SIZE,
  })
  if (error) throw new AdminOrderError('persistence_failure')
  const rows = (data ?? []) as RawOrderListRow[]
  return {
    orders: rows.map(toRow),
    total: rows[0]?.total_count ?? 0,
  }
}

export async function getAdminOrder(client: SupabaseClient, id: number): Promise<AdminOrderDetail | null> {
  const { data, error } = await client.rpc('admin_get_order', { p_id: id })
  if (error) throw new AdminOrderError('persistence_failure')
  const row = (Array.isArray(data) ? data[0] : data) as RawOrderDetail | null
  if (!row) return null
  return {
    ...toRow(row),
    payment: row.payment
      ? {
          paymentTypeId: row.payment.paymentTypeId,
          installments: row.payment.installments,
          providerStatus: row.payment.providerStatus,
          providerStatusDetail: row.payment.providerStatusDetail,
          providerOrderId: row.payment.providerOrderId,
          providerPaymentId: row.payment.providerPaymentId,
          amountCents: row.payment.amountCents,
          createdAt: row.payment.createdAt,
          completedAt: row.payment.completedAt,
        }
      : null,
  }
}

export async function updateOrderFulfillment(
  client: SupabaseClient,
  id: number,
  next: 'SEPARATING' | 'PACKED' | 'FULFILLED' | 'DELIVERED',
): Promise<void> {
  const { data, error } = await client.rpc('admin_update_order_fulfillment', { p_id: id, p_new_status: next })
  if (error) throw new AdminOrderError('persistence_failure')
  if (!data) throw new AdminOrderError('invalid_transition')
}

export async function getAdminOrderCounters(client: SupabaseClient): Promise<AdminOrderCounters> {
  const { data, error } = await client.rpc('admin_order_counters')
  if (error) throw new AdminOrderError('persistence_failure')
  const row = Array.isArray(data) ? data[0] : data
  return {
    ordersToday: row?.orders_today ?? 0,
    awaitingPayment: row?.awaiting_payment ?? 0,
    paidToProcess: row?.paid_to_process ?? 0,
  }
}
