import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TablesInsert, TablesUpdate } from '@/lib/database.types'

export function useTestimonials() {
  return useQuery({
    queryKey: ['site_testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_testimonials')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useActiveTestimonials() {
  return useQuery({
    queryKey: ['site_testimonials', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_testimonials')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useCreateTestimonial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (testimonial: TablesInsert<'site_testimonials'>) => {
      const { data, error } = await supabase.from('site_testimonials').insert(testimonial).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site_testimonials'] }),
  })
}

export function useUpdateTestimonial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'site_testimonials'> & { id: string }) => {
      const { data, error } = await supabase.from('site_testimonials').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site_testimonials'] }),
  })
}

export function useDeleteTestimonial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_testimonials').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site_testimonials'] }),
  })
}
