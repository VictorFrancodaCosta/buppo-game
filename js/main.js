// ARQUIVO: js/main.js (VERSÃO FINAL COMPLETA - BUPPO)

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, increment, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
window.gameAssets = []; 
window.pvpUnsubscribe = null; 
let searchInterval = null;
let matchTimerInterval = null;
let matchSeconds = 0;
let myQueueRef = null;
let queueListener = null;
const tt = document.getElementById('tooltip-box');

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

// --- ESTADOS GLOBAIS ---
window.isMatchStarting = false; window.currentDeck = 'knight'; window.myRole = null; 
window.currentMatchId = null; window.pvpSelectedCardIndex = null; 
window.isResolvingTurn = false; window.pvpStartData = null; 

// --- GESTÃO DE TELAS (FIX DE CLIQUES) ---
window.showScreen = function(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; 
        s.style.pointerEvents = 'none';
    });
    const target = document.getElementById(id);
    if(target) {
        target.classList.add('active');
        target.style.display = 'flex';
        target.style.pointerEvents = 'all';
    }
};

function hideLayer(id) {
    const el = document.getElementById(id);
    if(el) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        setTimeout(() => { el.style.display = 'none'; }, 500);
    }
}

// --- UTILITÁRIOS ---
function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) return MAGE_ASSETS[cardKey];
    return CARDS_DB[cardKey].img;
}

function stringToSeed(str) {
    let hash = 0; for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash);
}

function shuffle(array, seed = null) {
    let rng = Math.random; 
    if (seed !== null) {
        let currentSeed = seed;
        rng = function() { currentSeed = (currentSeed * 9301 + 49297) % 233280; return currentSeed / 233280; }
    }
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1)); [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateShuffledDeck() {
    let deck = []; for(let k in DECK_TEMPLATE) for(let i=0; i<DECK_TEMPLATE[k]; i++) deck.push(k);
    shuffle(deck); return deck;
}

// --- ÁUDIO ---
const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if (!audios[trackId]) return;
        if (this.currentTrackId === trackId) {
            if (audios[trackId].paused && !window.isMuted) {
                audios[trackId].currentTime = 0; audios[trackId].volume = 0; audios[trackId].play().catch(()=>{});
                this.fadeIn(audios[trackId], 0.5 * window.masterVol);
            }
            return; 
        } 
        if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]);
        if (trackId && audios[trackId]) {
            audios[trackId].currentTime = 0; if (!window.isMuted) { audios[trackId].volume = 0; audios[trackId].play().catch(()=>{}); this.fadeIn(audios[trackId], 0.5 * window.masterVol); }
        }
        this.currentTrackId = trackId;
    },
    stopCurrent() { if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]); this.currentTrackId = null; },
    fadeOut(audio) {
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) { vol -= 0.05; audio.volume = vol; } 
            else { audio.volume = 0; audio.pause(); clearInterval(fadeOutInt); }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        let vol = 0; audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) { vol += 0.05; audio.volume = vol; } 
            else { audio.volume = targetVol; clearInterval(fadeInInt); }
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
    if(!window.isMuted && MusicController.currentTrackId) audios[MusicController.currentTrackId].play().catch(()=>{});
}

window.playNavSound = function() { if(audios['sfx-nav']) { audios['sfx-nav'].currentTime = 0; audios['sfx-nav'].play().catch(()=>{}); } };
window.playUIHoverSound = function() { if(audios['sfx-ui-hover'] && !window.isMuted) { audios['sfx-ui-hover'].currentTime = 0; audios['sfx-ui-hover'].play().catch(()=>{}); } };

function playSound(key) { 
    if(audios[key]) { 
        audios[key].volume = (key === 'sfx-ui-hover' ? 0.3 : 0.8) * (window.masterVol || 1.0);
        audios[key].currentTime = 0; audios[key].play().catch(()=>{}); 
    } 
}

