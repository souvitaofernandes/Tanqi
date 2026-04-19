import { VehicleDialog } from "@/components/vehicle-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Car, Gauge, Target, Receipt } from "lucide-react"

export function VehiclesEmpty() {
  return (
    <div className="surface-elevated relative overflow-hidden rounded-3xl border border-border p-6 md:p-10">
      {/* Soft ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-60 rounded-full bg-chart-3/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Car className="size-6" />
          </div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Seu primeiro carro no Tanqi
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            Cadastre seu veículo e comece a entender o custo real do dia a dia. Quanto mais abastecimentos você
            registrar, mais preciso fica o consumo e o custo por km.
          </p>
          <div className="mt-5">
            <VehicleDialog
              canUnsetDefault={false}
              trigger={
                <Button size="lg" className="gap-2">
                  <Plus className="size-4" />
                  Adicionar veículo
                </Button>
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:w-auto md:max-w-sm md:grid-cols-1">
          <BenefitRow icon={Gauge} title="Consumo real" hint="km/L entre tanques cheios" />
          <BenefitRow icon={Receipt} title="Custo por km" hint="quanto cada quilômetro custa" />
          <BenefitRow icon={Target} title="Meta mensal" hint="alerta quando passar do orçamento" />
        </div>
      </div>
    </div>
  )
}

function BenefitRow({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-[14px] font-medium tracking-tight">{title}</h3>
        <p className="text-[12px] leading-relaxed text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}
