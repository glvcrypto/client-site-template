import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export interface StorePromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order: number | null
  max_uses: number | null
  uses_count: number
  valid_from: string | null
  valid_to: string | null
  is_active: boolean
  created_at: string
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function usePromoCodes() {
  return useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_promo_codes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as StorePromoCode[]
    },
  })
}

export function useCreatePromoCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (promo: Partial<StorePromoCode>) => {
      const { data, error } = await supabase
        .from('store_promo_codes')
        .insert({ ...promo, code: promo.code?.toUpperCase().trim() } as any)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-codes'] }),
  })
}

export function useUpdatePromoCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StorePromoCode> & { id: string }) => {
      if (updates.code) updates.code = updates.code.toUpperCase().trim()
      const { data, error } = await supabase
        .from('store_promo_codes')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-codes'] }),
  })
}

export function useValidatePromoCode(code: string, orderSubtotal: number) {
  return useQuery({
    queryKey: ['validate-promo', code, orderSubtotal],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single()

      if (error || !data) return { valid: false, message: 'Invalid promo code.' }

      const now = new Date()
      if (data.valid_from && new Date(data.valid_from) > now) {
        return { valid: false, message: 'This promo code is not yet active.' }
      }
      if (data.valid_to && new Date(data.valid_to) < now) {
        return { valid: false, message: 'This promo code has expired.' }
      }
      if (data.max_uses && data.uses_count >= data.max_uses) {
        return { valid: false, message: 'This promo code has reached its usage limit.' }
      }
      if (data.min_order && orderSubtotal < data.min_order) {
        return { valid: false, message: `Minimum order of $${data.min_order.toFixed(2)} required.` }
      }

      return {
        valid: true,
        message: 'Promo code is valid!',
        promo: data as StorePromoCode,
      }
    },
    enabled: !!code.trim(),
  })
}
