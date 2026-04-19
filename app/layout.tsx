import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { RegisterServiceWorker } from "@/components/register-service-worker"
import "./globals.css"

/**
 * Tanqi's brand typography stack.
 *  - Plus Jakarta Sans for UI and headlines: geometric, calm, product-led.
 *  - JetBrains Mono for numeric data: KPIs, currency, liters, km, charts.
 * Both are exposed as CSS variables so globals.css can wire them into the
 * Tailwind v4 `--font-sans` / `--font-mono` tokens without duplicating names.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
})
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Tanqi — Inteligência para o custo real do seu carro",
  description:
    "Tanqi organiza tudo que envolve ter um carro — gastos, consumo, histórico e, em breve, manutenções e documentos — com clareza e sem esforço.",
  applicationName: "Tanqi",
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      // Vector favicon — renders crisply at every size and matches the Tanqi
      // mark used inside the product. The previous JPG references (icon-512.jpg)
      // didn't actually exist in /public, so this also fixes a broken ref.
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "Tanqi",
    // `default` keeps the iOS status bar visible and non-overlapping for maximum safety.
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  // These values match the graphite/cyan tokens in globals.css so iOS Safari
  // and Android Chrome tint the browser chrome to match the app shell.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1015" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Allow content to extend into the safe-area insets (notch / home indicator / dynamic island).
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${jetbrains.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors theme="system" />
        </ThemeProvider>
        <RegisterServiceWorker />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
