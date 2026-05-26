import { createFileRoute } from "@tanstack/react-router"
import { OAuthAssociateCompletePage } from "@/pages/callback/oauth-associate-complete-page"

export const Route = createFileRoute("/callback/steam-associate-complete")({
  component: () => <OAuthAssociateCompletePage provider="steam" />,
})
