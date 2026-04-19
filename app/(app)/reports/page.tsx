import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { FuelEntry, Vehicle } from "@/lib/types"
import { MonthlySpendChart } from "@/components/monthly-spend-chart"
import { PriceTrendChart } from "@/components/price-trend-chart"
import { StationList } from "@/components/station-list"
import { ExportButtons } from "@/components/export-buttons"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { VehicleDialog } from "@/components/vehicle-dialog"
import { PeriodSelector, resolvePeriod, getPeriodRange, type PeriodValue } from "@/components/period-selector"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { InsightStack } from "@/components/insight-card"
import { SavingsSummary } from "@/components/savings-summary"
import { BrandSavingsCard } from "@/components/brand-savings-card"
import { AnomalyList } from "@/components/anomaly-list"
import { ProjectionCard } from "@/components/projection-card"
import { VehicleComparison } from "@/components/vehicle-comparison"
import { computeSummaryInPeriod, groupByMonth, groupByStation, netTotal } from "@/lib/fuel-utils"
import {
  computeNominalSummary,
  savingsByBrand,
  detectAnomalies,
  projectCurrentMonth,
  compareVehiclesDetailed,
} from "@/lib/analytics"
import { buildHistoricalInsights } from "@/lib/insights"
import type { FuelType } from "@/lib/types"
import { formatBRL, formatKmPerLiter, formatLiters, formatNumber, formatPerKm } from "@/lib/format"
import { Car, TrendingDown, TrendingUp, Minus } from "lucide-react"
import { FuelBadge } from "@/components/fuel-badge"
import { cn } from "@/lib/utils"

function filterByRange(entries: FuelEntry[], startIso: string | null, endIso: string): FuelEntry[] {
  return entries.filter((e) => {
    if (e.entry_date > endIso) return false
    if (startIso && e.entry_date < startIso) return false
    return true
  })
}

function Delta({
  curr,
  prev,
  format,
  invert = false,
}: {
  curr: number
  prev: number
  format: (n: number) => string
  /** For metrics where lower is better (e.g. cost), invert the color scheme */
  invert?: boolean
}) {
  if (!isFinite(prev) || prev <= 0) return <span className="text-xs text-muted-foreground">novo período</span>
  const diff = (curr - prev) / prev
  const better = invert ? diff < 0 : diff > 0
  const flat = Math.abs(diff) < 0.01
  const Icon = flat ? Minus : diff > 0 ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        flat ? "text-muted-foreground" : better ? "text-success" : "text-destructive",
      )}
    >
      <Icon className="size-3" />
      {diff >= 0 ? "+" : ""}
      {(diff * 100).toFixed(0)}% <span className="text-muted-foreground">vs anterior ({format(prev)})</span>
    </span>
  )
}

