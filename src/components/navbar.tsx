import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth"

export function Navbar() {
  const auth = useAuth()

  return (
    <nav className="border-border/50 bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <a
          href="https://criticalbit.gg"
          className="font-pixel hover:text-primary text-lg tracking-wide transition-colors"
        >
          CriticalBit
        </a>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {auth.isAuthenticated && (
            <>
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-xs font-medium">
                  {auth.email?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <span className="text-muted-foreground hidden text-sm sm:inline">
                  {auth.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={async () => {
                  await auth.logout()
                  window.location.href = "/login"
                }}
              >
                <LogOut className="size-4" />
                <span className="sr-only">Sign out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
