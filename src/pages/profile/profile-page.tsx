import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { LoaderCircle, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/user-avatar"
import { api, baseUrl } from "@/api/api"
import { getErrorMessage } from "@/lib/api-errors"
import {
  associateErrorMessage,
  providerLabel,
  type AssociateProvider,
} from "@/lib/associate-errors"
import { useAuth } from "@/lib/auth"
import {
  hasStaleConsent,
  submitConsents,
  type ConsentInput,
  type ConsentType,
} from "@/lib/consent"
import type { ProviderConnection } from "@/lib/oauth-state"
import { Route as ProfileRoute } from "@/routes/profile"

const DISPLAY_NAME_NUDGE_KEY = "cb_display_name_nudge_dismissed"

type ProviderId = "google" | "steam"

const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "steam", label: "Steam" },
]

async function readErrorDetail(error: unknown): Promise<unknown> {
  const response = (error as { response?: Response })?.response
  if (!response) return null
  try {
    const body = await response.clone().json()
    return body?.detail ?? null
  } catch {
    return null
  }
}

interface ConsentToggleCopy {
  label: string
  helper: string
}

const CONSENT_COPY: Record<ConsentType, ConsentToggleCopy> = {
  analytics: {
    label: "Analytics",
    helper:
      "Help us understand how the site is used across sessions. Enables analytics cookies.",
  },
  session_replay: {
    label: "Session recording",
    helper:
      "Let us replay your session when something breaks so we can diagnose and fix issues faster.",
  },
}

const DISPLAY_NAME_MAX_LENGTH = 100

