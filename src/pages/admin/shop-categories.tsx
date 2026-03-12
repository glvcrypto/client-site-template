import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Inbox, Loader2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from '@/hooks/use-products'

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface CategoryForm {
  name: string
  slug: string
  parent_id: string
  display_order: string
  is_active: boolean
}

const emptyForm: CategoryForm = {
  name: '', slug: '', parent_id: '', display_order: '0', is_active: true,
}

export function AdminShopCategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(c: any) {
    setEditingId(c.id)
    setForm({
      name: c.name ?? '',
      slug: c.slug ?? '',
      parent_id: c.parent_id ?? '',
      display_order: (c.display_order ?? 0).toString(),
      is_active: c.is_active ?? true,
    })
    setDialogOpen(true)
  }

  function handleNameChange(name: string) {
    setForm((p) => ({
      ...p,
      name,
      slug: !editingId ? slugify(name) : p.slug,
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Category name is required.')
      return
    }
    const slug = form.slug.trim() || slugify(form.name)
    const payload = {
      name: form.name.trim(),
      slug,
      parent_id: form.parent_id || null,
      display_order: parseInt(form.display_order, 10) || 0,
      is_active: form.is_active,
    }

    try {
      if (editingId) {
        await updateCategory.mutateAsync({ id: editingId, ...payload } as any)
        toast.success('Category updated.')
      } else {
        await createCategory.mutateAsync(payload as any)
        toast.success('Category created.')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Failed to save category.')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return
    try {
      await deleteCategory.mutateAsync(id)
      toast.success('Category deleted.')
    } catch {
      toast.error('Failed to delete category.')
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    try {
      await updateCategory.mutateAsync({ id, is_active: !current } as any)
      toast.success(`Category ${!current ? 'activated' : 'deactivated'}.`)
    } catch {
      toast.error('Failed to update category.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop Categories</h1>
          <p className="text-sm text-muted-foreground">Organise products into categories.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading categories...
        </div>
      ) : !categories?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No categories yet</p>
          <Button size="sm" className="mt-4" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Category
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium inline-flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{c.slug}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {categories.find((p: any) => p.id === c.parent_id)?.name ?? '—'}
                  </TableCell>
                  <TableCell>{c.display_order}</TableCell>
                  <TableCell>
                    <Switch checked={c.is_active} onCheckedChange={() => handleToggleActive(c.id, c.is_active)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id, c.name)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the category details.' : 'Create a new product category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select value={form.parent_id} onValueChange={(val) => setForm((p) => ({ ...p, parent_id: val ?? '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories
                    ?.filter((c: any) => c.id !== editingId)
                    .map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm((p) => ({ ...p, is_active: c }))} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && (
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
