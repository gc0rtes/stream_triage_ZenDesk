// In dev, requests go to /api/v2 — the Vite proxy forwards them to Zendesk with auth.
// In prod, requests go directly to the ZD subdomain using Basic Auth.
const IS_DEV = import.meta.env.DEV

const ZD_TOKEN = import.meta.env.VITE_ZD_TOKEN ?? ''
const ZD_SUBDOMAIN = import.meta.env.VITE_ZD_SUBDOMAIN ?? 'getstream'

const BASE_URL = IS_DEV
  ? '/api/v2'
  : `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2`

function getAuthHeader(): string | undefined {
  if (IS_DEV) return undefined
  // Auth email resolved at request time: prefer logged-in user, fall back to env
  const email =
    localStorage.getItem('zd-user-email') ??
    (import.meta.env.VITE_ZD_EMAIL as string | undefined) ??
    ''
  if (!email || !ZD_TOKEN) return undefined
  return `Basic ${btoa(`${email}/token:${ZD_TOKEN}`)}`
}

export async function zdFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeader = getAuthHeader()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`ZD fetch error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}
