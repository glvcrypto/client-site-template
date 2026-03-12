import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────────

export interface ServiceCatalogueRow {
  id: string
  name: string
  description: string | null
  default_price: number | null
  estimated_duration_minutes: number | null
  category: string | null
  allow_booking: boolean
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface ServiceCatalogueInsert {
  name: string
  description?: string | null
  default_price?: number | null
  estimated_duration_minutes?: number | null
  category?: string | null
  allow_booking?: boolean
  is_active?: boolean
  display_order?: number
}

export interface ServiceCatalogueUpdate extends Partial<ServiceCatalogueInsert> {
  id: string
}

export interface ServiceAvailabilityRow {
  id: string
  location_id: string
  day_of_week: number
  open_time: string
  close_time: string
  max_bookings_per_slot: number
  slot_duration_minutes: number
  is_available: boolean
}

export interface ServiceAvailabilityInput {
  day_of_week: number
  open_time: string
  close_time: string
  max_bookings_per_slot: number
  slot_duration_minutes: number
  is_available: boolean
}

// ── Catalogue Hooks ──────────────────────────────────────────────────────────────

export function useServiceCatalogue() {
  return useQuery({
    queryKey: ['service-catalogue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_catalogue')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
      if (error) throw error
      return data as ServiceCatalogueRow[]
    },
  })
}

export function useAllServiceCatalogue() {
  return useQuery({
    queryKey: ['service-catalogue', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_catalogue')
        .select('*')
        .order('display_order')
      if (error) throw error
      return data as ServiceCatalogueRow[]
    },
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (service: ServiceCatalogueInsert) => {
      const { data, error } = await supabase
        .from('service_catalogue')
        .insert(service)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalogue'] }),
  })
}

export function useUpdateCatalogueService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: ServiceCatalogueUpdate) => {
      const { data, error } = await supabase
        .from('service_catalogue')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalogue'] }),
  })
}

export function useDeleteCatalogueService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_catalogue')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalogue'] }),
  })
}

// ── Availability Hooks ───────────────────────────────────────────────────────────

export function useServiceAvailability(locationId: string | undefined) {
  return useQuery({
    queryKey: ['service-availability', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_availability')
        .select('*')
        .eq('location_id', locationId!)
        .order('day_of_week')
      if (error) throw error
      return data as ServiceAvailabilityRow[]
    },
    enabled: !!locationId,
  })
}

export function useUpdateAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      locationId,
      availability,
    }: {
      locationId: string
      availability: ServiceAvailabilityInput[]
    }) => {
      // Delete + re-insert pattern (same as useUpdateHours)
      await supabase.from('service_availability').delete().eq('location_id', locationId)
      const rows = availability
        .filter((a) => a.is_available)
        .map((a) => ({ ...a, location_id: locationId }))
      if (rows.length > 0) {
        const { error } = await supabase.from('service_availability').insert(rows)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-availability'] }),
  })
}
