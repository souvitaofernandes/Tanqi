import { SkeletonHeader, SkeletonVehicleCard } from "@/components/page-skeleton"

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 md:gap-7 md:p-8">
      <SkeletonHeader />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonVehicleCard key={i} />
        ))}
      </div>
    </div>
  )
}
