// FORGED Safety OS — Service Worker
// Caches app shell for offline use, queues data submissions

const CACHE_NAME = 'forged-safety-v4.3'
const OFFLINE_QUEUE_KEY = 'forged-offline-queue'

// App shell files to cache
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL)
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET and Supabase/API calls (handled by offline queue)
  if (event.request.method !== 'GET') return
  if (url.hostname.includes('supabase') || url.pathname.includes('.netlify/functions')) return

  // For navigation requests (HTML pages) — network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // For assets (JS, CSS, images) — cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        if (response.ok && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})

// Listen for sync events (Background Sync API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'forged-sync') {
    event.waitUntil(processOfflineQueue())
  }
})

// Process queued offline submissions
async function processOfflineQueue() {
  // This is handled by the client-side offlineQueue.ts
  // The SW just triggers the sync event
  const clients = await self.clients.matchAll()
  clients.forEach(client => client.postMessage({ type: 'SYNC_OFFLINE_QUEUE' }))
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
