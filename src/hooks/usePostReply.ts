import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FullTicket } from '../api/tickets'
import { postReply, MY_ASSIGNEE_ID } from '../api/tickets'

export function usePostReply(ticketId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ body, isPublic }: { body: string; isPublic: boolean }) =>
      postReply(ticketId!, body, isPublic),
    onMutate: async ({ body, isPublic }) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', ticketId] })
      const prev = queryClient.getQueryData<FullTicket>(['ticket', ticketId])
      queryClient.setQueryData<FullTicket>(['ticket', ticketId], old => {
        if (!old) return old
        return {
          ...old,
          comments: [...old.comments, {
            id: Date.now(),
            author_id: MY_ASSIGNEE_ID,
            author_name: 'Guilherme Cortes',
            body,
            public: isPublic,
            created_at: new Date().toISOString(),
          }],
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['ticket', ticketId], ctx.prev)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}
