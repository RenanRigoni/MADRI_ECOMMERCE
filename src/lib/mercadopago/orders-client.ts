import 'server-only'

import { z } from 'zod'
import { centsToMercadoPagoAmount, decimalToCents } from '@/lib/checkout/money'

const MERCADO_PAGO_ORDERS_URL = 'https://api.mercadopago.com/v1/orders'
const MERCADO_PAGO_CHARGEBACKS_URL = 'https://api.mercadopago.com/v1/chargebacks'
const providerIdSchema = z.union([z.string(), z.number().safe()]).transform(String)

const providerPaymentSchema = z
  .object({
    id: z.string().optional(),
    amount: z.string().optional(),
    status: z.string().optional(),
    status_detail: z.string().optional(),
    payment_method: z
      .object({
        id: z.string().optional(),
        type: z.string().optional(),
        installments: z.number().int().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

const providerOrderSchema = z
  .object({
    id: z.string().min(1),
    external_reference: z.string().min(1),
    total_amount: z.string(),
    currency: z.string().optional(),
    country_code: z.string().optional(),
    status: z.string().optional(),
    status_detail: z.string().optional(),
    transactions: z
      .object({
        payments: z.array(providerPaymentSchema).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

const providerChargebackSchema = z
  .object({
    id: providerIdSchema,
    payments: z.union([providerIdSchema, z.array(providerIdSchema).min(1)]).transform((value) => (
      Array.isArray(value) ? value : [value]
    )),
    amount: z.union([z.string(), z.number()]),
    currency: z.string().min(1),
    documentation_status: z.string().optional(),
    reason: z.string().optional(),
  })
  .passthrough()

export interface MercadoPagoOrderSnapshot {
  id: string
  externalReference: string
  totalAmountCents: number
  paymentAmountCents: number | null
  currency?: string
  countryCode?: string
  status: string | null
  statusDetail: string | null
  paymentId: string | null
  paymentMethodId: string | null
  paymentTypeId: string | null
  installments: number | null
}

export interface MercadoPagoChargebackSnapshot {
  id: string
  paymentIds: string[]
  amountCents: number
  currency: string
  statusDetail: string | null
}

export interface CreateMercadoPagoOrderInput {
  accessToken: string
  idempotencyKey: string
  externalReference: string
  totalCents: number
  payment: {
    token: string
    paymentMethodId: string
    paymentTypeId: 'credit_card' | 'debit_card'
    installments: number
    payer: {
      email: string
      identification: { type: 'CPF' | 'CNPJ'; number: string }
    }
  }
}

export class MercadoPagoApiError extends Error {
  constructor(
    readonly status: number,
    readonly retryable: boolean,
    readonly providerCode?: string,
  ) {
    super('Mercado Pago request failed')
    this.name = 'MercadoPagoApiError'
  }
}

function toSnapshot(value: unknown): MercadoPagoOrderSnapshot {
  const order = providerOrderSchema.parse(value)
  const payment = order.transactions?.payments?.[0]

  return {
    id: order.id,
    externalReference: order.external_reference,
    totalAmountCents: decimalToCents(order.total_amount),
    paymentAmountCents: payment?.amount ? decimalToCents(payment.amount) : null,
    currency: order.currency,
    countryCode: order.country_code,
    status: payment?.status ?? order.status ?? null,
    statusDetail: payment?.status_detail ?? order.status_detail ?? null,
    paymentId: payment?.id ?? null,
    paymentMethodId: payment?.payment_method?.id ?? null,
    paymentTypeId: payment?.payment_method?.type ?? null,
    installments: payment?.payment_method?.installments ?? null,
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function providerErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const code = Reflect.get(body, 'code') ?? Reflect.get(body, 'error')
  return typeof code === 'string' ? code.slice(0, 80) : undefined
}

function isRetryableProviderStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 408 || status === 409 || status === 429 || status >= 500
}

export async function createMercadoPagoOrder(
  input: CreateMercadoPagoOrderInput,
  fetchImplementation: typeof fetch = fetch,
): Promise<MercadoPagoOrderSnapshot> {
  const amount = centsToMercadoPagoAmount(input.totalCents)
  let response: Response
  try {
    response = await fetchImplementation(MERCADO_PAGO_ORDERS_URL, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': input.idempotencyKey,
      },
      body: JSON.stringify({
        type: 'online',
        processing_mode: 'automatic',
        total_amount: amount,
        external_reference: input.externalReference,
        payer: {
          email: input.payment.payer.email,
          identification: input.payment.payer.identification,
        },
        transactions: {
          payments: [
            {
              amount,
              payment_method: {
                id: input.payment.paymentMethodId,
                type: input.payment.paymentTypeId,
                token: input.payment.token,
                installments: input.payment.installments,
              },
            },
          ],
        },
      }),
    })
  } catch {
    throw new MercadoPagoApiError(503, true, 'network_error')
  }

  const body = await readJson(response)
  if (response.ok || (response.status === 402 && body && typeof body === 'object' && 'id' in body)) {
    try {
      return toSnapshot(body)
    } catch {
      throw new MercadoPagoApiError(502, true, 'invalid_provider_response')
    }
  }

  throw new MercadoPagoApiError(
    response.status,
    isRetryableProviderStatus(response.status),
    providerErrorCode(body),
  )
}

export async function getMercadoPagoOrder(
  providerOrderId: string,
  accessToken: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<MercadoPagoOrderSnapshot> {
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(providerOrderId)) {
    throw new MercadoPagoApiError(400, false, 'invalid_order_id')
  }

  let response: Response
  try {
    response = await fetchImplementation(`${MERCADO_PAGO_ORDERS_URL}/${providerOrderId}`, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    throw new MercadoPagoApiError(503, true, 'network_error')
  }
  const body = await readJson(response)
  if (!response.ok) {
    throw new MercadoPagoApiError(response.status, isRetryableProviderStatus(response.status), providerErrorCode(body))
  }

  try {
    return toSnapshot(body)
  } catch {
    throw new MercadoPagoApiError(502, true, 'invalid_provider_response')
  }
}

export async function getMercadoPagoChargeback(
  chargebackId: string,
  accessToken: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<MercadoPagoChargebackSnapshot> {
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(chargebackId)) {
    throw new MercadoPagoApiError(400, false, 'invalid_chargeback_id')
  }

  let response: Response
  try {
    response = await fetchImplementation(`${MERCADO_PAGO_CHARGEBACKS_URL}/${chargebackId}`, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    throw new MercadoPagoApiError(503, true, 'network_error')
  }

  const body = await readJson(response)
  if (!response.ok) {
    throw new MercadoPagoApiError(response.status, isRetryableProviderStatus(response.status), providerErrorCode(body))
  }

  try {
    const chargeback = providerChargebackSchema.parse(body)
    return {
      id: chargeback.id,
      paymentIds: chargeback.payments,
      amountCents: decimalToCents(chargeback.amount),
      currency: chargeback.currency,
      statusDetail: chargeback.documentation_status ?? chargeback.reason ?? null,
    }
  } catch {
    throw new MercadoPagoApiError(502, true, 'invalid_provider_response')
  }
}
