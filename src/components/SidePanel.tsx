import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import type { RichTextEditorHandle } from './RichTextEditor'
import { RichTextEditor } from './RichTextEditor'
import type { Ticket } from '../types/ticket'
import type { ZDMacro, FullTicket, ZDTicketField, CustomFieldValue } from '../api/tickets'
import type { ZDAttachment } from '../types/comment'
import { ASSIGNEES } from '../data/columns'
import { timeSince } from '../utils/timeSince'
import { TierBadge, AssigneeChip } from './Board/TicketCard'
import { IconX, IconLinear, IconReply } from './icons'
import { useFullTicket } from '../hooks/useFullTicket'
import { usePostReply } from '../hooks/usePostReply'
import { useMacros } from '../hooks/useMacros'
import { useFormFields } from '../hooks/useFormFields'
import { useAgents } from '../hooks/useAgents'
import { MY_ASSIGNEE_ID, uploadAttachment } from '../api/tickets'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from './Toast'
import { RequesterPanel } from './RequesterPanel'

// Form 5.0 ID — the default ticket form for getstream ZD
const FORM_5_ID = 37257437662487

interface SidePanelProps {
  ticket: Ticket | null
  onClose: () => void
  nowMs: number
}

interface AttachmentEntry {
  tempId: number
  file: File
  token: string | null
  uploading: boolean
}

// Built-in field types that are handled as standard ticket properties, not custom field inputs
const BUILTIN_TYPES = new Set(['subject', 'description', 'status', 'assignee', 'requester', 'group', 'custom_status', 'ticket_fork', 'follower'])

function AttachmentPreview({ att }: { att: ZDAttachment }) {
  const isImage = att.content_type.startsWith('image/')
  if (isImage) {
    return (
      <a href={att.content_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6 }}>
        <img src={att.content_url} alt={att.file_name}
          style={{ maxWidth: 260, maxHeight: 180, borderRadius: 6, display: 'block', border: '1px solid var(--border)' }}
        />
      </a>
    )
  }
  return (
    <a href={att.content_url} target="_blank" rel="noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
      fontSize: 11, color: 'var(--accent)', textDecoration: 'none',
      background: 'var(--accent-soft)', border: '1px solid var(--accent)',
      borderRadius: 4, padding: '3px 8px',
    }}>📎 {att.file_name}</a>
  )
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'hold', label: 'On-hold' },
  { value: 'solved', label: 'Solved' },
]

interface StatusMenuItemProps { label: string; onClick: () => void }
function StatusMenuItem({ label, onClick }: StatusMenuItemProps) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '7px 14px', background: 'transparent', border: 'none',
      color: 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: 500,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >{label}</button>
  )
}

interface MacroMenuItemProps { title: string; onClick: () => void }
function MacroMenuItem({ title, onClick }: MacroMenuItemProps) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '7px 14px', background: 'transparent', border: 'none',
      color: 'var(--text)', fontSize: 12, cursor: 'pointer',
      fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden',
      textOverflow: 'ellipsis', maxWidth: 280,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >{title}</button>
  )
}

// ── Email chips input (for CC field) ─────────────────────────────────────────

interface EmailChipsInputProps {
  emails: string[]
  input: string
  onInputChange: (v: string) => void
  onAdd: (email: string) => void
  onRemove: (email: string) => void
}

function EmailChipsInput({ emails, input, onInputChange, onAdd, onRemove }: EmailChipsInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const tryAdd = () => {
    const trimmed = input.trim().replace(/,+$/, '')
    if (trimmed && trimmed.includes('@') && !emails.includes(trimmed)) {
      onAdd(trimmed)
      onInputChange('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault()
      tryAdd()
    }
    if (e.key === 'Backspace' && !input && emails.length > 0) {
      onRemove(emails[emails.length - 1])
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center',
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 4, padding: '4px 8px', cursor: 'text', minHeight: 28,
      }}
    >
      {emails.map(email => (
        <span key={email} style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 3, padding: '1px 6px 1px 8px', fontSize: 11,
          color: 'var(--text)', lineHeight: '18px',
        }}>
          {email}
          <button
            onClick={e => { e.stopPropagation(); onRemove(email) }}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-mute)', padding: '0 0 0 2px', lineHeight: 1,
              display: 'inline-flex', alignItems: 'center', fontSize: 14,
            }}
          >×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={tryAdd}
        placeholder={emails.length === 0 ? 'Type email, press Enter or comma' : ''}
        style={{
          background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--text)', fontSize: 11, flex: 1, minWidth: 140,
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--bg-2)', border: '1px solid var(--border)',
  borderRadius: 4, padding: '6px 8px', fontSize: 12,
  color: 'var(--text)', fontFamily: 'inherit',
  outline: 'none',
}

