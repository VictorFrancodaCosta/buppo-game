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
            if (!window.initialPreloadComplete) {
                console.warn('[BUPPO] Carregamento inicial ainda em andamento; mantendo tela de loading.');
                return;
            }
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
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 50% !important;
            overflow: visible !important;
            background-size: cover !important;
            background-position: center !important;
            border: none !important;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.46), 0 0 18px rgba(255,215,0,0.38) !important;
            z-index: 3 !important;
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
            top: 63% !important;
            width: min(20vw, 340px) !important;
            min-width: 270px !important;
            max-width: 340px !important;
            transform: translate(-50%, -50%) !important;
            z-index: 45 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: clamp(12px, 1.45vh, 18px) !important;
            pointer-events: auto !important;
            animation: lobbyMenuFloatGroup 4.2s ease-in-out infinite !important;
        }

        #lobby-screen .lobby-frame-container {
            display: none !important;
        }

        #lobby-screen .lobby-profile-asset {
            position: fixed !important;
            left: calc(50% - 50vw + var(--lobby-side-gap, 70px)) !important;
            top: clamp(86px, 8vh, 96px) !important;
            width: min(36vw, 520px) !important;
            aspect-ratio: 1410 / 602 !important;
            z-index: 12000 !important;
            pointer-events: none !important;
            background: url('assets/img/profile_asset.webp') center / contain no-repeat !important;
            filter: drop-shadow(0 14px 22px rgba(0,0,0,0.58)) !important;
            font-family: 'Montserrat', Arial, sans-serif !important;
            color: #ffffff !important;
            text-shadow: 2px 2px 0 #080200, -1px -1px 0 #080200, 1px -1px 0 #080200, -1px 1px 0 #080200 !important;
        }

        #lobby-screen .profile-asset-avatar {
            position: absolute !important;
            left: 18.4% !important;
            top: 52% !important;
            width: 33.8% !important;
            aspect-ratio: 1 !important;
            transform: translate(-50%, -50%) !important;
            border-radius: 50% !important;
            overflow: visible !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background-color: #f1c40f !important;
            background-image: radial-gradient(circle at 35% 25%, #fff7ba 0 12%, #f1c40f 35%, #9b4b10 100%) !important;
            background-position: center !important;
            background-size: cover !important;
            background-repeat: no-repeat !important;
            color: #3e2723 !important;
            font-family: 'Russo One', sans-serif !important;
            font-size: clamp(22px, 2.1vw, 36px) !important;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.46), 0 0 16px rgba(255,215,0,0.34) !important;
        }

        #lobby-screen .profile-asset-avatar::after {
            content: "" !important;
            position: absolute !important;
            inset: -18% !important;
            pointer-events: none !important;
            background: url('assets/img/avatar_moldura_madeira.png') center / contain no-repeat !important;
            filter: drop-shadow(0 4px 5px rgba(0,0,0,0.62)) !important;
            z-index: 2 !important;
        }

        #lobby-screen .profile-asset-name {
            position: absolute !important;
            left: 42.3% !important;
            top: 27.8% !important;
            width: 57% !important;
            font-size: clamp(18px, 1.62vw, 27px) !important;
            font-weight: 950 !important;
            line-height: 1 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            letter-spacing: 0 !important;
        }

        #lobby-screen .profile-asset-id-inline {
            display: inline-block !important;
            margin-left: 0.32em !important;
            font-size: 0.56em !important;
            font-style: italic !important;
            font-weight: 850 !important;
            line-height: 1 !important;
            white-space: nowrap !important;
            opacity: 0.72 !important;
            vertical-align: baseline !important;
        }

        #lobby-screen .profile-asset-ranking {
            position: absolute !important;
            left: 42.3% !important;
            top: 53.1% !important;
            width: 48% !important;
            text-align: left !important;
            font-size: clamp(11px, 0.94vw, 17px) !important;
            font-family: 'Montserrat', Arial, sans-serif !important;
            font-weight: 650 !important;
            line-height: 1 !important;
            white-space: nowrap !important;
        }

        #lobby-screen .profile-asset-ranking.elo-madeira { color: #d0a06b !important; }
        #lobby-screen .profile-asset-ranking.elo-bronze { color: #cd7f32 !important; }
        #lobby-screen .profile-asset-ranking.elo-prata { color: #d9e4ea !important; }
        #lobby-screen .profile-asset-ranking.elo-ouro { color: #ffd62e !important; }
        #lobby-screen .profile-asset-ranking.elo-diamante { color: #7df6ff !important; text-shadow: 2px 2px 0 #061018, -1px -1px 0 #061018, 1px -1px 0 #061018, -1px 1px 0 #061018, 0 0 12px rgba(125,246,255,0.82) !important; }

        #lobby-screen .profile-asset-gold {
            position: absolute !important;
            left: 42.3% !important;
            top: 71.2% !important;
            width: 28% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            color: #ffd62e !important;
            font-size: clamp(20px, 1.75vw, 32px) !important;
            font-weight: 950 !important;
            line-height: 1 !important;
            text-shadow: 2px 2px 0 #190700, -1px -1px 0 #190700, 1px -1px 0 #190700, -1px 1px 0 #190700, 0 0 9px rgba(255,214,46,0.4) !important;
        }

        #lobby-screen .lobby-inventory-button {
            position: fixed !important;
            left: calc(50% - 50vw + var(--lobby-side-gap, 70px) + clamp(76px, 6.4vw, 116px)) !important;
            top: auto !important;
            bottom: 78px !important;
            transform: translateX(-50%) !important;
            z-index: 12010 !important;
            width: clamp(158px, 12.5vw, 220px) !important;
            aspect-ratio: 906 / 1012 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            color: transparent !important;
            font-size: 0 !important;
            line-height: 0 !important;
            cursor: pointer !important;
            appearance: none !important;
            -webkit-tap-highlight-color: transparent !important;
            filter: drop-shadow(6px 9px 0 rgba(26, 11, 4, 0.74))
                    drop-shadow(0 14px 16px rgba(0, 0, 0, 0.34)) !important;
            transform-origin: center center !important;
            transition: transform 0.15s cubic-bezier(0.2, 1, 0.3, 1), filter 0.15s ease !important;
        }

        #lobby-screen .lobby-inventory-button img {
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            pointer-events: none !important;
            user-select: none !important;
        }

        #lobby-screen .lobby-inventory-button:hover,
        #lobby-screen .lobby-inventory-button:focus-visible {
            transform: translateX(-50%) translateY(-4px) scale(1.09) !important;
            filter: brightness(1.12)
                    drop-shadow(8px 12px 0 rgba(26, 11, 4, 0.82))
                    drop-shadow(0 18px 21px rgba(0, 0, 0, 0.34))
                    drop-shadow(0 0 18px rgba(255, 221, 80, 0.35)) !important;
        }

        #lobby-screen .lobby-inventory-button:active {
            transform: translateX(-50%) translateY(7px) scale(1.06, 0.78) !important;
            filter: brightness(1.2)
                    drop-shadow(3px 4px 0 rgba(26, 11, 4, 0.9))
                    drop-shadow(0 0 16px rgba(255, 221, 80, 0.52)) !important;
        }

        #lobby-screen .lobby-menu-button {
            border: 0 !important;
            padding: 0 !important;
            background-color: transparent !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-size: contain !important;
            position: relative !important;
            cursor: pointer !important;
            appearance: none !important;
            -webkit-tap-highlight-color: transparent !important;
            transform-origin: center center !important;
            overflow: visible !important;
            filter: drop-shadow(7px 10px 0 rgba(26, 11, 4, 0.78))
                    drop-shadow(0 16px 20px rgba(0, 0, 0, 0.32)) !important;
            animation: lobbyMenuButtonFloat 3.1s ease-in-out infinite !important;
            transition: transform 0.15s cubic-bezier(0.2, 1, 0.3, 1), filter 0.15s ease !important;
        }

        #lobby-screen .lobby-menu-button:nth-child(2) { animation-delay: 0.16s !important; }
        #lobby-screen .lobby-menu-button:nth-child(3) { animation-delay: 0.3s !important; }
        #lobby-screen .lobby-menu-button:nth-child(4) { animation-delay: 0.44s !important; }
        #lobby-screen .lobby-menu-button:nth-child(5) { animation-delay: 0.58s !important; }
        #lobby-screen .lobby-menu-button:nth-child(6) { animation-delay: 0.72s !important; }

        #lobby-screen .lobby-menu-button:hover,
        #lobby-screen .lobby-menu-button:focus-visible {
            transform: translateY(-4px) scale(1.055) !important;
            filter: brightness(1.12)
                    drop-shadow(8px 12px 0 rgba(26, 11, 4, 0.82))
                    drop-shadow(0 20px 23px rgba(0, 0, 0, 0.34))
                    drop-shadow(0 0 22px rgba(255, 221, 80, 0.34)) !important;
        }

        #lobby-screen .lobby-menu-button:active {
            transform: translateY(8px) scale(1.08, 0.78) !important;
            filter: brightness(1.22)
                    drop-shadow(3px 4px 0 rgba(26, 11, 4, 0.9))
                    drop-shadow(0 0 18px rgba(255, 221, 80, 0.55)) !important;
        }

        #lobby-screen .lobby-menu-button.lobby-button-press-juice,
        #lobby-screen .lobby-inventory-button.lobby-button-press-juice {
            animation: lobbyButtonPressJuice 0.26s cubic-bezier(0.16, 1.3, 0.32, 1) both !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play {
            width: 100% !important;
            aspect-ratio: 1392 / 637 !important;
            background-image: url('assets/img/botao_jogar.webp') !important;
            margin-bottom: clamp(3px, 0.6vh, 8px) !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play:hover,
        #lobby-screen #btn-play-pvp.lobby-main-play:focus-visible {
            animation: lobbyPlayGoldGlow 0.95s ease-in-out infinite !important;
        }

        @keyframes lobbyPlayGoldGlow {
            0%, 100% {
                filter: brightness(1.12)
                        drop-shadow(8px 12px 0 rgba(26, 11, 4, 0.82))
                        drop-shadow(0 20px 23px rgba(0, 0, 0, 0.34))
                        drop-shadow(0 0 18px rgba(255, 221, 80, 0.42))
                        drop-shadow(0 0 28px rgba(255, 188, 18, 0.32)) !important;
            }
            50% {
                filter: brightness(1.12)
                        drop-shadow(8px 12px 0 rgba(26, 11, 4, 0.82))
                        drop-shadow(0 20px 23px rgba(0, 0, 0, 0.34))
                        drop-shadow(0 0 28px rgba(255, 225, 74, 0.8))
                        drop-shadow(0 0 52px rgba(255, 176, 0, 0.58)) !important;
            }
        }

        @keyframes lobbyButtonPressJuice {
            0% { transform: translateY(0) scale(1, 1); }
            32% { transform: translateY(7px) scale(1.12, 0.78); filter: drop-shadow(4px 5px 0 rgba(26, 11, 4, 0.86)) drop-shadow(0 0 18px rgba(255, 211, 38, 0.72)); }
            68% { transform: translateY(-4px) scale(0.94, 1.13); }
            100% { transform: translateY(0) scale(1, 1); }
        }

        #lobby-screen #btn-play-pvp.lobby-main-play::before {
            content: none !important;
            display: none !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play:hover::before,
        #lobby-screen #btn-play-pvp.lobby-main-play:focus-visible::before {
            animation: none !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play::after {
            content: none !important;
            display: none !important;
            position: absolute !important;
            inset: 13% 11% 15% 11% !important;
            z-index: 1 !important;
            pointer-events: none !important;
            border-radius: 18px !important;
            opacity: 0 !important;
            background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,0) 34%, rgba(255,255,210,0.72) 48%, rgba(255,210,60,0.32) 56%, transparent 72%) !important;
            transform: translateX(-78%) skewX(-12deg) !important;
            mix-blend-mode: screen !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play:hover::after,
        #lobby-screen #btn-play-pvp.lobby-main-play:focus-visible::after {
            opacity: 0 !important;
            animation: none !important;
        }

        #lobby-screen .lobby-menu-small {
            width: min(68%, 230px) !important;
            min-width: 185px !important;
            aspect-ratio: 1345 / 425 !important;
        }

        #lobby-screen .lobby-main-history {
            width: min(70%, 235px) !important;
            min-width: 195px !important;
            aspect-ratio: 1345 / 471 !important;
            background-image: url('assets/img/botao_historico.webp') !important;
        }
        #lobby-screen .lobby-main-ranking { background-image: url('assets/img/botao_ranking.webp') !important; }
        #lobby-screen .lobby-main-shop { background-image: url('assets/img/botao_loja.webp') !important; }
        #lobby-screen .lobby-main-tutorial { background-image: url('assets/img/botao_tutorial.webp') !important; }
        #lobby-screen .lobby-main-exit { background-image: url('assets/img/botao_sair.webp') !important; }

        .lobby-ranking-modal {
            position: fixed !important;
            inset: 0 !important;
            z-index: 86000 !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(8, 3, 1, 0.64) !important;
            backdrop-filter: blur(8px) saturate(0.82) !important;
        }

        .lobby-ranking-modal.visible {
            display: flex !important;
        }

        .lobby-ranking-panel {
            width: min(560px, 88vw) !important;
            min-height: min(660px, 76vh) !important;
            padding: 34px 42px 32px !important;
            box-sizing: border-box !important;
            background: rgba(87, 42, 16, 0.94) !important;
            border: 5px solid #2a1004 !important;
            border-radius: 8px !important;
            box-shadow: 0 18px 0 rgba(30, 11, 3, 0.9), 0 0 38px rgba(255, 201, 54, 0.28) !important;
            color: #fff !important;
        }

        .lobby-ranking-title {
            margin: 0 0 20px !important;
            color: var(--gold) !important;
            font-family: 'Bangers', cursive !important;
            font-size: clamp(42px, 4vw, 62px) !important;
            letter-spacing: 1px !important;
            text-align: center !important;
            -webkit-text-stroke: 2px #210b03 !important;
            paint-order: stroke fill !important;
            text-shadow: 4px 4px 0 #210b03, 0 0 18px rgba(255, 215, 0, 0.45) !important;
        }

        .lobby-ranking-modal .ranking-scroll {
            max-height: min(470px, 52vh) !important;
            overflow-y: auto !important;
            margin: 0 0 22px !important;
        }

        .lobby-ranking-close {
            display: block !important;
            margin: 0 auto !important;
        }

        .lobby-shop-modal {
            position: fixed !important;
            inset: 0 !important;
            z-index: 87000 !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(8, 3, 1, 0.64) !important;
            backdrop-filter: blur(8px) saturate(0.82) !important;
        }

        .lobby-shop-modal.visible {
            display: flex !important;
        }

        .lobby-shop-panel {
            position: relative !important;
            z-index: 1 !important;
            width: min(1360px, 97vw) !important;
            min-height: min(820px, 90vh) !important;
            padding: 110px 104px 90px !important;
            box-sizing: border-box !important;
            background: url('assets/img/janela_loja.webp?v=2026.06.24.19') center / 100% 100% no-repeat !important;
            border: 0 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            color: #fff !important;
        }

        .lobby-shop-header {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 20px !important;
            margin-top: 40px !important;
            margin-bottom: 12px !important;
            position: relative !important;
        }

        .lobby-shop-title {
            position: absolute !important;
            left: 50% !important;
            top: calc(50% - min(410px, 45vh) - 18px) !important;
            transform: translateX(-50%) !important;
            z-index: 4 !important;
            margin: 0 !important;
            width: clamp(210px, 23vw, 340px) !important;
            aspect-ratio: 1413 / 614 !important;
            background: url('assets/img/titulo_loja.webp?v=2026.06.24.19') center / contain no-repeat !important;
            filter: drop-shadow(0 7px 0 rgba(31, 10, 2, 0.75)) drop-shadow(0 0 16px rgba(255, 213, 58, 0.28)) !important;
            pointer-events: none !important;
            text-indent: -9999px !important;
            overflow: visible !important;
        }

        .lobby-shop-title-stack {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 12px !important;
            width: 100% !important;
            min-width: 0 !important;
        }

        .lobby-shop-categories {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
            gap: clamp(34px, 3.4vw, 62px) !important;
            width: min(820px, 74%) !important;
            max-width: 100% !important;
            margin: 0 auto !important;
        }

        .lobby-shop-category {
            appearance: none !important;
            min-height: auto !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            color: rgba(255,248,200,0.84) !important;
            cursor: pointer !important;
            font-family: 'Montserrat', sans-serif !important;
            font-size: clamp(12px, 0.92vw, 16px) !important;
            font-weight: 900 !important;
            line-height: 1 !important;
            letter-spacing: 0.8px !important;
            text-transform: uppercase !important;
            -webkit-text-stroke: 1.25px #050100 !important;
            paint-order: stroke fill !important;
            text-shadow: 2px 2px 0 #050100, -1px -1px 0 #050100, 0 0 9px rgba(0,0,0,0.56) !important;
            box-shadow: none !important;
            transform-origin: center !important;
            transition: transform 0.14s ease, color 0.14s ease, filter 0.14s ease, text-shadow 0.14s ease !important;
        }

        .lobby-shop-category:hover,
        .lobby-shop-category.active {
            color: #ffd81f !important;
            transform: scale(1.28) !important;
            filter: brightness(1.12) saturate(1.18) !important;
            text-shadow: 2px 2px 0 #050100, -1px -1px 0 #050100, 0 0 12px rgba(255,216,31,0.78), 0 0 24px rgba(255,122,24,0.46) !important;
        }

        .lobby-shop-gold {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 9px !important;
            min-height: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            color: #fff8c8 !important;
            font-family: 'Russo One', sans-serif !important;
            font-size: clamp(24px, 2.25vw, 34px) !important;
            line-height: 1 !important;
            white-space: nowrap !important;
            text-shadow: 2px 2px 0 #1b0a03, 0 0 10px rgba(255,215,0,0.58) !important;
            position: absolute !important;
            left: 77.7% !important;
            top: 84.2% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 5 !important;
        }

        .lobby-shop-gold img {
            width: clamp(31px, 2.65vw, 42px) !important;
            height: clamp(31px, 2.65vw, 42px) !important;
            object-fit: contain !important;
            filter: drop-shadow(0 2px 0 rgba(0,0,0,0.58)) drop-shadow(0 0 7px rgba(255,215,0,0.62)) !important;
        }

        .lobby-shop-grid {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            flex-wrap: wrap !important;
            column-gap: clamp(48px, 4.6vw, 72px) !important;
            row-gap: clamp(26px, 2.8vw, 42px) !important;
            width: min(780px, 72%) !important;
            max-height: none !important;
            margin: 18px auto 0 !important;
            overflow: visible !important;
            padding: 28px 10px 12px 10px !important;
            scrollbar-width: thin !important;
            scrollbar-color: var(--gold) rgba(0,0,0,0.28) !important;
        }

        .lobby-shop-grid::-webkit-scrollbar {
            width: 10px !important;
        }

        .lobby-shop-grid::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.28) !important;
            border-radius: 999px !important;
        }

        .lobby-shop-grid::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #ffe680, #c58b10) !important;
            border: 2px solid rgba(42, 16, 4, 0.95) !important;
            border-radius: 999px !important;
        }

        .lobby-shop-slot {
            position: relative !important;
            flex: 0 0 clamp(165px, 13.2vw, 205px) !important;
            aspect-ratio: 1 / 1 !important;
            min-height: 0 !important;
            border: 3px solid rgba(255,215,0,0.55) !important;
            border-radius: 8px !important;
            background: #050505 !important;
            box-shadow: inset 0 8px 18px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.08), 0 8px 0 rgba(30, 11, 3, 0.54) !important;
            animation: lobbyShopSlotFloat 3.4s ease-in-out infinite !important;
            transition: transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease !important;
            will-change: transform !important;
        }

        .lobby-shop-slot:nth-child(2n) {
            animation-delay: -0.85s !important;
        }

        .lobby-shop-slot:nth-child(3n) {
            animation-delay: -1.55s !important;
        }

        .lobby-shop-slot:nth-child(5n) {
            animation-delay: -2.25s !important;
        }

        .lobby-shop-slot:hover,
        .lobby-shop-slot:focus-within {
            animation-play-state: paused !important;
            transform: translateY(-4px) scale(1.055) !important;
            z-index: 9 !important;
            box-shadow: inset 0 8px 18px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.12), 0 10px 0 rgba(30, 11, 3, 0.54), 0 0 28px var(--item-glow, rgba(255,215,0,0.72)), 0 0 52px var(--item-glow-soft, rgba(255,215,0,0.32)) !important;
        }

        .lobby-shop-slot[data-shop-item="metallic_border"],
        .inventory-item[data-inventory-item="metallic_border"] {
            --item-glow: rgba(59, 176, 255, 0.9);
            --item-glow-soft: rgba(59, 176, 255, 0.38);
        }

        .lobby-shop-slot[data-shop-item="mage_fire_border"],
        .inventory-item[data-inventory-item="mage_fire_border"] {
            --item-glow: rgba(255, 67, 54, 0.95);
            --item-glow-soft: rgba(255, 67, 54, 0.4);
        }

        .lobby-shop-slot[data-shop-item="elven_forest_border"],
        .inventory-item[data-inventory-item="elven_forest_border"] {
            --item-glow: rgba(64, 224, 98, 0.92);
            --item-glow-soft: rgba(64, 224, 98, 0.38);
        }

        .lobby-shop-slot[data-shop-item="rogue_gold_border"],
        .inventory-item[data-inventory-item="rogue_gold_border"] {
            --item-glow: rgba(255, 218, 37, 1);
            --item-glow-soft: rgba(255, 218, 37, 0.42);
        }

        .lobby-shop-slot[data-shop-item="oracle_border"],
        .inventory-item[data-inventory-item="oracle_border"] {
            --item-glow: rgba(179, 91, 255, 0.95);
            --item-glow-soft: rgba(179, 91, 255, 0.4);
        }

        .lobby-shop-product {
            display: block !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            background:
                radial-gradient(circle at 50% 22%, rgba(160, 83, 18, 0.96), rgba(98, 43, 5, 0.98) 56%, rgba(61, 25, 2, 0.99) 100%) !important;
        }

        .shop-product-name,
        .inventory-item-name {
            color: #ffffff !important;
            font-family: 'Bangers', cursive !important;
            font-size: clamp(11px, 0.95vw, 15px) !important;
            line-height: 1.08 !important;
            text-align: center !important;
            text-transform: uppercase !important;
            -webkit-text-stroke: 1.3px #120501 !important;
            paint-order: stroke fill !important;
            text-shadow: 2px 2px 0 #120501, 0 0 8px rgba(0,0,0,0.72) !important;
        }

        .lobby-shop-product .shop-product-name {
            position: absolute !important;
            left: 8px !important;
            right: 8px !important;
            top: clamp(-10px, -0.6vw, -6px) !important;
            z-index: 3 !important;
            color: #ffffff !important;
            font-size: clamp(18px, 1.55vw, 25px) !important;
            line-height: 0.92 !important;
            letter-spacing: 0 !important;
            -webkit-text-stroke: 1.6px #120501 !important;
            text-shadow: 3px 3px 0 #120501, 0 0 8px rgba(0,0,0,0.74) !important;
        }

        .metallic-border-art {
            width: min(68%, 145px) !important;
            aspect-ratio: 5 / 7 !important;
            background-position: center !important;
            background-size: contain !important;
            background-repeat: no-repeat !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            filter: drop-shadow(0 8px 10px rgba(0,0,0,0.58)) !important;
        }

        .lobby-shop-panel .metallic-border-art {
            position: absolute !important;
            left: 50% !important;
            right: auto !important;
            top: auto !important;
            bottom: 0 !important;
            z-index: 1 !important;
            width: 82% !important;
            height: 82% !important;
            aspect-ratio: auto !important;
            transform: translateX(-50%) !important;
            background-size: contain !important;
            background-position: center bottom !important;
            filter: drop-shadow(0 8px 9px rgba(0,0,0,0.58)) !important;
        }

        .shop-owned-ribbon {
            position: absolute !important;
            left: 50% !important;
            right: auto !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 4 !important;
            width: 136% !important;
            height: 62% !important;
            background: url('assets/img/comprado_title.webp') center / contain no-repeat !important;
            color: transparent !important;
            font-size: 0 !important;
            line-height: 0 !important;
            pointer-events: none !important;
            filter: drop-shadow(0 4px 0 rgba(0,0,0,0.62)) drop-shadow(0 0 8px rgba(255,215,0,0.26)) !important;
        }

        .shop-buy-btn {
            position: absolute !important;
            left: 50% !important;
            bottom: 10px !important;
            z-index: 3 !important;
            transform: translateX(-50%) !important;
            min-width: 104px !important;
            padding: 8px 14px !important;
            border: 2px solid #fff4ad !important;
            border-radius: 999px !important;
            background: linear-gradient(180deg, #f1c40f, #b96714) !important;
            color: #321204 !important;
            font-family: 'Russo One', sans-serif !important;
            font-size: 12px !important;
            text-transform: uppercase !important;
            cursor: pointer !important;
            box-shadow: 0 4px 0 rgba(42,16,4,0.8) !important;
            display: none !important;
        }

        .shop-info-tooltip {
            position: fixed !important;
            z-index: 98000 !important;
            display: none !important;
            width: min(420px, 88vw) !important;
            padding: 18px 20px 17px !important;
            border: 2px solid rgba(255, 215, 0, 0.62) !important;
            border-radius: 8px !important;
            background: rgba(4, 4, 4, 0.94) !important;
            color: #fff !important;
            font-family: 'Montserrat', sans-serif !important;
            font-size: 15px !important;
            line-height: 1.42 !important;
            pointer-events: none !important;
            box-shadow: 0 12px 28px rgba(0,0,0,0.66), inset 0 1px 0 rgba(255,255,255,0.08) !important;
        }

        .shop-info-tooltip.visible {
            display: block !important;
        }

        .shop-info-title {
            margin-bottom: 12px !important;
            color: #fff !important;
            font-family: 'Bangers', cursive !important;
            font-size: 34px !important;
            line-height: 0.95 !important;
            letter-spacing: 0 !important;
            -webkit-text-stroke: 1.6px #000 !important;
            paint-order: stroke fill !important;
            text-shadow: 3px 3px 0 #000 !important;
        }

        .shop-info-tooltip p {
            margin: 10px 0 0 !important;
        }

        .shop-info-tooltip strong {
            color: #fff4ad !important;
            font-weight: 900 !important;
        }

        .shop-info-coin {
            width: 22px !important;
            height: 22px !important;
            object-fit: contain !important;
            vertical-align: -5px !important;
            margin: 0 2px !important;
            filter: drop-shadow(0 1px 0 #000) drop-shadow(0 0 5px rgba(255,215,0,0.45)) !important;
        }

        .purchase-confirm-overlay {
            position: fixed !important;
            inset: 0 !important;
            z-index: 99500 !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(0, 0, 0, 0.58) !important;
            backdrop-filter: blur(7px) saturate(0.86) !important;
            -webkit-backdrop-filter: blur(7px) saturate(0.86) !important;
        }

        .purchase-confirm-overlay.visible {
            display: flex !important;
        }

        .purchase-confirm-box {
            position: relative !important;
            width: min(540px, 82vw) !important;
            aspect-ratio: 1337 / 833 !important;
            background: url('assets/img/box_compra.webp') center / 100% 100% no-repeat !important;
            filter: drop-shadow(0 14px 18px rgba(0,0,0,0.68)) !important;
            animation: purchaseBoxPop 0.2s cubic-bezier(0.16, 0.9, 0.28, 1.25) both !important;
        }

        .purchase-confirm-question {
            position: absolute !important;
            left: 14% !important;
            right: 14% !important;
            top: 22% !important;
            height: 41% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            color: #fff7b0 !important;
            font-family: 'Montserrat', sans-serif !important;
            font-size: clamp(14px, 2.1vw, 24px) !important;
            font-weight: 900 !important;
            line-height: 1.05 !important;
            text-align: center !important;
            text-transform: uppercase !important;
            letter-spacing: 0.2px !important;
            -webkit-text-stroke: 1.35px #090200 !important;
            paint-order: stroke fill !important;
            text-shadow: 2px 2px 0 #090200, 0 0 10px rgba(255,215,0,0.24) !important;
        }

        .purchase-confirm-kicker {
            display: block !important;
            color: #ffffff !important;
            font-size: 0.84em !important;
        }

        .purchase-confirm-item {
            display: block !important;
            max-width: 100% !important;
            color: #fff2a8 !important;
            font-size: 1.12em !important;
            font-weight: 900 !important;
        }

        .purchase-confirm-mark {
            display: block !important;
            margin-top: -4px !important;
            font-size: 0.92em !important;
        }

        .purchase-confirm-cost {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            color: #ffd81f !important;
            font-size: 1.02em !important;
        }

        .purchase-confirm-cost img {
            width: 1.12em !important;
            height: 1.12em !important;
            object-fit: contain !important;
            filter: drop-shadow(0 2px 0 #090200) drop-shadow(0 0 6px rgba(255,216,31,0.46)) !important;
        }

        .purchase-confirm-actions {
            position: absolute !important;
            left: 10.8% !important;
            right: 10.8% !important;
            bottom: 12.4% !important;
            height: 15.7% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 5.2% !important;
        }

        .purchase-confirm-choice {
            appearance: none !important;
            flex: 1 1 0 !important;
            align-self: stretch !important;
            border: 0 !important;
            background: transparent !important;
            color: #ffd81f !important;
            cursor: pointer !important;
            font-family: 'Bangers', cursive !important;
            font-size: clamp(22px, 3vw, 40px) !important;
            line-height: 1 !important;
            text-align: center !important;
            letter-spacing: 0 !important;
            -webkit-text-stroke: 1.6px #090200 !important;
            paint-order: stroke fill !important;
            text-shadow: 3px 3px 0 #090200, 0 0 10px rgba(255,216,31,0.46) !important;
            transition: transform 0.13s ease, filter 0.13s ease !important;
        }

        .purchase-confirm-choice:hover,
        .purchase-confirm-choice:focus-visible {
            transform: scale(1.12) !important;
            filter: brightness(1.2) saturate(1.15) !important;
            outline: none !important;
        }

        .purchase-confirm-choice:active {
            transform: scale(0.94) !important;
        }

        @keyframes purchaseBoxPop {
            from { opacity: 0; transform: scale(0.9) translateY(14px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .inventory-action-menu {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            z-index: 8 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 3px !important;
            min-width: 96px !important;
            padding: 4px !important;
            border: 1px solid rgba(255, 215, 0, 0.64) !important;
            border-radius: 6px !important;
            background: rgba(12, 5, 2, 0.94) !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.48) !important;
            transform: translate(-50%, -50%) !important;
        }

        .inventory-action-option {
            position: relative !important;
            z-index: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 20px !important;
            padding: 3px 6px !important;
            border: 0 !important;
            border-radius: 4px !important;
            background: linear-gradient(180deg, #ffe66b 0%, #f0b51a 100%) !important;
            color: #2a1103 !important;
            font-family: 'Russo One', sans-serif !important;
            font-size: 9px !important;
            line-height: 1 !important;
            text-align: center !important;
            text-transform: uppercase !important;
            cursor: pointer !important;
            box-shadow: none !important;
        }

        .inventory-action-option:disabled,
        .inventory-action-option[data-disabled="true"] {
            background: rgba(255,255,255,0.05) !important;
            color: rgba(255,255,255,0.28) !important;
            cursor: default !important;
            filter: grayscale(1) brightness(0.74) !important;
            box-shadow: none !important;
        }

        .shop-buy-btn:disabled {
            filter: grayscale(80%) brightness(0.75) !important;
            cursor: default !important;
        }

        .lobby-shop-close {
            position: absolute !important;
            left: 50% !important;
            right: auto !important;
            bottom: calc(50% - min(410px, 45vh) - 70px) !important;
            transform: translateX(-50%) !important;
            z-index: 4 !important;
            width: clamp(150px, 13vw, 218px) !important;
            aspect-ratio: 1724 / 561 !important;
            min-width: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: url('assets/img/botao_sair_loja_ui.png?v=2026.06.28.1') center / contain no-repeat !important;
            color: transparent !important;
            font-size: 0 !important;
            line-height: 0 !important;
            overflow: visible !important;
            filter: drop-shadow(0 7px 0 rgba(30, 11, 3, 0.72)) drop-shadow(0 0 12px rgba(255,215,0,0.22)) !important;
            box-shadow: none !important;
            transition: transform 0.16s ease, filter 0.16s ease !important;
        }

        .lobby-shop-close:hover,
        .lobby-shop-close:focus-visible {
            transform: translateX(-50%) translateY(-3px) scale(1.04) !important;
            filter: brightness(1.08) saturate(1.08) drop-shadow(0 9px 0 rgba(30, 11, 3, 0.72)) drop-shadow(0 0 18px rgba(255,215,0,0.34)) !important;
            outline: none !important;
        }

        .lobby-shop-close:active {
            transform: translateX(-50%) translateY(2px) scale(0.96) !important;
            filter: brightness(0.95) saturate(0.95) drop-shadow(0 3px 0 rgba(30, 11, 3, 0.82)) !important;
        }

        .lobby-inventory-modal {
            position: fixed !important;
            inset: 0 !important;
            z-index: 87500 !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(8, 3, 1, 0.64) !important;
            backdrop-filter: blur(8px) saturate(0.82) !important;
        }

        .lobby-inventory-modal.visible {
            display: flex !important;
        }

        .lobby-inventory-panel {
            position: relative !important;
            z-index: 1 !important;
            width: min(1180px, 96vw) !important;
            min-height: min(700px, 82vh) !important;
            padding: 112px 92px 92px !important;
            box-sizing: border-box !important;
            background: url('assets/img/janela_mochila.webp?v=2026.06.24.18') center / 100% 100% no-repeat !important;
            border: 0 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
        }

        .lobby-inventory-title {
            position: absolute !important;
            left: 50% !important;
            top: calc(50% - min(350px, 41vh) - 72px) !important;
            transform: translateX(-50%) !important;
            z-index: 4 !important;
            margin: 0 !important;
            width: clamp(330px, 39vw, 570px) !important;
            aspect-ratio: 1712 / 461 !important;
            background: url('assets/img/titulo_mochila.webp?v=2026.06.24.18') center / contain no-repeat !important;
            filter: drop-shadow(0 7px 0 rgba(31, 10, 2, 0.75)) drop-shadow(0 0 16px rgba(255, 213, 58, 0.28)) !important;
            pointer-events: none !important;
            text-indent: -9999px !important;
            overflow: hidden !important;
        }

        .lobby-inventory-categories {
            position: absolute !important;
            left: 50% !important;
            top: 108px !important;
            transform: translateX(-50%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
            gap: clamp(34px, 3.4vw, 62px) !important;
            width: min(820px, 74%) !important;
            z-index: 2 !important;
        }

        .lobby-inventory-grid {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
            column-gap: clamp(34px, 3vw, 48px) !important;
            row-gap: clamp(24px, 2.4vw, 34px) !important;
            width: min(820px, 78%) !important;
            max-height: none !important;
            margin: 50px auto 0 !important;
            overflow: visible !important;
            padding: 18px 10px 12px !important;
        }

        .inventory-item {
            position: relative !important;
            flex: 0 0 clamp(165px, 13.2vw, 205px) !important;
            aspect-ratio: 1 / 1 !important;
            min-height: 0 !important;
            display: block !important;
            align-items: center !important;
            justify-items: center !important;
            padding: 0 !important;
            border: 3px solid rgba(255,215,0,0.55) !important;
            border-radius: 8px !important;
            background:
                radial-gradient(circle at 50% 22%, rgba(160, 83, 18, 0.88), rgba(55, 20, 2, 0.96) 64%, rgba(0,0,0,0.98) 100%) !important;
            box-shadow: inset 0 8px 18px rgba(0,0,0,0.78), 0 8px 0 rgba(30, 11, 3, 0.62) !important;
            cursor: pointer !important;
            overflow: visible !important;
            transition: transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease !important;
        }

        .lobby-inventory-panel .metallic-border-art {
            position: absolute !important;
            left: 50% !important;
            bottom: 0 !important;
            z-index: 1 !important;
            width: 82% !important;
            height: 82% !important;
            transform: translateX(-50%) !important;
            aspect-ratio: auto !important;
            background-size: contain !important;
            background-position: center bottom !important;
        }

        .lobby-shop-panel .xp-area-product-art,
        .lobby-inventory-panel .xp-area-product-art {
            left: auto !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            transform: none !important;
            background-position: right bottom !important;
            background-size: contain !important;
        }

        .lobby-shop-panel .deck-product-art,
        .lobby-inventory-panel .deck-product-art {
            left: 0 !important;
            right: auto !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            transform: none !important;
            background-position: center bottom !important;
            background-size: 100% auto !important;
        }

        .inventory-item .inventory-item-name {
            position: absolute !important;
            left: 8px !important;
            right: 8px !important;
            top: clamp(-10px, -0.6vw, -6px) !important;
            z-index: 3 !important;
            color: #ffffff !important;
            font-size: clamp(18px, 1.55vw, 25px) !important;
            line-height: 0.92 !important;
            letter-spacing: 0 !important;
            -webkit-text-stroke: 1.6px #120501 !important;
            text-shadow: 3px 3px 0 #120501, 0 0 8px rgba(0,0,0,0.74) !important;
        }

        .inventory-item.selected {
            border-color: rgba(255,245,180,0.95) !important;
            box-shadow: inset 0 8px 18px rgba(0,0,0,0.78), 0 8px 0 rgba(30, 11, 3, 0.62), 0 0 24px rgba(255,215,0,0.38) !important;
        }

        .inventory-item:hover,
        .inventory-item:focus-visible {
            transform: translateY(-4px) scale(1.055) !important;
            z-index: 8 !important;
            box-shadow: inset 0 8px 18px rgba(0,0,0,0.78), 0 10px 0 rgba(30, 11, 3, 0.62), 0 0 28px var(--item-glow, rgba(255,215,0,0.72)), 0 0 52px var(--item-glow-soft, rgba(255,215,0,0.32)) !important;
        }

        .inventory-equipped-ribbon {
            position: absolute !important;
            left: 50% !important;
            right: auto !important;
            top: 48% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 6 !important;
            width: 84% !important;
            height: 34% !important;
            background: url('assets/img/equipado_title.webp') center / contain no-repeat !important;
            color: transparent !important;
            font-size: 0 !important;
            line-height: 0 !important;
            filter: drop-shadow(0 4px 0 rgba(0,0,0,0.62)) drop-shadow(0 0 8px rgba(255,215,0,0.26)) !important;
            pointer-events: none !important;
        }

        .inventory-empty {
            grid-column: 1 / -1 !important;
            color: rgba(255,255,255,0.72) !important;
            font-family: 'Russo One', sans-serif !important;
            text-align: center !important;
            padding: 70px 10px !important;
        }

        .lobby-inventory-close {
            position: absolute !important;
            left: 50% !important;
            right: auto !important;
            bottom: calc(50% - min(350px, 41vh) - 112px) !important;
            transform: translateX(-50%) !important;
            z-index: 4 !important;
            width: clamp(150px, 13vw, 218px) !important;
            aspect-ratio: 1644 / 537 !important;
            min-width: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: url('assets/img/botao_sair_mochila_ui.png?v=2026.06.28.1') center / contain no-repeat !important;
            color: transparent !important;
            font-size: 0 !important;
            line-height: 0 !important;
            overflow: visible !important;
            filter: drop-shadow(0 7px 0 rgba(30, 11, 3, 0.72)) drop-shadow(0 0 12px rgba(255,215,0,0.22)) !important;
            box-shadow: none !important;
            transition: transform 0.16s ease, filter 0.16s ease !important;
        }

        .lobby-inventory-close:hover,
        .lobby-inventory-close:focus-visible {
            transform: translateX(-50%) translateY(-3px) scale(1.04) !important;
            filter: brightness(1.08) saturate(1.08) drop-shadow(0 9px 0 rgba(30, 11, 3, 0.72)) drop-shadow(0 0 18px rgba(255,215,0,0.34)) !important;
            outline: none !important;
        }

        .lobby-inventory-close:active {
            transform: translateX(-50%) translateY(2px) scale(0.96) !important;
            filter: brightness(0.95) saturate(0.95) drop-shadow(0 3px 0 rgba(30, 11, 3, 0.82)) !important;
        }

        @media (max-width: 680px) {
            .lobby-shop-panel {
                width: 96vw !important;
                min-height: 0 !important;
                padding: 88px 28px 82px !important;
            }

            .lobby-shop-header {
                align-items: center !important;
                gap: 12px !important;
                margin-top: 26px !important;
                margin-bottom: 20px !important;
            }

            .lobby-shop-title {
                top: 42px !important;
                width: clamp(170px, 42vw, 260px) !important;
            }

            .lobby-shop-categories {
                max-width: 100% !important;
                gap: 24px !important;
            }

            .lobby-shop-category {
                min-height: auto !important;
                padding: 0 !important;
                font-size: 13px !important;
            }

            .lobby-shop-grid {
                width: min(560px, 88%) !important;
                margin-top: 18px !important;
                column-gap: 18px !important;
                row-gap: 18px !important;
            }

            .lobby-shop-slot {
                flex-basis: clamp(132px, 38vw, 170px) !important;
            }

            #lobby-screen .lobby-inventory-button {
                left: calc(50% - 50vw + var(--lobby-side-gap, 24px) + 66px) !important;
                top: auto !important;
                bottom: 66px !important;
                width: clamp(118px, 24vw, 152px) !important;
            }

            .lobby-inventory-grid {
                width: min(560px, 88%) !important;
                column-gap: 18px !important;
                row-gap: 18px !important;
            }

            .inventory-item {
                flex-basis: clamp(132px, 38vw, 170px) !important;
            }

            .lobby-inventory-title {
                top: 18px !important;
            }

            .lobby-inventory-panel {
                width: 96vw !important;
                min-height: 74vh !important;
                padding: 92px 30px 76px !important;
            }

            .lobby-inventory-categories {
                top: 88px !important;
                width: 84% !important;
                gap: 24px !important;
            }

            .lobby-inventory-close {
                bottom: 16px !important;
            }

            .lobby-shop-gold {
                font-size: 20px !important;
                left: 77.4% !important;
                top: 84% !important;
            }

            .lobby-shop-gold img {
                width: 30px !important;
                height: 30px !important;
            }

            .lobby-shop-close {
                left: 50% !important;
                right: auto !important;
                bottom: 16px !important;
                transform: translateX(-50%) !important;
            }
        }

        @keyframes lobbyMenuFloatGroup {
            0%, 100% { transform: translate(-50%, -50%) translateY(0); }
            50% { transform: translate(-50%, -50%) translateY(-5px); }
        }

        @keyframes lobbyShopSlotFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
        }

        @keyframes lobbyMenuButtonFloat {
            0%, 100% { translate: 0 0; }
            50% { translate: 0 -4px; }
        }

        @keyframes lobbyMainPlayPulse {
            0%, 100% {
                transform: translateY(-5px) scale(1.075);
                filter: drop-shadow(8px 12px 0 rgba(26, 11, 4, 0.82))
                        drop-shadow(0 18px 22px rgba(0, 0, 0, 0.34))
                        drop-shadow(0 0 16px rgba(255, 211, 38, 0.68))
                        drop-shadow(0 0 30px rgba(255, 174, 0, 0.38));
            }
            50% {
                transform: translateY(-7px) scale(1.105);
                filter: drop-shadow(8px 12px 0 rgba(26, 11, 4, 0.82))
                        drop-shadow(0 20px 23px rgba(0, 0, 0, 0.36))
                        drop-shadow(0 0 30px rgba(255, 211, 38, 0.95))
                        drop-shadow(0 0 52px rgba(255, 174, 0, 0.6));
            }
        }

        @keyframes lobbyPlayCallToAction {
            0%, 100% { transform: translateY(-8px) scale(1.105) rotate(-1deg); }
            42% { transform: translateY(-11px) scale(1.135) rotate(0.7deg); }
            68% { transform: translateY(-7px) scale(1.115) rotate(-0.4deg); }
        }

        @keyframes lobbyPlayAuraPulse {
            0%, 100% { transform: scale(0.96); opacity: 0.72; }
            50% { transform: scale(1.08); opacity: 1; }
        }

        @keyframes lobbyPlayShineSweep {
            0% { opacity: 0; transform: translateX(-88%) skewX(-12deg); }
            18% { opacity: 0.95; }
            100% { opacity: 0; transform: translateX(88%) skewX(-12deg); }
        }

        @keyframes lobbyPlayTensionVignette {
            0% { opacity: 0.76; filter: saturate(1.02); }
            100% { opacity: 1; filter: saturate(1.18); }
        }

        @keyframes lobbyPlayRays {
            0% { transform: translate(-50%, -50%) rotate(-8deg) scale(0.98); opacity: 0.45; }
            50% { opacity: 0.78; }
            100% { transform: translate(-50%, -50%) rotate(352deg) scale(1.04); opacity: 0.45; }
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
            z-index: 2 !important;
            width: 100vw !important;
            height: 100vh !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 4vh 2vw 14vh !important;
        }

        .lobby-mode-overlay::before,
        .lobby-mode-overlay::after {
            content: "";
            position: fixed !important;
            inset: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.18s ease !important;
        }

        .lobby-mode-overlay::before {
            background: radial-gradient(circle at 50% 50%, rgba(255, 204, 82, 0.08), transparent 22%),
                        radial-gradient(circle at 50% 50%, transparent 22%, rgba(0, 0, 0, 0.44) 68%, rgba(0, 0, 0, 0.68) 100%) !important;
            z-index: 0 !important;
        }

        .lobby-mode-overlay::after {
            background: linear-gradient(115deg, transparent 0%, rgba(255, 230, 120, 0.12) 47%, transparent 58%) !important;
            mix-blend-mode: screen !important;
            z-index: 1 !important;
            transform: translateX(-18%) !important;
        }

        .lobby-mode-overlay.cinematic-focus {
            background: rgba(7, 2, 1, 0.62) !important;
            backdrop-filter: blur(12px) saturate(0.78) contrast(1.08) !important;
        }

        .lobby-mode-overlay.cinematic-focus::before {
            opacity: 1 !important;
        }

        .lobby-mode-overlay.cinematic-pve::before {
            background: radial-gradient(circle at 36% 48%, rgba(80, 190, 255, 0.24), transparent 18%),
                        radial-gradient(circle at 50% 50%, transparent 23%, rgba(5, 18, 36, 0.5) 68%, rgba(0, 0, 0, 0.72) 100%) !important;
        }

        .lobby-mode-overlay.cinematic-pvp::before {
            background: radial-gradient(circle at 64% 48%, rgba(255, 74, 38, 0.2), transparent 18%),
                        radial-gradient(circle at 50% 50%, transparent 22%, rgba(18, 3, 2, 0.52) 68%, rgba(0, 0, 0, 0.76) 100%) !important;
        }

        .lobby-mode-overlay.cinematic-focus::after {
            opacity: 1 !important;
            animation: lobbyCinematicSweep 1.35s ease-in-out infinite alternate !important;
        }

        .lobby-mode-overlay.cinematic-pve::after {
            background: linear-gradient(115deg, transparent 0%, rgba(92, 198, 255, 0.18) 47%, transparent 58%) !important;
        }

        .lobby-mode-overlay.cinematic-pvp::after {
            background: linear-gradient(115deg, transparent 0%, rgba(255, 90, 48, 0.14) 47%, transparent 58%) !important;
        }

        .lobby-mode-choices {
            position: absolute !important;
            z-index: 7 !important;
            inset: 0 !important;
            display: block !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
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
            position: absolute !important;
            z-index: 7 !important;
            top: 44% !important;
            width: min(29vw, 565px) !important;
            aspect-ratio: 2048 / 960 !important;
            pointer-events: auto !important;
            filter: drop-shadow(8px 12px 0 rgba(25, 10, 4, 0.72))
                    drop-shadow(0 18px 22px rgba(0, 0, 0, 0.32)) !important;
            transform: translate(-50%, -50%) translateY(var(--mode-lift, 0px)) scale(var(--mode-scale, 1)) !important;
            animation: lobbyModePop 0.36s cubic-bezier(0.12, 1.25, 0.22, 1) backwards,
                       lobbyModeFloat 2.9s ease-in-out 0.38s infinite !important;
            transition: left 0.42s cubic-bezier(0.17, 0.9, 0.18, 1),
                        top 0.42s cubic-bezier(0.17, 0.9, 0.18, 1),
                        transform 0.18s cubic-bezier(0.2, 1, 0.3, 1),
                        filter 0.15s ease,
                        opacity 0.16s ease !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-btn {
            animation: none !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-btn:not(.selected) {
            opacity: 0 !important;
            pointer-events: none !important;
            filter: grayscale(80%) brightness(0.35) !important;
            --mode-lift: 18px !important;
            --mode-scale: 0.55 !important;
            transition: opacity 0.16s ease, transform 0.16s ease, filter 0.16s ease !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-btn.selected {
            left: 50% !important;
            top: clamp(92px, 14vh, 150px) !important;
            --mode-lift: -4px !important;
            --mode-scale: 1.06 !important;
            opacity: 1 !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-choices {
            pointer-events: none !important;
        }

        .lobby-mode-title,
        .lobby-mode-deck-title {
            position: absolute !important;
            left: 50% !important;
            z-index: 7 !important;
            color: #fff7bc !important;
            font-family: 'Bangers', cursive !important;
            line-height: 1 !important;
            letter-spacing: 1px !important;
            text-align: center !important;
            white-space: nowrap !important;
            paint-order: stroke fill !important;
            pointer-events: none !important;
        }

        .lobby-mode-title {
            top: clamp(58px, 8vh, 98px) !important;
            font-size: clamp(30px, 3.2vw, 52px) !important;
            -webkit-text-stroke: 2px #120603 !important;
            text-shadow: 3px 3px 0 #120603, 0 0 16px rgba(255, 219, 73, 0.38) !important;
            opacity: 1 !important;
            transform: translateX(-50%) translateY(0) scale(1) rotate(-1deg) !important;
            transition: opacity 0.16s ease, transform 0.18s ease !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-title {
            opacity: 0 !important;
            transform: translateX(-50%) translateY(-12px) scale(0.9) rotate(-1deg) !important;
        }

        .lobby-mode-overlay.mode-selected {
            background: rgba(2, 0, 0, 0.78) !important;
            backdrop-filter: blur(13px) saturate(0.62) brightness(0.7) contrast(1.08) !important;
        }

        .lobby-mode-overlay.mode-selected::before {
            opacity: 1 !important;
            background: radial-gradient(circle at 50% 54%, rgba(255, 210, 80, 0.08), transparent 18%),
                        radial-gradient(circle at 50% 50%, transparent 18%, rgba(0, 0, 0, 0.62) 58%, rgba(0, 0, 0, 0.9) 100%) !important;
        }

        .lobby-mode-flares {
            position: fixed !important;
            inset: 0 !important;
            z-index: 4 !important;
            overflow: hidden !important;
            pointer-events: none !important;
            display: none !important;
            opacity: 0 !important;
            mix-blend-mode: normal !important;
            transition: opacity 0.2s ease !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-flares {
            opacity: 1 !important;
        }

        .lobby-mode-flares::before,
        .lobby-mode-flares::after {
            content: "" !important;
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            bottom: -34vh !important;
            height: 154vh !important;
            opacity: 0 !important;
            pointer-events: none !important;
            background-repeat: repeat-y !important;
            background-size: 100% 72vh !important;
            filter: blur(0.2px) brightness(1.35) !important;
            animation: lobbyModeFlareSheet 2.25s linear infinite !important;
            will-change: transform, opacity !important;
        }

        .lobby-mode-flares::after {
            animation-duration: 3.1s !important;
            animation-delay: -1.1s !important;
            transform: translateY(16vh) !important;
            opacity: 0 !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-flares::before,
        .lobby-mode-overlay.mode-selected .lobby-mode-flares::after {
            opacity: 1 !important;
        }

        .lobby-mode-overlay.selected-pve .lobby-mode-flares::before,
        .lobby-mode-overlay.selected-pve .lobby-mode-flares::after {
            background-image:
                radial-gradient(ellipse 14px 82px at 6% 96%, rgba(255,255,255,0.95), rgba(82,198,255,0.66) 34%, transparent 72%),
                radial-gradient(ellipse 20px 118px at 18% 102%, rgba(71,190,255,0.82), rgba(255,255,255,0.46) 38%, transparent 74%),
                radial-gradient(ellipse 13px 96px at 31% 94%, rgba(255,255,255,0.8), rgba(58,168,255,0.58) 36%, transparent 73%),
                radial-gradient(ellipse 24px 138px at 47% 100%, rgba(71,190,255,0.72), rgba(255,255,255,0.5) 34%, transparent 76%),
                radial-gradient(ellipse 15px 92px at 63% 98%, rgba(255,255,255,0.9), rgba(80,203,255,0.64) 35%, transparent 72%),
                radial-gradient(ellipse 22px 124px at 79% 103%, rgba(63,176,255,0.78), rgba(255,255,255,0.44) 36%, transparent 75%),
                radial-gradient(ellipse 16px 104px at 93% 96%, rgba(255,255,255,0.88), rgba(74,190,255,0.6) 34%, transparent 74%) !important;
        }

        .lobby-mode-overlay.selected-pvp .lobby-mode-flares::before,
        .lobby-mode-overlay.selected-pvp .lobby-mode-flares::after {
            background-image:
                radial-gradient(ellipse 14px 82px at 6% 96%, rgba(255,226,72,0.95), rgba(255,64,32,0.68) 34%, transparent 72%),
                radial-gradient(ellipse 20px 118px at 18% 102%, rgba(255,69,37,0.84), rgba(255,220,73,0.48) 38%, transparent 74%),
                radial-gradient(ellipse 13px 96px at 31% 94%, rgba(255,229,74,0.82), rgba(255,73,36,0.6) 36%, transparent 73%),
                radial-gradient(ellipse 24px 138px at 47% 100%, rgba(255,72,36,0.74), rgba(255,219,70,0.52) 34%, transparent 76%),
                radial-gradient(ellipse 15px 92px at 63% 98%, rgba(255,227,76,0.92), rgba(255,70,34,0.66) 35%, transparent 72%),
                radial-gradient(ellipse 22px 124px at 79% 103%, rgba(255,65,34,0.8), rgba(255,218,76,0.46) 36%, transparent 75%),
                radial-gradient(ellipse 16px 104px at 93% 96%, rgba(255,226,72,0.9), rgba(255,74,36,0.62) 34%, transparent 74%) !important;
        }

        .lobby-mode-flare {
            position: absolute !important;
            left: var(--flare-left, 50%) !important;
            bottom: -8vh !important;
            width: var(--flare-size, 10px) !important;
            height: var(--flare-height, 52px) !important;
            border-radius: 999px !important;
            opacity: 0 !important;
            filter: blur(0.2px) brightness(1.7) !important;
            animation: lobbyModeFlareRise var(--flare-duration, 2.8s) linear var(--flare-delay, 0s) infinite !important;
            will-change: transform, opacity !important;
        }

        .lobby-mode-flare.pve {
            background: linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,1), rgba(67,198,255,0.98), rgba(255,255,255,0.62), rgba(255,255,255,0)) !important;
            box-shadow: 0 0 18px rgba(94, 205, 255, 1), 0 0 34px rgba(255,255,255,0.6), 0 0 58px rgba(50,170,255,0.36) !important;
        }

        .lobby-mode-flare.pvp {
            background: linear-gradient(to top, rgba(255,255,255,0), rgba(255,226,72,1), rgba(255,58,35,0.98), rgba(255,220,80,0.62), rgba(255,255,255,0)) !important;
            box-shadow: 0 0 18px rgba(255, 65, 39, 1), 0 0 34px rgba(255,220,75,0.62), 0 0 58px rgba(255,40,24,0.34) !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-pve.selected {
            filter: brightness(1.2) saturate(1.18)
                    drop-shadow(9px 14px 0 rgba(7, 14, 30, 0.76))
                    drop-shadow(0 22px 25px rgba(0, 0, 0, 0.34))
                    drop-shadow(0 0 42px rgba(74, 191, 255, 0.68))
                    drop-shadow(0 0 22px rgba(255, 255, 255, 0.46)) !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-pvp.selected {
            filter: brightness(1.18) saturate(1.2)
                    drop-shadow(9px 14px 0 rgba(24, 8, 3, 0.78))
                    drop-shadow(0 22px 25px rgba(0, 0, 0, 0.36))
                    drop-shadow(0 0 42px rgba(255, 76, 40, 0.58))
                    drop-shadow(0 0 22px rgba(255, 223, 87, 0.54)) !important;
        }

        .lobby-mode-pvp {
            background-image: url('assets/img/botao_pvp.webp') !important;
            left: 70% !important;
        }

        .lobby-mode-pve {
            background-image: url('assets/img/botao_pve.webp') !important;
            left: 30% !important;
            animation-delay: 0.07s, 0.52s !important;
        }

        .lobby-mode-btn:hover,
        .lobby-mode-btn:focus-visible {
            --mode-lift: -10px !important;
            --mode-scale: 1.09 !important;
        }

        .lobby-mode-pve:hover,
        .lobby-mode-pve:focus-visible {
            filter: brightness(1.15) saturate(1.14)
                    drop-shadow(10px 15px 0 rgba(7, 14, 30, 0.76))
                    drop-shadow(0 23px 25px rgba(0, 0, 0, 0.36))
                    drop-shadow(0 0 40px rgba(74, 191, 255, 0.62))
                    drop-shadow(0 0 20px rgba(255, 255, 255, 0.42)) !important;
        }

        .lobby-mode-pvp:hover,
        .lobby-mode-pvp:focus-visible {
            filter: brightness(1.16) saturate(1.18)
                    drop-shadow(10px 15px 0 rgba(24, 8, 3, 0.78))
                    drop-shadow(0 24px 27px rgba(0, 0, 0, 0.38))
                    drop-shadow(0 0 42px rgba(255, 76, 40, 0.52))
                    drop-shadow(0 0 22px rgba(255, 223, 87, 0.5)) !important;
        }

        .lobby-mode-btn::before {
            content: attr(data-points);
            position: absolute !important;
            left: 50% !important;
            top: calc(100% + 12px) !important;
            bottom: auto !important;
            transform: translateX(-50%) translateY(-8px) scale(0.9) rotate(-2deg) !important;
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
            content: none !important;
            display: none !important;
        }

        .lobby-mode-btn:hover::before,
        .lobby-mode-btn:focus-visible::before {
            opacity: 1 !important;
            transform: translateX(-50%) translateY(0) scale(1) rotate(-2deg) !important;
        }

        .lobby-mode-btn:hover::after,
        .lobby-mode-btn:focus-visible::after {
            content: none !important;
            display: none !important;
        }

        .lobby-mode-decks {
            position: absolute !important;
            left: 50% !important;
            bottom: clamp(126px, 17vh, 190px) !important;
            z-index: 7 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: clamp(42px, 6vw, 92px) !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateX(-50%) translateY(34px) scale(0.92) !important;
            transition: opacity 0.22s ease, transform 0.25s cubic-bezier(0.15, 1, 0.22, 1) !important;
        }

        .lobby-mode-deck-title {
            top: clamp(332px, 38vh, 396px) !important;
            font-size: clamp(28px, 3vw, 48px) !important;
            -webkit-text-stroke: 2px #120603 !important;
            text-shadow: 3px 3px 0 #120603, 0 0 16px rgba(255, 219, 73, 0.38) !important;
            opacity: 0 !important;
            transform: translateX(-50%) translateY(20px) scale(0.86) rotate(-1deg) !important;
            transition: opacity 0.2s ease, transform 0.24s cubic-bezier(0.15, 1, 0.22, 1) !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-deck-title {
            opacity: 1 !important;
            transform: translateX(-50%) translateY(0) scale(1) rotate(-1deg) !important;
        }

        .lobby-mode-overlay.mode-selected .lobby-mode-decks {
            opacity: 1 !important;
            pointer-events: auto !important;
            transform: translateX(-50%) translateY(0) scale(1) !important;
            animation: lobbyDecksPop 0.36s cubic-bezier(0.12, 1.24, 0.24, 1) both !important;
        }

        .lobby-mode-deck {
            position: relative !important;
            --deck-glow: rgba(52, 152, 219, 0.7);
            width: min(17vw, 285px) !important;
            border: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            cursor: pointer !important;
            transform-origin: center bottom !important;
            transition: transform 0.22s cubic-bezier(0.2, 1, 0.3, 1), filter 0.18s ease !important;
        }

        .lobby-mode-deck img {
            width: 100% !important;
            height: auto !important;
            display: block !important;
            filter: grayscale(78%) brightness(0.72) drop-shadow(0 13px 13px rgba(0, 0, 0, 0.52)) !important;
            transition: filter 0.2s ease, transform 0.22s cubic-bezier(0.2, 1, 0.3, 1) !important;
        }

        .lobby-mode-deck[data-deck="knight"] { --deck-glow: rgba(52, 152, 219, 0.7); }
        .lobby-mode-deck[data-deck="mage"] { --deck-glow: rgba(255, 59, 48, 0.7); }
        .lobby-mode-deck[data-deck="archer"] { --deck-glow: rgba(54, 212, 107, 0.72); }
        .lobby-mode-deck[data-deck="rogue"] { --deck-glow: rgba(255, 210, 46, 0.74); }
        .lobby-mode-deck[data-deck="oracle"] { --deck-glow: rgba(168, 85, 247, 0.74); }

        .lobby-mode-deck:hover,
        .lobby-mode-deck:focus-visible {
            transform: translateY(-14px) scale(1.08) !important;
        }

        .lobby-mode-deck:hover img,
        .lobby-mode-deck:focus-visible img {
            filter: grayscale(0%) brightness(1.12) drop-shadow(0 0 30px var(--deck-glow)) drop-shadow(0 18px 17px rgba(0, 0, 0, 0.48)) !important;
        }

        .lobby-mode-deck.deck-selecting {
            pointer-events: none !important;
            transform: translateY(-22px) scale(1.16) !important;
            z-index: 4 !important;
        }

        .lobby-mode-deck.deck-selecting img {
            filter: grayscale(0%) brightness(1.32) drop-shadow(0 0 34px var(--deck-glow)) drop-shadow(0 18px 17px rgba(0, 0, 0, 0.52)) !important;
        }

        .lobby-mode-deck.deck-dimmed {
            opacity: 0.34 !important;
            transform: scale(0.88) translateY(8px) !important;
            pointer-events: none !important;
        }

        .lobby-mode-deck.deck-locked,
        .lobby-mode-deck:disabled {
            opacity: 0.38 !important;
            cursor: not-allowed !important;
            filter: grayscale(1) brightness(0.58) !important;
        }

        .lobby-mode-deck.deck-locked::before {
            content: "BLOQUEADO" !important;
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) rotate(-8deg) !important;
            z-index: 5 !important;
            color: #ffe44d !important;
            font-family: 'Bangers', cursive !important;
            font-size: clamp(22px, 2.2vw, 34px) !important;
            -webkit-text-stroke: 1.5px #120501 !important;
            paint-order: stroke fill !important;
            text-shadow: 3px 3px 0 #120501 !important;
            pointer-events: none !important;
        }

        .lobby-mode-deck::after {
            content: attr(data-name);
            position: absolute !important;
            left: 50% !important;
            top: 100% !important;
            width: 170% !important;
            transform: translateX(-50%) translateY(12px) !important;
            color: #fff6d0 !important;
            font-family: 'Montserrat', sans-serif !important;
            font-size: 14px !important;
            font-weight: 800 !important;
            text-align: center !important;
            text-shadow: 0 2px 4px #000, 0 0 12px rgba(255, 215, 0, 0.4) !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.16s ease, transform 0.16s ease !important;
        }

        .lobby-mode-deck:hover::after,
        .lobby-mode-deck:focus-visible::after {
            opacity: 1 !important;
            transform: translateX(-50%) translateY(6px) !important;
        }

        .lobby-mode-history {
            position: fixed !important;
            left: 50% !important;
            bottom: clamp(64px, 8vh, 92px) !important;
            width: min(14vw, 190px) !important;
            min-width: 150px !important;
            aspect-ratio: 2048 / 560 !important;
            background-image: url('assets/img/botao_historico.webp') !important;
            filter: drop-shadow(5px 8px 0 rgba(16, 7, 3, 0.72))
                    drop-shadow(0 11px 14px rgba(0, 0, 0, 0.28)) !important;
            transform: translateX(-50%) !important;
            z-index: 3 !important;
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

        @keyframes lobbyModeFlareRise {
            0% { opacity: 0; transform: translateY(0) scaleY(0.48) scaleX(0.82); }
            9% { opacity: 1; }
            72% { opacity: 0.95; }
            100% { opacity: 0; transform: translateY(-112vh) scaleY(1.28) scaleX(1.06); }
        }

        @keyframes lobbyModeFlareSheet {
            0% { transform: translateY(0); }
            100% { transform: translateY(-72vh); }
        }

        @keyframes lobbyDecksPop {
            0% { opacity: 0; transform: translateX(-50%) translateY(38px) scale(0.68); }
            58% { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.08); }
            78% { opacity: 1; transform: translateX(-50%) translateY(4px) scale(0.97); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        @keyframes lobbyCinematicSweep {
            0% { transform: translateX(-22%); opacity: 0.28; }
            100% { transform: translateX(18%); opacity: 0.58; }
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
                width: min(64vw, 330px) !important;
                min-width: 0 !important;
                transform: translate(-50%, -50%) !important;
                gap: 10px !important;
            }

            #lobby-screen #btn-play-pvp.lobby-main-play {
                width: 100% !important;
                aspect-ratio: 1392 / 637 !important;
                padding: 0 !important;
            }

            #lobby-screen #btn-play-pvp.lobby-main-play .btn-title {
                font-size: clamp(34px, 8.4vw, 52px) !important;
            }

            #lobby-screen .lobby-menu-small {
                width: min(67%, 220px) !important;
                min-width: 170px !important;
                aspect-ratio: 1345 / 425 !important;
            }

            #lobby-screen .lobby-main-history {
                width: min(70%, 225px) !important;
                min-width: 180px !important;
                aspect-ratio: 1345 / 471 !important;
            }

            .lobby-mode-panel {
                width: 100vw !important;
                height: 100vh !important;
                min-height: 0 !important;
                padding: 5vh 3vw 12vh !important;
            }

            .lobby-mode-choices {
                inset: 0 !important;
                transform: none !important;
            }

            .lobby-mode-overlay.mode-selected .lobby-mode-choices {
                transform: none !important;
            }

            .lobby-mode-btn {
                width: min(42vw, 310px) !important;
                aspect-ratio: 2048 / 960 !important;
            }

            .lobby-mode-decks {
                bottom: 92px !important;
                gap: 24px !important;
            }

            .lobby-mode-deck-title {
                top: 37vh !important;
                font-size: clamp(22px, 5vw, 34px) !important;
                -webkit-text-stroke-width: 2px !important;
            }

            .lobby-mode-title {
                top: 6vh !important;
                font-size: clamp(24px, 5.4vw, 38px) !important;
                -webkit-text-stroke-width: 2px !important;
            }

            .lobby-mode-deck {
                width: min(32vw, 190px) !important;
            }

            .lobby-mode-history {
                width: min(36vw, 170px) !important;
                min-width: 130px !important;
                bottom: 52px !important;
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
        const oldBottomProfileBar = document.getElementById('lobby-bottom-profile-bar');
        if (oldBottomProfileBar) oldBottomProfileBar.remove();

        let profileAsset = document.getElementById('lobby-profile-asset');
        if (!profileAsset) {
            profileAsset = document.createElement('section');
            profileAsset.id = 'lobby-profile-asset';
            profileAsset.className = 'lobby-profile-asset';
            profileAsset.innerHTML = `
                <div class="profile-asset-avatar" id="profile-asset-avatar">B</div>
                <div class="profile-asset-name" id="profile-asset-name">JOGADOR <span class="profile-asset-id-inline" id="profile-asset-id">#----</span></div>
                <div class="profile-asset-ranking" id="profile-asset-ranking">RANKING -</div>
                <div class="profile-asset-gold"><span id="profile-asset-gold-count">0</span></div>
            `;
            lobbyScreen.appendChild(profileAsset);
        }
        let inventoryButton = document.getElementById('btn-lobby-inventory');
        if (!inventoryButton) {
            inventoryButton = document.createElement('button');
            inventoryButton.id = 'btn-lobby-inventory';
            inventoryButton.type = 'button';
            inventoryButton.className = 'lobby-inventory-button';
            lobbyScreen.appendChild(inventoryButton);
        }
        inventoryButton.setAttribute('aria-label', 'Mochila');
        inventoryButton.title = 'Mochila';
        inventoryButton.innerHTML = '<img src="assets/img/mochila.webp" alt="Mochila" draggable="false">';
        if (inventoryButton.dataset.hoverSoundBound !== '1') {
            inventoryButton.dataset.hoverSoundBound = '1';
            let inventoryHoverActive = false;
            inventoryButton.addEventListener('pointerenter', () => {
                if (inventoryHoverActive) return;
                inventoryHoverActive = true;
                window.playLobbyButtonHoverSound?.();
            });
            inventoryButton.addEventListener('pointerleave', () => {
                inventoryHoverActive = false;
            });
            inventoryButton.addEventListener('focus', () => window.playLobbyButtonHoverSound?.());
        }
        if (inventoryButton.dataset.pressJuiceBound !== '1') {
            inventoryButton.dataset.pressJuiceBound = '1';
            inventoryButton.addEventListener('pointerdown', () => {
                inventoryButton.classList.remove('lobby-button-press-juice');
                void inventoryButton.offsetWidth;
                inventoryButton.classList.add('lobby-button-press-juice');
                setTimeout(() => inventoryButton.classList.remove('lobby-button-press-juice'), 360);
            }, { capture: true });
        }
        inventoryButton.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (window.playLobbyButtonSelectSound) window.playLobbyButtonSelectSound();
            else window.playNavSound?.();
            window.openInventory?.();
        };
        window.updateLobbyBottomProfileBar?.();

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

        const playLobbyPressJuice = (button) => {
            if(!button) return;
            button.classList.remove('lobby-button-press-juice');
            void button.offsetWidth;
            button.classList.add('lobby-button-press-juice');
            setTimeout(() => button.classList.remove('lobby-button-press-juice'), 360);
        };

        const runLobbyButtonAction = (button, action) => {
            if(!button || button.dataset.lobbyActionBusy === '1') return;
            button.dataset.lobbyActionBusy = '1';
            window.playLobbyButtonSelectSound?.();
            playLobbyPressJuice(button);
            window.suppressNavSoundFor?.(520);
            setTimeout(() => {
                try {
                    window.suppressNavSoundFor?.(180);
                    action?.();
                } finally {
                    setTimeout(() => { button.dataset.lobbyActionBusy = '0'; }, 140);
                }
            }, 340);
        };

        let playButton = document.getElementById('btn-play-pvp');
        if (!playButton) {
            playButton = document.createElement('button');
            playButton.id = 'btn-play-pvp';
            playButton.type = 'button';
        }
        playButton.className = 'lobby-main-play';
        playButton.classList.add('lobby-menu-button');
        playButton.removeAttribute('data-tip');
        playButton.removeAttribute('title');
        playButton.setAttribute('aria-label', 'Jogar');
        playButton.onmouseenter = null;
        playButton.onfocus = null;
        playButton.onmouseleave = null;
        playButton.onblur = null;
        playButton.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            runLobbyButtonAction(playButton, () => window.openLobbyModeChooser?.());
        };
        playButton.replaceChildren();
        if (playButton.parentElement !== playCenter) {
            playCenter.appendChild(playButton);
        }

        const ensureLobbyMenuButton = (id, className, label, onClick) => {
            let button = document.getElementById(id);
            if (!button) {
                button = document.createElement('button');
                button.id = id;
                button.type = 'button';
            }
            button.className = `lobby-menu-button lobby-menu-small ${className}`;
            button.setAttribute('aria-label', label);
            button.removeAttribute('title');
            button.removeAttribute('data-tip');
            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                runLobbyButtonAction(button, onClick);
            };
            button.replaceChildren();
            if (button.parentElement !== playCenter) {
                playCenter.appendChild(button);
            }
            return button;
        };

        ensureLobbyMenuButton('btn-lobby-main-history', 'lobby-main-history', 'Hist\u00f3rico de partidas', () => window.openHistory?.());
        ensureLobbyMenuButton('btn-lobby-main-ranking', 'lobby-main-ranking', 'Ranking', () => window.openLobbyRanking?.());
        ensureLobbyMenuButton('btn-lobby-main-shop', 'lobby-main-shop', 'Loja', () => window.openLobbyShop?.());
        ensureLobbyMenuButton('btn-lobby-main-tutorial', 'lobby-main-tutorial', 'Tutorial', () => {});
        ensureLobbyMenuButton('btn-lobby-main-exit', 'lobby-main-exit', 'Sair', () => {
            if (window.buppoDesktop?.quit) {
                window.buppoDesktop.quit();
            }
        });

        playCenter.querySelectorAll('.lobby-menu-button').forEach((button) => {
            if (button.dataset.hoverSoundBound !== '1') {
                button.dataset.hoverSoundBound = '1';
                const playHover = () => window.playLobbyButtonHoverSound?.();
                button.addEventListener('mouseenter', playHover);
                button.addEventListener('pointerenter', playHover);
                button.addEventListener('mouseover', playHover);
                button.addEventListener('focus', playHover);
            }
            if (button.dataset.pressJuiceBound !== '1') {
                button.dataset.pressJuiceBound = '1';
                const pressJuice = () => playLobbyPressJuice(button);
                button.addEventListener('pointerdown', pressJuice, { capture: true });
            }
        });

        let rankingModal = document.getElementById('lobby-ranking-modal');
        if (!rankingModal) {
            rankingModal = document.createElement('div');
            rankingModal.id = 'lobby-ranking-modal';
            rankingModal.className = 'lobby-ranking-modal';
            rankingModal.innerHTML = `
                <div class="lobby-ranking-panel" role="dialog" aria-modal="true" aria-label="Ranking">
                    <h2 class="lobby-ranking-title">RANKING</h2>
                    <div class="ranking-scroll" id="lobby-ranking-modal-content"></div>
                    <button class="mini-btn lobby-ranking-close" type="button">FECHAR</button>
                </div>
            `;
            document.body.appendChild(rankingModal);
            rankingModal.addEventListener('click', (event) => {
                if (event.target === rankingModal) window.closeLobbyRanking?.();
            });
            rankingModal.querySelector('.lobby-ranking-close')?.addEventListener('click', () => window.closeLobbyRanking?.());
        }

        window.openLobbyRanking = () => {
            window.playNavSound?.();
            const source = document.getElementById('ranking-content');
            const target = document.getElementById('lobby-ranking-modal-content');
            if (target) target.innerHTML = source?.innerHTML || '<div class="loading-text">Carregando ranking...</div>';
            rankingModal.classList.add('visible');
        };

        window.closeLobbyRanking = () => {
            window.playNavSound?.();
            rankingModal.classList.remove('visible');
        };

        const lobbyCardBorderItems = [
            { id: 'metallic_border', name: 'BORDA - GUARDA REAL', displayName: 'GUARDA REAL', asset: 'assets/img/borda_metalica_card.webp', shopAsset: 'assets/img/borda_cavaleiro_loja.webp?v=2026.06.24.16' },
            { id: 'mage_fire_border', name: 'BORDA - CHAMA ARCANA', displayName: 'CHAMA ARCANA', asset: 'assets/img/borda_chama_arcana_card.webp?v=2026.06.24.5', shopAsset: 'assets/img/borda_mago_loja.webp?v=2026.06.24.16' },
            { id: 'elven_forest_border', name: 'BORDA - SENTINELA VERDE', displayName: 'SENTINELA VERDE', asset: 'assets/img/borda_bosque_elfico_card.webp?v=2026.06.24.5', shopAsset: 'assets/img/borda_arqueiro_loja.webp?v=2026.06.24.16' },
            { id: 'rogue_gold_border', name: 'BORDA - M\u00c3O DOURADA', displayName: 'M\u00c3O DOURADA', asset: 'assets/img/borda_mao_dourada_card.webp?v=2026.06.24.5', shopAsset: 'assets/img/borda_ladino_loja.webp?v=2026.06.24.16' },
            { id: 'oracle_border', name: 'BORDA - VIS\u00c3O ASTRAL', displayName: 'VIS\u00c3O ASTRAL', asset: 'assets/img/borda_visao_astral_card.webp?v=2026.06.24.5', shopAsset: 'assets/img/borda_oraculo_loja.webp?v=2026.06.24.16' }
        ];
        const lobbyDeckItems = [
            { id: 'deck_knight', type: 'deck', name: 'DECK - CAVALEIRO', displayName: 'CAVALEIRO', asset: 'assets/img/deck_cavaleiro_loja.webp', shopAsset: 'assets/img/deck_cavaleiro_loja.webp' },
            { id: 'deck_mage', type: 'deck', name: 'DECK - MAGO', displayName: 'MAGO', asset: 'assets/img/deck_mago_loja.webp', shopAsset: 'assets/img/deck_mago_loja.webp' },
            { id: 'deck_archer', type: 'deck', name: 'DECK - ARQUEIRO', displayName: 'ARQUEIRO', asset: 'assets/img/deck_arqueiro_loja.webp', shopAsset: 'assets/img/deck_arqueiro_loja.webp' },
            { id: 'deck_rogue', type: 'deck', name: 'DECK - LADINO', displayName: 'LADINO', asset: 'assets/img/deck_ladino_loja.webp', shopAsset: 'assets/img/deck_ladino_loja.webp' },
            { id: 'deck_oracle', type: 'deck', name: 'DECK - ORÁCULO', displayName: 'ORÁCULO', asset: 'assets/img/deck_oraculo_loja.webp', shopAsset: 'assets/img/deck_oraculo_loja.webp' }
        ];
        const lobbyClusterItems = [
            { id: 'cluster_knight', type: 'cluster', name: 'CLUSTER - GUARDA REAL', displayName: 'GUARDA REAL', asset: 'assets/img/cluster_cavaleiro_guardareal.webp', shopAsset: 'assets/img/cluster_cavaleiro_guardareal_shop.webp' },
            { id: 'cluster_mage', type: 'cluster', name: 'CLUSTER - CHAMA ARCANA', displayName: 'CHAMA ARCANA', asset: 'assets/img/cluster_mago_chamaarcana.webp', shopAsset: 'assets/img/cluster_mago_chamaarcana_shop.webp' },
            { id: 'cluster_archer', type: 'cluster', name: 'CLUSTER - SENTINELA VERDE', displayName: 'SENTINELA VERDE', asset: 'assets/img/cluster_arqueiro_sentinelaverde.webp', shopAsset: 'assets/img/cluster_arqueiro_sentinelaverde_shop.webp' },
            { id: 'cluster_rogue', type: 'cluster', name: 'CLUSTER - M\u00c3O DOURADA', displayName: 'M\u00c3O DOURADA', asset: 'assets/img/cluster_ladino_maodourada.webp', shopAsset: 'assets/img/cluster_ladino_maodourada_shop.webp' },
            { id: 'cluster_oracle', type: 'cluster', name: 'CLUSTER - VIS\u00c3O ASTRAL', displayName: 'VIS\u00c3O ASTRAL', asset: 'assets/img/cluster_oraculo_visaoastral.webp', shopAsset: 'assets/img/cluster_oraculo_visaoastral_shop.webp' }
        ];
        const lobbyShopItemsByCategory = {
            decks: lobbyDeckItems,
            borders: lobbyCardBorderItems,
            clusters: lobbyClusterItems,
            pets: []
        };
        const lobbyShopSlotCount = 5;
        const shopBorderInfo = {
            metallic_border: [
                'Seus Bloqueios efetivos geram 6 {coin}.',
                'Realizar uma <strong>Maestria em Bloqueio</strong> gera 3 {coin}.'
            ],
            mage_fire_border: [
                'Seus Ataques efetivos geram 6 {coin}.',
                'Realizar uma <strong>Maestria em Ataque</strong> gera 4 {coin}.',
                'Jogar Ataque logo ap\u00f3s j\u00e1 ter jogado Ataque gera 6 {coin}.'
            ],
            elven_forest_border: [
                'Jogar Restaurar gera 12 {coin}.',
                'Realizar uma <strong>Maestria em Restaurar</strong> gera 14 {coin}.'
            ],
            rogue_gold_border: [
                'Jogar Desarmar gera 12 {coin}.',
                'Realizar uma <strong>Maestria em Desarmar</strong> gera 12 {coin}.',
                'Jogar Desarmar ao mesmo tempo que o oponente também jogar Desarmar gera 12 {coin}.'
            ],
            oracle_border: [
                'Jogar Treinar gera 5 {coin}.',
                'Subir de nível gera 10 {coin}.',
                'Realizar uma <strong>Maestria em Treinar</strong> gera 10 {coin}.'
            ],
            deck_knight: [
                'Seus Bloqueios efetivos geram 2 {coin}.',
                'Realizar uma <strong>Maestria em Bloqueio</strong> gera 1 {coin}.'
            ],
            deck_mage: [
                'Seus Ataques efetivos geram 1 {coin}.',
                'Realizar uma <strong>Maestria em Ataque</strong> gera 1 {coin}.',
                'Jogar Ataque logo ap\u00f3s j\u00e1 ter jogado Ataque gera 1 {coin}.'
            ],
            deck_archer: [
                'Jogar Restaurar gera 4 {coin}.',
                'Realizar uma <strong>Maestria em Restaurar</strong> gera 9 {coin}.'
            ],
            deck_rogue: [
                'Jogar Desarmar gera 4 {coin}.',
                'Realizar uma <strong>Maestria em Desarmar</strong> gera 4 {coin}.',
                'Jogar Desarmar ao mesmo tempo que o oponente também jogar Desarmar gera 4 {coin}.'
            ],
            deck_oracle: [
                'Jogar Treinar gera 1 {coin}.',
                'Subir de nível gera 2 {coin}.',
                'Realizar uma <strong>Maestria em Treinar</strong> gera 4 {coin}.'
            ],
            cluster_knight: [
                'Seus Bloqueios efetivos geram 8 {coin}.',
                'Realizar uma <strong>Maestria em Bloqueio</strong> gera 8 {coin}.'
            ],
            cluster_mage: [
                'Seus Ataques efetivos geram 6 {coin}.',
                'Realizar uma <strong>Maestria em Ataque</strong> gera 4 {coin}.',
                'Jogar Ataque logo ap\u00f3s j\u00e1 ter jogado Ataque gera 4 {coin}.'
            ],
            cluster_archer: [
                'Jogar Restaurar gera 16 {coin}.',
                'Realizar uma <strong>Maestria em Restaurar</strong> gera 18 {coin}.'
            ],
            cluster_rogue: [
                'Jogar Desarmar gera 17 {coin}.',
                'Realizar uma <strong>Maestria em Desarmar</strong> gera 20 {coin}.',
                'Jogar Desarmar ao mesmo tempo que o oponente tamb\u00e9m jogar Desarmar gera 17 {coin}.'
            ],
            cluster_oracle: [
                'Jogar Treinar gera 6 {coin}.',
                'Subir de n\u00edvel gera 6 {coin}.',
                'Realizar uma <strong>Maestria em Treinar</strong> gera 18 {coin}.'
            ]
        };
        const shopInfoCoin = '<img class="shop-info-coin" src="assets/img/moeda_ouro.png" alt="ouro">';

        const getItemDisplayName = (item) => item.displayName || item.name.replace(/^(BORDA|\u00c1REA DE XP|DECK|CLUSTER)\s*-\s*/i, '');
        const getShopItemById = (itemId) => [...lobbyDeckItems, ...lobbyCardBorderItems, ...lobbyXpAreaItems, ...lobbyClusterItems].find(item => item.id === itemId) || null;
        const ensureShopInfoTooltip = () => {
            let tooltip = document.getElementById('shop-info-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.className = 'shop-info-tooltip';
                tooltip.id = 'shop-info-tooltip';
                document.body.appendChild(tooltip);
            }
            return tooltip;
        };
        const renderShopInfo = (item) => {
            const lines = shopBorderInfo[item.id] || [];
            return `
                <div class="shop-info-title">${item.name}</div>
                ${lines.map(line => `<p>${line.replaceAll('{coin}', shopInfoCoin)}</p>`).join('')}`;
        };
        const bindBorderInfoTooltips = (root, selector, getItemId) => {
            const tooltip = ensureShopInfoTooltip();
            const moveTooltip = (event) => {
                const gap = 18;
                const rect = tooltip.getBoundingClientRect();
                let left = event.clientX + gap;
                let top = event.clientY + gap;
                if (left + rect.width > window.innerWidth - 12) left = event.clientX - rect.width - gap;
                if (top + rect.height > window.innerHeight - 12) top = event.clientY - rect.height - gap;
                tooltip.style.left = `${Math.max(12, left)}px`;
                tooltip.style.top = `${Math.max(12, top)}px`;
            };
            root.querySelectorAll(selector).forEach((element) => {
                element.addEventListener('mouseenter', (event) => {
                    const item = getShopItemById(getItemId(element));
                    if (!item) return;
                    tooltip.innerHTML = renderShopInfo(item);
                    tooltip.classList.add('visible');
                    moveTooltip(event);
                });
                element.addEventListener('mousemove', moveTooltip);
                element.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
            });
        };
        const renderBorderPreview = (item, location = 'inventory') => {
            const asset = location === 'shop' ? (item.shopAsset || item.asset) : item.asset;
            const artClass = (item.type === 'deck' || item.type === 'cluster') ? 'metallic-border-art deck-product-art' : (item.type === 'xpArea' || item.id.startsWith('xp_') ? 'metallic-border-art xp-area-product-art' : 'metallic-border-art');
            return `<div class="${artClass}" style="background-image: url('${asset}')" aria-label="Arte de ${item.name}"></div>`;
        };
        const renderShopProducts = (category = 'borders') => {
            const items = lobbyShopItemsByCategory[category] || [];
            const productsHtml = items.slice(0, lobbyShopSlotCount).map(item => `
                        <div class="lobby-shop-slot lobby-shop-product" role="button" tabindex="0" data-shop-item="${item.id}">
                            <div class="shop-product-name">${getItemDisplayName(item)}</div>
                            ${renderBorderPreview(item, 'shop')}
                            <span class="shop-owned-ribbon" data-owned-ribbon="${item.id}" hidden>COMPRADO</span>
                            <button class="shop-buy-btn" type="button" data-buy-item="${item.id}">COMPRAR</button>
                        </div>`).join('');
            const emptyCount = Math.max(0, lobbyShopSlotCount - Math.min(items.length, lobbyShopSlotCount));
            const emptySlotsHtml = Array.from({ length: emptyCount }, () => `
                        <div class="lobby-shop-slot" aria-hidden="true"></div>`).join('');
            return `${productsHtml}${emptySlotsHtml}`;
        };

        let shopModal = document.getElementById('lobby-shop-modal');
        if (!shopModal) {
            shopModal = document.createElement('div');
            shopModal.id = 'lobby-shop-modal';
            shopModal.className = 'lobby-shop-modal';
            shopModal.innerHTML = `
                <div class="lobby-shop-title" role="img" aria-label="LOJA">LOJA</div>
                <div class="lobby-shop-panel" role="dialog" aria-modal="true" aria-label="Loja">
                    <div class="lobby-shop-header">
                        <div class="lobby-shop-title-stack">
                            <div class="lobby-shop-categories" aria-label="Categorias da loja">
                                <button class="lobby-shop-category" type="button" data-shop-category="decks">DECKS</button>
                                <button class="lobby-shop-category active" type="button" data-shop-category="borders">BORDAS</button>
                                <button class="lobby-shop-category" type="button" data-shop-category="clusters">CLUSTERS</button>
                                <button class="lobby-shop-category" type="button" data-shop-category="pets">MASCOTES</button>
                            </div>
                        </div>
                    </div>
                    <div class="lobby-shop-gold" aria-label="Ouro dispon\u00edvel">
                        <img src="assets/img/moeda_ouro.png" alt="Moeda de ouro">
                        <span id="lobby-shop-gold-count">0</span>
                    </div>
                    <div class="lobby-shop-grid" aria-label="Itens da loja"></div>
                </div>
                <button class="mini-btn lobby-shop-close" type="button" aria-label="Sair da loja">SAIR</button>
            `;
            document.body.appendChild(shopModal);
            ensureShopInfoTooltip();
            shopModal.addEventListener('click', (event) => {
                if (event.target === shopModal) window.closeLobbyShop?.();
            });
            shopModal.querySelector('.lobby-shop-close')?.addEventListener('click', () => window.closeLobbyShop?.());
            shopModal.querySelectorAll('.lobby-shop-category').forEach((button) => {
                button.addEventListener('click', () => {
                    shopModal.querySelectorAll('.lobby-shop-category').forEach((category) => category.classList.remove('active'));
                    button.classList.add('active');
                    window.currentShopCategory = button.dataset.shopCategory || 'borders';
                    window.renderLobbyShopItems?.();
                });
            });
        }

        window.renderLobbyShopItems = () => {
            const grid = document.querySelector('#lobby-shop-modal .lobby-shop-grid');
            if (!grid) return;
            document.getElementById('shop-info-tooltip')?.classList.remove('visible');
            grid.innerHTML = renderShopProducts(window.currentShopCategory || 'borders');
            if (['decks', 'borders', 'clusters'].includes(window.currentShopCategory || 'borders')) {
                bindBorderInfoTooltips(grid, '[data-shop-item]', (product) => product.dataset.shopItem);
            }
            grid.querySelectorAll('[data-shop-item]').forEach((product) => {
                product.addEventListener('click', () => {
                    const state = window.getShopItemState?.(product.dataset.shopItem) || { owned: false };
                    if (!state.owned) window.confirmShopPurchase?.(product.dataset.shopItem);
                });
                product.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    const state = window.getShopItemState?.(product.dataset.shopItem) || { owned: false };
                    if (!state.owned) window.confirmShopPurchase?.(product.dataset.shopItem);
                });
            });
            window.refreshShopInventoryState?.();
        };

        window.syncLobbyShopGold = () => {
            const count = document.getElementById('lobby-shop-gold-count');
            if (count) count.textContent = window.currentGoldCoins || 0;
        };

        window.refreshShopInventoryState = () => {
            document.querySelectorAll('[data-buy-item]').forEach((button) => {
                const state = window.getShopItemState?.(button.dataset.buyItem) || { owned: false, equipped: false };
                button.textContent = 'COMPRAR';
                button.hidden = state.owned;
                button.disabled = state.owned;
                const product = button.closest('[data-shop-item]');
                const ribbon = product?.querySelector(`[data-owned-ribbon="${button.dataset.buyItem}"]`);
                if (ribbon) ribbon.hidden = !state.owned;
            });
        };

        window.openLobbyShop = () => {
            window.playNavSound?.();
            window.currentShopCategory = 'decks';
            shopModal.querySelectorAll('[data-shop-category]').forEach((category) => {
                category.classList.toggle('active', category.dataset.shopCategory === 'decks');
            });
            window.renderLobbyShopItems?.();
            window.syncLobbyShopGold?.();
            window.refreshShopInventoryState?.();
            shopModal.classList.add('visible');
        };

        window.closeLobbyShop = () => {
            window.playNavSound?.();
            document.getElementById('shop-info-tooltip')?.classList.remove('visible');
            shopModal.classList.remove('visible');
        };

        let inventoryModal = document.getElementById('lobby-inventory-modal');
        if (!inventoryModal) {
            inventoryModal = document.createElement('div');
            inventoryModal.id = 'lobby-inventory-modal';
            inventoryModal.className = 'lobby-inventory-modal';
            inventoryModal.innerHTML = `
                <div class="lobby-inventory-title" role="img" aria-label="MOCHILA">MOCHILA</div>
                <div class="lobby-inventory-panel" role="dialog" aria-modal="true" aria-label="Mochila">
                    <div class="lobby-inventory-categories" aria-label="Categorias da mochila">
                        <button class="lobby-shop-category" type="button" data-inventory-category="decks">DECKS</button>
                        <button class="lobby-shop-category active" type="button" data-inventory-category="borders">BORDAS</button>
                        <button class="lobby-shop-category" type="button" data-inventory-category="clusters">CLUSTERS</button>
                        <button class="lobby-shop-category" type="button" data-inventory-category="pets">MASCOTES</button>
                    </div>
                    <div class="lobby-inventory-grid" id="lobby-inventory-grid"></div>
                </div>
                <button class="mini-btn lobby-inventory-close" type="button" aria-label="Sair da mochila">SAIR</button>
            `;
            document.body.appendChild(inventoryModal);
            inventoryModal.addEventListener('click', (event) => {
                if (event.target === inventoryModal) {
                    window.closeInventory?.();
                    return;
                }
                if (!event.target.closest?.('[data-inventory-item], .inventory-action-menu')) {
                    window.selectedInventoryItem = null;
                    window.renderInventoryItems?.();
                }
            });
            inventoryModal.querySelector('.lobby-inventory-close')?.addEventListener('click', () => window.closeInventory?.());
            inventoryModal.querySelectorAll('[data-inventory-category]').forEach((button) => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    inventoryModal.querySelectorAll('[data-inventory-category]').forEach((category) => category.classList.remove('active'));
                    button.classList.add('active');
                    window.currentInventoryCategory = button.dataset.inventoryCategory || 'borders';
                    window.selectedInventoryItem = null;
                    window.renderInventoryItems?.();
                });
            });
        }

        window.renderInventoryItems = () => {
            const grid = document.getElementById('lobby-inventory-grid');
            if (!grid) return;
            document.getElementById('shop-info-tooltip')?.classList.remove('visible');
            const owned = window.playerInventory || [];
            const categoryItems = lobbyShopItemsByCategory[window.currentInventoryCategory || 'borders'] || [];
            const ownedItems = categoryItems.filter(item => owned.includes(item.id));
            if (ownedItems.length === 0) {
                grid.innerHTML = '<div class="inventory-empty">Sua mochila est\u00e1 vazia.</div>';
                return;
            }
            grid.innerHTML = ownedItems.map(item => {
                const equipped = window.getShopItemState?.(item.id)?.equipped === true;
                return `
                <div class="inventory-item" role="button" tabindex="0" data-inventory-item="${item.id}">
                    <div class="inventory-item-name">${getItemDisplayName(item)}</div>
                    ${renderBorderPreview(item, 'shop')}
                    ${equipped ? '<span class="inventory-equipped-ribbon">EQUIPADO</span>' : ''}
                </div>`;
            }).join('');
            grid.querySelectorAll('[data-inventory-item]').forEach((button) => {
                button.addEventListener('click', () => {
                    window.selectedInventoryItem = null;
                    window.toggleInventoryEquip?.(button.dataset.inventoryItem);
                });
                button.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    window.selectedInventoryItem = null;
                    window.toggleInventoryEquip?.(button.dataset.inventoryItem);
                });
            });
            if (['decks', 'borders', 'clusters'].includes(window.currentInventoryCategory || 'borders')) {
                bindBorderInfoTooltips(grid, '[data-inventory-item]', (button) => button.dataset.inventoryItem);
            }
        };

        window.openInventory = () => {
            window.currentInventoryCategory = 'decks';
            inventoryModal.querySelectorAll('[data-inventory-category]').forEach((category) => {
                category.classList.toggle('active', category.dataset.inventoryCategory === 'decks');
            });
            window.selectedInventoryItem = null;
            window.renderInventoryItems?.();
            inventoryModal.classList.add('visible');
        };

        window.closeInventory = () => {
            window.playNavSound?.();
            window.selectedInventoryItem = null;
            document.getElementById('shop-info-tooltip')?.classList.remove('visible');
            inventoryModal.classList.remove('visible');
        };

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
                <div class="lobby-mode-flares" aria-hidden="true"></div>
                <div class="lobby-mode-title">SELECIONE SUA PARTIDA</div>
                <div class="lobby-mode-choices">
                    <button id="btn-mode-pve" class="lobby-mode-btn lobby-mode-pve" type="button" data-points="(+1 ponto)" aria-label="Partida PVE"></button>
                    <button id="btn-mode-pvp" class="lobby-mode-btn lobby-mode-pvp" type="button" data-points="(+3 pontos)" aria-label="Partida PVP"></button>
                </div>
                <div class="lobby-mode-deck-title">SELECIONE SEU DECK</div>
                <div class="lobby-mode-decks" aria-label="Escolha seu deck">
                    <button class="lobby-mode-deck" type="button" data-deck="knight" data-name="Forjado pela honra, guiado pela espada" aria-label="Deck Cavaleiro">
                        <img src="assets/img/card_selecao_cavaleiro.webp" alt="Deck Cavaleiro">
                    </button>
                    <button class="lobby-mode-deck" type="button" data-deck="mage" data-name="Magia em estado puro" aria-label="Deck Mago">
                        <img src="assets/img/card_selecao_mago.webp" alt="Deck Mago">
                    </button>
                    <button class="lobby-mode-deck" type="button" data-deck="archer" data-name="Precis\u00e3o natural, ritmo de ca\u00e7a" aria-label="Deck Arqueiro">
                        <img src="assets/img/card_selecao_arqueiro.webp" alt="Deck Arqueiro">
                    </button>
                    <button class="lobby-mode-deck" type="button" data-deck="rogue" data-name="Astúcia afiada, saque preciso" aria-label="Deck Ladino">
                        <img src="assets/img/card_selecao_ladino.webp" alt="Deck Ladino">
                    </button>
                    <button class="lobby-mode-deck" type="button" data-deck="oracle" data-name="Visões antigas, preparo perfeito" aria-label="Deck Oráculo">
                        <img src="assets/img/card_selecao_oraculo.webp" alt="Deck Oráculo">
                    </button>
                </div>
            </div>
        `;

        const closeModeChooser = () => {
            modeOverlay.classList.remove('visible');
            modeOverlay.classList.remove('mode-selected', 'selected-pve', 'selected-pvp', 'cinematic-focus', 'cinematic-pve', 'cinematic-pvp');
            modeOverlay.querySelectorAll('.lobby-mode-btn').forEach(button => button.classList.remove('selected'));
            modeOverlay.querySelectorAll('.lobby-mode-deck').forEach(deck => {
                deck.classList.remove('deck-selecting', 'deck-dimmed');
                deck.hidden = false;
                deck.disabled = false;
            });
            const flareLayer = modeOverlay.querySelector('.lobby-mode-flares');
            if(flareLayer) flareLayer.innerHTML = '';
            document.body.classList.remove('lobby-mode-choice-open');
            modeOverlay.dataset.selectedMode = '';
        };
        window.closeLobbyModeChooser = closeModeChooser;
        window.openLobbyModeChooser = () => {
            modeOverlay.classList.add('visible');
            document.body.classList.add('lobby-mode-choice-open');
        };

        modeOverlay.onclick = (event) => {
            if (!event.target.closest('.lobby-mode-btn, .lobby-mode-deck')) closeModeChooser();
        };

        const selectMode = (mode) => {
            modeOverlay.dataset.selectedMode = mode;
            modeOverlay.classList.add('mode-selected');
            modeOverlay.classList.toggle('selected-pve', mode === 'pve');
            modeOverlay.classList.toggle('selected-pvp', mode === 'pvp');
            modeOverlay.querySelectorAll('.lobby-mode-btn').forEach(button => {
                button.classList.toggle('selected', button.id === `btn-mode-${mode}`);
            });
            modeOverlay.querySelectorAll('.lobby-mode-deck').forEach(deckButton => {
                const item = Object.values(window.SHOP_ITEMS || {}).find(shopItem => shopItem.slot === 'deck' && shopItem.deckType === deckButton.dataset.deck);
                const owned = !item || window.playerInventory?.includes(item.id);
                deckButton.hidden = !owned;
                deckButton.disabled = !owned;
                deckButton.classList.remove('deck-locked');
            });
            const flareLayer = modeOverlay.querySelector('.lobby-mode-flares');
            if(flareLayer) {
                flareLayer.innerHTML = '';
                const flareClass = mode === 'pvp' ? 'pvp' : 'pve';
                for(let i = 0; i < 84; i++) {
                    const flare = document.createElement('span');
                    flare.className = `lobby-mode-flare ${flareClass}`;
                    flare.style.setProperty('--flare-left', `${Math.random() * 100}%`);
                    const flareSize = Math.random() * 16 + 8;
                    const flareDuration = Math.random() * 1.25 + 2.15;
                    flare.style.setProperty('--flare-size', `${flareSize}px`);
                    flare.style.setProperty('--flare-height', `${flareSize * (Math.random() * 3.6 + 6.4)}px`);
                    flare.style.setProperty('--flare-duration', `${flareDuration}s`);
                    flare.style.setProperty('--flare-delay', `${Math.random() < 0.72 ? -Math.random() * flareDuration : Math.random() * 0.45}s`);
                    flareLayer.appendChild(flare);
                }
            }
        };

        modeOverlay.querySelector('#btn-mode-pvp').onclick = (event) => {
            event.stopPropagation();
            window.playLobbyButtonSelectSound?.();
            selectMode('pvp');
        };
        modeOverlay.querySelector('#btn-mode-pve').onclick = (event) => {
            event.stopPropagation();
            window.playLobbyButtonSelectSound?.();
            selectMode('pve');
        };
        modeOverlay.querySelectorAll('.lobby-mode-deck').forEach((button) => {
            button.onclick = (event) => {
                event.stopPropagation();
                const mode = modeOverlay.dataset.selectedMode;
                const deckType = button.dataset.deck || 'knight';
                if(button.hidden || button.disabled) return;
                if(!mode) return;
                window.playBuppoSfx?.('sfx-deck-select');
                modeOverlay.querySelectorAll('.lobby-mode-deck').forEach(deck => {
                    deck.classList.toggle('deck-selecting', deck === button);
                    deck.classList.toggle('deck-dimmed', deck !== button);
                });
                setTimeout(() => window.startLobbyModeWithDeck?.(mode, deckType), 320);
            };
        });
        modeOverlay.querySelectorAll('.lobby-mode-btn').forEach((button) => {
            const modeClass = button.classList.contains('lobby-mode-pvp') ? 'cinematic-pvp' : 'cinematic-pve';
            const enableFocus = () => {
                modeOverlay.classList.remove('cinematic-pve', 'cinematic-pvp');
                modeOverlay.classList.add('cinematic-focus', modeClass);
            };
            const disableFocus = () => {
                modeOverlay.classList.remove('cinematic-focus', 'cinematic-pve', 'cinematic-pvp');
            };
            button.onmouseenter = enableFocus;
            button.onfocus = enableFocus;
            button.onmouseleave = disableFocus;
            button.onblur = disableFocus;
        });
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
