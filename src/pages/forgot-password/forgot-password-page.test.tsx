import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { renderWithFileRoutes } from "@/test/renderers"

const unauthContext = {
  auth: {
    isAuthenticated: false,
    isLoading: false,
    email: null,
    userId: null,
    displayName: null,
    avatarUrl: null,
    tosAcceptedAt: null,
    hasUsablePassword: false,
    consents: null,
    login: () => {},
    logout: async () => {},
    checkAuth: async () => {},
    setConsents: () => {},
  },
}

describe("ForgotPasswordPage", () => {
  it("starts with an empty email when no ?email= is supplied", async () => {
    await renderWithFileRoutes(<></>, {
      initialLocation: "/forgot-password",
      routerContext: unauthContext,
    })

    const input = await screen.findByLabelText<HTMLInputElement>("Email")
    expect(input.value).toBe("")
  })

  it("prefills email from ?email= for the Set-a-password flow", async () => {
    await renderWithFileRoutes(<></>, {
      initialLocation: "/forgot-password?email=player%40example.com",
      routerContext: unauthContext,
    })

    const input = await screen.findByLabelText<HTMLInputElement>("Email")
    expect(input.value).toBe("player@example.com")
  })
})
