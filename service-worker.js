const CACHE_NAME = 'buppo-pwa-v2';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './css/lobby.css',
    './css/game.css',
    './css/effects.css',
    './js/main.js',
    './js/data.js',
    './js/game_logic.js',
    './js/ui_controller.js',
    './js/audio_controller.js',
    './js/effects.js',
    './js/firebase_network.js',
    './js/matchmaking.js',
    './assets/icons/buppo-icon-192.png',
    './assets/icons/buppo-icon-512.png',
    './assets/img/logo_buppo.webp',
    './assets/img/bg_saguao.webp',
    './assets/img/mesa_cavaleiro.webp',
    './assets/img/mesa_mago.webp',
    './assets/img/ui_moldura_perfil.webp',
    './assets/img/ui_placa_selecao.webp',
    './assets/img/ui_area_xp.webp',
    './assets/img/cluster_jogador.webp',
    './assets/img/cluster_inimigo.webp',
    './assets/img/deck_verso_cavaleiro.webp',
    './assets/img/deck_verso_mago.webp',
    './assets/img/card_verso_padrao.webp',
    './assets/img/card_selecao_cavaleiro.webp',
    './assets/img/card_selecao_mago.webp',
    './assets/img/carta_ataque_cavaleiro.webp',
    './assets/img/carta_bloqueio_cavaleiro.webp',
    './assets/img/carta_descansar_cavaleiro.webp',
    './assets/img/carta_desarmar_cavaleiro.webp',
    './assets/img/carta_treinar_cavaleiro.webp',
    './assets/img/carta_ataque_mago.webp',
    './assets/img/carta_bloqueio_mago.webp',
    './assets/img/carta_descansar_mago.webp',
    './assets/img/carta_desarmar_mago.webp',
    './assets/img/carta_treinar_mago.webp'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
