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
import { api } from "@/api/api"
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

  async function handleSteamLogin() {
    try {
      const res = await api
        .get("auth/steam/authorize")
        .json<{ authorization_url: string }>()
      window.location.href = res.authorization_url
    } catch (error) {
      const message = await getErrorMessage(
        error,
        "Failed to start Steam sign-in"
      )
      toast.error(message)
    }
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
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSteamLogin}
            >
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
