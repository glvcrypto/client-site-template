import { useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useInventory, useUpdateInventory, useCreateInventory, type InventoryFilters } from '@/hooks/use-inventory'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Separator } from '@/components/ui/separator'
import {
  Package,
  Plus,
  Search,
  Inbox,
  Tag,
  Clock,
  Trash2,
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import { toast } from 'sonner'

// ── Constants ────────────────────────────────────────────────────────────────────

const UNIT_TYPES = [
  { value: 'boat', label: 'Boat' },
  { value: 'pontoon', label: 'Pontoon' },
  { value: 'outboard_motor', label: 'Outboard Motor' },
  { value: 'lawn_mower', label: 'Lawn Mower' },
  { value: 'lawn_tractor', label: 'Lawn Tractor' },
  { value: 'zero_turn', label: 'Zero Turn' },
  { value: 'snowthrower', label: 'Snowthrower' },
  { value: 'chainsaw', label: 'Chainsaw' },
  { value: 'trimmer', label: 'Trimmer' },
  { value: 'golf_cart', label: 'Golf Cart' },
  { value: 'power_washer', label: 'Power Washer' },
  { value: 'other', label: 'Other' },
]

const MAKES = [
  'Princecraft', 'Mercury', 'Cub Cadet', 'Toro', 'ECHO',
  'Troy-Bilt', 'Humminbird', 'Minn Kota', 'E-Z-GO',
]

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'on_order', label: 'On Order' },
  { value: 'featured', label: 'Featured' },
  { value: 'clearance', label: 'Clearance' },
]

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'demo', label: 'Demo' },
]

// ── Colour Maps ──────────────────────────────────────────────────────────────────

const statusColours: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  sold: 'bg-red-100 text-red-700',
  on_order: 'bg-blue-100 text-blue-700',
  featured: 'bg-amber-100 text-amber-700',
  clearance: 'bg-orange-100 text-orange-700',
}

const conditionColours: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  used: 'bg-zinc-100 text-zinc-600',
  demo: 'bg-purple-100 text-purple-700',
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const cadFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

function formatPrice(price: number | null): string {
  if (price == null) return 'Call for Price'
  return cadFormat.format(price)
}

function daysOnLot(listedDate: string | null): number | null {
  if (!listedDate) return null
  return differenceInDays(new Date(), new Date(listedDate))
}

// ── Detail type ──────────────────────────────────────────────────────────────────

type InventoryUnit = NonNullable<ReturnType<typeof useInventory>['data']>[number]

// ── Skeleton Card ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-zinc-200" />
      <div className="p-4 space-y-2">
        <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  )
}

// ── Inventory Card ───────────────────────────────────────────────────────────────

