import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  MapPin,
  Building2,
  Package,
  Plug,
  Truck,
  Plus,
  Save,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModules, useToggleModule, type ModuleKey } from '@/hooks/use-modules'
import { useLocations, useCreateLocation, useUpdateLocation, useUpdateHours } from '@/hooks/use-locations'
import { useSiteConfig, useUpdateConfig } from '@/hooks/use-site-config'
import { useSocialLinks, useUpsertSocialLink } from '@/hooks/use-social-links'
import { Textarea } from '@/components/ui/textarea'
import {
  useNotificationConfig,
  useUpdateNotificationConfig,
  useNotificationTemplates,
  useUpdateTemplate,
  useNotificationLog,
  type NotificationConfig,
  type NotificationTemplate,
} from '@/hooks/use-notifications'
import {
  ChevronDown,
  ChevronRight,
  Globe,
  CheckCircle2,
  XCircle,
  Send,
} from 'lucide-react'

// ── Role Badge Colours ───────────────────────────────────────────────────────

const roleColours: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  staff: 'bg-zinc-100 text-zinc-600',
}

// ── Module Descriptions ──────────────────────────────────────────────────────

const MODULE_INFO: Record<ModuleKey, { label: string; description: string }> = {
  ecommerce: {
    label: 'Ecommerce',
    description: 'Online store with cart, checkout, orders, payment processing',
  },
  service_booking: {
    label: 'Service Booking',
    description: 'Online service booking with calendar and time slots',
  },
  reviews: {
    label: 'Reviews',
    description: 'Google Reviews sync, respond from admin, auto-request after service',
  },
  financing: {
    label: 'Financing',
    description: 'Financing options page and application form',
  },
  blog: {
    label: 'Blog',
    description: 'Blog section with posts and categories',
  },
  ads: {
    label: 'Ads',
    description: 'Ad performance tracking — Google Ads, Meta, TikTok',
  },
}

// ── Days of the Week ─────────────────────────────────────────────────────────

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

// ── Integration Definitions ──────────────────────────────────────────────────

const INTEGRATIONS = [
  { key: 'google_analytics', label: 'Google Analytics', description: 'Website traffic and user behaviour tracking' },
  { key: 'google_search_console', label: 'Google Search Console', description: 'Search performance and indexing status' },
  { key: 'google_ads', label: 'Google Ads', description: 'Pay-per-click advertising campaigns' },
  { key: 'meta_ads', label: 'Meta Ads', description: 'Facebook and Instagram advertising' },
  { key: 'google_business_profile', label: 'Google Business Profile', description: 'Local business listing and reviews' },
  { key: 'stripe', label: 'Stripe', description: 'Payment processing for online orders' },
  { key: 'paypal', label: 'PayPal', description: 'Alternative payment method' },
]

// ── Social Platform Options ──────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'google_business',
]

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

// ── Modules Tab (Admin Only) ─────────────────────────────────────────────────

