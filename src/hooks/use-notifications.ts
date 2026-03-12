import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ── Types ───────────────────────────────────────────────────────────────────

export interface NotificationConfig {
  id: string
  event_type: string
  email_enabled: boolean
  email_to: string | null
  webhook_enabled: boolean
  webhook_url: string | null
  webhook_headers_json: Record<string, string>
}

export interface NotificationTemplate {
  id: string
  event_type: string
  subject: string
  body_html: string
  body_text: string | null
  is_customer_facing: boolean
  updated_at: string
}

export interface NotificationLogEntry {
  id: string
  event_type: string
  channel: 'email' | 'webhook'
  recipient: string | null
  status: 'sent' | 'failed'
  payload_json: Record<string, any> | null
  error_message: string | null
  sent_at: string
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useNotificationConfig() {
  return useQuery({
    queryKey: ['notification-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_config')
        .select('*')
        .order('event_type')
      if (error) throw error
      return data as NotificationConfig[]
    },
  })
}

export function useUpdateNotificationConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NotificationConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('notification_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-config'] }),
  })
}

export function useNotificationTemplates() {
  return useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('event_type')
      if (error) throw error
      return data as NotificationTemplate[]
    },
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NotificationTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('notification_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-templates'] }),
  })
}

export function useNotificationLog(limit = 50) {
  return useQuery({
    queryKey: ['notification-log', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as NotificationLogEntry[]
    },
  })
}