function ComparisonCard({
  label,
  value,
  delta,
  secondary,
}: {
  label: string
  value: string
  delta?: React.ReactNode
  /** Optional second line used to contrast nominal vs effective price. */
  secondary?: { label: string; value: string }
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 md:p-5">
      <span className="label-section">{label}</span>
      <span className="num-display text-2xl font-semibold md:text-3xl">{value}</span>
      {secondary ? (
        <div className="flex items-baseline gap-1.5 text-[11px] text-muted-foreground">
          <span className="label-micro">{secondary.label}</span>
          <span className="num-inline font-medium">{secondary.value}</span>
        </div>
      ) : null}
      {delta ? <div>{delta}</div> : null}
    </div>
  )
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; period?: string }>
}) {
  const params = await searchParams
  const period: PeriodValue = resolvePeriod(params.period)
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
            <EmptyTitle>Sem dados para relatórios</EmptyTitle>
            <EmptyDescription>
              Cadastre um veículo e comece a registrar abastecimentos.
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

  // Fetch ALL entries for the user. We need cross-vehicle data for the comparison card
  // and the active vehicle's full history for insights/anomalies.
  const { data: entriesRaw } = await supabase
    .from("fuel_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
  const allEntriesAllVehicles = (entriesRaw ?? []) as FuelEntry[]
  const allEntries = allEntriesAllVehicles.filter((e) => e.vehicle_id === active.id)

  const range = getPeriodRange(period)
  const inPeriod = filterByRange(allEntries, range.startIso, range.endIso)
  const inPrev =
    range.prevStartIso && range.prevEndIso ? filterByRange(allEntries, range.prevStartIso, range.prevEndIso) : []

  const summary = computeSummaryInPeriod(allEntries, range.startIso, range.endIso)
  const prevSummary =
    range.prevStartIso && range.prevEndIso
      ? computeSummaryInPeriod(allEntries, range.prevStartIso, range.prevEndIso)
      : computeSummaryInPeriod([], null, range.endIso)
  const nominal = computeNominalSummary(summary)
  const prevNominal = computeNominalSummary(prevSummary)
  const monthly = groupByMonth(inPeriod)
  const stations = groupByStation(inPeriod)
  const brands = savingsByBrand(inPeriod)
  const anomalies = detectAnomalies(inPeriod)
  const projection = projectCurrentMonth(allEntries, active)
  const vehicleRows = compareVehiclesDetailed(vehicles, allEntriesAllVehicles)
  const historicalInsights = buildHistoricalInsights(allEntries)

  const couponEntries = inPeriod.filter((e) => (Number(e.discount_amount) || 0) > 0).length
  const hasDiscount = summary.totalDiscount > 0

  // Per-fuel spending distribution (net)
  const fuelStats = new Map<FuelType, { spend: number; liters: number; count: number }>()
  for (const e of inPeriod) {
    const cur = fuelStats.get(e.fuel_type) ?? { spend: 0, liters: 0, count: 0 }
    cur.spend += netTotal(e)
    cur.liters += Number(e.liters)
    cur.count += 1
    fuelStats.set(e.fuel_type, cur)
  }
  const fuelRows = Array.from(fuelStats.entries()).sort((a, b) => b[1].spend - a[1].spend)

  const periodLabel =
    period === "30d"
      ? "nos últimos 30 dias"
      : period === "90d"
        ? "nos últimos 90 dias"
        : period === "365d"
          ? "nos últimos 12 meses"
          : "em todo o histórico"

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:gap-7 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            {active.name} · {inPeriod.length} {inPeriod.length === 1 ? "abastecimento" : "abastecimentos"} {periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} />
          <ExportButtons entries={inPeriod} vehicle={active} />
        </div>
      </header>

      {inPeriod.length === 0 ? (
        // When the active vehicle HAS entries (just not in the selected
        // window — e.g. user just switched to a newly-added vehicle with
        // only 3 entries while "90 dias" was selected), offer a one-click
        // switch to "Tudo" instead of leaving the user staring at a dead
        // empty state (M7 in the QA audit).
        <Empty className="border border-dashed border-border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Car className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Sem abastecimentos neste período</EmptyTitle>
            <EmptyDescription>
              {allEntries.length > 0
                ? `Este veículo tem ${allEntries.length} ${
                    allEntries.length === 1 ? "abastecimento" : "abastecimentos"
                  } fora do período selecionado. Amplie a janela para visualizá-los.`
                : "Escolha um período mais longo ou registre novos abastecimentos."}
            </EmptyDescription>
          </EmptyHeader>
          {allEntries.length > 0 && period !== "all" ? (
            <EmptyContent>
              <Button asChild variant="outline" size="sm">
                <Link href={`/reports?v=${active.id}&period=all`}>Ver todo o histórico</Link>
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <>
          {/* Hero metrics: 4 comparison cards, with nominal price as secondary line */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <ComparisonCard
              label={hasDiscount ? "Total pago" : "Gasto no período"}
              value={formatBRL(summary.totalSpend)}
              secondary={
                hasDiscount
                  ? { label: "Bruto", value: formatBRL(nominal.totalNominal) }
                  : undefined
              }
              delta={
                range.prevStartIso ? (
                  <Delta curr={summary.totalSpend} prev={prevSummary.totalSpend} format={formatBRL} invert />
                ) : null
              }
            />
            <ComparisonCard
              label="Preço efetivo"
              value={summary.avgPricePerLiter > 0 ? `${formatBRL(summary.avgPricePerLiter)}/L` : "—"}
              secondary={
                hasDiscount && nominal.avgNominalPrice > 0
                  ? { label: "Bomba", value: `${formatBRL(nominal.avgNominalPrice)}/L` }
                  : undefined
              }
              delta={
                range.prevStartIso ? (
                  <Delta
                    curr={summary.avgPricePerLiter}
                    prev={prevSummary.avgPricePerLiter}
                    format={(n) => `${formatBRL(n)}/L`}
                    invert
                  />
                ) : null
              }
            />
            <ComparisonCard
              label="Consumo médio"
              value={formatKmPerLiter(summary.avgConsumption)}
              delta={
                range.prevStartIso && prevSummary.avgConsumption > 0 ? (
                  <Delta
                    curr={summary.avgConsumption}
                    prev={prevSummary.avgConsumption}
                    format={(n) => `${n.toFixed(1)} km/L`}
                  />
                ) : null
              }
            />
            <ComparisonCard
              label="Custo por km"
              value={formatPerKm(summary.costPerKm)}
              secondary={
                hasDiscount && nominal.nominalCostPerKm > 0
                  ? { label: "Bruto", value: formatPerKm(nominal.nominalCostPerKm) }
                  : undefined
              }
              delta={
                range.prevStartIso && prevSummary.costPerKm > 0 ? (
                  <Delta curr={summary.costPerKm} prev={prevNominal.nominalCostPerKm || prevSummary.costPerKm} format={formatPerKm} invert />
                ) : null
              }
            />
          </div>

          {/* Savings banner — only when there's cupom in the period */}
          <SavingsSummary
            gross={nominal.totalNominal}
            paid={summary.totalSpend}
            savings={summary.totalDiscount}
            couponEntries={couponEntries}
            totalEntries={inPeriod.length}
          />

          {/* Month-end projection — only when current month is in range & >= 3 days elapsed */}
          {projection ? <ProjectionCard projection={projection} /> : null}

          {/* Historical insights */}
          <InsightStack insights={historicalInsights} />

          {/* Charts row 1 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <MonthlySpendChart data={monthly} />
            <PriceTrendChart entries={inPeriod} />
          </div>

          {/* Anomalies — shown only when detected */}
          <AnomalyList anomalies={anomalies} />

          {/* Charts row 2 — stations, brand savings, fuel distribution */}
          <div className="grid gap-4 lg:grid-cols-2">
            <StationList stations={stations} />
            {brands.filter((b) => b.savings > 0).length > 0 ? (
              <BrandSavingsCard brands={brands} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição por combustível</CardTitle>
                  <CardDescription>Quanto você gasta em cada tipo {periodLabel}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <FuelDistribution rows={fuelRows} total={summary.totalSpend} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Show fuel distribution below if brand savings took the right column */}
          {brands.filter((b) => b.savings > 0).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição por combustível</CardTitle>
                <CardDescription>Quanto você gasta em cada tipo {periodLabel}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <FuelDistribution rows={fuelRows} total={summary.totalSpend} />
              </CardContent>
            </Card>
          ) : null}

          {/* Vehicle comparison — only rendered when user has 2+ vehicles with data */}
          <VehicleComparison rows={vehicleRows} activeId={active.id} />
        </>
      )}
    </div>
  )
}

function FuelDistribution({
  rows,
  total,
}: {
  rows: Array<[FuelType, { spend: number; liters: number; count: number }]>
  total: number
}) {
  if (rows.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center px-6 text-sm text-muted-foreground">Sem dados</div>
    )
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map(([type, v]) => {
        const pct = total > 0 ? (v.spend / total) * 100 : 0
        return (
          <li key={type} className="flex flex-col gap-2 px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FuelBadge type={type} />
                <span className="text-xs text-muted-foreground">
                  {v.count} {v.count === 1 ? "abastecimento" : "abastecimentos"} · {formatLiters(v.liters)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="num-inline text-sm font-semibold">{formatBRL(v.spend)}</span>
                <span className="text-xs text-muted-foreground">{formatNumber(pct, 0)}%</span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor:
                    type === "gasolina"
                      ? "var(--chart-1)"
                      : type === "etanol"
                        ? "var(--chart-2)"
                        : type === "gnv"
                          ? "var(--chart-3)"
                          : "var(--chart-4)",
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
