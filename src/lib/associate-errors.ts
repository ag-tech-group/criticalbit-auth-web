// Friendly copy for `oauth_*` codes the backend can raise during an
// associate (link-to-current-user) flow. Used in two places:
//   1. The dev fetch path in <Provider>CallbackPage, when the API still
//      replies with JSON because the SPA is mediating.
//   2. The profile page, when the API redirects to /profile with the
//      code in the query string (prod path; the user lands directly
//      back on profile rather than seeing raw JSON).

export type AssociateProvider = "google" | "steam"

const PROVIDER_LABELS: Record<AssociateProvider, string> = {
  google: "Google",
  steam: "Steam",
}

export function providerLabel(provider: AssociateProvider): string {
  return PROVIDER_LABELS[provider]
}

export function associateErrorMessage(
  code: string,
  provider: AssociateProvider
): string {
  const label = providerLabel(provider)
  switch (code) {
    case "oauth_account_already_linked":
      return `This ${label} account is already linked to another criticalbit account. Unlink it there first.`
    case "oauth_state_invalid":
    case "oauth_state_missing":
    case "oauth_state_wrong_purpose":
      return "Your link session is invalid. Please return to your profile and try again."
    case "oauth_state_expired":
    case "oauth_csrf_mismatch":
      return "Your link session expired. Please return to your profile and try again."
    case "oauth_state_user_mismatch":
      return "Something went wrong linking your account. Please try again."
    case "oauth_verify_failed":
      return `${label} rejected the response. Please try again.`
    default:
      return `Linking your ${label} account failed. Please try again.`
  }
}

export function isAssociateProvider(
  value: unknown
): value is AssociateProvider {
  return value === "google" || value === "steam"
}
