import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { FuelEntry, Vehicle } from "@/lib/types"
import { EntryDialog } from "@/components/entry-dialog"
import { EntriesTable } from "@/components/entries-table"
import { MonthlySpendChart } from "@/components/monthly-spend-chart"
import { ConsumptionChart } from "@/components/consumption-chart"
import { DashboardGreeting } from "@/components/dashboard-greeting"
import { DashboardHero } from "@/components/dashboard-hero"
import { InsightSpotlight } from "@/components/insight-spotlight"
import { StatsRow } from "@/components/stats-row"
import { LastRefuelCard } from "@/components/last-refuel-card"
import { BestStationCard } from "@/components/best-station-card"
import { NoVehicleEmpty } from "@/components/no-vehicle-empty"
import { FirstEntryEmpty } from "@/components/first-entry-empty"
import { Button } from "@/components/ui/button"
import { currentMonthDiscount, groupByMonth, groupByStation } from "@/lib/fuel-utils"
import { SavingsCard } from "@/components/savings-card"
import { buildInsights } from "@/lib/insights"
import { formatKmPerLiter, formatNumber, formatPerKm } from "@/lib/format"
import { currentMonthKeyLocal, daysAgoIsoLocal } from "@/lib/date"
import { ArrowRight } from "lucide-react"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>
}) {
  const params = await searchParams
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

  // First-run: user has no vehicle yet
  if (vehicles.length === 0) return <NoVehicleEmpty />

  const active = vehicles.find((v) => v.id === params.v) ?? vehicles.find((v) => v.is_default) ?? vehicles[0]

  const { data: entriesRaw } = await supabase
    .from("fuel_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("vehicle_id", active.id)
    .order("entry_date", { ascending: false })
  const entries = (entriesRaw ?? []) as FuelEntry[]

  // Second-run: user has a vehicle but no entries yet — guided onboarding moment
  if (entries.length === 0) {
    return <FirstEntryEmpty vehicles={vehicles} defaultVehicleId={active.id} />
  }

  const { insights, projection, summary, momSpend } = buildInsights(entries, active)
  const monthly = groupByMonth(entries)

  // Best station: preferring the last 90 days (recency wins), fallback to the
  // user's full history. In BOTH branches we require >= 2 visits and a named
  // station — recommending "melhor posto" based on a single stop would be a
  // trust-destroying statement (a user who went to an unusual station once
  // would see it crowned their best). No min-visit guard on the fallback was
  // a critical bug reported in the QA audit (C2).
  const cutoffIso = daysAgoIsoLocal(90)
  const recentEntries = entries.filter((e) => e.entry_date >= cutoffIso)
  const recentStations = groupByStation(recentEntries).filter((s) => s.visits >= 2 && s.station !== "Sem nome")
  const allTimeStations = groupByStation(entries).filter((s) => s.visits >= 2 && s.station !== "Sem nome")
  const bestStation = recentStations[0] ?? allTimeStations[0] ?? null
  const userAvgPrice = summary.avgPricePerLiter

  // Coupon savings
  const monthDiscount = currentMonthDiscount(entries)
  const allTimeDiscount = summary.totalDiscount
  const currentMonthKey = currentMonthKeyLocal()
  const monthEntries = entries.filter((e) => e.entry_date.startsWith(currentMonthKey))
  const monthGross = monthEntries.reduce((s, e) => s + Number(e.total_amount), 0)
  const monthCouponCount = monthEntries.filter((e) => (Number(e.discount_amount) || 0) > 0).length
  const hasSavings = monthDiscount > 0 || allTimeDiscount > 0

  const lastEntry = entries[0] ?? null
  const recent = entries.slice(0, 4)

  const fullTanks = entries.filter((e) => e.full_tank).length
  const needsMoreTanks = fullTanks < 2

  const firstName = (user.user_metadata?.first_name as string | undefined)?.split(" ")[0] ?? null

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 md:gap-7 md:p-8">
      {/* Greeting row — desktop shows quick CTA on the right */}
      <div className="flex items-start justify-between gap-3">
        <DashboardGreeting vehicle={active} firstName={firstName} />
        <div className="hidden md:block">
          <EntryDialog vehicles={vehicles} defaultVehicleId={active.id} siblingEntries={entries} />
        </div>
      </div>

      {/* Hero: current month spend, trend, projection, budget */}
      <DashboardHero vehicle={active} projection={projection} momSpend={momSpend} />

      {/* Insights — first one is hero, the rest scroll horizontally on mobile */}
      <InsightSpotlight insights={insights} />

      {/* Three-up KPI row (no duplicate of "spent" — that's the hero) */}
      <StatsRow
        stats={[
          {
            label: "Consumo",
            value: formatKmPerLiter(summary.avgConsumption),
            // Plural-safe: "Falta 1 tanque cheio" / "Faltam 2 tanques cheios".
            // Low-brow copy bug flagged in the QA audit (M3) — reads unpolished
            // at exactly the moment the user is learning the product.
            hint: needsMoreTanks
              ? 2 - fullTanks === 1
                ? "Falta 1 tanque cheio"
                : `Faltam ${2 - fullTanks} tanques cheios`
              : "km por litro",
            muted: needsMoreTanks,
          },
          {
            label: "Custo/km",
            value: formatPerKm(summary.costPerKm),
            hint: summary.costPerKm > 0 ? "real operacional" : "precisa de mais um registro",
            muted: summary.costPerKm <= 0,
          },
          {
            label: "Km rodados",
            value: summary.kmTraveled > 0 ? `${formatNumber(summary.kmTraveled, 0)} km` : "—",
            hint:
              summary.kmTraveled > 0
                ? `${formatNumber(summary.totalLiters, 1)} L abastecidos`
                : `${formatNumber(summary.totalLiters, 1)} L abastecidos até agora`,
            muted: summary.kmTraveled <= 0,
          },
        ]}
      />

      {/* Last refuel + best station + savings (when user uses coupons).
          Using `lg` for the 3-up breakpoint instead of `xl` so tablets in
          the 1024–1280 px range get the 3-column layout — at `xl` those
          tablets were stuck on 2 columns with an orphan card wrapping
          below. */}
      <div
        className={`grid gap-3 md:gap-5 ${
          hasSavings && bestStation ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <LastRefuelCard entry={lastEntry} />
        {bestStation ? (
          <BestStationCard
            station={bestStation.station}
            avgPrice={bestStation.avgEffectivePrice}
            visits={bestStation.visits}
            userAvgPrice={userAvgPrice}
            totalDiscount={bestStation.totalDiscount}
          />
        ) : null}
        {hasSavings && (
          <SavingsCard
            monthDiscount={monthDiscount}
            monthGross={monthGross}
            monthCouponCount={monthCouponCount}
            allTimeDiscount={allTimeDiscount}
          />
        )}
      </div>

      {/* Long-format charts */}
      <div className="grid gap-3 md:gap-5 lg:grid-cols-2">
        <MonthlySpendChart data={monthly} />
        <ConsumptionChart entries={entries} />
      </div>

      {/* Recent activity */}
      <section className="flex flex-col gap-3" aria-labelledby="recent-activity-heading">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="recent-activity-heading" className="text-base font-semibold tracking-tight md:text-lg">
              Atividade recente
            </h2>
            <p className="text-[12px] text-muted-foreground">Últimos {recent.length} abastecimentos</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="-mr-2 h-8 text-muted-foreground hover:text-foreground">
            <Link href={`/entries?v=${active.id}`}>
              Ver todos
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        <EntriesTable entries={recent} vehicles={vehicles} />
      </section>
    </div>
  )
}
