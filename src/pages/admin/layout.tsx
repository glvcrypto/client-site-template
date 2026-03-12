import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useAuth } from '@/contexts/auth-context'
import { useSiteConfig } from '@/hooks/use-site-config'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  Package,
  Wrench,
  MessageSquare,
  Activity,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Menu,
  LogOut,
  Loader2,
} from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/leads', label: 'Leads', icon: Users },
  { to: '/admin/inventory', label: 'Inventory', icon: Package },
  { to: '/admin/services', label: 'Services', icon: Wrench },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/activity', label: 'Activity', icon: Activity },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/updates', label: 'Updates', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function getPageTitle(pathname: string): string {
  if (pathname === '/admin' || pathname === '/admin/') return 'Dashboard'
  const match = navItems.find((item) => item.to !== '/admin' && pathname.startsWith(item.to))
  if (match) return match.label
  if (pathname.includes('/leads/')) return 'Lead Detail'
  if (pathname.includes('/inventory/new')) return 'New Inventory'
  return 'Admin'
}

function isNavActive(pathname: string, to: string): boolean {
  if (to === '/admin') return pathname === '/admin' || pathname === '/admin/'
  return pathname.startsWith(to)
}

function SignOutMenuItem() {
  const { signOut } = useAuth()
  return (
    <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </DropdownMenuItem>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, role, signOut } = useAuth()
  const { data: config } = useSiteConfig()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const businessName = config?.business_name ?? 'Client Portal'

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Top: Business name */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-5">
        <Settings className="h-4 w-4 text-zinc-500" />
        <span className="text-sm font-semibold text-white truncate">{businessName}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.to)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: User info */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs text-zinc-300">{user?.email ?? 'Unknown'}</p>
            {role && (
              <Badge variant="secondary" className="mt-0.5 text-[10px] h-4 bg-zinc-800 text-zinc-400 border-zinc-700">
                {role}
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="mt-2 w-full justify-start text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/admin/login' })
    }
  }, [loading, user, navigate])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!user) return null

  const pageTitle = getPageTitle(pathname)

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0">
        <div className="w-64 fixed inset-y-0 left-0">
          <SidebarNav />
        </div>
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSheetOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>

          <h1 className="text-lg font-semibold text-zinc-900">{pageTitle}</h1>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-100 transition-colors"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-zinc-200 text-xs text-zinc-700">
                    {user.email?.charAt(0).toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: '/admin/settings' })}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
