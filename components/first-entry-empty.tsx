"use client"

import { EntryDialog } from "./entry-dialog"
import type { Vehicle } from "@/lib/types"
import { Plus } from "lucide-react"

/**
 * Narrative empty state for users who have a vehicle but 0 entries.
 * Benefit-driven, previews the numbers they'll see once data exists.
 */
export function FirstEntryEmpty({
  vehicles,
  defaultVehicleId,
}: {
  vehicles: Vehicle[]
  defaultVehicleId?: string
}) {
  const active = vehicles.find((v) => v.id === defaultVehicleId) ?? vehicles[0]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4 md:p-8">
      <section className="surface-elevated relative overflow-hidden rounded-3xl border border-border p-6 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <Plus className="size-3" />
              Primeiro abastecimento
            </span>
            <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-[38px] md:leading-[1.1]">
              Registre hoje. Veja seu custo real amanhã.
            </h1>
            <p className="max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Leva 30 segundos. A partir do segundo tanque cheio, começamos a calcular seu consumo
              de verdade e projetar seu gasto do mês.
            </p>
          </div>

          <div>
            <EntryDialog vehicles={vehicles} defaultVehicleId={active?.id} />
          </div>
        </div>
      </section>

      {/* Preview of what will be unlocked — with mock-y numbers dimmed */}
      <div className="rounded-3xl border border-dashed border-border bg-card/40 p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Seu dashboard vai parecer com isto</span>
          <span className="label-section">
            Preview
          </span>
        </div>
        <div className="grid gap-3 opacity-60 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-2xl border border-border bg-background p-4">
            <span className="label-section">Gasto</span>
            <span className="num-display text-2xl font-semibold">R$ 412,80</span>
            <span className="text-[11px] text-success">−8% vs média</span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-border bg-background p-4">
            <span className="label-section">Consumo</span>
            <span className="num-display text-2xl font-semibold">11,2 km/L</span>
            <span className="text-[11px] text-muted-foreground">últimos 90 dias</span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-border bg-background p-4">
            <span className="label-section">Custo/km</span>
            <span className="num-display text-2xl font-semibold">R$ 0,52</span>
            <span className="text-[11px] text-muted-foreground">real operacional</span>
          </div>
        </div>
      </div>
    </div>
  )
}
