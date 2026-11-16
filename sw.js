// Service worker: guarda o app no celular para funcionar sem internet.
// Ao publicar uma nova versão, altere o número abaixo.
const CACHE = 'insumos-jfi-v3.0.0';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './config.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).pathname.endsWith('/config.json')) { // cadastros: rede primeiro, cache se offline
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put('./config.json', c)); } return r; }).catch(() => caches.match('./config.json')));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const net = fetch(e.request).then(resp => {
        if (resp && resp.ok && new URL(e.request.url).origin === location.origin) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
