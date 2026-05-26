import { useEffect, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/user-avatar"
import { api, baseUrl } from "@/api/api"
import { getErrorMessage } from "@/lib/api-errors"
import { useAuth } from "@/lib/auth"
import {
  hasStaleConsent,
  submitConsents,
  type ConsentInput,
  type ConsentType,
} from "@/lib/consent"
import type { ProviderConnection } from "@/lib/oauth-state"
import { Route as ProfileRoute } from "@/routes/profile"

type ProviderId = "google" | "steam"

const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "steam", label: "Steam" },
]

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

  useEffect(() => {
    setDisplayName(auth.displayName ?? "")
  }, [auth.displayName])

  useEffect(() => {
    let cancelled = false
    api
      .get("auth/me/connections")
      .json<ProviderConnection[]>()
      .then((list) => {
        if (!cancelled) setConnections(list)
      })
      .catch(() => {
        // Show an empty list rather than blocking the rest of the page; the
        // user can refresh to retry. Avoids a noisy toast on transient errors.
        if (!cancelled) setConnections([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!search.linked) return
    const label = search.linked === "google" ? "Google" : "Steam"
    toast.success(`Linked your ${label} account.`)
    navigate({ to: "/profile", search: {}, replace: true })
  }, [search.linked, navigate])

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
      window.location.href = "/login"
    } catch (error) {
      const message = await getErrorMessage(error, "Failed to delete account")
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleConnect(provider: ProviderId) {
    setConnectingProvider(provider)
    try {
      if (provider === "steam") {
        // Steam's authorize endpoint 307s straight to Steam's OpenID; navigate
        // there directly to keep the redirect chain server-driven.
        window.location.href = `${baseUrl}/auth/steam/associate/authorize`
        return
      }
      const res = await api
        .get(`auth/${provider}/associate/authorize`)
        .json<{ authorization_url: string }>()
      window.location.href = res.authorization_url
    } catch (error) {
      const message = await getErrorMessage(
        error,
        `Failed to start linking ${provider}`
      )
      toast.error(message)
      setConnectingProvider(null)
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
            {connections === null ? (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <LoaderCircle className="size-3 animate-spin" />
                Loading…
              </p>
            ) : (
              PROVIDERS.map(({ id, label }) => {
                const linked = connections.find((c) => c.provider === id)
                const isConnecting = connectingProvider === id
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3"
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
                    </div>
                    {!linked && (
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
              })
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
