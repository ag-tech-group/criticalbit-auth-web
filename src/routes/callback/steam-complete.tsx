import { createFileRoute } from "@tanstack/react-router"
import { OAuthCompletePage } from "@/pages/callback/oauth-complete-page"

export const Route = createFileRoute("/callback/steam-complete")({
  component: OAuthCompletePage,
})
