import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_locations')
        .select('*, site_hours(*)')
        .order('display_order')
      if (error) throw error
      return data
    },
  })
}

export function usePrimaryLocation() {
  const { data } = useLocations()
  return data?.find((l) => l.is_primary) ?? data?.[0] ?? null
}

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (location: any) => {
      const { data, error } = await supabase.from('site_locations').insert(location).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('site_locations').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useUpdateHours() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ locationId, hours }: { locationId: string; hours: any[] }) => {
      await supabase.from('site_hours').delete().eq('location_id', locationId)
      const { error } = await supabase.from('site_hours').insert(
        hours.map((h) => ({ ...h, location_id: locationId }))
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}
