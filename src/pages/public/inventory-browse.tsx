import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PublicLayout } from '@/components/public/public-layout'
import { usePublicInventory } from '@/hooks/use-inventory'

const categoryOptions = [
  { value: 'fishing_boat', label: 'Fishing Boats' },
  { value: 'pontoon', label: 'Pontoons' },
  { value: 'outboard_motor', label: 'Outboard Motors' },
  { value: 'lawn_mower', label: 'Lawn Mowers' },
  { value: 'snow_blower', label: 'Snow Blowers' },
  { value: 'chainsaw', label: 'Chainsaws' },
]

const conditionOptions = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'demo', label: 'Demo' },
]

function conditionColour(condition: string | null) {
  switch (condition) {
    case 'new':
      return 'bg-green-100 text-green-800'
    case 'used':
      return 'bg-amber-100 text-amber-800'
    case 'demo':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatPrice(price: number | null) {
  if (!price) return 'Call for Price'
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(price)
}

export function InventoryBrowsePage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>
  const [unitType, setUnitType] = useState(searchParams?.unit_type ?? '')
  const [condition, setCondition] = useState('')
  const [searchText, setSearchText] = useState('')

  const { data: units, isLoading } = usePublicInventory({
    unit_type: unitType || undefined,
    condition: condition || undefined,
    search: searchText || undefined,
  })

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-[#1B2A4A] px-4 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Browse Our Inventory</h1>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Filter bar */}
        <div className="mb-8 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
            <Select value={unitType} onValueChange={(v) => setUnitType(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Condition</label>
            <Select value={condition} onValueChange={(v) => setCondition(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {conditionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Brand or model..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <p className="py-20 text-center text-gray-500">Loading inventory...</p>
        ) : !units?.length ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No inventory matches your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <Card key={unit.id} className="group overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg">
                {/* Image placeholder */}
                <div className="flex h-48 items-center justify-center bg-gray-100">
                  {unit.images && Array.isArray(unit.images) && (unit.images as string[]).length > 0 ? (
                    <img
                      src={(unit.images as string[])[0]}
                      alt={unit.unit_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#1B2A4A]">{unit.unit_name}</h3>
                    <Badge variant="secondary" className={conditionColour(unit.condition)}>
                      {unit.condition ?? 'N/A'}
                    </Badge>
                  </div>
                  <p className="mb-1 text-sm text-gray-600">
                    {[unit.year, unit.make, unit.model].filter(Boolean).join(' ')}
                  </p>
                  <p className="mb-4 text-lg font-bold text-[#D4712A]">{formatPrice(unit.price)}</p>
                  <Button asChild className="w-full bg-[#1B2A4A] text-white hover:bg-[#14203a]">
                    <Link to="/inventory/$unitId" params={{ unitId: unit.id }}>
                      View Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  )
}
