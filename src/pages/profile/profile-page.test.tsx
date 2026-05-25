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
  email: string
  display_name: string | null
  avatar_url: string | null
  tos_accepted_at: string | null
}

const consentsHandler = http.get("*/user/consents", () =>
  HttpResponse.json({ current_policy_version: "test", consents: {} })
)

function authMeHandler(initial: AuthMeBody) {
  let current = initial
  return {
    setBody(next: AuthMeBody) {
      current = next
    },
    handler: http.get("*/auth/me", () => HttpResponse.json(current)),
  }
}

describe("ProfilePage display name", () => {
  it("pre-fills the input with the current display_name", async () => {
    const me = authMeHandler({
      id: "u-1",
      email: "player@example.com",
      display_name: "ZeroEmpires",
      avatar_url: null,
      tos_accepted_at: "2026-01-01T00:00:00Z",
    })
    server.use(me.handler, consentsHandler)

    await renderWithFileRoutes(<></>, { initialLocation: "/profile" })

    const input = await screen.findByLabelText<HTMLInputElement>("Display name")
    await waitFor(() => expect(input.value).toBe("ZeroEmpires"))
  })

  it("renders an empty input when display_name is unset", async () => {
    const me = authMeHandler({
      id: "u-1",
      email: "player@example.com",
      display_name: null,
      avatar_url: null,
      tos_accepted_at: "2026-01-01T00:00:00Z",
    })
    server.use(me.handler, consentsHandler)

    await renderWithFileRoutes(<></>, { initialLocation: "/profile" })

    const input = await screen.findByLabelText<HTMLInputElement>("Display name")
    await waitFor(() => expect(input.value).toBe(""))
  })

  it("PATCHes /auth/me with the trimmed value and toasts on success", async () => {
    const me = authMeHandler({
      id: "u-1",
      email: "player@example.com",
      display_name: null,
      avatar_url: null,
      tos_accepted_at: "2026-01-01T00:00:00Z",
    })
    let captured: { display_name?: unknown } | null = null
    server.use(
      me.handler,
      consentsHandler,
      http.patch("*/auth/me", async ({ request }) => {
        captured = (await request.json()) as { display_name?: unknown }
        me.setBody({
          id: "u-1",
          email: "player@example.com",
          display_name: "ZeroEmpires",
          avatar_url: null,
          tos_accepted_at: "2026-01-01T00:00:00Z",
        })
        return HttpResponse.json({ ok: true })
      })
    )

    await renderWithFileRoutes(<></>, { initialLocation: "/profile" })

    const user = userEvent.setup()
    const input = await screen.findByLabelText<HTMLInputElement>("Display name")
    await user.type(input, "  ZeroEmpires  ")
    await user.click(screen.getByRole("button", { name: /save display name/i }))

    await waitFor(() => expect(captured).not.toBeNull())
    expect(captured).toEqual({ display_name: "ZeroEmpires" })
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Display name updated.")
    )
  })

  it("sends an empty string when the user clears the field", async () => {
    const me = authMeHandler({
      id: "u-1",
      email: "player@example.com",
      display_name: "ZeroEmpires",
      avatar_url: null,
      tos_accepted_at: "2026-01-01T00:00:00Z",
    })
    let captured: { display_name?: unknown } | null = null
    server.use(
      me.handler,
      consentsHandler,
      http.patch("*/auth/me", async ({ request }) => {
        captured = (await request.json()) as { display_name?: unknown }
        me.setBody({
          id: "u-1",
          email: "player@example.com",
          display_name: null,
          avatar_url: null,
          tos_accepted_at: "2026-01-01T00:00:00Z",
        })
        return HttpResponse.json({ ok: true })
      })
    )

    await renderWithFileRoutes(<></>, { initialLocation: "/profile" })

    const user = userEvent.setup()
    const input = await screen.findByLabelText<HTMLInputElement>("Display name")
    await waitFor(() => expect(input.value).toBe("ZeroEmpires"))

    await user.clear(input)
    await user.click(
      screen.getByRole("button", { name: /clear display name/i })
    )

    await waitFor(() => expect(captured).not.toBeNull())
    expect(captured).toEqual({ display_name: "" })
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Display name cleared.")
    )
  })

  it("surfaces backend 422 messages as an error toast", async () => {
    const me = authMeHandler({
      id: "u-1",
      email: "player@example.com",
      display_name: null,
      avatar_url: null,
      tos_accepted_at: "2026-01-01T00:00:00Z",
    })
    server.use(
      me.handler,
      consentsHandler,
      http.patch("*/auth/me", () =>
        HttpResponse.json(
          { detail: "Display name is too long." },
          { status: 422 }
        )
      )
    )

    await renderWithFileRoutes(<></>, { initialLocation: "/profile" })

    const user = userEvent.setup()
    const input = await screen.findByLabelText<HTMLInputElement>("Display name")
    await user.type(input, "anything")
    await user.click(screen.getByRole("button", { name: /save display name/i }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Display name is too long.")
    )
  })

  it("disables the save button when the trimmed value equals the current name", async () => {
    const me = authMeHandler({
      id: "u-1",
      email: "player@example.com",
      display_name: "ZeroEmpires",
      avatar_url: null,
      tos_accepted_at: "2026-01-01T00:00:00Z",
    })
    server.use(me.handler, consentsHandler)

    await renderWithFileRoutes(<></>, { initialLocation: "/profile" })

    const input = await screen.findByLabelText<HTMLInputElement>("Display name")
    await waitFor(() => expect(input.value).toBe("ZeroEmpires"))

    const button = screen.getByRole("button", { name: /save display name/i })
    expect(button).toBeDisabled()

    const user = userEvent.setup()
    await user.type(input, "   ")
    expect(button).toBeDisabled()
  })
})
