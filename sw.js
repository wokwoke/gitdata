const CACHE = 'gitdata-shell-v1';
const SHELL = ['./index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// App shell cached, everything else (GitHub/GitLab API calls) goes to network as normal.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (SHELL.some(s => url.pathname.endsWith(s.replace('./', '')))) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
