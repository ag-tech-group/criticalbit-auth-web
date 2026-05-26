import { createFileRoute } from "@tanstack/react-router"
import { VerifyEmailPage } from "@/pages/verify-email/verify-email-page"

type VerifyEmailSearch = {
  token?: string
}

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    token: (search.token as string) || undefined,
  }),
  component: VerifyEmailPage,
})
