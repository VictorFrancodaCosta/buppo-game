<<<<<<< HEAD
// ARQUIVO: js/main.js (VERSÃO FINAL - CORREÇÃO UI PVE)
=======
// ARQUIVO: js/main.js (VERSÃO FINAL - POPUP RESTAURADO E ERROS CORRIGIDOS)
>>>>>>> 511672dbebbfbeda85ce582070c007752ee83ddc

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// VOLTAMOS COM O POPUP AQUI:
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCVLhOcKqF6igMGRmOWO_GEY9O4gz892Fo",
    authDomain: "buppo-game.firebaseapp.com",
    projectId: "buppo-game",
    storageBucket: "buppo-game.firebasestorage.app",
    messagingSenderId: "950871979140",
    appId: "1:950871979140:web:f2dba12900500c52053ed1"
};

let app, auth, db, provider;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    console.log("Firebase Web Iniciado.");
} catch (e) { console.error("Erro Firebase:", e); }

// 2. VARIÁVEIS GLOBAIS
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 
window.isMatchStarting = false;
window.currentDeck = 'knight';
window.myRole = null; 
window.currentMatchId = null;
window.pvpSelectedCardIndex = null; 
window.isResolvingTurn = false; 
window.pvpStartData = null;
window.masterVol = 1.0; 
let isLethalHover = false; 
let mixerInterval = null;
let isProcessing = false; 
let turnCount = 1; 
let playerHistory = []; 

let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };

// 3. ASSETS (USANDO ARQUIVOS LOCAIS)
const MAGE_ASSETS = {
    'ATAQUE': 'assets/img/carta_ataque_mago.png',
    'BLOQUEIO': 'assets/img/carta_bloqueio_mago.png',
    'DESCANSAR': 'assets/img/carta_descansar_mago.png',
    'DESARMAR': 'assets/img/carta_desarmar_mago.png',
    'TREINAR': 'assets/img/carta_treinar_mago.png',
    'DECK_IMG': 'assets/img/deck_verso_mago.png',
    'DECK_SELECT': 'assets/img/card_selecao_mago.png'
};

const ASSETS_TO_LOAD = {
    images: [
        'assets/img/logo_buppo.png', 'assets/img/mesa_cavaleiro.png', 'assets/img/mesa_mago.png',
        'assets/img/bg_saguao.png', 'assets/img/ui_moldura_perfil.png', 'assets/img/ui_placa_selecao.png',
        'assets/img/card_selecao_cavaleiro.png', 'assets/img/card_selecao_mago.png',
        'assets/img/deck_verso_cavaleiro.png', 'assets/img/deck_verso_mago.png',
        'assets/img/card_verso_padrao.png', 'assets/img/ui_mesa_deck.png', 'assets/img/ui_area_xp.png',
        'assets/img/carta_ataque_cavaleiro.png', 'assets/img/carta_bloqueio_cavaleiro.png',
        'assets/img/carta_descansar_cavaleiro.png', 'assets/img/carta_desarmar_cavaleiro.png',
        'assets/img/carta_treinar_cavaleiro.png', 'assets/img/carta_ataque_mago.png',
        'assets/img/carta_bloqueio_mago.png', 'assets/img/carta_descansar_mago.png',
        'assets/img/carta_desarmar_mago.png', 'assets/img/carta_treinar_mago.png'
    ],
    audio: [
        { id: 'bgm-menu', src: 'assets/audio/musica_menu.wav', loop: true }, 
        { id: 'bgm-loop', src: 'assets/audio/musica_batalha.mp3', loop: true },
        { id: 'sfx-nav', src: 'assets/audio/sfx_click.mp3' }, 
        { id: 'sfx-deal', src: 'assets/audio/sfx_dar_cartas.mp3' }, 
        { id: 'sfx-play', src: 'assets/audio/sfx_jogar_carta.mp3' },
        { id: 'sfx-hit', src: 'assets/audio/sfx_dano_fisico.mp3' }, 
        { id: 'sfx-hit-mage', src: 'assets/audio/sfx_dano_magico.mp3' }, 
        { id: 'sfx-block', src: 'assets/audio/sfx_bloqueio.mp3' }, 
        { id: 'sfx-block-mage', src: 'assets/audio/sfx_bloqueio_magico.mp3' }, 
        { id: 'sfx-heal', src: 'assets/audio/sfx_cura.mp3' }, 
        { id: 'sfx-levelup', src: 'assets/audio/sfx_levelup.mp3' }, 
        { id: 'sfx-train', src: 'assets/audio/sfx_treinar.mp3' }, 
        { id: 'sfx-disarm', src: 'assets/audio/sfx_desarmar.mp3' }, 
        { id: 'sfx-cine', src: 'assets/audio/ambience_cine.mp3', loop: true }, 
        { id: 'sfx-hover', src: 'assets/audio/sfx_hover_carta.mp3' }, 
        { id: 'sfx-ui-hover', src: 'assets/audio/sfx_hover_ui.mp3' }, 
        { id: 'sfx-deck-select', src: 'assets/audio/sfx_selecionar_deck.mp3' }, 
        { id: 'sfx-win', src: 'assets/audio/sfx_vitoria.mp3' }, 
        { id: 'sfx-lose', src: 'assets/audio/sfx_derrota.mp3' },
        { id: 'sfx-tie', src: 'assets/audio/sfx_empate.mp3' }
    ]
};

