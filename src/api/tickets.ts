import type { Ticket } from "../types/ticket";
import type { ZDComment } from "../types/comment";
import { zdFetch } from "./zendesk";
import { CHAT_PLAN_OPTIONS, FEED_PLAN_OPTIONS, VIDEO_PLAN_OPTIONS } from "../data/subscriptionPlans";

export interface ZDTicketField {
  id: number;
  type: string;
  title: string;
  custom_field_options?: Array<{ name: string; value: string }>;
}

/** Zendesk ticket form `agent_conditions` (Show Ticket Form API). */
export interface ZDTicketFormAgentCondition {
  parent_field_id: number;
  value: string;
  child_fields: Array<{ id: number }>;
}

export interface CustomFieldValue {
  id: number;
  value: string | string[] | boolean | null;
}

export const MY_ASSIGNEE_ID = 1515461428242;

export function getMyAssigneeId(): number {
  const id = localStorage.getItem('zd-user-id')
  return id ? Number(id) : MY_ASSIGNEE_ID
}

interface RawZDTicket {
  id: number;
  subject: string;
  status: "new" | "open" | "pending" | "hold" | "solved" | "closed";
  priority: "low" | "normal" | "high" | "urgent" | null;
  tags: string[];
  updated_at: string;
  assignee_id: number | null;
  organization_id: number | null;
  requester_id: number | null;
}

interface SideloadMaps {
  userMap: Record<number, string>;
  orgMap: Record<number, string>;
  emailMap: Record<number, string>;
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail", "yahoo", "hotmail", "outlook", "icloud", "aol",
  "protonmail", "zoho", "yandex", "live", "msn", "me",
]);

