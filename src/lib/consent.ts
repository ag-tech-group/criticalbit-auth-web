import { api } from "@/api/api"

export const CONSENT_TYPES = ["analytics", "session_replay"] as const
export type ConsentType = (typeof CONSENT_TYPES)[number]

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
