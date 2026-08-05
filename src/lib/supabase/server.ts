import 'server-only'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { readSupabasePublicConfig } from './env'

/** Session-aware Supabase client for Server Components, Route Handlers and Server Actions. */
export async function createSupabaseServerClient() {
  const { url, anonKey } = readSupabasePublicConfig()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component render — the middleware already
          // refreshes the session cookie on the next request.
        }
      },
    },
  })
}

/** Returns the signed-in admin user, or null. Never throws on missing config. */
export async function getAdminUser() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    return data.user
  } catch {
    return null
  }
}
