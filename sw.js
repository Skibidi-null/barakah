// Offline: app shell on install; content files (surahs, hadith collections) cached when first opened.
// DATA is the content version: bump it when tools/export.py output changes, so nobody keeps old texts.
const V = 'barakah-20261121002107';
const DATA = 'barakah-data-14';
const SHELL = ['./', 'index.html', 'app.js', 'style.css', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'fonts/spacegrotesk.ttf', 'fonts/jetbrainsmono.ttf', 'fonts/naskh.ttf',
  'data/quran/index.json', 'data/duas.json', 'data/misc.json', 'data/refs.json', 'data/reciters.json', 'data/quran/1.json', 'data/quran/simple/1.json'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  const keys = await caches.keys();
  // keep big downloads that did not change (hadith collections, tafsir) from the older content cache
  for (const old of keys.filter((k) => k.startsWith('barakah-data') && k !== DATA)) {
    try { const from = await caches.open(old), to = await caches.open(DATA); for (const req of await from.keys()) if (/\/data\/(hadith\/(?!index)|tafsir\/)/.test(req.url)) { const r = await from.match(req); if (r) await to.put(req, r); } } catch (err) {}
    await caches.delete(old);
  }
  await Promise.all(keys.filter((k) => k.startsWith('barakah-') && k !== V && !k.startsWith('barakah-data') && k !== 'barakah-audio' && k !== 'barakah-timing').map((k) => caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // audio and maps stream from their own servers
  if (u.pathname.includes('/android/')) return; // the Android updater files are never cached
  const isData = u.pathname.includes('/data/');
  const store = isData ? DATA : V;
  e.respondWith(caches.open(V).then((c) => c.match(e.request, { ignoreSearch: true })).then((own) => own || (isData ? caches.open(DATA).then((c) => c.match(e.request, { ignoreSearch: true })) : null)).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok) { const cp = r.clone(); caches.open(store).then((c) => c.put(e.request, cp)); }
    return r;
  }).catch(() => (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
