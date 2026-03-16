import { useEffect } from "react"

export function OAuthCompletePage() {
  useEffect(() => {
    const savedRedirect = localStorage.getItem("auth_redirect")
    localStorage.removeItem("auth_redirect")
    window.location.href = savedRedirect ?? "/profile"
  }, [])

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  )
}
