import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Ticket } from '../types/ticket'
import { useAuth } from '../context/AuthContext'
import { IconX } from './icons'
import {
  fetchAgentSatisfactionReport,
  fetchSolvedTicketsInRangeForAgent,
  fetchTicketSearchCount,
  zendeskAgentTicketUrl,
} from '../api/tickets'

const MS_DAY = 86_400_000

export type StatsVolumeRange = '7d' | '30d' | '90d'
type StatsMainTab = 'board' | 'satisfaction'
type SatPeriod = 'week' | 'month'

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

function rangeDays(vol: StatsVolumeRange): number {
  switch (vol) {
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
  }
}

function satPeriodDays(p: SatPeriod): number {
  return p === 'week' ? 7 : 30
}

function startOfLocalDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function localDayStartsBetween(rangeStartMs: number, rangeEndMs: number): number[] {
  const days: number[] = []
  let t = startOfLocalDay(rangeEndMs)
  const lo = startOfLocalDay(rangeStartMs)
  while (t >= lo) {
    days.push(t)
    t -= MS_DAY
  }
  days.reverse()
  return days
}

interface ChartRow {
  day: string
  fullDate: string
  count: number
}

function buildSolvedChartData(
  solved: Array<{ updatedAt: number }>,
  rangeStartMs: number,
  rangeEndMs: number,
  vol: StatsVolumeRange,
): ChartRow[] {
  if (vol === '90d') {
    const numBuckets = 14
    const span = Math.max(1, rangeEndMs - rangeStartMs)
    const w = span / numBuckets
    const counts = Array.from({ length: numBuckets }, () => 0)
    for (const s of solved) {
      if (s.updatedAt < rangeStartMs || s.updatedAt > rangeEndMs) continue
      const i = Math.min(numBuckets - 1, Math.floor((s.updatedAt - rangeStartMs) / w))
      counts[i]++
    }
    return counts.map((count, i) => {
      const bucketStart = rangeStartMs + i * w
      const bucketEnd = i === numBuckets - 1 ? rangeEndMs : rangeStartMs + (i + 1) * w
      const d0 = new Date(bucketStart)
      const d1 = new Date(bucketEnd - 1)
      return {
        day: d0.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: `${d0.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        count,
      }
    })
  }
  const dayStarts = localDayStartsBetween(rangeStartMs, rangeEndMs)
  return dayStarts.map((start) => {
    const end = start + MS_DAY - 1
    const count = solved.filter((s) => s.updatedAt >= start && s.updatedAt <= end).length
    const d = new Date(start)
    return {
      day:
        vol === '7d'
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      fullDate: d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      count,
    }
  })
}


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

function Segment({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-dim)',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

interface StatsModalProps {
  agentName: string
  mainTab: StatsMainTab
  setMainTab: (t: StatsMainTab) => void
  volumeRange: StatsVolumeRange
  setVolumeRange: (r: StatsVolumeRange) => void
  satPeriod: SatPeriod
  setSatPeriod: (p: SatPeriod) => void
  assigneeId: number
  nowMs: number
  barColor: string
  onClose: () => void
  onOpenTicket: (ticketId: number) => void
}

function StatsModal({
  agentName,
  mainTab,
  setMainTab,
  volumeRange,
  setVolumeRange,
  satPeriod,
  setSatPeriod,
  assigneeId,
  nowMs,
  barColor,
  onClose,
  onOpenTicket,
}: StatsModalProps) {
  const volDays = rangeDays(volumeRange)
  const rangeEndMs = nowMs
  const rangeStartMs = nowMs - volDays * MS_DAY

  // All three queries are agent-scoped: they count only the logged-in (or viewed) agent's tickets
  const solvedQuery = useQuery({
    queryKey: ['stats-solved', assigneeId, volumeRange],
    queryFn: () => fetchSolvedTicketsInRangeForAgent(assigneeId, Date.now() - volDays * MS_DAY),
    enabled: Boolean(assigneeId),
    staleTime: 60_000,
  })

  const createdQuery = useQuery({
    queryKey: ['stats-created', assigneeId, volumeRange],
    queryFn: () => {
      const since = new Date(Date.now() - volDays * MS_DAY).toISOString().split('T')[0]
      return fetchTicketSearchCount(`type:ticket assignee_id:${assigneeId} created>${since}`)
    },
    enabled: Boolean(assigneeId),
    staleTime: 60_000,
  })

  const unsolvedQuery = useQuery({
    queryKey: ['stats-unsolved', assigneeId],
    queryFn: () => fetchTicketSearchCount(`type:ticket assignee_id:${assigneeId} status<solved`),
    enabled: Boolean(assigneeId),
    staleTime: 60_000,
  })

  const satDays = satPeriodDays(satPeriod)

  const satQuery = useQuery({
    queryKey: ['stats-satisfaction', assigneeId, satPeriod],
    queryFn: () =>
      fetchAgentSatisfactionReport(assigneeId, Date.now() - satDays * MS_DAY, Date.now()),
    enabled: Boolean(assigneeId) && mainTab === 'satisfaction',
    staleTime: 60_000,
  })

  const inRangeSolved = useMemo(() => {
    const rows = solvedQuery.data ?? []
    // Use day-aligned start so filter matches chart bucket boundaries (first bucket = 00:00:00)
    const dayAlignedStart = startOfLocalDay(rangeStartMs)
    return rows.filter(
      (s) => s.updatedAt >= dayAlignedStart && s.updatedAt <= rangeEndMs,
    )
  }, [solvedQuery.data, rangeStartMs, rangeEndMs])

  const chartData = useMemo(
    () => buildSolvedChartData(inRangeSolved, rangeStartMs, rangeEndMs, volumeRange),
    [inRangeSolved, rangeStartMs, rangeEndMs, volumeRange],
  )

  const totalSolved = inRangeSolved.length

  const offered = satQuery.data?.offeredTickets ?? []
  const good = satQuery.data?.goodTickets ?? []
  const bad = satQuery.data?.badTickets ?? []
  const rated = good.length + bad.length
  const pctPositive = rated > 0 ? Math.round((good.length / rated) * 100) : null

  const volumeLabel =
    volumeRange === '7d' ? 'Last 7 days' : volumeRange === '30d' ? 'Last 30 days' : 'Last 90 days'

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
        borderRadius: 12, padding: '24px 28px', width: 620, maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'min(88vh, 720px)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        zIndex: 201, boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.2 }}>Stats</div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>{agentName}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Segment active={mainTab === 'board'} onClick={() => setMainTab('board')}>Board</Segment>
              <Segment active={mainTab === 'satisfaction'} onClick={() => setMainTab('satisfaction')}>Satisfaction</Segment>
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-dim)', display: 'inline-flex', padding: 4, borderRadius: 4,
              marginTop: -2,
            }}>
              <IconX size={16} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: 4 }}>
          {mainTab === 'board' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                  {volumeLabel}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <StatBox
                    label="Created"
                    count={createdQuery.data ?? 0}
                    dotColor="var(--text-dim)"
                    bgColor="var(--surface-2)"
                    borderColor="var(--border)"
                  />
                  <StatBox
                    label="Unsolved"
                    count={unsolvedQuery.data ?? 0}
                    dotColor="var(--warn)"
                    bgColor="var(--warn-soft)"
                    borderColor="var(--warn)"
                  />
                  <StatBox
                    label="Solved"
                    count={totalSolved}
                    dotColor="var(--accent)"
                    bgColor="var(--accent-soft)"
                    borderColor="var(--accent)"
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Solved — {volumeLabel}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
                    <Segment active={volumeRange === '7d'} onClick={() => setVolumeRange('7d')}>7d</Segment>
                    <Segment active={volumeRange === '30d'} onClick={() => setVolumeRange('30d')}>30d</Segment>
                    <Segment active={volumeRange === '90d'} onClick={() => setVolumeRange('90d')}>90d</Segment>
                  </div>
                </div>
                {solvedQuery.isPending && (
                  <div style={{ fontSize: 12, color: 'var(--text-mute)', padding: '24px 0' }}>Loading solved tickets…</div>
                )}
                {solvedQuery.isError && (
                  <div style={{ fontSize: 12, color: 'var(--danger)', padding: '12px 0' }}>
                    {solvedQuery.error instanceof Error ? solvedQuery.error.message : 'Could not load solved stats.'}
                  </div>
                )}
                {!solvedQuery.isPending && !solvedQuery.isError && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {totalSolved}
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-mute)', marginLeft: 6 }}>solved in range (search)</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-mute)', marginBottom: 8, lineHeight: 1.4 }}>
                      Zendesk search is capped (pagination). Totals may be lower than the true count for very high volume.
                    </div>
                    <div style={{ width: '100%', height: 200, overflowX: volumeRange === '90d' ? 'auto' : 'visible' }}>
                      <div style={{ minWidth: volumeRange === '90d' ? 520 : '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                              dataKey="day"
                              tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--mono)' }}
                              axisLine={false}
                              tickLine={false}
                              interval={volumeRange === '30d' ? 2 : 0}
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
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const d = payload[0].payload as ChartRow
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
                            <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {mainTab === 'satisfaction' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Period
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Segment active={satPeriod === 'week'} onClick={() => setSatPeriod('week')}>Week (7d)</Segment>
                  <Segment active={satPeriod === 'month'} onClick={() => setSatPeriod('month')}>Month (30d)</Segment>
                </div>
              </div>

              {satQuery.isPending && (
                <div style={{ fontSize: 12, color: 'var(--text-mute)', padding: '24px 0' }}>Loading satisfaction…</div>
              )}
              {satQuery.isError && (
                <div style={{ fontSize: 12, color: 'var(--danger)', padding: '12px 0' }}>
                  {satQuery.error instanceof Error ? satQuery.error.message : 'Could not load satisfaction data.'}
                </div>
              )}
              {!satQuery.isPending && !satQuery.isError && (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    <StatBox
                      label="Good"
                      count={good.length}
                      dotColor="var(--accent)"
                      bgColor="var(--accent-soft)"
                      borderColor="var(--accent)"
                    />
                    <StatBox
                      label="Bad"
                      count={bad.length}
                      dotColor="var(--danger)"
                      bgColor="var(--danger-soft)"
                      borderColor="var(--danger)"
                    />
                    <StatBox
                      label="Offered"
                      count={offered.length}
                      dotColor="var(--warn)"
                      bgColor="var(--warn-soft)"
                      borderColor="var(--warn)"
                    />
                    <div style={{
                      flex: 1, padding: '12px 14px', borderRadius: 8,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-dim)', flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>% positive</span>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                        {pctPositive != null ? `${pctPositive}%` : '—'}
                      </div>
                    </div>
                  </div>
                  {rated === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 10 }}>
                      No good/bad ratings in this window (search). Surveys still pending show under Offered.
                    </div>
                  )}

                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    Tickets with survey offered
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-mute)', marginBottom: 10, lineHeight: 1.45 }}>
                    From ticket search (<code style={{ fontSize: 10 }}>satisfaction:offered</code>). Open in the panel or in Zendesk.
                  </div>
                  {offered.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>No tickets in this period.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {offered.slice(0, 40).map((t) => (
                        <li
                          key={t.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', flexShrink: 0 }}>#{t.id}</span>
                          <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.subject}>
                            {t.subject}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenTicket(t.id)}
                            style={{
                              fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
                              border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)',
                              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                            }}
                          >
                            Open
                          </button>
                          <a
                            href={zendeskAgentTicketUrl(t.id)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 11, color: 'var(--text-mute)', flexShrink: 0 }}
                          >
                            ZD ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {offered.length > 40 && (
                    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 8 }}>
                      Showing 40 of {offered.length}. Refine period or use Zendesk reporting for full lists.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
  onOpenTicket?: (ticketId: number) => void
}

export function StatsBar({ tickets, nowMs, staleHours, accentHue, onOpenTicket }: StatsBarProps) {
  const [open, setOpen] = useState(false)
  const [mainTab, setMainTab] = useState<StatsMainTab>('board')
  const [volumeRange, setVolumeRange] = useState<StatsVolumeRange>('7d')
  const [satPeriod, setSatPeriod] = useState<SatPeriod>('week')
  const { user, colleagues, viewedAgentId } = useAuth()

  const assigneeId = viewedAgentId ?? user?.id ?? null

  const openTickets = tickets.filter(t => t.status === 'open' && t.assignee !== '')
  const red = openTickets.filter(t => (nowMs - t.updatedAt) / 3_600_000 >= staleHours).length
  const yellow = openTickets.filter(t => {
    const h = (nowMs - t.updatedAt) / 3_600_000
    return h >= staleHours * 0.75 && h < staleHours
  }).length
  const green = openTickets.length - red - yellow

  const workingDays = lastSevenDays()
  const solvedTickets = tickets.filter(t => t.status === 'solved')
  const chipChartData: ChartRow[] = workingDays.map(day => {
    const start = new Date(day); start.setHours(0, 0, 0, 0)
    const end = new Date(day); end.setHours(23, 59, 59, 999)
    return {
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      count: solvedTickets.filter(t => t.updatedAt >= start.getTime() && t.updatedAt <= end.getTime()).length,
    }
  })

  const totalSolvedChip = chipChartData.reduce((s, d) => s + d.count, 0)
  const agentName = viewedAgentId
    ? (colleagues.find(c => c.id === viewedAgentId)?.name ?? 'Agent')
    : (user?.name ?? 'Me')

  const barColor = `oklch(0.65 0.18 ${accentHue})`

  const handleOpenTicket = (ticketId: number) => {
    onOpenTicket?.(ticketId)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        disabled={assigneeId == null}
        title={assigneeId == null ? 'Sign in to load stats' : undefined}
        onClick={() => assigneeId != null && setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          cursor: assigneeId == null ? 'not-allowed' : 'pointer',
          opacity: assigneeId == null ? 0.55 : 1,
          fontSize: 12,
          fontFamily: 'inherit',
          lineHeight: 1,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => {
          if (assigneeId == null) return;
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
        }}
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
          {totalSolvedChip} solved/7d
        </span>
      </button>

      {open && assigneeId != null && (
        <StatsModal
          agentName={agentName}
          mainTab={mainTab}
          setMainTab={setMainTab}
          volumeRange={volumeRange}
          setVolumeRange={setVolumeRange}
          satPeriod={satPeriod}
          setSatPeriod={setSatPeriod}
          assigneeId={assigneeId}
          nowMs={nowMs}
          barColor={barColor}
          onClose={() => setOpen(false)}
          onOpenTicket={handleOpenTicket}
        />
      )}
    </>
  )
}
