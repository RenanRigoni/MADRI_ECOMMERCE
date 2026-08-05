import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { readCommerceConfig } from '@/lib/payments/env'
import { PaymentRepository } from '@/lib/payments/repository'
import { apiJson, unavailableResponse } from '@/lib/server/api-response'
import { rateLimitKey, readGuestSession } from '@/lib/server/guest-session'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, context: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await context.params
    const id = z.uuid().parse(publicId)
    const session = readGuestSession(request, false)
    if (!session) return apiJson({ error: 'Pedido não encontrado.' }, 404)

    const repository = new PaymentRepository(createSupabaseAdmin(readCommerceConfig()))
    const allowed = await repository.consumeRateLimit(rateLimitKey(request, session.hash, 'order-status'), 30, 60)
    if (!allowed) return apiJson({ error: 'Muitas consultas. Aguarde um minuto.' }, 429)
    const order = await repository.getPublicOrder(id, session.hash)
    if (!order) return apiJson({ error: 'Pedido não encontrado.' }, 404)

    return apiJson({
      order: {
        publicOrderId: order.public_order_id,
        status: order.status,
        fulfillmentStatus: order.fulfillment_status,
        totalCents: order.total_cents,
        currency: order.currency,
        createdAt: order.created_at,
        items: order.items,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) return apiJson({ error: 'Pedido não encontrado.' }, 404)
    return unavailableResponse()
  }
}
