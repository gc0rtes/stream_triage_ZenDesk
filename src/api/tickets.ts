import type { Ticket } from "../types/ticket";
import type { ZDComment } from "../types/comment";
import { zdFetch } from "./zendesk";

export interface ZDTicketField {
  id: number;
  type: string;
  title: string;
  custom_field_options?: Array<{ name: string; value: string }>;
}

export interface CustomFieldValue {
  id: number;
  value: string | string[] | boolean | null;
}

export const MY_ASSIGNEE_ID = 1515461428242;

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

const PRO_PLAN_KEYWORDS = [
  "_startup",
  "_standard",
  "_premium",
  "_scale",
  "_growth",
  "_mau",
  "_pro",
  "_paid",
];

function deriveTier(tags: string[]): Ticket["tier"] {
  if (
    tags.some((t) => t.includes("enterprise") && !t.includes("non_enterprise"))
  )
    return "enterprise";
  // Tag '1' = Stream's Tier-1 account flag → highest priority, route to priority open
  if (tags.includes("1")) return "enterprise";
  if (tags.some((t) => t === "free" || t.includes("_free"))) return "free";
  if (tags.some((t) => PRO_PLAN_KEYWORDS.some((kw) => t.includes(kw))))
    return "pro";
  return "free"; // no recognisable plan tag → don't assume paid
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
      t.assignee_id === MY_ASSIGNEE_ID ? "GC" : t.assignee_id ? "OTHER" : "",
    linear: null,
    customer: t.organization_id
      ? (maps.orgMap[t.organization_id] ?? "Org-" + String(t.organization_id).slice(-5))
      : (domainFromEmail(t.requester_id ? maps.emailMap[t.requester_id] : undefined) ?? "Unknown"),
    requesterName: t.requester_id ? (maps.userMap[t.requester_id] ?? null) : null,
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

export async function fetchTickets(): Promise<Ticket[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000)
    .toISOString()
    .split("T")[0];
  const me = `assignee_id:${MY_ASSIGNEE_ID}`;

  const [myOpen, myPending, myHold, myNew, unassigned, mySolved] =
    await Promise.all([
      zdSearch(`type:ticket ${me} status:open`),
      zdSearch(`type:ticket ${me} status:pending`),
      zdSearch(`type:ticket ${me} status:hold`),
      zdSearch(`type:ticket ${me} status:new`),
      zdSearch("type:ticket assignee:none status:new"),
      zdSearch(`type:ticket ${me} status:solved updated>${sevenDaysAgo}`, 50),
    ]);

  const allRaw = [
    ...myOpen.results,
    ...myPending.results,
    ...myHold.results,
    ...myNew.results,
    ...unassigned.results,
    ...mySolved.results,
  ];

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
      ticket: { assignee_id: MY_ASSIGNEE_ID, status: "open" },
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
}> {
  const [{ ticket_form }, { ticket_fields }] = await Promise.all([
    zdFetch<{ ticket_form: { ticket_field_ids: number[] } }>(
      `/ticket_forms/${formId}.json`,
    ),
    zdFetch<{ ticket_fields: ZDTicketField[] }>("/ticket_fields.json"),
  ]);
  const idSet = new Set(ticket_form.ticket_field_ids);
  return {
    fieldIds: ticket_form.ticket_field_ids,
    fields: ticket_fields.filter((f) => idSet.has(f.id)),
  };
}

export async function updateCustomFields(
  ticketId: number,
  customFields: CustomFieldValue[],
): Promise<void> {
  await zdFetch<unknown>(`/tickets/${ticketId}.json`, {
    method: "PUT",
    body: JSON.stringify({ ticket: { custom_fields: customFields } }),
  });
}

export async function submitReply(
  id: number,
  opts: {
    body?: string;
    isPublic?: boolean;
    status?: string;
    uploads?: string[];
    assigneeId?: number | null;
    customFields?: CustomFieldValue[];
  },
): Promise<void> {
  const ticket: Record<string, unknown> = {};
  if (opts.status) ticket.status = opts.status;
  if (opts.assigneeId !== undefined) ticket.assignee_id = opts.assigneeId;
  if (opts.customFields?.length) ticket.custom_fields = opts.customFields;
  if (opts.body?.trim()) {
    ticket.comment = {
      body: opts.body,
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
