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
        { id: 'bgm-menu', src: 'https://files.catbox.moe/kuriut.wav', loop: true }, 
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
// CONTROLLER DE MÚSICA
// =======================
const MusicController = {
    currentTrackId: null,
    fadeTimer: null,
    play(trackId) {
        if (this.currentTrackId === trackId) return; 
        const maxVol = 0.5 * window.masterVol;
        if (this.currentTrackId && audios[this.currentTrackId]) {
            const oldAudio = audios[this.currentTrackId];
            this.fadeOut(oldAudio);
        }
        if (trackId && audios[trackId]) {
            const newAudio = audios[trackId];
            if (trackId === 'bgm-menu') {
                newAudio.currentTime = 10 + Math.random() * 40;
            } else {
                newAudio.currentTime = 0;
            }
            if (!window.isMuted) {
                newAudio.volume = 0; 
                newAudio.play().catch(e => console.warn("Autoplay prevent", e));
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
            if (vol > 0.05) {
                vol -= 0.05;
                audio.volume = vol;
            } else {
                audio.volume = 0;
                audio.pause();
                clearInterval(fadeOutInt);
            }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        let vol = 0;
        audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) {
                vol += 0.05;
                audio.volume = vol;
            } else {
                audio.volume = targetVol;
                clearInterval(fadeInInt);
            }
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
        const handEl = document.getElementById('player-hand'); 
        if(handEl) handEl.innerHTML = '';
        setTimeout(() => {
            if(transScreen) transScreen.classList.remove('active');
            setTimeout(() => { startGameFlow(); }, 200); 
        }, 1500);
    }, 500); 
}

window.transitionToLobby = function() {
    const transScreen = document.getElementById('transition-overlay');
    const transText = transScreen.querySelector('.trans-text');
    if(transText) transText.innerText = "RETORNANDO AO SAGUÃO...";
    if(transScreen) transScreen.classList.add('active');
    MusicController.stopCurrent(); 
    setTimeout(() => {
        window.goToLobby(false); 
        setTimeout(() => {
            if(transScreen) transScreen.classList.remove('active');
        }, 1000); 
    }, 500);
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) {
        window.showScreen('start-screen');
        MusicController.play('bgm-menu'); 
        return;
    }
    let bg = document.getElementById('game-background');
    if(bg) bg.classList.add('lobby-mode');
    MusicController.play('bgm-menu'); 
    createLobbyFlares();
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
        snapshot.forEach((doc) => {
            const p = doc.data();
            let rankClass = pos === 1 ? "rank-1" : (pos === 2 ? "rank-2" : (pos === 3 ? "rank-3" : ""));
            html += `<tr class="${rankClass}"><td class="rank-pos">${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`;
            pos++;
        });
        html += '</tbody></table>';
        document.getElementById('ranking-content').innerHTML = html;
    });
    window.showScreen('lobby-screen');
    document.getElementById('end-screen').classList.remove('visible'); 
};

// ============================================
// LÓGICA DE PARTIDA (CORRIGIDA)
// ============================================
function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    startCinematicLoop(); 
    
    // --- 1. Oculta visualmente o container da mão ---
    // Isso garante que quando o updateUI desenhar as cartas, elas não apareçam
    const handEl = document.getElementById('player-hand');
    if (handEl) {
        handEl.innerHTML = '';
        handEl.style.opacity = '0'; // Esconde tudo
    }
    
    resetUnit(player); 
    resetUnit(monster); 
    turnCount = 1; 
    playerHistory = [];
    
    drawCardLogic(monster, 6); 
    drawCardLogic(player, 6); 
    
    updateUI(); 
    
    dealAllInitialCards();
}

function checkEndGame(){ 
    if(player.hp<=0 || monster.hp<=0) { 
        isProcessing = true; 
        isLethalHover = false; 
        MusicController.stopCurrent();
        setTimeout(()=>{ 
            let title = document.getElementById('end-title'); 
            let isWin = player.hp > 0;
            let isTie = player.hp <= 0 && monster.hp <= 0;
            if(isTie) { 
                title.innerText = "EMPATE"; title.className = "tie-theme"; playSound('sfx-tie'); 
            } else if(isWin) { 
                title.innerText = "VITÓRIA"; title.className = "win-theme"; playSound('sfx-win'); 
            } else { 
                title.innerText = "DERROTA"; title.className = "lose-theme"; playSound('sfx-lose'); 
            } 
            if(isWin && !isTie) { if(window.registrarVitoriaOnline) window.registrarVitoriaOnline(); } 
            else { if(window.registrarDerrotaOnline) window.registrarDerrotaOnline(); }
            document.getElementById('end-screen').classList.add('visible'); 
        }, 1000); 
    } else { isProcessing = false; } 
}

