import 'server-only'

import type { NextRequest } from 'next/server'

export class InvalidRequestError extends Error {
  constructor(readonly code: 'origin' | 'content_type' | 'body_too_large' | 'invalid_json') {
    super('Invalid request')
    this.name = 'InvalidRequestError'
  }
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get('origin')
  const fetchSite = request.headers.get('sec-fetch-site')
  if (origin) {
    let parsedOrigin: URL
    try {
      parsedOrigin = new URL(origin)
    } catch {
      throw new InvalidRequestError('origin')
    }
    const expectedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host
    const expectedProtocol = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
    if (parsedOrigin.host !== expectedHost || parsedOrigin.protocol !== `${expectedProtocol}:`) {
      throw new InvalidRequestError('origin')
    }
    return
  }
  if (fetchSite === 'same-origin') return
  throw new InvalidRequestError('origin')
}

export async function readJsonBody(request: NextRequest, maxBytes = 16_384): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.startsWith('application/json')) throw new InvalidRequestError('content_type')

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new InvalidRequestError('body_too_large')
  }

  const body = await request.text()
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new InvalidRequestError('body_too_large')
  }

  try {
    return JSON.parse(body)
  } catch {
    throw new InvalidRequestError('invalid_json')
  }
}
