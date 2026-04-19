export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatLiters(value: number): string {
  return `${formatNumber(value, 2)} L`
}

export function formatKmPerLiter(value: number): string {
  if (!isFinite(value) || value <= 0) return "—"
  return `${formatNumber(value, 1)} km/L`
}

export function formatPerKm(value: number): string {
  if (!isFinite(value) || value <= 0) return "—"
  return `${formatBRL(value)}/km`
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d)
}

export function formatShortMonth(iso: string): string {
  const d = new Date(iso + "-01T00:00:00")
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(d)
}

export function monthKey(dateIso: string): string {
  return dateIso.slice(0, 7) // YYYY-MM
}
