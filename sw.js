// ============================================================
// PULSO - Service Worker
// Faz o app abrir rápido, funcionar com conexão ruim e habilita
// o "Instalar aplicativo" do Chrome no Android e no computador.
// ============================================================

const CACHE = 'pulso-v2';
const ESTATICOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Instala e guarda os arquivos básicos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ESTATICOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

// Limpa versões antigas do cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Só cuida de GET do próprio site. Nada de API, Supabase ou CDN.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Páginas: tenta a rede primeiro (pra pegar atualização), cai pro cache se falhar
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copia)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Ícones e afins: cache primeiro, rede como reforço
  event.respondWith(
    caches.match(req).then(cacheado => {
      const rede = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copia = res.clone();
            caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
          }
          return res;
        })
        .catch(() => cacheado);
      return cacheado || rede;
    })
  );
});

// ============================================================
// Notificações push (funciona com o app fechado)
// ============================================================
self.addEventListener('push', event => {
  let dados = { title: 'Pulso', body: 'Você tem algo pra registrar hoje.' };
  try { if (event.data) dados = event.data.json(); } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(dados.title || 'Pulso', {
      body: dados.body || '',
      icon: dados.icon || './icon-192.png',
      badge: dados.badge || './icon-192.png',
      tag: dados.tag || 'pulso',
      renotify: false,
      data: { url: dados.url || './' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
      for (const c of lista) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