onAuthStateChanged(auth, (user) => {
    setTimeout(() => {
        const loading = document.getElementById('loading-screen');
        if(loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.style.display = 'none', 500);
        }
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

window.handleLogout = function() {
    window.playNavSound();
    signOut(auth).then(() => { location.reload(); });
};

window.registrarVitoriaOnline = async function() {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            await updateDoc(userRef, {
                totalWins: (data.totalWins || 0) + 1,
                score: (data.score || 0) + 100
            });
        }
    } catch(e) { console.error(e); }
};

window.registrarDerrotaOnline = async function() {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            await updateDoc(userRef, {
                score: (data.score || 0) + 10 
            });
        }
    } catch(e) {}
};

window.restartMatch = function() {
    document.getElementById('end-screen').classList.remove('visible');
    setTimeout(startGameFlow, 50);
    MusicController.play('bgm-loop'); 
}

window.abandonMatch = function() {
     if(document.getElementById('game-screen').classList.contains('active')) {
         window.toggleConfig(); 
         if(window.confirm("Tem certeza que deseja sair? Contará como derrota.")) {
             window.registrarDerrotaOnline();
             window.transitionToLobby(); 
         }
     }
}

function preloadGame() {
    ASSETS_TO_LOAD.images.forEach(src => { let img = new Image(); img.src = src; img.onload = () => updateLoader(); img.onerror = () => updateLoader(); });
    ASSETS_TO_LOAD.audio.forEach(a => { let s = new Audio(); s.src = a.src; s.preload = 'auto'; if(a.loop) s.loop = true; audios[a.id] = s; s.onloadedmetadata = () => updateLoader(); s.onerror = () => updateLoader(); setTimeout(() => { if(s.readyState === 0) updateLoader(); }, 2000); });
}

function updateLoader() {
    assetsLoaded++; let pct = Math.min(100, (assetsLoaded / totalAssets) * 100); 
    const fill = document.getElementById('loader-fill');
    if(fill) fill.style.width = pct + '%';
    if(assetsLoaded >= totalAssets) {
        setTimeout(() => {
            const loading = document.getElementById('loading-screen');
            if(loading) {
                loading.style.opacity = '0';
                setTimeout(() => loading.style.display = 'none', 500);
            }
        }, 1000); 
        document.body.addEventListener('click', () => { 
            if (!MusicController.currentTrackId) {
                MusicController.play('bgm-menu');
            }
        }, { once: true });
    }
}

window.onload = function() {
    preloadGame();
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
        btnSound.onclick = null; 
        btnSound.addEventListener('click', (e) => {
            e.stopPropagation(); 
            window.toggleMute();
        });
    }
};

window.toggleFullScreen = function() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => console.log(e)); } 
    else { if (document.exitFullscreen) { document.exitFullscreen(); } }
}

function createLobbyFlares() {
    const container = document.getElementById('lobby-particles');
    if(!container) return;
    container.innerHTML = ''; 
    for(let i=0; i < 70; i++) {
        let flare = document.createElement('div');
        flare.className = 'lobby-flare';
        flare.style.left = Math.random() * 100 + '%';
        flare.style.top = Math.random() * 100 + '%';
        let size = 4 + Math.random() * 18; 
        flare.style.width = size + 'px';
        flare.style.height = size + 'px';
        flare.style.animationDuration = (3 + Math.random() * 5) + 's'; 
        flare.style.animationDelay = (Math.random() * 4) + 's';
        container.appendChild(flare);
    }
}

function startCinematicLoop() { const c = audios['sfx-cine']; if(c) {c.volume = 0; c.play().catch(()=>{}); if(mixerInterval) clearInterval(mixerInterval); mixerInterval = setInterval(updateAudioMixer, 30); }}

