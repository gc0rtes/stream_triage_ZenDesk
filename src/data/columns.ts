import type { ColumnKey } from '../types/ticket';

export const COLUMNS: { key: ColumnKey; label: string; hint: string }[] = [
  { key: 'unassigned', label: 'Unassigned', hint: 'New tickets — assign to yourself' },
  { key: 'priority', label: 'Priority open', hint: 'Enterprise or stale >cutoff' },
  { key: 'standard', label: 'Standard open', hint: 'Awaiting first or next touch' },
  { key: 'hold_dev', label: 'On hold · Eng', hint: 'Linked to Linear tasks' },
  { key: 'hold_fr', label: 'On hold · FR', hint: 'Feature requests parked' },
  { key: 'pending', label: 'Pending', hint: 'Waiting on customer' },
  { key: 'solved', label: 'Recently solved', hint: 'Closed in last 7 days' },
];

export const TIER_META: Record<string, { label: string; full: string }> = {
  enterprise: { label: 'ENT', full: 'Enterprise' },
  pro:        { label: 'PRO', full: 'Pro' },
  free:       { label: 'FREE', full: 'Free' },
};

export const ASSIGNEES: Record<string, { name: string; hue: number }> = {
  GC: { name: 'Guilherme C.', hue: 200 },
  MK: { name: 'Mira K.',      hue: 145 },
  JR: { name: 'Jonas R.',     hue: 30  },
  SL: { name: 'Sade L.',      hue: 280 },
  AB: { name: 'Arun B.',      hue: 60  },
};
