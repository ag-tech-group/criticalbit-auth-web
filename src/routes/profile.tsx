import { createFileRoute, redirect } from "@tanstack/react-router"
import { ProfilePage } from "@/pages/profile/profile-page"
import { isAssociateProvider } from "@/lib/associate-errors"

interface ProfileSearch {
  reason?: "consent-stale"
  linked?: "google" | "steam"
  associate_error?: string
  associate_provider?: "google" | "steam"
}

export const Route = createFileRoute("/profile")({
  validateSearch: (search: Record<string, unknown>): ProfileSearch => {
    const next: ProfileSearch = {}
    if (search.reason === "consent-stale") next.reason = "consent-stale"
    if (search.linked === "google" || search.linked === "steam") {
      next.linked = search.linked
    }
    // Both come from the backend's redirect on associate failure; we
    // need the pair to render a sensible message. If either is missing
    // or the provider is unknown, drop both rather than half-rendering.
    if (
      typeof search.associate_error === "string" &&
      isAssociateProvider(search.associate_provider)
    ) {
      next.associate_error = search.associate_error
      next.associate_provider = search.associate_provider
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
