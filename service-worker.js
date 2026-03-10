// service-worker.js — GymPro PWA (offline básico, bien cerrado)
const CACHE_NAME = 'gympro-cache-v1';
const OFFLINE_ASSETS = [
  './',
  './gym.html',
  './manifest.webmanifest'
];

// Install: precache básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: limpia caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first con fallback a red y recache de assets/html
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // no interceptar POST/PUT/etc.

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // cachea copias de assets y html
          const url = new URL(req.url);
          if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.html')) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => caches.match('./gym.html')); // fallback offline
    })
  );
});
