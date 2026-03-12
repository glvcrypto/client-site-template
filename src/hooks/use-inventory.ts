import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TablesInsert, TablesUpdate } from '@/lib/database.types'

export interface InventoryFilters {
  status?: string
  unit_type?: string
  make?: string
  condition?: string
  search?: string
}

export function useInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: async () => {
      let query = supabase
        .from('dealer_inventory')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.unit_type) query = query.eq('unit_type', filters.unit_type)
      if (filters.make) query = query.eq('make', filters.make)
      if (filters.condition) query = query.eq('condition', filters.condition)
      if (filters.search) query = query.or(`unit_name.ilike.%${filters.search}%,stock_number.ilike.%${filters.search}%`)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function usePublicInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ['public-inventory', filters],
    queryFn: async () => {
      let query = supabase
        .from('dealer_inventory')
        .select('id, unit_name, make, model, year, unit_type, price, status, condition, images, description, specs, stock_number, listed_date')
        .in('status', ['available', 'featured', 'clearance'])
        .order('listed_date', { ascending: false })

      if (filters.unit_type) query = query.eq('unit_type', filters.unit_type)
      if (filters.make) query = query.eq('make', filters.make)
      if (filters.condition) query = query.eq('condition', filters.condition)
      if (filters.search) query = query.or(`unit_name.ilike.%${filters.search}%`)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useInventoryUnit(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('dealer_inventory').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateInventory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (unit: TablesInsert<'dealer_inventory'>) => {
      const { data, error } = await supabase.from('dealer_inventory').insert(unit).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export function useUpdateInventory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'dealer_inventory'> & { id: string }) => {
      const { data, error } = await supabase.from('dealer_inventory').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}
