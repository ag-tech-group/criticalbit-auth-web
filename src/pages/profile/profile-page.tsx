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
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-2 flex size-16 items-center justify-center rounded-full text-2xl font-medium">
            {auth.email?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <CardTitle className="font-pixel text-2xl tracking-wide">
            Profile
          </CardTitle>
          <CardDescription>{auth.email}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{auth.email}</span>
          </div>
          <div className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="text-accent font-medium">User</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
