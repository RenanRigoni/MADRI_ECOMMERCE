'use client'

import { useSyncExternalStore } from 'react'

export interface CartItem {
  productId: string
  quantity: number
}

const STORAGE_KEY = 'madri_cart_v1'
const EMPTY_CART: CartItem[] = []
let snapshot: CartItem[] = EMPTY_CART
let loaded = false
const listeners = new Set<() => void>()

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CartItem>
  return typeof item.productId === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(item.productId)
    && Number.isInteger(item.quantity) && Number(item.quantity) >= 1 && Number(item.quantity) <= 10
}

function load(): void {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    snapshot = Array.isArray(parsed)
      ? parsed.filter(isCartItem).slice(0, 20).map(({ productId, quantity }) => ({ productId, quantity }))
      : EMPTY_CART
  } catch {
    snapshot = EMPTY_CART
  }
}

function emit(next: CartItem[]): void {
  snapshot = next
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  listeners.forEach((listener) => listener())
}

function add(productId: string): void {
  const current = getSnapshot()
  const existing = current.find((item) => item.productId === productId)
  if (existing) {
    emit(current.map((item) => item.productId === productId
      ? { ...item, quantity: Math.min(10, item.quantity + 1) }
      : item))
  } else if (current.length < 20) {
    emit([...current, { productId, quantity: 1 }])
  }
}

function setQuantity(productId: string, quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return
  emit(getSnapshot().map((item) => item.productId === productId ? { ...item, quantity } : item))
}

function remove(productId: string): void {
  emit(getSnapshot().filter((item) => item.productId !== productId))
}

function clear(): void {
  emit(EMPTY_CART)
}

function subscribe(listener: () => void): () => void {
  load()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): CartItem[] {
  load()
  return snapshot
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CART)

  return {
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    add,
    setQuantity,
    remove,
    clear,
  }
}
