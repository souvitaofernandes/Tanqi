/**
 * Server-safe period utilities.
 *
 * These live OUTSIDE of `components/period-selector.tsx` because that file is
 * a client component (`"use client"`). When a client module exports helper
 * functions, Next 16 marks every export as client-only — calling them from
 * a server component throws:
 *   "Attempted to call resolvePeriod() from the server but resolvePeriod is
 *    on the client."
 *
 * The reports page is a Server Component, so it must import these from a
 * module that has no `"use client"` directive. The `PeriodSelector` React
 * component re-exports the type from here to keep the public import surface
 * intuitive.
 */

import { daysAgoIsoLocal, todayIsoLocal } from "@/lib/date"

/** Canonical list of period options shown in the UI. */
export const PERIOD_OPTIONS = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "365d", label: "12 meses" },
  { value: "all", label: "Tudo" },
] as const

export type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"]

/** Parse a raw search-param value, defaulting to "365d" on anything unknown. */
export function resolvePeriod(raw: string | undefined): PeriodValue {
  if (raw === "30d" || raw === "90d" || raw === "all") return raw
  return "365d"
}

/**
 * ISO date (YYYY-MM-DD) boundaries for a period, plus the same-duration
 * previous window used for delta comparisons.
 *
 * Key rules:
 *  - All dates anchored to São Paulo local time (not UTC). Using
 *    `new Date().toISOString().slice(0,10)` would mis-attribute periods
 *    between 21:00 and 00:00 BRT to tomorrow, silently skewing the window.
 *  - Windows are inclusive and exactly N days long. The previous window
 *    always ends the day before the current window starts — no overlap.
 *
 * Example for period="30d" when today (São Paulo) is 2026-04-20:
 *    startIso     = 2026-03-22  (today − 29)
 *    endIso       = 2026-04-20
 *    prevStartIso = 2026-02-21  (today − 59)
 *    prevEndIso   = 2026-03-21  (today − 30)
 *  → 30 days current, 30 days prior, no gap, no overlap.
 */
export function getPeriodRange(period: PeriodValue, now: Date = new Date()): {
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
  const startIso = daysAgoIsoLocal(days - 1, now)
  const prevEndIso = daysAgoIsoLocal(days, now)
  const prevStartIso = daysAgoIsoLocal(days * 2 - 1, now)
  return { startIso, endIso, prevStartIso, prevEndIso, days }
}
