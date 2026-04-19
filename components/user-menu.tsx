"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Monitor, Moon, Sun, User } from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

function ThemeItems() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const current = mounted ? theme : "dark"
  const Icon = current === "dark" ? Moon : current === "light" ? Sun : Monitor

  return (
    <>
      <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" /> Tema
      </DropdownMenuLabel>
      <div className="grid grid-cols-3 gap-1 p-1">
        {[
          { id: "light", label: "Claro", icon: Sun },
          { id: "dark", label: "Escuro", icon: Moon },
          { id: "system", label: "Auto", icon: Monitor },
        ].map(({ id, label, icon: I }) => {
          const active = current === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors ${
                active
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              <I className="size-3.5" />
              {label}
            </button>
          )
        })}
      </div>
    </>
  )
}

export function UserMenu({ email, compact = false }: { email: string; compact?: boolean }) {
  const initial = email?.charAt(0).toUpperCase() ?? "U"

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9 rounded-full">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initial}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">Conectado como</span>
              <span className="truncate text-sm font-normal">{email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ThemeItems />
          <DropdownMenuSeparator />
          <form action={signOut}>
            <DropdownMenuItem asChild>
              <button type="submit" className="flex w-full cursor-pointer items-center">
                <LogOut className="mr-2 size-4" />
                Sair
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start gap-3 px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial}
          </div>
          <div className="flex min-w-0 flex-col items-start">
            <span className="flex items-center gap-1 text-sm font-medium">
              <User className="size-3" /> Minha conta
            </span>
            <span className="max-w-[150px] truncate text-xs text-muted-foreground">{email}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeItems />
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="flex w-full cursor-pointer items-center">
              <LogOut className="mr-2 size-4" />
              Sair
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
