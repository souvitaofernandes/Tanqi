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
// Server-safe utilities live in `@/lib/period` (no `"use client"` directive).
// The `PeriodSelector` React component keeps its own file because it uses
// client-only hooks like `usePathname`/`useSearchParams`. Importing the pure
// functions from the client module would crash the server render in Next 16
// with "Attempted to call resolvePeriod() from the server".
import { PeriodSelector } from "@/components/period-selector"
import { resolvePeriod, getPeriodRange, type PeriodValue } from "@/lib/period"
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
import { Car, TrendingDown, TrendingUp, Minus, Sparkles } from "lucide-react"
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
  // "Sem dados anteriores" is explicit; the old "novo período" copy was
  // ambiguous for newcomers who didn't know what the reference period was.
  if (!isFinite(prev) || prev <= 0) return <span className="text-xs text-muted-foreground">sem dados anteriores</span>
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

  // Vehicle resolution with orphaned-`?v` handling:
  // If the URL still carries a `?v=<id>` for a vehicle that no longer exists
  // (e.g. the user deleted it in another tab), silently falling back would
  // leave ghosts in the browser history. Redirect to the canonical URL so the
  // address bar stops lying about what's on screen.
  if (params.v && !vehicles.find((v) => v.id === params.v)) {
    const fallback = vehicles.find((v) => v.is_default) ?? vehicles[0]
    const qs = new URLSearchParams()
    qs.set("v", fallback.id)
    if (params.period) qs.set("period", params.period)
    redirect(`/reports?${qs.toString()}`)
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

  const summary = computeSummaryInPeriod(allEntries, range.startIso, range.endIso)
  const prevSummary =
    range.prevStartIso && range.prevEndIso
      ? computeSummaryInPeriod(allEntries, range.prevStartIso, range.prevEndIso)
      : computeSummaryInPeriod([], null, range.endIso)
  const nominal = computeNominalSummary(summary)
  const monthly = groupByMonth(inPeriod)
  const stations = groupByStation(inPeriod)
  const brands = savingsByBrand(inPeriod)
  const anomalies = detectAnomalies(inPeriod)
  const projection = projectCurrentMonth(allEntries, active)
  const vehicleRows = compareVehiclesDetailed(vehicles, allEntriesAllVehicles)
  // Historical insights are intentionally computed against the vehicle's FULL
  // history — "mês mais econômico", "melhor posto de sempre", etc. only make
  // sense at lifetime scope. The section is explicitly labeled below so users
  // don't conflate it with the period filter.
  const historicalInsights = buildHistoricalInsights(allEntries)

  const couponEntries = inPeriod.filter((e) => (Number(e.discount_amount) || 0) > 0).length
  const hasDiscount = summary.totalDiscount > 0
  const hasBrandSavings = brands.filter((b) => b.savings > 0).length > 0

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
            {active.name} ·{" "}
            {/* Subtitle reads naturally: "<N> abastecimentos <escopo>" with a
                clean preposition for lifetime vs. window. */}
            {inPeriod.length} {inPeriod.length === 1 ? "abastecimento" : "abastecimentos"} {periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} />
          <ExportButtons entries={inPeriod} vehicle={active} />
        </div>
      </header>

      {inPeriod.length === 0 ? (
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
          {/* Hero metrics — 4 comparison cards. For cost-style metrics, both
              sides of the <Delta> use the SAME base (net ÷ net) so the
              comparison isn't distorted by cupom in one window but not the
              other. The old code mixed net (current) with nominal (previous),
              which silently made the current period look better than it was. */}
          <section aria-labelledby="reports-hero-heading" className="flex flex-col gap-3">
            <h2 id="reports-hero-heading" className="sr-only">
              Resumo do período
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <ComparisonCard
                label={hasDiscount ? "Total pago" : "Gasto no período"}
                value={formatBRL(summary.totalSpend)}
                secondary={
                  hasDiscount
                    ? { label: "Bruto (sem cupons)", value: formatBRL(nominal.totalNominal) }
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
                    ? { label: "Preço de bomba", value: `${formatBRL(nominal.avgNominalPrice)}/L` }
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
                    ? { label: "Bruto (sem cupons)", value: formatPerKm(nominal.nominalCostPerKm) }
                    : undefined
                }
                delta={
                  // BOTH sides use NET cost-per-km — the user-facing number.
                  // (The previous "curr net vs prev nominal" comparison was
                  // the bug flagged as C2 in the QA audit: it made the
                  // current period appear cheaper than it actually was
                  // whenever the previous window had any cupom.)
                  range.prevStartIso && prevSummary.costPerKm > 0 ? (
                    <Delta curr={summary.costPerKm} prev={prevSummary.costPerKm} format={formatPerKm} invert />
                  ) : null
                }
              />
            </div>
          </section>

          {/* Savings banner — only when there's cupom in the period */}
          <SavingsSummary
            gross={nominal.totalNominal}
            paid={summary.totalSpend}
            savings={summary.totalDiscount}
            couponEntries={couponEntries}
            totalEntries={inPeriod.length}
          />

          {/* Month-end projection — ProjectionCard is period-agnostic and
              covers the CURRENT calendar month regardless of the window
              selected above. The card's own `confident` guard hides it when
              there's not enough same-month data to trust the projection. */}
          {projection ? <ProjectionCard projection={projection} /> : null}

          {/* Historical insights — lifetime scope. Explicitly labeled so the
              user doesn't mistake "mês mais econômico desde sempre" for a
              period-scoped finding. */}
          {historicalInsights.length > 0 ? (
            <section aria-labelledby="reports-history-heading" className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" aria-hidden />
                <h2 id="reports-history-heading" className="text-sm font-semibold tracking-tight">
                  Insights do histórico completo
                </h2>
              </div>
              <InsightStack insights={historicalInsights} />
            </section>
          ) : null}

          {/* Charts row 1 */}
          <section aria-labelledby="reports-trends-heading" className="flex flex-col gap-3">
            <h2 id="reports-trends-heading" className="sr-only">
              Tendências de gasto e preço
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <MonthlySpendChart data={monthly} />
              <PriceTrendChart entries={inPeriod} />
            </div>
          </section>

          {/* Anomalies — shown only when detected */}
          <AnomalyList anomalies={anomalies} />

          {/* Stations + (brand savings OR fuel distribution).
              This is a single conditional layout — the fuel distribution card
              swaps slots based on whether brand savings is visible, so the
              same markup isn't duplicated twice (bug in the previous layout
              where any copy edit to FuelDistribution had to be made in two
              places). */}
          <section aria-labelledby="reports-breakdown-heading" className="flex flex-col gap-4">
            <h2 id="reports-breakdown-heading" className="sr-only">
              Detalhamento por posto, marca e combustível
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <StationList stations={stations} />
              {hasBrandSavings ? <BrandSavingsCard brands={brands} /> : <FuelDistributionCard rows={fuelRows} total={summary.totalSpend} periodLabel={periodLabel} />}
            </div>
            {/* When brand savings took the right slot above, the fuel
                distribution moves to a full-width row underneath so it still
                gets shown. Rendered once only. */}
            {hasBrandSavings ? (
              <FuelDistributionCard rows={fuelRows} total={summary.totalSpend} periodLabel={periodLabel} />
            ) : null}
          </section>

          {/* Vehicle comparison — only rendered when user has 2+ vehicles with data */}
          <VehicleComparison rows={vehicleRows} activeId={active.id} />
        </>
      )}
    </div>
  )
}

function FuelDistributionCard({
  rows,
  total,
  periodLabel,
}: {
  rows: Array<[FuelType, { spend: number; liters: number; count: number }]>
  total: number
  periodLabel: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição por combustível</CardTitle>
        <CardDescription>Quanto você gasta em cada tipo {periodLabel}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <FuelDistribution rows={rows} total={total} />
      </CardContent>
    </Card>
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
    <ul className="divide-y divide-border" aria-label="Distribuição de gasto por combustível">
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
            {/* Progress bar exposes its magnitude via ARIA so this data isn't
                silent for screen-reader users. */}
            <div
              role="progressbar"
              aria-label={`Participação de ${type} no gasto`}
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full"
                aria-hidden
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
