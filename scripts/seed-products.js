// One-time import of the researched catalog (src/data/perfumes.json) into
// Supabase, so `public.products` becomes the single source of truth for
// both checkout and the admin panel. Safe to re-run: upserts by id.
//
// Usage (after supabase/migrations have been applied):
//   node --env-file=.env.local scripts/seed-products.js
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

const { createClient } = require('@supabase/supabase-js')
const perfumes = require('../src/data/perfumes.json')

function priceCents(price) {
  if (!price || price <= 0) return null
  return Math.round(price * 100)
}

function computeName(p) {
  const parts = [p.marca, p.nome, p.versao].filter(Boolean)
  const base = parts.join(' ')
  return p.volumeMl ? `${base} ${p.volumeMl}ml` : base
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.')
    process.exit(1)
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } })

  const rows = perfumes.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: computeName(p),
    brand: p.marca,
    product_name: p.nome,
    product_line: p.linha,
    version: p.versao,
    concentration: p.concentracao,
    volume_ml: p.volumeMl,
    gender: p.genero,
    product_type: p.tipoProduto,
    price_cents: priceCents(p.price),
    discount_percent: p.discount,
    currency: 'BRL',
    active: priceCents(p.price) !== null,
    stock_on_hand: p.stock ?? 0,
    is_new: Boolean(p.isNew),
    is_best_seller: Boolean(p.isBestSeller),
    is_giftable: Boolean(p.isGiftable),
    fragrance_family: p.fragranceFamily,
    fragrance_family_label: p.fragranceFamilyLabel,
    notes_top: p.notesTop ?? [],
    notes_heart: p.notesHeart ?? [],
    notes_base: p.notesBase ?? [],
    style_tags: p.profile ?? [],
    intensity: p.intensity,
    occasion: p.occasion ?? [],
    short_description: p.shortDescription,
    description: p.description,
    meta_title: p.metaTitle,
    meta_description: p.metaDescription,
    images: p.imagens ?? [],
    research_verified: Boolean(p.pesquisaConfirmada),
  }))

  const batchSize = 50
  let imported = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error(`Falha no lote ${i}-${i + batch.length}:`, error.message)
      process.exit(1)
    }
    imported += batch.length
    console.log(`Importados ${imported}/${rows.length}`)
  }

  console.log('Seed concluído. Lembre-se: preços vieram do JSON (muitos ainda são 0 / produto inativo até a dona definir o preço real no painel admin.')
}

main()
