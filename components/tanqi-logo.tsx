import { cn } from "@/lib/utils"

/**
 * Tanqi brand system
 *
 * Two building blocks the whole product composes against:
 *   - <TanqiGlyph />  — the raw monogram, renders in `currentColor`.
 *   - <TanqiMark />   — the glyph inside a rounded primary-colored container
 *                       (the reusable "app icon" recipe: sidebar, login, landing
 *                       header, auth screens, PWA install prompt, etc.).
 *   - <TanqiWordmark /> — mark + "tanqi" typographic wordmark, row-oriented.
 *
 * Brand decisions encoded here:
 *   - The glyph is intentionally abstract. It reads as a lowercase "t" (for
 *     tanqi / tanque) with a floating dot that doubles as the dot of the "i"
 *     and, more importantly, as a data point / status indicator. This keeps
 *     the mark broad enough to live on a product that handles fuel, but also
 *     maintenance, documents, insurance, and future car-ownership surfaces —
 *     nothing in the symbol commits the brand to fuel specifically.
 *   - NO fuel pump, NO droplet, NO speedometer, NO wrench, NO tire, NO race
 *     flag. The brief explicitly rejected those clichés.
 *   - Scales cleanly: the glyph's internal margins and stroke weights were
 *     tuned to work at 16px (favicon), 32px (navbar), 48px (auth cards),
 *     72px (landing hero), and 512px (PWA maskable) without adjustment.
 */

type GlyphProps = {
  className?: string
  size?: number
  "aria-hidden"?: boolean
}

export function TanqiGlyph({ className, size, ...rest }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      role="img"
      aria-label={rest["aria-hidden"] ? undefined : "Tanqi"}
      aria-hidden={rest["aria-hidden"]}
    >
      {/* Vertical stem of the lowercase "t" */}
      <rect x="9" y="6" width="3" height="14" rx="1.5" />
      {/* Crossbar of the lowercase "t" */}
      <rect x="4.5" y="9.5" width="11" height="3" rx="1.5" />
      {/* Floating dot — the distinctive element. Reads as the tittle of the
          "i" in tanqi AND as a data point / status indicator. It is what makes
          the mark ownable and signals "technical intelligence" without being
          literal. */}
      <circle cx="18" cy="6" r="2" />
    </svg>
  )
}

type MarkProps = {
  className?: string
  /** Tailwind size-* class for the container. Defaults to size-8 (32px). */
  sizeClass?: string
  /** If true, the mark uses the subtler "surface" container instead of the
   *  full primary fill. Useful on elevated hero surfaces where a saturated
   *  block would overpower the composition. */
  subtle?: boolean
}

export function TanqiMark({ className, sizeClass = "size-8", subtle = false }: MarkProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl shadow-xs",
        subtle
          ? "bg-card-elevated text-primary ring-1 ring-primary/25"
          : "bg-primary text-primary-foreground ring-1 ring-primary/40",
        sizeClass,
        className,
      )}
    >
      {/* Glyph scales to ~58% of the container — tuned to the visual weight of
          a lucide icon inside the same-sized slot, so the mark drops into
          existing layouts (sidebar, auth hero, landing header) without
          introducing optical drift. On the Tanqi dark theme this renders as
          a dark graphite glyph on the Electric Cyan primary fill. */}
      <TanqiGlyph className="size-[58%]" aria-hidden />
      <span className="sr-only">Tanqi</span>
    </div>
  )
}

type WordmarkProps = {
  className?: string
  /** Controls the size of both the mark and the text. */
  size?: "sm" | "md" | "lg"
  /** Hides the mark, rendering text-only. Used when the mark is already
   *  present elsewhere on the same row (e.g. the existing auth screen hero). */
  textOnly?: boolean
}

const SIZE_MAP = {
  sm: { mark: "size-7", text: "text-[14px]" },
  md: { mark: "size-8", text: "text-[15px]" },
  lg: { mark: "size-9", text: "text-base" },
} as const

export function TanqiWordmark({ className, size = "md", textOnly = false }: WordmarkProps) {
  const s = SIZE_MAP[size]
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {!textOnly && <TanqiMark sizeClass={s.mark} />}
      <span
        className={cn(
          "font-semibold tracking-[-0.02em] lowercase",
          // The wordmark uses tight negative tracking and the brand sans —
          // Plus Jakarta Sans at semibold gives a clean geometric feel that
          // pairs with the monogram without introducing a second display face.
          s.text,
        )}
      >
        tanqi
      </span>
    </span>
  )
}
