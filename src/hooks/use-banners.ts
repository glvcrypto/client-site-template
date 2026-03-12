import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TablesInsert, TablesUpdate } from '@/lib/database.types'

export function useBanners() {
  return useQuery({
    queryKey: ['site_banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_banners')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useActiveBanners() {
  return useQuery({
    queryKey: ['site_banners', 'active'],
    queryFn: async () => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('site_banners')
        .select('*')
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useCreateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (banner: TablesInsert<'site_banners'>) => {
      const { data, error } = await supabase.from('site_banners').insert(banner).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site_banners'] }),
  })
}

export function useUpdateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'site_banners'> & { id: string }) => {
      const { data, error } = await supabase.from('site_banners').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site_banners'] }),
  })
}

export function useDeleteBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_banners').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site_banners'] }),
  })
}
