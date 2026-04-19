import { http, HttpResponse } from 'msw'
import type { Ticket } from '../types/ticket'
import type { ZDComment } from '../types/comment'
import { SEED_TICKETS } from './fixtures/tickets'
import { MY_ASSIGNEE_ID } from '../api/tickets'

const tickets: Ticket[] = [...SEED_TICKETS]

// Per-ticket comment store — populated on first request
const commentStore: Record<number, ZDComment[]> = {}

function seedComments(ticket: Ticket): ZDComment[] {
  const base = ticket.updatedAt
  return [
    {
      id: ticket.id * 100 + 1,
      author_id: 9999,
      author_name: ticket.customer,
      body: ticket.subject,
      public: true,
      created_at: new Date(base - 3 * 3600_000).toISOString(),
    },
    {
      id: ticket.id * 100 + 2,
      author_id: MY_ASSIGNEE_ID,
      author_name: 'Guilherme Cortes',
      body: "Hi! Thanks for reaching out. I'm looking into this now and will update you shortly.",
      public: true,
      created_at: new Date(base - 2 * 3600_000).toISOString(),
    },
    {
      id: ticket.id * 100 + 3,
      author_id: 9999,
      author_name: ticket.customer,
      body: 'Thank you, looking forward to your update.',
      public: true,
      created_at: new Date(base - 1 * 3600_000).toISOString(),
    },
  ]
}

function getComments(id: number): ZDComment[] {
  if (!commentStore[id]) {
    const t = tickets.find(t => t.id === id)
    commentStore[id] = t ? seedComments(t) : []
  }
  return commentStore[id]
}

export const handlers = [
  // Ticket list — served from fixtures so the board works without hitting real ZD
  http.get('/api/v2/tickets.json', () =>
    HttpResponse.json({ tickets })
  ),

  // Ticket update (status, assignee, drag-drop) — mock so mutations are safe in dev
  http.put('/api/v2/tickets/:id.json', async ({ params, request }) => {
    const id = Number(params['id'])
    const body = await request.json() as { ticket: Partial<Ticket> & { assignee_id?: number } }
    const idx = tickets.findIndex(t => t.id === id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    const { assignee_id, ...rest } = body.ticket
    const patch: Partial<Ticket> = { ...rest }
    if (assignee_id) patch.assignee = 'GC'
    tickets[idx] = { ...tickets[idx], ...patch }
    return HttpResponse.json({ ticket: tickets[idx] })
  }),

  // Post reply — mock so replies don't accidentally go to real ZD in dev
  http.post('/api/v2/tickets/:id/comments.json', async ({ params, request }) => {
    const id = Number(params['id'])
    const body = await request.json() as { ticket: { comment: { body: string; public: boolean } } }
    const newComment: ZDComment = {
      id: Date.now(),
      author_id: MY_ASSIGNEE_ID,
      author_name: 'Guilherme Cortes',
      body: body.ticket.comment.body,
      public: body.ticket.comment.public,
      created_at: new Date().toISOString(),
    }
    getComments(id).push(newComment)
    return HttpResponse.json({ comment: newComment })
  }),
]
