// Rokugan SW — v3.8
// Stratégie : network-first pour data.json et HTML (fraîcheur), cache-first pour le reste (assets).
const CACHE = 'rokugan-v3.8';
const ESSENTIALS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './Rokugan.webp',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESSENTIALS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Bypass POST/non-GET
  if (e.request.method !== 'GET') return;
  // data.json + HTML : network-first
  const isFreshNeeded = url.pathname.endsWith('data.json') || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isFreshNeeded) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Assets : cache-first
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(cc => cc.put(e.request, copy)).catch(()=>{});
      return r;
    }))
  );
});

// MAJ forcée via postMessage
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
