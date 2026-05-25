import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { renderWithFileRoutes } from "@/test/renderers"
import { server } from "@/test/setup"

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>()
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

import { toast } from "sonner"

type AuthMeBody = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  tos_accepted_at: string | null
}

const consentsHandler = http.get("*/user/consents", () =>
  HttpResponse.json({ current_policy_version: "test", consents: {} })
)

function authMeHandler(body: AuthMeBody) {
  return http.get("*/auth/me", () => HttpResponse.json(body))
}

function makeRouterAuth(overrides: {
  email: string | null
  tosAcceptedAt?: string | null
}) {
  return {
    auth: {
      isAuthenticated: true,
      isLoading: false,
      email: overrides.email,
      userId: "u-1",
      displayName: null,
      avatarUrl: null,
      tosAcceptedAt: overrides.tosAcceptedAt ?? null,
      consents: null,
      login: () => {},
      logout: async () => {},
      checkAuth: async () => {},
      setConsents: () => {},
    },
  }
}

describe("AcceptTermsPage", () => {
  it("renders the ToS-only flow for users who already have an email", async () => {
    server.use(
      authMeHandler({
        id: "u-1",
        email: "player@example.com",
        display_name: null,
        avatar_url: null,
        tos_accepted_at: null,
      }),
      consentsHandler
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/accept-terms",
      routerContext: makeRouterAuth({ email: "player@example.com" }),
    })

    expect(
      await screen.findByText("Terms of Service", {
        selector: "[data-slot='card-title']",
      })
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument()
  })

  it("posts /auth/accept-tos with no body when the user already has an email", async () => {
    const captured: { body: string | null } = { body: null }
    server.use(
      authMeHandler({
        id: "u-1",
        email: "player@example.com",
        display_name: null,
        avatar_url: null,
        tos_accepted_at: null,
      }),
      consentsHandler,
      http.post("*/auth/accept-tos", async ({ request }) => {
        captured.body = await request.text()
        return HttpResponse.json({
          id: "u-1",
          email: "player@example.com",
          display_name: null,
          avatar_url: null,
          tos_accepted_at: new Date().toISOString(),
        })
      })
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/accept-terms",
      routerContext: makeRouterAuth({ email: "player@example.com" }),
    })

    const user = userEvent.setup()
    await user.click(await screen.findByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: /continue/i }))

    await waitFor(() => expect(captured.body).not.toBeNull())
    expect(captured.body).toBe("")
  })

  it("shows the email input + ToS checkbox for fresh users with no email", async () => {
    server.use(
      authMeHandler({
        id: "u-1",
        email: null,
        display_name: "ZeroEmpires",
        avatar_url: null,
        tos_accepted_at: null,
      }),
      consentsHandler
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/accept-terms",
      routerContext: makeRouterAuth({ email: null }),
    })

    expect(
      await screen.findByText("Terms of Service", {
        selector: "[data-slot='card-title']",
      })
    ).toBeInTheDocument()
    expect(await screen.findByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByRole("checkbox")).toBeInTheDocument()
  })

  it("uses the backfill copy for users who accepted ToS but never set an email", async () => {
    server.use(
      authMeHandler({
        id: "u-1",
        email: null,
        display_name: "ZeroEmpires",
        avatar_url: null,
        tos_accepted_at: "2026-01-01T00:00:00Z",
      }),
      consentsHandler
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/accept-terms",
      routerContext: makeRouterAuth({
        email: null,
        tosAcceptedAt: "2026-01-01T00:00:00Z",
      }),
    })

    expect(
      await screen.findByText("One more thing", {
        selector: "[data-slot='card-title']",
      })
    ).toBeInTheDocument()
    expect(await screen.findByLabelText("Email")).toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("posts the trimmed lowercased email when the user submits", async () => {
    let captured: { email?: unknown } | null = null
    server.use(
      authMeHandler({
        id: "u-1",
        email: null,
        display_name: "ZeroEmpires",
        avatar_url: null,
        tos_accepted_at: null,
      }),
      consentsHandler,
      http.post("*/auth/accept-tos", async ({ request }) => {
        captured = (await request.json()) as { email?: unknown }
        return HttpResponse.json({
          id: "u-1",
          email: "player@example.com",
          display_name: "ZeroEmpires",
          avatar_url: null,
          tos_accepted_at: new Date().toISOString(),
        })
      })
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/accept-terms",
      routerContext: makeRouterAuth({ email: null }),
    })

    const user = userEvent.setup()
    const input = await screen.findByLabelText<HTMLInputElement>("Email")
    await user.type(input, "  Player@Example.com  ")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: /continue/i }))

    await waitFor(() => expect(captured).not.toBeNull())
    expect(captured).toEqual({ email: "player@example.com" })
  })

  it("renders an inline error and a sign-in CTA on 422 email_already_registered", async () => {
    server.use(
      authMeHandler({
        id: "u-1",
        email: null,
        display_name: "ZeroEmpires",
        avatar_url: null,
        tos_accepted_at: null,
      }),
      consentsHandler,
      http.post("*/auth/accept-tos", () =>
        HttpResponse.json(
          {
            detail: {
              code: "email_already_registered",
              message:
                "An account with that email already exists. Sign in to that account and link Steam from your profile.",
            },
          },
          { status: 422 }
        )
      )
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/accept-terms",
      routerContext: makeRouterAuth({ email: null }),
    })

    const user = userEvent.setup()
    const input = await screen.findByLabelText<HTMLInputElement>("Email")
    await user.type(input, "player@example.com")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: /continue/i }))

    expect(
      await screen.findByText(/account with that email already exists/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /sign in with that account instead/i })
    ).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("falls back to a toast for unstructured errors", async () => {
    server.use(
      authMeHandler({
        id: "u-1",
        email: "player@example.com",
        display_name: null,
        avatar_url: null,
        tos_accepted_at: null,
      }),
      consentsHandler,
      http.post("*/auth/accept-tos", () =>
        HttpResponse.json({ detail: "boom" }, { status: 500 })
      )
    )

    await renderWithFileRoutes(<></>, {
      initialLocation: "/accept-terms",
      routerContext: makeRouterAuth({ email: "player@example.com" }),
    })

    const user = userEvent.setup()
    await user.click(await screen.findByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: /continue/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("boom"))
  })
})
