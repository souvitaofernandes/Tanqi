import type { FuelEntry, FuelType, Vehicle } from "./types"
import { computeSummary, netTotal, sortAsc, type Summary } from "./fuel-utils"
import { detectBrand, type BrandInfo } from "./station-brand"
import { currentMonthKeyLocal, dayOfMonthLocal, daysInCurrentMonthLocal } from "./date"

/* ============================================================================
   Analytics helpers focused on the Reports section.
   These are pure functions — they work on plain entry arrays and never touch
   the database. They are discount-aware: nominal = pump price (bruto),
   effective = paid price (bruto − cupom).
   ============================================================================ */

export type NominalSummary = {
  /** Soma dos valores brutos (preço de bomba × litros). */
  totalNominal: number
  /** Preço médio de bomba ponderado por litros (antes de cupons). */
  avgNominalPrice: number
  /** Custo por km considerando apenas o preço de bomba. */
  nominalCostPerKm: number
}

/**
 * Derives nominal (pump-price) metrics from a Summary object. Keeps Summary
 * itself unchanged so existing callers continue to work.
 */
export function computeNominalSummary(summary: Summary): NominalSummary {
  const totalNominal = summary.totalGross
  const avgNominalPrice = summary.totalLiters > 0 ? totalNominal / summary.totalLiters : 0
  const nominalCostPerKm = summary.kmTraveled > 0 ? totalNominal / summary.kmTraveled : 0
  return { totalNominal, avgNominalPrice, nominalCostPerKm }
}

export type BrandSavings = {
  brand: BrandInfo
  savings: number
  spendNet: number
  spendGross: number
  liters: number
  visits: number
  avgEffective: number
  avgNominal: number
}

/**
 * Aggregates spending, litros and cupom savings by inferred station brand.
 * Uses `detectBrand` on the free-text station name.
 */
export function savingsByBrand(entries: FuelEntry[]): BrandSavings[] {
  const map = new Map<string, BrandSavings>()
  for (const e of entries) {
    const b = detectBrand(e.station_name)
    const cur =
      map.get(b.key) ??
      ({
        brand: b,
        savings: 0,
        spendNet: 0,
        spendGross: 0,
        liters: 0,
        visits: 0,
        avgEffective: 0,
        avgNominal: 0,
      } as BrandSavings)
    const gross = Number(e.total_amount) || 0
    const disc = Number(e.discount_amount) || 0
    const liters = Number(e.liters) || 0
    cur.spendGross += gross
    cur.spendNet += Math.max(0, gross - disc)
    cur.savings += disc
    cur.liters += liters
    cur.visits += 1
    map.set(b.key, cur)
  }
  for (const v of map.values()) {
    v.avgEffective = v.liters > 0 ? v.spendNet / v.liters : 0
    v.avgNominal = v.liters > 0 ? v.spendGross / v.liters : 0
  }
  return [...map.values()]
    .filter((v) => v.visits > 0)
    .sort((a, b) => b.savings - a.savings || b.spendNet - a.spendNet)
}

export type AnomalyKind = "high-price" | "high-liters" | "big-gap"

export type Anomaly = {
  entry: FuelEntry
  kind: AnomalyKind
  detail: string
  /** Normalized deviation magnitude — used only for sort. */
  score: number
}

/**
 * Lightweight anomaly detection. We only flag things we can justify:
 *  - high-price: preço de bomba > média + 2σ do combustível no período
 *  - high-liters: litros > 2× mediana (tanque cheio atípico)
 *  - big-gap: mais de 60 dias sem abastecer entre dois registros consecutivos
 *
 * Needs enough data — we require at least 4 entries per fuel for price
 * anomalies and at least 5 total for liter anomalies. If data is insufficient,
 * no anomalies are reported.
 */
