import { useEffect, useRef, useState } from "react"
import { baseUrl } from "@/api/api"

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

    fetch(`${baseUrl}/auth/google/callback${window.location.search}`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
        window.location.href = "/profile"
      })
      .catch(() => {
        setError("Google sign-in failed. Please try again.")
      })
  }, [error])

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
