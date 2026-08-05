import 'server-only'

import { NextResponse } from 'next/server'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export function apiJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS })
}

export function unavailableResponse(): NextResponse {
  return apiJson({ error: 'Serviço temporariamente indisponível. Tente novamente em instantes.' }, 503)
}
