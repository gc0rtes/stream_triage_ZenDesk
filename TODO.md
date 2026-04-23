# UX polish backlog (AI implementation brief)

This file is **implementation guidance for coding agents**. Before changing code, read `CLAUDE.md` in the repo root (architecture, styling rules, **Zendesk data integrity** constraints).

**Verify after changes:** `npm run lint`, `npm test`, `npm run build`.

**Styling:** Inline `style` props + CSS variables from `theme.ts` / `makeCssVars` — no Tailwind, no new per-component CSS files unless the project already uses them (`src/index.css` exists for globals like `.tiptap-prose`).

**Zendesk writes:** New ZD endpoints or custom fields require explicit human approval per `CLAUDE.md`. Prefer extending existing patterns in `src/api/tickets.ts` (`zdFetch`, `submitReply`, whitelisted PUT bodies).

---

## 1. Conversation links open in a new tab

**Goal:** Any link inside ticket conversation HTML should not navigate the Kanban tab away from the dashboard.

**Acceptance criteria**

- Clicking `<a href="...">` in the thread opens the URL in a **new** browsing context (`target="_blank"` with `rel="noopener noreferrer"`).
- Existing image click → new tab behavior in `ProseContent` (`SidePanel.tsx`) stays intact.

**Where to look**

- `src/components/SidePanel.tsx` — `ProseContent` renders `dangerouslySetInnerHTML` for comment bodies.
- Optionally `src/index.css` — `.tiptap-prose a` rules if link styling needs to stay consistent.

**Implementation notes**

- Intercept link clicks on the prose container (delegated `onClick`): if target is `A` with `href`, `preventDefault()` and `window.open(href, '_blank', 'noopener,noreferrer')`, or post-process HTML to add `target`/`rel` (sanitize if you mutate HTML).
- Ensure `mailto:` and internal ZD links are covered the same way.

---

## 2. “Take it” button in ticket form sidebar (assign to me)

**Goal:** Above the assignee control in the ticket details form column, add a **Take it** control that sets the **pending** assignee to the **currently authenticated agent** so the next submit sends that assignee to Zendesk (same path as the existing assignee dropdown).

**Acceptance criteria**

- Button sits **above** the assignee selector in the form/properties sidebar.
- One click sets pending assignee to the logged-in user’s Zendesk user id (same source as `getMyAssigneeId()` in `src/api/tickets.ts` / `AuthContext`).
- Visual consistency with existing “unsaved” assignee state already used when assignee differs from saved ticket.

**Where to look**

- `src/components/SidePanel.tsx` — `TicketPropertiesPanel` (assignee `select`, `pendingAssigneeId`, `onAssigneeChange`).
- `src/context/AuthContext.tsx` — current user id / name.
- `src/api/tickets.ts` — `getMyAssigneeId()`.

---

## 3. Macros: apply all macro actions to the form (not only comment/status)

**Goal:** Choosing a macro should mirror Zendesk Agent behavior: macros can set **custom fields**, **assignee**, **tags**, **group**, **status**, **comment**, etc. Today only a subset is handled.

**Current behavior (for investigation)**

- `src/components/SidePanel.tsx` — `handleApplyMacro` only handles `comment_value_html`, `comment_value`, `status`, `comment_mode_is_public`.
- `src/api/tickets.ts` — `ZDMacro`, `fetchMacros()`; macro `actions` are `{ field, value }[]` per ZD API.

**Acceptance criteria**

- Map macro `action.field` values to local state: at minimum **custom ticket fields** (`custom_fields` / field ids used in `pendingFields`), **assignee_id** if present, **tags** if the API exposes them as macro actions, and any other fields already supported by `submitReply` / `pendingFields` / `pendingAssigneeId`.
- Document which macro action `field` strings Zendesk returns (log or comment in code briefly) if behavior is discovery-driven.
- Regression: existing macros that only set comment + status still work.

**Constraints**

- Only write field ids that exist on the ticket / form; reuse `fetchFormFields` / `useFormFields` patterns — do **not** invent custom field ids.

**Tests**

- Extend `src/components/SidePanel.test.tsx` or add focused tests with mocked macro actions.

---

## 4. Conditional custom fields in the form sidebar (show/hide by parent value)

**Goal:** Some fields should only appear when another field has a specific value (e.g. billing reason only when “kind of assistance” is billing; hide SDK when tech area is API, etc.).

**Acceptance criteria**

- First, **inspect Zendesk API data**: `ticket_fields` / ticket form payloads may include `sub_type_id`, `parent_field_id`, or related metadata. Extend `ZDTicketField` in `src/api/tickets.ts` only with types/properties that actually exist in API responses (use real JSON shape).
- If ZD provides sufficient metadata, drive visibility from that (preferred).
- If not, implement a **small, explicit** client-side map (field id → visible when parent field id has values X) — keep it maintainable and documented; avoid hardcoding business rules without IDs verified against `fetchFormFields`.

**Where to look**

- `src/api/tickets.ts` — `fetchFormFields`, `ZDTicketField`.
- `src/components/SidePanel.tsx` — `TicketPropertiesPanel` custom field list.
- `src/hooks/useFormFields.ts`.

---

## 5. Move refresh control next to “Support · Live”

**Goal:** The manual refresh affordance should sit beside the **Support · Live** label in the logo cluster, not only on the far right.

**Acceptance criteria**

