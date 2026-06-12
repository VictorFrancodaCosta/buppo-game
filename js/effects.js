// ARQUIVO: js/effects.js

function safeLobbyEnhancement(name, callback) {
    try {
        callback();
    } catch (error) {
        console.warn(`[BUPPO] ${name} desativado para manter o jogo aberto.`, error);
    }
}

safeLobbyEnhancement('failsafe do carregamento', () => {
    const start = () => {
        setTimeout(() => {
            const loading = document.getElementById('loading-screen');
            if (!loading || loading.style.display === 'none') return;

            loading.style.opacity = '0';
            setTimeout(() => {
                if (loading.style.display !== 'none') loading.style.display = 'none';
            }, 450);
        }, 5000);
    };

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
});

safeLobbyEnhancement('ajustes visuais estaticos', () => {
    const style = document.createElement('style');
    style.textContent = `
        .lobby-logo-right::after,
        #transition-overlay::before {
            content: none !important;
            display: none !important;
            animation: none !important;
        }

        .lobby-player-card {
            display: none !important;
        }

        .lobby-play-center {
            position: fixed !important;
            left: 50% !important;
            top: clamp(260px, 33vh, 360px) !important;
            transform: translateX(-50%) !important;
            z-index: 8 !important;
            width: clamp(430px, 31vw, 600px) !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 12px !important;
            pointer-events: none !important;
        }

        .lobby-play-center > * {
            pointer-events: auto !important;
        }

        .lobby-ui-overlay {
            padding: 17% 10.5% 9.5% 10.5% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            height: 100% !important;
            row-gap: 0 !important;
        }

        .user-welcome {
            font-size: 22px !important;
            margin-bottom: 4px !important;
        }

        .user-stats {
            font-size: 13px !important;
            margin-bottom: 10px !important;
        }

        .ranking-scroll {
            width: 100% !important;
            flex: 1 1 auto !important;
            min-height: 0 !important;
            max-height: none !important;
            height: auto !important;
            margin-top: 10px !important;
            margin-bottom: 0 !important;
            padding-bottom: 18px !important;
        }

        #ranking-table {
            font-size: 15px !important;
        }

        #ranking-table th {
            padding: 6px !important;
        }

        #ranking-table td {
            padding: 8px 6px !important;
        }

        .rank-1 {
            font-size: 16px !important;
        }

        .lobby-logo-right {
            transform-origin: center center !important;
            animation: lobbyLogoEntranceJuice 0.82s cubic-bezier(0.12, 1.22, 0.2, 1) both !important;
        }

        .lobby-frame-img {
            filter: drop-shadow(10px 12px 0 rgba(20, 10, 6, 0.82))
                    drop-shadow(0 22px 42px rgba(0, 0, 0, 0.42)) !important;
        }

        .friends-panel {
            box-shadow: 8px 10px 0 rgba(17, 8, 5, 0.72),
                        0 18px 30px rgba(0, 0, 0, 0.34),
                        inset 0 0 0 2px rgba(255,255,255,0.12),
                        inset 0 -18px 28px rgba(0,0,0,0.28) !important;
        }

        .lobby-btn-row {
            gap: 8px !important;
            width: 100% !important;
            margin: 0 !important;
            padding-top: 0 !important;
            align-self: stretch !important;
            align-items: center !important;
        }

        #btn-play-pvp,
        #btn-play-pve {
            width: 100% !important;
            aspect-ratio: 2048 / 680 !important;
            min-height: 0 !important;
            height: auto !important;
            padding: 8px 46px 10px !important;
            border: 0 !important;
            border-radius: 0 !important;
            outline: 0 !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-size: 100% 100% !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0 !important;
            position: relative !important;
            overflow: hidden !important;
            isolation: isolate !important;
            animation: none !important;
            appearance: none !important;
            cursor: pointer !important;
            -webkit-tap-highlight-color: transparent !important;
            transition: transform 0.13s cubic-bezier(0.22, 1, 0.36, 1),
                        filter 0.13s ease,
                        box-shadow 0.13s ease !important;
        }

        #btn-play-pvp {
            width: 96% !important;
            aspect-ratio: 2048 / 650 !important;
            background: transparent url('assets/img/btn_pvp_ranked.webp?v=2') center / 100% 100% no-repeat !important;
            filter: drop-shadow(6px 8px 0 rgba(26, 11, 4, 0.82))
                    drop-shadow(0 14px 18px rgba(0, 0, 0, 0.26)) !important;
        }

        #btn-play-pve {
            width: 80% !important;
            aspect-ratio: 2048 / 760 !important;
            background: transparent url('assets/img/btn_pve_training.webp?v=2') center / 100% 100% no-repeat !important;
            filter: drop-shadow(6px 8px 0 rgba(23, 9, 29, 0.78))
                    drop-shadow(0 13px 17px rgba(0, 0, 0, 0.24)) !important;
        }

        #btn-play-pvp::after,
        #btn-play-pve::after {
            content: none !important;
            display: none !important;
            animation: none !important;
        }

        #btn-play-pvp::before,
        #btn-play-pve::before {
            content: none !important;
            display: none !important;
        }

        #btn-play-pvp .btn-sub:empty,
        #btn-play-pve .btn-sub:empty {
            display: none !important;
        }

        #btn-play-pvp:hover,
        #btn-play-pve:hover {
            transform: translateY(-3px) scale(1.025) !important;
        }

        #btn-play-pvp:hover {
            filter: brightness(1.06)
                    drop-shadow(7px 10px 0 rgba(26, 11, 4, 0.84))
                    drop-shadow(0 16px 18px rgba(0, 0, 0, 0.28))
                    drop-shadow(0 0 16px rgba(255, 196, 46, 0.24)) !important;
        }

        #btn-play-pve:hover {
            filter: brightness(1.07)
                    drop-shadow(7px 10px 0 rgba(23, 9, 29, 0.8))
                    drop-shadow(0 15px 17px rgba(0, 0, 0, 0.26))
                    drop-shadow(0 0 16px rgba(191, 112, 255, 0.2)) !important;
        }

        #btn-play-pvp:active,
        #btn-play-pve:active {
            transform: translateY(3px) scale(0.985) !important;
        }

        #btn-play-pvp:focus-visible,
        #btn-play-pve:focus-visible {
            transform: translateY(-2px) scale(1.015) !important;
        }

        #btn-play-pvp:active::before,
        #btn-play-pve:active::before {
            opacity: 0.55 !important;
        }

        #btn-play-pvp .btn-title,
        #btn-play-pve .btn-title,
        #btn-play-pvp .btn-sub,
        #btn-play-pve .btn-sub {
            position: relative !important;
            z-index: 1 !important;
            line-height: 1 !important;
            text-align: center !important;
            text-transform: uppercase !important;
            pointer-events: none !important;
            transform: translateY(0) !important;
        }

        #btn-play-pvp .btn-title {
            font-family: 'Bangers', cursive !important;
            font-size: 32px !important;
            color: #ffe58a !important;
            letter-spacing: 1px !important;
            -webkit-text-stroke: 1.8px #2d0d02 !important;
            paint-order: stroke fill !important;
            text-shadow: 3px 3px 0 #2d0d02, 0 4px 8px rgba(28, 7, 0, 0.6), 0 0 10px rgba(255, 213, 79, 0.34) !important;
        }

        #btn-play-pvp .btn-sub {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 12px !important;
            font-weight: 900 !important;
            letter-spacing: 0.02em !important;
            color: #ffe78a !important;
            -webkit-text-stroke: 0.45px #3b1300 !important;
            text-shadow: 0 2px 0 rgba(92, 31, 0, 0.85), 0 3px 8px rgba(20, 5, 0, 0.75) !important;
        }

        #btn-play-pve .btn-title {
            font-family: 'Bangers', cursive !important;
            font-size: 31px !important;
            color: #f1deff !important;
            letter-spacing: 1px !important;
            -webkit-text-stroke: 1.8px #22062d !important;
            paint-order: stroke fill !important;
            text-shadow: 3px 3px 0 #22062d, 0 4px 8px rgba(18, 3, 29, 0.56), 0 0 10px rgba(201, 155, 255, 0.3) !important;
        }

        #btn-play-pve .btn-sub {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 12px !important;
            font-weight: 800 !important;
            letter-spacing: 0.03em !important;
            color: #ffe7ff !important;
            -webkit-text-stroke: 0.45px #2b0a38 !important;
            text-shadow: 0 2px 0 rgba(65, 20, 82, 0.86), 0 3px 8px rgba(17, 3, 25, 0.76) !important;
        }

        #btn-history {
            width: 68% !important;
            max-width: 340px !important;
            min-height: 38px !important;
            margin-top: 2px !important;
            margin-bottom: 0 !important;
            padding: 7px 14px !important;
            font-size: 11px !important;
            border-radius: 8px !important;
            align-self: center !important;
            background: linear-gradient(180deg, rgba(94, 66, 15, 0.96), rgba(42, 26, 7, 0.98)) !important;
            border: 2px solid rgba(255, 215, 0, 0.88) !important;
            color: #ffe082 !important;
            box-shadow: 5px 6px 0 rgba(26, 11, 4, 0.78),
                        0 10px 18px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
            text-shadow: 0 2px 0 rgba(50, 26, 0, 0.92), 0 4px 8px rgba(0, 0, 0, 0.65) !important;
            transition: transform 0.13s cubic-bezier(0.22, 1, 0.36, 1),
                        filter 0.13s ease,
                        box-shadow 0.13s ease !important;
        }

        #btn-history::after {
            content: none !important;
            display: none !important;
        }

        #btn-history:hover {
            transform: translateY(-2px) scale(1.01) !important;
            filter: brightness(1.05) !important;
            box-shadow: 0 14px 24px rgba(0, 0, 0, 0.42), 0 0 16px rgba(255, 215, 0, 0.18) !important;
        }

        #btn-history:active {
            transform: translateY(2px) scale(0.985) !important;
        }

        #btn-logout {
            position: absolute !important;
            left: 50% !important;
            bottom: 5.5% !important;
            transform: translateX(-50%) !important;
            margin: 0 !important;
            padding: 6px 18px !important;
            font-size: 10px !important;
            min-width: 162px !important;
            z-index: 2 !important;
        }

        @media (max-width: 980px) and (orientation: landscape) {
            .lobby-logo-right {
                width: min(20vw, 160px) !important;
                max-width: 160px !important;
                top: 4px !important;
            }
        }

        @media (max-width: 768px) {
            .lobby-logo-right {
                width: min(68vw, 300px) !important;
                max-width: 300px !important;
            }

            .lobby-play-center {
                top: clamp(250px, 41vh, 390px) !important;
                width: min(90vw, 440px) !important;
                gap: 12px !important;
            }

            .lobby-ui-overlay {
                padding: 24% 11% 10% 11% !important;
            }

            .ranking-scroll {
                padding-bottom: 14px !important;
            }

            #btn-play-pvp,
            #btn-play-pve {
                aspect-ratio: 2048 / 700 !important;
                min-height: 0 !important;
                padding: 7px 24px 10px !important;
            }

            #btn-play-pvp {
                width: 96% !important;
                aspect-ratio: 2048 / 665 !important;
            }

            #btn-play-pve {
                width: 84% !important;
                aspect-ratio: 2048 / 770 !important;
            }

            #btn-play-pvp .btn-title {
                font-size: 25px !important;
            }

            #btn-play-pve .btn-title {
                font-size: 24px !important;
            }

            #btn-play-pvp .btn-sub,
            #btn-play-pve .btn-sub {
                font-size: 10px !important;
            }

            #btn-history {
                width: 70% !important;
                min-height: 34px !important;
                font-size: 10px !important;
                padding: 6px 10px !important;
            }
        }

        @keyframes lobbyLogoEntranceJuice {
            0% {
                opacity: 0;
                transform: translateX(-50%) translateY(28px) scale(0.48, 1.55) rotate(-5deg);
                filter: drop-shadow(0 0 0 rgba(0,0,0,0));
            }
            34% {
                opacity: 1;
                transform: translateX(-50%) translateY(-18px) scale(1.24, 0.74) rotate(3deg);
                filter: drop-shadow(0 18px 34px rgba(0,0,0,0.95)) drop-shadow(0 0 28px rgba(255,215,0,0.55));
            }
            56% {
                transform: translateX(-50%) translateY(8px) scale(0.88, 1.16) rotate(-2deg);
            }
            75% {
                transform: translateX(-50%) translateY(-5px) scale(1.08, 0.94) rotate(1deg);
            }
            100% {
                opacity: 1;
                transform: translateX(-50%) translateY(0) scale(1) rotate(0deg);
                filter: drop-shadow(0 10px 30px rgba(0,0,0,0.9));
            }
        }
    `;
    document.head.appendChild(style);

    const syncResponsiveRuntimeLayout = () => {
        const isTouchLayout = window.matchMedia('(hover: none), (pointer: coarse)').matches;
        const isTouchLandscape = isTouchLayout && window.innerWidth > window.innerHeight;
        const logo = document.querySelector('.lobby-logo-right');
        const frame = document.querySelector('.lobby-frame-container');
        const uiOverlay = document.querySelector('.lobby-ui-overlay');
        const middleArea = document.querySelector('.middle-area');
        const slots = document.querySelectorAll('.slot');
        const tableCards = document.querySelectorAll('.slot .card');

        if (logo) {
            if (isTouchLandscape) {
                logo.style.setProperty('width', 'clamp(220px, 29vw, 320px)', 'important');
                logo.style.setProperty('max-width', '320px', 'important');
                logo.style.setProperty('min-width', '220px', 'important');
                logo.style.setProperty('top', '34px', 'important');
            } else if (isTouchLayout) {
                logo.style.setProperty('width', '260px', 'important');
                logo.style.setProperty('max-width', '260px', 'important');
                logo.style.removeProperty('min-width');
                logo.style.setProperty('top', '12px', 'important');
            } else {
                logo.style.removeProperty('width');
                logo.style.removeProperty('max-width');
                logo.style.removeProperty('min-width');
                logo.style.removeProperty('top');
            }
        }

        if (frame) {
            if (isTouchLandscape) {
                frame.style.setProperty('height', 'min(74dvh, 540px)', 'important');
                frame.style.setProperty('max-height', '540px', 'important');
                frame.style.setProperty('margin-top', '16px', 'important');
            } else {
                frame.style.removeProperty('height');
                frame.style.removeProperty('max-height');
                frame.style.removeProperty('margin-top');
            }
        }

        if (uiOverlay) {
            if (isTouchLandscape) uiOverlay.style.setProperty('padding-top', '19%', 'important');
            else uiOverlay.style.removeProperty('padding-top');
        }

        if (middleArea) {
            if (isTouchLandscape) {
                middleArea.style.setProperty('gap', '30px', 'important');
                middleArea.style.setProperty('padding-bottom', '18px', 'important');
            } else {
                middleArea.style.removeProperty('gap');
                middleArea.style.removeProperty('padding-bottom');
            }
        }

        slots.forEach((slot) => {
            if (isTouchLandscape) {
                slot.style.setProperty('width', '136px', 'important');
                slot.style.setProperty('height', '200px', 'important');
                slot.style.setProperty('transform', 'rotateX(18deg)', 'important');
                slot.style.setProperty('margin-top', '-30px', 'important');
            } else {
                slot.style.removeProperty('width');
                slot.style.removeProperty('height');
                slot.style.removeProperty('transform');
                slot.style.removeProperty('margin-top');
            }
        });

        tableCards.forEach((card) => {
            if (isTouchLandscape) card.style.setProperty('border-radius', '12px', 'important');
            else card.style.removeProperty('border-radius');
        });
    };

    window.syncResponsiveRuntimeLayout = syncResponsiveRuntimeLayout;
    syncResponsiveRuntimeLayout();
    window.addEventListener('resize', syncResponsiveRuntimeLayout);
    window.addEventListener('orientationchange', syncResponsiveRuntimeLayout);
    window.addEventListener('load', syncResponsiveRuntimeLayout);
    setTimeout(syncResponsiveRuntimeLayout, 120);
    setTimeout(syncResponsiveRuntimeLayout, 700);

    const lobbyScreen = document.getElementById('lobby-screen');
    const overlay = lobbyScreen?.querySelector('.lobby-ui-overlay') || null;
    let existingRow = document.querySelector('.lobby-btn-row');
    let historyButton = document.getElementById('btn-history');
    if (lobbyScreen) {
        let playCenter = document.querySelector('.lobby-play-center');
        if (!playCenter) {
            playCenter = document.createElement('div');
            playCenter.className = 'lobby-play-center';
            lobbyScreen.appendChild(playCenter);
        }

        const ensurePlayButton = (id, title, subtitle, tooltip, handlerName) => {
            let button = document.getElementById(id);
            if (!button) {
                button = document.createElement('button');
                button.id = id;
                button.type = 'button';
            }

            button.setAttribute('data-tip', tooltip);
            button.onclick = () => {
                if (typeof window[handlerName] === 'function') {
                    window[handlerName]();
                }
            };

            const titleSpan = document.createElement('span');
            titleSpan.className = 'btn-title';
            titleSpan.textContent = title;

            const subSpan = document.createElement('span');
            subSpan.className = 'btn-sub';
            subSpan.textContent = subtitle;

            button.replaceChildren(titleSpan, subSpan);
            return button;
        };

        if (!existingRow) {
            existingRow = document.createElement('div');
            existingRow.className = 'lobby-btn-row';
        }

        const pvpButton = ensurePlayButton(
            'btn-play-pvp',
            'PARTIDA RANQUEADA',
            '',
            'Entre na fila ranqueada',
            'startPvPSearch'
        );
        const pveButton = ensurePlayButton(
            'btn-play-pve',
            'PARTIDA PVE',
            '',
            'Treine contra a CPU',
            'startPvE'
        );

        if (pvpButton.parentElement !== existingRow) {
            existingRow.appendChild(pvpButton);
        }

        if (pveButton.parentElement !== existingRow) {
            existingRow.appendChild(pveButton);
        }

        if (existingRow.parentElement !== playCenter) {
            playCenter.appendChild(existingRow);
        }

        if (!historyButton && overlay) {
            historyButton = document.createElement('button');
            historyButton.id = 'btn-history';
            historyButton.type = 'button';
            historyButton.onclick = () => window.openHistory?.();
            overlay.appendChild(historyButton);
        }

        if (historyButton) {
            historyButton.textContent = 'HIST\u00d3RICO DE PARTIDAS';
            if (historyButton.parentElement !== playCenter) {
                playCenter.appendChild(historyButton);
            }
        }
    }
});

