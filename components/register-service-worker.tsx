"use client"

import { useEffect } from "react"

/**
 * Registers the minimal service worker on supported browsers.
 *
 * - Only runs in production to avoid confusing the Next.js dev server with stale workers.
 * - Scoped to the root ("/") so the whole app is covered once we add offline support.
 * - Silently no-ops if service workers aren't available (e.g. older Safari, Firefox private mode).
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      } catch {
        // Swallow — not being installable is never a hard error for the app.
      }
    }

    // Defer until after first paint so it never competes with initial render.
    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
    }
  }, [])

  return null
}
