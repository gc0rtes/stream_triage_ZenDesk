import { useState } from 'react';
import type { Ticket } from '../types/ticket';
import { TIER_META, ASSIGNEES } from '../data/columns';
import { THEMES } from '../theme';
import type { ThemeKey } from '../theme';
import { AssigneeChip } from './Board/TicketCard';
import {
  IconSearch, IconX, IconPlus, IconRefresh, IconColumns, IconGear, IconCheck,
} from './icons';

interface BurstMeterProps {
  tickets: Ticket[];
  nowMs: number;
  staleHours: number;
}

export function BurstMeter({ tickets, nowMs, staleHours }: BurstMeterProps) {
  const open = tickets.filter(t => t.status === 'open');
  const urgent = open.filter(t => {
    const age = (nowMs - t.updatedAt) / 3600_000;
    return age >= staleHours * 0.75;
  });
  const stale = urgent.filter(t => (nowMs - t.updatedAt) / 3600_000 >= staleHours);
  const approaching = urgent.length - stale.length;
  const total = open.length;

  const level =
    stale.length >= 3 ? 'critical' :
    stale.length >= 1 || approaching >= 3 ? 'elevated' : 'calm';

  const color =
    level === 'critical' ? 'var(--danger)' :
    level === 'elevated' ? 'var(--warn)' : 'var(--accent)';

  const label =
    level === 'critical' ? 'Burst · critical' :
    level === 'elevated' ? 'Burst · elevated' : 'Steady';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '6px 14px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      minWidth: 340,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color,
          boxShadow: level !== 'calm' ? `0 0 8px ${color}` : 'none',
          animation: level === 'critical' ? 'pulseHard 1.2s infinite' : 'none',
        }} />
        <span style={{
          fontSize: 11, fontWeight: 600, color: 'var(--text)',
          textTransform: 'uppercase', letterSpacing: 0.6,
        }}>{label}</span>
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--border)' }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          flex: 1, height: 6, borderRadius: 3, overflow: 'hidden',
          background: 'var(--bg-2)', display: 'flex',
        }}>
          <div style={{
            width: `${(stale.length / Math.max(total, 1)) * 100}%`,
            background: 'var(--danger)',
          }} />
          <div style={{
            width: `${(approaching / Math.max(total, 1)) * 100}%`,
            background: 'var(--warn)',
          }} />
          <div style={{ flex: 1, background: 'var(--accent-soft)' }} />
        </div>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)',
          whiteSpace: 'nowrap', fontWeight: 500,
        }}>
          <span style={{ color: 'var(--danger)' }}>{stale.length}</span>
          <span style={{ color: 'var(--text-mute)', margin: '0 3px' }}>·</span>
          <span style={{ color: 'var(--warn)' }}>{approaching}</span>
          <span style={{ color: 'var(--text-mute)', margin: '0 3px' }}>/</span>
          <span>{total}</span>
        </span>
      </div>
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}

function FilterChip({ active, onClick, children, color = 'var(--accent)' }: FilterChipProps) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--accent-soft)' : 'transparent',
      border: `1px solid ${active ? color : 'var(--border)'}`,
      color: active ? color : 'var(--text-dim)',
      padding: '5px 10px', borderRadius: 4,
      fontSize: 11, fontWeight: 500, letterSpacing: 0.2,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
      textTransform: 'uppercase', fontFamily: 'inherit',
    }}>{children}</button>
  );
}

interface TopBarProps {
  query: string;
  setQuery: (q: string) => void;
  tierFilter: Set<string>;
  setTierFilter: (s: Set<string>) => void;
  assigneeFilter: Set<string>;
  setAssigneeFilter: (s: Set<string>) => void;
  onBurst: () => void;
  onReset: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onToggleColConfig: () => void;
  colConfigActive: boolean;
  tickets: Ticket[];
  nowMs: number;
  staleHours: number;
  showBurst: boolean;
  theme: string;
  onThemeChange: (t: ThemeKey) => void;
}

