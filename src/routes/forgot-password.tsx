import { createFileRoute, redirect } from "@tanstack/react-router"
import { ForgotPasswordPage } from "@/pages/forgot-password/forgot-password-page"

type ForgotPasswordSearch = {
  email?: string
}

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (search: Record<string, unknown>): ForgotPasswordSearch =>
    typeof search.email === "string" && search.email
      ? { email: search.email }
      : {},
  beforeLoad: ({ context, search }) => {
    // Authenticated users coming from the "Set a password" CTA need this page
    // to mint a token — don't bounce them when they explicitly opted in with
    // ?email=...; otherwise keep the existing "you're already signed in" guard.
    if (context.auth.isAuthenticated && !search.email) {
      throw redirect({ to: "/profile" })
    }
  },
  component: ForgotPasswordPage,
})
