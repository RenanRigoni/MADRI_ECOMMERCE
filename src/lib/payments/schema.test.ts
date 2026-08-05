import { describe, expect, it } from 'vitest'
import { paymentRequestSchema, quoteRequestSchema } from './schema'

const validCustomer = {
  name: 'Maria da Silva',
  email: 'maria@example.com',
  phone: '11999999999',
  address: {
    postalCode: '01310100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: '',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
}

const validRequest = {
  publicOrderId: '5d178c97-4da8-44f1-b5af-00d3a43dce9d',
  attemptId: 'b94e8722-77ac-4e45-8310-885c3c8d6244',
  payment: {
    token: 'card-token-generated-by-mercado-pago',
    paymentMethodId: 'master',
    paymentTypeId: 'credit_card',
    installments: 1,
    payer: {
      identification: { type: 'CPF', number: '12345678909' },
    },
  },
}

describe('paymentRequestSchema', () => {
  it('accepts only the minimum tokenized card payload', () => {
    expect(paymentRequestSchema.safeParse(validRequest).success).toBe(true)
  })

  it('does not accept a browser-supplied price or total', () => {
    expect(paymentRequestSchema.safeParse({ ...validRequest, total: 1 }).success).toBe(false)
    expect(
      quoteRequestSchema.safeParse({
        items: [{ productId: 'priced-product', quantity: 1 }],
        customer: validCustomer,
        transactionAmount: 1,
      }).success,
    ).toBe(false)
  })

  it.each(['card_number', 'cvv', 'security_code', 'expiration_date']) (
    'rejects forbidden raw card field %s',
    (field) => {
      const payload = structuredClone(validRequest)
      Object.assign(payload.payment, { [field]: 'sensitive' })
      expect(paymentRequestSchema.safeParse(payload).success).toBe(false)
    },
  )

  it('bounds cart size and quantity', () => {
    const tooManyItems = Array.from({ length: 21 }, (_, index) => ({
      productId: `product-${index}`,
      quantity: 1,
    }))

    expect(quoteRequestSchema.safeParse({ items: tooManyItems, customer: validCustomer }).success).toBe(false)
    expect(
      quoteRequestSchema.safeParse({
        items: [{ productId: 'product', quantity: 11 }],
        customer: validCustomer,
      }).success,
    ).toBe(false)
  })
})
