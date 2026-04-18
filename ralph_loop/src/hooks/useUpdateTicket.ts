import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Ticket } from '../types/ticket'
import { updateTicketStatus } from '../api/tickets'

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<Ticket> }) =>
      updateTicketStatus(id, patch),

    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets'] })
      const snapshot = queryClient.getQueryData<Ticket[]>(['tickets'])

      queryClient.setQueryData<Ticket[]>(['tickets'], (prev) =>
        prev?.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      )

      return { snapshot }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(['tickets'], ctx.snapshot)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
