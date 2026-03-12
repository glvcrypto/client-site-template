import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Download,
  FileText,
  Loader2,
  ShieldAlert,
  Inbox,
} from 'lucide-react'
import { format } from 'date-fns'

// ── Report Type Badge Colours ────────────────────────────────────────────────

const reportTypeColours: Record<string, string> = {
  monthly: 'bg-blue-100 text-blue-700',
  quarterly: 'bg-purple-100 text-purple-700',
  special: 'bg-amber-100 text-amber-700',
}

// ── Reports Page ─────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { role } = useAuth()

  // Owner-only page
  if (role === 'staff') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">
          You don't have permission to view reports.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Contact the account owner for access.
        </p>
      </div>
    )
  }

  return <ReportsContent />
}

function ReportsContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['client_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_reports')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Reports</h1>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No reports yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Reports will appear here once GLV generates them.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((report) => {
            const highlights: string[] = Array.isArray(report.highlights)
              ? (report.highlights as string[])
              : []

            return (
              <Card key={report.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <CardTitle className="text-base font-semibold leading-snug">
                        {report.title}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] shrink-0',
                        reportTypeColours[report.report_type] ?? ''
                      )}
                    >
                      {report.report_type}
                    </Badge>
                  </div>
                  {report.report_month && (
                    <p className="text-xs text-muted-foreground">
                      {report.report_month}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.summary}
                    </p>
                  )}

                  {highlights.length > 0 && (
                    <ul className="space-y-1">
                      {highlights.map((h, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-sm"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!report.file_url}
                    onClick={() => {
                      if (report.file_url) window.open(report.file_url, '_blank')
                    }}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {report.file_url ? 'Download Report' : 'Not Available Yet'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
