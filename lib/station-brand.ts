/**
 * Detects a station brand from its free-text name so we can render a consistent
 * brand badge in lists and cards. This is a lightweight inference — the user
 * types the station name themselves, so we never persist the brand.
 *
 * Known brands use a distinct color derived from the existing design tokens
 * (chart-1..5). Unknown brands fall back to a neutral "Posto" chip.
 */
import { normalizeStation } from "./station-utils"

export type BrandKey =
  | "shell"
  | "ipiranga"
  | "petrobras"
  | "ale"
  | "raizen"
  | "br"
  | "esso"
  | "unknown"

export type BrandInfo = {
  key: BrandKey
  label: string
  /** Short initial used when a logo isn't available. */
  initial: string
  /** CSS color expression suitable for `color:` and bg mixing. */
  tint: string
}

const BRANDS: Array<{ key: BrandKey; label: string; initial: string; tint: string; patterns: RegExp[] }> = [
  {
    key: "shell",
    label: "Shell",
    initial: "S",
    // warm yellow-red — sits well on dark theme and matches Shell's identity
    tint: "oklch(0.75 0.17 55)",
    patterns: [/\bshell\b/, /\bshell box\b/, /\braizen shell\b/],
  },
  {
    key: "ipiranga",
    label: "Ipiranga",
    initial: "I",
    tint: "oklch(0.62 0.18 30)", // Ipiranga red
    patterns: [/\bipiranga\b/, /\bam pm\b/, /\bampm\b/],
  },
  {
    key: "petrobras",
    label: "Petrobras",
    initial: "P",
    tint: "oklch(0.62 0.15 150)", // Petrobras green
    patterns: [/\bpetrobras\b/, /\bpremmia\b/, /\bbr mania\b/],
  },
  {
    key: "br",
    label: "BR",
    initial: "BR",
    tint: "oklch(0.62 0.15 150)",
    patterns: [/\bposto br\b/, /^\s*br\s+/, /\bvibra\b/],
  },
  {
    key: "ale",
    label: "Alesat",
    initial: "A",
    tint: "oklch(0.72 0.15 60)",
    patterns: [/\balesat\b/, /\bale\b(?!\w)/, /\bposto ale\b/],
  },
  {
    key: "raizen",
    label: "Raízen",
    initial: "R",
    tint: "oklch(0.68 0.14 80)",
    patterns: [/\braizen\b/],
  },
  {
    key: "esso",
    label: "Esso",
    initial: "E",
    tint: "oklch(0.58 0.17 260)",
    patterns: [/\besso\b/],
  },
]

const UNKNOWN: BrandInfo = {
  key: "unknown",
  label: "Posto",
  initial: "P",
  tint: "oklch(0.62 0.03 260)",
}

/**
 * Returns the inferred brand for a station name, or "unknown" when nothing matches.
 */
export function detectBrand(stationName: string | null | undefined): BrandInfo {
  const n = normalizeStation(stationName)
  if (!n) return UNKNOWN
  for (const b of BRANDS) {
    if (b.patterns.some((p) => p.test(n))) {
      const { key, label, initial, tint } = b
      return { key, label, initial, tint }
    }
  }
  return UNKNOWN
}