function updateAudioMixer() { 
    const cineAudio = audios['sfx-cine']; 
    if(!cineAudio) return; 
    const mVol = window.masterVol || 1.0;
    const maxCine = 0.6 * mVol; 
    let targetCine = isLethalHover ? maxCine : 0; 
    if(window.isMuted) { cineAudio.volume = 0; return; }
    if(cineAudio.volume < targetCine) cineAudio.volume = Math.min(targetCine, cineAudio.volume + 0.05); 
    else if(cineAudio.volume > targetCine) cineAudio.volume = Math.max(targetCine, cineAudio.volume - 0.05); 
}

window.toggleConfig = function() { let p = document.getElementById('config-panel'); if(p.style.display==='flex'){ p.style.display='none'; p.classList.remove('active'); document.body.classList.remove('config-mode'); } else { p.style.display='flex'; p.classList.add('active'); document.body.classList.add('config-mode'); } }
document.addEventListener('click', function(e) { const panel = document.getElementById('config-panel'); const btn = document.getElementById('btn-config-toggle'); if (panel && panel.classList.contains('active') && !panel.contains(e.target) && (btn && !btn.contains(e.target))) window.toggleConfig(); });

window.updateVol = function(type, val) { 
    if(type==='master') window.masterVol = parseFloat(val); 
    ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-block', 'sfx-heal', 'sfx-levelup', 'sfx-hover', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'sfx-nav'].forEach(k => { 
        if(audios[k]) audios[k].volume = 0.8 * (window.masterVol || 1.0); 
    }); 
}
function playSound(key) { if(audios[key]) { audios[key].currentTime = 0; audios[key].play().catch(e => console.log("Audio prevented:", e)); } }

function initAmbientParticles() { const container = document.getElementById('ambient-particles'); if(!container) return; for(let i=0; i<50; i++) { let d = document.createElement('div'); d.className = 'ember'; d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (5 + Math.random() * 5) + 's'; d.style.setProperty('--mx', (Math.random() - 0.5) * 50 + 'px'); container.appendChild(d); } }
initAmbientParticles();

function spawnParticles(x, y, color) { for(let i=0; i<15; i++) { let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color; p.style.left = x + 'px'; p.style.top = y + 'px'; let angle = Math.random() * Math.PI * 2; let vel = 50 + Math.random() * 100; p.style.setProperty('--tx', `${Math.cos(angle)*vel}px`); p.style.setProperty('--ty', `${Math.sin(angle)*vel}px`); document.body.appendChild(p); setTimeout(() => p.remove(), 800); } }

