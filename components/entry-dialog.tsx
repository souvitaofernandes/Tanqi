"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useMemo, useState, useTransition, useEffect, useRef } from "react"
import { createEntry, updateEntry } from "@/lib/actions/entries"
import { toast } from "sonner"
import type { FuelEntry, FuelType, Vehicle } from "@/lib/types"
import { FUEL_LABEL } from "@/lib/types"
import { Loader2, Plus, Pencil, AlertTriangle, Flame, Info, Ticket, X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { formatBRL, formatNumber } from "@/lib/format"
import { suggestStations } from "@/lib/station-utils"
import { validateEntry, type ValidationWarning } from "@/lib/validation"
import { todayIsoLocal } from "@/lib/date"

type Props = {
  vehicles: Vehicle[]
  defaultVehicleId?: string
  entry?: FuelEntry
  trigger?: React.ReactNode
  /** Entries for the active vehicle — used for autocomplete + inline validation */
  siblingEntries?: FuelEntry[]
}

const FUEL_OPTIONS = (Object.entries(FUEL_LABEL) as [FuelType, string][]).map(([value, label]) => ({ value, label }))

function parseDecimal(s: string): number {
  if (!s) return NaN
  return Number.parseFloat(s.replace(",", "."))
}

export function EntryDialog({ vehicles, defaultVehicleId, entry, trigger, siblingEntries = [] }: Props) {
  const isEdit = !!entry
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const [vehicleId, setVehicleId] = useState(entry?.vehicle_id ?? defaultVehicleId ?? vehicles[0]?.id ?? "")
  // Timezone-safe "today" anchored to São Paulo. Using `toISOString().slice(0,10)`
  // here would mis-attribute entries logged between 21:00 and 00:00 BRT to the
  // NEXT day (UTC rollover), silently corrupting monthly totals. See lib/date.ts.
  const [date, setDate] = useState(entry?.entry_date ?? todayIsoLocal())
  const [fuelType, setFuelType] = useState<FuelType>(entry?.fuel_type ?? "gasolina")
  const [station, setStation] = useState(entry?.station_name ?? "")
  const [stationFocus, setStationFocus] = useState(false)
  const [price, setPrice] = useState(entry ? String(entry.price_per_liter) : "")
  const [liters, setLiters] = useState(entry ? String(entry.liters) : "")
  const [total, setTotal] = useState(entry ? String(entry.total_amount) : "")
  const [odometer, setOdometer] = useState(entry ? String(entry.odometer) : "")
  const [fullTank, setFullTank] = useState(entry?.full_tank ?? true)
  const [notes, setNotes] = useState(entry?.notes ?? "")
  const [lastEdited, setLastEdited] = useState<"price-liters" | "total" | null>(null)

  // Coupon: only shown when user opens it or is editing an entry that already has a discount
  const initialDiscount = entry?.discount_amount ? String(entry.discount_amount) : ""
  const [discount, setDiscount] = useState(initialDiscount)
  const [showCoupon, setShowCoupon] = useState(!!initialDiscount)

  const stationRef = useRef<HTMLInputElement>(null)

  // Last odometer for the current vehicle, for smart placeholder and suggestion
  const lastOdometerForVehicle = useMemo(() => {
    const list = siblingEntries
      .filter((e) => e.vehicle_id === vehicleId && e.id !== entry?.id)
      .map((e) => Number(e.odometer))
    if (list.length === 0) {
      const v = vehicles.find((x) => x.id === vehicleId)
      return v?.initial_odometer ? Number(v.initial_odometer) : null
    }
    return Math.max(...list)
  }, [siblingEntries, vehicleId, entry?.id, vehicles])

  const odometerPlaceholder = useMemo(() => {
    if (!lastOdometerForVehicle) return "Ex: 45320"
    return `${Math.round(lastOdometerForVehicle + 500).toLocaleString("pt-BR")}`
  }, [lastOdometerForVehicle])

  const stationSuggestions = useMemo(() => {
    if (!stationFocus) return []
    return suggestStations(siblingEntries, station, 5)
  }, [siblingEntries, station, stationFocus])

  // Auto-calc: price × liters → total; or total ÷ price → liters
  useEffect(() => {
    const p = parseDecimal(price)
    const l = parseDecimal(liters)
    if (lastEdited === "price-liters" && p > 0 && l > 0) {
      setTotal((p * l).toFixed(2))
    }
  }, [price, liters, lastEdited])

  useEffect(() => {
    const p = parseDecimal(price)
    const t = parseDecimal(total)
    if (lastEdited === "total" && p > 0 && t > 0) {
      setLiters((t / p).toFixed(3))
    }
  }, [total, price, lastEdited])

  const totalNum = parseDecimal(total)
  const discountNum = parseDecimal(discount)
  const validDiscount = isFinite(discountNum) && discountNum > 0 ? discountNum : 0
  const netTotal = isFinite(totalNum) && totalNum > 0 ? Math.max(0, totalNum - validDiscount) : 0
  const effectivePrice = useMemo(() => {
    const l = parseDecimal(liters)
    if (!(l > 0) || !(netTotal > 0)) return null
    return netTotal / l
  }, [liters, netTotal])

  // Live validation warnings (only shown when key fields filled)
  const liveWarnings: ValidationWarning[] = useMemo(() => {
    const p = parseDecimal(price)
    const l = parseDecimal(liters)
    const t = parseDecimal(total)
    const o = parseDecimal(odometer)
    if (!vehicleId || !(p > 0) || !(l > 0) || !(t > 0) || !(o >= 0)) return []
    return validateEntry(
      {
        entry_date: date,
        fuel_type: fuelType,
        station_name: station || null,
        price_per_liter: p,
        liters: l,
        total_amount: t,
        discount_amount: validDiscount,
        odometer: o,
      },
      siblingEntries.filter((e) => e.vehicle_id === vehicleId),
      entry?.id,
    )
  }, [
    vehicleId,
    date,
    fuelType,
    station,
    price,
    liters,
    total,
    odometer,
    validDiscount,
    siblingEntries,
    entry?.id,
  ])

  function reset() {
    if (isEdit) return
    setVehicleId(defaultVehicleId ?? vehicles[0]?.id ?? "")
    setDate(todayIsoLocal())
    setFuelType("gasolina")
    setStation("")
    setPrice("")
    setLiters("")
    setTotal("")
    setOdometer("")
    setFullTank(true)
    setNotes("")
    setLastEdited(null)
    setDiscount("")
    setShowCoupon(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      vehicle_id: vehicleId,
      entry_date: date,
      fuel_type: fuelType,
      station_name: station || null,
      price_per_liter: parseDecimal(price),
      liters: parseDecimal(liters),
      total_amount: parseDecimal(total),
      discount_amount: validDiscount,
      odometer: parseDecimal(odometer),
      full_tank: fullTank,
      notes: notes || null,
    }

    if (!payload.vehicle_id) {
      toast.error("Selecione um veículo")
      return
    }
    if (!payload.price_per_liter || !payload.liters || !payload.total_amount || !(payload.odometer >= 0)) {
      toast.error("Preencha todos os valores")
      return
    }
    if (payload.discount_amount > payload.total_amount) {
      toast.error("Desconto maior que o valor total")
      return
    }

    // Show a loading toast immediately — this fires before `startTransition`
    // has even scheduled the server action, so on slow networks the user
    // never sees a silent "nothing is happening" gap between clicking Save
    // and the dashboard rerendering. Sonner replaces the same toast id with
    // the final success/error state (M11 in the QA audit: optimistic UI).
    const toastId = toast.loading(isEdit ? "Salvando alterações…" : "Salvando abastecimento…")
    startTransition(async () => {
      try {
        if (isEdit) {
          const r = await updateEntry(entry!.id, payload)
          toast.success(
            payload.discount_amount > 0
              ? `Atualizado — você pagou ${formatBRL(payload.total_amount - payload.discount_amount)}`
              : "Abastecimento atualizado",
            { id: toastId },
          )
          if (r?.warnings?.length) toast.warning(r.warnings[0].message)
        } else {
          const r = await createEntry(payload)
          toast.success(
            payload.discount_amount > 0
              ? `Registrado — economia de ${formatBRL(payload.discount_amount)}`
              : "Abastecimento registrado",
            { id: toastId },
          )
          if (r?.warnings?.length) toast.warning(r.warnings[0].message)
        }
        setOpen(false)
        reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar", { id: toastId })
      }
    })
  }

  const disabled = vehicles.length === 0

  const estimatedConsumption = useMemo(() => {
    const o = parseDecimal(odometer)
    const l = parseDecimal(liters)
    if (!(o > 0) || !(l > 0) || !lastOdometerForVehicle || !fullTank) return null
    const delta = o - lastOdometerForVehicle
    if (delta <= 0) return null
    return { delta, kmPerL: delta / l }
  }, [odometer, liters, lastOdometerForVehicle, fullTank])

  const discountOverTotal = totalNum > 0 && validDiscount > totalNum
  const discountPct = totalNum > 0 && validDiscount > 0 ? (validDiscount / totalNum) * 100 : 0

  const formBody = (
    <form onSubmit={handleSubmit} className="grid gap-4 px-1">
      {/* Primary row: fuel + date */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="fuel">Combustível</Label>
          <Select value={fuelType} onValueChange={(v) => setFuelType(v as FuelType)}>
            <SelectTrigger id="fuel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FUEL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayIsoLocal()}
            min="1990-01-01"
            required
          />
        </div>
      </div>

      {vehicles.length > 1 && (
        <div className="grid gap-1.5">
          <Label htmlFor="vehicle">Veículo</Label>
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger id="vehicle">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Station with autocomplete from history */}
      <div className="grid gap-1.5">
        <Label htmlFor="station">Posto</Label>
        <div className="relative">
          <Input
            id="station"
            ref={stationRef}
            value={station}
            onChange={(e) => setStation(e.target.value)}
            onFocus={() => setStationFocus(true)}
            onBlur={() => setTimeout(() => setStationFocus(false), 120)}
            placeholder="Ex: Posto Shell Centro"
            autoComplete="off"
          />
          {stationSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
              {stationSuggestions.map((s) => (
                <button
                  type="button"
                  key={s}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setStation(s)
                    setStationFocus(false)
                    stationRef.current?.blur()
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price / liters / total */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="price">Preço/L</Label>
          <Input
            id="price"
            inputMode="decimal"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value)
              setLastEdited("price-liters")
            }}
            placeholder="5,49"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="liters">Litros</Label>
          <Input
            id="liters"
            inputMode="decimal"
            value={liters}
            onChange={(e) => {
              setLiters(e.target.value)
              setLastEdited("price-liters")
            }}
            placeholder="40,00"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="total">Total da bomba</Label>
          <Input
            id="total"
            inputMode="decimal"
            value={total}
            onChange={(e) => {
              setTotal(e.target.value)
              setLastEdited("total")
            }}
            placeholder="219,60"
            required
          />
        </div>
      </div>

      {/* Coupon section — collapsed by default */}
      {!showCoupon ? (
        <button
          type="button"
          onClick={() => setShowCoupon(true)}
          className="group flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Ticket className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Tem cupom de desconto?</span>
              <span className="text-xs text-muted-foreground">Shell Box, Petrobras Premmia, nota fiscal…</span>
            </div>
          </div>
          <span className="text-xs font-medium text-primary group-hover:underline">Adicionar</span>
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Ticket className="size-4 text-primary" />
              <Label htmlFor="discount" className="text-sm font-medium">
                Cupom / desconto
              </Label>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCoupon(false)
                setDiscount("")
              }}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Remover cupom"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id="discount"
              inputMode="decimal"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="10,00"
              className="pl-9"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Valor abatido no pagamento. O preço da bomba fica registrado intacto — o app recalcula o que você realmente
            pagou.
          </p>
          {discountOverTotal && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertTriangle className="size-3.5" />
              Desconto maior que o valor total.
            </p>
          )}
        </div>
      )}

      {/* Odometer with smart hint */}
      <div className="grid gap-1.5">
        <div className="flex items-end justify-between gap-2">
          <Label htmlFor="odometer">Hodômetro (km)</Label>
          {lastOdometerForVehicle != null && (
            <button
              type="button"
              onClick={() => setOdometer(String(Math.round(lastOdometerForVehicle + 500)))}
              className="text-xs font-medium text-primary hover:underline"
            >
              Sugerir {Math.round(lastOdometerForVehicle + 500).toLocaleString("pt-BR")}
            </button>
          )}
        </div>
        <Input
          id="odometer"
          inputMode="decimal"
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          placeholder={odometerPlaceholder}
          required
        />
        {lastOdometerForVehicle != null && (
          <p className="text-xs text-muted-foreground">
            Último registrado: {Math.round(lastOdometerForVehicle).toLocaleString("pt-BR")} km
          </p>
        )}
      </div>

      {/* Full tank */}
      <label
        htmlFor="full"
        className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border bg-card-elevated px-4 py-3"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Tanque cheio</span>
          <span className="text-xs text-muted-foreground">
            Essencial para calcular consumo médio (km/L) entre tanques.
          </span>
        </div>
        <Switch id="full" checked={fullTank} onCheckedChange={setFullTank} />
      </label>

      {/* Inline feedback */}
      {estimatedConsumption && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
          <Flame className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            Estimativa deste tanque:{" "}
            <span className="font-semibold">{formatNumber(estimatedConsumption.kmPerL, 1)} km/L</span> em{" "}
            {formatNumber(estimatedConsumption.delta, 0)} km.
          </div>
        </div>
      )}
      {liveWarnings.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {liveWarnings.map((w, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3 text-sm",
                w.severity === "error"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-warning/30 bg-warning/10 text-warning",
              )}
            >
              {w.severity === "error" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              ) : (
                <Info className="mt-0.5 size-4 shrink-0" />
              )}
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="grid gap-1.5">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Viagem, manutenção, etc."
          rows={2}
        />
      </div>

      {/* Receipt preview */}
      {totalNum > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card-elevated p-4 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total da bomba</span>
            <span className="num-inline tabular-nums">{formatBRL(totalNum)}</span>
          </div>
          {validDiscount > 0 && (
            <div className="flex items-center justify-between text-success">
              <span className="flex items-center gap-1.5">
                <Ticket className="size-3.5" />
                Desconto {discountPct > 0 ? `(${discountPct.toFixed(0)}%)` : ""}
              </span>
              <span className="num-inline tabular-nums">− {formatBRL(validDiscount)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
            <span className="font-medium">Você pagou</span>
            <span className="num-display text-lg font-semibold tabular-nums">{formatBRL(netTotal)}</span>
          </div>
          {validDiscount > 0 && effectivePrice != null && (
            <p className="text-xs text-muted-foreground">
              Preço efetivo: <span className="font-medium text-foreground">{formatBRL(effectivePrice)}/L</span>
            </p>
          )}
        </div>
      )}
    </form>
  )

  const title = isEdit ? "Editar abastecimento" : "Novo abastecimento"
  const description = "Preencha preço, litros ou valor total — calculamos o que faltar automaticamente."

  const triggerEl =
    trigger ?? (
      <Button disabled={disabled}>
        {isEdit ? <Pencil className="mr-1 size-4" /> : <Plus className="mr-1 size-4" />}
        {isEdit ? "Editar" : "Novo abastecimento"}
      </Button>
    )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerEl}</DrawerTrigger>
        <DrawerContent className="max-h-[92svh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-2">{formBody}</div>
          <DrawerFooter className="flex-row gap-2 border-t border-border">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" disabled={pending} onClick={handleSubmit}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Salvar" : "Registrar"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerEl}</DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {formBody}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? "Salvar" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
