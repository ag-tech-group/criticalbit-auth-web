import { useEffect, useRef, useState } from "react"
import { baseUrl } from "@/api/api"
import { readPurposeFromStateParam, type OAuthPurpose } from "@/lib/oauth-state"

const OAUTH_USER_ALREADY_EXISTS_MESSAGE =
  "An unverified account already exists for this email. Sign in with your password, verify your email, then link Google from your profile."

const ASSOCIATE_ERROR_MESSAGES: Record<string, string> = {
  oauth_account_already_linked:
    "This Google account is already linked to another criticalbit account. Unlink it there first.",
  oauth_state_invalid:
    "Your link session is invalid. Please return to your profile and try again.",
  oauth_state_expired:
    "Your link session expired. Please return to your profile and try again.",
  oauth_csrf_mismatch:
    "Your link session expired. Please return to your profile and try again.",
  oauth_state_user_mismatch:
    "Something went wrong linking your account. Please try again.",
  oauth_verify_failed: "Google rejected the response. Please try again.",
}

async function readDetail(res: Response): Promise<unknown> {
  try {
    return (await res.clone().json())?.detail
  } catch {
    return null
  }
}

function detailCode(detail: unknown): string | null {
  if (typeof detail === "string") return detail
  if (
    detail &&
    typeof detail === "object" &&
    typeof (detail as { code?: unknown }).code === "string"
  ) {
    return (detail as { code: string }).code
  }
  return null
}

export function GoogleCallbackPage() {
  const [error, setError] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get("code") || !params.get("state")) {
      return "Missing authorization parameters"
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
        ? "/auth/google/associate/callback"
        : "/auth/google/callback"

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
        const code = detailCode(await readDetail(res))
        if (purpose === "associate") {
          setError(
            (code && ASSOCIATE_ERROR_MESSAGES[code]) ??
              "Linking your Google account failed. Please try again."
          )
        } else if (code === "OAUTH_USER_ALREADY_EXISTS") {
          setError(OAUTH_USER_ALREADY_EXISTS_MESSAGE)
        } else {
          setError("Google sign-in failed. Please try again.")
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
          ? "Linking your Google account failed. Please try again."
          : "Google sign-in failed. Please try again."
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
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
