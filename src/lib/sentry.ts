import * as Sentry from "@sentry/react"
import { readCachedConsent } from "@/lib/consent"

type SentryRouter = Parameters<
  typeof Sentry.tanstackRouterBrowserTracingIntegration
>[0]

let initialized = false

export function initSentry(router: SentryRouter) {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  // Session replay is gated on explicit user consent. The integration is
  // still installed when consent is absent so error-driven replays keep
  // working (low quota, high debug value per event); full session
  // sampling only turns on when the user has opted in.
  const sessionReplayConsented = readCachedConsent("session_replay")

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: __APP_VERSION__,

    // Disclosed in the privacy policy at criticalbit.gg/privacy.
    sendDefaultPii: true,

    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/auth-api\.criticalbit\.gg/,
    ],

    // Error-only replay runs for everyone as a legitimate-interest
    // debugging tool (covered by the privacy policy). Full session
    // replay only activates for users who opted in via the Privacy and
    // data toggles on the profile page.
    replaysSessionSampleRate: sessionReplayConsented ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: true,
  })

  initialized = true
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (!initialized) return
  Sentry.captureException(error, context ? { extra: context } : undefined)
}
