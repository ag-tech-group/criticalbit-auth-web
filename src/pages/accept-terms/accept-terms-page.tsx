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
import { api } from "@/api/api"
import { getErrorMessage } from "@/lib/api-errors"

export function AcceptTermsPage() {
  const [accepted, setAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (!accepted) return

    setIsSubmitting(true)
    try {
      await api.post("auth/accept-tos")
      const savedRedirect = localStorage.getItem("auth_redirect")
      localStorage.removeItem("auth_redirect")
      window.location.href = savedRedirect ?? "/profile"
    } catch (error) {
      const message = await getErrorMessage(error, "Failed to accept terms")
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-pixel text-2xl tracking-wide">
            Terms of Service
          </CardTitle>
          <CardDescription>
            Please accept our terms to continue using criticalbit.gg
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="grid gap-4">
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
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !accepted}
            >
              Continue
              {isSubmitting && <LoaderCircle className="animate-spin" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
