import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useLeads } from '@/hooks/use-leads'
import { useInventory } from '@/hooks/use-inventory'
import { useServices } from '@/hooks/use-services'
import { useStaff, useStaffMap } from '@/hooks/use-staff'
import { useModuleEnabled } from '@/hooks/use-modules'
import { useTrafficSources, useDeviceBreakdown, useTopPages, useTrafficTrend } from '@/hooks/use-analytics'
import type { DateRange } from '@/hooks/use-analytics'
import { useAdSummary, useAdPlatformBreakdown, useTopCampaigns } from '@/hooks/use-ad-performance'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import {
  Download,
  FileText,
  Loader2,
  ShieldAlert,
  Users,
  Package,
  Wrench,
  Clock,
  Target,
  DollarSign,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Search,
  Eye,
  MousePointerClick,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Hash,
  Monitor,
  Smartphone,
  Tablet,
  Megaphone,
  Zap,
} from 'lucide-react'
import {
  format,
  subDays,
  subYears,
  eachDayOfInterval,
  eachWeekOfInterval,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import type { Json } from '@/lib/database.types'

// ── Colours ──────────────────────────────────────────────────────────────────

const CHART_COLOURS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16',
]

const STATUS_COLOURS: Record<string, string> = {
  new: '#3b82f6', contacted: '#f59e0b', quoted: '#8b5cf6',
  negotiating: '#f97316', won: '#10b981', lost: '#ef4444',
}

const INVENTORY_COLOURS: Record<string, string> = {
  available: '#10b981', sold: '#3b82f6', on_order: '#f59e0b',
  featured: '#8b5cf6', clearance: '#ef4444',
}

const SERVICE_COLOURS: Record<string, string> = {
  received: '#3b82f6', scheduled: '#f59e0b', in_progress: '#8b5cf6',
  complete: '#10b981', picked_up: '#6b7280',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatEnumLabel(v: string) {
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function countBy<T>(arr: T[], fn: (i: T) => string) {
  const c: Record<string, number> = {}
  for (const i of arr) { const k = fn(i); c[k] = (c[k] ?? 0) + 1 }
  return c
}

type Period = '7d' | '30d' | '90d' | 'all'

function getDateRange(period: Period) {
  const end = new Date()
  switch (period) {
    case '7d': return { start: subDays(end, 7), end }
    case '30d': return { start: subDays(end, 30), end }
    case '90d': return { start: subDays(end, 90), end }
    case 'all': return { start: new Date('2020-01-01'), end }
  }
}

/** Convert period to DateRange for analytics hooks */
function toDateRange(period: Period): DateRange {
  const { start, end } = getDateRange(period)
  return {
    from: format(start, 'yyyy-MM-dd'),
    to: format(end, 'yyyy-MM-dd'),
  }
}

/** Get the YoY comparison DateRange (same length, one year earlier) */
function toYoyDateRange(period: Period): DateRange {
  const { start, end } = getDateRange(period)
  return {
    from: format(subYears(start, 1), 'yyyy-MM-dd'),
    to: format(subYears(end, 1), 'yyyy-MM-dd'),
  }
}

const PLATFORM_COLOURS: Record<string, string> = {
  google_ads: '#4285f4',
  meta: '#1877f2',
  tiktok: '#000000',
}

const PLATFORM_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta: 'Meta',
  tiktok: 'TikTok',
}

const DEVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
}

// ── GA4 / GSC JSON shapes ────────────────────────────────────────────────────

interface GA4Data {
  sessions: number
  pageviews: number
  users: number
  bounce_rate: number
  avg_session_duration: number
  top_pages: { page: string; views: number }[]
  traffic_sources: { source: string; sessions: number }[]
}

interface GSCData {
  clicks: number
  impressions: number
  ctr: number
  avg_position: number
  top_queries: { query: string; clicks: number; impressions: number; position: number }[]
}

interface SemrushData {
  domain_authority: number
  organic_keywords: number
  organic_traffic: number
  backlinks: number
}

// ── Reports Page ─────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { role } = useAuth()
  if (role === 'staff') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">You don't have permission to view reports.</p>
        <p className="mt-1 text-xs text-muted-foreground">Contact the account owner for access.</p>
      </div>
    )
  }
  return <ReportsContent />
}