// ======================================================
// 4. FUNÇÕES GLOBAIS (CONECTADAS AO WINDOW)
// ======================================================

// Login Google (POPUP RESTAURADO)
window.googleLogin = async function() {
    window.playNavSound(); 
    const btnText = document.getElementById('btn-text');
    if(btnText) btnText.innerText = "CONECTANDO...";
    try {
        await signInWithPopup(auth, provider);
        // O onAuthStateChanged vai cuidar do resto
    } catch (error) {
        console.error("Erro no Login:", error);
        if(btnText) btnText.innerText = "ERRO - TENTE NOVAMENTE";
        setTimeout(() => { if(btnText) btnText.innerText = "LOGIN COM GOOGLE"; }, 3000);
    }
};

window.handleLogout = function() {
    window.playNavSound();
    signOut(auth).then(() => { location.reload(); });
};

window.startPvPSearch = function() {
    if (!currentUser) return; 
    window.gameMode = 'pvp'; 
    window.playNavSound();
    window.openDeckSelector(); 
};

window.startPvE = function() {
    window.gameMode = 'pve'; 
    window.playNavSound();
    window.openDeckSelector(); 
};

window.cancelPvPSearch = async function() {
    window.playNavSound();
    document.getElementById('matchmaking-screen').style.display = 'none';
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (window.queueListener) { window.queueListener(); window.queueListener = null; }
    if (window.myQueueRef) { await updateDoc(window.myQueueRef, { cancelled: true }); window.myQueueRef = null; }
    window.openDeckSelector(); 
};

window.cancelModal = function() { 
    document.getElementById('modal-overlay').style.display='none'; 
    isProcessing = false; 
};

window.toggleFullScreen = function() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => console.log(e)); } 
    else { if (document.exitFullscreen) { document.exitFullscreen(); } }
};

window.toggleConfig = function() { 
    let p = document.getElementById('config-panel'); 
    if(p.style.display==='flex'){ p.style.display='none'; p.classList.remove('active'); document.body.classList.remove('config-mode'); } 
    else { p.style.display='flex'; p.classList.add('active'); document.body.classList.add('config-mode'); } 
};

window.updateVol = function(type, val) { 
    if(type==='master') window.masterVol = parseFloat(val); 
};

// ======================================================
// 5. PRELOAD E INICIALIZAÇÃO
// ======================================================
window.onload = function() {
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) btnSound.addEventListener('click', (e) => { e.stopPropagation(); window.toggleMute(); });
    
    // Configura o Preload
    console.log("Iniciando Preload...");
    assetsLoaded = 0;
    
    const total = ASSETS_TO_LOAD.images.length + ASSETS_TO_LOAD.audio.length;
    
    const checkLoad = () => {
        assetsLoaded++;
        let pct = Math.min(100, (assetsLoaded / total) * 100);
        const fill = document.getElementById('loader-fill');
        if(fill) fill.style.width = pct + '%';
        
        if(assetsLoaded >= total) finishLoading();
    };

    ASSETS_TO_LOAD.images.forEach(src => { 
        let img = new Image(); img.src = src; window.gameAssets.push(img);
        img.onload = checkLoad; img.onerror = checkLoad;
    });
    ASSETS_TO_LOAD.audio.forEach(a => { 
        let s = new Audio(); s.src = a.src; s.preload = 'auto'; 
        if(a.loop) s.loop = true; audios[a.id] = s; window.gameAssets.push(s);
        s.onloadedmetadata = checkLoad; s.onerror = checkLoad;
        setTimeout(() => { if(s.readyState === 0) checkLoad(); }, 3000); 
    });

    initAmbientParticles();
    document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
};

function finishLoading() {
    console.log("Preload completo!");
    if(window.updateVol) window.updateVol('master', window.masterVol || 1.0);
    setTimeout(() => {
        const loading = document.getElementById('loading-screen');
        if(loading) { loading.style.opacity = '0'; setTimeout(() => loading.style.display = 'none', 500); }
        if(!window.hoverLogicInitialized) { initGlobalHoverLogic(); window.hoverLogicInitialized = true; }
    }, 800); 
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            window.goToLobby(true); 
        } else {
            currentUser = null;
            window.showScreen('start-screen');
            document.getElementById('game-background').classList.remove('lobby-mode');
            const btnTxt = document.getElementById('btn-text');
            if(btnTxt) btnTxt.innerText = "LOGIN COM GOOGLE";
            MusicController.play('bgm-menu'); 
        }
    });

    document.body.addEventListener('click', () => { 
        if (!MusicController.currentTrackId || (audios['bgm-menu'] && audios['bgm-menu'].paused)) MusicController.play('bgm-menu');
    }, { once: true });
}

// ======================================================
// 6. HELPERS
// ======================================================
function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) {
        return MAGE_ASSETS[cardKey];
    }
    return CARDS_DB[cardKey].img;
}

function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash);
}

