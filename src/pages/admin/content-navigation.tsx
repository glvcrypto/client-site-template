import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Info, ChevronUp, ChevronDown, Loader2, Save, Menu } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigation, useUpdateNavItem } from '@/hooks/use-navigation'

// ── Types ────────────────────────────────────────────────────────────────────

interface NavItemEdit {
  id: string
  label: string
  route_path: string
  display_order: number
  is_visible: boolean
  module_key: string | null
}

// ── Navigation Page ──────────────────────────────────────────────────────────

export function ContentNavigationPage() {
  const { data: navItems, isLoading } = useNavigation()
  const updateNavItem = useUpdateNavItem()

  const [items, setItems] = useState<NavItemEdit[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  // Initialise local state from fetched data
  useEffect(() => {
    if (navItems && !dirty) {
      setItems(
        navItems.map((item: any) => ({
          id: item.id,
          label: item.label ?? '',
          route_path: item.route_path ?? '',
          display_order: item.display_order ?? 0,
          is_visible: item.is_visible ?? true,
          module_key: item.module_key ?? null,
        }))
      )
    }
  }, [navItems, dirty])

  function handleLabelChange(id: string, label: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, label } : item)))
    setDirty(true)
  }

  function handleVisibilityChange(id: string, is_visible: boolean) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_visible } : item)))
    setDirty(true)
  }

  function handleOrderChange(id: string, display_order: number) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, display_order } : item)))
    setDirty(true)
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const newItems = [...items]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newItems.length) return

    // Swap display_order values
    const tempOrder = newItems[index].display_order
    newItems[index].display_order = newItems[swapIndex].display_order
    newItems[swapIndex].display_order = tempOrder

    // Swap positions in array
    ;[newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]]

    setItems(newItems)
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      for (const item of items) {
        const original = navItems?.find((n: any) => n.id === item.id)
        if (
          original &&
          (original.label !== item.label ||
            original.is_visible !== item.is_visible ||
            original.display_order !== item.display_order)
        ) {
          await updateNavItem.mutateAsync({
            id: item.id,
            label: item.label,
            is_visible: item.is_visible,
            display_order: item.display_order,
          })
        }
      }
      toast.success('Navigation updated.')
      setDirty(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save navigation.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  // ── Empty ──────────────────────────────────────────────────────────────────

  if (!items || items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <Menu className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            No navigation items configured yet.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
        <Button size="sm" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3.5 w-3.5" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>Edit menu labels and visibility. Page structure changes require admin support.</p>
      </div>

      {/* Navigation Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-4 py-3">
              {/* Up/Down Arrows */}
              <div className="flex flex-col gap-0.5">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => moveItem(index, 'up')}
                  className="h-5 w-5"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 'down')}
                  className="h-5 w-5"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Label Input */}
              <Input
                value={item.label}
                onChange={(e) => handleLabelChange(item.id, e.target.value)}
                className="max-w-[200px] h-8 text-sm"
              />

              {/* Route Path (read-only) */}
              <span className="text-xs text-muted-foreground font-mono">{item.route_path}</span>

              {/* Module Badge */}
              {item.module_key && (
                <Badge variant="secondary" className="text-xs">
                  {item.module_key}
                </Badge>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Visibility Toggle */}
              <label className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                <Switch
                  checked={item.is_visible}
                  onCheckedChange={(checked) => handleVisibilityChange(item.id, checked)}
                />
                Visible
              </label>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
