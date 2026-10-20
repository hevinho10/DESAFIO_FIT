// ============================================================
// PULSO - Service Worker
// Faz o app abrir rápido, funcionar com conexão ruim e habilita
// o "Instalar aplicativo" do Chrome no Android e no computador.
// ============================================================

const CACHE = 'pulso-v38';
const V = '20261239'; // mesma versão do ?v= do index.html
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js';
const ESTATICOS = [
  './',
  './index.html',
  './app.min.js?v=' + V,
  './styles.css?v=' + V,
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './corpo.json?v=1',
];

// Bibliotecas de fora que o app precisa pra abrir (guardadas pra funcionar sem internet)
const EXTERNOS_PERMITIDOS = [
  'cdn.jsdelivr.net',       // supabase-js
  'fonts.googleapis.com',   // fontes
  'fonts.gstatic.com',
];

// Instala e guarda os arquivos básicos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all([c.addAll(ESTATICOS), c.add(SUPABASE_JS).catch(() => {})]))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

// Limpa versões antigas do cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== CACHE && n !== 'pulso-badge').map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Guarda a resposta e apaga versões antigas do mesmo arquivo (ex: app.js?v=antigo)
async function guardar(req, res) {
  try {
    const c = await caches.open(CACHE);
    await c.put(req, res);
    const url = new URL(req.url);
    if (url.origin === self.location.origin && url.search) {
      const chaves = await c.keys();
      await Promise.all(chaves
        .filter(k => { const u = new URL(k.url); return u.pathname === url.pathname && u.search !== url.search; })
        .map(k => c.delete(k)));
    }
  } catch (e) {}
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const proprio = url.origin === self.location.origin;
  const externoOk = EXTERNOS_PERMITIDOS.includes(url.hostname);

  // Nada de API, Supabase (dados) ou outros sites
  if (!proprio && !externoOk) return;

  // Páginas: rede primeiro (pra pegar atualização), mas se a internet demorar mais de 1,5s
  // abre com a página guardada (e a nova fica guardada pra próxima vez)
  if (proprio && (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html'))) {
    const rede = fetch(req).then(res => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)).catch(() => {}); }
      return res;
    });
    event.waitUntil(rede.catch(() => {}));
    event.respondWith((async () => {
      const guardada = await caches.match('./index.html') || await caches.match('./');
      if (!guardada) return rede.catch(() => Response.error());
      const prazo = new Promise(r => setTimeout(() => r(null), 1500));
      const res = await Promise.race([rede.catch(() => null), prazo]);
      return res || guardada;
    })());
    return;
  }

  // app.js, styles.css, ícones, fontes e supabase-js:
  // usa o que está guardado (rápido) e atualiza por trás.
  // Cada versão nova do app.js/styles.css tem um "?v=" diferente, então sempre vem a certa.
  // Arquivo com versão no endereço (app.min.js?v=, styles.css?v=, supabase-js@x.y.z, fontes) nunca muda:
  // se já está guardado, usa direto e não baixa de novo
  const imutavel = (proprio && /[?&]v=/.test(url.search)) || url.hostname === 'fonts.gstatic.com'
    || (url.hostname === 'cdn.jsdelivr.net' && /@\d+\.\d+\.\d+/.test(url.pathname));
  event.respondWith(
    caches.match(req).then(cacheado => {
      if (cacheado && imutavel) return cacheado;
      const rede = fetch(req)
        .then(res => {
          if (res && (res.status === 200 || res.type === 'opaque')) guardar(req, res.clone());
          return res;
        })
        .catch(async () => {
          if (cacheado) return cacheado;
          // Sem internet e sem essa versão guardada: usa a versão anterior do mesmo arquivo
          const anterior = await caches.match(req, { ignoreSearch: true });
          return anterior || Response.error();
        });
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

  event.waitUntil(Promise.all([
    somarBadge(),
    self.registration.showNotification(dados.title || 'Pulso', {
      body: dados.body || '',
      icon: dados.icon || './icon-192.png',
      badge: dados.badge || './icon-192.png',
      tag: dados.tag || 'pulso',
      renotify: false,
      data: { url: dados.url || './' },
    }),
  ]));
});

// Número no ícone do app: soma 1 a cada aviso com o app fechado.
// Quando o app abre, ele corrige pro número real.
async function somarBadge() {
  try {
    if (!self.navigator || !('setAppBadge' in self.navigator)) return;
    const c = await caches.open('pulso-badge');
    const r = await c.match('/badge');
    const n = (r ? Number(await r.text()) || 0 : 0) + 1;
    await c.put('/badge', new Response(String(n)));
    await self.navigator.setAppBadge(n);
  } catch (e) {}
}

// Toque na notificação: abre o app (e vai direto pro lugar certo, se a notificação indicar)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
      for (const c of lista) {
        if ('focus' in c) {
          if (destino !== './' && 'navigate' in c) c.navigate(destino).catch(() => {});
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
