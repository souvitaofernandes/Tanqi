import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Shared skeleton primitives used by each route's `loading.tsx`.
 * The shape is deliberately plural — several small parts instead of one big
 * monolithic skeleton — so it can be composed to match whichever page is
 * loading without creating a visible layout shift when the real content arrives.
 */

export function SkeletonHeader({ withActions = true }: { withActions?: boolean }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40 md:h-9 md:w-56" />
        <Skeleton className="h-4 w-56" />
      </div>
      {withActions && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      )}
    </header>
  )
}

export function SkeletonHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-14 w-56 md:h-[72px] md:w-72" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-between gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonStatsRow({ count = 3 }: { count?: number }) {
  return (
    <div className={cn("grid overflow-hidden rounded-2xl border border-border bg-card", gridColsClass(count))}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col justify-between gap-2 p-4 md:p-5",
            i > 0 && "border-l border-border",
          )}
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-24 md:h-8" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:p-5", className)}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function SkeletonChartCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-[220px] w-full rounded-xl" />
    </div>
  )
}

export function SkeletonRefuelCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonVehicleCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  )
}

function gridColsClass(n: number) {
  switch (n) {
    case 2:
      return "grid-cols-2"
    case 4:
      return "grid-cols-2 md:grid-cols-4"
    case 3:
    default:
      return "grid-cols-3"
  }
}
