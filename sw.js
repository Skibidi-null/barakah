// Offline: app shell on install; content files (surahs, hadith collections) cached when first opened.
const V = 'barakah-20261113181757';
const SHELL = ['./', 'index.html', 'app.js', 'style.css', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'fonts/manrope.ttf', 'fonts/naskh.ttf', 'fonts/amiri_quran.ttf', 'data/quran/index.json', 'data/duas.json', 'data/misc.json', 'data/hadith/index.json'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && !k.startsWith('barakah-data')).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // audio streams straight from mp3quran
  const isData = u.pathname.includes('/data/');
  const store = isData ? 'barakah-data-1' : V; // content cache survives app updates
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok) { const cp = r.clone(); caches.open(store).then((c) => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match('index.html'))));
});