function domainFromEmail(email: string | undefined): string | null {
  if (!email) return null;
  const host = email.split("@")[1];
  if (!host) return null;
  const parts = host.split(".");
  // Take the second-to-last segment (e.g. "bar" from "foo.bar.com")
  const domain = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  if (FREE_EMAIL_DOMAINS.has(domain.toLowerCase())) return null;
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

/** Public mail host segment (e.g. gmail.com → Gmail) when there is no org / corporate domain. */
function consumerBrandFromEmail(email: string | undefined): string | null {
  if (!email) return null;
  const host = email.split("@")[1];
  if (!host) return null;
  const parts = host.split(".");
  const domain = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  const d = domain.toLowerCase();
  if (!FREE_EMAIL_DOMAINS.has(d)) return null;
  return domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
}

/** Resolved ticket card / requester customer line (exported for unit tests). */
export function resolveCustomerLabel(
  organizationId: number | null,
  orgName: string | undefined,
  email: string | undefined,
): string {
  if (organizationId != null) {
    return orgName ?? "Org-" + String(organizationId).slice(-5);
  }
  return (
    domainFromEmail(email) ??
    consumerBrandFromEmail(email) ??
    "Unknown"
  );
}

// --- Tier classification driven by subscriptionPlans.ts (source of truth) ---

const CHAT_FREE_TAGS = new Set(["no_chat", "trial_expired", "chat_free", "maker_chat"]);
const FEEDS_FREE_TAGS = new Set(["no_plan", "feeds_free", "maker_feeds"]);
const VIDEO_FREE_TAGS = new Set(["video_non_enterprise"]);

// Enterprise values contain "enterprise" in the tag value (except video_non_enterprise which is free)
const isEnterprisePlanTag = (v: string) =>
  v.includes("enterprise") && v !== "video_non_enterprise";

// Paid = known plan tag that is neither free nor enterprise
const PAID_PLAN_TAGS = new Set<string>([
  ...CHAT_PLAN_OPTIONS.map((o) => o.value).filter((v) => !CHAT_FREE_TAGS.has(v) && !isEnterprisePlanTag(v)),
  ...FEED_PLAN_OPTIONS.map((o) => o.value).filter((v) => !FEEDS_FREE_TAGS.has(v) && !isEnterprisePlanTag(v)),
  ...VIDEO_PLAN_OPTIONS.map((o) => o.value).filter((v) => !VIDEO_FREE_TAGS.has(v) && !isEnterprisePlanTag(v)),
]);

const ENT_PLAN_TAGS = new Set<string>([
  ...CHAT_PLAN_OPTIONS.map((o) => o.value).filter(isEnterprisePlanTag),
  ...FEED_PLAN_OPTIONS.map((o) => o.value).filter(isEnterprisePlanTag),
  ...VIDEO_PLAN_OPTIONS.map((o) => o.value).filter(isEnterprisePlanTag),
]);

function deriveTier(tags: string[]): Ticket["tier"] {
  // Tag '1' = Stream Tier-1 account flag
  if (tags.includes("1")) return "enterprise";
  // enterprise-new and similar account-level tags
  if (tags.some((t) => t.includes("enterprise") && !t.includes("non_enterprise")))
    return "enterprise";
  // Explicit enterprise plan value from subscriptionPlans.ts
  if (tags.some((t) => ENT_PLAN_TAGS.has(t))) return "enterprise";
  // Any paid plan across chat / feeds / video → pro
  if (tags.some((t) => PAID_PLAN_TAGS.has(t))) return "pro";
  // Everything else is free
  return "free";
}

function deriveHoldType(
  tags: string[],
  status: Ticket["status"],
): Ticket["holdType"] {
  if (status !== "hold") return null;
  if (tags.includes("feature_request_v2")) return "feature_request";
  return "linear";
}

function mapZDTicket(t: RawZDTicket, maps: SideloadMaps = { userMap: {}, orgMap: {}, emailMap: {} }): Ticket {
  const status =
    t.status === "new" || t.status === "closed" ? "open" : t.status;
  return {
    id: t.id,
    subject: t.subject,
    status,
    priority: t.priority ?? "normal",
    tier: deriveTier(t.tags),
    holdType: deriveHoldType(t.tags, status),
    tags: t.tags.filter(
      (tag) => !["1", "false", "true", "slack_notified", "thena"].includes(tag),
    ),
    updatedAt: new Date(t.updated_at).getTime(),
    replies: 0,
    sentiment: null,
    assignee:
      t.assignee_id === getMyAssigneeId() ? "GC" : t.assignee_id ? "OTHER" : "",
    linear: null,
    customer: resolveCustomerLabel(
      t.organization_id,
      t.organization_id ? maps.orgMap[t.organization_id] : undefined,
      t.requester_id ? maps.emailMap[t.requester_id] : undefined,
    ),
    requesterName: t.requester_id ? (maps.userMap[t.requester_id] ?? null) : null,
    requesterEmail: t.requester_id ? (maps.emailMap[t.requester_id] ?? null) : null,
    lastRequesterReplyAt: null,
    lastAgentReplyAt: null,
  };
}

export async function fetchIncrementalTickets(startTimeSec: number): Promise<{
  tickets: Ticket[];
  endTime: number;
}> {
  const data = await zdFetch<{
    tickets: RawZDTicket[] | null;
    end_time: number | null;
  }>(`/incremental/tickets.json?start_time=${startTimeSec}&per_page=100`);
  const rawTickets = data.tickets ?? [];
  const maps = rawTickets.length ? await fetchNameMaps(rawTickets) : { orgMap: {}, userMap: {}, emailMap: {} };
  return {
    tickets: rawTickets.map((t) => mapZDTicket(t, maps)),
    // ZD returns null end_time when no records match — fall back to the input cursor
    endTime: data.end_time ?? startTimeSec,
  };
}

function zdSearch(query: string, perPage = 100) {
  return zdFetch<{ results: RawZDTicket[] }>(
    `/search.json?${new URLSearchParams({ query, per_page: String(perPage) })}`,
  );
}

async function fetchNameMaps(rawTickets: RawZDTicket[]): Promise<SideloadMaps> {
  const orgIds = [...new Set(rawTickets.map((t) => t.organization_id).filter((id): id is number => id != null))];
  const userIds = [...new Set(rawTickets.map((t) => t.requester_id).filter((id): id is number => id != null))];

  const [orgsData, usersData] = await Promise.all([
    orgIds.length
      ? zdFetch<{ organizations: Array<{ id: number; name: string }> }>(`/organizations/show_many.json?ids=${orgIds.join(",")}`)
      : Promise.resolve({ organizations: [] }),
    userIds.length
      ? zdFetch<{ users: Array<{ id: number; name: string; email: string }> }>(`/users/show_many.json?ids=${userIds.join(",")}`)
      : Promise.resolve({ users: [] }),
  ]);

  return {
    orgMap: Object.fromEntries(orgsData.organizations.map((o) => [o.id, o.name])),
    userMap: Object.fromEntries(usersData.users.map((u) => [u.id, u.name])),
    emailMap: Object.fromEntries(usersData.users.map((u) => [u.id, u.email])),
  };
}

/** Parallel ZD searches can return the same ticket twice; keep one row (latest `updated_at`). */
function dedupeRawZDTicketsByLatestUpdate(raw: RawZDTicket[]): RawZDTicket[] {
  const map = new Map<number, RawZDTicket>();
  for (const t of raw) {
    const prev = map.get(t.id);
    if (!prev) {
      map.set(t.id, t);
      continue;
    }
    const nextMs = new Date(t.updated_at).getTime();
    const prevMs = new Date(prev.updated_at).getTime();
    if (nextMs >= prevMs) map.set(t.id, t);
  }
  return [...map.values()];
}

export async function fetchTickets(agentId?: number): Promise<Ticket[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000)
    .toISOString()
    .split("T")[0];
  const targetId = agentId ?? getMyAssigneeId();
  const me = `assignee_id:${targetId}`;

  const [myOpen, myPending, myHold, myNew, unassigned, mySolved] =
    await Promise.all([
      zdSearch(`type:ticket ${me} status:open`),
      zdSearch(`type:ticket ${me} status:pending`),
      zdSearch(`type:ticket ${me} status:hold`),
      zdSearch(`type:ticket ${me} status:new`),
      zdSearch("type:ticket assignee:none status:new"),
      zdSearch(`type:ticket ${me} status:solved updated>${sevenDaysAgo}`, 50),
    ]);

  const allRaw = dedupeRawZDTicketsByLatestUpdate([
    ...myOpen.results,
    ...myPending.results,
    ...myHold.results,
    ...myNew.results,
    ...unassigned.results,
    ...mySolved.results,
  ]);

  const maps = await fetchNameMaps(allRaw);
  return allRaw.map((t) => mapZDTicket(t, maps));
}

