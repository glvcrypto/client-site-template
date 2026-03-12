import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TablesUpdate } from '@/lib/database.types'

export function useNavigation() {
  return useQuery({
    queryKey: ['navigation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_navigation')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function usePublicNavigation() {
  return useQuery({
    queryKey: ['navigation', 'public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_navigation')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useUpdateNavItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Pick<TablesUpdate<'site_navigation'>, 'label' | 'is_visible' | 'display_order'> & { id: string }) => {
      const { data, error } = await supabase
        .from('site_navigation')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['navigation'] }),
  })
}