- Refresh button (same `onRefresh` / `isRefreshing` behavior) is **adjacent** to the `Support · Live` chip in `TopBar`.
- Decide whether to **duplicate** the control or **move** it; avoid two spinners fighting — one source of truth is enough.

**Where to look**

- `src/components/TopBar.tsx` (search for `Support · Live`, `IconRefresh`).
- Update `src/components/TopBar.test.tsx` if tests assert layout/order.

---

## 6. Fix text selection in conversation “reader” view

**Goal:** Selecting text in rendered comments should behave like normal HTML: selection should not jump, expand incorrectly, or disappear without user action.

**Acceptance criteria**

- Reproduce in `ProseContent` / thread scroll area in `SidePanel.tsx`.
- Fix root cause (common culprits: `userSelect: 'none'` on parents, global `onMouseDown`/`preventDefault`, overlay capturing events, re-renders resetting selection, `contentEditable` bleed from editor).

**Where to look**

- `src/components/SidePanel.tsx` — panel resize handlers set `document.body.style.userSelect = 'none'` during drag; verify selection bugs correlate with resize or other global handlers.
- `src/index.css` — `.tiptap-prose` rules.
- Compare with `src/components/RichTextEditor.tsx` if the editor and reader share wrappers.

---

## 7. Submit-as-solved: board should update; surface ZD API errors

**Problem statement:** Submitting with status **solved** (possibly **without** changing custom fields) sometimes does not remove the ticket from the open column / expected optimistic UI; user suspects failure when “chat subscription” or other ZD validation fails.

**Acceptance criteria**

- On **failed** `submitReply` / ticket PUT: show a **clear error** (toast or inline) with message from ZD when available; **do not** run success path (`onClose`, optimistic board moves) on failure.
- On **success**: invalidate/refetch ticket list so `classifyTicket` (`src/utils/classifyTicket.ts`) re-routes the ticket (`usePostReply` already invalidates `['tickets']` on settle — verify race with `onSuccess` in `SidePanel` that closes panel before refetch completes).
- Audit `usePostReply` (`src/hooks/usePostReply.ts`) + `SidePanel` `reply.mutate` callbacks: align optimistic updates, `onError`, and `onSettled` so UI and cache stay consistent.

**Where to look**

- `src/hooks/usePostReply.ts`, `src/api/tickets.ts` (`submitReply`, `zdFetch` error parsing).
- `src/components/Toast.tsx`, `useToast`.
- `src/hooks/useTickets.ts` / `useIncrementalSync.ts` if live sync affects state.

---

## 8. After reload, show which dashboard user is “active” (same highlight as click)

**Goal:** On full page load, it should be obvious whether you are viewing **your** board or a **colleague’s** board (`viewedAgentId` in auth).

**Acceptance criteria**

- The active colleague chip (or “self”) uses the **same** visual treatment as after clicking a colleague — not only after interaction.
- If viewing self, the current user indicator should match that state (no ambiguous “am I filtered?”).

**Where to look**

- `src/components/TopBar.tsx` — `ColleagueChip`, `viewedAgentId`, `setViewedAgentId`.
- `src/context/AuthContext.tsx` — persistence of `viewedAgentId` across reload (localStorage if missing).

---

## 9. Requester tab: copy + open email (parity with ticket card)

**Goal:** Next to the requester email in the requester/info UI, add **copy email** and **open in default mail client** actions, matching behavior already used on the ticket card.

**Acceptance criteria**

- Two icon buttons (or equivalent compact controls) beside the email: **copy** (with brief feedback), **compose** (`mailto:` same as card).
- Accessible labels / `title` attributes.

**Where to look**

- `src/components/RequesterPanel.tsx` — email block (~mailto link).
- `src/components/Board/TicketCard.tsx` — search for mailto / copy patterns to reuse.

---

## 10. Ticket card “customer” label for consumer email domains

**Goal:** For requesters on domains like Gmail/Outlook, `Ticket.customer` currently falls back to **Unknown** because `domainFromEmail` in `src/api/tickets.ts` returns `null` for free-mail domains. Show the **recognizable domain name** (e.g. `gmail`, `outlook`) instead of **Unknown** / misleading tier-ish labels.

**Acceptance criteria**

- When there is no organization name but email is a known consumer domain, display a sensible short label derived from the email host (e.g. `Gmail`, `Outlook`).
- Do not break existing org-based customer names or corporate domains.

**Where to look**

- `src/api/tickets.ts` — `FREE_EMAIL_DOMAINS`, `domainFromEmail`, `mapZDTicket` `customer` field.
- `src/components/Board/TicketCard.tsx` — where `customer` is rendered.

**Tests**

- `src/utils/classifyTicket.test.ts` / ticket mapping tests if present; or add unit tests for the customer string helper.

---

## Quick file index

| Area | Files |
|------|--------|
| Ticket panel, macros, form, thread | `src/components/SidePanel.tsx` |
| Top bar, colleagues, refresh | `src/components/TopBar.tsx`, `src/context/AuthContext.tsx` |
| ZD fetch, tickets, macros, forms | `src/api/tickets.ts`, `src/api/zendesk.ts` |
| Reply mutation / cache | `src/hooks/usePostReply.ts` |
| Form field metadata | `src/hooks/useFormFields.ts` |
| Requester side | `src/components/RequesterPanel.tsx` |
| Card display | `src/components/Board/TicketCard.tsx` |
| Column routing | `src/utils/classifyTicket.ts` |
| Global prose styles | `src/index.css` |