function InventoryCard({
  unit,
  isOwner,
  onClick,
}: {
  unit: InventoryUnit
  isOwner: boolean
  onClick: () => void
}) {
  const images = Array.isArray(unit.images) ? (unit.images as string[]) : []
  const days = daysOnLot(unit.listed_date)
  const margin = unit.price != null && unit.cost != null ? unit.price - unit.cost : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border bg-card shadow-sm overflow-hidden text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none w-full"
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={unit.unit_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-zinc-300" />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {unit.status && (
            <Badge variant="secondary" className={cn('text-[10px]', statusColours[unit.status])}>
              {formatEnumLabel(unit.status)}
            </Badge>
          )}
          {unit.condition && (
            <Badge variant="secondary" className={cn('text-[10px]', conditionColours[unit.condition])}>
              {formatEnumLabel(unit.condition)}
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="font-semibold text-sm truncate">{unit.unit_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {[unit.year, unit.make, unit.model].filter(Boolean).join(' ')}
        </p>
        <p className="text-sm font-medium">{formatPrice(unit.price)}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          {days != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {days} {days === 1 ? 'day' : 'days'} on lot
            </span>
          )}
          {unit.stock_number && (
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {unit.stock_number}
            </span>
          )}
        </div>

        {/* Owner-only: cost and margin */}
        {isOwner && (
          <div className="flex items-center gap-3 text-xs pt-1 border-t mt-1.5">
            {unit.cost != null && (
              <span className="text-muted-foreground">
                Cost: {cadFormat.format(unit.cost)}
              </span>
            )}
            {margin != null && (
              <span className={cn('font-medium', margin >= 0 ? 'text-green-600' : 'text-red-600')}>
                Margin: {cadFormat.format(margin)}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Detail Dialog ────────────────────────────────────────────────────────────────

function DetailDialog({
  unit,
  open,
  onOpenChange,
  isOwner,
}: {
  unit: InventoryUnit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isOwner: boolean
}) {
  const updateMutation = useUpdateInventory()

  if (!unit) return null

  const images = Array.isArray(unit.images) ? (unit.images as string[]) : []
  const specs = unit.specs && typeof unit.specs === 'object' && !Array.isArray(unit.specs)
    ? (unit.specs as Record<string, string>)
    : null
  const days = daysOnLot(unit.listed_date)
  const margin = unit.price != null && unit.cost != null ? unit.price - unit.cost : null

  async function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return
    if (!unit) return
    const updates: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'sold') {
      updates.sold_date = new Date().toISOString().split('T')[0]
    }
    try {
      await updateMutation.mutateAsync({ id: unit.id, ...updates })
      toast.success(`Status updated to ${formatEnumLabel(newStatus)}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleArchive() {
    if (!unit) return
    try {
      await updateMutation.mutateAsync({ id: unit.id, status: 'sold' as const, sold_date: new Date().toISOString().split('T')[0] })
      toast.success('Unit archived (marked as sold)')
      onOpenChange(false)
    } catch {
      toast.error('Failed to archive unit')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{unit.unit_name}</DialogTitle>
          <DialogDescription>
            {[unit.year, unit.make, unit.model].filter(Boolean).join(' ')}
            {unit.stock_number ? ` | Stock #${unit.stock_number}` : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Images */}
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${unit.unit_name} ${i + 1}`}
                className="h-24 w-32 rounded-md object-cover border shrink-0"
              />
            ))}
          </div>
        )}

        {/* Key Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Label className="text-muted-foreground text-xs">Unit Type</Label>
            <p>{formatEnumLabel(unit.unit_type)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Condition</Label>
            <p>{unit.condition ? formatEnumLabel(unit.condition) : '--'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Price</Label>
            <p className="font-medium">{formatPrice(unit.price)}</p>
          </div>
          {isOwner && (
            <>
              <div>
                <Label className="text-muted-foreground text-xs">Cost</Label>
                <p>{unit.cost != null ? cadFormat.format(unit.cost) : '--'}</p>
              </div>
              {margin != null && (
                <div>
                  <Label className="text-muted-foreground text-xs">Margin</Label>
                  <p className={cn('font-medium', margin >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {cadFormat.format(margin)}
                  </p>
                </div>
              )}
            </>
          )}
          <div>
            <Label className="text-muted-foreground text-xs">VIN</Label>
            <p>{unit.vin || '--'}</p>
          </div>
          {days != null && (
            <div>
              <Label className="text-muted-foreground text-xs">Days on Lot</Label>
              <p>{days} {days === 1 ? 'day' : 'days'}</p>
            </div>
          )}
          {unit.listed_date && (
            <div>
              <Label className="text-muted-foreground text-xs">Listed</Label>
              <p>{format(new Date(unit.listed_date), 'MMM d, yyyy')}</p>
            </div>
          )}
          {unit.sold_date && (
            <div>
              <Label className="text-muted-foreground text-xs">Sold</Label>
              <p>{format(new Date(unit.sold_date), 'MMM d, yyyy')}</p>
            </div>
          )}
          {unit.source && (
            <div>
              <Label className="text-muted-foreground text-xs">Source</Label>
              <p>{formatEnumLabel(unit.source)}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {unit.description && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-xs">Description</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{unit.description}</p>
            </div>
          </>
        )}

        {/* Specs */}
        {specs && Object.keys(specs).length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-xs">Specs</Label>
              <div className="mt-1 space-y-1">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Status Change */}
        <Separator />
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground shrink-0">Status</Label>
          <Select
            value={unit.status ?? 'available'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="destructive" size="sm" onClick={handleArchive}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Archive
          </Button>
          <Link to="/admin/inventory/new">
            <Button size="sm">Edit Unit</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── CSV Import ──────────────────────────────────────────────────────────────────

interface CsvImportResult {
  success: number
  errors: { row: number; message: string }[]
}

const CSV_TEMPLATE_HEADERS = [
  'unit_name', 'unit_type', 'make', 'model', 'year', 'stock_number',
  'vin', 'price', 'cost', 'condition', 'status', 'description',
]

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function downloadCsvTemplate() {
  const header = CSV_TEMPLATE_HEADERS.join(',')
  const example = [
    '2024 Princecraft Vectra 21RL,pontoon,Princecraft,Vectra 21RL,2024,STK-0042,,45999.99,,new,available,"Loaded with fishing package, 115hp Mercury"',
    'Mercury 150hp Pro XS,outboard_motor,Mercury,150 Pro XS,2024,STK-0043,,18500,,new,available,Brand new in crate',
  ].join('\n')
  const csv = `${header}\n${example}\n`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inventory-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const VALID_UNIT_TYPES = ['boat', 'pontoon', 'outboard_motor', 'lawn_mower', 'lawn_tractor', 'zero_turn', 'snowthrower', 'chainsaw', 'trimmer', 'golf_cart', 'power_washer', 'other']
const VALID_CONDITIONS = ['new', 'used', 'demo']
const VALID_STATUSES = ['available', 'on_order', 'featured', 'clearance', 'sold']

function CsvImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const createMutation = useCreateInventory()
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null)
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])

  function reset() {
    setResult(null)
    setPreview(null)
    setRawRows([])
    setHeaders([])
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) {
        toast.error('CSV must have a header row and at least one data row')
        return
      }

      const hdrs = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'))
      setHeaders(hdrs)

      const rows = lines.slice(1).map((line) => parseCsvLine(line))
      setRawRows(rows)

      // Build preview (first 5 rows)
      const previewData = rows.slice(0, 5).map((row) => {
        const obj: Record<string, string> = {}
        hdrs.forEach((h, i) => { obj[h] = row[i] ?? '' })
        return obj
      })
      setPreview(previewData)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (rawRows.length === 0) return
    setImporting(true)
    const errors: CsvImportResult['errors'] = []
    let success = 0

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i]
      const obj: Record<string, string> = {}
      headers.forEach((h, j) => { obj[h] = row[j] ?? '' })

      // Validate required fields
      if (!obj.unit_name) {
        errors.push({ row: i + 2, message: 'Missing unit_name' })
        continue
      }

      const unitType = obj.unit_type || 'other'
      if (!VALID_UNIT_TYPES.includes(unitType)) {
        errors.push({ row: i + 2, message: `Invalid unit_type: "${unitType}"` })
        continue
      }

      const condition = obj.condition || 'new'
      if (!VALID_CONDITIONS.includes(condition)) {
        errors.push({ row: i + 2, message: `Invalid condition: "${condition}"` })
        continue
      }

      const status = obj.status || 'available'
      if (!VALID_STATUSES.includes(status)) {
        errors.push({ row: i + 2, message: `Invalid status: "${status}"` })
        continue
      }

      try {
        await createMutation.mutateAsync({
          unit_name: obj.unit_name,
          unit_type: unitType,
          make: obj.make || null,
          model: obj.model || null,
          year: obj.year ? parseInt(obj.year, 10) : null,
          stock_number: obj.stock_number || null,
          vin: obj.vin || null,
          price: obj.price ? parseFloat(obj.price) : null,
          cost: obj.cost ? parseFloat(obj.cost) : null,
          condition: condition as any,
          status: status as any,
          description: obj.description || null,
          source: 'csv_import' as any,
          listed_date: new Date().toISOString().split('T')[0],
        })
        success++
      } catch (err) {
        errors.push({ row: i + 2, message: err instanceof Error ? err.message : 'Insert failed' })
      }
    }

    setResult({ success, errors })
    setImporting(false)
    if (success > 0) {
      toast.success(`${success} unit${success > 1 ? 's' : ''} imported`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!importing) { onOpenChange(v); if (!v) reset() } }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Inventory from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-add inventory units. Download the template to see the expected format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between rounded-lg border bg-zinc-50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span>Need the right format?</span>
            </div>
            <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>

          {/* File Input */}
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 cursor-pointer hover:border-zinc-400 hover:bg-zinc-100 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-zinc-400" />
            <p className="mt-2 text-sm font-medium">
              {preview ? `${rawRows.length} rows loaded` : 'Click to select CSV file'}
            </p>
            <p className="text-xs text-muted-foreground">CSV files only</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Preview Table */}
          {preview && preview.length > 0 && !result && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview (first {preview.length} of {rawRows.length} rows)</p>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b">
                      {headers.slice(0, 7).map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      {headers.length > 7 && <th className="px-2 py-1.5 text-muted-foreground">...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {headers.slice(0, 7).map((h) => (
                          <td key={h} className="px-2 py-1.5 max-w-[150px] truncate whitespace-nowrap">
                            {row[h] || <span className="text-muted-foreground">--</span>}
                          </td>
                        ))}
                        {headers.length > 7 && <td className="px-2 py-1.5 text-muted-foreground">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Columns detected: {headers.join(', ')}
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{result.success} unit{result.success !== 1 ? 's' : ''} imported successfully</span>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} failed
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600">
                        Row {err.row}: {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={() => { onOpenChange(false); reset() }} disabled={importing}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!preview || importing}>
                {importing ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Importing...</>
                ) : (
                  <><Upload className="mr-1.5 h-4 w-4" />Import {rawRows.length} Units</>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => { onOpenChange(false); reset() }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Inventory Page ───────────────────────────────────────────────────────────────

export function InventoryPage() {
  const { role } = useAuth()
  const isOwner = role === 'owner'

  const [filters, setFilters] = useState<InventoryFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const { data: inventory, isLoading } = useInventory(filters)

  const [selectedUnit, setSelectedUnit] = useState<InventoryUnit | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [csvImportOpen, setCsvImportOpen] = useState(false)

  function handleSearchChange(value: string) {
    setSearchInput(value)
    setFilters((prev) => ({ ...prev, search: value || undefined }))
  }

  function openDetail(unit: InventoryUnit) {
    setSelectedUnit(unit)
    setDialogOpen(true)
  }

  const count = inventory?.length ?? 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventory
            {!isLoading && (
              <span className="ml-2 text-base font-normal text-muted-foreground">({count})</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your units, track status, and monitor lot performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCsvImportOpen(true)}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Import CSV
          </Button>
          <Link to="/admin/inventory/new">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Unit
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.unit_type ?? ''}
          onValueChange={(val) => setFilters((prev) => ({ ...prev, unit_type: (val ?? '') || undefined }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {UNIT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.make ?? ''}
          onValueChange={(val) => setFilters((prev) => ({ ...prev, make: (val ?? '') || undefined }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Makes</SelectItem>
            {MAKES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status ?? ''}
          onValueChange={(val) => setFilters((prev) => ({ ...prev, status: (val ?? '') || undefined }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.condition ?? ''}
          onValueChange={(val) => setFilters((prev) => ({ ...prev, condition: (val ?? '') || undefined }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Conditions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Conditions</SelectItem>
            {CONDITION_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or stock #..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !inventory || inventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No inventory found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {filters.status || filters.unit_type || filters.make || filters.condition || filters.search
              ? 'Try adjusting your filters.'
              : 'Add your first unit to get started.'}
          </p>
          {!filters.status && !filters.unit_type && (
            <Link to="/admin/inventory/new" className="mt-4">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Unit
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inventory.map((unit) => (
            <InventoryCard
              key={unit.id}
              unit={unit}
              isOwner={isOwner}
              onClick={() => openDetail(unit)}
            />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <DetailDialog
        unit={selectedUnit}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isOwner={isOwner}
      />

      {/* CSV Import Dialog */}
      <CsvImportDialog open={csvImportOpen} onOpenChange={setCsvImportOpen} />
    </div>
  )
}
