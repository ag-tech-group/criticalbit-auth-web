import { createFileRoute, redirect } from "@tanstack/react-router"
import { ProfilePage } from "@/pages/profile/profile-page"

interface ProfileSearch {
  reason?: "consent-stale"
}

export const Route = createFileRoute("/profile")({
  validateSearch: (search: Record<string, unknown>): ProfileSearch => {
    const reason = search.reason
    return reason === "consent-stale" ? { reason } : {}
  },
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: ProfilePage,
})
