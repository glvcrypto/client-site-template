import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string | null
}

interface PromoState {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  itemCount: number
  promo: PromoState | null
  discountAmount: number
  applyPromo: (code: string) => Promise<{ success: boolean; message: string }>
  removePromo: () => void
}

// ── Storage Helpers ──────────────────────────────────────────────────────────

const CART_KEY = 'store_cart'
const PROMO_KEY = 'store_promo'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

function loadPromo(): PromoState | null {
  try {
    const raw = localStorage.getItem(PROMO_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function savePromo(promo: PromoState | null) {
  if (promo) {
    localStorage.setItem(PROMO_KEY, JSON.stringify(promo))
  } else {
    localStorage.removeItem(PROMO_KEY)
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

// ── Provider Hook (used inside CartProvider component) ───────────────────────

export function useCartState(): CartContextValue {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const [promo, setPromo] = useState<PromoState | null>(loadPromo)

  useEffect(() => { saveCart(items) }, [items])
  useEffect(() => { savePromo(promo) }, [promo])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId))
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      )
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setPromo(null)
  }, [])

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  const discountAmount = useMemo(() => {
    if (!promo) return 0
    if (promo.discount_type === 'percentage') {
      return Math.round(subtotal * (promo.discount_value / 100) * 100) / 100
    }
    return Math.min(promo.discount_value, subtotal)
  }, [promo, subtotal])

  const applyPromo = useCallback(
    async (code: string): Promise<{ success: boolean; message: string }> => {
      const { data, error } = await supabase
        .from('store_promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single()

      if (error || !data) return { success: false, message: 'Invalid promo code.' }

      const now = new Date()
      if (data.valid_from && new Date(data.valid_from) > now) {
        return { success: false, message: 'This promo code is not yet active.' }
      }
      if (data.valid_to && new Date(data.valid_to) < now) {
        return { success: false, message: 'This promo code has expired.' }
      }
      if (data.max_uses && data.uses_count >= data.max_uses) {
        return { success: false, message: 'This promo code has reached its usage limit.' }
      }
      if (data.min_order && subtotal < data.min_order) {
        return {
          success: false,
          message: `Minimum order of $${data.min_order.toFixed(2)} required.`,
        }
      }

      setPromo({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
      })
      return { success: true, message: 'Promo code applied!' }
    },
    [subtotal]
  )

  const removePromo = useCallback(() => {
    setPromo(null)
  }, [])

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    itemCount,
    promo,
    discountAmount,
    applyPromo,
    removePromo,
  }
}
