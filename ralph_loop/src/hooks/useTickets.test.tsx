import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { useTickets } from './useTickets'
import * as ticketsApi from '../api/tickets'
import type { Ticket } from '../types/ticket'

const MOCK_TICKETS: Ticket[] = [
  {
    id: 1001,
    subject: 'Test ticket',
    status: 'open',
    tier: 'enterprise',
    holdType: null,
    tags: [],
    updatedAt: Date.now() - 3600_000,
    replies: 2,
    sentiment: 'neutral',
    assignee: 'MK',
    linear: null,
    customer: 'AcmeCorp',
  },
]

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('useTickets', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns ticket data from fetchTickets', async () => {
    vi.spyOn(ticketsApi, 'fetchTickets').mockResolvedValue(MOCK_TICKETS)

    const { result } = renderHook(() => useTickets(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_TICKETS)
    expect(ticketsApi.fetchTickets).toHaveBeenCalledOnce()
  })
})
