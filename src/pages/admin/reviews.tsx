import { useState, useMemo } from 'react'
import {
  useReviews,
  useReviewStats,
  useRespondToReview,
  useReviewRequests,
  useSendReviewRequest,
  useReviewConfig,
  useUpdateReviewConfig,
  type ReviewSource,
  type ReviewRequestStatus,
} from '@/hooks/use-reviews'
import { useModuleEnabled } from '@/hooks/use-modules'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  Star,
  Loader2,
  Inbox,
  Plus,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'
          )}
        />
      ))}
    </div>
  )
}

function SourceBadge({ source }: { source: string }) {
  const colours: Record<string, string> = {
    google: 'bg-green-100 text-green-800',
    facebook: 'bg-blue-100 text-blue-800',
    manual: 'bg-zinc-100 text-zinc-600',
  }
  return (
    <Badge className={cn('text-xs capitalize', colours[source] ?? colours.manual)}>
      {source}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    expired: 'bg-zinc-100 text-zinc-600',
  }
  return (
    <Badge className={cn('text-xs capitalize', colours[status] ?? 'bg-zinc-100 text-zinc-600')}>
      {status}
    </Badge>
  )
}

function TriggerBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    service_complete: 'Service',
    unit_sold: 'Sale',
    manual: 'Manual',
  }
  return (
    <Badge variant="outline" className="text-xs">
      {labels[type] ?? type}
    </Badge>
  )
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading } = useReviewStats()
  const { data: reviews } = useReviews()

  const distributionData = useMemo(() => {
    if (!stats) return []
    return [5, 4, 3, 2, 1].map((star) => ({
      star: `${star} star`,
      count: stats.distribution[star as 1 | 2 | 3 | 4 | 5],
    }))
  }, [stats])

  const monthlyData = useMemo(() => {
    if (!reviews?.length) return []
    const months: Record<string, number> = {}
    for (const r of reviews) {
      const key = format(new Date(r.review_date), 'MMM yyyy')
      months[key] = (months[key] || 0) + 1
    }
    // Return last 6 months
    return Object.entries(months)
      .map(([month, count]) => ({ month, count }))
      .slice(-6)
  }, [reviews])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {stats ? stats.average.toFixed(1) : '—'}
              </span>
              <StarRating rating={Math.round(stats?.average ?? 0)} size="md" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{stats?.total ?? 0}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reviews This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{stats?.thisMonth ?? 0}</span>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={distributionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="star" type="category" width={55} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#facc15" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No reviews to display.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#facc15"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No trend data yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Reviews Tab ──────────────────────────────────────────────────────────────

function ReviewsTab() {
  const [sourceFilter, setSourceFilter] = useState<ReviewSource | ''>('')
  const [ratingFilter, setRatingFilter] = useState<string>('')
  const [responseFilter, setResponseFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const respondMutation = useRespondToReview()

  const filters = useMemo(() => {
    const f: Record<string, any> = {}
    if (sourceFilter) f.source = sourceFilter
    if (ratingFilter) f.rating = parseInt(ratingFilter)
    if (responseFilter === 'responded') f.has_response = true
    if (responseFilter === 'unresponded') f.has_response = false
    return f
  }, [sourceFilter, ratingFilter, responseFilter])

  const { data: reviews, isLoading } = useReviews(filters)

  function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      setResponseText('')
    } else {
      setExpandedId(id)
      const review = reviews?.find((r) => r.id === id)
      setResponseText(review?.response_text ?? '')
    }
  }

  async function handleRespond(id: string) {
    if (!responseText.trim()) {
      toast.error('Response cannot be empty')
      return
    }
    try {
      await respondMutation.mutateAsync({ id, response_text: responseText.trim() })
      toast.success('Response saved')
      setExpandedId(null)
      setResponseText('')
    } catch {
      toast.error('Failed to save response')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={sourceFilter} onValueChange={(val) => setSourceFilter((val ?? '') as ReviewSource | '')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sources</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={(val) => setRatingFilter(val ?? '')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>

        <Select value={responseFilter} onValueChange={(val) => setResponseFilter(val ?? '')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Responses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Responses</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="unresponded">Unresponded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !reviews?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Star className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No reviews yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Reviews will appear here once collected.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <>
                  <TableRow
                    key={review.id}
                    className="cursor-pointer"
                    onClick={() => handleExpand(review.id)}
                  >
                    <TableCell>
                      {expandedId === review.id ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{review.reviewer_name}</TableCell>
                    <TableCell>
                      <StarRating rating={review.rating} />
                    </TableCell>
                    <TableCell>
                      <SourceBadge source={review.source} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(review.review_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {review.response_text ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">Responded</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded row */}
                  {expandedId === review.id && (
                    <TableRow key={`${review.id}-detail`}>
                      <TableCell colSpan={6} className="bg-zinc-50 p-4">
                        <div className="space-y-3">
                          {review.review_text && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Review
                              </p>
                              <p className="text-sm">{review.review_text}</p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Your Response
                            </p>
                            <Textarea
                              rows={3}
                              placeholder="Write a response..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleRespond(review.id)}
                              disabled={respondMutation.isPending}
                            >
                              {respondMutation.isPending && (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              )}
                              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                              Respond
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ── Send Review Request Dialog ───────────────────────────────────────────────

function SendRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const sendRequest = useSendReviewRequest()
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
  })

  function resetForm() {
    setFormData({ customer_name: '', email: '', phone: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.customer_name || !formData.email) {
      toast.error('Name and email are required')
      return
    }
    try {
      await sendRequest.mutateAsync({
        customer_name: formData.customer_name,
        email: formData.email,
        phone: formData.phone || undefined,
      })
      toast.success('Review request created')
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error('Failed to create review request')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Review Request</DialogTitle>
          <DialogDescription>
            Send a review request to a customer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="req_name">Customer Name *</Label>
            <Input
              id="req_name"
              value={formData.customer_name}
              onChange={(e) => setFormData((p) => ({ ...p, customer_name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req_email">Email *</Label>
            <Input
              id="req_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req_phone">Phone</Label>
            <Input
              id="req_phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendRequest.isPending}>
              {sendRequest.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              <Send className="mr-1.5 h-4 w-4" />
              Send Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Requests Tab ─────────────────────────────────────────────────────────────

function RequestsTab() {
  const [statusFilter, setStatusFilter] = useState<ReviewRequestStatus | ''>('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: requests, isLoading } = useReviewRequests(
    statusFilter ? { status: statusFilter } : {}
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter((val ?? '') as ReviewRequestStatus | '')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Send Review Request
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !requests?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No review requests yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Send your first review request to start collecting feedback.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Send Review Request
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.customer_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{req.email}</TableCell>
                  <TableCell>
                    <TriggerBadge type={req.trigger_type} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.sent_at ? format(new Date(req.sent_at), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(req.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SendRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}

// ── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const { data: config, isLoading } = useReviewConfig()
  const updateConfig = useUpdateReviewConfig()
  const [dirty, setDirty] = useState(false)
  const [form, setForm] = useState({
    google_place_id: '',
    review_url: '',
    auto_request_enabled: false,
    request_delay_hours: 24,
    request_email_template: '',
    min_rating_to_display: 4,
  })

  // Sync form with loaded config
  useState(() => {
    // This runs once on mount; we also handle config changes below
  })

  // Update form when config loads
  if (config && !dirty) {
    const next = {
      google_place_id: config.google_place_id ?? '',
      review_url: config.review_url ?? '',
      auto_request_enabled: config.auto_request_enabled,
      request_delay_hours: config.request_delay_hours,
      request_email_template: config.request_email_template,
      min_rating_to_display: config.min_rating_to_display,
    }
    if (JSON.stringify(next) !== JSON.stringify(form)) {
      setForm(next)
    }
  }

  function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function handleSave() {
    try {
      await updateConfig.mutateAsync({
        google_place_id: form.google_place_id || null,
        review_url: form.review_url || null,
        auto_request_enabled: form.auto_request_enabled,
        request_delay_hours: form.request_delay_hours,
        request_email_template: form.request_email_template,
        min_rating_to_display: form.min_rating_to_display,
      })
      toast.success('Review settings saved')
      setDirty(false)
    } catch {
      toast.error('Failed to save settings')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="google_place_id">Google Place ID</Label>
        <Input
          id="google_place_id"
          placeholder="ChIJ..."
          value={form.google_place_id}
          onChange={(e) => handleChange('google_place_id', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Used for pulling Google reviews automatically.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review_url">Review URL</Label>
        <Input
          id="review_url"
          placeholder="https://g.page/r/..."
          value={form.review_url}
          onChange={(e) => handleChange('review_url', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Direct link sent to customers in review request emails.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Auto-Request Reviews</p>
          <p className="text-xs text-muted-foreground">
            Automatically send review requests after service completion or unit sale.
          </p>
        </div>
        <Switch
          checked={form.auto_request_enabled}
          onCheckedChange={(checked) => handleChange('auto_request_enabled', !!checked)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delay_hours">Request Delay (hours)</Label>
        <Input
          id="delay_hours"
          type="number"
          min={1}
          max={168}
          value={form.request_delay_hours}
          onChange={(e) => handleChange('request_delay_hours', parseInt(e.target.value) || 24)}
        />
        <p className="text-xs text-muted-foreground">
          Hours to wait after trigger before sending the review request.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email_template">Email Template</Label>
        <Textarea
          id="email_template"
          rows={6}
          value={form.request_email_template}
          onChange={(e) => handleChange('request_email_template', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Available placeholders: <code className="bg-zinc-100 px-1 rounded">{'{{customer_name}}'}</code>{' '}
          and <code className="bg-zinc-100 px-1 rounded">{'{{review_url}}'}</code>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="min_rating">Minimum Rating to Display on Site</Label>
        <Select
          value={String(form.min_rating_to_display)}
          onValueChange={(val) => handleChange('min_rating_to_display', parseInt(val ?? '4'))}
        >
          <SelectTrigger id="min_rating" className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} star{n > 1 ? 's' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Only reviews with this rating or higher will be visible on the public site.
        </p>
      </div>

      <Button onClick={handleSave} disabled={updateConfig.isPending || !dirty}>
        {updateConfig.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function ReviewsAdminPage() {
  const reviewsEnabled = useModuleEnabled('reviews')
  const { role } = useAuth()

  if (!reviewsEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-3 text-lg font-semibold text-muted-foreground">
          Reviews module is not enabled
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Enable the reviews module in Settings to access this page.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>

      <Tabs defaultValue={0}>
        <TabsList>
          <TabsTrigger value={0}>Overview</TabsTrigger>
          <TabsTrigger value={1}>Reviews</TabsTrigger>
          <TabsTrigger value={2}>Requests</TabsTrigger>
          {role === 'admin' && <TabsTrigger value={3}>Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value={0}>
          <OverviewTab />
        </TabsContent>
        <TabsContent value={1}>
          <ReviewsTab />
        </TabsContent>
        <TabsContent value={2}>
          <RequestsTab />
        </TabsContent>
        {role === 'admin' && (
          <TabsContent value={3}>
            <SettingsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