export async function updateTicketStatus(
  id: number,
  patch: Partial<Ticket>,
): Promise<Ticket> {
  // Only send fields ZD understands — strip local-only properties
  const zdPatch: Record<string, unknown> = {};
  if (patch.status !== undefined) zdPatch.status = patch.status;
  if (patch.tags !== undefined) zdPatch.tags = patch.tags;
  if (patch.priority !== undefined) zdPatch.priority = patch.priority;

  const data = await zdFetch<{ ticket: Ticket }>(`/tickets/${id}.json`, {
    method: "PUT",
    body: JSON.stringify({ ticket: zdPatch }),
  });
  return data.ticket;
}

export async function assignTicket(id: number): Promise<Ticket> {
  const data = await zdFetch<{ ticket: Ticket }>(`/tickets/${id}.json`, {
    method: "PUT",
    body: JSON.stringify({
      ticket: { assignee_id: getMyAssigneeId(), status: "open" },
    }),
  });
  return data.ticket;
}

export interface FullTicket extends Ticket {
  comments: ZDComment[];
  custom_fields: CustomFieldValue[];
  ticket_form_id: number | null;
  assignee_id: number | null;
  requester_id: number | null;
}

export interface ZDRequesterInfo {
  id: number;
  name: string;
  email: string;
  time_zone: string | null;
  locale: string | null;
  notes: string | null;
  organization_id: number | null;
  organization_name: string | null;
  recent_tickets: Array<{ id: number; subject: string; status: string; created_at: string }>;
}

export async function fetchRequesterInfo(requesterId: number): Promise<ZDRequesterInfo> {
  const { user } = await zdFetch<{
    user: {
      id: number; name: string; email: string
      time_zone: string | null; locale: string | null; notes: string | null
      organization_id: number | null
    }
  }>(`/users/${requesterId}.json`)

  const [orgData, ticketsData] = await Promise.all([
    user.organization_id
      ? zdFetch<{ organization: { name: string } }>(`/organizations/${user.organization_id}.json`)
      : Promise.resolve(null),
    zdFetch<{ tickets: Array<{ id: number; subject: string; status: string; created_at: string }> }>(
      `/users/${requesterId}/tickets/requested.json?per_page=10`
    ),
  ])

  return {
    ...user,
    organization_name: orgData?.organization.name ?? null,
    recent_tickets: ticketsData.tickets ?? [],
  }
}

