// ARQUIVO: js/main.js (VERSÃO CORREÇÃO UI: SELAÇÃO DE DECK E MATCHMAKING)

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("Main.js carregado - Versão UI Fix...");

// --- CONFIGURAÇÃO FIREBASE ---
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
} catch (e) {
    console.error("Erro Firebase (Modo Offline):", e);
}

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
let gameStarted = false; 
window.gameAssets = []; 
window.pvpUnsubscribe = null; 
let searchInterval = null;

// --- ASSETS LOCAIS ---
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
        'assets/img/logo_buppo.png',
        'assets/img/mesa_cavaleiro.png',
        'assets/img/mesa_mago.png',
        'assets/img/bg_saguao.png',
        'assets/img/ui_moldura_perfil.png',
        'assets/img/ui_placa_selecao.png',
        'assets/img/card_selecao_cavaleiro.png',
        'assets/img/card_selecao_mago.png',
        'assets/img/deck_verso_cavaleiro.png',
        'assets/img/deck_verso_mago.png',
        'assets/img/card_verso_padrao.png',
        'assets/img/ui_mesa_deck.png',
        'assets/img/ui_area_xp.png',
        'assets/img/carta_ataque_cavaleiro.png',
        'assets/img/carta_bloqueio_cavaleiro.png',
        'assets/img/carta_descansar_cavaleiro.png',
        'assets/img/carta_desarmar_cavaleiro.png',
        'assets/img/carta_treinar_cavaleiro.png',
        'assets/img/carta_ataque_mago.png',
        'assets/img/carta_bloqueio_mago.png',
        'assets/img/carta_descansar_mago.png',
        'assets/img/carta_desarmar_mago.png',
        'assets/img/carta_treinar_mago.png'
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
let totalAssets = ASSETS_TO_LOAD.images.length + ASSETS_TO_LOAD.audio.length;

let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let isProcessing = false; let turnCount = 1; let playerHistory = []; 
window.masterVol = 1.0; 
let isLethalHover = false; 
let mixerInterval = null;

// --- ESTADOS GLOBAIS ---
window.isMatchStarting = false;
window.currentDeck = 'knight';
window.myRole = null; 
window.currentMatchId = null;
window.pvpSelectedCardIndex = null; 
window.isResolvingTurn = false; 
window.pvpStartData = null; 

function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) {
        return MAGE_ASSETS[cardKey];
    }
    if (CARDS_DB[cardKey]) {
        return CARDS_DB[cardKey].img;
    }
    return '';
}

function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
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
    for(let k in DECK_TEMPLATE) {
        for(let i=0; i<DECK_TEMPLATE[k]; i++) deck.push(k);
    }
    shuffle(deck);
    return deck;
}

const MusicController = {
    currentTrackId: null,
    fadeTimer: null,
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
            if (this.currentTrackId && audios[this.currentTrackId]) {
                const oldAudio = audios[this.currentTrackId];
                this.fadeOut(oldAudio);
            }
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
        } catch(e) { console.warn("MusicController:", e); }
    },
    stopCurrent() {
        if (this.currentTrackId && audios[this.currentTrackId]) {
            this.fadeOut(audios[this.currentTrackId]);
        }
        this.currentTrackId = null;
    },
    fadeOut(audio) {
        if(!audio) return;
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) {
                vol -= 0.05;
                try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); }
            } else {
                try { audio.volume = 0; audio.pause(); } catch(e){}
                clearInterval(fadeOutInt);
            }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        if(!audio) return;
        let vol = 0;
        audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) {
                vol += 0.05;
                try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); }
            } else {
                try { audio.volume = targetVol; } catch(e){}
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
        if(audio && audio.paused) audio.play().catch(()=>{});
    }
}

window.playNavSound = function() { 
    let s = audios['sfx-nav']; 
    if(s) { 
        try {
            if (s.readyState >= 2) s.currentTime = 0; 
            s.play().catch(()=>{});
        } catch(e) { console.warn("NavSound", e); }
    } 
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

// --- FUNÇÃO CRÍTICA: GERENCIADOR DE TELAS ---
// Garante que apenas UMA tela esteja visível por vez e limpa a sujeira
window.showScreen = function(screenId) {
    console.log(`Trocando para tela: ${screenId}`);
    
    // 1. Esconde TODAS as telas e remove active
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // Força o hide
        s.style.opacity = '0';
        s.style.pointerEvents = 'none';
    });

    // 2. Seleciona a tela alvo
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
        console.error(`Tela não encontrada: ${screenId}`);
        return;
    }

    // 3. Mostra a tela alvo
    targetScreen.classList.add('active');
    targetScreen.style.display = 'flex'; // Força flex
    setTimeout(() => {
        targetScreen.style.opacity = '1';
        targetScreen.style.pointerEvents = 'auto';
    }, 50);

    // 4. Lógica específica por tela
    const configBtn = document.getElementById('btn-config-toggle');
    const surrenderBtn = document.getElementById('btn-surrender');
    const panel = document.getElementById('config-panel');

    if(screenId === 'game-screen') {
        if(surrenderBtn) surrenderBtn.style.display = 'block';
        if(configBtn) configBtn.style.display = 'flex'; 
    } else {
        if(surrenderBtn) surrenderBtn.style.display = 'none';
        if(configBtn) configBtn.style.display = 'none';
        if(panel) { panel.style.display = 'none'; panel.classList.remove('active'); }
    }
}

