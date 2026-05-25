// ARQUIVO: js/ui_controller.js
import { CARDS_DB } from './data.js';
import { playSound } from './audio_controller.js';

export const MAGE_ASSETS = {
    'ATAQUE': 'assets/img/carta_ataque_mago.webp',
    'BLOQUEIO': 'assets/img/carta_bloqueio_mago.webp',
    'DESCANSAR': 'assets/img/carta_descansar_mago.webp',
    'DESARMAR': 'assets/img/carta_desarmar_mago.webp',
    'TREINAR': 'assets/img/carta_treinar_mago.webp',
    'DECK_IMG': 'assets/img/deck_verso_mago.webp',
    'DECK_SELECT': 'assets/img/card_selecao_mago.webp'
};

export function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) return MAGE_ASSETS[cardKey];
    return CARDS_DB[cardKey].img;
}

window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    const configBtn = document.getElementById('btn-config-toggle');
    const surrenderBtn = document.getElementById('btn-surrender');
    if(screenId === 'game-screen') {
        if(surrenderBtn) surrenderBtn.style.display = 'block';
        if(configBtn) configBtn.style.display = 'flex';
    } else {
        if(surrenderBtn) surrenderBtn.style.display = 'none';
        if(configBtn) configBtn.style.display = 'none';
        const panel = document.getElementById('config-overlay');
        if(panel) { panel.style.display = 'none'; }
    }
}

window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) {
        ds.style.display = 'flex'; ds.style.opacity = '1'; ds.style.pointerEvents = 'auto';
        document.querySelectorAll('.deck-option').forEach(opt => {
            opt.style = ""; const img = opt.querySelector('img'); if(img) img.style = "";
        });
    }
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (e) { console.log(e); }
    window.showScreen('deck-selection-screen');
};

(function createRotateOverlay() {
    if (!document.getElementById('rotate-overlay')) {
        const div = document.createElement('div'); div.id = 'rotate-overlay';
        div.innerHTML = `<div style="font-size: 50px; margin-bottom: 20px;">↻</div><div>GIRE O CELULAR<br>PARA JOGAR</div>`;
        document.body.appendChild(div);
    }
})();

window.toggleFullScreen = function() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => console.log(e)); } else { if (document.exitFullscreen) document.exitFullscreen(); }
}

window.toggleConfig = function() {
    window.playNavSound();
    const overlay = document.getElementById('config-overlay');
    const box = overlay.querySelector('.config-box');
    const abandonArea = document.getElementById('abandon-area');

    if (overlay.style.display === 'flex') {
        box.classList.remove('config-pop-in');
        box.classList.add('config-pop-out');
        setTimeout(() => { overlay.style.display = 'none'; box.classList.remove('config-pop-out'); }, 200);
    } else {
        const isGameActive = document.getElementById('game-screen').classList.contains('active');
        if(abandonArea) abandonArea.style.display = isGameActive ? 'block' : 'none';
        overlay.style.display = 'flex'; box.classList.add('config-pop-in');
    }
};

window.openModal = function(t,d,opts,cb) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-desc').innerText=d; let g=document.getElementById('modal-btns'); g.innerHTML=''; opts.forEach(o=>{ let b=document.createElement('button'); b.className='mini-btn'; b.innerText=o; b.onclick=()=>{document.getElementById('modal-overlay').style.display='none'; cb(o)}; g.appendChild(b); }); document.getElementById('modal-overlay').style.display='flex'; }
window.cancelModal = function() { document.getElementById('modal-overlay').style.display='none'; window.isProcessing = false; }

export function spawnParticles(x, y, color) { for(let i=0; i<15; i++) { let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color; p.style.left = x + 'px'; p.style.top = y + 'px'; let angle = Math.random() * Math.PI * 2; let vel = 50 + Math.random() * 100; p.style.setProperty('--tx', `${Math.cos(angle)*vel}px`); p.style.setProperty('--ty', `${Math.sin(angle)*vel}px`); document.body.appendChild(p); setTimeout(() => p.remove(), 800); } }

export function triggerDamageEffect(isPlayer, playAudio = true) {
    try {
        if(playAudio) { if(!isPlayer && window.currentDeck === 'mage') playSound('sfx-hit-mage'); else playSound('sfx-hit'); }
        let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId);
        if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#ff4757'); }
        if (isPlayer) {
            document.body.classList.add('shake-screen-hard'); setTimeout(() => document.body.classList.remove('shake-screen-hard'), 400);
            if(window.triggerDamageEffect) window.triggerDamageEffect(); 
            let ov = document.getElementById('dmg-overlay-old'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 150); }
        }
    } catch(e) {}
}

export function triggerCritEffect() { let ov = document.getElementById('crit-overlay'); if(ov) { ov.style.opacity = '1'; document.body.style.filter = "grayscale(0.8) contrast(1.2)"; document.body.style.transition = "filter 0.05s"; setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => { document.body.style.transition = "filter 0.5s"; document.body.style.filter = "none"; }, 800); }, 100); } }

export function triggerHealEffect(isPlayer) {
    try {
        let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId);
        if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#2ecc71'); }
        if (isPlayer) {
            if(window.triggerHealEffect) window.triggerHealEffect();
            let ov = document.getElementById('heal-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 300); }
        }
    } catch(e) {}
}

