import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSiteConfig() {
  return useQuery({
    queryKey: ['site-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_config').select('*')
      if (error) throw error
      // Convert to key-value map
      const config: Record<string, string> = {}
      for (const row of data) {
        if (row.value) config[row.key] = row.value
      }
      return config
    },
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await supabase
        .from('site_config')
        .upsert({ key, value }, { onConflict: 'key' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site-config'] }),
  })
}
