import type { FuelEntry, Vehicle } from "@/lib/types"
import { FUEL_LABEL } from "@/lib/types"
import { formatBRL } from "@/lib/format"
import { computeVehicleStats, formatPlate, timeSinceLabel } from "@/lib/vehicle-utils"
import { VehicleActionsMenu } from "@/components/vehicle-actions-menu"
import { Car, Star, Fuel, Gauge, Activity, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export function VehicleCard({
  vehicle,
  entries,
  totalVehicles,
}: {
  vehicle: Vehicle
  entries: FuelEntry[]
  totalVehicles: number
}) {
  const stats = computeVehicleStats(vehicle, entries)
  const isDefault = vehicle.is_default
  const plate = vehicle.plate ? formatPlate(vehicle.plate) : null

  const details = [vehicle.make, vehicle.model, vehicle.year && `${vehicle.year}`].filter(Boolean).join(" · ")

  const budgetPct = stats.budgetUsagePct
  const budgetTone =
    budgetPct == null
      ? "muted"
      : budgetPct >= 1
        ? "danger"
        : budgetPct >= 0.85
          ? "warning"
          : "success"

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card transition-colors",
        isDefault
          ? "border-primary/40 ring-1 ring-primary/20 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
          : "border-border hover:border-border/80",
      )}
    >
      {/* Header band */}
      <div
        className={cn(
          "relative flex items-start justify-between gap-3 border-b border-border/60 p-5",
          isDefault
            ? "bg-gradient-to-br from-primary/12 via-primary/5 to-transparent"
            : "bg-gradient-to-br from-muted/40 to-transparent",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              isDefault ? "bg-primary text-primary-foreground shadow-sm" : "bg-background text-foreground ring-1 ring-border",
            )}
          >
            <Car className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold tracking-tight">{vehicle.name}</h3>
              {isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  <Star className="size-2.5 fill-current" />
                  Padrão
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {details || "Sem detalhes cadastrados"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plate && (
            <div
              className={cn(
                "hidden rounded-md border px-2 py-1 font-mono text-xs font-semibold tracking-widest sm:block",
                "border-foreground/25 bg-background text-foreground shadow-[inset_0_-1px_0_color-mix(in_oklab,var(--foreground)_10%,transparent)]",
              )}
              aria-label={`Placa ${plate}`}
            >
              {plate}
            </div>
          )}
          <VehicleActionsMenu vehicle={vehicle} totalVehicles={totalVehicles} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {plate && (
          <div className="mb-4 flex items-center justify-between sm:hidden">
            <span className="label-section">Placa</span>
            <span className="rounded-md border border-foreground/25 bg-background px-2 py-0.5 font-mono text-xs font-semibold tracking-widest">
              {plate}
            </span>
          </div>
        )}

        {stats.entriesCount === 0 ? (
          <div className="flex flex-col items-start gap-1 rounded-xl border border-dashed border-border bg-card-elevated/40 p-4">
            <p className="text-sm font-medium">Ainda sem abastecimentos</p>
            <p className="text-xs text-muted-foreground">
              Registre o primeiro abastecimento deste veículo para desbloquear consumo e custo por km.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Stat
              icon={Gauge}
              label="Consumo"
              value={stats.avgConsumption > 0 ? stats.avgConsumption.toFixed(1) : "—"}
              unit={stats.avgConsumption > 0 ? "km/L" : undefined}
            />
            <Stat
              icon={Activity}
              label="Custo/km"
              value={stats.costPerKm > 0 ? formatBRL(stats.costPerKm) : "—"}
            />
            <Stat
              icon={Calendar}
              label="Km rodados"
              value={stats.kmTraveled > 0 ? stats.kmTraveled.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : "—"}
              unit={stats.kmTraveled > 0 ? "km" : undefined}
            />
          </div>
        )}

        {/* Footer: budget + meta row */}
        <div className="mt-4 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {vehicle.monthly_budget && Number(vehicle.monthly_budget) > 0 ? (
                <BudgetRow
                  spent={stats.monthSpend}
                  budget={Number(vehicle.monthly_budget)}
                  pct={budgetPct ?? 0}
                  tone={budgetTone}
                />
              ) : (
                <div className="flex flex-col gap-0.5">
                  <span className="label-section">
                    Gasto este mês
                  </span>
                  <span className="font-mono text-base font-semibold tabular-nums tracking-tight">
                    {stats.monthSpend > 0 ? formatBRL(stats.monthSpend) : "R$ 0,00"}
                  </span>
                </div>
              )}
            </div>

            {(stats.mainFuel || stats.lastEntryDate) && (
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                {stats.mainFuel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <Fuel className="size-3" />
                    {FUEL_LABEL[stats.mainFuel]}
                  </span>
                )}
                {stats.lastEntryDate && (
                  <span className="text-[11px] text-muted-foreground">
                    Último: {timeSinceLabel(stats.lastEntryDate)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  unit?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 label-section">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-lg font-semibold tabular-nums tracking-tight">{value}</span>
        {unit && <span className="text-[11px] font-medium text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

function BudgetRow({
  spent,
  budget,
  pct,
  tone,
}: {
  spent: number
  budget: number
  pct: number
  tone: "muted" | "success" | "warning" | "danger"
}) {
  const cappedPct = Math.min(pct, 1)
  const overflow = pct > 1
  const barColor =
    tone === "danger"
      ? "bg-destructive"
      : tone === "warning"
        ? "bg-warning"
        : tone === "success"
          ? "bg-primary"
          : "bg-muted-foreground"

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="label-section">Meta mensal</span>
        <span className={cn(
          "text-[11px] font-semibold tabular-nums",
          tone === "danger" && "text-destructive",
          tone === "warning" && "text-warning",
        )}>
          {Math.round(pct * 100)}%
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width]", barColor)}
          style={{ width: `${cappedPct * 100}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums">{formatBRL(spent)}</span>
        <span className={cn(
          "text-[11px] text-muted-foreground tabular-nums",
          overflow && "text-destructive",
        )}>
          de {formatBRL(budget)}
        </span>
      </div>
    </div>
  )
}
