import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Save, Truck, User, CreditCard, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useOrder, useUpdateOrderStatus } from '@/hooks/use-orders'

const cadFormat = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

const STATUS_OPTIONS = [
  'pending', 'paid', 'processing', 'shipped', 'picked_up', 'cancelled', 'refunded',
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

function formatEnum(val: string) {
  return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatAddress(addr: Record<string, string> | null) {
  if (!addr) return '—'
  return [addr.line1, addr.line2, addr.city, addr.province, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(', ')
}

export function AdminOrderDetailPage() {
  const { orderId } = useParams({ strict: false }) as { orderId: string }
  const { data: order, isLoading } = useOrder(orderId)
  const updateStatus = useUpdateOrderStatus()

  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [initialized, setInitialized] = useState(false)

  if (order && !initialized) {
    setNewStatus(order.status)
    setTrackingNumber(order.tracking_number ?? '')
    setNotes(order.notes ?? '')
    setInitialized(true)
  }

  async function handleUpdateStatus() {
    if (!order) return
    try {
      await updateStatus.mutateAsync({
        id: order.id,
        status: newStatus,
        tracking_number: trackingNumber || undefined,
        notes: notes || undefined,
      })
      toast.success('Order updated.')
    } catch {
      toast.error('Failed to update order.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading order...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/admin/orders" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    )
  }

  const items = order.store_order_items ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Order #{order.order_number}
        </h1>
        <Badge
          variant="secondary"
          className={cn('text-xs', statusColours[order.status] ?? '')}
        >
          {formatEnum(order.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold inline-flex items-center gap-2">
              <User className="h-4 w-4" /> Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-[100px_1fr] gap-1">
              <span className="text-muted-foreground">Name</span>
              <span>{order.customer_name || '—'}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-1">
              <span className="text-muted-foreground">Email</span>
              <span>{order.email || '—'}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-1">
              <span className="text-muted-foreground">Phone</span>
              <span>{order.phone || '—'}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-1">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatAddress(order.shipping_address)}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-1">
              <span className="text-muted-foreground">Billing</span>
              <span>{formatAddress(order.billing_address)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold inline-flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-[100px_1fr] gap-1">
              <span className="text-muted-foreground">Method</span>
              <span>{order.payment_method ? formatEnum(order.payment_method) : '—'}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-1">
              <span className="text-muted-foreground">Payment ID</span>
              <span className="break-all text-xs">{order.payment_id || '—'}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-1">
              <span className="text-muted-foreground">Date</span>
              <span>{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {order.promo_code && (
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="text-muted-foreground">Promo</span>
                <span className="inline-flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {order.promo_code}
                  {order.discount_amount > 0 && (
                    <span className="text-green-600 font-medium">
                      (-{cadFormat.format(order.discount_amount)})
                    </span>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name || '—'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{cadFormat.format(item.unit_price)}</TableCell>
                      <TableCell className="font-medium">{cadFormat.format(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals */}
          <div className="mt-4 space-y-1 text-sm text-right">
            <div>Subtotal: <span className="font-medium">{cadFormat.format(order.subtotal)}</span></div>
            {order.discount_amount > 0 && (
              <div className="text-green-600">Discount: -{cadFormat.format(order.discount_amount)}</div>
            )}
            <div>Tax: {cadFormat.format(order.tax)}</div>
            <div>Shipping: {cadFormat.format(order.shipping_cost)}</div>
            <div className="text-base font-bold pt-1 border-t">
              Total: {cadFormat.format(order.total)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Update */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold inline-flex items-center gap-2">
            <Truck className="h-4 w-4" /> Update Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val ?? order.status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{formatEnum(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Optional tracking number"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this order..."
            />
          </div>
          <Button
            onClick={handleUpdateStatus}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            <Save className="mr-1.5 h-4 w-4" />
            Update Order
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
