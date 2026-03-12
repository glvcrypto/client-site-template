import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePageContent(pageSlug: string) {
  return useQuery({
    queryKey: ['content', pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('page_slug', pageSlug)
      if (error) throw error
      const map: Record<string, { value: string; type: string; id: string }> = {}
      for (const row of data ?? []) {
        map[row.content_key] = { value: row.content_value ?? '', type: row.content_type, id: row.id }
      }
      return map
    },
  })
}

export function useUpdateContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: { page_slug: string; content_key: string; content_value: string }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from('site_content')
          .upsert(
            { page_slug: u.page_slug, content_key: u.content_key, content_value: u.content_value, updated_at: new Date().toISOString() },
            { onConflict: 'page_slug,content_key' }
          )
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content'] }),
  })
}