function ModulesTab() {
  const { data: modules, isLoading } = useModules()
  const toggleModule = useToggleModule()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading modules...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enable or disable feature modules. Disabled modules hide their navigation items and routes.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules?.map((mod) => {
          const info = MODULE_INFO[mod.module_key]
          if (!info) return null
          return (
            <Card key={mod.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{info.label}</CardTitle>
                  <Switch
                    checked={mod.is_enabled}
                    onCheckedChange={(checked) =>
                      toggleModule.mutate(
                        { key: mod.module_key, enabled: checked },
                        {
                          onSuccess: () =>
                            toast.success(`${info.label} ${checked ? 'enabled' : 'disabled'}.`),
                          onError: () => toast.error(`Failed to toggle ${info.label}.`),
                        }
                      )
                    }
                    disabled={toggleModule.isPending}
                  />
                </div>
                <CardDescription className="text-xs">{info.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Locations Tab ────────────────────────────────────────────────────────────

function LocationsTab() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { data: locations, isLoading } = useLocations()
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()
  const updateHours = useUpdateHours()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [editHours, setEditHours] = useState<Record<string, any>>({})

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading locations...
      </div>
    )
  }

  function startEditing(location: any) {
    setEditingId(location.id)
    setEditForm({
      name: location.name ?? '',
      address: location.address ?? '',
      city: location.city ?? '',
      province: location.province ?? '',
      postal_code: location.postal_code ?? '',
      phone: location.phone ?? '',
      email: location.email ?? '',
    })
    // Build hours map from existing site_hours
    const hoursMap: Record<string, any> = {}
    for (const day of DAYS) {
      const existing = location.site_hours?.find((h: any) => h.day_of_week === day)
      hoursMap[day] = {
        day_of_week: day,
        open_time: existing?.open_time ?? '09:00',
        close_time: existing?.close_time ?? '17:00',
        is_closed: existing?.is_closed ?? (day === 'sunday' || day === 'saturday'),
      }
    }
    setEditHours(hoursMap)
  }

  async function handleSave(locationId: string) {
    try {
      await updateLocation.mutateAsync({ id: locationId, ...editForm })
      await updateHours.mutateAsync({
        locationId,
        hours: Object.values(editHours),
      })
      toast.success('Location updated.')
      setEditingId(null)
    } catch {
      toast.error('Failed to update location.')
    }
  }

  async function handleAddLocation() {
    try {
      await createLocation.mutateAsync({
        name: 'New Location',
        is_primary: false,
        display_order: (locations?.length ?? 0) + 1,
      })
      toast.success('Location added.')
    } catch {
      toast.error('Failed to add location.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your business locations and operating hours.
        </p>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={handleAddLocation} disabled={createLocation.isPending}>
            {createLocation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            Add Location
          </Button>
        )}
      </div>

      {locations?.map((location: any) => {
        const isEditing = editingId === location.id
        return (
          <Card key={location.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {isEditing ? editForm.name || 'Location' : location.name}
                  {location.is_primary && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Primary</Badge>
                  )}
                </CardTitle>
                {!isEditing ? (
                  <Button size="sm" variant="outline" onClick={() => startEditing(location)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    <Button
                      size="sm"
                      onClick={() => handleSave(location.id)}
                      disabled={updateLocation.isPending || updateHours.isPending}
                    >
                      {(updateLocation.isPending || updateHours.isPending) && (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      )}
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(['name', 'address', 'city', 'province', 'postal_code', 'phone', 'email'] as const).map((field) => (
                      <div key={field} className="space-y-1.5">
                        <Label className="text-xs capitalize">{field.replace('_', ' ')}</Label>
                        <Input
                          value={editForm[field] ?? ''}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Hours Grid */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Operating Hours
                    </Label>
                    <div className="space-y-2">
                      {DAYS.map((day) => {
                        const h = editHours[day]
                        return (
                          <div key={day} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-2 text-sm">
                            <span className="capitalize text-muted-foreground">{day}</span>
                            <Input
                              type="time"
                              value={h?.open_time ?? '09:00'}
                              disabled={h?.is_closed}
                              onChange={(e) =>
                                setEditHours((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day], open_time: e.target.value },
                                }))
                              }
                              className="h-8 text-xs"
                            />
                            <Input
                              type="time"
                              value={h?.close_time ?? '17:00'}
                              disabled={h?.is_closed}
                              onChange={(e) =>
                                setEditHours((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day], close_time: e.target.value },
                                }))
                              }
                              className="h-8 text-xs"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                              <Switch
                                checked={h?.is_closed ?? false}
                                onCheckedChange={(checked) =>
                                  setEditHours((prev) => ({
                                    ...prev,
                                    [day]: { ...prev[day], is_closed: checked },
                                  }))
                                }
                              />
                              Closed
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-sm text-muted-foreground">
                  {location.address && <p>{location.address}, {location.city} {location.province} {location.postal_code}</p>}
                  {location.phone && <p>{location.phone}</p>}
                  {location.email && <p>{location.email}</p>}
                  {location.site_hours?.length > 0 && (
                    <div className="mt-2 grid gap-1">
                      {DAYS.map((day) => {
                        const h = location.site_hours?.find((hr: any) => hr.day_of_week === day)
                        return (
                          <div key={day} className="grid grid-cols-[100px_1fr] text-xs">
                            <span className="capitalize">{day}</span>
                            <span>{h?.is_closed ? 'Closed' : h ? `${h.open_time} – ${h.close_time}` : '—'}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {(!locations || locations.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No locations configured yet. Add your first location to get started.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Business Info Tab ────────────────────────────────────────────────────────

function BusinessInfoTab() {
  const { data: config, isLoading: configLoading } = useSiteConfig()
  const updateConfig = useUpdateConfig()
  const { data: socialLinks, isLoading: socialLoading } = useSocialLinks()
  const upsertSocialLink = useUpsertSocialLink()

  const [form, setForm] = useState<Record<string, string>>({})
  const [formDirty, setFormDirty] = useState(false)
  const [socialForm, setSocialForm] = useState<Record<string, string>>({})
  const [socialDirty, setSocialDirty] = useState(false)

  // Initialise form from config once loaded
  const configFields = ['business_name', 'business_phone', 'business_email', 'business_address']
  if (config && !formDirty && Object.keys(form).length === 0) {
    const initial: Record<string, string> = {}
    for (const key of configFields) {
      initial[key] = config[key] ?? ''
    }
    // Use a microtask to avoid setting state during render
    queueMicrotask(() => setForm(initial))
  }

  // Initialise social links once loaded
  if (socialLinks && !socialDirty && Object.keys(socialForm).length === 0) {
    const initial: Record<string, string> = {}
    for (const link of socialLinks) {
      initial[link.platform] = link.url ?? ''
    }
    queueMicrotask(() => setSocialForm(initial))
  }

  async function handleSaveConfig() {
    try {
      for (const [key, value] of Object.entries(form)) {
        await updateConfig.mutateAsync({ key, value })
      }
      toast.success('Business info saved.')
      setFormDirty(false)
    } catch {
      toast.error('Failed to save business info.')
    }
  }

  async function handleSaveSocial() {
    try {
      for (const [platform, url] of Object.entries(socialForm)) {
        if (url.trim()) {
          const existing = socialLinks?.find((l: any) => l.platform === platform)
          await upsertSocialLink.mutateAsync({
            ...(existing ? { id: existing.id } : {}),
            platform,
            url: url.trim(),
            display_order: SOCIAL_PLATFORMS.indexOf(platform),
          })
        }
      }
      toast.success('Social links saved.')
      setSocialDirty(false)
    } catch {
      toast.error('Failed to save social links.')
    }
  }

  if (configLoading || socialLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading business info...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Business Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold inline-flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Details
          </CardTitle>
          <CardDescription className="text-xs">
            Core business information used across the site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {configFields.map((key) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs capitalize">{key.replace('business_', '').replace('_', ' ')}</Label>
                <Input
                  value={form[key] ?? ''}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    setFormDirty(true)
                  }}
                  placeholder={key.replace('business_', '').replace('_', ' ')}
                />
              </div>
            ))}
          </div>
          <Button
            size="sm"
            disabled={!formDirty || updateConfig.isPending}
            onClick={handleSaveConfig}
          >
            {updateConfig.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save Business Info
          </Button>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Social Links</CardTitle>
          <CardDescription className="text-xs">
            Links displayed in the site footer and contact pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform} className="space-y-1.5">
                <Label className="text-xs capitalize">{platform.replace('_', ' ')}</Label>
                <Input
                  value={socialForm[platform] ?? ''}
                  onChange={(e) => {
                    setSocialForm((prev) => ({ ...prev, [platform]: e.target.value }))
                    setSocialDirty(true)
                  }}
                  placeholder={`https://${platform}.com/...`}
                />
              </div>
            ))}
          </div>
          <Button
            size="sm"
            disabled={!socialDirty || upsertSocialLink.isPending}
            onClick={handleSaveSocial}
          >
            {upsertSocialLink.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save Social Links
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Integrations Tab (Admin Only) ────────────────────────────────────────────

function IntegrationsTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect third-party services. Connection setup will be available in a future update.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <Card key={integration.key}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{integration.label}</CardTitle>
                <Badge variant="secondary" className="text-xs bg-zinc-100 text-zinc-500">
                  Not Connected
                </Badge>
              </div>
              <CardDescription className="text-xs">{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" disabled className="text-xs">
                <Plug className="mr-1.5 h-3.5 w-3.5" />
                Connect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Event Type Labels ────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  new_order: 'New Order',
  new_booking: 'New Booking',
  new_review: 'New Review',
  low_stock: 'Low Stock Alert',
  new_message: 'New Message',
  service_complete: 'Service Complete',
  order_status_change: 'Order Status Change',
  booking_confirmed: 'Booking Confirmed',
  review_request: 'Review Request',
}

const PLACEHOLDER_REF: Record<string, string[]> = {
  new_lead: ['lead_name', 'lead_email', 'lead_phone', 'lead_source', 'lead_message'],
  new_order: ['order_number', 'customer_name', 'customer_email', 'order_total', 'item_count'],
  new_booking: ['service_name', 'customer_name', 'customer_email', 'booking_date', 'booking_time'],
  new_review: ['reviewer_name', 'rating', 'review_text'],
  low_stock: ['product_name', 'product_sku', 'stock_count'],
  new_message: ['sender_name', 'sender_email', 'message_subject', 'message_body'],
  service_complete: ['customer_name', 'service_name'],
  order_status_change: ['customer_name', 'order_number', 'new_status', 'status_message'],
  booking_confirmed: ['customer_name', 'service_name', 'booking_date', 'booking_time', 'location'],
  review_request: ['customer_name', 'review_url'],
}

// ── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { data: configs, isLoading: configLoading } = useNotificationConfig()
  const { data: templates, isLoading: templateLoading } = useNotificationTemplates()
  const { data: logs, isLoading: logLoading } = useNotificationLog(50)
  const updateConfig = useUpdateNotificationConfig()
  const updateTemplate = useUpdateTemplate()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')

  function toggleExpand(eventType: string) {
    if (expanded === eventType) {
      setExpanded(null)
    } else {
      setExpanded(eventType)
      const tpl = templates?.find((t) => t.event_type === eventType)
      if (tpl) {
        setEditSubject(tpl.subject)
        setEditBody(tpl.body_html)
      }
    }
  }

  function saveTemplate(tpl: NotificationTemplate) {
    updateTemplate.mutate(
      { id: tpl.id, subject: editSubject, body_html: editBody },
      {
        onSuccess: () => toast.success('Template saved'),
        onError: (e) => toast.error(e.message),
      }
    )
  }

  function handleTestWebhook(config: NotificationConfig) {
    if (!config.webhook_url) {
      toast.error('No webhook URL configured')
      return
    }
    fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config.webhook_headers_json },
      body: JSON.stringify({ test: true, event_type: config.event_type, timestamp: new Date().toISOString() }),
    })
      .then((r) => {
        if (r.ok) toast.success(`Webhook test sent (${r.status})`)
        else toast.error(`Webhook test failed (${r.status})`)
      })
      .catch((e) => toast.error(`Webhook test error: ${e.message}`))
  }

  if (configLoading || templateLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Event Config List ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold inline-flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Events
          </CardTitle>
          <CardDescription>Configure email and webhook delivery for each event type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {configs?.map((cfg) => {
            const tpl = templates?.find((t) => t.event_type === cfg.event_type)
            const isExpanded = expanded === cfg.event_type
            return (
              <div key={cfg.id} className="border rounded-lg">
                {/* Event row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleExpand(cfg.event_type)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <span className="text-sm font-medium flex-1">
                    {EVENT_LABELS[cfg.event_type] ?? cfg.event_type}
                  </span>
                  {tpl?.is_customer_facing && (
                    <Badge variant="outline" className="text-xs">Customer-facing</Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <Switch
                      checked={cfg.email_enabled}
                      onCheckedChange={(checked) =>
                        updateConfig.mutate({ id: cfg.id, email_enabled: checked })
                      }
                    />
                  </div>
                  <div className="w-48">
                    <Input
                      placeholder="Override email"
                      value={cfg.email_to ?? ''}
                      onChange={(e) =>
                        updateConfig.mutate({ id: cfg.id, email_to: e.target.value || null })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  {isAdmin && (
                    <>
                      <div className="flex items-center gap-2 ml-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <Switch
                          checked={cfg.webhook_enabled}
                          onCheckedChange={(checked) =>
                            updateConfig.mutate({ id: cfg.id, webhook_enabled: checked })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/30">
                    {/* Webhook URL (admin only) */}
                    {isAdmin && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Webhook URL</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://..."
                            value={cfg.webhook_url ?? ''}
                            onChange={(e) =>
                              updateConfig.mutate({ id: cfg.id, webhook_url: e.target.value || null })
                            }
                            className="flex-1 text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestWebhook(cfg)}
                            disabled={!cfg.webhook_url}
                          >
                            <Send className="h-3.5 w-3.5 mr-1" />
                            Test
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Template editor */}
                    {tpl && (
                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Email Template</Label>
                        <div className="space-y-2">
                          <Input
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            placeholder="Subject"
                            className="text-sm"
                          />
                          <Textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            placeholder="Body HTML"
                            rows={6}
                            className="text-sm font-mono"
                          />
                        </div>

                        {/* Placeholder reference */}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Available placeholders: </span>
                          {(PLACEHOLDER_REF[cfg.event_type] ?? []).map((p) => (
                            <code key={p} className="mx-0.5 px-1 py-0.5 bg-muted rounded text-[11px]">
                              {'{{' + p + '}}'}
                            </code>
                          ))}
                        </div>

                        <Button
                          size="sm"
                          onClick={() => saveTemplate(tpl)}
                          disabled={updateTemplate.isPending}
                        >
                          {updateTemplate.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Save className="h-3.5 w-3.5 mr-1" />
                          )}
                          Save Template
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ── Notification Log (admin only) ─────────────────────────────── */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Notification Log
            </CardTitle>
            <CardDescription>Last 50 notification delivery attempts.</CardDescription>
          </CardHeader>
          <CardContent>
            {logLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !logs?.length ? (
              <p className="text-sm text-muted-foreground py-4">No notifications sent yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Event</th>
                      <th className="pb-2 pr-3 font-medium">Channel</th>
                      <th className="pb-2 pr-3 font-medium">Recipient</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 pr-3 font-medium">Time</th>
                      <th className="pb-2 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{EVENT_LABELS[log.event_type] ?? log.event_type}</td>
                        <td className="py-2 pr-3">
                          <Badge variant="outline" className="text-xs">
                            {log.channel === 'email' ? <Mail className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                            {log.channel}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.recipient}
                        </td>
                        <td className="py-2 pr-3">
                          {log.status === 'sent' ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                        <td className="py-2 text-xs text-red-600 max-w-[200px] truncate">
                          {log.error_message}
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
    </div>
  )
}

// ── Staff Tab (Owner Only) ───────────────────────────────────────────────────

function StaffTab() {
  const { user, role } = useAuth()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('staff')

  function handleInvite() {
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
                  <Select value={inviteRole} onValueChange={(val) => setInviteRole(val ?? 'staff')}>
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

// ── Payments Tab (Admin Only) ─────────────────────────────────────────────────

function PaymentsTab() {
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load payment configs
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('store_payment_config').select('*')
      if (data) {
        const map: Record<string, any> = {}
        for (const row of data) map[row.provider] = row
        setConfigs(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function toggleProvider(provider: string, enabled: boolean) {
    const row = configs[provider]
    if (!row) return
    const { error } = await supabase
      .from('store_payment_config')
      .update({ is_enabled: enabled })
      .eq('id', row.id)
    if (error) { toast.error('Failed to toggle.'); return }
    setConfigs((prev) => ({ ...prev, [provider]: { ...prev[provider], is_enabled: enabled } }))
    toast.success(`${provider === 'in_store' ? 'In-Store' : provider.charAt(0).toUpperCase() + provider.slice(1)} ${enabled ? 'enabled' : 'disabled'}.`)
  }

  async function saveConfig(provider: string, configJson: Record<string, unknown>) {
    setSaving(true)
    const row = configs[provider]
    if (!row) { setSaving(false); return }
    const { error } = await supabase
      .from('store_payment_config')
      .update({ config_json: configJson as any })
      .eq('id', row.id)
    setSaving(false)
    if (error) { toast.error('Failed to save.'); return }
    setConfigs((prev) => ({ ...prev, [provider]: { ...prev[provider], config_json: configJson } }))
    toast.success('Configuration saved.')
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payment config...
      </div>
    )
  }

  const stripeConfig = configs.stripe?.config_json ?? {}
  const paypalConfig = configs.paypal?.config_json ?? {}

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure payment providers for the online store.
      </p>

      {/* Stripe */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Stripe</CardTitle>
            <Switch
              checked={configs.stripe?.is_enabled ?? false}
              onCheckedChange={(c) => toggleProvider('stripe', c)}
            />
          </div>
          <CardDescription className="text-xs">Accept credit and debit cards online.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Publishable Key</Label>
            <Input
              value={stripeConfig.publishable_key ?? ''}
              onChange={(e) => setConfigs((prev) => ({
                ...prev,
                stripe: { ...prev.stripe, config_json: { ...stripeConfig, publishable_key: e.target.value } },
              }))}
              placeholder="pk_live_..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Secret Key</Label>
            <Input
              type="password"
              value={stripeConfig.secret_key ?? ''}
              onChange={(e) => setConfigs((prev) => ({
                ...prev,
                stripe: { ...prev.stripe, config_json: { ...stripeConfig, secret_key: e.target.value } },
              }))}
              placeholder="sk_live_..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Webhook Secret</Label>
            <Input
              type="password"
              value={stripeConfig.webhook_secret ?? ''}
              onChange={(e) => setConfigs((prev) => ({
                ...prev,
                stripe: { ...prev.stripe, config_json: { ...stripeConfig, webhook_secret: e.target.value } },
              }))}
              placeholder="whsec_..."
            />
          </div>
          <Button
            size="sm"
            disabled={saving}
            onClick={() => saveConfig('stripe', configs.stripe?.config_json ?? {})}
          >
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save Stripe Config
          </Button>
        </CardContent>
      </Card>

      {/* PayPal */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">PayPal</CardTitle>
            <Switch
              checked={configs.paypal?.is_enabled ?? false}
              onCheckedChange={(c) => toggleProvider('paypal', c)}
            />
          </div>
          <CardDescription className="text-xs">Accept PayPal payments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Client ID</Label>
            <Input
              value={paypalConfig.client_id ?? ''}
              onChange={(e) => setConfigs((prev) => ({
                ...prev,
                paypal: { ...prev.paypal, config_json: { ...paypalConfig, client_id: e.target.value } },
              }))}
              placeholder="PayPal Client ID"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mode</Label>
            <Select
              value={paypalConfig.mode ?? 'sandbox'}
              onValueChange={(val) => setConfigs((prev) => ({
                ...prev,
                paypal: { ...prev.paypal, config_json: { ...paypalConfig, mode: val } },
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            disabled={saving}
            onClick={() => saveConfig('paypal', configs.paypal?.config_json ?? {})}
          >
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save PayPal Config
          </Button>
        </CardContent>
      </Card>

      {/* In-Store */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">In-Store Payment</CardTitle>
            <Switch
              checked={configs.in_store?.is_enabled ?? false}
              onCheckedChange={(c) => toggleProvider('in_store', c)}
            />
          </div>
          <CardDescription className="text-xs">
            Allow customers to pay in-store at pickup. No online payment processing required.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

// ── Shipping & Tax Tab (Admin Only) ──────────────────────────────────────────

function ShippingTaxTab() {
  const [shippingMethods, setShippingMethods] = useState<any[]>([])
  const [taxConfigs, setTaxConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Shipping form
  const [shipDialogOpen, setShipDialogOpen] = useState(false)
  const [editingShipId, setEditingShipId] = useState<string | null>(null)
  const [shipForm, setShipForm] = useState({ name: '', type: 'flat_rate', rate: '', min_order_for_free: '', is_enabled: false })

  // Tax form
  const [taxDialogOpen, setTaxDialogOpen] = useState(false)
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null)
  const [taxForm, setTaxForm] = useState({ region: '', province_code: '', rate_percent: '', charge_on_shipping: true, is_enabled: true })

  useEffect(() => {
    async function load() {
      const [{ data: ships }, { data: taxes }] = await Promise.all([
        supabase.from('store_shipping_methods').select('*').order('display_order'),
        supabase.from('store_tax_config').select('*').order('province_code'),
      ])
      if (ships) setShippingMethods(ships)
      if (taxes) setTaxConfigs(taxes)
      setLoading(false)
    }
    load()
  }, [])

  // ── Shipping CRUD ──
  function openAddShipping() {
    setEditingShipId(null)
    setShipForm({ name: '', type: 'flat_rate', rate: '', min_order_for_free: '', is_enabled: false })
    setShipDialogOpen(true)
  }

  function openEditShipping(s: any) {
    setEditingShipId(s.id)
    setShipForm({
      name: s.name ?? '',
      type: s.type ?? 'flat_rate',
      rate: s.rate?.toString() ?? '',
      min_order_for_free: s.min_order_for_free?.toString() ?? '',
      is_enabled: s.is_enabled ?? false,
    })
    setShipDialogOpen(true)
  }

  async function saveShipping() {
    if (!shipForm.name.trim()) { toast.error('Name is required.'); return }
    const payload = {
      name: shipForm.name.trim(),
      type: shipForm.type,
      rate: shipForm.rate ? parseFloat(shipForm.rate) : 0,
      min_order_for_free: shipForm.min_order_for_free ? parseFloat(shipForm.min_order_for_free) : null,
      is_enabled: shipForm.is_enabled,
    }
    if (editingShipId) {
      const { error } = await supabase.from('store_shipping_methods').update(payload as any).eq('id', editingShipId)
      if (error) { toast.error('Failed to update.'); return }
      setShippingMethods((prev) => prev.map((s) => s.id === editingShipId ? { ...s, ...payload } : s) as any)
      toast.success('Shipping method updated.')
    } else {
      const { data, error } = await supabase.from('store_shipping_methods').insert({ ...payload, display_order: shippingMethods.length } as any).select().single()
      if (error) { toast.error('Failed to create.'); return }
      setShippingMethods((prev) => [...prev, data] as any)
      toast.success('Shipping method created.')
    }
    setShipDialogOpen(false)
  }

  async function toggleShippingEnabled(id: string, enabled: boolean) {
    const { error } = await supabase.from('store_shipping_methods').update({ is_enabled: enabled }).eq('id', id)
    if (error) { toast.error('Failed to toggle.'); return }
    setShippingMethods((prev) => prev.map((s) => s.id === id ? { ...s, is_enabled: enabled } : s))
  }

  // ── Tax CRUD ──
  function openAddTax() {
    setEditingTaxId(null)
    setTaxForm({ region: '', province_code: '', rate_percent: '', charge_on_shipping: true, is_enabled: true })
    setTaxDialogOpen(true)
  }

  function openEditTax(t: any) {
    setEditingTaxId(t.id)
    setTaxForm({
      region: t.region ?? '',
      province_code: t.province_code ?? '',
      rate_percent: t.rate_percent?.toString() ?? '',
      charge_on_shipping: t.charge_on_shipping ?? true,
      is_enabled: t.is_enabled ?? true,
    })
    setTaxDialogOpen(true)
  }

  async function saveTax() {
    if (!taxForm.province_code.trim()) { toast.error('Province code is required.'); return }
    const payload = {
      region: taxForm.region.trim() || null,
      province_code: taxForm.province_code.trim().toUpperCase(),
      rate_percent: taxForm.rate_percent ? parseFloat(taxForm.rate_percent) : 0,
      charge_on_shipping: taxForm.charge_on_shipping,
      is_enabled: taxForm.is_enabled,
    }
    if (editingTaxId) {
      const { error } = await supabase.from('store_tax_config').update(payload).eq('id', editingTaxId)
      if (error) { toast.error('Failed to update.'); return }
      setTaxConfigs((prev) => prev.map((t) => t.id === editingTaxId ? { ...t, ...payload } : t))
      toast.success('Tax config updated.')
    } else {
      const { data, error } = await supabase.from('store_tax_config').insert(payload).select().single()
      if (error) { toast.error('Failed to create.'); return }
      setTaxConfigs((prev) => [...prev, data])
      toast.success('Tax config created.')
    }
    setTaxDialogOpen(false)
  }

  async function toggleTaxEnabled(id: string, enabled: boolean) {
    const { error } = await supabase.from('store_tax_config').update({ is_enabled: enabled }).eq('id', id)
    if (error) { toast.error('Failed to toggle.'); return }
    setTaxConfigs((prev) => prev.map((t) => t.id === id ? { ...t, is_enabled: enabled } : t))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading shipping & tax config...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shipping Methods */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold inline-flex items-center gap-2">
              <Truck className="h-4 w-4" /> Shipping Methods
            </CardTitle>
            <Button size="sm" variant="outline" onClick={openAddShipping}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {shippingMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shipping methods configured.</p>
          ) : (
            <div className="space-y-2">
              {shippingMethods.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.type === 'pickup' ? 'Pickup' : s.type === 'free' ? `Free over $${s.min_order_for_free ?? 0}` : `$${s.rate}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={s.is_enabled} onCheckedChange={(c) => toggleShippingEnabled(s.id, c)} />
                    <Button variant="ghost" size="sm" onClick={() => openEditShipping(s)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Config */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold inline-flex items-center gap-2">
              <Package className="h-4 w-4" /> Tax Rules
            </CardTitle>
            <Button size="sm" variant="outline" onClick={openAddTax}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {taxConfigs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tax rules configured.</p>
          ) : (
            <div className="space-y-2">
              {taxConfigs.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <p className="font-medium">{t.region ?? t.province_code} ({t.province_code})</p>
                    <p className="text-xs text-muted-foreground">
                      {t.rate_percent}% {t.charge_on_shipping ? '(incl. shipping)' : '(excl. shipping)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={t.is_enabled} onCheckedChange={(c) => toggleTaxEnabled(t.id, c)} />
                    <Button variant="ghost" size="sm" onClick={() => openEditTax(t)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Dialog */}
      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingShipId ? 'Edit Shipping Method' : 'Add Shipping Method'}</DialogTitle>
            <DialogDescription>Configure a shipping option for customers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input value={shipForm.name} onChange={(e) => setShipForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Type</Label>
              <Select value={shipForm.type} onValueChange={(v) => setShipForm((p) => ({ ...p, type: v ?? 'flat_rate' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat_rate">Flat Rate</SelectItem>
                  <SelectItem value="weight_based">Weight Based</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Rate ($)</Label>
                <Input type="number" step="0.01" value={shipForm.rate} onChange={(e) => setShipForm((p) => ({ ...p, rate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Free Over ($)</Label>
                <Input type="number" step="0.01" value={shipForm.min_order_for_free} onChange={(e) => setShipForm((p) => ({ ...p, min_order_for_free: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={shipForm.is_enabled} onCheckedChange={(c) => setShipForm((p) => ({ ...p, is_enabled: c }))} />
              Enabled
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveShipping}>{editingShipId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tax Dialog */}
      <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTaxId ? 'Edit Tax Rule' : 'Add Tax Rule'}</DialogTitle>
            <DialogDescription>Configure tax rates by province.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Region</Label>
                <Input value={taxForm.region} onChange={(e) => setTaxForm((p) => ({ ...p, region: e.target.value }))} placeholder="e.g. Ontario" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Province Code</Label>
                <Input value={taxForm.province_code} onChange={(e) => setTaxForm((p) => ({ ...p, province_code: e.target.value }))} placeholder="e.g. ON" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Tax Rate (%)</Label>
              <Input type="number" step="0.001" value={taxForm.rate_percent} onChange={(e) => setTaxForm((p) => ({ ...p, rate_percent: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={taxForm.charge_on_shipping} onCheckedChange={(c) => setTaxForm((p) => ({ ...p, charge_on_shipping: c }))} />
              Charge on Shipping
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={taxForm.is_enabled} onCheckedChange={(c) => setTaxForm((p) => ({ ...p, is_enabled: c }))} />
              Enabled
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaxDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTax}>{editingTaxId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Settings Page ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { role } = useAuth()
  const isOwner = role === 'owner' || role === 'admin'
  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Tabs defaultValue={0}>
        <TabsList className="flex-wrap">
          <TabsTrigger value={0}>Account</TabsTrigger>
          <TabsTrigger value={1}>Business Info</TabsTrigger>
          <TabsTrigger value={2}>Locations</TabsTrigger>
          {isOwner && <TabsTrigger value={3}>Staff</TabsTrigger>}
          {isOwner && <TabsTrigger value={4}>Notifications</TabsTrigger>}
          {isAdmin && <TabsTrigger value={5}>Payments</TabsTrigger>}
          {isAdmin && <TabsTrigger value={6}>Shipping & Tax</TabsTrigger>}
          {isAdmin && <TabsTrigger value={7}>Modules</TabsTrigger>}
          {isAdmin && <TabsTrigger value={8}>Integrations</TabsTrigger>}
        </TabsList>

        <TabsContent value={0}>
          <AccountTab />
        </TabsContent>
        <TabsContent value={1}>
          <BusinessInfoTab />
        </TabsContent>
        <TabsContent value={2}>
          <LocationsTab />
        </TabsContent>
        {isOwner && (
          <TabsContent value={3}>
            <StaffTab />
          </TabsContent>
        )}
        {isOwner && (
          <TabsContent value={4}>
            <NotificationsTab />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value={5}>
            <PaymentsTab />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value={6}>
            <ShippingTaxTab />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value={7}>
            <ModulesTab />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value={8}>
            <IntegrationsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
