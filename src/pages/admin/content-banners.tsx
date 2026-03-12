import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Image, Plus, Pencil, Trash2, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/hooks/use-banners'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

interface BannerForm {
  title: string
  image_url: string
  link_url: string
  display_order: number
  is_active: boolean
  starts_at: string
  ends_at: string
}

const EMPTY_FORM: BannerForm = {
  title: '',
  image_url: '',
  link_url: '',
  display_order: 0,
  is_active: true,
  starts_at: '',
  ends_at: '',
}

const CMS_BUCKET = 'cms-images'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(starts_at: string | null, ends_at: string | null): string {
  if (!starts_at && !ends_at) return 'Always'
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-CA')
  if (starts_at && ends_at) return `${fmt(starts_at)} — ${fmt(ends_at)}`
  if (starts_at) return `From ${fmt(starts_at)}`
  return `Until ${fmt(ends_at!)}`
}

async function uploadCmsImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const fileName = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from(CMS_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(CMS_BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// ── Banner Dialog ────────────────────────────────────────────────────────────

function BannerDialog({
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
  form: BannerForm
  setForm: React.Dispatch<React.SetStateAction<BannerForm>>
  onSave: () => void
  saving: boolean
  isEdit: boolean
}) {
  const [uploading, setUploading] = useState(false)

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadCmsImage(file)
      setForm((prev) => ({ ...prev, image_url: url }))
      toast.success('Image uploaded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update banner details below.' : 'Create a new banner for your site.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="banner-title">Title</Label>
            <Input
              id="banner-title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Banner title"
            />
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            {form.image_url && (
              <div className="relative h-24 w-full overflow-hidden rounded-md border bg-muted">
                <img src={form.image_url} alt="Banner preview" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={form.image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                placeholder="Image URL"
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                    e.target.value = ''
                  }}
                  disabled={uploading}
                />
                <Button type="button" size="sm" variant="outline" asChild disabled={uploading}>
                  <span>
                    {uploading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Upload
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-link">Link URL</Label>
            <Input
              id="banner-link"
              value={form.link_url}
              onChange={(e) => setForm((prev) => ({ ...prev, link_url: e.target.value }))}
              placeholder="/inventory or https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="banner-start">Start Date</Label>
              <Input
                id="banner-start"
                type="date"
                value={form.starts_at}
                onChange={(e) => setForm((prev) => ({ ...prev, starts_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-end">End Date</Label>
              <Input
                id="banner-end"
                type="date"
                value={form.ends_at}
                onChange={(e) => setForm((prev) => ({ ...prev, ends_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-order">Display Order</Label>
            <Input
              id="banner-order"
              type="number"
              value={form.display_order}
              onChange={(e) => setForm((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
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
          <Button size="sm" disabled={!form.title.trim() || saving} onClick={onSave}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Banner'}
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
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  deleting: boolean
  title: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Banner</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{title}&rdquo;? This action cannot be undone.
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

// ── Banners Page ─────────────────────────────────────────────────────────────

export function ContentBannersPage() {
  const { data: banners, isLoading } = useBanners()
  const createBanner = useCreateBanner()
  const updateBanner = useUpdateBanner()
  const deleteBanner = useDeleteBanner()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(banner: any) {
    setEditingId(banner.id)
    setForm({
      title: banner.title ?? '',
      image_url: banner.image_url ?? '',
      link_url: banner.link_url ?? '',
      display_order: banner.display_order ?? 0,
      is_active: banner.is_active ?? true,
      starts_at: banner.starts_at ? banner.starts_at.slice(0, 10) : '',
      ends_at: banner.ends_at ? banner.ends_at.slice(0, 10) : '',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    const payload: any = {
      title: form.title.trim(),
      image_url: form.image_url || null,
      link_url: form.link_url || null,
      display_order: form.display_order,
      is_active: form.is_active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    }

    try {
      if (editingId) {
        await updateBanner.mutateAsync({ id: editingId, ...payload })
        toast.success('Banner updated.')
      } else {
        await createBanner.mutateAsync(payload)
        toast.success('Banner created.')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save banner.')
    }
  }

  async function handleToggleActive(banner: any) {
    try {
      await updateBanner.mutateAsync({ id: banner.id, is_active: !banner.is_active })
      toast.success(`Banner ${!banner.is_active ? 'activated' : 'deactivated'}.`)
    } catch {
      toast.error('Failed to update banner.')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteBanner.mutateAsync(deleteTarget.id)
      toast.success('Banner deleted.')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete banner.')
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Banner
        </Button>
      </div>

      {/* Banner List */}
      {(!banners || banners.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Image className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            No banners yet. Add your first banner.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((banner: any) => (
            <Card key={banner.id}>
              <CardContent className="flex items-center gap-4 py-3">
                {/* Thumbnail */}
                <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                  {banner.image_url ? (
                    <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Image className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{banner.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Order: {banner.display_order}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateRange(banner.starts_at, banner.ends_at)}
                    </span>
                  </div>
                </div>

                {/* Active Toggle */}
                <Switch
                  checked={banner.is_active}
                  onCheckedChange={() => handleToggleActive(banner)}
                  disabled={updateBanner.isPending}
                />

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(banner)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget({ id: banner.id, title: banner.title })}
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
      <BannerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        saving={createBanner.isPending || updateBanner.isPending}
        isEdit={!!editingId}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleteBanner.isPending}
        title={deleteTarget?.title ?? ''}
      />
    </div>
  )
}
