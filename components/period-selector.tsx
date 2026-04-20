"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { daysAgoIsoLocal, todayIsoLocal } from "@/lib/date"

const OPTIONS = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "365d", label: "12 meses" },
  { value: "all", label: "Tudo" },
] as const

export type PeriodValue = (typeof OPTIONS)[number]["value"]

export function PeriodSelector({ value }: { value: PeriodValue }) {
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
      {OPTIONS.map((o) => {
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

export function resolvePeriod(raw: string | undefined): PeriodValue {
  if (raw === "30d" || raw === "90d" || raw === "all") return raw
  return "365d"
}

/**
 * ISO date (YYYY-MM-DD) boundaries for a period, plus the same-duration
 * previous window used for delta comparisons.
 *
 * Key rules:
 *  - All dates anchored to **São Paulo local time** (not UTC). Using
 *    `new Date().toISOString().slice(0,10)` would mis-attribute periods
 *    between 21:00 and 00:00 BRT to tomorrow, silently skewing the window.
 *  - Windows are **inclusive and exactly N days long**. The previous window
 *    always ends the day before the current window starts, no overlap.
 *
 * Example for period="30d" when today (São Paulo) is 2026-04-20:
 *    startIso     = 2026-03-22  (today − 29)
 *    endIso       = 2026-04-20
 *    prevStartIso = 2026-02-21  (today − 59)
 *    prevEndIso   = 2026-03-21  (today − 30)
 *  → 30 days current, 30 days prior, no gap, no overlap.
 */
export function getPeriodRange(period: PeriodValue, now = new Date()): {
  startIso: string | null
  endIso: string
  prevStartIso: string | null
  prevEndIso: string | null
  days: number | null
} {
  const endIso = todayIsoLocal(now)
  if (period === "all") {
    return { startIso: null, endIso, prevStartIso: null, prevEndIso: null, days: null }
  }
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 365
  // Inclusive N-day window: [today − (N-1), today].
  const startIso = daysAgoIsoLocal(days - 1, now)
  // Previous window mirrors the current one, ending the day before it starts.
  const prevEndIso = daysAgoIsoLocal(days, now)
  const prevStartIso = daysAgoIsoLocal(days * 2 - 1, now)
  return { startIso, endIso, prevStartIso, prevEndIso, days }
}
