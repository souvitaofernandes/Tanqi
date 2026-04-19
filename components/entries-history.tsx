"use client"

import { useMemo, useState } from "react"
import { todayIsoLocal, daysAgoIsoLocal } from "@/lib/date"
import { PRICE_ANOMALY_SIGMA } from "@/lib/constants"
import type { FuelEntry, FuelType, Vehicle } from "@/lib/types"
import { FUEL_LABEL } from "@/lib/types"
import { netTotal } from "@/lib/fuel-utils"
import { formatBRL, formatNumber } from "@/lib/format"
import { RefuelCard, type RefuelAnomaly } from "./refuel-card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fuelColor } from "./fuel-badge"
import { Fuel, Search, SlidersHorizontal, Ticket, X } from "lucide-react"

type Props = {
  entries: FuelEntry[]
  vehicles: Vehicle[]
}

type PeriodKey = "30d" | "90d" | "6m" | "1y" | "all"

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "6m", label: "6 meses" },
  { key: "1y", label: "1 ano" },
  { key: "all", label: "Tudo" },
]

const FUEL_ORDER: FuelType[] = ["gasolina", "etanol", "gnv", "diesel"]

function periodCutoff(period: PeriodKey): string | null {
  if (period === "all") return null
  if (period === "30d") return daysAgoIsoLocal(30)
  if (period === "90d") return daysAgoIsoLocal(90)
  // For month/year offsets, anchor to São Paulo calendar date then subtract.
  const today = todayIsoLocal()
  const [y, m, d] = today.split("-").map(Number)
  if (period === "6m") {
    const targetMonth = m - 6 <= 0 ? m - 6 + 12 : m - 6
    const targetYear = m - 6 <= 0 ? y - 1 : y
    return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  }
  // 1y
  return `${y - 1}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map((n) => Number.parseInt(n, 10))
  const d = new Date(y, (m || 1) - 1, 1)
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d)
}

/**
 * Precomputes anomaly flags using the same tolerances as the validation engine,
 * but applied to historical entries for inline visual highlighting.
 */
function computeAnomalies(allEntries: FuelEntry[]): Map<string, RefuelAnomaly> {
  const out = new Map<string, RefuelAnomaly>()

  // Sort ascending by date+odometer for odometer jump detection
  const sortedAsc = [...allEntries].sort((a, b) => {
    if (a.entry_date === b.entry_date) return a.odometer - b.odometer
    return a.entry_date.localeCompare(b.entry_date)
  })

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = sortedAsc[i - 1]
    const cur = sortedAsc[i]
    const delta = Number(cur.odometer) - Number(prev.odometer)
    if (delta > 2000) {
      out.set(cur.id, {
        kind: "odometer_jump",
        message: `Mais de ${delta.toLocaleString("pt-BR")} km desde o último abastecimento`,
      })
    }
  }

  // Price anomaly by fuel type (> 2.5σ)
  const byFuel = new Map<FuelType, FuelEntry[]>()
  for (const e of allEntries) {
    const arr = byFuel.get(e.fuel_type) ?? []
    arr.push(e)
    byFuel.set(e.fuel_type, arr)
  }
  for (const [, list] of byFuel) {
    if (list.length < 5) continue
    const prices = list.map((e) => Number(e.price_per_liter))
    const mean = prices.reduce((s, v) => s + v, 0) / prices.length
    const variance = prices.reduce((s, v) => s + (v - mean) ** 2, 0) / prices.length
    const sd = Math.sqrt(variance)
    if (sd <= 0) continue
    for (const e of list) {
      const z = (Number(e.price_per_liter) - mean) / sd
      if (Math.abs(z) > PRICE_ANOMALY_SIGMA) {
        // Keep odometer_jump as the primary if set; price is a softer signal
        if (!out.has(e.id)) {
          out.set(e.id, {
            kind: "price",
            message:
              z > 0
                ? `Preço ${(((Number(e.price_per_liter) - mean) / mean) * 100).toFixed(0)}% acima da média histórica`
                : `Preço bem abaixo da média — confira se não é erro de digitação`,
          })
        }
      }
    }
  }
  return out
}

/**
 * km since the previous refuel, indexed by entry id. Requires the FULL entry
 * list (not just the filtered one) so we can look back correctly.
 */
function computeKmSinceLast(allEntries: FuelEntry[]): Map<string, number> {
  const out = new Map<string, number>()
  const sortedAsc = [...allEntries].sort((a, b) => {
    if (a.entry_date === b.entry_date) return a.odometer - b.odometer
    return a.entry_date.localeCompare(b.entry_date)
  })
  for (let i = 1; i < sortedAsc.length; i++) {
    const delta = Number(sortedAsc[i].odometer) - Number(sortedAsc[i - 1].odometer)
    if (delta > 0) out.set(sortedAsc[i].id, delta)
  }
  return out
}

export function EntriesHistory({ entries, vehicles }: Props) {
  const [search, setSearch] = useState("")
  const [onlyCoupon, setOnlyCoupon] = useState(false)
  const [fuelFilter, setFuelFilter] = useState<Set<FuelType>>(new Set())
  const [period, setPeriod] = useState<PeriodKey>("all")

  // Pre-computed maps based on the entire history (not filtered), so that context
  // (anomalies, km-since-last) remains correct even when filters hide neighbors.
  const anomalies = useMemo(() => computeAnomalies(entries), [entries])
  const kmSinceLast = useMemo(() => computeKmSinceLast(entries), [entries])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const cutoff = periodCutoff(period)
    return entries.filter((e) => {
      if (cutoff && e.entry_date < cutoff) return false
      if (onlyCoupon && !(Number(e.discount_amount) > 0)) return false
      if (fuelFilter.size > 0 && !fuelFilter.has(e.fuel_type)) return false
      if (q) {
        const haystack = `${e.station_name ?? ""} ${e.notes ?? ""}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [entries, search, onlyCoupon, fuelFilter, period])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.entry_date === b.entry_date) return b.odometer - a.odometer
      return b.entry_date.localeCompare(a.entry_date)
    })
  }, [filtered])

  // Group by month (YYYY-MM)
  const monthGroups = useMemo(() => {
    const map = new Map<
      string,
      { entries: FuelEntry[]; spend: number; discount: number; liters: number }
    >()
    for (const e of sorted) {
      const key = e.entry_date.slice(0, 7)
      const cur = map.get(key) ?? { entries: [], spend: 0, discount: 0, liters: 0 }
      cur.entries.push(e)
      cur.spend += netTotal(e)
      cur.discount += Number(e.discount_amount) || 0
      cur.liters += Number(e.liters)
      map.set(key, cur)
    }
    return Array.from(map.entries())
  }, [sorted])

  // Filter summary
  const summary = useMemo(() => {
    const total = filtered.reduce((s, e) => s + netTotal(e), 0)
    const discount = filtered.reduce((s, e) => s + (Number(e.discount_amount) || 0), 0)
    const liters = filtered.reduce((s, e) => s + Number(e.liters), 0)
    const eff = liters > 0 ? total / liters : 0
    return { total, discount, liters, effective: eff }
  }, [filtered])

  const hasAnyFilter =
    search.trim().length > 0 || onlyCoupon || fuelFilter.size > 0 || period !== "all"

  function clearFilters() {
    setSearch("")
    setOnlyCoupon(false)
    setFuelFilter(new Set())
    setPeriod("all")
  }

  function toggleFuel(f: FuelType) {
    setFuelFilter((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  // Master empty state: no entries at all
  if (entries.length === 0) {
    return (
      <Empty className="border border-dashed border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Fuel className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Nenhum abastecimento registrado</EmptyTitle>
          <EmptyDescription>
            Registre seu primeiro abastecimento para acompanhar consumo, custo por km e economia com cupons.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 md:p-4">
        {/* Row 1: search + period */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <InputGroup className="flex-1">
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por posto ou observação…"
              aria-label="Buscar abastecimentos"
            />
            {search.length > 0 && (
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="size-3.5" />
                </button>
              </InputGroupAddon>
            )}
          </InputGroup>

          <div
            role="tablist"
            aria-label="Período"
            className="scrollbar-hidden flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-full border border-border bg-muted/40 p-1"
          >
            {PERIOD_OPTIONS.map((p) => {
              const active = period === p.key
              return (
                <button
                  key={p.key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 2: chip filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            active={onlyCoupon}
            onClick={() => setOnlyCoupon((v) => !v)}
            icon={<Ticket className="size-3" />}
            tone="success"
          >
            Com cupom
          </FilterChip>

          <span className="mx-1 h-4 w-px bg-border" aria-hidden />

          {FUEL_ORDER.map((f) => {
            const active = fuelFilter.has(f)
            return (
              <FilterChip
                key={f}
                active={active}
                onClick={() => toggleFuel(f)}
                dotColor={active ? fuelColor(f) : undefined}
              >
                {FUEL_LABEL[f]}
              </FilterChip>
            )
          })}

          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Summary strip (reacts to filters) */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <SummaryTile
          label="Resultados"
          value={`${filtered.length}`}
          hint={filtered.length === 1 ? "abastecimento" : "abastecimentos"}
        />
        <SummaryTile label="Total pago" value={formatBRL(summary.total)} />
        <SummaryTile label="Litros" value={`${formatNumber(summary.liters, 2)} L`} />
        <SummaryTile
          label="Preço efetivo"
          value={summary.effective > 0 ? `${formatBRL(summary.effective)}/L` : "—"}
          tone={summary.discount > 0 ? "success" : "default"}
          hint={summary.discount > 0 ? `Economizou ${formatBRL(summary.discount)}` : undefined}
        />
      </div>

      {/* Results or empty-filter state */}
      {filtered.length === 0 ? (
        <Empty className="border border-dashed border-border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SlidersHorizontal className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Nenhum abastecimento encontrado</EmptyTitle>
            <EmptyDescription>
              Ajuste os filtros ou a busca. Nenhum registro bate com os critérios atuais.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-5">
          {monthGroups.map(([key, group]) => (
            <section key={key} className="flex flex-col gap-2.5">
              <header className="sticky top-2 z-10 flex items-baseline justify-between gap-3 rounded-lg bg-background/80 px-1 py-1 backdrop-blur">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-[13px] font-semibold uppercase tracking-wider text-foreground">
                    {monthLabel(key)}
                  </h2>
                  <span className="text-[11px] text-muted-foreground">
                    {group.entries.length} {group.entries.length === 1 ? "abastecimento" : "abastecimentos"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="num-inline text-sm font-semibold tabular-nums">
                    {formatBRL(group.spend)}
                  </span>
                  {group.discount > 0 && (
                    <span className="num-inline text-[11px] font-medium text-success">
                      −{formatBRL(group.discount)}
                    </span>
                  )}
                </div>
              </header>
              <ul className="flex flex-col gap-2">
                {group.entries.map((e) => (
                  <li key={e.id}>
                    <RefuelCard
                      entry={e}
                      vehicles={vehicles}
                      siblingEntries={entries}
                      kmSinceLast={kmSinceLast.get(e.id)}
                      anomaly={anomalies.get(e.id) ?? null}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
  icon,
  dotColor,
  tone = "default",
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  icon?: React.ReactNode
  dotColor?: string
  tone?: "default" | "success"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? tone === "success"
            ? "border-success/30 bg-success/14 text-success"
            : "border-primary/30 bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground",
      )}
    >
      {icon}
      {dotColor && (
        <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      )}
      {children}
    </button>
  )
}

function SummaryTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  tone?: "default" | "success"
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border bg-card px-3 py-2.5",
        tone === "success" ? "border-success/25" : "border-border",
      )}
    >
      <span className="label-micro">{label}</span>
      <span
        className={cn(
          "num-inline text-[15px] font-semibold tabular-nums leading-tight md:text-base",
          tone === "success" ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </span>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  )
}
