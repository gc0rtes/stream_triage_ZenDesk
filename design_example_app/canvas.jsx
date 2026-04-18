// Design canvas with variation artboards.
// Each artboard shows a static slice of the Kanban in a different direction.

const VAR_CSS = makeCssVars({ accentHue: 145 });

// A shared set of pre-classified sample tickets to keep the mini-boards simple
const sampleColumn = (key, count) => {
  const byStatus = {
    priority: SEED_TICKETS.filter(t => t.tier === 'enterprise' && t.status === 'open'),
    standard: SEED_TICKETS.filter(t => t.status === 'open' && t.tier !== 'enterprise'),
    hold_dev: SEED_TICKETS.filter(t => t.status === 'hold' && t.holdType === 'linear'),
    hold_fr:  SEED_TICKETS.filter(t => t.status === 'hold' && t.holdType === 'feature_request'),
    pending:  SEED_TICKETS.filter(t => t.status === 'pending'),
    solved:   SEED_TICKETS.filter(t => t.status === 'solved'),
  };
  return (byStatus[key] || []).slice(0, count);
};

const MiniColumn = ({ col, tickets, cardVariant = 'rail', density = 'comfortable', nowMs, staleHours = 48 }) => (
  <div style={{
    width: 260, background: 'var(--bg-2)',
    border: '1px solid var(--border)', borderRadius: 6,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    flexShrink: 0,
  }}>
    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)',
                  background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{col.label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)',
                       background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3 }}>
          {tickets.length}
        </span>
      </div>
    </div>
    <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tickets.map(t => (
        <TicketCard key={t.id} t={t} nowMs={nowMs} staleHours={staleHours}
                    styleVariant={cardVariant} density={density} />
      ))}
    </div>
  </div>
);

const Artboard = ({ title, children, width = 720, height = 480, style }) => (
  <div style={{ width, flexShrink: 0 }}>
    <div style={{ fontSize: 12, color: 'rgba(60,50,40,0.75)', fontWeight: 600,
                  marginBottom: 8, letterSpacing: 0.2 }}>{title}</div>
    <div style={{
      ...VAR_CSS,
      width, height,
      background: 'var(--bg)',
      borderRadius: 8, overflow: 'hidden',
      border: '1px solid oklch(0.14 0.008 60)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 12px 30px rgba(0,0,0,0.12)',
      fontFamily: 'var(--sans)', color: 'var(--text)',
      ...style,
    }}>
      {children}
    </div>
  </div>
);

