'use client'

import { useActionState } from 'react'
import { signIn } from './actions'

export default function AdminLoginPage() {
  const [error, formAction, pending] = useActionState(signIn, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0] px-4">
      <form action={formAction} className="w-full max-w-sm bg-white border border-[#E8E0D4] p-8">
        <h1 className="text-2xl font-semibold text-[#0A0A0A]">Painel administrativo</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Entre com seu e-mail e senha.</p>

        <label className="block mt-6 text-sm">
          E-mail
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="mt-1 w-full border border-[#D4CCBE] px-3 py-2"
          />
        </label>
        <label className="block mt-4 text-sm">
          Senha
          <input
            required
            type="password"
            name="password"
            autoComplete="current-password"
            className="mt-1 w-full border border-[#D4CCBE] px-3 py-2"
          />
        </label>

        {error ? <p role="alert" className="mt-4 text-sm text-[#B5363A]">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full mt-6 bg-[#0A0A0A] text-white px-6 py-3 text-sm font-medium disabled:opacity-60"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
