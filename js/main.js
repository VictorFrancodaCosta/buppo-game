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
let isProcessing = false; let turnCount = 1; let playerHistory = []; let masterVol = 1.0; let musicVolMult = 1.0; let isLethalHover = false; let mixerInterval = null;
const fadeIntervals = {}; // Controle de timers de áudio

// =======================
// CONTROLES DE ÁUDIO & FADE (CORRIGIDO)
// =======================
window.isMuted = false;

window.toggleMute = function() {
    console.log("CLIQUE NO SOM DETECTADO!");
    window.isMuted = !window.isMuted;
    const btn = document.getElementById('btn-sound');
    
    const iconOn = `<svg viewBox="0 0 24 24" style="width:100%; height:100%; fill:#eee;"><path d="M3,9v6h4l5,5V4L7,9H3z M16.5,12c0-1.77-1.02-3.29-2.5-4.03v8.05C15.48,15.29,16.5,13.77,16.5,12z M14,3.23v2.06 c2.89,0.86,5,3.54,5,6.71s-2.11,5.85-5,6.71v2.06c4.01-0.91,7-4.49,7-8.77S18.01,4.14,14,3.23z"/></svg>`;
    const iconOff = `<svg viewBox="0 0 24 24" style="width:100%; height:100%; fill:#eee;"><path d="M16.5,12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45,2.45C16.42,12.5,16.5,12.26,16.5,12z M19,12c0,0.94-0.2,1.82-0.54,2.64l1.51,1.51C20.63,14.91,21,13.5,21,12c0-4.28-2.99-7.86-7-8.77v2.06C16.89,6.15,19,8.83,19,12z M4.27,3L3,4.27l4.56,4.56C7.39,8.91,7.2,8.96,7,9H3v6h4l5,5v-6.73l4.25,4.25c-0.67,0.52-1.42,0.93-2.25,1.18v2.06c1.38-0.31,2.63-0.95,3.69-1.81L19.73,21L21,19.73L9,7.73V4L4.27,3z M12,4L9.91,6.09L12,8.18V4z"/></svg>`;

    if(btn) {
        btn.innerHTML = window.isMuted ? iconOff : iconOn;
    }

    Object.values(audios).forEach(audio => {
        if(audio) audio.muted = window.isMuted;
    });
}

