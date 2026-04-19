import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Ticket, ColumnKey } from '../../types/ticket';
import { COLUMNS } from '../../data/columns';
import { classifyTicket } from '../../utils/classifyTicket';
import { makeCssVars, ACCENT_PRESETS } from '../../theme';
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
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<Set<string>>(new Set());
  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set());
  const [tweaks, setTweaks] = useState<Tweaks>({
    accent: 'green',
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
      if (k === 'priority') {
        cols[k].sort((a, b) => a.updatedAt - b.updatedAt);
      } else {
        cols[k].sort((a, b) => b.updatedAt - a.updatedAt);
      }
    });
    return cols;
  }, [visible, nowMs, tweaks.staleHours]);

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

  const accentHue = ACCENT_PRESETS[tweaks.accent as keyof typeof ACCENT_PRESETS]?.hue ?? 145;
  const cssVars = makeCssVars({ accentHue });
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
        tickets={allTickets}
        nowMs={nowMs}
        staleHours={tweaks.staleHours}
        showBurst={tweaks.showBurst}
      />
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px 18px',
        display: 'flex',
        gap: 14,
        alignItems: 'stretch',
      }}>
        {COLUMNS.map(col => (
          <div key={col.key} style={{ width: colWidth, flexShrink: 0, display: 'flex' }}>
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
            />
          </div>
        ))}
      </div>
      <SidePanel ticket={selected} onClose={() => setSelected(null)} nowMs={nowMs} />
      <TweaksPanel tweaks={tweaks} setTweaks={updateTweaks} visible={editMode} />
    </div>
  );
}
