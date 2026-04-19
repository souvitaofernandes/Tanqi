import { cn } from "@/lib/utils"
import type { Insight } from "@/lib/insights"
import { TrendingDown, TrendingUp, Target, Sparkles, Flame, Clock, Tag, Gauge } from "lucide-react"

const ICONS: Record<Insight["icon"], React.ComponentType<{ className?: string }>> = {
  "trend-up": TrendingUp,
  "trend-down": TrendingDown,
  target: Target,
  sparkles: Sparkles,
  flame: Flame,
  clock: Clock,
  "price-tag": Tag,
  gauge: Gauge,
}

const KIND_STYLES: Record<Insight["kind"], string> = {
  positive: "bg-success/12 text-success ring-success/20",
  negative: "bg-destructive/12 text-destructive ring-destructive/20",
  warning: "bg-warning/15 text-warning ring-warning/25",
  tip: "bg-primary/12 text-primary ring-primary/25",
  neutral: "bg-muted text-muted-foreground ring-border",
}

export function InsightCard({ insight, className }: { insight: Insight; className?: string }) {
  const Icon = ICONS[insight.icon]
  const tone = KIND_STYLES[insight.kind]
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-border/70",
        className,
      )}
    >
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset", tone)}>
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-pretty text-sm font-semibold leading-snug tracking-tight">{insight.title}</h3>
        <p className="text-pretty text-xs leading-relaxed text-muted-foreground">{insight.description}</p>
      </div>
    </div>
  )
}

export function InsightStack({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((i) => (
        <InsightCard key={i.id} insight={i} />
      ))}
    </div>
  )
}
