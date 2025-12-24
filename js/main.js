// ARQUIVO: js/main.js

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCVLhOcKqF6igMGRmOWO_GEY9O4gz892Fo",
    authDomain: "buppo-game.firebaseapp.com",
    projectId: "buppo-game",
    storageBucket: "buppo-game.firebasestorage.app",
    messagingSenderId: "950871979140",
    appId: "1:950871979140:web:f2dba12900500c52053ed1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
const ASSETS_TO_LOAD = {
    images: [
        'https://i.ibb.co/60tCyntQ/BUPPO-LOGO-Copiar.png', 'https://i.ibb.co/fVRc0vLs/Gemini-Generated-Image-ilb8d0ilb8d0ilb8.png', 
        'https://i.ibb.co/xqbKSbgx/mesa-com-deck.png', 'https://i.ibb.co/jdZmTHC/CARDBACK.png', 'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png',
        'https://i.ibb.co/jkvc8kRf/01-ATAQUE.png', 'https://i.ibb.co/zhFYHsxQ/02-BLOQUEIO.png', 'https://i.ibb.co/PzV81m5C/03-DESCANSAR.png',
        'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png', 'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png',
        'https://i.ibb.co/Dfpkhhtr/ARTE-SAGU-O.png', 'https://i.ibb.co/zHZsCnyB/QUADRO-DO-SAGU-O.png'
    ],
    audio: [
        { id: 'bgm-menu', src: 'https://files.catbox.moe/g8a1ux.mp3', loop: true }, 
        { id: 'bgm-loop', src: 'https://files.catbox.moe/57mvtt.mp3', loop: true },
        { id: 'sfx-nav', src: 'https://files.catbox.moe/yc7yrz.mp3' }, 
        { id: 'sfx-deal', src: 'https://files.catbox.moe/vhgxvr.mp3' }, { id: 'sfx-play', src: 'https://files.catbox.moe/jpjd8x.mp3' },
        { id: 'sfx-hit', src: 'https://files.catbox.moe/r1ko7y.mp3' }, { id: 'sfx-block', src: 'https://files.catbox.moe/6zh7w0.mp3' },
        { id: 'sfx-heal', src: 'https://files.catbox.moe/uegibx.mp3' }, { id: 'sfx-levelup', src: 'https://files.catbox.moe/sm8cce.mp3' },
        { id: 'sfx-cine', src: 'https://files.catbox.moe/rysr4f.mp3', loop: true }, { id: 'sfx-hover', src: 'https://files.catbox.moe/wzurt7.mp3' },
        { id: 'sfx-win', src: 'https://files.catbox.moe/a3ls23.mp3' }, { id: 'sfx-lose', src: 'https://files.catbox.moe/n7nyck.mp3' },
        { id: 'sfx-tie', src: 'https://files.catbox.moe/sb18ja.mp3' }
    ]
};
let totalAssets = ASSETS_TO_LOAD.images.length + ASSETS_TO_LOAD.audio.length;

let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let isProcessing = false; let turnCount = 1; let playerHistory = []; 
window.masterVol = 1.0; 
let isLethalHover = false; 
let mixerInterval = null;

// =======================
// CONTROLES DE ÁUDIO
// =======================
const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if (this.currentTrackId === trackId) return; 
        const maxVol = 0.5 * window.masterVol;
        if (this.currentTrackId && audios[this.currentTrackId]) { this.fadeOut(audios[this.currentTrackId]); }
        if (trackId && audios[trackId]) {
            const newAudio = audios[trackId];
            if (trackId === 'bgm-menu') newAudio.currentTime = 10 + Math.random() * 40; else newAudio.currentTime = 0;
            if (!window.isMuted) {
                newAudio.volume = 0; newAudio.play().catch(e => console.warn("Autoplay prevent", e));
                this.fadeIn(newAudio, maxVol);
            }
        }
        this.currentTrackId = trackId;
    },
    stopCurrent() { if (this.currentTrackId && audios[this.currentTrackId]) { this.fadeOut(audios[this.currentTrackId]); } this.currentTrackId = null; },
    fadeOut(audio) {
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => { if (vol > 0.05) { vol -= 0.05; audio.volume = vol; } else { audio.volume = 0; audio.pause(); clearInterval(fadeOutInt); } }, 50);
    },
    fadeIn(audio, targetVol) {
        let vol = 0; audio.volume = 0;
        const fadeInInt = setInterval(() => { if (vol < targetVol - 0.05) { vol += 0.05; audio.volume = vol; } else { audio.volume = targetVol; clearInterval(fadeInInt); } }, 50);
    }
};

