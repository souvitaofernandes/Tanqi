import type { MetadataRoute } from "next"

/**
 * Web App Manifest served at /manifest.webmanifest by Next.js Metadata Route API.
 * Keeps the colors in sync with the Tanqi "Graphite + Electric Cyan" palette so
 * the OS chrome (Android splash, app switcher, task tile) matches the in-app
 * experience. background_color is the charcoal card ground; the launcher icon
 * carries the cyan.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tanqi — Inteligência para o custo real do seu carro",
    short_name: "Tanqi",
    description:
      "Tanqi organiza tudo que envolve ter um carro: gastos, consumo, custo por km, comparação entre postos e, em breve, manutenções e documentos.",
    start_url: "/dashboard",
    scope: "/",
    id: "/?source=pwa",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0E1015",
    theme_color: "#0E1015",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      // `any` — generic icon used by the app launcher on most platforms.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      // `maskable` — version with extra safe-zone padding so Android can
      // crop to a circle / squircle without clipping the glyph.
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Novo abastecimento",
        short_name: "Abastecer",
        description: "Registrar um novo abastecimento agora",
        url: "/dashboard?new=1",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Histórico",
        short_name: "Histórico",
        description: "Ver o histórico de abastecimentos",
        url: "/entries",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Relatórios",
        short_name: "Relatórios",
        description: "Ver análises e tendências",
        url: "/reports",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  }
}
