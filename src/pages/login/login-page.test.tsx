import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { renderWithFileRoutes } from "@/test/renderers"

const unauthContext = {
  auth: {
    isAuthenticated: false,
    isLoading: false,
    email: null,
    userId: null,
    login: () => {},
    logout: async () => {},
    checkAuth: async () => {},
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
})
