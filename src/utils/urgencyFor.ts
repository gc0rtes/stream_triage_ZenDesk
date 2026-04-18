import type { Ticket } from '../types/ticket';

export function urgencyFor(t: Ticket, nowMs: number, staleHours: number): number {
  if (t.status !== 'open') return 0;
  const age = (nowMs - t.updatedAt) / 3_600_000;
  return Math.max(0, Math.min(1, age / staleHours));
}