export function ProfilePage() {
  const auth = useAuth()
  const search = ProfileRoute.useSearch()
  const navigate = useNavigate()
  const privacySectionRef = useRef<HTMLDivElement>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [savingConsentType, setSavingConsentType] =
    useState<ConsentType | null>(null)
  const [displayName, setDisplayName] = useState(auth.displayName ?? "")
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false)
  const [connections, setConnections] = useState<ProviderConnection[] | null>(
    null
  )
  const [connectingProvider, setConnectingProvider] =
    useState<ProviderId | null>(null)
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<ProviderId | null>(null)
  const [strandingIssue, setStrandingIssue] = useState<{
    message: string
    remediation: string[]
  } | null>(null)
  // Captured from the URL on mount and kept in state so the alert
  // survives the navigate({ replace: true }) call that scrubs the
  // ?associate_error= param from the address bar.
  const [associateError, setAssociateError] = useState<{
    provider: AssociateProvider
    message: string
  } | null>(null)
  const [nudgeDismissed, setNudgeDismissed] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.sessionStorage.getItem(DISPLAY_NAME_NUDGE_KEY) === "1"
  )

  const showDisplayNameNudge = !auth.displayName && !nudgeDismissed

  function dismissNudge() {
    window.sessionStorage.setItem(DISPLAY_NAME_NUDGE_KEY, "1")
    setNudgeDismissed(true)
  }

  useEffect(() => {
    // Seeds the editable field from context and re-seeds when the source
    // changes. A controlled input has to hold its own draft, so this sync is
    // the point rather than an accident; it settles in one extra render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(auth.displayName ?? "")
  }, [auth.displayName])

  const refreshConnections = useCallback(async () => {
    try {
      const list = await api
        .get("auth/me/connections")
        .json<ProviderConnection[]>()
      setConnections(list)
    } catch {
      // Show an empty list rather than blocking the rest of the page; the
      // user can refresh to retry. Avoids a noisy toast on transient errors.
      setConnections([])
    }
  }, [])

  useEffect(() => {
    // refreshConnections awaits the request before any setState, so its
    // updates don't run synchronously within the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshConnections()
  }, [refreshConnections])

  useEffect(() => {
    if (!search.linked) return
    const label = providerLabel(search.linked)
    toast.success(`Linked your ${label} account.`)
    navigate({ to: "/profile", search: {}, replace: true })
  }, [search.linked, navigate])

  useEffect(() => {
    if (!search.associate_error || !search.associate_provider) return
    // Surfaces an error carried in the URL, then clears the params via
    // navigate() on the next line -- so the guard above stops matching and
    // this runs once rather than cascading.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAssociateError({
      provider: search.associate_provider,
      message: associateErrorMessage(
        search.associate_error,
        search.associate_provider
      ),
    })
    navigate({ to: "/profile", search: {}, replace: true })
  }, [search.associate_error, search.associate_provider, navigate])

  const stale = hasStaleConsent(auth.consents)
  const showStaleBanner = stale || search.reason === "consent-stale"

  const trimmedDisplayName = displayName.trim()
  const currentDisplayName = auth.displayName ?? ""
  const displayNameChanged = trimmedDisplayName !== currentDisplayName

  useEffect(() => {
    if (showStaleBanner && privacySectionRef.current) {
      privacySectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [showStaleBanner])

  async function handleDisplayNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayNameChanged || isSavingDisplayName) return

    setIsSavingDisplayName(true)
    try {
      await api.patch("auth/me", { json: { display_name: trimmedDisplayName } })
      await auth.checkAuth()
      toast.success(
        trimmedDisplayName ? "Display name updated." : "Display name cleared."
      )
    } catch (error) {
      const message = await getErrorMessage(
        error,
        "Failed to update display name"
      )
      toast.error(message)
    } finally {
      setIsSavingDisplayName(false)
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (confirmEmail !== "DELETE") return

    setIsDeleting(true)
    try {
      await api.delete("auth/me")
      toast.success("Account deleted.")
      // Clear local auth state before navigating — /login's beforeLoad
      // redirects authenticated users to /profile, so without this the
      // user would bounce back to the page they just deleted from.
      await auth.logout()
      await navigate({ to: "/login" })
    } catch (error) {
      const message = await getErrorMessage(error, "Failed to delete account")
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleConnect(provider: ProviderId) {
    setConnectingProvider(provider)
    // Both providers' associate-authorize endpoints 302 to the provider in
    // production. Fetching first would let the browser follow the redirect
    // via fetch — CSP connect-src blocks the cross-origin call to
    // accounts.google.com / steamcommunity.com. Direct navigation
    // sidesteps connect-src entirely.
    // Assigning location is the navigation itself, not a mutation of app
    // state -- see the comment above for why a fetch can't be used here.
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = `${baseUrl}/auth/${provider}/associate/authorize`
  }

  async function handleDisconnect(provider: ProviderId) {
    setDisconnectingProvider(provider)
    setStrandingIssue(null)
    try {
      await api.delete(`auth/me/connections/${provider}`)
      await refreshConnections()
      // /auth/me changes too (has_usable_password unaffected, but cookies may
      // refresh on the same response). Re-check so the rest of the page is
      // accurate.
      await auth.checkAuth()
      const label = PROVIDERS.find((p) => p.id === provider)?.label ?? provider
      toast.success(`Disconnected ${label}.`)
    } catch (error) {
      const detail = await readErrorDetail(error)
      if (
        detail &&
        typeof detail === "object" &&
        (detail as { code?: unknown }).code === "unlink_would_strand_user"
      ) {
        const d = detail as {
          message?: string
          remediation?: unknown
        }
        const remediation = Array.isArray(d.remediation)
          ? (d.remediation.filter((r) => typeof r === "string") as string[])
          : []
        setStrandingIssue({
          message:
            d.message ??
            "Disconnecting this account would leave you with no way to sign in.",
          remediation,
        })
        // Server saw a different reality than we did; refresh so the UI
        // reflects the truth.
        await refreshConnections()
        await auth.checkAuth()
      } else if (
        detail &&
        typeof detail === "object" &&
        (detail as { code?: unknown }).code === "connection_not_found"
      ) {
        // Stale UI — the connection is already gone. Resync and tell the user.
        await refreshConnections()
        toast.info("That connection is already disconnected.")
      } else {
        const message = await getErrorMessage(error, "Failed to disconnect")
        toast.error(message)
      }
    } finally {
      setDisconnectingProvider(null)
    }
  }

  async function handleConsentChange(type: ConsentType, consented: boolean) {
    setSavingConsentType(type)
    try {
      // Re-submitting the other known type with its current value (or false
      // if unset) keeps the append-only history coherent: every change is a
      // single POST capturing the full decision set at that moment.
      const entries: ConsentInput[] = (
        Object.keys(CONSENT_COPY) as ConsentType[]
      ).map((t) => ({
        type: t,
        consented:
          t === type
            ? consented
            : (auth.consents?.consents[t]?.consented ?? false),
      }))
      const response = await submitConsents(entries)
      auth.setConsents(response)
      toast.success("Saved. Takes effect on next page reload.")
    } catch (error) {
      const message = await getErrorMessage(error, "Failed to save consent")
      toast.error(message)
    } finally {
      setSavingConsentType(null)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            <UserAvatar size="lg" />
          </div>
          <CardTitle className="font-pixel text-2xl tracking-wide">
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {showDisplayNameNudge && (
            <div
              className="border-primary/30 bg-primary/5 relative rounded-md border p-3 text-xs leading-relaxed"
              data-testid="display-name-nudge"
            >
              <p className="text-muted-foreground pr-6">
                You're showing up as your email across the site. Pick a display
                name below to personalize your account.
              </p>
              <button
                type="button"
                aria-label="Dismiss display name suggestion"
                onClick={dismissNudge}
                className="text-muted-foreground hover:text-foreground absolute top-2 right-2 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <div className="grid gap-4">
            <div className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Email</span>
              <span>{auth.email}</span>
            </div>
            <form
              onSubmit={handleDisplayNameSubmit}
              className="grid gap-2"
              data-testid="display-name-form"
            >
              <Label htmlFor="display-name" className="text-muted-foreground">
                Display name
              </Label>
              <Input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                placeholder="How you'll appear across criticalbit.gg"
                autoComplete="nickname"
                disabled={isSavingDisplayName}
              />
              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={!displayNameChanged || isSavingDisplayName}
              >
                {trimmedDisplayName || !currentDisplayName
                  ? "Save display name"
                  : "Clear display name"}
                {isSavingDisplayName && (
                  <LoaderCircle className="animate-spin" />
                )}
              </Button>
            </form>
          </div>

          <div
            ref={privacySectionRef}
            className="grid gap-3 border-t pt-4"
            data-testid="privacy-section"
          >
            <h3 className="text-sm font-semibold">Privacy and data</h3>
            {showStaleBanner && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed">
                <p className="mb-1 font-semibold text-amber-200">
                  Privacy policy updated
                </p>
                <p className="text-muted-foreground">
                  Our privacy policy was updated. Please review your choices
                  below — submitting any change (or keeping them as-is)
                  acknowledges the new version.
                </p>
              </div>
            )}
            {(Object.keys(CONSENT_COPY) as ConsentType[]).map((type) => {
              const entry = auth.consents?.consents[type]
              const checked = entry?.consented ?? false
              const isSaving = savingConsentType === type
              return (
                <label
                  key={type}
                  className="flex cursor-pointer items-start gap-3"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) =>
                      handleConsentChange(type, next === true)
                    }
                    disabled={isSaving}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-xs leading-relaxed">
                    <span className="font-medium">
                      {CONSENT_COPY[type].label}
                      {isSaving && (
                        <LoaderCircle className="ml-1 inline size-3 animate-spin" />
                      )}
                    </span>
                    <br />
                    <span className="text-muted-foreground">
                      {CONSENT_COPY[type].helper}
                    </span>
                  </span>
                </label>
              )
            })}
            <p className="text-muted-foreground text-xs">
              Changes take effect on your next page reload.{" "}
              <a
                href="https://criticalbit.gg/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Learn more
              </a>
            </p>
          </div>

          <div
            className="grid gap-3 border-t pt-4"
            data-testid="connections-section"
          >
            <h3 className="text-sm font-semibold">Connected accounts</h3>
            {associateError && (
              <div
                role="alert"
                className="border-destructive/40 bg-destructive/10 relative rounded-md border p-3 pr-8 text-xs leading-relaxed"
                data-testid="associate-error"
              >
                <p className="text-destructive-foreground">
                  {associateError.message}
                </p>
                <button
                  type="button"
                  aria-label="Dismiss error"
                  onClick={() => setAssociateError(null)}
                  className="text-muted-foreground hover:text-foreground absolute top-2 right-2 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
            {connections === null ? (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <LoaderCircle className="size-3 animate-spin" />
                Loading…
              </p>
            ) : (
              <>
                {PROVIDERS.map(({ id, label }) => {
                  const linked = connections.find((c) => c.provider === id)
                  const isConnecting = connectingProvider === id
                  const isDisconnecting = disconnectingProvider === id
                  // Stranding guard: removing this connection is only safe if
                  // either another connection remains, or the user has a
                  // password they can fall back to. Mirrors the server-side
                  // rule so the user doesn't have to click Disconnect to learn
                  // it's blocked.
                  const otherConnections = connections.filter(
                    (c) => c.provider !== id
                  )
                  const hasPasswordFallback =
                    auth.hasUsablePassword && !!auth.email
                  const canUnlink =
                    !!linked &&
                    (otherConnections.length > 0 || hasPasswordFallback)
                  return (
                    <div
                      key={id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="grid gap-0.5">
                        <span className="text-sm font-medium">{label}</span>
                        {linked ? (
                          <span className="text-muted-foreground text-xs">
                            Connected
                            {(linked.account_email ?? linked.account_id) && (
                              <>
                                {" as "}
                                <span className="font-mono">
                                  {linked.account_email ?? linked.account_id}
                                </span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Not connected
                          </span>
                        )}
                        {linked && !canUnlink && (
                          <span className="text-muted-foreground text-xs">
                            You'd have no way to sign in. Set a password first
                            or link another provider.
                          </span>
                        )}
                      </div>
                      {linked ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(id)}
                          disabled={!canUnlink || isDisconnecting}
                        >
                          Disconnect
                          {isDisconnecting && (
                            <LoaderCircle className="animate-spin" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(id)}
                          disabled={isConnecting}
                        >
                          Connect
                          {isConnecting && (
                            <LoaderCircle className="animate-spin" />
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })}
                {strandingIssue && (
                  <div
                    className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed"
                    data-testid="stranding-issue"
                  >
                    <p className="mb-1 text-amber-200">
                      {strandingIssue.message}
                    </p>
                    {strandingIssue.remediation.length > 0 && (
                      <ul className="text-muted-foreground list-disc space-y-0.5 pl-4">
                        {strandingIssue.remediation.map((hint, idx) => (
                          <li key={idx}>
                            {/set a password/i.test(hint) && auth.email ? (
                              <>
                                {hint}{" "}
                                <Link
                                  to="/forgot-password"
                                  search={{ email: auth.email }}
                                  className="text-primary underline"
                                >
                                  Start now.
                                </Link>
                              </>
                            ) : (
                              hint
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {!auth.hasUsablePassword && auth.email && (
                  <p className="text-muted-foreground text-xs">
                    You don't have a password set.{" "}
                    <Link
                      to="/forgot-password"
                      search={{ email: auth.email }}
                      className="text-primary underline"
                    >
                      Set a password
                    </Link>{" "}
                    to also sign in with your email.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="border-destructive/30 bg-destructive/5 rounded-md border p-4">
            <h3 className="text-destructive-foreground mb-1 text-sm font-semibold">
              Danger zone
            </h3>
            {showConfirm ? (
              <form onSubmit={handleDelete} className="mt-3 grid gap-3">
                <p className="text-muted-foreground text-xs">
                  This permanently deletes your account and all data. This
                  cannot be undone.
                </p>
                <div className="grid gap-1">
                  <Label htmlFor="confirm-delete" className="text-xs">
                    Type <span className="font-semibold">DELETE</span> to
                    confirm
                  </Label>
                  <Input
                    id="confirm-delete"
                    type="text"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowConfirm(false)
                      setConfirmEmail("")
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting || confirmEmail !== "DELETE"}
                  >
                    Delete account
                    {isDeleting && <LoaderCircle className="animate-spin" />}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-muted-foreground mb-3 text-xs">
                  Permanently delete your account and all associated data.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowConfirm(true)}
                >
                  Delete account
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
