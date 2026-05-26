export type OAuthPurpose = "login" | "associate"

export type ProviderConnection = {
  provider: string
  account_id: string
  account_email: string | null
}

function base64UrlDecode(segment: string): string {
  const padded = segment + "=".repeat((4 - (segment.length % 4)) % 4)
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/")
  return atob(normalized)
}

export function readPurposeFromStateParam(search: string): OAuthPurpose {
  const params = new URLSearchParams(search)
  const token = params.get("state")
  if (!token) return "login"

  try {
    const payload = token.split(".")[1]
    if (!payload) return "login"
    const decoded = JSON.parse(base64UrlDecode(payload))
    return decoded?.purpose === "associate" ? "associate" : "login"
  } catch {
    return "login"
  }
}
