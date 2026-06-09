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

const ACTION_META = {
    ATAQUE: { label: 'ATAQUE', icon: 'X', cls: 'attack' },
    BLOQUEIO: { label: 'BLOQUEIO', icon: 'O', cls: 'block' },
    DESCANSAR: { label: 'DESCANSAR', icon: '+', cls: 'rest' },
    TREINAR: { label: 'TREINAR', icon: '*', cls: 'train' },
    DESARMAR: { label: 'DESARMAR', icon: '!', cls: 'disarm' }
};

function createCombatFxElement(className, text = '') {
    const el = document.createElement('div');
    el.className = className;
    el.innerText = text;
    document.body.appendChild(el);
    return el;
}

export function showCombatCue(text, tone = 'gold', duration = 900) {
    const cue = createCombatFxElement(`combat-cue ${tone}`, text);
    setTimeout(() => cue.remove(), duration);
}

export function triggerActionCue(cardKey, isPlayer = true) {
    const meta = ACTION_META[cardKey] || { label: cardKey, icon: '?', cls: 'neutral' };
    const slot = document.getElementById(isPlayer ? 'p-slot' : 'm-slot');
    const rect = slot ? slot.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const burst = createCombatFxElement(`action-burst ${meta.cls}`, meta.icon);
    burst.style.left = (rect.left + rect.width / 2) + 'px';
    burst.style.top = (rect.top + rect.height / 2) + 'px';
    for(let i = 0; i < 14; i++) {
        const spark = document.createElement('span');
        spark.style.setProperty('--a', `${(360 / 14) * i}deg`);
        spark.style.setProperty('--d', `${50 + Math.random() * 42}px`);
        burst.appendChild(spark);
    }
    setTimeout(() => burst.remove(), 850);
}

