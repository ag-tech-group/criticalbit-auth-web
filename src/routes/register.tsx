import { createFileRoute, redirect } from "@tanstack/react-router"
import { RegisterPage } from "@/pages/register/register-page"

type RegisterSearch = {
  redirect?: string
}

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    redirect: (search.redirect as string) || undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/profile" })
    }
  },
  component: RegisterPage,
})