function triggerDamageEffect(isPlayer, playAudio = true) { try { if(playAudio) playSound('sfx-hit'); let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId); if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#ff4757'); } document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 400); let ov = document.getElementById('dmg-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 150); } } catch(e) {} }
function triggerCritEffect() { let ov = document.getElementById('crit-overlay'); if(ov) { ov.style.opacity = '1'; document.body.style.filter = "grayscale(0.8) contrast(1.2)"; document.body.style.transition = "filter 0.05s"; setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => { document.body.style.transition = "filter 0.5s"; document.body.style.filter = "none"; }, 800); }, 100); } }
function triggerHealEffect(isPlayer) { try { let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId); if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#2ecc71'); } let ov = document.getElementById('heal-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 300); } } catch(e) {} }
function triggerBlockEffect() { try { playSound('sfx-block'); let ov = document.getElementById('block-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 200); } document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 200); } catch(e) {} }
function triggerXPGlow(unitId) { let xpArea = document.getElementById(unitId + '-xp'); if(xpArea) { xpArea.classList.add('xp-glow'); setTimeout(() => xpArea.classList.remove('xp-glow'), 600); } }
function showCenterText(txt, col) { let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; if(col) el.style.color = col; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }
function resetUnit(u) { u.hp = 6; u.maxHp = 6; u.lvl = 1; u.xp = []; u.hand = []; u.deck = []; u.disabled = null; u.bonusBlock = 0; u.bonusAtk = 0; for(let k in DECK_TEMPLATE) for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k); shuffle(u.deck); }
function shuffle(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }

// -----------------------------------------------------------------
// FUNÇÃO QUE CONTROLA A ANIMAÇÃO INICIAL (BOUNCE) - VERSÃO FINAL
// -----------------------------------------------------------------
function dealAllInitialCards() {
    isProcessing = true; 
    playSound('sfx-deal'); 
    
    const handEl = document.getElementById('player-hand'); 
    const cards = Array.from(handEl.children);
    
    // 2. Aplica a classe de animação em cada carta
    cards.forEach((cardEl, i) => {
        cardEl.classList.add('intro-anim');
        cardEl.style.animationDelay = (i * 0.1) + 's';
    });

    // 3. Devolve a opacidade do container.
    // Como as cartas têm a classe .intro-anim, e a animação começa
    // com transform:translateY(120vh), elas estarão invisíveis (fora da tela)
    // até começarem a subir.
    setTimeout(() => {
        handEl.style.opacity = '1';
    }, 100);

    // 4. Limpeza final após animação
    setTimeout(() => {
        cards.forEach(c => {
            c.classList.remove('intro-anim');
            c.style.animationDelay = '';
        });
        isProcessing = false;
    }, 2000); 
}

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
    isProcessing = true; 
    let cardKey = player.hand.splice(index, 1)[0]; 
    playerHistory.push(cardKey);

    let aiMove = getBestAIMove(); 
    let mCardKey = 'ATAQUE'; 
    let mDisarmTarget = null; 
    if(aiMove) { 
        mCardKey = aiMove.card; 
        monster.hand.splice(aiMove.index, 1); 
        if(mCardKey === 'DESARMAR') { 
            if(player.hp <= (monster.lvl + monster.bonusAtk + 2)) { mDisarmTarget = 'BLOQUEIO'; } 
            else { 
                let pCounts = {}; player.xp.forEach(x => pCounts[x] = (pCounts[x]||0)+1); 
                let bestTarget = null; for(let k in pCounts) if(pCounts[k] >= 3) bestTarget = k; 
                if(bestTarget) mDisarmTarget = bestTarget; else mDisarmTarget = 'ATAQUE'; 
            } 
        } 
    } else { 
        if(monster.hand.length > 0) mCardKey = monster.hand.pop(); 
        else { drawCardLogic(monster, 1); if(monster.hand.length > 0) mCardKey = monster.hand.pop(); } 
    }

    // --- CORREÇÃO DO FANTASMA / DUPLICAÇÃO ---
    let handContainer = document.getElementById('player-hand'); 
    let realCardEl = handContainer.children[index]; 
    let startRect = null;
    if(realCardEl) { 
        startRect = realCardEl.getBoundingClientRect(); 
        realCardEl.style.transition = 'none';
        realCardEl.style.setProperty('opacity', '0', 'important');
        realCardEl.style.setProperty('visibility', 'hidden', 'important');
        realCardEl.innerHTML = '';
        realCardEl.style.border = 'none';
        realCardEl.style.background = 'none';
        realCardEl.style.boxShadow = 'none';
    }
    
    // ANIMAÇÃO DE VOO (AGORA COM FLIP)
    animateFly(startRect || 'player-hand', 'p-slot', cardKey, () => { 
        renderTable(cardKey, 'p-slot'); 
        updateUI(); 
    }, false, true); 

    const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 - (window.innerWidth < 768 ? 42 : 52.5) };
    animateFly(opponentHandOrigin, 'm-slot', mCardKey, () => { 
        renderTable(mCardKey, 'm-slot'); 
        setTimeout(() => resolveTurn(cardKey, mCardKey, pDisarmChoice, mDisarmTarget), 500); 
    }, false, true);
}

function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    let pDmg = 0, mDmg = 0;
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
        animateFly('p-slot', 'p-xp', pAct, () => { if(!pDead) { player.xp.push(pAct); triggerXPGlow('p'); updateUI(); } checkLevelUp(player, () => { if(!pDead) drawCardAnimated(player, 'p-deck-container', 'player-hand', () => { drawCardLogic(player, 1); turnCount++; updateUI(); isProcessing = false; }); }); });
        animateFly('m-slot', 'm-xp', mAct, () => { if(!mDead) { monster.xp.push(mAct); triggerXPGlow('m'); updateUI(); } checkLevelUp(monster, () => { if(!mDead) drawCardLogic(monster, 1); checkEndGame(); }); });
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

function checkLevelUp(u, doneCb) {
    if(u.xp.length >= 5) {
        let xpContainer = document.getElementById(u.id + '-xp'); let minis = Array.from(xpContainer.getElementsByClassName('xp-mini'));
        minis.forEach(realCard => {
            let rect = realCard.getBoundingClientRect(); let clone = document.createElement('div'); clone.className = 'xp-anim-clone';
            clone.style.left = rect.left + 'px'; clone.style.top = rect.top + 'px'; clone.style.width = rect.width + 'px'; clone.style.height = rect.height + 'px'; clone.style.backgroundImage = realCard.style.backgroundImage;
            if (u.id === 'p') clone.classList.add('xp-fly-up'); else clone.classList.add('xp-fly-down');
            document.body.appendChild(clone);
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
            if(u.hp <= 4 && opts.includes('DESCANSAR')) choice = 'DESCANSAR';
            else if(opts.includes('ATAQUE')) choice = 'ATAQUE';
            else if(opts.includes('BLOQUEIO')) choice = 'BLOQUEIO';
            if(choice === 'DESARMAR') { let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); } else { applyMastery(u, choice); }
        }
        processMasteries(u, triggers, cb);
    }
    else if(type === 'DESARMAR' && u.id === 'm') { let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }
    else { applyMastery(u, type); processMasteries(u, triggers, cb); }
}
function applyMastery(u, k) { if(k === 'ATAQUE') { u.bonusAtk++; let target = (u === player) ? monster : player; target.hp -= u.bonusAtk; showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675"); triggerDamageEffect(u !== player); checkEndGame(); } if(k === 'BLOQUEIO') u.bonusBlock++; if(k === 'DESCANSAR') { u.maxHp++; showFloatingText(u.id+'-hp-txt', "+1 MAX", "#55efc4"); } updateUI(); }
function drawCardLogic(u, qty) { for(let i=0; i<qty; i++) if(u.deck.length > 0) u.hand.push(u.deck.pop()); u.hand.sort(); }

function animateFly(startId, endId, cardKey, cb, initialDeal = false, isToTable = false) {
    let s; if (typeof startId === 'string') { let el = document.getElementById(startId); if (!el) s = { top: 0, left: 0, width: 0, height: 0 }; else s = el.getBoundingClientRect(); } else { s = startId; }
    let e = { top: 0, left: 0 }; let destEl = document.getElementById(endId); if(destEl) e = destEl.getBoundingClientRect();

    const fly = document.createElement('div');
    fly.className = `card flying-card ${CARDS_DB[cardKey].color}`;
    fly.innerHTML = `<div class="card-art" style="background-image: url('${CARDS_DB[cardKey].img}')"></div>`;
    if (isToTable) fly.classList.add('card-bounce');

    if(typeof startId !== 'string' && s.width > 0) { fly.style.width = s.width + 'px'; fly.style.height = s.height + 'px'; } 
    else { let w = window.innerWidth < 768 ? '84px' : '105px'; let h = window.innerWidth < 768 ? '120px' : '150px'; fly.style.width=w; fly.style.height=h; }

    let tableW = window.innerWidth < 768 ? '110px' : '180px';
    let tableH = window.innerWidth < 768 ? '170px' : '260px';

    fly.style.top=s.top+'px'; fly.style.left=s.left+'px';
    if(endId.includes('xp')) fly.style.transform='scale(0.3)';
    document.body.appendChild(fly); fly.offsetHeight;
    
    if(isToTable) { fly.style.width=tableW; fly.style.height=tableH; }
    fly.style.top=e.top+'px'; fly.style.left=e.left+'px';
    setTimeout(() => { fly.remove(); if(cb) cb(); }, 250);
}

function drawCardAnimated(unit, deckId, handId, cb) { 
    // LIMPEZA COMPLETA:
    if(cb) cb(); 
}

function renderTable(key, slotId) { let el = document.getElementById(slotId); el.innerHTML = ''; let card = document.createElement('div'); card.className = `card ${CARDS_DB[key].color} card-on-table`; card.innerHTML = `<div class="card-art" style="background-image: url('${CARDS_DB[key].img}')"></div>`; el.appendChild(card); }
function updateUI() { updateUnit(player); updateUnit(monster); document.getElementById('turn-txt').innerText = "TURNO " + turnCount; }

function updateUnit(u) {
    document.getElementById(u.id+'-lvl').firstChild.nodeValue = u.lvl;
    document.getElementById(u.id+'-hp-txt').innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
    let hpPct = (Math.max(0,u.hp)/u.maxHp)*100;
    let hpFill = document.getElementById(u.id+'-hp-fill'); hpFill.style.width = hpPct + '%';
    if(hpPct > 66) hpFill.style.background = "#4cd137"; else if(hpPct > 33) hpFill.style.background = "#fbc531"; else hpFill.style.background = "#e84118";
    document.getElementById(u.id+'-deck-count').innerText = u.deck.length;
    if(u===player) {
        let hc=document.getElementById('player-hand'); hc.innerHTML='';
        u.hand.forEach((k,i)=>{
            let c=document.createElement('div'); c.className=`card hand-card ${CARDS_DB[k].color}`;
            c.style.setProperty('--flare-col', CARDS_DB[k].fCol);
            if(u.disabled===k) c.classList.add('disabled-card');
            c.style.opacity = '1';
            let lethalType = checkCardLethality(k); 
            let flaresHTML = ''; for(let f=1; f<=25; f++) flaresHTML += `<div class="flare-spark fs-${f}"></div>`;
            c.innerHTML = `<div class="card-art" style="background-image: url('${CARDS_DB[k].img}')"></div><div class="flares-container">${flaresHTML}</div>`;
            c.onclick=()=>onCardClick(i); bindFixedTooltip(c,k); 
            c.onmouseenter = (e) => { bindFixedTooltip(c,k).onmouseenter(e); document.body.classList.add('focus-hand'); document.body.classList.add('cinematic-active'); if(lethalType) { isLethalHover = true; document.body.classList.add('tension-active'); } playSound('sfx-hover'); };
            c.onmouseleave = (e) => { tt.style.display='none'; document.body.classList.remove('focus-hand'); document.body.classList.remove('cinematic-active'); document.body.classList.remove('tension-active'); isLethalHover = false; };
            hc.appendChild(c); apply3DTilt(c, true);
        });
    }
    let xc=document.getElementById(u.id+'-xp'); xc.innerHTML='';
    u.xp.forEach(k=>{ let d=document.createElement('div'); d.className='xp-mini'; d.style.backgroundImage = `url('${CARDS_DB[k].img}')`; d.onmouseenter = () => { document.body.classList.add('focus-xp'); playSound('sfx-hover'); }; d.onmouseleave = () => { document.body.classList.remove('focus-xp'); }; xc.appendChild(d); });
    let mc=document.getElementById(u.id+'-masteries'); mc.innerHTML='';
    if(u.bonusAtk>0) addMI(mc, 'ATAQUE', u.bonusAtk, '#e74c3c', u.id); 
    if(u.bonusBlock>0) addMI(mc, 'BLOQUEIO', u.bonusBlock, '#00cec9', u.id); 
}

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
            if(ownerId === 'p') {
                tt.classList.add('tooltip-anim-up');
                tt.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
                tt.style.top = 'auto';
            } else {
                tt.classList.add('tooltip-anim-down');
                tt.style.top = (rect.bottom + 10) + 'px';
                tt.style.bottom = 'auto';
            }
            tt.style.left = (rect.left + rect.width/2) + 'px';
            tt.style.transform = "translateX(-50%)"; 
        }
    };
}

