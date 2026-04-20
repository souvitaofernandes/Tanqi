import { Card, CardContent } from "@/components/ui/card"
import type { FuelEntry } from "@/lib/types"
import { ethanolVsGasoline } from "@/lib/fuel-utils"
import { formatBRL } from "@/lib/format"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function EthanolTip({ entries }: { entries: FuelEntry[] }) {
  const tip = ethanolVsGasoline(entries)
  if (!tip) return null

  const { ratio, recommend, gasoline, ethanol } = tip
  const pctRatio = (ratio * 100).toFixed(1)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            recommend === "etanol" ? "bg-chart-3/15 text-chart-3" : "bg-accent/15 text-accent",
          )}>
            <Sparkles className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Regra dos 70%</span>
            <span className="text-base font-semibold">
              {recommend === "etanol" ? "Etanol está valendo a pena" : "Gasolina compensa mais agora"}
            </span>
            <span className="text-sm text-muted-foreground">
              Proporção atual: <span className="font-medium text-foreground">{pctRatio}%</span> · abaixo de 70% indica
              etanol.
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Gasolina</span>
            <span className="font-mono font-semibold">{formatBRL(gasoline)}/L</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Etanol</span>
            <span className="font-mono font-semibold">{formatBRL(ethanol)}/L</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
