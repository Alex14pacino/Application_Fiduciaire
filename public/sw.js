const CACHE_NAME = 'fidudocs-v1'

// Ressources à mettre en cache immédiatement
const PRECACHE_ASSETS = [
  '/',
  '/client/dashboard',
  '/client/documents',
  '/client/profile',
  '/login',
  '/signup'
]

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  // Activation immédiate
  self.skipWaiting()
})

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Prise de contrôle immédiate
  self.clients.claim()
})

// Stratégie de cache : Network First avec fallback sur le cache
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Ignore les requêtes non-GET
  if (request.method !== 'GET') return

  // Ignore les requêtes vers Supabase (API)
  if (request.url.includes('supabase.co')) return

  // Ignore les requêtes vers les webhooks
  if (request.url.includes('webhook')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone la réponse pour la mettre en cache
        const responseClone = response.clone()

        // Met en cache les ressources statiques
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }

        return response
      })
      .catch(() => {
        // En cas d'erreur réseau, utilise le cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // Page offline par défaut pour les navigations
          if (request.mode === 'navigate') {
            return caches.match('/client/dashboard')
          }

          return new Response('Offline', { status: 503 })
        })
      })
  )
})
