import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLeads, type LeadFilters } from '@/hooks/use-leads'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  MousePointerClick,
  Globe,
  Megaphone,
  Users,
  Share2,
  HelpCircle,
  Loader2,
  Inbox,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// ── Colour Maps ─────────────────────────────────────────────────────────────────

const statusColours: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-purple-100 text-purple-700',
  negotiating: 'bg-orange-100 text-orange-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

const typeColours: Record<string, string> = {
  quote_request: 'bg-blue-100 text-blue-700',
  contact: 'bg-zinc-100 text-zinc-600',
  service_request: 'bg-amber-100 text-amber-700',
  financing: 'bg-green-100 text-green-700',
  trade_in: 'bg-purple-100 text-purple-700',
}

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Source Icon ──────────────────────────────────────────────────────────────────

function SourceCell({ source }: { source: string | null }) {
  if (!source) return <span className="text-muted-foreground">--</span>

  const iconMap: Record<string, React.ReactNode> = {
    google_organic: <Search className="h-3.5 w-3.5" />,
    google_ads: <Megaphone className="h-3.5 w-3.5" />,
    direct: <MousePointerClick className="h-3.5 w-3.5" />,
    facebook: <Globe className="h-3.5 w-3.5" />,
    referral: <Users className="h-3.5 w-3.5" />,
    other: <Share2 className="h-3.5 w-3.5" />,
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      {iconMap[source] ?? <HelpCircle className="h-3.5 w-3.5" />}
      {formatEnumLabel(source)}
    </span>
  )
}

// ── Skeleton Row ────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-40 animate-pulse rounded bg-zinc-100" />
        </div>
      </TableCell>
      <TableCell><div className="h-5 w-20 animate-pulse rounded-full bg-zinc-200" /></TableCell>
      <TableCell><div className="h-4 w-24 animate-pulse rounded bg-zinc-200" /></TableCell>
      <TableCell><div className="h-5 w-20 animate-pulse rounded-full bg-zinc-200" /></TableCell>
      <TableCell><div className="h-4 w-12 animate-pulse rounded bg-zinc-200" /></TableCell>
      <TableCell><div className="h-4 w-16 animate-pulse rounded bg-zinc-200" /></TableCell>
    </TableRow>
  )
}

// ── Leads Page ──────────────────────────────────────────────────────────────────

export function LeadsPage() {
  const [filters, setFilters] = useState<LeadFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const { data: leads, isLoading } = useLeads(filters)
  const navigate = useNavigate()

  function handleSearchChange(value: string) {
    setSearchInput(value)
    setFilters((prev) => ({ ...prev, search: value || undefined }))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Manage incoming leads, track status, and follow up.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.status ?? ''}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, status: val || undefined }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="negotiating">Negotiating</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.source ?? ''}
          onValueChange={(val) =>
            setFilters((prev) => ({ ...prev, source: val || undefined }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sources</SelectItem>
            <SelectItem value="google_organic">Google Organic</SelectItem>
            <SelectItem value="google_ads">Google Ads</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : !leads || leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Inbox className="h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-3 text-sm font-medium">No leads found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {filters.status || filters.source || filters.search
                        ? 'Try adjusting your filters.'
                        : 'Leads will appear here as they come in.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ to: '/admin/leads/$leadId', params: { leadId: lead.id } })
                  }
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      {lead.email && (
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('text-[11px]', typeColours[lead.lead_type] ?? '')}
                    >
                      {formatEnumLabel(lead.lead_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <SourceCell source={lead.source} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('text-[11px]', statusColours[lead.status] ?? '')}
                    >
                      {formatEnumLabel(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.response_time_minutes != null
                      ? `${lead.response_time_minutes} min`
                      : <span className="text-muted-foreground">&mdash;</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.created_at
                      ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
                      : ''}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
