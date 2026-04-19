import type { FuelEntry, Vehicle } from "./types"
import { computeSummary, groupByMonth, netTotal, sortAsc, type Summary } from "./fuel-utils"
import { monthKey } from "./format"
import {
  currentMonthKeyLocal,
  dayOfMonthLocal,
  daysInCurrentMonthLocal,
  daysAgoIsoLocal,
  todayIsoLocal,
} from "./date"

export type Insight = {
  id: string
  kind: "positive" | "negative" | "neutral" | "tip" | "warning"
  icon: "trend-up" | "trend-down" | "target" | "sparkles" | "flame" | "clock" | "price-tag" | "gauge"
  title: string
  description: string
}

function pctChange(curr: number, prev: number): number | null {
  if (!isFinite(prev) || prev <= 0) return null
  return (curr - prev) / prev
}

function fmtPct(n: number, digits = 0): string {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`
}

function fmtBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

function monthLabel(k: string): string {
  const d = new Date(k + "-01T00:00:00")
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "2-digit" }).format(d)
}

/**
 * Current month spend + projection for the rest of the month based on average daily pace.
 */
export function monthlyProjection(entries: FuelEntry[], now = new Date()): {
  spent: number
  projected: number
  daysElapsed: number
  daysInMonth: number
  dailyPace: number
} {
  const key = currentMonthKeyLocal(now)
  const inMonth = entries.filter((e) => e.entry_date.startsWith(key))
  const spent = inMonth.reduce((s, e) => s + netTotal(e), 0)
  const daysElapsed = Math.max(1, dayOfMonthLocal(now))
  const daysInMonth = daysInCurrentMonthLocal(now)
  const dailyPace = spent / daysElapsed
  const projected = dailyPace * daysInMonth
  return { spent, projected, daysElapsed, daysInMonth, dailyPace }
}

/**
 * Consumption (km/L) between full tanks, for a specific fuel type only.
 * Returns null if not enough full-tank pairs of that fuel type.
 */
export function consumptionByFuel(
  entries: FuelEntry[],
  fuel: FuelEntry["fuel_type"],
): { kmPerLiter: number; costPerKm: number } | null {
  const sorted = sortAsc(entries)
  let lastFullIdxOfFuel = -1
  let km = 0
  let liters = 0
  let spend = 0
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i]
    // Only full tanks of the target fuel can close a segment. Partial fills of
    // the same fuel are accumulated into the running segment; entries of other
    // fuels invalidate the segment entirely (flex-car correctness — the km in
    // between were partly powered by the other fuel).
    if (e.full_tank && e.fuel_type === fuel) {
      if (lastFullIdxOfFuel >= 0) {
        let hasOtherFuel = false
        let lSum = 0
        let sSum = 0
        for (let j = lastFullIdxOfFuel + 1; j <= i; j++) {
          if (sorted[j].fuel_type !== fuel) {
            hasOtherFuel = true
            break
          }
          lSum += Number(sorted[j].liters)
          sSum += netTotal(sorted[j])
        }
        if (!hasOtherFuel) {
          const dist = Number(e.odometer) - Number(sorted[lastFullIdxOfFuel].odometer)
          if (dist > 0 && lSum > 0) {
            km += dist
            liters += lSum
            spend += sSum
          }
        }
      }
      lastFullIdxOfFuel = i
    }
  }
  if (liters <= 0 || km <= 0) return null
  return { kmPerLiter: km / liters, costPerKm: spend / km }
}

/**
 * Personalized ethanol vs gasoline decision. Uses the car's actual km/L for each fuel if available.
 * Falls back to the generic 70% rule if personal consumption data isn't available.
 */
export function personalizedEthanolDecision(entries: FuelEntry[]): {
  recommend: "etanol" | "gasolina"
  reason: "personalized" | "rule70"
  breakEvenRatio: number
  currentRatio: number
  gasolinePrice: number
  ethanolPrice: number
  gasolineKmPerL?: number
  ethanolKmPerL?: number
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
  const gasConsumption = consumptionByFuel(entries, "gasolina")
  const ethConsumption = consumptionByFuel(entries, "etanol")
  if (gasConsumption && ethConsumption) {
    const breakEven = ethConsumption.kmPerLiter / gasConsumption.kmPerLiter
    const ratio = e / g
    return {
      recommend: ratio < breakEven ? "etanol" : "gasolina",
      reason: "personalized",
      breakEvenRatio: breakEven,
      currentRatio: ratio,
      gasolinePrice: g,
      ethanolPrice: e,
      gasolineKmPerL: gasConsumption.kmPerLiter,
      ethanolKmPerL: ethConsumption.kmPerLiter,
    }
  }
  const ratio = e / g
  return {
    recommend: ratio < 0.7 ? "etanol" : "gasolina",
    reason: "rule70",
    breakEvenRatio: 0.7,
    currentRatio: ratio,
    gasolinePrice: g,
    ethanolPrice: e,
  }
}

/**
 * Best and worst months by spending (only months with at least 2 entries count).
 */
export function bestAndWorstMonth(
  entries: FuelEntry[],
  now = new Date(),
): {
  best: { month: string; spend: number } | null
  worst: { month: string; spend: number } | null
} {
  // Exclude the current (incomplete) month — ranking against it would be
  // misleading early in the month when only a few days of data exist.
  const currKey = currentMonthKeyLocal(now)
  const months = groupByMonth(entries).filter((m) => m.entries >= 2 && m.month !== currKey)
  if (months.length === 0) return { best: null, worst: null }
  const sorted = [...months].sort((a, b) => a.spend - b.spend)
  return {
    best: { month: sorted[0].month, spend: sorted[0].spend },
    worst: { month: sorted[sorted.length - 1].month, spend: sorted[sorted.length - 1].spend },
  }
}

/**
 * Compares this month's END-OF-MONTH projection to the average of the previous
 * 3 months. Using the projection (not the partial current spend) avoids the
 * early-month bias where the partial-current-month total would always look
 * tiny next to a full previous-month average — which used to make the insight
 * trigger a bogus "gasto menor que a média" on day 3.
 *
 * Returns null when we don't yet have enough history OR the user has fewer
 * than 5 days of data this month (too noisy to project reliably).
 */
function momSpendChange(
  entries: FuelEntry[],
  now: Date,
  projected: number,
  daysElapsed: number,
): number | null {
  if (daysElapsed < 5) return null
  const months = groupByMonth(entries)
  const currKey = currentMonthKeyLocal(now)
  const previous = months.filter((m) => m.month < currKey && m.entries >= 1).slice(-3)
  if (previous.length === 0) return null
  const avgPrev = previous.reduce((s, m) => s + m.spend, 0) / previous.length
  return pctChange(projected, avgPrev)
}

/**
 * Consumption change: current computed summary vs last 90 days before this window.
 */
function consumptionChange(entries: FuelEntry[], now = new Date()): number | null {
  const cutoffIso = daysAgoIsoLocal(90, now)
  const recent = entries.filter((e) => e.entry_date >= cutoffIso)
  const older = entries.filter((e) => e.entry_date < cutoffIso)
  if (recent.length < 2 || older.length < 2) return null
  const r = computeSummary(recent).avgConsumption
  const o = computeSummary(older).avgConsumption
  if (r <= 0 || o <= 0) return null
  return pctChange(r, o)
}

export type ComputedInsights = {
  insights: Insight[]
  projection: ReturnType<typeof monthlyProjection>
  summary: Summary
  /** Current month spend vs average of the previous 3 months. Null if not computable. */
  momSpend: number | null
}

/**
 * Generates a ranked list of insights for the dashboard. The most important insight first.
 */
export function buildInsights(
  entries: FuelEntry[],
  vehicle: Vehicle | null,
  now = new Date(),
): ComputedInsights {
  const summary = computeSummary(entries)
  const projection = monthlyProjection(entries, now)
  const insights: Insight[] = []

  // 1) Budget insight (if set)
  if (vehicle?.monthly_budget && vehicle.monthly_budget > 0) {
    const pct = projection.projected / vehicle.monthly_budget
    if (pct > 1.05) {
      insights.push({
        id: "budget-over",
        kind: "negative",
        icon: "target",
        title: `Projeção acima da meta em ${fmtPct(pct - 1, 0)}`,
        description: `Ritmo atual leva a ${fmtBRL(projection.projected)} — sua meta é ${fmtBRL(vehicle.monthly_budget)}.`,
      })
    } else if (projection.spent / vehicle.monthly_budget >= 0.8 && pct <= 1.05) {
      insights.push({
        id: "budget-near",
        kind: "warning",
        icon: "target",
        title: "Quase na meta",
        description: `Você já usou ${fmtPct(projection.spent / vehicle.monthly_budget, 0)} do orçamento. Faltam ${projection.daysInMonth - projection.daysElapsed} dias no mês.`,
      })
    } else if (pct < 0.9 && projection.daysElapsed >= 10) {
      insights.push({
        id: "budget-on-track",
        kind: "positive",
        icon: "target",
        title: "No ritmo certo",
        description: `Projeção de ${fmtBRL(projection.projected)} — dentro da meta de ${fmtBRL(vehicle.monthly_budget)}.`,
      })
    }
  }

  // 2) MoM spend change — based on projection, not partial total
  const mom = momSpendChange(entries, now, projection.projected, projection.daysElapsed)
  if (mom !== null && Math.abs(mom) >= 0.1) {
    insights.push({
      id: "mom-spend",
      kind: mom < 0 ? "positive" : "negative",
      icon: mom < 0 ? "trend-down" : "trend-up",
      title: `Gasto ${mom < 0 ? "menor" : "maior"} que a média: ${fmtPct(mom, 0)}`,
      description:
        mom < 0
          ? "Você está gastando abaixo da sua média dos últimos meses."
          : "Seu gasto este mês está acima da média dos últimos meses.",
    })
  }

  // 3) Consumption change
  const cons = consumptionChange(entries, now)
  if (cons !== null && Math.abs(cons) >= 0.05) {
    insights.push({
      id: "consumption-change",
      kind: cons > 0 ? "positive" : "negative",
      icon: "gauge",
      title: `Consumo ${cons > 0 ? "melhorou" : "piorou"} ${fmtPct(Math.abs(cons), 0)}`,
      description:
        cons > 0
          ? `Seu carro anda fazendo mais km/L nos últimos 90 dias.`
          : `Consumo caiu — pode ser pneus, estilo de direção ou manutenção.`,
    })
  }

  // 4) Ethanol decision
  const eth = personalizedEthanolDecision(entries)
  if (eth) {
    const title =
      eth.recommend === "etanol"
        ? "Hoje, etanol compensa"
        : "Hoje, gasolina compensa"
    const desc =
      eth.reason === "personalized"
        ? `No seu carro, o ponto de equilíbrio é ${(eth.breakEvenRatio * 100).toFixed(0)}%. Está em ${(eth.currentRatio * 100).toFixed(0)}%.`
        : `Regra dos 70% — etanol/gasolina está em ${(eth.currentRatio * 100).toFixed(0)}%.`
    insights.push({
      id: "ethanol",
      kind: "tip",
      icon: "flame",
      title,
      description: desc,
    })
  }

  // 4.5) Coupon savings this month
  const currentKey = currentMonthKeyLocal(now)
  const monthEntries = entries.filter((e) => e.entry_date.startsWith(currentKey))
  const monthDiscount = monthEntries.reduce((s, e) => s + (Number(e.discount_amount) || 0), 0)
  if (monthDiscount > 0) {
    const gross = monthEntries.reduce((s, e) => s + Number(e.total_amount), 0)
    const pct = gross > 0 ? monthDiscount / gross : 0
    insights.push({
      id: "coupon-savings",
      kind: "positive",
      icon: "price-tag",
      title: `Você economizou ${fmtBRL(monthDiscount)} com cupons`,
      description:
        pct > 0
          ? `Isso é ${(pct * 100).toFixed(0)}% a menos no gasto bruto do mês.`
          : "Descontos aplicados nos seus abastecimentos deste mês.",
    })
  }

  // 5) Days since last entry — anchored to local today
  if (entries.length > 0) {
    const latest = sortAsc(entries)[entries.length - 1]
    const today = todayIsoLocal(now)
    const lastMs = new Date(latest.entry_date + "T00:00:00Z").getTime()
    const todayMs = new Date(today + "T00:00:00Z").getTime()
    const days = Math.max(0, Math.floor((todayMs - lastMs) / 86_400_000))
    if (days >= 14) {
      insights.push({
        id: "stale",
        kind: "neutral",
        icon: "clock",
        title: `Último abastecimento há ${days} dias`,
        description: "Registre o próximo para manter suas métricas precisas.",
      })
    }
  }

  return { insights, projection, summary, momSpend: mom }
}

/**
 * Insights for the reports/history page — longer horizon.
 */
export function buildHistoricalInsights(entries: FuelEntry[]): Insight[] {
  const out: Insight[] = []

  const totalDiscount = entries.reduce((s, e) => s + (Number(e.discount_amount) || 0), 0)
  if (totalDiscount > 0) {
    const couponEntries = entries.filter((e) => (Number(e.discount_amount) || 0) > 0).length
    out.push({
      id: "total-savings",
      kind: "positive",
      icon: "price-tag",
      title: `Economizou ${fmtBRL(totalDiscount)} com cupons`,
      description: `Em ${couponEntries} ${couponEntries === 1 ? "abastecimento" : "abastecimentos"} com desconto.`,
    })
  }

  const { best, worst } = bestAndWorstMonth(entries)
  if (best && worst && best.month !== worst.month) {
    out.push({
      id: "best-month",
      kind: "positive",
      icon: "trend-down",
      title: `Mês mais econômico: ${monthLabel(best.month)}`,
      description: `Gasto de ${fmtBRL(best.spend)}.`,
    })
    out.push({
      id: "worst-month",
      kind: "negative",
      icon: "trend-up",
      title: `Mês mais caro: ${monthLabel(worst.month)}`,
      description: `Gasto de ${fmtBRL(worst.spend)}.`,
    })
  }

  // Fuel efficiency per fuel type
  for (const fuel of ["gasolina", "etanol", "diesel", "gnv"] as const) {
    const c = consumptionByFuel(entries, fuel)
    if (c) {
      out.push({
        id: `cons-${fuel}`,
        kind: "neutral",
        icon: "gauge",
        title: `${fuel[0].toUpperCase() + fuel.slice(1)}: ${c.kmPerLiter.toFixed(1)} km/L`,
        description: `Custo médio de ${fmtBRL(c.costPerKm)}/km.`,
      })
    }
  }

  return out
}

/**
 * Compares multiple vehicles side by side.
 */
export function compareVehicles(
  vehicles: Vehicle[],
  entriesByVehicle: Record<string, FuelEntry[]>,
): Array<{
  vehicle: Vehicle
  summary: Summary
}> {
  return vehicles
    .map((v) => ({ vehicle: v, summary: computeSummary(entriesByVehicle[v.id] ?? []) }))
    .sort((a, b) => (b.summary.entriesCount || 0) - (a.summary.entriesCount || 0))
}
