import { useState } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/user-avatar"
import { api } from "@/api/api"
import { getErrorMessage } from "@/lib/api-errors"
import { useAuth } from "@/lib/auth"

export function ProfilePage() {
  const auth = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (confirmEmail !== auth.email) return

    setIsDeleting(true)
    try {
      await api.delete("auth/me")
      toast.success("Account deleted.")
      window.location.href = "/login"
    } catch (error) {
      const message = await getErrorMessage(error, "Failed to delete account")
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            <UserAvatar size="lg" />
          </div>
          <CardTitle className="font-pixel text-2xl tracking-wide">
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{auth.email}</span>
          </div>

          <div className="border-destructive/30 bg-destructive/5 rounded-md border p-4">
            <h3 className="text-destructive-foreground mb-1 text-sm font-semibold">
              Danger zone
            </h3>
            {showConfirm ? (
              <form onSubmit={handleDelete} className="mt-3 grid gap-3">
                <p className="text-muted-foreground text-xs">
                  This permanently deletes your account and all data. This
                  cannot be undone. Type your email to confirm.
                </p>
                <div className="grid gap-1">
                  <Label htmlFor="confirm-email" className="text-xs">
                    Type <strong>{auth.email}</strong> to confirm
                  </Label>
                  <Input
                    id="confirm-email"
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder={auth.email ?? ""}
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowConfirm(false)
                      setConfirmEmail("")
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting || confirmEmail !== auth.email}
                  >
                    Delete account
                    {isDeleting && <LoaderCircle className="animate-spin" />}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-muted-foreground mb-3 text-xs">
                  Permanently delete your account and all associated data.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowConfirm(true)}
                >
                  Delete account
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
