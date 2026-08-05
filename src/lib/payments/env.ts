import 'server-only'

export type MercadoPagoOperation = 'payment' | 'webhook'
export type MercadoPagoMode = 'test' | 'production'

export interface MercadoPagoServerConfig {
  accessToken: string
  webhookSecret?: string
  supabaseUrl: string
  supabaseServiceRoleKey: string
  mode: MercadoPagoMode
}

export interface CommerceServerConfig {
  supabaseUrl: string
  supabaseServiceRoleKey: string
}

export interface CheckoutServerConfig extends CommerceServerConfig {
  shippingCents: number
}

export class PaymentConfigurationError extends Error {
  constructor() {
    super('Payment service is not configured')
    this.name = 'PaymentConfigurationError'
  }
}

export class CommerceConfigurationError extends Error {
  constructor() {
    super('Commerce service is not configured')
    this.name = 'CommerceConfigurationError'
  }
}

function configured(value: string | undefined): value is string {
  return Boolean(value?.trim())
}

function tokenMatchesMode(accessToken: string, mode: MercadoPagoMode): boolean {
  return mode === 'test' ? accessToken.startsWith('TEST-') : accessToken.startsWith('APP_USR-')
}

export function readMercadoPagoConfig(
  environment: Record<string, string | undefined> = process.env,
  operation: MercadoPagoOperation,
): MercadoPagoServerConfig {
  const accessToken = environment.MERCADO_PAGO_ACCESS_TOKEN
  const webhookSecret = environment.MERCADO_PAGO_WEBHOOK_SECRET
  let commerceConfig: CommerceServerConfig
  try {
    commerceConfig = readCommerceConfig(environment)
  } catch {
    throw new PaymentConfigurationError()
  }
  const mode = environment.MERCADO_PAGO_MODE

  const invalidBaseConfig =
    !configured(accessToken) ||
    (mode !== 'test' && mode !== 'production') ||
    (configured(accessToken) && (mode === 'test' || mode === 'production') && !tokenMatchesMode(accessToken, mode))

  const productionNotExplicitlyEnabled =
    operation === 'payment' && mode === 'production' && environment.MERCADO_PAGO_ENABLE_PRODUCTION !== 'true'
  const paymentsNotExplicitlyEnabled =
    operation === 'payment' && environment.MERCADO_PAGO_PAYMENTS_ENABLED !== 'true'

  if (
    invalidBaseConfig ||
    productionNotExplicitlyEnabled ||
    paymentsNotExplicitlyEnabled ||
    (operation === 'webhook' && !configured(webhookSecret))
  ) {
    throw new PaymentConfigurationError()
  }

  return {
    accessToken,
    webhookSecret: configured(webhookSecret) ? webhookSecret : undefined,
    ...commerceConfig,
    mode,
  }
}

export function readCommerceConfig(
  environment: Record<string, string | undefined> = process.env,
): CommerceServerConfig {
  const supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY

  if (!configured(supabaseUrl) || !configured(supabaseServiceRoleKey)) {
    throw new CommerceConfigurationError()
  }

  return { supabaseUrl, supabaseServiceRoleKey }
}

export function readCheckoutConfig(
  environment: Record<string, string | undefined> = process.env,
): CheckoutServerConfig {
  const commerce = readCommerceConfig(environment)
  const rawShippingCents = environment.CHECKOUT_SHIPPING_CENTS
  if (!rawShippingCents || !/^\d{1,9}$/.test(rawShippingCents)) {
    throw new CommerceConfigurationError()
  }
  const shippingCents = Number(rawShippingCents)
  if (!Number.isSafeInteger(shippingCents)) throw new CommerceConfigurationError()
  return { ...commerce, shippingCents }
}
