"use client"

import { useEffect, useRef, useState } from "react"
import { formatBRL, formatNumber } from "@/lib/format"

/**
 * Tanqi motion — <CountUp />
 *
 * A controlled animated number display. Given a target `value`, it tweens
 * from the previously-rendered value to the new one using `requestAnimationFrame`
 * and a gentle cubic-bezier ease-out curve. On mount it tweens from 0, so the
 * dashboard hero KPI feels like it is "loading in" rather than popping in.
 *
 * Server-Component safe: the component accepts a `variant` string instead of
 * a formatter function. React Server Components forbid passing functions
 * across the RSC boundary (not serializable) — any Server Component that
 * tried to do `format={(v) => formatBRL(v)}` would crash at render time with
 * a generic "An error occurred in the Server Components render" message in
 * production. By taking `variant` + `decimals` + `suffix` we keep every
 * prop serializable so any Server Component can drop this in directly.
 *
 * Why a custom impl (not framer-motion): the product only needs a single
 * primitive — a number tween with a built-in formatter. A full motion
 * library would add ~50kB for one animation. This stays dependency-free.
 *
 * Reduced-motion: when the user prefers reduced motion, the target value is
 * applied instantly. This matches the CSS-level `@media (prefers-reduced-motion)`
 * rule defined in globals.css and keeps the accessibility behavior consistent
 * across both CSS-driven and JS-driven motion in the product.
 */

type CountUpVariant = "brl" | "int" | "decimal"

type CountUpProps = {
  /** The target number. Must be finite. */
  value: number
  /** How the animated number is rendered:
   *   - "brl"     → "R$ 1.234,56" (always 2 decimals, via formatBRL)
   *   - "int"     → "1.234"       (zero decimals, pt-BR grouping)
   *   - "decimal" → "12,3"        (use `decimals`, pt-BR grouping)
   *  Defaults to "int". */
  variant?: CountUpVariant
  /** Decimals for variant="decimal". Ignored otherwise. Defaults to 1. */
  decimals?: number
  /** Optional static suffix appended after the number, e.g. " km/L". */
  suffix?: string
  /** Total tween duration in ms. Defaults to 650 — long enough to register
   *  as "value is updating" but short enough to never feel sluggish. */
  durationMs?: number
  /** Minimum absolute delta before animating. Tiny changes (e.g. sub-1-cent)
   *  snap to the new value to avoid flickering the final digit. Defaults to 0. */
  minDelta?: number
  /** Forwarded className — typically the `num-display` / `num-inline` utility
   *  plus layout/size/color classes. */
  className?: string
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Internal formatter — pure function over serializable inputs. Kept inside
 * the client bundle so Server Components don't need to pass anything more
 * than primitive values.
 */
function formatValue(n: number, variant: CountUpVariant, decimals: number) {
  switch (variant) {
    case "brl":
      return formatBRL(n)
    case "decimal":
      return formatNumber(n, decimals)
    case "int":
    default:
      return formatNumber(n, 0)
  }
}

export function CountUp({
  value,
  variant = "int",
  decimals = 1,
  suffix,
  durationMs = 650,
  minDelta = 0,
  className,
}: CountUpProps) {
  // On first render we intentionally start at 0 so the component tweens UP to
  // `value` on mount — this is the whole point of the component per its
  // JSDoc. Initializing `display` at `value` would short-circuit the effect
  // below because `delta === 0`, and the dashboard hero's headline KPI would
  // pop in instead of loading in. We also seed the "previous value" ref to 0
  // so the first effect run has a real delta to animate over.
  const [display, setDisplay] = useState<number>(0)
  // Keep the "previous rendered value" in a ref, not in state, so updates to
  // `value` read the current tween position (not the stale closure).
  const fromRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Skip any tween if the user prefers reduced motion — snap instantly.
    if (prefersReducedMotion()) {
      fromRef.current = value
      setDisplay(value)
      return
    }

    const from = fromRef.current
    const to = value
    const delta = Math.abs(to - from)

    if (delta <= minDelta) {
      fromRef.current = to
      setDisplay(to)
      return
    }

    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      const eased = easeOutCubic(t)
      const current = from + (to - from) * eased
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // We intentionally depend only on `value` — config props shouldn't retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <span className={className}>
      {formatValue(display, variant, decimals)}
      {suffix}
    </span>
  )
}
