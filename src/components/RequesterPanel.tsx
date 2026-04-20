import type { ZDRequesterInfo } from '../api/tickets'
import { useRequesterInfo } from '../hooks/useRequesterInfo'

// Maps common Rails timezone names to IANA names for Intl.DateTimeFormat
const TZ_MAP: Record<string, string> = {
  'Eastern Time (US & Canada)': 'America/New_York',
  'Central Time (US & Canada)': 'America/Chicago',
  'Mountain Time (US & Canada)': 'America/Denver',
  'Pacific Time (US & Canada)': 'America/Los_Angeles',
  'Alaska': 'America/Anchorage',
  'Hawaii': 'Pacific/Honolulu',
  'London': 'Europe/London',
  'Amsterdam': 'Europe/Amsterdam',
  'Berlin': 'Europe/Berlin',
  'Paris': 'Europe/Paris',
  'Madrid': 'Europe/Madrid',
  'Rome': 'Europe/Rome',
  'Stockholm': 'Europe/Stockholm',
  'Helsinki': 'Europe/Helsinki',
  'Warsaw': 'Europe/Warsaw',
  'Prague': 'Europe/Prague',
  'Athens': 'Europe/Athens',
  'Bucharest': 'Europe/Bucharest',
  'Istanbul': 'Europe/Istanbul',
  'Moscow': 'Europe/Moscow',
  'Dubai': 'Asia/Dubai',
  'Mumbai': 'Asia/Kolkata',
  'Kolkata': 'Asia/Kolkata',
  'Bangkok': 'Asia/Bangkok',
  'Singapore': 'Asia/Singapore',
  'Hong Kong': 'Asia/Hong_Kong',
  'Tokyo': 'Asia/Tokyo',
  'Seoul': 'Asia/Seoul',
  'Sydney': 'Australia/Sydney',
  'Melbourne': 'Australia/Melbourne',
  'Auckland': 'Pacific/Auckland',
  'UTC': 'UTC',
  'Brasilia': 'America/Sao_Paulo',
  'Buenos Aires': 'America/Argentina/Buenos_Aires',
  'Mexico City': 'America/Mexico_City',
  'Bogota': 'America/Bogota',
  'Lima': 'America/Lima',
  'Santiago': 'America/Santiago',
  'Johannesburg': 'Africa/Johannesburg',
  'Cairo': 'Africa/Cairo',
  'Nairobi': 'Africa/Nairobi',
}

function localTime(tzRails: string | null, nowMs: number): string {
  if (!tzRails) return '—'
  const iana = TZ_MAP[tzRails] ?? tzRails
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(new Date(nowMs))
  } catch {
    return tzRails
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: value ? 'var(--text)' : 'var(--text-mute)' }}>
        {value || '—'}
      </span>
    </div>
  )
}

function TicketStatusDot({ status }: { status: string }) {
  const color = status === 'open' ? 'var(--accent)' : status === 'pending' ? '#f59e0b' : status === 'solved' || status === 'closed' ? 'var(--text-mute)' : '#8b5cf6'
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
}

interface RequesterInfoBodyProps {
  info: ZDRequesterInfo
  nowMs: number
}

function RequesterInfoBody({ info, nowMs }: RequesterInfoBodyProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', flex: 1 }}>
      {/* Avatar + name */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--accent-soft)', border: '2px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
          }}>
            {info.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{info.name}</div>
            {info.organization_name && (
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>{info.organization_name}</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <InfoRow label="Email" value={
            <a href={`mailto:${info.email}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{info.email}</a>
          } />
          <InfoRow label="Local time" value={localTime(info.time_zone, nowMs)} />
          <InfoRow label="Language" value={info.locale} />
          {info.notes && <InfoRow label="Notes" value={<span style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{info.notes}</span>} />}
        </div>
      </div>

      {/* Interaction history */}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Recent tickets ({info.recent_tickets.length})
        </div>
        {info.recent_tickets.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-mute)', padding: '8px 0' }}>No previous tickets</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {info.recent_tickets.map(t => (
            <a
              key={t.id}
              href={`https://getstream.zendesk.com/agent/tickets/${t.id}`}
              target="_blank" rel="noreferrer"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                padding: '9px 12px', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--surface)', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <TicketStatusDot status={t.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, color: 'var(--text)', lineHeight: 1.35,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{t.subject}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)' }}>#{t.id}</span>
                      <span style={{
                        fontSize: 10, color: 'var(--text-mute)', textTransform: 'capitalize',
                        padding: '1px 5px', borderRadius: 3,
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                      }}>{t.status}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-mute)' }}>
                        {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

interface RequesterPanelProps {
  requesterId: number | null | undefined
  nowMs: number
}

export function RequesterPanel({ requesterId, nowMs }: RequesterPanelProps) {
  const { data, isLoading, isError } = useRequesterInfo(requesterId)

  if (!requesterId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
        No requester info
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
        Loading requester info…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
        Failed to load requester info
      </div>
    )
  }

  return <RequesterInfoBody info={data} nowMs={nowMs} />
}
