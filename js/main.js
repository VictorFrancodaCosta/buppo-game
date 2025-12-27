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

// --- COFRE DE ASSETS ---
window.gameAssets = []; 

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
        'https://i.ibb.co/KzVqKR6D/MESA-DE-JOGO.png',
        'https://i.ibb.co/Dfpkhhtr/ARTE-SAGU-O.png',
        'https://i.ibb.co/zHZsCnyB/QUADRO-DO-SAGU-O.png',
        'https://i.ibb.co/fVRc0vLs/Gemini-Generated-Image-ilb8d0ilb8d0ilb8.png',
        'https://i.ibb.co/GSWpX5C/PLACA-SELE-O.png',
        'https://i.ibb.co/fzr36qbR/SELE-O-DE-DECK-CAVALEIRO.png',
        'https://i.ibb.co/bjBcKN6c/SELE-O-DE-DECK-MAGO.png',
        'https://i.ibb.co/JFpgxFY1/SELE-O-DE-DECK-CAVALEIRO.png',
        'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png',
        'https://i.ibb.co/jdZmTHC/CARDBACK.png',
        'https://i.ibb.co/jkvc8kRf/01-ATAQUE.png',
        'https://i.ibb.co/zhFYHsxQ/02-BLOQUEIO.png',
        'https://i.ibb.co/PzV81m5C/03-DESCANSAR.png',
        'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png',
        'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png',
        'https://i.ibb.co/xqbKSbgx/mesa-com-deck.png',
        MAGE_ASSETS.ATAQUE, MAGE_ASSETS.BLOQUEIO, MAGE_ASSETS.DESCANSAR, 
        MAGE_ASSETS.DESARMAR, MAGE_ASSETS.TREINAR, MAGE_ASSETS.DECK_IMG, MAGE_ASSETS.DECK_SELECT
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

let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let isProcessing = false; let turnCount = 1; let playerHistory = []; 
window.masterVol = 1.0; 
let isLethalHover = false; 
let mixerInterval = null;

// --- ESTADOS GLOBAIS ---
window.isMatchStarting = false;
window.currentDeck = 'knight';

// --- HELPER: RETORNA ARTE CORRETA ---
function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) {
        return MAGE_ASSETS[cardKey];
    }
    return CARDS_DB[cardKey].img;
}

const MusicController = {
    currentTrackId: null,
    fadeTimer: null,
    play(trackId) {
        if (this.currentTrackId === trackId) {
            if (audios[trackId] && audios[trackId].paused && !window.isMuted) {
                const audio = audios[trackId];
                audio.volume = 0;
                audio.play().catch(e => console.warn("Autoplay prevent", e));
                this.fadeIn(audio, 0.5 * window.masterVol);
            }
            return; 
        } 
        const maxVol = 0.5 * window.masterVol;
        if (this.currentTrackId && audios[this.currentTrackId]) {
            const oldAudio = audios[this.currentTrackId];
            this.fadeOut(oldAudio);
        }
        if (trackId && audios[trackId]) {
            const newAudio = audios[trackId];
            newAudio.currentTime = 0;
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

let lastHoverTime = 0;
window.playUIHoverSound = function() {
    let now = Date.now();
    if (now - lastHoverTime < 50) return; 

    let base = audios['sfx-ui-hover'];
    if(base && !window.isMuted) { 
        let s = base.cloneNode(); 
        s.volume = 0.3 * (window.masterVol || 1.0);
        s.play().catch(()=>{}); 
        lastHoverTime = now;
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
    window.showScreen('deck-selection-screen');
};

window.selectDeck = function(deckType) {
    if(audios['sfx-deck-select']) {
        audios['sfx-deck-select'].currentTime = 0;
        audios['sfx-deck-select'].play().catch(()=>{});
    }

    window.currentDeck = deckType; 
    
    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))";
            opt.style.zIndex = "100";
            const img = opt.querySelector('img');
            if(img) img.style.filter = "grayscale(0%) brightness(1.2)";
        } else {
            opt.style.transition = "all 0.3s ease";
            opt.style.transform = "scale(0.8) translateY(10px)";
            opt.style.opacity = "0.2";
            opt.style.filter = "grayscale(100%)";
        }
    });

    setTimeout(() => {
        const selectionScreen = document.getElementById('deck-selection-screen');
        selectionScreen.style.transition = "opacity 0.5s";
        selectionScreen.style.opacity = "0";

        setTimeout(() => {
            window.transitionToGame();
            setTimeout(() => {
                selectionScreen.style.opacity = "1";
                options.forEach(opt => {
                    opt.style = "";
                    const img = opt.querySelector('img');
                    if(img) img.style = "";
                });
            }, 500);
        }, 500);
    }, 400);
};

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
    isProcessing = false; // Garante reset
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

