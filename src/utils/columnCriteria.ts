import type { ColumnKey } from '../types/ticket';

/**
 * Human-readable routing rules (mirrors `classifyTicket` in `utils/classifyTicket.ts`).
 * `staleHours` is the Tweaks panel “Stale hours” value used for Priority vs Standard open.
 */
export function getColumnCriteriaLines(
  colKey: ColumnKey,
  staleHours: number,
): readonly string[] {
  const h = staleHours;
  switch (colKey) {
    case 'unassigned':
      return [
        'No Zendesk assignee on the ticket (unassigned).',
        'These come from the board fetch for new tickets with no assignee, together with your own queues.',
      ];
    case 'priority':
      return [
        'Open or new, not pending, on hold, or solved; has an assignee.',
        `Priority open: enterprise, tier 1, or stale — hours since last update is greater than your ${h}h stale cutoff (board clock).`,
        'Otherwise the ticket appears in Standard open.',
      ];
    case 'standard':
      return [
        'Open or new, has an assignee, not pending or on hold.',
        `Standard open: not in Priority — not enterprise/tier 1 for that lane, and not stale (time since last update is at most your ${h}h cutoff, board clock).`,
      ];
    case 'hold_dev':
      return [
        'Zendesk status is on hold.',
        'Hold type is engineering / Linear (not the feature-request hold lane).',
      ];
    case 'hold_fr':
      return [
        'Zendesk status is on hold.',
        'Hold type is feature request (tags), not the engineering hold lane.',
      ];
    case 'pending':
      return ['Zendesk status is pending (waiting on the customer).'];
    case 'solved':
      return [
        'Zendesk status is solved.',
        'Last updated within the last 7 days; older solved tickets are not shown on the board.',
      ];
    default:
      return [];
  }
}
