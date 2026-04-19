"use client"

import type { FuelEntry, Vehicle } from "@/lib/types"
import { effectivePricePerLiter, netTotal } from "@/lib/fuel-utils"
import { formatBRL, formatNumber } from "@/lib/format"
import { detectBrand } from "@/lib/station-brand"
import { FuelBadge } from "./fuel-badge"
import { Button } from "@/components/ui/button"
import { EntryDialog } from "./entry-dialog"
import { DeleteEntryButton } from "./delete-buttons"
import { AlertTriangle, Gauge, Pencil, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

export type RefuelAnomaly = {
  kind: "price" | "odometer_jump"
  message: string
}

type Props = {
  entry: FuelEntry
  vehicles: Vehicle[]
  siblingEntries: FuelEntry[]
  /** km since previous refuel (undefined if unknown/first). */
  kmSinceLast?: number
  anomaly?: RefuelAnomaly | null
}

function StationBrandBadge({ name }: { name: string | null }) {
  const brand = detectBrand(name)
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold tracking-tight ring-1 ring-inset"
      style={{
        backgroundColor: `color-mix(in oklab, ${brand.tint} 16%, transparent)`,
        color: brand.tint,
        // ring matches tint at lower opacity
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${brand.tint} 28%, transparent)`,
      }}
      aria-hidden
    >
      {brand.initial}
    </div>
  )
}

function DayBadge({ iso }: { iso: string }) {
  const d = new Date(iso + "T00:00:00")
  const day = d.getDate().toString().padStart(2, "0")
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(d)
    .replace(".", "")
    .toUpperCase()
  return (
    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-card-elevated text-center leading-none">
      <span className="num-display text-[18px] font-semibold">{day}</span>
      <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">{month}</span>
    </div>
  )
}

export function RefuelCard({ entry, vehicles, siblingEntries, kmSinceLast, anomaly }: Props) {
  const discount = Number(entry.discount_amount) || 0
  const gross = Number(entry.total_amount) || 0
  const paid = netTotal(entry)
  const effective = effectivePricePerLiter(entry)
  const hasCoupon = discount > 0
  const brand = detectBrand(entry.station_name)
  const discountPct = gross > 0 ? (discount / gross) * 100 : 0

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors md:p-5",
        "hover:border-border/80 hover:bg-card-elevated/60",
        hasCoupon && "border-success/25 bg-linear-to-br from-success/[0.03] to-transparent",
      )}
    >
      {/* Top row: date + station brand + title + paid */}
      <div className="flex items-start gap-3">
        <DayBadge iso={entry.entry_date} />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <FuelBadge type={entry.fuel_type} size="sm" />
            {!entry.full_tank && (
              <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                parcial
              </span>
            )}
            {hasCoupon && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/14 px-1.5 py-0.5 text-[10px] font-medium text-success ring-1 ring-success/25">
                <Ticket className="size-2.5" />
                {discountPct > 0 ? `−${discountPct.toFixed(0)}%` : "cupom"}
              </span>
            )}
            {anomaly && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-warning/14 px-1.5 py-0.5 text-[10px] font-medium text-warning ring-1 ring-warning/25"
                title={anomaly.message}
              >
                <AlertTriangle className="size-2.5" />
                incomum
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StationBrandBadge name={entry.station_name} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-semibold leading-tight">
                {entry.station_name || "Sem nome"}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {brand.key !== "unknown" ? brand.label : "Posto"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="num-display text-lg font-semibold leading-none md:text-xl">{formatBRL(paid)}</span>
          {hasCoupon ? (
            <span className="num-inline text-[11px] text-muted-foreground line-through">{formatBRL(gross)}</span>
          ) : (
            <span className="text-[11px] text-muted-foreground">pago</span>
          )}
          <span className="num-inline mt-0.5 text-[11px] font-medium text-muted-foreground">
            {formatBRL(effective)}/L
          </span>
        </div>
      </div>

      {/* Detail chips row */}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Chip label="Litros" value={`${formatNumber(Number(entry.liters), 2)} L`} />
        <Chip label="Preço bomba" value={`${formatBRL(Number(entry.price_per_liter))}/L`} />
        <Chip
          label="Hodômetro"
          value={`${formatNumber(Number(entry.odometer), 0)} km`}
          icon={<Gauge className="size-3" />}
        />
        <Chip
          label={kmSinceLast != null ? "Rodados" : hasCoupon ? "Economia" : "Tanque"}
          value={
            kmSinceLast != null
              ? `${formatNumber(kmSinceLast, 0)} km`
              : hasCoupon
              ? formatBRL(discount)
              : entry.full_tank
              ? "cheio"
              : "parcial"
          }
          tone={hasCoupon && kmSinceLast == null ? "success" : "default"}
        />
      </dl>

      {/* Notes */}
      {entry.notes && (
        <p className="rounded-lg bg-card-elevated px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
          {entry.notes}
        </p>
      )}

      {/* Actions — always visible on mobile, fade-in on desktop hover */}
      <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2 md:opacity-70 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
        <EntryDialog
          vehicles={vehicles}
          entry={entry}
          siblingEntries={siblingEntries}
          trigger={
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs text-muted-foreground">
              <Pencil className="size-3.5" />
              Editar
            </Button>
          }
        />
        <DeleteEntryButton id={entry.id} />
      </div>
    </article>
  )
}

function Chip({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string
  value: string
  icon?: React.ReactNode
  tone?: "default" | "success"
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-lg border bg-card-elevated/60 px-2.5 py-2",
        tone === "success" ? "border-success/20" : "border-border/60",
      )}
    >
      <dt className="label-micro flex items-center gap-1">
        {icon}
        {label}
      </dt>
      <dd
        className={cn(
          "num-inline text-[13px] font-semibold leading-tight",
          tone === "success" ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  )
}
