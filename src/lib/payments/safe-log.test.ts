import { afterEach, describe, expect, it, vi } from 'vitest'
import { logPaymentEvent } from './safe-log'

afterEach(() => vi.restoreAllMocks())

describe('logPaymentEvent', () => {
  it.each([
    ['info', 'info'],
    ['warn', 'warn'],
    ['error', 'error'],
  ] as const)('writes structured %s logs', (level, method) => {
    const spy = vi.spyOn(console, method).mockImplementation(() => undefined)
    logPaymentEvent(level, 'example', { status: 'PAID' })
    expect(spy).toHaveBeenCalledWith({ scope: 'payments', event: 'example', status: 'PAID' })
  })
})
