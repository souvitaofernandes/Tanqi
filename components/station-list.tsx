import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StationStat } from "@/lib/fuel-utils"
import { formatBRL } from "@/lib/format"
import { MapPin, Ticket, TrendingDown } from "lucide-react"

export function StationList({ stations }: { stations: StationStat[] }) {
  const top = stations.slice(0, 6)
  const cheapest = top[0]?.avgEffectivePrice

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparação entre postos</CardTitle>
        <CardDescription>Ordenado pelo preço efetivo (após cupons)</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {top.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-inset ring-border">
              <MapPin className="size-4" />
            </div>
            <span>Nenhum posto registrado ainda</span>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {top.map((s, idx) => {
              const isCheapest = idx === 0
              const diff = cheapest ? ((s.avgEffectivePrice - cheapest) / cheapest) * 100 : 0
              const hasCoupon = s.totalDiscount > 0
              return (
                <li key={s.station} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {isCheapest ? (
                      <TrendingDown className="size-4 text-accent" />
                    ) : (
                      <MapPin className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2 truncate text-sm font-medium">
                      <span className="truncate">{s.station}</span>
                      {hasCoupon && (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-1.5 py-0.5 text-[10px] font-medium text-success ring-1 ring-success/20"
                          title={`Economia acumulada: ${formatBRL(s.totalDiscount)}`}
                        >
                          <Ticket className="size-2.5" />
                          cupom
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.visits} {s.visits === 1 ? "visita" : "visitas"} · {formatBRL(s.totalSpend)} pagos
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    {/* Use the design-system `num-inline` utility (JetBrains
                        Mono + tabular figures), not raw `font-mono`, so the
                        price column aligns with every other numeric cell in
                        the product. */}
                    <span className="num-inline text-sm font-semibold">{formatBRL(s.avgEffectivePrice)}</span>
                    {isCheapest ? (
                      <span className="text-[11px] font-medium text-accent">mais barato</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">+{diff.toFixed(1)}%</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
