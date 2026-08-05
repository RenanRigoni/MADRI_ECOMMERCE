import 'server-only'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export class AdminAuthError extends Error {
  constructor() {
    super('Not authenticated as admin')
    this.name = 'AdminAuthError'
  }
}

/** Throws if there is no signed-in Supabase user. Call at the top of every admin Server Action. */
export async function requireAdminUser() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new AdminAuthError()
  return data.user
}