function shuffle(array, seed = null) {
    let rng = Math.random; 
    if (seed !== null) {
        let currentSeed = seed;
        rng = function() {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        }
    }
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateShuffledDeck() {
    let deck = [];
    for(let k in DECK_TEMPLATE) for(let i=0; i<DECK_TEMPLATE[k]; i++) deck.push(k);
    shuffle(deck);
    return deck;
}

// ======================================================
// 7. SISTEMA DE ÁUDIO BLINDADO
// ======================================================
const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if (!audios[trackId]) return;
        try {
            if (this.currentTrackId === trackId) {
                if (audios[trackId].paused && !window.isMuted) {
                    const audio = audios[trackId];
                    if (audio.readyState >= 2) audio.currentTime = 0;
                    audio.volume = 0;
                    audio.play().catch(()=>{});
                    this.fadeIn(audio, 0.5 * window.masterVol);
                }
                return; 
            } 
            const maxVol = 0.5 * window.masterVol;
            if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]);
            if (trackId && audios[trackId]) {
                const newAudio = audios[trackId];
                if (newAudio.readyState >= 2) newAudio.currentTime = 0;
                if (!window.isMuted) {
                    newAudio.volume = 0; 
                    newAudio.play().catch(()=>{});
                    this.fadeIn(newAudio, maxVol);
                }
            }
            this.currentTrackId = trackId;
        } catch(e) { console.warn("Music Error:", e); }
    },
    stopCurrent() {
        if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]);
        this.currentTrackId = null;
    },
    fadeOut(audio) {
        if(!audio) return;
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) { vol -= 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); } } 
            else { try { audio.volume = 0; audio.pause(); } catch(e){} clearInterval(fadeOutInt); }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        if(!audio) return;
        let vol = 0;
        audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) { vol += 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); } } 
            else { try { audio.volume = targetVol; } catch(e){} clearInterval(fadeInInt); }
        }, 50);
    }
};

window.isMuted = false;
window.toggleMute = function() {
    window.isMuted = !window.isMuted;
    const btn = document.getElementById('btn-sound');
    if(btn) {
        btn.innerHTML = window.isMuted ? 
            `<svg viewBox="0 0 24 24" style="width:100%; height:100%; fill:#eee;"><path d="M16.5,12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45,2.45C16.42,12.5,16.5,12.26,16.5,12z M19,12c0,0.94-0.2,1.82-0.54,2.64l1.51,1.51C20.63,14.91,21,13.5,21,12c0-4.28-2.99-7.86-7-8.77v2.06C16.89,6.15,19,8.83,19,12z M4.27,3L3,4.27l4.56,4.56C7.39,8.91,7.2,8.96,7,9H3v6h4l5,5v-6.73l4.25,4.25c-0.67,0.52-1.42,0.93-2.25,1.18v2.06c1.38-0.31,2.63-0.95,3.69-1.81L19.73,21L21,19.73L9,7.73V4L4.27,3z M12,4L9.91,6.09L12,8.18V4z"/></svg>` : 
            `<svg viewBox="0 0 24 24" style="width:100%; height:100%; fill:#eee;"><path d="M3,9v6h4l5,5V4L7,9H3z M16.5,12c0-1.77-1.02-3.29-2.5-4.03v8.05C15.48,15.29,16.5,13.77,16.5,12z M14,3.23v2.06 c2.89,0.86,5,3.54,5,6.71s-2.11,5.85-5,6.71v2.06c4.01-0.91,7-4.49,7-8.77S18.01,4.14,14,3.23z"/></svg>`;
    }
    Object.values(audios).forEach(audio => { if(audio) audio.muted = window.isMuted; });
    if(!window.isMuted && MusicController.currentTrackId) {
        const audio = audios[MusicController.currentTrackId];
        if(audio && audio.paused) audio.play().catch(()=>{});
    }
}

window.playNavSound = function() { 
    let s = audios['sfx-nav']; 
    if(s) { try { if (s.readyState >= 2) s.currentTime = 0; s.play().catch(()=>{}); } catch(e) {} } 
};

let lastHoverTime = 0;
window.playUIHoverSound = function() {
    let now = Date.now();
    if (now - lastHoverTime < 50) return; 
    let base = audios['sfx-ui-hover'];
    if(base && !window.isMuted) { 
        try {
            let s = base.cloneNode(); 
            s.volume = 0.3 * (window.masterVol || 1.0);
            s.play().catch(()=>{}); 
            lastHoverTime = now;
        } catch(e){}
    }
};

function playSound(key) { 
    if(audios[key]) { 
        try {
            if (key === 'sfx-levelup') audios[key].volume = 1.0 * (window.masterVol || 1.0);
            if (audios[key].readyState >= 2) audios[key].currentTime = 0; 
            audios[key].play().catch(()=>{}); 
        } catch(e){}
    } 
}

// ======================================================
// 8. INTERFACE E NAVEGAÇÃO
// ======================================================
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

<<<<<<< HEAD
// --- CONTROLE DE TELA CHEIA E ROTAÇÃO ---
// CORREÇÃO: Força o reset visual da tela de seleção sempre que ela é aberta
=======
>>>>>>> 511672dbebbfbeda85ce582070c007752ee83ddc
window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    
    // Reseta visual da tela de seleção
    const ds = document.getElementById('deck-selection-screen');
<<<<<<< HEAD
    if(ds) {
        ds.style.display = 'flex';
        ds.style.opacity = '1';
        // Reseta posição das cartas
        const options = document.querySelectorAll('.deck-option');
        options.forEach(opt => {
            opt.style = "";
            const img = opt.querySelector('img');
            if(img) img.style = "";
        });
    }

