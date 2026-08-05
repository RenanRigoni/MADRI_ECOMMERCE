import { describe, expect, it } from 'vitest'
import { productFormSchema, slugify } from './schema'

const validInput = {
  brand: 'Lattafa',
  productName: 'Asad',
  version: 'Elixir',
  volumeMl: '100',
  gender: 'masculino',
  productType: 'Perfume',
  priceReais: '129.90',
  discountPercent: '',
  stock: '5',
  weightGrams: '350',
  heightCm: '18',
  widthCm: '10',
  lengthCm: '8',
  active: true,
  shortDescription: 'Um oriental intenso.',
  description: '',
  fragranceFamily: 'oriental',
  keepImages: [],
}

describe('productFormSchema', () => {
  it('accepts a complete valid product', () => {
    const result = productFormSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priceReais).toBe(129.9)
      expect(result.data.volumeMl).toBe(100)
    }
  })

  it('rejects missing brand or product name', () => {
    expect(productFormSchema.safeParse({ ...validInput, brand: '' }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...validInput, productName: '' }).success).toBe(false)
  })

  it('rejects zero or negative price', () => {
    expect(productFormSchema.safeParse({ ...validInput, priceReais: '0' }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...validInput, priceReais: '-5' }).success).toBe(false)
  })

  it('rejects negative stock', () => {
    expect(productFormSchema.safeParse({ ...validInput, stock: '-1' }).success).toBe(false)
  })

  it('rejects missing or zero shipping dimensions', () => {
    expect(productFormSchema.safeParse({ ...validInput, weightGrams: '' }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...validInput, heightCm: '0' }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...validInput, widthCm: '' }).success).toBe(false)
    expect(productFormSchema.safeParse({ ...validInput, lengthCm: '-2' }).success).toBe(false)
  })

  it('rejects discount outside 0-100', () => {
    expect(productFormSchema.safeParse({ ...validInput, discountPercent: '150' }).success).toBe(false)
  })

  it('treats optional empty fields as undefined instead of failing validation', () => {
    const result = productFormSchema.safeParse({ ...validInput, version: '', volumeMl: '', discountPercent: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.version).toBeUndefined()
      expect(result.data.volumeMl).toBeUndefined()
    }
  })
})

describe('slugify', () => {
  it('lowercases, strips accents and joins words with dashes', () => {
    expect(slugify('Lattafa Asad Elixir')).toBe('lattafa-asad-elixir')
    expect(slugify('Água de Cheiro Nº 1')).toBe('agua-de-cheiro-n-1')
  })

  it('collapses repeated separators and trims leading/trailing dashes', () => {
    expect(slugify('  Rosé   --  Noir!!  ')).toBe('rose-noir')
  })
})
