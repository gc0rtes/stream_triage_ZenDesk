import type { Ticket } from '../types/ticket'
import { zdFetch } from './zendesk'

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
