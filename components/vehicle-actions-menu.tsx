"use client"

import { useState, useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { MoreVertical, Pencil, Star, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { deleteVehicle, setDefaultVehicle } from "@/lib/actions/vehicles"
import type { Vehicle } from "@/lib/types"
import { VehicleDialog } from "@/components/vehicle-dialog"

export function VehicleActionsMenu({
  vehicle,
  totalVehicles,
}: {
  vehicle: Vehicle
  totalVehicles: number
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const canDelete = totalVehicles > 1 || !vehicle.is_default
  // A user should always have at least one vehicle that is default, so deleting
  // the only vehicle is allowed (it just becomes "no vehicles" again).
  const canDeleteFinal = totalVehicles > 0

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label="Abrir menu do veículo"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" />
            Editar
          </DropdownMenuItem>
          {!vehicle.is_default && (
            <DropdownMenuItem
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await setDefaultVehicle(vehicle.id)
                    toast.success("Veículo padrão atualizado")
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Erro")
                  }
                })
              }}
            >
              <Star className="mr-2 size-4" />
              Tornar padrão
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            disabled={!canDeleteFinal}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog (controlled) */}
      <VehicleDialog
        vehicle={vehicle}
        canUnsetDefault={canDelete}
        open={editOpen}
        onOpenChange={setEditOpen}
        trigger={<span className="hidden" />}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {vehicle.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os abastecimentos deste veículo também serão excluídos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                startTransition(async () => {
                  try {
                    await deleteVehicle(vehicle.id)
                    toast.success("Veículo excluído")
                    setDeleteOpen(false)
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Erro ao excluir")
                  }
                })
              }}
            >
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
