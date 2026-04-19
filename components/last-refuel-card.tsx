import type { FuelEntry } from "@/lib/types"
import { FuelBadge } from "./fuel-badge"
import { formatBRL, formatDate, formatNumber } from "@/lib/format"
import { netTotal } from "@/lib/fuel-utils"
import { MapPin, Gauge, Ticket } from "lucide-react"

function daysAgo(iso: string): number {
  const d = new Date(iso + "T00:00:00")
  const now = new Date()
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)))
}

function relative(iso: string): string {
  const d = daysAgo(iso)
  if (d === 0) return "Hoje"
  if (d === 1) return "Ontem"
  if (d < 7) return `Há ${d} dias`
  return formatDate(iso)
}

export function LastRefuelCard({ entry }: { entry: FuelEntry | null }) {
  if (!entry) return null
  const discount = Number(entry.discount_amount) || 0
  const paid = netTotal(entry)
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Último abastecimento</span>
        <span className="text-[11px] font-medium text-muted-foreground">{relative(entry.entry_date)}</span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-3">
          <span className="num-display text-3xl font-semibold leading-none md:text-[40px]">{formatBRL(paid)}</span>
          <FuelBadge type={entry.fuel_type} size="md" />
        </div>
        {discount > 0 && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="line-through">{formatBRL(Number(entry.total_amount))}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-1.5 py-0.5 text-[11px] font-medium text-success ring-1 ring-success/20">
              <Ticket className="size-3" />
              economia de {formatBRL(discount)}
            </span>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-left">
        <div className="flex flex-col gap-0.5">
          <dt className="label-section">Litros</dt>
          <dd className="num-inline text-sm font-medium">
            {formatNumber(Number(entry.liters), 2)} L
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="label-section">Preço/L</dt>
          <dd className="num-inline text-sm font-medium">
            {formatBRL(Number(entry.price_per_liter))}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="label-section">Tanque</dt>
          <dd className="text-sm font-medium">{entry.full_tank ? "Cheio" : "Parcial"}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{entry.station_name || "Sem posto informado"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Gauge className="size-3.5" />
          <span className="num-inline">{formatNumber(Number(entry.odometer), 0)} km</span>
        </span>
      </div>
    </section>
  )
}
