// ARQUIVO: js/main.js (VERSÃO FINAL REORGANIZADA)

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCVLhOcKqF6igMGRmOWO_GEY9O4gz892Fo",
    authDomain: "buppo-game.firebaseapp.com",
    projectId: "buppo-game",
    storageBucket: "buppo-game.firebasestorage.app",
    messagingSenderId: "950871979140",
    appId: "1:950871979140:web:f2dba12900500c52053ed1"
};

// --- INICIALIZAÇÃO FIREBASE ---
let app, auth, db, provider;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    console.log("Firebase Web Iniciado.");
} catch (e) { console.error("Erro Firebase:", e); }

// ======================================================
// 1. FUNÇÕES DE UTILIDADE E UI (PRIORIDADE ALTA)
// ======================================================

// Janela Modal (Abandonar/Desarmar)
window.openModal = function(title, desc, options, callback) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    // Popula o HTML interno da modal
    overlay.innerHTML = `
        <div class="modal-content">
            <h2>${title}</h2>
            <p>${desc}</p>
            <div class="modal-buttons" id="modal-btn-container"></div>
        </div>
    `;

    const btnContainer = document.getElementById('modal-btn-container');
    
    // Cria os botões dinamicamente
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'modal-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            overlay.classList.remove('active'); // Fecha modal
            if (callback) callback(opt); // Executa a ação
        };
        btnContainer.appendChild(btn);
    });

    overlay.classList.add('active'); // Mostra modal
};

// Texto Flutuante (Dano/Cura)
window.showFloatingText = function(targetId, text, color) {
    const target = document.getElementById(targetId);
    if (!target) return;
    
    const rect = target.getBoundingClientRect();
    const el = document.createElement('div');
    el.innerText = text;
    el.className = 'floating-text'; 
    el.style.color = color || '#fff';
    
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = rect.top + 'px';
    
    document.body.appendChild(el);
    
    setTimeout(() => { el.remove(); }, 1500);
}

// Tooltip das Cartas
const tt = document.getElementById('tooltip-box');
window.bindFixedTooltip = function(element, cardKey) {
    return {
        onmouseenter: (e) => {
            if(typeof showTT === 'function') showTT(cardKey);
            if(tt) {
                const rect = element.getBoundingClientRect();
                tt.style.left = (rect.left + rect.width / 2) + 'px';
                if (rect.top > window.innerHeight / 2) {
                    tt.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
                    tt.style.top = 'auto';
                    tt.classList.remove('tooltip-anim-down');
                    tt.classList.add('tooltip-anim-up');
                } else {
                    tt.style.top = (rect.bottom + 10) + 'px';
                    tt.style.bottom = 'auto';
                    tt.classList.remove('tooltip-anim-up');
                    tt.classList.add('tooltip-anim-down');
                }
                tt.style.transform = "translateX(-50%)";
            }
        }
    };
}

// Verificar Fim de Jogo
window.checkEndGame = function() {
    if (player.hp <= 0 || monster.hp <= 0) {
        window.isGameRunning = false;
        const endScreen = document.getElementById('end-screen');
        const endTitle = document.getElementById('end-title');
        
        if(endScreen) {
            endScreen.classList.add('visible');
            endScreen.style.pointerEvents = "auto";
        }
        
        if(endTitle) {
            endTitle.classList.remove('win-theme', 'lose-theme', 'tie-theme');
            if (player.hp <= 0 && monster.hp <= 0) {
                endTitle.innerText = "EMPATE";
                endTitle.classList.add('tie-theme');
                playSound('sfx-tie');
            } else if (player.hp <= 0) {
                endTitle.innerText = "DERROTA";
                endTitle.classList.add('lose-theme');
                playSound('sfx-lose');
                if(window.registrarDerrotaOnline) window.registrarDerrotaOnline();
            } else {
                endTitle.innerText = "VITÓRIA";
                endTitle.classList.add('win-theme');
                playSound('sfx-win');
                if(window.registrarVitoriaOnline) window.registrarVitoriaOnline();
            }
        }
    }
}