function centerOfElement(id) {
    const el = document.getElementById(id);
    if(!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
}

export function triggerAttackSlash(targetIsPlayer) {
    const target = centerOfElement(targetIsPlayer ? 'p-stats-cluster' : 'm-stats-cluster');
    const slash = createCombatFxElement('attack-slash-fx');
    slash.style.left = target.x + 'px';
    slash.style.top = target.y + 'px';

    const spark = createCombatFxElement('impact-spark-fx');
    spark.style.left = target.x + 'px';
    spark.style.top = target.y + 'px';

    setTimeout(() => slash.remove(), 520);
    setTimeout(() => spark.remove(), 520);
}

export function triggerBlockShield(blockerIsPlayer) {
    const p = centerOfElement('p-slot');
    const m = centerOfElement('m-slot');
    const midX = (p.x + m.x) / 2;
    const midY = (p.y + m.y) / 2;
    const shield = createCombatFxElement('block-shield-fx');
    shield.style.left = midX + 'px';
    shield.style.top = midY + 'px';
    shield.classList.add(blockerIsPlayer ? 'player-block' : 'enemy-block');
    const ripple = createCombatFxElement('block-ripple-fx');
    ripple.style.left = midX + 'px';
    ripple.style.top = midY + 'px';
    setTimeout(() => shield.remove(), 720);
    setTimeout(() => ripple.remove(), 620);
}

export function triggerRestAura(isPlayer) {
    const target = centerOfElement(isPlayer ? 'p-stats-cluster' : 'm-stats-cluster');
    const aura = createCombatFxElement('rest-aura-fx');
    aura.style.left = target.x + 'px';
    aura.style.top = target.y + 'px';

    for(let i = 0; i < 18; i++) {
        const mote = document.createElement('span');
        mote.style.left = (target.x + (Math.random() - 0.5) * 190) + 'px';
        mote.style.top = (target.y + 35 + Math.random() * 45) + 'px';
        mote.style.setProperty('--rise', `${70 + Math.random() * 65}px`);
        document.body.appendChild(mote);
        mote.className = 'rest-mote-fx';
        setTimeout(() => mote.remove(), 1000);
    }
    setTimeout(() => aura.remove(), 1000);
}

export function triggerTrainDeckGlow(isPlayer) {
    const deckId = isPlayer ? 'p-deck-container' : 'm-deck';
    const target = centerOfElement(deckId);
    const deckEl = document.getElementById(deckId);
    if(deckEl) {
        deckEl.classList.remove('deck-train-glow');
        void deckEl.offsetWidth;
        deckEl.classList.add('deck-train-glow');
        setTimeout(() => deckEl.classList.remove('deck-train-glow'), 850);
    }
    const rune = createCombatFxElement('train-rune-fx', '*');
    rune.style.left = target.x + 'px';
    rune.style.top = target.y + 'px';
    setTimeout(() => rune.remove(), 900);
}

export function triggerDisarmSeal(targetIsPlayer, label = '') {
    const target = centerOfElement(targetIsPlayer ? 'p-stats-cluster' : 'm-stats-cluster');
    const seal = createCombatFxElement('disarm-seal-fx', label || '!');
    seal.style.left = target.x + 'px';
    seal.style.top = target.y + 'px';
    setTimeout(() => seal.remove(), 1050);
}

export function triggerHpImpact(isPlayer) {
    const cluster = document.getElementById(isPlayer ? 'p-stats-cluster' : 'm-stats-cluster');
    const hpFill = document.getElementById(isPlayer ? 'p-hp-fill' : 'm-hp-fill');
    if(cluster) {
        cluster.classList.remove('avatar-hit-anim');
        void cluster.offsetWidth;
        cluster.classList.add('avatar-hit-anim');
        setTimeout(() => cluster.classList.remove('avatar-hit-anim'), 450);
    }
    if(hpFill) {
        hpFill.classList.remove('hp-hit-flash');
        void hpFill.offsetWidth;
        hpFill.classList.add('hp-hit-flash');
        setTimeout(() => hpFill.classList.remove('hp-hit-flash'), 500);
    }
}

export function triggerHealPulse(isPlayer) {
    const hpFill = document.getElementById(isPlayer ? 'p-hp-fill' : 'm-hp-fill');
    if(hpFill) {
        hpFill.classList.remove('hp-heal-flash');
        void hpFill.offsetWidth;
        hpFill.classList.add('hp-heal-flash');
        setTimeout(() => hpFill.classList.remove('hp-heal-flash'), 600);
    }
}

export function showMasteryBanner(type, isPlayer = true) {
    const meta = ACTION_META[type] || { label: type, cls: 'neutral' };
    document.body.classList.add('mastery-focus-active');
    playSound('sfx-mastery');
    const banner = createCombatFxElement(`mastery-banner ${meta.cls}`, `MAESTRIA EM ${meta.label}`);
    banner.classList.add(isPlayer ? 'from-player' : 'from-enemy');
    setTimeout(() => {
        banner.remove();
        document.body.classList.remove('mastery-focus-active');
    }, 1350);
}

export function highlightMasteryXP(unitId, type) {
    const xpArea = document.getElementById(unitId + '-xp');
    if(!xpArea) return;
    const cards = Array.from(xpArea.querySelectorAll('.xp-mini'));
    let highlighted = 0;
    cards.forEach(card => {
        if(highlighted >= 3) return;
        if(card.dataset.cardKey === type || card.getAttribute('data-card-key') === type) {
            highlighted++;
            card.classList.add('mastery-xp-highlight');
            setTimeout(() => card.classList.remove('mastery-xp-highlight'), 1400);

            const rect = card.getBoundingClientRect();
            if(rect.width > 0 && rect.height > 0) {
                const glowCard = document.createElement('div');
                glowCard.className = 'mastery-xp-spot';
                glowCard.style.left = rect.left + 'px';
                glowCard.style.top = rect.top + 'px';
                glowCard.style.width = rect.width + 'px';
                glowCard.style.height = rect.height + 'px';
                glowCard.style.backgroundImage = card.style.backgroundImage;
                document.body.appendChild(glowCard);
                setTimeout(() => glowCard.remove(), 1400);
            }
        }
    });
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
    let e = { top: 0, left: 0, width: 0, height: 0 }; let destEl = document.getElementById(endId); if(destEl) e = destEl.getBoundingClientRect();
    const fly = document.createElement('div'); fly.className = `card flying-card ${CARDS_DB[cardKey].color}`;
    let imgUrl = getCardArt(cardKey, isPlayer); fly.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div>`;
    let startW, startH;
    if(typeof startId !== 'string' && s.width > 0) { startW = s.width; startH = s.height; }
    else { startW = window.innerWidth < 768 ? 84 : 105; startH = window.innerWidth < 768 ? 120 : 150; }
    fly.style.width = startW + 'px'; fly.style.height = startH + 'px';
    let tableW = window.innerWidth < 768 ? 110 : 180; let tableH = window.innerWidth < 768 ? 170 : 260;
    const isToXP = typeof endId === 'string' && endId.endsWith('-xp');
    const xpW = 38;
    const xpH = 53;
    const endW = isToTable ? tableW : (isToXP ? xpW : startW);
    const endH = isToTable ? tableH : (isToXP ? xpH : startH);
    const endLeft = e.left + (e.width / 2) - (endW / 2);
    const endTop = e.top + (e.height / 2) - (endH / 2);
    fly.style.top=s.top+'px'; fly.style.left=s.left+'px';
    const finalTransform = isToXP ? 'translateY(0) rotate(0deg) scale(1)' : 'scale(1)';
    fly.style.transform = 'translateY(0) rotate(-4deg) scale(1)';
    fly.style.transition = 'top 0.46s cubic-bezier(0.22, 0.9, 0.24, 1), left 0.46s cubic-bezier(0.22, 0.9, 0.24, 1), width 0.46s cubic-bezier(0.22, 0.9, 0.24, 1), height 0.46s cubic-bezier(0.22, 0.9, 0.24, 1), box-shadow 0.46s ease';
    document.body.appendChild(fly); fly.offsetHeight;
    if(isToTable) { fly.style.width=tableW+'px'; fly.style.height=tableH+'px'; }
    else if(isToXP) { fly.style.width=xpW+'px'; fly.style.height=xpH+'px'; }
    try {
        fly.animate([
            { transform: 'translateY(0) rotate(-5deg) scale(1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
            { transform: `translateY(-${window.innerWidth < 768 ? 34 : 58}px) rotate(5deg) scale(${isToTable ? 1.05 : (isToXP ? 0.78 : 0.9)})`, boxShadow: '0 28px 56px rgba(0,0,0,0.75)', offset: 0.55 },
            { transform: finalTransform, boxShadow: isToTable ? '0 16px 34px rgba(0,0,0,0.82)' : (isToXP ? '0 4px 10px rgba(0,0,0,0.5)' : '0 8px 20px rgba(0,0,0,0.55)') }
        ], { duration: 460, easing: 'cubic-bezier(0.22, 0.9, 0.24, 1)', fill: 'forwards' });
    } catch(e) {}
    fly.style.top=endTop+'px'; fly.style.left=endLeft+'px';
    setTimeout(() => {
        if(isToTable) playSound('sfx-play');
        fly.remove();
        if(cb) cb();
    }, 460);
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
