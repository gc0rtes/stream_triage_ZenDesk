import type { CSSProperties } from 'react';
import type { Ticket } from '../../types/ticket';
import { TIER_META, ASSIGNEES } from '../../data/columns';
import { DENSITY_PRESETS } from '../../theme';
import { timeSince } from '../../utils/timeSince';
import { urgencyFor } from '../../utils/urgencyFor';
import {
  IconClock, IconReply, IconAlert, IconLinear,
  IconDot, IconSmile, IconMeh, IconFrown,
} from '../icons';

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  open:    { color: 'var(--accent)',  bg: 'var(--accent-soft)',  border: 'var(--accent)' },
  pending: { color: 'var(--info)',    bg: 'var(--info-soft)',    border: 'var(--info)' },
  hold:    { color: 'var(--warn)',    bg: 'var(--warn-soft)',    border: 'var(--warn)' },
  solved:  { color: 'var(--text-mute)', bg: 'var(--surface-2)', border: 'var(--border-strong)' },
}

interface StatusBadgeProps { status: string }
function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.open
  return (
    <span style={{
      fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: 0.6, fontWeight: 600,
      padding: '2px 5px', borderRadius: 3,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{status}</span>
  )
}

interface TierBadgeProps { tier: string }
export function TierBadge({ tier }: TierBadgeProps) {
  const meta = TIER_META[tier];
  const isEnt = tier === 'enterprise';
  return (
    <span style={{
      fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: 0.6, fontWeight: 600,
      padding: '2px 5px', borderRadius: 3,
      background: isEnt ? 'var(--accent-soft)' : 'var(--surface-2)',
      color:      isEnt ? 'var(--accent)'      : 'var(--text-dim)',
      border: isEnt ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{meta?.label ?? tier}</span>
  );
}

interface AssigneeChipProps { id: string; size?: number }
export function AssigneeChip({ id, size = 20 }: AssigneeChipProps) {
  const a = ASSIGNEES[id];
  if (!a) return null;
  return (
    <div title={a.name} style={{
      width: size, height: size, borderRadius: '50%',
      background: `oklch(0.40 0.05 ${a.hue})`,
      color: `oklch(0.95 0.05 ${a.hue})`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, fontWeight: 600, letterSpacing: 0.2,
      flexShrink: 0,
      border: `1px solid oklch(0.55 0.06 ${a.hue} / 0.4)`,
    }}>{id}</div>
  );
}

interface SentimentProps { s: Ticket['sentiment']; size?: number }
export function Sentiment({ s, size = 13 }: SentimentProps) {
  if (!s) return null;
  if (s === 'positive') return <IconSmile size={size} style={{ color: 'var(--accent)' }} />;
  if (s === 'negative') return <IconFrown size={size} style={{ color: 'var(--danger)' }} />;
  return <IconMeh size={size} style={{ color: 'var(--text-mute)' }} />;
}

interface TicketCardProps {
  t: Ticket;
  nowMs: number;
  staleHours: number;
  onOpen: (t: Ticket) => void;
  onAssign?: (id: number) => void;
  style?: CSSProperties;
  styleVariant?: 'default' | 'rail' | 'minimal';
  density?: string;
}

export function TicketCard({ t, nowMs, staleHours, onOpen, onAssign, style, styleVariant = 'default', density }: TicketCardProps) {
  const u = urgencyFor(t, nowMs, staleHours);
  const approaching = t.status === 'open' && u >= 0.75 && u < 1;
  const stale = t.status === 'open' && u >= 1;
  const isEnt = t.tier === 'enterprise';
  const age = timeSince(t.updatedAt, nowMs);

  const d = DENSITY_PRESETS[(density as keyof typeof DENSITY_PRESETS)] ?? DENSITY_PRESETS.comfortable;

  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(t.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const railColor =
    stale        ? 'var(--danger)' :
    approaching  ? 'var(--warn)'   :
    isEnt        ? 'var(--accent)' :
    t.status === 'pending'           ? 'var(--info)'   :
    t.holdType === 'linear'          ? 'var(--violet)' :
    t.holdType === 'feature_request' ? 'var(--warn)'   :
    t.status === 'solved'            ? 'var(--accent)' :
    'transparent';

  const baseCard: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: d.cardPad,
    cursor: 'grab',
    position: 'relative',
    overflow: 'hidden',
    fontSize: d.cardFont,
    color: 'var(--text)',
    transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
    flexShrink: 0,
    ...style,
  };

  if (styleVariant === 'minimal') {
    baseCard.background = 'transparent';
    baseCard.borderLeft = `3px solid ${railColor}`;
    baseCard.borderRadius = 0;
    baseCard.borderTop = '1px solid var(--border)';
  }
  if (styleVariant === 'rail') {
    baseCard.paddingLeft = (d.cardPad as number) + 6;
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => onOpen(t)}
      className={`tc ${stale ? 'tc-stale' : ''} ${approaching ? 'tc-approaching' : ''}`}
      style={baseCard}
    >
      {styleVariant === 'rail' && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: railColor,
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', fontWeight: 500 }}>
          #{t.id}
        </span>
        <TierBadge tier={t.tier} />
        <StatusBadge status={t.status} />
        <div style={{ flex: 1 }} />
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontFamily: 'var(--mono)', fontSize: 11,
          color: stale ? 'var(--danger)' : approaching ? 'var(--warn)' : 'var(--text-mute)',
          fontWeight: stale || approaching ? 600 : 500,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <IconClock size={11} />
          {age.split(' ')[0]}
        </span>
      </div>

      <div style={{
        color: 'var(--text)', fontWeight: 500, lineHeight: 1.35,
        marginBottom: 8,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {t.subject}
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 1,
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{t.customer}</span>
        {t.requesterName && (
          <span style={{
            fontSize: 10, color: 'var(--text-mute)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{t.requesterName}</span>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 4,
        borderTop: '1px dashed var(--border)', paddingTop: 8,
        color: 'var(--text-mute)', fontSize: 11,
      }}>
        <AssigneeChip id={t.assignee} size={18} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <IconReply size={11} /> {t.replies}
        </span>
        <Sentiment s={t.sentiment} size={13} />
        {t.linear && (
          <span title={`Linked to ${t.linear}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            color: 'var(--violet)', fontFamily: 'var(--mono)',
            background: 'var(--violet-soft)',
            padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 600,
          }}>
            <IconLinear size={10} /> {t.linear}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {onAssign && (
          <button
            onClick={(e) => { e.stopPropagation(); onAssign(t.id); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 4, border: '1px solid var(--accent)',
              background: 'var(--accent-soft)', color: 'var(--accent)',
              fontSize: 10, fontWeight: 600, letterSpacing: 0.4,
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Assign to me
          </button>
        )}
        {stale && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            color: 'var(--danger)', fontWeight: 600, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            <IconAlert size={10} /> stale
          </span>
        )}
        {approaching && !stale && (
          <span className="pulse-dot" style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            color: 'var(--warn)', fontWeight: 600, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            <IconDot size={8} /> approaching
          </span>
        )}
      </div>
    </div>
  );
}
