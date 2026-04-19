import type { Ticket } from '../types/ticket'
import type { ZDComment } from '../types/comment'
import { zdFetch } from './zendesk'

export const MY_ASSIGNEE_ID = 1515461428242

interface RawZDTicket {
  id: number
  subject: string
  status: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent' | null
  tags: string[]
  updated_at: string
  assignee_id: number | null
  organization_id: number | null
}

function deriveTier(tags: string[]): Ticket['tier'] {
  if (tags.some(t => t.includes('enterprise'))) return 'enterprise'
  if (tags.some(t => t === 'free' || t.includes('_free'))) return 'free'
  return 'pro'
}

function deriveHoldType(tags: string[], status: Ticket['status']): Ticket['holdType'] {
  if (status !== 'hold') return null
  if (tags.includes('feature_request_v2')) return 'feature_request'
  return 'linear'
}

function mapZDTicket(t: RawZDTicket): Ticket {
  const status = (t.status === 'new' || t.status === 'closed') ? 'open' : t.status
  return {
    id: t.id,
    subject: t.subject,
    status,
    priority: t.priority ?? 'normal',
    tier: deriveTier(t.tags),
    holdType: deriveHoldType(t.tags, status),
    tags: t.tags.filter(tag => !['1', 'false', 'true', 'slack_notified', 'thena'].includes(tag)),
    updatedAt: new Date(t.updated_at).getTime(),
    replies: 0,
    sentiment: null,
    assignee: t.assignee_id === MY_ASSIGNEE_ID ? 'GC' : (t.assignee_id ? 'OTHER' : ''),
    linear: null,
    customer: t.organization_id ? 'Org-' + String(t.organization_id).slice(-5) : 'Unknown',
  }
}

function zdSearch(query: string, perPage = 100) {
  return zdFetch<{ results: RawZDTicket[] }>(
    `/search.json?${new URLSearchParams({ query, per_page: String(perPage) })}`
  )
}

export async function fetchTickets(): Promise<Ticket[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString().split('T')[0]
  const me = `assignee_id:${MY_ASSIGNEE_ID}`

  const [myOpen, myPending, myHold, myNew, unassigned, mySolved] = await Promise.all([
    zdSearch(`type:ticket ${me} status:open`),
    zdSearch(`type:ticket ${me} status:pending`),
    zdSearch(`type:ticket ${me} status:hold`),
    zdSearch(`type:ticket ${me} status:new`),
    zdSearch('type:ticket assignee:none status:new'),
    zdSearch(`type:ticket ${me} status:solved updated>${sevenDaysAgo}`, 50),
  ])

  return [
    ...myOpen.results,
    ...myPending.results,
    ...myHold.results,
    ...myNew.results,
    ...unassigned.results,
    ...mySolved.results,
  ].map(mapZDTicket)
}

export async function updateTicketStatus(id: number, patch: Partial<Ticket>): Promise<Ticket> {
  const data = await zdFetch<{ ticket: Ticket }>(`/tickets/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ ticket: patch }),
  })
  return data.ticket
}

export async function assignTicket(id: number): Promise<Ticket> {
  const data = await zdFetch<{ ticket: Ticket }>(`/tickets/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ ticket: { assignee_id: MY_ASSIGNEE_ID, status: 'open' } }),
  })
  return data.ticket
}

export interface FullTicket extends Ticket {
  comments: ZDComment[]
}

export async function fetchFullTicket(id: number): Promise<FullTicket> {
  const [{ ticket }, { comments }] = await Promise.all([
    zdFetch<{ ticket: Ticket }>(`/tickets/${id}.json`),
    zdFetch<{ comments: Array<Omit<ZDComment, 'author_name'>> }>(`/tickets/${id}/comments.json`),
  ])

  const authorIds = [...new Set(comments.map(c => c.author_id))]
  const { users } = await zdFetch<{ users: { id: number; name: string }[] }>(
    `/users/show_many.json?ids=${authorIds.join(',')}`
  )
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))

  const enrichedComments: ZDComment[] = comments.map(c => ({
    ...c,
    author_name: userMap[c.author_id] ?? `User ${c.author_id}`,
  }))

  return { ...ticket, comments: enrichedComments }
}

export async function postReply(id: number, body: string, isPublic: boolean): Promise<ZDComment> {
  const data = await zdFetch<{ comment: Omit<ZDComment, 'author_name'> }>(`/tickets/${id}/comments.json`, {
    method: 'POST',
    body: JSON.stringify({ ticket: { comment: { body, public: isPublic } } }),
  })
  return { ...data.comment, author_name: 'Guilherme Cortes' }
}