export async function fetchFullTicket(id: number): Promise<FullTicket> {
  const [{ ticket }, { comments }] = await Promise.all([
    zdFetch<{
      ticket: Ticket & {
        custom_fields?: CustomFieldValue[];
        ticket_form_id?: number | null;
        assignee_id?: number | null;
        requester_id?: number | null;
      };
    }>(`/tickets/${id}.json`),
    zdFetch<{
      comments: Array<
        Omit<ZDComment, "author_name" | "attachments"> & {
          attachments?: ZDComment["attachments"];
        }
      >;
    }>(`/tickets/${id}/comments.json`),
  ]);

  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  const { users } = await zdFetch<{ users: { id: number; name: string }[] }>(
    `/users/show_many.json?ids=${authorIds.join(",")}`,
  );
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const enrichedComments: ZDComment[] = comments.map((c) => ({
    ...c,
    author_name: userMap[c.author_id] ?? `User ${c.author_id}`,
    attachments: c.attachments ?? [],
  }));

  return {
    ...ticket,
    comments: enrichedComments,
    custom_fields: ticket.custom_fields ?? [],
    ticket_form_id: ticket.ticket_form_id ?? null,
    assignee_id: ticket.assignee_id ?? null,
    requester_id: ticket.requester_id ?? null,
  };
}

export async function fetchFormFields(formId: number): Promise<{
  fieldIds: number[];
  fields: ZDTicketField[];
  agentConditions: ZDTicketFormAgentCondition[];
}> {
  const [{ ticket_form }, { ticket_fields }] = await Promise.all([
    zdFetch<{
      ticket_form: {
        ticket_field_ids: number[];
        agent_conditions?: ZDTicketFormAgentCondition[];
      };
    }>(`/ticket_forms/${formId}.json`),
    zdFetch<{ ticket_fields: ZDTicketField[] }>("/ticket_fields.json"),
  ]);
  const idSet = new Set(ticket_form.ticket_field_ids);
  return {
    fieldIds: ticket_form.ticket_field_ids,
    fields: ticket_fields.filter((f) => idSet.has(f.id)),
    agentConditions: ticket_form.agent_conditions ?? [],
  };
}


export async function submitReply(
  id: number,
  opts: {
    body?: string;
    htmlBody?: string;
    isPublic?: boolean;
    status?: string;
    uploads?: string[];
    assigneeId?: number | null;
    customFields?: CustomFieldValue[];
    ccEmails?: string[];
  },
): Promise<void> {
  const ticket: Record<string, unknown> = {};
  if (opts.status) ticket.status = opts.status;
  if (opts.assigneeId !== undefined) ticket.assignee_id = opts.assigneeId;
  if (opts.customFields?.length) ticket.custom_fields = opts.customFields;
  if (opts.ccEmails?.length) ticket.additional_collaborators = opts.ccEmails.map(email => ({ email }));
  const commentBody = opts.htmlBody?.trim() || opts.body?.trim();
  if (commentBody) {
    ticket.comment = {
      ...(opts.htmlBody?.trim() ? { html_body: opts.htmlBody } : { body: opts.body }),
      public: opts.isPublic ?? true,
      ...(opts.uploads?.length ? { uploads: opts.uploads } : {}),
    };
  }
  await zdFetch<unknown>(`/tickets/${id}.json`, {
    method: "PUT",
    body: JSON.stringify({ ticket }),
  });
}

export async function uploadAttachment(file: File): Promise<string> {
  const params = new URLSearchParams({ filename: file.name });
  const data = await zdFetch<{ upload: { token: string } }>(
    `/uploads.json?${params}`,
    {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    },
  );
  return data.upload.token;
}

export async function uploadAttachmentFull(file: File): Promise<{ token: string; contentUrl: string }> {
  const params = new URLSearchParams({ filename: file.name });
  const data = await zdFetch<{ upload: { token: string; attachment: { content_url: string } } }>(
    `/uploads.json?${params}`,
    {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    },
  );
  return { token: data.upload.token, contentUrl: data.upload.attachment.content_url };
}

export interface ZDAgent {
  id: number;
  name: string;
  email: string;
}

export async function fetchAgents(): Promise<ZDAgent[]> {
  const [agentsRes, adminsRes] = await Promise.all([
    zdFetch<{ users: ZDAgent[] }>("/users.json?role=agent&per_page=100"),
    zdFetch<{ users: ZDAgent[] }>("/users.json?role=admin&per_page=100"),
  ]);
  const seen = new Set<number>();
  return [...agentsRes.users, ...adminsRes.users].filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
}

