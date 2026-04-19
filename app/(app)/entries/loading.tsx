import { SkeletonHeader, SkeletonRefuelCard } from "@/components/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:gap-7 md:p-8">
      <SkeletonHeader />

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 md:p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-9 w-72 rounded-full" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-xl border border-border bg-card px-3 py-2.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>

      {/* Month group */}
      <section className="flex flex-col gap-2.5">
        <header className="flex items-baseline justify-between gap-3 px-1 py-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
        </header>
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <SkeletonRefuelCard />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
