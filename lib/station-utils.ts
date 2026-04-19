import type { FuelEntry } from "./types"

/**
 * Normalizes a station name for matching:
 * - trims, lowercases
 * - collapses whitespace
 * - strips diacritics
 * - strips trivial punctuation
 */
export function normalizeStation(raw: string | null | undefined): string {
  if (!raw) return ""
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Returns the canonical display name for a station using the MOST RECENT spelling
 * the user typed for the same normalized key (preserves casing / accents).
 */
export function canonicalStationName(entries: FuelEntry[], normalizedKey: string): string {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i]
    if (normalizeStation(e.station_name) === normalizedKey) {
      return (e.station_name || "").trim()
    }
  }
  return normalizedKey
}

/**
 * Attempts to find an existing station name that matches the input.
 * Returns the canonical (user-preferred) name if found, otherwise the trimmed input.
 */
export function reconcileStationName(input: string, entries: FuelEntry[]): string {
  const trimmed = (input || "").trim()
  if (!trimmed) return ""
  const key = normalizeStation(trimmed)
  if (!key) return trimmed
  // If we've seen this normalized key before, reuse the most recent spelling the user typed
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i]
    if (normalizeStation(e.station_name) === key) {
      return (e.station_name || "").trim()
    }
  }
  return trimmed
}

/**
 * Levenshtein distance for fuzzy station matching.
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array(b.length + 1)
  const curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }
  return prev[b.length]
}

/**
 * Returns top station suggestions for autocomplete based on user's own history.
 * - Exact prefix matches first
 * - Then fuzzy matches with Levenshtein distance
 * Output is deduped by normalized key, preserving the canonical display name.
 */
export function suggestStations(entries: FuelEntry[], input: string, limit = 5): string[] {
  const seen = new Map<string, { display: string; score: number; uses: number }>()
  const q = normalizeStation(input)
  for (const e of entries) {
    const display = (e.station_name || "").trim()
    if (!display) continue
    const key = normalizeStation(display)
    const prev = seen.get(key)
    const uses = (prev?.uses ?? 0) + 1
    let score = prev?.score ?? Infinity
    if (!q) {
      score = Math.min(score, 0)
    } else if (key.startsWith(q)) {
      score = Math.min(score, 0)
    } else if (key.includes(q)) {
      score = Math.min(score, 1)
    } else {
      score = Math.min(score, levenshtein(key, q))
    }
    seen.set(key, { display, score, uses })
  }
  return [...seen.values()]
    .filter((v) => (q ? v.score <= Math.max(2, Math.floor(q.length / 3)) : true))
    .sort((a, b) => a.score - b.score || b.uses - a.uses)
    .slice(0, limit)
    .map((v) => v.display)
}

/**
 * Unique list of stations the user already used (for datalist fallback).
 */
export function uniqueStations(entries: FuelEntry[]): string[] {
  const map = new Map<string, string>()
  for (const e of entries) {
    const display = (e.station_name || "").trim()
    if (!display) continue
    const key = normalizeStation(display)
    if (!map.has(key)) map.set(key, display)
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, "pt-BR"))
}
