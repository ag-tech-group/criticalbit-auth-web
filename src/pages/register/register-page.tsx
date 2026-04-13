import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { submitConsents, type ConsentInput } from "@/lib/consent"

export function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [tosAccepted, setTosAccepted] = useState(false)
  const [analyticsConsent, setAnalyticsConsent] = useState(false)
  const [sessionReplayConsent, setSessionReplayConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsSubmitting(true)

    try {
      await api.post("auth/register", {
        json: { email, password },
      })
      // Auto-login after registration
      await api.post("auth/jwt/login", {
        body: new URLSearchParams({ username: email, password }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      // Record ToS acceptance while authenticated
      await api.post("auth/accept-tos")
      // Record initial consent decisions. Always POST both types (even when
      // off) so we have an explicit audit trail of the user's opt-out, not
      // just "no row yet". Failure here shouldn't block signup — the user
      // can retry from the profile page.
      const consents: ConsentInput[] = [
        { type: "analytics", consented: analyticsConsent },
        { type: "session_replay", consented: sessionReplayConsent },
      ]
      try {
        await submitConsents(consents)
      } catch {
        // Swallow — user is signed up; they'll be prompted again on profile.
      }
      window.location.href = "/profile"
    } catch (error) {
      const message = await getErrorMessage(error, "Registration failed")
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Sign up for criticalbit.gg</CardDescription>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={tosAccepted}
                onCheckedChange={(checked) => setTosAccepted(checked === true)}
                disabled={isSubmitting}
                className="mt-0.5 shrink-0"
              />
              <span className="text-muted-foreground text-xs leading-relaxed">
                I agree to the{" "}
                <a
                  href="https://criticalbit.gg/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="https://criticalbit.gg/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
            <div className="grid gap-3 border-t pt-4">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Help us improve (optional)
              </p>
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={analyticsConsent}
                  onCheckedChange={(checked) =>
                    setAnalyticsConsent(checked === true)
                  }
                  disabled={isSubmitting}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-muted-foreground text-xs leading-relaxed">
                  Help us understand how the site is used. Enables analytics
                  cookies so we can see which features people use across
                  sessions.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={sessionReplayConsent}
                  onCheckedChange={(checked) =>
                    setSessionReplayConsent(checked === true)
                  }
                  disabled={isSubmitting}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-muted-foreground text-xs leading-relaxed">
                  Allow session recording for debugging. Lets us replay your
                  session when something breaks to help fix it faster.
                </span>
              </label>
              <p className="text-muted-foreground text-xs">
                You can change these anytime from your profile.{" "}
                <a
                  href="https://criticalbit.gg/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Learn more
                </a>
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !tosAccepted}
            >
              Create account
              {isSubmitting && <LoaderCircle className="animate-spin" />}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
