// Ticket card + sub-pieces. All styling uses CSS vars from theme.jsx
// so Tweaks can swap accent/density live.

const TierBadge = ({ tier }) => {
  const meta = TIER_META[tier];
  const isEnt = tier === 'enterprise';
  return (
    <span style={{
      fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: 0.6, fontWeight: 600,
      padding: '2px 5px', borderRadius: 3,
      background: isEnt ? 'var(--accent-soft)' : 'var(--surface-2)',
      color:      isEnt ? 'var(--accent)'     : 'var(--text-dim)',
      border: isEnt ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{meta.label}</span>
  );
};

const Sentiment = ({ s, size = 13 }) => {
  if (!s) return null;
  if (s === 'positive') return <IconSmile size={size} style={{ color: 'var(--accent)' }} />;
  if (s === 'negative') return <IconFrown size={size} style={{ color: 'var(--danger)' }} />;
  return <IconMeh size={size} style={{ color: 'var(--text-mute)' }} />;
};

const AssigneeChip = ({ id, size = 20 }) => {
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
};

// figure out a card's urgency: how close it is to the stale cutoff
// returns 0..1 (1 = past cutoff); only meaningful for open tickets
const urgencyFor = (t, nowMs, staleHours) => {
  if (t.status !== 'open') return 0;
  const age = (nowMs - t.updatedAt) / 3600_000;
  return Math.max(0, Math.min(1, age / staleHours));
};

const TicketCard = ({ t, nowMs, staleHours, onOpen, style, styleVariant = 'default', density }) => {
  const u = urgencyFor(t, nowMs, staleHours);
  const approaching = t.status === 'open' && u >= 0.75 && u < 1;
  const stale = t.status === 'open' && u >= 1;
  const isEnt = t.tier === 'enterprise';
  const age = timeSince(t.updatedAt, nowMs);

  const d = DENSITY_PRESETS[density] || DENSITY_PRESETS.comfortable;

  // drag source
  const onDragStart = (e) => {
    e.dataTransfer.setData('text/plain', String(t.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  // left accent rail color
  const railColor =
    stale       ? 'var(--danger)' :
    approaching ? 'var(--warn)'   :
    isEnt       ? 'var(--accent)' :
    t.status === 'pending' ? 'var(--info)' :
    t.holdType === 'linear' ? 'var(--violet)' :
    t.holdType === 'feature_request' ? 'var(--warn)' :
    t.status === 'solved' ? 'var(--accent)' :
    'transparent';

  const baseCard = {
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
    baseCard.paddingLeft = d.cardPad + 6;
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => onOpen && onOpen(t)}
      className={`tc ${stale ? 'tc-stale' : ''} ${approaching ? 'tc-approaching' : ''}`}
      style={baseCard}
    >
      {/* left rail */}
      {styleVariant === 'rail' && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: railColor,
        }} />
      )}

      {/* top row: id + tier + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', fontWeight: 500 }}>
          #{t.id}
        </span>
        <TierBadge tier={t.tier} />
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

      {/* subject */}
      <div style={{
        color: 'var(--text)', fontWeight: 500, lineHeight: 1.35,
        marginBottom: 8,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {t.subject}
      </div>

      {/* customer row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: 'var(--text-dim)', marginBottom: 10,
      }}>
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: 180,
        }}>{t.customer}</span>
      </div>

      {/* bottom row: signals */}
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
};

Object.assign(window, { TicketCard, TierBadge, Sentiment, AssigneeChip, urgencyFor });
