import { useEffect, useRef, useState } from "react"
import { baseUrl } from "@/api/api"
import { readPurposeFromStateParam, type OAuthPurpose } from "@/lib/oauth-state"

const ASSOCIATE_ERROR_MESSAGES: Record<string, string> = {
  oauth_account_already_linked:
    "This Steam account is already linked to another criticalbit account. Unlink it there first.",
  oauth_state_invalid:
    "Your link session is invalid. Please return to your profile and try again.",
  oauth_state_expired:
    "Your link session expired. Please return to your profile and try again.",
  oauth_csrf_mismatch:
    "Your link session expired. Please return to your profile and try again.",
  oauth_state_user_mismatch:
    "Something went wrong linking your account. Please try again.",
  oauth_verify_failed: "Steam rejected the response. Please try again.",
}

async function readDetailCode(res: Response): Promise<string | null> {
  try {
    const detail = (await res.clone().json())?.detail
    if (typeof detail === "string") return detail
    if (
      detail &&
      typeof detail === "object" &&
      typeof (detail as { code?: unknown }).code === "string"
    ) {
      return (detail as { code: string }).code
    }
    return null
  } catch {
    return null
  }
}

export function SteamCallbackPage() {
  const [error, setError] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get("openid.claimed_id")) {
      return "Missing Steam authentication parameters"
    }
    return null
  })
  const calledRef = useRef(false)

  useEffect(() => {
    if (error || calledRef.current) return
    calledRef.current = true

    const purpose: OAuthPurpose = readPurposeFromStateParam(
      window.location.search
    )
    const apiPath =
      purpose === "associate"
        ? "/auth/steam/associate/callback"
        : "/auth/steam/callback"

    async function completeFlow() {
      const res = await fetch(`${baseUrl}${apiPath}${window.location.search}`, {
        method: "GET",
        credentials: "include",
      })

      if (res.redirected) {
        window.location.href = res.url
        return
      }

      if (!res.ok) {
        if (purpose === "associate") {
          const code = await readDetailCode(res)
          setError(
            (code && ASSOCIATE_ERROR_MESSAGES[code]) ??
              "Linking your Steam account failed. Please try again."
          )
        } else {
          setError("Steam sign-in failed. Please try again.")
        }
        return
      }

      const savedRedirect = localStorage.getItem("auth_redirect")
      localStorage.removeItem("auth_redirect")
      window.location.href = savedRedirect ?? "/profile"
    }

    completeFlow().catch(() => {
      setError(
        purpose === "associate"
          ? "Linking your Steam account failed. Please try again."
          : "Steam sign-in failed. Please try again."
      )
    })
  }, [error])

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-destructive max-w-md text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Completing Steam sign in...</p>
    </div>
  )
}
