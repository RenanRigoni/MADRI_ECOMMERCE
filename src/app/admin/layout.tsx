import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin · MADRI', robots: { index: false, follow: false } }
// Every /admin page depends on the live Supabase Auth session — none of it
// can be statically prerendered at build time.
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FAF6F0] text-[#0A0A0A]">{children}</div>
}
