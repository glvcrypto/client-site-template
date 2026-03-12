import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface ServiceBookingRow {
  id: string
  customer_name: string
  email: string
  phone: string | null
  service_id: string | null
  preferred_date: string
  preferred_time_slot: string
  status: BookingStatus
  notes: string | null
  confirmed_date: string | null
  confirmed_time: string | null
  location_id: string | null
  created_at: string
  updated_at: string
}

export interface BookingFilters {
  status?: BookingStatus
  dateFrom?: string
  dateTo?: string
}

export interface CreateBookingInput {
  customer_name: string
  email: string
  phone?: string | null
  service_id?: string | null
  preferred_date: string
  preferred_time_slot: string
  notes?: string | null
  location_id?: string | null
}

export interface TimeSlot {
  time: string
  available: boolean
}

// ── Booking Hooks ────────────────────────────────────────────────────────────────

export function useServiceBookings(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: ['service-bookings', filters],
    queryFn: async () => {
      let query = supabase
        .from('service_bookings')
        .select('*, service_catalogue(name)')
        .order('preferred_date', { ascending: false })

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.dateFrom) query = query.gte('preferred_date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('preferred_date', filters.dateTo)

      const { data, error } = await query
      if (error) throw error
      return data as (ServiceBookingRow & { service_catalogue: { name: string } | null })[]
    },
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (booking: CreateBookingInput) => {
      const { data, error } = await supabase
        .from('service_bookings')
        .insert(booking)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-bookings'] }),
  })
}

export function useUpdateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ServiceBookingRow> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-bookings'] }),
  })
}

// ── Available Slots Hook ─────────────────────────────────────────────────────────

export function useAvailableSlots(
  serviceId: string | undefined,
  date: string | undefined,
  locationId: string | undefined
) {
  return useQuery({
    queryKey: ['available-slots', serviceId, date, locationId],
    queryFn: async () => {
      if (!date || !locationId) return []

      // Get the day of week for the selected date (0=Sunday, 6=Saturday)
      const dateObj = new Date(date + 'T00:00:00')
      const dayOfWeek = dateObj.getDay()

      // Fetch availability for this day of week
      const { data: availability, error: availError } = await supabase
        .from('service_availability')
        .select('*')
        .eq('location_id', locationId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .single()

      if (availError || !availability) return []

      // Fetch existing bookings for this date and location
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('service_bookings')
        .select('preferred_time_slot')
        .eq('preferred_date', date)
        .eq('location_id', locationId)
        .in('status', ['pending', 'confirmed'])

      if (bookingsError) throw bookingsError

      // Count bookings per time slot
      const slotCounts: Record<string, number> = {}
      for (const b of existingBookings ?? []) {
        const slot = b.preferred_time_slot
        slotCounts[slot] = (slotCounts[slot] || 0) + 1
      }

      // Generate time slots from open_time to close_time at slot_duration intervals
      const slots: TimeSlot[] = []
      const openMinutes = timeToMinutes(availability.open_time)
      const closeMinutes = timeToMinutes(availability.close_time)
      const duration = availability.slot_duration_minutes
      const maxPerSlot = availability.max_bookings_per_slot

      for (let mins = openMinutes; mins + duration <= closeMinutes; mins += duration) {
        const timeStr = minutesToTime(mins)
        const count = slotCounts[timeStr] || 0
        slots.push({
          time: timeStr,
          available: count < maxPerSlot,
        })
      }

      return slots
    },
    enabled: !!date && !!locationId,
  })
}

// ── Time Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`
}
