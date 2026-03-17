import { createFileRoute, redirect } from "@tanstack/react-router"
import { AcceptTermsPage } from "@/pages/accept-terms/accept-terms-page"

export const Route = createFileRoute("/accept-terms")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: AcceptTermsPage,
})
