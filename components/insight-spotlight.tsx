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

const TONE_FG: Record<Insight["kind"], string> = {
  positive: "text-success",
  negative: "text-destructive",
  warning: "text-warning",
  tip: "text-primary",
  neutral: "text-foreground",
}

const TONE_BG: Record<Insight["kind"], string> = {
  positive: "bg-success/12 ring-success/20",
  negative: "bg-destructive/12 ring-destructive/20",
  warning: "bg-warning/15 ring-warning/25",
  tip: "bg-primary/12 ring-primary/25",
  neutral: "bg-muted ring-border",
}

function HeroInsight({ insight }: { insight: Insight }) {
  const Icon = ICONS[insight.icon]
  return (
    <article className="relative flex items-start gap-4 overflow-hidden rounded-3xl border border-border bg-card p-5 md:p-6">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 size-56 rounded-full blur-3xl opacity-60",
          insight.kind === "positive"
            ? "bg-success/25"
            : insight.kind === "negative"
              ? "bg-destructive/25"
              : insight.kind === "warning"
                ? "bg-warning/30"
                : "bg-primary/25",
        )}
      />
      <div
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1",
          TONE_BG[insight.kind],
          TONE_FG[insight.kind],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="relative flex min-w-0 flex-col gap-1">
        <h3 className="text-pretty text-base font-semibold leading-snug tracking-tight md:text-lg">
          {insight.title}
        </h3>
        <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
          {insight.description}
        </p>
      </div>
    </article>
  )
}

function SecondaryInsight({ insight }: { insight: Insight }) {
  const Icon = ICONS[insight.icon]
  return (
    <article className="flex h-full min-w-[240px] snap-start items-start gap-3 rounded-2xl border border-border bg-card p-4 md:min-w-0">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-xl ring-1",
          TONE_BG[insight.kind],
          TONE_FG[insight.kind],
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h4 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight">
          {insight.title}
        </h4>
        <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {insight.description}
        </p>
      </div>
    </article>
  )
}

export function InsightSpotlight({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null
  const [hero, ...rest] = insights
  return (
    <section className="flex flex-col gap-3">
      <HeroInsight insight={hero} />
      {rest.length > 0 ? (
        <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 scrollbar-hidden md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
          {rest.map((i) => (
            <SecondaryInsight key={i.id} insight={i} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
