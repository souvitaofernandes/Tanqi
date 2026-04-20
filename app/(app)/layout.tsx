import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import type { Vehicle } from "@/lib/types"

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
  // Prefer the ?v= URL param (read client-side in AppShell) over is_default.
  // Layout cannot access searchParams, so we pass the is_default vehicle as the
  // server-side fallback; AppShell overrides it when ?v= is present.
  const defaultVehicleId = vehicles.find((v) => v.is_default)?.id ?? vehicles[0]?.id ?? null

  return (
    <AppShell vehicles={vehicles} defaultVehicleId={defaultVehicleId} userEmail={user.email ?? ""}>
      {children}
      <PWAInstallPrompt />
    </AppShell>
  )
}
