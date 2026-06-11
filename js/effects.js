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

        .lobby-ui-overlay {
            padding: 18% 14% 12% 14% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            height: 100% !important;
            row-gap: 0 !important;
        }

        .user-welcome {
            font-size: 22px !important;
            margin-bottom: 2px !important;
        }

        .user-stats {
            font-size: 13px !important;
            margin-bottom: 8px !important;
        }

        .ranking-scroll {
            width: 100% !important;
            flex: 1 1 auto !important;
            min-height: 176px !important;
            max-height: 232px !important;
            height: auto !important;
            margin-bottom: 0 !important;
        }

        #ranking-table {
            font-size: 13px !important;
        }

        #ranking-table th {
            padding: 4px 5px !important;
        }

        #ranking-table td {
            padding: 6px 5px !important;
        }

        .rank-1 {
            font-size: 15px !important;
        }

        .lobby-logo-right {
            transform-origin: center center !important;
            animation: lobbyLogoEntranceJuice 0.82s cubic-bezier(0.12, 1.22, 0.2, 1) both,
                       lobbyLogoBreathe 4.2s ease-in-out 0.82s infinite !important;
        }

        .lobby-btn-row {
            gap: 8px !important;
            width: 100% !important;
            margin: 0 0 8px !important;
            margin-top: auto !important;
            padding-top: 10px !important;
            align-self: stretch !important;
        }

        #btn-play-pvp,
        #btn-play-pve {
            width: 96% !important;
            aspect-ratio: 2048 / 630 !important;
            min-height: 0 !important;
            height: auto !important;
            padding: 5px 46px 11px !important;
            border: 0 !important;
            border-radius: 0 !important;
            outline: 0 !important;
            background-color: transparent !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-size: 100% 100% !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 1px !important;
            position: relative !important;
            overflow: hidden !important;
            isolation: isolate !important;
            animation: none !important;
            appearance: none !important;
            -webkit-tap-highlight-color: transparent !important;
            transition: transform 0.13s cubic-bezier(0.22, 1, 0.36, 1),
                        filter 0.13s ease,
                        box-shadow 0.13s ease !important;
        }

        #btn-play-pvp {
            background-image: url('assets/img/btn_pvp_ranked.svg?v=3') !important;
            filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.34)) !important;
        }

        #btn-play-pve {
            background-image: url('assets/img/btn_pve_training.svg?v=3') !important;
            filter: drop-shadow(0 7px 12px rgba(0, 0, 0, 0.34)) !important;
        }

        #btn-play-pvp::after,
        #btn-play-pve::after {
            content: none !important;
            display: none !important;
            animation: none !important;
        }

        #btn-play-pvp::before,
        #btn-play-pve::before {
            content: '' !important;
            position: absolute !important;
            inset: 8px 42px 27px !important;
            border-radius: 999px !important;
            background: linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0) 58%) !important;
            mix-blend-mode: screen !important;
            opacity: 0.82 !important;
            pointer-events: none !important;
            z-index: 0 !important;
            transition: opacity 0.13s ease !important;
        }

        #btn-play-pvp:hover,
        #btn-play-pve:hover {
            transform: translateY(-3px) scale(1.025) !important;
        }

        #btn-play-pvp:hover {
            filter: brightness(1.07) drop-shadow(0 12px 18px rgba(0, 0, 0, 0.38)) drop-shadow(0 0 18px rgba(255, 196, 46, 0.26)) !important;
        }

        #btn-play-pve:hover {
            filter: brightness(1.08) drop-shadow(0 11px 16px rgba(0, 0, 0, 0.38)) drop-shadow(0 0 18px rgba(191, 112, 255, 0.22)) !important;
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
            font-family: 'Russo One', sans-serif !important;
            font-size: 22px !important;
            color: #fff4c8 !important;
            -webkit-text-stroke: 1px #361000 !important;
            text-shadow: 0 2px 0 #8b3400, 0 4px 8px rgba(28, 7, 0, 0.78), 0 0 10px rgba(255, 225, 116, 0.42) !important;
        }

        #btn-play-pvp .btn-sub {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 8px !important;
            font-weight: 900 !important;
            letter-spacing: 0.02em !important;
            color: #ffe78a !important;
            -webkit-text-stroke: 0.45px #3b1300 !important;
            text-shadow: 0 2px 0 rgba(92, 31, 0, 0.85), 0 3px 8px rgba(20, 5, 0, 0.75) !important;
        }

        #btn-play-pve .btn-title {
            font-family: 'Russo One', sans-serif !important;
            font-size: 21px !important;
            color: #fff8ff !important;
            -webkit-text-stroke: 1px #250730 !important;
            text-shadow: 0 2px 0 #6b267f, 0 4px 10px rgba(18, 3, 29, 0.78), 0 0 12px rgba(221, 166, 255, 0.38) !important;
        }

        #btn-play-pve .btn-sub {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 8px !important;
            font-weight: 800 !important;
            letter-spacing: 0.03em !important;
            color: #ffe7ff !important;
            -webkit-text-stroke: 0.45px #2b0a38 !important;
            text-shadow: 0 2px 0 rgba(65, 20, 82, 0.86), 0 3px 8px rgba(17, 3, 25, 0.76) !important;
        }

        #btn-history {
            width: 86% !important;
            max-width: 292px !important;
            margin-top: 2px !important;
            margin-bottom: 0 !important;
            padding: 10px 14px !important;
            font-size: 12px !important;
            border-radius: 7px !important;
        }

        #btn-logout {
            margin-top: 2px !important;
            padding: 6px 18px !important;
            font-size: 10px !important;
        }

        @media (max-width: 768px) {
            .lobby-ui-overlay {
                padding: 26% 14% 11% 14% !important;
            }

            .ranking-scroll {
                min-height: 144px !important;
                max-height: 188px !important;
            }

            #btn-play-pvp,
            #btn-play-pve {
                width: 94% !important;
                aspect-ratio: 2048 / 650 !important;
                min-height: 0 !important;
                padding: 5px 34px 10px !important;
            }

            #btn-play-pvp::before,
            #btn-play-pve::before {
                inset: 6px 30px 30px !important;
            }

            #btn-play-pvp .btn-title {
                font-size: 18px !important;
            }

            #btn-play-pve .btn-title {
                font-size: 17px !important;
            }

            #btn-play-pvp .btn-sub,
            #btn-play-pve .btn-sub {
                font-size: 8px !important;
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