// --- FUNÇÃO CRÍTICA RESTAURADA AO ORIGINAL ---
function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    startCinematicLoop(); 
    
    // ATIVA TRAVA DE SEGURANÇA
    window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand');
    if (handEl) {
        handEl.innerHTML = '';
        handEl.classList.add('preparing'); 
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
    console.log("Iniciando Preload de " + totalAssets + " recursos...");
    
    ASSETS_TO_LOAD.images.forEach(src => { 
        let img = new Image(); 
        img.src = src; 
        window.gameAssets.push(img);
        
        img.onload = () => updateLoader(); 
        img.onerror = () => {
            console.warn("Erro ao carregar imagem: " + src);
            updateLoader(); 
        }; 
    });

    ASSETS_TO_LOAD.audio.forEach(a => { 
        let s = new Audio(); 
        s.src = a.src; 
        s.preload = 'auto'; 
        if(a.loop) s.loop = true; 
        audios[a.id] = s; 
        window.gameAssets.push(s);

        s.onloadedmetadata = () => updateLoader(); 
        s.onerror = () => {
            console.warn("Erro ao carregar áudio: " + a.src);
            updateLoader();
        }; 
        
        setTimeout(() => { 
            if(s.readyState === 0) updateLoader(); 
        }, 3000); 
    });
}

function updateLoader() {
    assetsLoaded++; 
    let pct = Math.min(100, (assetsLoaded / totalAssets) * 100); 
    const fill = document.getElementById('loader-fill');
    if(fill) fill.style.width = pct + '%';
    
    if(assetsLoaded >= totalAssets) {
        console.log("Preload completo!");
        
        // --- FIX AUDIO VOLUME: Força a mixagem correta no início ---
        if(window.updateVol) window.updateVol('master', window.masterVol || 1.0);
        
        setTimeout(() => {
            const loading = document.getElementById('loading-screen');
            if(loading) {
                loading.style.opacity = '0';
                setTimeout(() => loading.style.display = 'none', 500);
            }
            if(!window.hoverLogicInitialized) {
                initGlobalHoverLogic();
                window.hoverLogicInitialized = true;
            }
        }, 800); 
        
        document.body.addEventListener('click', () => { 
            if (!MusicController.currentTrackId || (audios['bgm-menu'] && audios['bgm-menu'].paused)) {
                MusicController.play('bgm-menu');
            }
        }, { once: true });
    }
}

function initGlobalHoverLogic() {
    let lastTarget = null;
    document.body.addEventListener('mouseover', (e) => {
        const selector = 'button, .circle-btn, #btn-fullscreen, .deck-option, .mini-btn';
        const target = e.target.closest(selector);
        if (target && target !== lastTarget) {
            lastTarget = target;
            window.playUIHoverSound();
        } else if (!target) {
            lastTarget = null;
        }
    });
}

preloadGame();

