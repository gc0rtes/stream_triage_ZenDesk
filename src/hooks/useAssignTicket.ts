import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Ticket } from '../types/ticket'
import { assignTicket } from '../api/tickets'

export function useAssignTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => assignTicket(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tickets'] })
      const prev = queryClient.getQueryData<Ticket[]>(['tickets'])
      queryClient.setQueryData<Ticket[]>(['tickets'], ts =>
        ts?.map(t => t.id !== id ? t : { ...t, assignee: 'GC', status: 'open' }) ?? []
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['tickets'], ctx.prev)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
