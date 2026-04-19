"use client"

import { EntryDialog } from "./entry-dialog"
import { Plus } from "lucide-react"
import type { FuelEntry, Vehicle } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Central floating "+" trigger that opens the entry drawer on mobile.
 * Rendered inside the bottom nav to act as the primary CTA (most frequent action).
 */
export function QuickEntryFab({
  vehicles,
  activeVehicleId,
  siblingEntries,
  className,
}: {
  vehicles: Vehicle[]
  activeVehicleId: string | null
  siblingEntries?: FuelEntry[]
  className?: string
}) {
  if (vehicles.length === 0) return null
  return (
    <EntryDialog
      vehicles={vehicles}
      defaultVehicleId={activeVehicleId ?? undefined}
      siblingEntries={siblingEntries}
      trigger={
        <button
          type="button"
          aria-label="Registrar abastecimento"
          className={cn(
            "relative flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground",
            "shadow-[0_6px_20px_-4px_color-mix(in_oklab,var(--primary)_45%,transparent)] ring-4 ring-background",
            "transition-all duration-200 hover:shadow-[0_8px_24px_-4px_color-mix(in_oklab,var(--primary)_55%,transparent)] active:scale-95",
            className,
          )}
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      }
    />
  )
}
