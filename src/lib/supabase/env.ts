// No 'server-only' guard: this reads NEXT_PUBLIC_* values only (already
// public by Next.js convention) and must also run in Edge Middleware.

export interface SupabasePublicConfig {
  url: string
  anonKey: string
}

export class SupabaseAuthConfigurationError extends Error {
  constructor() {
    super('Supabase auth is not configured')
    this.name = 'SupabaseAuthConfigurationError'
  }
}

export function readSupabasePublicConfig(
  environment: Record<string, string | undefined> = process.env,
): SupabasePublicConfig {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url?.trim() || !anonKey?.trim()) throw new SupabaseAuthConfigurationError()
  return { url, anonKey }
}
