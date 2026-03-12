import type { ReactNode } from 'react'
import { CartContext, useCartState } from '@/hooks/use-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCartState()
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>
}
