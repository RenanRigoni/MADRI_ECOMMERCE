'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { productFormSchema, slugify } from '@/lib/admin/schema'
import { createAdminProduct, getAdminProduct, setAdminProductActive, updateAdminProduct } from '@/lib/admin/products'
import { uploadProductPhoto } from '@/lib/admin/storage'

function revalidateStorefront(slug?: string) {
  revalidatePath('/')
  revalidatePath('/produtos')
  if (slug) revalidatePath(`/produtos/${slug}`)
}

export async function saveProduct(_prevState: string | null, formData: FormData): Promise<string | null> {
  await requireAdminUser()

  const keepImages = formData.getAll('keepImages').map(String)
  const parsed = productFormSchema.safeParse({
    id: formData.get('id') ?? undefined,
    brand: formData.get('brand'),
    productName: formData.get('productName'),
    version: formData.get('version'),
    volumeMl: formData.get('volumeMl'),
    gender: formData.get('gender'),
    productType: formData.get('productType'),
    priceReais: formData.get('priceReais'),
    discountPercent: formData.get('discountPercent'),
    stock: formData.get('stock'),
    weightGrams: formData.get('weightGrams'),
    heightCm: formData.get('heightCm'),
    widthCm: formData.get('widthCm'),
    lengthCm: formData.get('lengthCm'),
    active: formData.get('active') === 'on',
    shortDescription: formData.get('shortDescription'),
    description: formData.get('description'),
    fragranceFamily: formData.get('fragranceFamily'),
    keepImages,
  })

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? 'Revise os dados do produto.'
  }
  const input = parsed.data

  const config = readCommerceConfig()
  const supabase = createSupabaseAdmin(config)

  const photoFiles = formData.getAll('photos').filter((value): value is File => value instanceof File && value.size > 0)
  if (keepImages.length + photoFiles.length > 6) {
    return 'No máximo 6 fotos por produto.'
  }

  let editingSlug: string | undefined
  if (input.id) {
    const existing = await getAdminProduct(supabase, input.id)
    if (!existing) return 'Produto não encontrado.'
    editingSlug = existing.slug ?? existing.id
  }

  const uploadedUrls: string[] = []
  try {
    for (const file of photoFiles) {
      uploadedUrls.push(await uploadProductPhoto(supabase, editingSlug ?? slugify(`${input.brand} ${input.productName}`), file))
    }
  } catch {
    return 'Não foi possível enviar uma das fotos. Use JPG, PNG ou WEBP de até 5MB.'
  }

  const images = [...input.keepImages, ...uploadedUrls]

  try {
    if (input.id) {
      await updateAdminProduct(supabase, input.id, input, images)
      revalidateStorefront(editingSlug)
    } else {
      const baseSlug = slugify(`${input.brand} ${input.productName} ${input.version ?? ''}`)
      const slug = await createAdminProduct(supabase, input, baseSlug, images)
      revalidateStorefront(slug)
    }
  } catch {
    return 'Não foi possível salvar o produto. Tente novamente.'
  }

  redirect('/admin/produtos')
}

export async function toggleProductActive(id: string, nextActive: boolean): Promise<void> {
  await requireAdminUser()
  const supabase = createSupabaseAdmin(readCommerceConfig())
  const product = await getAdminProduct(supabase, id)
  await setAdminProductActive(supabase, id, nextActive)
  revalidateStorefront(product?.slug ?? undefined)
}
