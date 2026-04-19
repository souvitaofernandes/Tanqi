import { cn } from "@/lib/utils"
import { FUEL_LABEL, type FuelType } from "@/lib/types"

/**
 * Semantic per-fuel styling. Each fuel gets its own hue derived from chart tokens:
 *  - gasolina  → chart-1 (Electric Cyan — brand accent)
 *  - etanol    → chart-2 (green)
 *  - gnv       → chart-3 (teal-blue)
 *  - diesel    → chart-4 (slate)
 *
 * Gasolina intentionally shares the brand color: it's the most common fuel in
 * the history of almost every Brazilian driver, and tying it to the primary
 * accent keeps the charts visually anchored to Tanqi's identity without
 * forcing a second "hero" hue. The translucent pill background (14% opacity)
 * prevents the gasolina pill from reading as a primary-action CTA.
 */
const FUEL_TOKEN: Record<FuelType, string> = {
  gasolina: "--chart-1",
  etanol: "--chart-2",
  gnv: "--chart-3",
  diesel: "--chart-4",
}

export function fuelColor(fuel: FuelType) {
  return `var(${FUEL_TOKEN[fuel]})`
}

export function FuelBadge({
  type,
  size = "sm",
  className,
}: {
  type: FuelType
  size?: "sm" | "md"
  className?: string
}) {
  const token = FUEL_TOKEN[type]
  const sizeCls =
    size === "md"
      ? "gap-1.5 px-2.5 py-1 text-xs"
      : "gap-1 px-2 py-0.5 text-[11px]"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeCls,
        className,
      )}
      style={{
        color: `var(${token})`,
        backgroundColor: `color-mix(in oklab, var(${token}) 14%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ backgroundColor: `var(${token})` }}
      />
      {FUEL_LABEL[type]}
    </span>
  )
}