function addMI(parent, key, value, col, ownerId){ 
    let d = document.createElement('div'); d.className = 'mastery-icon'; 
    d.innerHTML = `${CARDS_DB[key].icon}<span class="mastery-lvl">${value}</span>`;
    d.style.borderColor = col; 
    let handlers = bindMasteryTooltip(d, key, value, ownerId);
    d.onmouseenter = handlers.onmouseenter;
    d.onmouseleave = () => { tt.style.display = 'none'; }; 
    parent.appendChild(d); 
}

function showFloatingText(eid, txt, col) { 
    let el = document.createElement('div'); 
    el.className='floating-text'; 
    el.innerText=txt; 
    el.style.color=col; 
    let parent = document.getElementById(eid);
    if(parent) {
        let rect = parent.getBoundingClientRect();
        el.style.left = (rect.left + rect.width/2) + 'px';
        el.style.top = (rect.top) + 'px';
        document.body.appendChild(el); 
    } else {
         document.body.appendChild(el);
    }
    setTimeout(()=>el.remove(), 2000); 
}

window.openModal = function(t,d,opts,cb) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-desc').innerText=d; let g=document.getElementById('modal-btns'); g.innerHTML=''; opts.forEach(o=>{ let b=document.createElement('button'); b.className='mini-btn'; b.innerText=o; b.onclick=()=>{document.getElementById('modal-overlay').style.display='none'; cb(o)}; g.appendChild(b); }); document.getElementById('modal-overlay').style.display='flex'; }
window.cancelModal = function() { document.getElementById('modal-overlay').style.display='none'; isProcessing = false; }
const tt=document.getElementById('tooltip-box');

