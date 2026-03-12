import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Pencil, Inbox, Loader2, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { usePromoCodes, useCreatePromoCode, useUpdatePromoCode } from '@/hooks/use-promo-codes'

const cadFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

interface PromoForm {
  code: string
  discount_type: string
  discount_value: string
  min_order: string
  max_uses: string
  valid_from: string
  valid_to: string
  is_active: boolean
}

const emptyForm: PromoForm = {
  code: '', discount_type: 'percentage', discount_value: '',
  min_order: '', max_uses: '', valid_from: '', valid_to: '',
  is_active: true,
}

export function AdminShopPromosPage() {
  const { data: promos, isLoading } = usePromoCodes()
  const createPromo = useCreatePromoCode()
  const updatePromo = useUpdatePromoCode()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PromoForm>(emptyForm)

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(p: any) {
    setEditingId(p.id)
    setForm({
      code: p.code ?? '',
      discount_type: p.discount_type ?? 'percentage',
      discount_value: p.discount_value?.toString() ?? '',
      min_order: p.min_order?.toString() ?? '',
      max_uses: p.max_uses?.toString() ?? '',
      valid_from: p.valid_from ? p.valid_from.split('T')[0] : '',
      valid_to: p.valid_to ? p.valid_to.split('T')[0] : '',
      is_active: p.is_active ?? true,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.code.trim()) {
      toast.error('Promo code is required.')
      return
    }
    if (!form.discount_value) {
      toast.error('Discount value is required.')
      return
    }
    const payload: Record<string, unknown> = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order: form.min_order ? parseFloat(form.min_order) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_to: form.valid_to ? new Date(form.valid_to).toISOString() : null,
      is_active: form.is_active,
    }

    try {
      if (editingId) {
        await updatePromo.mutateAsync({ id: editingId, ...payload } as any)
        toast.success('Promo code updated.')
      } else {
        await createPromo.mutateAsync(payload as any)
        toast.success('Promo code created.')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Failed to save promo code.')
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    try {
      await updatePromo.mutateAsync({ id, is_active: !current } as any)
      toast.success(`Promo code ${!current ? 'activated' : 'deactivated'}.`)
    } catch {
      toast.error('Failed to update promo code.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promo Codes</h1>
          <p className="text-sm text-muted-foreground">Manage discount codes for the store.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Promo Code
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading promo codes...
        </div>
      ) : !promos?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No promo codes yet</p>
          <Button size="sm" className="mt-4" onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Promo Code
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium inline-flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {p.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {p.discount_type === 'percentage' ? '%' : '$'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.discount_type === 'percentage'
                      ? `${p.discount_value}%`
                      : cadFormat.format(p.discount_value)
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.min_order ? cadFormat.format(p.min_order) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.uses_count}{p.max_uses ? `/${p.max_uses}` : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {p.valid_from ? format(new Date(p.valid_from), 'MMM d') : '—'}
                    {' — '}
                    {p.valid_to ? format(new Date(p.valid_to), 'MMM d') : '—'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={() => handleToggleActive(p.id, p.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
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
            <DialogTitle>{editingId ? 'Edit Promo Code' : 'Add Promo Code'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the promo code details.' : 'Create a new promotional discount code.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(val) => setForm((p) => ({ ...p, discount_type: val ?? 'percentage' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                  placeholder={form.discount_type === 'percentage' ? '20' : '10.00'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Order</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.min_order}
                  onChange={(e) => setForm((p) => ({ ...p, min_order: e.target.value }))}
                  placeholder="No minimum"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={form.max_uses}
                  onChange={(e) => setForm((p) => ({ ...p, max_uses: e.target.value }))}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid To</Label>
                <Input
                  type="date"
                  value={form.valid_to}
                  onChange={(e) => setForm((p) => ({ ...p, valid_to: e.target.value }))}
                />
              </div>
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
              disabled={createPromo.isPending || updatePromo.isPending}
            >
              {(createPromo.isPending || updatePromo.isPending) && (
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
