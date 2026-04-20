import { useQuery } from '@tanstack/react-query'
import { fetchRequesterInfo } from '../api/tickets'

export function useRequesterInfo(requesterId: number | null | undefined) {
  return useQuery({
    queryKey: ['requester', requesterId],
    queryFn: () => fetchRequesterInfo(requesterId!),
    enabled: requesterId != null,
    staleTime: 5 * 60_000,
  })
}
