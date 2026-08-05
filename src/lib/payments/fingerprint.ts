import 'server-only'

import { createHash } from 'node:crypto'
import type { PaymentRequest } from './schema'

export function createPaymentFingerprint(request: PaymentRequest): string {
  const stableInput = JSON.stringify({
    publicOrderId: request.publicOrderId,
    attemptId: request.attemptId,
    paymentMethodId: request.payment.paymentMethodId,
    paymentTypeId: request.payment.paymentTypeId,
    installments: request.payment.installments,
  })
  return createHash('sha256').update(stableInput).digest('hex')
}