function bindFixedTooltip(el,k) { 
    const updatePos = () => { 
        let rect = el.getBoundingClientRect(); 
        tt.style.left = (rect.left + rect.width / 2) + 'px'; 
    }; 
    return { 
        onmouseenter: (e) => { 
            showTT(k); 
            // AJUSTE DE POSIÇÃO (LIVRA O ZOOM)
            tt.style.bottom = (window.innerWidth < 768 ? '280px' : '420px'); 
            tt.style.top = 'auto'; 
            
            tt.classList.remove('tooltip-anim-up'); 
            tt.classList.remove('tooltip-anim-down'); 
            tt.classList.add('tooltip-anim-up'); 
            updatePos(); 
            el.addEventListener('mousemove', updatePos); 
        } 
    }; 
}

function showTT(k) {
    let db = CARDS_DB[k];
    document.getElementById('tt-title').innerHTML = k; 
    if (db.customTooltip) {
        let content = db.customTooltip;
        let currentLvl = (typeof player !== 'undefined' && player.lvl) ? player.lvl : 1;
        content = content.replace('{PLAYER_LVL}', currentLvl);
        let bonusBlock = (typeof player !== 'undefined' && player.bonusBlock) ? player.bonusBlock : 0;
        let reflectDmg = 1 + bonusBlock;
        content = content.replace('{PLAYER_BLOCK_DMG}', reflectDmg);
        document.getElementById('tt-content').innerHTML = content;
    } else {
        document.getElementById('tt-content').innerHTML = `
            <span class='tt-label'>Base</span><span class='tt-val'>${db.base}</span>
            <span class='tt-label' style='color:var(--accent-orange)'>Bônus</span><span class='tt-val'>${db.bonus}</span>
            <span class='tt-label' style='color:var(--accent-purple)'>Maestria</span><span class='tt-val'>${db.mastery}</span>
        `;
    }
    tt.style.display = 'block';
}

