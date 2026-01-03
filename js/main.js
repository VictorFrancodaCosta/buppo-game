// ARQUIVO: js/main.js (VERSÃO ESTÁVEL - RESTAURAÇÃO TOTAL)

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    console.error("Erro Crítico Firebase:", e);
}

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 
window.pvpUnsubscribe = null; 

// Variáveis de Matchmaking (Sistema Clássico)
let matchTimerInterval = null;
let matchSeconds = 0;
let myQueueRef = null; 
let queueListener = null;
let matchmakingInterval = null; 

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

let totalAssets = ASSETS_TO_LOAD.images.length + ASSETS_TO_LOAD.audio.length;
let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let isProcessing = false; let turnCount = 1; let playerHistory = []; 
window.masterVol = 1.0; 
let isLethalHover = false; 
let mixerInterval = null;

window.isMatchStarting = false;
window.currentDeck = 'knight';
window.myRole = null; 
window.currentMatchId = null;
window.pvpSelectedCardIndex = null; 
window.isResolvingTurn = false; 
window.pvpStartData = null; 

// --- FUNÇÕES AUXILIARES BÁSICAS ---
function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) return MAGE_ASSETS[cardKey];
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
        rng = function() { currentSeed = (currentSeed * 9301 + 49297) % 233280; return currentSeed / 233280; }
    }
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateShuffledDeck() {
    let deck = [];
    for(let k in DECK_TEMPLATE) { for(let i=0; i<DECK_TEMPLATE[k]; i++) deck.push(k); }
    shuffle(deck);
    return deck;
}

// --- MUSIC CONTROLLER ---
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
            if (this.currentTrackId && audios[this.currentTrackId]) {
                this.fadeOut(audios[this.currentTrackId]);
            }
            if (trackId && audios[trackId]) {
                const newAudio = audios[trackId];
                if (newAudio.readyState >= 2) newAudio.currentTime = 0;
                if (!window.isMuted) {
                    newAudio.volume = 0; 
                    newAudio.play().catch(()=>{});
                    this.fadeIn(newAudio, 0.5 * window.masterVol);
                }
            }
            this.currentTrackId = trackId;
        } catch(e) {}
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
            if (vol > 0.05) { vol -= 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); }
            } else { try { audio.volume = 0; audio.pause(); } catch(e){} clearInterval(fadeOutInt); }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        if(!audio) return;
        let vol = 0;
        audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) { vol += 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); }
            } else { try { audio.volume = targetVol; } catch(e){} clearInterval(fadeInInt); }
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
window.playNavSound = function() { let s = audios['sfx-nav']; if(s) { try { if (s.readyState >= 2) s.currentTime = 0; s.play().catch(()=>{}); } catch(e) {} } };
window.playUIHoverSound = function() {
    let now = Date.now(); if (now - lastHoverTime < 50) return; let base = audios['sfx-ui-hover'];
    if(base && !window.isMuted) { try { let s = base.cloneNode(); s.volume = 0.3 * (window.masterVol || 1.0); s.play().catch(()=>{}); lastHoverTime = now; } catch(e){} }
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

// --- MATCHMAKING & NAVEGAÇÃO ---
window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) {
        ds.style.display = 'flex';
        ds.style.opacity = '1';
        ds.style.pointerEvents = 'auto'; 
        const options = document.querySelectorAll('.deck-option');
        options.forEach(opt => { opt.style = ""; const img = opt.querySelector('img'); if(img) img.style = ""; });
    }
    try { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); if (screen.orientation) screen.orientation.lock('landscape').catch(()=>{}); } catch (e) {}
    window.showScreen('deck-selection-screen');
};

window.selectDeck = function(deckType) {
    if(audios['sfx-deck-select']) try { audios['sfx-deck-select'].currentTime = 0; audios['sfx-deck-select'].play().catch(()=>{}); } catch(e){}
    window.currentDeck = deckType; 
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 
    if (deckType === 'mage') document.body.classList.add('theme-mago'); else document.body.classList.add('theme-cavaleiro');

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
            selectionScreen.style.display = 'none';
            if (window.gameMode === 'pvp') initiateMatchmaking(); else window.transitionToGame();
        }, 500);
    }, 400);
};

