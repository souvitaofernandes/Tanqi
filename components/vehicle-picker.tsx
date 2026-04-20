"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Car, ChevronsUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import type { Vehicle } from "@/lib/types"

type VehiclePickerProps = {
  vehicles: Vehicle[]
  activeId: string | null
}

export function VehiclePicker(props: VehiclePickerProps) {
  return (
    <Suspense fallback={<VehiclePickerFallback />}>
      <VehiclePickerImpl {...props} />
    </Suspense>
  )
}

function VehiclePickerFallback() {
  return (
    <Button variant="outline" size="sm" className="max-w-[220px] gap-2" disabled>
      <Car className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate text-left font-medium text-muted-foreground">Carregando…</span>
      <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground/60" />
    </Button>
  )
}

function VehiclePickerImpl({
  vehicles,
  activeId,
}: VehiclePickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const active = vehicles.find((v) => v.id === activeId)

  function handleSelect(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("v", id)
    router.push(`${pathname}?${params.toString()}`)
  }

  if (vehicles.length === 0) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/vehicles">
          <Plus className="mr-1 size-4" />
          Adicionar veículo
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* `title` surfaces the full vehicle name on hover for users whose
            nicknames exceed the 220px truncation (e.g. "Honda Fit do meu pai
            (placa ABC-1234)"). Small polish flagged in the QA audit. */}
        <Button
          variant="outline"
          size="sm"
          className="max-w-[220px] gap-2"
          title={active?.name ?? undefined}
        >
          <Car className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-left font-medium">{active?.name ?? "Selecionar veículo"}</span>
          <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Seus veículos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {vehicles.map((v) => (
          <DropdownMenuItem key={v.id} onClick={() => handleSelect(v.id)} className="flex-col items-start gap-0.5">
            <span className="font-medium">{v.name}</span>
            {(v.make || v.model || v.plate) && (
              <span className="text-xs text-muted-foreground">
                {[v.make, v.model, v.plate].filter(Boolean).join(" · ")}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/vehicles" className="cursor-pointer">
            <Plus className="mr-1 size-4" />
            Gerenciar veículos
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