export function detectAnomalies(entries: FuelEntry[]): Anomaly[] {
  const out: Anomaly[] = []
  if (entries.length < 4) return out
  const sorted = sortAsc(entries)

  // Price anomalies per fuel type
  const byFuel = new Map<FuelType, FuelEntry[]>()
  for (const e of sorted) {
    const arr = byFuel.get(e.fuel_type) ?? []
    arr.push(e)
    byFuel.set(e.fuel_type, arr)
  }
  for (const [, arr] of byFuel) {
    if (arr.length < 4) continue
    const prices = arr.map((e) => Number(e.price_per_liter))
    const mean = prices.reduce((s, v) => s + v, 0) / prices.length
    const variance = prices.reduce((s, v) => s + (v - mean) ** 2, 0) / prices.length
    const stdev = Math.sqrt(variance)
    if (stdev < 0.05) continue // too little variation, skip to avoid false positives
    const threshold = mean + 2 * stdev
    for (const e of arr) {
      const p = Number(e.price_per_liter)
      if (p > threshold && mean > 0) {
        const pctOver = ((p - mean) / mean) * 100
        if (pctOver < 8) continue
        out.push({
          entry: e,
          kind: "high-price",
          detail: `${pctOver.toFixed(0)}% acima da média de ${mean.toFixed(2)}/L`,
          score: (p - mean) / stdev,
        })
      }
    }
  }

  // Liter anomalies — suspiciously large fills
  if (sorted.length >= 5) {
    const liters = sorted.map((e) => Number(e.liters)).filter((v) => v > 0)
    if (liters.length >= 5) {
      const sortedLiters = [...liters].sort((a, b) => a - b)
      const mid = Math.floor(sortedLiters.length / 2)
      const median =
        sortedLiters.length % 2 === 0 ? (sortedLiters[mid - 1] + sortedLiters[mid]) / 2 : sortedLiters[mid]
      const threshold = median * 2
      if (median > 0) {
        for (const e of sorted) {
          const l = Number(e.liters)
          if (l > threshold) {
            // don't double-flag if already a price anomaly for same entry
            if (out.some((a) => a.entry.id === e.id)) continue
            out.push({
              entry: e,
              kind: "high-liters",
              detail: `${l.toFixed(1)} L — mais que o dobro da mediana (${median.toFixed(1)} L)`,
              score: l / median,
            })
          }
        }
      }
    }
  }

  // Big gap detection — parse both sides in UTC so the diff is never affected
  // by the server's local timezone (Vercel runs in UTC, but any code path that
  // imports this module in another zone would silently shift the gap by ±1 day
  // around DST boundaries). Using "T00:00:00Z" pins both endpoints to the
  // same anchor so the division by 86_400_000 is exact.
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].entry_date + "T00:00:00Z")
    const curr = new Date(sorted[i].entry_date + "T00:00:00Z")
    const days = Math.floor((curr.getTime() - prev.getTime()) / 86400000)
    if (days >= 60) {
      const e = sorted[i]
      if (out.some((a) => a.entry.id === e.id)) continue
      out.push({
        entry: e,
        kind: "big-gap",
        detail: `${days} dias sem abastecer antes desse registro`,
        score: days / 60,
      })
    }
  }

  return out.sort((a, b) => b.entry.entry_date.localeCompare(a.entry.entry_date)).slice(0, 5)
}

export type Projection = {
  spent: number
  projected: number
  dailyPace: number
  daysElapsed: number
  daysInMonth: number
  monthlyBudget: number | null
  /** projected / monthlyBudget — null when budget absent */
  usagePct: number | null
  /** true if there's enough history (>= 3 days) to trust the projection */
  confident: boolean
}

/**
 * Projects end-of-month net spend based on daily pace so far this month.
 * Returns null if the user had no entry in the current month at all.
 */
export function projectCurrentMonth(
  entries: FuelEntry[],
  vehicle: Vehicle | null,
  now = new Date(),
): Projection | null {
  const key = currentMonthKeyLocal(now)
  const inMonth = entries.filter((e) => e.entry_date.startsWith(key))
  if (inMonth.length === 0) return null
  const spent = inMonth.reduce((s, e) => s + netTotal(e), 0)
  const daysElapsed = Math.max(1, dayOfMonthLocal(now))
  const daysInMonth = daysInCurrentMonthLocal(now)
  const dailyPace = spent / daysElapsed
  const projected = dailyPace * daysInMonth
  const monthlyBudget = vehicle?.monthly_budget && Number(vehicle.monthly_budget) > 0 ? Number(vehicle.monthly_budget) : null
  const usagePct = monthlyBudget ? projected / monthlyBudget : null
  return {
    spent,
    projected,
    dailyPace,
    daysElapsed,
    daysInMonth,
    monthlyBudget,
    usagePct,
    confident: daysElapsed >= 3 && inMonth.length >= 1,
  }
}

export type VehicleComparisonRow = {
  vehicle: Vehicle
  entries: number
  netSpend: number
  savings: number
  avgEffectivePrice: number
  avgConsumption: number
  costPerKm: number
}

/**
 * Compact vehicle comparison using each vehicle's full history.
 */
export function compareVehiclesDetailed(vehicles: Vehicle[], entriesAll: FuelEntry[]): VehicleComparisonRow[] {
  return vehicles
    .map((v) => {
      const mine = entriesAll.filter((e) => e.vehicle_id === v.id)
      const summary = computeSummary(mine)
      const savings = mine.reduce((s, e) => s + (Number(e.discount_amount) || 0), 0)
      return {
        vehicle: v,
        entries: summary.entriesCount,
        netSpend: summary.totalSpend,
        savings,
        avgEffectivePrice: summary.avgPricePerLiter,
        avgConsumption: summary.avgConsumption,
        costPerKm: summary.costPerKm,
      }
    })
    .sort((a, b) => b.entries - a.entries)
}
