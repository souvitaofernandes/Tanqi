"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { FuelEntry } from "@/lib/types"
import { sortAsc } from "@/lib/fuel-utils"
import { formatDate, formatNumber } from "@/lib/format"
import { Gauge } from "lucide-react"

export function ConsumptionChart({ entries }: { entries: FuelEntry[] }) {
  // Build consumption between full-tank pairs
  const sorted = sortAsc(entries)
  const points: { label: string; kmpl: number }[] = []
  let lastFullIdx = -1
  for (let i = 0; i < sorted.length; i++) {
    if (!sorted[i].full_tank) continue
    if (lastFullIdx >= 0) {
      const dist = Number(sorted[i].odometer) - Number(sorted[lastFullIdx].odometer)
      let liters = 0
      for (let j = lastFullIdx + 1; j <= i; j++) liters += Number(sorted[j].liters)
      if (dist > 0 && liters > 0) {
        points.push({
          label: formatDate(sorted[i].entry_date),
          kmpl: Number((dist / liters).toFixed(2)),
        })
      }
    }
    lastFullIdx = i
  }

  const data = points.slice(-12)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Consumo médio</CardTitle>
        <CardDescription>km/L entre tanques cheios</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[220px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-inset ring-border">
              <Gauge className="size-4" />
            </div>
            <span className="text-pretty">Registre ao menos 2 tanques cheios para calcular consumo</span>
          </div>
        ) : (
          <ChartContainer
            config={{ kmpl: { label: "km/L", color: "var(--chart-1)" } }}
            className="chart-themed h-[220px] w-full"
          >
            <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
              <defs>
                {/* Area fill fades from 35% → 0% of the cyan accent. At rest
                    this reads as a "pressure gradient" underneath the km/L
                    curve — suggesting depth without dominating the grid. */}
                <linearGradient id="fillConsumption" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-kmpl)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--color-kmpl)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="2 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v) => formatNumber(v, 0)} />
              <ChartTooltip
                cursor={{ strokeWidth: 1 }}
                content={<ChartTooltipContent formatter={(v) => `${formatNumber(Number(v), 1)} km/L`} />}
              />
              <Area
                type="monotone"
                dataKey="kmpl"
                stroke="var(--color-kmpl)"
                strokeWidth={2}
                fill="url(#fillConsumption)"
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
