import { api } from "@/api/api"

// Consent state is authoritative in criticalbit-auth-api's DB. We hydrate
// it into React state after auth resolves, and we also mirror it to
// localStorage so boot-time code (PostHog and Sentry init, which run
// synchronously before React mounts) can read the user's last-known
// choices without waiting for the network. The one-page-load lag when a
// user changes consent is intentional and matches the "changes take
// effect on next reload" UX copy in the profile page.

export const CONSENT_TYPES = ["analytics", "session_replay"] as const
export type ConsentType = (typeof CONSENT_TYPES)[number]

const CACHE_KEYS: Record<ConsentType, string> = {
  analytics: "cb_consent_analytics",
  session_replay: "cb_consent_session_replay",
}

export interface ConsentEntry {
  consented: boolean
  version: string
  consented_at: string
  is_stale: boolean
}

export interface ConsentsResponse {
  current_policy_version: string
  consents: Partial<Record<ConsentType, ConsentEntry>>
}

export interface ConsentInput {
  type: ConsentType
  consented: boolean
}

export async function fetchConsents(): Promise<ConsentsResponse> {
  return api.get("user/consents").json<ConsentsResponse>()
}

export async function submitConsents(
  consents: ConsentInput[]
): Promise<ConsentsResponse> {
  return api
    .post("user/consents", { json: { consents } })
    .json<ConsentsResponse>()
}

export function hasStaleConsent(consents: ConsentsResponse | null): boolean {
  if (!consents) return false
  return Object.values(consents.consents).some((entry) => entry?.is_stale)
}

export function readCachedConsent(type: ConsentType): boolean {
  try {
    return window.localStorage.getItem(CACHE_KEYS[type]) === "1"
  } catch {
    return false
  }
}

export function writeCachedConsents(response: ConsentsResponse): void {
  try {
    for (const type of CONSENT_TYPES) {
      const consented = response.consents[type]?.consented ?? false
      window.localStorage.setItem(CACHE_KEYS[type], consented ? "1" : "0")
    }
  } catch {
    // localStorage unavailable (private browsing in some browsers) — skip.
  }
}

export function clearCachedConsents(): void {
  try {
    for (const type of CONSENT_TYPES) {
      window.localStorage.removeItem(CACHE_KEYS[type])
    }
  } catch {
    // ignore
  }
}
