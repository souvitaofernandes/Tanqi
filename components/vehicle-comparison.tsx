import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { VehicleComparisonRow } from "@/lib/analytics"
import { formatBRL, formatKmPerLiter, formatPerKm } from "@/lib/format"
import { Car } from "lucide-react"

/**
 * Side-by-side view of all vehicles using their full history. Only mounted
 * when the user has more than one vehicle.
 */
export function VehicleComparison({
  rows,
  activeId,
}: {
  rows: VehicleComparisonRow[]
  activeId: string
}) {
  const withData = rows.filter((r) => r.entries > 0)
  if (withData.length < 2) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparação entre veículos</CardTitle>
        <CardDescription>Histórico completo de cada veículo</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {withData.map((r) => {
            const isActive = r.vehicle.id === activeId
            return (
              <li key={r.vehicle.id} className="flex flex-col gap-3 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Car className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 truncate text-sm font-medium">
                        <span className="truncate">{r.vehicle.name}</span>
                        {isActive ? (
                          <span className="shrink-0 rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20">
                            selecionado
                          </span>
                        ) : null}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {r.entries} {r.entries === 1 ? "abastecimento" : "abastecimentos"}
                        {r.savings > 0 ? ` · ${formatBRL(r.savings)} economizados` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="num-inline shrink-0 text-sm font-semibold">{formatBRL(r.netSpend)}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  <Metric label="Preço /L" value={r.avgEffectivePrice > 0 ? formatBRL(r.avgEffectivePrice) : "—"} />
                  <Metric label="Consumo" value={formatKmPerLiter(r.avgConsumption)} />
                  <Metric label="Custo /km" value={formatPerKm(r.costPerKm)} />
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-muted/40 px-2.5 py-2">
      <span className="label-micro">{label}</span>
      <span className="num-inline text-sm font-medium">{value}</span>
    </div>
  )
}
