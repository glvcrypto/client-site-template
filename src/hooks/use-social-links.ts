import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSocialLinks() {
  return useQuery({
    queryKey: ['social-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_social_links')
        .select('*')
        .order('display_order')
      if (error) throw error
      return data
    },
  })
}

export function useUpsertSocialLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (link: any) => {
      const { data, error } = await supabase
        .from('site_social_links')
        .upsert(link, { onConflict: 'id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-links'] }),
  })
}

export function useDeleteSocialLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_social_links').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-links'] }),
  })
}
