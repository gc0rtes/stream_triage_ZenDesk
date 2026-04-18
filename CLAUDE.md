# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Internal Zendesk Kanban UI for Stream support engineers. Fetches and manages ZD tickets via the Zendesk REST API (`https://stream.zendesk.com/api/v2`). Client-side only — React 19, no backend, no Next.js.

## Commands

```bash
npm run dev       # start dev server (Vite HMR)
npm run build     # type-check + production build
npm run lint      # ESLint
```

```bash
npm test          # run Vitest tests
```

## Architecture

Reference design: `design_example_app/`. Match it faithfully.

```
src/
├── api/              # zdFetch client + fetchTickets, updateTicketStatus
├── components/
│   ├── Board/        # Board.tsx, Column.tsx, TicketCard.tsx (+ sub-pieces)
│   ├── TopBar.tsx    # search, tier/assignee filters, BurstMeter
│   ├── SidePanel.tsx # right drawer on card click
│   └── TweaksPanel.tsx # floating design tweaks (accent, density, stale cutoff)
├── data/             # COLUMNS, TIER_META, ASSIGNEES constants
├── hooks/            # useTickets, useUpdateTicket, useNow
├── mocks/            # MSW handlers + SEED_TICKETS fixtures
├── theme.ts          # ACCENT_PRESETS, DENSITY_PRESETS, makeCssVars()
├── types/            # Ticket interface, ColumnKey type
└── utils/            # classifyTicket, timeSince
```

**Styling:** CSS custom properties via inline `style` props — NO Tailwind. `makeCssVars({ accentHue })` returns an object of `--bg`, `--surface`, `--accent`, etc. using `oklch()` values. Applied to the root container.

**Column logic:** Columns are computed, not raw ZD status. `classifyTicket(t, nowMs, staleHours)` routes each ticket to one of 6 columns:

| Column | Rule |
|--------|------|
| `priority` | open + (enterprise OR age > staleHours) |
| `standard` | open + non-enterprise + fresh |
| `hold_dev` | hold + holdType `linear` |
| `hold_fr` | hold + holdType `feature_request` |
| `pending` | status `pending` |
| `solved` | status `solved` + age ≤ 7 days |

**Drag-and-drop:** Native HTML5 DnD (`dataTransfer`) — not @hello-pangea/dnd. `onDrop` in Board maps `colKey` back to status/tag/holdType changes.

**Ticket shape:** `{ id, subject, status, tier, holdType, tags, updatedAt (ms), replies, sentiment, assignee, linear, customer }`

## Constraints

- All ZD API calls go through `src/api/` — never fetch directly in components
- CSS vars only for styling — no Tailwind, no separate CSS files per component
- No barrel `index.ts` files — import directly from source files
- Never define a component inside another component's render function
- Use `import type` for type-only imports (`verbatimModuleSyntax` is enabled)

## TypeScript

Strict mode: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all on. Target ES2023.

## Skills

Apply `.agents/skills/vercel-react-best-practices` when writing or reviewing any React component, hook, or data-fetching code. Priority rules for this project: `async-parallel`, `rerender-no-inline-components`, `rerender-memo`, `rerender-derived-state-no-effect`, `bundle-barrel-imports`, `js-set-map-lookups`.

## Design

Fetch this design file, read its readme, and implement the relevant aspects of the design.
`https://api.anthropic.com/v1/design/h/h8mpWL_nXSSUv7d4k-_-sA?open_file=Triage+Kanban.html`
Implement: `Triage Kanban.html`

## Agent (Ralph Loop)

Full prompt in `AGENT.md`. To start:

```bash
/ralph-loop "$(cat AGENT.md)" --completion-promise "KANBAN_COMPLETE" --max-iterations 30
```

The agent builds in 5 phases (Foundation → API+Mocks → Hooks → Components → Polish+Tests), checks git log each iteration to resume from where it left off, and outputs `<promise>KANBAN_COMPLETE</promise>` when all tests pass and `npm run build` is clean.

After each phase it runs `npm run lint`, `npm test`, and `npm run build` before committing.

## ZD API Auth (when wiring real API)

Credentials go in `.env.local` (never committed). Use Basic Auth with `email/token` format — see `CLAUDE_DEV_SETUP.md` for the `zdFetch` helper pattern.
