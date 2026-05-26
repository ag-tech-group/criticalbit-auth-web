import { useEffect, useRef, useState } from "react"
import { Link, useSearch } from "@tanstack/react-router"
import { LoaderCircle } from "lucide-react"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/api/api"

type Status = "pending" | "success" | "invalid" | "error"

async function readDetail(error: unknown): Promise<string | null> {
  const response = (error as { response?: Response })?.response
  if (!response) return null
  try {
    const body = await response.clone().json()
    return typeof body?.detail === "string" ? body.detail : null
  } catch {
    return null
  }
}

export function VerifyEmailPage() {
  const search = useSearch({ from: "/verify-email" })
  const token = (search as { token?: string }).token

  const [status, setStatus] = useState<Status>(token ? "pending" : "invalid")
  const calledRef = useRef(false)

  useEffect(() => {
    if (!token || calledRef.current) return
    calledRef.current = true

    api
      .post("auth/verify", { json: { token } })
      .then(() => setStatus("success"))
      .catch(async (error) => {
        const detail = await readDetail(error)
        // Treat already-verified as success — the user's intent (verified
        // email) is satisfied, even if the token had already been spent.
        if (detail === "VERIFY_USER_ALREADY_VERIFIED") {
          setStatus("success")
          return
        }
        setStatus(detail === "VERIFY_USER_BAD_TOKEN" ? "invalid" : "error")
      })
  }, [token])

  if (status === "pending") {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verifying email</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <LoaderCircle className="animate-spin" />
              <span>Just a moment…</span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Email verified</CardTitle>
            <CardDescription>
              Your email is verified. You can now sign in.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-primary text-sm underline">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Invalid link</CardTitle>
            <CardDescription>
              This verification link is invalid or has expired. Sign in and
              request a new one from your profile.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-primary text-sm underline">
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verification failed</CardTitle>
          <CardDescription>
            Something went wrong verifying your email. Please try again.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link to="/login" className="text-primary text-sm underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
