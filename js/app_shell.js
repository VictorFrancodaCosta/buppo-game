const TUTORIAL_STEPS = [
    {
        title: 'SEU OBJETIVO',
        text: 'Use suas cartas para proteger sua vida, desenvolver sua experiência e superar o oponente. O tutorial apenas explica a interface: nenhuma regra da partida é modificada.'
    },
    {
        title: 'ESCOLHA UMA CARTA',
        text: 'A cada turno, escolha uma carta da sua mão. Ataque, Bloqueio, Descansar, Desarmar e Treinar mantêm exatamente os efeitos descritos nas próprias cartas.'
    },
    {
        title: 'VIDA E EXPERIÊNCIA',
        text: 'A vida aparece junto ao retrato de cada combatente. Cartas enviadas para a área de experiência ajudam na evolução durante a partida.'
    },
    {
        title: 'MAESTRIAS',
        text: 'Ao evoluir, as maestrias ficam visíveis ao lado do personagem. Passe o cursor ou toque nos indicadores para consultar o efeito atual.'
    },
    {
        title: 'PRONTO PARA JOGAR',
        text: 'Use o botão de configurações para ajustar áudio, tela cheia e animações. No PvP, aguarde sempre a confirmação visual do turno antes de sair da partida.'
    }
];

let tutorialIndex = 0;
let tutorialReturnFocus = null;
let reconnectTimer = null;
let activeDialog = null;
let activeDialogReturnFocus = null;
let dialogSyncQueued = false;

function createNetworkStatus() {
    let status = document.getElementById('network-status');
    if (status) return status;
    status = document.createElement('div');
    status.id = 'network-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'assertive');
    document.body.appendChild(status);
    return status;
}

function setNetworkStatus(message, type = 'offline', autoHide = false) {
    const status = createNetworkStatus();
    window.clearTimeout(reconnectTimer);
    status.textContent = message;
    status.classList.toggle('reconnected', type === 'reconnected');
    status.classList.add('visible');
    if (autoHide) {
        reconnectTimer = window.setTimeout(() => status.classList.remove('visible'), 2800);
    }
}

function syncOnlineStatus() {
    if (navigator.onLine) setNetworkStatus('CONEXÃO RESTABELECIDA', 'reconnected', true);
    else setNetworkStatus('SEM CONEXÃO • A PARTIDA ONLINE SERÁ RETOMADA QUANDO POSSÍVEL');
}

window.reportBuppoConnectivityIssue = function(message = 'NÃO FOI POSSÍVEL CONECTAR AO SERVIDOR') {
    setNetworkStatus(message);
};

