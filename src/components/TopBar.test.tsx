import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopBar } from './TopBar';
import { AuthProvider } from '../context/AuthContext';
import type { Ticket } from '../types/ticket';
import type { ReactNode } from 'react';

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
    requesterName: null,
    requesterEmail: null,
    lastRequesterReplyAt: null,
    lastAgentReplyAt: null,
  };
}

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const defaultProps = {
  query: '',
  setQuery: vi.fn(),
  tierFilter: new Set<string>(),
  setTierFilter: vi.fn(),
  onRefresh: vi.fn(),
  isRefreshing: false,
  onToggleColConfig: vi.fn(),
  colConfigActive: false,
  tickets: [makeTicket(1), makeTicket(2)],
  nowMs: NOW,
  staleHours: 48,
  accentHue: 145,
  theme: 'warm-coal',
  onThemeChange: vi.fn(),
};

describe('TopBar', () => {
  it('calls setQuery when typing in search input', () => {
    const setQuery = vi.fn();
    render(<TopBar {...defaultProps} setQuery={setQuery} />, { wrapper: Wrapper });

    const input = screen.getByPlaceholderText('Search tickets, customers, tags');
    fireEvent.change(input, { target: { value: 'hello' } });

    expect(setQuery).toHaveBeenCalledWith('hello');
  });

  it('renders logo text', () => {
    render(<TopBar {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText('Triage')).toBeTruthy();
  });

  it('renders tier filter buttons', () => {
    render(<TopBar {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText('ENT')).toBeTruthy();
    expect(screen.getByText('PRO')).toBeTruthy();
    expect(screen.getByText('FREE')).toBeTruthy();
  });

  it('refresh control sits beside Support · Live', () => {
    const onRefresh = vi.fn();
    render(<TopBar {...defaultProps} onRefresh={onRefresh} />, { wrapper: Wrapper });
    expect(screen.getByTitle('Refresh tickets')).toBeTruthy();
    const live = screen.getByText('Support · Live');
    const refresh = screen.getByTitle('Refresh tickets');
    expect(live.compareDocumentPosition(refresh) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
