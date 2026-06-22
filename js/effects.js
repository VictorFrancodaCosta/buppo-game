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

        #lobby-screen .lobby-menu-button.lobby-button-press-juice {
            animation: lobbyButtonPressJuice 0.26s cubic-bezier(0.16, 1.3, 0.32, 1) both !important;
        }

        body.lobby-play-hover-active #lobby-screen::before {
            content: "" !important;
            position: fixed !important;
            inset: 0 !important;
            z-index: 40 !important;
            pointer-events: none !important;
            background: rgba(0, 0, 0, 0.56) !important;
            backdrop-filter: saturate(0.82) brightness(0.78) !important;
            opacity: 1 !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play {
            width: 100% !important;
            aspect-ratio: 1392 / 637 !important;
            background-image: url('assets/img/botao_jogar.webp') !important;
            margin-bottom: clamp(3px, 0.6vh, 8px) !important;
            z-index: 43 !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play:hover,
        #lobby-screen #btn-play-pvp.lobby-main-play:focus-visible {
            transform: translateY(-5px) scale(1.085) !important;
            filter:
                drop-shadow(8px 12px 0 rgba(26, 11, 4, 0.82))
                drop-shadow(0 18px 22px rgba(0, 0, 0, 0.34))
                drop-shadow(0 0 18px rgba(255, 211, 38, 0.72))
                drop-shadow(0 0 34px rgba(255, 174, 0, 0.46)) !important;
            animation: lobbyMainPlayPulse 0.95s ease-in-out infinite !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play.lobby-button-press-juice {
            animation: lobbyButtonPressJuice 0.26s cubic-bezier(0.16, 1.3, 0.32, 1) both !important;
        }

        @keyframes lobbyButtonPressJuice {
            0% { transform: translateY(0) scale(1, 1); }
            32% { transform: translateY(7px) scale(1.12, 0.78); filter: brightness(1.22) drop-shadow(4px 5px 0 rgba(26, 11, 4, 0.86)); }
            68% { transform: translateY(-4px) scale(0.94, 1.13); }
            100% { transform: translateY(0) scale(1, 1); }
        }

        #lobby-screen #btn-play-pvp.lobby-main-play::before {
            content: "" !important;
            display: block !important;
            position: absolute !important;
            inset: -26% -24% !important;
            z-index: -1 !important;
            pointer-events: none !important;
            border-radius: 999px !important;
            opacity: 0 !important;
            background: radial-gradient(ellipse at center, rgba(255, 223, 74, 0.56), rgba(255, 130, 20, 0.2) 42%, transparent 70%) !important;
            filter: blur(7px) !important;
            transition: opacity 0.14s ease !important;
        }

        #lobby-screen #btn-play-pvp.lobby-main-play:hover::before,
        #lobby-screen #btn-play-pvp.lobby-main-play:focus-visible::before {
            opacity: 1 !important;
            animation: lobbyPlayAuraPulse 0.95s ease-in-out infinite !important;
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

        @keyframes lobbyMenuFloatGroup {
            0%, 100% { transform: translate(-50%, -50%) translateY(0); }
            50% { transform: translate(-50%, -50%) translateY(-5px); }
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
            width: min(23vw, 375px) !important;
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

        .lobby-mode-deck:hover,
        .lobby-mode-deck:focus-visible {
            transform: translateY(-14px) scale(1.08) !important;
        }

        .lobby-mode-deck:hover img,
        .lobby-mode-deck:focus-visible img {
            filter: grayscale(0%) brightness(1.12) drop-shadow(0 0 30px rgba(255, 215, 0, 0.54)) drop-shadow(0 18px 17px rgba(0, 0, 0, 0.48)) !important;
        }

        .lobby-mode-deck.deck-selecting {
            pointer-events: none !important;
            transform: translateY(-22px) scale(1.16) !important;
            z-index: 4 !important;
        }

        .lobby-mode-deck.deck-selecting img {
            filter: grayscale(0%) brightness(1.32) drop-shadow(0 0 34px rgba(255, 215, 0, 0.82)) drop-shadow(0 18px 17px rgba(0, 0, 0, 0.52)) !important;
        }

        .lobby-mode-deck.deck-dimmed {
            opacity: 0.34 !important;
            transform: scale(0.88) translateY(8px) !important;
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
                width: min(40vw, 230px) !important;
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
            setTimeout(() => button.classList.remove('lobby-button-press-juice'), 300);
        };

        const runLobbyButtonAction = (button, action) => {
            if(!button || button.dataset.lobbyActionBusy === '1') return;
            button.dataset.lobbyActionBusy = '1';
            window.playLobbyButtonSelectSound?.();
            playLobbyPressJuice(button);
            window.suppressNavSoundFor?.(520);
            setTimeout(() => {
                try {
                    document.body.classList.remove('lobby-play-hover-active');
                    window.suppressNavSoundFor?.(180);
                    action?.();
                } finally {
                    setTimeout(() => { button.dataset.lobbyActionBusy = '0'; }, 140);
                }
            }, 240);
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
        playButton.onmouseenter = () => {
            document.body.classList.add('lobby-play-hover-active');
        };
        playButton.onfocus = () => document.body.classList.add('lobby-play-hover-active');
        playButton.onmouseleave = () => document.body.classList.remove('lobby-play-hover-active');
        playButton.onblur = () => document.body.classList.remove('lobby-play-hover-active');
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
        ensureLobbyMenuButton('btn-lobby-main-shop', 'lobby-main-shop', 'Loja', () => {});
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
                </div>
            </div>
        `;

        const closeModeChooser = () => {
            modeOverlay.classList.remove('visible');
            modeOverlay.classList.remove('mode-selected', 'selected-pve', 'selected-pvp', 'cinematic-focus', 'cinematic-pve', 'cinematic-pvp');
            modeOverlay.querySelectorAll('.lobby-mode-btn').forEach(button => button.classList.remove('selected'));
            modeOverlay.querySelectorAll('.lobby-mode-deck').forEach(deck => deck.classList.remove('deck-selecting', 'deck-dimmed'));
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
                if(!mode) return;
                if(window.audios?.['sfx-deck-select'] && window.sfxEnabled) {
                    try {
                        window.audios['sfx-deck-select'].currentTime = 0;
                        window.audios['sfx-deck-select'].play().catch(() => {});
                    } catch(e) {}
                }
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
