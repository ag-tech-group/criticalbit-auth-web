import { lazy, Suspense, useEffect } from "react"
import { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router"
import { Toaster } from "sonner"
import { RootErrorComponent } from "@/components/error-boundary"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { NotFound } from "@/components/not-found"
import { useAnalytics } from "@/lib/analytics"
import { hasStaleConsent, type ConsentsResponse } from "@/lib/consent"

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-router-devtools").then((mod) => ({
        default: mod.TanStackRouterDevtools,
      }))
    )

const ReactQueryDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-query-devtools").then((mod) => ({
        default: mod.ReactQueryDevtools,
      }))
    )

interface RouterContext {
  queryClient: QueryClient
  auth: {
    isAuthenticated: boolean
    isLoading: boolean
    email: string | null
    userId: string | null
    displayName: string | null
    avatarUrl: string | null
    tosAcceptedAt: string | null
    consents: ConsentsResponse | null
    login: (email: string) => void
    logout: () => Promise<void>
    checkAuth: () => Promise<void>
    setConsents: (consents: ConsentsResponse) => void
  }
}

// Routes that must never be hijacked by the stale-consent redirect:
// /profile is the redirect target itself, and /callback/* handles in-flight
// OAuth exchanges where interrupting the navigation would break sign-in.
const CONSENT_REDIRECT_SKIP_PREFIXES = ["/profile", "/callback"]

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) return
    const skip = CONSENT_REDIRECT_SKIP_PREFIXES.some((prefix) =>
      location.pathname.startsWith(prefix)
    )
    if (skip) return
    if (hasStaleConsent(context.auth.consents)) {
      throw redirect({
        to: "/profile",
        search: { reason: "consent-stale" as const },
      })
    }
  },
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootErrorComponent,
})

function RouteTracker() {
  const router = useRouter()
  const analytics = useAnalytics()
  useEffect(() => {
    return router.subscribe("onResolved", ({ toLocation }) => {
      analytics.page(toLocation.pathname)
    })
  }, [router, analytics])
  return null
}

function RootComponent() {
  return (
    <>
      <RouteTracker />
      <Navbar />
      <div className="flex min-h-screen flex-col pt-14">
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
        <Footer />
      </div>
      <Toaster position="bottom-right" richColors closeButton />
      <Suspense fallback={null}>
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </Suspense>
    </>
  )
}
