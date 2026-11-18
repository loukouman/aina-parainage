// Service worker AÏNA : volontairement minimal et sûr.
// Il ne met JAMAIS en cache les pages, l'API, les paiements ni l'administration.
const V = 'aina-v1';
const OFFLINE = '/hors-ligne';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (u.pathname.startsWith('/_next/static/') || u.pathname.startsWith('/pwa-icon/')) {
    e.respondWith(caches.match(r).then((c) => c || fetch(r).then((res) => { const cp = res.clone(); caches.open(V).then((x) => x.put(r, cp)); return res; })));
  }
});
