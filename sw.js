// Offline-hulp: eerst het netwerk (zo heb je altijd de nieuwste versie), zonder internet de laatst bewaarde versie.
const CACHE = 'studiehub-v3';
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const mine = u.origin === location.origin;
  const sdk = u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/');
  const font = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (font) { // lettertypes veranderen nooit: eerst uit de cache, dan pas internet
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(cache => cache.put(r, c)); } return res; })));
    return;
  }
  if (!mine && !sdk) return;               // Google-login, database, agenda en Canvas-links gaan altijd direct
  if (mine && u.pathname.startsWith('/__/')) return; // inloggen via je eigen adres: nooit bewaren
  e.respondWith(fetch(r).then(res => {
    if (res.ok && res.type !== 'opaque') { const c = res.clone(); caches.open(CACHE).then(cache => cache.put(r.mode === 'navigate' ? './' : r, c)); }
    return res;
  }).catch(() => caches.match(r.mode === 'navigate' ? './' : r, { ignoreSearch: r.mode === 'navigate' })
    .then(m => m || (r.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
