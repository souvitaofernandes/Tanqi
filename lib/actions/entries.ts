"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { FuelEntry, FuelType } from "@/lib/types"
import { reconcileStationName } from "@/lib/station-utils"
import { validateEntry, hasBlockingError } from "@/lib/validation"

function dbError(raw: string): Error {
  if (raw.includes("duplicate key")) return new Error("Já existe um registro com esses dados.")
  if (raw.includes("foreign key") || raw.includes("violates foreign key"))
    return new Error("Veículo não encontrado ou sem permissão.")
  if (raw.includes("row-level security") || raw.includes("permission denied"))
    return new Error("Sem permissão para realizar esta operação.")
  if (raw.includes("check constraint")) return new Error("Valor inválido — verifique os campos e tente novamente.")
  return new Error("Erro ao salvar. Tente novamente.")
}

export type EntryInput = {
  vehicle_id: string
  entry_date: string
  fuel_type: FuelType
  station_name?: string | null
  price_per_liter: number
  liters: number
  total_amount: number
  /** Cupom/desconto aplicado no pagamento. Default 0. */
  discount_amount?: number
  odometer: number
  full_tank?: boolean
  notes?: string | null
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")
  return { supabase, user }
}

/**
 * Basic numeric sanity — throws a user-readable error for obvious bad input.
 */
function ensureValidNumbers(input: EntryInput) {
  if (!(input.price_per_liter > 0)) throw new Error("Preço por litro deve ser maior que zero.")
  if (!(input.liters > 0)) throw new Error("Litros deve ser maior que zero.")
  if (!(input.total_amount > 0)) throw new Error("Valor total deve ser maior que zero.")
  if (!(input.odometer >= 0)) throw new Error("Hodômetro inválido.")
  const discount = Number(input.discount_amount ?? 0)
  if (discount < 0) throw new Error("Desconto não pode ser negativo.")
  if (discount > input.total_amount) throw new Error("Desconto maior que o valor total.")
}

async function fetchVehicleEntries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  vehicleId: string,
): Promise<FuelEntry[]> {
  const { data, error } = await supabase
    .from("fuel_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("vehicle_id", vehicleId)
  if (error) throw dbError(error.message)
  return (data ?? []) as FuelEntry[]
}

/**
 * Creates an entry. Runs validation and throws on blocking errors (e.g. odometer going backwards).
 * Station name is normalized against user history to avoid "Shell Centro" vs "shell centro" duplication.
 * If `options.force` is true, non-blocking warnings are ignored (warnings do not throw anyway).
 */
export async function createEntry(input: EntryInput, options?: { force?: boolean }) {
  const { supabase, user } = await requireUser()
  ensureValidNumbers(input)
  const siblings = await fetchVehicleEntries(supabase, user.id, input.vehicle_id)
  const canonicalStation = reconcileStationName(input.station_name || "", siblings) || null

  const warnings = validateEntry(
    {
      entry_date: input.entry_date,
      fuel_type: input.fuel_type,
      station_name: canonicalStation,
      price_per_liter: input.price_per_liter,
      liters: input.liters,
      total_amount: input.total_amount,
      discount_amount: input.discount_amount ?? 0,
      odometer: input.odometer,
    },
    siblings,
  )
  if (hasBlockingError(warnings)) {
    const first = warnings.find((w) => w.severity === "error")!
    throw new Error(first.message)
  }

  const { error } = await supabase.from("fuel_entries").insert({
    user_id: user.id,
    vehicle_id: input.vehicle_id,
    entry_date: input.entry_date,
    fuel_type: input.fuel_type,
    station_name: canonicalStation,
    price_per_liter: input.price_per_liter,
    liters: input.liters,
    total_amount: input.total_amount,
    discount_amount: input.discount_amount ?? 0,
    odometer: input.odometer,
    full_tank: input.full_tank ?? true,
    notes: input.notes ?? null,
  })
  if (error) throw dbError(error.message)
  // Scoped revalidation: only invalidate the routes that actually read fuel
  // entries. Previous `revalidatePath("/", "layout")` discarded every route
  // cache and re-rendered the sidebar/bottom-nav shell on every CRUD, which
  // was unnecessary work AND amplified any metadata-route compile failure
  // into a whole-app outage (see C1).
  revalidateEntryRoutes()
  return { warnings: warnings.filter((w) => w.severity === "warning") }
}

export async function updateEntry(id: string, input: EntryInput) {
  const { supabase, user } = await requireUser()
  ensureValidNumbers(input)
  const siblings = await fetchVehicleEntries(supabase, user.id, input.vehicle_id)
  const canonicalStation = reconcileStationName(input.station_name || "", siblings) || null

  const warnings = validateEntry(
    {
      entry_date: input.entry_date,
      fuel_type: input.fuel_type,
      station_name: canonicalStation,
      price_per_liter: input.price_per_liter,
      liters: input.liters,
      total_amount: input.total_amount,
      discount_amount: input.discount_amount ?? 0,
      odometer: input.odometer,
    },
    siblings,
    id,
  )
  if (hasBlockingError(warnings)) {
    const first = warnings.find((w) => w.severity === "error")!
    throw new Error(first.message)
  }

  const { error } = await supabase
    .from("fuel_entries")
    .update({
      vehicle_id: input.vehicle_id,
      entry_date: input.entry_date,
      fuel_type: input.fuel_type,
      station_name: canonicalStation,
      price_per_liter: input.price_per_liter,
      liters: input.liters,
      total_amount: input.total_amount,
      discount_amount: input.discount_amount ?? 0,
      odometer: input.odometer,
      full_tank: input.full_tank ?? true,
      notes: input.notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw dbError(error.message)
  revalidateEntryRoutes()
  return { warnings: warnings.filter((w) => w.severity === "warning") }
}

export async function deleteEntry(id: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from("fuel_entries").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw dbError(error.message)
  revalidateEntryRoutes()
}

/**
 * Targeted revalidation for the four routes that actually consume fuel
 * entries. Anything not in this list (auth, brand page, vehicles list, etc.)
 * keeps its cache on create/update/delete. Keep this list in sync when a
 * new surface starts reading from `fuel_entries`.
 */
function revalidateEntryRoutes() {
  revalidatePath("/dashboard")
  revalidatePath("/entries")
  revalidatePath("/reports")
  revalidatePath("/vehicles")
}
