import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { FuelEntry, Vehicle } from "@/lib/types"
import { EntriesHistory } from "@/components/entries-history"
import { EntryDialog } from "@/components/entry-dialog"
import { VehicleDialog } from "@/components/vehicle-dialog"
import { ExportButtons } from "@/components/export-buttons"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatBRL, formatLiters } from "@/lib/format"
import { netTotal } from "@/lib/fuel-utils"
import { Car, Ticket } from "lucide-react"

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: vehiclesRaw } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
  const vehicles = (vehiclesRaw ?? []) as Vehicle[]

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-8">
        <Empty className="border border-dashed border-border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Car className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Cadastre um veículo primeiro</EmptyTitle>
            <EmptyDescription>
              Para registrar abastecimentos você precisa ter ao menos um veículo.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <VehicleDialog canUnsetDefault={false} />
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const active = vehicles.find((v) => v.id === params.v) ?? vehicles.find((v) => v.is_default) ?? vehicles[0]

  const { data: entriesRaw } = await supabase
    .from("fuel_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("vehicle_id", active.id)
    .order("entry_date", { ascending: false })
  const entries = (entriesRaw ?? []) as FuelEntry[]

  const totalSpend = entries.reduce((s, e) => s + netTotal(e), 0)
  const totalLiters = entries.reduce((s, e) => s + Number(e.liters), 0)
  const totalDiscount = entries.reduce((s, e) => s + (Number(e.discount_amount) || 0), 0)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:gap-7 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Abastecimentos</h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "registro" : "registros"} · {formatBRL(totalSpend)} ·{" "}
            {formatLiters(totalLiters)} · {active.name}
          </p>
          {totalDiscount > 0 && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success ring-1 ring-success/20">
              <Ticket className="size-3" />
              {formatBRL(totalDiscount)} economizados com cupons
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons entries={entries} vehicle={active} />
          <EntryDialog vehicles={vehicles} defaultVehicleId={active.id} siblingEntries={entries} />
        </div>
      </header>

      <EntriesHistory entries={entries} vehicles={vehicles} />
    </div>
  )
}
