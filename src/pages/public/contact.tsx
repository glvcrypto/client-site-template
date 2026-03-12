import { useState, useEffect } from 'react'
import { useSearch } from '@tanstack/react-router'
import { Phone, MapPin, Clock, Mail } from 'lucide-react'
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

const serviceOptions = [
  'General Inquiry',
  'Engine Repair & Rebuild',
  'Winterisation & Storage',
  'Spring Commissioning',
  'Trailer Service',
  'Electronics Installation',
  'Mower Tune-Ups',
  'Riding Mower Repair',
  'Trimmer & Blower Service',
  'Snow Blower Service',
  'Seasonal Maintenance Packages',
  'Chainsaw Sharpening & Repair',
  'Generator Service',
  'Pressure Washer Repair',
  'Golf Cart & UTV Service',
  'Small Engine Repair',
  'Welding & Fabrication',
  'Parts Counter',
  'Warranty Work',
  'Pick-Up & Delivery',
]

export function ContactPage() {
  const { data: config } = useSiteConfig()
  const createLead = useCreateLead()
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>

  const businessName = config?.business_name ?? 'Dealership Name'
  const address = config?.address ?? '123 Great Northern Rd, Sault Ste. Marie, ON'
  const phone = config?.phone ?? '(705) 253-7828'
  const email = config?.email ?? 'info@example.com'

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  })

  // Pre-select service from search params (linked from services page)
  useEffect(() => {
    if (searchParams?.service) {
      setForm((p) => ({ ...p, service: searchParams.service as string }))
    }
  }, [searchParams?.service])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createLead.mutateAsync({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        message: `Service: ${form.service || 'General Inquiry'}\n${form.message}`.trim(),
        lead_type: 'contact',
        source: 'direct',
        landing_page: '/contact',
      })
      toast.success('Message sent! We will be in touch shortly.')
      setForm({ name: '', email: '', phone: '', service: '', message: '' })
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-[#1B2A4A] px-4 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Contact Us</h1>
        <p className="mt-3 text-gray-300">
          Questions? Ready to book a service? We would love to hear from you.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left: Contact Form */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-[#1B2A4A]">Send Us a Message</h2>
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
                  <Label htmlFor="service">Service Needed</Label>
                  <Select value={form.service} onValueChange={(v) => setForm((p) => ({ ...p, service: v ?? '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createLead.isPending}
                  className="w-full bg-[#D4712A] text-white hover:bg-[#b85d1f]"
                >
                  {createLead.isPending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right: Business Info */}
          <div className="flex flex-col gap-6">
            <Card className="border border-gray-200">
              <CardContent className="space-y-5 p-6">
                <h2 className="text-xl font-semibold text-[#1B2A4A]">{businessName}</h2>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#D4712A]" />
                  <div>
                    <p className="text-sm font-medium text-[#1B2A4A]">Address</p>
                    <p className="text-sm text-gray-600">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#D4712A]" />
                  <div>
                    <p className="text-sm font-medium text-[#1B2A4A]">Phone</p>
                    <a
                      href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                      className="text-sm text-[#D4712A] hover:underline"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#D4712A]" />
                  <div>
                    <p className="text-sm font-medium text-[#1B2A4A]">Email</p>
                    <a href={`mailto:${email}`} className="text-sm text-[#D4712A] hover:underline">
                      {email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#D4712A]" />
                  <div>
                    <p className="text-sm font-medium text-[#1B2A4A]">Hours</p>
                    <ul className="text-sm text-gray-600">
                      <li>Monday - Friday: 8:30 AM - 5:30 PM</li>
                      <li>Saturday: 9:00 AM - 3:00 PM</li>
                      <li>Sunday: Closed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map placeholder */}
            <Card className="border border-gray-200">
              <CardContent className="p-0">
                <div className="flex h-56 flex-col items-center justify-center bg-gray-100 text-center">
                  <MapPin className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">Map Placeholder</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#D4712A] hover:underline"
                  >
                    Get Directions
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Social placeholder */}
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Facebook</span>
              <span>Instagram</span>
              <span>Google Business</span>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
