import { useState, useRef, useEffect } from 'react'
import { useThreads, useMessages, useCreateThread, useSendMessage } from '@/hooks/use-messages'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  MessageSquare,
  Plus,
  Loader2,
  Inbox,
  ArrowLeft,
  Send,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import type { Database } from '@/lib/database.types'

// ── Types ────────────────────────────────────────────────────────────────────────

type ThreadRow = NonNullable<ReturnType<typeof useThreads>['data']>[number]
type MessageRow = NonNullable<ReturnType<typeof useMessages>['data']>[number]
type MessageCategory = Database['public']['Enums']['message_category']
type ThreadStatus = Database['public']['Enums']['thread_status']
type SenderRole = Database['public']['Enums']['sender_role']

// ── Constants ────────────────────────────────────────────────────────────────────

const CATEGORIES: { value: MessageCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'lead_question', label: 'Lead Question' },
  { value: 'inventory_request', label: 'Inventory Request' },
  { value: 'support', label: 'Support' },
  { value: 'approval', label: 'Approval' },
]

const categoryColours: Record<MessageCategory, string> = {
  general: 'bg-zinc-100 text-zinc-700',
  lead_question: 'bg-blue-100 text-blue-700',
  inventory_request: 'bg-purple-100 text-purple-700',
  support: 'bg-amber-100 text-amber-700',
  approval: 'bg-red-100 text-red-700',
}

const statusColours: Record<ThreadStatus, string> = {
  open: 'bg-green-100 text-green-700',
  resolved: 'bg-zinc-100 text-zinc-600',
  archived: 'bg-red-100 text-red-700',
}

const roleColours: Record<SenderRole, string> = {
  admin: 'bg-blue-100 text-blue-700',
  owner: 'bg-purple-100 text-purple-700',
  staff: 'bg-zinc-100 text-zinc-600',
}

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── New Thread Dialog ────────────────────────────────────────────────────────────

function NewThreadDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user, role } = useAuth()
  const createThread = useCreateThread()
  const sendMessage = useSendMessage()

  const [formData, setFormData] = useState({
    subject: '',
    category: '' as string,
    body: '',
  })

  function resetForm() {
    setFormData({ subject: '', category: '', body: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.subject || !formData.body) {
      toast.error('Subject and message are required')
      return
    }

    try {
      const thread = await createThread.mutateAsync({
        subject: formData.subject,
        category: (formData.category || 'general') as MessageCategory,
      })

      await sendMessage.mutateAsync({
        thread_id: thread.id,
        sender_id: user?.id ?? null,
        sender_role: (role ?? 'staff') as SenderRole,
        body: formData.body,
      })

      toast.success('Thread created')
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error('Failed to create thread')
    }
  }

  const isPending = createThread.isPending || sendMessage.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Thread</DialogTitle>
          <DialogDescription>Start a new conversation.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thread_subject">Subject *</Label>
            <Input
              id="thread_subject"
              value={formData.subject}
              onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thread_category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData((p) => ({ ...p, category: val }))}
            >
              <SelectTrigger id="thread_category">
                <SelectValue placeholder="General" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thread_body">Message *</Label>
            <Textarea
              id="thread_body"
              rows={4}
              value={formData.body}
              onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Create Thread
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Thread List Item ─────────────────────────────────────────────────────────────

function ThreadListItem({
  thread,
  isActive,
  onClick,
}: {
  thread: ThreadRow
  isActive: boolean
  onClick: () => void
}) {
  const isOpen = thread.status === 'open'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 border-b transition-colors hover:bg-muted/50',
        isActive && 'bg-muted',
        isOpen && !isActive && 'border-l-2 border-l-green-500',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-sm truncate', isOpen && 'font-semibold')}>
          {thread.subject}
        </p>
        {thread.last_message_at && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        {thread.category && (
          <Badge
            variant="secondary"
            className={cn('text-[10px]', categoryColours[thread.category])}
          >
            {formatEnumLabel(thread.category)}
          </Badge>
        )}
        {thread.status && (
          <Badge
            variant="secondary"
            className={cn('text-[10px]', statusColours[thread.status])}
          >
            {formatEnumLabel(thread.status)}
          </Badge>
        )}
      </div>
    </button>
  )
}

