import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Package, Search, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PublicLayout } from '@/components/public/public-layout'
import { useProducts, useCategories } from '@/hooks/use-products'
import { useModuleEnabled } from '@/hooks/use-modules'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

const cadFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 })

type SortOption = 'newest' | 'price_low' | 'price_high'

export function ShopPage() {
  const navigate = useNavigate()
  const ecomEnabled = useModuleEnabled('ecommerce')

  const [categoryId, setCategoryId] = useState('')
  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')

  const { data: categories } = useCategories()
  const { data: products, isLoading } = useProducts({
    category_id: categoryId || undefined,
    search: searchText || undefined,
    is_active: true,
  })
  const { addItem, itemCount } = useCart()

  useEffect(() => {
    if (!ecomEnabled) navigate({ to: '/' })
  }, [ecomEnabled, navigate])

  if (!ecomEnabled) return null

  // Sort client-side
  const sorted = [...(products ?? [])].sort((a, b) => {
    if (sort === 'price_low') return (a.price ?? 0) - (b.price ?? 0)
    if (sort === 'price_high') return (b.price ?? 0) - (a.price ?? 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  function handleAddToCart(product: any) {
    const images = Array.isArray(product.images) ? product.images as string[] : []
    addItem({
      productId: product.id,
      name: product.name,
      price: product.sale_price ?? product.price ?? 0,
      image: images[0] ?? null,
    })
    toast.success(`${product.name} added to cart.`)
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-[#1B2A4A] px-4 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Shop</h1>
        <p className="mt-2 text-gray-300">Browse our products and accessories</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Filter bar */}
        <div className="mb-8 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories?.filter((c) => c.is_active).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Sort</label>
            <Select value={sort} onValueChange={(v) => setSort((v as SortOption) ?? 'newest')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Link to="/cart">
            <Button variant="outline" className="relative">
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              Cart
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-[#D4712A] text-white">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>

        {/* Results */}
        {isLoading ? (
          <p className="py-20 text-center text-gray-500">Loading products...</p>
        ) : !sorted.length ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No products match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((product) => {
              const images = Array.isArray(product.images) ? product.images as string[] : []
              const hasDiscount = product.sale_price != null && product.sale_price < (product.price ?? 0)
              return (
                <Card key={product.id} className="group overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg">
                  <div className="relative flex h-48 items-center justify-center bg-gray-100">
                    {images.length > 0 ? (
                      <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-12 w-12 text-gray-300" />
                    )}
                    {product.category && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 left-2 text-[10px] bg-white/90"
                      >
                        {(product.category as any).name}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-[#1B2A4A] truncate">{product.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      {hasDiscount ? (
                        <>
                          <span className="text-lg font-bold text-[#D4712A]">
                            {cadFormat.format(product.sale_price!)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {cadFormat.format(product.price!)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-[#D4712A]">
                          {product.price != null ? cadFormat.format(product.price) : 'Call for Price'}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Link to="/shop/$productId" params={{ productId: product.id }}>
                          Details
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-[#1B2A4A] text-white hover:bg-[#14203a]"
                        onClick={() => handleAddToCart(product)}
                        disabled={(product.quantity_available ?? 0) <= 0}
                      >
                        <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  )
}
