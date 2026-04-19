export type FuelType = "gasolina" | "etanol" | "gnv" | "diesel"

export type Vehicle = {
  id: string
  user_id: string
  name: string
  make: string | null
  model: string | null
  year: number | null
  plate: string | null
  initial_odometer: number
  monthly_budget: number | null
  is_default: boolean
  created_at: string
}

export type FuelEntry = {
  id: string
  user_id: string
  vehicle_id: string
  entry_date: string // ISO date
  fuel_type: FuelType
  station_name: string | null
  price_per_liter: number
  liters: number
  total_amount: number
  /** Cupom / desconto aplicado no pagamento (R$). Sempre >= 0 e <= total_amount. */
  discount_amount: number
  odometer: number
  full_tank: boolean
  notes: string | null
  created_at: string
}

export const FUEL_LABEL: Record<FuelType, string> = {
  gasolina: "Gasolina",
  etanol: "Etanol",
  gnv: "GNV",
  diesel: "Diesel",
}
