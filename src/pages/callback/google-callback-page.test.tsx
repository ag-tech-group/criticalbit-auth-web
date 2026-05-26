import { screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { renderWithFileRoutes } from "@/test/renderers"
import { server } from "@/test/setup"

const unauthContext = {
  auth: {
    isAuthenticated: false,
    isLoading: false,
    email: null,
    userId: null,
    displayName: null,
    avatarUrl: null,
    tosAcceptedAt: null,
    consents: null,
    login: () => {},
    logout: async () => {},
    checkAuth: async () => {},
    setConsents: () => {},
  },
}

describe("GoogleCallbackPage error handling", () => {
  it("surfaces verify-first guidance when the API refuses an unverified merge", async () => {
    server.use(
      http.get("*/auth/google/callback", () =>
        HttpResponse.json(
          { detail: "OAUTH_USER_ALREADY_EXISTS" },
          { status: 400 }
        )
      )
    )
    vi.stubGlobal("location", {
      ...window.location,
      search: "?code=abc&state=xyz",
    })

    await renderWithFileRoutes(<></>, {
      initialLocation: "/callback/google?code=abc&state=xyz",
      routerContext: unauthContext,
    })

    expect(
      await screen.findByText(/unverified account already exists/i)
    ).toBeInTheDocument()

    vi.unstubAllGlobals()
  })

  it("falls back to the generic message for other failures", async () => {
    server.use(
      http.get("*/auth/google/callback", () =>
        HttpResponse.json({ detail: "OTHER_ERROR" }, { status: 400 })
      )
    )
    vi.stubGlobal("location", {
      ...window.location,
      search: "?code=abc&state=xyz",
    })

    await renderWithFileRoutes(<></>, {
      initialLocation: "/callback/google?code=abc&state=xyz",
      routerContext: unauthContext,
    })

    expect(
      await screen.findByText(/google sign-in failed/i)
    ).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
