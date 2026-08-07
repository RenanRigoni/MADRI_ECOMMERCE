import Link from 'next/link'
import { signOut } from './actions'

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="bg-white border-b border-[#E8E0D4]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/produtos" className="font-semibold">Painel MADRI</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin/produtos" className="text-[#6B7280] hover:text-[#0A0A0A]">Produtos</Link>
              <Link href="/admin/pedidos" className="text-[#6B7280] hover:text-[#0A0A0A]">Pedidos</Link>
            </nav>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm text-[#6B7280] hover:text-[#0A0A0A] underline underline-offset-4">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
