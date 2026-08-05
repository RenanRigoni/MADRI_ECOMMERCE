import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { readSupabasePublicConfig, SupabaseAuthConfigurationError } from '@/lib/supabase/env'

const LOGIN_PATH = '/admin/login'

export async function proxy(request: NextRequest) {
  let config
  try {
    config = readSupabasePublicConfig()
  } catch (error) {
    if (error instanceof SupabaseAuthConfigurationError) {
      return NextResponse.json({ error: 'Painel administrativo ainda não configurado.' }, { status: 503 })
    }
    throw error
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH

  if (!data.user && !isLoginPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = LOGIN_PATH
    return NextResponse.redirect(redirectUrl)
  }
  if (data.user && isLoginPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/admin'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
