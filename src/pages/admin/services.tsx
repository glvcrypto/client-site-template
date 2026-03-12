import { useState, useMemo } from 'react'
import { useServices, useCreateService, useUpdateService } from '@/hooks/use-services'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Wrench,
  Plus,
  Loader2,
  Inbox,
  Calendar,
  User,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import type { Database } from '@/lib/database.types'

// ── Types ────────────────────────────────────────────────────────────────────────

type ServiceStatus = Database['public']['Enums']['service_status']
type ServiceRow = NonNullable<ReturnType<typeof useServices>['data']>[number]

// ── Constants ────────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  'chainsaw_service',
  'golf_cart_service',
  'lawn_tractor_service',
  'lawn_tractor_tune_up',
  'oil_change_io',
  'pickup_delivery',
  'power_washer_pump',
  'power_washer_service',
  'pre_season_inspection',
  'snowthrower_service',
  'snowthrower_tune_up',
  'trimmer_service',
  'trimmer_tune_up',
  'winterization_io',
  'winterization_outboard',
  'zero_turn_service',
  'push_mower_service',
  'push_mower_belt',
  'boat_storage',
] as const

const COLUMNS: { status: ServiceStatus; label: string; colour: string }[] = [
  { status: 'received', label: 'Received', colour: 'bg-zinc-100' },
  { status: 'scheduled', label: 'Scheduled', colour: 'bg-blue-100' },
  { status: 'in_progress', label: 'In Progress', colour: 'bg-amber-100' },
  { status: 'complete', label: 'Complete', colour: 'bg-green-100' },
  { status: 'picked_up', label: 'Picked Up', colour: 'bg-zinc-200' },
]

const STATUS_ORDER: ServiceStatus[] = ['received', 'scheduled', 'in_progress', 'complete', 'picked_up']

function nextStatuses(current: ServiceStatus): ServiceStatus[] {
  const idx = STATUS_ORDER.indexOf(current)
  return STATUS_ORDER.slice(idx + 1)
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Service Card ─────────────────────────────────────────────────────────────────

function ServiceCard({ service }: { service: ServiceRow }) {
  const updateService = useUpdateService()
  const available = nextStatuses((service.status ?? 'received') as ServiceStatus)

  async function handleMove(newStatus: string) {
    try {
      await updateService.mutateAsync({ id: service.id, status: newStatus as ServiceStatus })
      toast.success(`Moved to ${formatEnumLabel(newStatus)}`)
    } catch {
      toast.error('Failed to update service')
    }
  }

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight">
          {formatEnumLabel(service.service_type)}
        </p>
        <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <User className="h-3 w-3" />
          {service.customer_name}
        </p>
        {service.unit_description && (
          <p className="truncate">{service.unit_description}</p>
        )}
        {service.scheduled_date && (
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {format(new Date(service.scheduled_date), 'MMM d, yyyy')}
          </p>
        )}
        {service.created_at && (
          <p className="text-[11px]">
            {formatDistanceToNow(new Date(service.created_at), { addSuffix: true })}
          </p>
        )}
      </div>

      {available.length > 0 && (
        <Select onValueChange={handleMove}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Move to..." />
          </SelectTrigger>
          <SelectContent>
            {available.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {formatEnumLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

// ── Add Service Dialog ───────────────────────────────────────────────────────────

function AddServiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createService = useCreateService()
  const [formData, setFormData] = useState({
    service_type: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    unit_description: '',
    scheduled_date: '',
    notes: '',
  })

  function resetForm() {
    setFormData({
      service_type: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      unit_description: '',
      scheduled_date: '',
      notes: '',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.service_type || !formData.customer_name) {
      toast.error('Service type and customer name are required')
      return
    }

    try {
      await createService.mutateAsync({
        service_type: formData.service_type,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        unit_description: formData.unit_description || null,
        scheduled_date: formData.scheduled_date || null,
        notes: formData.notes ? formData.notes : null,
      })
      toast.success('Service created')
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error('Failed to create service')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
          <DialogDescription>
            Create a new service request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service_type">Service Type *</Label>
            <Select
              value={formData.service_type}
              onValueChange={(val) => setFormData((p) => ({ ...p, service_type: val }))}
            >
              <SelectTrigger id="service_type">
                <SelectValue placeholder="Select a service type" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{formatEnumLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => setFormData((p) => ({ ...p, customer_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData((p) => ({ ...p, customer_email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData((p) => ({ ...p, customer_phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_description">Unit Description</Label>
            <Input
              id="unit_description"
              placeholder="e.g. Cub Cadet XT1 LT42"
              value={formData.unit_description}
              onChange={(e) => setFormData((p) => ({ ...p, unit_description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_date">Scheduled Date</Label>
            <Input
              id="scheduled_date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData((p) => ({ ...p, scheduled_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createService.isPending}>
              {createService.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Create Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Collapsible Column (mobile) ──────────────────────────────────────────────────

function CollapsibleColumn({
  label,
  colour,
  services,
}: {
  label: string
  colour: string
  services: ServiceRow[]
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn('flex w-full items-center justify-between p-3', colour)}
      >
        <span className="text-sm font-semibold">
          {label}
          <Badge variant="secondary" className="ml-2 text-[10px]">
            {services.length}
          </Badge>
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {open && (
        <div className="p-2 space-y-2">
          {services.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No services</p>
          ) : (
            services.map((s) => <ServiceCard key={s.id} service={s} />)
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────────

export function ServicesAdminPage() {
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [addOpen, setAddOpen] = useState(false)

  const { data: services, isLoading } = useServices(
    typeFilter ? { service_type: typeFilter } : {}
  )

  const grouped = useMemo(() => {
    const map: Record<ServiceStatus, ServiceRow[]> = {
      received: [],
      scheduled: [],
      in_progress: [],
      complete: [],
      picked_up: [],
    }
    if (services) {
      for (const s of services) {
        const status = (s.status ?? 'received') as ServiceStatus
        if (map[status]) {
          map[status].push(s)
        }
      }
    }
    return map
  }, [services])

  const totalCount = services?.length ?? 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Services
            {!isLoading && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({totalCount})
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Track service requests through the pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Service Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Service Types</SelectItem>
              {SERVICE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{formatEnumLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : totalCount === 0 && !typeFilter ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No services yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your first service request to get started.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Service
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop: Kanban columns */}
          <div className="hidden md:grid md:grid-cols-5 gap-3">
            {COLUMNS.map((col) => (
              <div key={col.status} className="flex flex-col rounded-lg border bg-muted/30 overflow-hidden">
                <div className={cn('p-3 flex items-center justify-between', col.colour)}>
                  <span className="text-sm font-semibold">{col.label}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {grouped[col.status].length}
                  </Badge>
                </div>
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {grouped[col.status].length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No services</p>
                  ) : (
                    grouped[col.status].map((s) => (
                      <ServiceCard key={s.id} service={s} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: Collapsible sections */}
          <div className="md:hidden space-y-3">
            {COLUMNS.map((col) => (
              <CollapsibleColumn
                key={col.status}
                label={col.label}
                colour={col.colour}
                services={grouped[col.status]}
              />
            ))}
          </div>
        </>
      )}

      <AddServiceDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
