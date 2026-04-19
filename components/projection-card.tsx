import type { Projection } from "@/lib/analytics"
import { formatBRL } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Target, TrendingUp } from "lucide-react"

/**
 * Compact month-end projection card. Uses daily pace × days in month.
 * Skipped automatically when there aren't enough data points to trust the
 * projection (see Projection.confident).
 */
export function ProjectionCard({ projection }: { projection: Projection }) {
  if (!projection.confident) return null
  const { spent, projected, daysElapsed, daysInMonth, monthlyBudget, usagePct } = projection
  const remainingDays = Math.max(0, daysInMonth - daysElapsed)
  const overBudget = usagePct !== null && usagePct > 1
  const hasBudget = monthlyBudget !== null && monthlyBudget > 0
  const progressWidth = hasBudget && monthlyBudget ? Math.min(100, (projected / monthlyBudget) * 100) : null

  return (
    <section
      aria-label="Projeção do mês"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
              overBudget
                ? "bg-destructive/10 text-destructive ring-destructive/20"
                : "bg-primary/10 text-primary ring-primary/20",
            )}
          >
            {hasBudget ? <Target className="size-5" /> : <TrendingUp className="size-5" />}
          </div>
          <div className="flex flex-col gap-1">
            <span className="label-section">Projeção para este mês</span>
            <h3 className="num-display text-3xl font-semibold md:text-4xl">{formatBRL(projected)}</h3>
            <p className="text-xs text-muted-foreground">
              {formatBRL(spent)} já pagos em {daysElapsed} {daysElapsed === 1 ? "dia" : "dias"} ·{" "}
              {remainingDays} {remainingDays === 1 ? "dia restante" : "dias restantes"}
            </p>
          </div>
        </div>

        {hasBudget && monthlyBudget ? (
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="label-section">Meta mensal</span>
            <span className="num-inline text-sm font-medium">{formatBRL(monthlyBudget)}</span>
            <span className={cn("text-xs font-medium", overBudget ? "text-destructive" : "text-success")}>
              {overBudget
                ? `+${formatBRL(projected - monthlyBudget)} acima`
                : `${formatBRL(monthlyBudget - projected)} de folga`}
            </span>
          </div>
        ) : null}
      </div>

      {hasBudget && progressWidth !== null ? (
        <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", overBudget ? "bg-destructive" : "bg-primary")}
            style={{ width: `${progressWidth}%` }}
            aria-hidden
          />
        </div>
      ) : null}
    </section>
  )
}
