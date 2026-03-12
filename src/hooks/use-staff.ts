import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface StaffMember {
  id: string
  full_name: string
  role: string
  avatar_url: string | null
}

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, avatar_url')
        .order('full_name')
      if (error) throw error
      return data as StaffMember[]
    },
  })
}

export function useStaffMap() {
  const { data: staff, ...rest } = useStaff()
  const map = new Map<string, StaffMember>()
  if (staff) {
    for (const s of staff) {
      map.set(s.id, s)
    }
  }
  return { staffMap: map, staff, ...rest }
}
