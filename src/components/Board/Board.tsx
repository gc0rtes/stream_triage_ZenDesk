import { useState, useEffect, useMemo, useCallback } from 'react';
export type SortMode = 'newest' | 'oldest' | 'tier' | 'requester' | 'agent';
import type { CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Ticket, ColumnKey } from '../../types/ticket';

const TIER_ORDER: Record<string, number> = { enterprise: 0, pro: 1, free: 2 };

function sortTickets(tickets: Ticket[], mode: SortMode): Ticket[] {
  const s = [...tickets];
  if (mode === 'tier')
    return s.sort((a, b) => (TIER_ORDER[a.tier] - TIER_ORDER[b.tier]) || (a.updatedAt - b.updatedAt));
  if (mode === 'oldest')
    return s.sort((a, b) => a.updatedAt - b.updatedAt);
  if (mode === 'requester')
    return s.sort((a, b) => (b.lastRequesterReplyAt ?? 0) - (a.lastRequesterReplyAt ?? 0));
  if (mode === 'agent')
    return s.sort((a, b) => (a.lastAgentReplyAt ?? Number.MAX_SAFE_INTEGER) - (b.lastAgentReplyAt ?? Number.MAX_SAFE_INTEGER));
  // newest (default)
  return s.sort((a, b) => b.updatedAt - a.updatedAt);
}

const DEFAULT_COL_SORT: Record<ColumnKey, SortMode> = {
  unassigned: 'newest',
  priority:   'tier',
  standard:   'newest',
  hold_dev:   'tier',
  hold_fr:    'tier',
  pending:    'oldest',
  solved:     'newest',
};
import { COLUMNS } from '../../data/columns';
import { classifyTicket } from '../../utils/classifyTicket';
import { makeCssVars, ACCENT_PRESETS, THEMES } from '../../theme';
import type { ThemeKey } from '../../theme';
import { useTickets } from '../../hooks/useTickets';
import { useIncrementalSync } from '../../hooks/useIncrementalSync';
import { useUpdateTicket } from '../../hooks/useUpdateTicket';
import { useAssignTicket } from '../../hooks/useAssignTicket';
import { useNow } from '../../hooks/useNow';
import { TopBar } from '../TopBar';
import { Column } from './Column';
import { SidePanel } from '../SidePanel';
import { TweaksPanel } from '../TweaksPanel';
import type { Tweaks } from '../TweaksPanel';

function applyDrop(t: Ticket, colKey: ColumnKey, staleHours: number): Ticket {
  const n: Ticket = { ...t, updatedAt: Date.now() };
  if (colKey === 'priority') {
    n.status = 'open';
    if (!n.tags.includes('priority')) n.tags = [...n.tags, 'priority'];
    n.updatedAt = Date.now() - (staleHours + 4) * 3_600_000;
  } else if (colKey === 'standard') {
    n.status = 'open';
    n.updatedAt = Date.now();
    n.tags = n.tags.filter(tg => tg !== 'priority');
    if (n.tier === 'enterprise') n.tier = 'pro';
  } else if (colKey === 'hold_dev') {
    n.status = 'hold';
    n.holdType = 'linear';
    n.tags = n.tags.filter(tg => tg !== 'feature_request_v2');
    if (!n.linear) n.linear = 'ENG-' + (2200 + Math.floor(Math.random() * 99));
  } else if (colKey === 'hold_fr') {
    n.status = 'hold';
    n.holdType = 'feature_request';
    n.linear = null;
    if (!n.tags.includes('feature_request_v2')) n.tags = [...n.tags, 'feature_request_v2'];
  } else if (colKey === 'pending') {
    n.status = 'pending';
    n.holdType = null;
  } else if (colKey === 'solved') {
    n.status = 'solved';
    n.updatedAt = Date.now();
  }
  return n;
}

const BURST_SAMPLES: Array<{ subject: string; customer: string; tier: 'pro' | 'free' }> = [
  { subject: 'Getting 401 on first request after key rotation', customer: 'Flux & Field', tier: 'pro' },
  { subject: 'Docs search returns zero results for "rate limit"', customer: 'Sola Interiors', tier: 'free' },
  { subject: 'Can we bump plan quota for the weekend?', customer: 'Motorhaus', tier: 'pro' },
  { subject: 'Trial ended early — please check billing', customer: 'Greenline Co', tier: 'free' },
  { subject: 'Notifications doubled after deploy', customer: 'Junie Apparel', tier: 'pro' },
];

