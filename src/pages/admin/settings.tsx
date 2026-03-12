import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Lock,
  Bell,
  Users,
  Mail,
  Loader2,
  UserPlus,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Role Badge Colours ───────────────────────────────────────────────────────

const roleColours: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  staff: 'bg-zinc-100 text-zinc-600',
}

// ── Account Tab ──────────────────────────────────────────────────────────────

function AccountTab() {
  const { user, role } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  async function handlePasswordUpdate() {
    if (!newPassword.trim()) {
      toast.error('Please enter a new password.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setIsUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated successfully.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update password.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-[100px_1fr] items-center gap-2">
            <span className="text-muted-foreground">Email</span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              {user?.email ?? '--'}
            </span>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center gap-2">
            <span className="text-muted-foreground">Role</span>
            <Badge
              variant="secondary"
              className={cn('w-fit text-xs', roleColours[role ?? ''] ?? '')}
            >
              {role ?? 'unknown'}
            </Badge>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center gap-2">
            <span className="text-muted-foreground">User ID</span>
            <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded w-fit">
              {user?.id ?? '--'}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold inline-flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            disabled={!newPassword.trim() || isUpdating}
            onClick={handlePasswordUpdate}
          >
            {isUpdating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold inline-flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Notification preferences coming soon.
        </p>
        <div className="space-y-3 opacity-50 pointer-events-none">
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-border" />
            Email me when a new lead comes in
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-border" />
            Email me when a new message arrives
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-border" />
            Daily activity digest
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Users Tab (Owner Only) ───────────────────────────────────────────────────

function UsersTab() {
  const { user, role } = useAuth()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('staff')

  function handleInvite() {
    // NOTE: User invitation requires a Supabase edge function or admin API call.
    // The Supabase client-side SDK does not support inviting users directly.
    // To implement this, create a Supabase Edge Function that uses the admin API
    // (supabase.auth.admin.inviteUserByEmail) with the service_role key.
    toast.info('Invitation feature coming soon.')
    setInviteOpen(false)
    setInviteEmail('')
    setInviteRole('staff')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </CardTitle>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Invite Team Member
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this portal.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  size="sm"
                  disabled={!inviteEmail.trim()}
                  onClick={handleInvite}
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Current user — we can't query auth.users from the client */}
          <div className="flex items-center gap-3 rounded-md border p-3">
            <div className="rounded-full bg-zinc-100 p-2">
              <User className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email ?? '--'}</p>
              <p className="text-xs text-muted-foreground">
                {user?.id ? `ID: ${user.id.slice(0, 8)}...` : ''}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={cn('text-xs', roleColours[role ?? ''] ?? '')}
            >
              <Shield className="mr-1 h-3 w-3" />
              {role ?? 'unknown'}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Other team members will appear here once the invitation system is set up.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Settings Page ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { role } = useAuth()
  const isOwner = role === 'owner' || role === 'admin'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Tabs defaultValue={0}>
        <TabsList>
          <TabsTrigger value={0}>Account</TabsTrigger>
          <TabsTrigger value={1}>Notifications</TabsTrigger>
          {isOwner && <TabsTrigger value={2}>Users</TabsTrigger>}
        </TabsList>

        <TabsContent value={0}>
          <AccountTab />
        </TabsContent>
        <TabsContent value={1}>
          <NotificationsTab />
        </TabsContent>
        {isOwner && (
          <TabsContent value={2}>
            <UsersTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
