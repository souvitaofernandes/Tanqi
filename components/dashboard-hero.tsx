import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/format"
import type { Vehicle } from "@/lib/types"
import { ArrowDownRight, ArrowUpRight, Target } from "lucide-react"
import { CountUp } from "./count-up"

type Projection = {
  spent: number
  projected: number
  daysElapsed: number
  daysInMonth: number
  dailyPace: number
}

/**
 * Hero do dashboard — o número mais importante agora.
 * Gasto deste mês, tendência vs média anterior, projeção e meta.
 */
export function DashboardHero({
  vehicle,
  projection,
  momSpend,
}: {
  vehicle: Vehicle | null
  projection: Projection
  momSpend: number | null
}) {
  const budget = vehicle?.monthly_budget ?? null
  const usedPct = budget && budget > 0 ? Math.min(1.25, projection.spent / budget) : 0
  const projectedPct = budget && budget > 0 ? Math.min(1.25, projection.projected / budget) : 0
  const over = !!(budget && projection.projected > budget)
  const warn = !!(budget && projection.spent / budget >= 0.8 && !over)

  // Label discloses the base of the comparison. "vs média" on its own is
  // ambiguous — users can't tell if it's the 3-month, 6-month or all-time
  // average. "vs meses anteriores" is the literal contract of `momSpend` as
  // computed by buildInsights (mean of completed prior months).
  const momLabel =
    momSpend === null
      ? null
      : `${momSpend >= 0 ? "+" : "−"}${Math.abs(momSpend * 100).toFixed(0)}% vs meses anteriores`

  const momPositive = momSpend !== null && momSpend < 0 // spent less = positive

  return (
    <section className="surface-elevated card-enter relative overflow-hidden rounded-3xl border border-border p-6 md:p-8">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-24 -top-24 size-72 rounded-full blur-3xl",
          over
            ? "bg-destructive/20 opacity-80"
            : warn
              ? "bg-warning/22 opacity-80"
              : "bg-primary/20 opacity-70",
        )}
      />
      <div className="relative flex flex-col gap-5">
        {/* Label line */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Gasto este mês</span>
          {momLabel ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                momPositive
                  ? "bg-success/12 text-success"
                  : "bg-destructive/12 text-destructive",
              )}
            >
              {momPositive ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
              {momLabel}
            </span>
          ) : null}
        </div>

        {/* The number — animated via <CountUp /> so that entering the
            dashboard feels like a metric loading in, and subsequent updates
            (e.g. after adding a new refuel) tween smoothly instead of
            snapping. Under prefers-reduced-motion the value applies
            instantly via CountUp's internal guard. */}
        <div className="flex items-end gap-3">
          {/* CountUp takes a declarative `variant="brl"` (not a formatter
              function). DashboardHero is a Server Component — passing a
              function across the RSC boundary would crash the route render
              at runtime with a generic "An error occurred in the Server
              Components render" error in production. Keeping every prop
              serializable is what made the dashboard start working again. */}
          {/* Fluid type from 36 px (small phones) to 72 px (tablet+) via
              `clamp()`. With the old step ladder `text-[44px] sm:text-6xl
              md:text-[72px]`, large net totals like "R$ 123.456,78" could
              overflow a 320 px viewport; the clamp scales continuously so
              the headline KPI never clips. */}
          <CountUp
            value={projection.spent}
            variant="brl"
            className="num-display text-[clamp(2.25rem,11vw,4.5rem)] font-semibold leading-none md:text-[72px]"
          />
        </div>

        {/* Contextual line (always rendered, adapts to budget / no budget) */}
        {budget ? (
          <div className="flex flex-col gap-2.5">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-[width]",
                  over ? "bg-destructive" : warn ? "bg-warning" : "bg-primary",
                )}
                style={{ width: `${Math.min(100, usedPct * 100)}%` }}
              />
              {projectedPct > usedPct && (
                <div
                  className="absolute inset-y-0 rounded-full border-y border-r border-dashed border-foreground/25"
                  style={{
                    left: `${Math.min(100, usedPct * 100)}%`,
                    width: `${Math.min(100, (projectedPct - usedPct) * 100)}%`,
                  }}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="size-3.5" />
                <span>
                  Meta{" "}
                  <span className="num-inline font-medium text-foreground">{formatBRL(budget)}</span>
                </span>
              </div>
              <span className="text-muted-foreground">
                Projeção{" "}
                <span
                  className={cn(
                    "num-inline font-semibold",
                    over ? "text-destructive" : warn ? "text-warning" : "text-foreground",
                  )}
                >
                  {formatBRL(projection.projected)}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-muted-foreground">
              Projeção para o mês{" "}
              <span className="num-inline font-semibold text-foreground">{formatBRL(projection.projected)}</span>
              <span className="mx-1.5 text-foreground/20">·</span>
              ritmo{" "}
              <span className="num-inline font-medium text-foreground">{formatBRL(projection.dailyPace)}</span>
              /dia
            </p>
            <Link
              href="/vehicles"
              className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-background/60 px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              <Target className="size-3.5" />
              Definir meta mensal
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
