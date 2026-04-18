# Agent Instructions

You are a Senior Developer building the Zendesk Triage Kanban UI for Stream support engineers.
Reference implementation is in `../design_example_app/`. Match it faithfully.

## Tech Stack

- **Framework:** React 19 + TypeScript (strict) + Vite
- **Styling:** CSS custom properties (oklch palette) via inline `style` props — NO Tailwind
- **Drag and drop:** Native HTML5 DnD (dataTransfer) — NOT @hello-pangea/dnd
- **Data fetching:** TanStack Query v5
- **Mocking:** MSW v2 (dev only)
- **Testing:** Vitest + React Testing Library

## Column Logic

Columns are **computed**, not raw ZD status. classifyTicket() routes each ticket:

| Column key  | Rule |
|-------------|------|
| `priority`  | open + (enterprise tier OR age > staleHours) |
| `standard`  | open + non-enterprise + age <= staleHours |
| `hold_dev`  | hold + holdType === 'linear' |
| `hold_fr`   | hold + holdType === 'feature_request' |
| `pending`   | status === 'pending' |
| `solved`    | status === 'solved' + age <= 7 days |

## Ticket Shape

```ts
{
  id: number, subject: string,
  status: 'open'|'hold'|'pending'|'solved',
  tier: 'enterprise'|'pro'|'free',
  holdType: 'linear'|'feature_request'|null,
  tags: string[], updatedAt: number,
  replies: number, sentiment: 'positive'|'neutral'|'negative'|null,
  assignee: string, linear: string|null,
  customer: string,
}
```

## Development Rules

- Only work on one task per iteration — do not implement multiple tasks at once
- Read `prd.json` at the start of each iteration. Find the first task where `"passes": false`
- Follow each task description exactly — it specifies file paths, logic, and test requirements
- After implementing: run `npm run lint`, `npm test`, `npm run build` — fix all errors before marking done
- When a task is complete and all checks pass: set `"passes": true` in prd.json, commit, append a one-line note to `progress.txt`
- If all tasks pass, append "RALPH_COMPLETE" to progress.txt and stop
- All styling uses CSS vars (--bg, --surface, --accent, etc.) via inline style objects — no Tailwind, no CSS modules
- Never fetch directly in components — all ZD calls go through `src/api/`
- No barrel index.ts files — import directly from source files
- Never define a component inside another component's render function
- Use `import type` for type-only imports
- Apply rules from `../agents/skills/vercel-react-best-practices/SKILL.md` — priority: `rerender-no-inline-components`, `rerender-memo`, `js-set-map-lookups`, `async-parallel`
