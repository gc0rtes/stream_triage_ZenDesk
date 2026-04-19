import { useQuery } from '@tanstack/react-query'
import { fetchMacros } from '../api/tickets'

export function useMacros() {
  return useQuery({
    queryKey: ['macros'],
    queryFn: fetchMacros,
    staleTime: 5 * 60_000,
  })
}
