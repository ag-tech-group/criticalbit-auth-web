import { useEffect, useRef } from "react"
import { useNavigate } from "@tanstack/react-router"
import { api } from "@/api/api"
import { useAuth } from "@/lib/auth"

export function OAuthCompletePage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    async function complete() {
      try {
        const user = await api
          .get("auth/me")
          .json<{ email: string | null; tos_accepted_at: string | null }>()
        // Also refresh the AuthContext so the destination route's beforeLoad
        // sees the new session. The direct read above gives us the user data
        // for the routing decision below without waiting for the React
        // render cycle to flush.
        await auth.checkAuth()

        // Steam OAuth users start with no email until they pass through
        // /accept-terms — route them there even if they previously accepted
        // the old TOS-only gate.
        if (!user.tos_accepted_at || !user.email) {
          await navigate({ to: "/accept-terms" })
          return
        }
        const savedRedirect = localStorage.getItem("auth_redirect")
        localStorage.removeItem("auth_redirect")
        if (savedRedirect && savedRedirect.startsWith("http")) {
          // Cross-origin redirect (consumer apps) — hard nav.
          window.location.href = savedRedirect
          return
        }
        await navigate({ to: savedRedirect ?? "/profile" })
      } catch {
        await navigate({ to: "/login" })
      }
    }

    void complete()
  }, [auth, navigate])

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
