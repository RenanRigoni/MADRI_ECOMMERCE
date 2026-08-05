import { z } from 'zod'

export const GENDERS = ['feminino', 'masculino', 'unissex'] as const
export const PRODUCT_TYPES = ['Perfume', 'Body Splash', 'Hidratante', 'Perfume Mist'] as const
export const FRAGRANCE_FAMILIES = [
  'floral', 'amadeirado', 'citrico', 'oriental', 'frutal', 'aromatico', 'gourmand', 'musk',
] as const

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

export const productFormSchema = z.object({
  id: z.string().trim().max(160).optional(),
  brand: z.string().trim().min(1, 'Informe a marca').max(80),
  productName: z.string().trim().min(1, 'Informe o nome do produto').max(120),
  version: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  volumeMl: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive('Volume precisa ser maior que zero').optional(),
  ),
  gender: z.enum(GENDERS),
  productType: z.enum(PRODUCT_TYPES),
  priceReais: z.coerce.number().positive('Preço precisa ser maior que zero'),
  discountPercent: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).max(100).optional(),
  ),
  stock: z.coerce.number().int().min(0, 'Estoque não pode ser negativo'),
  weightGrams: z.coerce.number().int().positive('Peso precisa ser maior que zero'),
  heightCm: z.coerce.number().int().positive('Altura precisa ser maior que zero'),
  widthCm: z.coerce.number().int().positive('Largura precisa ser maior que zero'),
  lengthCm: z.coerce.number().int().positive('Profundidade precisa ser maior que zero'),
  active: z.coerce.boolean(),
  isFeatured: z.coerce.boolean(),
  isNewArrival: z.coerce.boolean(),
  shortDescription: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(4000).optional()),
  fragranceFamily: z.preprocess(emptyToUndefined, z.enum(FRAGRANCE_FAMILIES).optional()),
  keepImages: z.array(z.string().url()).default([]),
})

export type ProductFormInput = z.infer<typeof productFormSchema>

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140)
}
