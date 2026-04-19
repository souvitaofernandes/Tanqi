"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

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
  const endIso = now.toISOString().slice(0, 10)
  if (period === "all") {
    return { startIso: null, endIso, prevStartIso: null, prevEndIso: null, days: null }
  }
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 365
  const start = new Date(now)
  start.setDate(start.getDate() - days)
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - days + 1)
  return {
    startIso: start.toISOString().slice(0, 10),
    endIso,
    prevStartIso: prevStart.toISOString().slice(0, 10),
    prevEndIso: prevEnd.toISOString().slice(0, 10),
    days,
  }
}
