import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Anomaly } from "@/lib/analytics"
import { formatBRL, formatDate, formatLiters } from "@/lib/format"
import { AlertTriangle, CalendarOff, Droplet, Flame } from "lucide-react"

const ICONS: Record<Anomaly["kind"], React.ComponentType<{ className?: string }>> = {
  "high-price": Flame,
  "high-liters": Droplet,
  "big-gap": CalendarOff,
}

const LABEL: Record<Anomaly["kind"], string> = {
  "high-price": "Preço acima da média",
  "high-liters": "Abastecimento atípico",
  "big-gap": "Intervalo longo",
}

export function AnomalyList({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) return null
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <div className="flex size-8 items-center justify-center rounded-lg bg-warning/12 text-warning ring-1 ring-warning/20">
          <AlertTriangle className="size-4" />
        </div>
        <div className="flex flex-col">
          <CardTitle className="text-base">Registros fora do padrão</CardTitle>
          <CardDescription>Vale revisar — podem ser erros de digitação</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {anomalies.map((a) => {
            const Icon = ICONS[a.kind]
            return (
              <li key={a.entry.id + a.kind} className="flex items-start gap-3 px-5 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-3.5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{LABEL[a.kind]}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDate(a.entry.entry_date)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    {a.entry.station_name ? <span className="truncate">{a.entry.station_name}</span> : null}
                    <span className="num-inline">{formatBRL(Number(a.entry.price_per_liter))}/L</span>
                    <span className="num-inline">{formatLiters(Number(a.entry.liters))}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
