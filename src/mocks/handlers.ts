import { http, HttpResponse } from 'msw'
import type { Ticket } from '../types/ticket'
import { SEED_TICKETS } from './fixtures/tickets'

const tickets: Ticket[] = [...SEED_TICKETS]

export const handlers = [
  http.get('https://stream.zendesk.com/api/v2/tickets.json', () => {
    return HttpResponse.json({ tickets })
  }),

  http.put('https://stream.zendesk.com/api/v2/tickets/:id.json', async ({ params, request }) => {
    const id = Number(params['id'])
    const body = await request.json() as { ticket: Partial<Ticket> }
    const idx = tickets.findIndex(t => t.id === id)
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    tickets[idx] = { ...tickets[idx], ...body.ticket }
    return HttpResponse.json({ ticket: tickets[idx] })
  }),
]
