import { RingBurstIcon } from "@/components/ring-burst-icon"
import { Wordmark } from "@/components/wordmark"
import { cn } from "@/lib/utils"

type BrandLockupProps = {
  className?: string
}

/**
 * Ring burst + wordmark, sized for the navbar. Shared by the navbar and the
 * loading skeleton so the two can never drift out of sync.
 */
export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <RingBurstIcon className="text-primary size-7 shrink-0" />
      <Wordmark className="text-lg" showTld={false} />
    </span>
  )
}
