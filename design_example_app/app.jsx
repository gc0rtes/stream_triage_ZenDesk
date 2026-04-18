// Main Kanban app — stitches everything together.

const App = () => {
  const nowMs = useNow();
  const [tickets, setTickets] = React.useState(SEED_TICKETS);
  const [query, setQuery] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState(new Set());
  const [assigneeFilter, setAssigneeFilter] = React.useState(new Set());
  const [selected, setSelected] = React.useState(null);
  const [editMode, setEditMode] = React.useState(false);
  const [tweaks, setTweaks] = React.useState(/*EDITMODE-BEGIN*/{
    "accent": "green",
    "density": "comfortable",
    "staleHours": 48,
    "cardVariant": "rail",
    "columnWidth": "wide",
    "showBurst": true
  }/*EDITMODE-END*/);

  // edit mode wiring
  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === '__activate_edit_mode') setEditMode(true);
      if (d.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // persist tweaks on change
  const updateTweaks = (t) => {
    setTweaks(t);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: t }, '*');
  };

  // apply css vars
  const accentHue = ACCENT_PRESETS[tweaks.accent]?.hue || 145;
  const cssVars = makeCssVars({ accentHue });

  // derived — filter and classify
  const visible = tickets.filter(t => {
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
  });

  const byColumn = {};
  COLUMNS.forEach(c => byColumn[c.key] = []);
  visible.forEach(t => {
    const k = classifyTicket(t, nowMs, tweaks.staleHours);
    if (k && byColumn[k]) byColumn[k].push(t);
  });
  // sort each col by recency of update, except priority where stale first
  Object.keys(byColumn).forEach(k => {
    if (k === 'priority') {
      byColumn[k].sort((a, b) => a.updatedAt - b.updatedAt); // oldest first
    } else if (k === 'solved') {
      byColumn[k].sort((a, b) => b.updatedAt - a.updatedAt);
    } else {
      byColumn[k].sort((a, b) => b.updatedAt - a.updatedAt);
    }
  });

  // drag-drop: map target column back to status/tag changes
  const onDrop = (id, colKey) => {
    setTickets(ts => ts.map(t => {
      if (t.id !== id) return t;
      const n = { ...t, updatedAt: Date.now() };
      if (colKey === 'priority') {
        n.status = 'open';
        if (!n.tags.includes('priority')) n.tags = [...n.tags, 'priority'];
        // force into priority by bumping updatedAt back
        n.updatedAt = hoursAgo(tweaks.staleHours + 4);
      } else if (colKey === 'standard') {
        n.status = 'open';
        n.updatedAt = Date.now();
        n.tags = n.tags.filter(tg => tg !== 'priority');
        // standard requires non-enterprise; if enterprise, demote to pro for the sim
        if (n.tier === 'enterprise') n.tier = 'pro';
      } else if (colKey === 'hold_dev') {
        n.status = 'hold'; n.holdType = 'linear';
        if (!n.linear) n.linear = 'ENG-' + (2200 + Math.floor(Math.random() * 99));
      } else if (colKey === 'hold_fr') {
        n.status = 'hold'; n.holdType = 'feature_request'; n.linear = null;
      } else if (colKey === 'pending') {
        n.status = 'pending'; n.holdType = null;
      } else if (colKey === 'solved') {
        n.status = 'solved'; n.updatedAt = Date.now();
      }
      return n;
    }));
  };

  // simulate a burst — add 5 fresh standard-open tickets
  const simulateBurst = () => {
    const samples = [
      { subject: 'Getting 401 on first request after key rotation', customer: 'Flux & Field', tier: 'pro' },
      { subject: 'Docs search returns zero results for "rate limit"', customer: 'Sola Interiors', tier: 'free' },
      { subject: 'Can we bump plan quota for the weekend?', customer: 'Motorhaus', tier: 'pro' },
      { subject: 'Trial ended early — please check billing', customer: 'Greenline Co', tier: 'free' },
      { subject: 'Notifications doubled after deploy', customer: 'Junie Apparel', tier: 'pro' },
      { subject: 'Mobile push stopped on one device', customer: 'Bleu Studio', tier: 'pro' },
    ];
    const newTickets = samples.slice(0, 5).map((s, i) => ({
      ...s, id: 48300 + Math.floor(Math.random() * 100) + i,
      status: 'open', tags: ['burst'],
      updatedAt: Date.now() - i * 60_000,
      replies: 0, sentiment: 'neutral',
      assignee: ['MK', 'JR', 'SL', 'AB'][i % 4],
      linear: null, holdType: null,
    }));
    setTickets(ts => [...newTickets, ...ts]);
  };

  const reset = () => setTickets(SEED_TICKETS);

  // age tickets artificially so the "approaching" signal moves
  // Every 30s of real time = 1 hour of simulated age (only for open tickets)
  // We do this by gently nudging updatedAt backwards.
  React.useEffect(() => {
    const id = setInterval(() => {
      setTickets(ts => ts.map(t => {
        if (t.status !== 'open') return t;
        return { ...t, updatedAt: t.updatedAt - 120_000 }; // age by 2min/tick
      }));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const colWidth = tweaks.columnWidth === 'narrow' ? 272 : 316;

  return (
    <div style={{
      ...cssVars,
      fontFamily: 'var(--sans)',
      background: 'var(--bg)',
      color: 'var(--text)',
      height: '100vh', display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <TopBar
        query={query} setQuery={setQuery}
        tierFilter={tierFilter} setTierFilter={setTierFilter}
        assigneeFilter={assigneeFilter} setAssigneeFilter={setAssigneeFilter}
        onBurst={simulateBurst} onReset={reset}
        tickets={tickets} nowMs={nowMs} staleHours={tweaks.staleHours}
        showBurst={tweaks.showBurst}
      />

      <div style={{
        flex: 1, overflow: 'auto',
        padding: '16px 18px',
        display: 'flex', gap: 14,
        alignItems: 'stretch',
      }}>
        {COLUMNS.map(col => (
          <div key={col.key} style={{ width: colWidth, flexShrink: 0, display: 'flex' }}>
            <Column
              col={col}
              tickets={byColumn[col.key] || []}
              nowMs={nowMs}
              staleHours={tweaks.staleHours}
              onOpen={setSelected}
              onDrop={onDrop}
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
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
