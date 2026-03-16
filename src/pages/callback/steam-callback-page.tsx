import { useEffect, useRef, useState } from "react"
import { baseUrl } from "@/api/api"

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

    // Forward Steam's OpenID params to the backend callback
    fetch(`${baseUrl}/auth/steam/callback${window.location.search}`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.redirected) {
          window.location.href = res.url
          return
        }
        if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
        window.location.href = "/profile"
      })
      .catch(() => {
        setError("Steam sign-in failed. Please try again.")
      })
  }, [error])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Completing Steam sign in...</p>
    </div>
  )
}