// ── Conversation View ────────────────────────────────────────────────────────────

function ConversationView({
  thread,
  onBack,
}: {
  thread: ThreadRow
  onBack: () => void
}) {
  const { user, role } = useAuth()
  const { data: messages, isLoading } = useMessages(thread.id)
  const sendMessage = useSendMessage()
  const [body, setBody] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return

    try {
      await sendMessage.mutateAsync({
        thread_id: thread.id,
        sender_id: user?.id ?? null,
        sender_role: (role ?? 'staff') as SenderRole,
        body: body.trim(),
      })
      setBody('')
    } catch {
      toast.error('Failed to send message')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="p-4 border-b flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold truncate">{thread.subject}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            {thread.category && (
              <Badge
                variant="secondary"
                className={cn('text-[10px]', categoryColours[thread.category])}
              >
                {formatEnumLabel(thread.category)}
              </Badge>
            )}
            {thread.status && (
              <Badge
                variant="secondary"
                className={cn('text-[10px]', statusColours[thread.status])}
              >
                {formatEnumLabel(thread.status)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet.
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose bar */}
      <form onSubmit={handleSend} className="p-3 border-t flex items-end gap-2 shrink-0">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          rows={2}
          className="flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e)
            }
          }}
        />
        <Button type="submit" size="icon" disabled={!body.trim() || sendMessage.isPending}>
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}

// ── Message Bubble ───────────────────────────────────────────────────────────────

function MessageBubble({ message, isOwn }: { message: MessageRow; isOwn: boolean }) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 space-y-1',
          isOwn ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-foreground',
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <div className={cn('flex items-center gap-1.5 text-[10px]', isOwn ? 'text-blue-200' : 'text-muted-foreground')}>
          <Badge
            variant="secondary"
            className={cn(
              'text-[9px] px-1 py-0',
              isOwn ? 'bg-blue-500 text-blue-100 border-0' : roleColours[message.sender_role],
            )}
          >
            {formatEnumLabel(message.sender_role)}
          </Badge>
          {message.created_at && (
            <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────────

export function MessagesPage() {
  const { data: threads, isLoading } = useThreads()
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [newThreadOpen, setNewThreadOpen] = useState(false)

  const selectedThread = threads?.find((t) => t.id === selectedThreadId) ?? null

  // On mobile: show list or conversation, not both
  const [mobileView, setMobileView] = useState<'list' | 'conversation'>('list')

  function selectThread(thread: ThreadRow) {
    setSelectedThreadId(thread.id)
    setMobileView('conversation')
  }

  function handleBack() {
    setMobileView('list')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Internal communication between your team and GLV.
          </p>
        </div>
        <Button onClick={() => setNewThreadOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Thread
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !threads || threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No conversations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Start a new thread to begin communicating.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setNewThreadOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Thread
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Desktop layout: two columns */}
          <div className="hidden md:flex h-full">
            {/* Thread list */}
            <div className="w-80 border-r overflow-y-auto shrink-0">
              {threads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === selectedThreadId}
                  onClick={() => selectThread(thread)}
                />
              ))}
            </div>

            {/* Conversation */}
            <div className="flex-1 min-w-0">
              {selectedThread ? (
                <ConversationView thread={selectedThread} onBack={handleBack} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Select a conversation to view messages
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile layout: one panel at a time */}
          <div className="md:hidden h-full">
            {mobileView === 'list' ? (
              <div className="overflow-y-auto h-full">
                {threads.map((thread) => (
                  <ThreadListItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === selectedThreadId}
                    onClick={() => selectThread(thread)}
                  />
                ))}
              </div>
            ) : selectedThread ? (
              <ConversationView thread={selectedThread} onBack={handleBack} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No thread selected</p>
              </div>
            )}
          </div>
        </div>
      )}

      <NewThreadDialog open={newThreadOpen} onOpenChange={setNewThreadOpen} />
    </div>
  )
}