// 1. EFEITO DE CURA
window.triggerHealEffect = function() {
    const body = document.body;
    const overlay = document.getElementById('heal-overlay');
    const light = document.getElementById('holy-light');
    const particlesContainer = document.getElementById('particles-container');

    // Som (Se existir no main.js, isso toca l\u00e1, mas podemos garantir aqui se quiser)
    // Por enquanto, s\u00f3 visual:

    // 1. Respiro
    body.classList.remove('screen-breathe');
    void body.offsetWidth; // Reset
    body.classList.add('screen-breathe');

    // 2. Aura e Luz
    overlay.classList.remove('active');
    light.classList.remove('active');
    void overlay.offsetWidth; 
    overlay.classList.add('active');
    light.classList.add('active');

    // 3. Part\u00edculas
    if (particlesContainer) {
        particlesContainer.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            const isCross = Math.random() > 0.3;
            if (isCross) {
                particle.classList.add('heal-particle');
                particle.textContent = "+";
                const size = Math.random() * 2 + 1.5;
                particle.style.fontSize = size + 'rem';
            } else {
                particle.classList.add('sparkle-particle');
                // Part\u00edcula branca/verde
            }
            particle.style.left = Math.random() * 100 + 'vw';
            const duration = Math.random() * 1 + 1.5;
            particle.style.animationDuration = duration + 's';
            const delay = Math.random() * 0.5;
            particle.style.animationDelay = delay + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // Limpeza
    setTimeout(() => {
        body.classList.remove('screen-breathe');
        overlay.classList.remove('active');
        light.classList.remove('active');
        if(particlesContainer) particlesContainer.innerHTML = '';
    }, 2500);
}

// 2. EFEITO DE DANO
window.triggerDamageEffect = function() {
    const body = document.body;
    const bloodContainer = document.getElementById('blood-container');
    // const cutLine = document.getElementById('cut-line'); // Removido refer\u00eancia ao corte

    // 1. Tremor (Mantido)
    body.classList.remove('shake-screen-hard');
    void body.offsetWidth; 
    body.classList.add('shake-screen-hard');

    // 2. O CORTE FOI REMOVIDO DAQUI

    // 3. Sangue (Mantido)
    if (bloodContainer) {
        bloodContainer.innerHTML = ''; 
        
        // A) Manchas GRANDES
        for(let i=0; i<4; i++) {
            const bigSpot = document.createElement('div');
            bigSpot.classList.add('blood-spot', 'big-splatter');
            const size = Math.random() * 100 + 100; 
            bigSpot.style.width = size + 'px';
            bigSpot.style.height = size + 'px';
            bigSpot.style.left = (Math.random() * 100 - 10) + '%';
            bigSpot.style.top = (Math.random() * 100 - 10) + '%';
            bigSpot.style.animationDelay = (Math.random() * 0.1) + 's';
            bloodContainer.appendChild(bigSpot);
        }
        
        // B) Gotas
        const drops = Math.floor(Math.random() * 10 + 20);
        for(let i=0; i < drops; i++) {
            const drop = document.createElement('div');
            drop.classList.add('blood-spot');
            const size = Math.random() * 25 + 10;
            drop.style.width = size + 'px';
            drop.style.height = size + 'px';
            drop.style.left = Math.random() * 100 + 'vw';
            drop.style.top = Math.random() * 100 + 'vh';
            const deform = Math.random() * 20 + 40; 
            drop.style.borderRadius = `${deform}% ${100-deform}% ${deform}% ${100-deform}%`;
            drop.style.animationDelay = (Math.random() * 0.2 + 0.1) + 's';
            bloodContainer.appendChild(drop);
        }
    }

    // Limpeza
    setTimeout(() => {
        body.classList.remove('shake-screen-hard');
        if(bloodContainer) bloodContainer.innerHTML = '';
    }, 2600);
}
// 3. EFEITO DE BLOQUEIO (Escudo + Onda + Texto "BLOQUEADO")
window.triggerBlockEffect = function() {
    const body = document.body;
    const overlay = document.getElementById('block-overlay');
    const shockwave = document.getElementById('shockwave');

    // 1. Recuo da Tela
    body.classList.remove('screen-recoil');
    void body.offsetWidth; 
    body.classList.add('screen-recoil');

    // 2. Overlay e Onda
    if(overlay) { 
        overlay.classList.remove('active'); 
        void overlay.offsetWidth; 
        overlay.classList.add('active'); 
    }
    if(shockwave) { 
        shockwave.classList.remove('active'); 
        void shockwave.offsetWidth; 
        shockwave.classList.add('active'); 
    }

    // 3. TEXTO "BLOQUEADO" (Novo)
    const blockText = document.createElement('div');
    blockText.innerText = "BLOQUEADO";
    
    // Estilos Inline para garantir o visual pedido
    blockText.style.position = 'fixed';
    blockText.style.top = '45%'; // Um pouco acima do centro exato
    blockText.style.left = '50%';
    blockText.style.transform = 'translate(-50%, -50%) scale(0.5)'; // Come\u00e7a pequeno
    blockText.style.fontFamily = "'Bangers', cursive";
    blockText.style.fontSize = '5rem'; // Tamanho m\u00e9dio
    blockText.style.color = '#3498db'; // Azul do bloqueio
    blockText.style.webkitTextStroke = '2px black'; // Outline preto
    blockText.style.textShadow = '0 0 10px rgba(52, 152, 219, 0.8)';
    blockText.style.zIndex = '9005'; // Acima de tudo
    blockText.style.pointerEvents = 'none';
    blockText.style.opacity = '0';
    blockText.style.transition = 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    document.body.appendChild(blockText);

    // Anima\u00e7\u00e3o de Entrada (Pop)
    requestAnimationFrame(() => {
        blockText.style.opacity = '1';
        blockText.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Limpeza Geral
    setTimeout(() => {
        // Sa\u00edda do texto
        blockText.style.opacity = '0';
        blockText.style.transform = 'translate(-50%, -0%) scale(1.5)'; // Sobe e cresce sumindo
        
        // Remove classes
        body.classList.remove('screen-recoil');
        if(overlay) overlay.classList.remove('active');
        if(shockwave) shockwave.classList.remove('active');
        
        // Remove elemento texto do DOM
        setTimeout(() => blockText.remove(), 300);
    }, 700);
}
