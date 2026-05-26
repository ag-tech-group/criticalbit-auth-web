import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { renderWithFileRoutes } from "@/test/renderers"
import { server } from "@/test/setup"

const consentsHandler = http.get("*/user/consents", () =>
  HttpResponse.json({ current_policy_version: "test", consents: {} })
)

function makeAuthContext(overrides: {
  email: string | null
  tosAcceptedAt?: string | null
}) {
  return {
    auth: {
      isAuthenticated: true,
      isLoading: false,
      email: overrides.email,
      userId: "u-1",
      displayName: "ZeroEmpires",
      avatarUrl: null,
      tosAcceptedAt: overrides.tosAcceptedAt ?? null,
      hasUsablePassword: true,
      consents: null,
      login: () => {},
      logout: async () => {},
      checkAuth: async () => {},
      setConsents: () => {},
    },
  }
}

describe("root route email-required gate", () => {
  it("redirects users with no email away from /profile to /accept-terms", async () => {
    server.use(
      http.get("*/auth/me", () =>
        HttpResponse.json({
          id: "u-1",
          email: null,
          display_name: "ZeroEmpires",
          avatar_url: null,
          tos_accepted_at: "2026-01-01T00:00:00Z",
        })
      ),
      consentsHandler
    )

    const { router } = await renderWithFileRoutes(<></>, {
      initialLocation: "/profile",
      routerContext: makeAuthContext({
        email: null,
        tosAcceptedAt: "2026-01-01T00:00:00Z",
      }),
    })

    expect(router.state.location.pathname).toBe("/accept-terms")
  })

  it("leaves /accept-terms reachable for users with no email", async () => {
    server.use(
      http.get("*/auth/me", () =>
        HttpResponse.json({
          id: "u-1",
          email: null,
          display_name: "ZeroEmpires",
          avatar_url: null,
          tos_accepted_at: null,
        })
      ),
      consentsHandler
    )

    const { router } = await renderWithFileRoutes(<></>, {
      initialLocation: "/accept-terms",
      routerContext: makeAuthContext({ email: null }),
    })

    expect(router.state.location.pathname).toBe("/accept-terms")
  })

  it("does not redirect users with a real email", async () => {
    server.use(
      http.get("*/auth/me", () =>
        HttpResponse.json({
          id: "u-1",
          email: "player@example.com",
          display_name: null,
          avatar_url: null,
          tos_accepted_at: "2026-01-01T00:00:00Z",
        })
      ),
      consentsHandler
    )

    const { router } = await renderWithFileRoutes(<></>, {
      initialLocation: "/profile",
      routerContext: makeAuthContext({
        email: "player@example.com",
        tosAcceptedAt: "2026-01-01T00:00:00Z",
      }),
    })

    expect(router.state.location.pathname).toBe("/profile")
  })
})
