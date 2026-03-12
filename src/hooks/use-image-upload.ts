import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const BUCKET = 'inventory-images'

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  async function uploadImage(file: File, folder: string = 'units'): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return data.publicUrl
  }

  async function uploadImages(files: File[], folder?: string): Promise<string[]> {
    setUploading(true)
    setProgress(0)
    const urls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i], folder)
        urls.push(url)
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
    } finally {
      setUploading(false)
      setProgress(0)
    }

    return urls
  }

  async function deleteImage(url: string): Promise<void> {
    // Extract path from public URL
    const match = url.match(/\/storage\/v1\/object\/public\/inventory-images\/(.+)$/)
    if (!match) return
    const path = decodeURIComponent(match[1])
    await supabase.storage.from(BUCKET).remove([path])
  }

  return { uploadImages, deleteImage, uploading, progress }
}