window.isMuted = false;
window.toggleMute = function() {
    window.isMuted = !window.isMuted;
    const btn = document.getElementById('btn-sound');
    const iconOn = `<svg viewBox="0 0 24 24" style="width:100%; height:100%; fill:#eee;"><path d="M3,9v6h4l5,5V4L7,9H3z M16.5,12c0-1.77-1.02-3.29-2.5-4.03v8.05C15.48,15.29,16.5,13.77,16.5,12z M14,3.23v2.06 c2.89,0.86,5,3.54,5,6.71s-2.11,5.85-5,6.71v2.06c4.01-0.91,7-4.49,7-8.77S18.01,4.14,14,3.23z"/></svg>`;
    const iconOff = `<svg viewBox="0 0 24 24" style="width:100%; height:100%; fill:#eee;"><path d="M16.5,12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45,2.45C16.42,12.5,16.5,12.26,16.5,12z M19,12c0,0.94-0.2,1.82-0.54,2.64l1.51,1.51C20.63,14.91,21,13.5,21,12c0-4.28-2.99-7.86-7-8.77v2.06C16.89,6.15,19,8.83,19,12z M4.27,3L3,4.27l4.56,4.56C7.39,8.91,7.2,8.96,7,9H3v6h4l5,5v-6.73l4.25,4.25c-0.67,0.52-1.42,0.93-2.25,1.18v2.06c1.38-0.31,2.63-0.95,3.69-1.81L19.73,21L21,19.73L9,7.73V4L4.27,3z M12,4L9.91,6.09L12,8.18V4z"/></svg>`;
    if(btn) btn.innerHTML = window.isMuted ? iconOff : iconOn;
    Object.values(audios).forEach(audio => { if(audio) audio.muted = window.isMuted; });
    if(!window.isMuted && MusicController.currentTrackId) { const audio = audios[MusicController.currentTrackId]; if(audio && audio.paused) audio.play(); }
}

window.playNavSound = function() { let s = audios['sfx-nav']; if(s) { s.currentTime = 0; s.play().catch(()=>{}); } };

// =======================
// FIREBASE & LOGIN
// =======================
onAuthStateChanged(auth, (user) => {
    setTimeout(() => {
        const l = document.getElementById('loading-screen');
        if(l) { l.style.opacity = '0'; setTimeout(() => l.style.display = 'none', 500); }
    }, 500);

    if (user) {
        currentUser = user;
        window.goToLobby(true); 
    } else {
        currentUser = null;
        window.showScreen('start-screen');
        const bg = document.getElementById('game-background');
        if(bg) bg.classList.remove('lobby-mode');
        const btnTxt = document.getElementById('btn-text');
        if(btnTxt) btnTxt.innerText = "LOGIN COM GOOGLE";
        MusicController.play('bgm-menu');
    }
});

window.googleLogin = async function() {
    window.playNavSound(); 
    const btnText = document.getElementById('btn-text');
    btnText.innerText = "CONECTANDO...";
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error(error);
        btnText.innerText = "ERRO - TENTE NOVAMENTE";
        setTimeout(() => btnText.innerText = "LOGIN COM GOOGLE", 3000);
    }
};

window.handleLogout = function() { window.playNavSound(); signOut(auth).then(() => location.reload()); };

window.registrarVitoriaOnline = async function() {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            await updateDoc(userRef, { totalWins: (userSnap.data().totalWins || 0) + 1, score: (userSnap.data().score || 0) + 100 });
        }
    } catch(e) { console.error(e); }
};

window.registrarDerrotaOnline = async function() {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) { await updateDoc(userRef, { score: (userSnap.data().score || 0) + 10 }); }
    } catch(e) {}
};

// =======================
// NAVEGAÇÃO
// =======================
window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    const configBtn = document.getElementById('btn-config-toggle');
    if(screenId === 'game-screen') { if(configBtn) configBtn.style.display = 'flex'; } 
    else { 
        if(configBtn) configBtn.style.display = 'none'; 
        const panel = document.getElementById('config-panel'); 
        if(panel) { panel.style.display = 'none'; panel.classList.remove('active'); } 
    }
}

window.transitionToGame = function() {
    const transScreen = document.getElementById('transition-overlay');
    const transText = transScreen.querySelector('.trans-text');
    if(transText) transText.innerText = "PREPARANDO BATALHA...";
    if(transScreen) transScreen.classList.add('active');
    setTimeout(() => {
        MusicController.play('bgm-loop'); 
        let bg = document.getElementById('game-background');
        if(bg) bg.classList.remove('lobby-mode');
        window.showScreen('game-screen');
        const handEl = document.getElementById('player-hand'); if(handEl) handEl.innerHTML = '';
        setTimeout(() => { if(transScreen) transScreen.classList.remove('active'); setTimeout(() => { startGameFlow(); }, 200); }, 1500);
    }, 500); 
}

