import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { FuelEntry, Vehicle } from "@/lib/types"
import { VehicleDialog } from "@/components/vehicle-dialog"
import { VehicleCard } from "@/components/vehicle-card"
import { VehiclesEmpty } from "@/components/vehicles-empty"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function VehiclesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [{ data: vehiclesRaw }, { data: entriesRaw }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase.from("fuel_entries").select("*").eq("user_id", user.id),
  ])

  const vehicles = (vehiclesRaw ?? []) as Vehicle[]
  const entries = (entriesRaw ?? []) as FuelEntry[]

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 md:gap-7 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Veículos</h1>
          <p className="text-sm text-muted-foreground">
            {vehicles.length === 0
              ? "Cadastre seu primeiro carro para começar."
              : vehicles.length === 1
                ? "1 veículo cadastrado"
                : `${vehicles.length} veículos cadastrados`}
          </p>
        </div>
        {vehicles.length > 0 && (
          <VehicleDialog
            canUnsetDefault
            trigger={
              <Button className="gap-1.5">
                <Plus className="size-4" />
                Adicionar veículo
              </Button>
            }
          />
        )}
      </header>

      {vehicles.length === 0 ? (
        <VehiclesEmpty />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} entries={entries} totalVehicles={vehicles.length} />
          ))}
        </div>
      )}
    </div>
  )
}
