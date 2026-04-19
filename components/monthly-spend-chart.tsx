"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { MonthBucket } from "@/lib/fuel-utils"
import { formatBRL, formatShortMonth } from "@/lib/format"
import { BarChart3 } from "lucide-react"

/**
 * Monthly spending chart. When any month in the window has cupom discounts we
 * stack a subtle "Economizado" segment on top of the net-paid bar so the total
 * bar height equals the bruto spend. Tooltip surfaces Pago + Economizado.
 */
export function MonthlySpendChart({ data }: { data: MonthBucket[] }) {
  const chartData = data.slice(-12).map((d) => ({
    month: formatShortMonth(d.month),
    spend: Number(d.spend.toFixed(2)),
    discount: Number((d.discount || 0).toFixed(2)),
    liters: Number(d.liters.toFixed(2)),
  }))
  const hasDiscount = chartData.some((d) => d.discount > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gasto mensal</CardTitle>
        <CardDescription>
          {hasDiscount ? "Pago + economia com cupons" : `Últimos ${chartData.length} meses`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-inset ring-border">
              <BarChart3 className="size-4" />
            </div>
            <span>Sem dados suficientes</span>
          </div>
        ) : (
          <ChartContainer
            config={{
              spend: { label: "Pago", color: "var(--chart-1)" },
              discount: { label: "Economizado", color: "var(--success)" },
            }}
            className="chart-themed h-[240px] w-full"
          >
            <BarChart data={chartData} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="2 4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(v) => formatBRL(v).replace(",00", "")}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [formatBRL(Number(value)), String(name === "spend" ? "Pago" : "Economizado")]}
                    labelClassName="font-medium"
                  />
                }
              />
              <Bar
                dataKey="spend"
                stackId="a"
                fill="var(--color-spend)"
                radius={hasDiscount ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                maxBarSize={40}
              />
              {hasDiscount ? (
                <Bar
                  dataKey="discount"
                  stackId="a"
                  fill="var(--color-discount)"
                  fillOpacity={0.45}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              ) : null}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
