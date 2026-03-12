import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Ship,
  Sailboat,
  Zap,
  TreePine,
  Snowflake,
  Axe,
  Wrench,
  Shield,
  MapPin,
  Star,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PublicLayout } from '@/components/public/public-layout'
import { useSiteConfig } from '@/hooks/use-site-config'
import { usePageContent } from '@/hooks/use-content'
import { useActiveTestimonials } from '@/hooks/use-testimonials'
import { useActiveBanners } from '@/hooks/use-banners'

const categories = [
  { icon: Ship, name: 'Fishing Boats', desc: 'Aluminium & fiberglass fishing rigs for every angler.', filter: 'fishing_boat' },
  { icon: Sailboat, name: 'Pontoons', desc: 'Family-friendly pontoon boats for lake days.', filter: 'pontoon' },
  { icon: Zap, name: 'Outboard Motors', desc: 'Reliable power from top marine brands.', filter: 'outboard_motor' },
  { icon: TreePine, name: 'Lawn Mowers', desc: 'Residential & commercial mowing equipment.', filter: 'lawn_mower' },
  { icon: Snowflake, name: 'Snow Blowers', desc: 'Handle Northern Ontario winters with ease.', filter: 'snow_blower' },
  { icon: Axe, name: 'Chainsaws', desc: 'Professional & homeowner chainsaws.', filter: 'chainsaw' },
]

const features = [
  { icon: Wrench, title: 'Expert Certified Technicians', desc: 'Factory-trained service staff who know your equipment inside and out.' },
  { icon: Shield, title: 'Top Canadian & American Brands', desc: 'Authorised dealer for the brands you trust most.' },
  { icon: MapPin, title: 'Your Neighbours, Not a Corporation', desc: 'Locally owned and operated in Sault Ste. Marie since day one.' },
]

const defaultBrands = ['Princecraft', 'Mercury', 'Cub Cadet', 'Toro', 'ECHO', 'Minn Kota', 'Humminbird', 'E-Z-GO']

// ── Banner Carousel ──────────────────────────────────────────────────────────

