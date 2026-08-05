'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function signIn(_prevState: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return 'Preencha e-mail e senha.'

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return 'E-mail ou senha incorretos.'

  redirect('/admin')
}
