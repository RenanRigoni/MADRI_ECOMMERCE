import { describe, expect, it } from 'vitest'
import {
  CommerceConfigurationError,
  PaymentConfigurationError,
  readCommerceConfig,
  readCheckoutConfig,
  readMercadoPagoConfig,
} from './env'

describe('readMercadoPagoConfig', () => {
  it('does not fail until a payment-related operation requests configuration', () => {
    expect(() => readMercadoPagoConfig({}, 'payment')).toThrow(PaymentConfigurationError)
  })

  it('never reveals which secret is missing', () => {
    try {
      readMercadoPagoConfig({}, 'webhook')
    } catch (error) {
      expect(error).toBeInstanceOf(PaymentConfigurationError)
      expect(String(error)).not.toMatch(/ACCESS_TOKEN|WEBHOOK_SECRET|SUPABASE/i)
    }
  })

  it('loads server credentials only for the requested payment operation', () => {
    const config = readMercadoPagoConfig(
      {
        MERCADO_PAGO_ACCESS_TOKEN: 'TEST-server-access-token',
        MERCADO_PAGO_WEBHOOK_SECRET: 'server-webhook-secret',
        MERCADO_PAGO_MODE: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'server-service-role',
      },
      'webhook',
    )

    expect(config.accessToken).toBe('TEST-server-access-token')
    expect(config.webhookSecret).toBe('server-webhook-secret')
  })

  it('requires an explicit server-side activation flag before accepting payments', () => {
    expect(() =>
      readMercadoPagoConfig(
        {
          MERCADO_PAGO_ACCESS_TOKEN: 'TEST-server-access-token',
          MERCADO_PAGO_MODE: 'test',
          NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'server-service-role',
        },
        'payment',
      ),
    ).toThrow(PaymentConfigurationError)
  })

  it('loads payment configuration when test payments are explicitly enabled', () => {
    const config = readMercadoPagoConfig(
      {
        MERCADO_PAGO_ACCESS_TOKEN: 'TEST-server-access-token',
        MERCADO_PAGO_MODE: 'test',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'server-service-role',
        MERCADO_PAGO_PAYMENTS_ENABLED: 'true',
      },
      'payment',
    )

    expect(config.mode).toBe('test')
  })

  it('fails closed when the declared mode does not match the credential class', () => {
    const base = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'server-service-role',
      MERCADO_PAGO_PAYMENTS_ENABLED: 'true',
    }
    expect(() => readMercadoPagoConfig({
      ...base, MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-production-token', MERCADO_PAGO_MODE: 'test',
    }, 'payment')).toThrow(PaymentConfigurationError)
    expect(() => readMercadoPagoConfig({
      ...base, MERCADO_PAGO_ACCESS_TOKEN: 'TEST-sandbox-token', MERCADO_PAGO_MODE: 'production',
      MERCADO_PAGO_ENABLE_PRODUCTION: 'true',
    }, 'payment')).toThrow(PaymentConfigurationError)
  })

  it('requires both production activation flags for a production payment', () => {
    const environment = {
      MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-production-token',
      MERCADO_PAGO_MODE: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'server-service-role',
      MERCADO_PAGO_PAYMENTS_ENABLED: 'true',
    }
    expect(() => readMercadoPagoConfig(environment, 'payment')).toThrow(PaymentConfigurationError)
    expect(readMercadoPagoConfig({
      ...environment, MERCADO_PAGO_ENABLE_PRODUCTION: 'true',
    }, 'payment').mode).toBe('production')
  })
})

describe('readCommerceConfig', () => {
  it('does not require Mercado Pago credentials for a server-side quote', () => {
    expect(
      readCommerceConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'server-service-role',
      }),
    ).toEqual({
      supabaseUrl: 'https://project.supabase.co',
      supabaseServiceRoleKey: 'server-service-role',
    })
  })

  it('fails closed without disclosing a specific variable', () => {
    expect(() => readCommerceConfig({})).toThrow(CommerceConfigurationError)
    expect(String(new CommerceConfigurationError())).not.toMatch(/SUPABASE|SERVICE_ROLE/i)
  })
})

describe('readCheckoutConfig', () => {
  it('requires an explicit authoritative shipping amount, including explicit free shipping', () => {
    const base = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'server-service-role',
    }
    expect(() => readCheckoutConfig(base)).toThrow(CommerceConfigurationError)
    expect(readCheckoutConfig({ ...base, CHECKOUT_SHIPPING_CENTS: '0' }).shippingCents).toBe(0)
    expect(readCheckoutConfig({ ...base, CHECKOUT_SHIPPING_CENTS: '1590' }).shippingCents).toBe(1590)
  })
})
