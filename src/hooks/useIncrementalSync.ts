import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Ticket } from '../types/ticket'
import { fetchIncrementalTickets } from '../api/tickets'

const POLL_MS = 30_000

export function useIncrementalSync() {
  const queryClient = useQueryClient()
  // Start cursor at 5 minutes ago so the first poll catches anything missed on load
  const cursorRef = useRef(Math.floor((Date.now() - 5 * 60_000) / 1000))

  useEffect(() => {
    const poll = async () => {
      try {
        const { tickets: changed, endTime } = await fetchIncrementalTickets(cursorRef.current)
        if (endTime > cursorRef.current) cursorRef.current = endTime

        if (changed.length === 0) return

        queryClient.setQueryData<Ticket[]>(['tickets'], prev => {
          if (!prev) return prev
          const map = new Map(prev.map(t => [t.id, t]))
          for (const t of changed) {
            const isMyTicket = t.assignee === 'GC'
            const isUnassignedNew = t.assignee === '' && t.status === 'open'
            const wasInBoard = map.has(t.id)

            if (isMyTicket || isUnassignedNew || wasInBoard) {
              // Remove closed tickets that are no longer relevant
              if (t.status === 'solved' && !isMyTicket) {
                map.delete(t.id)
              } else {
                map.set(t.id, t)
              }
            }
          }
          return Array.from(map.values())
        })
      } catch {
        // silently ignore — full refetch via useTickets will self-heal
      }
    }

    const id = setInterval(() => { void poll() }, POLL_MS)
    return () => clearInterval(id)
  }, [queryClient])
}
