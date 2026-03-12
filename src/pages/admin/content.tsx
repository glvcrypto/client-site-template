import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { usePageContent, useUpdateContent } from '@/hooks/use-content'

// ── Helpers ──────────────────────────────────────────────────────────────────

const CMS_BUCKET = 'cms-images'

/** Convert a content_key like "hero_headline" to "Hero Headline" */
function humanise(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Group content keys into sections by their prefix (e.g., hero_, main_, cta_) */
function groupFields(
  fields: Record<string, { value: string; type: string; id: string }>
): { section: string; keys: string[] }[] {
  const sectionMap = new Map<string, string[]>()

  for (const key of Object.keys(fields)) {
    const parts = key.split('_')
    // Use first token as the section prefix, or "General" if only one word
    const section = parts.length > 1 ? parts[0] : 'general'
    if (!sectionMap.has(section)) sectionMap.set(section, [])
    sectionMap.get(section)!.push(key)
  }

  return Array.from(sectionMap.entries()).map(([section, keys]) => ({
    section: humanise(section) + ' Section',
    keys,
  }))
}

/** Upload a single image to the cms-images bucket, return the public URL */
async function uploadCmsImage(file: File, pageSlug: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const fileName = `${pageSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from(CMS_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(CMS_BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

// ── Page Content Editor ──────────────────────────────────────────────────────

function PageContentEditor({ pageSlug }: { pageSlug: string }) {
  const { data: content, isLoading, isError } = usePageContent(pageSlug)
  const updateContent = useUpdateContent()

  const [edits, setEdits] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const initialisedRef = useRef<string | null>(null)

  // Initialise local state when content loads (or page changes)
  useEffect(() => {
    if (content && initialisedRef.current !== pageSlug) {
      const initial: Record<string, string> = {}
      for (const [key, field] of Object.entries(content)) {
        initial[key] = field.value
      }
      setEdits(initial)
      setDirty(false)
      initialisedRef.current = pageSlug
    }
  }, [content, pageSlug])

  // Reset initialised ref when page changes so we re-init
  useEffect(() => {
    initialisedRef.current = null
  }, [pageSlug])

  function handleChange(key: string, value: string) {
    setEdits((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function handleImageUpload(key: string, file: File) {
    setUploadingKey(key)
    try {
      const url = await uploadCmsImage(file, pageSlug)
      handleChange(key, url)
      toast.success('Image uploaded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed.')
    } finally {
      setUploadingKey(null)
    }
  }

  async function handleSave() {
    if (!content) return

    const updates: { page_slug: string; content_key: string; content_value: string }[] = []
    for (const [key, value] of Object.entries(edits)) {
      // Only include fields that actually changed
      if (content[key] && content[key].value !== value) {
        updates.push({ page_slug: pageSlug, content_key: key, content_value: value })
      }
    }

    if (updates.length === 0) {
      toast.info('No changes to save.')
      return
    }

    updateContent.mutate(updates, {
      onSuccess: () => {
        toast.success('Content saved successfully.')
        setDirty(false)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to save content.')
      },
    })
  }

  // ── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-9 w-full animate-pulse rounded bg-muted" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // ── Error State ────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <Card className="mt-4">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Failed to load content for this page. Please try refreshing.
        </CardContent>
      </Card>
    )
  }

  // ── Empty State ────────────────────────────────────────────────────────────

  if (!content || Object.keys(content).length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No editable content fields have been configured for this page yet.
        </CardContent>
      </Card>
    )
  }

  // ── Content Fields ─────────────────────────────────────────────────────────

  const groups = groupFields(content)

  return (
    <div className="space-y-4 pt-4">
      {groups.map((group) => (
        <Card key={group.section}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{group.section}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.keys.map((key) => {
              const field = content[key]
              const currentValue = edits[key] ?? field.value

              if (field.type === 'image_url') {
                return (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs">{humanise(key)}</Label>
                    {currentValue && (
                      <div className="relative h-32 w-48 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={currentValue}
                          alt={humanise(key)}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        value={currentValue}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder="Image URL"
                        className="flex-1"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(key, file)
                            e.target.value = ''
                          }}
                          disabled={uploadingKey === key}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          asChild
                          disabled={uploadingKey === key}
                        >
                          <span>
                            {uploadingKey === key ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Upload
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                )
              }

              if (field.type === 'html') {
                return (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs">{humanise(key)}</Label>
                    <Textarea
                      value={currentValue}
                      onChange={(e) => handleChange(key, e.target.value)}
                      rows={5}
                      placeholder={humanise(key)}
                    />
                  </div>
                )
              }

              // Default: text field
              return (
                <div key={key} className="space-y-2">
                  <Label className="text-xs">{humanise(key)}</Label>
                  <Input
                    value={currentValue}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={humanise(key)}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!dirty || updateContent.isPending}
        >
          {updateContent.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  )
}

// ── Content Page ─────────────────────────────────────────────────────────────

const PAGES = [
  { slug: 'home', label: 'Home' },
  { slug: 'about', label: 'About' },
  { slug: 'services', label: 'Services' },
  { slug: 'financing', label: 'Financing' },
  { slug: 'contact', label: 'Contact' },
]

export function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Content</h1>
        <p className="text-sm text-muted-foreground">
          Edit page text and images. Design changes require admin support.
        </p>
      </div>

      <Tabs defaultValue={0}>
        <TabsList>
          {PAGES.map((p, i) => (
            <TabsTrigger key={p.slug} value={i}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {PAGES.map((p, i) => (
          <TabsContent key={p.slug} value={i}>
            <PageContentEditor pageSlug={p.slug} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
