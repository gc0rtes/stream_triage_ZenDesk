import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Ticket } from '../types/ticket'
import { updateTicketStatus } from '../api/tickets'
import { pendingMutationIds } from './pendingMutations'

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<Ticket> }) =>
      updateTicketStatus(id, patch),

    onMutate: async ({ id, patch }) => {
      pendingMutationIds.add(id)
      await queryClient.cancelQueries({ queryKey: ['tickets'] })
      const snapshot = queryClient.getQueryData<Ticket[]>(['tickets'])

      queryClient.setQueryData<Ticket[]>(['tickets'], (prev) =>
        prev?.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      )

      return { snapshot }
    },

    onError: (_err, vars, ctx) => {
      pendingMutationIds.delete(vars.id)
      if (ctx?.snapshot) {
        queryClient.setQueryData(['tickets'], ctx.snapshot)
      }
    },

    onSettled: (_data, _err, vars) => {
      pendingMutationIds.delete(vars.id)
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['tickets'] })
      }, 1500)
    },
  })
}
