import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductFormInput } from './schema'

export interface AdminProductRow {
  id: string
  slug: string | null
  brand: string | null
  product_name: string | null
  version: string | null
  volume_ml: number | null
  gender: string | null
  product_type: string
  name: string
  price_cents: number | null
  discount_percent: number | null
  stock_on_hand: number
  weight_grams: number | null
  height_cm: number | null
  width_cm: number | null
  length_cm: number | null
  active: boolean
  short_description: string | null
  description: string | null
  fragrance_family: string | null
  images: string[]
  created_at: string
}

const ADMIN_COLUMNS = `
  id, slug, brand, product_name, version, volume_ml, gender, product_type, name,
  price_cents, discount_percent, stock_on_hand, weight_grams, height_cm, width_cm,
  length_cm, active, short_description, description, fragrance_family, images, created_at
`

export class AdminProductError extends Error {
  constructor(readonly code: 'not_found' | 'slug_taken' | 'persistence_failure') {
    super('Admin product operation failed')
    this.name = 'AdminProductError'
  }
}

export async function listAdminProducts(client: SupabaseClient): Promise<AdminProductRow[]> {
  const { data, error } = await client
    .from('products')
    .select(ADMIN_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw new AdminProductError('persistence_failure')
  return (data ?? []) as unknown as AdminProductRow[]
}

export async function getAdminProduct(client: SupabaseClient, id: string): Promise<AdminProductRow | null> {
  const { data, error } = await client.from('products').select(ADMIN_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new AdminProductError('persistence_failure')
  return data as unknown as AdminProductRow | null
}

async function findAvailableSlug(client: SupabaseClient, baseSlug: string): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
    const { data, error } = await client.from('products').select('id').eq('slug', candidate).maybeSingle()
    if (error) throw new AdminProductError('persistence_failure')
    if (!data) return candidate
  }
  throw new AdminProductError('slug_taken')
}

function computeDisplayName(input: ProductFormInput): string {
  const parts = [input.brand, input.productName, input.version].filter(Boolean)
  const base = parts.join(' ')
  return input.volumeMl ? `${base} ${input.volumeMl}ml` : base
}

function toWriteRow(input: ProductFormInput, images: string[]) {
  return {
    brand: input.brand,
    product_name: input.productName,
    version: input.version ?? null,
    volume_ml: input.volumeMl ?? null,
    gender: input.gender,
    product_type: input.productType,
    name: computeDisplayName(input),
    price_cents: Math.round(input.priceReais * 100),
    discount_percent: input.discountPercent ?? null,
    stock_on_hand: input.stock,
    weight_grams: input.weightGrams,
    height_cm: input.heightCm,
    width_cm: input.widthCm,
    length_cm: input.lengthCm,
    active: input.active,
    short_description: input.shortDescription ?? null,
    description: input.description ?? null,
    fragrance_family: input.fragranceFamily ?? null,
    images,
  }
}

export async function createAdminProduct(
  client: SupabaseClient,
  input: ProductFormInput,
  slugBase: string,
  images: string[],
): Promise<string> {
  const slug = await findAvailableSlug(client, slugBase)
  const { error } = await client.from('products').insert({
    id: slug,
    slug,
    ...toWriteRow(input, images),
  })
  if (error) throw new AdminProductError('persistence_failure')
  return slug
}

export async function updateAdminProduct(
  client: SupabaseClient,
  id: string,
  input: ProductFormInput,
  images: string[],
): Promise<void> {
  const { error, count } = await client
    .from('products')
    .update(toWriteRow(input, images), { count: 'exact' })
    .eq('id', id)
  if (error) throw new AdminProductError('persistence_failure')
  if (!count) throw new AdminProductError('not_found')
}

export async function setAdminProductActive(client: SupabaseClient, id: string, active: boolean): Promise<void> {
  const { error, count } = await client
    .from('products')
    .update({ active }, { count: 'exact' })
    .eq('id', id)
  if (error) throw new AdminProductError('persistence_failure')
  if (!count) throw new AdminProductError('not_found')
}
