// ARQUIVO: js/effects.js

(function normalizeLobbyText() {
    const fixTextNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes('SAGUAO')) {
            node.nodeValue = node.nodeValue.replace(/SAGUAO/g, 'SAGUÃO');
        }
    };
    const scan = (root) => {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) {
            fixTextNode(root);
            return;
        }
        root.childNodes.forEach(scan);
    };
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach(scan);
            if (mutation.type === 'characterData') fixTextNode(mutation.target);
        });
    });
    const start = () => {
        scan(document.body);
        observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
})();

(function enhanceLobbyIdentity() {
    const ensureJuiceStyle = () => {
        if (document.getElementById('lobby-juice-style')) return;
        const style = document.createElement('style');
        style.id = 'lobby-juice-style';
        style.textContent = `
#lobby-screen { overflow: hidden; }
.lobby-logo-right { animation: lobbyLogoBreathe 4.2s ease-in-out infinite, lobbyLogoPop 0.72s cubic-bezier(0.2, 1.25, 0.28, 1) both; }
.lobby-logo-right::after { content: ""; position: absolute; inset: 8% -8%; background: linear-gradient(105deg, transparent 28%, rgba(255,255,255,0.78) 45%, rgba(255,215,0,0.45) 50%, transparent 66%); transform: translateX(-130%) skewX(-12deg); opacity: 0; mix-blend-mode: screen; animation: logoShine 4.8s ease-in-out infinite; }
@keyframes lobbyLogoBreathe { 0%, 100% { transform: translateX(-50%) translateY(0) scale(1); filter: drop-shadow(0 10px 30px rgba(0,0,0,0.9)); } 50% { transform: translateX(-50%) translateY(-8px) scale(1.018); filter: drop-shadow(0 16px 34px rgba(0,0,0,0.95)) drop-shadow(0 0 18px rgba(255,215,0,0.22)); } }
@keyframes lobbyLogoPop { 0% { transform: translateX(-50%) scale(0.86, 1.12); opacity: 0; } 62% { transform: translateX(-50%) scale(1.045, 0.96); opacity: 1; } 100% { transform: translateX(-50%) scale(1); opacity: 1; } }
@keyframes logoShine { 0%, 52% { opacity: 0; transform: translateX(-130%) skewX(-12deg); } 62% { opacity: 0.85; } 78%, 100% { opacity: 0; transform: translateX(130%) skewX(-12deg); } }
.lobby-ui-overlay { padding-top: 18% !important; }
.lobby-player-card { width: 92%; min-height: 54px; display: flex; align-items: center; gap: 10px; padding: 7px 10px; margin-bottom: 6px; box-sizing: border-box; border-radius: 10px; border: 1px solid rgba(255,215,0,0.48); background: linear-gradient(90deg, rgba(0,0,0,0.38), rgba(255,215,0,0.13), rgba(0,0,0,0.28)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 7px 16px rgba(0,0,0,0.32); animation: identitySlideIn 0.55s cubic-bezier(0.2, 1.1, 0.3, 1) both; }
.lobby-avatar { width: 39px; height: 39px; flex: 0 0 39px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: radial-gradient(circle at 35% 25%, #fff7ba 0 12%, #f1c40f 35%, #9b4b10 100%); border: 2px solid #fff; color: #3e2723; font-family: 'Russo One', sans-serif; font-size: 18px; box-shadow: 0 0 0 2px rgba(0,0,0,0.45), 0 0 18px rgba(255,215,0,0.42); text-shadow: 1px 1px 0 rgba(255,255,255,0.45); }
.lobby-identity-main { flex: 1; min-width: 0; text-align: left; }
.lobby-rank-title { font-family: 'Russo One', sans-serif; font-size: 10px; color: #ffd700; letter-spacing: 0.7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lobby-xp-track { position: relative; height: 8px; margin-top: 6px; border-radius: 999px; overflow: hidden; background: rgba(0,0,0,0.48); box-shadow: inset 0 1px 4px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.14); }
.lobby-xp-track span { position: absolute; inset: 0 auto 0 0; width: 0%; border-radius: inherit; background: linear-gradient(90deg, #2ecc71, #f1c40f, #fff2a6); box-shadow: 0 0 12px rgba(255,215,0,0.55); transition: width 0.85s cubic-bezier(0.18, 0.88, 0.32, 1.18); }
.user-stats { transition: transform 0.25s ease, text-shadow 0.25s ease; }
.user-stats.stats-pulse { transform: scale(1.045); text-shadow: 0 0 12px rgba(255,215,0,0.85), 2px 2px 0 #000; }
.ranking-scroll { position: relative; }
#ranking-table tbody tr { opacity: 0; transform: translateX(-18px) scale(0.98); animation: rankRowIn 0.42s cubic-bezier(0.2, 0.9, 0.28, 1.1) forwards; animation-delay: calc(var(--rank-order, 0) * 55ms); }
#ranking-table tbody tr:nth-child(1) { --rank-order: 1; }
#ranking-table tbody tr:nth-child(2) { --rank-order: 2; }
#ranking-table tbody tr:nth-child(3) { --rank-order: 3; }
#ranking-table tbody tr:nth-child(4) { --rank-order: 4; }
#ranking-table tbody tr:nth-child(5) { --rank-order: 5; }
#ranking-table tbody tr:nth-child(6) { --rank-order: 6; }
#ranking-table tbody tr:nth-child(7) { --rank-order: 7; }
#ranking-table tbody tr:nth-child(8) { --rank-order: 8; }
#ranking-table tbody tr:nth-child(9) { --rank-order: 9; }
#ranking-table tbody tr:nth-child(10) { --rank-order: 10; }
#ranking-table tbody tr:hover { background: rgba(255,255,255,0.08); }
#ranking-table .rank-1 { animation-name: rankRowIn, topRankGlow !important; animation-duration: 0.42s, 2.2s !important; animation-timing-function: cubic-bezier(0.2, 0.9, 0.28, 1.1), ease-in-out !important; animation-delay: calc(var(--rank-order, 0) * 55ms), 0.55s !important; animation-fill-mode: forwards, none !important; animation-iteration-count: 1, infinite !important; }
#ranking-table .rank-1 td { border-bottom-color: rgba(255,215,0,0.58) !important; }
#btn-play-pvp, #btn-play-pve, #btn-history, #btn-logout, .friends-add-icon { position: relative; overflow: hidden; transition: transform 0.16s cubic-bezier(0.2, 1, 0.3, 1), filter 0.16s, box-shadow 0.16s, background 0.16s; }
#btn-play-pvp { box-shadow: 0 7px 0 #9c5a08, 0 12px 18px rgba(0,0,0,0.35), 0 0 0 rgba(243,156,18,0) !important; }
#btn-play-pvp:hover { transform: translateY(-3px) scale(1.035) !important; box-shadow: 0 10px 0 #9c5a08, 0 18px 22px rgba(0,0,0,0.38), 0 0 22px rgba(255,215,0,0.24) !important; }
#btn-play-pvp:active { transform: translateY(5px) scale(0.985) !important; box-shadow: 0 2px 0 #9c5a08, 0 6px 10px rgba(0,0,0,0.38) !important; }
#btn-play-pve { box-shadow: 0 5px 0 #4d1f5e, 0 9px 14px rgba(0,0,0,0.34) !important; }
#btn-play-pve:hover { transform: translateY(-2px) scale(1.025) !important; box-shadow: 0 8px 0 #4d1f5e, 0 14px 18px rgba(0,0,0,0.36), 0 0 18px rgba(168,88,197,0.35) !important; }
#btn-play-pve:active { transform: translateY(4px) scale(0.985) !important; box-shadow: 0 2px 0 #4d1f5e, 0 5px 9px rgba(0,0,0,0.36) !important; }
#btn-history:hover { transform: translateY(-2px) scale(1.02); }
#btn-history:active, #btn-logout:active { transform: translateY(2px) scale(0.97) !important; }
#btn-play-pvp::after, #btn-play-pve::after, #btn-history::after, #btn-logout::after, .friends-add-icon::after { content: ""; position: absolute; inset: 50%; width: 10px; height: 10px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.75), transparent 70%); opacity: 0; transform: translate(-50%, -50%) scale(0); pointer-events: none; }
#btn-play-pvp:active::after, #btn-play-pve:active::after, #btn-history:active::after, #btn-logout:active::after, .friends-add-icon:active::after { animation: buttonRipple 0.45s ease-out; }
.friends-add-icon { animation: addFriendGlow 2.8s ease-in-out infinite; }
.friends-add-icon:hover { transform: scale(1.08) rotate(8deg) !important; }
.friend-status-dot.online { animation: onlinePulse 1.45s ease-out infinite; }
.friend-row:hover { transform: translateX(-2px) scale(1.015) !important; }
#lobby-particles, .lobby-ambient-layer { position: absolute; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
.lobby-ambient-layer { position: fixed; z-index: 2; }
.lobby-flare { position: absolute; background: radial-gradient(circle, #fff 10%, var(--gold) 60%, transparent 100%); border-radius: 50%; opacity: 0; box-shadow: 0 0 15px var(--gold); filter: blur(2px); animation: flareFloat linear infinite both; }
.lobby-candle-spark { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: radial-gradient(circle, #fff8b8 0 10%, #ffd700 42%, transparent 72%); left: 71%; top: 12%; filter: blur(0.2px); box-shadow: 0 0 12px rgba(255,215,0,0.85); animation: candleSpark 2.5s ease-in-out infinite; }
.lobby-candle-spark.s2 { left: 73%; top: 16%; width: 4px; height: 4px; animation-delay: 0.8s; animation-duration: 2.1s; }
.lobby-candle-spark.s3 { left: 69%; top: 18%; width: 5px; height: 5px; animation-delay: 1.4s; animation-duration: 2.9s; }
.lobby-book-glow { position: absolute; left: 36%; top: 32%; width: 27vw; height: 23vh; max-width: 520px; max-height: 260px; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(79,224,255,0.24), rgba(79,224,255,0.09) 42%, transparent 72%); filter: blur(8px); mix-blend-mode: screen; opacity: 0.7; animation: bookGlowPulse 3.6s ease-in-out infinite; }
[data-tip] { position: relative; }
[data-tip]::before { content: attr(data-tip); position: absolute; left: 50%; bottom: calc(100% + 10px); transform: translate(-50%, 8px) scale(0.96); min-width: max-content; max-width: 220px; padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.62); background: linear-gradient(180deg, rgba(38,24,20,0.98), rgba(10,8,8,0.98)); color: #fff; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 800; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.4px; text-shadow: 1px 1px 0 #000; box-shadow: 0 10px 20px rgba(0,0,0,0.5), 0 0 14px rgba(255,215,0,0.18); opacity: 0; pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease; z-index: 40000; }
[data-tip]::after { content: ""; position: absolute; left: 50%; bottom: calc(100% + 4px); width: 9px; height: 9px; background: rgba(38,24,20,0.98); border-right: 1px solid rgba(255,215,0,0.62); border-bottom: 1px solid rgba(255,215,0,0.62); transform: translate(-50%, 8px) rotate(45deg); opacity: 0; pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease; z-index: 40000; }
[data-tip]:hover::before, [data-tip]:hover::after { opacity: 1; transform: translate(-50%, 0) scale(1); }
#transition-overlay { background: radial-gradient(circle at 50% 42%, rgba(93,64,55,0.95), #050505 62%) !important; overflow: hidden; transform: scale(1.04); transition: opacity 0.42s ease-in-out, transform 0.42s cubic-bezier(0.2, 0.9, 0.25, 1) !important; }
#transition-overlay.active { transform: scale(1); }
#transition-overlay::before { content: ""; position: absolute; inset: -20%; background: conic-gradient(from 0deg, transparent, rgba(255,215,0,0.16), transparent 22%, rgba(0,206,201,0.12), transparent 45%); opacity: 0; transform: rotate(0deg) scale(0.88); filter: blur(1px); }
#transition-overlay::after { content: ""; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 0 36%, rgba(255,255,255,0.18) 46%, transparent 58%); transform: translateX(-120%); }
#transition-overlay.active::before { opacity: 1; animation: transitionRuneSpin 1.7s linear infinite; }
#transition-overlay.active::after { animation: transitionWipe 0.78s ease-out both; }
#transition-overlay .trans-logo, #transition-overlay .trans-text { position: relative; z-index: 1; }
@keyframes identitySlideIn { from { opacity: 0; transform: translateY(-8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes rankRowIn { to { opacity: 1; transform: translateX(0) scale(1); } }
@keyframes topRankGlow { 0%, 100% { text-shadow: 1px 1px 0 #000, 0 0 8px rgba(255,215,0,0.35); } 50% { text-shadow: 1px 1px 0 #000, 0 0 17px rgba(255,215,0,0.9); } }
@keyframes buttonRipple { 0% { opacity: 0.9; transform: translate(-50%, -50%) scale(0); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(18); } }
@keyframes addFriendGlow { 0%, 100% { box-shadow: 0 4px 10px rgba(0,0,0,0.45), 0 0 0 rgba(255,215,0,0); } 50% { box-shadow: 0 4px 10px rgba(0,0,0,0.45), 0 0 18px rgba(255,215,0,0.5); } }
@keyframes onlinePulse { 0% { box-shadow: 0 0 0 2px rgba(0,0,0,0.45), 0 0 0 0 rgba(46,204,113,0.72); } 70% { box-shadow: 0 0 0 2px rgba(0,0,0,0.45), 0 0 0 9px rgba(46,204,113,0); } 100% { box-shadow: 0 0 0 2px rgba(0,0,0,0.45), 0 0 0 0 rgba(46,204,113,0); } }
@keyframes flareFloat { 0% { opacity: 0; transform: translateY(0) scale(0.5) rotate(0deg); } 10% { opacity: 0.8; } 80% { opacity: 0.6; } 100% { opacity: 0; transform: translateY(-150px) scale(0) rotate(45deg); } }
@keyframes candleSpark { 0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.5); } 18% { opacity: 1; } 100% { opacity: 0; transform: translateY(-90px) translateX(28px) scale(0.1); } }
@keyframes bookGlowPulse { 0%, 100% { opacity: 0.45; transform: scale(0.96); } 50% { opacity: 0.82; transform: scale(1.04); } }
@keyframes transitionRuneSpin { to { transform: rotate(360deg) scale(0.88); } }
@keyframes transitionWipe { to { transform: translateX(120%); } }
@media (max-width: 980px) and (orientation: landscape), (max-height: 820px) { .lobby-player-card { display: none; } .lobby-ui-overlay { padding-top: 22% !important; } }
        `;
        document.head.appendChild(style);
    };

    const ensureLobbyElements = () => {
        const lobby = document.getElementById('lobby-screen');
        const overlay = document.querySelector('.lobby-ui-overlay');
        if (!lobby || !overlay) return;

        if (!document.getElementById('lobby-particles')) {
            const particles = document.createElement('div');
            particles.id = 'lobby-particles';
            lobby.prepend(particles);
        }

        if (!lobby.querySelector('.lobby-ambient-layer')) {
            const ambient = document.createElement('div');
            ambient.className = 'lobby-ambient-layer';
            ambient.setAttribute('aria-hidden', 'true');
            ambient.innerHTML = '<span class="lobby-candle-spark s1"></span><span class="lobby-candle-spark s2"></span><span class="lobby-candle-spark s3"></span><span class="lobby-book-glow"></span>';
            lobby.prepend(ambient);
        }

        if (!document.getElementById('lobby-avatar')) {
            const card = document.createElement('div');
            card.className = 'lobby-player-card';
            card.dataset.tip = 'Sua identidade no BUPPO';
            card.innerHTML = '<div class="lobby-avatar" id="lobby-avatar">B</div><div class="lobby-identity-main"><div class="lobby-rank-title" id="lobby-rank-title">APRENDIZ DE RUNAS</div><div class="lobby-xp-track"><span id="lobby-xp-fill"></span></div></div>';
            overlay.insertBefore(card, overlay.firstChild);
        }

        const tips = [
            ['#ranking-content', 'Ranking dos melhores jogadores'],
            ['#btn-play-pvp', 'Entrar em uma partida ranqueada'],
            ['#btn-play-pve', 'Treinar contra o jogo'],
            ['#btn-history', 'Ver partidas recentes'],
            ['#btn-logout', 'Sair desta conta'],
            ['.friends-add-icon', 'Adicionar companheiro']
        ];
        tips.forEach(([selector, text]) => {
            const element = document.querySelector(selector);
            if (element && !element.dataset.tip) element.dataset.tip = text;
        });
    };

    const createFlares = () => {
        const container = document.getElementById('lobby-particles');
        if (!container || container.childElementCount > 0) return;
        for (let i = 0; i < 70; i++) {
            const flare = document.createElement('div');
            const size = 4 + Math.random() * 18;
            flare.className = 'lobby-flare';
            flare.style.left = `${Math.random() * 100}%`;
            flare.style.top = `${Math.random() * 100}%`;
            flare.style.width = `${size}px`;
            flare.style.height = `${size}px`;
            flare.style.animationDuration = `${3 + Math.random() * 5}s`;
            flare.style.animationDelay = `${Math.random() * 4}s`;
            container.appendChild(flare);
        }
    };

    const titles = [
        { min: 800, label: 'LENDA DO SAGUÃO' },
        { min: 400, label: 'MESTRE DE RUNAS' },
        { min: 180, label: 'CAMPEÃO DA TÁBUA' },
        { min: 60, label: 'DUELISTA ARCANO' },
        { min: 0, label: 'APRENDIZ DE RUNAS' }
    ];

    const getScore = (statsText) => {
        const match = String(statsText || '').match(/PONTOS:\s*(\d+)/i);
        return match ? Number(match[1]) : 0;
    };

    let lastSignature = '';
    const update = () => {
        const nameEl = document.getElementById('lobby-username');
        const statsEl = document.getElementById('lobby-stats');
        const avatar = document.getElementById('lobby-avatar');
        const title = document.getElementById('lobby-rank-title');
        const fill = document.getElementById('lobby-xp-fill');
        if (!nameEl || !statsEl || !avatar || !title || !fill) return;

        const cleanName = nameEl.textContent.replace(/^OL\S*,\s*/i, '').replace(/#.*$/, '').trim();
        avatar.textContent = (cleanName[0] || 'B').toUpperCase();

        const score = getScore(statsEl.textContent);
        const signature = `${cleanName}|${score}`;
        if (signature === lastSignature) return;
        lastSignature = signature;

        const rank = titles.find((item) => score >= item.min) || titles[titles.length - 1];
        title.textContent = rank.label;
        fill.style.width = `${Math.max(8, Math.min(100, score % 100))}%`;

        statsEl.classList.remove('stats-pulse');
        void statsEl.offsetWidth;
        statsEl.classList.add('stats-pulse');
    };

    const start = () => {
        ensureJuiceStyle();
        ensureLobbyElements();
        createFlares();
        update();
        const target = document.getElementById('lobby-screen');
        if (!target) return;
        new MutationObserver(() => {
            ensureLobbyElements();
            createFlares();
            update();
        }).observe(target, { childList: true, characterData: true, subtree: true });
    };

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
})();

// 1. EFEITO DE CURA
window.triggerHealEffect = function() {
    const body = document.body;
    const overlay = document.getElementById('heal-overlay');
    const light = document.getElementById('holy-light');
    const particlesContainer = document.getElementById('particles-container');

    // Som (Se existir no main.js, isso toca lá, mas podemos garantir aqui se quiser)
    // Por enquanto, só visual:

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

    // 3. Partículas
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
                // Partícula branca/verde
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
    // const cutLine = document.getElementById('cut-line'); // Removido referência ao corte

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
    blockText.style.transform = 'translate(-50%, -50%) scale(0.5)'; // Começa pequeno
    blockText.style.fontFamily = "'Bangers', cursive";
    blockText.style.fontSize = '5rem'; // Tamanho médio
    blockText.style.color = '#3498db'; // Azul do bloqueio
    blockText.style.webkitTextStroke = '2px black'; // Outline preto
    blockText.style.textShadow = '0 0 10px rgba(52, 152, 219, 0.8)';
    blockText.style.zIndex = '9005'; // Acima de tudo
    blockText.style.pointerEvents = 'none';
    blockText.style.opacity = '0';
    blockText.style.transition = 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    document.body.appendChild(blockText);

    // Animação de Entrada (Pop)
    requestAnimationFrame(() => {
        blockText.style.opacity = '1';
        blockText.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Limpeza Geral
    setTimeout(() => {
        // Saída do texto
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
