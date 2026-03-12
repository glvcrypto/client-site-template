import { Link } from '@tanstack/react-router'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/public-layout'
import { useSiteConfig } from '@/hooks/use-site-config'

interface ServiceItem {
  name: string
  desc: string
}

interface ServiceGroup {
  title: string
  services: ServiceItem[]
}

const serviceGroups: ServiceGroup[] = [
  {
    title: 'Marine',
    services: [
      { name: 'Engine Repair & Rebuild', desc: 'Inboard and outboard engine diagnostics, repair, and overhaul.' },
      { name: 'Winterisation & Storage', desc: 'Full winterisation service to protect your boat through Northern Ontario winters.' },
      { name: 'Spring Commissioning', desc: 'Pre-season inspection, fluid changes, and launch preparation.' },
      { name: 'Trailer Service', desc: 'Bearing repacks, wiring, and structural inspections.' },
      { name: 'Electronics Installation', desc: 'Fish finders, GPS, trolling motors, and marine wiring.' },
    ],
  },
  {
    title: 'Lawn & Garden',
    services: [
      { name: 'Mower Tune-Ups', desc: 'Blade sharpening, oil changes, and belt replacements.' },
      { name: 'Riding Mower Repair', desc: 'Engine, transmission, and deck service for ride-on mowers.' },
      { name: 'Trimmer & Blower Service', desc: 'Carburettor cleaning, line replacement, and general maintenance.' },
      { name: 'Snow Blower Service', desc: 'Auger, drive, and engine service for two-stage blowers.' },
      { name: 'Seasonal Maintenance Packages', desc: 'Bundled spring or fall service at a discounted rate.' },
    ],
  },
  {
    title: 'Outdoor Power',
    services: [
      { name: 'Chainsaw Sharpening & Repair', desc: 'Chain sharpening, bar service, and engine tune-ups.' },
      { name: 'Generator Service', desc: 'Load testing, oil changes, and fuel system cleaning.' },
      { name: 'Pressure Washer Repair', desc: 'Pump rebuilds, hose replacements, and engine work.' },
      { name: 'Golf Cart & UTV Service', desc: 'Battery, motor, and drivetrain service for E-Z-GO and more.' },
      { name: 'Small Engine Repair', desc: 'General repair for any small gas or electric engine.' },
      { name: 'Welding & Fabrication', desc: 'Custom brackets, trailer repairs, and structural welding.' },
    ],
  },
  {
    title: 'Other',
    services: [
      { name: 'Parts Counter', desc: 'OEM and aftermarket parts ordering with competitive pricing.' },
      { name: 'Warranty Work', desc: 'Authorised warranty service for all brands we carry.' },
      { name: 'Pick-Up & Delivery', desc: 'We can pick up and return equipment in the Sault Ste. Marie area.' },
    ],
  },
]

export function ServicesPage() {
  const { data: config } = useSiteConfig()
  const phone = config?.phone ?? '(705) 253-7828'

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-[#1B2A4A] px-4 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Expert Service &amp; Repairs</h1>
        <p className="mt-3 text-gray-300">
          Factory-trained technicians. Fast turnaround. Fair prices.
        </p>
      </section>

      {/* Service Groups */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        {serviceGroups.map((group) => (
          <div key={group.title} className="mb-16 last:mb-0">
            <h2 className="mb-6 text-xl font-bold text-[#1B2A4A] md:text-2xl">{group.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.services.map((service) => (
                <Card key={service.name} className="border border-gray-200">
                  <CardContent className="flex flex-col gap-3 p-6">
                    <h3 className="text-base font-semibold text-[#1B2A4A]">{service.name}</h3>
                    <p className="flex-1 text-sm text-gray-600">{service.desc}</p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-1 w-fit border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white"
                    >
                      <Link to="/contact" search={{ service: service.name }}>
                        Request Service
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-gray-50 px-4 py-16 text-center lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold text-[#1B2A4A]">Need help? Give us a call.</h2>
          <a
            href={`tel:${phone.replace(/[^+\d]/g, '')}`}
            className="inline-flex items-center gap-2 text-2xl font-bold text-[#D4712A] transition-colors hover:text-[#b85d1f]"
          >
            <Phone className="h-6 w-6" />
            {phone}
          </a>
        </div>
      </section>
    </PublicLayout>
  )
}
