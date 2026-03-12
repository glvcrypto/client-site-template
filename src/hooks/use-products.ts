import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProductFilters {
  category_id?: string
  search?: string
  brand?: string
  is_active?: boolean
}

export interface StoreProduct {
  id: string
  name: string
  sku: string | null
  price: number | null
  sale_price: number | null
  description: string | null
  images: string[]
  category_id: string | null
  brand: string | null
  quantity_available: number
  weight: number | null
  dimensions: Record<string, unknown> | null
  is_active: boolean
  created_at: string
  updated_at: string
  category?: StoreCategory | null
}

export interface StoreCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

// ── Products ─────────────────────────────────────────────────────────────────

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('store_products')
        .select('*, category:store_categories(*)')
        .order('created_at', { ascending: false })

      if (filters.category_id) query = query.eq('category_id', filters.category_id)
      if (filters.brand) query = query.eq('brand', filters.brand)
      if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active)
      if (filters.search) query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)

      const { data, error } = await query
      if (error) throw error
      return data as StoreProduct[]
    },
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_products')
        .select('*, category:store_categories(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as StoreProduct
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (product: Partial<StoreProduct>) => {
      const { data, error } = await supabase.from('store_products').insert(product as any).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StoreProduct> & { id: string }) => {
      const { data, error } = await supabase.from('store_products').update(updates as any).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('store_products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

// ── Categories ───────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ['store-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .order('display_order')
      if (error) throw error
      return data as StoreCategory[]
    },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (category: Partial<StoreCategory>) => {
      const { data, error } = await supabase.from('store_categories').insert(category as any).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-categories'] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StoreCategory> & { id: string }) => {
      const { data, error } = await supabase.from('store_categories').update(updates as any).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('store_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-categories'] }),
  })
}
