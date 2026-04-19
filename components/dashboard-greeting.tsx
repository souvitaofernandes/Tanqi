import type { Vehicle } from "@/lib/types"
import { hourLocal } from "@/lib/date"

const TZ = "America/Sao_Paulo"

function greetingFor(now = new Date()): string {
  const h = hourLocal(now)
  if (h < 5) return "Boa madrugada"
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

function dateLine(now = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
  })
    .format(now)
    .replace(/^./, (c) => c.toUpperCase())
}

export function DashboardGreeting({ vehicle, firstName }: { vehicle: Vehicle | null; firstName?: string | null }) {
  const salute = greetingFor()
  const subtitle = vehicle
    ? `${vehicle.name}${vehicle.plate ? ` · ${vehicle.plate.toUpperCase()}` : ""}`
    : dateLine()

  return (
    <div className="flex flex-col gap-1">
      <span className="label-micro">{dateLine()}</span>
      <h1 className="text-pretty text-2xl font-semibold tracking-tight md:text-[28px] md:leading-tight">
        {salute}
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
