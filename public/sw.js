// Self-destruct kill-switch for any stale Service Worker in user browsers
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => {
        if (client.navigate) {
          client.navigate(client.url);
        }
      });
    })
  );
});

// Pass through all requests directly to the network - do not cache anything
self.addEventListener('fetch', () => {
  return;
});
