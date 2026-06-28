import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { reactErrorHandler } from "@sentry/react"
import { toast } from "sonner"
// @ts-expect-error -- fontsource CSS-only import, no types
import "@fontsource-variable/geist"
import { BrandLockup } from "./components/brand-lockup"
import { ErrorBoundary } from "./components/error-boundary"
import { NotFound } from "./components/not-found"
import { ThemeProvider } from "./components/theme-provider"
import "./index.css"
import { Skeleton } from "./components/ui/skeleton"
import { AnalyticsProvider, createAnalyticsBackend } from "./lib/analytics"
import { getErrorMessage } from "./lib/api-errors"
import { AuthProvider, useAuth } from "./lib/auth"
import { FeatureFlagProvider } from "./lib/feature-flags"
import { initSentry } from "./lib/sentry"
import { routeTree } from "./routeTree.gen"

// A `vite:preloadError` fires when a dynamic import for a code-split chunk
// fails — almost always because a newer build was deployed and this tab is now
// stale (it references content-hashed chunk filenames the deploy has replaced).
// Prompt to reload rather than force-reloading: a forced reload discards unsaved
// work (e.g. a half-filled login/registration form), and because the router uses
// `defaultPreload: "intent"` this event also fires for speculative preloads
// (hovering a stale link), where auto-reloading would be jarring.
// `preventDefault()` stops Vite re-throwing the failed import. Shown once so a
// burst of failures can't stack it.
let updateToastShown = false
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault()
  if (updateToastShown) return
  updateToastShown = true
  toast.info("A new version is available", {
    description: "Reload to get the latest update.",
    duration: Infinity,
    action: {
      label: "Reload",
      onClick: () => window.location.reload(),
    },
  })
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: async (error, _variables, _context, mutation) => {
      if (mutation.meta?.skipGlobalError) return
      const message = await getErrorMessage(error)
      toast.error(message)
    },
  }),
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent: NotFound,
  defaultErrorComponent: ErrorBoundary,
})

initSentry(router)

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      skipGlobalError?: boolean
    }
  }
}

function AppShellSkeleton() {
  return (
    <>
      <nav className="border-border/50 bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <BrandLockup />
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      </nav>
      <div className="flex min-h-screen items-center justify-center px-4 pt-14">
        <div className="w-full max-w-sm space-y-6 rounded-lg border p-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </>
  )
}

function App() {
  const auth = useAuth()
  if (auth.isLoading) return <AppShellSkeleton />
  return <RouterProvider router={router} context={{ auth }} />
}

const analyticsBackend = createAnalyticsBackend()

createRoot(document.getElementById("root")!, {
  onCaughtError: reactErrorHandler(),
  onUncaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="criticalbit_theme">
        <AuthProvider>
          <AnalyticsProvider backend={analyticsBackend}>
            <FeatureFlagProvider>
              <App />
            </FeatureFlagProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
