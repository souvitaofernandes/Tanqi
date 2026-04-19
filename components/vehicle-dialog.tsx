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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState, useTransition } from "react"
import { createVehicle, updateVehicle } from "@/lib/actions/vehicles"
import { toast } from "sonner"
import type { Vehicle } from "@/lib/types"
import { Loader2, Plus, Pencil, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { isValidPlate } from "@/lib/vehicle-utils"

type Props = {
  vehicle?: Vehicle
  trigger?: React.ReactNode
  canUnsetDefault?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CURRENT_YEAR = new Date().getFullYear()

export function VehicleDialog({
  vehicle,
  trigger,
  canUnsetDefault = false,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const isEdit = !!vehicle
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [pending, startTransition] = useTransition()

  const [name, setName] = useState(vehicle?.name ?? "")
  const [make, setMake] = useState(vehicle?.make ?? "")
  const [model, setModel] = useState(vehicle?.model ?? "")
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : "")
  const [plate, setPlate] = useState(vehicle?.plate ?? "")
  const [initialOdo, setInitialOdo] = useState(vehicle?.initial_odometer ? String(vehicle.initial_odometer) : "")
  const [budget, setBudget] = useState(vehicle?.monthly_budget ? String(vehicle.monthly_budget) : "")
  const [isDefault, setIsDefault] = useState(vehicle?.is_default ?? !isEdit)

  // Validation
  const plateValid = isValidPlate(plate)
  const yearNum = year ? Number.parseInt(year, 10) : null
  const yearValid = !yearNum || (yearNum >= 1900 && yearNum <= CURRENT_YEAR + 1)
  const budgetNum = budget ? Number.parseFloat(budget.replace(",", ".")) : null
  const budgetValid = budgetNum == null || (Number.isFinite(budgetNum) && budgetNum >= 0)
  const odoNum = initialOdo ? Number.parseFloat(initialOdo.replace(",", ".")) : null
  const odoValid = odoNum == null || (Number.isFinite(odoNum) && odoNum >= 0)

  const canSubmit = name.trim().length > 0 && plateValid && yearValid && budgetValid && odoValid

  function reset() {
    if (isEdit) return
    setName("")
    setMake("")
    setModel("")
    setYear("")
    setPlate("")
    setInitialOdo("")
    setBudget("")
    setIsDefault(true)
  }

  function handlePlateChange(raw: string) {
    // Auto-uppercase and strip invalid chars, limit to 7 alnum
    const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 7)
    setPlate(clean)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const payload = {
      name: name.trim(),
      make: make.trim() || null,
      model: model.trim() || null,
      year: yearNum,
      plate: plate.trim() || null,
      initial_odometer: odoNum ?? 0,
      monthly_budget: budgetNum,
      is_default: isDefault,
    }
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateVehicle(vehicle!.id, payload)
          toast.success("Veículo atualizado")
        } else {
          await createVehicle(payload)
          toast.success("Veículo adicionado")
        }
        setOpen(false)
        reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            {isEdit ? <Pencil className="mr-1.5 size-4" /> : <Plus className="mr-1.5 size-4" />}
            {isEdit ? "Editar" : "Adicionar veículo"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="border-b border-border/60 bg-card-elevated/50 px-6 py-5">
          <DialogTitle className="text-lg">{isEdit ? "Editar veículo" : "Novo veículo"}</DialogTitle>
          <DialogDescription className="text-sm">
            {isEdit
              ? "Ajuste as informações e preferências deste veículo."
              : "Comece pelo apelido — o resto pode ser preenchido depois."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 py-5 max-h-[75vh] overflow-y-auto">
          {/* Section: identification */}
          <Section title="Identificação">
            <Field label="Apelido" required htmlFor="name">
              <Input
                id="name"
                placeholder="Meu Civic"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!isEdit}
                required
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Marca" htmlFor="make">
                <Input id="make" placeholder="Honda" value={make} onChange={(e) => setMake(e.target.value)} />
              </Field>
              <Field label="Modelo" htmlFor="model">
                <Input id="model" placeholder="Civic" value={model} onChange={(e) => setModel(e.target.value)} />
              </Field>
              <Field
                label="Ano"
                htmlFor="year"
                error={year && !yearValid ? `Entre 1900 e ${CURRENT_YEAR + 1}` : undefined}
              >
                <Input
                  id="year"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="2022"
                  value={year}
                  onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  aria-invalid={!!(year && !yearValid)}
                />
              </Field>
            </div>

            <Field
              label="Placa"
              htmlFor="plate"
              error={plate.length > 0 && !plateValid ? "Use o formato ABC-1234 ou ABC1D23" : undefined}
              hint={plate.length === 0 ? "Opcional — formato brasileiro antigo ou Mercosul" : undefined}
            >
              <Input
                id="plate"
                placeholder="ABC1D23"
                value={plate}
                onChange={(e) => handlePlateChange(e.target.value)}
                className="font-mono uppercase tracking-widest"
                aria-invalid={plate.length > 0 && !plateValid}
              />
            </Field>
          </Section>

          {/* Section: usage & goals */}
          <Section title="Uso e metas">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Hodômetro inicial"
                htmlFor="odo"
                hint="km atuais — usados como base para cálculos"
                error={initialOdo && !odoValid ? "Valor inválido" : undefined}
              >
                <div className="relative">
                  <Input
                    id="odo"
                    inputMode="decimal"
                    placeholder="0"
                    value={initialOdo}
                    onChange={(e) => setInitialOdo(e.target.value)}
                    className="pr-10"
                    aria-invalid={!!(initialOdo && !odoValid)}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    km
                  </span>
                </div>
              </Field>

              <Field
                label="Orçamento mensal"
                htmlFor="budget"
                hint="deixe em branco para não definir meta"
                error={budget && !budgetValid ? "Valor inválido" : undefined}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="budget"
                    inputMode="decimal"
                    placeholder="800,00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="pl-9"
                    aria-invalid={!!(budget && !budgetValid)}
                  />
                </div>
              </Field>
            </div>

            <div
              className={cn(
                "flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
                isDefault ? "border-primary/40 bg-primary/5" : "border-border bg-card-elevated/60",
              )}
            >
              <div className="flex min-w-0 flex-col">
                <Label htmlFor="def" className="text-sm font-medium">
                  Usar como padrão
                </Label>
                <span className="text-xs text-muted-foreground">
                  {!canUnsetDefault && !isEdit
                    ? "Necessário para o primeiro veículo"
                    : isDefault
                      ? "Aparece primeiro em todo o app"
                      : "Outro veículo é o padrão atual"}
                </span>
              </div>
              <Switch
                id="def"
                checked={isDefault}
                onCheckedChange={setIsDefault}
                disabled={!canUnsetDefault && !isEdit}
              />
            </div>
          </Section>
        </form>

        <DialogFooter className="border-t border-border/60 bg-card-elevated/50 px-6 py-4 sm:justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || !canSubmit} onClick={handleSubmit}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? "Salvar alterações" : "Adicionar veículo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="size-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
