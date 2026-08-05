import 'server-only'

import { WebhookSignatureValidator } from 'mercadopago'

const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000

export interface WebhookSignatureInput {
  xSignature: string | null | undefined
  xRequestId: string | null | undefined
  dataId: string | null | undefined
  secret: string
  now?: () => number
}

export class WebhookTimestampError extends Error {
  constructor() {
    super('Webhook timestamp is outside the accepted window')
    this.name = 'WebhookTimestampError'
  }
}

export class WebhookSignatureError extends Error {
  constructor() {
    super('Webhook signature is invalid')
    this.name = 'WebhookSignatureError'
  }
}

function timestampFromSignature(signature: string | null | undefined): string | undefined {
  const parts = signature?.split(',').map((part) => part.trim()) ?? []
  const timestamps = parts.filter((part) => part.startsWith('ts='))
  const signatures = parts.filter((part) => part.startsWith('v1='))
  if (timestamps.length !== 1 || signatures.length !== 1) throw new WebhookSignatureError()
  return timestamps[0].slice(3)
}

function toTimestampMilliseconds(rawTimestamp: string): number {
  const timestamp = Number(rawTimestamp)
  if (!Number.isFinite(timestamp)) throw new WebhookTimestampError()
  return timestamp >= 1_000_000_000_000 ? timestamp : timestamp * 1000
}

export function validateMercadoPagoWebhookSignature(input: WebhookSignatureInput): void {
  const timestamp = timestampFromSignature(input.xSignature)
  if (!timestamp) throw new WebhookTimestampError()

  const now = input.now?.() ?? Date.now()
  if (Math.abs(now - toTimestampMilliseconds(timestamp)) > MAX_WEBHOOK_AGE_MS) {
    throw new WebhookTimestampError()
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: input.xSignature,
      xRequestId: input.xRequestId,
      dataId: input.dataId?.toLowerCase(),
      secret: input.secret,
    })
  } catch {
    throw new WebhookSignatureError()
  }
}
