import { ArrowRight, Ticket } from "lucide-react"
import { formatBRL, formatNumber } from "@/lib/format"

type Props = {
  /** Gasto bruto no período (sem cupons). */
  gross: number
  /** Total efetivamente pago (líquido). */
  paid: number
  /** Total economizado com cupons. */
  savings: number
  /** Quantidade de abastecimentos com cupom. */
  couponEntries: number
  /** Total de abastecimentos no período. */
  totalEntries: number
}

/**
 * Premium savings banner. Shown when there's at least some cupom savings in
 * the selected period. Tells a simple story: you could have paid X, you paid
 * Y, you saved Z (P%).
 */
export function SavingsSummary({ gross, paid, savings, couponEntries, totalEntries }: Props) {
  if (savings <= 0) return null
  const pct = gross > 0 ? (savings / gross) * 100 : 0
  const couponCoverage = totalEntries > 0 ? (couponEntries / totalEntries) * 100 : 0

  return (
    <section
      aria-label="Economia com cupons no período"
      className="surface-elevated relative overflow-hidden rounded-2xl border border-success/25 p-5 md:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success ring-1 ring-success/20">
            <Ticket className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            {/* Unified label across the savings family — SavingsCard (dashboard),
                SavingsSummary (reports), BrandSavingsCard (reports) all read as
                "Economia com cupons" with a scope qualifier, so a user never
                sees the same concept under two different headers. */}
            <span className="label-section">Economia com cupons</span>
            <h3 className="num-display text-3xl font-semibold text-success md:text-4xl">
              −{formatBRL(savings)}
            </h3>
            <p className="text-pretty text-xs text-muted-foreground">
              {formatNumber(pct, 1)}% do gasto bruto no período · cupom em {couponEntries} de {totalEntries}{" "}
              {totalEntries === 1 ? "abastecimento" : "abastecimentos"} ({formatNumber(couponCoverage, 0)}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
          <div className="flex flex-col items-start">
            <span className="label-micro">Bruto</span>
            <span className="num-inline font-medium text-muted-foreground line-through">{formatBRL(gross)}</span>
          </div>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex flex-col items-start">
            <span className="label-micro">Pago</span>
            <span className="num-inline font-semibold">{formatBRL(paid)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
