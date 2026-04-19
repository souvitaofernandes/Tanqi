import type { FuelEntry, FuelType, Vehicle } from "./types"
import { computeSummary, currentMonthSpend } from "./fuel-utils"

export type VehicleStats = {
  entriesCount: number
  kmTraveled: number
  avgConsumption: number // km/L
  costPerKm: number // R$/km
  monthSpend: number
  lastEntryDate: string | null
  mainFuel: FuelType | null
  budgetUsagePct: number | null // 0..1+, null when no budget
}

export function computeVehicleStats(vehicle: Vehicle, entries: FuelEntry[]): VehicleStats {
  const mine = entries.filter((e) => e.vehicle_id === vehicle.id)
  const summary = computeSummary(mine)
  const monthSpend = currentMonthSpend(mine)

  // Most used fuel
  const fuelCount: Record<FuelType, number> = { gasolina: 0, etanol: 0, gnv: 0, diesel: 0 }
  for (const e of mine) fuelCount[e.fuel_type] += 1
  let mainFuel: FuelType | null = null
  let max = 0
  for (const [k, v] of Object.entries(fuelCount) as [FuelType, number][]) {
    if (v > max) {
      max = v
      mainFuel = k
    }
  }

  // Last entry date
  let lastEntryDate: string | null = null
  for (const e of mine) {
    if (!lastEntryDate || e.entry_date > lastEntryDate) lastEntryDate = e.entry_date
  }

  const budgetUsagePct =
    vehicle.monthly_budget && Number(vehicle.monthly_budget) > 0
      ? monthSpend / Number(vehicle.monthly_budget)
      : null

  return {
    entriesCount: mine.length,
    kmTraveled: summary.kmTraveled,
    avgConsumption: summary.avgConsumption,
    costPerKm: summary.costPerKm,
    monthSpend,
    lastEntryDate,
    mainFuel,
    budgetUsagePct,
  }
}

/**
 * Formats a Brazilian license plate as either ABC-1234 (old) or ABC1D23 (Mercosul).
 * Returns the original string if it doesn't match.
 */
export function formatPlate(raw: string): string {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase()
  if (clean.length !== 7) return raw.toUpperCase()
  const oldPattern = /^[A-Z]{3}[0-9]{4}$/
  const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
  if (oldPattern.test(clean)) return `${clean.slice(0, 3)}-${clean.slice(3)}`
  if (mercosulPattern.test(clean)) return clean
  return raw.toUpperCase()
}

/**
 * Validates a Brazilian plate (old or Mercosul). Empty strings are considered valid
 * (plate is optional in this app).
 */
export function isValidPlate(raw: string): boolean {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase()
  if (clean.length === 0) return true
  if (clean.length !== 7) return false
  const oldPattern = /^[A-Z]{3}[0-9]{4}$/
  const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
  return oldPattern.test(clean) || mercosulPattern.test(clean)
}

/**
 * Humanized "time since" label in Portuguese.
 */
export function timeSinceLabel(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00")
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days <= 0) return "hoje"
  if (days === 1) return "ontem"
  if (days < 7) return `há ${days} dias`
  if (days < 30) {
    const w = Math.floor(days / 7)
    return w === 1 ? "há 1 semana" : `há ${w} semanas`
  }
  if (days < 365) {
    const m = Math.floor(days / 30)
    return m === 1 ? "há 1 mês" : `há ${m} meses`
  }
  const y = Math.floor(days / 365)
  return y === 1 ? "há 1 ano" : `há ${y} anos`
}