const ASSIGNEE_CYCLE = ['MK', 'JR', 'SL', 'AB'] as const;

export default function Board() {
  const { data: serverTickets = [], isFetching, refetch } = useTickets();
  useIncrementalSync();
  const mutation = useUpdateTicket();
  const assignMutation = useAssignTicket();
  const queryClient = useQueryClient();
  const nowMs = useNow();

  const [burstTickets, setBurstTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showColConfig, setShowColConfig] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(
    () => new Set(JSON.parse(localStorage.getItem('zd-hidden-cols') ?? '[]') as ColumnKey[])
  );
  const [collapsedColumns, setCollapsedColumns] = useState<Set<ColumnKey>>(
    () => new Set(JSON.parse(localStorage.getItem('zd-collapsed-cols') ?? '[]') as ColumnKey[])
  );
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<Set<string>>(new Set());
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set());
  const [columnSorts, setColumnSorts] = useState<Record<ColumnKey, SortMode>>(DEFAULT_COL_SORT);
  const [tweaks, setTweaks] = useState<Tweaks>({
    accent: 'green',
    theme: (localStorage.getItem('zd-theme') ?? 'warm-coal'),
    density: 'comfortable',
    staleHours: 48,
    cardVariant: 'rail',
    columnWidth: 'wide',
    showBurst: true,
  });

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string };
      if (!d || typeof d !== 'object') return;
      if (d.type === '__activate_edit_mode') setEditMode(true);
      if (d.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const updateTweaks = useCallback((t: Tweaks) => {
    setTweaks(t);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: t }, '*');
  }, []);

  const handleThemeChange = useCallback((t: ThemeKey) => {
    localStorage.setItem('zd-theme', t);
    setTweaks(prev => ({ ...prev, theme: t }));
  }, []);

  // Artificial aging: nudge open ticket timestamps back 2 min every 60s
  useEffect(() => {
    const id = setInterval(() => {
      queryClient.setQueryData<Ticket[]>(['tickets'], ts =>
        ts?.map(t => t.status !== 'open' ? t : { ...t, updatedAt: t.updatedAt - 120_000 }) ?? []
      );
      setBurstTickets(ts =>
        ts.map(t => t.status !== 'open' ? t : { ...t, updatedAt: t.updatedAt - 120_000 })
      );
    }, 60_000);
    return () => clearInterval(id);
  }, [queryClient]);

  const allTickets = useMemo(
    () => [...burstTickets, ...serverTickets],
    [burstTickets, serverTickets],
  );

  const visible = useMemo(() => allTickets.filter(t => {
    if (query) {
      const q = query.toLowerCase();
      if (!(`${t.id}`.includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.customer.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q)))) return false;
    }
    if (tierFilter.size && !tierFilter.has(t.tier)) return false;
    if (assigneeFilter.size && !assigneeFilter.has(t.assignee)) return false;
    return true;
  }), [allTickets, query, tierFilter, assigneeFilter]);

  const byColumn = useMemo(() => {
    const cols: Record<string, Ticket[]> = {};
    COLUMNS.forEach(c => { cols[c.key] = []; });
    visible.forEach(t => {
      const k = classifyTicket(t, nowMs, tweaks.staleHours);
      if (k && cols[k]) cols[k].push(t);
    });
    Object.keys(cols).forEach(k => {
      cols[k] = sortTickets(cols[k], columnSorts[k as ColumnKey] ?? 'newest');
    });
    return cols;
  }, [visible, nowMs, tweaks.staleHours, columnSorts]);

  const onDrop = useCallback((id: number, colKey: ColumnKey) => {
    const isBurst = burstTickets.some(t => t.id === id);
    if (isBurst) {
      setBurstTickets(ts =>
        ts.map(t => t.id !== id ? t : applyDrop(t, colKey, tweaks.staleHours))
      );
      return;
    }
    const current = queryClient.getQueryData<Ticket[]>(['tickets'])?.find(t => t.id === id);
    if (!current) return;
    const updated = applyDrop(current, colKey, tweaks.staleHours);
    mutation.mutate({ id, patch: updated });
  }, [burstTickets, queryClient, mutation, tweaks.staleHours]);

  const simulateBurst = useCallback(() => {
    const newTickets: Ticket[] = BURST_SAMPLES.map((s, i) => ({
      ...s,
      id: 48300 + Math.floor(Math.random() * 100) + i,
      status: 'open',
      tags: ['burst'],
      updatedAt: Date.now() - i * 60_000,
      replies: 0,
      sentiment: 'neutral',
      assignee: ASSIGNEE_CYCLE[i % 4],
      linear: null,
      holdType: null,
      requesterName: null,
      requesterEmail: null,
    lastRequesterReplyAt: null,
    lastAgentReplyAt: null,
    }));
    setBurstTickets(ts => [...newTickets, ...ts]);
  }, []);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const reset = useCallback(() => {
    setBurstTickets([]);
    void queryClient.invalidateQueries({ queryKey: ['tickets'] });
  }, [queryClient]);

  const toggleHidden = useCallback((key: ColumnKey) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem('zd-hidden-cols', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const toggleCollapsed = useCallback((key: ColumnKey) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem('zd-collapsed-cols', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const accentHue = ACCENT_PRESETS[tweaks.accent as keyof typeof ACCENT_PRESETS]?.hue ?? 145;
  const themeKey = (tweaks.theme in THEMES ? tweaks.theme : 'warm-coal') as ThemeKey;
  const cssVars = makeCssVars({ accentHue, theme: themeKey });
  const colWidth = tweaks.columnWidth === 'narrow' ? 272 : 316;

  return (
    <div style={{
      ...cssVars as CSSProperties,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'var(--bg)',
      color: 'var(--text)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <TopBar
        query={query}
        setQuery={setQuery}
        tierFilter={tierFilter}
        setTierFilter={setTierFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        onBurst={simulateBurst}
        onReset={reset}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        onToggleColConfig={() => setShowColConfig(v => !v)}
        colConfigActive={showColConfig}
        tickets={allTickets}
        nowMs={nowMs}
        staleHours={tweaks.staleHours}
        showBurst={tweaks.showBurst}
        theme={tweaks.theme}
        onThemeChange={handleThemeChange}
      />
      <div style={{ position: 'relative' }}>
        {showColConfig && (
          <>
            <div onClick={() => setShowColConfig(false)} style={{ position: 'fixed', inset: 0, zIndex: 25 }} />
            <div style={{
              position: 'absolute', top: 8, right: 18, zIndex: 30,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              padding: '12px 16px', minWidth: 220,
            }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                Visible columns
              </div>
              {COLUMNS.map(col => (
                <label key={col.key} style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '5px 0', fontSize: 12, color: 'var(--text)', userSelect: 'none',
                }}>
                  <input
                    type="checkbox"
                    checked={!hiddenColumns.has(col.key)}
                    onChange={() => toggleHidden(col.key)}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                  {col.label}
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
                    {byColumn[col.key]?.length ?? 0}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px 18px',
        display: 'flex',
        gap: 14,
        alignItems: 'stretch',
      }}>
        {COLUMNS.filter(col => !hiddenColumns.has(col.key)).map(col => {
          const isCollapsed = collapsedColumns.has(col.key);
          return (
            <div key={col.key} style={{ width: isCollapsed ? 40 : colWidth, flexShrink: 0, display: 'flex' }}>
              <Column
                col={col}
                tickets={byColumn[col.key] ?? []}
                nowMs={nowMs}
                staleHours={tweaks.staleHours}
                onOpen={setSelected}
                onDrop={onDrop}
                onAssign={(id) => assignMutation.mutate(id)}
                cardVariant={tweaks.cardVariant}
                density={tweaks.density}
                collapsed={isCollapsed}
                onToggleCollapse={() => toggleCollapsed(col.key)}
                sort={columnSorts[col.key]}
                onSortChange={(s) => setColumnSorts(prev => ({ ...prev, [col.key]: s }))}
              />
            </div>
          );
        })}
      </div>
      <SidePanel ticket={selected} onClose={() => setSelected(null)} nowMs={nowMs} />
      <TweaksPanel tweaks={tweaks} setTweaks={updateTweaks} visible={editMode} />
    </div>
  );
}
