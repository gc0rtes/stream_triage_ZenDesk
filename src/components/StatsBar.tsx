import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Ticket } from '../types/ticket'
import { useAuth } from '../context/AuthContext'
import { IconX } from './icons'

function lastSevenDays(): Date[] {
  const result: Date[] = []
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  for (let i = 6; i >= 0; i--) {
    const day = new Date(d)
    day.setDate(d.getDate() - i)
    result.push(day)
  }
  return result
}

interface OpenBreakdown { red: number; yellow: number; green: number; total: number }
interface DayData { day: string; fullDate: string; count: number }

interface StatBoxProps { label: string; count: number; dotColor: string; bgColor: string; borderColor: string }
function StatBox({ label, count, dotColor, bgColor, borderColor }: StatBoxProps) {
  return (
    <div style={{
      flex: 1, padding: '12px 14px', borderRadius: 8,
      background: bgColor, border: `1px solid ${borderColor}`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 600, color: dotColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{count}</div>
    </div>
  )
}

interface StatsModalProps {
  agentName: string
  breakdown: OpenBreakdown
  chartData: DayData[]
  barColor: string
  onClose: () => void
}

function StatsModal({ agentName, breakdown, chartData, barColor, onClose }: StatsModalProps) {
  const totalSolved = chartData.reduce((s, d) => s + d.count, 0)

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200 }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '24px 28px', width: 500,
        zIndex: 201, boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.2 }}>Stats</div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>{agentName}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-dim)', display: 'inline-flex', padding: 4, borderRadius: 4,
            marginTop: -2,
          }}>
            <IconX size={16} />
          </button>
        </div>

        {/* Open ticket breakdown */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Open tickets
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatBox
              label="Stale" count={breakdown.red}
              dotColor="var(--danger)" bgColor="var(--danger-soft)" borderColor="var(--danger)"
            />
            <StatBox
              label="Medium" count={breakdown.yellow}
              dotColor="var(--warn)" bgColor="var(--warn-soft)" borderColor="var(--warn)"
            />
            <StatBox
              label="Okay" count={breakdown.green}
              dotColor="var(--accent)" bgColor="var(--accent-soft)" borderColor="var(--accent)"
            />
            <StatBox
              label="Total" count={breakdown.total}
              dotColor="var(--text-dim)" bgColor="var(--surface-2)" borderColor="var(--border)"
            />
          </div>
        </div>

        {/* Solved chart */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Solved — last 7 days
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginLeft: 'auto' }}>
              {totalSolved} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-mute)' }}>total</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--mono)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--text)',
                  padding: '6px 10px',
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as DayData
                  return (
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 6, fontSize: 12, color: 'var(--text)', padding: '6px 10px',
                    }}>
                      <div style={{ color: 'var(--text-mute)', marginBottom: 2 }}>{d.fullDate}</div>
                      <div style={{ fontWeight: 600 }}>{payload[0].value as number} solved</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}

interface StatsBarProps {
  tickets: Ticket[]
  nowMs: number
  staleHours: number
  accentHue: number
}

export function StatsBar({ tickets, nowMs, staleHours, accentHue }: StatsBarProps) {
  const [open, setOpen] = useState(false)
  const { user, colleagues, viewedAgentId } = useAuth()

  const openTickets = tickets.filter(t => t.status === 'open' && t.assignee !== '')
  const red = openTickets.filter(t => (nowMs - t.updatedAt) / 3_600_000 >= staleHours).length
  const yellow = openTickets.filter(t => {
    const h = (nowMs - t.updatedAt) / 3_600_000
    return h >= staleHours * 0.75 && h < staleHours
  }).length
  const green = openTickets.length - red - yellow

  const workingDays = lastSevenDays()
  const solvedTickets = tickets.filter(t => t.status === 'solved')
  const chartData: DayData[] = workingDays.map(day => {
    const start = new Date(day); start.setHours(0, 0, 0, 0)
    const end = new Date(day); end.setHours(23, 59, 59, 999)
    return {
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      count: solvedTickets.filter(t => t.updatedAt >= start.getTime() && t.updatedAt <= end.getTime()).length,
    }
  })

  const totalSolved = chartData.reduce((s, d) => s + d.count, 0)
  const agentName = viewedAgentId
    ? (colleagues.find(c => c.id === viewedAgentId)?.name ?? 'Agent')
    : (user?.name ?? 'Me')

  const barColor = `oklch(0.65 0.18 ${accentHue})`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: 'inherit',
          lineHeight: 1,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>● {red}</span>
          <span style={{ color: 'var(--text-mute)' }}>·</span>
          <span style={{ color: 'var(--warn)', fontWeight: 600 }}>● {yellow}</span>
          <span style={{ color: 'var(--text-mute)' }}>·</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>● {green}</span>
          <span style={{ color: 'var(--text-mute)', marginLeft: 2 }}>open</span>
        </span>
        <div style={{ width: 1, height: 14, background: 'var(--border)', flexShrink: 0 }} />
        <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 11 }}>
          {totalSolved} solved/7d
        </span>
      </button>

      {open && (
        <StatsModal
          agentName={agentName}
          breakdown={{ red, yellow, green, total: openTickets.length }}
          chartData={chartData}
          barColor={barColor}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