function switchBackgroundMusic(mode) {
    const menuMusic = audios['bgm-menu'];
    const battleMusic = audios['bgm-loop'];
    const targetVolume = 0.5 * (window.masterVol || 1.0); 

    // Função Auxiliar de Fade
    const fadeAudio = (audio, type) => {
        if (!audio) return;
        const id = audio.id; 

        // 1. Limpa fade anterior
        if (fadeIntervals[id]) clearInterval(fadeIntervals[id]);

        if (type === 'OUT') {
            // FADE OUT (Diminuir)
            fadeIntervals[id] = setInterval(() => {
                // Matemática segura: garante que não fique negativo ou quebre
                if (audio.volume > 0.05) {
                    audio.volume = Math.max(0, audio.volume - 0.05); 
                } else {
                    audio.volume = 0;
                    audio.pause();
                    audio.currentTime = 0; // Reseta música
                    clearInterval(fadeIntervals[id]); 
                }
            }, 60); 

            // --- TRAVA DE SEGURANÇA (HARD STOP) ---
            // Garante que a música pare em 1.5s, mesmo se o fade falhar
            setTimeout(() => {
                if(audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }, 1500);
        } 
        else if (type === 'IN') {
            // FADE IN (Aumentar)
            if (window.isMuted) return; 

            audio.volume = 0;
            audio.play().catch(()=>{}); 

            fadeIntervals[id] = setInterval(() => {
                if (audio.volume < targetVolume - 0.05) {
                    audio.volume = Math.min(targetVolume, audio.volume + 0.05); 
                } else {
                    audio.volume = targetVolume;
                    clearInterval(fadeIntervals[id]); 
                }
            }, 60);
        }
    };

    // Gerenciamento dos Canais
    if (mode === 'MENU') {
        fadeAudio(battleMusic, 'OUT'); 
        if (menuMusic.paused) fadeAudio(menuMusic, 'IN'); 
    } 
    else if (mode === 'BATTLE') {
        fadeAudio(menuMusic, 'OUT'); 
        if (battleMusic.paused) fadeAudio(battleMusic, 'IN'); 
    }
    else if (mode === 'SILENCE') {
        fadeAudio(menuMusic, 'OUT');
        fadeAudio(battleMusic, 'OUT');
    }
}

window.playNavSound = function() { 
    let s = audios['sfx-nav']; 
    if(s) { 
        s.currentTime = 0; 
        s.play().catch(()=>{}); 
    } 
};

// =======================
// NAVEGAÇÃO E TRANSIÇÃO
// =======================
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
    
    // 1. Sobe a cortina
    if(transScreen) transScreen.classList.add('active');

    // 2. Aguarda cobrir a tela (500ms)
    setTimeout(() => {
        // --- TROCA DE MÚSICA (CRUCIAL: DENTRO DA CORTINA) ---
        switchBackgroundMusic('BATTLE');

        let bg = document.getElementById('game-background');
        if(bg) bg.classList.remove('lobby-mode');

        window.showScreen('game-screen');
        
        resetUnit(player); resetUnit(monster); turnCount = 1; playerHistory = [];
        drawCardLogic(monster, 6); drawCardLogic(player, 6); updateUI();
        
        const handEl = document.getElementById('player-hand'); 
        if(handEl) Array.from(handEl.children).forEach(c => c.style.opacity = '0');

        // 3. Abre a cortina
        setTimeout(() => {
            if(transScreen) transScreen.classList.remove('active');
            setTimeout(() => { startGameFlow(true); }, 500);
        }, 1500);

    }, 500); 
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) {
        window.showScreen('start-screen');
        switchBackgroundMusic('MENU');
        return;
    }

    let bg = document.getElementById('game-background');
    if(bg) bg.classList.add('lobby-mode');
    
    switchBackgroundMusic('MENU');
    createLobbyFlares();

    // Lógica do Firebase
    const userRef = doc(db, "players", currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
        await setDoc(userRef, {
            name: currentUser.displayName, email: currentUser.email, photo: currentUser.photoURL,
            totalWins: 0, totalMatches: 0, score: 0, joinedAt: new Date()
        });
        document.getElementById('lobby-username').innerText = `OLÁ, ${currentUser.displayName.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: 0 | PONTOS: 0`;
    } else {
        const d = userSnap.data();
        document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;
        await updateDoc(userRef, { lastLogin: new Date() });
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

// =======================
// LÓGICA DO JOGO (GAME LOOP)
// =======================
function startGameFlow(skipReset = false) {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    startCinematicLoop(); 
    
    if(!skipReset) {
        resetUnit(player); resetUnit(monster); turnCount = 1; playerHistory = [];
        drawCardLogic(monster, 6); 
        drawCardLogic(player, 6); 
        updateUI();
        const handEl = document.getElementById('player-hand'); 
        if(handEl) Array.from(handEl.children).forEach(c => c.style.opacity = '0');
    }
    
    setTimeout(() => { dealAllInitialCards(); }, 50);
}

function checkEndGame(){ 
    if(player.hp<=0 || monster.hp<=0) { 
        isProcessing = true; 
        isLethalHover = false; 
        
        switchBackgroundMusic('SILENCE'); // Fade out da batalha

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

// =======================
// FIREBASE & LOGIN
// =======================
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
    signOut(auth).then(() => {
        location.reload(); 
    });
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
                score: (data.score || 0) + 100,
                totalMatches: (data.totalMatches || 0) + 1
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
                totalMatches: (data.totalMatches || 0) + 1,
                score: (data.score || 0) + 10 
            });
        }
    } catch(e) {}
};

window.restartMatch = function() {
    document.getElementById('end-screen').classList.remove('visible');
    setTimeout(startGameFlow, 50);
}

