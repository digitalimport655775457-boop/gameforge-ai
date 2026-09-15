// GameForge PWA Service Worker v3
const CACHE_NAME = 'gameforge-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

// Install event: cache shell assets and skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW pre-caching partial notice:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event: clean up all old caches immediately and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: STRICT bypass for all API calls and non-GET requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // STRICT RULE: Never intercept ANY API request or non-GET request
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/api/') ||
    url.searchParams.has('nocache')
  ) {
    return; // Pass through directly to browser network
  }

  // App shell caching
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.origin === self.location.origin &&
          !url.pathname.startsWith('/api')
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // ONLY return cached shell for full-page navigation requests, NEVER for fetch/XHR!
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Network unavailable', {
          status: 503,
          statusText: 'Network unavailable',
        });
      })
  );
});
