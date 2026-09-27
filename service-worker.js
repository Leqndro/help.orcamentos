const CACHE_NAME = 'help-orcamentos-v6';
const ARQUIVOS_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './style.css',
  './dados-categorias.js',
  './dados-eletrica.js',
  './dados-hidraulica.js',
  './dados-drywall.js',
  './dados-pintura.js',
  './dados-alvenaria.js',
  './logo-data.js',
  './pdf.js',
  './app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes.filter((nome) => nome !== CACHE_NAME).map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      if (respostaCache) return respostaCache;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
