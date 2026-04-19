import { Card, CardContent } from "@/components/ui/card"
import { formatBRL } from "@/lib/format"
import { cn } from "@/lib/utils"
import { AlertTriangle, Target, CheckCircle2 } from "lucide-react"

export function BudgetProgress({
  spent,
  budget,
}: {
  spent: number
  budget: number | null
}) {
  if (!budget || budget <= 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Target className="size-5" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium">Sem meta definida</span>
            <span className="text-xs text-muted-foreground">
              Configure um orçamento mensal no seu veículo para acompanhar o ritmo.
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pct = Math.min(100, Math.round((spent / budget) * 100))
  const over = spent > budget
  const warn = !over && pct >= 80

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                over ? "bg-destructive/15 text-destructive" : warn ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground",
              )}
            >
              {over ? <AlertTriangle className="size-5" /> : warn ? <Target className="size-5" /> : <CheckCircle2 className="size-5" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Meta do mês</span>
              <span className="font-mono text-lg font-semibold">
                {formatBRL(spent)} <span className="text-sm font-normal text-muted-foreground">/ {formatBRL(budget)}</span>
              </span>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-1 text-xs font-medium",
              over
                ? "bg-destructive/15 text-destructive"
                : warn
                  ? "bg-accent/15 text-accent"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {over ? `+${pct - 100}% acima` : `${pct}% usado`}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              over ? "bg-destructive" : warn ? "bg-accent" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
