import { createFileRoute, redirect } from "@tanstack/react-router"
import { RegisterPage } from "@/pages/register/register-page"

export const Route = createFileRoute("/register")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/profile" })
    }
  },
  component: RegisterPage,
})
