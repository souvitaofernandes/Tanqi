import type { FuelEntry, Vehicle } from "./types"
import { FUEL_LABEL } from "./types"
import { formatBRL, formatDate, formatKmPerLiter, formatNumber, formatPerKm } from "./format"
import { computeSummary, netTotal } from "./fuel-utils"

export function entriesToCSV(entries: FuelEntry[], vehicle?: Vehicle | null): string {
  const header = [
    "Data",
    "Veiculo",
    "Combustivel",
    "Posto",
    "Preco/L (R$)",
    "Litros",
    "Total bruto (R$)",
    "Cupom (R$)",
    "Total pago (R$)",
    "Hodometro (km)",
    "Tanque cheio",
    "Observacoes",
  ]
  const rows = entries.map((e) => [
    e.entry_date,
    vehicle?.name ?? e.vehicle_id,
    FUEL_LABEL[e.fuel_type],
    e.station_name ?? "",
    Number(e.price_per_liter).toFixed(3),
    Number(e.liters).toFixed(3),
    Number(e.total_amount).toFixed(2),
    (Number(e.discount_amount) || 0).toFixed(2),
    netTotal(e).toFixed(2),
    Number(e.odometer).toFixed(1),
    e.full_tank ? "Sim" : "Nao",
    (e.notes ?? "").replace(/[\r\n]+/g, " "),
  ])
  const escape = (s: unknown) => {
    const str = String(s ?? "")
    if (str.includes(";") || str.includes('"') || str.includes(",")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  return [header, ...rows].map((r) => r.map(escape).join(";")).join("\n")
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function buildReportHTML(entries: FuelEntry[], vehicle: Vehicle | null): string {
  const summary = computeSummary(entries)
  const rows = entries
    .slice()
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    .map((e) => {
      const disc = Number(e.discount_amount) || 0
      const paid = netTotal(e)
      const totalCell =
        disc > 0
          ? `${formatBRL(paid)} <span class="sub">(cupom −${formatBRL(disc)})</span>`
          : formatBRL(Number(e.total_amount))
      return `
        <tr>
          <td>${formatDate(e.entry_date)}</td>
          <td>${FUEL_LABEL[e.fuel_type]}</td>
          <td>${e.station_name ?? "—"}</td>
          <td class="num">${formatBRL(Number(e.price_per_liter))}</td>
          <td class="num">${formatNumber(Number(e.liters), 2)} L</td>
          <td class="num">${totalCell}</td>
          <td class="num">${formatNumber(Number(e.odometer), 0)} km</td>
        </tr>`
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Relatório — Tanqi${vehicle ? " · " + vehicle.name : ""}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1d2e; margin: 40px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .sub { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
  .metric { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
  .metric .label { text-transform: uppercase; font-size: 10px; color: #6b7280; letter-spacing: 0.06em; }
  .metric .value { font-family: ui-monospace, Menlo, monospace; font-size: 20px; font-weight: 600; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
  th { background: #f5f5f4; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.04em; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; font-family: ui-monospace, Menlo, monospace; }
  .sub { display: block; font-size: 10px; color: #059669; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-variant-numeric: normal; }
  @media print { body { margin: 20mm; } .no-print { display: none; } }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .logo { width: 28px; height: 28px; border-radius: 8px; background: #00D4F0; color: #0E1015; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; letter-spacing: -0.02em; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">t</div>
    <h1>Tanqi</h1>
  </div>
  <div class="sub">
    Relatório gerado em ${new Date().toLocaleDateString("pt-BR")}${vehicle ? ` · ${vehicle.name}` : ""}
  </div>

  <div class="grid">
    <div class="metric"><div class="label">Total pago</div><div class="value">${formatBRL(summary.totalSpend)}</div></div>
    <div class="metric"><div class="label">Consumo médio</div><div class="value">${formatKmPerLiter(summary.avgConsumption)}</div></div>
    <div class="metric"><div class="label">Custo por km</div><div class="value">${formatPerKm(summary.costPerKm)}</div></div>
    <div class="metric"><div class="label">Km rodados</div><div class="value">${formatNumber(summary.kmTraveled, 0)} km</div></div>
  </div>
  ${
    summary.totalDiscount > 0
      ? `<div style="margin-bottom:24px;padding:12px 16px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-size:13px;">
    <strong>Economia com cupons:</strong> ${formatBRL(summary.totalDiscount)} descontados em ${entries.filter((e) => (Number(e.discount_amount) || 0) > 0).length} abastecimento(s). Bruto: ${formatBRL(summary.totalGross)}.
  </div>`
      : ""
  }

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Combustível</th>
        <th>Posto</th>
        <th class="num">Preço/L</th>
        <th class="num">Litros</th>
        <th class="num">Total</th>
        <th class="num">Hodômetro</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
}
