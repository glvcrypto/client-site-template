import { useState } from 'react'
import { Phone, Clock, DollarSign, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PublicLayout } from '@/components/public/public-layout'
import { useSiteConfig } from '@/hooks/use-site-config'
import { usePageContent } from '@/hooks/use-content'
import { useServiceCatalogue, type ServiceCatalogueRow } from '@/hooks/use-service-catalogue'
import { useAvailableSlots, useCreateBooking, type TimeSlot } from '@/hooks/use-service-bookings'
import { useLocations } from '@/hooks/use-locations'
import { toast } from 'sonner'

// ── Booking Modal ────────────────────────────────────────────────────────────────

type BookingStep = 'date' | 'time' | 'info' | 'success'

function BookingModal({
  open,
  onOpenChange,
  service,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: ServiceCatalogueRow
}) {
  const { data: locations } = useLocations()
  const primaryLocation = locations?.find((l) => l.is_primary) ?? locations?.[0]
  const locationId = primaryLocation?.id

  const [step, setStep] = useState<BookingStep>('date')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')

  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(
    service.id,
    selectedDate,
    locationId
  )
  const createBooking = useCreateBooking()

  const today = new Date().toISOString().split('T')[0]

  function reset() {
    setStep('date')
    setSelectedDate('')
    setSelectedTime('')
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setNotes('')
  }

  function handleClose(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  function handleDateNext() {
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    setStep('time')
  }

  function handleTimeNext() {
    if (!selectedTime) {
      toast.error('Please select a time slot')
      return
    }
    setStep('info')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error('Name and email are required')
      return
    }
    try {
      await createBooking.mutateAsync({
        customer_name: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim() || null,
        service_id: service.id,
        preferred_date: selectedDate,
        preferred_time_slot: selectedTime,
        notes: notes.trim() || null,
        location_id: locationId ?? null,
      })
      setStep('success')
    } catch {
      toast.error('Failed to submit booking. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'success' ? 'Booking Submitted' : `Book: ${service.name}`}
          </DialogTitle>
          {step !== 'success' && (
            <DialogDescription>
              {step === 'date' && 'Choose your preferred date.'}
              {step === 'time' && 'Select an available time slot.'}
              {step === 'info' && 'Enter your contact information.'}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step: Date */}
        {step === 'date' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-date">Preferred Date</Label>
              <Input
                id="booking-date"
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setSelectedTime('') // reset time on date change
                }}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleDateNext} disabled={!selectedDate}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === 'time' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Available slots for{' '}
              <span className="font-medium text-foreground">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-CA', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </p>
            {slotsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !slots?.length ? (
              <div className="rounded-lg border bg-muted/50 p-6 text-center">
                <p className="text-sm font-medium">No availability on this date</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Please choose a different date.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setStep('date')}
                >
                  Back
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot: TimeSlot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? 'default' : 'outline'}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className="text-xs"
                    >
                      {formatSlotTime(slot.time)}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('date')}>
                    Back
                  </Button>
                  <Button onClick={handleTimeNext} disabled={!selectedTime}>
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Info */}
        {step === 'info' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-name">Name *</Label>
              <Input
                id="booking-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-email">Email *</Label>
              <Input
                id="booking-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-phone">Phone</Label>
              <Input
                id="booking-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-notes">Notes</Label>
              <Textarea
                id="booking-notes"
                rows={3}
                placeholder="Any details about your unit or request..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep('time')}>
                Back
              </Button>
              <Button type="submit" disabled={createBooking.isPending}>
                {createBooking.isPending && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Submit Booking
              </Button>
            </div>
          </form>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="mt-4 text-sm font-medium">Your booking has been submitted!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We&apos;ll confirm your appointment shortly via email.
            </p>
            <Button className="mt-6" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function formatSlotTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`
}

// ── Main Page ────────────────────────────────────────────────────────────────────

export function ServicesPage() {
  const { data: config } = useSiteConfig()
  const { data: content } = usePageContent('services')
  const { data: catalogue, isLoading: catalogueLoading } = useServiceCatalogue()

  const [bookingService, setBookingService] = useState<ServiceCatalogueRow | null>(null)

  const phone = config?.business_phone ?? config?.phone ?? '(705) 253-7828'

  // CMS content with fallbacks
  const heroTitle = content?.hero_title?.value || content?.title?.value || 'Expert Service & Repairs'
  const heroSubtitle =
    content?.hero_subtitle?.value ||
    content?.intro?.value ||
    'Factory-trained technicians. Fast turnaround. Fair prices.'
  const ctaHeading = content?.cta_heading?.value ?? 'Need help? Give us a call.'

  // Group catalogue by category
  const grouped = (catalogue ?? []).reduce<Record<string, ServiceCatalogueRow[]>>((acc, s) => {
    const cat = s.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-[#1B2A4A] px-4 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">{heroTitle}</h1>
        <p className="mt-3 text-gray-300">{heroSubtitle}</p>
      </section>

      {/* Service Catalogue */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        {catalogueLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center text-muted-foreground">
            No services currently available. Please check back later.
          </p>
        ) : (
          Object.entries(grouped).map(([category, services]) => (
            <div key={category} className="mb-16 last:mb-0">
              <h2 className="mb-6 text-xl font-bold text-[#1B2A4A] md:text-2xl">{category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <Card key={service.id} className="border border-gray-200">
                    <CardContent className="flex flex-col gap-3 p-6">
                      <h3 className="text-base font-semibold text-[#1B2A4A]">{service.name}</h3>
                      {service.description && (
                        <p className="flex-1 text-sm text-gray-600">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {service.default_price != null && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {Number(service.default_price).toFixed(2)}
                          </span>
                        )}
                        {service.estimated_duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {service.estimated_duration_minutes} min
                          </span>
                        )}
                      </div>
                      {service.allow_booking ? (
                        <Button
                          size="sm"
                          className="mt-1 w-fit bg-[#1B2A4A] text-white hover:bg-[#152238]"
                          onClick={() => setBookingService(service)}
                        >
                          Book Now
                        </Button>
                      ) : (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="mt-1 w-fit border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white"
                        >
                          <a href="/contact">Request Service</a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* CTA */}
      <section className="bg-gray-50 px-4 py-16 text-center lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold text-[#1B2A4A]">{ctaHeading}</h2>
          <a
            href={`tel:${phone.replace(/[^+\d]/g, '')}`}
            className="inline-flex items-center gap-2 text-2xl font-bold text-[#D4712A] transition-colors hover:text-[#b85d1f]"
          >
            <Phone className="h-6 w-6" />
            {phone}
          </a>
        </div>
      </section>

      {/* Booking Modal */}
      {bookingService && (
        <BookingModal
          open={!!bookingService}
          onOpenChange={(open) => { if (!open) setBookingService(null) }}
          service={bookingService}
        />
      )}
    </PublicLayout>
  )
}
