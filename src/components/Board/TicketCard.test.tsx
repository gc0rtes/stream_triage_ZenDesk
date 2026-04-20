import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TicketCard } from './TicketCard';
// urgencyFor is in src/utils/urgencyFor.ts — no need to import here
import type { Ticket } from '../../types/ticket';

const mockTicket: Ticket = {
  id: 12345,
  subject: 'Test subject for card render',
  status: 'open',
  tier: 'enterprise',
  holdType: null,
  tags: ['test'],
  updatedAt: Date.now() - 2 * 3_600_000,
  replies: 3,
  sentiment: 'positive',
  assignee: 'MK',
  linear: null,
  customer: 'Acme Corp',
    requesterName: null,
    requesterEmail: null,
    lastRequesterReplyAt: null,
    lastAgentReplyAt: null,
};

describe('TicketCard', () => {
  it('renders subject, tier badge, and assignee chip', () => {
    const onOpen = vi.fn();
    render(
      <TicketCard
        t={mockTicket}
        nowMs={Date.now()}
        staleHours={48}
        onOpen={onOpen}
      />
    );

    expect(screen.getByText('Test subject for card render')).toBeTruthy();
    expect(screen.getByText('ENT')).toBeTruthy();
    expect(screen.getByTitle('Mira K.')).toBeTruthy();
  });
});
