import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { DateRange } from '@/hooks/use-analytics'

export interface AdFilters {
  platform?: string
  dateRange: DateRange
  status?: string
}

// ── Ad Performance (filtered) ───────────────────────────────────────────────

export function useAdPerformance(filters: AdFilters) {
  return useQuery({
    queryKey: ['ad_performance', filters],
    queryFn: async () => {
      let query = supabase
        .from('analytics_ad_performance')
        .select('*')
        .gte('snapshot_date', filters.dateRange.from)
        .lte('snapshot_date', filters.dateRange.to)
        .order('snapshot_date', { ascending: false })

      if (filters.platform) query = query.eq('platform', filters.platform)
      if (filters.status) query = query.eq('status', filters.status)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

// ── Ad Summary (totals) ─────────────────────────────────────────────────────

export function useAdSummary(dateRange: DateRange) {
  const { data: raw, ...rest } = useAdPerformance({ dateRange })

  const data = useMemo(() => {
    if (!raw || raw.length === 0) return null

    const totalSpend = raw.reduce((s, r) => s + (r.spend ?? 0), 0)
    const totalConversions = raw.reduce((s, r) => s + (r.conversions ?? 0), 0)
    const totalClicks = raw.reduce((s, r) => s + (r.clicks ?? 0), 0)
    const totalConversionValue = raw.reduce((s, r) => s + (r.conversion_value ?? 0), 0)
    const avgRoas = totalSpend > 0 ? totalConversionValue / totalSpend : 0
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0

    return {
      totalSpend,
      totalConversions,
      avgRoas: parseFloat(avgRoas.toFixed(2)),
      avgCpc: parseFloat(avgCpc.toFixed(2)),
      totalClicks,
      totalImpressions: raw.reduce((s, r) => s + (r.impressions ?? 0), 0),
    }
  }, [raw])

  return { data, ...rest }
}

// ── Platform Breakdown ──────────────────────────────────────────────────────

export function useAdPlatformBreakdown(dateRange: DateRange) {
  const { data: raw, ...rest } = useAdPerformance({ dateRange })

  const data = useMemo(() => {
    if (!raw || raw.length === 0) return []

    const byPlatform: Record<string, {
      spend: number; clicks: number; impressions: number
      conversions: number; conversionValue: number
    }> = {}

    for (const row of raw) {
      const p = row.platform ?? 'unknown'
      if (!byPlatform[p]) byPlatform[p] = { spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionValue: 0 }
      byPlatform[p].spend += row.spend ?? 0
      byPlatform[p].clicks += row.clicks ?? 0
      byPlatform[p].impressions += row.impressions ?? 0
      byPlatform[p].conversions += row.conversions ?? 0
      byPlatform[p].conversionValue += row.conversion_value ?? 0
    }

    return Object.entries(byPlatform).map(([platform, d]) => ({
      platform,
      spend: d.spend,
      clicks: d.clicks,
      impressions: d.impressions,
      conversions: d.conversions,
      roas: d.spend > 0 ? parseFloat((d.conversionValue / d.spend).toFixed(2)) : 0,
      cpc: d.clicks > 0 ? parseFloat((d.spend / d.clicks).toFixed(2)) : 0,
    }))
  }, [raw])

  return { data, ...rest }
}

// ── Top Campaigns ───────────────────────────────────────────────────────────

export function useTopCampaigns(
  dateRange: DateRange,
  sortBy: 'roas' | 'conversions' = 'roas',
  limit = 10
) {
  const { data: raw, ...rest } = useAdPerformance({ dateRange })

  const data = useMemo(() => {
    if (!raw || raw.length === 0) return []

    // Aggregate by campaign_id
    const byCampaign: Record<string, {
      campaignName: string; platform: string; spend: number; clicks: number
      impressions: number; conversions: number; conversionValue: number; status: string
    }> = {}

    for (const row of raw) {
      const key = `${row.platform}::${row.campaign_id}`
      if (!byCampaign[key]) {
        byCampaign[key] = {
          campaignName: row.campaign_name ?? 'Unknown',
          platform: row.platform ?? 'unknown',
          spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionValue: 0,
          status: row.status ?? 'active',
        }
      }
      byCampaign[key].spend += row.spend ?? 0
      byCampaign[key].clicks += row.clicks ?? 0
      byCampaign[key].impressions += row.impressions ?? 0
      byCampaign[key].conversions += row.conversions ?? 0
      byCampaign[key].conversionValue += row.conversion_value ?? 0
    }

    return Object.values(byCampaign)
      .map((c) => ({
        ...c,
        roas: c.spend > 0 ? parseFloat((c.conversionValue / c.spend).toFixed(2)) : 0,
        ctr: c.impressions > 0 ? parseFloat(((c.clicks / c.impressions) * 100).toFixed(2)) : 0,
        cpc: c.clicks > 0 ? parseFloat((c.spend / c.clicks).toFixed(2)) : 0,
      }))
      .sort((a, b) => sortBy === 'roas' ? b.roas - a.roas : b.conversions - a.conversions)
      .slice(0, limit)
  }, [raw, sortBy, limit])

  return { data, ...rest }
}

// ── Ad Config ───────────────────────────────────────────────────────────────

export function useAdConfig() {
  return useQuery({
    queryKey: ['ad_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_config')
        .select('*')
        .order('platform')
      if (error) throw error
      return data
    },
  })
}

export function useUpdateAdConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; account_id?: string; is_enabled?: boolean; config_json?: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('ad_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad_config'] }),
  })
}
