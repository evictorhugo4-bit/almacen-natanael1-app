// ==========================================================
//  Service Worker - cachea la app para que cargue instantáneo
//  ⚠️ IMPORTANTE: cada vez que subas cambios nuevos a GitHub,
//  cambiá el número de versión de abajo (v1 -> v2 -> v3...)
//  para que los usuarios reciban la actualización.
// ==========================================================
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'app-cache-' + CACHE_VERSION;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// Instala y guarda los archivos base en caché
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// Borra cachés viejas (de versiones anteriores)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Estrategia "stale-while-revalidate":
// 1) responde YA con lo que está en caché (carga instantánea)
// 2) en paralelo pide la versión nueva a internet y la guarda
//    para la PRÓXIMA vez que se abra la app
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse); // si no hay internet, usa la caché

        return cachedResponse || networkFetch;
      })
    )
  );
});
