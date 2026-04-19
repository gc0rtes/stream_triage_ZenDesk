import { useState, useRef, useEffect } from 'react'
import type { Ticket } from '../types/ticket'
import { ASSIGNEES } from '../data/columns'
import { timeSince } from '../utils/timeSince'
import { TierBadge, AssigneeChip } from './Board/TicketCard'
import { IconX, IconLinear, IconReply } from './icons'
import { useFullTicket } from '../hooks/useFullTicket'
import { usePostReply } from '../hooks/usePostReply'
import { MY_ASSIGNEE_ID } from '../api/tickets'

interface SidePanelProps {
  ticket: Ticket | null
  onClose: () => void
  nowMs: number
}

export function SidePanel({ ticket, onClose, nowMs }: SidePanelProps) {
  const [body, setBody] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const threadRef = useRef<HTMLDivElement>(null)

  const { data: full, isLoading } = useFullTicket(ticket?.id ?? null)
  const comments = full?.comments ?? []
  const reply = usePostReply(ticket?.id ?? null)

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [comments.length])

  const handleSend = () => {
    const trimmed = body.trim()
    if (!trimmed || !ticket) return
    reply.mutate({ body: trimmed, isPublic })
    setBody('')
  }

  if (!ticket) return null
  const a = ASSIGNEES[ticket.assignee]

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 640,
      background: 'var(--bg-2)', borderLeft: '1px solid var(--border)',
      boxShadow: '-16px 0 40px rgba(0,0,0,0.45)',
      display: 'flex', flexDirection: 'column', zIndex: 60,
      animation: 'slideIn 0.2s ease-out',
    }}>

      {/* Header */}
      <div style={{
        padding: '12px 18px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>
          #{ticket.id}
        </span>
        <TierBadge tier={ticket.tier} />
        <span style={{
          fontSize: 11, fontWeight: 500, color: 'var(--text-dim)',
          textTransform: 'capitalize', padding: '2px 6px',
          background: 'var(--surface-2)', borderRadius: 3,
          border: '1px solid var(--border)',
        }}>{ticket.status}</span>
        <div style={{ flex: 1 }} />
        <a
          href={`https://getstream.zendesk.com/agent/tickets/${ticket.id}`}
          target="_blank" rel="noreferrer"
          style={{
            fontSize: 11, color: 'var(--text-dim)', textDecoration: 'none',
            padding: '5px 10px', borderRadius: 4,
            border: '1px solid var(--border)', fontWeight: 500,
          }}
        >
          Open in ZD ↗
        </a>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-dim)', display: 'inline-flex', padding: 4, borderRadius: 4,
        }}>
          <IconX size={16} />
        </button>
      </div>

      {/* Subject + metadata */}
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{
          fontSize: 16, fontWeight: 600, color: 'var(--text)',
          lineHeight: 1.35, marginBottom: 12, letterSpacing: -0.1,
        }}>
          {ticket.subject}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
          <span>{ticket.customer}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <AssigneeChip id={ticket.assignee} size={16} />
            <span>{a?.name ?? ticket.assignee}</span>
          </div>
          <span style={{ color: 'var(--text-mute)', fontFamily: 'var(--mono)' }}>
            {timeSince(ticket.updatedAt, nowMs)} ago
          </span>
          {ticket.linear && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              color: 'var(--violet)', fontFamily: 'var(--mono)', fontSize: 11,
            }}>
              <IconLinear size={11} /> {ticket.linear}
            </span>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {ticket.tags.slice(0, 5).map(tag => (
              <span key={tag} style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 3,
                background: 'var(--surface-2)', color: 'var(--text-mute)',
                border: '1px solid var(--border)', fontFamily: 'var(--mono)',
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation thread */}
      <div ref={threadRef} style={{
        flex: 1, overflow: 'auto', padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {isLoading && (
          <div style={{ color: 'var(--text-mute)', fontSize: 12, textAlign: 'center', padding: 24 }}>
            Loading conversation…
          </div>
        )}
        {!isLoading && comments.length === 0 && (
          <div style={{ color: 'var(--text-mute)', fontSize: 12, textAlign: 'center', padding: 24 }}>
            No messages yet.
          </div>
        )}
        {comments.map(c => {
          const isMe = c.author_id === MY_ASSIGNEE_ID
          return (
            <div key={c.id} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                flexDirection: isMe ? 'row-reverse' : 'row',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: isMe ? 'var(--accent)' : 'var(--text-dim)',
                }}>
                  {c.author_name}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-mute)', fontFamily: 'var(--mono)' }}>
                  {timeSince(new Date(c.created_at).getTime(), nowMs)} ago
                </span>
                {!c.public && (
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 3,
                    background: 'var(--warn-soft)', color: 'var(--warn)',
                    border: '1px solid var(--warn)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: 0.4,
                  }}>Internal</span>
                )}
              </div>
              <div style={{
                maxWidth: '80%', padding: '10px 14px', borderRadius: 8,
                background: isMe ? 'var(--accent-soft)' : 'var(--surface)',
                border: `1px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
                fontSize: 13, color: 'var(--text)', lineHeight: 1.5,
                borderTopRightRadius: isMe ? 2 : 8,
                borderTopLeftRadius: isMe ? 8 : 2,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {c.body}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply box */}
      <div style={{
        padding: '12px 18px', borderTop: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        {/* Public / Internal toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {(['public', 'internal'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setIsPublic(mode === 'public')}
              style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 11,
                fontWeight: 600, cursor: 'pointer', letterSpacing: 0.3,
                textTransform: 'uppercase', border: '1px solid',
                background: (mode === 'public') === isPublic
                  ? (isPublic ? 'var(--accent-soft)' : 'var(--warn-soft)')
                  : 'transparent',
                borderColor: (mode === 'public') === isPublic
                  ? (isPublic ? 'var(--accent)' : 'var(--warn)')
                  : 'var(--border)',
                color: (mode === 'public') === isPublic
                  ? (isPublic ? 'var(--accent)' : 'var(--warn)')
                  : 'var(--text-mute)',
              }}
            >
              {mode === 'public' ? 'Public reply' : 'Internal note'}
            </button>
          ))}
        </div>

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend() }}
          placeholder={isPublic ? 'Write a reply to the customer…' : 'Write an internal note…'}
          rows={4}
          style={{
            width: '100%', resize: 'vertical', boxSizing: 'border-box',
            background: 'var(--bg-2)', color: 'var(--text)',
            border: `1px solid ${isPublic ? 'var(--border)' : 'var(--warn)'}`,
            borderRadius: 6, padding: '10px 12px', fontSize: 13,
            fontFamily: 'inherit', lineHeight: 1.5, outline: 'none',
            marginBottom: 8,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>
            ⌘↵ to send
          </span>
          <button
            onClick={handleSend}
            disabled={!body.trim() || reply.isPending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 5, cursor: 'pointer',
              background: body.trim() ? 'var(--accent)' : 'var(--surface-2)',
              color: body.trim() ? 'var(--accent-ink)' : 'var(--text-mute)',
              border: 'none', fontWeight: 600, fontSize: 12,
              letterSpacing: 0.4, textTransform: 'uppercase',
              opacity: reply.isPending ? 0.6 : 1,
            }}
          >
            <IconReply size={13} />
            {reply.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
