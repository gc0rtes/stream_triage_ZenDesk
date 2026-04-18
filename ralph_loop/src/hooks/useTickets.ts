import { useQuery } from '@tanstack/react-query'
import { fetchTickets } from '../api/tickets'

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
    staleTime: 60_000,
  })
}
