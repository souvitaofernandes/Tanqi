/**
 * Timezone-safe helpers for "today" in Brazilian time.
 *
 * The app is Brazil-first, so all month/day-level reasoning (current-month
 * spend, month projection, "best month", etc.) must anchor to São Paulo local
 * time. Using `new Date().toISOString().slice(0, 10)` in a UTC-hosted server
 * bucket would silently mis-attribute entries for ~3 hours every night and
 * shift the whole month at midnight BRT.
 *
 * These helpers produce stable YYYY-MM-DD strings regardless of the server's
 * clock, and accept a `now` parameter so they stay testable.
 */

const TZ = "America/Sao_Paulo"

/** Today's calendar date in São Paulo, as `YYYY-MM-DD`. */
export function todayIsoLocal(now: Date = new Date()): string {
  // `en-CA` formats as YYYY-MM-DD, safe to slice without locale surprises.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now)
}

/** Current month in São Paulo, as `YYYY-MM`. */
export function currentMonthKeyLocal(now: Date = new Date()): string {
  return todayIsoLocal(now).slice(0, 7)
}

/** Day of month (1–31) in São Paulo. */
export function dayOfMonthLocal(now: Date = new Date()): number {
  return Number(todayIsoLocal(now).slice(8, 10))
}

/** Number of days in the São Paulo calendar month containing `now`. */
export function daysInCurrentMonthLocal(now: Date = new Date()): number {
  const iso = todayIsoLocal(now) // YYYY-MM-DD
  const [y, m] = iso.split("-").map(Number)
  // `new Date(year, monthIndex, 0)` with monthIndex = 1-based month returns
  // the last day of that month (e.g. (2025, 10, 0) → Oct 31).
  return new Date(y, m, 0).getDate()
}

/** Hour (0–23) in São Paulo — useful for time-of-day greetings. */
export function hourLocal(now: Date = new Date()): number {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    hour12: false,
  }).format(now)
  // en-GB with hour12=false can produce "24" at midnight on some ICU builds — normalize.
  const n = Number(h)
  return Number.isFinite(n) ? n % 24 : 0
}

/** ISO date for (todayLocal − days). Used for rolling windows like "last 90 days". */
export function daysAgoIsoLocal(days: number, now: Date = new Date()): string {
  const [y, m, d] = todayIsoLocal(now).split("-").map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  base.setUTCDate(base.getUTCDate() - days)
  const yy = base.getUTCFullYear()
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(base.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}
