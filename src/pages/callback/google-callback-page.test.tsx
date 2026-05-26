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

const LOGIN_STATE = encodeStateJwt({ purpose: "login" })
const ASSOCIATE_STATE = encodeStateJwt({
  purpose: "associate",
  user_id: "u-1",
})

function stubLocationSearch(search: string) {
  vi.stubGlobal("location", { ...window.location, search })
}

describe("GoogleCallbackPage login dispatch", () => {
  it("surfaces verify-first guidance when the API refuses an unverified merge", async () => {
    server.use(
      http.get("*/auth/google/callback", () =>
        HttpResponse.json(
          { detail: "OAUTH_USER_ALREADY_EXISTS" },
          { status: 400 }
        )
      )
    )
    stubLocationSearch(`?code=abc&state=${LOGIN_STATE}`)

    await renderWithFileRoutes(<></>, {
      initialLocation: `/callback/google?code=abc&state=${LOGIN_STATE}`,
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
    stubLocationSearch(`?code=abc&state=${LOGIN_STATE}`)

    await renderWithFileRoutes(<></>, {
      initialLocation: `/callback/google?code=abc&state=${LOGIN_STATE}`,
      routerContext: unauthContext,
    })

    expect(
      await screen.findByText(/google sign-in failed/i)
    ).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})

describe("GoogleCallbackPage associate dispatch", () => {
  it("routes to /auth/google/associate/callback when state.purpose=associate", async () => {
    let loginHit = false
    let associateHit = false
    server.use(
      http.get("*/auth/google/callback", () => {
        loginHit = true
        return HttpResponse.json(null, { status: 200 })
      }),
      http.get("*/auth/google/associate/callback", () => {
        associateHit = true
        return HttpResponse.json(
          { detail: { code: "oauth_state_expired" } },
          { status: 400 }
        )
      })
    )
    stubLocationSearch(`?code=abc&state=${ASSOCIATE_STATE}`)

    await renderWithFileRoutes(<></>, {
      initialLocation: `/callback/google?code=abc&state=${ASSOCIATE_STATE}`,
      routerContext: unauthContext,
    })

    expect(await screen.findByText(/link session expired/i)).toBeInTheDocument()
    expect(loginHit).toBe(false)
    expect(associateHit).toBe(true)

    vi.unstubAllGlobals()
  })

  it("shows already-linked copy when API returns 409 oauth_account_already_linked", async () => {
    server.use(
      http.get("*/auth/google/associate/callback", () =>
        HttpResponse.json(
          { detail: { code: "oauth_account_already_linked" } },
          { status: 409 }
        )
      )
    )
    stubLocationSearch(`?code=abc&state=${ASSOCIATE_STATE}`)

    await renderWithFileRoutes(<></>, {
      initialLocation: `/callback/google?code=abc&state=${ASSOCIATE_STATE}`,
      routerContext: unauthContext,
    })

    expect(
      await screen.findByText(/already linked to another criticalbit/i)
    ).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