function createTutorial() {
    let overlay = document.getElementById('tutorial-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.className = 'tutorial-overlay';
    overlay.innerHTML = `
        <section class="tutorial-panel" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" aria-describedby="tutorial-text">
            <div class="tutorial-kicker">GUIA DO AVENTUREIRO</div>
            <h2 id="tutorial-title"></h2>
            <p id="tutorial-text"></p>
            <div class="tutorial-progress" aria-label="Progresso do tutorial"></div>
            <div class="tutorial-actions">
                <button type="button" class="secondary" data-tutorial-action="close">FECHAR</button>
                <button type="button" class="secondary" data-tutorial-action="previous">VOLTAR</button>
                <button type="button" data-tutorial-action="next">PRÓXIMO</button>
            </div>
        </section>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (event) => {
        const action = event.target.closest('[data-tutorial-action]')?.dataset.tutorialAction;
        if (action === 'close') closeTutorial();
        if (action === 'previous') renderTutorialStep(tutorialIndex - 1);
        if (action === 'next') {
            if (tutorialIndex >= TUTORIAL_STEPS.length - 1) closeTutorial();
            else renderTutorialStep(tutorialIndex + 1);
        }
        if (event.target === overlay) closeTutorial();
    });
    return overlay;
}

function renderTutorialStep(index) {
    const overlay = createTutorial();
    tutorialIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, index));
    const step = TUTORIAL_STEPS[tutorialIndex];
    overlay.querySelector('#tutorial-title').textContent = step.title;
    overlay.querySelector('#tutorial-text').textContent = step.text;
    overlay.querySelector('[data-tutorial-action="previous"]').hidden = tutorialIndex === 0;
    overlay.querySelector('[data-tutorial-action="next"]').textContent = tutorialIndex === TUTORIAL_STEPS.length - 1 ? 'CONCLUIR' : 'PRÓXIMO';
    overlay.querySelector('.tutorial-progress').innerHTML = TUTORIAL_STEPS.map((_, i) =>
        `<span class="tutorial-dot ${i === tutorialIndex ? 'active' : ''}" aria-label="Etapa ${i + 1} de ${TUTORIAL_STEPS.length}"></span>`
    ).join('');
}

function openTutorial() {
    tutorialReturnFocus = document.activeElement;
    renderTutorialStep(0);
    const overlay = createTutorial();
    overlay.classList.add('visible');
    overlay.querySelector('[data-tutorial-action="next"]')?.focus();
}

function closeTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    if (tutorialReturnFocus?.focus) tutorialReturnFocus.focus();
}

window.openBuppoTutorial = openTutorial;
window.closeBuppoTutorial = closeTutorial;

function getFocusable(container) {
    return [...container.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.offsetParent !== null);
}

function getVisibleDialog() {
    const candidates = [...document.querySelectorAll('.tutorial-overlay.visible, .modal-overlay, #end-screen.visible, .purchase-confirm-overlay.visible')];
    return candidates.reverse().find((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.pointerEvents !== 'none';
    }) || null;
}

document.addEventListener('keydown', (event) => {
    const dialog = getVisibleDialog();
    if (!dialog) return;
    if (event.key === 'Escape') {
        if (dialog.id === 'tutorial-overlay') closeTutorial();
        else if (dialog.id === 'config-overlay') window.toggleConfig?.();
        else if (dialog.id === 'history-screen') window.closeHistory?.();
        else if (dialog.id === 'add-friend-screen') window.closeAddFriendModal?.();
        else if (dialog.id === 'modal-overlay') window.cancelModal?.();
        else if (dialog.id === 'purchase-confirm-overlay') dialog.classList.remove('visible');
        return;
    }
    if (event.key !== 'Tab') return;
    const focusable = getFocusable(dialog);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

function syncHealthBars() {
    [['p-hp-txt', 'p-hp-bar'], ['m-hp-txt', 'm-hp-bar']].forEach(([textId, barId]) => {
        const text = document.getElementById(textId)?.textContent || '';
        const [value, max] = text.split('/').map(Number);
        const bar = document.getElementById(barId);
        if (!bar || !Number.isFinite(value) || !Number.isFinite(max)) return;
        bar.setAttribute('aria-valuenow', String(Math.max(0, value)));
        bar.setAttribute('aria-valuemax', String(Math.max(1, max)));
        bar.setAttribute('aria-valuetext', `${Math.max(0, value)} de ${Math.max(1, max)}`);
    });
}

function syncDialogFocus() {
    dialogSyncQueued = false;
    const visibleDialog = getVisibleDialog();
    if (visibleDialog === activeDialog) return;
    if (!visibleDialog && activeDialogReturnFocus?.focus) activeDialogReturnFocus.focus();
    activeDialog = visibleDialog;
    if (!visibleDialog) {
        activeDialogReturnFocus = null;
        return;
    }
    activeDialogReturnFocus = document.activeElement;
    const panel = visibleDialog.querySelector('[role="dialog"], .modal-box, .history-panel, .end-content');
    if(panel && !panel.hasAttribute('role')) panel.setAttribute('role', 'dialog');
    const focusable = getFocusable(visibleDialog);
    if(focusable[0]) focusable[0].focus();
}

function queueDialogFocusSync() {
    if(dialogSyncQueued) return;
    dialogSyncQueued = true;
    requestAnimationFrame(syncDialogFocus);
}

function applyReducedMotion(enabled) {
    document.documentElement.classList.toggle('reduce-motion', enabled);
    const checkbox = document.getElementById('check-reduced-motion');
    if (checkbox) checkbox.checked = enabled;
    window.reducedMotionEnabled = enabled;
    try { localStorage.setItem('buppoReducedMotion', enabled ? '1' : '0'); } catch (error) {}
}

window.toggleReducedMotionPreference = function() {
    applyReducedMotion(document.getElementById('check-reduced-motion')?.checked === true);
    window.saveAudioSettings?.();
};

window.applyReducedMotionPreference = applyReducedMotion;

function initAppShell() {
    createNetworkStatus();
    createTutorial();
    document.getElementById('btn-start-tutorial')?.addEventListener('click', openTutorial);
    document.addEventListener('buppo:open-tutorial', openTutorial);
    window.addEventListener('offline', syncOnlineStatus);
    window.addEventListener('online', syncOnlineStatus);
    if (!navigator.onLine) syncOnlineStatus();
    let savedMotion = null;
    try { savedMotion = localStorage.getItem('buppoReducedMotion'); } catch (error) {}
    applyReducedMotion(savedMotion === '1' || (savedMotion === null && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
    syncHealthBars();
    const healthObserver = new MutationObserver(syncHealthBars);
    ['p-hp-txt', 'm-hp-txt'].forEach((id) => {
        const target = document.getElementById(id);
        if (target) healthObserver.observe(target, { childList: true, characterData: true, subtree: true });
    });
    const dialogObserver = new MutationObserver(queueDialogFocusSync);
    dialogObserver.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAppShell, { once: true });
else initAppShell();
