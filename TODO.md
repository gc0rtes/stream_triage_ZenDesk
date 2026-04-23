# UX polish backlog (AI implementation brief)

This file is **implementation guidance for coding agents**. Before changing code, read `CLAUDE.md` in the repo root (architecture, styling rules, **Zendesk data integrity** constraints).

**Verify after changes:** `npm run lint`, `npm test`, `npm run build`.

**Styling:** Inline `style` props + CSS variables from `theme.ts` / `makeCssVars` — no Tailwind, no new per-component CSS files unless the project already uses them (`src/index.css` exists for globals like `.tiptap-prose`).

**Zendesk writes:** New ZD endpoints or custom fields require explicit human approval per `CLAUDE.md`. Prefer extending existing patterns in `src/api/tickets.ts` (`zdFetch`, `submitReply`, whitelisted PUT bodies).


## 1.  create new column for following tickets

**goal:** agents can see tickets they follow

## 2. 

**goal:**

## 3. 

**goal:**


## 4. 

**goal:**


