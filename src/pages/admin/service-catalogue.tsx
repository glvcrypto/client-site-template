import { useState } from 'react'
import {
  useAllServiceCatalogue,
  useCreateService,
  useUpdateCatalogueService,
  useDeleteCatalogueService,
  type ServiceCatalogueInsert,
  type ServiceCatalogueRow,
} from '@/hooks/use-service-catalogue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// ── Form State ───────────────────────────────────────────────────────────────────

const emptyForm: ServiceCatalogueInsert = {
  name: '',
  description: '',
  default_price: undefined,
  estimated_duration_minutes: 60,
  category: '',
  allow_booking: true,
  is_active: true,
}

// ── Service Form Dialog ──────────────────────────────────────────────────────────

function ServiceFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ServiceCatalogueRow | null
}) {
  const createService = useCreateService()
  const updateService = useUpdateCatalogueService()
  const isEdit = !!initial

  const [form, setForm] = useState<ServiceCatalogueInsert>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          default_price: initial.default_price,
          estimated_duration_minutes: initial.estimated_duration_minutes,
          category: initial.category ?? '',
          allow_booking: initial.allow_booking,
          is_active: initial.is_active,
        }
      : { ...emptyForm }
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Service name is required')
      return
    }
    try {
      if (isEdit) {
        await updateService.mutateAsync({ id: initial.id, ...form })
        toast.success('Service updated')
      } else {
        await createService.mutateAsync(form)
        toast.success('Service created')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEdit ? 'Failed to update service' : 'Failed to create service')
    }
  }

  const isPending = createService.isPending || updateService.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Service' : 'Add Service'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update service details.' : 'Add a new service to the catalogue.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.default_price ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    default_price: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={form.estimated_duration_minutes ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    estimated_duration_minutes: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g. Marine, Lawn & Garden"
              value={form.category ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="allow_booking">Allow Online Booking</Label>
            <Switch
              id="allow_booking"
              checked={form.allow_booking ?? true}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, allow_booking: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={form.is_active ?? true}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Confirmation ──────────────────────────────────────────────────────────

function DeleteDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: ServiceCatalogueRow | null
}) {
  const deleteService = useDeleteCatalogueService()

  async function handleDelete() {
    if (!service) return
    try {
      await deleteService.mutateAsync(service.id)
      toast.success('Service deleted')
      onOpenChange(false)
    } catch {
      toast.error('Failed to delete service')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Service</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{service?.name}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteService.isPending}>
            {deleteService.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────────

export function ServiceCataloguePage() {
  const { data: services, isLoading } = useAllServiceCatalogue()
  const updateService = useUpdateCatalogueService()

  const [addOpen, setAddOpen] = useState(false)
  const [editService, setEditService] = useState<ServiceCatalogueRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceCatalogueRow | null>(null)

  async function handleToggle(service: ServiceCatalogueRow, field: 'allow_booking' | 'is_active') {
    try {
      await updateService.mutateAsync({ id: service.id, [field]: !service[field] })
    } catch {
      toast.error('Failed to update')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your bookable service menu.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {!services?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <p className="text-sm font-medium">No services in catalogue</p>
          <p className="mt-1 text-xs text-muted-foreground">Add your first bookable service.</p>
          <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Service
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Bookable</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.category ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    {s.default_price != null ? `$${Number(s.default_price).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.estimated_duration_minutes ? `${s.estimated_duration_minutes}min` : '—'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={s.allow_booking}
                      onCheckedChange={() => handleToggle(s, 'allow_booking')}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={() => handleToggle(s, 'is_active')}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditService(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      {addOpen && (
        <ServiceFormDialog open={addOpen} onOpenChange={setAddOpen} />
      )}
      {editService && (
        <ServiceFormDialog
          open={!!editService}
          onOpenChange={(open) => { if (!open) setEditService(null) }}
          initial={editService}
        />
      )}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        service={deleteTarget}
      />
    </div>
  )
}
