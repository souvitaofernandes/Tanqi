import type { FuelEntry, FuelType } from "./types"
import { monthKey } from "./format"
import { normalizeStation } from "./station-utils"
import { currentMonthKeyLocal } from "./date"

/**
 * Valor efetivamente pago (bruto - cupom/desconto). Nunca negativo.
 * O preço por litro (etiqueta do posto) permanece inalterado — o desconto afeta só o que você pagou.
 */
export function netTotal(entry: Pick<FuelEntry, "total_amount" | "discount_amount">): number {
  const gross = Number(entry.total_amount) || 0
  const disc = Number(entry.discount_amount) || 0
  return Math.max(0, gross - disc)
}

/**
 * Preço efetivo por litro considerando o cupom. Usado para comparar "quanto você realmente pagou por litro".
 */
export function effectivePricePerLiter(
  entry: Pick<FuelEntry, "total_amount" | "discount_amount" | "liters">,
): number {
  const liters = Number(entry.liters) || 0
  if (liters <= 0) return 0
  return netTotal(entry) / liters
}

/**
 * Sorts entries chronologically (oldest first) by date then odometer.
 */
export function sortAsc(entries: FuelEntry[]): FuelEntry[] {
  return [...entries].sort((a, b) => {
    if (a.entry_date === b.entry_date) return a.odometer - b.odometer
    return a.entry_date.localeCompare(b.entry_date)
  })
}

export type Summary = {
  /** Gasto real (líquido) — bruto menos cupons/descontos. */
  totalSpend: number
  /** Soma dos descontos aplicados no período. */
  totalDiscount: number
  /** Gasto bruto, sem descontos. Útil para mostrar economia. */
  totalGross: number
  totalLiters: number
  /** Preço médio efetivamente pago por litro (líquido / litros). */
  avgPricePerLiter: number
  avgConsumption: number // km/L
  costPerKm: number // R$/km — baseado no líquido
  kmTraveled: number
  entriesCount: number
}

const EMPTY_SUMMARY: Summary = {
  totalSpend: 0,
  totalDiscount: 0,
  totalGross: 0,
  totalLiters: 0,
  avgPricePerLiter: 0,
  avgConsumption: 0,
  costPerKm: 0,
  kmTraveled: 0,
  entriesCount: 0,
}

/**
 * Period-aware summary. Unlike `computeSummary`, this one uses the user's FULL
 * history (`all`) as context so it can correctly attribute:
 *  - `kmTraveled` — distance between the last fill-up strictly BEFORE `fromIso`
 *    (when available) and the last fill-up inside the period. This avoids the
 *    classic off-by-one where the first in-period fill-up becomes the baseline
 *    and the km driven since the previous period are dropped.
 *  - `avgConsumption` — only counts full-tank segments whose END falls inside
 *    the period, so the start of a segment can live outside the window.
 *
 * Nominal totals (`totalGross`, `totalDiscount`, `totalSpend`, `totalLiters`,
 * `avgPricePerLiter`, `entriesCount`) are still computed strictly from the
 * in-period subset — those represent "money you paid / fuel you bought in the
 * window", which is what users expect.
 */