export async function searchZDUserByEmail(email: string): Promise<ZDAgent | null> {
  const data = await zdFetch<{ users: ZDAgent[] }>(
    `/users/search.json?${new URLSearchParams({ query: email })}`
  )
  return data.users[0] ?? null
}

export async function fetchGroupAgents(): Promise<ZDAgent[]> {
  try {
    const { groups } = await zdFetch<{ groups: Array<{ id: number; name: string }> }>("/groups.json")
    const csGroup = groups.find((g) =>
      g.name.toLowerCase().includes("customer success")
    )
    if (csGroup) {
      const { users } = await zdFetch<{ users: ZDAgent[] }>(
        `/users.json?group_id=${csGroup.id}&per_page=100`
      )
      return users
    }
  } catch {
    // fall through to fetchAgents
  }
  return fetchAgents()
}

export async function reassignTicket(
  ticketId: number,
  agentId: number,
): Promise<void> {
  await zdFetch<unknown>(`/tickets/${ticketId}.json`, {
    method: "PUT",
    body: JSON.stringify({ ticket: { assignee_id: agentId } }),
  });
}

export interface ZDMacro {
  id: number;
  title: string;
  active: boolean;
  actions: Array<{ field: string; value: string | string[] }>;
}

export async function fetchMacros(): Promise<ZDMacro[]> {
  const data = await zdFetch<{ macros: ZDMacro[] }>(
    "/macros.json?active=true&per_page=100",
  );
  return data.macros;
}

// ── Stats: solved volume + satisfaction (Zendesk Search + Satisfaction Ratings API) ──

interface ZendeskSearchPage {
  results: RawZDTicket[];
  next_page?: string | null;
}

/** Turn absolute `next_page` from ZD into a path for `zdFetch` (`BASE_URL` is `/api/v2`). */
function searchNextPath(nextUrl: string | null | undefined): string | null {
  if (!nextUrl) return null;
  try {
    const u = new URL(nextUrl);
    const full = u.pathname + u.search;
    return full.startsWith("/api/v2") ? full.slice("/api/v2".length) : full;
  } catch {
    return null;
  }
}

async function fetchAllSearchTickets(
  query: string,
  maxPages = 40,
): Promise<RawZDTicket[]> {
  const params = new URLSearchParams({
    query,
    per_page: "100",
    sort_by: "updated_at",
    sort_order: "desc",
  });
  let path: string | null = `/search.json?${params}`;
  const acc: RawZDTicket[] = [];
  for (let i = 0; i < maxPages && path; i++) {
    const data = await zdFetch<ZendeskSearchPage>(path);
    acc.push(...(data.results ?? []));
    path = searchNextPath(data.next_page);
  }
  return acc;
}

/** Solved tickets assigned to `assigneeId` with `solved_at` after `sinceMs` (paginated search). */
export async function fetchSolvedTicketsInRangeForAgent(
  assigneeId: number,
  sinceMs: number,
  maxPages?: number,
): Promise<Array<{ id: number; subject: string; updatedAt: number }>> {
  // Align to local midnight so chart day-buckets and this filter share the same boundary
  const aligned = new Date(sinceMs)
  aligned.setHours(0, 0, 0, 0)
  const since = aligned.toISOString().split("T")[0];
  // solved> matches solved_at (the ZD Explore field) rather than updated_at
  const q = `type:ticket assignee_id:${assigneeId} solved>${since}`;
  const raw = await fetchAllSearchTickets(q, maxPages ?? 40);
  return raw.map((t) => ({
    id: t.id,
    subject: t.subject,
    updatedAt: new Date(t.updated_at).getTime(),
  }));
}

/** Team-wide solved tickets updated since `sinceMs` — no assignee filter, matches ZD Explore totals. */
export async function fetchSolvedTicketsTeamWide(
  sinceMs: number,
  maxPages?: number,
): Promise<Array<{ id: number; subject: string; updatedAt: number }>> {
  const since = new Date(sinceMs).toISOString().split("T")[0];
  const q = `type:ticket status:solved updated>${since}`;
  const raw = await fetchAllSearchTickets(q, maxPages ?? 40);
  return raw.map((t) => ({
    id: t.id,
    subject: t.subject,
    updatedAt: new Date(t.updated_at).getTime(),
  }));
}

