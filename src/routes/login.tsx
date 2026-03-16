import { createFileRoute, redirect } from "@tanstack/react-router"
import { LoginPage } from "@/pages/login/login-page"

type LoginSearch = {
  redirect?: string
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: (search.redirect as string) || undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      const target = (search as LoginSearch).redirect
      if (target && target.startsWith("http")) {
        window.location.href = target
        return
      }
      throw redirect({ to: target ?? "/profile" })
    }
  },
  component: LoginPage,
})
