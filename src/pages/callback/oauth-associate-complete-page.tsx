import { useEffect } from "react"

type Props = {
  provider: "google" | "steam"
}

export function OAuthAssociateCompletePage({ provider }: Props) {
  useEffect(() => {
    window.location.href = `/profile?linked=${provider}`
  }, [provider])

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Linking your account…</p>
    </div>
  )
}
