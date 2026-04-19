"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import type { FuelEntry, FuelType } from "@/lib/types"
import { sortAsc } from "@/lib/fuel-utils"
import { formatBRL, formatShortMonth, monthKey } from "@/lib/format"
import { cn } from "@/lib/utils"
import { LineChart as LineChartIcon } from "lucide-react"

type Mode = "nominal" | "effective"

type MonthlyPricePoint = {
  date: string
  gasolina?: number
  etanol?: number
  gnv?: number
  diesel?: number
}

function buildTrend(entries: FuelEntry[], mode: Mode): MonthlyPricePoint[] {
  const sorted = sortAsc(entries)
  const byMonth = new Map<string, Record<FuelType, { numerator: number; denominator: number }>>()
  for (const e of sorted) {
    const k = monthKey(e.entry_date)
    const bucket =
      byMonth.get(k) ??
      ({
        gasolina: { numerator: 0, denominator: 0 },
        etanol: { numerator: 0, denominator: 0 },
        gnv: { numerator: 0, denominator: 0 },
        diesel: { numerator: 0, denominator: 0 },
      } as Record<FuelType, { numerator: number; denominator: number }>)
    const liters = Number(e.liters) || 0
    const gross = Number(e.total_amount) || 0
    const disc = Number(e.discount_amount) || 0
    // Liter-weighted average: sum(price * liters) / sum(liters)
    if (mode === "nominal") {
      bucket[e.fuel_type].numerator += Number(e.price_per_liter) * liters
      bucket[e.fuel_type].denominator += liters
    } else {
      bucket[e.fuel_type].numerator += Math.max(0, gross - disc)
      bucket[e.fuel_type].denominator += liters
    }
    byMonth.set(k, bucket)
  }
  const out: MonthlyPricePoint[] = []
  for (const [date, v] of [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const p: MonthlyPricePoint = { date }
    if (v.gasolina.denominator) p.gasolina = v.gasolina.numerator / v.gasolina.denominator
    if (v.etanol.denominator) p.etanol = v.etanol.numerator / v.etanol.denominator
    if (v.gnv.denominator) p.gnv = v.gnv.numerator / v.gnv.denominator
    if (v.diesel.denominator) p.diesel = v.diesel.numerator / v.diesel.denominator
    out.push(p)
  }
  return out
}

export function PriceTrendChart({ entries }: { entries: FuelEntry[] }) {
  const [mode, setMode] = useState<Mode>("effective")
  const hasDiscount = useMemo(
    () => entries.some((e) => (Number(e.discount_amount) || 0) > 0),
    [entries],
  )
  const trend = useMemo(() => buildTrend(entries, mode), [entries, mode])
  const data = trend.map((p) => ({ ...p, month: formatShortMonth(p.date) }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="text-base">Preço por litro</CardTitle>
          <CardDescription>
            {mode === "effective" ? "Preço efetivo (após cupons)" : "Preço de bomba (sem cupons)"}
          </CardDescription>
        </div>
        {hasDiscount ? (
          <div
            role="tablist"
            aria-label="Modo de preço"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-muted/40 p-1 text-[11px]"
          >
            {(
              [
                { value: "effective", label: "Efetivo" },
                { value: "nominal", label: "Bomba" },
              ] as const
            ).map((o) => (
              <button
                key={o.value}
                type="button"
                role="tab"
                aria-selected={mode === o.value}
                onClick={() => setMode(o.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium transition-colors",
                  mode === o.value
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-inset ring-border">
              <LineChartIcon className="size-4" />
            </div>
            <span>Sem dados para exibir</span>
          </div>
        ) : (
          <ChartContainer
            config={{
              gasolina: { label: "Gasolina", color: "var(--chart-1)" },
              etanol: { label: "Etanol", color: "var(--chart-2)" },
              gnv: { label: "GNV", color: "var(--chart-3)" },
              diesel: { label: "Diesel", color: "var(--chart-4)" },
            }}
            /* `chart-themed` is the Tanqi chart recipe defined in globals.css:
               softer grid opacity, 11px axis ticks in muted-foreground, and a
               cyan-tinted tooltip cursor that tracks the active --primary.
               Every product chart inherits the same treatment — no per-chart
               color strings. */
            className="chart-themed h-[260px] w-full"
          >
            <LineChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
              {/* CartesianGrid uses strokeDasharray 2 4 (tighter than 3 3) to
                  give a quieter, more technical rhythm that fits the data
                  face. Grid color/opacity come from chart-themed. */}
              <CartesianGrid vertical={false} strokeDasharray="2 4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={58}
                domain={["auto", "auto"]}
                tickFormatter={(v) => formatBRL(Number(v)).replace(",00", "")}
              />
              <ChartTooltip
                cursor={{ strokeWidth: 1 }}
                content={<ChartTooltipContent formatter={(v, n) => [formatBRL(Number(v)), String(n)]} />}
              />
              {/* Line dots are hidden at rest and surface on hover via
                  activeDot — tuned so the interaction communicates "this is
                  the exact point" without polluting the resting chart. */}
              <Line
                dataKey="gasolina"
                stroke="var(--color-gasolina)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
              <Line
                dataKey="etanol"
                stroke="var(--color-etanol)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
              <Line
                dataKey="gnv"
                stroke="var(--color-gnv)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
              <Line
                dataKey="diesel"
                stroke="var(--color-diesel)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
