import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Package, ShoppingCart, Minus, Plus, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/public-layout'
import { useProduct, useProducts } from '@/hooks/use-products'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

const cadFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 })

export function ProductDetailPage() {
  const { productId } = useParams({ strict: false }) as { productId: string }
  const { data: product, isLoading } = useProduct(productId)
  const { addItem } = useCart()

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  // Related products (same category)
  const { data: related } = useProducts({
    category_id: product?.category_id ?? undefined,
    is_active: true,
  })
  const relatedProducts = related?.filter((p) => p.id !== productId).slice(0, 4) ?? []

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="py-32 text-center text-gray-500">Loading...</div>
      </PublicLayout>
    )
  }

  if (!product) {
    return (
      <PublicLayout>
        <div className="py-32 text-center">
          <p className="mb-4 text-gray-500">Product not found.</p>
          <Button asChild variant="outline">
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </div>
      </PublicLayout>
    )
  }

  const images = Array.isArray(product.images) ? product.images as string[] : []
  const hasDiscount = product.sale_price != null && product.sale_price < (product.price ?? 0)
  const inStock = (product.quantity_available ?? 0) > 0

  function handleAddToCart() {
    addItem({
      productId: product!.id,
      name: product!.name,
      price: product!.sale_price ?? product!.price ?? 0,
      image: images[0] ?? null,
      quantity,
    })
    toast.success(`${product!.name} added to cart.`)
    setQuantity(1)
  }

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        {/* Back link */}
        <Link
          to="/shop"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-[#1B2A4A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image Gallery */}
          <div>
            <div className="flex items-center justify-center overflow-hidden rounded-lg bg-gray-100">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage] ?? images[0]}
                  alt={product.name}
                  className="h-80 w-full object-cover"
                />
              ) : (
                <div className="flex h-80 w-full items-center justify-center">
                  <Package className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                      selectedImage === i ? 'border-[#D4712A]' : 'border-transparent'
                    }`}
                  >
                    <img src={url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="mb-2 text-2xl font-bold text-[#1B2A4A] md:text-3xl">{product.name}</h1>

            {product.brand && (
              <p className="mb-2 text-sm text-gray-500">{product.brand}</p>
            )}

            <div className="mb-4 flex items-center gap-3">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-bold text-[#D4712A]">
                    {cadFormat.format(product.sale_price!)}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    {cadFormat.format(product.price!)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-[#D4712A]">
                  {product.price != null ? cadFormat.format(product.price) : 'Call for Price'}
                </span>
              )}
            </div>

            {/* Stock status */}
            <div className="mb-4">
              {inStock ? (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> In Stock ({product.quantity_available})
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700">
                  <XCircle className="mr-1 h-3 w-3" /> Out of Stock
                </Badge>
              )}
            </div>

            {product.description && (
              <div className="mb-6">
                <h2 className="mb-2 text-lg font-semibold text-[#1B2A4A]">Description</h2>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-md border">
                <button
                  type="button"
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-40"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2rem] text-center text-sm font-medium">{quantity}</span>
                <button
                  type="button"
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                size="lg"
                className="flex-1 bg-[#D4712A] text-white hover:bg-[#b85d1f]"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>

            {product.sku && (
              <p className="mt-4 text-xs text-gray-400">SKU: {product.sku}</p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-[#1B2A4A]">Related Products</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((rp) => {
                const rpImages = Array.isArray(rp.images) ? rp.images as string[] : []
                return (
                  <Card key={rp.id} className="overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg">
                    <div className="flex h-36 items-center justify-center bg-gray-100">
                      {rpImages.length > 0 ? (
                        <img src={rpImages[0]} alt={rp.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-sm font-semibold truncate">{rp.name}</h3>
                      <p className="text-sm font-bold text-[#D4712A]">
                        {rp.sale_price ?? rp.price != null
                          ? cadFormat.format(rp.sale_price ?? rp.price!)
                          : 'Call for Price'}
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-2 w-full">
                        <Link to="/shop/$productId" params={{ productId: rp.id }}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  )
}