=======
    if(ds) { ds.style.display = 'flex'; ds.style.opacity = '1'; }
    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => { opt.style = ""; const img = opt.querySelector('img'); if(img) img.style = ""; });
    
>>>>>>> 511672dbebbfbeda85ce582070c007752ee83ddc
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

<<<<<<< HEAD
(function createRotateOverlay() {
    if (!document.getElementById('rotate-overlay')) {
        const div = document.createElement('div');
        div.id = 'rotate-overlay';
        div.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 20px;">↻</div>
            <div>GIRE O CELULAR<br>PARA JOGAR</div>
        `;
        document.body.appendChild(div);
    }
})();

// --- SELEÇÃO DE DECK (CORRIGIDO UI PVE) ---
=======
>>>>>>> 511672dbebbfbeda85ce582070c007752ee83ddc
window.selectDeck = function(deckType) {
    try { audios['sfx-deck-select'].currentTime = 0; audios['sfx-deck-select'].play().catch(()=>{}); } catch(e){}
    window.currentDeck = deckType; 
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 
    document.body.classList.add(deckType === 'mage' ? 'theme-mago' : 'theme-cavaleiro');
    
    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))";
            opt.style.zIndex = "100";
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
<<<<<<< HEAD
            // ESCONDE O CONTAINER PARA EVITAR O FANTASMA
            selectionScreen.style.display = 'none';

            if (window.gameMode === 'pvp') {
                initiateMatchmaking(); 
            } else {
                window.transitionToGame();
            }
            
            // NÃO resetamos a opacidade aqui. 
            // O reset é feito em openDeckSelector na próxima vez que abrir.
=======
            selectionScreen.style.display = 'none';
            if (window.gameMode === 'pvp') initiateMatchmaking(); 
            else window.transitionToGame();
>>>>>>> 511672dbebbfbeda85ce582070c007752ee83ddc
        }, 500);
    }, 400);
};

window.transitionToGame = function() {
    const transScreen = document.getElementById('transition-overlay');
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
    if(transScreen) transScreen.classList.add('active');
    try { MusicController.stopCurrent(); } catch(e){}
    setTimeout(() => {
        window.goToLobby(false); 
        setTimeout(() => {
            if(transScreen) transScreen.classList.remove('active');
        }, 1000); 
    }, 500);
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) { window.showScreen('start-screen'); MusicController.play('bgm-menu'); return; }
    isProcessing = false; 
    document.getElementById('game-background').classList.add('lobby-mode');
    MusicController.play('bgm-menu'); createLobbyFlares();
    
    const userRef = doc(db, "players", currentUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0 });
    
    const d = snap.exists() ? snap.data() : { name: currentUser.displayName, score:0, totalWins:0 };
    document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
    document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins||0} | PONTOS: ${d.score||0}`;

    onSnapshot(query(collection(db, "players"), orderBy("score", "desc"), limit(10)), (ss) => {
        let html = '<table id="ranking-table"><thead><tr><th>#</th><th>JOGADOR</th><th>PTS</th></tr></thead><tbody>';
        let pos = 1;
        ss.forEach((doc) => {
            const p = doc.data();
            let cls = pos===1?"rank-1":pos===2?"rank-2":pos===3?"rank-3":"";
            html += `<tr class="${cls}"><td class="rank-pos">${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`;
            pos++;
        });
        html += '</tbody></table>';
        document.getElementById('ranking-content').innerHTML = html;
    });
    window.showScreen('lobby-screen');
    document.getElementById('end-screen').classList.remove('visible'); 
};

window.restartMatch = function() {
    document.getElementById('end-screen').classList.remove('visible');
    setTimeout(startGameFlow, 50);
    MusicController.play('bgm-loop'); 
}

window.abandonMatch = function() {
    if(document.getElementById('game-screen').classList.contains('active')) {
        window.toggleConfig(); 
        window.openModal(
            "ABANDONAR?", 
            "Sair da partida contará como DERROTA. Tem certeza?", 
            ["CANCELAR", "SAIR"], 
            (choice) => {
                if (choice === "SAIR") {
                    window.registrarDerrotaOnline(window.gameMode);
                    window.transitionToLobby();
                }
            }
        );
    }
}

function showCenterText(txt, col) { 
    let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; 
    if(col) el.style.color = col; 
    document.body.appendChild(el); 
    setTimeout(() => el.remove(), 1000); 
}

function showFloatingText(eid, txt, col) { 
    let el = document.createElement('div'); el.className='floating-text'; el.innerText=txt; el.style.color=col; 
    let parent = document.getElementById(eid);
    if(parent) {
        let rect = parent.getBoundingClientRect();
        el.style.left = (rect.left + rect.width/2) + 'px';
        el.style.top = (rect.top) + 'px';
        document.body.appendChild(el); 
    }
    setTimeout(()=>el.remove(), 2000); 
}

// ======================================================
// 9. LÓGICA DO JOGO (CORE)
// ======================================================
function resetUnit(u, predefinedDeck = null, role = null) { 
    u.hp = 6; u.maxHp = 6; u.lvl = 1; u.xp = []; u.hand = []; 
    u.originalRole = role || 'pve'; 
    if (predefinedDeck) {
        u.deck = [...predefinedDeck]; 
    } else {
        u.deck = []; 
        for(let k in DECK_TEMPLATE) for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k);
        shuffle(u.deck); 
    }
    u.disabled = null; u.bonusBlock = 0; u.bonusAtk = 0; 
}

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    startCinematicLoop(); 
    
    window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand');
    if (handEl) { handEl.innerHTML = ''; handEl.classList.add('preparing'); }
    
    if (window.gameMode === 'pvp' && window.pvpStartData) {
        if (window.myRole === 'player1') {
            resetUnit(player, window.pvpStartData.player1.deck, 'player1');
            resetUnit(monster, window.pvpStartData.player2.deck, 'player2');
        } else {
            resetUnit(player, window.pvpStartData.player2.deck, 'player2');
            resetUnit(monster, window.pvpStartData.player1.deck, 'player1');
        }
    } else {
        resetUnit(player, null, 'pve'); 
        resetUnit(monster, null, 'pve'); 
    }

    turnCount = 1; playerHistory = [];
    drawCardLogic(monster, 6); 
    drawCardLogic(player, 6); 
    updateUI(); 
    dealAllInitialCards();

    if(window.gameMode === 'pvp') startPvPListener();
}

