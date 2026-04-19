import { useQuery } from '@tanstack/react-query'
import { fetchTickets } from '../api/tickets'

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
