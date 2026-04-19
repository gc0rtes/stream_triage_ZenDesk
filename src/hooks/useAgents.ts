import { useQuery } from '@tanstack/react-query'
import { fetchAgents } from '../api/tickets'

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    staleTime: 60 * 60_000, // agents rarely change
  })
}
