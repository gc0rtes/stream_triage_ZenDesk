// Seed ticket data + helpers.
// NOW is a frozen "current moment" so card ages stay deterministic while the
// live counter ticks off a simulated clock that advances in real time.

const NOW_BASE = Date.now();
// expose a ticking "now" so the timers in cards update each second
const useNow = () => {
  const [n, setN] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setN(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return n;
};

const hoursAgo = (h) => NOW_BASE - h * 3600_000;
const minsAgo = (m) => NOW_BASE - m * 60_000;
const daysAgo = (d) => NOW_BASE - d * 24 * 3600_000;

// status values: open | hold | pending | solved
// tier: enterprise | pro | free
// holdType: linear | feature_request | null
// sentiment: positive | neutral | negative | null
const SEED_TICKETS = [
  // PRIORITY OPEN (enterprise OR stale >48h)
  { id: 48219, subject: "SDK crash on iOS 17.4 — production release blocked", customer: "Northwind Logistics", tier: "enterprise", status: "open", tags: ["ios", "sdk", "crash"], updatedAt: hoursAgo(3), replies: 8, sentiment: "negative", assignee: "MK", linear: "ENG-2184", holdType: null },
  { id: 48101, subject: "Webhook signature mismatch after 4.2 upgrade", customer: "Harborline", tier: "enterprise", status: "open", tags: ["webhooks", "auth"], updatedAt: hoursAgo(11), replies: 4, sentiment: "neutral", assignee: "JR", linear: null, holdType: null },
  { id: 47980, subject: "Rate limit headers missing from 429 responses", customer: "Pax Studios", tier: "pro", status: "open", tags: ["api", "stale"], updatedAt: hoursAgo(62), replies: 2, sentiment: "neutral", assignee: "MK", linear: null, holdType: null },
  { id: 47942, subject: "Bulk export times out on >10k rows", customer: "Greenline Co", tier: "free", status: "open", tags: ["exports"], updatedAt: hoursAgo(55), replies: 3, sentiment: "negative", assignee: "SL", linear: null, holdType: null },

  // STANDARD OPEN (non-enterprise, <48h)
  { id: 48240, subject: "How do I rotate API keys without downtime?", customer: "Flux & Field", tier: "pro", status: "open", tags: ["how-to", "security"], updatedAt: minsAgo(28), replies: 1, sentiment: "neutral", assignee: "AB", linear: null, holdType: null },
  { id: 48237, subject: "Avatar upload returns 500 intermittently", customer: "Junie Apparel", tier: "pro", status: "open", tags: ["uploads"], updatedAt: hoursAgo(2), replies: 2, sentiment: "negative", assignee: "AB", linear: null, holdType: null },
  // approaching cutoff — should pulse
  { id: 48150, subject: "Documentation link in dashboard 404s", customer: "Sola Interiors", tier: "free", status: "open", tags: ["docs"], updatedAt: hoursAgo(41), replies: 1, sentiment: "neutral", assignee: "SL", linear: null, holdType: null },
  { id: 48144, subject: "Usage chart timezone seems off by 1hr", customer: "Motorhaus", tier: "pro", status: "open", tags: ["dashboard", "timezone"], updatedAt: hoursAgo(44), replies: 2, sentiment: "neutral", assignee: "JR", linear: null, holdType: null },
  { id: 48210, subject: "Can you confirm EU data residency for new plan?", customer: "Bleu Studio", tier: "pro", status: "open", tags: ["compliance"], updatedAt: hoursAgo(6), replies: 1, sentiment: "neutral", assignee: "MK", linear: null, holdType: null },

  // ON-HOLD (DEV/LINEAR)
  { id: 47811, subject: "Search returns stale results after index rebuild", customer: "Northwind Logistics", tier: "enterprise", status: "hold", tags: ["search", "bug"], updatedAt: daysAgo(3), replies: 11, sentiment: "neutral", assignee: "JR", linear: "ENG-2011", holdType: "linear" },
  { id: 47720, subject: "SSO callback occasionally drops state param", customer: "Atlas Federal", tier: "enterprise", status: "hold", tags: ["sso", "bug"], updatedAt: daysAgo(5), replies: 6, sentiment: "neutral", assignee: "MK", linear: "ENG-1944", holdType: "linear" },
  { id: 47612, subject: "Timeline events missing for archived users", customer: "Junie Apparel", tier: "pro", status: "hold", tags: ["bug", "timeline"], updatedAt: daysAgo(8), replies: 4, sentiment: "neutral", assignee: "AB", linear: "ENG-1876", holdType: "linear" },

  // ON-HOLD (FEATURE REQUESTS)
  { id: 47502, subject: "Please add dark-mode to email reports", customer: "Pax Studios", tier: "pro", status: "hold", tags: ["feature", "email"], updatedAt: daysAgo(12), replies: 3, sentiment: "positive", assignee: "SL", linear: null, holdType: "feature_request" },
  { id: 47489, subject: "Bulk-edit tags across tickets", customer: "Harborline", tier: "enterprise", status: "hold", tags: ["feature", "tags"], updatedAt: daysAgo(14), replies: 2, sentiment: "neutral", assignee: "JR", linear: null, holdType: "feature_request" },

  // PENDING (waiting on customer)
  { id: 48188, subject: "Can you share the HAR file from the failed request?", customer: "Greenline Co", tier: "free", status: "pending", tags: ["waiting"], updatedAt: hoursAgo(16), replies: 5, sentiment: "neutral", assignee: "AB", linear: null, holdType: null },
  { id: 48166, subject: "Need the exact time range where you saw the spike", customer: "Motorhaus", tier: "pro", status: "pending", tags: ["waiting"], updatedAt: hoursAgo(22), replies: 3, sentiment: "neutral", assignee: "MK", linear: null, holdType: null },
  { id: 48155, subject: "Still unable to reproduce — could you record a loom?", customer: "Sola Interiors", tier: "free", status: "pending", tags: ["waiting"], updatedAt: daysAgo(2), replies: 2, sentiment: "neutral", assignee: "SL", linear: null, holdType: null },

  // RECENTLY SOLVED
  { id: 48050, subject: "Webhook retries not honoring exponential backoff", customer: "Bleu Studio", tier: "pro", status: "solved", tags: ["webhooks"], updatedAt: daysAgo(1), replies: 6, sentiment: "positive", assignee: "JR", linear: "ENG-2170", holdType: null },
  { id: 48002, subject: "Billing invoice PDF blank on first download", customer: "Flux & Field", tier: "pro", status: "solved", tags: ["billing"], updatedAt: daysAgo(2), replies: 3, sentiment: "positive", assignee: "AB", linear: null, holdType: null },
  { id: 47955, subject: "Dashboard login loop on Safari 17", customer: "Atlas Federal", tier: "enterprise", status: "solved", tags: ["auth"], updatedAt: daysAgo(4), replies: 7, sentiment: "positive", assignee: "MK", linear: null, holdType: null },
];

// column routing logic lives here so tweaks (stale cutoff) can change it
const classifyTicket = (t, nowMs, staleHours) => {
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
};

const COLUMNS = [
  { key: 'priority', label: 'Priority open', hint: 'Enterprise or stale >cutoff' },
  { key: 'standard', label: 'Standard open', hint: 'Awaiting first or next touch' },
  { key: 'hold_dev', label: 'On hold · Eng', hint: 'Linked to Linear tasks' },
  { key: 'hold_fr', label: 'On hold · FR', hint: 'Feature requests parked' },
  { key: 'pending', label: 'Pending', hint: 'Waiting on customer' },
  { key: 'solved', label: 'Recently solved', hint: 'Closed in last 7 days' },
];

const TIER_META = {
  enterprise: { label: 'ENT', full: 'Enterprise' },
  pro:        { label: 'PRO', full: 'Pro' },
  free:       { label: 'FREE', full: 'Free' },
};

const ASSIGNEES = {
  MK: { name: 'Mira K.',   hue: 145 },
  JR: { name: 'Jonas R.',  hue: 30  },
  SL: { name: 'Sade L.',   hue: 280 },
  AB: { name: 'Arun B.',   hue: 200 },
};

// humanize time since updated
const timeSince = (ms, nowMs) => {
  const s = Math.max(0, Math.floor((nowMs - ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
};

Object.assign(window, {
  SEED_TICKETS, COLUMNS, TIER_META, ASSIGNEES,
  classifyTicket, timeSince, useNow, hoursAgo, minsAgo, daysAgo,
});
