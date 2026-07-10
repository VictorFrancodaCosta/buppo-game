const VERSION = '2026.07.10.3';
const STATIC_CACHE = `buppo-static-${VERSION}`;
const RUNTIME_CACHE = `buppo-runtime-${VERSION}`;

const APP_SHELL = [
    './',
    './index.html',
    './offline.html',
    './manifest.json',
    './css/style.css',
    './css/lobby.css',
    './css/game.css',
    './css/effects.css',
    './css/accessibility.css',
    './js/data.js',
    './js/game_logic.js',
    './js/match_protocol.js',
    './js/security.js',
    './js/firebase_network.js',
    './js/matchmaking.js',
    './js/audio_controller.js',
    './js/ui_controller.js',
    './js/effects.js',
    './js/mobile_simple.js',
    './js/main.js',
    './js/app_shell.js',
    './js/pwa.js',
    './assets/img/logo_buppo.webp',
    './assets/img/bg_saguao_cartas_teste.png',
    './assets/img/pwa-icon-192.png',
    './assets/img/pwa-icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, './offline.html'));
        return;
    }
    if (['style', 'script', 'image', 'font', 'audio', 'manifest'].includes(request.destination)) {
        event.respondWith(staleWhileRevalidate(request));
    }
});

async function networkFirst(request, fallback) {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
    } catch (error) {
        return (await cache.match(request)) || (await caches.match(fallback));
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    const network = fetch(request)
        .then(async (response) => {
            if (response.ok) await cache.put(request, response.clone());
            return response;
        })
        .catch(() => cached);
    return cached || network;
}
