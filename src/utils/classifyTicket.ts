import type { Ticket, ColumnKey } from '../types/ticket';

export function classifyTicket(t: Ticket, nowMs: number, staleHours: number): ColumnKey | null {
  const ageHours = (nowMs - t.updatedAt) / 3600_000;
  if (t.status === 'solved') {
    return ageHours <= 24 * 7 ? 'solved' : null;
  }
  if (t.status === 'pending') return 'pending';
  if (t.status === 'hold') {
    return t.holdType === 'linear' ? 'hold_dev' : 'hold_fr';
  }
  // open
  if (t.tier === 'enterprise' || ageHours > staleHours) return 'priority';
  return 'standard';
}
