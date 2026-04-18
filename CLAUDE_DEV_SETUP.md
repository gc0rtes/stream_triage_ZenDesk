# Claude Dev Environment — Zendesk Kanban UI

> For: Guilherme (Support Engineer @ Stream)  
> Stack: React 19 + TypeScript + Vite + TanStack Query + @hello-pangea/dnd  
> Goal: Kanban board to manage Zendesk tickets on top of the ZD API

---

## 1. CLAUDE.md — The Brain of Your Dev Environment

Create a `CLAUDE.md` at the project root. This file is loaded automatically by Claude Code every session and acts as standing instructions.

**What to put in it:**

```markdown
# Project: Zendesk Kanban UI

## Context
- Internal tool for support engineers at Stream (getstream.io)
- Fetches and manages Zendesk tickets via ZD REST API
- React 19 + TypeScript + Vite + TanStack Query + @hello-pangea/dnd

## Dev Guidelines
- Always use TypeScript strict mode
- API calls go through `src/api/` — never fetch directly in components
- Zendesk API base URL: https://stream.zendesk.com/api/v2
- Use MSW for mocking during development — never hit real ZD API in tests
- Prefer React Query for all async state — no useEffect for data fetching

## Folder Structure
See CLAUDE_DEV_SETUP.md for full structure guide.

## Commands
- `npm run dev` — start dev server
- `npm run build` — type-check + build
- `npm run lint` — lint
```

---

## 2. Recommended Folder Structure

```
src/
├── api/
│   ├── zendesk.ts          # ZD API client (base URL, auth headers)
│   ├── tickets.ts          # ticket-specific endpoints
│   └── types.ts            # ZD API response types
│
├── components/
│   ├── Board/
│   │   ├── Board.tsx       # main kanban container
│   │   ├── Column.tsx      # single status column
│   │   └── TicketCard.tsx  # draggable ticket card
│   └── ui/                 # generic atoms (Badge, Avatar, etc.)
│
├── hooks/
│   ├── useTickets.ts       # TanStack Query hook for ticket fetching
│   └── useUpdateTicket.ts  # mutation hook for status updates
│
├── mocks/
│   ├── handlers.ts         # MSW request handlers
│   ├── browser.ts          # MSW browser setup
│   └── fixtures/
│       └── tickets.ts      # hardcoded fake ticket data
│
├── types/
│   └── ticket.ts           # your internal Ticket type (mapped from ZD)
│
└── utils/
    └── mapTicket.ts        # maps ZD API response → internal Ticket type
```

**Why this matters:** Keep ZD API concerns in `src/api/` and `src/types/`. Your components should only know about your internal `Ticket` type — not ZD's raw response shape. This makes it easy to swap or extend the API layer later.

---

## 3. Mocking the Zendesk API (MSW)

Use **Mock Service Worker (MSW)** so you can build and iterate without hitting the real ZD API.

### Install

```bash
npm install msw --save-dev
npx msw init public/ --save
```

### Fixture: `src/mocks/fixtures/tickets.ts`

```ts
export const mockTickets = [
  {
    id: 1001,
    subject: "SDK crash on Android 14",
    status: "open",
    priority: "urgent",
    requester: { name: "Alice", email: "alice@customer.com" },
    assignee: { name: "Guilherme" },
    created_at: "2026-04-15T10:00:00Z",
    updated_at: "2026-04-16T08:30:00Z",
    tags: ["android", "sdk"],
  },
  {
    id: 1002,
    subject: "Webhook not firing on message.new",
    status: "pending",
    priority: "high",
    requester: { name: "Bob", email: "bob@customer.com" },
    assignee: { name: "Guilherme" },
    created_at: "2026-04-14T09:00:00Z",
    updated_at: "2026-04-16T11:00:00Z",
    tags: ["webhooks"],
  },
  {
    id: 1003,
    subject: "How to filter channels by custom field?",
    status: "solved",
    priority: "normal",
    requester: { name: "Carol", email: "carol@customer.com" },
    assignee: null,
    created_at: "2026-04-13T14:00:00Z",
    updated_at: "2026-04-15T16:00:00Z",
    tags: ["channels", "query"],
  },
]
```

### Handler: `src/mocks/handlers.ts`

