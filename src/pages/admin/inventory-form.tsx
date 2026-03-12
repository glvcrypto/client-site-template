import { useState, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useCreateInventory } from '@/hooks/use-inventory'
import { useImageUpload } from '@/hooks/use-image-upload'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, X, Loader2, Upload, ImageIcon, GripVertical, Trash2 } from 'lucide-react'
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
  'Troy-Bilt', 'Humminbird', 'Minn Kota', 'E-Z-GO', 'Other',
]

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'on_order', label: 'On Order' },
  { value: 'featured', label: 'Featured' },
  { value: 'clearance', label: 'Clearance' },
]

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'demo', label: 'Demo' },
]

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'lightspeed', label: 'Lightspeed' },
  { value: 'csv_import', label: 'CSV Import' },
]

// ── Spec Row ─────────────────────────────────────────────────────────────────────

interface SpecRow {
  key: string
  value: string
}

// ── Form Page ────────────────────────────────────────────────────────────────────

export function InventoryFormPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const isOwner = role === 'owner'
  const createMutation = useCreateInventory()

  // Form state
  const [unitName, setUnitName] = useState('')
  const [unitType, setUnitType] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [stockNumber, setStockNumber] = useState('')
  const [vin, setVin] = useState('')
  const [price, setPrice] = useState('')
  const [cost, setCost] = useState('')
  const [condition, setCondition] = useState('new')
  const [status, setStatus] = useState('available')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('manual')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [specs, setSpecs] = useState<SpecRow[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImages, deleteImage, uploading, progress } = useImageUpload()

  function addSpec() {
    setSpecs((prev) => [...prev, { key: '', value: '' }])
  }

  function removeSpec(index: number) {
    setSpecs((prev) => prev.filter((_, i) => i !== index))
  }

  function updateSpec(index: number, field: 'key' | 'value', val: string) {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: val } : s)))
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 10MB limit`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    try {
      const urls = await uploadImages(validFiles)
      setUploadedImages((prev) => [...prev, ...urls])
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`)
    } catch {
      toast.error('Failed to upload images')
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleRemoveImage(url: string) {
    try {
      await deleteImage(url)
      setUploadedImages((prev) => prev.filter((u) => u !== url))
    } catch {
      // Still remove from UI even if storage delete fails
      setUploadedImages((prev) => prev.filter((u) => u !== url))
    }
  }

  // Build specs object
  function getSpecsObject(): Record<string, string> | null {
    const filtered = specs.filter((s) => s.key.trim() && s.value.trim())
    if (filtered.length === 0) return null
    const obj: Record<string, string> = {}
    for (const s of filtered) {
      obj[s.key.trim()] = s.value.trim()
    }
    return obj
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!unitName.trim()) {
      toast.error('Unit name is required')
      return
    }
    if (!unitType) {
      toast.error('Unit type is required')
      return
    }

    const specsObj = getSpecsObject()

    try {
      await createMutation.mutateAsync({
        unit_name: unitName.trim(),
        unit_type: unitType,
        make: make || null,
        model: model.trim() || null,
        year: year ? parseInt(year, 10) : null,
        stock_number: stockNumber.trim() || null,
        vin: vin.trim() || null,
        price: price ? parseFloat(price) : null,
        cost: isOwner && cost ? parseFloat(cost) : null,
        condition: condition as 'new' | 'used' | 'demo',
        status: status as 'available' | 'on_order' | 'featured' | 'clearance',
        description: description.trim() || null,
        source: source as 'manual' | 'lightspeed' | 'csv_import',
        images: uploadedImages.length > 0 ? uploadedImages : null,
        specs: specsObj,
        listed_date: new Date().toISOString().split('T')[0],
      })
      toast.success('Unit added successfully')
      navigate({ to: '/admin/inventory' })
    } catch {
      toast.error('Failed to add unit. Please try again.')
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Back */}
      <Link to="/admin/inventory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Unit</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details below. Leave price blank for &quot;Call for Price&quot;.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="unitName">Unit Name *</Label>
                <Input
                  id="unitName"
                  placeholder="e.g. 2024 Princecraft Vectra 21RL"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unitType">Unit Type *</Label>
                <Select value={unitType} onValueChange={(v) => setUnitType(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="make">Make</Label>
                <Select value={make} onValueChange={(v) => setMake(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {MAKES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g. Vectra 21RL"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="e.g. 2024"
                  min={1900}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="stockNumber">Stock Number</Label>
                <Input
                  id="stockNumber"
                  placeholder="e.g. STK-0042"
                  value={stockNumber}
                  onChange={(e) => setStockNumber(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  placeholder="Vehicle/Serial number"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="price">Price (CAD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="Leave blank for 'Call for Price'"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              {isOwner && (
                <div>
                  <Label htmlFor="cost">Cost (CAD)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Internal cost"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label>Condition</Label>
                <Select value={condition} onValueChange={(v) => setCondition(v ?? 'new')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v ?? 'available')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Source</Label>
                <Select value={source} onValueChange={(v) => setSource(v ?? 'manual')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Detailed description of the unit, features, condition notes..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Specs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Specs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {specs.length === 0 && (
              <p className="text-sm text-muted-foreground">No specs added yet.</p>
            )}
            {specs.map((spec, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Key (e.g. Length)"
                  value={spec.key}
                  onChange={(e) => updateSpec(i, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value (e.g. 21 ft)"
                  value={spec.value}
                  onChange={(e) => updateSpec(i, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addSpec}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Spec
            </Button>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload area */}
            <div
              className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 transition-colors hover:border-zinc-400 hover:bg-zinc-100 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5') }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-primary/5') }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                const files = e.dataTransfer.files
                if (files.length > 0 && fileInputRef.current) {
                  const dt = new DataTransfer()
                  Array.from(files).forEach((f) => dt.items.add(f))
                  fileInputRef.current.files = dt.files
                  fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
                }
              }}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm font-medium">Uploading... {progress}%</p>
                  <div className="mt-2 h-1.5 w-48 rounded-full bg-zinc-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-zinc-400" />
                  <p className="mt-2 text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or GIF (max 10MB each)</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Uploaded images grid */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {uploadedImages.map((url, i) => (
                  <div key={url} className="group relative aspect-[4/3] rounded-lg border overflow-hidden bg-zinc-100">
                    <img
                      src={url}
                      alt={`Image ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadedImages.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} uploaded. First image is the cover photo.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={createMutation.isPending || uploading}>
            {createMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Add Unit
          </Button>
          <Link to="/admin/inventory">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
