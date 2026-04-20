import type { FuelEntry } from "./types"
import { normalizeStation } from "./station-utils"
import { PRICE_ANOMALY_SIGMA, ODOMETER_JUMP_KM } from "./constants"

export type ValidationWarning = {
  code:
    | "odometer_decreasing"
    | "odometer_far_jump"
    | "possible_duplicate"
    | "price_anomaly"
    | "discount_invalid"
    | "date_out_of_range"
    | "price_out_of_range"
    | "liters_out_of_range"
    | "odometer_out_of_range"
  severity: "error" | "warning"
  message: string
}

// Sanity ranges — catch obvious typos even on the very first entry, before we
// have enough history to do statistical anomaly detection.
const PRICE_MIN = 1
const PRICE_MAX = 30
const LITERS_MAX = 300
const ODOMETER_MAX = 2_000_000

type ValidateInput = {
  entry_date: string
  fuel_type: FuelEntry["fuel_type"]
  station_name: string | null
  price_per_liter: number
  liters: number
  total_amount: number
  discount_amount?: number
  odometer: number
}

/**
 * Runs validation and returns a list of warnings/errors for a candidate entry.
 * `previous` should be all entries for the SAME vehicle.
 * `excludeId` is used when editing, to avoid matching the entry against itself.
 */
export function validateEntry(
  input: ValidateInput,
  previous: FuelEntry[],
  excludeId?: string,
): ValidationWarning[] {
  const warnings: ValidationWarning[] = []
  const others = previous.filter((e) => e.id !== excludeId)

  // Date bounds — no future dates beyond tomorrow, no ancient dates.
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowIso = tomorrow.toISOString().slice(0, 10)
  if (input.entry_date > tomorrowIso) {
    warnings.push({
      code: "date_out_of_range",
      severity: "error",
      message: "Data no futuro — não dá pra registrar um abastecimento que ainda não aconteceu.",
    })
  } else if (input.entry_date < "1990-01-01") {
    warnings.push({
      code: "date_out_of_range",
      severity: "error",
      message: "Data muito antiga — confira o ano digitado.",
    })
  }

  // Sanity ranges on numeric fields — block obviously bad typos.
  if (input.price_per_liter < PRICE_MIN || input.price_per_liter > PRICE_MAX) {
    warnings.push({
      code: "price_out_of_range",
      severity: "error",
      message: `Preço por litro fora do esperado (entre R$ ${PRICE_MIN.toFixed(2)} e R$ ${PRICE_MAX.toFixed(2)}). Verifique a vírgula.`,
    })
  }
  if (input.liters <= 0 || input.liters > LITERS_MAX) {
    warnings.push({
      code: "liters_out_of_range",
      severity: "error",
      message: `Litros fora do esperado (até ${LITERS_MAX} L). Tanque normal raramente passa de 80 L.`,
    })
  }
  if (input.odometer < 0 || input.odometer > ODOMETER_MAX) {
    warnings.push({
      code: "odometer_out_of_range",
      severity: "error",
      message: `Hodômetro fora do esperado (até ${ODOMETER_MAX.toLocaleString("pt-BR")} km).`,
    })
  }

  // Discount must never exceed total
  const discount = Number(input.discount_amount) || 0
  if (discount < 0) {
    warnings.push({
      code: "discount_invalid",
      severity: "error",
      message: "Desconto não pode ser negativo.",
    })
  }
  if (discount > 0 && discount > input.total_amount) {
    warnings.push({
      code: "discount_invalid",
      severity: "error",
      message: "Desconto maior que o valor total do abastecimento.",
    })
  }

  // Odometer validation vs the nearest entry BEFORE this entry's date
  const sortedAsc = [...others].sort((a, b) => {
    if (a.entry_date === b.entry_date) return a.odometer - b.odometer
    return a.entry_date.localeCompare(b.entry_date)
  })

  const priorEntries = sortedAsc.filter(
    (e) => e.entry_date < input.entry_date || (e.entry_date === input.entry_date && e.odometer < input.odometer),
  )
  const laterEntries = sortedAsc.filter(
    (e) => e.entry_date > input.entry_date || (e.entry_date === input.entry_date && e.odometer > input.odometer),
  )

  const prev = priorEntries[priorEntries.length - 1]
  const next = laterEntries[0]

  if (prev && input.odometer < Number(prev.odometer)) {
    warnings.push({
      code: "odometer_decreasing",
      severity: "error",
      message: `Hodômetro menor que o abastecimento anterior (${Number(prev.odometer).toLocaleString("pt-BR")} km em ${prev.entry_date}).`,
    })
  }
  if (next && input.odometer > Number(next.odometer)) {
    warnings.push({
      code: "odometer_decreasing",
      severity: "error",
      message: `Hodômetro maior que o próximo abastecimento (${Number(next.odometer).toLocaleString("pt-BR")} km em ${next.entry_date}).`,
    })
  }

  if (prev && input.odometer >= Number(prev.odometer)) {
    const delta = input.odometer - Number(prev.odometer)
    if (delta > ODOMETER_JUMP_KM) {
      warnings.push({
        code: "odometer_far_jump",
        severity: "warning",
        message: `Mais de ${delta.toLocaleString("pt-BR")} km desde o último abastecimento — confere?`,
      })
    }
  }

  // Duplicate detection: same date, same fuel type, same station, same liters (±0.1 L) or same total (±R$0,50)
  const nkey = normalizeStation(input.station_name)
  const dup = others.find((e) => {
    if (e.entry_date !== input.entry_date) return false
    if (e.fuel_type !== input.fuel_type) return false
    if (nkey && normalizeStation(e.station_name) !== nkey) return false
    const litersClose = Math.abs(Number(e.liters) - input.liters) <= 0.1
    const totalClose = Math.abs(Number(e.total_amount) - input.total_amount) <= 0.5
    return litersClose || totalClose
  })
  if (dup) {
    warnings.push({
      code: "possible_duplicate",
      severity: "warning",
      message: "Já existe um abastecimento muito parecido neste dia. Parece duplicado?",
    })
  }

  // Price anomaly detection: more than 2 standard deviations above/below same fuel price history
  const sameFuel = others.filter((e) => e.fuel_type === input.fuel_type).map((e) => Number(e.price_per_liter))
  if (sameFuel.length >= 5) {
    const mean = sameFuel.reduce((s, v) => s + v, 0) / sameFuel.length
    const variance = sameFuel.reduce((s, v) => s + (v - mean) ** 2, 0) / sameFuel.length
    const sd = Math.sqrt(variance)
    if (sd > 0) {
      const z = (input.price_per_liter - mean) / sd
      if (z > PRICE_ANOMALY_SIGMA) {
        warnings.push({
          code: "price_anomaly",
          severity: "warning",
          message: `Preço ${((input.price_per_liter / mean - 1) * 100).toFixed(0)}% acima da sua média histórica.`,
        })
      } else if (z < -PRICE_ANOMALY_SIGMA) {
        warnings.push({
          code: "price_anomaly",
          severity: "warning",
          message: `Preço bem abaixo da sua média — ótimo achado ou erro de digitação?`,
        })
      }
    }
  }

  return warnings
}

export function hasBlockingError(warnings: ValidationWarning[]): boolean {
  return warnings.some((w) => w.severity === "error")
}
