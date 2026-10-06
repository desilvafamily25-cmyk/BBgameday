/* Offline support for U12 Game Day Coach (active only when served over https, e.g. Netlify).
   - The app page (index.html) is network-first: online users always get the latest deploy,
     offline users get the last saved copy.
   - Icons, manifest and fonts are served from cache and refreshed in the background. */
const CACHE = 'u12-gameday-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const isPage = req => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;

  if (sameOrigin && isPage(req)) {
    // Network first, fall back to the cached page when offline.
    e.respondWith(
      fetch(req, {cache: 'no-store'}).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Stale-while-revalidate for icons, manifest and fonts.
  e.respondWith(caches.open(CACHE).then(cache => cache.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
