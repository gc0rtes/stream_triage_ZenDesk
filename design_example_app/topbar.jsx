// Top bar — logo, filters, search, burst meter, simulate button.

const BurstMeter = ({ tickets, nowMs, staleHours, onJumpToCol }) => {
  // Count pressure: urgent tickets across open cols.
  const urgent = tickets.filter(t => {
    if (t.status !== 'open') return false;
    const age = (nowMs - t.updatedAt) / 3600_000;
    return age >= staleHours * 0.75;
  });
  const stale = urgent.filter(t => (nowMs - t.updatedAt) / 3600_000 >= staleHours);
  const approaching = urgent.length - stale.length;

  const total = tickets.filter(t => t.status === 'open').length;
  const level = stale.length >= 3 ? 'critical' :
                stale.length >= 1 || approaching >= 3 ? 'elevated' : 'calm';

  const color = level === 'critical' ? 'var(--danger)' :
                level === 'elevated' ? 'var(--warn)'   : 'var(--accent)';
  const label = level === 'critical' ? 'Burst · critical' :
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
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)',
                       textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--border)' }} />

      {/* stacked bar */}
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
          <div style={{
            flex: 1, background: 'var(--accent-soft)',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)',
                       whiteSpace: 'nowrap', fontWeight: 500 }}>
          <span style={{ color: 'var(--danger)' }}>{stale.length}</span>
          <span style={{ color: 'var(--text-mute)', margin: '0 3px' }}>·</span>
          <span style={{ color: 'var(--warn)' }}>{approaching}</span>
          <span style={{ color: 'var(--text-mute)', margin: '0 3px' }}>/</span>
          <span>{total}</span>
        </span>
      </div>
    </div>
  );
};

const FilterChip = ({ active, onClick, children, color = 'var(--accent)' }) => (
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

const TopBar = ({ query, setQuery, tierFilter, setTierFilter, assigneeFilter, setAssigneeFilter,
                  onBurst, onReset, tickets, nowMs, staleHours, showBurst }) => (
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
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tickets, customers, tags"
        style={{
          background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--text)', fontSize: 12, flex: 1,
          fontFamily: 'inherit',
        }}
      />
      {query && <IconX size={12} style={{ color: 'var(--text-mute)', cursor: 'pointer' }}
                        onClick={() => setQuery('')} />}
    </div>

    {/* tier filters */}
    <div style={{ display: 'flex', gap: 4 }}>
      {['enterprise', 'pro', 'free'].map(tier => (
        <FilterChip key={tier}
          active={tierFilter.has(tier)}
          onClick={() => {
            const n = new Set(tierFilter);
            n.has(tier) ? n.delete(tier) : n.add(tier);
            setTierFilter(n);
          }}
        >{TIER_META[tier].label}</FilterChip>
      ))}
    </div>

    {/* assignee filters */}
    <div style={{ display: 'flex', gap: 4 }}>
      {Object.keys(ASSIGNEES).map(id => (
        <button key={id} onClick={() => {
          const n = new Set(assigneeFilter);
          n.has(id) ? n.delete(id) : n.add(id);
          setAssigneeFilter(n);
        }} style={{
          padding: 0, border: 'none', background: 'transparent',
          cursor: 'pointer', opacity: assigneeFilter.size === 0 || assigneeFilter.has(id) ? 1 : 0.3,
          transition: 'opacity 0.15s',
        }}>
          <AssigneeChip id={id} size={22} />
        </button>
      ))}
    </div>

    <div style={{ flex: 1 }} />

    {showBurst && <BurstMeter tickets={tickets} nowMs={nowMs} staleHours={staleHours} />}

    <button onClick={onBurst} className="btn-accent" style={{
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
    <button onClick={onReset} title="Reset" style={{
      padding: 7, borderRadius: 5,
      background: 'transparent', color: 'var(--text-dim)',
      border: '1px solid var(--border)', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center',
    }}>
      <IconRefresh size={13} />
    </button>
  </div>
);

Object.assign(window, { TopBar, BurstMeter, FilterChip });
