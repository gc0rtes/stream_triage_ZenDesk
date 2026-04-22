import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FullTicket } from '../api/tickets'
import { submitReply, MY_ASSIGNEE_ID } from '../api/tickets'

export function usePostReply(ticketId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { body?: string; htmlBody?: string; isPublic?: boolean; status?: string; uploads?: string[]; assigneeId?: number | null; customFields?: Array<{ id: number; value: string | string[] | boolean | null }>; ccEmails?: string[] }) =>
      submitReply(ticketId!, vars),
    onMutate: async ({ body, htmlBody, isPublic }) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', ticketId] })
      const prev = queryClient.getQueryData<FullTicket>(['ticket', ticketId])
      if (htmlBody?.trim() || body?.trim()) {
        queryClient.setQueryData<FullTicket>(['ticket', ticketId], old => {
          if (!old) return old
          return {
            ...old,
            comments: [...old.comments, {
              id: Date.now(),
              author_id: MY_ASSIGNEE_ID,
              author_name: 'Guilherme Cortes',
              body: body ?? '',
              html_body: htmlBody,
              public: isPublic ?? true,
              created_at: new Date().toISOString(),
              attachments: [],
            }],
          }
        })
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['ticket', ticketId], ctx.prev)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      void queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
