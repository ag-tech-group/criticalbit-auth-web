import { useEffect, useRef, useState } from "react"
import { baseUrl } from "@/api/api"

const OAUTH_USER_ALREADY_EXISTS_MESSAGE =
  "An unverified account already exists for this email. Sign in with your password, verify your email, then link Google from your profile."

async function readDetail(res: Response): Promise<string | null> {
  try {
    const body = await res.clone().json()
    return typeof body?.detail === "string" ? body.detail : null
  } catch {
    return null
  }
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

    async function completeSignIn() {
      const res = await fetch(
        `${baseUrl}/auth/google/callback${window.location.search}`,
        { method: "GET", credentials: "include" }
      )

      if (!res.ok) {
        const detail = await readDetail(res)
        if (detail === "OAUTH_USER_ALREADY_EXISTS") {
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

    completeSignIn().catch(() => {
      setError("Google sign-in failed. Please try again.")
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
