import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type ModuleKey = 'ecommerce' | 'service_booking' | 'reviews' | 'financing' | 'blog' | 'ads'

interface SiteModule {
  id: string
  module_key: ModuleKey
  is_enabled: boolean
  enabled_by: string | null
  enabled_at: string | null
}

export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_modules')
        .select('*')
        .order('module_key')
      if (error) throw error
      return data as SiteModule[]
    },
  })
}

export function useModuleEnabled(key: ModuleKey) {
  const { data: modules, isLoading } = useModules()
  if (isLoading) return true // assume enabled while loading to prevent flash-redirects
  return modules?.find((m) => m.module_key === key)?.is_enabled ?? false
}

export function useToggleModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, enabled }: { key: ModuleKey; enabled: boolean }) => {
      const { error } = await supabase
        .from('site_modules')
        .update({
          is_enabled: enabled,
          enabled_at: enabled ? new Date().toISOString() : null,
        })
        .eq('module_key', key)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modules'] }),
  })
}
