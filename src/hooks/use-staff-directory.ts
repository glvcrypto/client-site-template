import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TablesInsert, TablesUpdate } from '@/lib/database.types'

export function useStaffDirectory() {
  return useQuery({
    queryKey: ['staff-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_staff')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useActiveStaff() {
  return useQuery({
    queryKey: ['staff-directory', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_staff')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useCreateStaffMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (member: TablesInsert<'site_staff'>) => {
      const { data, error } = await supabase.from('site_staff').insert(member).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-directory'] }),
  })
}

export function useUpdateStaffMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'site_staff'> & { id: string }) => {
      const { data, error } = await supabase.from('site_staff').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-directory'] }),
  })
}

export function useDeleteStaffMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_staff').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-directory'] }),
  })
}
