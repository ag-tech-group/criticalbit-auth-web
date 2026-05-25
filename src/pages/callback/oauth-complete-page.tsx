import { useEffect, useRef } from "react"
import { api } from "@/api/api"

export function OAuthCompletePage() {
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    api
      .get("auth/me")
      .json<{ email: string | null; tos_accepted_at: string | null }>()
      .then((user) => {
        // Steam OAuth users start with no email until they pass through
        // /accept-terms (auth-api #36, auth-web #36) — route them there
        // even if they previously accepted the old TOS-only gate.
        if (!user.tos_accepted_at || !user.email) {
          // Keep the redirect in localStorage — accept-terms page will use it
          window.location.href = "/accept-terms"
        } else {
          const savedRedirect = localStorage.getItem("auth_redirect")
          localStorage.removeItem("auth_redirect")
          window.location.href = savedRedirect ?? "/profile"
        }
      })
      .catch(() => {
        window.location.href = "/login"
      })
  }, [])

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