// Fluxo de Início de Jogo
window.startGameFlow = function() {
    console.log("Iniciando Fluxo de Jogo...");
    const endScreen = document.getElementById('end-screen');
    if(endScreen) endScreen.classList.remove('visible');
    
    isProcessing = false;
    turnCount = 1;
    playerHistory = [];
    
    resetUnit(player);
    resetUnit(monster);
    
    const turnTxt = document.getElementById('turn-txt');
    if(turnTxt) turnTxt.innerText = "TURNO 1";
    
    const pSlot = document.getElementById('p-slot');
    const mSlot = document.getElementById('m-slot');
    if(pSlot) pSlot.innerHTML = '';
    if(mSlot) mSlot.innerHTML = '';
    
    drawCardLogic(player, 6);
    drawCardLogic(monster, 6);
    
    window.isMatchStarting = true;
    updateUI();
    
    const handEl = document.getElementById('player-hand');
    if(handEl) handEl.classList.add('preparing');
    
    setTimeout(() => { dealAllInitialCards(); }, 500);
}

// ======================================================
// 2. VARIÁVEIS GLOBAIS E ASSETS
// ======================================================
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 

// Variáveis de Jogo
let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let isProcessing = false; 
let turnCount = 1; 
let playerHistory = []; 
window.masterVol = 1.0; 
let isLethalHover = false; 
let mixerInterval = null;

// Variáveis de Matchmaking e PvP
let matchTimerInterval = null;
let matchSeconds = 0;
let myQueueRef = null;      
let queueListener = null;   
let matchUnsub = null;      
window.isGameRunning = false;
window.currentMatchId = null;
window.isMatchStarting = false;
window.currentDeck = 'knight';
window.gameMode = 'pve';

// --- ASSETS ---
const MAGE_ASSETS = {
    'ATAQUE': 'https://i.ibb.co/xKcyL7Qm/01-ATAQUE-MAGO.png',
    'BLOQUEIO': 'https://i.ibb.co/pv2CCXKR/02-BLOQUEIO-MAGO.png',
    'DESCANSAR': 'https://i.ibb.co/sv98P3JK/03-DESCANSAR-MAGO.png',
    'DESARMAR': 'https://i.ibb.co/Q7SmhYQk/04-DESARMAR-MAGO.png',
    'TREINAR': 'https://i.ibb.co/8LGTJCn4/05-TREINAR-MAGO.png',
    'DECK_IMG': 'https://i.ibb.co/XZ8qc166/DECK-MAGO.png',
    'DECK_SELECT': 'https://i.ibb.co/mCFs1Ggc/SELE-O-DE-DECK-MAGO.png'
};

