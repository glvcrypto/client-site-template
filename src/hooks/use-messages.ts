import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/lib/database.types'

export function useThreads() {
  return useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_message_threads')
        .select('*')
        .order('last_message_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useMessages(threadId: string) {
  return useQuery({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!threadId,
  })
}

export function useCreateThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (thread: TablesInsert<'portal_message_threads'>) => {
      const { data, error } = await supabase.from('portal_message_threads').insert(thread).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['threads'] }),
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (message: TablesInsert<'portal_messages'>) => {
      const { data, error } = await supabase.from('portal_messages').insert(message).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['messages', variables.thread_id] })
      qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}
