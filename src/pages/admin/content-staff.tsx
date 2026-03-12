import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, Upload, User, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  useStaffDirectory,
  useCreateStaffMember,
  useUpdateStaffMember,
  useDeleteStaffMember,
} from '@/hooks/use-staff-directory'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

interface StaffForm {
  full_name: string
  role_title: string
  department: string
  email: string
  phone: string
  bio: string
  photo_url: string
  is_active: boolean
}

const EMPTY_FORM: StaffForm = {
  full_name: '',
  role_title: '',
  department: '',
  email: '',
  phone: '',
  bio: '',
  photo_url: '',
  is_active: true,
}

const CMS_BUCKET = 'cms-images'

async function uploadCmsImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const fileName = `staff/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from(CMS_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(CMS_BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// ── Staff Dialog ─────────────────────────────────────────────────────────────

function StaffDialog({
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
  form: StaffForm
  setForm: React.Dispatch<React.SetStateAction<StaffForm>>
  onSave: () => void
  saving: boolean
  isEdit: boolean
}) {
  const [uploading, setUploading] = useState(false)

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadCmsImage(file)
      setForm((prev) => ({ ...prev, photo_url: url }))
      toast.success('Photo uploaded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Photo upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update staff member details.' : 'Add a new team member to the directory.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Full Name</Label>
              <Input
                id="staff-name"
                value={form.full_name}
                onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-title">Job Title</Label>
              <Input
                id="staff-title"
                value={form.role_title}
                onChange={(e) => setForm((prev) => ({ ...prev, role_title: e.target.value }))}
                placeholder="e.g. Sales Manager"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-dept">Department</Label>
              <Input
                id="staff-dept"
                value={form.department}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="e.g. Sales"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-phone">Phone</Label>
            <Input
              id="staff-phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="705-555-0123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-bio">Bio</Label>
            <Textarea
              id="staff-bio"
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Brief bio or description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Photo</Label>
            {form.photo_url && (
              <div className="relative h-20 w-20 overflow-hidden rounded-full border bg-muted">
                <img src={form.photo_url} alt="Staff photo" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={form.photo_url}
                onChange={(e) => setForm((prev) => ({ ...prev, photo_url: e.target.value }))}
                placeholder="Photo URL"
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoUpload(file)
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

          <label className="flex items-center gap-2.5 text-sm">
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
            />
            Active
          </label>
        </div>
        <DialogFooter>
          <Button size="sm" disabled={!form.full_name.trim() || saving} onClick={onSave}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Staff Member'}
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
          <DialogTitle>Remove Staff Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {name} from the directory? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" disabled={deleting} onClick={onConfirm}>
            {deleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Staff Page ───────────────────────────────────────────────────────────────

export function ContentStaffPage() {
  const { data: staff, isLoading } = useStaffDirectory()
  const createStaff = useCreateStaffMember()
  const updateStaff = useUpdateStaffMember()
  const deleteStaff = useDeleteStaffMember()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(member: any) {
    setEditingId(member.id)
    setForm({
      full_name: member.full_name ?? '',
      role_title: member.role_title ?? '',
      department: member.department ?? '',
      email: member.email ?? '',
      phone: member.phone ?? '',
      bio: member.bio ?? '',
      photo_url: member.photo_url ?? '',
      is_active: member.is_active ?? true,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    const payload: any = {
      full_name: form.full_name.trim(),
      role_title: form.role_title || null,
      department: form.department || null,
      email: form.email || null,
      phone: form.phone || null,
      bio: form.bio || null,
      photo_url: form.photo_url || null,
      is_active: form.is_active,
    }

    try {
      if (editingId) {
        await updateStaff.mutateAsync({ id: editingId, ...payload })
        toast.success('Staff member updated.')
      } else {
        await createStaff.mutateAsync(payload)
        toast.success('Staff member added.')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save staff member.')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteStaff.mutateAsync(deleteTarget.id)
      toast.success('Staff member removed.')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to remove staff member.')
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Staff Directory</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Staff Directory</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Grid */}
      {(!staff || staff.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            No staff members yet. Add your first team member.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member: any) => (
            <Card key={member.id} className={!member.is_active ? 'opacity-60' : ''}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  {/* Photo */}
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border bg-muted">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.full_name}</p>
                    {member.role_title && (
                      <p className="text-xs text-muted-foreground truncate">{member.role_title}</p>
                    )}
                    {member.department && (
                      <p className="text-xs text-muted-foreground truncate">{member.department}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(member)}>
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget({ id: member.id, name: member.full_name })}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        saving={createStaff.isPending || updateStaff.isPending}
        isEdit={!!editingId}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleteStaff.isPending}
        name={deleteTarget?.name ?? ''}
      />
    </div>
  )
}
