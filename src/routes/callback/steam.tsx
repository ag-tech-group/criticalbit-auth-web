import { createFileRoute } from "@tanstack/react-router"
import { SteamCallbackPage } from "@/pages/callback/steam-callback-page"

export const Route = createFileRoute("/callback/steam")({
  component: SteamCallbackPage,
})
