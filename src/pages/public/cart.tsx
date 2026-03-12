import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingCart, Trash2, Minus, Plus, Tag, ArrowLeft, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PublicLayout } from '@/components/public/public-layout'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

const cadFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 })

export function CartPage() {
  const {
    items, removeItem, updateQuantity, subtotal, itemCount,
    promo, discountAmount, applyPromo, removePromo,
  } = useCart()

  const [promoInput, setPromoInput] = useState('')
  const [applyingPromo, setApplyingPromo] = useState(false)

  async function handleApplyPromo() {
    if (!promoInput.trim()) return
    setApplyingPromo(true)
    const result = await applyPromo(promoInput)
    setApplyingPromo(false)
    if (result.success) {
      toast.success(result.message)
      setPromoInput('')
    } else {
      toast.error(result.message)
    }
  }

  // Estimates (will be calculated properly at checkout)
  const estimatedTax = Math.round((subtotal - discountAmount) * 0.13 * 100) / 100
  const estimatedTotal = subtotal - discountAmount + estimatedTax

  if (items.length === 0) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-300" />
          <h1 className="mt-4 text-2xl font-bold text-[#1B2A4A]">Your Cart is Empty</h1>
          <p className="mt-2 text-gray-500">Browse our shop to find products you love.</p>
          <Button asChild className="mt-6 bg-[#1B2A4A] text-white hover:bg-[#14203a]">
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </section>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <Link
          to="/shop"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-[#1B2A4A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <h1 className="mb-8 text-2xl font-bold text-[#1B2A4A]">
          Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4"
              >
                {/* Image */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to="/shop/$productId"
                    params={{ productId: item.productId }}
                    className="text-sm font-semibold text-[#1B2A4A] hover:underline truncate block"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-gray-600">{cadFormat.format(item.price)} each</p>

                  <div className="mt-2 flex items-center gap-3">
                    {/* Quantity */}
                    <div className="flex items-center rounded-md border">
                      <button
                        type="button"
                        className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-40"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-xs font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        className="px-2 py-1 text-gray-500 hover:text-gray-700"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1B2A4A]">
                    {cadFormat.format(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 h-fit space-y-4">
            <h2 className="text-lg font-bold text-[#1B2A4A]">Order Summary</h2>

            {/* Promo Code */}
            {promo ? (
              <div className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 p-3 text-sm">
                <span className="inline-flex items-center gap-1 text-green-700">
                  <Tag className="h-3.5 w-3.5" />
                  {promo.code}
                </span>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 text-xs underline"
                  onClick={removePromo}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyPromo}
                  disabled={applyingPromo || !promoInput.trim()}
                >
                  Apply
                </Button>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{cadFormat.format(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{cadFormat.format(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Tax (13% HST)</span>
                <span>{cadFormat.format(estimatedTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-500">Calculated at checkout</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-base font-bold">
                <span>Estimated Total</span>
                <span className="text-[#D4712A]">{cadFormat.format(estimatedTotal)}</span>
              </div>
            </div>

            <Button asChild className="w-full bg-[#D4712A] text-white hover:bg-[#b85d1f]">
              <Link to="/checkout">Proceed to Checkout</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
