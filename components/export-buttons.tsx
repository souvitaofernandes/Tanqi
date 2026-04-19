"use client"

import { Button } from "@/components/ui/button"
import { buildReportHTML, downloadCSV, entriesToCSV } from "@/lib/export-utils"
import type { FuelEntry, Vehicle } from "@/lib/types"
import { FileDown, Printer } from "lucide-react"
import { toast } from "sonner"

export function ExportButtons({ entries, vehicle }: { entries: FuelEntry[]; vehicle: Vehicle | null }) {
  function handleCSV() {
    if (entries.length === 0) {
      toast.error("Sem abastecimentos para exportar")
      return
    }
    const csv = entriesToCSV(entries, vehicle)
    const slug = (vehicle?.name ?? "tanqi").toLowerCase().replace(/\s+/g, "-")
    downloadCSV(csv, `${slug}-abastecimentos.csv`)
    toast.success("CSV exportado")
  }

  function handlePrint() {
    if (entries.length === 0) {
      toast.error("Sem abastecimentos para o relatório")
      return
    }
    const html = buildReportHTML(entries, vehicle)
    const w = window.open("", "_blank")
    if (!w) {
      toast.error("Bloqueador de pop-up impediu abrir o relatório")
      return
    }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 400)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleCSV}>
        <FileDown className="size-4" />
        <span className="hidden sm:inline">Exportar CSV</span>
        <span className="sm:hidden">CSV</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="size-4" />
        <span className="hidden sm:inline">Relatório PDF</span>
        <span className="sm:hidden">PDF</span>
      </Button>
    </div>
  )
}
