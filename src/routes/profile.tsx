import { createFileRoute, redirect } from "@tanstack/react-router"
import { ProfilePage } from "@/pages/profile/profile-page"

interface ProfileSearch {
  reason?: "consent-stale"
  linked?: "google" | "steam"
}

export const Route = createFileRoute("/profile")({
  validateSearch: (search: Record<string, unknown>): ProfileSearch => {
    const next: ProfileSearch = {}
    if (search.reason === "consent-stale") next.reason = "consent-stale"
    if (search.linked === "google" || search.linked === "steam") {
      next.linked = search.linked
    }
    return next
  },
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: ProfilePage,
})