// --- CONTROLE DE TELA CHEIA E ROTAÇÃO ---
window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    // Não use showScreen aqui diretamente, apenas prepare a tela
    const ds = document.getElementById('deck-selection-screen');
    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        opt.style = ""; // Reset animações
        const img = opt.querySelector('img');
        if(img) img.style = "";
    });
    
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
        div.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 20px;">↻</div>
            <div>GIRE O CELULAR<br>PARA JOGAR</div>
        `;
        document.body.appendChild(div);
    }
})();

// --- SELEÇÃO DE DECK (CORRIGIDO) ---
window.selectDeck = function(deckType) {
    console.log("Deck selecionado:", deckType);
    if(audios['sfx-deck-select']) {
        try {
            audios['sfx-deck-select'].currentTime = 0;
            audios['sfx-deck-select'].play().catch(()=>{});
        } catch(e){}
    }

    window.currentDeck = deckType; 
     
    // Aplica tema
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 
    if (deckType === 'mage') {
        document.body.classList.add('theme-mago');
    } else {
        document.body.classList.add('theme-cavaleiro');
    }

    // Animação de seleção
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

    // Aguarda animação e troca de tela
    setTimeout(() => {
        if (window.gameMode === 'pvp') {
            console.log("Indo para Matchmaking...");
            initiateMatchmaking(); 
        } else {
            console.log("Indo para Jogo PvE...");
            window.transitionToGame();
        }
    }, 500);
};

window.transitionToGame = function() {
    // 1. Limpa Saguão
    clearLobbyFlares();
    let bg = document.getElementById('game-background');
    if(bg) bg.classList.remove('lobby-mode');

    // 2. Tela de Transição
    const transScreen = document.getElementById('transition-overlay');
    const transText = transScreen.querySelector('.trans-text');
    if(transText) transText.innerText = "PREPARANDO BATALHA...";
    if(transScreen) transScreen.classList.add('active');
    
    // 3. Prepara o jogo
    setTimeout(() => {
        MusicController.play('bgm-loop'); 
        
        // FORÇA A TROCA DE TELA AQUI
        window.showScreen('game-screen');
        
        const handEl = document.getElementById('player-hand'); 
        if(handEl) handEl.innerHTML = '';
        
        setTimeout(() => {
            if(transScreen) transScreen.classList.remove('active');
            setTimeout(() => { startGameFlow(); }, 200); 
        }, 1500);
    }, 500); 
}

window.transitionToLobby = function(skipAnim = false) {
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    document.body.classList.remove('force-landscape');
    
    if (skipAnim) {
        window.goToLobby(false);
    } else {
        const transScreen = document.getElementById('transition-overlay');
        const transText = transScreen.querySelector('.trans-text');
        if(transText) transText.innerText = "RETORNANDO AO SAGUÃO...";
        if(transScreen) transScreen.classList.add('active');
        
        setTimeout(() => {
            window.goToLobby(false); 
            setTimeout(() => {
                if(transScreen) transScreen.classList.remove('active');
            }, 1000); 
        }, 500);
    }
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser && !isAutoLogin) {
        if(auth.currentUser) currentUser = auth.currentUser;
        else {
            window.showScreen('start-screen');
            MusicController.play('bgm-menu'); 
            return;
        }
    }
    isProcessing = false; 
    let bg = document.getElementById('game-background');
    if(bg) bg.classList.add('lobby-mode');
     
    MusicController.play('bgm-menu'); 
    createLobbyFlares();
     
    if (currentUser) {
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

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    window.isResolvingTurn = false; 
    window.pvpSelectedCardIndex = null; 
    startCinematicLoop(); 
    window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand');
    if (handEl) {
        handEl.innerHTML = '';
        handEl.classList.add('preparing'); 
    }
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
    turnCount = 1; 
    playerHistory = [];
    drawCardLogic(monster, 6); 
    drawCardLogic(player, 6); 
    updateUI(); 
    dealAllInitialCards();
    if(window.gameMode === 'pvp') {
        startPvPListener();
    }
}

// ======================================================
// LISTENER PVP CORRIGIDO
// ======================================================
function startPvPListener() {
    if(!window.currentMatchId) return;
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    const matchRef = doc(db, "matches", window.currentMatchId);
    let namesUpdated = false;
    console.log("Iniciando escuta PvP na partida:", window.currentMatchId);
     
    const ensureMyRole = (data) => {
        if (window.myRole) return;
        if(data.player1.uid === currentUser.uid) window.myRole = 'player1';
        else window.myRole = 'player2';
    };

    window.pvpUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();
        ensureMyRole(matchData);

        if (matchData.status === 'abandoned') {
            if (matchData.abandonedBy && currentUser && matchData.abandonedBy !== currentUser.uid) {
                console.log("Oponente desconectou. Decretando vitória.");
                monster.hp = 0;
                updateUI();
                isProcessing = true;
                MusicController.stopCurrent();
                setTimeout(() => {
                    const title = document.getElementById('end-title');
                    title.innerText = "VITÓRIA";
                    title.className = "win-theme";
                    showCenterText("OPONENTE DESISTIU!", "#ffd700");
                    playSound('sfx-win');
                    if(window.registrarVitoriaOnline) window.registrarVitoriaOnline('pvp');
                    document.getElementById('end-screen').classList.add('visible');
                    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
                }, 500);
            }
            return; 
        }

        if (!namesUpdated && matchData.player1 && matchData.player2) {
            let myName, enemyName;
            if (window.myRole === 'player1') {
                myName = matchData.player1.name;
                enemyName = matchData.player2.name;
            } else {
                myName = matchData.player2.name;
                enemyName = matchData.player1.name;
            }
            const pNameEl = document.querySelector('#p-stats-cluster .unit-name');
            const mNameEl = document.querySelector('#m-stats-cluster .unit-name');
            if(pNameEl) pNameEl.innerText = myName;
            if(mNameEl) mNameEl.innerText = enemyName;
            namesUpdated = true; 
        }

        if (matchData.p1Move && matchData.p2Move) {
            if (!window.isResolvingTurn) {
                console.log("Turno pronto! Resolvendo...");
                resolvePvPTurn(matchData.p1Move, matchData.p2Move, matchData.p1Disarm, matchData.p2Disarm);
            }
        }
        
        if (window.gameMode === 'pvp' && window.myRole) {
            const enemyRole = (window.myRole === 'player1') ? 'player2' : 'player1';
            const enemyData = matchData[enemyRole];
            
            if (enemyData) {
                if(enemyData.deck) monster.deck = [...enemyData.deck];

                const serverXP = enemyData.xp || [];
                const localXP = monster.xp || [];

                if (serverXP.length > localXP.length) {
                    const diff = serverXP.length - localXP.length;
                    const startIdx = localXP.length;
                    console.log(`Inimigo ganhou ${diff} carta(s) de XP. Atualizando visual.`);
                    for (let i = startIdx; i < serverXP.length; i++) {
                        const newCardKey = serverXP[i];
                        animateFly('m-deck-container', 'm-xp', newCardKey, () => {
                            triggerXPGlow('m');
                        }, false, false, false);
                    }
                    monster.xp = [...serverXP];
                    updateUI();
                } 
                else if (serverXP.length < localXP.length) {
                    monster.xp = [...serverXP];
                    if(enemyData.lvl) monster.lvl = enemyData.lvl;
                    checkLevelUp(monster, () => {}); 
                    updateUI();
                }
            }
        }
    });
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
            if(isWin && !isTie) { if(window.registrarVitoriaOnline) window.registrarVitoriaOnline(window.gameMode); } 
            else { if(window.registrarDerrotaOnline) window.registrarDerrotaOnline(window.gameMode); }
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
        console.error("Erro no Login:", error);
        btnText.innerText = "ERRO - TENTE NOVAMENTE";
        setTimeout(() => btnText.innerText = "LOGIN COM GOOGLE", 3000);
    }
};

window.handleLogout = function() {
    window.playNavSound();
    signOut(auth).then(() => { location.reload(); });
};

window.registrarVitoriaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            let modoAtual = window.gameMode || 'pve';
            let pontosGanhos = (modoAtual === 'pvp') ? 8 : 1; 
            await updateDoc(userRef, {
                totalWins: (data.totalWins || 0) + 1,
                score: (data.score || 0) + pontosGanhos
            });
            console.log(`Vitória registrada (${modoAtual}): +${pontosGanhos} pontos.`);
        }
    } catch(e) { console.error("Erro ao salvar vitória:", e); }
};

window.registrarDerrotaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            let modoAtual = window.gameMode || 'pve';
            let pontosPerdidos = (modoAtual === 'pvp') ? 8 : 3;
            let novoScore = Math.max(0, (data.score || 0) - pontosPerdidos);
            await updateDoc(userRef, {
                score: novoScore
            });
            console.log(`Derrota registrada (${modoAtual}): -${pontosPerdidos} pontos.`);
        }
    } catch(e) { console.error("Erro ao salvar derrota:", e); }
};

window.restartMatch = function() {
    document.getElementById('end-screen').classList.remove('visible');
    setTimeout(startGameFlow, 50);
    MusicController.play('bgm-loop'); 
}

async function notifyAbandonment() {
    if (!window.currentMatchId || !currentUser) return;
    console.log("Tentando notificar abandono ao servidor...");
    const matchRef = doc(db, "matches", window.currentMatchId);
    try {
        await updateDoc(matchRef, {
            status: 'abandoned',
            abandonedBy: currentUser.uid
        });
        console.log("Abandono notificado com sucesso.");
    } catch (e) {
        console.error("Erro ao notificar abandono:", e);
    }
}

window.abandonMatch = function() {
    if(document.getElementById('game-screen').classList.contains('active')) {
        window.toggleConfig(); 
        window.openModal(
            "ABANDONAR?", 
            "Sair da partida contará como DERROTA. Tem certeza?", 
            ["CANCELAR", "SAIR"], 
            async (choice) => { 
                if (choice === "SAIR") {
                    if (window.gameMode === 'pvp') {
                        await notifyAbandonment(); 
                    }
                    window.registrarDerrotaOnline(window.gameMode);
                    window.transitionToLobby();
                }
            }
        );
    }
}

function preloadGame() {
    console.log("Iniciando Preload...");
    ASSETS_TO_LOAD.images.forEach(src => { 
        let img = new Image(); 
        img.src = src; 
        window.gameAssets.push(img);
        img.onload = () => updateLoader(); 
        img.onerror = () => updateLoader(); 
    });
    ASSETS_TO_LOAD.audio.forEach(a => { 
        let s = new Audio(); 
        s.src = a.src; 
        s.preload = 'auto'; 
        if(a.loop) s.loop = true; 
        let counted = false;
        const countOnce = () => { if(!counted) { updateLoader(); counted = true; } };
        audios[a.id] = s; 
        window.gameAssets.push(s);
        s.onloadedmetadata = countOnce; 
        s.onerror = countOnce; 
        setTimeout(() => { if(s.readyState === 0) countOnce(); }, 2000); 
    });
}

function updateLoader() {
    assetsLoaded++; 
    let pct = Math.min(100, (assetsLoaded / totalAssets) * 100); 
    const fill = document.getElementById('loader-fill');
    if(fill) fill.style.width = pct + '%';
    
    if(assetsLoaded >= totalAssets) {
        finishLoading();
    }
}

function finishLoading() {
    if(gameStarted) return;
    gameStarted = true;
    console.log("Preload completo!");
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

document.addEventListener("DOMContentLoaded", () => {
    preloadGame();
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
        btnSound.onclick = null; 
        btnSound.addEventListener('click', (e) => {
            e.stopPropagation(); 
            window.toggleMute();
        });
    }
    const deckScreen = document.getElementById('deck-selection-screen');
    if (deckScreen) {
        let backBtn = deckScreen.querySelector('.btn-back') || deckScreen.querySelector('.circle-btn') || deckScreen.querySelector('button'); 
        if (backBtn) {
            backBtn.style.zIndex = "9999"; 
            backBtn.style.pointerEvents = "all"; 
            backBtn.onclick = function(e) {
                e.preventDefault(); e.stopPropagation();
                window.playNavSound();
                window.transitionToLobby(true); 
            };
        }
    }
});

document.addEventListener('click', function(e) {
    const target = e.target.closest('#deck-selection-screen .circle-btn, #deck-selection-screen .btn-back, #deck-selection-screen button, .return-btn');
    if (target) {
        e.stopPropagation();
        window.playNavSound();
        window.transitionToLobby(true); 
    }
});

window.addEventListener('beforeunload', () => {
    if (window.gameMode === 'pvp' && window.currentMatchId && !document.getElementById('end-screen').classList.contains('visible')) {
        notifyAbandonment();
    }
});

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
        flare.style.pointerEvents = 'none'; // CRÍTICO: Não bloquear cliques
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

// === LIMPEZA DE PARTÍCULAS ===
function clearLobbyFlares() {
    const container = document.getElementById('lobby-particles');
    if(container) container.innerHTML = '';
}

function startCinematicLoop() { const c = audios['sfx-cine']; if(c) {try { c.volume = 0; c.play().catch(()=>{}); } catch(e){} if(mixerInterval) clearInterval(mixerInterval); mixerInterval = setInterval(updateAudioMixer, 30); }}

function updateAudioMixer() { 
    const cineAudio = audios['sfx-cine']; 
    if(!cineAudio) return; 
    const mVol = window.masterVol || 1.0;
    const maxCine = 0.6 * mVol; 
    let targetCine = isLethalHover ? maxCine : 0; 
    if(window.isMuted) { try { cineAudio.volume = 0; } catch(e){} return; }
    try {
        if(cineAudio.volume < targetCine) cineAudio.volume = Math.min(targetCine, cineAudio.volume + 0.05); 
        else if(cineAudio.volume > targetCine) cineAudio.volume = Math.max(targetCine, cineAudio.volume - 0.05); 
    } catch(e){}
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
            try {
                if(k === 'sfx-ui-hover') {
                    audios[k].volume = 0.3 * vol;
                } else if (k === 'sfx-levelup') {
                    audios[k].volume = 1.0 * vol;
                } else if (k === 'sfx-train') {
                    audios[k].volume = 0.5 * vol;
                } else {
                    audios[k].volume = 0.8 * vol;
                }
            } catch(e){}
        }
    }); 
}
function playSound(key) { 
    if(audios[key]) { 
        try {
            if (key === 'sfx-levelup') {
                audios[key].volume = 1.0 * (window.masterVol || 1.0);
                if (audios[key].readyState >= 2) audios[key].currentTime = 0; 
                audios[key].play().catch(e => console.log("Audio prevented:", e));
                let clone = audios[key].cloneNode();
                clone.volume = audios[key].volume;
                clone.play().catch(()=>{});
            } else {
                if (audios[key].readyState >= 2) audios[key].currentTime = 0; 
                audios[key].play().catch(e => console.log("Audio prevented:", e)); 
            }
        } catch(e){}
    } 
}

function initAmbientParticles() { const container = document.getElementById('ambient-particles'); if(!container) return; for(let i=0; i<50; i++) { let d = document.createElement('div'); d.className = 'ember'; d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (5 + Math.random() * 5) + 's'; d.style.setProperty('--mx', (Math.random() - 0.5) * 50 + 'px'); container.appendChild(d); } }
initAmbientParticles();

function spawnParticles(x, y, color) { for(let i=0; i<15; i++) { let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color; p.style.left = x + 'px'; p.style.top = y + 'px'; let angle = Math.random() * Math.PI * 2; let vel = 50 + Math.random() * 100; p.style.setProperty('--tx', `${Math.cos(angle)*vel}px`); p.style.setProperty('--ty', `${Math.sin(angle)*vel}px`); document.body.appendChild(p); setTimeout(() => p.remove(), 800); } }

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

        if (isPlayer) {
            document.body.classList.add('shake-screen'); 
            setTimeout(() => document.body.classList.remove('shake-screen'), 400); 
            if(window.triggerDamageEffect) window.triggerDamageEffect(); 
            let ov = document.getElementById('dmg-overlay'); 
            if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 150); } 
        }

    } catch(e) {} 
}

function triggerCritEffect() { let ov = document.getElementById('crit-overlay'); if(ov) { ov.style.opacity = '1'; document.body.style.filter = "grayscale(0.8) contrast(1.2)"; document.body.style.transition = "filter 0.05s"; setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => { document.body.style.transition = "filter 0.5s"; document.body.style.filter = "none"; }, 800); }, 100); } }

function triggerHealEffect(isPlayer) { 
    try { 
        let elId = isPlayer ? 'p-slot' : 'm-slot'; 
        let slot = document.getElementById(elId); 
        if(slot) { 
            let r = slot.getBoundingClientRect(); 
            if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#2ecc71'); 
        } 
        
        if (isPlayer) {
            if(window.triggerHealEffect) window.triggerHealEffect();
            let ov = document.getElementById('heal-overlay'); 
            if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 300); } 
        }
    } catch(e) {} 
}

function triggerBlockEffect(isPlayer) { 
    try { 
        if(isPlayer && window.currentDeck === 'mage') {
             playSound('sfx-block-mage');
        } else {
             playSound('sfx-block'); 
        }
        
        if (!isPlayer) {
             if(window.triggerBlockEffect) window.triggerBlockEffect(); 
             
             let ov = document.getElementById('block-overlay'); 
             if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 200); } 
             document.body.classList.add('shake-screen'); 
             setTimeout(() => document.body.classList.remove('shake-screen'), 200); 
        }
    } catch(e) {
        console.warn("Erro no efeito de bloqueio (ignorado):", e);
    } 
}

function triggerXPGlow(unitId) { let xpArea = document.getElementById(unitId + '-xp'); if(xpArea) { xpArea.classList.add('xp-glow'); setTimeout(() => xpArea.classList.remove('xp-glow'), 600); } }
function showCenterText(txt, col) { let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; if(col) el.style.color = col; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }

// ATUALIZAÇÃO: Aceita um deck opcional e faz cópia segura
function resetUnit(u, predefinedDeck = null, role = null) { 
    u.hp = 6; 
    u.maxHp = 6; 
    u.lvl = 1; 
    u.xp = []; 
    u.hand = []; 
    u.originalRole = role || 'pve'; // IDENTIDADE FIXA (player1/player2)
    
    // Importante: Cria cópia ([...]) para não mexer no array original do banco
    if (predefinedDeck) {
        console.log(`[SYNC] Carregando deck sincronizado para ${u.id}: ${predefinedDeck.length} cartas.`);
        u.deck = [...predefinedDeck]; 
    } else {
        console.log(`[SYNC] Gerando deck local para ${u.id}.`);
        u.deck = []; 
        for(let k in DECK_TEMPLATE) {
            for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k);
        } 
        shuffle(u.deck); 
    }
    
    u.disabled = null; 
    u.bonusBlock = 0; 
    u.bonusAtk = 0; 
}

function dealAllInitialCards() {
    isProcessing = true; 
    playSound('sfx-deal'); 
    
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
    
    // Se já escolheu uma carta no PvP, não deixa clicar em outra
    if (window.gameMode === 'pvp' && window.pvpSelectedCardIndex !== null) return;

    playSound('sfx-play'); document.body.classList.remove('focus-hand'); document.body.classList.remove('cinematic-active'); document.body.classList.remove('tension-active');
    document.getElementById('tooltip-box').style.display = 'none'; isLethalHover = false; 
    let cardKey = player.hand[index];
    if(player.disabled === cardKey) { showCenterText("DESARMADA!"); return; }
    
    if(cardKey === 'DESARMAR') { 
        window.openModal('ALVO DO DESARME', 'Qual ação bloquear no inimigo?', ACTION_KEYS, (choice) => {
            if(window.gameMode === 'pvp') {
                lockInPvPMove(index, choice); 
            } else {
                playCardFlow(index, choice); 
            }
        }); 
    } else { 
        if(window.gameMode === 'pvp') {
            lockInPvPMove(index, null); 
        } else {
            playCardFlow(index, null); 
        }
    }
}

// ATUALIZAÇÃO: TRAVAR CARTA NO PVP
async function lockInPvPMove(index, disarmChoice) {
    const handContainer = document.getElementById('player-hand');
    const cardEl = handContainer.children[index];
    if(cardEl) {
        cardEl.classList.add('card-selected');
    }

    window.pvpSelectedCardIndex = index;
    
    isProcessing = true; 
    showCenterText("AGUARDANDO OPONENTE...", "#ffd700");

    const cardKey = player.hand[index];
    const matchRef = doc(db, "matches", window.currentMatchId);
    
    const updateField = (window.myRole === 'player1') ? 'p1Move' : 'p2Move';
    const disarmField = (window.myRole === 'player1') ? 'p1Disarm' : 'p2Disarm';
    
    try {
        await updateDoc(matchRef, {
            [updateField]: cardKey,
            [disarmField]: disarmChoice || null
        });
    } catch (e) {
        console.error("Erro ao enviar jogada:", e);
        isProcessing = false;
        window.pvpSelectedCardIndex = null;
        if(cardEl) cardEl.classList.remove('card-selected');
    }
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

async function playCardFlow(index, pDisarmChoice) {
    isProcessing = true; 
    let cardKey = player.hand.splice(index, 1)[0]; 
    playerHistory.push(cardKey);

    // --- MODO PvE (IA) ---
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

// ATUALIZAÇÃO: Animação Simultânea e Resolução
async function resolvePvPTurn(p1Move, p2Move, p1Disarm, p2Disarm) {
    if (window.isResolvingTurn) return; 
    window.isResolvingTurn = true; 
    isProcessing = true; // Trava cliques
    
    // Remove texto de espera
    const centerTxt = document.querySelector('.center-text');
    if(centerTxt) centerTxt.remove();

    // Identifica moves
    let myMove, enemyMove, myDisarmChoice, enemyDisarmChoice;
    if (window.myRole === 'player1') {
        myMove = p1Move; enemyMove = p2Move;
        myDisarmChoice = p1Disarm; enemyDisarmChoice = p2Disarm;
    } else {
        myMove = p2Move; enemyMove = p1Move;
        myDisarmChoice = p2Disarm; enemyDisarmChoice = p1Disarm;
    }

    // --- LÓGICA VISUAL DA MÃO (Sem risco de crashar o jogo) ---
    try {
        if (window.pvpSelectedCardIndex === null || window.pvpSelectedCardIndex === undefined) {
            window.pvpSelectedCardIndex = player.hand.indexOf(myMove);
        }
        const handContainer = document.getElementById('player-hand');
        let myCardEl = null;
        let startRect = null;

        if (handContainer) {
            if (window.pvpSelectedCardIndex > -1 && handContainer.children[window.pvpSelectedCardIndex]) {
                myCardEl = handContainer.children[window.pvpSelectedCardIndex];
            } else {
                const handCards = Array.from(handContainer.children);
                if(handCards.length > 0) myCardEl = handCards[0]; 
            }
        }
        if (myCardEl) {
            startRect = myCardEl.getBoundingClientRect();
            myCardEl.classList.remove('card-selected');
            myCardEl.style.opacity = '0';
        }
        // Remove da mão (visual/logico)
        if (window.pvpSelectedCardIndex > -1) {
            player.hand.splice(window.pvpSelectedCardIndex, 1);
        } else {
            const idx = player.hand.indexOf(myMove);
            if(idx > -1) player.hand.splice(idx, 1);
        }
        playerHistory.push(myMove);

        // Animação de entrada
        animateFly(startRect || 'player-hand', 'p-slot', myMove, () => {
            renderTable(myMove, 'p-slot', true);
        }, false, true, true);

        const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 };
        animateFly(opponentHandOrigin, 'm-slot', enemyMove, () => {
            renderTable(enemyMove, 'm-slot', false);
        }, false, true, false);

    } catch (e) {
        console.error("Erro na preparação visual (ignorado):", e);
    }

    // --- RESOLUÇÃO BLINDADA ---
    setTimeout(() => {
        try {
            // 1. GARANTIA DE LIMPEZA DO BANCO
            if (window.myRole === 'player1') {
                setTimeout(() => {
                    const matchRef = doc(db, "matches", window.currentMatchId);
                    updateDoc(matchRef, {
                        p1Move: null, p2Move: null,
                        p1Disarm: null, p2Disarm: null,
                        turn: increment(1) 
                    }).then(() => console.log("Turno limpo no DB com sucesso."))
                      .catch(err => console.error("Erro crítico ao limpar turno:", err));
                }, 4000); 
            }

            // 2. TENTA RESOLVER A LÓGICA
            resolveTurn(myMove, enemyMove, myDisarmChoice, enemyDisarmChoice);
        } catch (error) {
            console.error("CRASH NO RESOLVE TURN (Recuperando...):", error);
            // Em caso de erro grave, forçamos o destravamento
            updateUI();
            window.isResolvingTurn = false;
            isProcessing = false;
        } 
        
        // 3. FAILSAFE: Destrava tudo depois de 4.5 segundos
        setTimeout(() => {
            console.log("Executando Failsafe de Destravamento...");
            window.pvpSelectedCardIndex = null;
            window.isResolvingTurn = false;
            if (isProcessing) {
                console.warn("UI estava travada. Forçando liberação.");
                isProcessing = false;
            }
        }, 4500);

    }, 600);
}

// === NOVO: COMMITAR O TURNO AO DB DE FORMA CORRETA ===
// Agora salva o array INTEIRO para garantir consistência
async function commitTurnToDB(pAct, extraCard = null) {
    if (!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    
    // Constrói o novo estado local
    let newXP = [...player.xp]; // Já foi atualizado localmente no resolveTurn
    let newDeck = [...player.deck]; // Já foi atualizado localmente no resolveTurn

    try {
        let updateData = {};
        if (window.myRole === 'player1') {
            updateData['player1.xp'] = newXP;
            updateData['player1.deck'] = newDeck;
        } else {
            updateData['player2.xp'] = newXP;
            updateData['player2.deck'] = newDeck;
        }
        
        console.log("Commitando turno ao DB (XP Total):", newXP);
        await updateDoc(matchRef, updateData);
        
    } catch (e) {
        console.error("Erro ao commitar turno ao DB:", e);
    }
}

// CORREÇÃO CRÍTICA: AGORA O CÁLCULO DE DANO INCLUI O BÔNUS (MAESTRIA)
function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    let pDmg = 0, mDmg = 0;
    
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train');
    if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');

    // DANO = NIVEL + BONUS DE MAESTRIA
    if(mAct === 'ATAQUE') { pDmg += (monster.lvl + monster.bonusAtk); }
    if(pAct === 'ATAQUE') { mDmg += (player.lvl + player.bonusAtk); }
    
    // BLOQUEIO REFLETE = 1 + BONUS DE MAESTRIA
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') { mDmg += (1 + player.bonusBlock); } }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') { pDmg += (1 + monster.bonusBlock); } }

    let clash = false;
    let pBlocks = (pAct === 'BLOQUEIO' && mAct === 'ATAQUE'); 
    let mBlocks = (mAct === 'BLOQUEIO' && pAct === 'ATAQUE'); 
    
    if(pBlocks) { clash = true; triggerBlockEffect(true); }
    else if(mBlocks) { clash = true; triggerBlockEffect(false); }

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
        if (!mBlocks) { triggerDamageEffect(true, soundOn); }
    }

    if(mDmg > 0) { 
        monster.hp -= mDmg; 
        showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); 
        let soundOn = !(clash && pAct === 'BLOQUEIO'); 
        triggerDamageEffect(false, soundOn); 
    }
    
    updateUI();
    let pDead = player.hp <= 0, mDead = monster.hp <= 0;
    
    if(!pDead && pAct === 'DESCANSAR') { let healAmount = (pDmg === 0) ? 3 : 2; player.hp = Math.min(player.maxHp, player.hp + healAmount); showFloatingText('p-lvl', `+${healAmount} HP`, "#55efc4"); triggerHealEffect(true); playSound('sfx-heal'); }
    if(!mDead && mAct === 'DESCANSAR') { let healAmount = (mDmg === 0) ? 3 : 2; monster.hp = Math.min(monster.maxHp, monster.hp + healAmount); triggerHealEffect(false); playSound('sfx-heal'); }

    // CORREÇÃO: LÓGICA DE XP EXTRA NO PVP (TREINAR + BONUS)
    function handleExtraXP(u) { 
        // LÓGICA PVP:
        if (window.gameMode === 'pvp' && window.currentMatchId) {
             // SÓ CALCULA SE FOR O PRÓPRIO JOGADOR
             if (u === player) {
                 if(u.deck.length > 0) {
                     let card = u.deck.pop(); 
                     // Animação Local
                     animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { 
                        u.xp.push(card); triggerXPGlow(u.id); updateUI(); 
                     }, false, false, true);
                 }
             }
             // SE FOR O INIMIGO, NÃO FAZ NADA AQUI. 
             // O LISTENER DO DB VAI VER QUE O ARRAY CRESCEU E ANIMAR.
        } 
        // LÓGICA PVE (Normal):
        else {
            if(u.deck.length > 0) { 
                let card = u.deck.pop(); 
                animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { 
                    u.xp.push(card); triggerXPGlow(u.id); updateUI(); 
                }, false, false, (u.id === 'p')); 
            } 
        }
    }

    // 1. Efeito da Carta TREINAR
    if(!pDead && pAct === 'TREINAR') handleExtraXP(player); 
    if(!mDead && mAct === 'TREINAR') handleExtraXP(monster);

    // 2. Efeito de ATAQUE vs DESCANSAR
    if(!pDead && pAct === 'ATAQUE' && mAct === 'DESCANSAR') handleExtraXP(player); 
    if(!mDead && mAct === 'ATAQUE' && pAct === 'DESCANSAR') handleExtraXP(monster);

    setTimeout(() => {
        // MOVIMENTO DA CARTA DA MÃO PARA A XP
        animateFly('p-slot', 'p-xp', pAct, () => { 
            if(!pDead) { 
                player.xp.push(pAct); 
                triggerXPGlow('p'); 
                updateUI(); 

                // AGORA SALVAMOS TUDO NO DB DE UMA VEZ
                if (window.gameMode === 'pvp') {
                    commitTurnToDB(pAct); 
                }
            } 
            
            checkLevelUp(player, () => { 
                if(!pDead) drawCardAnimated(player, 'p-deck-container', 'player-hand', () => { drawCardLogic(player, 1); turnCount++; updateUI(); isProcessing = false; }); 
            }); 
        }, false, false, true);

        animateFly('m-slot', 'm-xp', mAct, () => { 
            if (window.gameMode !== 'pvp' && !mDead) { 
                monster.xp.push(mAct); 
                triggerXPGlow('m'); 
                updateUI(); 
            } 
            checkLevelUp(monster, () => { 
                if(!mDead) drawCardLogic(monster, 1); 
                checkEndGame(); 
            }); 
        }, false, false, false);
        
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

// ATUALIZAÇÃO: CHECK LEVEL UP COM SYNC RNG (CORRIGIDO)
function checkLevelUp(u, doneCb) {
    if(u.xp.length >= 5) {
        let xpContainer = document.getElementById(u.id + '-xp'); 
        let minis = Array.from(xpContainer.getElementsByClassName('xp-mini'));
        minis.forEach(realCard => {
            let rect = realCard.getBoundingClientRect(); 
            let clone = document.createElement('div'); 
            clone.className = 'xp-anim-clone';
            clone.style.left = rect.left + 'px'; 
            clone.style.top = rect.top + 'px'; 
            clone.style.width = rect.width + 'px'; 
            clone.style.height = rect.height + 'px'; 
            clone.style.backgroundImage = realCard.style.backgroundImage;
            if (u.id === 'p') clone.classList.add('xp-fly-up'); else clone.classList.add('xp-fly-down');
            document.body.appendChild(clone);
        });
        minis.forEach(m => m.style.opacity = '0');

        setTimeout(() => {
            let counts = {}; 
            u.xp.forEach(x => counts[x] = (counts[x]||0)+1); 
            let triggers = []; 
            for(let k in counts) if(counts[k] >= 3 && k !== 'DESCANSAR') triggers.push(k);
            
            processMasteries(u, triggers, () => {
                let lvlEl = document.getElementById(u.id+'-lvl'); 
                // SAFETY CHECK
                if(lvlEl) {
                    u.lvl++; 
                    lvlEl.classList.add('level-up-anim'); 
                    triggerLevelUpVisuals(u.id); 
                    playSound('sfx-levelup'); 
                    setTimeout(() => lvlEl.classList.remove('level-up-anim'), 1000);
                }

                u.xp.forEach(x => u.deck.push(x)); 
                u.xp = []; 
                
                // MÁGICA 2.0: No PvP, usa a role ORIGINAL para a semente
                if (window.gameMode === 'pvp' && window.currentMatchId) {
                    let s = stringToSeed(window.currentMatchId + u.originalRole) + u.lvl;
                    shuffle(u.deck, s);
                    
                    // === SYNC IMPORTANTE: SÓ O DONO DO DECK ATUALIZA O BANCO ===
                    if (u === player) {
                        syncLevelUpToDB(u);
                    }

                } else {
                    shuffle(u.deck); // PvE normal
                }

                let clones = document.getElementsByClassName('xp-anim-clone'); 
                while(clones.length > 0) clones[0].remove();
                updateUI(); 
                doneCb();
            });
        }, 1000); 
    } else { doneCb(); }
}

function triggerLevelUpVisuals(unitId) {
    let clusterId = (unitId === 'p') ? 'p-stats-cluster' : 'm-stats-cluster';
    let cluster = document.getElementById(clusterId);
    if(!cluster) return;
    const text = document.createElement('div');
    text.innerText = "LEVEL UP!";
    text.className = 'levelup-text'; 
    if (unitId === 'p') { text.classList.add('lvl-anim-up'); } else { text.classList.add('lvl-anim-down'); }
    cluster.appendChild(text);
    setTimeout(() => { text.remove(); }, 2000);
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

// CORREÇÃO: Aplicação correta de Dano e Feedback Visual da Maestria
function applyMastery(u, k) { 
    if(k === 'ATAQUE') { 
        u.bonusAtk++; 
        let target = (u === player) ? monster : player; 
        target.hp -= u.bonusAtk; // Dano imediato
        showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675"); 
        triggerDamageEffect(u !== player); 
        checkEndGame(); 
    } 
    if(k === 'BLOQUEIO') u.bonusBlock++; 
    if(k === 'DESCANSAR') { 
        u.maxHp++; 
        showFloatingText(u.id+'-hp-txt', "+1 MAX", "#55efc4"); 
    } 
    updateUI(); // Força a atualização do ícone imediatamente
}

// --- LOADER DE SEGURANÇA FINAL ---
// Garante que o jogo inicie mesmo se os assets falharem
setTimeout(() => {
    if (!gameStarted) {
        console.warn("Timeout de segurança ativado: Iniciando jogo forçadamente.");
        finishLoading();
    }
}, 3000); 

// --- BINDING GLOBAL DE BOTOES (PARA ONCLICK NO HTML) ---
window.startPvE = function() {
    console.log("Botão PvE clicado!");
    window.gameMode = 'pve'; 
    window.playNavSound();
    window.openDeckSelector(); 
};

window.startPvPSearch = function() {
    console.log("Botão PvP clicado!");
    if (!currentUser) {
        console.log("Usuário não logado. Tentando auth global...");
        if(auth.currentUser) currentUser = auth.currentUser;
        else {
            alert("Faça login primeiro!");
            return;
        }
    }
    window.gameMode = 'pvp'; 
    window.playNavSound();
    window.openDeckSelector(); 
};

// --- FUNÇÃO DE SINC DO MATCHMAKING (MOSTRAR TELA DE ESPERA) ---
async function initiateMatchmaking() {
    console.log("--- INICIANDO MATCHMAKING ---");
    
    // IMPORTANTE: Use showScreen para limpar a sujeira anterior
    window.showScreen('matchmaking-screen');
    
    // Reset visual
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE...";
    document.querySelector('.mm-title').style.color = "var(--gold)";
    document.querySelector('.radar-spinner').style.borderColor = "rgba(255, 215, 0, 0.3)";
    document.querySelector('.radar-spinner').style.animation = "spin 1s linear infinite";
    document.querySelector('.cancel-btn').style.display = "block";
    
    // Timer visual
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

    try {
        // 1. Criar meu Ticket na Fila
        myQueueRef = doc(collection(db, "queue")); 
        const myData = {
            uid: currentUser.uid,
            name: currentUser.displayName,
            deck: window.currentDeck,
            timestamp: Date.now(),
            matchId: null,
            cancelled: false, // Importante
            status: 'waiting'
        };
        
        console.log("Criando ticket na fila...", myData);
        await setDoc(myQueueRef, myData);
        console.log("Ticket criado com ID:", myQueueRef.id);

        // 2. Ouvir meu próprio ticket (para saber se alguém me achou)
        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.matchId) {
                    console.log("ALGUÉM ME ACHOU! MatchID:", data.matchId);
                    enterMatch(data.matchId); 
                }
            }
        });

        // 3. Buscar oponentes ativamente (Repetir a cada 4 segundos)
        if (searchInterval) clearInterval(searchInterval);
        
        // Tenta agora
        findOpponentInQueue();
        
        // E continua tentando
        searchInterval = setInterval(() => {
            // Só busca se ainda estiver esperando
            const mmScreen = document.getElementById('matchmaking-screen');
            if (mmScreen.classList.contains('active') 
                && document.querySelector('.mm-title').innerText !== "PARTIDA ENCONTRADA!") {
                console.log("Tentando buscar novamente...");
                findOpponentInQueue();
            } else {
                clearInterval(searchInterval);
            }
        }, 4000);

    } catch (e) {
        console.error("ERRO GRAVE no Matchmaking:", e);
        cancelPvPSearch();
    }
}

async function findOpponentInQueue() {
    try {
        console.log("Executando findOpponentInQueue...");
        const queueRef = collection(db, "queue");
        
        const q = query(
            queueRef, 
            orderBy("timestamp", "desc"), 
            limit(20)
        );

        const querySnapshot = await getDocs(q);
        console.log(`Encontrados ${querySnapshot.size} tickets no total.`);

        let opponentDoc = null;
        const now = Date.now();

        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            const docId = docSnap.id;

            if (data.uid === currentUser.uid) continue;
            if (data.matchId !== null) continue;
            if (data.cancelled === true) continue;
            if (now - data.timestamp > 120000) {
                console.log(`Ticket ${docId} ignorado (Muito antigo/Zumbi)`);
                continue;
            }

            console.log("Oponente VÁLIDO encontrado:", data.name);
            opponentDoc = docSnap;
            break; 
        }

        if (opponentDoc) {
            console.log("Iniciando processo de match com:", opponentDoc.data().name);
            
            if (searchInterval) clearInterval(searchInterval);

            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            const oppRef = opponentDoc.ref;

            await updateDoc(oppRef, { matchId: matchId });
            
            if (myQueueRef) {
                await updateDoc(myQueueRef, { matchId: matchId });
            }

            const p1DeckCards = generateShuffledDeck();
            const p2DeckCards = generateShuffledDeck();

            await createMatchDocument(
                matchId, 
                currentUser.uid, opponentDoc.data().uid, 
                currentUser.displayName, opponentDoc.data().name,
                window.currentDeck, opponentDoc.data().deck,
                p1DeckCards, p2DeckCards
            );
        } else {
            console.log("Nenhum oponente compatível encontrado nesta rodada.");
        }

    } catch (e) {
        console.error("Erro ao buscar oponente na lista:", e);
    }
}

async function createMatchDocument(matchId, p1Id, p2Id, p1Name, p2Name, p1DeckType, p2DeckType, p1DeckCards, p2DeckCards) {
    const matchRef = doc(db, "matches", matchId);
    
    const cleanName1 = p1Name ? p1Name.split(' ')[0].toUpperCase() : "JOGADOR 1";
    const cleanName2 = p2Name ? p2Name.split(' ')[0].toUpperCase() : "JOGADOR 2";
    const d1Type = p1DeckType || 'knight';
    const d2Type = p2DeckType || 'knight';

    await setDoc(matchRef, {
        player1: { 
            uid: p1Id, 
            name: cleanName1, 
            deckType: d1Type, 
            hp: 6, 
            status: 'selecting', 
            hand: [], 
            deck: p1DeckCards, 
            xp: [] 
        },
        player2: { 
            uid: p2Id, 
            name: cleanName2, 
            deckType: d2Type, 
            hp: 6, 
            status: 'selecting', 
            hand: [], 
            deck: p2DeckCards, 
            xp: [] 
        },
        turn: 1,
        status: 'playing', 
        createdAt: Date.now()
    });
}

window.cancelPvPSearch = async function() {
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (searchInterval) clearInterval(searchInterval); 
    
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'none';

    if (myQueueRef) {
        await updateDoc(myQueueRef, { cancelled: true });
        myQueueRef = null;
    }
    window.transitionToLobby(true);
};

async function enterMatch(matchId) {
    console.log("PARTIDA ENCONTRADA! ID:", matchId);
    
    if (queueListener) queueListener();
    if (matchTimerInterval) clearInterval(matchTimerInterval);

    const matchRef = doc(db, "matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if(matchSnap.exists()) {
        const data = matchSnap.data();
        window.pvpStartData = data; 
        if(data.player1.uid === currentUser.uid) window.myRole = 'player1';
        else window.myRole = 'player2';
    }

    document.querySelector('.mm-title').innerText = "PARTIDA ENCONTRADA!";
    document.querySelector('.mm-title').style.color = "#2ecc71";
    document.querySelector('.radar-spinner').style.borderColor = "#2ecc71";
    document.querySelector('.radar-spinner').style.animation = "none";
    document.querySelector('.cancel-btn').style.display = "none";

    setTimeout(() => {
        window.currentMatchId = matchId;
        window.transitionToGame(); 
    }, 1500);
}

// === FUNÇÃO NOVA: Sincroniza Level Up via Banco de Dados ===
async function syncLevelUpToDB(u) {
    if (!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    
    let updates = {};
    let targetKey = "";
    if (u === player) {
        targetKey = (window.myRole === 'player1') ? 'player1' : 'player2';
    } else {
        targetKey = (window.myRole === 'player1') ? 'player2' : 'player1';
    }
    
    updates[`${targetKey}.xp`] = [];        
    updates[`${targetKey}.deck`] = u.deck;  
    updates[`${targetKey}.lvl`] = u.lvl;    
    
    try {
        console.log(`[SYNC] Level Up sincronizado para ${targetKey}.`);
        await updateDoc(matchRef, updates);
    } catch(e) {
        console.error("Erro ao sincronizar Level Up:", e);
    }
}

// === NOVO: COMMITAR O TURNO AO DB ===
async function commitTurnToDB(pAct, extraCard = null) {
    if (!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    let newXP = [...player.xp]; 
    let newDeck = [...player.deck]; 

    try {
        let updateData = {};
        if (window.myRole === 'player1') {
            updateData['player1.xp'] = newXP;
            updateData['player1.deck'] = newDeck;
        } else {
            updateData['player2.xp'] = newXP;
            updateData['player2.deck'] = newDeck;
        }
        await updateDoc(matchRef, updateData);
    } catch (e) {
        console.error("Erro ao commitar turno ao DB:", e);
    }
}
