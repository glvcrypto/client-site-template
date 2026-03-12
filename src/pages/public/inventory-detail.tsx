import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PublicLayout } from '@/components/public/public-layout'
import { useInventoryUnit } from '@/hooks/use-inventory'
import { useCreateLead } from '@/hooks/use-leads'
import type { Json } from '@/lib/database.types'

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

function statusColour(status: string | null) {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800'
    case 'featured':
      return 'bg-purple-100 text-purple-800'
    case 'clearance':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatPrice(price: number | null) {
  if (!price) return 'Call for Price'
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(price)
}

export function InventoryDetailPage() {
  const { unitId } = useParams({ strict: false }) as { unitId: string }
  const { data: unit, isLoading } = useInventoryUnit(unitId)
  const createLead = useCreateLead()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createLead.mutateAsync({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        message: form.message || null,
        lead_type: 'quote_request',
        source: 'direct',
        landing_page: window.location.pathname,
      })
      toast.success('Quote request sent! We will be in touch shortly.')
      setForm({ name: '', email: '', phone: '', message: '' })
      setDialogOpen(false)
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="py-32 text-center text-gray-500">Loading...</div>
      </PublicLayout>
    )
  }

  if (!unit) {
    return (
      <PublicLayout>
        <div className="py-32 text-center">
          <p className="mb-4 text-gray-500">Unit not found.</p>
          <Button asChild variant="outline">
            <Link to="/inventory">Back to Inventory</Link>
          </Button>
        </div>
      </PublicLayout>
    )
  }

  const specs = unit.specs as Record<string, string> | null

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        {/* Back link */}
        <Link
          to="/inventory"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-[#1B2A4A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image area */}
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-gray-100">
            {unit.images && Array.isArray(unit.images) && (unit.images as string[]).length > 0 ? (
              <img
                src={(unit.images as string[])[0]}
                alt={unit.unit_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-80 w-full items-center justify-center">
                <Package className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="mb-2 text-2xl font-bold text-[#1B2A4A] md:text-3xl">{unit.unit_name}</h1>
            <p className="mb-4 text-gray-600">
              {[unit.year, unit.make, unit.model].filter(Boolean).join(' ')}
            </p>

            <p className="mb-4 text-3xl font-bold text-[#D4712A]">{formatPrice(unit.price)}</p>

            <div className="mb-6 flex flex-wrap gap-2">
              {unit.condition && (
                <Badge variant="secondary" className={conditionColour(unit.condition)}>
                  {unit.condition}
                </Badge>
              )}
              {unit.status && (
                <Badge variant="secondary" className={statusColour(unit.status)}>
                  {unit.status}
                </Badge>
              )}
              {unit.stock_number && (
                <Badge variant="outline">Stock #{unit.stock_number}</Badge>
              )}
            </div>

            {unit.description && (
              <div className="mb-6">
                <h2 className="mb-2 text-lg font-semibold text-[#1B2A4A]">Description</h2>
                <p className="text-sm leading-relaxed text-gray-700">{unit.description}</p>
              </div>
            )}

            {specs && Object.keys(specs).length > 0 && (
              <div className="mb-6">
                <h2 className="mb-2 text-lg font-semibold text-[#1B2A4A]">Specifications</h2>
                <Card className="border border-gray-200">
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(specs).map(([key, value]) => (
                          <tr key={key} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-2 font-medium text-gray-600">{key}</td>
                            <td className="px-4 py-2 text-gray-900">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Request a Quote */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full bg-[#D4712A] text-white hover:bg-[#b85d1f] sm:w-auto">
                  Request a Quote
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request a Quote</DialogTitle>
                  <DialogDescription>
                    Interested in the {unit.unit_name}? Fill out the form and we will get back to you.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createLead.isPending}
                    className="w-full bg-[#D4712A] text-white hover:bg-[#b85d1f]"
                  >
                    {createLead.isPending ? 'Sending...' : 'Send Quote Request'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
