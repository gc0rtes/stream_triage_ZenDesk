import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Ticket } from '../types/ticket'
import { assignTicket } from '../api/tickets'
import { pendingMutationIds } from './pendingMutations'

export function useAssignTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => assignTicket(id),
    onMutate: async (id) => {
      pendingMutationIds.add(id)
      await queryClient.cancelQueries({ queryKey: ['tickets'] })
      const prev = queryClient.getQueryData<Ticket[]>(['tickets'])
      queryClient.setQueryData<Ticket[]>(['tickets'], ts =>
        ts?.map(t => t.id !== id ? t : { ...t, assignee: 'GC', status: 'open', updatedAt: Date.now() }) ?? []
      )
      return { prev }
    },
    onError: (_err, id, ctx) => {
      pendingMutationIds.delete(id)
      if (ctx?.prev) queryClient.setQueryData(['tickets'], ctx.prev)
    },
    onSettled: (_data, _err, id) => {
      pendingMutationIds.delete(id)
      // Small delay so ZD's search index catches up before we re-query
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['tickets'] })
      }, 1500)
    },
  })
}