export function computeSummaryInPeriod(
  all: FuelEntry[],
  fromIso: string | null,
  toIso: string,
): Summary {
  const sortedAll = sortAsc(all)
  const inPeriod = sortedAll.filter((e) => {
    if (e.entry_date > toIso) return false
    if (fromIso && e.entry_date < fromIso) return false
    return true
  })
  if (inPeriod.length === 0) return { ...EMPTY_SUMMARY }

  const totalGross = inPeriod.reduce((s, e) => s + Number(e.total_amount), 0)
  const totalDiscount = inPeriod.reduce((s, e) => s + (Number(e.discount_amount) || 0), 0)
  const totalSpend = Math.max(0, totalGross - totalDiscount)
  const totalLiters = inPeriod.reduce((s, e) => s + Number(e.liters), 0)
  const avgPricePerLiter = totalLiters > 0 ? totalSpend / totalLiters : 0

  // Baseline odometer = last entry strictly before `fromIso`. When no period
  // lower bound or no pre-period entry exists, fall back to the first in-period
  // odometer (same behavior as the plain computeSummary).
  let baselineOdo: number | null = null
  if (fromIso) {
    for (let i = sortedAll.length - 1; i >= 0; i--) {
      const e = sortedAll[i]
      if (e.entry_date < fromIso) {
        baselineOdo = Number(e.odometer)
        break
      }
    }
  }
  const firstInPeriod = inPeriod[0]
  const lastInPeriod = inPeriod[inPeriod.length - 1]
  const effectiveBaseline = baselineOdo ?? Number(firstInPeriod.odometer)
  const kmTraveled = Math.max(0, Number(lastInPeriod.odometer) - effectiveBaseline)

  // Consumption: walk the full history, count any full-tank→full-tank segment
  // whose END entry falls inside the period.
  let consumptionKm = 0
  let consumptionLiters = 0
  let lastFullIdx = -1
  for (let i = 0; i < sortedAll.length; i++) {
    const e = sortedAll[i]
    if (e.full_tank) {
      if (lastFullIdx >= 0) {
        const endsInPeriod =
          e.entry_date <= toIso && (!fromIso || e.entry_date >= fromIso)
        if (endsInPeriod) {
          const dist = Number(e.odometer) - Number(sortedAll[lastFullIdx].odometer)
          let litersBetween = 0
          for (let j = lastFullIdx + 1; j <= i; j++) litersBetween += Number(sortedAll[j].liters)
          if (dist > 0 && litersBetween > 0) {
            consumptionKm += dist
            consumptionLiters += litersBetween
          }
        }
      }
      lastFullIdx = i
    }
  }
  const avgConsumption = consumptionLiters > 0 ? consumptionKm / consumptionLiters : 0
  const costPerKm = kmTraveled > 0 ? totalSpend / kmTraveled : 0

  return {
    totalSpend,
    totalDiscount,
    totalGross,
    totalLiters,
    avgPricePerLiter,
    avgConsumption,
    costPerKm,
    kmTraveled,
    entriesCount: inPeriod.length,
  }
}

export function computeSummary(entries: FuelEntry[]): Summary {
  if (entries.length === 0) return { ...EMPTY_SUMMARY }

  const sorted = sortAsc(entries)
  const totalGross = sorted.reduce((s, e) => s + Number(e.total_amount), 0)
  const totalDiscount = sorted.reduce((s, e) => s + (Number(e.discount_amount) || 0), 0)
  const totalSpend = Math.max(0, totalGross - totalDiscount)
  const totalLiters = sorted.reduce((s, e) => s + Number(e.liters), 0)
  const avgPricePerLiter = totalLiters > 0 ? totalSpend / totalLiters : 0

  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const kmTraveled = Math.max(0, Number(last.odometer) - Number(first.odometer))

  // Consumption: between full-tank entries. Sum liters between two consecutive full tanks,
  // divide distance by those liters (excluding the first full tank's liters).
  let consumptionKm = 0
  let consumptionLiters = 0
  let lastFullIdx = -1
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i]
    if (e.full_tank) {
      if (lastFullIdx >= 0) {
        const dist = Number(e.odometer) - Number(sorted[lastFullIdx].odometer)
        let litersBetween = 0
        for (let j = lastFullIdx + 1; j <= i; j++) litersBetween += Number(sorted[j].liters)
        if (dist > 0 && litersBetween > 0) {
          consumptionKm += dist
          consumptionLiters += litersBetween
        }
      }
      lastFullIdx = i
    }
  }
  const avgConsumption = consumptionLiters > 0 ? consumptionKm / consumptionLiters : 0

  const costPerKm = kmTraveled > 0 ? totalSpend / kmTraveled : 0

  return {
    totalSpend,
    totalDiscount,
    totalGross,
    totalLiters,
    avgPricePerLiter,
    avgConsumption,
    costPerKm,
    kmTraveled,
    entriesCount: sorted.length,
  }
}

export type MonthBucket = {
  month: string // YYYY-MM
  /** Gasto líquido (pós-cupom). */
  spend: number
  /** Soma dos descontos/cupons no mês. */
  discount: number
  liters: number
  entries: number
}

