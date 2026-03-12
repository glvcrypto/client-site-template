import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TablesInsert, TablesUpdate } from '@/lib/database.types'

export interface LeadFilters {
  status?: string
  source?: string
  assigned_to?: string
  search?: string
}

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('portal_leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.status) query = query.eq('status', filters.status as any)
      if (filters.source) query = query.eq('source', filters.source as any)
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
      if (filters.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_leads')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (lead: TablesInsert<'portal_leads'>) => {
      const { data, error } = await supabase.from('portal_leads').insert(lead).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'portal_leads'> & { id: string }) => {
      const { data, error } = await supabase.from('portal_leads').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}
