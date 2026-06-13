const STATIC_CACHE = 'buppo-static-v6';
const RUNTIME_CACHE = 'buppo-runtime-v6';
const STATIC_HOSTS = new Set([
    self.location.host,
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'www.gstatic.com'
]);

const APP_SHELL = [
    './',
    './index.html',
    './offline.html',
    './manifest.json?v=4',
    './css/style.css?v=6',
    './css/lobby.css?v=8',
    './css/game.css?v=8',
    './css/effects.css',
    './js/main.js?v=12',
    './js/pwa.js?v=5',
    './js/effects.js?v=24',
    './js/data.js',
    './js/firebase_network.js',
    './js/game_logic.js',
    './js/audio_controller.js',
    './js/matchmaking.js',
    './js/ui_controller.js?v=8',
    './assets/img/logo_buppo.webp',
    './assets/img/bg_saguao.webp',
    './assets/img/ui_moldura_perfil.webp',
    './assets/img/ui_placa_selecao.webp',
    './assets/img/cluster_jogador.webp',
    './assets/img/cluster_inimigo.webp',
    './assets/img/ui_area_xp.webp',
    './assets/img/ui_mesa_deck.webp',
    './assets/img/pwa-icon-192.png',
    './assets/img/pwa-icon-512.png',
    './assets/img/pwa-icon-maskable-192.png',
    './assets/img/pwa-icon-maskable-512.png',
    './assets/img/apple-touch-icon-180.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const isSameOrigin = url.origin === self.location.origin;
    const isDocument = request.mode === 'navigate';
    const isStaticRequest =
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image' ||
        request.destination === 'font' ||
        request.destination === 'audio' ||
        request.destination === 'manifest';

    if (isDocument) {
        event.respondWith(networkFirst(request, './offline.html'));
        return;
    }

    if (isSameOrigin && isStaticRequest) {
        const strategy = request.destination === 'style' || request.destination === 'script' || request.destination === 'manifest'
            ? networkFirst(request)
            : staleWhileRevalidate(request);
        event.respondWith(strategy);
        return;
    }

    if (!isSameOrigin && STATIC_HOSTS.has(url.host)) {
        event.respondWith(staleWhileRevalidate(request));
    }
});

async function networkFirst(request, fallbackUrl = './index.html') {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
        const fresh = await fetch(request);
        cache.put(request, fresh.clone());
        return fresh;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        const shellCache = await caches.open(STATIC_CACHE);
        return shellCache.match(fallbackUrl) || shellCache.match('./index.html');
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            cache.put(request, response.clone());
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}
