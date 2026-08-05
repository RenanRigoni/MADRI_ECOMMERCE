import 'server-only'

import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'product-photos'
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_BYTES = 5 * 1024 * 1024

export class ProductPhotoError extends Error {
  constructor(readonly code: 'invalid_type' | 'too_large' | 'upload_failed') {
    super('Product photo upload failed')
    this.name = 'ProductPhotoError'
  }
}

export async function uploadProductPhoto(
  client: SupabaseClient,
  productSlug: string,
  file: File,
): Promise<string> {
  const extension = ALLOWED_TYPES[file.type]
  if (!extension) throw new ProductPhotoError('invalid_type')
  if (file.size > MAX_BYTES) throw new ProductPhotoError('too_large')

  const path = `${productSlug}/${randomUUID()}.${extension}`
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw new ProductPhotoError('upload_failed')

  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
