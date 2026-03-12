import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { Plus, Pencil, Trash2, Loader2, Star, MessageSquareQuote } from 'lucide-react'
import { toast } from 'sonner'
import {
  useTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
} from '@/hooks/use-testimonials'

// ── Types ────────────────────────────────────────────────────────────────────

interface TestimonialForm {
  customer_name: string
  quote: string
  rating: number
  photo_url: string
  is_active: boolean
}

const EMPTY_FORM: TestimonialForm = {
  customer_name: '',
  quote: '',
  rating: 5,
  photo_url: '',
  is_active: true,
}

// ── Star Rating Display ──────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

// ── Testimonial Dialog ───────────────────────────────────────────────────────

function TestimonialDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: TestimonialForm
  setForm: React.Dispatch<React.SetStateAction<TestimonialForm>>
  onSave: () => void
  saving: boolean
  isEdit: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the testimonial details.' : 'Add a customer testimonial to display on your site.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="testimonial-name">Customer Name</Label>
            <Input
              id="testimonial-name"
              value={form.customer_name}
              onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testimonial-quote">Quote</Label>
            <Textarea
              id="testimonial-quote"
              value={form.quote}
              onChange={(e) => setForm((prev) => ({ ...prev, quote: e.target.value }))}
              placeholder="What did the customer say?"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <Select
              value={String(form.rating)}
              onValueChange={(val) => setForm((prev) => ({ ...prev, rating: parseInt(val ?? '5') }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    <span className="flex items-center gap-2">
                      {r} star{r !== 1 ? 's' : ''}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StarRating rating={form.rating} size="md" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testimonial-photo">Photo URL</Label>
            <Input
              id="testimonial-photo"
              value={form.photo_url}
              onChange={(e) => setForm((prev) => ({ ...prev, photo_url: e.target.value }))}
              placeholder="https://... (optional)"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
            />
            Active
          </label>
        </div>
        <DialogFooter>
          <Button
            size="sm"
            disabled={!form.customer_name.trim() || !form.quote.trim() || saving}
            onClick={onSave}
          >
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Testimonial'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Confirmation ──────────────────────────────────────────────────────

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  deleting,
  name,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  deleting: boolean
  name: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Testimonial</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the testimonial from {name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" disabled={deleting} onClick={onConfirm}>
            {deleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Testimonials Page ────────────────────────────────────────────────────────

export function ContentTestimonialsPage() {
  const { data: testimonials, isLoading } = useTestimonials()
  const createTestimonial = useCreateTestimonial()
  const updateTestimonial = useUpdateTestimonial()
  const deleteTestimonial = useDeleteTestimonial()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TestimonialForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(testimonial: any) {
    setEditingId(testimonial.id)
    setForm({
      customer_name: testimonial.customer_name ?? '',
      quote: testimonial.quote ?? '',
      rating: testimonial.rating ?? 5,
      photo_url: testimonial.photo_url ?? '',
      is_active: testimonial.is_active ?? true,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    const payload: any = {
      customer_name: form.customer_name.trim(),
      quote: form.quote.trim(),
      rating: form.rating,
      photo_url: form.photo_url || null,
      is_active: form.is_active,
    }

    try {
      if (editingId) {
        await updateTestimonial.mutateAsync({ id: editingId, ...payload })
        toast.success('Testimonial updated.')
      } else {
        await createTestimonial.mutateAsync(payload)
        toast.success('Testimonial added.')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save testimonial.')
    }
  }

  async function handleToggleActive(testimonial: any) {
    try {
      await updateTestimonial.mutateAsync({ id: testimonial.id, is_active: !testimonial.is_active })
      toast.success(`Testimonial ${!testimonial.is_active ? 'activated' : 'deactivated'}.`)
    } catch {
      toast.error('Failed to update testimonial.')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteTestimonial.mutateAsync(deleteTarget.id)
      toast.success('Testimonial deleted.')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete testimonial.')
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Testimonial
        </Button>
      </div>

      {/* Testimonials List */}
      {(!testimonials || testimonials.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <MessageSquareQuote className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            No testimonials yet. Add your first testimonial.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonials.map((testimonial: any) => (
            <Card key={testimonial.id} className={!testimonial.is_active ? 'opacity-60' : ''}>
              <CardContent className="flex items-start gap-4 py-4">
                {/* Photo / Avatar */}
                {testimonial.photo_url ? (
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border bg-muted">
                    <img
                      src={testimonial.photo_url}
                      alt={testimonial.customer_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-medium text-muted-foreground">
                    {testimonial.customer_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{testimonial.customer_name}</p>
                    {testimonial.rating && <StarRating rating={testimonial.rating} />}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </div>

                {/* Active Toggle */}
                <Switch
                  checked={testimonial.is_active}
                  onCheckedChange={() => handleToggleActive(testimonial)}
                  disabled={updateTestimonial.isPending}
                />

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(testimonial)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      setDeleteTarget({ id: testimonial.id, name: testimonial.customer_name })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <TestimonialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        saving={createTestimonial.isPending || updateTestimonial.isPending}
        isEdit={!!editingId}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleteTestimonial.isPending}
        name={deleteTarget?.name ?? ''}
      />
    </div>
  )
}
