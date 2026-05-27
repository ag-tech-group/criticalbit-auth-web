import { screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
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

describe("VerifyEmailPage", () => {
  it("shows the invalid-link card when no token is in the URL", async () => {
    await renderWithFileRoutes(<></>, {
      initialLocation: "/verify-email",
      routerContext: unauthContext,
    })
    expect(
      await screen.findByText("Invalid link", {
        selector: "[data-slot='card-title']",
      })
    ).toBeInTheDocument()
  })

  it("posts the token to /auth/verify and shows the success card", async () => {
    const captured: { body: unknown } = { body: null }
    server.use(
      http.post("*/auth/verify", async ({ request }) => {
        captured.body = await request.json()
        return HttpResponse.json({ id: "u-1", is_verified: true })
      })
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/verify-email?token=good-token",
      routerContext: unauthContext,
    })

    expect(
      await screen.findByText("Email verified", {
        selector: "[data-slot='card-title']",
      })
    ).toBeInTheDocument()
    expect(captured.body).toEqual({ token: "good-token" })
  })

  it("treats VERIFY_USER_ALREADY_VERIFIED as success", async () => {
    server.use(
      http.post("*/auth/verify", () =>
        HttpResponse.json(
          { detail: "VERIFY_USER_ALREADY_VERIFIED" },
          { status: 400 }
        )
      )
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/verify-email?token=already",
      routerContext: unauthContext,
    })

    expect(
      await screen.findByText("Email verified", {
        selector: "[data-slot='card-title']",
      })
    ).toBeInTheDocument()
  })

  it("shows the invalid-link card on VERIFY_USER_BAD_TOKEN", async () => {
    server.use(
      http.post("*/auth/verify", () =>
        HttpResponse.json({ detail: "VERIFY_USER_BAD_TOKEN" }, { status: 400 })
      )
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/verify-email?token=expired",
      routerContext: unauthContext,
    })

    expect(
      await screen.findByText("Invalid link", {
        selector: "[data-slot='card-title']",
      })
    ).toBeInTheDocument()
  })

  it("shows the generic failure card for unexpected errors", async () => {
    server.use(
      http.post("*/auth/verify", () =>
        HttpResponse.json({ detail: "Something broke" }, { status: 500 })
      )
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/verify-email?token=boom",
      routerContext: unauthContext,
    })

    expect(
      await screen.findByText("Verification failed", {
        selector: "[data-slot='card-title']",
      })
    ).toBeInTheDocument()
  })
})
