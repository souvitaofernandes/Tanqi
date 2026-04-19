import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  TrendingDown,
  BarChart3,
  Gauge,
  Wallet,
  Wrench,
  FileText,
  ArrowRight,
} from "lucide-react"
import { TanqiWordmark } from "@/components/tanqi-logo"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect("/dashboard")

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Backdrop glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] opacity-90"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--primary) 20%, transparent) 0%, transparent 70%)",
        }}
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <TanqiWordmark size="md" />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/auth/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Criar conta</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-24 px-6 pb-20 pt-12 md:pt-20">
        <section className="flex flex-col items-start gap-8 md:gap-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Inteligência para o custo real do seu carro
          </div>
          <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.02em] md:text-[4.5rem] md:leading-[1.02]">
            Clareza total.{" "}
            <span className="text-primary">Sobre cada quilômetro.</span>
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Tanqi organiza tudo que envolve ter um carro — abastecimentos, consumo, gastos e, em breve, manutenções e
            documentos — numa leitura precisa, em reais, do custo real de rodar. Do abastecimento à decisão.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="/auth/sign-up">
                Começar agora
                <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">Já tenho conta</Link>
            </Button>
          </div>

          {/* Product mock stripe — all three metrics are fuel-native and ship
              TODAY. The "Saúde do carro" card was removed: it advertised a
              maintenance feature the product doesn't have yet, which would
              mislead users on sign-up. The broader platform story lives
              explicitly in the "Em breve" section below. */}
          <div className="mt-6 w-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur md:p-8">
            <div className="grid gap-4 md:grid-cols-3">
              <MockMetric label="Gasto do mês" value="R$ 612" sub="−8% vs média dos últimos 3 meses" tone="success" />
              <MockMetric label="Custo por km" value="R$ 0,52" sub="real operacional, atualizado a cada tanque" />
              <MockMetric label="Consumo médio" value="11,8 km/L" sub="calculado tanque cheio a tanque cheio" />
            </div>
          </div>
        </section>

        {/* Today vs. soon — explicitly positions Tanqi as a platform, not a
            single-purpose tool. The "em breve" cards signal the broader scope
            without overpromising features that don't exist yet. */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="label-section">O que Tanqi faz</span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Começamos pelo que você já sente no bolso.
            </h2>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Abastecer é o gasto mais frequente — e o mais fácil de perder de vista. Tanqi transforma cada
              abastecimento em informação útil sobre o seu carro.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Gauge className="size-5" />}
              title="Consumo médio real"
              desc="km/L calculado de tanque cheio a tanque cheio, sem adivinhação."
            />
            <FeatureCard
              icon={<BarChart3 className="size-5" />}
              title="Custo por km"
              desc="Descubra quanto cada quilômetro realmente pesa no bolso, com ou sem cupom."
            />
            <FeatureCard
              icon={<TrendingDown className="size-5" />}
              title="Comparação entre postos"
              desc="Veja onde o litro sai mais barato e evite armadilhas de preço."
            />
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <span className="label-section text-muted-foreground/80">Em breve</span>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              Tanqi está sendo construído para ir muito além do abastecimento. Os próximos módulos ampliam a mesma ideia
              para outras áreas da propriedade do carro.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ComingSoonCard
              icon={<Wrench className="size-5" />}
              title="Manutenções e revisões"
              desc="Lembretes inteligentes por quilometragem e tempo. Histórico centralizado de cada serviço."
            />
            <ComingSoonCard
              icon={<FileText className="size-5" />}
              title="Documentos e renovações"
              desc="IPVA, licenciamento e seguro em um só lugar, com avisos antes do vencimento."
            />
            <ComingSoonCard
              icon={<Wallet className="size-5" />}
              title="Custo total de propriedade"
              desc="Combustível, manutenção, documentos, seguro — o custo real por mês e por km, reunido."
            />
          </div>
        </section>

        <section className="surface-elevated overflow-hidden rounded-2xl border border-primary/25 p-8 md:p-12">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Tudo do seu carro, em ordem. Pelo tempo que você tiver ele.
              </h2>
              <p className="text-pretty leading-relaxed text-muted-foreground">
                Cadastre quantos veículos quiser — carro da família, moto, híbrido, flex. Tanqi aprende o padrão de cada
                um e devolve clareza sobre o que você gasta, como usa e quando cuidar.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/auth/sign-up">
                Criar conta gratuita
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <TanqiWordmark size="sm" />
          <span>Inteligência para o custo real do seu carro</span>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">{icon}</div>
      <div className="space-y-1">
        <h3 className="font-medium tracking-tight">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

function ComingSoonCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-dashed border-border/80 bg-card/40 p-5">
      <div className="absolute right-4 top-4">
        <span className="label-micro rounded-full border border-border/70 bg-background/60 px-2 py-0.5">
          Em breve
        </span>
      </div>
      <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">{icon}</div>
      <div className="space-y-1">
        <h3 className="font-medium tracking-tight">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

function MockMetric({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone?: "success"
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/40 p-4">
      <span className="label-section">{label}</span>
      <span className="num-display text-2xl font-medium md:text-3xl">{value}</span>
      <span className={tone === "success" ? "text-xs text-success" : "text-xs text-muted-foreground"}>{sub}</span>
    </div>
  )
}
