"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { cn } from "@/lib/utils"
import { todayIsoLocal, daysAgoIsoLocal } from "@/lib/date"

const OPTIONS = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "365d", label: "12 meses" },
  { value: "all", label: "Tudo" },
] as const

export type PeriodValue = (typeof OPTIONS)[number]["value"]

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
      {OPTIONS.map((o) => {
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
 * Returns ISO date (YYYY-MM-DD) boundaries for a period, and the same-duration previous window.
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
  // All offsets derived from São Paulo calendar date, not UTC clock.
  // prevEnd = day before window start; prevStart = same-length window before that.
  return {
    startIso: daysAgoIsoLocal(days, now),
    endIso,
    prevStartIso: daysAgoIsoLocal(2 * days, now),
    prevEndIso: daysAgoIsoLocal(days + 1, now),
    days,
  }
}
