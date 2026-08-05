const DECIMAL_MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/

export function decimalToCents(value: number | string): number {
  if (typeof value === 'string') {
    if (!DECIMAL_MONEY_PATTERN.test(value)) {
      throw new Error('Invalid monetary value')
    }

    const [whole, fraction = ''] = value.split('.')
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
    if (!Number.isSafeInteger(cents)) {
      throw new Error('Unsafe monetary value')
    }
    return cents
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Invalid monetary value')
  }

  const scaled = value * 100
  const cents = Math.round(scaled)
  if (!Number.isSafeInteger(cents) || Math.abs(scaled - cents) > 1e-7) {
    throw new Error('Monetary value has more than two decimal places')
  }
  return cents
}

export function applyPercentageDiscount(cents: number, percentage: number | null): number {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error('Invalid cents value')
  }
  if (percentage === null) return cents
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error('Invalid discount percentage')
  }
  return Math.round((cents * (100 - percentage)) / 100)
}

export function centsToMercadoPagoAmount(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error('Invalid cents value')
  }
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

export function formatBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}