window.onload = function() {
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
    ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-hit-mage', 'sfx-block', 'sfx-block-mage', 
     'sfx-heal', 'sfx-levelup', 'sfx-train', 'sfx-disarm', 'sfx-deck-select', 
     'sfx-hover', 'sfx-ui-hover', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'sfx-nav'].forEach(k => { 
        if(audios[k]) {
            let vol = window.masterVol || 1.0;
            // --- NOVA MIXAGEM DE ÁUDIO ---
            if(k === 'sfx-ui-hover') {
                audios[k].volume = 0.3 * vol;
            } else if (k === 'sfx-levelup') {
                 // VOLUME BOOST: Mantém em 100% do master
                audios[k].volume = 1.0 * vol;
            } else if (k === 'sfx-train') {
                // VOLUME REDUZIDO: 50%
                audios[k].volume = 0.5 * vol;
            } else {
                audios[k].volume = 0.8 * vol;
            }
        }
    }); 
}
function playSound(key) { 
    if(audios[key]) { 
        if (key === 'sfx-levelup') {
            audios[key].volume = 1.0 * (window.masterVol || 1.0);
            audios[key].currentTime = 0; 
            audios[key].play().catch(e => console.log("Audio prevented:", e));
            let clone = audios[key].cloneNode();
            clone.volume = audios[key].volume;
            clone.play().catch(()=>{});
        } else {
            audios[key].currentTime = 0; 
            audios[key].play().catch(e => console.log("Audio prevented:", e)); 
        }
    } 
}

function initAmbientParticles() { const container = document.getElementById('ambient-particles'); if(!container) return; for(let i=0; i<50; i++) { let d = document.createElement('div'); d.className = 'ember'; d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (5 + Math.random() * 5) + 's'; d.style.setProperty('--mx', (Math.random() - 0.5) * 50 + 'px'); container.appendChild(d); } }
initAmbientParticles();

function spawnParticles(x, y, color) { for(let i=0; i<15; i++) { let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color; p.style.left = x + 'px'; p.style.top = y + 'px'; let angle = Math.random() * Math.PI * 2; let vel = 50 + Math.random() * 100; p.style.setProperty('--tx', `${Math.cos(angle)*vel}px`); p.style.setProperty('--ty', `${Math.sin(angle)*vel}px`); document.body.appendChild(p); setTimeout(() => p.remove(), 800); } }

// === MODIFICADO: CHAMADA PARA EFFECTS.JS APENAS SE FOR JOGADOR ===
function triggerDamageEffect(isPlayer, playAudio = true) { 
    try { 
        if(playAudio) {
            if(!isPlayer && window.currentDeck === 'mage') {
                playSound('sfx-hit-mage');
            } else {
                playSound('sfx-hit'); 
            }
        } 
        
        let elId = isPlayer ? 'p-slot' : 'm-slot'; 
        let slot = document.getElementById(elId); 
        if(slot) { 
            let r = slot.getBoundingClientRect(); 
            if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#ff4757'); 
        } 

        // CHAMADA PARA O NOVO SISTEMA VISUAL
        if(isPlayer && window.triggerMassiveDamage) {
            window.triggerMassiveDamage(); // Chama do effects.js (SÓ JOGADOR)
        } else {
            // Fallback para o inimigo (Tremor simples)
            document.body.classList.add('shake-screen'); 
            setTimeout(() => document.body.classList.remove('shake-screen'), 400); 
            let ov = document.getElementById('dmg-overlay'); 
            if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 150); } 
        }

    } catch(e) { console.error(e); } 
}

function triggerCritEffect() { let ov = document.getElementById('crit-overlay'); if(ov) { ov.style.opacity = '1'; document.body.style.filter = "grayscale(0.8) contrast(1.2)"; document.body.style.transition = "filter 0.05s"; setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => { document.body.style.transition = "filter 0.5s"; document.body.style.filter = "none"; }, 800); }, 100); } }

// === MODIFICADO: CHAMADA PARA EFFECTS.JS APENAS SE FOR JOGADOR ===
function triggerHealEffect(isPlayer) { 
    try { 
        if(isPlayer && window.triggerHealEffect) {
            window.triggerHealEffect(); // Luz sagrada (SÓ JOGADOR)
            playSound('sfx-heal');
        } else {
            // Fallback Inimigo
            let elId = isPlayer ? 'p-slot' : 'm-slot'; 
            let slot = document.getElementById(elId); 
            if(slot) { 
                let r = slot.getBoundingClientRect(); 
                if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#2ecc71'); 
            } 
            let ov = document.getElementById('heal-overlay'); 
            if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 300); } 
            playSound('sfx-heal'); 
        }
    } catch(e) {} 
}

