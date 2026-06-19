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
            display: contents !important;
        }

        .lobby-identity-main {
            display: none !important;
        }

        .lobby-avatar {
            position: absolute !important;
            left: 21.4% !important;
            top: 14.1% !important;
            width: 16% !important;
            height: auto !important;
            aspect-ratio: 1 !important;
            transform: translate(-50%, -50%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 50% !important;
            overflow: visible !important;
            background-size: cover !important;
            background-position: center !important;
            border: none !important;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.46), 0 0 18px rgba(255,215,0,0.38) !important;
            z-index: 4 !important;
        }

        .lobby-avatar::after {
            content: "" !important;
            position: absolute !important;
            inset: -23% !important;
            pointer-events: none !important;
            background: url('assets/img/avatar_moldura_madeira.png') center / contain no-repeat !important;
            filter: drop-shadow(0 4px 5px rgba(0,0,0,0.62)) !important;
            z-index: 2 !important;
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
            align-self: flex-end !important;
            width: 73% !important;
            font-size: 30px !important;
            line-height: 1.02 !important;
            margin-bottom: 5px !important;
            max-width: 73% !important;
        }

        .user-stats {
            align-self: flex-end !important;
            width: 73% !important;
            font-size: 13px !important;
            margin-bottom: 6px !important;
        }

        .gold-wallet {
            position: relative !important;
            right: 36.5% !important;
            transform: translateX(50%) !important;
            align-self: flex-end !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 7px !important;
            min-height: 32px !important;
            padding: 3px 12px 3px 7px !important;
            margin: 0 0 7px 0 !important;
            border: 1px solid rgba(255,215,0,0.62) !important;
            border-radius: 999px !important;
            background: linear-gradient(90deg, rgba(0,0,0,0.42), rgba(255,215,0,0.16), rgba(0,0,0,0.36)) !important;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 5px 12px rgba(0,0,0,0.3), 0 0 12px rgba(255,215,0,0.16) !important;
            color: #fff8c8 !important;
            font-family: 'Russo One', sans-serif !important;
            font-size: 17px !important;
            line-height: 1 !important;
            text-shadow: 2px 2px 0 #1b0a03, 0 0 10px rgba(255,215,0,0.58) !important;
        }

        .gold-wallet img {
            width: 30px !important;
            height: 30px !important;
            object-fit: contain !important;
            filter: drop-shadow(0 2px 0 rgba(0,0,0,0.58)) drop-shadow(0 0 7px rgba(255,215,0,0.62)) !important;
        }

        .gold-wallet span {
            min-width: 28px !important;
            text-align: left !important;
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
            font-size: 42px !important;
            color: #ffe58a !important;
            letter-spacing: 1px !important;
            -webkit-text-stroke: 2.2px #2d0d02 !important;
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
            font-size: 40px !important;
            color: #f1deff !important;
            letter-spacing: 1px !important;
            -webkit-text-stroke: 2.2px #22062d !important;
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
            width: auto !important;
            max-width: none !important;
            min-height: 0 !important;
            margin-top: 8px !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            align-self: center !important;
            background: transparent !important;
            border: none !important;
            border-radius: 0 !important;
            color: #fff !important;
            box-shadow: none !important;
            font-family: 'Bangers', cursive !important;
            font-size: 28px !important;
            line-height: 1 !important;
            letter-spacing: 1px !important;
            text-transform: uppercase !important;
            -webkit-text-stroke: 1.5px #1b0a03 !important;
            paint-order: stroke fill !important;
            text-shadow: 3px 3px 0 #1b0a03, 0 4px 8px rgba(0,0,0,0.72) !important;
            transition: transform 0.13s cubic-bezier(0.22, 1, 0.36, 1),
                        text-shadow 0.13s ease !important;
        }

        #btn-history::after {
            content: none !important;
            display: none !important;
        }

        #btn-history:hover {
            transform: scale(1.08) !important;
            text-shadow: 3px 3px 0 #1b0a03, 0 0 14px rgba(255,255,255,0.42), 0 5px 9px rgba(0,0,0,0.78) !important;
        }

        #btn-history:active {
            transform: scale(0.98) !important;
        }

        #btn-logout {
            position: absolute !important;
            left: 50% !important;
            top: auto !important;
            bottom: 4.8% !important;
            transform: translateX(-50%) !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            color: #fff !important;
            font-family: 'Bangers', cursive !important;
            font-size: 25px !important;
            line-height: 1 !important;
            letter-spacing: 1px !important;
            min-width: 0 !important;
            width: auto !important;
            z-index: 3 !important;
            -webkit-text-stroke: 1.35px #1b0a03 !important;
            paint-order: stroke fill !important;
            text-shadow: 3px 3px 0 #1b0a03, 0 4px 8px rgba(0,0,0,0.72) !important;
            transition: transform 0.16s cubic-bezier(0.2, 1, 0.3, 1), text-shadow 0.16s ease, color 0.16s ease !important;
        }

        #btn-logout:hover {
            color: #fff8c8 !important;
            transform: translateX(-50%) scale(1.08) !important;
            text-shadow: 3px 3px 0 #1b0a03, 0 0 14px rgba(255,215,0,0.48), 0 5px 9px rgba(0,0,0,0.78) !important;
        }

        #btn-logout:active {
            transform: translateX(-50%) scale(0.98) !important;
        }

        #lobby-screen .lobby-play-center {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            width: min(34vw, 590px) !important;
            min-width: 390px !important;
            max-width: 590px !important;
            transform: translate(-50%, -50%) !important;
            z-index: 45 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: auto !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play {
            width: 100% !important;
            aspect-ratio: 2048 / 650 !important;
            padding: 10px 64px 14px !important;
            background: transparent url('assets/img/btn_pvp_ranked.webp?v=2') center / 100% 100% no-repeat !important;
            filter: drop-shadow(8px 11px 0 rgba(26, 11, 4, 0.82))
                    drop-shadow(0 18px 22px rgba(0, 0, 0, 0.32)) !important;
            overflow: visible !important;
            transform-origin: center center !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play .btn-title {
            font-family: 'Bangers', cursive !important;
            font-size: clamp(62px, 5.2vw, 98px) !important;
            color: #fff4a2 !important;
            letter-spacing: 1px !important;
            line-height: 0.84 !important;
            transform: translateY(2px) !important;
            -webkit-text-stroke: 3.4px #2b0b02 !important;
            paint-order: stroke fill !important;
            text-shadow: 5px 5px 0 #2b0b02,
                         0 8px 13px rgba(28, 7, 0, 0.68),
                         0 0 18px rgba(255, 220, 80, 0.42) !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play:hover,
        #lobby-screen #btn-play-pvp.lobby-main-play:focus-visible {
            transform: translateY(-5px) scale(1.055) !important;
            filter: brightness(1.11)
                    drop-shadow(9px 13px 0 rgba(26, 11, 4, 0.84))
                    drop-shadow(0 22px 24px rgba(0, 0, 0, 0.34))
                    drop-shadow(0 0 28px rgba(255, 207, 53, 0.42)) !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play:active {
            transform: translateY(3px) scale(0.985) !important;
        }

        .lobby-mode-overlay {
            position: fixed !important;
            inset: 0 !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            min-width: 100vw !important;
            min-height: 100vh !important;
            z-index: 30000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            background: rgba(18, 7, 3, 0.38) !important;
            backdrop-filter: blur(10px) saturate(0.92) !important;
            transition: opacity 0.18s ease, visibility 0.18s ease !important;
        }

        .lobby-mode-overlay.visible {
            pointer-events: auto !important;
            opacity: 1 !important;
            visibility: visible !important;
        }

        .lobby-mode-panel {
            position: relative !important;
            width: min(88vw, 980px) !important;
            min-height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 4vh 4vw 14vh !important;
        }

        .lobby-mode-choices {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: clamp(34px, 5vw, 80px) !important;
            width: 100% !important;
        }

        .lobby-mode-btn,
        .lobby-mode-history {
            border: 0 !important;
            background-color: transparent !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-size: 100% 100% !important;
            cursor: pointer !important;
            appearance: none !important;
            -webkit-tap-highlight-color: transparent !important;
            transform-origin: center center !important;
        }

        .lobby-mode-btn {
            position: relative !important;
            width: min(38vw, 430px) !important;
            aspect-ratio: 2048 / 650 !important;
            filter: drop-shadow(8px 12px 0 rgba(25, 10, 4, 0.72))
                    drop-shadow(0 18px 22px rgba(0, 0, 0, 0.32)) !important;
            animation: lobbyModePop 0.36s cubic-bezier(0.12, 1.25, 0.22, 1) backwards,
                       lobbyModeFloat 2.9s ease-in-out 0.38s infinite !important;
            transition: transform 0.15s cubic-bezier(0.2, 1, 0.3, 1), filter 0.15s ease !important;
        }

        .lobby-mode-pvp {
            background-image: url('assets/img/botao_pvp.webp') !important;
        }

        .lobby-mode-pve {
            background-image: url('assets/img/botao_pve.webp') !important;
            animation-delay: 0.07s, 0.52s !important;
        }

        .lobby-mode-btn:hover,
        .lobby-mode-btn:focus-visible {
            transform: translateY(-8px) scale(1.06) !important;
            filter: brightness(1.12)
                    drop-shadow(9px 14px 0 rgba(25, 10, 4, 0.74))
                    drop-shadow(0 21px 24px rgba(0, 0, 0, 0.34))
                    drop-shadow(0 0 24px rgba(255, 223, 83, 0.34)) !important;
        }

        .lobby-mode-btn::before {
            content: attr(data-points);
            position: absolute !important;
            left: 50% !important;
            top: -54px !important;
            transform: translateX(-50%) translateY(8px) scale(0.9) rotate(-2deg) !important;
            min-width: 140px !important;
            padding: 11px 22px 10px !important;
            border: 4px solid #2a1004 !important;
            border-radius: 28px 24px 31px 23px !important;
            background: #fff7d7 !important;
            color: #2a1004 !important;
            font-family: 'Bangers', cursive !important;
            font-size: 32px !important;
            line-height: 1 !important;
            letter-spacing: 1px !important;
            text-align: center !important;
            opacity: 0 !important;
            pointer-events: none !important;
            box-shadow: 4px 5px 0 rgba(0, 0, 0, 0.42) !important;
            transition: opacity 0.14s ease, transform 0.14s ease !important;
        }

        .lobby-mode-btn::after {
            content: "";
            position: absolute !important;
            left: 50% !important;
            top: -7px !important;
            width: 24px !important;
            height: 24px !important;
            background: #fff7d7 !important;
            border-right: 4px solid #2a1004 !important;
            border-bottom: 4px solid #2a1004 !important;
            transform: translateX(-50%) rotate(45deg) scale(0.8) !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.14s ease, transform 0.14s ease !important;
        }

        .lobby-mode-btn:hover::before,
        .lobby-mode-btn:focus-visible::before {
            opacity: 1 !important;
            transform: translateX(-50%) translateY(0) scale(1) rotate(-2deg) !important;
        }

        .lobby-mode-btn:hover::after,
        .lobby-mode-btn:focus-visible::after {
            opacity: 1 !important;
            transform: translateX(-50%) rotate(45deg) scale(1) !important;
        }

        .lobby-mode-history {
            position: absolute !important;
            left: 50% !important;
            bottom: clamp(30px, 4.5vh, 52px) !important;
            width: min(17vw, 230px) !important;
            min-width: 180px !important;
            aspect-ratio: 2048 / 560 !important;
            background-image: url('assets/img/botao_historico.webp') !important;
            filter: drop-shadow(5px 8px 0 rgba(16, 7, 3, 0.72))
                    drop-shadow(0 11px 14px rgba(0, 0, 0, 0.28)) !important;
            transform: translateX(-50%) !important;
            animation: lobbyHistoryPop 0.32s cubic-bezier(0.12, 1.2, 0.22, 1) 0.12s backwards !important;
            transition: transform 0.15s cubic-bezier(0.2, 1, 0.3, 1), filter 0.15s ease !important;
        }

        .lobby-mode-history:hover,
        .lobby-mode-history:focus-visible {
            transform: translateX(-50%) translateY(-4px) scale(1.05) !important;
            filter: brightness(1.12)
                    drop-shadow(6px 9px 0 rgba(16, 7, 3, 0.74))
                    drop-shadow(0 13px 15px rgba(0, 0, 0, 0.3))
                    drop-shadow(0 0 18px rgba(255, 241, 160, 0.25)) !important;
        }

        @keyframes lobbyModePop {
            0% { opacity: 0; transform: translateY(26px) scale(0.58); }
            62% { opacity: 1; transform: translateY(-7px) scale(1.08); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes lobbyHistoryPop {
            0% { opacity: 0; transform: translateX(-50%) translateY(22px) scale(0.62); }
            62% { opacity: 1; transform: translateX(-50%) translateY(-6px) scale(1.06); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        @keyframes lobbyModeFloat {
            0%, 100% { translate: 0 0; }
            50% { translate: 0 -8px; }
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
                font-size: 32px !important;
            }

            #btn-play-pve .btn-title {
                font-size: 31px !important;
            }

            #btn-play-pvp .btn-sub,
            #btn-play-pve .btn-sub {
                font-size: 10px !important;
            }

            #btn-history {
                width: auto !important;
                min-height: 0 !important;
                font-size: 22px !important;
                padding: 0 !important;
            }

            #lobby-screen .lobby-play-center {
                left: 50% !important;
                top: 50% !important;
                width: min(78vw, 430px) !important;
                min-width: 0 !important;
                transform: translate(-50%, -50%) !important;
            }

            #lobby-screen #btn-play-pvp.lobby-main-play {
                width: 100% !important;
                aspect-ratio: 2048 / 650 !important;
                padding: 8px 38px 12px !important;
            }

            #lobby-screen #btn-play-pvp.lobby-main-play .btn-title {
                font-size: clamp(48px, 12vw, 74px) !important;
            }

            .lobby-mode-panel {
                width: 94vw !important;
                min-height: 100vh !important;
                padding: 5vh 4vw 12vh !important;
            }

            .lobby-mode-choices {
                flex-direction: column !important;
                gap: 22px !important;
            }

            .lobby-mode-btn {
                width: min(78vw, 360px) !important;
            }

            .lobby-mode-history {
                width: min(46vw, 210px) !important;
                min-width: 160px !important;
                bottom: 24px !important;
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
                logo.style.setProperty('top', '48px', 'important');
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
                middleArea.style.setProperty('padding-bottom', '26px', 'important');
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
                slot.style.setProperty('margin-top', '-66px', 'important');
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
    let historyButton = document.getElementById('btn-history');
    const logoutButton = document.getElementById('btn-logout');
    if(logoutButton) {
        logoutButton.textContent = 'TROCAR CONTA';
        logoutButton.removeAttribute('data-tip');
        logoutButton.removeAttribute('title');
    }
    if (lobbyScreen) {
        let playCenter = document.querySelector('.lobby-play-center');
        if (!playCenter) {
            playCenter = document.createElement('div');
            playCenter.className = 'lobby-play-center';
            lobbyScreen.appendChild(playCenter);
        }

        const oldRow = document.querySelector('.lobby-btn-row');
        const oldPveButton = document.getElementById('btn-play-pve');
        if (oldPveButton) oldPveButton.remove();
        if (oldRow) oldRow.remove();

        let playButton = document.getElementById('btn-play-pvp');
        if (!playButton) {
            playButton = document.createElement('button');
            playButton.id = 'btn-play-pvp';
            playButton.type = 'button';
        }
        playButton.className = 'lobby-main-play';
        playButton.removeAttribute('data-tip');
        playButton.removeAttribute('title');
        playButton.onclick = () => window.openLobbyModeChooser?.();
        playButton.replaceChildren(Object.assign(document.createElement('span'), {
            className: 'btn-title',
            textContent: 'JOGAR'
        }));
        if (playButton.parentElement !== playCenter) {
            playCenter.appendChild(playButton);
        }

        if (historyButton) {
            historyButton.style.display = 'none';
            historyButton.removeAttribute('title');
            historyButton.removeAttribute('data-tip');
        }

        let modeOverlay = document.getElementById('lobby-mode-overlay');
        if (!modeOverlay) {
            modeOverlay = document.createElement('div');
            modeOverlay.id = 'lobby-mode-overlay';
            modeOverlay.className = 'lobby-mode-overlay';
        }
        if (modeOverlay.parentElement !== document.body) {
            document.body.appendChild(modeOverlay);
        }

        modeOverlay.innerHTML = `
            <div class="lobby-mode-panel" role="dialog" aria-modal="true" aria-label="Escolha o modo de jogo">
                <div class="lobby-mode-choices">
                    <button id="btn-mode-pvp" class="lobby-mode-btn lobby-mode-pvp" type="button" data-points="(+3 pontos)" aria-label="Partida PVP"></button>
                    <button id="btn-mode-pve" class="lobby-mode-btn lobby-mode-pve" type="button" data-points="(+1 ponto)" aria-label="Partida PVE"></button>
                </div>
                <button id="btn-mode-history" class="lobby-mode-history" type="button" aria-label="Hist\u00f3rico de partidas"></button>
            </div>
        `;

        const closeModeChooser = () => {
            modeOverlay.classList.remove('visible');
            document.body.classList.remove('lobby-mode-choice-open');
        };
        window.closeLobbyModeChooser = closeModeChooser;
        window.openLobbyModeChooser = () => {
            modeOverlay.classList.add('visible');
            document.body.classList.add('lobby-mode-choice-open');
        };

        modeOverlay.onclick = (event) => {
            if (event.target === modeOverlay) closeModeChooser();
        };

        const startMode = (handlerName) => {
            closeModeChooser();
            if (typeof window[handlerName] === 'function') {
                window[handlerName]();
            }
        };

        modeOverlay.querySelector('#btn-mode-pvp').onclick = () => startMode('startPvPSearch');
        modeOverlay.querySelector('#btn-mode-pve').onclick = () => startMode('startPvE');
        modeOverlay.querySelector('#btn-mode-history').onclick = () => {
            closeModeChooser();
            window.openHistory?.();
        };
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
// 3. EFEITO DE BLOQUEIO (Escudo + Onda)
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

    // Limpeza Geral
    setTimeout(() => {
        // Remove classes
        body.classList.remove('screen-recoil');
        if(overlay) overlay.classList.remove('active');
        if(shockwave) shockwave.classList.remove('active');
    }, 700);
}
