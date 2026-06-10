// ARQUIVO: js/effects.js

function safeLobbyEnhancement(name, callback) {
    try {
        callback();
    } catch (error) {
        console.warn(`[BUPPO] ${name} desativado para manter o jogo aberto.`, error);
    }
}

safeLobbyEnhancement('normalizador de texto', () => {
    const fixTextNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes('SAGUAO')) {
            node.nodeValue = node.nodeValue.replace(/SAGUAO/g, 'SAGU\u00c3O');
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
});

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

safeLobbyEnhancement('identidade do sagu\u00e3o', () => {
    const titles = [
        { min: 800, label: 'LENDA DO SAGU\u00c3O' },
        { min: 400, label: 'MESTRE DE RUNAS' },
        { min: 180, label: 'CAMPE\u00c3O DA T\u00c1BUA' },
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
        safeLobbyEnhancement('atualiza\u00e7\u00e3o da identidade', update);
        const target = document.getElementById('lobby-screen');
        if (!target) return;
        new MutationObserver(() => safeLobbyEnhancement('atualiza\u00e7\u00e3o da identidade', update)).observe(target, { childList: true, characterData: true, subtree: true });
    };

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
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