// === MODIFICADO: LOGICA DO BLOQUEIO ===
// Esta função agora recebe:
// isPlayerBlocking = true -> Jogador Bloqueia (Ataque Inimigo Falha)
// isPlayerBlocking = false -> Inimigo Bloqueia (Ataque Jogador Falha)
function triggerBlockEffect(isPlayerBlocking) { 
    try { 
        // Som toca sempre
        if(isPlayerBlocking && window.currentDeck === 'mage') {
             playSound('sfx-block-mage');
        } else {
             playSound('sfx-block'); 
        }
        
        // --- JUICY FX: SÓ QUANDO O JOGADOR É BLOQUEADO ---
        // "SOMENTE quando o usuário tem seu ataque bloqueado pelo inimigo"
        // Isso significa: isPlayerBlocking == false (Inimigo está bloqueando)
        if(!isPlayerBlocking && window.triggerBlockEffect) {
            window.triggerBlockEffect(); // Tela recua, onda de choque
        } else {
            // Se o Jogador bloqueou (isPlayerBlocking == true), 
            // NÃO chama o efeito visual grande, talvez apenas um shake leve ou nada.
            // O usuario pediu: "(Não quando o usuário bloqueia)"
            
            // Mantemos um feedback visual mínimo ou nada se preferir. 
            // Vamos deixar apenas o shake leve padrão se for o inimigo bloqueando (fallback)
            // Mas como estamos no 'else' (Jogador bloqueou), não fazemos nada visual agressivo.
        }
    } catch(e) {} 
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
    
    animateFly(startRect || 'player-hand', 'p-slot', cardKey, () => { 
        renderTable(cardKey, 'p-slot', true); 
        updateUI(); 
    }, false, true, true); 

    const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 - (window.innerWidth < 768 ? 42 : 52.5) };
    animateFly(opponentHandOrigin, 'm-slot', mCardKey, () => { 
        renderTable(mCardKey, 'm-slot', false); 
        setTimeout(() => resolveTurn(cardKey, mCardKey, pDisarmChoice, mDisarmTarget), 500); 
    }, false, true, false);
}

