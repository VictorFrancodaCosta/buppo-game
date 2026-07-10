const SW_PATH = './sw.js';
let refreshing = false;

function isWebPwaEnvironment() {
    if (window.buppoDesktop) return false;
    if (!('serviceWorker' in navigator)) return false;
    return window.isSecureContext || /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
}

function isMatchActive() {
    const game = document.getElementById('game-screen');
    const end = document.getElementById('end-screen');
    return game?.classList.contains('active') && !end?.classList.contains('visible');
}

function activateWhenSafe(registration) {
    if (!registration.waiting) return;
    if (isMatchActive()) {
        window.__buppoWaitingUpdate = registration;
        return;
    }
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

async function registerPwa() {
    if (!isWebPwaEnvironment()) return;
    try {
        const registration = await navigator.serviceWorker.register(SW_PATH, { scope: './' });
        if (registration.waiting) activateWhenSafe(registration);
        registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
                if (worker.state === 'installed' && navigator.serviceWorker.controller) activateWhenSafe(registration);
            });
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing || isMatchActive()) return;
            refreshing = true;
            location.reload();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') registration.update().catch(() => {});
        });
        window.setInterval(() => registration.update().catch(() => {}), 15 * 60 * 1000);
    } catch (error) {
        console.warn('PWA indisponível nesta sessão.', error);
    }
}

window.applyDeferredBuppoUpdate = function() {
    const registration = window.__buppoWaitingUpdate;
    if (!registration || isMatchActive()) return false;
    window.__buppoWaitingUpdate = null;
    activateWhenSafe(registration);
    return true;
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', registerPwa, { once: true });
else registerPwa();
