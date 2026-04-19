"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteEntry } from "@/lib/actions/entries"
import { deleteVehicle } from "@/lib/actions/vehicles"
import { Trash2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

export function DeleteEntryButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
          <span className="sr-only">Excluir</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir abastecimento?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Os cálculos de consumo e custo por km serão recalculados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              startTransition(async () => {
                try {
                  await deleteEntry(id)
                  toast.success("Abastecimento excluído")
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Erro ao excluir")
                }
              })
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteVehicleButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
          <span className="sr-only">Excluir veículo</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os abastecimentos registrados deste veículo também serão excluídos. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              startTransition(async () => {
                try {
                  await deleteVehicle(id)
                  toast.success("Veículo excluído")
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Erro ao excluir")
                }
              })
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
