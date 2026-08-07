import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import type { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'madri_checkout_session'
const SESSION_PATTERN = /^[A-Za-z0-9_-]{43}$/

export interface GuestSession {
  secret: string
  hash: string
  isNew: boolean
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function readGuestSession(request: NextRequest, createIfMissing: boolean): GuestSession | null {
  const candidate = request.cookies.get(COOKIE_NAME)?.value
  if (candidate && SESSION_PATTERN.test(candidate)) {
    return { secret: candidate, hash: sha256(candidate), isNew: false }
  }
  if (!createIfMissing) return null

  const secret = randomBytes(32).toString('base64url')
  return { secret, hash: sha256(secret), isNew: true }
}

export function persistGuestSession(response: NextResponse, session: GuestSession): void {
  if (!session.isNew) return
  response.cookies.set(COOKIE_NAME, session.secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function rateLimitKey(request: NextRequest, sessionHash: string, scope: string): string {
  // The platform's edge proxy appends the real client IP as the LAST entry of
  // x-forwarded-for; every earlier entry can be forged by the client itself
  // (send your own X-Forwarded-For header with a random value and the [0]
  // entry becomes attacker-controlled, defeating the limiter entirely).
  const parts = request.headers.get('x-forwarded-for')?.split(',').map((part) => part.trim()).filter(Boolean) ?? []
  const forwardedFor = parts.length > 0 ? parts[parts.length - 1] : 'unknown'
  return sha256(`${scope}:${sessionHash}:${forwardedFor}`)
}
