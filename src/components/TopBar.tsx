import { useState } from 'react';
import type { Ticket } from '../types/ticket';
import { TIER_META } from '../data/columns';
import { THEMES } from '../theme';
import type { ThemeKey } from '../theme';
import {
  IconSearch, IconX, IconRefresh, IconColumns, IconGear, IconCheck,
} from './icons';
import { useAuth } from '../context/AuthContext';
import type { ZDAgent } from '../api/tickets';
import { StatsBar } from './StatsBar';

interface ColleagueChipProps {
  agent: ZDAgent;
  active: boolean;
  onToggle: () => void;
}

function ColleagueChip({ agent, active, onToggle }: ColleagueChipProps) {
  const initials = agent.name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
  const hue = agent.id % 360;
  return (
    <button
      onClick={onToggle}
      title={agent.name}
      style={{
        width: 26, height: 26, borderRadius: '50%', padding: 0,
        border: active ? `2px solid oklch(60% 0.18 ${hue})` : '2px solid transparent',
        background: `oklch(${active ? '55%' : '40%'} 0.14 ${hue})`,
        color: '#fff',
        fontSize: 9, fontWeight: 700,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        opacity: active ? 1 : 0.7,
        transition: 'opacity 0.15s, border-color 0.15s, background 0.15s',
        flexShrink: 0,
      }}
    >
      {initials}
    </button>
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
  onRefresh: () => void;
  isRefreshing: boolean;
  onToggleColConfig: () => void;
  colConfigActive: boolean;
  tickets: Ticket[];
  nowMs: number;
  staleHours: number;
  accentHue: number;
  theme: string;
  onThemeChange: (t: ThemeKey) => void;
  onStatsOpenTicket?: (ticketId: number) => void;
}

export function TopBar({
  query, setQuery,
  tierFilter, setTierFilter,
  onRefresh, isRefreshing, onToggleColConfig, colConfigActive,
  tickets, nowMs, staleHours, accentHue,
  theme, onThemeChange, onStatsOpenTicket,
}: TopBarProps) {
  const [showPrefs, setShowPrefs] = useState(false);
  const { user, colleagues, viewedAgentId, setViewedAgentId, logout } = useAuth();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 18px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      {/* logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 6, flexShrink: 0 }}>
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
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh tickets"
          style={{
            padding: 5, borderRadius: 5, marginLeft: 2,
            background: 'transparent', color: 'var(--text-dim)',
            border: '1px solid var(--border)', cursor: isRefreshing ? 'default' : 'pointer',
            display: 'inline-flex', alignItems: 'center',
            opacity: isRefreshing ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          <IconRefresh size={13} style={{
            animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
          }} />
        </button>
      </div>

      {/* search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 6,
        padding: '6px 10px', minWidth: 220, flexShrink: 0,
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
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
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

      {/* Me + colleague chips — click to choose whose board to view */}
      {(user || colleagues.length > 0) && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
          {user && (
            <button
              type="button"
              onClick={() => setViewedAgentId(null)}
              title={`My board (${user.name})`}
              style={{
                width: 26, height: 26, borderRadius: '50%', padding: 0,
                border: viewedAgentId == null ? `2px solid oklch(60% 0.18 ${user.id % 360})` : '2px solid transparent',
                background: `oklch(${viewedAgentId == null ? '55%' : '40%'} 0.14 ${user.id % 360})`,
                color: '#fff',
                fontSize: 9, fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                opacity: viewedAgentId == null ? 1 : 0.7,
                transition: 'opacity 0.15s, border-color 0.15s, background 0.15s',
                flexShrink: 0,
              }}
            >
              {user.name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)}
            </button>
          )}
          {colleagues.filter(a => a.id !== user?.id).map(agent => (
            <ColleagueChip
              key={agent.id}
              agent={agent}
              active={viewedAgentId === agent.id}
              onToggle={() => setViewedAgentId(viewedAgentId === agent.id ? null : agent.id)}
            />
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* stats */}
      <StatsBar
        tickets={tickets}
        nowMs={nowMs}
        staleHours={staleHours}
        accentHue={accentHue}
        onOpenTicket={onStatsOpenTicket}
      />

      {/* current user + logout */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: `oklch(55% 0.18 ${user.id % 360})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>
            {user.name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name.split(' ')[0]}
          </span>
          <button
            onClick={logout}
            title="Sign out"
            style={{
              padding: '4px 8px', borderRadius: 4,
              background: 'transparent', color: 'var(--text-mute)',
              border: '1px solid var(--border)', cursor: 'pointer',
              fontSize: 11, fontFamily: 'inherit',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--danger)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-mute)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
          >
            Logout
          </button>
        </div>
      )}

      <button onClick={onToggleColConfig} title="Configure columns" style={{
        padding: 7, borderRadius: 5,
        background: colConfigActive ? 'var(--accent-soft)' : 'transparent',
        color: colConfigActive ? 'var(--accent)' : 'var(--text-dim)',
        border: `1px solid ${colConfigActive ? 'var(--accent)' : 'var(--border)'}`,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
        flexShrink: 0,
      }}>
        <IconColumns size={13} />
      </button>

      {/* preferences gear */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
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