const ASSETS_TO_LOAD = {
    images: [
        'https://i.ibb.co/60tCyntQ/BUPPO-LOGO-Copiar.png',
        'https://i.ibb.co/zhx4QY51/MESA-DE-JOGO.png',
        'https://i.ibb.co/Z1GNKZGp/MESA-DE-JOGO-MAGO.png',
        'https://i.ibb.co/Dfpkhhtr/ARTE-SAGU-O.png',
        'https://i.ibb.co/zHZsCnyB/QUADRO-DO-SAGU-O.png',
        'https://i.ibb.co/GSWpX5C/PLACA-SELE-O.png',
        'https://i.ibb.co/fzr36qbR/SELE-O-DE-DECK-CAVALEIRO.png',
        'https://i.ibb.co/bjBcKN6c/SELE-O-DE-DECK-MAGO.png',
        'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png',
        'https://i.ibb.co/jdZmTHC/CARDBACK.png',
        'https://i.ibb.co/jkvc8kRf/01-ATAQUE.png',
        'https://i.ibb.co/zhFYHsxQ/02-BLOQUEIO.png',
        'https://i.ibb.co/PzV81m5C/03-DESCANSAR.png',
        'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png',
        'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png',
        'https://i.ibb.co/xqbKSbgx/mesa-com-deck.png',
        'https://i.ibb.co/xKcyL7Qm/01-ATAQUE-MAGO.png',
        'https://i.ibb.co/pv2CCXKR/02-BLOQUEIO-MAGO.png',
        'https://i.ibb.co/sv98P3JK/03-DESCANSAR-MAGO.png',
        'https://i.ibb.co/Q7SmhYQk/04-DESARMAR-MAGO.png',
        'https://i.ibb.co/8LGTJCn4/05-TREINAR-MAGO.png',
        'https://i.ibb.co/XZ8qc166/DECK-MAGO.png',
        'https://i.ibb.co/mCFs1Ggc/SELE-O-DE-DECK-MAGO.png',
        'https://i.ibb.co/SXPndxhb/AREA-DE-EXPERIENCIA.png'
    ],
    audio: [
        { id: 'bgm-menu', src: 'https://files.catbox.moe/kuriut.wav', loop: true }, 
        { id: 'bgm-loop', src: 'https://files.catbox.moe/57mvtt.mp3', loop: true },
        { id: 'sfx-nav', src: 'https://files.catbox.moe/yc7yrz.mp3' }, 
        { id: 'sfx-deal', src: 'https://files.catbox.moe/vhgxvr.mp3' }, 
        { id: 'sfx-play', src: 'https://files.catbox.moe/jpjd8x.mp3' },
        { id: 'sfx-hit', src: 'https://files.catbox.moe/r1ko7y.mp3' }, 
        { id: 'sfx-hit-mage', src: 'https://files.catbox.moe/y0x72c.mp3' }, 
        { id: 'sfx-block', src: 'https://files.catbox.moe/6zh7w0.mp3' }, 
        { id: 'sfx-block-mage', src: 'https://files.catbox.moe/8xjjl5.mp3' }, 
        { id: 'sfx-heal', src: 'https://files.catbox.moe/h2xo2v.mp3' }, 
        { id: 'sfx-levelup', src: 'https://files.catbox.moe/ex4t72.mp3' }, 
        { id: 'sfx-train', src: 'https://files.catbox.moe/rnndcv.mp3' }, 
        { id: 'sfx-disarm', src: 'https://files.catbox.moe/udd2sz.mp3' }, 
        { id: 'sfx-cine', src: 'https://files.catbox.moe/rysr4f.mp3', loop: true }, 
        { id: 'sfx-hover', src: 'https://files.catbox.moe/wzurt7.mp3' }, 
        { id: 'sfx-ui-hover', src: 'https://files.catbox.moe/gzjf9y.mp3' }, 
        { id: 'sfx-deck-select', src: 'https://files.catbox.moe/993lma.mp3' }, 
        { id: 'sfx-win', src: 'https://files.catbox.moe/a3ls23.mp3' }, 
        { id: 'sfx-lose', src: 'https://files.catbox.moe/n7nyck.mp3' },
        { id: 'sfx-tie', src: 'https://files.catbox.moe/sb18ja.mp3' }
    ]
};
let totalAssets = ASSETS_TO_LOAD.images.length + ASSETS_TO_LOAD.audio.length;

// --- HELPER: RETORNA ARTE CORRETA ---
function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) {
        return MAGE_ASSETS[cardKey];
    }
    return CARDS_DB[cardKey].img;
}

