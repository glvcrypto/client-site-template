import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router'

// Root layout
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// --- Public Routes ---
import { HomePage } from './pages/public/home'
import { AboutPage } from './pages/public/about'
import { ServicesPage } from './pages/public/services'
import { InventoryBrowsePage } from './pages/public/inventory-browse'
import { InventoryDetailPage } from './pages/public/inventory-detail'
import { FinancingPage } from './pages/public/financing'
import { ContactPage } from './pages/public/contact'

// --- Admin Routes ---
import { AdminLayout } from './pages/admin/layout'
import { LoginPage } from './pages/admin/login'
import { DashboardPage } from './pages/admin/dashboard'
import { LeadsPage } from './pages/admin/leads'
import { LeadDetailPage } from './pages/admin/lead-detail'
import { InventoryPage } from './pages/admin/inventory'
import { InventoryFormPage } from './pages/admin/inventory-form'
import { ServicesAdminPage } from './pages/admin/services'
import { MessagesPage } from './pages/admin/messages'
import { ActivityPage } from './pages/admin/activity'
import { ReportsPage } from './pages/admin/reports'
import { UpdatesPage } from './pages/admin/updates'
import { SettingsPage } from './pages/admin/settings'

// Public routes
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage })
const servicesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/services', component: ServicesPage })
const inventoryBrowseRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory', component: InventoryBrowsePage })
const inventoryDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory/$unitId', component: InventoryDetailPage })
const financingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/financing', component: FinancingPage })
const contactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/contact', component: ContactPage })

// Admin routes
const adminLoginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin/login', component: LoginPage })

const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminLayout })
const adminDashboardRoute = createRoute({ getParentRoute: () => adminRoute, path: '/', component: DashboardPage })
const adminLeadsRoute = createRoute({ getParentRoute: () => adminRoute, path: '/leads', component: LeadsPage })
const adminLeadDetailRoute = createRoute({ getParentRoute: () => adminRoute, path: '/leads/$leadId', component: LeadDetailPage })
const adminInventoryRoute = createRoute({ getParentRoute: () => adminRoute, path: '/inventory', component: InventoryPage })
const adminInventoryFormRoute = createRoute({ getParentRoute: () => adminRoute, path: '/inventory/new', component: InventoryFormPage })
const adminServicesRoute = createRoute({ getParentRoute: () => adminRoute, path: '/services', component: ServicesAdminPage })
const adminMessagesRoute = createRoute({ getParentRoute: () => adminRoute, path: '/messages', component: MessagesPage })
const adminActivityRoute = createRoute({ getParentRoute: () => adminRoute, path: '/activity', component: ActivityPage })
const adminReportsRoute = createRoute({ getParentRoute: () => adminRoute, path: '/reports', component: ReportsPage })
const adminUpdatesRoute = createRoute({ getParentRoute: () => adminRoute, path: '/updates', component: UpdatesPage })
const adminSettingsRoute = createRoute({ getParentRoute: () => adminRoute, path: '/settings', component: SettingsPage })

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  servicesRoute,
  inventoryBrowseRoute,
  inventoryDetailRoute,
  financingRoute,
  contactRoute,
  adminLoginRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminLeadsRoute,
    adminLeadDetailRoute,
    adminInventoryRoute,
    adminInventoryFormRoute,
    adminServicesRoute,
    adminMessagesRoute,
    adminActivityRoute,
    adminReportsRoute,
    adminUpdatesRoute,
    adminSettingsRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