function apply3DTilt(element, isHand = false) { 
    if(window.innerWidth < 768) return; 
    
    element.addEventListener('mousemove', (e) => { 
        const rect = element.getBoundingClientRect(); 
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top; 
        
        // Calcula a posição do mouse em porcentagem (-0.5 a 0.5)
        const xPct = (x / rect.width) - 0.5; 
        const yPct = (y / rect.height) - 0.5; 
        
        // --- NOVO: Envia a posição para o CSS criar o brilho ---
        element.style.setProperty('--rx', xPct);
        element.style.setProperty('--ry', yPct);

        // Zoom 2.3 e Translate -140px
        let lift = isHand ? 'translateY(-140px) scale(2.3)' : 'scale(1.1)'; 
        
        let rotate = `rotateX(${yPct * -40}deg) rotateY(${xPct * 40}deg)`; 
        if(element.classList.contains('disabled-card')) rotate = `rotateX(${yPct * -10}deg) rotateY(${xPct * 10}deg)`; 
        
        element.style.transform = `${lift} ${rotate}`; 
        
        let art = element.querySelector('.card-art'); 
        if(art) art.style.backgroundPosition = `${50 + (xPct * 20)}% ${50 + (yPct * 20)}%`; 
    }); 
    
    element.addEventListener('mouseleave', () => { 
        element.style.transform = isHand ? 'translateY(0) scale(1)' : 'scale(1)'; 
        let art = element.querySelector('.card-art'); 
        if(art) art.style.backgroundPosition = 'center'; 
        
        // Reseta o brilho quando tira o mouse
        element.style.setProperty('--rx', 0);
        element.style.setProperty('--ry', 0);
    }); 
}
