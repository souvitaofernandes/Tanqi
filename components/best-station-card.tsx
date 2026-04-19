import { formatBRL } from "@/lib/format"
import { TrendingDown, MapPin, Ticket } from "lucide-react"

export function BestStationCard({
  station,
  avgPrice,
  visits,
  userAvgPrice,
  totalDiscount = 0,
}: {
  station: string
  /** Preço efetivo médio pago no posto (já descontados cupons). */
  avgPrice: number
  visits: number
  /** Preço efetivo médio geral do usuário. */
  userAvgPrice: number
  /** Total economizado com cupons neste posto. */
  totalDiscount?: number
}) {
  const saving = userAvgPrice > 0 ? (userAvgPrice - avgPrice) / userAvgPrice : 0
  const savingPct = saving > 0 ? `${(saving * 100).toFixed(0)}% abaixo da sua média` : null

  return (
    <section className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-card p-5 md:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-success/18 blur-3xl"
      />
      <div className="relative flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Melhor posto recente</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success ring-1 ring-success/20">
          <TrendingDown className="size-3" />
          Mais barato
        </span>
      </div>

      <div className="relative flex flex-col gap-1">
        <h3 className="truncate text-lg font-semibold tracking-tight md:text-xl">{station}</h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
          <span>
            {visits} {visits === 1 ? "visita" : "visitas"} nos últimos 90 dias
          </span>
          {totalDiscount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-1.5 py-0.5 text-[11px] font-medium text-success ring-1 ring-success/20">
              <Ticket className="size-3" />
              {formatBRL(totalDiscount)} em cupons
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="label-section">
            {totalDiscount > 0 ? "Preço efetivo" : "Preço médio"}
          </span>
          <span className="num-display text-2xl font-semibold leading-none md:text-3xl">
            {formatBRL(avgPrice)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">/L</span>
          </span>
        </div>
        {savingPct ? (
          <span className="flex items-center gap-1 text-[12px] font-medium text-success">
            <MapPin className="size-3.5" />
            {savingPct}
          </span>
        ) : null}
      </div>
    </section>
  )
}
