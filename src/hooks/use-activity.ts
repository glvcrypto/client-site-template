import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useActivity(filters: { entity_type?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ['activity', filters],
    queryFn: async () => {
      let query = supabase
        .from('portal_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters.limit ?? 50)

      if (filters.entity_type) query = query.eq('entity_type', filters.entity_type)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
