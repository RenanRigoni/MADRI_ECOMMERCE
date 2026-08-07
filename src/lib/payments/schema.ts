import { z } from 'zod'
import { MAX_CART_ITEMS, MAX_ITEM_QUANTITY } from '@/lib/checkout/quote'

const productIdSchema = z.string().min(1).max(160).regex(/^[A-Za-z0-9_-]+$/)

export const cartItemSchema = z
  .object({
    productId: productIdSchema,
    quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
  })
  .strict()

const addressSchema = z
  .object({
    postalCode: z.string().regex(/^\d{8}$/),
    street: z.string().trim().min(2).max(120),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(80).optional().default(''),
    neighborhood: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    state: z.string().regex(/^[A-Z]{2}$/),
  })
  .strict()

const customerSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    email: z.email().max(254),
    phone: z.string().trim().regex(/^[0-9()+\-\s]{8,20}$/),
    address: addressSchema,
  })
  .strict()

export const quoteRequestSchema = z
  .object({
    items: z.array(cartItemSchema).min(1).max(MAX_CART_ITEMS),
    customer: customerSchema,
  })
  .strict()

const payerSchema = z
  .object({
    identification: z
      .object({
        type: z.enum(['CPF', 'CNPJ']),
        number: z.string().regex(/^\d{11,14}$/),
      })
      .strict(),
  })
  .strict()

const cardPaymentSchema = z
  .object({
    paymentTypeId: z.enum(['credit_card', 'debit_card']),
    token: z.string().min(1).max(512),
    paymentMethodId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
    installments: z.number().int().min(1).max(24),
    payer: payerSchema,
  })
  .strict()

const pixPaymentSchema = z
  .object({
    paymentTypeId: z.literal('bank_transfer'),
    paymentMethodId: z.literal('pix'),
    payer: payerSchema,
  })
  .strict()

const tokenizedPaymentSchema = z.discriminatedUnion('paymentTypeId', [cardPaymentSchema, pixPaymentSchema])

export const paymentRequestSchema = z
  .object({
    publicOrderId: z.uuid(),
    attemptId: z.uuid(),
    payment: tokenizedPaymentSchema,
  })
  .strict()

const publicMoneySchema = z.number().int().nonnegative().safe()
const publicQuoteItemSchema = z
  .object({
    productId: productIdSchema,
    name: z.string().min(1).max(240),
    quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
    unitPriceCents: publicMoneySchema.positive(),
    lineTotalCents: publicMoneySchema.positive(),
  })
  .strict()

export const checkoutQuoteSchema = z
  .object({
    publicOrderId: z.uuid(),
    items: z.array(publicQuoteItemSchema).min(1).max(MAX_CART_ITEMS),
    subtotalCents: publicMoneySchema.positive(),
    shippingCents: publicMoneySchema,
    totalCents: publicMoneySchema.positive(),
    currency: z.literal('BRL'),
    expiresAt: z.string().min(1).max(80),
  })
  .strict()

export const publicOrderSchema = z
  .object({
    publicOrderId: z.uuid(),
    status: z.enum([
      'PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED', 'REFUNDED',
      'PARTIALLY_REFUNDED', 'EXPIRED', 'CHARGEBACK', 'FAILED', 'UNKNOWN',
    ]),
    fulfillmentStatus: z.enum(['NOT_READY', 'READY', 'FULFILLED', 'REVIEW_REQUIRED']),
    totalCents: publicMoneySchema.positive(),
    currency: z.literal('BRL'),
    createdAt: z.string().min(1).max(80),
    items: z.array(publicQuoteItemSchema).min(1).max(MAX_CART_ITEMS),
  })
  .strict()

export type QuoteRequest = z.infer<typeof quoteRequestSchema>
export type PaymentRequest = z.infer<typeof paymentRequestSchema>
export type CheckoutQuoteResponse = z.infer<typeof checkoutQuoteSchema>
export type PublicOrderResponse = z.infer<typeof publicOrderSchema>
