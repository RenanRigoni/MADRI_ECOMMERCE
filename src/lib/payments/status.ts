export const LOCAL_PAYMENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'REJECTED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'EXPIRED',
  'CHARGEBACK',
  'FAILED',
  'UNKNOWN',
] as const

export type LocalPaymentStatus = (typeof LOCAL_PAYMENT_STATUSES)[number]

const REJECTION_DETAILS = new Set([
  'bad_filled_card_data',
  'invalid_card_token',
  'high_risk',
  'rejected_by_issuer',
  'required_call_for_authorize',
  'max_attempts_exceeded',
  'card_disabled',
  'insufficient_amount',
  'amount_limit_exceeded',
  'invalid_installments',
  '3ds_challenge_expired',
  'card_insufficient_amount',
])

export function mapMercadoPagoStatus(
  providerStatus: string | null | undefined,
  providerStatusDetail: string | null | undefined,
): LocalPaymentStatus {
  if (providerStatus === 'processed' && providerStatusDetail === 'accredited') return 'PAID'
  if (providerStatus === 'processed' && providerStatusDetail === 'partially_refunded') {
    return 'PARTIALLY_REFUNDED'
  }
  if (providerStatus === 'created') return 'PENDING'
  if (providerStatus === 'processing' || providerStatus === 'action_required' || providerStatus === 'in_review') {
    return 'PROCESSING'
  }
  if (providerStatus === 'failed') {
    return providerStatusDetail && REJECTION_DETAILS.has(providerStatusDetail) ? 'REJECTED' : 'FAILED'
  }
  if (providerStatus === 'canceled') return 'CANCELLED'
  if (providerStatus === 'expired') return 'EXPIRED'
  if (providerStatus === 'refunded') return 'REFUNDED'
  if (providerStatus === 'charged_back') return 'CHARGEBACK'
  return 'UNKNOWN'
}

export function isPaidStatus(status: LocalPaymentStatus): boolean {
  return status === 'PAID'
}
