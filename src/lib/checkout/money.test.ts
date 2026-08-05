import { describe, expect, it } from 'vitest'
import {
  applyPercentageDiscount,
  centsToMercadoPagoAmount,
  decimalToCents,
} from './money'

describe('money', () => {
  it('converts catalog decimal values to integer cents at the boundary', () => {
    expect(decimalToCents(129.9)).toBe(12_990)
    expect(decimalToCents('129.90')).toBe(12_990)
  })

  it('rejects invalid or unsafe monetary values', () => {
    expect(() => decimalToCents(Number.NaN)).toThrow()
    expect(() => decimalToCents(-1)).toThrow()
    expect(() => decimalToCents('12.999')).toThrow()
  })

  it('applies percentage discounts using integer arithmetic', () => {
    expect(applyPercentageDiscount(10_000, 15)).toBe(8_500)
    expect(applyPercentageDiscount(9_999, 5)).toBe(9_499)
  })

  it('formats cents as the decimal string required by Orders API', () => {
    expect(centsToMercadoPagoAmount(12_990)).toBe('129.90')
  })
})