export function TopBar({
  query, setQuery,
  tierFilter, setTierFilter,
  assigneeFilter, setAssigneeFilter,
  onBurst, onRefresh, isRefreshing, onToggleColConfig, colConfigActive,
  tickets, nowMs, staleHours, showBurst,
  theme, onThemeChange,
}: TopBarProps) {
  const [showPrefs, setShowPrefs] = useState(false);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 18px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      {/* logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-ink)', fontWeight: 800, fontSize: 13,
          fontFamily: 'var(--mono)',
        }}>T</div>
        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14, letterSpacing: -0.2 }}>
          Triage
        </span>
        <span style={{
          fontSize: 10, color: 'var(--text-mute)', fontFamily: 'var(--mono)',
          background: 'var(--surface-2)', padding: '2px 5px', borderRadius: 3,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>Support · Live</span>
      </div>

      {/* search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 6,
        padding: '6px 10px', minWidth: 240,
      }}>
        <IconSearch size={13} style={{ color: 'var(--text-mute)' }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tickets, customers, tags"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 12, flex: 1,
            fontFamily: 'inherit',
          }}
        />
        {query && (
          <span onClick={() => setQuery('')} style={{ cursor: 'pointer', display: 'inline-flex' }}>
            <IconX size={12} style={{ color: 'var(--text-mute)' }} />
          </span>
        )}
      </div>

      {/* tier filters */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['enterprise', 'pro', 'free'] as const).map(tier => (
          <FilterChip
            key={tier}
            active={tierFilter.has(tier)}
            onClick={() => {
              const n = new Set(tierFilter);
              if (n.has(tier)) { n.delete(tier); } else { n.add(tier); }
              setTierFilter(n);
            }}
          >{TIER_META[tier].label}</FilterChip>
        ))}
      </div>

      {/* assignee filters */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Object.keys(ASSIGNEES).map(id => (
          <button
            key={id}
            onClick={() => {
              const n = new Set(assigneeFilter);
              if (n.has(id)) { n.delete(id); } else { n.add(id); }
              setAssigneeFilter(n);
            }}
            style={{
              padding: 0, border: 'none', background: 'transparent',
              cursor: 'pointer',
              opacity: assigneeFilter.size === 0 || assigneeFilter.has(id) ? 1 : 0.3,
              transition: 'opacity 0.15s',
            }}
          >
            <AssigneeChip id={id} size={22} />
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {showBurst && (
        <BurstMeter tickets={tickets} nowMs={nowMs} staleHours={staleHours} />
      )}

      <button onClick={onBurst} style={{
        padding: '7px 12px', borderRadius: 5,
        background: 'var(--accent)', color: 'var(--accent-ink)',
        border: 'none', cursor: 'pointer',
        fontWeight: 600, fontSize: 11, letterSpacing: 0.4,
        textTransform: 'uppercase',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: 'inherit',
      }}>
        <IconPlus size={12} /> Simulate burst
      </button>

      <button onClick={onToggleColConfig} title="Configure columns" style={{
        padding: 7, borderRadius: 5,
        background: colConfigActive ? 'var(--accent-soft)' : 'transparent',
        color: colConfigActive ? 'var(--accent)' : 'var(--text-dim)',
        border: `1px solid ${colConfigActive ? 'var(--accent)' : 'var(--border)'}`,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
      }}>
        <IconColumns size={13} />
      </button>

      <button onClick={onRefresh} disabled={isRefreshing} title="Refresh tickets" style={{
        padding: 7, borderRadius: 5,
        background: 'transparent', color: 'var(--text-dim)',
        border: '1px solid var(--border)', cursor: isRefreshing ? 'default' : 'pointer',
        display: 'inline-flex', alignItems: 'center',
        opacity: isRefreshing ? 0.6 : 1,
      }}>
        <IconRefresh size={13} style={{
          animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
        }} />
      </button>

      {/* preferences gear */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowPrefs(v => !v)}
          title="Preferences"
          style={{
            padding: 7, borderRadius: 5,
            background: showPrefs ? 'var(--accent-soft)' : 'transparent',
            color: showPrefs ? 'var(--accent)' : 'var(--text-dim)',
            border: `1px solid ${showPrefs ? 'var(--accent)' : 'var(--border)'}`,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
          }}
        >
          <IconGear size={13} />
        </button>

        {showPrefs && (
          <>
            <div onClick={() => setShowPrefs(false)} style={{ position: 'fixed', inset: 0, zIndex: 25 }} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 30,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              padding: '14px 16px', minWidth: 260,
            }}>
              <div style={{
                fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)',
                textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <IconGear size={10} /> Preferences
              </div>

              <div style={{
                fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6,
                color: 'var(--text-mute)', marginBottom: 8, fontWeight: 600,
              }}>Theme</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, def]) => {
                  const active = theme === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { onThemeChange(key); setShowPrefs(false); }}
                      style={{
                        background: active ? 'var(--accent-soft)' : 'var(--bg-2)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 6, padding: '10px 10px 8px',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        {def.swatches.map((color, i) => (
                          <div key={i} style={{
                            width: i === 0 ? 18 : 12, height: i === 0 ? 18 : 12,
                            borderRadius: '50%', background: color,
                            border: '1px solid rgba(255,255,255,0.1)',
                            flexShrink: 0,
                          }} />
                        ))}
                        {active && (
                          <div style={{ marginLeft: 'auto' }}>
                            <IconCheck size={11} style={{ color: 'var(--accent)' }} />
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 600,
                        color: active ? 'var(--accent)' : 'var(--text)',
                        whiteSpace: 'nowrap',
                      }}>{def.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
