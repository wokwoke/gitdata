const CACHE = 'gitdata-shell-v2';

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg'
];

// Install service worker baru
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// Aktifkan versi baru dan hapus cache versi lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Tangani request
self.addEventListener('fetch', event => {
  const request = event.request;

  // Untuk navigasi halaman HTML:
  // selalu coba network terlebih dahulu agar deployment baru langsung terlihat.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(request, copy);
          });

          return response;
        })
        .catch(() => caches.match(request))
    );

    return;
  }

  // Untuk asset lain:
  // cache-first, lalu network jika belum ada.
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) {
          return cached;
        }

        return fetch(request)
          .then(response => {
            if (
              response &&
              response.status === 200 &&
              response.type === 'basic'
            ) {
              const copy = response.clone();

              caches.open(CACHE).then(cache => {
                cache.put(request, copy);
              });
            }

            return response;
          });
      })
  );
});
