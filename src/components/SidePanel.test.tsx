import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidePanel } from './SidePanel';
import { SEED_TICKETS } from '../mocks/fixtures/tickets';

const ticket = SEED_TICKETS[0];
const nowMs = Date.now();

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  );
}

describe('SidePanel', () => {
  it('renders ticket subject and customer', () => {
    render(<SidePanel ticket={ticket} onClose={vi.fn()} nowMs={nowMs} />, { wrapper });
    expect(screen.getByText(ticket.subject)).toBeInTheDocument();
    expect(screen.getByText(ticket.customer)).toBeInTheDocument();
  });

  it('returns null when ticket is null', () => {
    const { container } = render(<SidePanel ticket={null} onClose={vi.fn()} nowMs={nowMs} />, { wrapper });
    expect(container.firstChild).toBeNull();
  });
});
