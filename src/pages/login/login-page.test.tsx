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

describe("LoginPage", () => {
  it("renders the sign in form", async () => {
    await renderWithFileRoutes(<></>, {
      initialLocation: "/login",
      routerContext: unauthContext,
    })
    expect(
      screen.getByText("Sign in", { selector: "[data-slot='card-title']" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument()
  })

  it("has a link to register", async () => {
    await renderWithFileRoutes(<></>, {
      initialLocation: "/login",
      routerContext: unauthContext,
    })
    expect(screen.getByText("Sign up")).toBeInTheDocument()
  })

  it("preserves ?redirect= on the Sign up link", async () => {
    await renderWithFileRoutes(<></>, {
      initialLocation:
        "/login?redirect=https%3A%2F%2Fhera-streamer-invitational-2026.criticalbit.gg%2F",
      routerContext: unauthContext,
    })
    const link = await screen.findByRole("link", { name: "Sign up" })
    // TanStack Router serializes search params alphabetically and re-encodes —
    // the important thing is that the redirect target survives the hop, not
    // the exact encoding.
    expect(link.getAttribute("href")).toMatch(
      /^\/register\?redirect=.*hera-streamer-invitational-2026\.criticalbit\.gg/
    )
  })
})
