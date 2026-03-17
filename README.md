<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/logo-light.png">
  <img alt="AG Technology Group" src=".github/assets/logo-light.png" width="200">
</picture>

# criticalbit-auth-web

[![CI](https://github.com/ag-tech-group/criticalbit-auth-web/actions/workflows/ci.yml/badge.svg)](https://github.com/ag-tech-group/criticalbit-auth-web/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

Auth frontend for [criticalbit.gg](https://criticalbit.gg). Handles user authentication flows for the entire platform.

**Live:** [auth.criticalbit.gg](https://auth.criticalbit.gg)

## Features

- Email/password login and registration
- Google OAuth and Steam OpenID sign-in
- Password reset via email (Resend)
- User profile with avatar (from OAuth providers)
- Account deletion with confirmation
- ToS acceptance gate for OAuth users
- Dark mode (default) and light mode with shared cookie
- CriticalBit theme (Geist + Geist Pixel Line fonts, ice blue/emerald palette)

## Pages

| Route                       | Description                                   |
| --------------------------- | --------------------------------------------- |
| `/login`                    | Sign in with email/password, Google, or Steam |
| `/register`                 | Create account with ToS acceptance            |
| `/profile`                  | User profile, account deletion                |
| `/forgot-password`          | Request password reset email                  |
| `/reset-password`           | Set new password from email link              |
| `/accept-terms`             | ToS gate for OAuth users                      |
| `/callback/google`          | Google OAuth callback (dev)                   |
| `/callback/steam`           | Steam OpenID callback (dev)                   |
| `/callback/google-complete` | Post-OAuth redirect handler (prod)            |
| `/callback/steam-complete`  | Post-OAuth redirect handler (prod)            |

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (requires auth API on :8000)
pnpm dev

# Build
pnpm build

# Test
pnpm test:run

# Lint
pnpm lint
```

The Vite dev server proxies `/api/*` to `localhost:8000` for same-origin cookie handling.

## License

Apache 2.0 — see [LICENSE](LICENSE).
