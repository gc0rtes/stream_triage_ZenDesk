const ZD_EMAIL = import.meta.env.VITE_ZD_EMAIL ?? ''
const ZD_TOKEN = import.meta.env.VITE_ZD_TOKEN ?? ''
const ZD_SUBDOMAIN = import.meta.env.VITE_ZD_SUBDOMAIN ?? 'stream'

const BASE_URL = `https://${ZD_SUBDOMAIN}.zendesk.com/api/v2`

const AUTH_HEADER =
  ZD_EMAIL && ZD_TOKEN
    ? `Basic ${btoa(`${ZD_EMAIL}/token:${ZD_TOKEN}`)}`
    : undefined

export async function zdFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(AUTH_HEADER ? { Authorization: AUTH_HEADER } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`ZD fetch error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}
