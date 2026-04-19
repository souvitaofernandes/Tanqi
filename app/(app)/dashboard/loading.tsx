import {
  SkeletonCard,
  SkeletonChartCard,
  SkeletonHero,
  SkeletonRefuelCard,
  SkeletonStatsRow,
} from "@/components/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:gap-7 md:p-8">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-56 md:h-9" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="hidden md:block">
          <Skeleton className="h-10 w-44" />
        </div>
      </div>

      <SkeletonHero />

      {/* Insight spotlight */}
      <SkeletonCard className="h-24 md:h-28" />

      <SkeletonStatsRow count={3} />

      {/* Side cards row */}
      <div className="grid gap-3 md:grid-cols-2 md:gap-5">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
      </div>

      {/* Charts */}
      <div className="grid gap-3 md:gap-5 lg:grid-cols-2">
        <SkeletonChartCard />
        <SkeletonChartCard />
      </div>

      {/* Recent activity */}
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex flex-col gap-2 md:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRefuelCard key={i} />
          ))}
        </div>
        <div className="hidden h-[320px] overflow-hidden rounded-2xl border border-border bg-card md:block">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}