function dealAllInitialCards() {
    isProcessing = true; playSound('sfx-deal'); 
    const handEl = document.getElementById('player-hand'); 
    const cards = Array.from(handEl.children);
    cards.forEach((cardEl, i) => {
        cardEl.classList.add('intro-anim');
        cardEl.style.animationDelay = (i * 0.1) + 's';
        cardEl.style.opacity = ''; 
    });
    window.isMatchStarting = false;
    if(handEl) handEl.classList.remove('preparing');
    setTimeout(() => {
        cards.forEach(c => { c.classList.remove('intro-anim'); c.style.animationDelay = ''; });
        isProcessing = false;
    }, 2000); 
}

function drawCardLogic(u, qty) { 
    for(let i=0; i<qty; i++) if(u.deck.length > 0) u.hand.push(u.deck.pop()); 
    u.hand.sort(); 
}

function onCardClick(index) {
    if(isProcessing) return; if (!player.hand[index]) return;
    if (window.gameMode === 'pvp' && window.pvpSelectedCardIndex !== null) return;

    playSound('sfx-play'); 
    document.body.classList.remove('focus-hand', 'cinematic-active', 'tension-active');
    document.getElementById('tooltip-box').style.display = 'none'; isLethalHover = false; 
    
    let cardKey = player.hand[index];
    if(player.disabled === cardKey) { showCenterText("DESARMADA!"); return; }
    
    if(cardKey === 'DESARMAR') { 
        window.openModal('ALVO DO DESARME', 'Qual ação bloquear no inimigo?', ACTION_KEYS, (choice) => {
            if(window.gameMode === 'pvp') lockInPvPMove(index, choice); 
            else playCardFlow(index, choice); 
        }); 
    } else { 
        if(window.gameMode === 'pvp') lockInPvPMove(index, null); 
        else playCardFlow(index, null); 
    }
}

async function playCardFlow(index, pDisarmChoice) {
    isProcessing = true; 
    let cardKey = player.hand.splice(index, 1)[0]; 
    playerHistory.push(cardKey);

    let aiMove = getBestAIMove(); 
    let mCardKey = 'ATAQUE'; let mDisarmTarget = null; 
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

    animateMyCard(index, cardKey, () => {
        const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 - (window.innerWidth < 768 ? 42 : 52.5) };
        animateFly(opponentHandOrigin, 'm-slot', mCardKey, () => { 
            renderTable(mCardKey, 'm-slot', false); 
            setTimeout(() => resolveTurn(cardKey, mCardKey, pDisarmChoice, mDisarmTarget), 500); 
        }, false, true, false);
    });
}

function animateMyCard(index, cardKey, cb) {
    let handContainer = document.getElementById('player-hand'); 
    let startRect = null;
    if(handContainer && handContainer.children[index]) { 
        let realCardEl = handContainer.children[index];
        startRect = realCardEl.getBoundingClientRect(); 
        realCardEl.style.opacity = '0';
    }
    animateFly(startRect || 'player-hand', 'p-slot', cardKey, () => { 
        renderTable(cardKey, 'p-slot', true); 
        updateUI(); 
        cb();
    }, false, true, true); 
}

function getBestAIMove() {
    let moves = []; 
    monster.hand.forEach((card, index) => { if(card !== monster.disabled) moves.push({ card: card, index: index, score: 0 }); });
    if(moves.length === 0) return null;
    moves.forEach(m => m.score = Math.random() * 100);
    moves.sort((a, b) => b.score - a.score);
    return moves[0];
}

// ======================================================
// 10. LÓGICA PVP (FILA E TURNO)
// ======================================================
async function initiateMatchmaking() {
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'flex';
    let matchSeconds = 0;
    const timerEl = document.getElementById('mm-timer');
    timerEl.innerText = "00:00";
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    matchTimerInterval = setInterval(() => {
        matchSeconds++;
        let m = Math.floor(matchSeconds / 60).toString().padStart(2, '0');
        let s = (matchSeconds % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
    }, 1000);

    try {
        let myQueueRef = doc(collection(db, "queue")); 
        await setDoc(myQueueRef, {
            uid: currentUser.uid, name: currentUser.displayName,
            deck: window.currentDeck, score: 0, timestamp: Date.now(), matchId: null
        });
        window.myQueueRef = myQueueRef; 

        window.queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().matchId) enterMatch(docSnap.data().matchId); 
        });

        findOpponentInQueue();
    } catch (e) {
        console.error("Erro Matchmaking:", e);
        cancelPvPSearch();
    }
}

