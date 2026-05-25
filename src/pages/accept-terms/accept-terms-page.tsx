import { useState } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/api/api"
import { getErrorMessage } from "@/lib/api-errors"
import { useAuth } from "@/lib/auth"

type AcceptTosErrorCode = "email_required" | "email_already_registered"

interface AcceptTosErrorDetail {
  code: AcceptTosErrorCode
  message: string
}

async function parseAcceptTosError(
  error: unknown
): Promise<AcceptTosErrorDetail | null> {
  const response = (error as { response?: Response })?.response
  if (!response || response.status !== 422) return null
  try {
    const body = (await response.clone().json()) as {
      detail?: { code?: unknown; message?: unknown }
    }
    const detail = body?.detail
    if (
      detail &&
      typeof detail === "object" &&
      typeof detail.code === "string" &&
      typeof detail.message === "string"
    ) {
      return {
        code: detail.code as AcceptTosErrorCode,
        message: detail.message,
      }
    }
  } catch {
    // fall through to null — caller surfaces a generic toast
  }
  return null
}

export function AcceptTermsPage() {
  const auth = useAuth()
  const needsEmail = !auth.email
  const isBackfill = needsEmail && auth.tosAcceptedAt !== null

  const [email, setEmail] = useState("")
  const [accepted, setAccepted] = useState(isBackfill)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<AcceptTosErrorDetail | null>(
    null
  )

  const trimmedEmail = email.trim()
  const submitDisabled =
    isSubmitting || !accepted || (needsEmail && trimmedEmail.length === 0)

  async function handleSignInInstead() {
    try {
      await auth.logout()
    } finally {
      window.location.href = "/login"
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (submitDisabled) return

    setIsSubmitting(true)
    setEmailError(null)
    try {
      const json = needsEmail
        ? { email: trimmedEmail.toLowerCase() }
        : undefined
      await api.post("auth/accept-tos", json ? { json } : undefined)
      const savedRedirect = localStorage.getItem("auth_redirect")
      localStorage.removeItem("auth_redirect")
      window.location.href = savedRedirect ?? "/profile"
    } catch (error) {
      const detail = await parseAcceptTosError(error)
      if (detail) {
        setEmailError(detail)
      } else {
        const message = await getErrorMessage(error, "Failed to accept terms")
        toast.error(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = isBackfill ? "One more thing" : "Terms of Service"
  const description = isBackfill
    ? "We need a real email for your account before you can continue."
    : "Please accept our terms to continue using criticalbit.gg"

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-pixel text-2xl tracking-wide">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="grid gap-4">
            {needsEmail && (
              <div className="grid gap-2">
                <Label htmlFor="steam-email">Email</Label>
                <Input
                  id="steam-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError(null)
                  }}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  aria-invalid={emailError !== null || undefined}
                  aria-describedby="steam-email-helper"
                />
                <p
                  id="steam-email-helper"
                  className="text-muted-foreground text-xs leading-relaxed"
                >
                  Steam doesn&apos;t share your email with us, so we need one to
                  send notifications and let you recover your account.
                </p>
                {emailError && (
                  <div className="text-destructive grid gap-2 text-xs">
                    <p>{emailError.message}</p>
                    {emailError.code === "email_already_registered" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSignInInstead}
                      >
                        Sign in with that account instead
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            {!isBackfill && (
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked === true)}
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
            )}
            <Button type="submit" className="w-full" disabled={submitDisabled}>
              Continue
              {isSubmitting && <LoaderCircle className="animate-spin" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
