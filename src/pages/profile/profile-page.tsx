import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/api/api"
import { getErrorMessage } from "@/lib/api-errors"
import { useAuth } from "@/lib/auth"

export function ProfilePage() {
  const auth = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
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
      setShowConfirm(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-2 flex size-16 items-center justify-center rounded-full text-2xl font-medium">
            {auth.email?.charAt(0).toUpperCase() ?? "?"}
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

          <div className="border-border/50 border-t pt-4">
            {showConfirm ? (
              <div className="grid gap-2">
                <p className="text-destructive-foreground text-sm">
                  Are you sure? This permanently deletes your account and all
                  data. This cannot be undone.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive-foreground w-full"
                onClick={() => setShowConfirm(true)}
              >
                Delete account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
