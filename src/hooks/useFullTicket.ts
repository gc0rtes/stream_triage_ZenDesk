import { useQuery } from '@tanstack/react-query'
import { fetchFullTicket } from '../api/tickets'

export function useFullTicket(ticketId: number | null) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => fetchFullTicket(ticketId!),
    enabled: ticketId !== null,
    staleTime: 30_000,
  })
}
