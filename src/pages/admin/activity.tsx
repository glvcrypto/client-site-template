import { useState, useCallback } from 'react'
import { useActivity } from '@/hooks/use-activity'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Users,
  Package,
  Wrench,
  MessageSquare,
  Activity,
  Loader2,
  Inbox,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { LucideIcon } from 'lucide-react'

// ── Icon Map ─────────────────────────────────────────────────────────────────

function activityIcon(entityType: string): LucideIcon {
  switch (entityType) {
    case 'lead':
      return Users
    case 'inventory':
      return Package
    case 'service':
      return Wrench
    case 'message':
      return MessageSquare
    default:
      return Activity
  }
}

const iconColour: Record<string, string> = {
  lead: 'bg-blue-50 text-blue-600',
  inventory: 'bg-purple-50 text-purple-600',
  service: 'bg-amber-50 text-amber-600',
  message: 'bg-red-50 text-red-600',
}

// ── Timeline Component ───────────────────────────────────────────────────────

interface ActivityEntry {
  id: string
  entity_type: string
  action: string
  summary: string
  metadata: Record<string, unknown> | null
  created_at: string
}

function Timeline({
  data,
  isLoading,
}: {
  data: ActivityEntry[] | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">No activity to display.</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-0">
      {data.map((entry, i) => {
        const Icon = activityIcon(entry.entity_type)
        const colours = iconColour[entry.entity_type] ?? 'bg-zinc-100 text-zinc-500'
        return (
          <div key={entry.id} className="flex gap-3 pb-4 last:pb-0">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn('mt-0.5 rounded-md p-1.5 shrink-0', colours)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {i < data.length - 1 && <div className="w-px flex-1 bg-border" />}
            </div>
            {/* Content */}
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-sm leading-snug">{entry.summary}</p>
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground/70 truncate">
                  {Object.entries(entry.metadata)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ')}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {entry.created_at
                  ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })
                  : ''}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Filtered Tab Content ─────────────────────────────────────────────────────

function FilteredActivity({ entityType }: { entityType?: string }) {
  const [limit, setLimit] = useState(50)
  const { data, isLoading } = useActivity({
    entity_type: entityType,
    limit,
  })

  const loadMore = useCallback(() => setLimit((prev) => prev + 50), [])

  return (
    <div className="space-y-4">
      <Timeline data={data as ActivityEntry[] | undefined} isLoading={isLoading} />
      {data && data.length >= limit && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Activity Page ────────────────────────────────────────────────────────────

export function ActivityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Activity</h1>

      <Tabs defaultValue={0}>
        <TabsList>
          <TabsTrigger value={0}>All</TabsTrigger>
          <TabsTrigger value={1}>Leads</TabsTrigger>
          <TabsTrigger value={2}>Inventory</TabsTrigger>
          <TabsTrigger value={3}>Services</TabsTrigger>
          <TabsTrigger value={4}>Messages</TabsTrigger>
        </TabsList>

        <TabsContent value={0}>
          <FilteredActivity />
        </TabsContent>
        <TabsContent value={1}>
          <FilteredActivity entityType="lead" />
        </TabsContent>
        <TabsContent value={2}>
          <FilteredActivity entityType="inventory" />
        </TabsContent>
        <TabsContent value={3}>
          <FilteredActivity entityType="service" />
        </TabsContent>
        <TabsContent value={4}>
          <FilteredActivity entityType="message" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
