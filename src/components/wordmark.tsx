import { cn } from "@/lib/utils"

type WordmarkProps = {
  className?: string
  /** Render the trailing ".gg". Turn off for compact placements like the navbar. */
  showTld?: boolean
}

/**
 * The split wordmark: "critical" in Geist Sans, "BIT" in Geist Pixel Grid, and a
 * trailing ".gg". Every part is sized in `em`, so the whole lockup scales with
 * the inherited font size — set a `text-*` utility on the parent or via
 * `className` to resize it.
 */
export function Wordmark({ className, showTld = true }: WordmarkProps) {
  return (
    <span className={cn("inline-flex items-baseline font-sans", className)}>
      <span className="text-foreground font-normal tracking-[-0.01em]">
        critical
      </span>
      <span className="font-pixel text-primary pl-[0.14em] text-[0.85em] tracking-[0.05em]">
        BIT
      </span>
      {showTld && (
        <span className="text-muted-foreground text-[0.4em]">.gg</span>
      )}
    </span>
  )
}
