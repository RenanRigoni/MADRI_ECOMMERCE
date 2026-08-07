import type { LocalPaymentStatus } from '@/lib/payments/status'
import type { AdminFulfillmentStatus } from '@/lib/admin/orders'

export interface Badge {
  label: string
  className: string
}

const SUCCESS = 'text-[#2D6A4F] border-[#2D6A4F]'
const DANGER = 'text-[#B5363A] border-[#B5363A]'
const NEUTRAL = 'text-[#6B7280] border-[#D7CFC0]'

const PAYMENT_STATUS_LABELS: Record<LocalPaymentStatus, string> = {
  PENDING: 'Aguardando',
  PROCESSING: 'Processando',
  PAID: 'Aprovado',
  REJECTED: 'Recusado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
  PARTIALLY_REFUNDED: 'Parcial. reembolsado',
  EXPIRED: 'Expirado',
  CHARGEBACK: 'Chargeback',
  FAILED: 'Falhou',
  UNKNOWN: 'Desconhecido',
}

const PAYMENT_STATUS_CLASS: Record<LocalPaymentStatus, string> = {
  PENDING: NEUTRAL,
  PROCESSING: NEUTRAL,
  PAID: SUCCESS,
  REJECTED: DANGER,
  CANCELLED: DANGER,
  REFUNDED: DANGER,
  PARTIALLY_REFUNDED: DANGER,
  EXPIRED: DANGER,
  CHARGEBACK: DANGER,
  FAILED: DANGER,
  UNKNOWN: NEUTRAL,
}

export function paymentStatusBadge(status: LocalPaymentStatus): Badge {
  return { label: PAYMENT_STATUS_LABELS[status] ?? status, className: PAYMENT_STATUS_CLASS[status] ?? NEUTRAL }
}

const FULFILLMENT_STATUS_LABELS: Record<AdminFulfillmentStatus, string> = {
  NOT_READY: '—',
  READY: 'Novo',
  SEPARATING: 'Em separação',
  PACKED: 'Pronto',
  FULFILLED: 'Enviado',
  DELIVERED: 'Entregue',
  REVIEW_REQUIRED: 'Revisar',
}

const FULFILLMENT_STATUS_CLASS: Record<AdminFulfillmentStatus, string> = {
  NOT_READY: NEUTRAL,
  READY: NEUTRAL,
  SEPARATING: NEUTRAL,
  PACKED: NEUTRAL,
  FULFILLED: SUCCESS,
  DELIVERED: SUCCESS,
  REVIEW_REQUIRED: DANGER,
}

export function fulfillmentStatusBadge(status: AdminFulfillmentStatus): Badge {
  return { label: FULFILLMENT_STATUS_LABELS[status] ?? status, className: FULFILLMENT_STATUS_CLASS[status] ?? NEUTRAL }
}

export function paymentMethodBadge(method: 'pix' | 'card' | null): Badge {
  if (method === 'pix') return { label: 'Pix', className: NEUTRAL }
  if (method === 'card') return { label: 'Cartão', className: NEUTRAL }
  return { label: '—', className: NEUTRAL }
}

// Forward-only order of stages an admin can advance through (mirrors
// admin_update_order_fulfillment in 20260807150000_admin_orders_v2_rpc.sql).
export const FULFILLMENT_NEXT_STAGE: Partial<Record<AdminFulfillmentStatus, AdminFulfillmentStatus>> = {
  READY: 'SEPARATING',
  SEPARATING: 'PACKED',
  PACKED: 'FULFILLED',
  FULFILLED: 'DELIVERED',
}
