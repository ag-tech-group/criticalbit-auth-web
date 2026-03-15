import { createFileRoute, redirect } from "@tanstack/react-router"
import { LoginPage } from "@/pages/login/login-page"

type LoginSearch = {
  redirect?: string
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: (search.redirect as string) || undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/profile" })
    }
  },
  component: LoginPage,
})
