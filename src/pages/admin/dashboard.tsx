import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useLeads } from '@/hooks/use-leads'
import { useInventory } from '@/hooks/use-inventory'
import { useServices } from '@/hooks/use-services'
import { useThreads } from '@/hooks/use-messages'
import { useActivity } from '@/hooks/use-activity'
import { useModuleEnabled } from '@/hooks/use-modules'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserCheck,
  Clock,
  Package,
  Wrench,
  MessageSquare,
  ArrowRight,
  Activity,
  FileText,
  ShoppingCart,
  Loader2,
  Star,
  CalendarCheck,
  DollarSign,
  ShoppingBag,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { LucideIcon } from 'lucide-react'

// ── KPI Card ────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  accentClass: string
  bgClass: string
  loading?: boolean
}

function KpiCard({ label, value, icon: Icon, accentClass, bgClass, loading }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn('rounded-md p-2', bgClass)}>
            <Icon className={cn('h-4 w-4', accentClass)} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Loader2 className="mt-1 h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Status Badge Helpers ────────────────────────────────────────────────────────

const leadStatusColours: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-sky-100 text-sky-700',
  quoted: 'bg-amber-100 text-amber-700',
  negotiating: 'bg-orange-100 text-orange-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-zinc-100 text-zinc-500',
}

const leadTypeColours: Record<string, string> = {
  quote_request: 'bg-purple-100 text-purple-700',
  contact: 'bg-zinc-100 text-zinc-600',
  service_request: 'bg-amber-100 text-amber-700',
  financing: 'bg-emerald-100 text-emerald-700',
  trade_in: 'bg-cyan-100 text-cyan-700',
}

const orderStatusColours: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  picked_up: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
  refunded: 'bg-red-100 text-red-700',
}

function formatLeadType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Activity Icon ───────────────────────────────────────────────────────────────

function activityIcon(entityType: string): LucideIcon {
  switch (entityType) {
    case 'lead':
      return Users
    case 'inventory':
      return Package
    case 'service':
      return Wrench
    case 'message':
      return MessageSquare
    case 'report':
      return FileText
    case 'order':
      return ShoppingCart
    case 'review':
      return Star
    default:
      return Activity
  }
}

// ── Star Rating Component ───────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
          )}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-zinc-700">{rating.toFixed(1)}</span>
    </div>
  )
}

