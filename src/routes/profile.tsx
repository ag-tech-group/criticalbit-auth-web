import { createFileRoute, redirect } from "@tanstack/react-router"
import { ProfilePage } from "@/pages/profile/profile-page"

export const Route = createFileRoute("/profile")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: ProfilePage,
})
