import { describe, expect, it } from "vitest"
import { readPurposeFromStateParam } from "./oauth-state"

function encodeStateJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
  const body = btoa(JSON.stringify(payload))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
  return `${header}.${body}.signature`
}

describe("readPurposeFromStateParam", () => {
  it("returns 'login' when no state param is present", () => {
    expect(readPurposeFromStateParam("?code=abc")).toBe("login")
  })

  it("returns 'associate' when the state JWT payload has purpose=associate", () => {
    const state = encodeStateJwt({ purpose: "associate", user_id: "u-1" })
    expect(readPurposeFromStateParam(`?state=${state}`)).toBe("associate")
  })

  it("returns 'login' when the state JWT payload has purpose=login", () => {
    const state = encodeStateJwt({ purpose: "login" })
    expect(readPurposeFromStateParam(`?state=${state}`)).toBe("login")
  })

  it("falls back to 'login' for malformed tokens", () => {
    expect(readPurposeFromStateParam("?state=not-a-jwt")).toBe("login")
    expect(readPurposeFromStateParam("?state=a.b.c")).toBe("login")
  })

  it("falls back to 'login' when the payload lacks a purpose field", () => {
    const state = encodeStateJwt({ other: "field" })
    expect(readPurposeFromStateParam(`?state=${state}`)).toBe("login")
  })
})
