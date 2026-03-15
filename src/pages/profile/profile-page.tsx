import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/lib/auth"

export function ProfilePage() {
  const auth = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription>{auth.email}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1 text-sm">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs">{auth.userId}</span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => auth.logout()}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
