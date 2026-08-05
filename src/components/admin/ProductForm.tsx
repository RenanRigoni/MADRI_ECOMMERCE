'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { saveProduct } from '@/app/admin/(dashboard)/produtos/actions'
import { FRAGRANCE_FAMILIES, GENDERS, PRODUCT_TYPES } from '@/lib/admin/schema'
import type { AdminProductRow } from '@/lib/admin/products'

const familyLabels: Record<string, string> = {
  floral: 'Floral', amadeirado: 'Amadeirado', citrico: 'Cítrico', oriental: 'Oriental',
  frutal: 'Frutal', aromatico: 'Aromático', gourmand: 'Gourmand', musk: 'Musk',
}
const genderLabels: Record<string, string> = { feminino: 'Feminino', masculino: 'Masculino', unissex: 'Unissex' }

const inputClass = 'mt-1 w-full border border-[#D4CCBE] px-3 py-2 bg-white'
const labelClass = 'block text-sm'

export default function ProductForm({ product }: { product?: AdminProductRow }) {
  const [error, formAction, pending] = useActionState(saveProduct, null)
  const [keptImages, setKeptImages] = useState<string[]>(product?.images ?? [])

  return (
    <form action={formAction} className="max-w-2xl">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      {keptImages.map((url) => (
        <input key={url} type="hidden" name="keepImages" value={url} />
      ))}

      <div className="grid sm:grid-cols-2 gap-4">
        <label className={labelClass}>
          Marca *
          <input required name="brand" defaultValue={product?.brand ?? ''} maxLength={80} className={inputClass} />
        </label>
        <label className={labelClass}>
          Nome do produto *
          <input required name="productName" defaultValue={product?.product_name ?? ''} maxLength={120} className={inputClass} />
        </label>
        <label className={labelClass}>
          Versão (opcional)
          <input name="version" defaultValue={product?.version ?? ''} maxLength={80} className={inputClass} />
        </label>
        <label className={labelClass}>
          Volume (ml, opcional)
          <input name="volumeMl" type="number" min={1} defaultValue={product?.volume_ml ?? ''} className={inputClass} />
        </label>
        <label className={labelClass}>
          Gênero *
          <select required name="gender" defaultValue={product?.gender ?? 'unissex'} className={inputClass}>
            {GENDERS.map((g) => <option key={g} value={g}>{genderLabels[g]}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Tipo *
          <select required name="productType" defaultValue={product?.product_type ?? 'Perfume'} className={inputClass}>
            {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Família olfativa (opcional)
          <select name="fragranceFamily" defaultValue={product?.fragrance_family ?? ''} className={inputClass}>
            <option value="">— Não informado —</option>
            {FRAGRANCE_FAMILIES.map((f) => <option key={f} value={f}>{familyLabels[f]}</option>)}
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        <label className={labelClass}>
          Preço (R$) *
          <input
            required
            name="priceReais"
            type="number"
            min={0.01}
            step="0.01"
            defaultValue={product ? (product.price_cents ?? 0) / 100 : ''}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Desconto % (opcional)
          <input name="discountPercent" type="number" min={0} max={100} defaultValue={product?.discount_percent ?? ''} className={inputClass} />
        </label>
        <label className={labelClass}>
          Estoque *
          <input required name="stock" type="number" min={0} defaultValue={product?.stock_on_hand ?? 0} className={inputClass} />
        </label>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mt-4">
        <label className={labelClass}>
          Peso (g) *
          <input required name="weightGrams" type="number" min={1} defaultValue={product?.weight_grams ?? ''} className={inputClass} />
        </label>
        <label className={labelClass}>
          Altura (cm) *
          <input required name="heightCm" type="number" min={1} defaultValue={product?.height_cm ?? ''} className={inputClass} />
        </label>
        <label className={labelClass}>
          Largura (cm) *
          <input required name="widthCm" type="number" min={1} defaultValue={product?.width_cm ?? ''} className={inputClass} />
        </label>
        <label className={labelClass}>
          Profundidade (cm) *
          <input required name="lengthCm" type="number" min={1} defaultValue={product?.length_cm ?? ''} className={inputClass} />
        </label>
      </div>
      <p className="text-xs text-[#6B7280] mt-1">Medidas da caixa embalada (não do frasco) — usadas pra calcular o frete.</p>

      <label className="flex items-center gap-2 mt-4 text-sm">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
        Visível na loja
      </label>

      <label className={`${labelClass} mt-4`}>
        Descrição curta (aparece no card do produto)
        <textarea name="shortDescription" defaultValue={product?.short_description ?? ''} maxLength={300} rows={2} className={inputClass} />
      </label>
      <label className={`${labelClass} mt-4`}>
        Descrição completa (aparece na página do produto)
        <textarea name="description" defaultValue={product?.description ?? ''} maxLength={4000} rows={6} className={inputClass} />
      </label>

      <div className="mt-4">
        <p className={labelClass}>Fotos</p>
        {keptImages.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {keptImages.map((url) => (
              <div key={url} className="relative w-20 h-24 bg-white border border-[#E8E0D4]">
                <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                <button
                  type="button"
                  onClick={() => setKeptImages((current) => current.filter((item) => item !== url))}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-[#B5363A] text-white text-xs leading-5"
                  aria-label="Remover foto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple className="mt-3 text-sm" />
        <p className="text-xs text-[#6B7280] mt-1">JPG, PNG ou WEBP, até 5MB cada, no máximo 6 fotos no total.</p>
      </div>

      {error ? <p role="alert" className="mt-5 text-sm text-[#B5363A]">{error}</p> : null}

      <button type="submit" disabled={pending} className="mt-6 bg-[#0A0A0A] text-white px-6 py-3 text-sm font-medium disabled:opacity-60">
        {pending ? 'Salvando…' : 'Salvar produto'}
      </button>
    </form>
  )
}
