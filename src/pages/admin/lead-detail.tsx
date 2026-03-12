import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useLead, useUpdateLead } from '@/hooks/use-leads'
import { useStaff } from '@/hooks/use-staff'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Search,
  Clock,
  Calendar,
  User,
  Check,
  X,
  Trophy,
  Loader2,
  AlertCircle,
  Activity,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { Json } from '@/lib/database.types'

// ── Types ───────────────────────────────────────────────────────────────────────

interface Note {
  text: string
  created_at: string
  user_id?: string
}

type LeadStatus = 'new' | 'contacted' | 'quoted' | 'negotiating' | 'won' | 'lost'

// ── Colour Maps ─────────────────────────────────────────────────────────────────

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

// ── Pipeline Steps ──────────────────────────────────────────────────────────────

const PIPELINE_STEPS: LeadStatus[] = ['new', 'contacted', 'quoted', 'negotiating']

function getStepState(
  step: LeadStatus,
  currentStatus: LeadStatus
): 'completed' | 'current' | 'upcoming' {
  if (currentStatus === 'won' || currentStatus === 'lost') return 'completed'
  const currentIdx = PIPELINE_STEPS.indexOf(currentStatus)
  const stepIdx = PIPELINE_STEPS.indexOf(step)
  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'current'
  return 'upcoming'
}

// ── Activity Hook (filtered by entity_id) ───────────────────────────────────────

function useLeadActivity(leadId: string) {
  return useQuery({
    queryKey: ['activity', 'lead', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_activity_log')
        .select('*')
        .eq('entity_type', 'lead')
        .eq('entity_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
    enabled: !!leadId,
  })
}

// ── Lead Detail Page ────────────────────────────────────────────────────────────

export function LeadDetailPage() {
  const { leadId } = useParams({ strict: false }) as { leadId: string }
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: lead, isLoading, error } = useLead(leadId)
  const updateLead = useUpdateLead()
  const { data: activityData, isLoading: activityLoading } = useLeadActivity(leadId)
  const { data: staff } = useStaff()

  const [noteText, setNoteText] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">Lead not found</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate({ to: '/admin/leads' })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Leads
        </Button>
      </div>
    )
  }

  const currentStatus = lead.status as LeadStatus
  const notes: Note[] = Array.isArray(lead.notes) ? (lead.notes as unknown as Note[]) : []

  // ── Status Update Handler ───────────────────────────────────────────────────

  function handleStatusChange(newStatus: LeadStatus) {
    if (newStatus === currentStatus) return
    updateLead.mutate({ id: lead!.id, status: newStatus })
  }

  // ── Add Note Handler ────────────────────────────────────────────────────────

  async function handleAddNote() {
    if (!noteText.trim()) return
    setIsAddingNote(true)
    const newNote: Note = {
      text: noteText.trim(),
      created_at: new Date().toISOString(),
      user_id: user?.id,
    }
    const updatedNotes = [...notes, newNote] as unknown as Json
    await updateLead.mutateAsync({ id: lead!.id, notes: updatedNotes })
    setNoteText('')
    setIsAddingNote(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <button
          onClick={() => navigate({ to: '/admin/leads' })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                  {lead.email}
                </a>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                  {lead.phone}
                </a>
              )}
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn('text-xs', typeColours[lead.lead_type] ?? '')}
          >
            {formatEnumLabel(lead.lead_type)}
          </Badge>
        </div>
      </div>

      {/* Status Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Status Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {PIPELINE_STEPS.map((step, i) => {
              const state = getStepState(step, currentStatus)
              return (
                <div key={step} className="flex items-center flex-1">
                  <button
                    onClick={() => handleStatusChange(step)}
                    disabled={updateLead.isPending}
                    className={cn(
                      'flex h-10 w-full items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors',
                      state === 'current' &&
                        'border-primary bg-primary text-primary-foreground',
                      state === 'completed' &&
                        'border-green-200 bg-green-50 text-green-700',
                      state === 'upcoming' &&
                        'border-border bg-background text-muted-foreground hover:bg-zinc-50',
                      updateLead.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {state === 'completed' && <Check className="h-3.5 w-3.5" />}
                    {formatEnumLabel(step)}
                  </button>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="mx-1 h-px w-3 bg-border shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Won / Lost Buttons */}
          <div className="mt-3 flex gap-2">
            <Button
              variant={currentStatus === 'won' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                currentStatus === 'won'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'text-green-700 border-green-200 hover:bg-green-50'
              )}
              disabled={updateLead.isPending}
              onClick={() => handleStatusChange('won')}
            >
              <Trophy className="mr-1.5 h-3.5 w-3.5" />
              Won
            </Button>
            <Button
              variant={currentStatus === 'lost' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                currentStatus === 'lost'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'text-red-700 border-red-200 hover:bg-red-50'
              )}
              disabled={updateLead.isPending}
              onClick={() => handleStatusChange('lost')}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Lost
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <span className="text-muted-foreground">Source</span>
              <span>{lead.source ? formatEnumLabel(lead.source) : '--'}</span>
            </div>
            {lead.landing_page && (
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <span className="text-muted-foreground">Landing Page</span>
                <span className="inline-flex items-center gap-1 truncate">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  {lead.landing_page}
                </span>
              </div>
            )}
            {lead.search_query && (
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <span className="text-muted-foreground">Search Query</span>
                <span className="inline-flex items-center gap-1">
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  {lead.search_query}
                </span>
              </div>
            )}
            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <span className="text-muted-foreground">Response Time</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {lead.response_time_minutes != null
                  ? `${lead.response_time_minutes} min`
                  : '--'}
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <span className="text-muted-foreground">Created</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {lead.created_at
                  ? format(new Date(lead.created_at), 'MMM d, yyyy h:mm a')
                  : '--'}
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
              <span className="text-muted-foreground">Updated</span>
              <span>
                {lead.updated_at
                  ? formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })
                  : '--'}
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-2">
              <span className="text-muted-foreground">Assigned To</span>
              <Select
                value={lead.assigned_to ?? ''}
                onValueChange={(val) => {
                  const assignee = (val ?? '') || null
                  updateLead.mutate({ id: lead!.id, assigned_to: assignee })
                }}
              >
                <SelectTrigger className="h-8 w-[200px]">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {staff?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name || member.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {lead.message && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground block mb-1">Message</span>
                  <p className="whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-sm">
                    {lead.message}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notes List */}
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No notes yet. Add one below.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {[...notes].reverse().map((note, i) => (
                  <div key={i} className="rounded-md border p-3">
                    <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {note.created_at
                        ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true })
                        : ''}
                      {note.user_id && (
                        <span className="ml-2 text-[10px] text-muted-foreground/60">
                          {note.user_id.slice(0, 8)}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Note Form */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                size="sm"
                disabled={!noteText.trim() || isAddingNote}
                onClick={handleAddNote}
              >
                {isAddingNote && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Add Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !activityData || activityData.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity recorded for this lead yet.
            </p>
          ) : (
            <div className="relative space-y-0">
              {activityData.map((entry, i) => (
                <div key={entry.id} className="flex gap-3 pb-4 last:pb-0">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-400" />
                    {i < activityData.length - 1 && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-start gap-2">
                      <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-sm">{entry.summary}</p>
                    </div>
                    <p className="mt-0.5 ml-5.5 text-xs text-muted-foreground">
                      {entry.created_at
                        ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