function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    let pDmg = 0, mDmg = 0;
    
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train');
    if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');

    if(mAct === 'ATAQUE') { pDmg += monster.lvl; }
    if(pAct === 'ATAQUE') { mDmg += player.lvl; }
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') { mDmg += (1 + player.bonusBlock); } }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') { pDmg += (1 + monster.bonusBlock); } }

    let clash = false;
    let pBlocks = (pAct === 'BLOQUEIO' && mAct === 'ATAQUE'); 
    let mBlocks = (mAct === 'BLOQUEIO' && pAct === 'ATAQUE');
    
    // === LÓGICA DE BLOQUEIO AJUSTADA ===
    if(pBlocks) { 
        clash = true; 
        // Jogador Bloqueou: true -> triggerBlockEffect(true) -> SEM ANIMAÇÃO VISUAL (Só som)
        triggerBlockEffect(true); 
    }
    else if(mBlocks) { 
        clash = true; 
        // Inimigo Bloqueou: false -> triggerBlockEffect(false) -> COM ANIMAÇÃO VISUAL (Recuo + Onda)
        triggerBlockEffect(false); 
    }

    let nextPlayerDisabled = null; let nextMonsterDisabled = null;
    if(mAct === 'DESARMAR') { if(mDisarmTarget) nextPlayerDisabled = mDisarmTarget; else nextPlayerDisabled = 'ATAQUE'; }
    if(pAct === 'DESARMAR') { nextMonsterDisabled = pDisarmChoice; }
    if(pAct === 'DESARMAR' && mAct === 'DESARMAR') { nextPlayerDisabled = null; nextMonsterDisabled = null; showCenterText("ANULADO", "#aaa"); }

    player.disabled = nextPlayerDisabled; monster.disabled = nextMonsterDisabled;
    if(pDmg >= 4 || mDmg >= 4) triggerCritEffect();

    if(pDmg > 0) { 
        player.hp -= pDmg; 
        showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); 
        let soundOn = !(clash && mAct === 'BLOQUEIO'); 
        // Dano no Jogador -> triggerDamageEffect(true) -> ANIMAÇÃO DE SANGUE
        triggerDamageEffect(true, soundOn); 
    }
    if(mDmg > 0) { 
        monster.hp -= mDmg; 
        showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); 
        let soundOn = !(clash && pAct === 'BLOQUEIO'); 
        // Dano no Inimigo -> triggerDamageEffect(false) -> SEM SANGUE (Só tremor)
        triggerDamageEffect(false, soundOn); 
    }
    
    updateUI();
    let pDead = player.hp <= 0, mDead = monster.hp <= 0;
    
    if(!pDead && pAct === 'DESCANSAR') { 
        let healAmount = (pDmg === 0) ? 3 : 2; 
        player.hp = Math.min(player.maxHp, player.hp + healAmount); 
        showFloatingText('p-lvl', `+${healAmount} HP`, "#55efc4"); 
        // Cura no Jogador -> triggerHealEffect(true) -> ANIMAÇÃO DE LUZ
        triggerHealEffect(true); 
    }
    if(!mDead && mAct === 'DESCANSAR') { 
        let healAmount = (mDmg === 0) ? 3 : 2; 
        monster.hp = Math.min(monster.maxHp, monster.hp + healAmount); 
        // Cura no Inimigo -> triggerHealEffect(false) -> SEM LUZ (Só partículas)
        triggerHealEffect(false); 
    }

    function handleExtraXP(u) { 
        if(u.deck.length > 0) { 
            let card = u.deck.pop(); 
            animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { 
                u.xp.push(card); triggerXPGlow(u.id); updateUI(); 
            }, false, false, (u.id === 'p')); 
        } 
    }
    if(!pDead && pAct === 'TREINAR') handleExtraXP(player); if(!mDead && mAct === 'TREINAR') handleExtraXP(monster);
    if(!pDead && pAct === 'ATAQUE' && mAct === 'DESCANSAR') handleExtraXP(player); if(!mDead && mAct === 'ATAQUE' && pAct === 'DESCANSAR') handleExtraXP(monster);

    setTimeout(() => {
        animateFly('p-slot', 'p-xp', pAct, () => { if(!pDead) { player.xp.push(pAct); triggerXPGlow('p'); updateUI(); } checkLevelUp(player, () => { if(!pDead) drawCardAnimated(player, 'p-deck-container', 'player-hand', () => { drawCardLogic(player, 1); turnCount++; updateUI(); isProcessing = false; }); }); }, false, false, true);
        
        animateFly('m-slot', 'm-xp', mAct, () => { if(!mDead) { monster.xp.push(mAct); triggerXPGlow('m'); updateUI(); } checkLevelUp(monster, () => { if(!mDead) drawCardLogic(monster, 1); checkEndGame(); }); }, false, false, false);
        
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

// --- CÓDIGO QUE FALTAVA (COLE NO FINAL DO MAIN.JS) ---

function resetUnit(u) {
    u.hp = u.maxHp;
    u.xp = [];
    u.hand = [];
    u.deck = [];
    u.disabled = null;
    u.bonusBlock = 0;
    u.bonusAtk = 0;
    
    // Reconstrói o deck baseado no template
    for (let key in DECK_TEMPLATE) {
        let count = DECK_TEMPLATE[key];
        for (let i = 0; i < count; i++) u.deck.push(key);
    }
    // Embaralha
    for (let i = u.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [u.deck[i], u.deck[j]] = [u.deck[j], u.deck[i]];
    }
}

function drawCardLogic(u, amount) {
    for(let i=0; i<amount; i++) {
        if(u.deck.length === 0) {
            // Recicla XP se o deck acabar
            if(u.xp.length > 0) {
                u.deck = [...u.xp];
                u.xp = [];
                // Re-embaralha
                for (let k = u.deck.length - 1; k > 0; k--) {
                    const j = Math.floor(Math.random() * (k + 1));
                    [u.deck[k], u.deck[j]] = [u.deck[j], u.deck[k]];
                }
            } else {
                // Se não tem XP nem deck, cria cartas básicas (failsafe)
                u.deck = ['ATAQUE', 'BLOQUEIO', 'DESCANSAR'];
            }
        }
        if(u.deck.length > 0) {
            u.hand.push(u.deck.pop());
        }
    }
}

function updateUI() {
    // 1. Atualiza Barras de Vida e Texto
    const pHpPct = (player.hp / player.maxHp) * 100;
    const mHpPct = (monster.hp / monster.maxHp) * 100;
    
    const pBar = document.getElementById('p-hp-bar');
    const mBar = document.getElementById('m-hp-bar');
    if(pBar) pBar.style.width = Math.max(0, pHpPct) + '%';
    if(mBar) mBar.style.width = Math.max(0, mHpPct) + '%';

    const pText = document.getElementById('p-hp-text');
    const mText = document.getElementById('m-hp-text');
    if(pText) pText.innerText = `${player.hp}/${player.maxHp}`;
    if(mText) mText.innerText = `${monster.hp}/${monster.maxHp}`;

    const pLvl = document.getElementById('p-lvl');
    const mLvl = document.getElementById('m-lvl');
    if(pLvl) pLvl.innerText = `NV ${player.lvl}`;
    if(mLvl) mLvl.innerText = `NV ${monster.lvl}`;

    // 2. Atualiza Pilhas de XP
    const pXpCont = document.getElementById('p-xp');
    const mXpCont = document.getElementById('m-xp');
    
    // Função auxiliar para desenhar XP empilhado
    const renderXP = (container, unit) => {
        if(!container) return;
        container.innerHTML = '';
        unit.xp.forEach((cardKey, index) => {
            const d = document.createElement('div');
            d.className = 'xp-card';
            // Ajuste visual para empilhamento
            d.style.transform = `translateY(-${index * 2}px) translateZ(0)`;
            d.style.backgroundColor = getCardColor(cardKey); 
            container.appendChild(d);
        });
    };
    renderXP(pXpCont, player);
    renderXP(mXpCont, monster);

    // 3. RENDERIZA A MÃO DO JOGADOR (A PARTE QUE ESTAVA SUMIDA)
    const handContainer = document.getElementById('player-hand');
    if(handContainer && !window.isMatchStarting && !isProcessing) {
        handContainer.innerHTML = '';
        player.hand.forEach((cardKey, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            
            // Verifica se está desabilitada
            if (player.disabled && player.disabled === cardKey) {
                cardEl.classList.add('disabled');
            }

            // Conteúdo da carta
            const artUrl = getCardArt(cardKey, true);
            cardEl.innerHTML = `
                <div class="card-inner">
                    <div class="card-front" style="background-image: url('${artUrl}');">
                        <div class="card-name">${cardKey}</div>
                    </div>
                    <div class="card-back"></div>
                </div>
            `;

            // Evento de clique
            cardEl.onclick = () => {
                if(!isProcessing && (!player.disabled || player.disabled !== cardKey)) {
                    if(cardKey === 'DESARMAR') {
                        // Lógica especial para DESARMAR
                        // Simplesmente abre um prompt ou define automaticamente
                        // Para simplificar, vamos assumir 'ATAQUE' como alvo ou aleatório
                        // Ou implementamos um mini-menu rápido. 
                        // Versão simplificada:
                        let choice = 'ATAQUE'; 
                        if(confirm("Desarmar o que? OK para ATAQUE, Cancelar para BLOQUEIO")) {
                            choice = 'ATAQUE';
                        } else {
                            choice = 'BLOQUEIO';
                        }
                        playCardFlow(index, choice);
                    } else {
                        playCardFlow(index, null);
                    }
                } else if (player.disabled === cardKey) {
                    showFloatingText('player-hand', "BLOQUEADO!", "#fff");
                }
            };
            
            // Efeito Hover Sonoro
            cardEl.onmouseenter = () => window.playUIHoverSound();

            handContainer.appendChild(cardEl);
        });
    }
}

function getCardColor(key) {
    if(key === 'ATAQUE') return '#e74c3c';
    if(key === 'BLOQUEIO') return '#3498db';
    if(key === 'DESCANSAR') return '#2ecc71';
    if(key === 'TREINAR') return '#f1c40f';
    if(key === 'DESARMAR') return '#9b59b6';
    return '#95a5a6';
}

function dealAllInitialCards() {
    const handContainer = document.getElementById('player-hand');
    if(!handContainer) return;
    handContainer.innerHTML = '';
    handContainer.classList.remove('preparing'); // Remove estado de preparação

    let delay = 0;
    // Cria elementos visuais para animação
    player.hand.forEach((cardKey, i) => {
        setTimeout(() => {
            playSound('sfx-deal');
            const card = document.createElement('div');
            card.className = 'card deal-anim'; // Classe CSS para animação de entrada
            const artUrl = getCardArt(cardKey, true);
            
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front" style="background-image: url('${artUrl}');"></div>
                </div>
            `;
            handContainer.appendChild(card);

            // Após a animação, atualiza a UI real para tornar clicável
            if(i === player.hand.length - 1) {
                setTimeout(() => {
                    window.isMatchStarting = false;
                    updateUI();
                }, 600);
            }
        }, delay);
        delay += 150;
    });
}

function getBestAIMove() {
    // IA Simples
    // 1. Se pode matar, ATACA
    const killMove = monster.hand.findIndex(c => c === 'ATAQUE' && (player.hp <= (monster.lvl + (monster.bonusAtk||0))));
    if(killMove !== -1) return { index: killMove, card: 'ATAQUE' };

    // 2. Se vida baixa (< 3), tenta BLOQUEIO ou DESCANSAR
    if(monster.hp < 3) {
        const heal = monster.hand.findIndex(c => c === 'DESCANSAR');
        if(heal !== -1) return { index: heal, card: 'DESCANSAR' };
        const block = monster.hand.findIndex(c => c === 'BLOQUEIO');
        if(block !== -1) return { index: block, card: 'BLOQUEIO' };
    }

    // 3. Aleatório inteligente
    // Prefere usar cartas que tem em excesso ou usar TREINAR se tiver vida cheia
    if(monster.hp === monster.maxHp) {
        const train = monster.hand.findIndex(c => c === 'TREINAR');
        if(train !== -1) return { index: train, card: 'TREINAR' };
    }

    // Fallback: Pega a primeira
    if(monster.hand.length > 0) return { index: 0, card: monster.hand[0] };
    return null;
}

function renderTable(cardKey, slotId, isPlayer) {
    const slot = document.getElementById(slotId);
    if(!slot) return;
    const artUrl = getCardArt(cardKey, isPlayer);
    slot.innerHTML = `
        <div class="card in-play">
            <div class="card-inner">
                 <div class="card-front" style="background-image: url('${artUrl}');"></div>
            </div>
        </div>
    `;
    playSound('sfx-play');
}

// Animação genérica de voo de elemento
function animateFly(fromId, toId, cardKey, callback, isReverse, isCard, isPlayer) {
    // Cria um elemento fantasma para voar
    const flyer = document.createElement('div');
    flyer.className = 'card flyer';
    const artUrl = getCardArt(cardKey, isPlayer);
    flyer.style.backgroundImage = `url('${artUrl}')`;
    
    // Posição Inicial
    let startRect;
    if(typeof fromId === 'object') { // Coordenadas manuais
        startRect = fromId;
    } else {
        const fromEl = document.getElementById(fromId);
        if(fromEl) startRect = fromEl.getBoundingClientRect();
        else startRect = { top: window.innerHeight/2, left: window.innerWidth/2 };
    }

    // Posição Final
    const toEl = document.getElementById(toId);
    let endRect = toEl ? toEl.getBoundingClientRect() : { top: 0, left: 0 };

    flyer.style.left = startRect.left + 'px';
    flyer.style.top = startRect.top + 'px';
    flyer.style.width = '100px'; // Tamanho fixo para animação
    flyer.style.height = '140px';
    flyer.style.position = 'fixed';
    flyer.style.zIndex = '9999';
    flyer.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    document.body.appendChild(flyer);

    // Trigger Animation
    setTimeout(() => {
        flyer.style.left = endRect.left + 'px';
        flyer.style.top = endRect.top + 'px';
        if(!isCard) { // Se for XP indo pra pilha
            flyer.style.transform = 'scale(0.2) rotate(360deg)';
            flyer.style.opacity = '0.5';
        }
    }, 50);

    setTimeout(() => {
        flyer.remove();
        if(callback) callback();
    }, 550);
}

function drawCardAnimated(unit, fromId, toId, cb) {
    // Simula carta saindo do deck para a mão
    const deckEl = document.getElementById(fromId);
    if(!deckEl) { if(cb) cb(); return; }
    
    const flyer = document.createElement('div');
    flyer.className = 'card-back flyer'; // Verso da carta
    const r = deckEl.getBoundingClientRect();
    
    flyer.style.left = r.left + 'px';
    flyer.style.top = r.top + 'px';
    flyer.style.position = 'fixed';
    flyer.style.zIndex = '1000';
    flyer.style.transition = 'all 0.4s ease-out';
    document.body.appendChild(flyer);

    // Destino: mão (aprox) ou centro
    const handEl = document.getElementById(toId);
    const dest = handEl ? handEl.getBoundingClientRect() : {top: window.innerHeight, left: window.innerWidth/2};

    setTimeout(() => {
        flyer.style.left = (dest.left + 50) + 'px';
        flyer.style.top = dest.top + 'px';
        flyer.style.opacity = '0';
    }, 50);

    setTimeout(() => {
        flyer.remove();
        if(cb) cb();
    }, 450);
}

function checkLevelUp(u, cb) {
    // Lógica simples: 3 cartas iguais = Level Up
    const counts = {};
    u.xp.forEach(x => counts[x] = (counts[x] || 0) + 1);
    
    let leveledUp = false;
    for (let key in counts) {
        if (counts[key] >= 3) {
            u.lvl++;
            u.maxHp += 2; // Bônus HP
            u.hp = u.maxHp; // Cura total no level up
            // Remove 3 cartas do XP
            let removed = 0;
            u.xp = u.xp.filter(c => {
                if(c === key && removed < 3) { removed++; return false; }
                return true;
            });
            
            showFloatingText(u.id === 'p' ? 'p-lvl' : 'm-lvl', "LEVEL UP!", "#f1c40f");
            playSound('sfx-levelup');
            leveledUp = true;
            break; // Apenas um level up por vez
        }
    }
    
    updateUI();
    if(cb) cb();
}

function showFloatingText(targetId, text, color) {
    const el = document.getElementById(targetId);
    if(!el) return;
    const r = el.getBoundingClientRect();
    
    const float = document.createElement('div');
    float.innerText = text;
    float.style.position = 'fixed';
    float.style.left = (r.left + r.width/2) + 'px';
    float.style.top = (r.top) + 'px';
    float.style.color = color || '#fff';
    float.style.fontWeight = 'bold';
    float.style.fontSize = '2rem';
    float.style.textShadow = '0 0 5px #000';
    float.style.pointerEvents = 'none';
    float.style.zIndex = '2000';
    float.style.transition = 'all 1s ease-out';
    
    document.body.appendChild(float);
    
    setTimeout(() => {
        float.style.top = (r.top - 50) + 'px';
        float.style.opacity = '0';
    }, 50);
    
    setTimeout(() => float.remove(), 1000);
}

function showCenterText(text, color) {
    // Pode usar o overlay de transição ou criar um novo rápido
    showFloatingText('game-screen', text, color); // Reusa o floating no centro se game-screen for o alvo
}

function triggerXPGlow(uid) {
    const el = document.getElementById(uid+'-xp');
    if(el) {
        el.style.filter = "brightness(2) drop-shadow(0 0 10px gold)";
        setTimeout(() => el.style.filter = "none", 300);
    }
}
