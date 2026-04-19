import { http, HttpResponse } from 'msw'
import type { Ticket } from '../types/ticket'
import type { ZDComment } from '../types/comment'
import { MY_ASSIGNEE_ID } from '../api/tickets'

// In-memory patch store — tracks local optimistic overrides for ticket fields
const ticketPatches: Record<number, Partial<Ticket>> = {}

// In-memory reply store
const replyStore: Record<number, ZDComment[]> = {}

export const handlers = [
  // Ticket update (status, assignee, drag-drop) — mock so mutations don't hit real ZD in dev
  http.put('/api/v2/tickets/:id.json', async ({ params, request }) => {
    const id = Number(params['id'])
    const body = await request.json() as { ticket: Partial<Ticket> & { assignee_id?: number } }
    const { assignee_id, ...rest } = body.ticket
    const patch: Partial<Ticket> = { ...rest }
    if (assignee_id) patch.assignee = 'GC'
    ticketPatches[id] = { ...(ticketPatches[id] ?? {}), ...patch }
    return HttpResponse.json({ ticket: { id, ...ticketPatches[id] } })
  }),

  // Post reply — mock so replies don't accidentally post to real ZD in dev
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
    replyStore[id] = [...(replyStore[id] ?? []), newComment]
    return HttpResponse.json({ comment: newComment })
  }),
]
