import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReviewSource = 'google' | 'facebook' | 'manual'
export type ReviewRequestStatus = 'pending' | 'sent' | 'completed' | 'expired'

export interface ReviewFilters {
  source?: ReviewSource
  rating?: number
  has_response?: boolean
}

export interface ReviewRequestFilters {
  status?: ReviewRequestStatus
}

export interface ReviewStats {
  average: number
  total: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  thisMonth: number
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export function useReviews(filters: ReviewFilters = {}) {
  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*')
        .order('review_date', { ascending: false })

      if (filters.source) query = query.eq('source', filters.source)
      if (filters.rating) query = query.eq('rating', filters.rating)
      if (filters.has_response === true) query = query.not('response_text', 'is', null)
      if (filters.has_response === false) query = query.is('response_text', null)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useReviewStats() {
  const { data: reviews, ...rest } = useReviews()

  const stats = useMemo<ReviewStats | null>(() => {
    if (!reviews) return null

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
    let sum = 0
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    let thisMonth = 0

    for (const r of reviews) {
      const star = r.rating as 1 | 2 | 3 | 4 | 5
      distribution[star]++
      sum += r.rating
      if (new Date(r.review_date) >= monthStart) thisMonth++
    }

    return {
      average: reviews.length > 0 ? sum / reviews.length : 0,
      total: reviews.length,
      distribution,
      thisMonth,
    }
  }, [reviews])

  return { data: stats, ...rest }
}

export function useRespondToReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, response_text }: { id: string; response_text: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ response_text, responded_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  })
}

// ── Review Requests ───────────────────────────────────────────────────────────

export function useReviewRequests(filters: ReviewRequestFilters = {}) {
  return useQuery({
    queryKey: ['review-requests', filters],
    queryFn: async () => {
      let query = supabase
        .from('review_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.status) query = query.eq('status', filters.status)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useSendReviewRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (request: {
      customer_name: string
      email: string
      phone?: string
      trigger_type?: string
      trigger_id?: string
    }) => {
      const { data, error } = await supabase
        .from('review_requests')
        .insert({
          customer_name: request.customer_name,
          email: request.email,
          phone: request.phone || null,
          trigger_type: (request.trigger_type || 'manual') as any,
          trigger_id: request.trigger_id || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review-requests'] }),
  })
}

// ── Review Config ─────────────────────────────────────────────────────────────

export function useReviewConfig() {
  return useQuery({
    queryKey: ['review-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_config')
        .select('*')
        .limit(1)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateReviewConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: {
      google_place_id?: string | null
      auto_request_enabled?: boolean
      request_delay_hours?: number
      request_email_template?: string
      min_rating_to_display?: number
      review_url?: string | null
    }) => {
      // Update the single config row
      const { data: existing } = await supabase
        .from('review_config')
        .select('id')
        .limit(1)
        .single()

      if (!existing) throw new Error('Review config not found')

      const { data, error } = await supabase
        .from('review_config')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review-config'] }),
  })
}
