import { createFileRoute } from "@tanstack/react-router"
import { GoogleCallbackPage } from "@/pages/callback/google-callback-page"

export const Route = createFileRoute("/callback/google")({
  component: GoogleCallbackPage,
})
