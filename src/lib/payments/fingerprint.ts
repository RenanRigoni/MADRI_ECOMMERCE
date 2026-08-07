import 'server-only'

import { createHash } from 'node:crypto'
import type { PaymentRequest } from './schema'

export function createPaymentFingerprint(request: PaymentRequest): string {
  const stableInput = JSON.stringify({
    publicOrderId: request.publicOrderId,
    attemptId: request.attemptId,
    paymentMethodId: request.payment.paymentMethodId,
    paymentTypeId: request.payment.paymentTypeId,
    installments: 'installments' in request.payment ? request.payment.installments : 1,
  })
  return createHash('sha256').update(stableInput).digest('hex')
}
