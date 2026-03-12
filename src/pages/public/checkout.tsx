import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2, CheckCircle2, ShoppingCart, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/public-layout'
import { useCart } from '@/hooks/use-cart'
import { useCreateOrder } from '@/hooks/use-orders'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const cadFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 })

interface ShippingMethod {
  id: string
  name: string
  type: string
  rate: number
  min_order_for_free: number | null
  is_enabled: boolean
}

export function CheckoutPage() {
  const { items, subtotal, promo, discountAmount, clearCart } = useCart()
  const createOrder = useCreateOrder()

  // Shipping methods from DB
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [taxRate, setTaxRate] = useState(0.13)
  const [chargeOnShipping, setChargeOnShipping] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: ships }, { data: taxes }] = await Promise.all([
        supabase.from('store_shipping_methods').select('*').eq('is_enabled', true).order('display_order'),
        supabase.from('store_tax_config').select('*').eq('is_enabled', true),
      ])
      if (ships) setShippingMethods(ships as any)
      if (taxes && taxes.length > 0) {
        setTaxRate((taxes[0].rate_percent ?? 13) / 100)
        setChargeOnShipping(taxes[0].charge_on_shipping ?? true)
      }
    }
    load()
  }, [])

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isPickup, setIsPickup] = useState(true)
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', province: 'ON', postal_code: '' })
  const [selectedShippingId, setSelectedShippingId] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  // Auto-select store pickup if available
  useEffect(() => {
    if (shippingMethods.length > 0 && !selectedShippingId) {
      const pickup = shippingMethods.find((s) => s.type === 'pickup')
      if (pickup) {
        setSelectedShippingId(pickup.id)
        setIsPickup(true)
      } else {
        setSelectedShippingId(shippingMethods[0].id)
        setIsPickup(false)
      }
    }
  }, [shippingMethods, selectedShippingId])

  // Calculated values
  const selectedMethod = shippingMethods.find((s) => s.id === selectedShippingId)
  const shippingCost = isPickup ? 0 : (selectedMethod?.rate ?? 0)
  const afterDiscount = subtotal - discountAmount
  const taxableAmount = chargeOnShipping ? afterDiscount + shippingCost : afterDiscount
  const tax = Math.round(taxableAmount * taxRate * 100) / 100
  const total = afterDiscount + shippingCost + tax

  // Redirect if cart is empty (unless order was placed)
  if (items.length === 0 && !orderPlaced) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-300" />
          <h1 className="mt-4 text-2xl font-bold text-[#1B2A4A]">Your Cart is Empty</h1>
          <p className="mt-2 text-gray-500">Add some items before checking out.</p>
          <Button asChild className="mt-6 bg-[#1B2A4A] text-white hover:bg-[#14203a]">
            <Link to="/shop">Browse Shop</Link>
          </Button>
        </section>
      </PublicLayout>
    )
  }

  // Success page
  if (orderPlaced) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-lg px-4 py-20 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-2xl font-bold text-[#1B2A4A]">Order Placed!</h1>
          <p className="mt-2 text-gray-600">
            Thank you for your order. Your order number is{' '}
            <span className="font-bold text-[#D4712A]">#{orderNumber}</span>.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {isPickup
              ? 'You selected store pickup. We will notify you when your order is ready.'
              : 'We will send you tracking information once your order ships.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
            <Button asChild className="bg-[#1B2A4A] text-white hover:bg-[#14203a]">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </section>
      </PublicLayout>
    )
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim()) { toast.error('Name is required.'); return }
    if (!email.trim()) { toast.error('Email is required.'); return }

    try {
      const order = await createOrder.mutateAsync({
        customer_name: customerName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        shipping_address: isPickup ? undefined : address,
        subtotal,
        tax,
        shipping_cost: shippingCost,
        total,
        payment_method: 'in_store',
        promo_code: promo?.code,
        discount_amount: discountAmount || undefined,
        items: items.map((item) => ({
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total: item.price * item.quantity,
        })),
      })
      setOrderNumber(order.order_number)
      setOrderPlaced(true)
      clearCart()
    } catch {
      toast.error('Failed to place order. Please try again.')
    }
  }

  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <Link
          to="/cart"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-[#1B2A4A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <h1 className="mb-8 text-2xl font-bold text-[#1B2A4A]">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(705) 555-0100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={isPickup}
                      onCheckedChange={(checked) => {
                        setIsPickup(checked)
                        if (checked) {
                          const pickup = shippingMethods.find((s) => s.type === 'pickup')
                          if (pickup) setSelectedShippingId(pickup.id)
                        } else {
                          const nonPickup = shippingMethods.find((s) => s.type !== 'pickup')
                          if (nonPickup) setSelectedShippingId(nonPickup.id)
                        }
                      }}
                    />
                    Store Pickup (Free)
                  </label>

                  {!isPickup && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label>Address Line 1</Label>
                          <Input
                            value={address.line1}
                            onChange={(e) => setAddress((p) => ({ ...p, line1: e.target.value }))}
                            placeholder="123 Main St"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Address Line 2</Label>
                          <Input
                            value={address.line2}
                            onChange={(e) => setAddress((p) => ({ ...p, line2: e.target.value }))}
                            placeholder="Apt, suite, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            value={address.city}
                            onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Province</Label>
                          <Input
                            value={address.province}
                            onChange={(e) => setAddress((p) => ({ ...p, province: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Postal Code</Label>
                          <Input
                            value={address.postal_code}
                            onChange={(e) => setAddress((p) => ({ ...p, postal_code: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Shipping Method Selection */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Shipping Method</Label>
                        <div className="space-y-2">
                          {shippingMethods
                            .filter((s) => s.type !== 'pickup')
                            .map((method) => (
                              <label
                                key={method.id}
                                className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                                  selectedShippingId === method.id ? 'border-[#D4712A] bg-orange-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="shipping"
                                    value={method.id}
                                    checked={selectedShippingId === method.id}
                                    onChange={() => setSelectedShippingId(method.id)}
                                    className="h-4 w-4"
                                  />
                                  <span className="text-sm font-medium">{method.name}</span>
                                </div>
                                <span className="text-sm font-medium">
                                  {method.type === 'free' ? 'Free' : cadFormat.format(method.rate)}
                                </span>
                              </label>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                    <p className="font-medium">Pay In-Store</p>
                    <p className="mt-1 text-xs">
                      Payment will be collected when you pick up your order or upon delivery.
                      Online payment options (Stripe, PayPal) coming soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 h-fit space-y-4">
              <h2 className="text-lg font-bold text-[#1B2A4A]">Order Summary</h2>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate mr-2">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-medium shrink-0">
                      {cadFormat.format(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{cadFormat.format(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({promo?.code})</span>
                    <span>-{cadFormat.format(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{shippingCost === 0 ? 'Free' : cadFormat.format(shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (HST {(taxRate * 100).toFixed(0)}%)</span>
                  <span>{cadFormat.format(tax)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-[#D4712A]">{cadFormat.format(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#D4712A] text-white hover:bg-[#b85d1f]"
                disabled={createOrder.isPending}
              >
                {createOrder.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Place Order
              </Button>
            </div>
          </div>
        </form>
      </section>
    </PublicLayout>
  )
}
