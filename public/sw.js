/**
 * Tanqi — minimal service worker.
 *
 * This worker intentionally has NO fetch handler yet. Its only job is to make the
 * app installable as a PWA on browsers that require a registered service worker
 * (Chrome/Edge/Samsung Internet on Android, desktop Chrome/Edge).
 *
 * Because there is no fetch handler, all network requests continue to go directly
 * to the network exactly as before — zero risk of stale content, zero offline bugs.
 *
 * When we are ready to add offline support, we can layer on:
 *   - a precache of the app shell (HTML/CSS/JS) during `install`
 *   - a runtime cache (stale-while-revalidate) for Next.js /_next/static/*
 *   - a network-first strategy for /dashboard, /entries, /reports, /vehicles
 *   - a background-sync queue to replay POSTs after reconnection
 *
 * The structure below (install + activate + message + update flow) is ready for that.
 */

// Bump this string to force clients to pick up a new SW.
const SW_VERSION = "v1"

self.addEventListener("install", (event) => {
  // Activate new SW immediately on next navigation without waiting for all tabs to close.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // Take control of any already-open pages.
  event.waitUntil(self.clients.claim())
})

// Allow the page to ask the waiting worker to activate (used by the update prompt later).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Intentionally no `fetch` listener — safe default.
// (Add a fetch handler here when adding offline support.)
void SW_VERSION
