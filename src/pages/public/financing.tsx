import { useState } from 'react'
import { FileText, Clock, ThumbsUp, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { PublicLayout } from '@/components/public/public-layout'
import { useSiteConfig } from '@/hooks/use-site-config'
import { useCreateLead } from '@/hooks/use-leads'

const trustBadges = [
  { icon: FileText, title: 'Easy Application', desc: 'Simple online form — no obligation, no impact on your credit score.' },
  { icon: Clock, title: 'Quick Approval', desc: 'Most applications reviewed within one business day.' },
  { icon: ThumbsUp, title: 'Competitive Rates', desc: 'We work with multiple lenders to find you the best rate available.' },
]

const interestOptions = [
  { value: 'boats', label: 'Boats' },
  { value: 'motors', label: 'Motors' },
  { value: 'lawn_equipment', label: 'Lawn Equipment' },
  { value: 'other', label: 'Other' },
]

export function FinancingPage() {
  const { data: config } = useSiteConfig()
  const createLead = useCreateLead()
  const phone = config?.phone ?? '(705) 253-7828'

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    message: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createLead.mutateAsync({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        message: `Interest: ${form.interest}\n${form.message}`.trim(),
        lead_type: 'financing',
        source: 'direct',
        landing_page: '/financing',
      })
      toast.success('Financing inquiry submitted! We will be in touch shortly.')
      setForm({ name: '', email: '', phone: '', interest: '', message: '' })
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-[#1B2A4A] px-4 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Flexible Financing Options</h1>
        <p className="mt-3 text-gray-300">
          Get the equipment you need today with payments that work for your budget.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 lg:px-8">
        <p className="mb-10 text-center text-gray-700">
          Whether you are looking at a new fishing boat, a pontoon for the family, or a
          commercial mower for your business, we offer financing solutions to fit every
          situation. Fill out the form below and our team will follow up with tailored options.
        </p>

        {/* Form */}
        <Card className="mx-auto mb-16 max-w-xl border border-gray-200">
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-[#1B2A4A]">Financing Inquiry</h2>
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
                <Label htmlFor="interest">What are you interested in?</Label>
                <Select value={form.interest} onValueChange={(v) => setForm((p) => ({ ...p, interest: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {interestOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {createLead.isPending ? 'Submitting...' : 'Submit Inquiry'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Trust Badges */}
        <div className="grid gap-6 md:grid-cols-3">
          {trustBadges.map((badge) => (
            <Card key={badge.title} className="border border-gray-200 text-center">
              <CardContent className="flex flex-col items-center p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#1B2A4A]">
                  <badge.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-1 text-base font-semibold text-[#1B2A4A]">{badge.title}</h3>
                <p className="text-sm text-gray-600">{badge.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="mb-2 text-gray-700">Prefer to talk to someone directly?</p>
          <a
            href={`tel:${phone.replace(/[^+\d]/g, '')}`}
            className="inline-flex items-center gap-2 text-xl font-bold text-[#D4712A] transition-colors hover:text-[#b85d1f]"
          >
            <Phone className="h-5 w-5" />
            {phone}
          </a>
        </div>
      </section>
    </PublicLayout>
  )
}