export function triggerBlockEffect(isPlayer) {
    try {
        if(isPlayer && window.currentDeck === 'mage') playSound('sfx-block-mage'); else playSound('sfx-block');
        if (!isPlayer) {
             if(window.triggerBlockEffect) window.triggerBlockEffect();
             let ov = document.getElementById('block-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 200); }
        }
    } catch(e) { console.warn("Erro no bloqueio:", e); }
}

export function triggerXPGlow(unitId) { let xpArea = document.getElementById(unitId + '-xp'); if(xpArea) { xpArea.classList.add('xp-glow'); setTimeout(() => xpArea.classList.remove('xp-glow'), 600); } }
export function showCenterText(txt, col) { let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; if(col) el.style.color = col; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }

export function showFloatingText(eid, txt, col) {
    let el = document.createElement('div'); el.className='floating-text'; el.innerText=txt; el.style.color=col; let parent = document.getElementById(eid);
    if(parent) { let rect = parent.getBoundingClientRect(); el.style.left = (rect.left + rect.width/2) + 'px'; el.style.top = (rect.top) + 'px'; document.body.appendChild(el); }
    else { document.body.appendChild(el); }
    setTimeout(()=>el.remove(), 2000);
}

export function triggerLevelUpVisuals(unitId) {
    let clusterId = (unitId === 'p') ? 'p-stats-cluster' : 'm-stats-cluster'; let cluster = document.getElementById(clusterId);
    if(!cluster) return;
    const text = document.createElement('div'); text.innerText = "LEVEL UP!"; text.className = 'levelup-text';
    if (unitId === 'p') { text.classList.add('lvl-anim-up'); } else { text.classList.add('lvl-anim-down'); }
    cluster.appendChild(text); setTimeout(() => { text.remove(); }, 2000);
}

export function apply3DTilt(element, isHand = false) {
    if(window.innerWidth < 768) return;
    element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        const xPct = (x / rect.width) - 0.5; const yPct = (y / rect.height) - 0.5;
        element.style.setProperty('--rx', xPct); element.style.setProperty('--ry', yPct);
        let lift = isHand ? 'translateY(-140px) scale(2.3)' : 'scale(1.1)'; let rotate = `rotateX(${yPct * -40}deg) rotateY(${xPct * 40}deg)`;
        if(element.classList.contains('disabled-card')) rotate = `rotateX(${yPct * -10}deg) rotateY(${xPct * 10}deg)`;
        element.style.transform = `${lift} ${rotate}`;
        let art = element.querySelector('.card-art'); if(art) art.style.backgroundPosition = `${50 + (xPct * 20)}% ${50 + (yPct * 20)}%`;
    });
    element.addEventListener('mouseleave', () => {
        element.style.transform = isHand ? 'translateY(0) scale(1)' : 'scale(1)';
        let art = element.querySelector('.card-art'); if(art) art.style.backgroundPosition = 'center';
        element.style.setProperty('--rx', 0); element.style.setProperty('--ry', 0);
    });
}

export function animateFly(startId, endId, cardKey, cb, initialDeal = false, isToTable = false, isPlayer = false) {
    let s; if (typeof startId === 'string') { let el = document.getElementById(startId); if (!el) s = { top: 0, left: 0, width: 0, height: 0 }; else s = el.getBoundingClientRect(); } else { s = startId; }
    let e = { top: 0, left: 0 }; let destEl = document.getElementById(endId); if(destEl) e = destEl.getBoundingClientRect();
    const fly = document.createElement('div'); fly.className = `card flying-card ${CARDS_DB[cardKey].color}`;
    let imgUrl = getCardArt(cardKey, isPlayer); fly.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div>`;
    if (isToTable) fly.classList.add('card-bounce');
    if(typeof startId !== 'string' && s.width > 0) { fly.style.width = s.width + 'px'; fly.style.height = s.height + 'px'; }
    else { let w = window.innerWidth < 768 ? '84px' : '105px'; let h = window.innerWidth < 768 ? '120px' : '150px'; fly.style.width=w; fly.style.height=h; }
    let tableW = window.innerWidth < 768 ? '110px' : '180px'; let tableH = window.innerWidth < 768 ? '170px' : '260px';
    fly.style.top=s.top+'px'; fly.style.left=s.left+'px';
    if(endId.includes('xp')) fly.style.transform='scale(0.3)';
    document.body.appendChild(fly); fly.offsetHeight;
    if(isToTable) { fly.style.width=tableW; fly.style.height=tableH; }
    fly.style.top=e.top+'px'; fly.style.left=e.left+'px';
    setTimeout(() => { fly.remove(); if(cb) cb(); }, 250);
}

export function renderTable(key, slotId, isPlayer = false) {
    let el = document.getElementById(slotId); el.innerHTML = '';
    let card = document.createElement('div'); card.className = `card ${CARDS_DB[key].color} card-on-table`;
    let imgUrl = getCardArt(key, isPlayer); card.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div>`; el.appendChild(card);
}

export function initGlobalHoverLogic() {
    let lastTarget = null;
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('button, .circle-btn, #btn-fullscreen, .deck-option, .mini-btn');
        if (target && target !== lastTarget) { lastTarget = target; window.playUIHoverSound(); }
        else if (!target) { lastTarget = null; }
    });
}

export function createLobbyFlares() {
    const container = document.getElementById('lobby-particles'); if(!container) return; container.innerHTML = '';
    for(let i=0; i < 70; i++) {
        let flare = document.createElement('div'); flare.className = 'lobby-flare'; flare.style.left = Math.random() * 100 + '%'; flare.style.top = Math.random() * 100 + '%';
        let size = 4 + Math.random() * 18; flare.style.width = size + 'px'; flare.style.height = size + 'px'; flare.style.animationDuration = (3 + Math.random() * 5) + 's'; flare.style.animationDelay = (Math.random() * 4) + 's';
        container.appendChild(flare);
    }
}
