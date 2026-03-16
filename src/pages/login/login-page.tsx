import { useState } from "react"
import { Link, useSearch } from "@tanstack/react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, baseUrl } from "@/api/api"
import { getErrorMessage } from "@/lib/api-errors"

export function LoginPage() {
  const search = useSearch({ from: "/login" })
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirect = (search as { redirect?: string }).redirect

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await api.post("auth/jwt/login", {
        body: new URLSearchParams({ username: email, password }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      // Hard redirect — reloads the page so AuthProvider picks up the new cookie cleanly.
      // Client-side navigate has a race condition with the onUnauthorized handler.
      window.location.href = redirect ?? "/profile"
    } catch (error) {
      const message = await getErrorMessage(error, "Login failed")
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    try {
      const res = await api
        .get("auth/google/authorize")
        .json<{ authorization_url: string }>()
      window.location.href = res.authorization_url
    } catch (error) {
      const message = await getErrorMessage(
        error,
        "Failed to start Google sign-in"
      )
      toast.error(message)
    }
  }

  function handleSteamLogin() {
    // In production, the authorize endpoint returns a 307 redirect to Steam,
    // so we navigate directly instead of fetching (avoids CSP issues).
    window.location.href = `${baseUrl}/auth/steam/authorize`
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Sign in to your criticalbit.gg account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-muted-foreground hover:text-primary text-xs underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">or</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSteamLogin}
            >
              <svg
                className="size-4"
                viewBox="0 0 256 259"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M127.779 0C60.41 0 5.24 50.68.674 114.736l68.972 28.49c5.817-3.994 12.834-6.332 20.387-6.332.672 0 1.336.02 1.996.054l30.502-44.178v-.62c0-27.654 22.5-50.148 50.161-50.148 27.66 0 50.16 22.494 50.16 50.154 0 27.66-22.5 50.154-50.16 50.154h-1.164l-43.47 31.04c0 .536.03 1.07.03 1.596 0 20.736-16.87 37.608-37.612 37.608-18.4 0-33.78-13.274-36.932-30.756L3.266 159.22C19.69 215.44 69.04 258.213 127.779 258.213c70.57 0 127.78-57.212 127.78-127.607C255.559 57.21 198.348 0 127.779 0" />
              </svg>
              Sign in with Steam
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
