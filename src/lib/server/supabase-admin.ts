import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CommerceServerConfig } from '@/lib/payments/env'

export function createSupabaseAdmin(config: CommerceServerConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'X-Client-Info': 'madri-commerce-server' } },
  })
}
