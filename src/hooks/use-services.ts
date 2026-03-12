import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TablesInsert, TablesUpdate } from '@/lib/database.types'

export function useServices(filters: { status?: string; service_type?: string } = {}) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      let query = supabase.from('dealer_services').select('*').order('created_at', { ascending: false })
      if (filters.status) query = query.eq('status', filters.status as any)
      if (filters.service_type) query = query.eq('service_type', filters.service_type)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (service: TablesInsert<'dealer_services'>) => {
      const { data, error } = await supabase.from('dealer_services').insert(service).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'dealer_services'> & { id: string }) => {
      const { data, error } = await supabase.from('dealer_services').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}
