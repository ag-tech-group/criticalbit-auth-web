import { useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { api, setOnUnauthorized } from "@/api/api"
import {
  clearCachedConsents,
  fetchConsents,
  writeCachedConsents,
  type ConsentsResponse,
} from "@/lib/consent"
import { resetAnalytics } from "@/lib/analytics"

const EMAIL_KEY = "app_auth_email"

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  email: string | null
  userId: string | null
  displayName: string | null
  avatarUrl: string | null
  tosAcceptedAt: string | null
  hasUsablePassword: boolean
  consents: ConsentsResponse | null
  login: (email: string) => void
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setConsents: (consents: ConsentsResponse) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(() =>
    localStorage.getItem(EMAIL_KEY)
  )
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [tosAcceptedAt, setTosAcceptedAt] = useState<string | null>(null)
  const [hasUsablePassword, setHasUsablePassword] = useState(false)
  const [consents, setConsentsState] = useState<ConsentsResponse | null>(null)

  const setConsents = useCallback((next: ConsentsResponse) => {
    setConsentsState(next)
    writeCachedConsents(next)
  }, [])

  const clearState = useCallback(() => {
    localStorage.removeItem(EMAIL_KEY)
    setIsAuthenticated(false)
    setEmail(null)
    setUserId(null)
    setDisplayName(null)
    setTosAcceptedAt(null)
    setAvatarUrl(null)
    setHasUsablePassword(false)
    setConsentsState(null)
    clearCachedConsents()
    resetAnalytics()
    queryClient.clear()
  }, [queryClient])

  const logout = useCallback(async () => {
    try {
      await api.post("auth/jwt/logout")
    } catch {
      // Clear state regardless of fetch success
    }
    clearState()
  }, [clearState])

  const login = useCallback((newEmail: string) => {
    localStorage.setItem(EMAIL_KEY, newEmail)
    setEmail(newEmail)
    setIsAuthenticated(true)
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const user = await api.get("auth/me").json<{
        id: string
        email: string | null
        display_name: string | null
        avatar_url: string | null
        tos_accepted_at: string | null
        has_usable_password?: boolean
      }>()
      setIsAuthenticated(true)
      setEmail(user.email)
      setUserId(user.id)
      setDisplayName(user.display_name)
      setAvatarUrl(user.avatar_url)
      setTosAcceptedAt(user.tos_accepted_at)
      setHasUsablePassword(user.has_usable_password ?? false)
      // Steam OAuth users start with no email until they pass /accept-terms;
      // don't cache "null" as a string and don't leave a stale value behind.
      if (user.email) {
        localStorage.setItem(EMAIL_KEY, user.email)
      } else {
        localStorage.removeItem(EMAIL_KEY)
      }
      // Consent hydration must not block auth — if the fetch fails the user
      // still appears logged in; the root guard treats null consents as
      // "nothing stale" so the app stays usable.
      try {
        const fresh = await fetchConsents()
        setConsentsState(fresh)
        writeCachedConsents(fresh)
      } catch {
        setConsentsState(null)
      }
    } catch {
      clearState()
    } finally {
      setIsLoading(false)
    }
  }, [clearState])

  useEffect(() => {
    // checkAuth is async: its setState calls run after an await, not
    // synchronously within the effect body, so cascading renders don't apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    setOnUnauthorized(() => {
      clearState()
    })
  }, [clearState])

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      email,
      userId,
      displayName,
      avatarUrl,
      tosAcceptedAt,
      hasUsablePassword,
      consents,
      login,
      logout,
      checkAuth,
      setConsents,
    }),
    [
      isAuthenticated,
      isLoading,
      email,
      userId,
      displayName,
      avatarUrl,
      tosAcceptedAt,
      hasUsablePassword,
      consents,
      login,
      logout,
      checkAuth,
      setConsents,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
