"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { cn } from "@/lib/utils"
import { PERIOD_OPTIONS, type PeriodValue } from "@/lib/period"

// Re-export the type for any legacy callers that still import it from here.
// Pure functions (`resolvePeriod`, `getPeriodRange`) were moved to `@/lib/period`
// so Server Components can import them — this file keeps ONLY the interactive
// React component, which is the only reason this module is marked client.
export type { PeriodValue }

export function PeriodSelector({ value }: { value: PeriodValue }) {
  return (
    <Suspense fallback={<PeriodSelectorFallback value={value} />}>
      <PeriodSelectorImpl value={value} />
    </Suspense>
  )
}

function PeriodSelectorFallback({ value }: { value: PeriodValue }) {
  return (
    <div
      role="tablist"
      aria-label="Período"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-1 text-xs"
    >
      {PERIOD_OPTIONS.map((o) => {
        const active = o.value === value
        return (
          <span
            key={o.value}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium",
              active ? "bg-background text-foreground shadow-xs" : "text-muted-foreground",
            )}
          >
            {o.label}
          </span>
        )
      })}
    </div>
  )
}

function PeriodSelectorImpl({ value }: { value: PeriodValue }) {
  const pathname = usePathname()
  const params = useSearchParams()

  function hrefFor(next: PeriodValue) {
    const sp = new URLSearchParams(params.toString())
    // Default is "365d", so we drop the param in that case for prettier URLs.
    // Every other value (including "all") is persisted so shared links always
    // reproduce what the sender is looking at.
    if (next === "365d") sp.delete("period")
    else sp.set("period", next)
    const qs = sp.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div
      role="tablist"
      aria-label="Período"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-1 text-xs"
    >
      {PERIOD_OPTIONS.map((o) => {
        const active = o.value === value
        return (
          <Link
            key={o.value}
            role="tab"
            aria-selected={active}
            href={hrefFor(o.value)}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </Link>
        )
      })}
    </div>
  )
}
