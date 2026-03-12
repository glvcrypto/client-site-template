import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Pin,
  Milestone,
  Info,
  FolderCheck,
  StickyNote,
  Loader2,
  Inbox,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import type { LucideIcon } from 'lucide-react'

// ── Badge Colours ────────────────────────────────────────────────────────────

const updateTypeColours: Record<string, string> = {
  milestone: 'bg-green-100 text-green-700',
  status: 'bg-blue-100 text-blue-700',
  deliverable: 'bg-purple-100 text-purple-700',
  note: 'bg-zinc-100 text-zinc-600',
}

const updateTypeIcons: Record<string, LucideIcon> = {
  milestone: Milestone,
  status: Info,
  deliverable: FolderCheck,
  note: StickyNote,
}

// ── Updates Page ─────────────────────────────────────────────────────────────

export function UpdatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['client_updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_updates')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Updates</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const pinned = data?.filter((u) => u.is_pinned) ?? []
  const allUpdates = data ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Updates</h1>

      {allUpdates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No updates yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your GLV team will post project updates here.
          </p>
        </div>
      ) : (
        <>
          {/* Pinned Updates */}
          {pinned.length > 0 && (
            <div className="space-y-3">
              {pinned.map((update) => (
                <Card
                  key={update.id}
                  className="border-primary/20 bg-primary/[0.02]"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-primary shrink-0" />
                        <CardTitle className="text-base font-semibold leading-snug">
                          {update.title}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] shrink-0',
                          updateTypeColours[update.update_type ?? 'note'] ?? ''
                        )}
                      >
                        {update.update_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {update.created_at
                        ? format(new Date(update.created_at), 'MMM d, yyyy')
                        : ''}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {update.body && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {update.body}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Timeline */}
          <div className="relative space-y-0">
            {allUpdates.map((update, i) => {
              const Icon =
                updateTypeIcons[update.update_type ?? 'note'] ?? Info
              const colours =
                updateTypeColours[update.update_type ?? 'note'] ?? 'bg-zinc-100 text-zinc-500'

              return (
                <div key={update.id} className="flex gap-3 pb-5 last:pb-0">
                  {/* Timeline line + icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'mt-0.5 rounded-md p-1.5 shrink-0',
                        colours
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {i < allUpdates.length - 1 && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{update.title}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] shrink-0',
                          colours
                        )}
                      >
                        {update.update_type}
                      </Badge>
                    </div>
                    {update.body && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {update.body}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {update.created_at
                        ? formatDistanceToNow(new Date(update.created_at), {
                            addSuffix: true,
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
