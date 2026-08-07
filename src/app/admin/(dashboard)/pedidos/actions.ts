'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { setAdminOrderFulfilled } from '@/lib/admin/orders'

export async function markOrderFulfilled(id: number): Promise<void> {
  await requireAdminUser()
  const supabase = createSupabaseAdmin(readCommerceConfig())
  await setAdminOrderFulfilled(supabase, id)
  revalidatePath('/admin/pedidos')
}
