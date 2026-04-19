import { VehicleDialog } from "./vehicle-dialog"
import { Wallet, Gauge, Target, Flame } from "lucide-react"

/**
 * Premium empty state for the very first visit.
 * Benefit-driven headline, preview of what will be unlocked.
 */
export function NoVehicleEmpty() {
  const bullets = [
    {
      icon: Wallet,
      title: "Gasto real por mês",
      desc: "Ritmo diário e projeção de fechamento.",
    },
    {
      icon: Gauge,
      title: "Consumo verdadeiro",
      desc: "km/L calculado entre tanques cheios.",
    },
    {
      icon: Target,
      title: "Meta com alerta visual",
      desc: "Saiba antes de estourar o orçamento.",
    },
    {
      icon: Flame,
      title: "Etanol ou gasolina",
      desc: "Qual compensa hoje, no seu carro.",
    },
  ]
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <section className="surface-elevated relative overflow-hidden rounded-3xl border border-border p-6 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              Vamos começar
            </span>
            <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-[40px] md:leading-[1.1]">
              Entenda quanto seu carro realmente custa.
            </h1>
            <p className="max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Registre abastecimentos simples e veja consumo real, custo por km, comparação entre
              postos e para onde está indo seu dinheiro todo mês.
            </p>
          </div>

          <div>
            <VehicleDialog canUnsetDefault={false} />
          </div>
        </div>
      </section>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {bullets.map((b) => {
          const Icon = b.icon
          return (
            <div
              key={b.title}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Icon className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3 className="text-[14px] font-medium tracking-tight">{b.title}</h3>
                <p className="text-[12px] leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
