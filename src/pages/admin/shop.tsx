import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Package, Plus, Search, Inbox, Loader2, Trash2, Pencil, FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useCategories, type ProductFilters,
} from '@/hooks/use-products'

const cadFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

function formatPrice(price: number | null) {
  if (price == null) return '—'
  return cadFormat.format(price)
}

interface ProductFormState {
  name: string
  sku: string
  price: string
  sale_price: string
  description: string
  brand: string
  quantity_available: string
  weight: string
  category_id: string
  is_active: boolean
  images: string[]
}

const emptyForm: ProductFormState = {
  name: '', sku: '', price: '', sale_price: '', description: '',
  brand: '', quantity_available: '0', weight: '', category_id: '',
  is_active: true, images: [],
}

export function AdminShopPage() {
  const [filters, setFilters] = useState<ProductFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const [showActive, setShowActive] = useState(true)

  const { data: products, isLoading } = useProducts({
    ...filters,
    is_active: showActive ? true : undefined,
  })
  const { data: categories } = useCategories()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(p: any) {
    setEditingId(p.id)
    setForm({
      name: p.name ?? '',
      sku: p.sku ?? '',
      price: p.price?.toString() ?? '',
      sale_price: p.sale_price?.toString() ?? '',
      description: p.description ?? '',
      brand: p.brand ?? '',
      quantity_available: (p.quantity_available ?? 0).toString(),
      weight: p.weight?.toString() ?? '',
      category_id: p.category_id ?? '',
      is_active: p.is_active ?? true,
      images: Array.isArray(p.images) ? p.images : [],
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Product name is required.')
      return
    }
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      price: form.price ? parseFloat(form.price) : null,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      description: form.description.trim() || null,
      brand: form.brand.trim() || null,
      quantity_available: parseInt(form.quantity_available, 10) || 0,
      weight: form.weight ? parseFloat(form.weight) : null,
      category_id: form.category_id || null,
      is_active: form.is_active,
      images: form.images,
    }

    try {
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...payload } as any)
        toast.success('Product updated.')
      } else {
        await createProduct.mutateAsync(payload as any)
        toast.success('Product created.')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Failed to save product.')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteProduct.mutateAsync(id)
      toast.success('Product deleted.')
    } catch {
      toast.error('Failed to delete product.')
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      await updateProduct.mutateAsync({ id, is_active: !currentActive } as any)
      toast.success(`Product ${!currentActive ? 'activated' : 'deactivated'}.`)
    } catch {
      toast.error('Failed to update product.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Shop Products
            {!isLoading && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({products?.length ?? 0})
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage products in your online store.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast.info('CSV import coming soon.')}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.category_id ?? ''}
          onValueChange={(val) => setFilters((prev) => ({ ...prev, category_id: (val ?? '') || undefined }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm">
          <Switch checked={showActive} onCheckedChange={setShowActive} />
          Active Only
        </label>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setFilters((prev) => ({ ...prev, search: e.target.value || undefined }))
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading products...
        </div>
      ) : !products?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No products found</p>
          <p className="mt-1 text-xs text-muted-foreground">Add your first product to get started.</p>
          <Button size="sm" className="mt-4" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Product
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sale</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.sku || '—'}</TableCell>
                  <TableCell>{formatPrice(p.price)}</TableCell>
                  <TableCell>
                    {p.sale_price ? (
                      <span className="text-red-600 font-medium">{formatPrice(p.sale_price)}</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        p.quantity_available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}
                    >
                      {p.quantity_available}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.category?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={() => handleToggleActive(p.id, p.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id, p.name)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the product details below.' : 'Fill in the product details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Sale Price</Label>
                <Input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Stock Qty</Label>
                <Input type="number" value={form.quantity_available} onChange={(e) => setForm((p) => ({ ...p, quantity_available: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.01" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(val) => setForm((p) => ({ ...p, category_id: val ?? '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {(createProduct.isPending || updateProduct.isPending) && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
