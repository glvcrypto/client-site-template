import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'

export interface DateRange {
  from: string   // YYYY-MM-DD
  to: string     // YYYY-MM-DD
}

// ── Traffic Sources ─────────────────────────────────────────────────────────

export function useTrafficSources(dateRange: DateRange) {
  return useQuery({
    queryKey: ['analytics_traffic_sources', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_traffic_sources')
        .select('*')
        .gte('snapshot_date', dateRange.from)
        .lte('snapshot_date', dateRange.to)
        .order('sessions', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

// ── Device Breakdown ────────────────────────────────────────────────────────

export function useDeviceBreakdown(dateRange: DateRange) {
  return useQuery({
    queryKey: ['analytics_device_breakdown', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_device_breakdown')
        .select('*')
        .gte('snapshot_date', dateRange.from)
        .lte('snapshot_date', dateRange.to)
        .order('percentage', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

// ── Top Pages ───────────────────────────────────────────────────────────────

export function useTopPages(dateRange: DateRange, limit = 10) {
  return useQuery({
    queryKey: ['analytics_top_pages', dateRange, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_top_pages')
        .select('*')
        .gte('snapshot_date', dateRange.from)
        .lte('snapshot_date', dateRange.to)
        .order('pageviews', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
  })
}

// ── Traffic Trend ───────────────────────────────────────────────────────────
// Aggregate sessions by snapshot_date for line chart

export function useTrafficTrend(dateRange: DateRange) {
  const { data: raw, ...rest } = useQuery({
    queryKey: ['analytics_traffic_trend', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_traffic_sources')
        .select('snapshot_date, sessions')
        .gte('snapshot_date', dateRange.from)
        .lte('snapshot_date', dateRange.to)
        .order('snapshot_date', { ascending: true })
      if (error) throw error
      return data
    },
  })

  const data = useMemo(() => {
    if (!raw || raw.length === 0) return []
    const byDate: Record<string, number> = {}
    for (const row of raw) {
      byDate[row.snapshot_date] = (byDate[row.snapshot_date] ?? 0) + (row.sessions ?? 0)
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sessions]) => ({ date, sessions }))
  }, [raw])

  return { data, ...rest }
}
