import { useState, useEffect, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Phone, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useSiteConfig } from '@/hooks/use-site-config'
import { usePublicNavigation } from '@/hooks/use-navigation'
import { useModules } from '@/hooks/use-modules'

// Fallback nav used when CMS has no navigation_items rows
const fallbackNavLinks = [
  { label: 'Home', route_path: '/', module_key: null },
  { label: 'About', route_path: '/about', module_key: null },
  { label: 'Inventory', route_path: '/inventory', module_key: null },
  { label: 'Services', route_path: '/services', module_key: null },
  { label: 'Financing', route_path: '/financing', module_key: 'financing' },
  { label: 'Contact', route_path: '/contact', module_key: null },
]

export function Header() {
  const { data: config } = useSiteConfig()
  const { data: navItems } = usePublicNavigation()
  const { data: modules } = useModules()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const businessName = config?.business_name ?? 'Dealership Name'
  const phone = config?.business_phone ?? config?.phone ?? '(705) 253-7828'

  // Build a set of enabled module keys
  const enabledModules = useMemo(() => {
    const set = new Set<string>()
    if (modules) {
      for (const m of modules) {
        if (m.is_enabled) set.add(m.module_key)
      }
    }
    return set
  }, [modules])

  // Use CMS nav items if available, else fallback
  const rawLinks = navItems && navItems.length > 0
    ? navItems.map((item: any) => ({
        label: item.label,
        route_path: item.route_path,
        module_key: item.module_key ?? null,
      }))
    : fallbackNavLinks

  // Filter out module-gated items when the module is disabled
  const visibleLinks = rawLinks.filter((link: any) => {
    if (!link.module_key) return true
    return enabledModules.has(link.module_key)
  })

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white transition-shadow ${scrolled ? 'shadow-md' : ''}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Brand */}
        <Link to="/" className="text-xl font-bold text-[#1B2A4A]">
          {businessName}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link: any) => (
            <Link
              key={link.route_path}
              to={link.route_path}
              className="rounded-md px-3 py-2 text-sm font-medium text-[#1B2A4A] transition-colors hover:text-[#D4712A]"
              activeProps={{ className: 'text-[#D4712A]' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop phone */}
        <a
          href={`tel:${phone.replace(/[^+\d]/g, '')}`}
          className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[#1B2A4A] transition-colors hover:text-[#D4712A] md:flex"
        >
          <Phone className="h-4 w-4" />
          {phone}
        </a>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5 text-[#1B2A4A]" />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-72">
            <div className="flex flex-col gap-6 pt-8">
              <span className="text-lg font-bold text-[#1B2A4A]">{businessName}</span>
              <nav className="flex flex-col gap-1">
                {visibleLinks.map((link: any) => (
                  <SheetClose
                    key={link.route_path}
                    render={
                      <Link
                        to={link.route_path}
                        className="rounded-md px-3 py-2 text-base font-medium text-[#1B2A4A] transition-colors hover:bg-gray-100 hover:text-[#D4712A]"
                      >
                        {link.label}
                      </Link>
                    }
                  />
                ))}
              </nav>
              <a
                href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-[#D4712A]"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