async function findOpponentInQueue() {
    try {
        const queueRef = collection(db, "queue");
        const q = query(queueRef, orderBy("timestamp", "asc"), limit(100));
        const snapshot = await getDocs(q);
        let opponentDoc = null;
        const now = Date.now();
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if ((now - data.timestamp) > 120000 && data.uid !== currentUser.uid) {
               try { await deleteDoc(doc.ref); } catch(e){} 
               continue;
            }
            if (data.uid !== currentUser.uid && !data.matchId && !data.cancelled) {
                opponentDoc = doc; break; 
            }
        }

        if (opponentDoc) {
            const oppData = opponentDoc.data();
            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            await updateDoc(opponentDoc.ref, { matchId: matchId });
            if (window.myQueueRef) await updateDoc(window.myQueueRef, { matchId: matchId });

            const p1Deck = generateShuffledDeck();
            const p2Deck = generateShuffledDeck();

            await setDoc(doc(db, "matches", matchId), {
                player1: { uid: currentUser.uid, name: currentUser.displayName, deckType: window.currentDeck, hp: 6, hand: [], deck: p1Deck, xp: [] },
                player2: { uid: oppData.uid, name: oppData.name, deckType: oppData.deck, hp: 6, hand: [], deck: p2Deck, xp: [] },
                turn: 1, status: 'playing', createdAt: Date.now()
            });
        } 
    } catch (e) { console.error(e); }
}

async function enterMatch(matchId) {
    if (window.queueListener) window.queueListener();
    if (matchTimerInterval) clearInterval(matchTimerInterval);

    const snap = await getDoc(doc(db, "matches", matchId));
    if(snap.exists()) {
        const data = snap.data();
        window.pvpStartData = data; 
        window.myRole = (data.player1.uid === currentUser.uid) ? 'player1' : 'player2';
    }

    document.querySelector('.mm-title').innerText = "PARTIDA ENCONTRADA!";
    document.querySelector('.mm-title').style.color = "#2ecc71";
    setTimeout(() => {
        document.getElementById('matchmaking-screen').style.display = 'none';
        window.currentMatchId = matchId;
        window.transitionToGame(); 
    }, 1500);
}

function startPvPListener() {
    if(!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    let namesUpdated = false;

    onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();

        if (!namesUpdated && matchData.player1 && matchData.player2) {
            let myName = (window.myRole === 'player1') ? matchData.player1.name : matchData.player2.name;
            let enemyName = (window.myRole === 'player1') ? matchData.player2.name : matchData.player1.name;
            document.querySelector('#p-stats-cluster .unit-name').innerText = myName;
            document.querySelector('#m-stats-cluster .unit-name').innerText = enemyName;
            namesUpdated = true; 
        }

        let enemyHasPlayed = (window.myRole === 'player1' && matchData.p2Move) || (window.myRole === 'player2' && matchData.p1Move);
        updateEnemyReadyState(enemyHasPlayed);

        if (matchData.p1Move && matchData.p2Move) {
            updateEnemyReadyState(false); 
            if (!window.isResolvingTurn) {
                resolvePvPTurn(matchData.p1Move, matchData.p2Move, matchData.p1Disarm, matchData.p2Disarm);
            }
        }
    });
}

function updateEnemyReadyState(isReady) {
    const mCluster = document.getElementById('m-stats-cluster');
    const badgeId = 'enemy-ready-badge';
    if (isReady && mCluster) {
        mCluster.classList.add('enemy-ready-pulse');
        if(!document.getElementById(badgeId)) {
            const badge = document.createElement('div');
            badge.id = badgeId; badge.className = 'ready-badge'; badge.innerText = "PRONTO!";
            mCluster.appendChild(badge);
        }
    } else if (mCluster) {
        mCluster.classList.remove('enemy-ready-pulse');
        const b = document.getElementById(badgeId); if(b) b.remove();
    }
}

async function lockInPvPMove(index, disarmChoice) {
    const cardEl = document.getElementById('player-hand').children[index];
    if(cardEl) cardEl.classList.add('card-selected');
    window.pvpSelectedCardIndex = index;
    isProcessing = true; 
    showCenterText("AGUARDANDO OPONENTE...", "#ffd700");

    const matchRef = doc(db, "matches", window.currentMatchId);
    const updates = {};
    updates[(window.myRole === 'player1') ? 'p1Move' : 'p2Move'] = player.hand[index];
    updates[(window.myRole === 'player1') ? 'p1Disarm' : 'p2Disarm'] = disarmChoice || null;
    
    try { await updateDoc(matchRef, updates); } catch(e) { console.error(e); }
}