window.transitionToLobby = function() {
    const transScreen = document.getElementById('transition-overlay');
    const transText = transScreen.querySelector('.trans-text');
    if(transText) transText.innerText = "RETORNANDO AO SAGUÃO...";
    if(transScreen) transScreen.classList.add('active');
    MusicController.stopCurrent(); 
    setTimeout(() => { window.goToLobby(false); setTimeout(() => { if(transScreen) transScreen.classList.remove('active'); }, 1000); }, 500);
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) { window.showScreen('start-screen'); MusicController.play('bgm-menu'); return; }
    let bg = document.getElementById('game-background'); if(bg) bg.classList.add('lobby-mode');
    MusicController.play('bgm-menu'); createLobbyFlares();
    
    const userRef = doc(db, "players", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0 });
        document.getElementById('lobby-username').innerText = `OLÁ, ${currentUser.displayName.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: 0 | PONTOS: 0`;
    } else {
        const d = userSnap.data();
        document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;
    }
    
    const q = query(collection(db, "players"), orderBy("score", "desc"), limit(10));
    onSnapshot(q, (snapshot) => {
        let html = '<table id="ranking-table"><thead><tr><th>#</th><th>JOGADOR</th><th>PTS</th></tr></thead><tbody>';
        let pos = 1;
        snapshot.forEach((doc) => { const p = doc.data(); let rankClass = pos === 1 ? "rank-1" : ""; html += `<tr class="${rankClass}"><td class="rank-pos">${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`; pos++; });
        html += '</tbody></table>';
        document.getElementById('ranking-content').innerHTML = html;
    });
    window.showScreen('lobby-screen'); document.getElementById('end-screen').classList.remove('visible'); 
};

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; startCinematicLoop(); 
    resetUnit(player); resetUnit(monster); 
    turnCount = 1; playerHistory = [];
    drawCardLogic(monster, 6); drawCardLogic(player, 6); 
    
    updateUI(); 
    const handEl = document.getElementById('player-hand'); 
    if(handEl) Array.from(handEl.children).forEach(c => c.style.opacity = '0');
    
    setTimeout(() => { dealAllInitialCards(); }, 100);
}

// ===============================================
// ANIMAÇÃO DE COMPRA: RESTAURADA (VOO DO DECK)
// ===============================================
function dealAllInitialCards() {
    isProcessing = true; playSound('sfx-deal'); 
    const handEl = document.getElementById('player-hand'); 
    const cards = Array.from(handEl.children);
    if(cards.length === 0) { isProcessing = false; return; }

    cards.forEach((cardEl, i) => {
        setTimeout(() => {
            // Usa o ID 'p-deck-container' para saber de onde voar
            animateFly('p-deck-container', cardEl, player.hand[i], () => { 
                cardEl.style.opacity = '1'; 
                playSound('sfx-hover'); 
                if(i === cards.length - 1) isProcessing = false; 
            }, true);
        }, i * 200); 
    });
}

// AnimateFly Restaurada com Coordenadas
function animateFly(startRef, endRef, cardKey, callback, isDeal = false) {
    // 1. Coordenadas
    let startRect;
    if (typeof startRef === 'string') {
        const el = document.getElementById(startRef);
        startRect = el ? el.getBoundingClientRect() : { top: 0, left: 0, width: 100, height: 140 };
    } else {
        startRect = startRef.getBoundingClientRect();
    }

    let endRect;
    if (typeof endRef === 'string') {
        const el = document.getElementById(endRef);
        endRect = el ? el.getBoundingClientRect() : { top: window.innerHeight/2, left: window.innerWidth/2, width: 100, height: 140 };
    } else {
        endRect = endRef.getBoundingClientRect();
    }

    // 2. Clone
    const fly = document.createElement('div');
    fly.className = `card flying-card ${CARDS_DB[cardKey].color}`;
    fly.innerHTML = `<div class="card-art" style="background-image: url('${CARDS_DB[cardKey].img}')"></div>`;

    // 3. Posição Inicial
    fly.style.width = (startRect.width > 0 ? startRect.width : 100) + 'px';
    fly.style.height = (startRect.height > 0 ? startRect.height : 140) + 'px';
    fly.style.top = startRect.top + 'px';
    fly.style.left = startRect.left + 'px';
    fly.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; 
    
    // Pequena rotação no deck
    fly.style.transform = `rotate(${(Math.random() - 0.5) * 10}deg) scale(0.8)`;

    document.body.appendChild(fly);
    void fly.offsetWidth; // Force Reflow

    // 4. Mover para o Destino
    fly.style.top = endRect.top + 'px';
    fly.style.left = endRect.left + 'px';
    fly.style.width = endRect.width + 'px';
    fly.style.height = endRect.height + 'px';
    fly.style.transform = `rotate(0deg) scale(1)`;

    setTimeout(() => {
        fly.remove();
        if(callback) callback();
    }, 600); 
}

