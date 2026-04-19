import { formatBRL } from "@/lib/format"
import { Ticket, Sparkles } from "lucide-react"

type Props = {
  /** Total economizado com cupons no mês corrente. */
  monthDiscount: number
  /** Gasto bruto do mês (antes de cupons). */
  monthGross: number
  /** Total de abastecimentos com cupom no mês. */
  monthCouponCount: number
  /** Economia acumulada em todo o histórico. */
  allTimeDiscount: number
}

/**
 * Card de economia acumulada com cupons/descontos. Só aparece quando há economia > 0.
 */
export function SavingsCard({ monthDiscount, monthGross, monthCouponCount, allTimeDiscount }: Props) {
  if (monthDiscount <= 0 && allTimeDiscount <= 0) return null
  const pct = monthGross > 0 ? (monthDiscount / monthGross) * 100 : 0
  const hasMonth = monthDiscount > 0

  return (
    <section className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-success/25 bg-gradient-to-br from-success/[0.08] via-card to-card p-5 md:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-success/15 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-success/12 text-success ring-1 ring-inset ring-success/20">
            <Ticket className="size-4" />
          </span>
          <span className="text-sm font-medium text-muted-foreground">Economia com cupons</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success ring-1 ring-inset ring-success/20">
          <Sparkles className="size-3" />
          {hasMonth ? "este mês" : "acumulado"}
        </span>
      </div>

      <div className="relative flex flex-col gap-1">
        <span className="num-display text-3xl font-semibold leading-none text-success md:text-[40px]">
          {formatBRL(hasMonth ? monthDiscount : allTimeDiscount)}
        </span>
        {hasMonth ? (
          <p className="text-[12px] text-muted-foreground">
            {monthCouponCount} {monthCouponCount === 1 ? "abastecimento com desconto" : "abastecimentos com desconto"}
            {pct > 0 && (
              <>
                {" "}
                · <span className="font-medium text-foreground">{pct.toFixed(0)}%</span> do bruto do mês
              </>
            )}
          </p>
        ) : (
          <p className="text-[12px] text-muted-foreground">Sem cupons aplicados este mês — que tal buscar um?</p>
        )}
      </div>

      {hasMonth && allTimeDiscount > monthDiscount && (
        <div className="relative flex items-center justify-between gap-3 border-t border-success/20 pt-3 text-[12px]">
          <span className="text-muted-foreground">Total acumulado</span>
          <span className="num-inline font-semibold text-foreground">{formatBRL(allTimeDiscount)}</span>
        </div>
      )}
    </section>
  )
}
