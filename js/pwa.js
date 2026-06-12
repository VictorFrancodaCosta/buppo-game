const INSTALL_BUTTON_ID = 'btn-install-app';
const INSTALL_HINT_ID = 'install-hint';
const UPDATE_TOAST_ID = 'pwa-update-toast';
const UPDATE_TITLE_ID = 'pwa-update-title';
const UPDATE_TEXT_ID = 'pwa-update-text';
const UPDATE_ACTION_ID = 'pwa-update-action';
const UPDATE_DISMISS_ID = 'pwa-update-dismiss';

let deferredInstallPrompt = null;
let serviceWorkerRegistration = null;
let hasReloadedForUpdate = false;
let installFallbackTimer = null;
let dismissedWaitingScriptURL = null;
let updateActivationTimer = null;

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isTouchMobile() {
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

function isAndroidDevice() {
    return /Android/i.test(window.navigator.userAgent || '');
}

function canUseServiceWorker() {
    if (!('serviceWorker' in navigator)) return false;
    return window.isSecureContext || /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
}

function syncFullscreenButtonVisibility() {
    const button = document.getElementById('btn-fullscreen');
    if (!button) return;
    button.style.display = (isTouchMobile() || isStandaloneMode()) ? 'none' : '';
}

function getInstallButton() {
    return document.getElementById(INSTALL_BUTTON_ID);
}

function getInstallHint() {
    return document.getElementById(INSTALL_HINT_ID);
}

function setInstallPromptVisibility(visible, label = 'INSTALAR APP', hint = '') {
    const button = getInstallButton();
    const hintEl = getInstallHint();
    if (!button || !hintEl) return;

    button.hidden = !visible;
    button.textContent = label;

    hintEl.hidden = !hint;
    hintEl.textContent = hint;
}

function hideInstallPrompt() {
    setInstallPromptVisibility(false, 'INSTALAR APP', '');
}

function showInstallInstructions() {
    const message = 'No Chrome Android, abra o menu do navegador e toque em "Instalar app" ou "Adicionar a tela inicial".';
    if (typeof window.openModal === 'function') {
        window.openModal('INSTALAR APP', message, ['OK'], () => {});
    } else {
        window.alert(message);
    }
}

async function handleInstallClick() {
    if (typeof window.playNavSound === 'function') window.playNavSound();

    if (!deferredInstallPrompt) {
        showInstallInstructions();
        return;
    }

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;

    if (choice && choice.outcome === 'accepted') {
        setInstallPromptVisibility(true, 'INSTALANDO...', 'O Android esta adicionando o BUPPO como app.');
        window.setTimeout(hideInstallPrompt, 2400);
    } else {
        setInstallPromptVisibility(true, 'INSTALAR APP', 'Instale o BUPPO para abrir em tela cheia.');
    }
}

function bindInstallPromptUI() {
    const button = getInstallButton();
    if (!button) return;
    button.addEventListener('click', handleInstallClick);
}

function scheduleInstallFallback() {
    window.clearTimeout(installFallbackTimer);
    installFallbackTimer = window.setTimeout(() => {
        if (isStandaloneMode() || deferredInstallPrompt || !isTouchMobile() || !isAndroidDevice()) return;
        setInstallPromptVisibility(true, 'COMO INSTALAR', 'Abra o menu do navegador e toque em "Instalar app".');
    }, 2600);
}

function bindBeforeInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        setInstallPromptVisibility(true, 'INSTALAR APP', 'Instale o BUPPO para abrir em tela cheia.');
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        setInstallPromptVisibility(true, 'APP INSTALADO', 'O BUPPO agora pode ser aberto como jogo no celular.');
        window.setTimeout(hideInstallPrompt, 2600);
    });
}

function isLiveMatchRunning() {
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    return !!gameScreen && gameScreen.classList.contains('active') && !(endScreen && endScreen.classList.contains('visible'));
}

function showUpdateToast(title, text, actionLabel, onAction) {
    const toast = document.getElementById(UPDATE_TOAST_ID);
    const titleEl = document.getElementById(UPDATE_TITLE_ID);
    const textEl = document.getElementById(UPDATE_TEXT_ID);
    const actionBtn = document.getElementById(UPDATE_ACTION_ID);
    const dismissBtn = document.getElementById(UPDATE_DISMISS_ID);
    if (!toast || !titleEl || !textEl || !actionBtn || !dismissBtn) return;

    titleEl.textContent = title;
    textEl.textContent = text;
    actionBtn.textContent = actionLabel;
    actionBtn.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onAction === 'function') onAction();
    };
    dismissBtn.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        hideUpdateToast(true);
    };
    toast.hidden = false;
    toast.style.display = 'flex';
}

function hideUpdateToast(rememberDismissal = false) {
    const toast = document.getElementById(UPDATE_TOAST_ID);
    if (rememberDismissal && serviceWorkerRegistration && serviceWorkerRegistration.waiting) {
        dismissedWaitingScriptURL = serviceWorkerRegistration.waiting.scriptURL || '__waiting__';
    }
    if (toast) {
        toast.hidden = true;
        toast.style.display = 'none';
    }
}

function activateWaitingWorker() {
    if (!serviceWorkerRegistration || !serviceWorkerRegistration.waiting) {
        hideUpdateToast();
        return;
    }
    dismissedWaitingScriptURL = null;
    showUpdateToast(
        'ATUALIZANDO BUPPO',
        'Aplicando a nova versao do jogo agora.',
        'ATUALIZANDO',
        () => {}
    );
    serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.clearTimeout(updateActivationTimer);
    updateActivationTimer = window.setTimeout(() => {
        if (!hasReloadedForUpdate) window.location.reload();
    }, 1800);
}

function handleWaitingServiceWorker() {
    if (!serviceWorkerRegistration || !serviceWorkerRegistration.waiting) return;
    const waitingScriptURL = serviceWorkerRegistration.waiting.scriptURL || '__waiting__';
    if (dismissedWaitingScriptURL === waitingScriptURL) return;

    if (isLiveMatchRunning()) {
        showUpdateToast(
            'NOVA VERSAO PRONTA',
            'Termine a partida e toque em atualizar para recarregar o jogo.',
            'ATUALIZAR',
            activateWaitingWorker
        );
        return;
    }

    activateWaitingWorker();
}

async function registerServiceWorker() {
    if (!canUseServiceWorker()) return;

    try {
        serviceWorkerRegistration = await navigator.serviceWorker.register('./sw.js', { scope: './' });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (hasReloadedForUpdate) return;
            hasReloadedForUpdate = true;
            window.clearTimeout(updateActivationTimer);
            window.location.reload();
        });

        if (serviceWorkerRegistration.waiting) handleWaitingServiceWorker();

        serviceWorkerRegistration.addEventListener('updatefound', () => {
            const installingWorker = serviceWorkerRegistration.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    handleWaitingServiceWorker();
                }
            });
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && serviceWorkerRegistration) {
                serviceWorkerRegistration.update().catch(() => {});
            }
        });

        window.setInterval(() => {
            if (serviceWorkerRegistration) serviceWorkerRegistration.update().catch(() => {});
        }, 5 * 60 * 1000);
    } catch (error) {
        console.warn('Falha ao registrar service worker do BUPPO.', error);
    }
}

export function initPWA() {
    bindInstallPromptUI();
    bindBeforeInstallPrompt();
    hideUpdateToast();
    syncFullscreenButtonVisibility();
    window.addEventListener('resize', syncFullscreenButtonVisibility);

    if (isStandaloneMode()) {
        hideInstallPrompt();
    } else {
        scheduleInstallFallback();
    }

    registerServiceWorker();
}