const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if (this.currentTrackId === trackId) {
            if (audios[trackId] && audios[trackId].paused && !window.isMuted) {
                const audio = audios[trackId];
                audio.volume = 0;
                audio.play().catch(()=>{});
                this.fadeIn(audio, 0.5 * window.masterVol);
            }
            return; 
        } 
        const maxVol = 0.5 * window.masterVol;
        if (this.currentTrackId && audios[this.currentTrackId]) {
            this.fadeOut(audios[this.currentTrackId]);
        }
        if (trackId && audios[trackId]) {
            const newAudio = audios[trackId];
            newAudio.currentTime = 0;
            if (!window.isMuted) {
                newAudio.volume = 0; 
                newAudio.play().catch(()=>{});
                this.fadeIn(newAudio, maxVol);
            }
        }
        this.currentTrackId = trackId;
    },
    stopCurrent() {
        if (this.currentTrackId && audios[this.currentTrackId]) {
            this.fadeOut(audios[this.currentTrackId]);
        }
        this.currentTrackId = null;
    },
    fadeOut(audio) {
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) { vol -= 0.05; audio.volume = vol; } else { audio.volume = 0; audio.pause(); clearInterval(fadeOutInt); }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        let vol = 0;
        audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) { vol += 0.05; audio.volume = vol; } else { audio.volume = targetVol; clearInterval(fadeInInt); }
        }, 50);
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
    if(!window.isMuted && MusicController.currentTrackId) {
        const audio = audios[MusicController.currentTrackId];
        if(audio && audio.paused) audio.play();
    }
}

window.playNavSound = function() { 
    let s = audios['sfx-nav']; 
    if(s) { s.currentTime = 0; s.play().catch(()=>{}); } 
};

let lastHoverTime = 0;
window.playUIHoverSound = function() {
    let now = Date.now();
    if (now - lastHoverTime < 50) return; 
    let base = audios['sfx-ui-hover'];
    if(base && !window.isMuted) { 
        let s = base.cloneNode(); s.volume = 0.3 * (window.masterVol || 1.0); s.play().catch(()=>{}); lastHoverTime = now;
    }
};

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
        const panel = document.getElementById('config-panel');
        if(panel) { panel.style.display = 'none'; panel.classList.remove('active'); }
    }
}

window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    } catch (e) { console.log(e); }
    window.showScreen('deck-selection-screen');
};

(function createRotateOverlay() {
    if (!document.getElementById('rotate-overlay')) {
        const div = document.createElement('div');
        div.id = 'rotate-overlay';
        div.innerHTML = `<div style="font-size: 50px; margin-bottom: 20px;">↻</div><div>GIRE O CELULAR<br>PARA JOGAR</div>`;
        document.body.appendChild(div);
    }
})();

// ======================================================
// LÓGICA DE MATCHMAKING REAL & PVP SYNC (FIREBASE)
// ======================================================

// Botão PvE (Treino)
window.startPvE = function() {
    window.gameMode = 'pve'; 
    window.playNavSound();
    window.openDeckSelector(); 
};

// Botão PvP (Rankeado)
window.startPvPSearch = async function() {
    if (!currentUser) return; 
    window.gameMode = 'pvp';
    window.playNavSound();

    // UI
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'flex';
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE...";
    document.querySelector('.mm-title').style.color = "var(--gold)";
    document.querySelector('.radar-spinner').style.borderColor = "rgba(255, 215, 0, 0.3)";
    document.querySelector('.radar-spinner').style.borderTopColor = "var(--gold)";
    document.querySelector('.radar-spinner').style.animation = "spin 1s linear infinite";
    document.querySelector('.cancel-btn').style.display = "block";
    
    // Timer
    matchSeconds = 0;
    const timerEl = document.getElementById('mm-timer');
    timerEl.innerText = "00:00";
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    matchTimerInterval = setInterval(() => {
        matchSeconds++;
        let m = Math.floor(matchSeconds / 60).toString().padStart(2, '0');
        let s = (matchSeconds % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
    }, 1000);

    // Firebase
    try {
        // A: Criar Ticket
        myQueueRef = doc(collection(db, "queue")); 
        const myData = {
            uid: currentUser.uid,
            name: currentUser.displayName,
            score: 0, 
            timestamp: Date.now(),
            matchId: null 
        };
        await setDoc(myQueueRef, myData);

        // B: Listener
        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
