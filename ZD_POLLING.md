# How the dashboard stays up to date with Zendesk

## The problem

Zendesk has no WebSocket or push API. The only way to know about changes is to ask.

---

## Two polling layers

### Layer 1 — Incremental sync (every 30 s)

**File:** `src/hooks/useIncrementalSync.ts`  
**API:** `GET /api/v2/incremental/tickets.json?start_time={cursor}`

This is Zendesk's official "give me everything that changed since timestamp X" endpoint.
It returns only the tickets that were created or modified after the cursor, so the response
is small even if you have thousands of tickets.

Flow:
1. On mount, the cursor starts at **now − 5 minutes** (catches anything missed during page load).
2. Every 30 seconds it calls the endpoint with the current cursor.
3. ZD returns `{ tickets: [...changed], end_time: <new cursor> }`.
4. The hook advances the cursor to `end_time` (only if it moved forward).
5. Changed tickets are merged directly into the TanStack Query cache for `['tickets']`:
   - Tickets assigned to you → added or updated in place.
   - Tickets already on the board → updated even if now assigned to someone else.
   - Tickets solved and no longer yours → removed.
6. The board re-renders immediately with no full reload.

**Why not just use this alone?**  
The incremental API returns *all* changed tickets across your whole ZD account.
It will not tell you about tickets that were never in your cache (e.g. a brand-new
unassigned ticket that appeared while the tab was open). The full search in layer 2
handles that.

---

### Layer 2 — Full refetch (every 60 s)

**File:** `src/hooks/useTickets.ts` via TanStack Query `refetchInterval`  
**API:** 6 parallel search queries (same as initial load)

Every 60 seconds the app re-runs the exact same 6 searches it does on first load:

| Query | Why |
|---|---|
| `assignee_id:ME status:open` | my open tickets |
| `assignee_id:ME status:pending` | my pending tickets |
| `assignee_id:ME status:hold` | my hold tickets |
| `assignee_id:ME status:new` | my new tickets |
| `assignee:none status:new` | unassigned inbox |
| `assignee_id:ME status:solved updated>7daysago` | recently solved |

This is the safety net. It catches:
- New unassigned tickets that incremental sync missed.
- Tickets reassigned *to* you that the incremental filter skipped.
- Any inconsistency the incremental merge introduced.

After this runs, the cache is fully authoritative again.

---

### Manual refresh button (top-right ↺)

Triggers layer 2 immediately on demand. The icon spins while the request is in flight.
It does **not** clear the board — only refetches from ZD.

---

## Timeline

```
t=0s    Page loads → full fetch (layer 2)
t=0s    Incremental cursor set to now−5min
t=30s   Incremental poll #1 → small diff merged
t=60s   Full refetch (layer 2) + incremental poll #2
t=90s   Incremental poll #3
t=120s  Full refetch (layer 2) + incremental poll #4
...
```

Effective latency for a new/changed ticket to appear: **≤ 30 seconds**.

---

## What can still be missed

- If the browser tab is in the background, `refetchIntervalInBackground: false` pauses
  the full refetch. Incremental sync keeps running. Bring the tab to focus and the full
  refetch fires immediately.
- The incremental API has a ZD-side rate limit. If it returns an error the hook silently
  skips that tick and retries 30 s later. The 60 s full refetch self-heals any gap.
