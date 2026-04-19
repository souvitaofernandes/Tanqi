/**
 * Tanqi — OpenGraph share card (1200×630).
 *
 * Next.js metadata image file-conventions statically analyze each route's
 * exports and do NOT reliably follow `@/` aliased imports through Turbopack
 * (this regressed our production build previously). To keep the route
 * bulletproof we inline the full composition here. The Twitter card lives at
 * `app/twitter-image.tsx` and renders the exact same JSX — if you change one,
 * update the other.
 *
 * Brand tokens are inlined as raw hexes on purpose. next/og runs at the edge
 * and cannot resolve CSS variables or Tailwind classes; these values mirror
 * the canonical graphite + cyan tokens from globals.css:
 *   - #0E1015  graphite base     (--background, dark)
 *   - #00D4F0  electric cyan     (--primary, dark)
 *   - #94A3B8  slate text muted  (--muted-foreground, dark)
 *   - #2C303C  border hairline   (--border, dark)
 */

import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Tanqi — inteligência para o custo real do seu carro"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background:
          "radial-gradient(60% 60% at 20% 10%, rgba(0,212,240,0.18), transparent 70%)," +
          "radial-gradient(60% 60% at 85% 95%, rgba(0,212,240,0.10), transparent 70%)," +
          "#0E1015",
        color: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      {/* Wordmark row: glyph + lowercase "tanqi" */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#00D4F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 0 0 1px rgba(0,212,240,0.4)",
          }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="#0E1015">
            <rect x="9" y="6" width="3" height="14" rx="1.5" />
            <rect x="4.5" y="9.5" width="11" height="3" rx="1.5" />
            <circle cx="18" cy="6" r="2" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 48,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
          }}
        >
          tanqi
        </span>
      </div>

      {/* Hero line */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "880px" }}>
        <div
          style={{
            fontSize: 80,
            lineHeight: 1.05,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "#FFFFFF",
          }}
        >
          Clareza total.
          <br />
          <span style={{ color: "#00D4F0" }}>Sobre cada quilômetro.</span>
        </div>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.4,
            color: "#94A3B8",
            maxWidth: "780px",
          }}
        >
          Inteligência para o custo real do seu carro. Do abastecimento à decisão.
        </div>
      </div>

      {/* Footer — single brand line reused from the app footer so every surface agrees. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "24px",
          borderTop: "1px solid #2C303C",
          color: "#94A3B8",
          fontSize: 22,
        }}
      >
        <span>tanqi.app</span>
        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              background: "#00D4F0",
            }}
          />
          Inteligência para o custo real do seu carro
        </span>
      </div>
    </div>,
    { ...size },
  )
}