export function groupByMonth(entries: FuelEntry[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>()
  for (const e of entries) {
    const k = monthKey(e.entry_date)
    const cur = map.get(k) ?? { month: k, spend: 0, discount: 0, liters: 0, entries: 0 }
    cur.spend += netTotal(e)
    cur.discount += Number(e.discount_amount) || 0
    cur.liters += Number(e.liters)
    cur.entries += 1
    map.set(k, cur)
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
}

export function currentMonthSpend(entries: FuelEntry[], now: Date = new Date()): number {
  const key = currentMonthKeyLocal(now)
  return entries
    .filter((e) => e.entry_date.startsWith(key))
    .reduce((s, e) => s + netTotal(e), 0)
}

/** Total economizado com cupons no mês corrente. */
export function currentMonthDiscount(entries: FuelEntry[], now: Date = new Date()): number {
  const key = currentMonthKeyLocal(now)
  return entries
    .filter((e) => e.entry_date.startsWith(key))
    .reduce((s, e) => s + (Number(e.discount_amount) || 0), 0)
}

export type StationStat = {
  station: string
  /** Preço médio de etiqueta (preço do posto), sem cupom. */
  avgPrice: number
  /** Preço efetivo médio pago (considerando cupons). */
  avgEffectivePrice: number
  visits: number
  /** Gasto líquido total neste posto (pós-cupom). */
  totalSpend: number
  /** Total de desconto acumulado neste posto. */
  totalDiscount: number
}

export function groupByStation(entries: FuelEntry[]): StationStat[] {
  const map = new Map<
    string,
    {
      display: string
      sumPrice: number
      count: number
      spend: number
      grossSpend: number
      discount: number
      liters: number
      lastSeen: string
    }
  >()
  for (const e of entries) {
    const raw = (e.station_name || "").trim()
    const display = raw || "Sem nome"
    const key = normalizeStation(raw) || "__no_name__"
    const cur =
      map.get(key) ?? { display, sumPrice: 0, count: 0, spend: 0, grossSpend: 0, discount: 0, liters: 0, lastSeen: "" }
    cur.sumPrice += Number(e.price_per_liter)
    cur.count += 1
    cur.spend += netTotal(e)
    cur.grossSpend += Number(e.total_amount)
    cur.discount += Number(e.discount_amount) || 0
    cur.liters += Number(e.liters)
    if (!cur.lastSeen || e.entry_date > cur.lastSeen) {
      cur.display = display
      cur.lastSeen = e.entry_date
    }
    map.set(key, cur)
  }
  const result: StationStat[] = []
  for (const v of map.values()) {
    result.push({
      station: v.display,
      avgPrice: v.count > 0 ? v.sumPrice / v.count : 0,
      avgEffectivePrice: v.liters > 0 ? v.spend / v.liters : 0,
      visits: v.count,
      totalSpend: v.spend,
      totalDiscount: v.discount,
    })
  }
  // Ordena pelo preço efetivo (o que o usuário realmente paga) — ranking "mais barato" reflete cupom
  return result.sort((a, b) => a.avgEffectivePrice - b.avgEffectivePrice)
}

export type PriceTrendPoint = {
  date: string
  gasolina?: number
  etanol?: number
  gnv?: number
  diesel?: number
}

export function priceTrendByFuel(entries: FuelEntry[]): PriceTrendPoint[] {
  const sorted = sortAsc(entries)
  const byMonth = new Map<string, Record<FuelType, { sum: number; count: number }>>()
  for (const e of sorted) {
    const k = monthKey(e.entry_date)
    const entry =
      byMonth.get(k) ??
      ({
        gasolina: { sum: 0, count: 0 },
        etanol: { sum: 0, count: 0 },
        gnv: { sum: 0, count: 0 },
        diesel: { sum: 0, count: 0 },
      } as Record<FuelType, { sum: number; count: number }>)
    entry[e.fuel_type].sum += Number(e.price_per_liter)
    entry[e.fuel_type].count += 1
    byMonth.set(k, entry)
  }
  const out: PriceTrendPoint[] = []
  for (const [date, v] of [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const p: PriceTrendPoint = { date }
    if (v.gasolina.count) p.gasolina = v.gasolina.sum / v.gasolina.count
    if (v.etanol.count) p.etanol = v.etanol.sum / v.etanol.count
    if (v.gnv.count) p.gnv = v.gnv.sum / v.gnv.count
    if (v.diesel.count) p.diesel = v.diesel.sum / v.diesel.count
    out.push(p)
  }
  return out
}

/**
 * Ethanol vs Gasoline tip. If ethanol / gasoline ratio < 0.70, ethanol compensates.
 * Returns null if we don't have both latest prices.
 */
export function ethanolVsGasoline(entries: FuelEntry[]): {
  ratio: number
  recommend: "etanol" | "gasolina"
  gasoline: number
  ethanol: number
} | null {
  const sorted = sortAsc(entries)
  let g: number | null = null
  let e: number | null = null
  for (let i = sorted.length - 1; i >= 0; i--) {
    const x = sorted[i]
    if (!g && x.fuel_type === "gasolina") g = Number(x.price_per_liter)
    if (!e && x.fuel_type === "etanol") e = Number(x.price_per_liter)
    if (g && e) break
  }
  if (!g || !e) return null
  const ratio = e / g
  return {
    ratio,
    recommend: ratio < 0.7 ? "etanol" : "gasolina",
    gasoline: g,
    ethanol: e,
  }
}
