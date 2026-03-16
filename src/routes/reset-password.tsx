import { createFileRoute } from "@tanstack/react-router"
import { ResetPasswordPage } from "@/pages/reset-password/reset-password-page"

type ResetPasswordSearch = {
  token?: string
}

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: (search.token as string) || undefined,
  }),
  component: ResetPasswordPage,
})
