import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth"

export function GoogleCallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // After Google OAuth, the auth API has already set the JWT cookie.
    // We just need to check auth state and redirect.
    auth.checkAuth().then(() => {
      navigate({ to: "/profile" })
    })
  }, [auth, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
