import { cn } from "@/lib/utils"

type Stat = {
  label: string
  value: string
  hint?: string
  muted?: boolean
}

/**
 * A minimal 3-up stat strip. Intentionally chromeless (no icons, no badges)
 * so the numbers do the talking. Single card divided by subtle borders.
 */
export function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    // `card-enter` gives a subtle fade+rise on mount. The cards themselves
    // aren't data-heavy enough to warrant per-number counters like the hero,
    // but the group-level entry keeps the dashboard reveal feeling alive.
    <div className="card-enter grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "flex flex-col justify-between gap-2 p-4 md:p-5",
            i > 0 && "border-l border-border",
          )}
        >
          <span className="label-section">{s.label}</span>
          <span
            className={cn(
              "num-display text-xl font-semibold leading-none sm:text-2xl md:text-[28px]",
              s.muted ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {s.value}
          </span>
          {s.hint ? <span className="text-[11px] text-muted-foreground">{s.hint}</span> : null}
        </div>
      ))}
    </div>
  )
}