// =======================
// LÓGICA DE COMBATE
// =======================
function checkCardLethality(cardKey) { if(cardKey === 'ATAQUE') { let damage = player.lvl; return damage >= monster.hp ? 'red' : false; } if(cardKey === 'BLOQUEIO') { let reflect = 1 + player.bonusBlock; return reflect >= monster.hp ? 'blue' : false; } return false; }

function onCardClick(index) {
    if(isProcessing) return; if (!player.hand[index]) return;
    playSound('sfx-play'); document.body.classList.remove('focus-hand'); document.body.classList.remove('cinematic-active'); document.body.classList.remove('tension-active');
    document.getElementById('tooltip-box').style.display = 'none'; isLethalHover = false; 
    let cardKey = player.hand[index];
    if(player.disabled === cardKey) { showCenterText("DESARMADA!"); return; }
    if(cardKey === 'DESARMAR') { window.openModal('ALVO DO DESARME', 'Qual ação bloquear no inimigo?', ACTION_KEYS, (choice) => playCardFlow(index, choice)); } 
    else { playCardFlow(index, null); }
}

function getBestAIMove() {
    let moves = []; 
    monster.hand.forEach((card, index) => { 
        if(card !== monster.disabled) {
            moves.push({ card: card, index: index, score: 0 }); 
        }
    });

    if(moves.length === 0) return null;

    let recentHistory = playerHistory.slice(-5);
    let attackCount = recentHistory.filter(c => c === 'ATAQUE').length;
    let playerAggro = recentHistory.length > 0 ? (attackCount / recentHistory.length) : 0.5;

    let threatLvl = player.lvl + player.bonusAtk;
    let amIDying = monster.hp <= threatLvl;
    let myDmg = monster.lvl + monster.bonusAtk;
    let canKill = player.hp <= myDmg;

    moves.forEach(m => {
        let score = 50; 
        if (m.card === 'ATAQUE') { if (canKill) score += 500; if (playerAggro < 0.4) score += 40; if (amIDying) score -= 30; }
        else if (m.card === 'BLOQUEIO') { if (amIDying) score += 100; if (playerAggro > 0.6) score += 60; if (threatLvl >= 3) score += 40; }
        else if (m.card === 'DESCANSAR') { if (monster.hp === monster.maxHp) score -= 100; else if (monster.hp <= 3) score += 50; if (playerAggro > 0.7) score -= 40; }
        else if (m.card === 'DESARMAR') { if (amIDying) score += 120; if (playerAggro > 0.8) score += 50; }
        else if (m.card === 'TREINAR') { if (turnCount < 5) score += 30; if (amIDying || monster.hp <= 3) score -= 200; }
        m.score = score + Math.random() * 15; 
    });

    moves.sort((a, b) => b.score - a.score);
    return moves[0];
}

function playCardFlow(index, pDisarmChoice) {
    isProcessing = true; let cardKey = player.hand.splice(index, 1)[0]; playerHistory.push(cardKey);
    let aiMove = getBestAIMove(); let mCardKey = 'ATAQUE'; let mDisarmTarget = null; 
    if(aiMove) { mCardKey = aiMove.card; monster.hand.splice(aiMove.index, 1); if(mCardKey === 'DESARMAR') { if(player.hp <= (monster.lvl + monster.bonusAtk + 2)) { mDisarmTarget = 'BLOQUEIO'; } else { let pCounts = {}; player.xp.forEach(x => pCounts[x] = (pCounts[x]||0)+1); let bestTarget = null; for(let k in pCounts) if(pCounts[k] >= 3) bestTarget = k; if(bestTarget) mDisarmTarget = bestTarget; else mDisarmTarget = 'ATAQUE'; } } } 
    else { if(monster.hand.length > 0) mCardKey = monster.hand.pop(); else { drawCardLogic(monster, 1); if(monster.hand.length > 0) mCardKey = monster.hand.pop(); } }

    let handContainer = document.getElementById('player-hand'); 
    let realCardEl = handContainer.children[index]; 
    
    // ANIMAÇÃO DE VOO (MÃO -> MESA) - RESTAURADA
    let startRect = null;
    if(realCardEl) { 
        startRect = realCardEl.getBoundingClientRect(); 
        realCardEl.style.opacity = '0'; 
    }
    
    animateFly(startRect || 'player-hand', 'p-slot', cardKey, () => { renderTable(cardKey, 'p-slot'); updateUI(); }, false);
    const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 - (window.innerWidth < 768 ? 42 : 52.5) };
    animateFly(opponentHandOrigin, 'm-slot', mCardKey, () => { renderTable(mCardKey, 'm-slot'); setTimeout(() => resolveTurn(cardKey, mCardKey, pDisarmChoice, mDisarmTarget), 500); }, false);
}