function ReportsContent() {
  const [period, setPeriod] = useState<Period>('30d')
  const [activeTab, setActiveTab] = useState('overview')
  const { start, end } = getDateRange(period)
  const adsEnabled = useModuleEnabled('ads')
  const dateRange = toDateRange(period)

  const { data: allLeads, isLoading: leadsLoading } = useLeads()
  const { data: allInventory, isLoading: invLoading } = useInventory()
  const { data: allServices, isLoading: svcLoading } = useServices()
  const { data: staff } = useStaff()
  const { staffMap } = useStaffMap()

  const { data: snapshots } = useQuery({
    queryKey: ['analytics_snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: true })
      if (error) throw error
      return data
    },
  })

  const { data: keywords } = useQuery({
    queryKey: ['seo_keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_keywords')
        .select('*')
        .order('clicks', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: blogPosts } = useQuery({
    queryKey: ['blog_posts_performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts_performance')
        .select('*')
        .order('pageviews', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: reports } = useQuery({
    queryKey: ['client_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_reports')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const isLoading = leadsLoading || invLoading || svcLoading

  // ── Filter data ────────────────────────────────────────────────────────────

  const leads = useMemo(() => {
    if (!allLeads) return []
    if (period === 'all') return allLeads
    return allLeads.filter(
      (l) => l.created_at && isWithinInterval(parseISO(l.created_at), { start, end })
    )
  }, [allLeads, period, start, end])

  const inventory = useMemo(() => allInventory ?? [], [allInventory])
  const services = useMemo(() => {
    if (!allServices) return []
    if (period === 'all') return allServices
    return allServices.filter(
      (s) => s.created_at && isWithinInterval(parseISO(s.created_at), { start, end })
    )
  }, [allServices, period, start, end])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Performance overview across leads, website, SEO, and team.
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod((v ?? '30d') as Period)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="website">Website & SEO</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          {adsEnabled && <TabsTrigger value="ads">Ads</TabsTrigger>}
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* ═══ TAB: OVERVIEW ═══ */}
        <TabsContent value="overview">
          <OverviewTab leads={leads} inventory={inventory} services={services} period={period} start={start} end={end} staffMap={staffMap} latestSnapshot={snapshots?.[snapshots.length - 1] ?? null} />
        </TabsContent>

        {/* ═══ TAB: WEBSITE & SEO ═══ */}
        <TabsContent value="website">
          <WebsiteSeoTab snapshots={snapshots ?? []} keywords={keywords ?? []} blogPosts={blogPosts ?? []} leadsCount={leads.length} />
        </TabsContent>

        {/* ═══ TAB: TRAFFIC ═══ */}
        <TabsContent value="traffic">
          <TrafficTab dateRange={dateRange} period={period} />
        </TabsContent>

        {/* ═══ TAB: ADS (module-gated) ═══ */}
        {adsEnabled && (
          <TabsContent value="ads">
            <AdsTab dateRange={dateRange} period={period} />
          </TabsContent>
        )}

        {/* ═══ TAB: STAFF ═══ */}
        <TabsContent value="staff">
          <StaffTab allLeads={allLeads ?? []} staff={staff ?? []} staffMap={staffMap} />
        </TabsContent>

        {/* ═══ TAB: DOCUMENTS ═══ */}
        <TabsContent value="documents">
          <DocumentsTab reports={reports ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 0: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

interface OverviewProps {
  leads: any[]
  inventory: any[]
  services: any[]
  period: Period
  start: Date
  end: Date
  staffMap: Map<string, any>
  latestSnapshot: any | null
}

function OverviewTab({ leads, inventory, services, period, start, end, staffMap, latestSnapshot }: OverviewProps) {
  const kpis = useMemo(() => {
    const totalLeads = leads.length
    const wonLeads = leads.filter((l) => l.status === 'won').length
    const lostLeads = leads.filter((l) => l.status === 'lost').length
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0
    const withResponse = leads.filter((l) => l.response_time_minutes != null)
    const avgResponse = withResponse.length > 0
      ? Math.round(withResponse.reduce((s, l) => s + (l.response_time_minutes ?? 0), 0) / withResponse.length)
      : 0
    const availableUnits = inventory.filter((i) => i.status === 'available').length
    const soldUnits = inventory.filter((i) => i.status === 'sold').length
    const totalValue = inventory.filter((i) => i.status === 'available' && i.price).reduce((s, i) => s + (i.price ?? 0), 0)
    const activeSvc = services.filter((s) => ['received', 'scheduled', 'in_progress'].includes(s.status ?? '')).length
    const doneSvc = services.filter((s) => s.status === 'complete' || s.status === 'picked_up').length
    const ga4Snap = latestSnapshot?.ga4_data as GA4Data | null
    const visitors = ga4Snap?.users ?? 0
    const leadsPer1k = visitors > 0 ? parseFloat(((totalLeads / visitors) * 1000).toFixed(1)) : 0
    return { totalLeads, wonLeads, lostLeads, conversionRate, avgResponse, availableUnits, soldUnits, totalValue, activeSvc, doneSvc, leadsPer1k, visitors }
  }, [leads, inventory, services, latestSnapshot])

  const leadsOverTime = useMemo(() => {
    if (leads.length === 0) return []
    const useWeeks = period === '90d' || period === 'all'
    const intervals = useWeeks ? eachWeekOfInterval({ start, end }) : eachDayOfInterval({ start, end })
    return intervals.map((date, i) => {
      const next = intervals[i + 1] ?? end
      const count = leads.filter((l) => { if (!l.created_at) return false; const d = parseISO(l.created_at); return d >= date && d < next }).length
      return { date: format(date, 'MMM d'), leads: count }
    })
  }, [leads, period, start, end])

  const leadStatusData = useMemo(() => {
    const c = countBy(leads, (l) => l.status)
    return Object.entries(c).map(([s, v]) => ({ name: formatEnumLabel(s), value: v, colour: STATUS_COLOURS[s] ?? '#6b7280' }))
  }, [leads])

  const leadSourceData = useMemo(() => {
    const c = countBy(leads, (l) => l.source ?? 'unknown')
    return Object.entries(c).map(([s, v], i) => ({ name: formatEnumLabel(s), value: v, colour: CHART_COLOURS[i % CHART_COLOURS.length] })).sort((a, b) => b.value - a.value)
  }, [leads])

  const leadTypeData = useMemo(() => {
    const c = countBy(leads, (l) => l.lead_type)
    return Object.entries(c).map(([t, v], i) => ({ name: formatEnumLabel(t), count: v, fill: CHART_COLOURS[i % CHART_COLOURS.length] }))
  }, [leads])

  const invStatusData = useMemo(() => {
    const c = countBy(inventory, (i) => i.status)
    return Object.entries(c).map(([s, v]) => ({ name: formatEnumLabel(s), value: v, colour: INVENTORY_COLOURS[s] ?? '#6b7280' }))
  }, [inventory])

  const svcStatusData = useMemo(() => {
    const c = countBy(services, (s) => s.status ?? 'received')
    return Object.entries(c).map(([s, v]) => ({ name: formatEnumLabel(s), count: v, fill: SERVICE_COLOURS[s] ?? '#6b7280' }))
  }, [services])

  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Leads" value={kpis.totalLeads} icon={Users} accent="text-blue-600" bg="bg-blue-50" />
        <KpiCard label="Conversion Rate" value={`${kpis.conversionRate}%`} icon={Target} accent="text-green-600" bg="bg-green-50" sub={`${kpis.wonLeads} won / ${kpis.lostLeads} lost`} />
        <KpiCard label="Leads / 1k Visitors" value={kpis.leadsPer1k} icon={BarChart3} accent="text-cyan-600" bg="bg-cyan-50" sub={`${kpis.visitors.toLocaleString()} visitors`} />
        <KpiCard label="Avg Response" value={kpis.avgResponse > 0 ? `${kpis.avgResponse} min` : '--'} icon={Clock} accent="text-amber-600" bg="bg-amber-50" />
        <KpiCard label="Inventory Value" value={`$${kpis.totalValue.toLocaleString()}`} icon={DollarSign} accent="text-purple-600" bg="bg-purple-50" sub={`${kpis.availableUnits} avail / ${kpis.soldUnits} sold`} />
        <KpiCard label="Services" value={kpis.activeSvc + kpis.doneSvc} icon={Wrench} accent="text-orange-600" bg="bg-orange-50" sub={`${kpis.activeSvc} active / ${kpis.doneSvc} done`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Leads Over Time</CardTitle></CardHeader>
          <CardContent>{leadsOverTime.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={leadsOverTime}>
                <defs><linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} fill="url(#leadFill)" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Lead Status</CardTitle></CardHeader>
          <CardContent>{leadStatusData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                {leadStatusData.map((e, i) => <Cell key={i} fill={e.colour} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          )}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Leads by Source</CardTitle></CardHeader>
          <CardContent>{leadSourceData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={leadSourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" width={100} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>{leadSourceData.map((e, i) => <Cell key={i} fill={e.colour} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Leads by Type</CardTitle></CardHeader>
          <CardContent>{leadTypeData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={leadTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>{leadTypeData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Inventory Breakdown</CardTitle></CardHeader>
          <CardContent>{invStatusData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={invStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {invStatusData.map((e, i) => <Cell key={i} fill={e.colour} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          )}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Service Requests</CardTitle></CardHeader>
          <CardContent>{svcStatusData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={svcStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>{svcStatusData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}</CardContent>
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: WEBSITE & SEO
// ═══════════════════════════════════════════════════════════════════════════════

function WebsiteSeoTab({ snapshots, keywords, blogPosts, leadsCount }: { snapshots: any[]; keywords: any[]; blogPosts: any[]; leadsCount: number }) {
  const latest = snapshots[snapshots.length - 1]
  const previous = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null

  const ga4: GA4Data | null = latest?.ga4_data as GA4Data ?? null
  const prevGa4: GA4Data | null = previous?.ga4_data as GA4Data ?? null
  const gsc: GSCData | null = latest?.gsc_data as GSCData ?? null
  const prevGsc: GSCData | null = previous?.gsc_data as GSCData ?? null
  const semrush: SemrushData | null = latest?.semrush_data as SemrushData ?? null
  const prevSemrush: SemrushData | null = previous?.semrush_data as SemrushData ?? null

  // GA4 trend data
  const ga4Trend = useMemo(() => {
    return snapshots.map((s) => {
      const d = s.ga4_data as GA4Data | null
      return {
        date: format(parseISO(s.snapshot_date), 'MMM d'),
        sessions: d?.sessions ?? 0,
        pageviews: d?.pageviews ?? 0,
        users: d?.users ?? 0,
      }
    })
  }, [snapshots])

  // GSC trend data
  const gscTrend = useMemo(() => {
    return snapshots.map((s) => {
      const d = s.gsc_data as GSCData | null
      return {
        date: format(parseISO(s.snapshot_date), 'MMM d'),
        clicks: d?.clicks ?? 0,
        impressions: d?.impressions ?? 0,
        ctr: d?.ctr ?? 0,
      }
    })
  }, [snapshots])

  // Traffic sources
  const trafficSources = useMemo(() => {
    if (!ga4?.traffic_sources) return []
    return ga4.traffic_sources.map((s, i) => ({
      name: formatEnumLabel(s.source),
      sessions: s.sessions,
      fill: CHART_COLOURS[i % CHART_COLOURS.length],
    }))
  }, [ga4])

  const leadsPer1k = useMemo(() => {
    const visitors = ga4?.users ?? 0
    if (visitors === 0 || leadsCount === 0) return 0
    return parseFloat(((leadsCount / visitors) * 1000).toFixed(1))
  }, [ga4, leadsCount])

  const prevLeadsPer1k = useMemo(() => {
    const prevVisitors = prevGa4?.users ?? 0
    if (prevVisitors === 0) return null
    // Approximate: assume similar lead ratio last period — only visitors change
    return parseFloat(((leadsCount / prevVisitors) * 1000).toFixed(1))
  }, [prevGa4, leadsCount])

  if (!latest) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center py-20 text-center">
        <Globe className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium">No analytics data yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Data will appear here once GLV syncs your website analytics.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Website KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-9">
        <MetricCard label="Sessions" value={ga4?.sessions ?? 0} prev={prevGa4?.sessions} icon={Eye} />
        <MetricCard label="Pageviews" value={ga4?.pageviews ?? 0} prev={prevGa4?.pageviews} icon={MousePointerClick} />
        <MetricCard label="Users" value={ga4?.users ?? 0} prev={prevGa4?.users} icon={Users} />
        <MetricCard label="Bounce Rate" value={`${ga4?.bounce_rate ?? 0}%`} prev={prevGa4?.bounce_rate} icon={ArrowUpRight} invertTrend />
        <MetricCard label="GSC Clicks" value={gsc?.clicks ?? 0} prev={prevGsc?.clicks} icon={Search} />
        <MetricCard label="Impressions" value={gsc?.impressions ?? 0} prev={prevGsc?.impressions} icon={Eye} />
        <MetricCard label="Avg Position" value={gsc?.avg_position?.toFixed(1) ?? '--'} prev={prevGsc?.avg_position} icon={Hash} invertTrend />
        <MetricCard label="Domain Auth" value={semrush?.domain_authority ?? '--'} prev={prevSemrush?.domain_authority} icon={TrendingUp} />
        <MetricCard label="Leads/1k Visitors" value={leadsPer1k} prev={prevLeadsPer1k} icon={Target} />
      </div>

      {/* GA4 Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Website Traffic</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ga4Trend}>
                <defs>
                  <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                <Area type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} fill="url(#sessionsFill)" name="Sessions" />
                <Area type="monotone" dataKey="pageviews" stroke="#10b981" strokeWidth={2} fill="url(#pvFill)" name="Pageviews" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Search Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={gscTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Clicks" />
                <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Impressions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources + Top Pages */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Traffic Sources</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart><Pie data={trafficSources} cx="50%" cy="50%" outerRadius={80} dataKey="sessions" label={({ name, sessions }) => `${name} (${sessions})`}>
                {trafficSources.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Top Pages</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(ga4?.top_pages ?? []).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground font-mono text-xs">{p.page}</span>
                  <span className="font-medium ml-3 shrink-0">{p.views} views</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Keywords */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Keyword Rankings</CardTitle>
            <Badge variant="secondary" className="text-[11px]">{keywords.length} tracked</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {keywords.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No keyword data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Keyword</th>
                    <th className="pb-2 pr-4 font-medium text-right">Position</th>
                    <th className="pb-2 pr-4 font-medium text-right">Change</th>
                    <th className="pb-2 pr-4 font-medium text-right">Clicks</th>
                    <th className="pb-2 pr-4 font-medium text-right">Impressions</th>
                    <th className="pb-2 pr-4 font-medium text-right">CTR</th>
                    <th className="pb-2 font-medium">Page</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw) => {
                    const change = kw.previous_position && kw.position
                      ? Number((kw.previous_position - kw.position).toFixed(1))
                      : 0
                    return (
                      <tr key={kw.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{kw.keyword}</td>
                        <td className="py-2.5 pr-4 text-right">
                          <Badge variant="secondary" className={cn('text-[11px]',
                            (kw.position ?? 99) <= 3 ? 'bg-green-100 text-green-700' :
                            (kw.position ?? 99) <= 10 ? 'bg-blue-100 text-blue-700' :
                            (kw.position ?? 99) <= 20 ? 'bg-amber-100 text-amber-700' :
                            'bg-zinc-100 text-zinc-600'
                          )}>
                            {kw.position?.toFixed(1) ?? '--'}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          {change > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-green-600 text-xs font-medium">
                              <ArrowUpRight className="h-3 w-3" />+{change}
                            </span>
                          ) : change < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-red-600 text-xs font-medium">
                              <ArrowDownRight className="h-3 w-3" />{change}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs"><Minus className="h-3 w-3 inline" /></span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-right">{kw.clicks ?? 0}</td>
                        <td className="py-2.5 pr-4 text-right">{kw.impressions ?? 0}</td>
                        <td className="py-2.5 pr-4 text-right">{kw.ctr ? `${kw.ctr}%` : '--'}</td>
                        <td className="py-2.5 text-xs text-muted-foreground font-mono">{kw.page_url ?? '--'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blog Performance */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Blog Performance</CardTitle>
            <Badge variant="secondary" className="text-[11px]">{blogPosts.length} posts</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {blogPosts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No blog data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Title</th>
                    <th className="pb-2 pr-4 font-medium text-right">Pageviews</th>
                    <th className="pb-2 pr-4 font-medium text-right">Sessions</th>
                    <th className="pb-2 pr-4 font-medium text-right">Avg Time</th>
                    <th className="pb-2 pr-4 font-medium text-right">Bounce</th>
                    <th className="pb-2 pr-4 font-medium">Top Keyword</th>
                    <th className="pb-2 font-medium text-right">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {blogPosts.map((post) => (
                    <tr key={post.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4">
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {post.published_date ? format(parseISO(post.published_date), 'MMM d, yyyy') : '--'}
                          </p>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium">{post.pageviews ?? 0}</td>
                      <td className="py-2.5 pr-4 text-right">{post.sessions ?? 0}</td>
                      <td className="py-2.5 pr-4 text-right">
                        {post.avg_time_on_page ? `${Math.round(post.avg_time_on_page)}s` : '--'}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        {post.bounce_rate != null ? (
                          <Badge variant="secondary" className={cn('text-[11px]',
                            post.bounce_rate < 30 ? 'bg-green-100 text-green-700' :
                            post.bounce_rate < 50 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {post.bounce_rate}%
                          </Badge>
                        ) : '--'}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{post.top_keyword ?? '--'}</td>
                      <td className="py-2.5 text-right">
                        {post.top_keyword_position ? (
                          <Badge variant="secondary" className={cn('text-[11px]',
                            post.top_keyword_position <= 5 ? 'bg-green-100 text-green-700' :
                            post.top_keyword_position <= 10 ? 'bg-blue-100 text-blue-700' :
                            'bg-zinc-100 text-zinc-600'
                          )}>
                            {post.top_keyword_position.toFixed(1)}
                          </Badge>
                        ) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Semrush Overview */}
      {semrush && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Domain Authority" value={semrush.domain_authority} prev={prevSemrush?.domain_authority} icon={TrendingUp} />
          <MetricCard label="Organic Keywords" value={semrush.organic_keywords} prev={prevSemrush?.organic_keywords} icon={Hash} />
          <MetricCard label="Organic Traffic" value={semrush.organic_traffic} prev={prevSemrush?.organic_traffic} icon={Users} />
          <MetricCard label="Backlinks" value={semrush.backlinks} prev={prevSemrush?.backlinks} icon={Globe} />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: STAFF
// ═══════════════════════════════════════════════════════════════════════════════

function StaffTab({ allLeads, staff, staffMap }: { allLeads: any[]; staff: any[]; staffMap: Map<string, any> }) {
  const [selectedStaff, setSelectedStaff] = useState<string>('all')

  const staffPerformance = useMemo(() => {
    const grouped: Record<string, { total: number; won: number; lost: number; responses: number[]; statuses: Record<string, number> }> = {}
    for (const lead of allLeads) {
      const id = lead.assigned_to ?? '__unassigned'
      if (!grouped[id]) grouped[id] = { total: 0, won: 0, lost: 0, responses: [], statuses: {} }
      grouped[id].total++
      if (lead.status === 'won') grouped[id].won++
      if (lead.status === 'lost') grouped[id].lost++
      grouped[id].statuses[lead.status] = (grouped[id].statuses[lead.status] ?? 0) + 1
      if (lead.response_time_minutes != null) grouped[id].responses.push(lead.response_time_minutes)
    }
    return Object.entries(grouped).map(([id, d]) => ({
      id,
      name: id === '__unassigned' ? 'Unassigned' : (staffMap.get(id)?.full_name || id.slice(0, 8)),
      total: d.total,
      won: d.won,
      lost: d.lost,
      conversionRate: d.total > 0 ? Math.round((d.won / d.total) * 100) : 0,
      avgResponse: d.responses.length > 0 ? Math.round(d.responses.reduce((s, r) => s + r, 0) / d.responses.length) : null,
      statuses: d.statuses,
    })).sort((a, b) => b.total - a.total)
  }, [allLeads, staffMap])

  const selectedData = useMemo(() => {
    if (selectedStaff === 'all') return null
    return staffPerformance.find((s) => s.id === selectedStaff) ?? null
  }, [selectedStaff, staffPerformance])

  const selectedLeads = useMemo(() => {
    if (selectedStaff === 'all') return []
    return allLeads.filter((l) =>
      selectedStaff === '__unassigned' ? !l.assigned_to : l.assigned_to === selectedStaff
    )
  }, [selectedStaff, allLeads])

  const selectedStatusChart = useMemo(() => {
    if (!selectedData) return []
    return Object.entries(selectedData.statuses).map(([s, v]) => ({
      name: formatEnumLabel(s),
      value: v,
      colour: STATUS_COLOURS[s] ?? '#6b7280',
    }))
  }, [selectedData])

  const selectedLeadsOverTime = useMemo(() => {
    if (selectedLeads.length === 0) return []
    const end = new Date()
    const start = subDays(end, 30)
    const days = eachDayOfInterval({ start, end })
    return days.map((date, i) => {
      const next = days[i + 1] ?? end
      const count = selectedLeads.filter((l) => {
        if (!l.created_at) return false
        const d = parseISO(l.created_at)
        return d >= date && d < next
      }).length
      return { date: format(date, 'MMM d'), leads: count }
    })
  }, [selectedLeads])

  return (
    <div className="mt-4 space-y-6">
      {/* Staff Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">View:</span>
        <Select value={selectedStaff} onValueChange={(v) => setSelectedStaff(v ?? 'all')}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff — Overview</SelectItem>
            {staffPerformance.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* All Staff Overview Table */}
      {selectedStaff === 'all' ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Staff Performance Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Staff Member</th>
                    <th className="pb-2 pr-4 font-medium text-right">Total Leads</th>
                    <th className="pb-2 pr-4 font-medium text-right">Won</th>
                    <th className="pb-2 pr-4 font-medium text-right">Lost</th>
                    <th className="pb-2 pr-4 font-medium text-right">Conv. Rate</th>
                    <th className="pb-2 font-medium text-right">Avg Response</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformance.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b last:border-0 cursor-pointer hover:bg-zinc-50 transition-colors"
                      onClick={() => setSelectedStaff(m.id)}
                    >
                      <td className="py-2.5 pr-4 font-medium">{m.name}</td>
                      <td className="py-2.5 pr-4 text-right">{m.total}</td>
                      <td className="py-2.5 pr-4 text-right text-green-600 font-medium">{m.won}</td>
                      <td className="py-2.5 pr-4 text-right text-red-600">{m.lost}</td>
                      <td className="py-2.5 pr-4 text-right">
                        <Badge variant="secondary" className={cn('text-[11px]',
                          m.conversionRate >= 50 ? 'bg-green-100 text-green-700' :
                          m.conversionRate >= 25 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {m.conversionRate}%
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right">{m.avgResponse != null ? `${m.avgResponse} min` : '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : selectedData ? (
        /* Individual Staff Report */
        <>
          {/* Staff KPIs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <KpiCard label="Total Leads" value={selectedData.total} icon={Users} accent="text-blue-600" bg="bg-blue-50" />
            <KpiCard label="Won" value={selectedData.won} icon={Target} accent="text-green-600" bg="bg-green-50" />
            <KpiCard label="Lost" value={selectedData.lost} icon={Target} accent="text-red-600" bg="bg-red-50" />
            <KpiCard label="Conv. Rate" value={`${selectedData.conversionRate}%`} icon={TrendingUp} accent="text-purple-600" bg="bg-purple-50" />
            <KpiCard label="Avg Response" value={selectedData.avgResponse != null ? `${selectedData.avgResponse} min` : '--'} icon={Clock} accent="text-amber-600" bg="bg-amber-50" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Their leads over time */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">{selectedData.name}'s Leads (Last 30 Days)</CardTitle></CardHeader>
              <CardContent>
                {selectedLeadsOverTime.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={selectedLeadsOverTime}>
                      <defs><linearGradient id="staffFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                      <Area type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={2} fill="url(#staffFill)" dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Their status breakdown */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Lead Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                {selectedStatusChart.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart><Pie data={selectedStatusChart} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                      {selectedStatusChart.map((e, i) => <Cell key={i} fill={e.colour} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent leads table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Recent Leads</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">Type</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 pr-4 font-medium">Source</th>
                      <th className="pb-2 font-medium text-right">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLeads.slice(0, 15).map((lead) => (
                      <tr key={lead.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary" className="text-[11px]">{formatEnumLabel(lead.lead_type)}</Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary" className={cn('text-[11px]', STATUS_COLOURS[lead.status] ? `text-white` : '')} style={{ backgroundColor: STATUS_COLOURS[lead.status] }}>
                            {formatEnumLabel(lead.status)}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{lead.source ? formatEnumLabel(lead.source) : '--'}</td>
                        <td className="py-2 text-right">{lead.response_time_minutes != null ? `${lead.response_time_minutes} min` : '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

function DocumentsTab({ reports }: { reports: any[] }) {
  const reportTypeColours: Record<string, string> = {
    monthly: 'bg-blue-100 text-blue-700',
    quarterly: 'bg-purple-100 text-purple-700',
    special: 'bg-amber-100 text-amber-700',
  }

  if (reports.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center py-20 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium">No reports yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Reports will appear here once GLV generates them.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => {
        const highlights: string[] = Array.isArray(report.highlights) ? (report.highlights as string[]) : []
        return (
          <Card key={report.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <CardTitle className="text-base font-semibold leading-snug">{report.title}</CardTitle>
                </div>
                <Badge variant="secondary" className={cn('text-[10px] shrink-0', reportTypeColours[report.report_type ?? 'monthly'] ?? '')}>
                  {report.report_type}
                </Badge>
              </div>
              {report.report_month && <p className="text-xs text-muted-foreground">{report.report_month}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              {report.summary && <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>}
              {highlights.length > 0 && (
                <ul className="space-y-1">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{h}
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="outline" size="sm" className="w-full" disabled={!report.file_url} onClick={() => { if (report.file_url) window.open(report.file_url, '_blank') }}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {report.file_url ? 'Download Report' : 'Not Available Yet'}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: TRAFFIC
// ═══════════════════════════════════════════════════════════════════════════════

function TrafficTab({ dateRange, period }: { dateRange: DateRange; period: Period }) {
  const { data: sources } = useTrafficSources(dateRange)
  const { data: devices } = useDeviceBreakdown(dateRange)
  const { data: pages } = useTopPages(dateRange)
  const { data: trend } = useTrafficTrend(dateRange)

  // YoY comparison
  const yoyRange = toYoyDateRange(period)
  const { data: yoySources } = useTrafficSources(yoyRange)
  const { data: yoyTrend } = useTrafficTrend(yoyRange)

  const hasYoyData = (yoySources?.length ?? 0) > 0
  const hasData = (sources?.length ?? 0) > 0

  // Aggregate sources for pie chart
  const sourcePieData = useMemo(() => {
    if (!sources || sources.length === 0) return []
    const bySource: Record<string, number> = {}
    for (const s of sources) {
      const key = s.source ?? 'unknown'
      bySource[key] = (bySource[key] ?? 0) + (s.sessions ?? 0)
    }
    return Object.entries(bySource)
      .map(([name, sessions], i) => ({ name: formatEnumLabel(name), sessions, fill: CHART_COLOURS[i % CHART_COLOURS.length] }))
      .sort((a, b) => b.sessions - a.sessions)
  }, [sources])

  // Aggregate sources for table
  const sourceTableData = useMemo(() => {
    if (!sources || sources.length === 0) return []
    const byKey: Record<string, { source: string; sessions: number; users: number; bounceRateSum: number; count: number }> = {}
    for (const s of sources) {
      const key = `${s.source}/${s.medium}`
      if (!byKey[key]) byKey[key] = { source: key, sessions: 0, users: 0, bounceRateSum: 0, count: 0 }
      byKey[key].sessions += s.sessions ?? 0
      byKey[key].users += s.users ?? 0
      byKey[key].bounceRateSum += s.bounce_rate ?? 0
      byKey[key].count++
    }
    return Object.values(byKey)
      .map((d) => ({ ...d, bounceRate: d.count > 0 ? parseFloat((d.bounceRateSum / d.count).toFixed(1)) : 0 }))
      .sort((a, b) => b.sessions - a.sessions)
  }, [sources])

  // Device donut data
  const deviceData = useMemo(() => {
    if (!devices || devices.length === 0) return []
    const byType: Record<string, { sessions: number; percentage: number }> = {}
    for (const d of devices) {
      const key = d.device_type ?? 'unknown'
      if (!byType[key]) byType[key] = { sessions: 0, percentage: 0 }
      byType[key].sessions += d.sessions ?? 0
      byType[key].percentage += d.percentage ?? 0
    }
    const colours: Record<string, string> = { desktop: '#3b82f6', mobile: '#10b981', tablet: '#f59e0b' }
    return Object.entries(byType).map(([type, d]) => ({
      name: formatEnumLabel(type),
      type,
      sessions: d.sessions,
      percentage: parseFloat(d.percentage.toFixed(1)),
      fill: colours[type] ?? '#6b7280',
    }))
  }, [devices])

  // YoY session totals for comparison
  const currentTotal = useMemo(() => trend?.reduce((s, t) => s + t.sessions, 0) ?? 0, [trend])
  const yoyTotal = useMemo(() => yoyTrend?.reduce((s, t) => s + t.sessions, 0) ?? 0, [yoyTrend])
  const yoyChange = yoyTotal > 0 ? Math.round(((currentTotal - yoyTotal) / yoyTotal) * 100) : null

  if (!hasData) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center py-20 text-center">
        <Globe className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium">No traffic data yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Data will appear here once analytics sync Edge Functions populate the tables.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-6">
      {/* YoY banner */}
      {!hasYoyData && period !== 'all' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          Insufficient data for YoY comparison — needs 12+ months of data.
        </div>
      )}

      {/* Session trend with optional YoY overlay */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Sessions Over Time</CardTitle>
            {hasYoyData && yoyChange !== null && (
              <Badge variant="secondary" className={cn('text-[11px]', yoyChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                {yoyChange >= 0 ? '+' : ''}{yoyChange}% YoY
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trend ?? []}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
              <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Area type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} fill="url(#trendFill)" name="Sessions" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Traffic sources pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Traffic Sources</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sourcePieData} cx="50%" cy="50%" outerRadius={90} dataKey="sessions" label={({ name, sessions }) => `${name} (${sessions})`}>
                  {sourcePieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device breakdown donut */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Device Breakdown</CardTitle></CardHeader>
          <CardContent>
            {deviceData.length === 0 ? <EmptyChart /> : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="sessions" labelLine={false}>
                      {deviceData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {deviceData.map((d) => {
                    const DeviceIcon = DEVICE_ICONS[d.type] ?? Monitor
                    return (
                      <div key={d.type} className="flex items-center gap-2 text-sm">
                        <div className="rounded p-1" style={{ backgroundColor: `${d.fill}15` }}>
                          <DeviceIcon className="h-4 w-4" style={{ color: d.fill }} />
                        </div>
                        <div>
                          <p className="font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.percentage}% — {d.sessions} sessions</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic sources table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Traffic Sources Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Source / Medium</th>
                  <th className="pb-2 pr-4 font-medium text-right">Sessions</th>
                  <th className="pb-2 pr-4 font-medium text-right">Users</th>
                  <th className="pb-2 font-medium text-right">Bounce Rate</th>
                </tr>
              </thead>
              <tbody>
                {sourceTableData.map((row) => (
                  <tr key={row.source} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.source}</td>
                    <td className="py-2 pr-4 text-right">{row.sessions.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{row.users.toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <Badge variant="secondary" className={cn('text-[11px]',
                        row.bounceRate < 30 ? 'bg-green-100 text-green-700' :
                        row.bounceRate < 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {row.bounceRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top pages */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Top Pages</CardTitle>
            <Badge variant="secondary" className="text-[11px]">{pages?.length ?? 0} pages</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {(!pages || pages.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No page data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Path</th>
                    <th className="pb-2 pr-4 font-medium">Title</th>
                    <th className="pb-2 pr-4 font-medium text-right">Pageviews</th>
                    <th className="pb-2 pr-4 font-medium text-right">Avg Time</th>
                    <th className="pb-2 font-medium text-right">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{p.page_path}</td>
                      <td className="py-2 pr-4 font-medium">{p.page_title ?? '--'}</td>
                      <td className="py-2 pr-4 text-right font-medium">{(p.pageviews ?? 0).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right">
                        {p.avg_time_on_page ? `${Math.round(Number(p.avg_time_on_page))}s` : '--'}
                      </td>
                      <td className="py-2 text-right">
                        {p.bounce_rate != null ? (
                          <Badge variant="secondary" className={cn('text-[11px]',
                            Number(p.bounce_rate) < 30 ? 'bg-green-100 text-green-700' :
                            Number(p.bounce_rate) < 50 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {p.bounce_rate}%
                          </Badge>
                        ) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ADS (module-gated)
// ═══════════════════════════════════════════════════════════════════════════════

function AdsTab({ dateRange, period }: { dateRange: DateRange; period: Period }) {
  const { data: summary } = useAdSummary(dateRange)
  const { data: platformBreakdown } = useAdPlatformBreakdown(dateRange)
  const { data: campaigns } = useTopCampaigns(dateRange, 'roas', 20)

  // YoY
  const yoyRange = toYoyDateRange(period)
  const { data: yoySummary } = useAdSummary(yoyRange)
  const hasYoyData = yoySummary !== null

  const hasData = summary !== null

  if (!hasData) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center py-20 text-center">
        <Megaphone className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium">No ad performance data yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Data will appear here once ad platform sync Edge Functions populate the tables.
        </p>
      </div>
    )
  }

  const yoySpendChange = hasYoyData && yoySummary.totalSpend > 0
    ? Math.round(((summary.totalSpend - yoySummary.totalSpend) / yoySummary.totalSpend) * 100)
    : null
  const yoyConvChange = hasYoyData && yoySummary.totalConversions > 0
    ? Math.round(((summary.totalConversions - yoySummary.totalConversions) / yoySummary.totalConversions) * 100)
    : null
  const yoyRoasChange = hasYoyData && yoySummary.avgRoas > 0
    ? Math.round(((summary.avgRoas - yoySummary.avgRoas) / yoySummary.avgRoas) * 100)
    : null
  const yoyCpcChange = hasYoyData && yoySummary.avgCpc > 0
    ? Math.round(((summary.avgCpc - yoySummary.avgCpc) / yoySummary.avgCpc) * 100)
    : null

  return (
    <div className="mt-4 space-y-6">
      {/* YoY banner */}
      {!hasYoyData && period !== 'all' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          Insufficient data for YoY comparison — needs 12+ months of data.
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AdKpiCard label="Total Spend" value={`$${summary.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} yoyChange={yoySpendChange} invertTrend />
        <AdKpiCard label="Conversions" value={summary.totalConversions.toLocaleString()} icon={Target} yoyChange={yoyConvChange} />
        <AdKpiCard label="Avg ROAS" value={`${summary.avgRoas}x`} icon={TrendingUp} yoyChange={yoyRoasChange} />
        <AdKpiCard label="Avg CPC" value={`$${summary.avgCpc.toFixed(2)}`} icon={MousePointerClick} yoyChange={yoyCpcChange} invertTrend />
      </div>

      {/* Platform Breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(platformBreakdown ?? []).map((p) => (
          <Card key={p.platform}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-md p-1.5" style={{ backgroundColor: `${PLATFORM_COLOURS[p.platform] ?? '#6b7280'}15` }}>
                  <Zap className="h-4 w-4" style={{ color: PLATFORM_COLOURS[p.platform] ?? '#6b7280' }} />
                </div>
                <span className="font-semibold">{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div><p className="text-xs text-muted-foreground">Spend</p><p className="font-bold">${p.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                <div><p className="text-xs text-muted-foreground">Clicks</p><p className="font-bold">{p.clicks.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Conversions</p><p className="font-bold">{p.conversions.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">ROAS</p><p className="font-bold">{p.roas}x</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Campaigns</CardTitle>
            <Badge variant="secondary" className="text-[11px]">{campaigns?.length ?? 0} campaigns</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {(!campaigns || campaigns.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No campaign data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Campaign</th>
                    <th className="pb-2 pr-4 font-medium">Platform</th>
                    <th className="pb-2 pr-4 font-medium text-right">Spend</th>
                    <th className="pb-2 pr-4 font-medium text-right">Impr.</th>
                    <th className="pb-2 pr-4 font-medium text-right">Clicks</th>
                    <th className="pb-2 pr-4 font-medium text-right">CTR</th>
                    <th className="pb-2 pr-4 font-medium text-right">Conv.</th>
                    <th className="pb-2 pr-4 font-medium text-right">ROAS</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{c.campaignName}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary" className="text-[10px]" style={{
                          backgroundColor: `${PLATFORM_COLOURS[c.platform] ?? '#6b7280'}15`,
                          color: PLATFORM_COLOURS[c.platform] ?? '#6b7280',
                        }}>
                          {PLATFORM_LABELS[c.platform] ?? c.platform}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-right">${c.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 pr-4 text-right">{c.impressions.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right">{c.clicks.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right">{c.ctr}%</td>
                      <td className="py-2 pr-4 text-right font-medium">{c.conversions}</td>
                      <td className="py-2 pr-4 text-right">
                        <Badge variant="secondary" className={cn('text-[11px]',
                          c.roas >= 4 ? 'bg-green-100 text-green-700' :
                          c.roas >= 2 ? 'bg-blue-100 text-blue-700' :
                          c.roas >= 1 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {c.roas}x
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge variant="secondary" className={cn('text-[11px]',
                          c.status === 'active' ? 'bg-green-100 text-green-700' :
                          c.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                          'bg-zinc-100 text-zinc-600'
                        )}>
                          {formatEnumLabel(c.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AdKpiCard({ label, value, icon: Icon, yoyChange, invertTrend }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>
  yoyChange?: number | null; invertTrend?: boolean
}) {
  let trendColour = 'text-muted-foreground'
  if (yoyChange != null && yoyChange !== 0) {
    const isGood = invertTrend ? yoyChange < 0 : yoyChange > 0
    trendColour = isGood ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
        </div>
        <div className="mt-1.5 flex items-end gap-1.5">
          <span className="text-xl font-bold tracking-tight">{value}</span>
          {yoyChange != null && yoyChange !== 0 && (
            <span className={cn('text-[11px] font-medium mb-0.5', trendColour)}>
              {yoyChange > 0 ? '+' : ''}{yoyChange}% YoY
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function KpiCard({ label, value, icon: Icon, accent, bg, sub }: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string }>
  accent: string; bg: string; sub?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={cn('rounded-md p-2 w-fit', bg)}><Icon className={cn('h-4 w-4', accent)} /></div>
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({ label, value, prev, icon: Icon, invertTrend }: {
  label: string; value: string | number; prev?: number | null; icon: React.ComponentType<{ className?: string }>; invertTrend?: boolean
}) {
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  const numPrev = typeof prev === 'number' ? prev : null
  let trend: 'up' | 'down' | 'flat' = 'flat'
  let changeText = ''

  if (numPrev != null && !isNaN(numValue)) {
    const diff = numValue - numPrev
    const pct = numPrev !== 0 ? Math.round((diff / numPrev) * 100) : 0
    if (Math.abs(pct) >= 1) {
      trend = diff > 0 ? 'up' : 'down'
      changeText = `${diff > 0 ? '+' : ''}${pct}%`
    }
    // For metrics where lower is better (bounce rate, position)
    if (invertTrend) trend = trend === 'up' ? 'down' : trend === 'down' ? 'up' : 'flat'
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
        </div>
        <div className="mt-1.5 flex items-end gap-1.5">
          <span className="text-xl font-bold tracking-tight">{value}</span>
          {changeText && (
            <span className={cn('text-[11px] font-medium mb-0.5',
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
            )}>
              {changeText}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
      <p className="mt-2 text-xs text-muted-foreground">No data for this period</p>
    </div>
  )
}
