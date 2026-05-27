import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"

type Props = {
  provider: "google" | "steam"
}

export function OAuthAssociateCompletePage({ provider }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    void navigate({ to: "/profile", search: { linked: provider } })
  }, [provider, navigate])

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Linking your account…</p>
    </div>
  )
}