function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    let pDmg = 0, mDmg = 0;

    // --- LÓGICA DE DANO CORRIGIDA ---
    if(mAct === 'ATAQUE') { pDmg += monster.lvl; }
    if(pAct === 'ATAQUE') { mDmg += player.lvl; }

    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') { mDmg += (1 + player.bonusBlock); } }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') { pDmg += (1 + monster.bonusBlock); } }

    let clash = false;
    let pBlocks = (pAct === 'BLOQUEIO' && mAct === 'ATAQUE'); 
    let mBlocks = (mAct === 'BLOQUEIO' && pAct === 'ATAQUE');
    if(pBlocks || mBlocks) { clash = true; triggerBlockEffect(); }

    let nextPlayerDisabled = null; let nextMonsterDisabled = null;
    if(mAct === 'DESARMAR') { if(mDisarmTarget) nextPlayerDisabled = mDisarmTarget; else nextPlayerDisabled = 'ATAQUE'; }
    if(pAct === 'DESARMAR') { nextMonsterDisabled = pDisarmChoice; }
    if(pAct === 'DESARMAR' && mAct === 'DESARMAR') { nextPlayerDisabled = null; nextMonsterDisabled = null; showCenterText("ANULADO", "#aaa"); }

    player.disabled = nextPlayerDisabled; monster.disabled = nextMonsterDisabled;
    if(pDmg >= 4 || mDmg >= 4) triggerCritEffect();

    if(pDmg > 0) { player.hp -= pDmg; showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); let soundOn = !(clash && mAct === 'BLOQUEIO'); triggerDamageEffect(true, soundOn); }
    if(mDmg > 0) { monster.hp -= mDmg; showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); let soundOn = !(clash && pAct === 'BLOQUEIO'); triggerDamageEffect(false, soundOn); }
    
    updateUI();
    let pDead = player.hp <= 0, mDead = monster.hp <= 0;
    
    if(!pDead && pAct === 'DESCANSAR') { let healAmount = (pDmg === 0) ? 3 : 2; player.hp = Math.min(player.maxHp, player.hp + healAmount); showFloatingText('p-lvl', `+${healAmount} HP`, "#55efc4"); triggerHealEffect(true); playSound('sfx-heal'); }
    if(!mDead && mAct === 'DESCANSAR') { let healAmount = (mDmg === 0) ? 3 : 2; monster.hp = Math.min(monster.maxHp, monster.hp + healAmount); triggerHealEffect(false); playSound('sfx-heal'); }

    function handleExtraXP(u) { if(u.deck.length > 0) { let card = u.deck.pop(); animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { u.xp.push(card); triggerXPGlow(u.id); updateUI(); }); } }
    if(!pDead && pAct === 'TREINAR') handleExtraXP(player); if(!mDead && mAct === 'TREINAR') handleExtraXP(monster);
    if(!pDead && pAct === 'ATAQUE' && mAct === 'DESCANSAR') handleExtraXP(player); if(!mDead && mAct === 'ATAQUE' && pAct === 'DESCANSAR') handleExtraXP(monster);

    setTimeout(() => {
        animateFly('p-slot', 'p-xp', pAct, () => { 
            if(!pDead) { player.xp.push(pAct); triggerXPGlow('p'); updateUI(); } 
            checkLevelUp(player, () => { if(!pDead) drawCardAnimated(player, 'p-deck-container', 'player-hand', () => { drawCardLogic(player, 1); turnCount++; updateUI(); isProcessing = false; }); }); 
        });
        animateFly('m-slot', 'm-xp', mAct, () => { 
            if(!mDead) { monster.xp.push(mAct); triggerXPGlow('m'); updateUI(); } 
            checkLevelUp(monster, () => { if(!mDead) drawCardLogic(monster, 1); checkEndGame(); }); 
        });
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

function checkLevelUp(u, doneCb) {
    if(u.xp.length >= 5) {
        let xpContainer = document.getElementById(u.id + '-xp'); let minis = Array.from(xpContainer.getElementsByClassName('xp-mini'));
        minis.forEach(realCard => {
            let r = realCard.getBoundingClientRect(); let c = document.createElement('div'); c.className = 'xp-anim-clone';
            c.style.left = r.left + 'px'; c.style.top = r.top + 'px'; c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; c.style.backgroundImage = realCard.style.backgroundImage;
            if (u.id === 'p') c.classList.add('xp-fly-up'); else c.classList.add('xp-fly-down');
            document.body.appendChild(c);
        });
        minis.forEach(m => m.style.opacity = '0');
        setTimeout(() => {
            let counts = {}; u.xp.forEach(x => counts[x] = (counts[x]||0)+1); let triggers = []; for(let k in counts) if(counts[k] >= 3 && k !== 'DESCANSAR') triggers.push(k);
            processMasteries(u, triggers, () => {
                let lvlEl = document.getElementById(u.id+'-lvl'); u.lvl++; lvlEl.classList.add('level-up-anim'); playSound('sfx-levelup'); setTimeout(() => lvlEl.classList.remove('level-up-anim'), 1000);
                u.xp.forEach(x => u.deck.push(x)); u.xp = []; shuffle(u.deck); 
                let clones = document.getElementsByClassName('xp-anim-clone'); while(clones.length > 0) clones[0].remove();
                updateUI(); doneCb();
            });
        }, 1000); 
    } else { doneCb(); }
}

function processMasteries(u, triggers, cb) {
    if(triggers.length === 0) { cb(); return; } let type = triggers.shift();
    if(type === 'TREINAR' && u.id === 'p') { let opts = [...new Set(u.xp.filter(x => x !== 'TREINAR'))]; if(opts.length > 0) window.openModal("MAESTRIA SUPREMA", "Copiar qual maestria?", opts, (c) => { if(c === 'DESARMAR') { window.openModal("MAESTRIA TÁTICA", "Bloquear qual ação?", ACTION_KEYS, (targetAction) => { monster.disabled = targetAction; showFloatingText('m-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }); } else { applyMastery(u,c); processMasteries(u, triggers, cb); } }); else processMasteries(u, triggers, cb); } 
    else if(type === 'DESARMAR' && u.id === 'p') { window.openModal("MAESTRIA TÁTICA", "Bloquear qual ação?", ACTION_KEYS, (c) => { monster.disabled = c; showFloatingText('m-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }); } 
    else if(type === 'TREINAR' && u.id === 'm') {
        let opts = [...new Set(u.xp.filter(x => x !== 'TREINAR' && x !== 'DESCANSAR'))]; 
        if(opts.length > 0) {
            let choice = opts[0];
            if(u.hp <= 4 && opts.includes('DESCANSAR')) choice = 'DESCANSAR'; else if(opts.includes('ATAQUE')) choice = 'ATAQUE'; else if(opts.includes('BLOQUEIO')) choice = 'BLOQUEIO';
            if(choice === 'DESARMAR') { let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); } else { applyMastery(u, choice); }
        }
        processMasteries(u, triggers, cb);
    }
    else if(type === 'DESARMAR' && u.id === 'm') { let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }
    else { applyMastery(u, type); processMasteries(u, triggers, cb); }
}
function applyMastery(u, k) { if(k === 'ATAQUE') { u.bonusAtk++; let target = (u === player) ? monster : player; target.hp -= u.bonusAtk; showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675"); triggerDamageEffect(u !== player); checkEndGame(); } if(k === 'BLOQUEIO') u.bonusBlock++; if(k === 'DESCANSAR') { u.maxHp++; showFloatingText(u.id+'-hp-txt', "+1 MAX", "#55efc4"); } updateUI(); }
function drawCardLogic(u, qty) { for(let i=0; i<qty; i++) if(u.deck.length > 0) u.hand.push(u.deck.pop()); u.hand.sort(); }

function bindMasteryTooltip(el, key, value, ownerId) {
    return {
        onmouseenter: (e) => {
            let db=CARDS_DB[key];
            document.getElementById('tt-title').innerHTML = key; 
            document.getElementById('tt-content').innerHTML = `<span class='tt-label' style='color:var(--accent-blue)'>Bônus Atual</span><span class='tt-val'>+${value}</span><span class='tt-label' style='color:var(--accent-red)'>Efeito</span><span class='tt-val'>${db.mastery}</span>`;
            tt.style.display = 'block';
            tt.classList.remove('tooltip-anim-up'); tt.classList.remove('tooltip-anim-down'); 
            void tt.offsetWidth; 
            let rect = el.getBoundingClientRect();
            if(ownerId === 'p') { tt.classList.add('tooltip-anim-up'); tt.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; tt.style.top = 'auto'; } 
            else { tt.classList.add('tooltip-anim-down'); tt.style.top = (rect.bottom + 10) + 'px'; tt.style.bottom = 'auto'; }
            tt.style.left = (rect.left + rect.width/2) + 'px'; tt.style.transform = "translateX(-50%)"; 
        }
    };
}

function addMI(parent, key, value, col, ownerId){ let d = document.createElement('div'); d.className = 'mastery-icon'; d.innerHTML = `${CARDS_DB[key].icon}<span class="mastery-lvl">${value}</span>`; d.style.borderColor = col; let h = bindMasteryTooltip(d, key, value, ownerId); d.onmouseenter = h.onmouseenter; d.onmouseleave = () => { tt.style.display = 'none'; }; parent.appendChild(d); }
function showFloatingText(eid, txt, col) { let e = document.createElement('div'); e.className='floating-text'; e.innerText=txt; e.style.color=col; let p = document.getElementById(eid); if(p) { let r = p.getBoundingClientRect(); e.style.left = (r.left + r.width/2) + 'px'; e.style.top = (r.top) + 'px'; document.body.appendChild(e); } else { document.body.appendChild(e); } setTimeout(()=>e.remove(), 2000); }
window.openModal = function(t,d,opts,cb) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-desc').innerText=d; let g=document.getElementById('modal-btns'); g.innerHTML=''; opts.forEach(o=>{ let b=document.createElement('button'); b.className='mini-btn'; b.innerText=o; b.onclick=()=>{document.getElementById('modal-overlay').style.display='none'; cb(o)}; g.appendChild(b); }); document.getElementById('modal-overlay').style.display='flex'; }
window.cancelModal = function() { document.getElementById('modal-overlay').style.display='none'; isProcessing = false; }
const tt=document.getElementById('tooltip-box');
function bindFixedTooltip(el,k) { const updatePos = () => { let rect = el.getBoundingClientRect(); tt.style.left = (rect.left + rect.width / 2) + 'px'; }; return { onmouseenter: (e) => { showTT(k); tt.style.bottom = (window.innerWidth < 768 ? '160px' : '320px'); tt.style.top = 'auto'; tt.classList.remove('tooltip-anim-up'); tt.classList.remove('tooltip-anim-down'); tt.classList.add('tooltip-anim-up'); updatePos(); el.addEventListener('mousemove', updatePos); } }; }
function showTT(k) { let db = CARDS_DB[k]; document.getElementById('tt-title').innerHTML = k; if (db.customTooltip) { let c = db.customTooltip; let l = (typeof player !== 'undefined' && player.lvl) ? player.lvl : 1; c = c.replace('{PLAYER_LVL}', l); let b = (typeof player !== 'undefined' && player.bonusBlock) ? player.bonusBlock : 0; c = c.replace('{PLAYER_BLOCK_DMG}', 1 + b); document.getElementById('tt-content').innerHTML = c; } else { document.getElementById('tt-content').innerHTML = `<span class='tt-label'>Base</span><span class='tt-val'>${db.base}</span><span class='tt-label' style='color:var(--accent-orange)'>Bônus</span><span class='tt-val'>${db.bonus}</span><span class='tt-label' style='color:var(--accent-purple)'>Maestria</span><span class='tt-val'>${db.mastery}</span>`; } tt.style.display = 'block'; }
window.restartMatch = function() { document.getElementById('end-screen').classList.remove('visible'); setTimeout(startGameFlow, 50); MusicController.play('bgm-loop'); }
window.abandonMatch = function() { if(document.getElementById('game-screen').classList.contains('active')) { window.toggleConfig(); if(window.confirm("Tem certeza que deseja sair? Contará como derrota.")) { window.registrarDerrotaOnline(); window.transitionToLobby(); } } }
window.toggleFullScreen = function() { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); else if (document.exitFullscreen) document.exitFullscreen(); }
window.toggleConfig = function() { let p = document.getElementById('config-panel'); if(p.style.display==='flex'){ p.style.display='none'; p.classList.remove('active'); document.body.classList.remove('config-mode'); } else { p.style.display='flex'; p.classList.add('active'); document.body.classList.add('config-mode'); } }
document.addEventListener('click', function(e) { const p = document.getElementById('config-panel'); const b = document.getElementById('btn-config-toggle'); if (p && p.classList.contains('active') && !p.contains(e.target) && (b && !b.contains(e.target))) window.toggleConfig(); });
window.updateVol = function(type, val) { if(type==='master') window.masterVol = parseFloat(val); ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-block', 'sfx-heal', 'sfx-levelup', 'sfx-hover', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'sfx-nav'].forEach(k => { if(audios[k]) audios[k].volume = 0.8 * (window.masterVol || 1.0); }); }
function playSound(key) { if(audios[key]) { audios[key].currentTime = 0; audios[key].play().catch(()=>{}); } }
function initAmbientParticles() { const c = document.getElementById('ambient-particles'); if(!c) return; for(let i=0; i<50; i++) { let d = document.createElement('div'); d.className = 'ember'; d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (5 + Math.random() * 5) + 's'; d.style.setProperty('--mx', (Math.random() - 0.5) * 50 + 'px'); c.appendChild(d); } } initAmbientParticles();
function apply3DTilt(el, isHand = false) { if(window.innerWidth < 768) return; el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); const x = e.clientX - r.left; const y = e.clientY - r.top; const xp = (x / r.width) - 0.5; const yp = (y / r.height) - 0.5; let lift = isHand ? 'translateY(-100px) scale(1.8)' : 'scale(1.1)'; let rot = `rotateX(${yp * -40}deg) rotateY(${xp * 40}deg)`; if(el.classList.contains('disabled-card')) rot = `rotateX(${yp * -10}deg) rotateY(${xp * 10}deg)`; el.style.transform = `${lift} ${rot}`; let art = el.querySelector('.card-art'); if(art) art.style.backgroundPosition = `${50 + (xp * 20)}% ${50 + (yp * 20)}%`; }); el.addEventListener('mouseleave', () => { el.style.transform = isHand ? 'translateY(0) scale(1)' : 'scale(1)'; let art = el.querySelector('.card-art'); if(art) art.style.backgroundPosition = 'center'; }); }
function spawnParticles(x, y, color) { for(let i=0; i<15; i++) { let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color; p.style.left = x + 'px'; p.style.top = y + 'px'; let angle = Math.random() * Math.PI * 2; let vel = 50 + Math.random() * 100; p.style.setProperty('--tx', `${Math.cos(angle)*vel}px`); p.style.setProperty('--ty', `${Math.sin(angle)*vel}px`); document.body.appendChild(p); setTimeout(() => p.remove(), 800); } }
function triggerDamageEffect(isPlayer, playAudio = true) { try { if(playAudio) playSound('sfx-hit'); let id = isPlayer ? 'p-slot' : 'm-slot'; let s = document.getElementById(id); if(s) { let r = s.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#ff4757'); } document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 400); let o = document.getElementById('dmg-overlay'); if(o) { o.style.opacity = '1'; setTimeout(() => o.style.opacity = '0', 150); } } catch(e) {} }
function triggerCritEffect() { let o = document.getElementById('crit-overlay'); if(o) { o.style.opacity = '1'; document.body.style.filter = "grayscale(0.8) contrast(1.2)"; document.body.style.transition = "filter 0.05s"; setTimeout(() => { o.style.opacity = '0'; setTimeout(() => { document.body.style.transition = "filter 0.5s"; document.body.style.filter = "none"; }, 800); }, 100); } }
function triggerHealEffect(isPlayer) { try { let id = isPlayer ? 'p-slot' : 'm-slot'; let s = document.getElementById(id); if(s) { let r = s.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#2ecc71'); } let o = document.getElementById('heal-overlay'); if(o) { o.style.opacity = '1'; setTimeout(() => o.style.opacity = '0', 300); } } catch(e) {} }
function triggerBlockEffect() { try { playSound('sfx-block'); let o = document.getElementById('block-overlay'); if(o) { o.style.opacity = '1'; setTimeout(() => o.style.opacity = '0', 200); } document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 200); } catch(e) {} }
function triggerXPGlow(uid) { let x = document.getElementById(uid + '-xp'); if(x) { x.classList.add('xp-glow'); setTimeout(() => x.classList.remove('xp-glow'), 600); } }
function showCenterText(txt, col) { let e = document.createElement('div'); e.className = 'center-text'; e.innerText = txt; if(col) e.style.color = col; document.body.appendChild(e); setTimeout(() => e.remove(), 1000); }
function createLobbyFlares() { const c = document.getElementById('lobby-particles'); if(!c) return; c.innerHTML = ''; for(let i=0; i < 70; i++) { let f = document.createElement('div'); f.className = 'lobby-flare'; f.style.left = Math.random() * 100 + '%'; f.style.top = Math.random() * 100 + '%'; let s = 4 + Math.random() * 18; f.style.width = s + 'px'; f.style.height = s + 'px'; f.style.animationDuration = (3 + Math.random() * 5) + 's'; f.style.animationDelay = (Math.random() * 4) + 's'; c.appendChild(f); } }
function startCinematicLoop() { const c = audios['sfx-cine']; if(c) {c.volume = 0; c.play().catch(()=>{}); if(mixerInterval) clearInterval(mixerInterval); mixerInterval = setInterval(updateAudioMixer, 30); }}
function updateAudioMixer() { const c = audios['sfx-cine']; if(!c) return; const m = window.masterVol || 1.0; const max = 0.6 * m; let t = isLethalHover ? max : 0; if(window.isMuted) { c.volume = 0; return; } if(c.volume < t) c.volume = Math.min(t, c.volume + 0.05); else if(c.volume > t) c.volume = Math.max(t, c.volume - 0.05); }