const CanvasApp = () => {
  const nowMs = useNow();

  return (
    <DesignCanvas>
      <div style={{ padding: '0 60px 32px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(40,30,20,0.92)',
                      letterSpacing: -0.4, marginBottom: 6 }}>
          Triage · Kanban variations
        </div>
        <div style={{ fontSize: 14, color: 'rgba(60,50,40,0.65)', maxWidth: 640, lineHeight: 1.5 }}>
          Explorations of card style, column pressure, and burst-moment layouts. The interactive
          prototype lives in <span style={{ fontFamily: 'var(--mono)' }}>Triage Kanban.html</span> —
          these are static design choices to pull in or reject.
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 16, alignItems: 'center',
                      fontSize: 12, color: 'rgba(60,50,40,0.55)' }}>
          <span>Scroll to pan · Pinch or ⌘+scroll to zoom</span>
        </div>
      </div>

      {/* Section 1: Card style variants */}
      <DCSection title="1. Card style" subtitle="Three takes on the primary ticket card — same data, different visual weight.">
        <Artboard title="A · Default card" width={320} height={460}>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sampleColumn('priority', 2).map(t => (
              <TicketCard key={t.id} t={t} nowMs={nowMs} staleHours={48}
                          styleVariant="default" density="comfortable" />
            ))}
            {sampleColumn('standard', 1).map(t => (
              <TicketCard key={t.id} t={t} nowMs={nowMs} staleHours={48}
                          styleVariant="default" density="comfortable" />
            ))}
          </div>
        </Artboard>
        <Artboard title="B · Left rail (recommended)" width={320} height={460}>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sampleColumn('priority', 2).map(t => (
              <TicketCard key={t.id} t={t} nowMs={nowMs} staleHours={48}
                          styleVariant="rail" density="comfortable" />
            ))}
            {sampleColumn('standard', 1).map(t => (
              <TicketCard key={t.id} t={t} nowMs={nowMs} staleHours={48}
                          styleVariant="rail" density="comfortable" />
            ))}
          </div>
        </Artboard>
        <Artboard title="C · Minimal (list-dense)" width={320} height={460}>
          <div style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            {sampleColumn('priority', 2).map(t => (
              <TicketCard key={t.id} t={t} nowMs={nowMs} staleHours={48}
                          styleVariant="minimal" density="compact" />
            ))}
            {sampleColumn('standard', 2).map(t => (
              <TicketCard key={t.id} t={t} nowMs={nowMs} staleHours={48}
                          styleVariant="minimal" density="compact" />
            ))}
          </div>
        </Artboard>
        <DCPostIt top={-10} left={-80} rotate={-4} width={150}>
          B keeps status legible without the color of A dominating.
        </DCPostIt>
      </DCSection>

      {/* Section 2: Density comparison */}
      <DCSection title="2. Density" subtitle="How many tickets fit in one column at each density setting.">
        {['compact', 'comfortable', 'roomy'].map(d => (
          <Artboard key={d} title={`${d} density`} width={300} height={520}>
            <MiniColumn col={COLUMNS[1]} tickets={sampleColumn('standard', 5)}
                        cardVariant="rail" density={d} nowMs={nowMs} />
          </Artboard>
        ))}
      </DCSection>

      {/* Section 3: Column pressure states */}
      <DCSection title="3. Column pressure" subtitle="What the Standard column looks like at calm, elevated, and critical load.">
        <Artboard title="Calm · 3 tickets" width={300} height={440}>
          <MiniColumn col={COLUMNS[1]} tickets={sampleColumn('standard', 3)}
                      cardVariant="rail" density="comfortable" nowMs={nowMs} />
        </Artboard>
        <Artboard title="Elevated · 6 tickets" width={300} height={440}>
          <MiniColumn col={COLUMNS[1]} tickets={sampleColumn('standard', 5)}
                      cardVariant="rail" density="compact" nowMs={nowMs} />
        </Artboard>
        <Artboard title="Critical · stale highlighted" width={300} height={440}>
          <MiniColumn col={COLUMNS[0]} tickets={sampleColumn('priority', 4)}
                      cardVariant="rail" density="comfortable" nowMs={nowMs} />
        </Artboard>
        <DCPostIt top={-10} right={-50} rotate={3} width={160}>
          The stale rail + pulsing outline is the key CS bottleneck signal.
        </DCPostIt>
      </DCSection>

      {/* Section 4: Burst meter variants */}
      <DCSection title="4. Burst meter" subtitle="Three approaches to signalling overall queue health.">
        <Artboard title="A · Stacked bar (in-use)" width={460} height={140}>
          <div style={{ padding: 20, display: 'flex', alignItems: 'center', height: '100%' }}>
            <BurstMeter tickets={SEED_TICKETS} nowMs={nowMs} staleHours={48} />
          </div>
        </Artboard>
        <Artboard title="B · Big number card" width={260} height={140}>
          <div style={{ padding: 16, background: 'var(--surface)', height: '100%',
                         display: 'flex', flexDirection: 'column', justifyContent: 'center',
                         gap: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase',
                          letterSpacing: 0.6, fontWeight: 600 }}>Burst pressure</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--warn)',
                             fontFamily: 'var(--mono)', lineHeight: 1 }}>7</span>
              <span style={{ color: 'var(--text-mute)', fontSize: 12 }}>/ 12 tickets stale-bound</span>
            </div>
            <div style={{ color: 'var(--warn)', fontSize: 11, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
              Elevated · trending up
            </div>
          </div>
        </Artboard>
        <Artboard title="C · Sparkline" width={280} height={140}>
          <div style={{ padding: 16, background: 'var(--surface)', height: '100%',
                         display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>Open · last 4h</span>
              <span style={{ fontSize: 11, color: 'var(--warn)', fontFamily: 'var(--mono)', fontWeight: 600 }}>↑ +42%</span>
            </div>
            <svg viewBox="0 0 220 50" width="100%" height={50} preserveAspectRatio="none">
              <polyline
                points="0,40 20,38 40,36 60,30 80,28 100,22 120,18 140,10 160,14 180,8 200,6 220,4"
                fill="none"
                stroke="var(--warn)" strokeWidth="2"
              />
              <polyline
                points="0,40 20,38 40,36 60,30 80,28 100,22 120,18 140,10 160,14 180,8 200,6 220,4 220,50 0,50"
                fill="var(--warn-soft)" stroke="none"
              />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>
              <span>4h ago</span><span>now</span>
            </div>
          </div>
        </Artboard>
      </DCSection>

      {/* Section 5: Full board snapshots */}
      <DCSection title="5. Full board · moments" subtitle="Same dashboard at three moments of the day.">
        <Artboard title="Morning · steady" width={1100} height={520}>
          <MiniBoard tickets={SEED_TICKETS.slice(0, 10)} nowMs={nowMs} staleHours={48} />
        </Artboard>
        <Artboard title="Mid-burst · pressure rising" width={1100} height={520}>
          <MiniBoard tickets={SEED_TICKETS} nowMs={nowMs} staleHours={48} showBurst />
        </Artboard>
      </DCSection>

      {/* Section 6: Color palette */}
      <DCSection title="6. Palette & type" subtitle="Tokens the prototype uses — all oklch for consistent perceptual steps.">
        <Artboard title="Surfaces" width={420} height={260}>
          <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['bg',         'oklch(0.18 0.008 60)'],
              ['bg-2',       'oklch(0.21 0.009 60)'],
              ['surface',    'oklch(0.235 0.01 60)'],
              ['surface-2',  'oklch(0.27 0.011 60)'],
              ['border',     'oklch(0.30 0.012 60)'],
              ['border-strong', 'oklch(0.36 0.014 60)'],
            ].map(([name, val]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, background: val, borderRadius: 4,
                              border: '1px solid var(--border)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)' }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        </Artboard>
        <Artboard title="Semantic" width={420} height={260}>
          <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['accent',  'oklch(0.82 0.19 145)', 'Signal / action'],
              ['danger',  'oklch(0.70 0.19 25)',  'Stale, critical'],
              ['warn',    'oklch(0.80 0.16 75)',  'Approaching, FR'],
              ['info',    'oklch(0.78 0.12 220)', 'Pending'],
              ['violet',  'oklch(0.72 0.15 295)', 'Linear / eng'],
            ].map(([name, val, note]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, background: val, borderRadius: 4 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>{note}</div>
                </div>
              </div>
            ))}
          </div>
        </Artboard>
        <Artboard title="Type" width={420} height={260}>
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 22, fontWeight: 600,
                          color: 'var(--text)', marginBottom: 10, letterSpacing: -0.3 }}>
              Geist — subject lines
            </div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-dim)',
                          marginBottom: 18, lineHeight: 1.5 }}>
              Body sits here at 13–14px. Metadata rows drop to 11–12px and stay in text-dim or mute.
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)',
                          letterSpacing: 0.3 }}>
              Geist Mono · #48219 · 2d 4h · ENG-2184
            </div>
          </div>
        </Artboard>
      </DCSection>
    </DesignCanvas>
  );
};

// A condensed full-board that fits inside an artboard
const MiniBoard = ({ tickets, nowMs, staleHours, showBurst }) => {
  const byColumn = {};
  COLUMNS.forEach(c => byColumn[c.key] = []);
  tickets.forEach(t => {
    const k = classifyTicket(t, nowMs, staleHours);
    if (k && byColumn[k]) byColumn[k].push(t);
  });
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '8px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg)',
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: 4,
          background: 'var(--accent)', color: 'var(--accent-ink)',
          fontWeight: 800, fontSize: 11, fontFamily: 'var(--mono)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>T</div>
        <span style={{ fontWeight: 600, fontSize: 12 }}>Triage</span>
        <div style={{ flex: 1 }} />
        {showBurst && <BurstMeter tickets={tickets} nowMs={nowMs} staleHours={staleHours} />}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: 12, display: 'flex', gap: 8 }}>
        {COLUMNS.map(col => (
          <MiniColumn key={col.key} col={col} tickets={(byColumn[col.key] || []).slice(0, 3)}
                      cardVariant="rail" density="compact" nowMs={nowMs} staleHours={staleHours} />
        ))}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<CanvasApp />);
