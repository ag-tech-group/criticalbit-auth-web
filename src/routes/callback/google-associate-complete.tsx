import { createFileRoute } from "@tanstack/react-router"
import { OAuthAssociateCompletePage } from "@/pages/callback/oauth-associate-complete-page"

export const Route = createFileRoute("/callback/google-associate-complete")({
  component: () => <OAuthAssociateCompletePage provider="google" />,
})