window.transitionToGame = function() {
    const transScreen = document.getElementById('transition-overlay');
    if(transScreen) {
        transScreen.querySelector('.trans-text').innerText = "PREPARANDO BATALHA...";
        transScreen.classList.add('active');
    }
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

window.transitionToLobby = function(skipAnim = false) {
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    document.body.classList.remove('force-landscape');
    
    const ds = document.getElementById('deck-selection-screen');
    if(ds) { ds.style.opacity = '0'; ds.style.pointerEvents = 'none'; ds.style.display = 'none'; ds.classList.remove('active'); }

    if (skipAnim) {
        window.goToLobby(false);
    } else {
        const transScreen = document.getElementById('transition-overlay');
        if(transScreen) {
            transScreen.querySelector('.trans-text').innerText = "RETORNANDO AO SAGUÃO...";
            transScreen.classList.add('active');
        }
        setTimeout(() => {
            window.goToLobby(false); 
            setTimeout(() => { if(transScreen) transScreen.classList.remove('active'); }, 1000); 
        }, 500);
    }
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) {
        window.showScreen('start-screen');
        MusicController.play('bgm-menu'); 
        return;
    }
    isProcessing = false; 
    let bg = document.getElementById('game-background');
    if(bg) bg.classList.add('lobby-mode');
    MusicController.play('bgm-menu'); 
    createLobbyFlares();
    
    try {
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
    } catch(e) { console.warn("Lobby Error:", e); }
    window.showScreen('lobby-screen');
    document.getElementById('end-screen').classList.remove('visible'); 
};

// --- MATCHMAKING POLLING (SIMPLES E FUNCIONAL) ---
window.startPvE = function() { window.gameMode = 'pve'; window.playNavSound(); window.openDeckSelector(); };
window.startPvPSearch = function() { if (!currentUser) return; window.gameMode = 'pvp'; window.playNavSound(); window.openDeckSelector(); };

async function initiateMatchmaking() {
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'flex';
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE...";
    document.querySelector('.cancel-btn').style.display = "block";
    
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
        // Cria meu Ticket na Fila
        myQueueRef = doc(collection(db, "queue")); 
        await setDoc(myQueueRef, {
            uid: currentUser.uid,
            name: currentUser.displayName,
            deck: window.currentDeck, 
            score: 0, 
            timestamp: Date.now(),
            matchId: null
        });

        // Ouve meu próprio ticket
        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.matchId) {
                    enterMatch(data.matchId); 
                }
            }
        });

        // Inicia busca ativa
        if (matchmakingInterval) clearInterval(matchmakingInterval);
        matchmakingInterval = setInterval(checkForOpponents, 2000); 
        checkForOpponents();

    } catch (e) {
        console.error("Erro no Matchmaking:", e);
        cancelPvPSearch();
    }
}

async function checkForOpponents() {
    try {
        const queueRef = collection(db, "queue");
        const q = query(queueRef, limit(20));
        const querySnapshot = await getDocs(q);

        let targetDoc = null;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.uid !== currentUser.uid && !data.matchId && !data.cancelled) {
                targetDoc = docSnap;
            }
        });

        if (targetDoc) {
            console.log("Oponente encontrado:", targetDoc.data().name);
            if (matchmakingInterval) clearInterval(matchmakingInterval);

            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            const p1DeckCards = generateShuffledDeck();
            const p2DeckCards = generateShuffledDeck();

            await createMatchDocument(matchId, currentUser.uid, targetDoc.data().uid, 
                currentUser.displayName, targetDoc.data().name,
                window.currentDeck, targetDoc.data().deck, p1DeckCards, p2DeckCards);

            await updateDoc(targetDoc.ref, { matchId: matchId });
            if (myQueueRef) await updateDoc(myQueueRef, { matchId: matchId });
        }
    } catch (e) { console.log("Buscando...", e); }
}

async function createMatchDocument(matchId, p1Id, p2Id, p1Name, p2Name, p1DeckType, p2DeckType, p1DeckCards, p2DeckCards) {
    const matchRef = doc(db, "matches", matchId);
    await setDoc(matchRef, {
        player1: { uid: p1Id, name: p1Name.split(' ')[0].toUpperCase(), deckType: p1DeckType, hp: 6, status: 'selecting', hand: [], deck: p1DeckCards, xp: [] },
        player2: { uid: p2Id, name: p2Name.split(' ')[0].toUpperCase(), deckType: p2DeckType, hp: 6, status: 'selecting', hand: [], deck: p2DeckCards, xp: [] },
        turn: 1, status: 'playing', createdAt: Date.now()
    });
}

