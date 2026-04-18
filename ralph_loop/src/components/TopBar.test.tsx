import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopBar } from './TopBar';
import type { Ticket } from '../types/ticket';

const NOW = Date.now();

function makeTicket(id: number): Ticket {
  return {
    id,
    subject: `Ticket ${id}`,
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

const defaultProps = {
  query: '',
  setQuery: vi.fn(),
  tierFilter: new Set<string>(),
  setTierFilter: vi.fn(),
  assigneeFilter: new Set<string>(),
  setAssigneeFilter: vi.fn(),
  onBurst: vi.fn(),
  onReset: vi.fn(),
  tickets: [makeTicket(1), makeTicket(2)],
  nowMs: NOW,
  staleHours: 48,
  showBurst: true,
};

describe('TopBar', () => {
  it('calls setQuery when typing in search input', () => {
    const setQuery = vi.fn();
    render(<TopBar {...defaultProps} setQuery={setQuery} />);

    const input = screen.getByPlaceholderText('Search tickets, customers, tags');
    fireEvent.change(input, { target: { value: 'hello' } });

    expect(setQuery).toHaveBeenCalledWith('hello');
  });

  it('renders logo text', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('Triage')).toBeTruthy();
  });

  it('renders tier filter buttons', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('ENT')).toBeTruthy();
    expect(screen.getByText('PRO')).toBeTruthy();
    expect(screen.getByText('FREE')).toBeTruthy();
  });
});
