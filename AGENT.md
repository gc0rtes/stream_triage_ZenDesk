# Zendesk Kanban — Ralph Loop Agent

You are a Senior Developer building a Zendesk Kanban UI for Stream support engineers.
Each iteration, read the current state of the codebase and git log, then continue from where you left off.

## Goal

Build a fully functional Kanban board that:
- Fetches tickets from the Zendesk API (`https://stream.zendesk.com/api/v2`)
- Displays them in columns by ZD status: `new` | `open` | `pending` | `hold` | `solved`
- Allows dragging cards between columns to update ticket status via `PUT /tickets/{id}.json`
- Uses MSW to mock the ZD API during development (never hits the real API)
- Passes all Vitest tests

When complete, output: `<promise>KANBAN_COMPLETE</promise>`

---

## Build Order

Work through these phases in order. Check git log to see which are done.

### Phase 1 — Foundation
- [ ] Install and configure Tailwind CSS (`npm install -D tailwindcss @tailwindcss/vite`)
- [ ] Install and configure Vitest + React Testing Library + jsdom
- [ ] Install MSW (`npm install msw --save-dev && npx msw init public/ --save`)
- [ ] Define `src/types/ticket.ts` — internal `Ticket` type
- [ ] Scaffold `src/api/zendesk.ts` — `zdFetch` base client with Basic Auth headers from env vars

### Phase 2 — API + Mocks
- [ ] `src/api/tickets.ts` — `fetchTickets()` and `updateTicketStatus(id, status)`
- [ ] `src/mocks/fixtures/tickets.ts` — 5+ mock tickets across all 5 statuses
- [ ] `src/mocks/handlers.ts` — MSW GET `/tickets.json` and PUT `/tickets/:id.json`
- [ ] `src/mocks/browser.ts` — MSW worker setup
- [ ] Wire MSW into `src/main.tsx` (dev-only)
- [ ] `src/utils/mapTicket.ts` — maps raw ZD response to internal `Ticket`

### Phase 3 — Hooks
- [ ] `src/hooks/useTickets.ts` — TanStack Query `useQuery` wrapping `fetchTickets`
- [ ] `src/hooks/useUpdateTicket.ts` — TanStack Query `useMutation` wrapping `updateTicketStatus`, optimistically updates query cache

### Phase 4 — Components
- [ ] `src/components/Board/TicketCard.tsx` — displays subject, status badge, priority, requester name, time since last update
- [ ] `src/components/Board/Column.tsx` — renders a list of `TicketCard` with `@hello-pangea/dnd` droppable
- [ ] `src/components/Board/Board.tsx` — `DragDropContext` wrapping all columns, calls `useUpdateTicket` on drag end
- [ ] Wire `Board` into `App.tsx` with `QueryClientProvider`

### Phase 5 — Polish + Tests
- [ ] Vitest test for `TicketCard` — renders subject, priority, requester
- [ ] Vitest test for `Column` — renders correct number of cards
- [ ] Vitest test for `mapTicket` — maps ZD response fields correctly
- [ ] `npm test` — all tests green
- [ ] `npm run build` — no TypeScript errors

---

## Self-Correction Loop

After each phase:
1. Run `npm run lint` — fix all errors before continuing
2. Run `npm test` — fix failing tests before continuing
3. Run `npm run build` — fix type errors before continuing
4. Commit with a descriptive message

If stuck on a phase after 3 attempts, document what's blocking in a `BLOCKED.md` and move to the next phase.

---

## Constraints (never violate these)

- All ZD calls go through `src/api/` — never fetch in components
- No barrel `index.ts` files — import directly from source files
- No inline component definitions inside render functions
- Use `import type` for type-only imports (`verbatimModuleSyntax` is on)
- Tailwind only — no inline styles, no separate CSS files for components
- No `useEffect` for data fetching — use TanStack Query

## Tech Stack

- React 19 + TypeScript strict + Vite
- TanStack Query v5
- @hello-pangea/dnd
- Tailwind CSS
- MSW v2
- Vitest + React Testing Library

## Skills

Apply `.agents/skills/vercel-react-best-practices` on every component and hook.
Priority rules: `async-parallel`, `rerender-no-inline-components`, `rerender-memo`, `rerender-derived-state-no-effect`, `js-set-map-lookups`, `bundle-barrel-imports`.

---

Output `<promise>KANBAN_COMPLETE</promise>` only when all phases are done, all tests pass, and `npm run build` succeeds with zero errors.