window.cancelPvPSearch = async function() {
    window.playNavSound();
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'none';

    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (matchmakingInterval) clearInterval(matchmakingInterval);
    if (queueListener) { queueListener(); queueListener = null; }
    
    if (myQueueRef) {
        try { await deleteDoc(myQueueRef); } catch(e){} 
        myQueueRef = null;
    }
    window.transitionToLobby(true); 
};

async function enterMatch(matchId) {
    console.log("ENTRANDO NA PARTIDA:", matchId);
    if (queueListener) queueListener();
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (matchmakingInterval) clearInterval(matchmakingInterval);

    await new Promise(r => setTimeout(r, 500));
    const matchRef = doc(db, "matches", matchId);
    let matchSnap = await getDoc(matchRef);

    if(!matchSnap.exists()) {
        await new Promise(r => setTimeout(r, 1000));
        matchSnap = await getDoc(matchRef);
    }

    if(matchSnap.exists()) {
        const data = matchSnap.data();
        window.pvpStartData = data; 
        if(data.player1.uid === currentUser.uid) window.myRole = 'player1';
        else window.myRole = 'player2';

        document.querySelector('.mm-title').innerText = "PARTIDA ENCONTRADA!";
        document.querySelector('.cancel-btn').style.display = "none";
        setTimeout(() => {
            const mmScreen = document.getElementById('matchmaking-screen');
            mmScreen.style.display = 'none';
            window.currentMatchId = matchId;
            window.transitionToGame(); 
        }, 1500);
    } else {
        window.cancelPvPSearch();
    }
}

// --- LOGIN & AUTH ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        window.goToLobby(true); 
    } else {
        currentUser = null;
        window.showScreen('start-screen');
        const btnTxt = document.getElementById('btn-text');
        if(btnTxt) btnTxt.innerText = "LOGIN COM GOOGLE";
        MusicController.play('bgm-menu'); 
    }
});

function preloadGame() {
    console.log("Iniciando Preload...");
    ASSETS_TO_LOAD.images.forEach(src => { 
        let img = new Image(); img.src = src; window.gameAssets.push(img);
        img.onload = () => updateLoader(); img.onerror = () => updateLoader(); 
    });
    ASSETS_TO_LOAD.audio.forEach(a => { 
        let s = new Audio(); s.src = a.src; s.preload = 'auto'; if(a.loop) s.loop = true; 
        audios[a.id] = s; window.gameAssets.push(s);
        s.onloadedmetadata = () => updateLoader(); s.onerror = () => updateLoader(); 
        setTimeout(() => { if(s.readyState === 0) updateLoader(); }, 2000); 
    });
    // FAILSAFE: Se o loader travar, força o início após 3s
    setTimeout(() => {
        const loading = document.getElementById('loading-screen');
        if(loading && loading.style.display !== 'none') {
            console.warn("Loader demorou muito. Forçando início.");
            loading.style.display = 'none';
            if(!window.hoverLogicInitialized) { initGlobalHoverLogic(); window.hoverLogicInitialized = true; }
        }
    }, 4000);
}

function updateLoader() {
    assetsLoaded++; 
    let pct = Math.min(100, (assetsLoaded / totalAssets) * 100); 
    const fill = document.getElementById('loader-fill');
    if(fill) fill.style.width = pct + '%';
    if(assetsLoaded >= totalAssets) {
        console.log("Preload completo!");
        if(window.updateVol) window.updateVol('master', window.masterVol || 1.0);
        setTimeout(() => {
            const loading = document.getElementById('loading-screen');
            if(loading) { loading.style.opacity = '0'; setTimeout(() => loading.style.display = 'none', 500); }
            if(!window.hoverLogicInitialized) { initGlobalHoverLogic(); window.hoverLogicInitialized = true; }
        }, 800); 
        document.body.addEventListener('click', () => { 
            if (!MusicController.currentTrackId || (audios['bgm-menu'] && audios['bgm-menu'].paused)) MusicController.play('bgm-menu');
        }, { once: true });
    }
}

