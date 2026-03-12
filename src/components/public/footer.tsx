import { Link } from '@tanstack/react-router'
import { Phone, Mail, MapPin } from 'lucide-react'
import { useSiteConfig } from '@/hooks/use-site-config'

export function Footer() {
  const { data: config } = useSiteConfig()

  const businessName = config?.business_name ?? 'Dealership Name'
  const tagline = config?.tagline ?? 'Your trusted local dealer'
  const address = config?.address ?? '123 Great Northern Rd, Sault Ste. Marie, ON'
  const phone = config?.phone ?? '(705) 253-7828'
  const email = config?.email ?? 'info@example.com'

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
              {[
                { label: 'Inventory', to: '/inventory' },
                { label: 'Services', to: '/services' },
                { label: 'Financing', to: '/financing' },
                { label: 'About Us', to: '/about' },
                { label: 'Contact', to: '/contact' },
              ].map((link) => (
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
              <li>Monday - Friday: 8:30 AM - 5:30 PM</li>
              <li>Saturday: 9:00 AM - 3:00 PM</li>
              <li>Sunday: Closed</li>
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
              {/* Social placeholder */}
              <div className="mt-2 flex gap-3 text-xs text-gray-500">
                <span>Facebook</span>
                <span>Instagram</span>
                <span>Google</span>
              </div>
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
