import type { Ticket } from '../types/ticket';
import { ASSIGNEES } from '../data/columns';
import { timeSince } from '../utils/timeSince';
import { TierBadge, AssigneeChip, Sentiment } from './Board/TicketCard';
import { IconX, IconLinear } from './icons';

interface SidePanelProps {
  ticket: Ticket | null;
  onClose: () => void;
  nowMs: number;
}

export function SidePanel({ ticket, onClose, nowMs }: SidePanelProps) {
  if (!ticket) return null;
  const a = ASSIGNEES[ticket.assignee];

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: 'var(--bg-2)', borderLeft: '1px solid var(--border)',
      boxShadow: '-16px 0 40px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column', zIndex: 60,
      animation: 'slideIn 0.2s ease-out',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>
          #{ticket.id}
        </span>
        <TierBadge tier={ticket.tier} />
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-dim)', display: 'inline-flex', padding: 4,
        }}>
          <IconX size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
        <div style={{
          fontSize: 17, fontWeight: 600, color: 'var(--text)',
          lineHeight: 1.35, marginBottom: 14, letterSpacing: -0.1,
        }}>
          {ticket.subject}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '90px 1fr', gap: '10px 14px',
          fontSize: 12, marginBottom: 18,
        }}>
          <div style={{ color: 'var(--text-mute)' }}>Customer</div>
          <div style={{ color: 'var(--text)' }}>{ticket.customer}</div>
          <div style={{ color: 'var(--text-mute)' }}>Assignee</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AssigneeChip id={ticket.assignee} size={18} />
            <span style={{ color: 'var(--text)' }}>{a?.name}</span>
          </div>
          <div style={{ color: 'var(--text-mute)' }}>Last update</div>
          <div style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>
            {timeSince(ticket.updatedAt, nowMs)} ago
          </div>
          <div style={{ color: 'var(--text-mute)' }}>Status</div>
          <div style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{ticket.status}</div>
          {ticket.linear && (
            <>
              <div style={{ color: 'var(--text-mute)' }}>Linear</div>
              <div style={{
                color: 'var(--violet)', fontFamily: 'var(--mono)',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <IconLinear size={11} /> {ticket.linear}
              </div>
            </>
          )}
          <div style={{ color: 'var(--text-mute)' }}>Replies</div>
          <div style={{ color: 'var(--text)' }}>{ticket.replies}</div>
          <div style={{ color: 'var(--text-mute)' }}>Sentiment</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            textTransform: 'capitalize', color: 'var(--text)',
          }}>
            <Sentiment s={ticket.sentiment} /> {ticket.sentiment || '—'}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6,
            color: 'var(--text-mute)', marginBottom: 6, fontWeight: 600,
          }}>Tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {ticket.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 11, padding: '3px 7px', borderRadius: 3,
                background: 'var(--surface-2)', color: 'var(--text-dim)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--mono)',
              }}>{tag}</span>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{
            fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6,
            color: 'var(--text-mute)', marginBottom: 8, fontWeight: 600,
          }}>
            Recent activity
          </div>
          {[
            { t: 'Customer replied', age: timeSince(ticket.updatedAt, nowMs) + ' ago' },
            { t: 'Tagged ' + ticket.tags[0], age: '1h before' },
            { t: 'Assigned to ' + (a ? a.name : '—'), age: '2h before' },
          ].map((e, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, fontSize: 12, padding: '8px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: 'var(--text-mute)', marginTop: 7,
              }} />
              <div style={{ flex: 1, color: 'var(--text)' }}>{e.t}</div>
              <div style={{ color: 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                {e.age}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1, padding: '8px 12px', borderRadius: 5,
          background: 'var(--accent)', color: 'var(--accent-ink)',
          border: 'none', fontWeight: 600, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer',
        }}>Reply</button>
        <button style={{
          padding: '8px 12px', borderRadius: 5,
          background: 'transparent', color: 'var(--text-dim)',
          border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500,
        }}>Open in Zendesk</button>
      </div>
    </div>
  );
}
