import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { assertSameOrigin, InvalidRequestError, readJsonBody } from './http'

describe('HTTP request protection', () => {
  it('accepts a matching forwarded production origin', () => {
    const request = new NextRequest('http://internal:3000/api/payment', { headers: {
      origin: 'https://shop.example.com',
      host: 'internal:3000',
      'x-forwarded-host': 'shop.example.com',
      'x-forwarded-proto': 'https',
    } })
    expect(() => assertSameOrigin(request)).not.toThrow()
  })

  it('rejects cross-origin and malformed origins', () => {
    for (const origin of ['https://attacker.invalid', 'not a url']) {
      const request = new NextRequest('https://shop.example.com/api/payment', { headers: { origin } })
      expect(() => assertSameOrigin(request)).toThrow(InvalidRequestError)
    }
  })

  it('parses bounded JSON and rejects invalid bodies', async () => {
    const valid = new NextRequest('https://shop.example.com/api', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"ok":true}',
    })
    await expect(readJsonBody(valid)).resolves.toEqual({ ok: true })

    const invalid = new NextRequest('https://shop.example.com/api', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
    })
    await expect(readJsonBody(invalid)).rejects.toMatchObject({ code: 'invalid_json' })
  })
})
