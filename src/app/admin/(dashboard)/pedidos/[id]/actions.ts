'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { updateOrderFulfillment } from '@/lib/admin/orders'

const nextStatusSchema = z.enum(['SEPARATING', 'PACKED', 'FULFILLED', 'DELIVERED'])

export async function advanceFulfillmentStatus(id: number, next: string): Promise<void> {
  await requireAdminUser()
  const parsed = nextStatusSchema.parse(next)
  const supabase = createSupabaseAdmin(readCommerceConfig())
  await updateOrderFulfillment(supabase, id, parsed)
  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${id}`)
}
