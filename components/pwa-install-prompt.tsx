"use client"

import { useEffect, useState } from "react"
import { Download, Share, Plus, X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// NOTE: storage key intentionally preserved from the previous brand so users
// who have already dismissed the prompt don't get re-offered it post-rename.
// This is an analytics/UX detail, not a visible brand string.
const STORAGE_KEY = "tanqi.install-prompt.dismissed-at"
const LEGACY_STORAGE_KEY = "fuel-tracker.install-prompt.dismissed-at"
// Wait this long after first visit before showing anything.
const MIN_DELAY_MS = 12_000
// Re-offer after 30 days if dismissed.
const RE_OFFER_AFTER_MS = 30 * 24 * 60 * 60 * 1000

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  const displayMode = window.matchMedia?.("(display-mode: standalone)").matches
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
  return Boolean(displayMode || iosStandalone)
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  // iOS Safari or iPadOS (which reports as Mac but with maxTouchPoints).
  return /iPhone|iPad|iPod/.test(ua) || (/Mac/.test(ua) && "ontouchend" in document)
}

function shouldShowAgain(): boolean {
  try {
    // Migrate the dismissal timestamp from the old brand key so pre-rename
    // users don't see the prompt again after upgrading.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, legacy)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return true
    const dismissedAt = Number(raw)
    if (!Number.isFinite(dismissedAt)) return true
    return Date.now() - dismissedAt > RE_OFFER_AFTER_MS
  } catch {
    return true
  }
}

/**
 * Subtle, dismissible install prompt that floats above the mobile bottom nav.
 *
 * - Android / desktop Chrome: listens for `beforeinstallprompt`, defers it, and on tap
 *   fires the native install flow (`event.prompt()`). Result is recorded so we never
 *   nag users who accepted or recently dismissed.
 * - iPhone / iPad Safari: native prompt doesn't exist, so we show a short how-to
 *   ("Compartilhar → Adicionar à Tela de Início") with the iOS share glyph.
 * - Already installed: the component renders nothing.
 */
export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<"android" | "ios" | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isStandalone()) return
    if (!shouldShowAgain()) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setMode("android")
      timer = setTimeout(() => setVisible(true), MIN_DELAY_MS)
    }

    const handleInstalled = () => {
      setVisible(false)
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()))
      } catch {}
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled", handleInstalled)

    // iOS fallback: no beforeinstallprompt — show iOS-specific instructions.
    if (isIos()) {
      setMode("ios")
      timer = setTimeout(() => setVisible(true), MIN_DELAY_MS)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleInstalled)
      if (timer) clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {}
  }

  const install = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setVisible(false)
      } else {
        dismiss()
      }
    } catch {
      dismiss()
    } finally {
      setDeferredPrompt(null)
    }
  }

  if (!visible || !mode) return null

  return (
    <div
      role="dialog"
      aria-label="Instalar Tanqi"
      className={cn(
        "fixed inset-x-3 z-30 md:inset-x-auto md:right-6 md:max-w-sm",
        // Float above the mobile bottom nav (~4.25rem including safe area) with a gentle gap.
        "bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] md:bottom-6",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
      )}
    >
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-popover/95 p-4 shadow-2xl backdrop-blur-xl supports-[backdrop-filter]:bg-popover/80">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
          {mode === "ios" ? <Smartphone className="size-5" /> : <Download className="size-5" />}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {mode === "android" ? (
            <>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold leading-tight">Instalar Tanqi</p>
                <p className="text-[12px] leading-snug text-muted-foreground">
                  Abertura instantânea, sem barra de navegação. Fica na tela de início como qualquer app.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Button size="sm" className="h-8 px-3" onClick={install}>
                  Instalar
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground" onClick={dismiss}>
                  Agora não
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold leading-tight">Adicionar à Tela de Início</p>
                <p className="text-[12px] leading-snug text-muted-foreground">
                  Toque em{" "}
                  <span className="inline-flex translate-y-0.5 items-center">
                    <Share className="size-3.5" aria-label="Compartilhar" />
                  </span>{" "}
                  no Safari, depois em{" "}
                  <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                    <Plus className="size-3" /> Adicionar à Tela de Início
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground" onClick={dismiss}>
                  Entendi
                </Button>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar"
          className="-m-1 shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
