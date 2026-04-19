import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export function MetricCard({
  label,
  value,
  sub,
  hint,
  icon: Icon,
  accent = false,
  tone,
  size = "md",
  muted = false,
  className,
}: {
  label: string
  value: string
  /** legacy alias for `hint` */
  sub?: string
  hint?: string
  icon?: LucideIcon
  /** highlight card with primary tint (for the single most important metric) */
  accent?: boolean
  tone?: "success" | "warning" | "danger"
  /** md = default grid card; lg = hero card */
  size?: "sm" | "md" | "lg"
  /** renders the value dimmed (e.g. when data is not yet available) */
  muted?: boolean
  className?: string
}) {
  const toneCls = muted
    ? "text-muted-foreground"
    : tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-destructive"
          : "text-foreground"

  const numCls =
    size === "lg"
      ? "text-4xl md:text-5xl leading-[1]"
      : size === "sm"
        ? "text-xl md:text-2xl"
        : "text-[1.75rem] md:text-3xl leading-[1.05]"

  const padCls = size === "lg" ? "p-5 md:p-7" : "p-4 md:p-5"

  const subtitle = hint ?? sub

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card shadow-xs transition-colors",
        accent && "surface-elevated border-primary/25",
        padCls,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="label-section">{label}</span>
        {Icon ? (
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full",
              accent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </span>
        ) : null}
      </div>
      <div className={cn("num-display font-medium", numCls, toneCls)}>{value}</div>
      {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
    </div>
  )
}
