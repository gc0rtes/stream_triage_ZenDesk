import { useState } from 'react';
import type { Ticket } from '../../types/ticket';
import type { ColumnKey } from '../../types/ticket';
import type { SortMode } from './Board';
import { DENSITY_PRESETS } from '../../theme';
import {
  IconFlame, IconDot, IconLinear, IconSparkle,
  IconHourglass, IconCheck, IconAlert, IconPlus, IconChevronLeft, IconSort,
} from '../icons';
import { TicketCard } from './TicketCard';

const SORT_OPTIONS: Array<{ value: SortMode; label: string; hint: string }> = [
  { value: 'newest', label: 'Newest first', hint: 'Most recently updated' },
  { value: 'oldest', label: 'Oldest first', hint: 'Longest without update' },
  { value: 'tier',   label: 'By tier',      hint: 'Enterprise → Pro → Free' },
];

const PRESSURE_SOFT_CAP = 6;
const PRESSURE_HARD_CAP = 12;

interface ColMeta { key: ColumnKey; label: string; hint: string }

interface ColumnProps {
  col: ColMeta;
  tickets: Ticket[];
  nowMs: number;
  staleHours: number;
  onOpen: (t: Ticket) => void;
  onDrop: (id: number, colKey: ColumnKey) => void;
  onAssign?: (id: number) => void;
  cardVariant: string;
  density: string;
  highlighted?: boolean;
  collapsed?: boolean;
  onToggleCollapse: () => void;
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
}

export function Column({
  col, tickets, nowMs, staleHours, onOpen, onDrop, onAssign,
  cardVariant, density, highlighted = false, collapsed = false, onToggleCollapse,
  sort, onSortChange,
}: ColumnProps) {
  const count = tickets.length;
  const pressure = Math.max(0, Math.min(1,
    (count - PRESSURE_SOFT_CAP) / (PRESSURE_HARD_CAP - PRESSURE_SOFT_CAP)));

  const urgentCount = tickets.filter(t => {
    if (t.status !== 'open') return false;
    const age = (nowMs - t.updatedAt) / 3600_000;
    return age >= staleHours * 0.75;
  }).length;

  const [over, setOver] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(true);
    e.dataTransfer.dropEffect = 'move';
  };
  const onDragLeave = () => setOver(false);
  const onDropE = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain'));
    setOver(false);
    onDrop(id, col.key);
  };

  const d = DENSITY_PRESETS[(density as keyof typeof DENSITY_PRESETS)] ?? DENSITY_PRESETS.comfortable;

  const colIcon: Record<ColumnKey, React.ReactElement> = {
    unassigned: <IconPlus    size={12} style={{ color: 'var(--warn)'    }} />,
    priority:   <IconFlame   size={13} style={{ color: 'var(--accent)'  }} />,
    standard:   <IconDot     size={10} style={{ color: 'var(--text-dim)'}} />,
    hold_dev:   <IconLinear  size={12} style={{ color: 'var(--violet)'  }} />,
    hold_fr:    <IconSparkle size={12} style={{ color: 'var(--warn)'    }} />,
    pending:    <IconHourglass size={12} style={{ color: 'var(--info)'  }} />,
    solved:     <IconCheck   size={12} style={{ color: 'var(--accent)'  }} />,
  };

  if (collapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        title={`Expand ${col.label}`}
        style={{
          width: 40, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 8, cursor: 'pointer', overflow: 'hidden',
          alignItems: 'center', paddingTop: 14, paddingBottom: 14, gap: 10,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
      >
        {colIcon[col.key]}
        <span style={{
          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
          fontSize: 11, fontWeight: 600, color: 'var(--text)',
          whiteSpace: 'nowrap', letterSpacing: 0.1,
        }}>{col.label}</span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)',
          background: 'var(--surface-2)', padding: '2px 5px',
          borderRadius: 3, fontWeight: 600,
        }}>{count}</span>
      </div>
    )
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDropE}
      style={{
        width: 308, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-2)',
        border: `1px solid ${over || highlighted ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        maxHeight: '100%',
      }}
    >
      {/* header */}
      <div style={{
        padding: `${d.headerPad}px ${d.headerPad + 2}px`,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {colIcon[col.key]}
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text)',
              letterSpacing: 0.1, whiteSpace: 'nowrap',
            }}>{col.label}</span>
          </div>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11,
            color: 'var(--text-mute)',
            background: 'var(--surface-2)', padding: '1px 6px',
            borderRadius: 3, fontWeight: 600,
          }}>{count}</span>
          <div style={{ flex: 1 }} />
          {urgentCount > 0 && (col.key === 'priority' || col.key === 'standard') && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 10, color: 'var(--warn)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <IconAlert size={10} /> {urgentCount}
            </span>
          )}
          {/* Sort button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowSortMenu(v => !v) }}
              title={`Sort: ${SORT_OPTIONS.find(o => o.value === sort)?.label}`}
              style={{
                background: showSortMenu ? 'var(--accent-soft)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: sort !== 'newest' && sort !== 'oldest' ? 'var(--accent)' : 'var(--text-mute)',
                display: 'inline-flex', padding: 2,
                borderRadius: 3, lineHeight: 1,
              }}
            >
              <IconSort size={13} />
            </button>
            {showSortMenu && (
              <>
                <div onClick={() => setShowSortMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, zIndex: 50,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                  marginTop: 4, minWidth: 200, overflow: 'hidden',
                }}>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { onSortChange(opt.value); setShowSortMenu(false) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 12px', background: sort === opt.value ? 'var(--accent-soft)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        borderLeft: sort === opt.value ? '2px solid var(--accent)' : '2px solid transparent',
                      }}
                      onMouseEnter={e => { if (sort !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)' }}
                      onMouseLeave={e => { if (sort !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: sort === opt.value ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>{opt.hint}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onToggleCollapse() }}
            title="Collapse column"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-mute)', display: 'inline-flex', padding: 2,
              borderRadius: 3, lineHeight: 1,
            }}
          >
            <IconChevronLeft size={13} />
          </button>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-mute)', marginTop: 3,
          fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{col.hint}</div>

        {/* pressure bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: 'var(--border)',
        }}>
          <div style={{
            height: '100%',
            width: `${pressure * 100}%`,
            background: pressure > 0.8 ? 'var(--danger)' :
                        pressure > 0.4 ? 'var(--warn)'   : 'var(--accent)',
            transition: 'width 0.4s, background 0.3s',
          }} />
        </div>
      </div>

      {/* body */}
      <div style={{
        flex: 1, overflow: 'auto', padding: 10,
        display: 'flex', flexDirection: 'column', gap: d.rowGap,
        scrollbarWidth: 'thin',
      }}>
        {count === 0 && (
          <div style={{
            textAlign: 'center', color: 'var(--text-mute)',
            fontSize: 11, padding: '32px 8px', fontStyle: 'italic',
          }}>Empty</div>
        )}
        {tickets.map(t => (
          <TicketCard
            key={t.id}
            t={t}
            nowMs={nowMs}
            staleHours={staleHours}
            onOpen={onOpen}
            onAssign={col.key === 'unassigned' ? onAssign : undefined}
            styleVariant={cardVariant as 'default' | 'rail' | 'minimal'}
            density={density}
          />
        ))}
      </div>
    </div>
  );
}
