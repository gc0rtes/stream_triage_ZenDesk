import type { Ticket } from '../../types/ticket'

const NOW_BASE = Date.now()
const hoursAgo = (h: number) => NOW_BASE - h * 3_600_000
const minsAgo = (m: number) => NOW_BASE - m * 60_000
const daysAgo = (d: number) => NOW_BASE - d * 24 * 3_600_000

export const SEED_TICKETS: Ticket[] = [
  // PRIORITY OPEN (enterprise OR stale >48h)
  { id: 48219, subject: 'SDK crash on iOS 17.4 — production release blocked', customer: 'Northwind Logistics', tier: 'enterprise', status: 'open', tags: ['ios', 'sdk', 'crash'], updatedAt: hoursAgo(3), replies: 8, sentiment: 'negative', assignee: 'MK', linear: 'ENG-2184', holdType: null },
  { id: 48101, subject: 'Webhook signature mismatch after 4.2 upgrade', customer: 'Harborline', tier: 'enterprise', status: 'open', tags: ['webhooks', 'auth'], updatedAt: hoursAgo(11), replies: 4, sentiment: 'neutral', assignee: 'JR', linear: null, holdType: null },
  { id: 47980, subject: 'Rate limit headers missing from 429 responses', customer: 'Pax Studios', tier: 'pro', status: 'open', tags: ['api', 'stale'], updatedAt: hoursAgo(62), replies: 2, sentiment: 'neutral', assignee: 'MK', linear: null, holdType: null },
  { id: 47942, subject: 'Bulk export times out on >10k rows', customer: 'Greenline Co', tier: 'free', status: 'open', tags: ['exports'], updatedAt: hoursAgo(55), replies: 3, sentiment: 'negative', assignee: 'SL', linear: null, holdType: null },

  // STANDARD OPEN (non-enterprise, <48h)
  { id: 48240, subject: 'How do I rotate API keys without downtime?', customer: 'Flux & Field', tier: 'pro', status: 'open', tags: ['how-to', 'security'], updatedAt: minsAgo(28), replies: 1, sentiment: 'neutral', assignee: 'AB', linear: null, holdType: null },
  { id: 48237, subject: 'Avatar upload returns 500 intermittently', customer: 'Junie Apparel', tier: 'pro', status: 'open', tags: ['uploads'], updatedAt: hoursAgo(2), replies: 2, sentiment: 'negative', assignee: 'AB', linear: null, holdType: null },
  { id: 48150, subject: 'Documentation link in dashboard 404s', customer: 'Sola Interiors', tier: 'free', status: 'open', tags: ['docs'], updatedAt: hoursAgo(41), replies: 1, sentiment: 'neutral', assignee: 'SL', linear: null, holdType: null },
  { id: 48144, subject: 'Usage chart timezone seems off by 1hr', customer: 'Motorhaus', tier: 'pro', status: 'open', tags: ['dashboard', 'timezone'], updatedAt: hoursAgo(44), replies: 2, sentiment: 'neutral', assignee: 'JR', linear: null, holdType: null },
  { id: 48210, subject: 'Can you confirm EU data residency for new plan?', customer: 'Bleu Studio', tier: 'pro', status: 'open', tags: ['compliance'], updatedAt: hoursAgo(6), replies: 1, sentiment: 'neutral', assignee: 'MK', linear: null, holdType: null },

  // ON-HOLD (DEV/LINEAR)
  { id: 47811, subject: 'Search returns stale results after index rebuild', customer: 'Northwind Logistics', tier: 'enterprise', status: 'hold', tags: ['search', 'bug'], updatedAt: daysAgo(3), replies: 11, sentiment: 'neutral', assignee: 'JR', linear: 'ENG-2011', holdType: 'linear' },
  { id: 47720, subject: 'SSO callback occasionally drops state param', customer: 'Atlas Federal', tier: 'enterprise', status: 'hold', tags: ['sso', 'bug'], updatedAt: daysAgo(5), replies: 6, sentiment: 'neutral', assignee: 'MK', linear: 'ENG-1944', holdType: 'linear' },
  { id: 47612, subject: 'Timeline events missing for archived users', customer: 'Junie Apparel', tier: 'pro', status: 'hold', tags: ['bug', 'timeline'], updatedAt: daysAgo(8), replies: 4, sentiment: 'neutral', assignee: 'AB', linear: 'ENG-1876', holdType: 'linear' },

  // ON-HOLD (FEATURE REQUESTS)
  { id: 47502, subject: 'Please add dark-mode to email reports', customer: 'Pax Studios', tier: 'pro', status: 'hold', tags: ['feature', 'email'], updatedAt: daysAgo(12), replies: 3, sentiment: 'positive', assignee: 'SL', linear: null, holdType: 'feature_request' },
  { id: 47489, subject: 'Bulk-edit tags across tickets', customer: 'Harborline', tier: 'enterprise', status: 'hold', tags: ['feature', 'tags'], updatedAt: daysAgo(14), replies: 2, sentiment: 'neutral', assignee: 'JR', linear: null, holdType: 'feature_request' },

  // PENDING (waiting on customer)
  { id: 48188, subject: 'Can you share the HAR file from the failed request?', customer: 'Greenline Co', tier: 'free', status: 'pending', tags: ['waiting'], updatedAt: hoursAgo(16), replies: 5, sentiment: 'neutral', assignee: 'AB', linear: null, holdType: null },
  { id: 48166, subject: 'Need the exact time range where you saw the spike', customer: 'Motorhaus', tier: 'pro', status: 'pending', tags: ['waiting'], updatedAt: hoursAgo(22), replies: 3, sentiment: 'neutral', assignee: 'MK', linear: null, holdType: null },
  { id: 48155, subject: 'Still unable to reproduce — could you record a loom?', customer: 'Sola Interiors', tier: 'free', status: 'pending', tags: ['waiting'], updatedAt: daysAgo(2), replies: 2, sentiment: 'neutral', assignee: 'SL', linear: null, holdType: null },

  // RECENTLY SOLVED
  { id: 48050, subject: 'Webhook retries not honoring exponential backoff', customer: 'Bleu Studio', tier: 'pro', status: 'solved', tags: ['webhooks'], updatedAt: daysAgo(1), replies: 6, sentiment: 'positive', assignee: 'JR', linear: 'ENG-2170', holdType: null },
  { id: 48002, subject: 'Billing invoice PDF blank on first download', customer: 'Flux & Field', tier: 'pro', status: 'solved', tags: ['billing'], updatedAt: daysAgo(2), replies: 3, sentiment: 'positive', assignee: 'AB', linear: null, holdType: null },
  { id: 47955, subject: 'Dashboard login loop on Safari 17', customer: 'Atlas Federal', tier: 'enterprise', status: 'solved', tags: ['auth'], updatedAt: daysAgo(4), replies: 7, sentiment: 'positive', assignee: 'MK', linear: null, holdType: null },
]