interface FieldRowProps {
  field: ZDTicketField
  value: CustomFieldValue['value']
  onSave: (val: CustomFieldValue['value']) => void
  saving: boolean
}

function FieldRow({ field, value, onSave, saving }: FieldRowProps) {
  const [localVal, setLocalVal] = useState(value)

  useEffect(() => { setLocalVal(value) }, [value])

  const strVal = localVal == null ? '' : String(localVal)

  if (field.type === 'tagger' && field.custom_field_options?.length) {
    return (
      <select
        value={strVal}
        disabled={saving}
        onChange={e => { setLocalVal(e.target.value); onSave(e.target.value) }}
        style={{ ...fieldInputStyle, cursor: 'pointer' }}
      >
        <option value="">—</option>
        {field.custom_field_options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.name}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'date') {
    return (
      <input
        type="date"
        value={strVal}
        disabled={saving}
        onChange={e => setLocalVal(e.target.value)}
        onBlur={e => onSave(e.target.value || null)}
        style={fieldInputStyle}
      />
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={strVal}
        disabled={saving}
        rows={2}
        onChange={e => setLocalVal(e.target.value)}
        onBlur={e => onSave(e.target.value || null)}
        style={{ ...fieldInputStyle, resize: 'vertical', lineHeight: 1.4 }}
      />
    )
  }

  if (field.type === 'integer') {
    return (
      <input
        type="number"
        value={strVal}
        disabled={saving}
        onChange={e => setLocalVal(e.target.value)}
        onBlur={e => onSave(e.target.value ? String(e.target.value) : null)}
        style={fieldInputStyle}
      />
    )
  }

  if (field.type === 'checkbox') {
    const checked = localVal === true || localVal === 'true'
    return (
      <input
        type="checkbox"
        checked={checked}
        disabled={saving}
        onChange={e => { setLocalVal(e.target.checked); onSave(e.target.checked) }}
        style={{ marginTop: 4, cursor: 'pointer' }}
      />
    )
  }

  // text / default
  return (
    <input
      type="text"
      value={strVal}
      disabled={saving}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={e => onSave(e.target.value || null)}
      style={fieldInputStyle}
      placeholder="—"
    />
  )
}

interface TicketPropertiesPanelProps {
  ticket: Ticket
  full: FullTicket | undefined
  pendingAssigneeId: number | null | undefined
  onAssigneeChange: (id: number | null) => void
  pendingFields: Record<number, CustomFieldValue['value']>
  onFieldChange: (fieldId: number, value: CustomFieldValue['value']) => void
  submitting: boolean
}

function TicketPropertiesPanel({ ticket, full, pendingAssigneeId, onAssigneeChange, pendingFields, onFieldChange, submitting }: TicketPropertiesPanelProps) {
  const formId = (full?.ticket_form_id) ?? FORM_5_ID
  const { data: formData } = useFormFields(formId)
  const { data: agents = [] } = useAgents()

  const getVal = (fieldId: number): CustomFieldValue['value'] =>
    full?.custom_fields.find(cf => cf.id === fieldId)?.value ?? null

  const savedAgentId = full?.assignee_id ?? null
  // Show pending value if changed, otherwise the saved value
  const displayAgentId = pendingAssigneeId !== undefined ? pendingAssigneeId : savedAgentId
  const assigneeChanged = pendingAssigneeId !== undefined && pendingAssigneeId !== savedAgentId

  const customFields = formData
    ? formData.fieldIds
        .map(id => formData.fields.find(f => f.id === id))
        .filter((f): f is ZDTicketField => f !== undefined && !BUILTIN_TYPES.has(f.type))
    : []

  return (
    <div style={{
      width: 260, flexShrink: 0, overflowY: 'auto',
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Standard fields */}
      <div style={{ padding: '14px 14px 0', borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Ticket info
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 3 }}>Requester</div>
            <div style={{ fontSize: 12, color: 'var(--text)', padding: '4px 0' }}>{ticket.customer}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>Assignee</span>
              {assigneeChanged && <span style={{ fontSize: 9, color: 'var(--warn)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>unsaved</span>}
            </div>
            <select
              value={displayAgentId ?? ''}
              disabled={agents.length === 0 || submitting}
              onChange={e => {
                const val = e.target.value
                onAssigneeChange(val ? Number(val) : null)
              }}
              style={{
                ...fieldInputStyle, cursor: 'pointer',
                borderColor: assigneeChanged ? 'var(--warn)' : undefined,
              }}
            >
              <option value="">— Unassigned —</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 3 }}>Status</div>
            <span style={{
              fontSize: 11, fontWeight: 500, color: 'var(--text-dim)',
              textTransform: 'capitalize', padding: '2px 6px',
              background: 'var(--surface-2)', borderRadius: 3,
              border: '1px solid var(--border)', display: 'inline-block',
            }}>{ticket.status}</span>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 3 }}>Form</div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', padding: '4px 0' }}>Form 5.0</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 3 }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 2 }}>
              {ticket.tags.length === 0
                ? <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>—</span>
                : ticket.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 3,
                    background: 'var(--surface-2)', color: 'var(--text-mute)',
                    border: '1px solid var(--border)', fontFamily: 'var(--mono)',
                  }}>{tag}</span>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Custom fields */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {customFields.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-mute)', textAlign: 'center', padding: 12 }}>
            Loading fields…
          </div>
        )}
        {customFields.map(field => {
          const isPending = field.id in pendingFields
          return (
            <div key={field.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>{field.title}</span>
                {isPending && <span style={{ fontSize: 9, color: 'var(--warn)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>unsaved</span>}
              </div>
              <FieldRow
                field={field}
                value={isPending ? pendingFields[field.id] : getVal(field.id)}
                saving={submitting}
                onSave={val => onFieldChange(field.id, val)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProseContent({ html }: { html: string }) {
  const processed = html.replace(
    /<img([^>]*?)(?:\s*\/?)>/gi,
    (_, attrs: string) => {
      const m = attrs.match(/src=["']([^"']*)["']/)
      const src = m ? m[1] : ''
      const openBtn = src
        ? `<a href="${src}" target="_blank" rel="noreferrer noopener" class="prose-img-open">↗ Open</a>`
        : ''
      return `<span class="prose-img-wrap"><img${attrs}>${openBtn}</span>`
    },
  )
  return <div className="tiptap-prose" dangerouslySetInnerHTML={{ __html: processed }} />
}

export function SidePanel({ ticket, onClose, nowMs }: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<'thread' | 'info'>('thread')
  const [body, setBody] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [submitAs, setSubmitAs] = useState('open')
  const [attachments, setAttachments] = useState<AttachmentEntry[]>([])
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [ccInput, setCcInput] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showMacroMenu, setShowMacroMenu] = useState(false)
  const [expanded, setExpanded] = useState(
    () => localStorage.getItem('zd-panel-expanded') === 'true'
  )
  const [panelWidth, setPanelWidth] = useState(
    () => Number(localStorage.getItem('zd-panel-width')) || 640
  )
  const [editorHeight, setEditorHeight] = useState(
    () => Number(localStorage.getItem('zd-editor-h')) || 120
  )
  const isResizing = useRef(false)
  // Pending property changes — flushed to ZD only on submit
  const [pendingAssigneeId, setPendingAssigneeId] = useState<number | null | undefined>(undefined)
  const [pendingFields, setPendingFields] = useState<Record<number, CustomFieldValue['value']>>({})
  const threadRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<RichTextEditorHandle>(null)

  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { data: full, isLoading } = useFullTicket(ticket?.id ?? null)
  const comments = full?.comments ?? []
  const reply = usePostReply(ticket?.id ?? null)
  const { data: macrosData } = useMacros()
  const macros = macrosData ?? []

  // Reset compose state when a different ticket is opened
  useEffect(() => {
    setPendingAssigneeId(undefined)
    setPendingFields({})
    setActiveTab('thread')
    setCcEmails([])
    setCcInput('')
    setShowCc(false)
  }, [ticket?.id])

  // Enrich ticket in cache with comment timestamps for sort support.
  // Deps use ticket?.id (not ticket) to avoid an infinite loop:
  // setQueryData(['tickets']) → Board re-renders → new ticket reference →
  // enrichFromComments recreated → effect fires again → loop.
  const ticketId = ticket?.id
  const enrichFromComments = useCallback(() => {
    if (!full?.comments || !ticketId) return
    let lastRequesterReplyAt: number | null = null
    let lastAgentReplyAt: number | null = null
    for (const c of full.comments) {
      if (!c.public) continue
      const ts = new Date(c.created_at).getTime()
      if (c.author_id !== MY_ASSIGNEE_ID) {
        if (!lastRequesterReplyAt || ts > lastRequesterReplyAt) lastRequesterReplyAt = ts
      } else {
        if (!lastAgentReplyAt || ts > lastAgentReplyAt) lastAgentReplyAt = ts
      }
    }
    // Skip write if values haven't changed — prevents unnecessary re-renders
    const existing = queryClient.getQueryData<import('../types/ticket').Ticket[]>(['tickets'])
      ?.find(t => t.id === ticketId)
    if (existing?.lastRequesterReplyAt === lastRequesterReplyAt &&
        existing?.lastAgentReplyAt === lastAgentReplyAt) return
    queryClient.setQueryData<import('../types/ticket').Ticket[]>(['tickets'], ts =>
      ts?.map(t => t.id !== ticketId ? t : { ...t, lastRequesterReplyAt, lastAgentReplyAt }) ?? []
    )
  }, [full?.comments, ticketId, queryClient])

  useEffect(() => { enrichFromComments() }, [enrichFromComments])

  // Scroll to bottom when comment count changes
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [comments.length])

  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem('zd-panel-expanded', String(next))
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const file of files) {
      const tempId = Date.now() + Math.random()
      setAttachments(prev => [...prev, { tempId, file, token: null, uploading: true }])
      try {
        const token = await uploadAttachment(file)
        setAttachments(prev => prev.map(a => a.tempId === tempId ? { ...a, token, uploading: false } : a))
      } catch {
        setAttachments(prev => prev.filter(a => a.tempId !== tempId))
      }
    }
  }

  const handleApplyMacro = (macro: ZDMacro) => {
    for (const action of macro.actions) {
      if (action.field === 'comment_value_html') {
        editorRef.current?.setContent(String(action.value))
      } else if (action.field === 'comment_value') {
        editorRef.current?.setContent(`<p>${String(action.value)}</p>`)
      }
      if (action.field === 'status' && ['open', 'pending', 'hold', 'solved'].includes(String(action.value)))
        setSubmitAs(String(action.value))
      if (action.field === 'comment_mode_is_public') setIsPublic(action.value === 'true')
    }
    setShowMacroMenu(false)
  }

  const handleSend = () => handleSubmitAs(submitAs)

  const handleSubmitAs = (status: string) => {
    if (!ticket || reply.isPending) return
    setSubmitAs(status)
    setShowStatusMenu(false)

    const htmlBody = body.trim() || undefined
    const uploads = attachments.filter(a => a.token).map(a => a.token!)
    const customFields = Object.entries(pendingFields).map(([id, value]) => ({ id: Number(id), value }))
    const assigneeId = pendingAssigneeId

    const onSuccess = () => { showToast(ticket.id, status); onClose() }

    reply.mutate(
      { htmlBody, isPublic, status, uploads: uploads.length ? uploads : undefined, assigneeId, customFields: customFields.length ? customFields : undefined, ccEmails: ccEmails.length ? ccEmails : undefined },
      { onSuccess },
    )
    setBody('')
    editorRef.current?.clear()
    setAttachments([])
    setCcEmails([])
    setCcInput('')
    setPendingAssigneeId(undefined)
    setPendingFields({})
  }

  if (!ticket) return null
  const a = ASSIGNEES[ticket.assignee]

  const startEditorResize = (e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = editorHeight

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(60, Math.min(600, startH + (startY - ev.clientY)))
      setEditorHeight(next)
    }
    const onUp = (ev: MouseEvent) => {
      const final = Math.max(60, Math.min(600, startH + (startY - ev.clientY)))
      localStorage.setItem('zd-editor-h', String(final))
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Main conversation + reply column
  const conversationCol = (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
      {/* Header */}
      <div style={{
        padding: '12px 18px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>#{ticket.id}</span>
        <TierBadge tier={ticket.tier} />
        <span style={{
          fontSize: 11, fontWeight: 500, color: 'var(--text-dim)',
          textTransform: 'capitalize', padding: '2px 6px',
          background: 'var(--surface-2)', borderRadius: 3, border: '1px solid var(--border)',
        }}>{ticket.status}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={toggleExpanded}
          title={expanded ? 'Collapse' : 'Expand'}
          style={{
            fontSize: 13, color: 'var(--text-dim)', background: 'transparent',
            padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)',
            cursor: 'pointer', lineHeight: 1,
          }}
        >{expanded ? '⊟' : '⊞'}</button>
        <a
          href={`https://getstream.zendesk.com/agent/tickets/${ticket.id}`}
          target="_blank" rel="noreferrer"
          style={{
            fontSize: 11, color: 'var(--text-dim)', textDecoration: 'none',
            padding: '5px 10px', borderRadius: 4, border: '1px solid var(--border)', fontWeight: 500,
          }}
        >Open in ZD ↗</a>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-dim)', display: 'inline-flex', padding: 4, borderRadius: 4,
        }}><IconX size={16} /></button>
      </div>

      {/* Subject + metadata */}
      <div style={{
        padding: '14px 18px 0', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{
          fontSize: 16, fontWeight: 600, color: 'var(--text)',
          lineHeight: 1.35, marginBottom: 10, letterSpacing: -0.1,
        }}>{ticket.subject}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-dim)', flexWrap: 'wrap', marginBottom: 12 }}>
          <span>{ticket.customer}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <AssigneeChip id={ticket.assignee} size={16} />
            <span>{a?.name ?? ticket.assignee}</span>
          </div>
          <span style={{ color: 'var(--text-mute)', fontFamily: 'var(--mono)' }}>
            {timeSince(ticket.updatedAt, nowMs)} ago
          </span>
          {ticket.linear && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--violet)', fontFamily: 'var(--mono)', fontSize: 11 }}>
              <IconLinear size={11} /> {ticket.linear}
            </span>
          )}
        </div>
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', marginLeft: -18, marginRight: -18, paddingLeft: 18 }}>
          {(['thread', 'info'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '8px 14px', fontSize: 12, fontWeight: 600,
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-mute)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, letterSpacing: 0.2,
                textTransform: 'capitalize',
              }}
            >{tab === 'thread' ? 'Thread' : 'Requester'}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'info'
        ? <RequesterPanel requesterId={full?.requester_id} nowMs={nowMs} />
        : <>
        {/* Thread */}
        <div ref={threadRef} style={{ flex: 1, overflow: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, overflowAnchor: 'none' } as React.CSSProperties}>
          {isLoading && <div style={{ color: 'var(--text-mute)', fontSize: 12, textAlign: 'center', padding: 24 }}>Loading conversation…</div>}
          {!isLoading && comments.length === 0 && <div style={{ color: 'var(--text-mute)', fontSize: 12, textAlign: 'center', padding: 24 }}>No messages yet.</div>}
          {comments.map(c => {
            const isMe = c.author_id === MY_ASSIGNEE_ID
            const isRequester = full?.requester_id != null && c.author_id === full.requester_id
            const isInternal = !c.public
            const isOtherAgent = !isMe && !isRequester

            let bubbleBg: string
            let bubbleBorder: string
            let nameColor: string

            if (isInternal) {
              bubbleBg = 'var(--warn-soft)'; bubbleBorder = 'var(--warn)'; nameColor = 'var(--warn)'
            } else if (isMe) {
              bubbleBg = 'var(--accent-soft)'; bubbleBorder = 'var(--accent)'; nameColor = 'var(--accent)'
            } else if (isRequester) {
              bubbleBg = 'var(--info-soft)'; bubbleBorder = 'var(--info)'; nameColor = 'var(--info)'
            } else {
              bubbleBg = 'var(--violet-soft)'; bubbleBorder = 'var(--violet)'; nameColor = 'var(--violet)'
            }

            const alignRight = isMe

            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: alignRight ? 'flex-end' : 'flex-start' }}>
                {/* Author row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexDirection: alignRight ? 'row-reverse' : 'row' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: nameColor }}>{c.author_name}</span>
                  {isOtherAgent && !isInternal && (
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--violet-soft)', color: 'var(--violet)', border: '1px solid var(--violet)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Agent</span>
                  )}
                  {isInternal && (
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--warn-soft)', color: 'var(--warn)', border: '1px solid var(--warn)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Internal</span>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--text-mute)', fontFamily: 'var(--mono)' }}>
                    {timeSince(new Date(c.created_at).getTime(), nowMs)} ago
                  </span>
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 8,
                  background: bubbleBg,
                  border: `1px solid ${bubbleBorder}`,
                  fontSize: 13, color: 'var(--text)', lineHeight: 1.6,
                  borderTopRightRadius: alignRight ? 2 : 8,
                  borderTopLeftRadius: alignRight ? 8 : 2,
                  wordBreak: 'break-word',
                }}>
                  {c.html_body
                    ? <ProseContent html={c.html_body} />
                    : <span style={{ whiteSpace: 'pre-wrap' }}>{c.body}</span>
                  }
                  {c.attachments?.map(att => <AttachmentPreview key={att.id} att={att} />)}
                </div>
              </div>
            )
          })}
        </div>

      {/* Reply box */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, position: 'relative' }}>
        {/* Vertical resize handle */}
        <div
          onMouseDown={startEditorResize}
          title="Drag to resize composer"
          style={{
            height: 14, cursor: 'ns-resize', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'transparent', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>
        <div style={{ padding: '8px 18px 12px' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          {(['public', 'internal'] as const).map(mode => (
            <button key={mode} onClick={() => setIsPublic(mode === 'public')} style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 11,
              fontWeight: 600, cursor: 'pointer', letterSpacing: 0.3,
              textTransform: 'uppercase', border: '1px solid',
              background: (mode === 'public') === isPublic ? (isPublic ? 'var(--accent-soft)' : 'var(--warn-soft)') : 'transparent',
              borderColor: (mode === 'public') === isPublic ? (isPublic ? 'var(--accent)' : 'var(--warn)') : 'var(--border)',
              color: (mode === 'public') === isPublic ? (isPublic ? 'var(--accent)' : 'var(--warn)') : 'var(--text-mute)',
            }}>{mode === 'public' ? 'Public reply' : 'Internal note'}</button>
          ))}
        </div>

        {/* To / CC fields (public only) */}
        {isPublic && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
            {/* To row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-mute)', width: 22, flexShrink: 0, fontWeight: 600, textAlign: 'right' }}>To</span>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '4px 10px', minHeight: 28,
              }}>
                {ticket.requesterName || ticket.requesterEmail
                  ? <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>
                      {ticket.requesterName ?? ''}{ticket.requesterEmail
                        ? <span style={{ color: 'var(--text-mute)', fontWeight: 400 }}>
                            {ticket.requesterName ? ` <${ticket.requesterEmail}>` : ticket.requesterEmail}
                          </span>
                        : null}
                    </span>
                  : <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>—</span>
                }
              </div>
              {!showCc && (
                <button
                  onClick={() => setShowCc(true)}
                  style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--text-mute)',
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
                    letterSpacing: 0.3, flexShrink: 0,
                  }}
                >CC</button>
              )}
            </div>

            {/* CC row */}
            {showCc && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-mute)', width: 22, flexShrink: 0, fontWeight: 600, textAlign: 'right', marginTop: 5 }}>CC</span>
                <EmailChipsInput
                  emails={ccEmails}
                  input={ccInput}
                  onInputChange={setCcInput}
                  onAdd={email => setCcEmails(prev => [...prev, email])}
                  onRemove={email => setCcEmails(prev => prev.filter(e => e !== email))}
                />
                <button
                  onClick={() => { setShowCc(false); setCcEmails([]); setCcInput('') }}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--text-mute)', fontSize: 14, padding: '4px', lineHeight: 1,
                    flexShrink: 0,
                  }}
                  title="Remove CC"
                >×</button>
              </div>
            )}
          </div>
        )}
        <RichTextEditor
          ref={editorRef}
          onChange={setBody}
          placeholder={isPublic ? 'Write a reply to the customer…' : 'Write an internal note…'}
          isPublic={isPublic}
          onKeyboardSubmit={handleSend}
          editorHeight={editorHeight}
          onDropAttachment={async (file) => {
            const tempId = Date.now() + Math.random()
            setAttachments(prev => [...prev, { tempId, file, token: null, uploading: true }])
            try {
              const token = await uploadAttachment(file)
              setAttachments(prev => prev.map(a => a.tempId === tempId ? { ...a, token, uploading: false } : a))
            } catch {
              setAttachments(prev => prev.filter(a => a.tempId !== tempId))
            }
          }}
        />
        {attachments.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {attachments.map(att => (
              <span key={att.tempId} style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 4, fontSize: 11, padding: '2px 8px',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                opacity: att.uploading ? 0.5 : 1,
              }}>
                {att.file.name}
                {att.uploading
                  ? <span style={{ color: 'var(--text-mute)' }}>…</span>
                  : <button onClick={() => setAttachments(prev => prev.filter(a => a.tempId !== att.tempId))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', padding: 0, lineHeight: 1, fontSize: 12 }}>×</button>
                }
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} title="Attach file" style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 4, cursor: 'pointer', color: 'var(--text-dim)',
              padding: '5px 8px', fontSize: 13, lineHeight: 1,
            }}>📎</button>
            {macros.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setShowMacroMenu(v => !v); setShowStatusMenu(false) }} style={{
                  background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 4, cursor: 'pointer', color: 'var(--text-dim)',
                  padding: '5px 8px', fontSize: 11, fontWeight: 500,
                }}>⚡ Macro ▼</button>
                {showMacroMenu && (
                  <>
                    <div onClick={() => setShowMacroMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                    <div style={{
                      position: 'absolute', bottom: '100%', left: 0, zIndex: 100,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                      marginBottom: 4, minWidth: 200, maxHeight: 260, overflowY: 'auto',
                    }}>
                      {macros.map((macro: ZDMacro) => (
                        <MacroMenuItem key={macro.id} title={macro.title} onClick={() => handleApplyMacro(macro)} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>⌘↵</span>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                onClick={handleSend}
                disabled={reply.isPending || reply.isPending}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: '5px 0 0 5px', cursor: 'pointer',
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  border: 'none', borderRight: '1px solid rgba(0,0,0,0.15)',
                  fontWeight: 600, fontSize: 12, letterSpacing: 0.4,
                  textTransform: 'uppercase', opacity: (reply.isPending || reply.isPending) ? 0.6 : 1,
                }}
              >
                <IconReply size={13} />
                {reply.isPending ? 'Sending…' : `Submit as ${submitAs}`}
              </button>
              <button
                onClick={() => { setShowStatusMenu(v => !v); setShowMacroMenu(false) }}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '8px 9px', borderRadius: '0 5px 5px 0', cursor: 'pointer',
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  border: 'none', fontWeight: 600, fontSize: 11,
                  opacity: (reply.isPending || reply.isPending) ? 0.6 : 1,
                }}
              >▼</button>
              {showStatusMenu && (
                <>
                  <div onClick={() => setShowStatusMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                  <div style={{
                    position: 'absolute', bottom: '100%', right: 0, zIndex: 100,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    marginBottom: 4, minWidth: 140,
                  }}>
                    {STATUS_OPTIONS.map(opt => (
                      <StatusMenuItem key={opt.value} label={opt.label} onClick={() => handleSubmitAs(opt.value)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </div>{/* /inner padding */}
      </div>
      </>}
    </div>
  )

  // Expanded: centered modal with backdrop + properties panel
  if (expanded) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width: '92vw', maxWidth: 1200, height: '90vh',
          display: 'flex', borderRadius: 8, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          border: '1px solid var(--border)',
        }}>
          <TicketPropertiesPanel
            ticket={ticket} full={full}
            pendingAssigneeId={pendingAssigneeId}
            onAssigneeChange={setPendingAssigneeId}
            pendingFields={pendingFields}
            onFieldChange={(id, val) => setPendingFields(prev => ({ ...prev, [id]: val }))}
            submitting={reply.isPending}
          />
          {conversationCol}
        </div>
      </div>
    )
  }

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    const startX = e.clientX
    const startW = panelWidth

    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const next = Math.max(380, Math.min(window.innerWidth - 80, startW + (startX - ev.clientX)))
      setPanelWidth(next)
    }
    const onUp = (ev: MouseEvent) => {
      isResizing.current = false
      const final = Math.max(380, Math.min(window.innerWidth - 80, startW + (startX - ev.clientX)))
      localStorage.setItem('zd-panel-width', String(final))
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Drawer: right panel
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: panelWidth,
      background: 'var(--bg-2)', borderLeft: '1px solid var(--border)',
      boxShadow: '-16px 0 40px rgba(0,0,0,0.45)',
      display: 'flex', flexDirection: 'row', zIndex: 60,
      animation: 'slideIn 0.2s ease-out',
    }}>
      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
          cursor: 'ew-resize', zIndex: 10,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.opacity = '0.4' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {conversationCol}
      </div>
    </div>
  )
}
