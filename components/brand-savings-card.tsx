import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { BrandSavings } from "@/lib/analytics"
import { formatBRL } from "@/lib/format"

/**
 * "Onde você mais economiza" — ranks brand groups by total cupom savings.
 * Hidden when there are no savings at all in the input set.
 */
export function BrandSavingsCard({ brands }: { brands: BrandSavings[] }) {
  const withSavings = brands.filter((b) => b.savings > 0).slice(0, 5)
  if (withSavings.length === 0) return null
  const max = Math.max(...withSavings.map((b) => b.savings))

  return (
    <Card>
      <CardHeader>
        {/* Part of the unified "Economia com cupons" copy family. The scope
            qualifier here is "por marca" — same concept as SavingsCard /
            SavingsSummary, just grouped differently. */}
        <CardTitle className="text-base">Economia com cupons por marca</CardTitle>
        <CardDescription>Onde seu cupom rende mais</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {withSavings.map((b) => {
            const pct = max > 0 ? (b.savings / max) * 100 : 0
            return (
              <li key={b.brand.key} className="flex flex-col gap-2 px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold"
                      style={{
                        color: b.brand.tint,
                        backgroundColor: `color-mix(in oklab, ${b.brand.tint} 18%, transparent)`,
                      }}
                    >
                      {b.brand.initial}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{b.brand.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {b.visits} {b.visits === 1 ? "abastecimento" : "abastecimentos"} · {formatBRL(b.avgEffective)}/L efetivo
                      </span>
                    </div>
                  </div>
                  <span className="num-inline shrink-0 text-sm font-semibold text-success">
                    −{formatBRL(b.savings)}
                  </span>
                </div>
                {/* Progress bars used to be aria-hidden which hid savings
                    magnitude from screen-reader users entirely. Now exposed
                    as a proper progressbar relative to the top brand. */}
                <div
                  role="progressbar"
                  aria-label={`Economia relativa em ${b.brand.label}`}
                  aria-valuenow={Math.round(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
