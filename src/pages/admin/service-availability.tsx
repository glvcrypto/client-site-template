import { useState, useEffect } from 'react'
import { useLocations } from '@/hooks/use-locations'
import {
  useServiceAvailability,
  useUpdateAvailability,
  type ServiceAvailabilityInput,
} from '@/hooks/use-service-catalogue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Label import removed (unused)
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DURATION_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
  { value: '90', label: '90 min' },
  { value: '120', label: '120 min' },
]

interface DayRow {
  day_of_week: number
  is_available: boolean
  open_time: string
  close_time: string
  slot_duration_minutes: number
  max_bookings_per_slot: number
}

function defaultWeek(): DayRow[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    is_available: i >= 1 && i <= 5, // Mon-Fri default
    open_time: '08:00',
    close_time: '17:00',
    slot_duration_minutes: 60,
    max_bookings_per_slot: 2,
  }))
}

export function ServiceAvailabilityPage() {
  const { data: locations, isLoading: locationsLoading } = useLocations()
  const primaryLocation = locations?.find((l) => l.is_primary) ?? locations?.[0]
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>()

  const locationId = selectedLocationId ?? primaryLocation?.id

  const { data: existing, isLoading: availLoading } = useServiceAvailability(locationId)
  const updateAvailability = useUpdateAvailability()

  const [week, setWeek] = useState<DayRow[]>(defaultWeek)
  const [dirty, setDirty] = useState(false)

  // Populate from existing data
  useEffect(() => {
    if (!existing) return
    setWeek((_prev) => {
      const fresh = defaultWeek()
      for (const row of existing) {
        const idx = fresh.findIndex((d) => d.day_of_week === row.day_of_week)
        if (idx !== -1) {
          fresh[idx] = {
            day_of_week: row.day_of_week,
            is_available: row.is_available,
            open_time: row.open_time.slice(0, 5), // HH:MM
            close_time: row.close_time.slice(0, 5),
            slot_duration_minutes: row.slot_duration_minutes,
            max_bookings_per_slot: row.max_bookings_per_slot,
          }
        }
      }
      return fresh
    })
    setDirty(false)
  }, [existing])

  function updateDay(dayIndex: number, updates: Partial<DayRow>) {
    setWeek((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, ...updates } : d))
    )
    setDirty(true)
  }

  async function handleSave() {
    if (!locationId) return
    try {
      const availability: ServiceAvailabilityInput[] = week.map((d) => ({
        day_of_week: d.day_of_week,
        open_time: d.open_time + ':00',
        close_time: d.close_time + ':00',
        slot_duration_minutes: d.slot_duration_minutes,
        max_bookings_per_slot: d.max_bookings_per_slot,
        is_available: d.is_available,
      }))
      await updateAvailability.mutateAsync({ locationId, availability })
      toast.success('Availability saved')
      setDirty(false)
    } catch {
      toast.error('Failed to save availability')
    }
  }

  if (locationsLoading || availLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!locations?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
        <p className="text-sm font-medium">No locations configured</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add a location in Settings before setting up service availability.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Set weekly service booking availability per location.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {locations.length > 1 && (
            <Select
              value={locationId}
              onValueChange={(val) => setSelectedLocationId(val ?? undefined)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleSave} disabled={!dirty || updateAvailability.isPending}>
            {updateAvailability.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Day</th>
              <th className="px-4 py-3 text-left font-medium">Available</th>
              <th className="px-4 py-3 text-left font-medium">Open</th>
              <th className="px-4 py-3 text-left font-medium">Close</th>
              <th className="px-4 py-3 text-left font-medium">Slot Duration</th>
              <th className="px-4 py-3 text-left font-medium">Max/Slot</th>
            </tr>
          </thead>
          <tbody>
            {week.map((day, i) => (
              <tr key={day.day_of_week} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{DAY_NAMES[day.day_of_week]}</td>
                <td className="px-4 py-3">
                  <Switch
                    checked={day.is_available}
                    onCheckedChange={(checked) => updateDay(i, { is_available: checked })}
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="time"
                    className="w-[130px]"
                    value={day.open_time}
                    onChange={(e) => updateDay(i, { open_time: e.target.value })}
                    disabled={!day.is_available}
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="time"
                    className="w-[130px]"
                    value={day.close_time}
                    onChange={(e) => updateDay(i, { close_time: e.target.value })}
                    disabled={!day.is_available}
                  />
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={String(day.slot_duration_minutes)}
                    onValueChange={(val) => updateDay(i, { slot_duration_minutes: parseInt(val ?? '60') })}
                    disabled={!day.is_available}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    className="w-[80px]"
                    value={day.max_bookings_per_slot}
                    onChange={(e) =>
                      updateDay(i, { max_bookings_per_slot: parseInt(e.target.value) || 1 })
                    }
                    disabled={!day.is_available}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
