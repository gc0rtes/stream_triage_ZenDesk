import type { ReactNode } from 'react';
import { ACCENT_PRESETS } from '../theme';
import { IconSparkle } from './icons';

export interface Tweaks {
  accent: string;
  density: string;
  staleHours: number;
  cardVariant: string;
  columnWidth: string;
  showBurst: boolean;
}

interface RowProps { label: string; children: ReactNode }
function Row({ label, children }: RowProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6,
        color: 'var(--text-mute)', marginBottom: 5, fontWeight: 600,
      }}>{label}</div>
      {children}
    </div>
  );
}

interface SegOption { key: string | number; label: string }
interface SegProps {
  options: (string | SegOption)[];
  value: string | number;
  onChange: (v: string | number) => void;
}
function Seg({ options, value, onChange }: SegProps) {
  return (
    <div style={{
      display: 'flex', gap: 2, background: 'var(--bg-2)',
      padding: 2, borderRadius: 4, border: '1px solid var(--border)',
    }}>
      {options.map(o => {
        const key = typeof o === 'string' ? o : o.key;
        const label = typeof o === 'string' ? o : o.label;
        return (
          <button key={String(key)} onClick={() => onChange(key)} style={{
            flex: 1, padding: '5px 8px', borderRadius: 3,
            background: key === value ? 'var(--surface-2)' : 'transparent',
            color: key === value ? 'var(--text)' : 'var(--text-dim)',
            border: 'none', fontSize: 11, cursor: 'pointer',
            textTransform: 'capitalize', fontFamily: 'inherit', fontWeight: 500,
          }}>{label}</button>
        );
      })}
    </div>
  );
}

interface TweaksPanelProps {
  tweaks: Tweaks;
  setTweaks: (t: Tweaks) => void;
  visible: boolean;
}

export function TweaksPanel({ tweaks, setTweaks, visible }: TweaksPanelProps) {
  if (!visible) return null;
  const set = <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => setTweaks({ ...tweaks, [k]: v });

  return (
    <div style={{
      position: 'fixed', bottom: 18, right: 18, width: 268,
      background: 'var(--bg-2)', border: '1px solid var(--border-strong)',
      borderRadius: 8, padding: 14, zIndex: 50,
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <IconSparkle size={12} style={{ color: 'var(--accent)' }} />
        <span style={{
          fontWeight: 600, color: 'var(--text)', fontSize: 12,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>Tweaks</span>
      </div>

      <Row label="Accent">
        <div style={{ display: 'flex', gap: 5 }}>
          {(Object.entries(ACCENT_PRESETS) as [string, { hue: number; name: string }][]).map(([k, v]) => (
            <button key={k} onClick={() => set('accent', k)} title={v.name} style={{
              width: 24, height: 24, borderRadius: 4,
              background: `oklch(0.82 0.19 ${v.hue})`,
              border: tweaks.accent === k ? '2px solid var(--text)' : '2px solid transparent',
              cursor: 'pointer', padding: 0,
            }} />
          ))}
        </div>
      </Row>

      <Row label="Density">
        <Seg
          options={['compact', 'comfortable', 'roomy']}
          value={tweaks.density}
          onChange={v => set('density', String(v))}
        />
      </Row>

      <Row label="Stale cutoff">
        <Seg
          options={[{ key: 24, label: '24h' }, { key: 48, label: '48h' }, { key: 72, label: '72h' }]}
          value={tweaks.staleHours}
          onChange={v => set('staleHours', Number(v))}
        />
      </Row>

      <Row label="Card style">
        <Seg
          options={[
            { key: 'default', label: 'Default' },
            { key: 'rail', label: 'Rail' },
            { key: 'minimal', label: 'Minimal' },
          ]}
          value={tweaks.cardVariant}
          onChange={v => set('cardVariant', String(v))}
        />
      </Row>

      <Row label="Column layout">
        <Seg
          options={[{ key: 'wide', label: 'Wide' }, { key: 'narrow', label: 'Narrow' }]}
          value={tweaks.columnWidth}
          onChange={v => set('columnWidth', String(v))}
        />
      </Row>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: '1px solid var(--border)',
      }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>Show burst meter</span>
        <button onClick={() => set('showBurst', !tweaks.showBurst)} style={{
          width: 32, height: 18, borderRadius: 10, position: 'relative',
          background: tweaks.showBurst ? 'var(--accent)' : 'var(--border-strong)',
          border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <div style={{
            position: 'absolute', top: 2, left: tweaks.showBurst ? 16 : 2,
            width: 14, height: 14, borderRadius: '50%',
            background: 'var(--bg)', transition: 'left 0.15s',
          }} />
        </button>
      </div>
    </div>
  );
}
