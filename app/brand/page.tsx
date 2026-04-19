import type { Metadata } from "next"
import Link from "next/link"
import { TanqiGlyph, TanqiMark, TanqiWordmark } from "@/components/tanqi-logo"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

/**
 * /brand — the Tanqi brand system reference page
 *
 * This page is the single source of truth a designer or engineer can hand to
 * a partner, vendor, or new hire. It is NOT a marketing page — there is no
 * hero, no CTAs, no conversion intent. It documents the decisions and shows
 * the primitives at the sizes they're actually used.
 *
 * The content mirrors the inline commentary in tanqi-logo.tsx and
 * globals.css so the code and the brand page can never disagree about what
 * the system is. If a token changes in globals.css it will visibly change
 * here — by design.
 */

export const metadata: Metadata = {
  title: "Brand — Tanqi",
  description: "Brand system: logo, color, typography and motion principles.",
}

// ---------- Color tokens in a display-friendly shape ---------- //
// Each token shows: semantic name, CSS var, role, and (for the ones the brand
// actually commits to) an approximate sRGB hex so it's quotable in a vendor
// deck. Hex values below match the comments in globals.css.
const COLOR_GROUPS: {
  title: string
  description: string
  tokens: {
    name: string
    cssVar: string
    role: string
    // Dark-theme hex (the brand's hero surface). Light is noted in prose
    // because the product is dark-mode first.
    hex: string
  }[]
}[] = [
  {
    title: "Neutrals",
    description:
      "Graphite base. Low chroma keeps the cyan as the only spatial cue of interaction — nothing else in the UI shouts.",
    tokens: [
      { name: "Background", cssVar: "--background", role: "App shell", hex: "#0E1015" },
      { name: "Card", cssVar: "--card", role: "Default surface", hex: "#1C1F28" },
      { name: "Card elevated", cssVar: "--card-elevated", role: "Hero surface", hex: "#242834" },
      { name: "Border", cssVar: "--border", role: "Dividers & input outlines", hex: "#2C303C" },
    ],
  },
  {
    title: "Brand accent",
    description:
      "Electric Cyan. Not a fuel color — a signal-and-data color. Carries cleanly into maintenance, documents, and any future ownership surface without repainting.",
    tokens: [
      { name: "Primary", cssVar: "--primary", role: "Accent, CTAs, active state", hex: "#00D4F0" },
      { name: "Primary pressed", cssVar: "—", role: "Button pressed state", hex: "#00BBDC" },
    ],
  },
  {
    title: "Semantic",
    description:
      "Success, warning, destructive — each a single hue, never gradients. Success doubles as the cupom (coupon-savings) accent.",
    tokens: [
      { name: "Success", cssVar: "--success", role: "Positive delta, savings", hex: "#2FB67B" },
      { name: "Warning", cssVar: "--warning", role: "Nearing budget, incomum", hex: "#E6B341" },
      { name: "Destructive", cssVar: "--destructive", role: "Over budget, delete", hex: "#E85D4E" },
    ],
  },
  {
    title: "Chart roles",
    description:
      "Semantic per fuel type today; ready to be reassigned as the product broadens. The mapping is explicit so future surfaces (insurance class, document type) can reuse chart-4/5 without inventing new colors.",
    tokens: [
      { name: "Chart 1", cssVar: "--chart-1", role: "Gasolina — brand cyan", hex: "#00D4F0" },
      { name: "Chart 2", cssVar: "--chart-2", role: "Etanol — green", hex: "#2FB67B" },
      { name: "Chart 3", cssVar: "--chart-3", role: "GNV — teal-blue", hex: "#3FADC3" },
      { name: "Chart 4", cssVar: "--chart-4", role: "Diesel — slate", hex: "#7F8896" },
      { name: "Chart 5", cssVar: "--chart-5", role: "Neutral — warm sand", hex: "#C8B996" },
    ],
  },
]

const DOS = [
  "Keep the cyan as the single spatial cue of interaction. If everything is cyan, nothing is.",
  "Use JetBrains Mono whenever a number is the protagonist of its cell (KPIs, currency, km).",
  "Pair the Tanqi mark with the wordmark on first surface; reserve the mark alone for app icons and tight spaces.",
  "Use the ‘label-micro’ / ‘label-section’ utilities for all uppercase metadata. They centralize tracking and size.",
  "Let the number do the talking. Big figures live on quiet cards — no icon ornaments, no badges next to them.",
]

