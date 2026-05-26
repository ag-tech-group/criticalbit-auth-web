import { screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { renderWithFileRoutes } from "@/test/renderers"
import { server } from "@/test/setup"

// Regression guard for criticalbit-web#23 (recurring): the navbar must
// render the human-readable display_name returned by /auth/me, never the
// raw user id (which for Steam OAuth is the SteamID64). The actual root
// cause of the linked bug lives in criticalbit-auth-api (#26) — but this
// test pins the *frontend* contract so a rename like `display_name` →
// `displayName`, a dropped setDisplayName call, or a navbar swap to
// userId/email can't silently reintroduce the same visible regression
// here.

const STEAM_ID = "76561198000000000"

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

function authMeHandler(body: {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  tos_accepted_at: string | null
}) {
  return http.get("*/auth/me", () => HttpResponse.json(body))
}

// The consent fetch fires right after /auth/me succeeds. Stub it so the
// AuthProvider's catch-all doesn't surface as an unhandled-request warning.
const consentsHandler = http.get("*/user/consents", () =>
  HttpResponse.json({ current_policy_version: "test", consents: {} })
)

describe("Navbar", () => {
  it("renders the Steam display_name, not the SteamID64", async () => {
    server.use(
      authMeHandler({
        id: STEAM_ID,
        email: "player@example.com",
        display_name: "ZeroEmpires",
        avatar_url: null,
        tos_accepted_at: null,
      }),
      consentsHandler
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/login",
      routerContext: unauthContext,
    })

    expect(await screen.findByText("ZeroEmpires")).toBeInTheDocument()
    expect(screen.queryByText(STEAM_ID)).not.toBeInTheDocument()
    expect(screen.queryByText("player@example.com")).not.toBeInTheDocument()
  })

  it("falls back to email when display_name is null", async () => {
    server.use(
      authMeHandler({
        id: STEAM_ID,
        email: "player@example.com",
        display_name: null,
        avatar_url: null,
        tos_accepted_at: null,
      }),
      consentsHandler
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/login",
      routerContext: unauthContext,
    })

    expect(await screen.findByText("player@example.com")).toBeInTheDocument()
    expect(screen.queryByText(STEAM_ID)).not.toBeInTheDocument()
  })
})
