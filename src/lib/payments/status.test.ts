import { describe, expect, it } from 'vitest'
import { mapMercadoPagoStatus } from './status'

describe('mapMercadoPagoStatus', () => {
  it('marks only processed/accredited as paid', () => {
    expect(mapMercadoPagoStatus('processed', 'accredited')).toBe('PAID')
    expect(mapMercadoPagoStatus('processed', 'partially_refunded')).toBe('PARTIALLY_REFUNDED')
  })

  it.each([
    ['created', 'created', 'PENDING'],
    ['processing', 'in_process', 'PROCESSING'],
    ['action_required', 'pending_challenge', 'PROCESSING'],
    ['failed', 'rejected_by_issuer', 'REJECTED'],
    ['failed', 'processing_error', 'FAILED'],
    ['canceled', 'canceled', 'CANCELLED'],
    ['expired', 'expired', 'EXPIRED'],
    ['refunded', 'refunded', 'REFUNDED'],
    ['charged_back', 'settled', 'CHARGEBACK'],
    ['future_status', 'future_detail', 'UNKNOWN'],
  ])('maps %s/%s to %s', (status, detail, expected) => {
    expect(mapMercadoPagoStatus(status, detail)).toBe(expected)
  })
})