// --- AUTH & LOGIN ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        window.goToLobby(true);
    } else {
        currentUser = null;
        window.showScreen('start-screen');
        MusicController.play('bgm-menu');
    }
    // Desbloqueia tela ao terminar verificação
    hideLayer('loading-screen');
});

window.googleLogin = async function() {
    window.playNavSound();
    const btnText = document.getElementById('btn-text');
    if(btnText) btnText.innerText = "CONECTANDO...";
    try { await signInWithPopup(auth, provider); } 
    catch (error) { 
        console.error("Erro no Login:", error); 
        if(btnText) btnText.innerText = "ERRO - TENTE NOVAMENTE"; 
    }
};

window.handleLogout = function() {
    window.playNavSound();
    signOut(auth).then(() => { location.reload(); });
};

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) return;
    isProcessing = false;
    let bg = document.getElementById('game-background');
    if(bg) bg.classList.add('lobby-mode');
    
    MusicController.play('bgm-menu');
    createLobbyFlares();
    
    const userRef = doc(db, "players", currentUser.uid);
    let userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0 });
        userSnap = await getDoc(userRef);
    }
    
    const d = userSnap.data();
    document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
    document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;
    
    // Recupera Ranking
    const q = query(collection(db, "players"), orderBy("score", "desc"), limit(10));
    onSnapshot(q, (snapshot) => {
        let html = '<table id="ranking-table"><thead><tr><th>#</th><th>JOGADOR</th><th>PTS</th></tr></thead><tbody>';
        let pos = 1;
        snapshot.forEach((doc) => {
            const p = doc.data();
            let rankClass = pos <= 3 ? `rank-${pos}` : "";
            html += `<tr class="${rankClass}"><td class="rank-pos">${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`;
            pos++;
        });
        document.getElementById('ranking-content').innerHTML = html + '</tbody></table>';
    });
    
    window.showScreen('lobby-screen');
    document.getElementById('end-screen').classList.remove('visible');
    hideLayer('transition-overlay');
};

// --- NAVEGAÇÃO ---
window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    window.showScreen('deck-selection-screen');
    try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{}); } catch (e) {}
};

window.selectDeck = function(deckType) {
    if(audios['sfx-deck-select']) playSound('sfx-deck-select');
    window.currentDeck = deckType; 
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 
    document.body.classList.add(deckType === 'mage' ? 'theme-mago' : 'theme-cavaleiro');

    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))";
        } else {
            opt.style.opacity = "0.2"; opt.style.filter = "grayscale(100%)";
        }
    });

    setTimeout(() => {
        if (window.gameMode === 'pvp') initiateMatchmaking(); 
        else window.transitionToGame();
    }, 500);
};

window.transitionToGame = function() {
    const transScreen = document.getElementById('transition-overlay');
    if(transScreen) { transScreen.querySelector('.trans-text').innerText = "PREPARANDO BATALHA..."; transScreen.classList.add('active'); transScreen.style.display = 'flex'; }
    setTimeout(() => {
        MusicController.play('bgm-loop'); 
        let bg = document.getElementById('game-background'); if(bg) bg.classList.remove('lobby-mode');
        window.showScreen('game-screen');
        document.getElementById('player-hand').innerHTML = '';
        setTimeout(() => { hideLayer('transition-overlay'); setTimeout(startGameFlow, 200); }, 1500);
    }, 500); 
}

window.transitionToLobby = function() {
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    document.body.classList.remove('force-landscape');
    const transScreen = document.getElementById('transition-overlay');
    if(transScreen) { transScreen.querySelector('.trans-text').innerText = "RETORNANDO..."; transScreen.classList.add('active'); transScreen.style.display = 'flex'; }
    setTimeout(() => { window.goToLobby(false); setTimeout(() => hideLayer('transition-overlay'), 1000); }, 500);
}

