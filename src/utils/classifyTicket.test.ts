import { describe, it, expect } from 'vitest';
import { classifyTicket } from './classifyTicket';
import type { Ticket } from '../types/ticket';

const NOW = Date.now();
const STALE_HOURS = 48;

const base: Ticket = {
  id: 1,
  subject: 'Test ticket',
  status: 'open',
  tier: 'pro',
  holdType: null,
  tags: [],
  updatedAt: NOW - 1 * 3600_000, // 1h ago (fresh)
  replies: 0,
  sentiment: null,
  assignee: 'MK',
  linear: null,
  customer: 'ACME',
    requesterName: null,
    requesterEmail: null,
    lastRequesterReplyAt: null,
    lastAgentReplyAt: null,
};

describe('classifyTicket', () => {
  it('enterprise open ticket → priority', () => {
    const t: Ticket = { ...base, tier: 'enterprise' };
    expect(classifyTicket(t, NOW, STALE_HOURS)).toBe('priority');
  });

  it('pro open fresh → standard', () => {
    const t: Ticket = { ...base, tier: 'pro', updatedAt: NOW - 1 * 3600_000 };
    expect(classifyTicket(t, NOW, STALE_HOURS)).toBe('standard');
  });

  it('pro open stale >48h → priority', () => {
    const t: Ticket = { ...base, tier: 'pro', updatedAt: NOW - 62 * 3600_000 };
    expect(classifyTicket(t, NOW, STALE_HOURS)).toBe('priority');
  });

  it('hold linear → hold_dev', () => {
    const t: Ticket = { ...base, status: 'hold', holdType: 'linear' };
    expect(classifyTicket(t, NOW, STALE_HOURS)).toBe('hold_dev');
  });

  it('hold feature_request → hold_fr', () => {
    const t: Ticket = { ...base, status: 'hold', holdType: 'feature_request' };
    expect(classifyTicket(t, NOW, STALE_HOURS)).toBe('hold_fr');
  });

  it('pending → pending', () => {
    const t: Ticket = { ...base, status: 'pending' };
    expect(classifyTicket(t, NOW, STALE_HOURS)).toBe('pending');
  });

  it('solved recent → solved', () => {
    const t: Ticket = { ...base, status: 'solved', updatedAt: NOW - 24 * 3600_000 };
    expect(classifyTicket(t, NOW, STALE_HOURS)).toBe('solved');
  });
});
