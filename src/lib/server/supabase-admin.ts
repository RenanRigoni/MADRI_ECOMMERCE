import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CommerceServerConfig } from '@/lib/payments/env'

const DEFAULT_TIMEOUT_MS = 15_000

export function createSupabaseAdmin(config: CommerceServerConfig, timeoutMs = DEFAULT_TIMEOUT_MS): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: { 'X-Client-Info': 'madri-commerce-server' },
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) }),
    },
  })
}