/** Fast ticket count via /search/count.json — no pagination needed. */
export async function fetchTicketSearchCount(query: string): Promise<number> {
  const params = new URLSearchParams({ query });
  const data = await zdFetch<{ count: number }>(`/search/count.json?${params}`);
  return data.count ?? 0;
}

/** Legacy CSAT row from `GET /api/v2/satisfaction_ratings` (admin-only; no assignee filter in API). */
export interface ZDSatisfactionRating {
  id: number;
  assignee_id: number;
  ticket_id: number;
  score: string;
  comment: string | null;
  created_at: string;
  requester_id: number;
  group_id: number;
}

/** Map search hits to rows without a second date pass (Zendesk `updated>` already scopes the query). */
function mapSearchTicketsBasic(
  raw: RawZDTicket[],
): Array<{ id: number; subject: string; updatedAt: number }> {
  return raw.map((t) => ({
    id: t.id,
    subject: t.subject,
    updatedAt: new Date(t.updated_at).getTime(),
  }));
}

function mergeTicketsById(
  chunks: RawZDTicket[][],
): Array<{ id: number; subject: string; updatedAt: number }> {
  const seen = new Set<number>();
  const out: Array<{ id: number; subject: string; updatedAt: number }> = [];
  for (const chunk of chunks) {
    for (const t of chunk) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push({
        id: t.id,
        subject: t.subject,
        updatedAt: new Date(t.updated_at).getTime(),
      });
    }
  }
  return out;
}

/**
 * Tickets that received a satisfaction survey offer (agent-scoped search).
 * @see https://developer.zendesk.com/api-reference/ticketing/ticket-management/search/
 */
export async function fetchOfferedTicketsViaSearch(
  assigneeId: number,
  sinceMs: number,
  _rangeEndMs: number,
  maxPages?: number,
): Promise<Array<{ id: number; subject: string; updatedAt: number }>> {
  const since = new Date(sinceMs).toISOString().split("T")[0];
  // Zendesk Support search uses `satisfaction:` (not `satisfaction_rating:`).
  // See https://support.zendesk.com/hc/en-us/articles/4408886879258
  const q = `type:ticket assignee_id:${assigneeId} satisfaction:offered updated>${since}`;
  const raw = await fetchAllSearchTickets(q, maxPages ?? 25);
  return mapSearchTicketsBasic(raw);
}

/** Agent-scoped CSAT buckets from ticket search (works for typical agents; capped by search pagination). */
export interface AgentSatisfactionReport {
  offeredTickets: Array<{ id: number; subject: string; updatedAt: number }>;
  goodTickets: Array<{ id: number; subject: string; updatedAt: number }>;
  badTickets: Array<{ id: number; subject: string; updatedAt: number }>;
}

export async function fetchAgentSatisfactionReport(
  assigneeId: number,
  rangeStartMs: number,
  _rangeEndMs: number,
): Promise<AgentSatisfactionReport> {
  const since = new Date(rangeStartMs).toISOString().split("T")[0];
  const base = `type:ticket assignee_id:${assigneeId} updated>${since}`;
  const maxPages = 30;

  const [
    offeredRaw,
    goodRaw,
    goodCommentRaw,
    badRaw,
    badCommentRaw,
  ] = await Promise.all([
    fetchAllSearchTickets(`${base} satisfaction:offered`, maxPages),
    fetchAllSearchTickets(`${base} satisfaction:good`, maxPages),
    fetchAllSearchTickets(`${base} satisfaction:goodwithcomment`, maxPages),
    fetchAllSearchTickets(`${base} satisfaction:bad`, maxPages),
    fetchAllSearchTickets(`${base} satisfaction:badwithcomment`, maxPages),
  ]);

  const offeredTickets = mapSearchTicketsBasic(offeredRaw);
  const goodTickets = mergeTicketsById([goodRaw, goodCommentRaw]);
  const badTickets = mergeTicketsById([badRaw, badCommentRaw]);

  return {
    offeredTickets,
    goodTickets,
    badTickets,
  };
}

export function zendeskAgentTicketUrl(ticketId: number): string {
  const sub = import.meta.env.VITE_ZD_SUBDOMAIN ?? "getstream";
  return `https://${sub}.zendesk.com/agent/tickets/${ticketId}`;
}
