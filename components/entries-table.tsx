import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FuelEntry, Vehicle } from "@/lib/types"
import { formatBRL, formatDate, formatNumber } from "@/lib/format"
import { netTotal } from "@/lib/fuel-utils"
import { FuelBadge } from "./fuel-badge"
import { EntryDialog } from "./entry-dialog"
import { DeleteEntryButton } from "./delete-buttons"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Pencil, Fuel, Gauge, Ticket } from "lucide-react"

export function EntriesTable({
  entries,
  vehicles,
}: {
  entries: FuelEntry[]
  vehicles: Vehicle[]
}) {
  if (entries.length === 0) {
    return (
      <Empty className="border border-dashed border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Fuel className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Nenhum abastecimento registrado</EmptyTitle>
          <EmptyDescription>
            Registre seu primeiro abastecimento para começar a ver métricas.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.entry_date === b.entry_date) return b.odometer - a.odometer
    return b.entry_date.localeCompare(a.entry_date)
  })

  return (
    <>
      {/* Mobile: stacked cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {sorted.map((e) => {
          const disc = Number(e.discount_amount) || 0
          const paid = netTotal(e)
          return (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs transition-colors hover:border-border/70 hover:bg-card-elevated/60"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <FuelBadge type={e.fuel_type} size="sm" />
                <span className="text-xs text-muted-foreground">{formatDate(e.entry_date)}</span>
                {!e.full_tank && (
                  <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                    parcial
                  </span>
                )}
                {disc > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-1.5 py-0.5 text-[10px] font-medium text-success ring-1 ring-inset ring-success/20">
                    <Ticket className="size-2.5" />
                    cupom
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium">{e.station_name || "Sem nome"}</span>
                <div className="flex flex-col items-end">
                  <span className="num-inline shrink-0 text-base font-semibold tabular-nums">
                    {formatBRL(paid)}
                  </span>
                  {disc > 0 && (
                    <span className="num-inline text-[10px] text-muted-foreground line-through tabular-nums">
                      {formatBRL(Number(e.total_amount))}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="num-inline">
                  {formatNumber(Number(e.liters), 2)} L · {formatBRL(Number(e.price_per_liter))}/L
                </span>
                <span className="flex items-center gap-1">
                  <Gauge className="size-3" />
                  <span className="num-inline">{formatNumber(Number(e.odometer), 0)} km</span>
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <EntryDialog
                vehicles={vehicles}
                entry={e}
                siblingEntries={entries}
                trigger={
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                    <Pencil className="size-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                }
              />
              <DeleteEntryButton id={e.id} />
            </div>
          </li>
          )
        })}
      </ul>

      {/* Desktop: data table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/70 bg-muted/30 hover:bg-muted/30">
              {/* Column headers share the same typographic rhythm as every
                  other label in the product: 11px Plus Jakarta Sans, uppercase,
                  tracked to 0.1em, muted-foreground. `label-section` centralizes
                  the recipe so this row can never drift against the micro
                  labels inside the cards. */}
              <TableHead className="label-section h-10">Data</TableHead>
              <TableHead className="label-section h-10">Combustível</TableHead>
              <TableHead className="label-section h-10">Posto</TableHead>
              <TableHead className="label-section h-10 text-right">Preço/L</TableHead>
              <TableHead className="label-section h-10 text-right">Litros</TableHead>
              <TableHead className="label-section h-10 text-right">Total</TableHead>
              <TableHead className="label-section hidden h-10 text-right lg:table-cell">Hodômetro</TableHead>
              <TableHead className="label-section h-10 w-[90px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((e) => {
              const disc = Number(e.discount_amount) || 0
              const paid = netTotal(e)
              return (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap font-medium">{formatDate(e.entry_date)}</TableCell>
                <TableCell>
                  <FuelBadge type={e.fuel_type} />
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{e.station_name ?? "—"}</span>
                    {disc > 0 && (
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-1.5 py-0.5 text-[10px] font-medium text-success ring-1 ring-inset ring-success/20"
                        title={`Cupom aplicado: ${formatBRL(disc)}`}
                      >
                        <Ticket className="size-2.5" />
                        {formatBRL(disc).replace("R$", "").trim()}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="num-inline text-right">{formatBRL(Number(e.price_per_liter))}</TableCell>
                <TableCell className="num-inline text-right">{formatNumber(Number(e.liters), 2)} L</TableCell>
                <TableCell className="num-inline text-right font-semibold">
                  <div className="flex flex-col items-end">
                    <span>{formatBRL(paid)}</span>
                    {disc > 0 && (
                      <span className="text-[10px] font-normal text-muted-foreground line-through">
                        {formatBRL(Number(e.total_amount))}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="num-inline hidden text-right text-muted-foreground lg:table-cell">
                  {formatNumber(Number(e.odometer), 0)} km
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EntryDialog
                      vehicles={vehicles}
                      entry={e}
                      siblingEntries={entries}
                      trigger={
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                          <Pencil className="size-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      }
                    />
                    <DeleteEntryButton id={e.id} />
                  </div>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
