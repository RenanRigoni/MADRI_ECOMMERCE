import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { quoteRequestSchema } from '@/lib/payments/schema'
import { CommerceConfigurationError, readCheckoutConfig } from '@/lib/payments/env'
import { PaymentPersistenceError, PaymentRepository } from '@/lib/payments/repository'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { assertSameOrigin, InvalidRequestError, readJsonBody } from '@/lib/server/http'
import { persistGuestSession, rateLimitKey, readGuestSession } from '@/lib/server/guest-session'
import { apiJson, unavailableResponse } from '@/lib/server/api-response'
import { logPaymentEvent } from '@/lib/payments/safe-log'

export const runtime = 'nodejs'

function quoteFailure(error: unknown) {
  if (error instanceof InvalidRequestError) {
    if (error.code === 'origin') return apiJson({ error: 'Origem da requisição não autorizada.' }, 403)
    return apiJson({ error: 'Requisição inválida.' }, error.code === 'body_too_large' ? 413 : 400)
  }
  if (error instanceof z.ZodError) return apiJson({ error: 'Revise os dados do carrinho e da entrega.' }, 400)
  if (error instanceof CommerceConfigurationError) {
    logPaymentEvent('warn', 'checkout_configuration_unavailable')
    return unavailableResponse()
  }
  if (error instanceof PaymentPersistenceError) {
    if (error.code === 'out_of_stock') return apiJson({ error: 'Um item não possui estoque suficiente.' }, 409)
    if (error.code === 'unknown_product' || error.code === 'product_not_priced') {
      return apiJson({ error: 'Um item está indisponível para compra.' }, 409)
    }
    if (error.code === 'duplicate_product') return apiJson({ error: 'O carrinho contém itens duplicados.' }, 400)
  }
  logPaymentEvent('error', 'checkout_quote_failed')
  return unavailableResponse()
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request)
    const input = quoteRequestSchema.parse(await readJsonBody(request))
    const session = readGuestSession(request, true)
    if (!session) return unavailableResponse()

    const config = readCheckoutConfig()
    const repository = new PaymentRepository(createSupabaseAdmin(config))
    const allowed = await repository.consumeRateLimit(rateLimitKey(request, 'ip-scoped', 'quote'), 30, 60)
    if (!allowed) return apiJson({ error: 'Muitas tentativas. Aguarde um minuto.' }, 429)

    const quote = await repository.createQuote(session.hash, input, config.shippingCents)
    const response = apiJson({ quote })
    persistGuestSession(response, session)
    return response
  } catch (error) {
    return quoteFailure(error)
  }
}