// ── Dashboard Page ──────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: leads, isLoading: leadsLoading } = useLeads()
  const { data: inventory, isLoading: inventoryLoading } = useInventory()
  const { data: services, isLoading: servicesLoading } = useServices()
  const { data: threads, isLoading: threadsLoading } = useThreads()
  const { data: activityData, isLoading: activityLoading } = useActivity({ limit: 10 })

  // Module flags
  const ecommerceEnabled = useModuleEnabled('ecommerce')
  const reviewsEnabled = useModuleEnabled('reviews')
  const adsEnabled = useModuleEnabled('ads')

  // ── Orders (ecommerce) ──────────────────────────────────────────────────────
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_orders')
        .select('id, order_number, customer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
    enabled: ecommerceEnabled,
  })

  const { data: ordersThisMonth } = useQuery({
    queryKey: ['dashboard-orders-month'],
    queryFn: async () => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { count, error } = await supabase
        .from('store_orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart)
      if (error) throw error
      return count ?? 0
    },
    enabled: ecommerceEnabled,
  })

  // ── Reviews ─────────────────────────────────────────────────────────────────
  const { data: reviewData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['dashboard-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, reviewer_name, rating, review_text, review_date')
        .eq('is_visible', true)
        .order('review_date', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
    enabled: reviewsEnabled,
  })

  const avgRating = useMemo(() => {
    if (!reviewData || reviewData.length === 0) return 0
    return reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
  }, [reviewData])

  // ── Ad Spend Today (ads) ────────────────────────────────────────────────────
  const { data: adSpendToday } = useQuery({
    queryKey: ['dashboard-ad-spend-today'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('analytics_ad_performance')
        .select('spend')
        .eq('snapshot_date', today)
      if (error) throw error
      return data?.reduce((sum, row) => sum + (row.spend ?? 0), 0) ?? 0
    },
    enabled: adsEnabled,
  })

  // ── Service Bookings Today ──────────────────────────────────────────────────
  const { data: bookingsToday } = useQuery({
    queryKey: ['dashboard-bookings-today'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { count, error } = await supabase
        .from('service_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('preferred_date', today)
      if (error) throw error
      return count ?? 0
    },
  })

  // ── Compute KPIs ────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const newLeads = leads?.filter((l) => l.status === 'new').length ?? 0
    const openLeads = leads?.filter((l) => l.status !== 'won' && l.status !== 'lost').length ?? 0

    const leadsWithResponse = leads?.filter((l) => l.response_time_minutes != null) ?? []
    const avgResponse =
      leadsWithResponse.length > 0
        ? Math.round(
            leadsWithResponse.reduce((sum, l) => sum + (l.response_time_minutes ?? 0), 0) /
              leadsWithResponse.length
          )
        : 0

    const availableInventory = inventory?.filter((i) => i.status === 'available').length ?? 0

    const activeServices =
      services?.filter((s) =>
        ['received', 'scheduled', 'in_progress'].includes(s.status ?? '')
      ).length ?? 0

    const openThreads = threads?.filter((t) => t.status === 'open').length ?? 0

    return { newLeads, openLeads, avgResponse, availableInventory, activeServices, openThreads }
  }, [leads, inventory, services, threads])

  // ── Inventory Quick Stats ─────────────────────────────────────────────────

  const inventoryStats = useMemo(() => {
    if (!inventory) return { available: 0, soldThisMonth: 0, onOrder: 0 }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    return {
      available: inventory.filter((i) => i.status === 'available').length,
      soldThisMonth: inventory.filter(
        (i) => i.status === 'sold' && i.sold_date && i.sold_date >= monthStart
      ).length,
      onOrder: inventory.filter((i) => i.status === 'on_order').length,
    }
  }, [inventory])

  // ── Recent Leads (top 5) ──────────────────────────────────────────────────

  const recentLeads = useMemo(() => (leads ?? []).slice(0, 5), [leads])

  const anyLoading = leadsLoading || inventoryLoading || servicesLoading || threadsLoading

  return (
    <div className="space-y-6">
      {/* KPI Cards — Core + Module-Aware */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="New Leads"
          value={kpis.newLeads}
          icon={Users}
          accentClass="text-blue-600"
          bgClass="bg-blue-50"
          loading={anyLoading}
        />
        <KpiCard
          label="Open Leads"
          value={kpis.openLeads}
          icon={UserCheck}
          accentClass="text-orange-600"
          bgClass="bg-orange-50"
          loading={anyLoading}
        />
        <KpiCard
          label="Avg Response"
          value={kpis.avgResponse > 0 ? `${kpis.avgResponse} min` : '--'}
          icon={Clock}
          accentClass="text-green-600"
          bgClass="bg-green-50"
          loading={anyLoading}
        />
        <KpiCard
          label="Inventory"
          value={kpis.availableInventory}
          icon={Package}
          accentClass="text-purple-600"
          bgClass="bg-purple-50"
          loading={anyLoading}
        />
        <KpiCard
          label="Bookings Today"
          value={bookingsToday ?? 0}
          icon={CalendarCheck}
          accentClass="text-teal-600"
          bgClass="bg-teal-50"
          loading={anyLoading}
        />
        <KpiCard
          label="Unread Messages"
          value={kpis.openThreads}
          icon={MessageSquare}
          accentClass="text-red-600"
          bgClass="bg-red-50"
          loading={anyLoading}
        />
      </div>

      {/* Module-Aware KPI Row */}
      {(ecommerceEnabled || adsEnabled) && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {ecommerceEnabled && (
            <KpiCard
              label="Orders This Month"
              value={ordersThisMonth ?? 0}
              icon={ShoppingBag}
              accentClass="text-indigo-600"
              bgClass="bg-indigo-50"
              loading={ordersLoading}
            />
          )}
          {adsEnabled && (
            <KpiCard
              label="Ad Spend Today"
              value={adSpendToday != null ? `$${adSpendToday.toFixed(2)}` : '$0.00'}
              icon={DollarSign}
              accentClass="text-pink-600"
              bgClass="bg-pink-50"
              loading={false}
            />
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/admin/content"
          className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          Content
        </Link>
        {ecommerceEnabled && (
          <Link
            to="/admin/shop"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Shop
          </Link>
        )}
        {reviewsEnabled && (
          <Link
            to="/admin/reviews"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Star className="h-3.5 w-3.5" />
            Reviews
          </Link>
        )}
      </div>

      {/* Two Column: Recent Leads + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
            <Link
              to="/admin/leads"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {leadsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentLeads.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No leads yet</p>
            ) : (
              <div className="space-y-1">
                {recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    to="/admin/leads/$leadId"
                    params={{ leadId: lead.id }}
                    className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] h-4', leadTypeColours[lead.lead_type] ?? '')}
                        >
                          {formatLeadType(lead.lead_type)}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] h-4', leadStatusColours[lead.status] ?? '')}
                        >
                          {lead.status}
                        </Badge>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {lead.created_at
                        ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
                        : ''}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !activityData || activityData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-1">
                {activityData.map((entry) => {
                  const Icon = activityIcon(entry.entity_type)
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 rounded-md px-2 py-2"
                    >
                      <div className="mt-0.5 rounded-md bg-zinc-100 p-1.5">
                        <Icon className="h-3.5 w-3.5 text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{entry.summary}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {entry.created_at
                            ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })
                            : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Module-Aware Sections Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders (ecommerce) */}
        {ecommerceEnabled && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
              <Link
                to="/admin/orders"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !recentOrders || recentOrders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Total</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b last:border-0">
                          <td className="py-2 font-medium truncate max-w-[140px]">
                            {order.customer_name ?? 'Guest'}
                          </td>
                          <td className="py-2">${(order.total ?? 0).toFixed(2)}</td>
                          <td className="py-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] h-4',
                                orderStatusColours[order.status ?? ''] ?? ''
                              )}
                            >
                              {order.status ?? 'pending'}
                            </Badge>
                          </td>
                          <td className="py-2 text-right text-xs text-muted-foreground">
                            {order.created_at
                              ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true })
                              : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Reviews (reviews) */}
        {reviewsEnabled && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Recent Reviews</CardTitle>
              <Link
                to="/admin/reviews"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !reviewData || reviewData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet</p>
              ) : (
                <div className="space-y-3">
                  {/* Average Rating */}
                  <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">Average:</span>
                    <StarRating rating={avgRating} />
                    <span className="text-xs text-muted-foreground">
                      ({reviewData.length} review{reviewData.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  {/* Latest Review Preview */}
                  {reviewData[0] && (
                    <div className="rounded-md border px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{reviewData[0].reviewer_name}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                'h-3 w-3',
                                star <= reviewData[0].rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-zinc-200'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      {reviewData[0].review_text && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {reviewData[0].review_text}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inventory Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-green-50 p-2">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-lg font-bold">
                  {inventoryLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    inventoryStats.available
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-50 p-2">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sold This Month</p>
                <p className="text-lg font-bold">
                  {inventoryLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    inventoryStats.soldThisMonth
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-amber-50 p-2">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">On Order</p>
                <p className="text-lg font-bold">
                  {inventoryLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    inventoryStats.onOrder
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