async function resolvePvPTurn(p1, p2, d1, d2) {
    window.isResolvingTurn = true; 
    isProcessing = true; 
    const txt = document.querySelector('.center-text'); if(txt) txt.remove();

    let myMove, enemyMove, myDisarm, enemyDisarm;
    if (window.myRole === 'player1') { myMove=p1; enemyMove=p2; myDisarm=d1; enemyDisarm=d2; }
    else { myMove=p2; enemyMove=p1; myDisarm=d2; enemyDisarm=d1; }

    if (window.pvpSelectedCardIndex === null) window.pvpSelectedCardIndex = player.hand.indexOf(myMove);
    const handEl = document.getElementById('player-hand');
    let startRect = null;
    if(handEl && window.pvpSelectedCardIndex > -1 && handEl.children[window.pvpSelectedCardIndex]) {
        let el = handEl.children[window.pvpSelectedCardIndex];
        startRect = el.getBoundingClientRect();
        el.classList.remove('card-selected'); el.style.opacity = '0';
    }

    const idx = (window.pvpSelectedCardIndex > -1) ? window.pvpSelectedCardIndex : player.hand.indexOf(myMove);
    if(idx > -1) player.hand.splice(idx, 1);
    playerHistory.push(myMove);

    animateFly(startRect || 'player-hand', 'p-slot', myMove, () => { renderTable(myMove, 'p-slot', true); }, false, true, true);
    const oppOrigin = { top: -160, left: window.innerWidth/2 };
    animateFly(oppOrigin, 'm-slot', enemyMove, () => { renderTable(enemyMove, 'm-slot', false); }, false, true, false);

    setTimeout(() => {
        resolveTurn(myMove, enemyMove, myDisarm, enemyDisarm);
        window.pvpSelectedCardIndex = null;

        if (window.myRole === 'player1') {
            setTimeout(() => {
                updateDoc(doc(db, "matches", window.currentMatchId), {
                    p1Move: null, p2Move: null, p1Disarm: null, p2Disarm: null, turn: increment(1)
                });
            }, 3000);
        }
        setTimeout(() => window.isResolvingTurn = false, 3500);
    }, 600);
}

