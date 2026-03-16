export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-border/50 border-t px-4 py-3">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <p>&copy; {year} AG Technology Group LLC. All rights reserved.</p>
        <div className="flex gap-4">
          <a
            href="https://criticalbit.gg"
            className="hover:text-foreground transition-colors"
          >
            criticalbit.gg
          </a>
          <a
            href="https://criticalbit.gg/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </a>
          <a
            href="https://criticalbit.gg/terms"
            className="hover:text-foreground transition-colors"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}
