import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search, Inbox, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useOrders, type OrderFilters } from '@/hooks/use-orders'

const cadFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const statusColours: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  picked_up: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-zinc-100 text-zinc-600',
}

const paymentColours: Record<string, string> = {
  stripe: 'bg-indigo-100 text-indigo-700',
  paypal: 'bg-blue-100 text-blue-700',
  in_store: 'bg-amber-100 text-amber-700',
}

function formatEnum(val: string) {
  return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AdminOrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const { data: orders, isLoading } = useOrders(filters)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Orders
          {!isLoading && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({orders?.length ?? 0})
            </span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage customer orders.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.status ?? ''}
          onValueChange={(val) => setFilters((prev) => ({ ...prev, status: (val ?? '') || undefined }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-[160px]"
          value={filters.date_from ?? ''}
          onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value || undefined }))}
          placeholder="From"
        />
        <Input
          type="date"
          className="w-[160px]"
          value={filters.date_to ?? ''}
          onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value || undefined }))}
          placeholder="To"
        />

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setFilters((prev) => ({ ...prev, search: e.target.value || undefined }))
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading orders...
        </div>
      ) : !orders?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No orders found</p>
          <p className="mt-1 text-xs text-muted-foreground">Orders will appear here when customers check out.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      to="/admin/orders/$orderId"
                      params={{ orderId: o.id }}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      #{o.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{o.customer_name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{o.email || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', statusColours[o.status] ?? '')}
                    >
                      {formatEnum(o.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {o.payment_method ? (
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', paymentColours[o.payment_method] ?? '')}
                      >
                        {formatEnum(o.payment_method)}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{cadFormat.format(o.total)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {format(new Date(o.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
