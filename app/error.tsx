"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TanqiWordmark } from "@/components/tanqi-logo"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6">
      <TanqiWordmark size="lg" />
      <div className="text-center">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte para o início.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Tentar novamente
        </Button>
        <Button asChild>
          <a href="/dashboard">Ir para o início</a>
        </Button>
      </div>
    </div>
  )
}
