import type { Ticket } from '../types/ticket'
import type { ZDComment } from '../types/comment'
import { zdFetch } from './zendesk'

export const MY_ASSIGNEE_ID = 1515461428242

export async function fetchTickets(): Promise<Ticket[]> {
  const data = await zdFetch<{ tickets: Ticket[] }>('/tickets.json')
  return data.tickets
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