window.abandonMatch = function() {
     if(document.getElementById('game-screen').classList.contains('active')) {
         window.toggleConfig(); 
         if(window.confirm("Tem certeza que deseja sair? Contará como derrota.")) {
             window.registrarDerrotaOnline();
             window.goToLobby(false);
         }
     }
}

// =======================
// CARREGAMENTO & EFEITOS
// =======================
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

        // Toca música de menu no primeiro clique
        document.body.addEventListener('click', () => { 
            const menuMusic = audios['bgm-menu'];
            // Verifica se não está mutado e se não está em batalha
            if (menuMusic && menuMusic.paused && !window.isMuted) { 
                const battleMusic = audios['bgm-loop'];
                if(battleMusic && battleMusic.paused) { // Só toca menu se a batalha não estiver rolando
                    menuMusic.volume = 0.5 * (window.masterVol || 1.0);
                    menuMusic.play().catch(()=>{}); 
                }
            } 
        }, { once: true });
    }
}

window.onload = function() {
    preloadGame();
    // Conecta botão de som
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
function updateAudioMixer() { const cineAudio = audios['sfx-cine']; const bgmAudio = audios['bgm-loop']; if(!cineAudio || !bgmAudio) return; const maxCine = 0.6 * masterVol; const maxBgm = 0.5 * musicVolMult * masterVol; const dimmedBgm = 0.1 * musicVolMult * masterVol; let targetCine = isLethalHover ? maxCine : 0; let targetBgm = isLethalHover ? dimmedBgm : maxBgm; if(cineAudio.volume < targetCine) cineAudio.volume = Math.min(targetCine, cineAudio.volume + 0.05); else if(cineAudio.volume > targetCine) cineAudio.volume = Math.max(targetCine, cineAudio.volume - 0.05); if(bgmAudio.volume < targetBgm) bgmAudio.volume = Math.min(targetBgm, bgmAudio.volume + 0.02); else if(bgmAudio.volume > targetBgm) bgmAudio.volume = Math.max(targetBgm, bgmAudio.volume - 0.02); }

window.toggleConfig = function() { let p = document.getElementById('config-panel'); if(p.style.display==='flex'){ p.style.display='none'; p.classList.remove('active'); document.body.classList.remove('config-mode'); } else { p.style.display='flex'; p.classList.add('active'); document.body.classList.add('config-mode'); } }
document.addEventListener('click', function(e) { const panel = document.getElementById('config-panel'); const btn = document.getElementById('btn-config-toggle'); if (panel && panel.classList.contains('active') && !panel.contains(e.target) && (btn && !btn.contains(e.target))) window.toggleConfig(); });

window.updateVol = function(type, val) { if(type==='master') masterVol = parseFloat(val); if(type==='music') musicVolMult = parseFloat(val); ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-block', 'sfx-heal', 'sfx-levelup', 'sfx-hover', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'sfx-nav'].forEach(k => { if(audios[k]) audios[k].volume = 0.8 * masterVol; }); }
function playSound(key) { if(audios[key]) { audios[key].currentTime = 0; audios[key].play().catch(e => console.log("Audio prevented:", e)); } }

// =======================
// VISUAL FX E AUXILIARES
// =======================
function initAmbientParticles() { const container = document.getElementById('ambient-particles'); if(!container) return; for(let i=0; i<50; i++) { let d = document.createElement('div'); d.className = 'ember'; d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (5 + Math.random() * 5) + 's'; d.style.setProperty('--mx', (Math.random() - 0.5) * 50 + 'px'); container.appendChild(d); } }
initAmbientParticles();

function apply3DTilt(element, isHand = false) { if(window.innerWidth < 768) return; element.addEventListener('mousemove', (e) => { const rect = element.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const xPct = (x / rect.width) - 0.5; const yPct = (y / rect.height) - 0.5; let lift = isHand ? 'translateY(-100px) scale(1.8)' : 'scale(1.1)'; let rotate = `rotateX(${yPct * -40}deg) rotateY(${xPct * 40}deg)`; if(element.classList.contains('disabled-card')) rotate = `rotateX(${yPct * -10}deg) rotateY(${xPct * 10}deg)`; element.style.transform = `${lift} ${rotate}`; let art = element.querySelector('.card-art'); if(art) art.style.backgroundPosition = `${50 + (xPct * 20)}% ${50 + (yPct * 20)}%`; }); element.addEventListener('mouseleave', () => { element.style.transform = isHand ? 'translateY(0) scale(1)' : 'scale(1)'; let art = element.querySelector('.card-art'); if(art) art.style.backgroundPosition = 'center'; }); }
function spawnParticles(x, y, color) { for(let i=0; i<15; i++) { let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color; p.style.left = x + 'px'; p.style.top = y + 'px'; let angle = Math.random() * Math.PI * 2; let vel = 50 + Math.random() * 100; p.style.setProperty('--tx', `${Math.cos(angle)*vel}px`); p.style.setProperty('--ty', `${Math.sin(angle)*vel}px`); document.body.appendChild(p); setTimeout(() => p.remove(), 800); } }

function triggerDamageEffect(isPlayer, playAudio = true) { try { if(playAudio) playSound('sfx-hit'); let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId); if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#ff4757'); } document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 400); let ov = document.getElementById('dmg-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 150); } } catch(e) {} }
function triggerCritEffect() { let ov = document.getElementById('crit-overlay'); if(ov) { ov.style.opacity = '1'; document.body.style.filter = "grayscale(0.8) contrast(1.2)"; document.body.style.transition = "filter 0.05s"; setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => { document.body.style.transition = "filter 0.5s"; document.body.style.filter = "none"; }, 800); }, 100); } }
function triggerHealEffect(isPlayer) { try { let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId); if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#2ecc71'); } let ov = document.getElementById('heal-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 300); } } catch(e) {} }
function triggerBlockEffect() { try { playSound('sfx-block'); let ov = document.getElementById('block-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 200); } document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 200); } catch(e) {} }
function triggerXPGlow(unitId) { let xpArea = document.getElementById(unitId + '-xp'); if(xpArea) { xpArea.classList.add('xp-glow'); setTimeout(() => xpArea.classList.remove('xp-glow'), 600); } }
function showCenterText(txt, col) { let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; if(col) el.style.color = col; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }

window.openModal = function(t,d,opts,cb) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-desc').innerText=d; let g=document.getElementById('modal-btns'); g.innerHTML=''; opts.forEach(o=>{ let b=document.createElement('button'); b.className='mini-btn'; b.innerText=o; b.onclick=()=>{document.getElementById('modal-overlay').style.display='none'; cb(o)}; g.appendChild(b); }); document.getElementById('modal-overlay').style.display='flex'; }
window.cancelModal = function() { document.getElementById('modal-overlay').style.display='none'; isProcessing = false; }
const tt=document.getElementById('tooltip-box');
function bindFixedTooltip(el,k) { const updatePos = () => { let rect = el.getBoundingClientRect(); tt.style.left = (rect.left + rect.width / 2) + 'px'; }; return { onmouseenter: (e) => { showTT(k); tt.style.bottom = (window.innerWidth < 768 ? '160px' : '320px'); tt.style.top = 'auto'; tt.classList.remove('tooltip-anim-up'); tt.classList.remove('tooltip-anim-down'); tt.classList.add('tooltip-anim-up'); updatePos(); el.addEventListener('mousemove', updatePos); } }; }
function showTT(k) { let db=CARDS_DB[k]; document.getElementById('tt-title').innerHTML = k; document.getElementById('tt-content').innerHTML=`<span class='tt-label'>Base</span><span class='tt-val'>${db.base}</span><span class='tt-label' style='color:var(--accent-orange)'>Bônus</span><span class='tt-val'>${db.bonus}</span><span class='tt-label' style='color:var(--accent-purple)'>Maestria</span><span class='tt-val'>${db.mastery}</span>`; tt.style.display='block'; }
