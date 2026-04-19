"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type VehicleInput = {
  name: string
  make?: string | null
  model?: string | null
  year?: number | null
  plate?: string | null
  initial_odometer?: number
  monthly_budget?: number | null
  is_default?: boolean
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
 * Guarantees the invariant: a user with 1+ vehicles always has exactly one
 * default. If somehow multiple are marked as default, keep only the oldest; if
 * none are marked, promote the oldest remaining vehicle.
 */
async function ensureOneDefault(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: all } = await supabase
    .from("vehicles")
    .select("id, is_default, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (!all || all.length === 0) return

  const defaults = all.filter((v) => v.is_default)
  if (defaults.length === 1) return

  if (defaults.length > 1) {
    // Collapse duplicates — keep the oldest default, clear the rest.
    const extras = defaults.slice(1).map((v) => v.id)
    if (extras.length > 0) {
      await supabase.from("vehicles").update({ is_default: false }).in("id", extras)
    }
    return
  }

  // defaults.length === 0 → promote the oldest vehicle.
  await supabase.from("vehicles").update({ is_default: true }).eq("id", all[0].id)
}

export async function createVehicle(input: VehicleInput) {
  const { supabase, user } = await requireUser()

  if (input.is_default) {
    await supabase.from("vehicles").update({ is_default: false }).eq("user_id", user.id)
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      user_id: user.id,
      name: input.name,
      make: input.make ?? null,
      model: input.model ?? null,
      year: input.year ?? null,
      plate: input.plate ?? null,
      initial_odometer: input.initial_odometer ?? 0,
      monthly_budget: input.monthly_budget ?? null,
      is_default: input.is_default ?? false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await ensureOneDefault(supabase, user.id)

  revalidatePath("/", "layout")
  return data
}

export async function updateVehicle(id: string, input: VehicleInput) {
  const { supabase, user } = await requireUser()

  if (input.is_default) {
    await supabase
      .from("vehicles")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .neq("id", id)
  }

  const { error } = await supabase
    .from("vehicles")
    .update({
      name: input.name,
      make: input.make ?? null,
      model: input.model ?? null,
      year: input.year ?? null,
      plate: input.plate ?? null,
      initial_odometer: input.initial_odometer ?? 0,
      monthly_budget: input.monthly_budget ?? null,
      is_default: input.is_default ?? false,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) throw new Error(error.message)

  // Default integrity — after the update there must be exactly one default
  // vehicle (as long as the user has any vehicles at all).
  await ensureOneDefault(supabase, user.id)

  revalidatePath("/", "layout")
}

export async function deleteVehicle(id: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from("vehicles").delete().eq("id", id).eq("user_id", user.id)
  if (error) throw new Error(error.message)

  // If we just deleted the default, promote the oldest remaining vehicle so
  // the app never enters a "no default" state while vehicles still exist.
  await ensureOneDefault(supabase, user.id)

  revalidatePath("/", "layout")
}

export async function setDefaultVehicle(id: string) {
  const { supabase, user } = await requireUser()
  await supabase.from("vehicles").update({ is_default: false }).eq("user_id", user.id)
  const { error } = await supabase
    .from("vehicles")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/", "layout")
}