```ts
import { http, HttpResponse } from 'msw'
import { mockTickets } from './fixtures/tickets'

export const handlers = [
  http.get('https://stream.zendesk.com/api/v2/tickets.json', () => {
    return HttpResponse.json({ tickets: mockTickets, count: mockTickets.length })
  }),

  http.put('https://stream.zendesk.com/api/v2/tickets/:id.json', async ({ params, request }) => {
    const body = await request.json() as any
    const ticket = mockTickets.find(t => t.id === Number(params.id))
    if (!ticket) return HttpResponse.json({ error: 'not found' }, { status: 404 })
    return HttpResponse.json({ ticket: { ...ticket, ...body.ticket } })
  }),
]
```

### Browser setup: `src/mocks/browser.ts`

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

### Enable in `src/main.tsx`

```ts
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
})
```

---

## 4. Ralph Loop Setup

Ralph Loop is your inner dev loop with Claude. Structure it to iterate on one feature at a time.

### Recommended Ralph Loop prompt pattern

When you start a session, open Ralph Loop with a scoped prompt like:

```
Build the TicketCard component. It should display: ticket subject, 
status badge, priority, requester name, and time since last update.
Use the Ticket type from src/types/ticket.ts. 
No real API calls — MSW is already wired up.
```

**Tips for effective Ralph Loop use:**
- **One component or feature per loop** — don't ask for the whole board at once
- **Always reference file paths** — "update `src/hooks/useTickets.ts`" is better than "update the hook"
- **Mention what's already done** — "MSW is wired, TanStack Query is installed, now build X"
- **End loops when it drifts** — if Claude starts refactoring things you didn't ask for, cancel and restart with a tighter prompt

### Suggested loop sequence for this project

1. `src/types/ticket.ts` — define internal Ticket type
2. `src/api/zendesk.ts` + `src/api/tickets.ts` — API client + fetch function
3. `src/hooks/useTickets.ts` — TanStack Query hook
4. `src/components/Board/TicketCard.tsx` — card UI
5. `src/components/Board/Column.tsx` — column with drag support
6. `src/components/Board/Board.tsx` — full board wiring
7. `src/hooks/useUpdateTicket.ts` — mutation for drag-to-update status

---

## 5. Recommended Claude Skills

| Skill | When to use |
|---|---|
| `/init` | Run once at project start — generates a CLAUDE.md from your codebase |
| `/review` | Before shipping any feature — asks Claude to review the diff |
| `/security-review` | Before wiring up real ZD API credentials |
| `/simplify` | After a Ralph Loop — cleans up and removes over-engineering |
| `/ralph-loop` | Your main inner dev loop for building features |

**Order for first session:**
1. Run `/init` to generate CLAUDE.md baseline
2. Edit CLAUDE.md with ZD-specific context (see section 1)
3. Start `/ralph-loop` for your first feature

---

## 6. ZD API Auth (when you're ready for the real API)

Store credentials in a `.env.local` file (never commit this):

```bash
VITE_ZD_EMAIL=guilherme.cortes@getstream.io/token
VITE_ZD_TOKEN=your_api_token_here
VITE_ZD_SUBDOMAIN=stream
```

Use Basic Auth (email/token is the ZD standard):

```ts
// src/api/zendesk.ts
const BASE_URL = `https://${import.meta.env.VITE_ZD_SUBDOMAIN}.zendesk.com/api/v2`

const headers = {
  'Authorization': `Basic ${btoa(`${import.meta.env.VITE_ZD_EMAIL}:${import.meta.env.VITE_ZD_TOKEN}`)}`,
  'Content-Type': 'application/json',
}

export async function zdFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`ZD API error: ${res.status}`)
  return res.json()
}
```

Add `.env.local` to `.gitignore` — verify it's already there before adding the token.

---

## 7. Kanban Column → ZD Status Mapping

| Column | ZD `status` value |
|---|---|
| New | `new` |
| Open | `open` |
| Pending | `pending` |
| On Hold | `hold` |
| Solved | `solved` |

Drag-and-drop between columns = `PUT /tickets/{id}.json` with `{ ticket: { status: "pending" } }`.

---

## 8. Quick Reference: First 3 Steps to Take Now

1. **Create `CLAUDE.md`** at project root with the template from section 1
2. **Install MSW** and scaffold `src/mocks/` with the fixture and handler from section 3
3. **Run `/init`** in Claude Code to let it read your project and augment the CLAUDE.md

After those 3 steps, you're ready to start your first Ralph Loop.
