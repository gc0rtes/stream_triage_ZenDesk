import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Column } from './Column';
import type { Ticket } from '../../types/ticket';

const NOW = Date.now();

function makeTicket(id: number, subject: string): Ticket {
  return {
    id,
    subject,
    status: 'open',
    tier: 'pro',
    holdType: null,
    tags: [],
    updatedAt: NOW - 1000,
    replies: 0,
    sentiment: null,
    assignee: 'MK',
    linear: null,
    customer: 'Acme',
  };
}

const col = { key: 'standard' as const, label: 'Standard open', hint: 'Awaiting first or next touch' };

describe('Column', () => {
  it('renders all ticket subjects', () => {
    const tickets = [
      makeTicket(1, 'First ticket'),
      makeTicket(2, 'Second ticket'),
      makeTicket(3, 'Third ticket'),
    ];
    render(
      <Column
        col={col}
        tickets={tickets}
        nowMs={NOW}
        staleHours={48}
        onOpen={vi.fn()}
        onDrop={vi.fn()}
        cardVariant="default"
        density="comfortable"
      />
    );
    expect(screen.getByText('First ticket')).toBeTruthy();
    expect(screen.getByText('Second ticket')).toBeTruthy();
    expect(screen.getByText('Third ticket')).toBeTruthy();
  });

  it('shows Empty placeholder when no tickets', () => {
    render(
      <Column
        col={col}
        tickets={[]}
        nowMs={NOW}
        staleHours={48}
        onOpen={vi.fn()}
        onDrop={vi.fn()}
        cardVariant="default"
        density="comfortable"
      />
    );
    expect(screen.getByText('Empty')).toBeTruthy();
  });
});