function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train');
    if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');

    let pDmg = 0, mDmg = 0;
    if(mAct === 'ATAQUE') pDmg += monster.lvl;
    if(pAct === 'ATAQUE') mDmg += player.lvl;
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') mDmg += (1 + player.bonusBlock); }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') pDmg += (1 + monster.bonusBlock); }

    let clash = false;
    let pBlocks = (pAct === 'BLOQUEIO' && mAct === 'ATAQUE'); 
    let mBlocks = (mAct === 'BLOQUEIO' && pAct === 'ATAQUE'); 
    if(pBlocks || mBlocks) { clash = true; triggerBlockEffect(pBlocks); }

    let nextPlayerDisabled = null; let nextMonsterDisabled = null;
    if(mAct === 'DESARMAR') nextPlayerDisabled = mDisarmTarget || 'ATAQUE';
    if(pAct === 'DESARMAR') nextMonsterDisabled = pDisarmChoice;
    if(pAct === 'DESARMAR' && mAct === 'DESARMAR') { nextPlayerDisabled=null; nextMonsterDisabled=null; showCenterText("ANULADO", "#aaa"); }

    player.disabled = nextPlayerDisabled; monster.disabled = nextMonsterDisabled;
    if(pDmg >= 4 || mDmg >= 4) triggerCritEffect();

    if(pDmg > 0) { 
        player.hp -= pDmg; showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); 
        if(!mBlocks) triggerDamageEffect(true);
    }
    if(mDmg > 0) { 
        monster.hp -= mDmg; showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); 
        if(!clash) triggerDamageEffect(false); 
    }
    
    updateUI();
    let pDead = player.hp <= 0, mDead = monster.hp <= 0;
    
    if(!pDead && pAct === 'DESCANSAR') { 
        let heal = (pDmg === 0) ? 3 : 2; player.hp = Math.min(player.maxHp, player.hp + heal); 
        showFloatingText('p-lvl', `+${heal} HP`, "#55efc4"); triggerHealEffect(true); playSound('sfx-heal'); 
    }
    if(!mDead && mAct === 'DESCANSAR') { 
        let heal = (mDmg === 0) ? 3 : 2; monster.hp = Math.min(monster.maxHp, monster.hp + heal); 
        triggerHealEffect(false); playSound('sfx-heal'); 
    }

    const handleExtraXP = (u) => {
        if(u.deck.length > 0) { 
            let card = u.deck.pop(); 
            animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { 
                u.xp.push(card); triggerXPGlow(u.id); updateUI(); 
            }, false, false, (u.id === 'p')); 
        } 
    };
    
    if(!pDead && pAct === 'TREINAR') handleExtraXP(player); 
    if(!mDead && mAct === 'TREINAR') handleExtraXP(monster);
    if(!pDead && pAct === 'ATAQUE' && mAct === 'DESCANSAR') handleExtraXP(player); 
    if(!mDead && mAct === 'ATAQUE' && pAct === 'DESCANSAR') handleExtraXP(monster);

    setTimeout(() => {
        animateFly('p-slot', 'p-xp', pAct, () => { 
            if(!pDead) { player.xp.push(pAct); triggerXPGlow('p'); updateUI(); } 
            checkLevelUp(player, () => { 
                if(!pDead) drawCardAnimated(player, 'p-deck-container', 'player-hand', () => { 
                    drawCardLogic(player, 1); turnCount++; updateUI(); isProcessing = false; 
                }); 
            }); 
        }, false, false, true);

        animateFly('m-slot', 'm-xp', mAct, () => { 
            if(!mDead) { monster.xp.push(mAct); triggerXPGlow('m'); updateUI(); } 
            checkLevelUp(monster, () => { 
                if(!mDead) { drawCardLogic(monster, 1); checkEndGame(); } 
            }); 
        }, false, false, false);
        
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

function checkLevelUp(u, doneCb) {
    if(u.xp.length >= 5) {
        let xpContainer = document.getElementById(u.id + '-xp'); 
        Array.from(xpContainer.children).forEach(real => {
            let rect = real.getBoundingClientRect(); 
            let clone = document.createElement('div'); clone.className = 'xp-anim-clone';
            clone.style.left = rect.left+'px'; clone.style.top = rect.top+'px'; 
            clone.style.width = rect.width+'px'; clone.style.height = rect.height+'px'; 
            clone.style.backgroundImage = real.style.backgroundImage;
            if (u.id === 'p') clone.classList.add('xp-fly-up'); else clone.classList.add('xp-fly-down');
            document.body.appendChild(clone);
            real.style.opacity = '0';
        });

        setTimeout(() => {
            let counts = {}; u.xp.forEach(x => counts[x] = (counts[x]||0)+1); 
            let triggers = []; for(let k in counts) if(counts[k] >= 3 && k !== 'DESCANSAR') triggers.push(k);
            
            processMasteries(u, triggers, () => {
                u.lvl++; 
                triggerLevelUpVisuals(u.id); playSound('sfx-levelup'); 
                u.xp.forEach(x => u.deck.push(x)); u.xp = []; 
                
                if (window.gameMode === 'pvp' && window.currentMatchId) {
                    let s = stringToSeed(window.currentMatchId + u.originalRole) + u.lvl;
                    shuffle(u.deck, s);
                } else { shuffle(u.deck); }

                let clones = document.getElementsByClassName('xp-anim-clone'); 
                while(clones.length > 0) clones[0].remove();
                updateUI(); doneCb();
            });
        }, 1000); 
    } else { doneCb(); }
}

// ======================================================
// 11. EFEITOS E UI ADICIONAIS
// ======================================================
function triggerLevelUpVisuals(unitId) {
    let cluster = document.getElementById(unitId === 'p' ? 'p-stats-cluster' : 'm-stats-cluster');
    if(!cluster) return;
    const text = document.createElement('div'); text.innerText = "LEVEL UP!"; text.className = 'levelup-text'; 
    if (unitId === 'p') text.classList.add('lvl-anim-up'); else text.classList.add('lvl-anim-down'); 
    cluster.appendChild(text); setTimeout(() => text.remove(), 2000);
}

function initAmbientParticles() { 
    const container = document.getElementById('ambient-particles'); if(!container) return; 
    for(let i=0; i<50; i++) { 
        let d = document.createElement('div'); d.className = 'ember'; 
        d.style.left = Math.random()*100+'%'; 
        d.style.animationDuration = (5+Math.random()*5)+'s'; 
        d.style.setProperty('--mx', (Math.random()-0.5)*50+'px'); 
        container.appendChild(d); 
    } 
}

function createLobbyFlares() {
    const container = document.getElementById('lobby-particles'); if(!container) return;
    container.innerHTML = ''; 
    for(let i=0; i < 70; i++) {
        let flare = document.createElement('div'); flare.className = 'lobby-flare';
        flare.style.left = Math.random()*100+'%'; flare.style.top = Math.random()*100+'%';
        let size = 4 + Math.random()*18; 
        flare.style.width = size+'px'; flare.style.height = size+'px';
        flare.style.animationDuration = (3+Math.random()*5)+'s'; 
        flare.style.animationDelay = (Math.random()*4)+'s';
        container.appendChild(flare);
    }
}

function startCinematicLoop() { 
    const c = audios['sfx-cine']; 
    if(c) { try { c.volume=0; c.play().catch(()=>{}); } catch(e){} if(mixerInterval) clearInterval(mixerInterval); mixerInterval=setInterval(updateAudioMixer, 30); }
}
function updateAudioMixer() { 
    const c = audios['sfx-cine']; if(!c) return; 
    const target = (window.isMuted) ? 0 : (isLethalHover ? 0.6*window.masterVol : 0);
    try { 
        if(c.volume < target) c.volume = Math.min(target, c.volume+0.05); 
        else if(c.volume > target) c.volume = Math.max(target, c.volume-0.05); 
    } catch(e){}
}

function initGlobalHoverLogic() {
    let lastTarget = null;
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('button, .circle-btn, #btn-fullscreen, .deck-option, .mini-btn');
        if (target && target !== lastTarget) { lastTarget = target; window.playUIHoverSound(); } 
        else if (!target) lastTarget = null;
    });
}

// ======================================================
// 12. REGISTRO DE PONTOS
// ======================================================
window.registrarVitoriaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            let pontosGanhos = (modo === 'pvp') ? 8 : 1; 
            await updateDoc(userRef, {
                totalWins: (data.totalWins || 0) + 1,
                score: (data.score || 0) + pontosGanhos
            });
        }
    } catch(e) { console.error(e); }
};

window.registrarDerrotaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            let pontosPerdidos = (modo === 'pvp') ? 8 : 3;
            let novoScore = Math.max(0, (data.score || 0) - pontosPerdidos);
            await updateDoc(userRef, { score: novoScore });
        }
    } catch(e) { console.error(e); }
};