function initGlobalHoverLogic() {
    let lastTarget = null;
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('button, .circle-btn, #btn-fullscreen, .deck-option, .mini-btn');
        if (target && target !== lastTarget) { lastTarget = target; window.playUIHoverSound(); } 
        else if (!target) { lastTarget = null; }
    });
}

// --- OUTROS EVENTOS ---
window.onload = function() {
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) { btnSound.onclick = null; btnSound.addEventListener('click', (e) => { e.stopPropagation(); window.toggleMute(); }); }
};

document.addEventListener('click', function(e) {
    const target = e.target.closest('#deck-selection-screen .circle-btn, #deck-selection-screen .btn-back, .return-btn');
    if (target) { e.stopPropagation(); window.playNavSound(); window.transitionToLobby(true); }
});

window.addEventListener('beforeunload', () => {
    if (window.gameMode === 'pvp' && window.currentMatchId && !document.getElementById('end-screen').classList.contains('visible')) { notifyAbandonment(); }
});
window.toggleFullScreen = function() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(()=>{}); } else { if (document.exitFullscreen) document.exitFullscreen(); }
};
function createLobbyFlares() {
    const container = document.getElementById('lobby-particles'); if(!container) return; container.innerHTML = ''; 
    for(let i=0; i < 70; i++) {
        let flare = document.createElement('div'); flare.className = 'lobby-flare';
        flare.style.left = Math.random() * 100 + '%'; flare.style.top = Math.random() * 100 + '%';
        let size = 4 + Math.random() * 18; flare.style.width = size + 'px'; flare.style.height = size + 'px';
        flare.style.animationDuration = (3 + Math.random() * 5) + 's'; flare.style.animationDelay = (Math.random() * 4) + 's';
        container.appendChild(flare);
    }
}
function startCinematicLoop() { const c = audios['sfx-cine']; if(c) {try { c.volume = 0; c.play().catch(()=>{}); } catch(e){} if(mixerInterval) clearInterval(mixerInterval); mixerInterval = setInterval(updateAudioMixer, 30); }}
function updateAudioMixer() { 
    const cineAudio = audios['sfx-cine']; if(!cineAudio) return; const mVol = window.masterVol || 1.0; const maxCine = 0.6 * mVol; let targetCine = isLethalHover ? maxCine : 0; 
    if(window.isMuted) { try { cineAudio.volume = 0; } catch(e){} return; }
    try { if(cineAudio.volume < targetCine) cineAudio.volume = Math.min(targetCine, cineAudio.volume + 0.05); else if(cineAudio.volume > targetCine) cineAudio.volume = Math.max(targetCine, cineAudio.volume - 0.05); } catch(e){}
}
window.toggleConfig = function() { let p = document.getElementById('config-panel'); if(p.style.display==='flex'){ p.style.display='none'; p.classList.remove('active'); document.body.classList.remove('config-mode'); } else { p.style.display='flex'; p.classList.add('active'); document.body.classList.add('config-mode'); } };
document.addEventListener('click', function(e) { const panel = document.getElementById('config-panel'); const btn = document.getElementById('btn-config-toggle'); if (panel && panel.classList.contains('active') && !panel.contains(e.target) && (btn && !btn.contains(e.target))) window.toggleConfig(); });
window.updateVol = function(type, val) { 
    if(type==='master') window.masterVol = parseFloat(val); 
    ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-hit-mage', 'sfx-block', 'sfx-block-mage', 'sfx-heal', 'sfx-levelup', 'sfx-train', 'sfx-disarm', 'sfx-deck-select', 'sfx-hover', 'sfx-ui-hover', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'sfx-nav'].forEach(k => { 
        if(audios[k]) { let vol = window.masterVol || 1.0; try { if(k === 'sfx-ui-hover') audios[k].volume = 0.3 * vol; else if (k === 'sfx-levelup') audios[k].volume = 1.0 * vol; else if (k === 'sfx-train') audios[k].volume = 0.5 * vol; else audios[k].volume = 0.8 * vol; } catch(e){} }
    }); 
};
preloadGame();
