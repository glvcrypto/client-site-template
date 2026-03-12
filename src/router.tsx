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
import { ShopPage } from './pages/public/shop'
import { ProductDetailPage } from './pages/public/product-detail'
import { CartPage } from './pages/public/cart'
import { CheckoutPage } from './pages/public/checkout'

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

// Phase 2: CMS
import { ContentPage } from './pages/admin/content'
import { ContentBannersPage } from './pages/admin/content-banners'
import { ContentNavigationPage } from './pages/admin/content-navigation'
import { ContentStaffPage } from './pages/admin/content-staff'
import { ContentTestimonialsPage } from './pages/admin/content-testimonials'

// Phase 3: Services
import { ServiceCataloguePage } from './pages/admin/service-catalogue'
import { ServiceAvailabilityPage } from './pages/admin/service-availability'

// Phase 4: Ecommerce
import { AdminShopPage } from './pages/admin/shop'
import { AdminShopCategoriesPage } from './pages/admin/shop-categories'
import { AdminOrdersPage } from './pages/admin/orders'
import { AdminOrderDetailPage } from './pages/admin/order-detail'
import { AdminShopPromosPage } from './pages/admin/shop-promos'

// ── Public routes ────────────────────────────────────────────────────────────

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage })
const servicesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/services', component: ServicesPage })
const inventoryBrowseRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory', component: InventoryBrowsePage })
const inventoryDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory/$unitId', component: InventoryDetailPage })
const financingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/financing', component: FinancingPage })
const contactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/contact', component: ContactPage })
const shopRoute = createRoute({ getParentRoute: () => rootRoute, path: '/shop', component: ShopPage })
const productDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/shop/$productId', component: ProductDetailPage })
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cart', component: CartPage })
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: CheckoutPage })

// ── Admin routes ─────────────────────────────────────────────────────────────

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

// Phase 2: CMS
const adminContentRoute = createRoute({ getParentRoute: () => adminRoute, path: '/content', component: ContentPage })
const adminBannersRoute = createRoute({ getParentRoute: () => adminRoute, path: '/content/banners', component: ContentBannersPage })
const adminNavigationRoute = createRoute({ getParentRoute: () => adminRoute, path: '/content/navigation', component: ContentNavigationPage })
const adminStaffDirectoryRoute = createRoute({ getParentRoute: () => adminRoute, path: '/content/staff', component: ContentStaffPage })
const adminTestimonialsRoute = createRoute({ getParentRoute: () => adminRoute, path: '/content/testimonials', component: ContentTestimonialsPage })

// Phase 3: Services
const adminServiceCatalogueRoute = createRoute({ getParentRoute: () => adminRoute, path: '/services/catalogue', component: ServiceCataloguePage })
const adminServiceAvailabilityRoute = createRoute({ getParentRoute: () => adminRoute, path: '/services/availability', component: ServiceAvailabilityPage })

// Phase 4: Ecommerce
const adminShopRoute = createRoute({ getParentRoute: () => adminRoute, path: '/shop', component: AdminShopPage })
const adminShopCategoriesRoute = createRoute({ getParentRoute: () => adminRoute, path: '/shop/categories', component: AdminShopCategoriesPage })
const adminOrdersRoute = createRoute({ getParentRoute: () => adminRoute, path: '/orders', component: AdminOrdersPage })
const adminOrderDetailRoute = createRoute({ getParentRoute: () => adminRoute, path: '/orders/$orderId', component: AdminOrderDetailPage })
const adminShopPromosRoute = createRoute({ getParentRoute: () => adminRoute, path: '/shop/promos', component: AdminShopPromosPage })

// Phase 5: Reviews
import { ReviewsAdminPage } from './pages/admin/reviews'

const adminReviewsRoute = createRoute({ getParentRoute: () => adminRoute, path: '/reviews', component: ReviewsAdminPage })

// ── Route Tree ───────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  servicesRoute,
  inventoryBrowseRoute,
  inventoryDetailRoute,
  financingRoute,
  contactRoute,
  shopRoute,
  productDetailRoute,
  cartRoute,
  checkoutRoute,
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
    // Phase 2: CMS
    adminContentRoute,
    adminBannersRoute,
    adminNavigationRoute,
    adminStaffDirectoryRoute,
    adminTestimonialsRoute,
    // Phase 3: Services
    adminServiceCatalogueRoute,
    adminServiceAvailabilityRoute,
    // Phase 4: Ecommerce
    adminShopRoute,
    adminShopCategoriesRoute,
    adminOrdersRoute,
    adminOrderDetailRoute,
    adminShopPromosRoute,
    // Phase 5: Reviews
    adminReviewsRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