const DONTS = [
  "Don’t put the glyph on a non-primary colored background without ring-1 opacity treatment. It reads as a sticker.",
  "Don’t use the cyan as a text color on light backgrounds smaller than 14px; switch to foreground.",
  "Don’t build new chart colors. Reassign chart-1..5 semantics instead.",
  "Don’t add a second display typeface. The brand voice is one sans, one mono. A third face breaks the rhythm.",
  "Don’t use literal fuel iconography (pump, droplet, speedometer). The brand is ownership, not fuel.",
  "Don’t mix gradient stops across temperatures. If a gradient is required, keep it inside cyan → teal range.",
]

export default function BrandPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Backdrop glow — same recipe as the landing, scaled smaller so the
          brand page reads as an internal reference, not a marketing hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] opacity-80"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--primary) 14%, transparent) 0%, transparent 70%)",
        }}
      />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <TanqiWordmark size="md" />
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="mr-1.5 size-3.5" />
            Voltar
          </Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-6 pb-24 pt-6">
        {/* Lead */}
        <section className="flex flex-col gap-4">
          <span className="label-section">Brand system</span>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            The Tanqi system — logo, color, type, motion.
          </h1>
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            A short reference for anyone shipping a surface under the Tanqi name. It documents the primitives, the
            tokens, and the intent behind them. Every value on this page comes from <code className="rounded bg-muted px-1 py-0.5 text-xs">globals.css</code> — change
            the token, change this page.
          </p>
        </section>

        {/* Logo */}
        <Section title="Logo" kicker="Identity">
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            The Tanqi mark is a lowercase “t” with a floating tittle that doubles as a data point. Abstract on purpose:
            the product will live far beyond fuel, and the symbol must carry cleanly into maintenance, documents, and
            every future ownership surface without a redraw.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <BrandTile label="Mark — 32px">
              <TanqiMark sizeClass="size-8" />
            </BrandTile>
            <BrandTile label="Mark — 56px">
              <TanqiMark sizeClass="size-14" />
            </BrandTile>
            <BrandTile label="Mark — 96px">
              <TanqiMark sizeClass="size-24" />
            </BrandTile>
            <BrandTile label="Mark subtle — ring treatment">
              <TanqiMark sizeClass="size-14" subtle />
            </BrandTile>
            <BrandTile label="Glyph — currentColor">
              <TanqiGlyph className="size-12 text-primary" />
            </BrandTile>
            <BrandTile label="Wordmark">
              <TanqiWordmark size="lg" />
            </BrandTile>
          </div>

          <DosAndDonts />
        </Section>

        {/* Color */}
        <Section title="Color" kicker="Tokens">
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Tanqi ships in both light and dark — dark is the hero theme. Light mode uses a darker cyan (deeper than the
            neon one used on graphite) so text-primary and small UI still clear AA on white. Never hand-mix a new cyan;
            always reach for a token.
          </p>
          <div className="flex flex-col gap-8">
            {COLOR_GROUPS.map((g) => (
              <div key={g.title} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="label-section">{g.title}</span>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{g.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {g.tokens.map((t) => (
                    <div key={t.name} className="overflow-hidden rounded-2xl border border-border bg-card">
                      <div
                        aria-hidden
                        className="h-20 w-full"
                        // Using the live CSS var here means this chip will
                        // re-tint whenever the token is edited — this page is
                        // effectively a preview for globals.css.
                        style={{ backgroundColor: `var(${t.cssVar})` }}
                      />
                      <div className="flex flex-col gap-1 p-3">
                        <span className="text-sm font-semibold tracking-tight">{t.name}</span>
                        <span className="text-[11px] text-muted-foreground">{t.role}</span>
                        <span className="num-inline mt-1 font-mono text-[11px] text-muted-foreground">
                          {t.hex} · <span className="text-foreground/80">{t.cssVar}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography" kicker="Voice">
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            One sans, one mono. Plus Jakarta Sans for UI and headlines — geometric, calm, product-led. JetBrains Mono
            for numbers — precise, aligned, not decorative. No third face.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between">
                <span className="label-section">Plus Jakarta Sans</span>
                <span className="text-[11px] text-muted-foreground">font-sans</span>
              </div>
              <p className="text-4xl font-semibold tracking-[-0.02em]">Clareza total.</p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Abastecer é o gasto mais frequente — e o mais fácil de perder de vista.
              </p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Auxiliary copy at 13px / line-height 1.5 reads as UI text. Uppercase labels use the
                <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">label-section</code>
                utility.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between">
                <span className="label-section">JetBrains Mono</span>
                <span className="text-[11px] text-muted-foreground">font-mono · num-display</span>
              </div>
              <p className="num-display text-5xl font-semibold">R$ 612,00</p>
              <p className="num-display text-2xl font-semibold text-muted-foreground">12,4 km/L</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Numbers use <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">num-display</code> for
                KPIs and <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">num-inline</code> for small
                tabular values in lists.
              </p>
            </div>
          </div>

          {/* Label utility showcase */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
            <span className="label-section">Label utilities</span>
            <div className="flex flex-wrap items-baseline gap-6">
              <div className="flex flex-col gap-1">
                <span className="label-micro">label-micro</span>
                <span className="text-[11px] text-muted-foreground">10px · 500 · tracking 0.1em</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="label-section">label-section</span>
                <span className="text-[11px] text-muted-foreground">11px · 500 · tracking 0.1em</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Motion */}
        <Section title="Motion" kicker="Rhythm">
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Tanqi motion is calm and restrained. Short distances, spring-like easing, always under 400ms. Motion must
            communicate a state change, never entertain itself. All animation collapses to instant under
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">prefers-reduced-motion</code>.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <MotionTile
              title="card-enter"
              spec="380ms · cubic-bezier(0.16, 1, 0.3, 1)"
              desc="Fade + 6px rise. Used on dashboard reveal and fresh data cards."
            />
            <MotionTile
              title="pulse-primary"
              spec="1200ms · ease-out · 2 iterations"
              desc="Cyan ring pulse for newly-inserted entities. Self-ending."
            />
            <MotionTile
              title="CountUp"
              spec="650ms · easeOutCubic"
              desc="Tween on the hero KPI and any user-visible big number."
            />
          </div>
        </Section>

        {/* Voice */}
        <Section title="Voice" kicker="Tone">
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Portuguese-first, plain, technical without jargon. No exclamation marks. Numbers appear as real numbers —
            <span className="num-inline font-medium text-foreground"> R$ 612,00</span>,
            <span className="num-inline font-medium text-foreground"> 12,4 km/L</span> — never rounded away. The
            product speaks like a careful owner talks about their own car: honest about costs, confident about data,
            never alarmist.
          </p>
          <ul className="grid gap-2 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
            <li className="rounded-xl border border-border bg-card p-3">
              <strong className="text-foreground">Say “Gasto este mês”</strong>
              <br />
              …not “Despesas acumuladas no período”.
            </li>
            <li className="rounded-xl border border-border bg-card p-3">
              <strong className="text-foreground">Say “custo real por km”</strong>
              <br />
              …not “TCO operacional ponderado”.
            </li>
          </ul>
        </Section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <TanqiWordmark size="sm" />
          <span>Brand system v1</span>
        </div>
      </footer>
    </div>
  )
}

// ---------- Small internal primitives ---------- //

function Section({
  title,
  kicker,
  children,
}: {
  title: string
  kicker: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="label-section">{kicker}</span>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function BrandTile({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="surface-elevated flex min-h-[140px] items-center justify-center p-6">{children}</div>
      <span className="label-section border-t border-border px-4 py-2.5">{label}</span>
    </div>
  )
}

function MotionTile({ title, spec, desc }: { title: string; spec: string; desc: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[13px] font-semibold">{title}</span>
      </div>
      <span className="num-inline font-mono text-[11px] text-muted-foreground">{spec}</span>
      <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  )
}

function DosAndDonts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-3 rounded-2xl border border-success/25 bg-success/[0.03] p-5">
        <span className="label-section text-success">Do</span>
        <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          {DOS.map((d) => (
            <li key={d} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-success" />
              <span className="text-foreground/80">{d}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/[0.03] p-5">
        <span className="label-section text-destructive">Don&apos;t</span>
        <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          {DONTS.map((d) => (
            <li key={d} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-destructive" />
              <span className="text-foreground/80">{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
