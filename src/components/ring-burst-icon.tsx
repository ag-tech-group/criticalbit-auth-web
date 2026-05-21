type RingBurstIconProps = {
  className?: string
}

// 11×11 pixel grid — the "ring burst" mark from docs/criticalbit-logo-r3.html.
// 1 = filled cell; eight rays radiate from a hollow core.
const RING_GRID = [
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
] as const

// Each cell sits in a CELL-wide slot; GAP keeps a crisp pixel seam between them.
const CELL = 4
const GAP = 1
const SPAN = RING_GRID.length * CELL - GAP // 11 × 4 − 1 = 43

const RING_CELLS = RING_GRID.flatMap((row, r) =>
  row.flatMap((filled, c) => (filled ? [{ x: c * CELL, y: r * CELL }] : []))
)

/**
 * The criticalbit ring burst. Renders as `currentColor`, so set the colour with
 * a `text-*` utility and the size with `size-*` (or any width/height class).
 */
export function RingBurstIcon({ className }: RingBurstIconProps) {
  return (
    <svg
      viewBox={`0 0 ${SPAN} ${SPAN}`}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {RING_CELLS.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={CELL - GAP}
          height={CELL - GAP}
        />
      ))}
    </svg>
  )
}