function BannerCarousel({ banners }: { banners: any[] }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  if (banners.length === 0) return null

  const banner = banners[current]

  return (
    <section className="relative w-full overflow-hidden bg-gray-100">
      <a
        href={banner.link_url ?? '#'}
        className="block"
        {...(!banner.link_url ? { onClick: (e: React.MouseEvent) => e.preventDefault() } : {})}
      >
        <img
          src={banner.image_url}
          alt={banner.title}
          className="h-48 w-full object-cover sm:h-64 lg:h-80"
        />
      </a>
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 w-2 rounded-full transition ${i === current ? 'bg-white' : 'bg-white/50'}`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// ── Home Page ────────────────────────────────────────────────────────────────

export function HomePage() {
  const { data: config } = useSiteConfig()
  const { data: content } = usePageContent('home')
  const { data: testimonials } = useActiveTestimonials()
  const { data: banners } = useActiveBanners()

  const businessName = config?.business_name ?? 'Dealership Name'
  const phone = config?.business_phone ?? config?.phone ?? '(705) 253-7828'
  const address = config?.business_address ?? config?.address ?? '123 Great Northern Rd, Sault Ste. Marie, ON'

  // CMS content with sensible fallbacks
  const heroHeadline = content?.hero_headline?.value ?? 'Your One Stop Shop for Boats, Motors & Outdoor Power Equipment'
  const heroSubheadline = content?.hero_subheadline?.value ?? 'Proudly serving Sault Ste. Marie and Northern Ontario since day one.'
  const heroCtaText = content?.hero_cta_text?.value ?? 'Browse Inventory'
  const heroCtaSecondary = content?.hero_cta_secondary?.value ?? 'Book a Service'
  const categoriesHeading = content?.categories_heading?.value ?? 'What We Carry'
  const whyChooseHeading = content?.why_choose_heading?.value ?? 'Why Choose Us'
  const seasonalHeading = content?.seasonal_heading?.value ?? 'Get Your Boat Ready for Summer \u2014 Book a Pre-Season Inspection'
  const seasonalCtaText = content?.seasonal_cta_text?.value ?? 'Book Service'
  const testimonialsHeading = content?.testimonials_heading?.value ?? 'What Our Customers Say'

  // Fallback testimonials if CMS has none
  const displayTestimonials = testimonials && testimonials.length > 0
    ? testimonials
    : [
        { id: '1', customer_name: 'Mark T.', rating: 5, quote: 'Bought our pontoon here last spring. The team made financing painless and the boat was lake-ready the same week. Highly recommend.' },
        { id: '2', customer_name: 'Sarah L.', rating: 5, quote: 'Brought my mower in for service and they had it back in two days. Fair pricing and honest advice every time.' },
        { id: '3', customer_name: 'Dave R.', rating: 4, quote: 'Great selection of fishing boats. The staff really knows their stuff and helped me pick the perfect rig for walleye season.' },
      ]

  return (
    <PublicLayout>
      {/* Banner Carousel */}
      {banners && banners.length > 0 && <BannerCarousel banners={banners} />}

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2A4A] to-[#2a3f6b] px-4 py-24 text-center text-white lg:py-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-3xl font-bold leading-tight md:text-5xl">
            {heroHeadline}
          </h1>
          <p className="mb-8 text-lg text-gray-300">
            {heroSubheadline}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-[#D4712A] text-white hover:bg-[#b85d1f]">
              <Link to="/inventory">{heroCtaText}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Link to="/contact">{heroCtaSecondary}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <h2 className="mb-10 text-center text-2xl font-bold text-[#1B2A4A] md:text-3xl">
          {categoriesHeading}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link key={cat.filter} to="/inventory" search={{ unit_type: cat.filter }}>
              <Card className="group cursor-pointer border border-gray-200 transition-shadow hover:shadow-lg">
                <CardContent className="flex flex-col items-center p-8 text-center">
                  <cat.icon className="mb-4 h-10 w-10 text-[#D4712A] transition-transform group-hover:scale-110" />
                  <h3 className="mb-2 text-lg font-semibold text-[#1B2A4A]">{cat.name}</h3>
                  <p className="text-sm text-gray-600">{cat.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-gray-50 px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-[#1B2A4A] md:text-3xl">
            {whyChooseHeading}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B2A4A]">
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#1B2A4A]">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Bar */}
      <section className="bg-gray-100 px-4 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8">
          {defaultBrands.map((brand) => (
            <span key={brand} className="text-sm font-semibold tracking-wide text-[#1B2A4A]">
              {brand}
            </span>
          ))}
        </div>
      </section>

      {/* Seasonal CTA */}
      <section className="bg-[#D4712A] px-4 py-16 text-center text-white lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            {seasonalHeading}
          </h2>
          <Button asChild size="lg" className="bg-white text-[#D4712A] hover:bg-gray-100">
            <Link to="/contact">{seasonalCtaText}</Link>
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <h2 className="mb-10 text-center text-2xl font-bold text-[#1B2A4A] md:text-3xl">
          {testimonialsHeading}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {displayTestimonials.slice(0, 6).map((t: any) => (
            <Card key={t.id} className="border border-gray-200">
              <CardContent className="p-6">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#D4712A] text-[#D4712A]" />
                  ))}
                </div>
                <p className="mb-4 text-sm text-gray-700">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm font-semibold text-[#1B2A4A]">{t.customer_name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Bar */}
      <section className="bg-gray-50 px-4 py-16 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="text-lg font-bold text-[#1B2A4A]">{businessName}</h3>
            <p className="text-sm text-gray-600">{address}</p>
            <p className="text-sm text-gray-600">Mon-Fri 8:30-5:30 | Sat 9-3 | Sun Closed</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`tel:${phone.replace(/[^+\d]/g, '')}`}
              className="flex items-center gap-2 font-semibold text-[#1B2A4A]"
            >
              <Phone className="h-4 w-4" />
              {phone}
            </a>
            <Button asChild className="bg-[#1B2A4A] text-white hover:bg-[#14203a]">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
