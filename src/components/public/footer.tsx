import { Link } from '@tanstack/react-router'
import { Phone, Mail, MapPin } from 'lucide-react'
import { useSiteConfig } from '@/hooks/use-site-config'
import { usePrimaryLocation } from '@/hooks/use-locations'
import { useSocialLinks } from '@/hooks/use-social-links'
import { usePublicNavigation } from '@/hooks/use-navigation'

const DAY_LABELS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

function formatTime(time: string | null): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`
}

export function Footer() {
  const { data: config } = useSiteConfig()
  const primaryLocation = usePrimaryLocation()
  const { data: socialLinks } = useSocialLinks()
  const { data: navItems } = usePublicNavigation()

  const businessName = config?.business_name ?? 'Dealership Name'
  const tagline = config?.tagline ?? 'Your trusted local dealer'
  const address = primaryLocation
    ? `${primaryLocation.address ?? ''}, ${primaryLocation.city ?? ''} ${primaryLocation.province ?? ''} ${primaryLocation.postal_code ?? ''}`.trim()
    : config?.business_address ?? config?.address ?? '123 Great Northern Rd, Sault Ste. Marie, ON'
  const phone = primaryLocation?.phone ?? config?.business_phone ?? config?.phone ?? '(705) 253-7828'
  const email = primaryLocation?.email ?? config?.business_email ?? config?.email ?? 'info@example.com'

  // Hours from primary location
  const hours = (primaryLocation?.site_hours ?? []) as any[]

  // Quick links from CMS navigation or fallback
  const quickLinks = navItems && navItems.length > 0
    ? navItems
        .filter((item: any) => item.route_path !== '/')
        .slice(0, 6)
        .map((item: any) => ({ label: item.label, to: item.route_path }))
    : [
        { label: 'Inventory', to: '/inventory' },
        { label: 'Services', to: '/services' },
        { label: 'Financing', to: '/financing' },
        { label: 'About Us', to: '/about' },
        { label: 'Contact', to: '/contact' },
      ]

  const activeSocials = socialLinks?.filter((l: any) => l.is_active && l.url) ?? []

  return (
    <footer className="bg-[#1B2A4A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="mb-3 text-lg font-bold">{businessName}</h3>
            <p className="mb-4 text-sm text-gray-300">{tagline}</p>
            <div className="flex items-start gap-2 text-sm text-gray-300">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{address}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-2">
              {quickLinks.map((link: any) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-gray-300 transition-colors hover:text-[#D4712A]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Hours */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Hours
            </h4>
            <ul className="space-y-1 text-sm text-gray-300">
              {hours.length > 0 ? (
                [1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                  const h = hours.find((hr: any) => hr.day_of_week === dayNum)
                  return (
                    <li key={dayNum}>
                      {DAY_LABELS[dayNum]}: {h?.is_closed ? 'Closed' : h ? `${formatTime(h.open_time)} - ${formatTime(h.close_time)}` : '\u2014'}
                    </li>
                  )
                })
              ) : (
                <>
                  <li>Monday - Friday: 8:30 AM - 5:30 PM</li>
                  <li>Saturday: 9:00 AM - 3:00 PM</li>
                  <li>Sunday: Closed</li>
                </>
              )}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Connect
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-[#D4712A]"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-[#D4712A]"
              >
                <Mail className="h-4 w-4" />
                {email}
              </a>
              {/* Social Links */}
              {activeSocials.length > 0 ? (
                <div className="mt-2 flex gap-3">
                  {activeSocials.map((link: any) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs capitalize text-gray-400 transition-colors hover:text-[#D4712A]"
                    >
                      {link.platform.replace('_', ' ')}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-2 flex gap-3 text-xs text-gray-500">
                  <span>Facebook</span>
                  <span>Instagram</span>
                  <span>Google</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} {businessName}. All rights reserved.
      </div>
    </footer>
  )
}
