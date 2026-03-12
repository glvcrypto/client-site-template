import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export interface OrderFilters {
  status?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface StoreOrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string | null
  quantity: number
  unit_price: number
  total: number
}

export interface StoreOrder {
  id: string
  order_number: number
  customer_name: string | null
  email: string | null
  phone: string | null
  shipping_address: Record<string, string> | null
  billing_address: Record<string, string> | null
  subtotal: number
  tax: number
  shipping_cost: number
  total: number
  status: string
  payment_method: string | null
  payment_id: string | null
  tracking_number: string | null
  notes: string | null
  promo_code: string | null
  discount_amount: number
  location_id: string | null
  created_at: string
  updated_at: string
  store_order_items?: StoreOrderItem[]
}

// ── Orders ───────────────────────────────────────────────────────────────────

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.status) query = query.eq('status', filters.status as any)
      if (filters.date_from) query = query.gte('created_at', filters.date_from)
      if (filters.date_to) query = query.lte('created_at', filters.date_to)
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as StoreOrder[]
    },
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*, store_order_items(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as StoreOrder
    },
    enabled: !!id,
  })
}

export interface CreateOrderInput {
  customer_name: string
  email: string
  phone?: string
  shipping_address?: Record<string, string>
  billing_address?: Record<string, string>
  subtotal: number
  tax: number
  shipping_cost: number
  total: number
  payment_method: string
  promo_code?: string
  discount_amount?: number
  location_id?: string
  notes?: string
  items: {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    total: number
  }[]
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const { items, ...orderData } = input

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('store_orders')
        .insert(orderData as any)
        .select()
        .single()
      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        ...item,
        order_id: order.id,
      }))
      const { error: itemsError } = await supabase
        .from('store_order_items')
        .insert(orderItems as any)
      if (itemsError) throw itemsError

      return order as StoreOrder
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      tracking_number,
      notes,
    }: {
      id: string
      status: string
      tracking_number?: string
      notes?: string
    }) => {
      const updates: Record<string, unknown> = { status }
      if (tracking_number !== undefined) updates.tracking_number = tracking_number
      if (notes !== undefined) updates.notes = notes

      const { data, error } = await supabase
        .from('store_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as StoreOrder
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
