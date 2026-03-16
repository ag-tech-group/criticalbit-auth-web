import { ExternalLink, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserAvatar } from "@/components/user-avatar"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:bg-accent/10 flex items-center gap-2 rounded-md px-2 py-1 transition-colors">
                  <UserAvatar size="sm" />
                  <span className="text-muted-foreground hidden text-sm sm:inline">
                    {auth.displayName ?? auth.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <a href="https://auth.criticalbit.gg/profile">
                    <ExternalLink className="size-4" />
                    Profile
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await auth.logout()
                    window.location.href = "/login"
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  )
}
