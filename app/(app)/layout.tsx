import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import type { FuelEntry, Vehicle } from "@/lib/types"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
  const activeVehicleId = vehicles.find((v) => v.is_default)?.id ?? vehicles[0]?.id ?? null

  // Fetch recent entries for the active vehicle so the FAB can offer autocomplete + validation.
  // Limited to the last 200 to keep the shell payload small.
  let siblingEntries: FuelEntry[] = []
  if (activeVehicleId) {
    const { data } = await supabase
      .from("fuel_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("vehicle_id", activeVehicleId)
      .order("entry_date", { ascending: false })
      .limit(200)
    siblingEntries = (data ?? []) as FuelEntry[]
  }

  return (
    <AppShell
      vehicles={vehicles}
      activeVehicleId={activeVehicleId}
      userEmail={user.email ?? ""}
      siblingEntries={siblingEntries}
    >
      {children}
      <PWAInstallPrompt />
    </AppShell>
  )
}
