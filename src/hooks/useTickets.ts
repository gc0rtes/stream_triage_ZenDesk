import { useQuery } from '@tanstack/react-query'
import { fetchTickets } from '../api/tickets'

export function useTickets(agentId?: number) {
  return useQuery({
    queryKey: ['tickets', agentId ?? 'self'],
    queryFn: () => fetchTickets(agentId),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