// --- FLUXO DE JOGO ---
function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; window.isResolvingTurn = false; window.pvpSelectedCardIndex = null; 
    startCinematicLoop(); window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand'); if (handEl) { handEl.innerHTML = ''; handEl.classList.add('preparing'); }

    if (window.gameMode === 'pvp' && window.pvpStartData) {
        if (window.myRole === 'player1') {
            resetUnit(player, window.pvpStartData.player1.deck, 'player1');
            resetUnit(monster, window.pvpStartData.player2.deck, 'player2');
        } else {
            resetUnit(player, window.pvpStartData.player2.deck, 'player2');
            resetUnit(monster, window.pvpStartData.player1.deck, 'player1');
        }
    } else {
        resetUnit(player, null, 'pve'); resetUnit(monster, null, 'pve'); 
    }
    turnCount = 1; playerHistory = [];
    drawCardLogic(monster, 6); drawCardLogic(player, 6); 
    updateUI(); dealAllInitialCards();
    if(window.gameMode === 'pvp') startPvPListener();
}

// --- CORE GAMEPLAY ---
function onCardClick(index) {
    if(isProcessing) return; 
    if (!player.hand[index]) return;
    if (window.gameMode === 'pvp' && window.pvpSelectedCardIndex !== null) return;

    // Failsafe Tooltip: Esconde imediatamente ao clicar
    if(tt) tt.style.display = 'none';
    document.body.classList.remove('focus-hand');

    playSound('sfx-play');
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

// --- PVE ---
function getBestAIMove() {
    let moves = []; 
    monster.hand.forEach((card, index) => { if(card !== monster.disabled) moves.push({ card: card, index: index, score: 0 }); });
    if(moves.length === 0) return null;
    moves.sort((a, b) => 0.5 - Math.random());
    return moves[0];
}

async function playCardFlow(index, pDisarmChoice) {
    isProcessing = true; 
    let cardKey = player.hand.splice(index, 1)[0]; playerHistory.push(cardKey);
    let aiMove = getBestAIMove();
    let mCardKey = 'ATAQUE'; let mDisarmTarget = null;
    if(aiMove) {
        mCardKey = aiMove.card; monster.hand.splice(aiMove.index, 1);
        if(mCardKey === 'DESARMAR') mDisarmTarget = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE';
    } else {
        if(monster.hand.length > 0) mCardKey = monster.hand.pop();
        else { drawCardLogic(monster, 1); if(monster.hand.length > 0) mCardKey = monster.hand.pop(); }
    }

    animateFly('player-hand', 'p-slot', cardKey, () => { renderTable(cardKey, 'p-slot', true); updateUI(); }, false, true, true);
    animateFly({ top: -160, left: window.innerWidth / 2 }, 'm-slot', mCardKey, () => {
        renderTable(mCardKey, 'm-slot', false);
        setTimeout(() => resolveTurn(cardKey, mCardKey, pDisarmChoice, mDisarmTarget), 500);
    }, false, true, false);
}

// --- PVP: INICIO CORRIGIDO ---
async function initiateMatchmaking() {
    window.showScreen('matchmaking-screen');
    const timerEl = document.getElementById('mm-timer');
    if(timerEl) timerEl.innerText = "00:00";
    matchSeconds = 0;

    // CORREÇÃO TIMER: Inicia o relógio visualmente
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    matchTimerInterval = setInterval(() => {
        matchSeconds++;
        const m = Math.floor(matchSeconds / 60).toString().padStart(2, '0');
        const s = (matchSeconds % 60).toString().padStart(2, '0');
        if(timerEl) timerEl.innerText = `${m}:${s}`;
    }, 1000);

    myQueueRef = doc(collection(db, "queue"));
    await setDoc(myQueueRef, { 
        uid: currentUser.uid, 
        name: currentUser.displayName, 
        timestamp: Date.now(), 
        matchId: null,
        deck: window.currentDeck
    });
    
    queueListener = onSnapshot(myQueueRef, (snap) => {
        if (snap.exists() && snap.data().matchId) enterMatch(snap.data().matchId);
    });

    // CORREÇÃO BUSCA: Loop ativo para achar outros players
    if(searchInterval) clearInterval(searchInterval);
    searchInterval = setInterval(async () => {
        const q = query(collection(db, "queue"), orderBy("timestamp", "desc"), limit(5));
        const s = await getDocs(q);
        s.forEach(async dSnap => {
            const d = dSnap.data();
            // Evita achar a si mesmo ou tickets já em partida ou tickets muito velhos (>1min)
            if (d.uid !== currentUser.uid && !d.matchId && (Date.now() - d.timestamp < 60000)) {
                const mid = "match_" + Date.now();
                await updateDoc(dSnap.ref, { matchId: mid });
                await updateDoc(myQueueRef, { matchId: mid });
                createMatchDoc(mid, d.uid, d.name, d.deck);
            }
        });
    }, 3000);
}

async function createMatchDoc(mid, oppId, oppName, oppDeck) {
    const p1D = generateShuffledDeck(); const p2D = generateShuffledDeck();
    await setDoc(doc(db, "matches", mid), {
        player1: { uid: currentUser.uid, name: currentUser.displayName, hp: 6, deck: p1D, xp: [] },
        player2: { uid: oppId, name: oppName, hp: 6, deck: p2D, xp: [] },
        status: 'playing', createdAt: Date.now()
    });
}

async function enterMatch(mid) {
    clearInterval(searchInterval);
    if(matchTimerInterval) clearInterval(matchTimerInterval);
    
    window.currentMatchId = mid;
    const s = await getDoc(doc(db, "matches", mid));
    window.pvpStartData = s.data();
    window.myRole = (s.data().player1.uid === currentUser.uid) ? 'player1' : 'player2';
    window.transitionToGame();
}

async function lockInPvPMove(index, disarmChoice) {
    const cardEl = document.getElementById('player-hand').children[index];
    if(cardEl) cardEl.classList.add('card-selected');
    window.pvpSelectedCardIndex = index;
    isProcessing = true; showCenterText("AGUARDANDO OPONENTE...", "#ffd700");

    const matchRef = doc(db, "matches", window.currentMatchId);
    const updateField = (window.myRole === 'player1') ? 'p1Move' : 'p2Move';
    const disarmField = (window.myRole === 'player1') ? 'p1Disarm' : 'p2Disarm';
    
    try { await updateDoc(matchRef, { [updateField]: player.hand[index], [disarmField]: disarmChoice || null }); }
    catch (e) { isProcessing = false; window.pvpSelectedCardIndex = null; if(cardEl) cardEl.classList.remove('card-selected'); }
}

async function resolvePvPTurn(p1Move, p2Move, p1Disarm, p2Disarm) {
    if (window.isResolvingTurn) return; window.isResolvingTurn = true; isProcessing = true;
    const centerTxt = document.querySelector('.center-text'); if(centerTxt) centerTxt.remove();

    let myMove = (window.myRole === 'player1') ? p1Move : p2Move;
    let enemyMove = (window.myRole === 'player1') ? p2Move : p1Move;
    let myDisarm = (window.myRole === 'player1') ? p1Disarm : p2Disarm;
    let enemyDisarm = (window.myRole === 'player1') ? p2Disarm : p1Disarm;

    const handContainer = document.getElementById('player-hand');
    let myCardEl = handContainer.children[window.pvpSelectedCardIndex || 0];
    if(myCardEl) myCardEl.style.opacity = '0';
    
    if(window.pvpSelectedCardIndex !== null) player.hand.splice(window.pvpSelectedCardIndex, 1);
    else { const idx = player.hand.indexOf(myMove); if(idx>-1) player.hand.splice(idx,1); }
    
    playerHistory.push(myMove);

    animateFly('player-hand', 'p-slot', myMove, () => renderTable(myMove, 'p-slot', true), false, true, true);
    animateFly({ top: -160, left: window.innerWidth / 2 }, 'm-slot', enemyMove, () => renderTable(enemyMove, 'm-slot', false), false, true, false);

    setTimeout(() => {
        if (window.myRole === 'player1') {
            updateDoc(doc(db, "matches", window.currentMatchId), { p1Move: null, p2Move: null, p1Disarm: null, p2Disarm: null, turn: increment(1) });
        }
        resolveTurn(myMove, enemyMove, myDisarm, enemyDisarm);
        
        setTimeout(() => { window.pvpSelectedCardIndex = null; window.isResolvingTurn = false; isProcessing = false; }, 3500);
    }, 600);
}

// --- RESOLUÇÃO DO TURNO (COM CORREÇÃO DE ORDEM) ---
function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    let pDmg = 0, mDmg = 0;
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train');
    if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');

    if(mAct === 'ATAQUE') pDmg += monster.lvl;
    if(pAct === 'ATAQUE') mDmg += player.lvl;
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') mDmg += (1 + player.bonusBlock); }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') pDmg += (1 + monster.bonusBlock); }

    if(pAct === 'BLOQUEIO' && mAct === 'ATAQUE') triggerBlockEffect(true);
    else if(mAct === 'BLOQUEIO' && pAct === 'ATAQUE') triggerBlockEffect(false);

    player.disabled = (mAct === 'DESARMAR') ? (mDisarmTarget || 'ATAQUE') : null;
    monster.disabled = (pAct === 'DESARMAR') ? pDisarmChoice : null;

    player.hp -= pDmg; monster.hp -= mDmg;
    if(pDmg > 0) { showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); triggerDamageEffect(true); }
    if(mDmg > 0) { showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); triggerDamageEffect(false); }
    
    if(player.hp > 0 && pAct === 'DESCANSAR') { 
        let h = (pDmg === 0) ? 3 : 2; player.hp = Math.min(player.maxHp, player.hp + h); 
        showFloatingText('p-lvl', `+${h} HP`, "#55efc4"); triggerHealEffect(true); 
    }
    if(monster.hp > 0 && mAct === 'DESCANSAR') { 
        let h = (mDmg === 0) ? 3 : 2; monster.hp = Math.min(monster.maxHp, monster.hp + h); 
        triggerHealEffect(false); 
    }

    updateUI();

    setTimeout(() => {
        const handleXP = (u, act, isOpp) => {
            animateFly(u.id === 'p' ? 'p-slot' : 'm-slot', u.id + '-xp', act, () => {
                u.xp.push(act); triggerXPGlow(u.id); updateUI();
                
                checkLevelUp(u, () => {
                    if(isOpp) {
                        if (window.gameMode === 'pvp') commitTurnToDB(); // Sync Final com Dano Maestria
                        checkEndGame();
                    } else {
                        if(player.hp > 0) drawCardLogic(player, 1);
                    }
                });
            }, false, false, !isOpp);
        };
        handleXP(player, pAct, false); 
        handleXP(monster, mAct, true);
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

// --- MAESTRIA E SYNC (CORRIGIDO) ---
async function commitTurnToDB() {
    if (!window.currentMatchId || window.gameMode !== 'pvp') return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    try {
        const myKey = window.myRole;
        const oppKey = (window.myRole === 'player1') ? 'player2' : 'player1';
        let data = {};
        data[`${myKey}.hp`] = player.hp;
        data[`${myKey}.xp`] = player.xp;
        data[`${myKey}.lvl`] = player.lvl;
        data[`${myKey}.maxHp`] = player.maxHp;
        data[`${myKey}.bonusAtk`] = player.bonusAtk;
        data[`${myKey}.bonusBlock`] = player.bonusBlock;
        data[`${myKey}.deck`] = player.deck;
        data[`${oppKey}.hp`] = monster.hp; // Envia o dano da maestria ao oponente
        
        await updateDoc(matchRef, data);
    } catch (e) { console.error("Sync Error:", e); }
}

function applyMastery(u, k) { 
    if(k === 'ATAQUE') { 
        u.bonusAtk++; 
        let target = (u === player) ? monster : player; 
        target.hp -= u.bonusAtk; 
        showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675"); 
        triggerDamageEffect(u !== player); 
    } 
    if(k === 'BLOQUEIO') u.bonusBlock++; 
    if(k === 'DESCANSAR') { u.maxHp++; showFloatingText(u.id+'-hp-txt', "+1 MAX", "#55efc4"); } 
    updateUI(); 
}

function checkLevelUp(u, done) {
    if(u.xp.length >= 5) {
        triggerLevelUpVisuals(u.id); playSound('sfx-levelup');
        let counts = {}; u.xp.forEach(x => counts[x] = (counts[x]||0)+1);
        let triggers = []; for(let k in counts) if(counts[k] >= 3 && k !== 'DESCANSAR') triggers.push(k);
        
        processMasteries(u, triggers, () => {
            u.lvl++; u.xp.forEach(x => u.deck.push(x)); u.xp = [];
            if (window.gameMode === 'pvp') shuffle(u.deck, stringToSeed(window.currentMatchId + u.originalRole) + u.lvl);
            else shuffle(u.deck);
            updateUI(); done();
        });
    } else done();
}

function processMasteries(u, triggers, cb) {
    if(triggers.length === 0) { cb(); return; }
    let type = triggers.shift();
    if(u.id === 'p') {
        if(type === 'TREINAR') {
            let opts = [...new Set(u.xp.filter(x => x !== 'TREINAR'))];
            if(opts.length > 0) window.openModal("MAESTRIA SUPREMA", "Copiar qual maestria?", opts, (c) => { applyMastery(u, c); processMasteries(u, triggers, cb); });
            else processMasteries(u, triggers, cb);
        } else if(type === 'DESARMAR') {
            window.openModal("MAESTRIA TÁTICA", "Bloquear qual ação?", ACTION_KEYS, (c) => { monster.disabled = c; processMasteries(u, triggers, cb); });
        } else { applyMastery(u, type); processMasteries(u, triggers, cb); }
    } else {
        if(type === 'ATAQUE' || type === 'BLOQUEIO') applyMastery(u, type);
        processMasteries(u, triggers, cb);
    }
}

// --- HISTÓRICO COM NOME REAL ---
async function saveMatchHistory(result, points) {
    if (!currentUser) return;
    let enemy = "TREINAMENTO";
    if (window.gameMode === 'pvp') {
        const nameEl = document.querySelector('#m-stats-cluster .unit-name');
        if (nameEl && !nameEl.innerText.includes("MONSTRO")) enemy = nameEl.innerText.split(' ')[0].toUpperCase();
        else if (window.pvpStartData) {
            const opp = (window.myRole === 'player1') ? window.pvpStartData.player2 : window.pvpStartData.player1;
            enemy = opp.name.split(' ')[0].toUpperCase();
        }
    }
    await addDoc(collection(db, "players", currentUser.uid, "history"), { 
        result, opponent: enemy, mode: window.gameMode, points, timestamp: Date.now() 
    });
}

// --- PVP UPDATE LISTENER ---
function startPvPListener() {
    if(!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    window.pvpUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        
        if(data.player1 && data.player2) {
            const p1n = data.player1.name; const p2n = data.player2.name;
            document.querySelector('#p-stats-cluster .unit-name').innerText = (window.myRole === 'player1') ? p1n : p2n;
            document.querySelector('#m-stats-cluster .unit-name').innerText = (window.myRole === 'player1') ? p2n : p1n;
        }

        const myData = data[window.myRole];
        const oppKey = (window.myRole === 'player1') ? 'player2' : 'player1';
        const oppData = data[oppKey];

        if(myData && myData.hp !== undefined && myData.hp !== player.hp) {
            player.hp = myData.hp; 
            updateUI();
        }
        if(oppData) {
            monster.hp = oppData.hp;
            monster.lvl = oppData.lvl;
            monster.maxHp = oppData.maxHp;
            monster.bonusAtk = oppData.bonusAtk;
            monster.bonusBlock = oppData.bonusBlock;
            if(oppData.xp && oppData.xp.length > monster.xp.length) {
                let card = oppData.xp[oppData.xp.length-1];
                animateFly('m-deck-container', 'm-xp', card, ()=>{ monster.xp.push(card); updateUI(); }, false, false, false);
            } else {
                monster.xp = oppData.xp || [];
            }
            updateUI();
        }

        if (data.p1Move && data.p2Move && !window.isResolvingTurn) {
            resolvePvPTurn(data.p1Move, data.p2Move, data.p1Disarm, data.p2Disarm);
        }
    });
}

// --- LOADER, AUDIO & UI HELPERS ---
function preloadGame() {
    ASSETS_TO_LOAD.images.forEach(src => { let img = new Image(); img.src = src; img.onload = updateLoader; img.onerror = updateLoader; });
    ASSETS_TO_LOAD.audio.forEach(a => { let s = new Audio(a.src); s.preload = 'auto'; if(a.loop) s.loop = true; audios[a.id] = s; s.onloadedmetadata = updateLoader; s.onerror = updateLoader; });
}

function updateLoader() {
    assetsLoaded++; let pct = Math.min(100, (assetsLoaded / totalAssets) * 100);
    const fill = document.getElementById('loader-fill'); if(fill) fill.style.width = pct + '%';
    if(assetsLoaded >= totalAssets) setTimeout(() => hideLayer('loading-screen'), 800);
}

// Failsafe 4s
setTimeout(() => { hideLayer('loading-screen'); }, 4000);

document.addEventListener('mouseover', (e) => {
    if (!e.target.closest('.hand-card') && !e.target.closest('.mastery-icon') && !e.target.closest('.xp-mini')) {
        if(tt) tt.style.display = 'none';
    }
});

function checkEndGame() {
    if(player.hp <= 0 || monster.hp <= 0) {
        isProcessing = true; MusicController.stopCurrent();
        setTimeout(() => {
            let title = document.getElementById('end-title');
            let isWin = player.hp > 0; let isTie = player.hp <= 0 && monster.hp <= 0;
            if(isTie) { title.innerText = "EMPATE"; saveMatchHistory('TIE', 0); }
            else if(isWin) { title.innerText = "VITÓRIA"; window.registrarVitoriaOnline(window.gameMode); }
            else { title.innerText = "DERROTA"; window.registrarDerrotaOnline(window.gameMode); }
            document.getElementById('end-screen').classList.add('visible');
        }, 1000);
    }
}

window.registrarVitoriaOnline = async function(modo) {
    let pts = modo === 'pvp' ? 8 : 1;
    await updateDoc(doc(db, "players", currentUser.uid), { totalWins: increment(1), score: increment(pts) });
    await saveMatchHistory('WIN', pts);
};

window.registrarDerrotaOnline = async function(modo) {
    let pts = modo === 'pvp' ? 8 : 3;
    const ref = doc(db, "players", currentUser.uid);
    const s = await getDoc(ref);
    await updateDoc(ref, { score: Math.max(0, (s.data().score || 0) - pts) });
    await saveMatchHistory('LOSS', -pts);
};

window.openHistory = async function() {
    window.playNavSound();
    const screen = document.getElementById('history-screen');
    const container = document.getElementById('history-list-container');
    screen.style.display = 'flex';
    container.innerHTML = '<div style="color:#888; text-align:center;">Carregando...</div>';
    try {
        const q = query(collection(db, "players", currentUser.uid, "history"), orderBy("timestamp", "desc"), limit(20));
        const snap = await getDocs(q);
        if (snap.empty) { container.innerHTML = '<div style="text-align:center;">Sem histórico.</div>'; return; }
        let html = '';
        snap.forEach(doc => {
            const h = doc.data();
            const date = new Date(h.timestamp);
            const res = h.result === 'WIN' ? 'VITÓRIA' : (h.result === 'TIE' ? 'EMPATE' : 'DERROTA');
            html += `<div class="history-item ${h.result.toLowerCase()}"><div><div class="h-vs">${res} vs ${h.opponent}</div><div class="h-date">${date.toLocaleDateString()} ${h.mode.toUpperCase()}</div></div><div class="h-score">${h.points} PTS</div></div>`;
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = 'Erro.'; }
};
window.closeHistory = () => { document.getElementById('history-screen').style.display = 'none'; };

// --- FUNÇÕES GRAFICAS OBRIGATÓRIAS ---
function animateFly(sid, eid, k, cb, d, t, isP) {
    let s = (typeof sid === 'string') ? document.getElementById(sid).getBoundingClientRect() : sid;
    let e = document.getElementById(eid).getBoundingClientRect();
    let f = document.createElement('div'); f.className = `card flying-card ${CARDS_DB[k].color}`;
    f.innerHTML = `<div class="card-art" style="background-image: url('${getCardArt(k, isP)}')"></div>`;
    f.style.left = s.left+'px'; f.style.top = s.top+'px'; f.style.width='100px'; f.style.height='140px';
    document.body.appendChild(f); f.offsetHeight;
    f.style.left = e.left+'px'; f.style.top = e.top+'px';
    if(eid.includes('xp')) f.style.transform = 'scale(0.3)';
    setTimeout(() => { f.remove(); if(cb) cb(); }, 400);
}

function showTT(k) {
    document.getElementById('tt-title').innerText = k;
    let c = CARDS_DB[k].customTooltip || `Base: ${CARDS_DB[k].base}`;
    document.getElementById('tt-content').innerHTML = c.replace('{PLAYER_LVL}', player.lvl).replace('{PLAYER_BLOCK_DMG}', 1+player.bonusBlock);
    tt.style.display = 'block';
}

function apply3DTilt(el, isH) {
    el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect(); const x = (e.clientX - r.left)/r.width - 0.5; const y = (e.clientY - r.top)/r.height - 0.5;
        el.style.transform = `${isH ? 'translateY(-20px) scale(1.1)' : ''} rotateX(${y*-20}deg) rotateY(${x*20}deg)`;
    });
    el.addEventListener('mouseleave', () => el.style.transform = '');
}

function triggerDamageEffect(isP) { playSound('sfx-hit'); spawnParticles(window.innerWidth/2, window.innerHeight/2, '#ff0000'); }
function triggerHealEffect(isP) { playSound('sfx-heal'); }
function triggerLevelUpVisuals(uId) { 
    let el = document.createElement('div'); el.className = 'levelup-text'; el.innerText = "LEVEL UP!";
    document.getElementById(uId === 'p' ? 'p-stats-cluster' : 'm-stats-cluster').appendChild(el);
    setTimeout(() => el.remove(), 2000);
}
function createLobbyFlares() { /* FX */ }

// Boot
window.cancelPvPSearch = async () => {
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (searchInterval) clearInterval(searchInterval);
    window.showScreen('deck-selection-screen'); // Volta para seleção
    if(myQueueRef) await updateDoc(myQueueRef, { cancelled: true });
};
window.startPvE = () => { window.gameMode = 'pve'; window.openDeckSelector(); };
window.startPvPSearch = () => { window.gameMode = 'pvp'; window.openDeckSelector(); };
window.handleLogout = () => signOut(auth).then(() => location.reload());

preloadGame();
