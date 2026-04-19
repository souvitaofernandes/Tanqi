"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ListOrdered, Car, PieChart } from "lucide-react"
import { VehiclePicker } from "./vehicle-picker"
import { UserMenu } from "./user-menu"
import { QuickEntryFab } from "./quick-entry-fab"
import { TanqiWordmark } from "./tanqi-logo"
import type { FuelEntry, Vehicle } from "@/lib/types"

const leftNav = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/entries", label: "Histórico", icon: ListOrdered },
]
const rightNav = [
  { href: "/reports", label: "Relatórios", icon: PieChart },
  { href: "/vehicles", label: "Veículos", icon: Car },
]
const desktopNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entries", label: "Abastecimentos", icon: ListOrdered },
  { href: "/vehicles", label: "Veículos", icon: Car },
  { href: "/reports", label: "Relatórios", icon: PieChart },
]

export function AppShell({
  children,
  vehicles,
  activeVehicleId,
  userEmail,
  siblingEntries = [],
}: {
  children: React.ReactNode
  vehicles: Vehicle[]
  activeVehicleId: string | null
  userEmail: string
  siblingEntries?: FuelEntry[]
}) {
  const pathname = usePathname()
  const withVehicleParam = (href: string) =>
    activeVehicleId && href !== "/vehicles" ? `${href}?v=${activeVehicleId}` : href

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <TanqiWordmark size="md" className="text-sidebar-foreground" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {desktopNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={withVehicleParam(item.href)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <UserMenu email={userEmail} />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border/80 bg-background/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 md:px-6">
          <div className="flex items-center gap-2.5 md:hidden">
            <TanqiWordmark size="md" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <VehiclePicker vehicles={vehicles} activeId={activeVehicleId} />
            <div className="md:hidden">
              <UserMenu email={userEmail} compact />
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav with central FAB */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-background/85 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center justify-around">
            {leftNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={withVehicleParam(item.href)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
          <div className="flex items-center justify-center px-3">
            <QuickEntryFab
              vehicles={vehicles}
              activeVehicleId={activeVehicleId}
              siblingEntries={siblingEntries}
            />
          </div>
          <div className="flex flex-1 items-center justify-around">
            {rightNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={withVehicleParam(item.href)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
