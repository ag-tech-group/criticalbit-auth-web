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
    hasUsablePassword: false,
    consents: null,
    login: () => {},
    logout: async () => {},
    checkAuth: async () => {},
    setConsents: () => {},
  },
}

function encodeStateJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
  const body = btoa(JSON.stringify(payload))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
  return `${header}.${body}.sig`
}

const ASSOCIATE_STATE = encodeStateJwt({
  purpose: "associate",
  user_id: "u-1",
})

// Steam OpenID needs a minimum set of openid.* params to satisfy the page
// guard; the actual values don't matter for these tests.
const OPENID_PARAMS =
  "openid.claimed_id=https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Fid%2F76561197960287930&openid.mode=id_res"

function stubLocationSearch(search: string) {
  vi.stubGlobal("location", { ...window.location, search })
}

describe("SteamCallbackPage", () => {
  it("routes to /auth/steam/associate/callback when state.purpose=associate", async () => {
    let loginHit = false
    let associateHit = false
    server.use(
      http.get("*/auth/steam/callback", () => {
        loginHit = true
        return HttpResponse.json(null, { status: 200 })
      }),
      http.get("*/auth/steam/associate/callback", () => {
        associateHit = true
        return HttpResponse.json(
          { detail: { code: "oauth_account_already_linked" } },
          { status: 409 }
        )
      })
    )
    const search = `?${OPENID_PARAMS}&state=${ASSOCIATE_STATE}`
    stubLocationSearch(search)

    await renderWithFileRoutes(<></>, {
      initialLocation: `/callback/steam${search}`,
      routerContext: unauthContext,
    })

    expect(
      await screen.findByText(/this steam account is already linked/i)
    ).toBeInTheDocument()
    expect(loginHit).toBe(false)
    expect(associateHit).toBe(true)

    vi.unstubAllGlobals()
  })

  it("uses the generic sign-in failure copy for login-purpose failures", async () => {
    server.use(
      http.get("*/auth/steam/callback", () =>
        HttpResponse.json({ detail: "anything" }, { status: 400 })
      )
    )
    const search = `?${OPENID_PARAMS}`
    stubLocationSearch(search)

    await renderWithFileRoutes(<></>, {
      initialLocation: `/callback/steam${search}`,
      routerContext: unauthContext,
    })

    expect(await screen.findByText(/steam sign-in failed/i)).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
