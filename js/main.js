// ARQUIVO: js/main.js (VERSÃO CORRIGIDA GLOBAL)

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. CONFIGURAÇÃO FIREBASE ---
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

// --- 2. VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 

// Estados do Jogo
let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let isProcessing = false; 
let turnCount = 1; 
let playerHistory = []; 
window.masterVol = 1.0; 
let isLethalHover = false; 
let mixerInterval = null;
let lastHoverTime = 0;

// Matchmaking
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

// --- 3. ASSETS ---
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
        'https://i.ibb.co/60tCyntQ/BUPPO-LOGO-Copiar.png', 'https://i.ibb.co/zhx4QY51/MESA-DE-JOGO.png', 'https://i.ibb.co/Z1GNKZGp/MESA-DE-JOGO-MAGO.png',
        'https://i.ibb.co/Dfpkhhtr/ARTE-SAGU-O.png', 'https://i.ibb.co/zHZsCnyB/QUADRO-DO-SAGU-O.png', 'https://i.ibb.co/GSWpX5C/PLACA-SELE-O.png',
        'https://i.ibb.co/fzr36qbR/SELE-O-DE-DECK-CAVALEIRO.png', 'https://i.ibb.co/bjBcKN6c/SELE-O-DE-DECK-MAGO.png', 'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png',
        'https://i.ibb.co/jdZmTHC/CARDBACK.png', 'https://i.ibb.co/jkvc8kRf/01-ATAQUE.png', 'https://i.ibb.co/zhFYHsxQ/02-BLOQUEIO.png',
        'https://i.ibb.co/PzV81m5C/03-DESCANSAR.png', 'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png', 'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png',
        'https://i.ibb.co/xqbKSbgx/mesa-com-deck.png', 'https://i.ibb.co/xKcyL7Qm/01-ATAQUE-MAGO.png', 'https://i.ibb.co/pv2CCXKR/02-BLOQUEIO-MAGO.png',
        'https://i.ibb.co/sv98P3JK/03-DESCANSAR-MAGO.png', 'https://i.ibb.co/Q7SmhYQk/04-DESARMAR-MAGO.png', 'https://i.ibb.co/8LGTJCn4/05-TREINAR-MAGO.png',
        'https://i.ibb.co/XZ8qc166/DECK-MAGO.png', 'https://i.ibb.co/mCFs1Ggc/SELE-O-DE-DECK-MAGO.png', 'https://i.ibb.co/SXPndxhb/AREA-DE-EXPERIENCIA.png'
    ],
    audio: [
        { id: 'bgm-menu', src: 'https://files.catbox.moe/kuriut.wav', loop: true }, { id: 'bgm-loop', src: 'https://files.catbox.moe/57mvtt.mp3', loop: true },
        { id: 'sfx-nav', src: 'https://files.catbox.moe/yc7yrz.mp3' }, { id: 'sfx-deal', src: 'https://files.catbox.moe/vhgxvr.mp3' },
        { id: 'sfx-play', src: 'https://files.catbox.moe/jpjd8x.mp3' }, { id: 'sfx-hit', src: 'https://files.catbox.moe/r1ko7y.mp3' },
        { id: 'sfx-hit-mage', src: 'https://files.catbox.moe/y0x72c.mp3' }, { id: 'sfx-block', src: 'https://files.catbox.moe/6zh7w0.mp3' },
        { id: 'sfx-block-mage', src: 'https://files.catbox.moe/8xjjl5.mp3' }, { id: 'sfx-heal', src: 'https://files.catbox.moe/h2xo2v.mp3' },
        { id: 'sfx-levelup', src: 'https://files.catbox.moe/ex4t72.mp3' }, { id: 'sfx-train', src: 'https://files.catbox.moe/rnndcv.mp3' },
        { id: 'sfx-disarm', src: 'https://files.catbox.moe/udd2sz.mp3' }, { id: 'sfx-cine', src: 'https://files.catbox.moe/rysr4f.mp3', loop: true },
        { id: 'sfx-hover', src: 'https://files.catbox.moe/wzurt7.mp3' }, { id: 'sfx-ui-hover', src: 'https://files.catbox.moe/gzjf9y.mp3' },
        { id: 'sfx-deck-select', src: 'https://files.catbox.moe/993lma.mp3' }, { id: 'sfx-win', src: 'https://files.catbox.moe/a3ls23.mp3' },
        { id: 'sfx-lose', src: 'https://files.catbox.moe/n7nyck.mp3' }, { id: 'sfx-tie', src: 'https://files.catbox.moe/sb18ja.mp3' }
    ]
};
let totalAssets = ASSETS_TO_LOAD.images.length + ASSETS_TO_LOAD.audio.length;

// ======================================================
// 4. FUNÇÕES BÁSICAS E DE UI (EXPOSTAS AO WINDOW)
// ======================================================

function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) { return MAGE_ASSETS[cardKey]; }
    return CARDS_DB[cardKey].img;
}

const tt = document.getElementById('tooltip-box');

// --- TOOLTIPS ---
window.bindFixedTooltip = function(el, k) { 
    const updatePos = () => { let rect = el.getBoundingClientRect(); if(tt) tt.style.left = (rect.left + rect.width / 2) + 'px'; }; 
    return { 
        onmouseenter: (e) => { 
            showTT(k); 
            if(tt) {
                tt.style.bottom = (window.innerWidth < 768 ? '280px' : '420px'); tt.style.top = 'auto'; 
                tt.classList.remove('tooltip-anim-up', 'tooltip-anim-down'); tt.classList.add('tooltip-anim-up'); updatePos(); 
            }
            el.addEventListener('mousemove', updatePos); 
        } 
    }; 
}

function showTT(k) {
    let db = CARDS_DB[k]; document.getElementById('tt-title').innerHTML = k; 
    if (db.customTooltip) {
        let content = db.customTooltip;
        let currentLvl = (typeof player !== 'undefined' && player.lvl) ? player.lvl : 1;
        content = content.replace('{PLAYER_LVL}', currentLvl);
        let bonusBlock = (typeof player !== 'undefined' && player.bonusBlock) ? player.bonusBlock : 0;
        let reflectDmg = 1 + bonusBlock;
        content = content.replace('{PLAYER_BLOCK_DMG}', reflectDmg);
        document.getElementById('tt-content').innerHTML = content;
    } else {
        document.getElementById('tt-content').innerHTML = `<span class='tt-label'>Base</span><span class='tt-val'>${db.base}</span><span class='tt-label' style='color:var(--accent-orange)'>Bônus</span><span class='tt-val'>${db.bonus}</span>`;
    }
    tt.style.display = 'block';
}

function bindMasteryTooltip(el, key, value, ownerId) {
    return {
        onmouseenter: (e) => {
            let db=CARDS_DB[key]; document.getElementById('tt-title').innerHTML = key; 
            document.getElementById('tt-content').innerHTML = `<span class='tt-label'>Bônus</span><span class='tt-val'>+${value}</span><span class='tt-label'>Efeito</span><span class='tt-val'>${db.mastery}</span>`;
            tt.style.display = 'block'; tt.classList.remove('tooltip-anim-up', 'tooltip-anim-down'); 
            let rect = el.getBoundingClientRect();
            if(ownerId === 'p') { tt.classList.add('tooltip-anim-up'); tt.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; tt.style.top = 'auto'; } 
            else { tt.classList.add('tooltip-anim-down'); tt.style.top = (rect.bottom + 10) + 'px'; tt.style.bottom = 'auto'; }
            tt.style.left = (rect.left + rect.width/2) + 'px'; tt.style.transform = "translateX(-50%)"; 
        }
    };
}

function addMI(parent, key, value, col, ownerId){ 
    let d = document.createElement('div'); d.className = 'mastery-icon'; 
    d.innerHTML = `${CARDS_DB[key].icon}<span class="mastery-lvl">${value}</span>`; d.style.borderColor = col; 
    let handlers = bindMasteryTooltip(d, key, value, ownerId);
    d.onmouseenter = handlers.onmouseenter; d.onmouseleave = () => { tt.style.display = 'none'; }; parent.appendChild(d); 
}

function apply3DTilt(element, isHand = false) { 
    if(window.innerWidth < 768) return; 
    element.addEventListener('mousemove', (e) => { 
        const rect = element.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; 
        const xPct = (x / rect.width) - 0.5; const yPct = (y / rect.height) - 0.5; 
        element.style.setProperty('--rx', xPct); element.style.setProperty('--ry', yPct);
        let lift = isHand ? 'translateY(-140px) scale(2.3)' : 'scale(1.1)'; 
        let rotate = `rotateX(${yPct * -40}deg) rotateY(${xPct * 40}deg)`; 
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

// --- SOM ---
const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if (this.currentTrackId === trackId) {
            if (audios[trackId] && audios[trackId].paused && !window.isMuted) {
                const audio = audios[trackId]; audio.volume = 0; audio.play().catch(()=>{}); this.fadeIn(audio, 0.5 * window.masterVol);
            } return; 
        } 
        const maxVol = 0.5 * window.masterVol;
        if (this.currentTrackId && audios[this.currentTrackId]) { this.fadeOut(audios[this.currentTrackId]); }
        if (trackId && audios[trackId]) {
            const newAudio = audios[trackId]; newAudio.currentTime = 0;
            if (!window.isMuted) { newAudio.volume = 0; newAudio.play().catch(()=>{}); this.fadeIn(newAudio, maxVol); }
        }
        this.currentTrackId = trackId;
    },
    stopCurrent() { if(this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]); this.currentTrackId = null; },
    fadeOut(audio) { let vol = audio.volume; const fadeOutInt = setInterval(() => { if (vol > 0.05) { vol -= 0.05; audio.volume = vol; } else { audio.volume = 0; audio.pause(); clearInterval(fadeOutInt); } }, 50); },
    fadeIn(audio, targetVol) { let vol = 0; audio.volume = 0; const fadeInInt = setInterval(() => { if (vol < targetVol - 0.05) { vol += 0.05; audio.volume = vol; } else { audio.volume = targetVol; clearInterval(fadeInInt); } }, 50); }
};

window.playNavSound = function() { let s = audios['sfx-nav']; if(s) { s.currentTime = 0; s.play().catch(()=>{}); } };
window.playUIHoverSound = function() {
    let now = Date.now(); if (now - lastHoverTime < 50) return; 
    let base = audios['sfx-ui-hover']; if(base && !window.isMuted) { let s = base.cloneNode(); s.volume = 0.3 * (window.masterVol || 1.0); s.play().catch(()=>{}); lastHoverTime = now; }
};
function playSound(key) { 
    if(audios[key]) { let vol = (key === 'sfx-levelup') ? 1.0 : 0.8; audios[key].volume = vol * (window.masterVol || 1.0); audios[key].currentTime = 0; audios[key].play().catch(()=>{}); } 
}

// ======================================================
// 5. MATCHMAKING (PVP) - CORRIGIDO
// ======================================================

// O JOGO PROCURA NO GLOBAL "window.startPvPSearch", POR ISSO PRECISA DO "window."
window.startPvPSearch = async function() {
    if (!currentUser) return; 
    window.gameMode = 'pvp';
    window.playNavSound();

    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'flex';
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE...";
    document.querySelector('.radar-spinner').style.borderColor = "rgba(255, 215, 0, 0.3)";
    document.querySelector('.radar-spinner').style.animation = "spin 1s linear infinite";
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
        // 1. Cria meu ticket
        myQueueRef = doc(collection(db, "queue")); 
        await setDoc(myQueueRef, { uid: currentUser.uid, name: currentUser.displayName, score: 0, timestamp: Date.now(), matchId: null });

        // 2. Ouve se alguém me escolheu
        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.matchId) {
                    console.log("Fui escolhido! Entrando na partida: " + data.matchId);
                    enterMatch(data.matchId); 
                }
            }
        });

        // 3. Tenta encontrar alguém (Host)
        findOpponentInQueue();

    } catch (e) { console.error("Erro no Matchmaking:", e); cancelPvPSearch(); }
};

async function findOpponentInQueue() {
    try {
        const queueRef = collection(db, "queue");
        // Pega os 50 mais antigos na fila
        const q = query(queueRef, orderBy("timestamp", "asc"), limit(50));
        const querySnapshot = await getDocs(q);
        let opponentDoc = null;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Regra: Não sou eu, não tem match ainda, não está cancelado
            const isValid = !data.matchId && !data.cancelled; 
            // Ignora timestamps muito antigos (> 1h) para evitar fantasmas
            const isRecent = (Date.now() - data.timestamp) < 3600000;

            if (data.uid !== currentUser.uid && isValid && isRecent) {
                if (!opponentDoc) opponentDoc = doc; // Pega o primeiro válido
            }
        });

        if (opponentDoc) {
            const opponentId = opponentDoc.data().uid;
            console.log("Oponente encontrado na fila:", opponentId);
            
            // Gera ID da Partida
            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            
            // AVISA O OPONENTE (Escreve no doc dele na fila)
            await updateDoc(opponentDoc.ref, { matchId: matchId });
            
            // AVISA A MIM MESMO
            if (myQueueRef) { await updateDoc(myQueueRef, { matchId: matchId }); }
            
            // CRIA A MESA
            await createMatchDocument(matchId, currentUser.uid, opponentId);
        } else {
            console.log("Nenhum oponente encontrado. Aguardando...");
        }
    } catch (e) { console.error("Erro ao buscar oponente:", e); }
}

async function createMatchDocument(matchId, p1Id, p2Id) {
    await setDoc(doc(db, "matches", matchId), {
        player1: { uid: p1Id, hp: 6, status: 'selecting', hand: [], deck: [], xp: [] },
        player2: { uid: p2Id, hp: 6, status: 'selecting', hand: [], deck: [], xp: [] },
        turn: 1, 
        status: 'waiting_decks', 
        createdAt: Date.now()
    });
}

window.cancelPvPSearch = async function() {
    window.playNavSound();
    document.getElementById('matchmaking-screen').style.display = 'none';
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (queueListener) { queueListener(); queueListener = null; }
    if (myQueueRef) { await updateDoc(myQueueRef, { cancelled: true }); myQueueRef = null; }
};

function enterMatch(matchId) {
    if (queueListener) queueListener();
    if (matchTimerInterval) clearInterval(matchTimerInterval);

    document.querySelector('.mm-title').innerText = "PARTIDA ENCONTRADA!";
    document.querySelector('.mm-title').style.color = "#2ecc71";
    document.querySelector('.radar-spinner').style.borderColor = "#2ecc71";
    document.querySelector('.radar-spinner').style.animation = "none";
    document.querySelector('.cancel-btn').style.display = "none";

    setTimeout(() => {
        document.getElementById('matchmaking-screen').style.display = 'none';
        window.currentMatchId = matchId;
        window.isGameRunning = false;
        
        // --- AQUI COMEÇA O LISTENER DA PARTIDA ---
        startMatchListener(matchId);
        
        window.openDeckSelector(); 
    }, 1500);
}

// Listener da Sala de Jogo (O Cérebro do PvP)
function startMatchListener(matchId) {
    if (matchUnsub) matchUnsub();
    matchUnsub = onSnapshot(doc(db, "matches", matchId), async (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();
        
        // Se ambos escolheram deck, inicia o jogo visualmente
        if (matchData.status === 'playing') {
            if (!window.isGameRunning) {
                console.log("Iniciando Jogo PvP...");
                window.isGameRunning = true;
                window.transitionToGame();
            }
            // Sincroniza a cada update
            syncMatchState(matchData);
        }

        // Se sou Player 1 e todos estão prontos, gero o deck
        if (currentUser.uid === matchData.player1.uid && 
            matchData.status === 'waiting_decks' &&
            matchData.player1.status === 'ready' && 
            matchData.player2.status === 'ready') {
            await initializeMatchDecks(matchId, matchData);
        }
    });
}

function syncMatchState(data) {
    const isP1 = (currentUser.uid === data.player1.uid);
    const myData = isP1 ? data.player1 : data.player2;
    const oppData = isP1 ? data.player2 : data.player1;

    // Atualiza Eu
    player.hp = myData.hp;
    player.hand = Array.isArray(myData.hand) ? myData.hand : [];
    player.deck = myData.deck || [];
    player.xp = myData.xp || [];
    
    // Atualiza Inimigo
    monster.hp = oppData.hp;
    monster.hand = new Array(oppData.hand ? oppData.hand.length : 0).fill('unknown'); 
    monster.deck = oppData.deck || [];
    monster.xp = oppData.xp || [];

    turnCount = data.turn;
    updateUI();

    // Se as cartas não estão visíveis, mostra elas
    const handEl = document.getElementById('player-hand');
    if (handEl && player.hand.length > 0) {
        if(handEl.classList.contains('preparing')) {
            handEl.classList.remove('preparing');
            dealAllInitialCards(); 
        }
        // Garante visibilidade
        Array.from(handEl.children).forEach(c => c.style.opacity = '1');
    }
}

async function initializeMatchDecks(matchId, matchData) {
    const p1Deck = generateDeckForClass(matchData.player1.class);
    const p2Deck = generateDeckForClass(matchData.player2.class);
    const p1Hand = p1Deck.splice(-6);
    const p2Hand = p2Deck.splice(-6);

    await updateDoc(doc(db, "matches", matchId), {
        "player1.deck": p1Deck, "player1.hand": p1Hand,
        "player2.deck": p2Deck, "player2.hand": p2Hand,
        status: 'playing', turn: 1
    });
}

function generateDeckForClass(className) {
    let deck = [];
    for(let k in DECK_TEMPLATE) { for(let i=0; i<DECK_TEMPLATE[k]; i++) deck.push(k); }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// ======================================================
// 6. LÓGICA DE JOGO (PVE e VISUAL)
// ======================================================

window.startPvE = function() { 
    window.gameMode = 'pve'; 
    window.playNavSound(); 
    window.openDeckSelector(); 
};

window.selectDeck = async function(deckType) {
    window.currentDeck = deckType; 
    document.body.classList.remove('theme-cavaleiro', 'theme-mago');
    document.body.classList.add(deckType === 'mage' ? 'theme-mago' : 'theme-cavaleiro');

    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.opacity = "1";
        } else {
            opt.style.transform = "scale(0.8) translateY(10px)";
            opt.style.opacity = "0.2";
        }
    });

    if (window.gameMode === 'pvp') {
        const btn = document.querySelector('.return-btn');
        if(btn) { btn.innerText = "AGUARDANDO OPONENTE..."; btn.disabled = true; }
        try {
            const matchRef = doc(db, "matches", window.currentMatchId);
            const matchSnap = await getDoc(matchRef);
            if(matchSnap.exists()) {
                const data = matchSnap.data();
                const field = (data.player1.uid === currentUser.uid) ? "player1" : "player2";
                await updateDoc(matchRef, { [`${field}.class`]: deckType, [`${field}.status`]: 'ready' });
            }
        } catch(e) { console.error("Erro deck:", e); }
    } else {
        setTimeout(() => {
            const selectionScreen = document.getElementById('deck-selection-screen');
            selectionScreen.style.opacity = "0";
            setTimeout(() => {
                window.transitionToGame();
                setTimeout(() => { selectionScreen.style.opacity = "1"; options.forEach(opt => opt.style = ""); }, 500);
            }, 500);
        }, 400);
    }
};

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    startCinematicLoop(); 
    
    // Se for PvP, o Firebase cuida dos dados
    if (window.gameMode === 'pvp') {
        window.isMatchStarting = false;
        const handEl = document.getElementById('player-hand');
        if(handEl) {
            handEl.classList.remove('preparing');
            Array.from(handEl.children).forEach(c => c.style.opacity = '1');
        }
        return; 
    }
    
    // Se for PvE, gera dados locais
    window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand');
    if (handEl) { handEl.innerHTML = ''; handEl.classList.add('preparing'); }
    
    resetUnit(player); 
    resetUnit(monster); 
    turnCount = 1; 
    playerHistory = [];
    drawCardLogic(monster, 6); 
    drawCardLogic(player, 6); 
    updateUI(); 
    dealAllInitialCards();
}

function updateUI() { 
    updateUnit(player); 
    updateUnit(monster); 
    document.getElementById('turn-txt').innerText = "TURNO " + turnCount; 
}

function updateUnit(u) {
    document.getElementById(u.id+'-lvl').firstChild.nodeValue = u.lvl;
    document.getElementById(u.id+'-hp-txt').innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
    let hpPct = (Math.max(0,u.hp)/u.maxHp)*100;
    let hpFill = document.getElementById(u.id+'-hp-fill'); hpFill.style.width = hpPct + '%';
    document.getElementById(u.id+'-deck-count').innerText = u.deck.length;
    
    if(u === player) {
        let deckImgEl = document.getElementById('p-deck-img');
        if(window.currentDeck === 'mage') deckImgEl.src = MAGE_ASSETS.DECK_IMG;
        else deckImgEl.src = 'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png';
    }

    if(u===player) {
        let hc=document.getElementById('player-hand'); hc.innerHTML='';
        u.hand.forEach((k,i)=>{
            let c=document.createElement('div'); c.className=`card hand-card ${CARDS_DB[k].color}`;
            c.style.setProperty('--flare-col', CARDS_DB[k].fCol);
            
            c.style.opacity = window.isMatchStarting ? '0' : '1';

            let lethalType = checkCardLethality(k); 
            let flaresHTML = ''; for(let f=1; f<=25; f++) flaresHTML += `<div class="flare-spark fs-${f}"></div>`;
            
            let imgUrl = getCardArt(k, true);
            c.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div><div class="flares-container">${flaresHTML}</div>`;
            
            // EVENTOS DE CLICK E HOVER
            c.onclick=()=>window.onCardClick(i); 
            let ttHandler = window.bindFixedTooltip(c,k);
            c.onmouseenter = (e) => { 
                ttHandler.onmouseenter(e); 
                document.body.classList.add('focus-hand'); 
                if(lethalType) isLethalHover = true; 
                playSound('sfx-hover'); 
            };
            c.onmouseleave = (e) => { if(tt) tt.style.display='none'; document.body.classList.remove('focus-hand'); isLethalHover = false; };
            hc.appendChild(c); apply3DTilt(c, true);
        });
    }
    
    let xc=document.getElementById(u.id+'-xp'); xc.innerHTML='';
    u.xp.forEach(k=>{ 
        let d=document.createElement('div'); d.className='xp-mini'; 
        let imgUrl = getCardArt(k, (u === player)); d.style.backgroundImage = `url('${imgUrl}')`; 
        xc.appendChild(d); 
    });
    
    let mc=document.getElementById(u.id+'-masteries'); mc.innerHTML='';
    if(u.bonusAtk>0) addMI(mc, 'ATAQUE', u.bonusAtk, '#e74c3c', u.id); 
    if(u.bonusBlock>0) addMI(mc, 'BLOQUEIO', u.bonusBlock, '#00cec9', u.id); 
}

// Torna global para ser chamado no HTML/Click
window.onCardClick = function(index) {
    if(isProcessing) return; if (!player.hand[index]) return;
    playSound('sfx-play'); 
    document.body.classList.remove('focus-hand'); document.getElementById('tooltip-box').style.display = 'none'; isLethalHover = false; 
    let cardKey = player.hand[index];
    if(player.disabled === cardKey) { showCenterText("DESARMADA!"); return; }
    if(cardKey === 'DESARMAR') { window.openModal('ALVO DO DESARME', 'Qual ação bloquear no inimigo?', ACTION_KEYS, (choice) => playCardFlow(index, choice)); } 
    else { playCardFlow(index, null); }
}

function playCardFlow(index, pDisarmChoice) {
    isProcessing = true; 
    let cardKey = player.hand.splice(index, 1)[0]; 
    playerHistory.push(cardKey);

    let aiMove = getBestAIMove(); 
    let mCardKey = 'ATAQUE'; 
    if(aiMove) { mCardKey = aiMove.card; monster.hand.splice(aiMove.index, 1); } 
    else { if(monster.hand.length > 0) mCardKey = monster.hand.pop(); else { drawCardLogic(monster, 1); if(monster.hand.length > 0) mCardKey = monster.hand.pop(); } }

    let handContainer = document.getElementById('player-hand'); 
    let realCardEl = handContainer.children[index]; 
    if(realCardEl) realCardEl.style.opacity = '0';
    
    animateFly('player-hand', 'p-slot', cardKey, () => { renderTable(cardKey, 'p-slot', true); updateUI(); }, false, true, true); 
    animateFly({ top: -160, left: window.innerWidth / 2 }, 'm-slot', mCardKey, () => { renderTable(mCardKey, 'm-slot', false); setTimeout(() => resolveTurn(cardKey, mCardKey, pDisarmChoice), 500); }, false, true, false);
}

function resolveTurn(pAct, mAct) {
    let pDmg = 0, mDmg = 0;
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train');
    if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');

    if(mAct === 'ATAQUE') pDmg += monster.lvl;
    if(pAct === 'ATAQUE') mDmg += player.lvl;
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') mDmg += (1 + player.bonusBlock); }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') pDmg += (1 + monster.bonusBlock); }

    let pBlocks = (pAct === 'BLOQUEIO' && mAct === 'ATAQUE'); 
    let mBlocks = (mAct === 'BLOQUEIO' && pAct === 'ATAQUE'); 
    if(pBlocks) { if(window.triggerBlockEffect) window.triggerBlockEffect(true); } 
    else if(mBlocks) { if(window.triggerBlockEffect) window.triggerBlockEffect(false); }

    if(pDmg > 0 && !pBlocks) { player.hp -= pDmg; showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); if(!mBlocks && window.triggerDamageEffect) window.triggerDamageEffect(true); }
    if(mDmg > 0 && !mBlocks) { monster.hp -= mDmg; showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); if(window.triggerDamageEffect) window.triggerDamageEffect(false); }
    
    if(pAct === 'DESCANSAR') { player.hp = Math.min(player.maxHp, player.hp + (pDmg === 0 ? 3 : 2)); if(window.triggerHealEffect) window.triggerHealEffect(true); playSound('sfx-heal'); }
    if(mAct === 'DESCANSAR') { monster.hp = Math.min(monster.maxHp, monster.hp + (mDmg === 0 ? 3 : 2)); if(window.triggerHealEffect) window.triggerHealEffect(false); playSound('sfx-heal'); }

    updateUI();
    
    setTimeout(() => {
        animateFly('p-slot', 'p-xp', pAct, () => { player.xp.push(pAct); checkLevelUp(player); }, false, false, true);
        animateFly('m-slot', 'm-xp', mAct, () => { monster.xp.push(mAct); checkLevelUp(monster); }, false, false, false);
        setTimeout(() => {
            if (player.hp <= 0 || monster.hp <= 0) { checkEndGame(); return; }
            drawCardLogic(player, 1); drawCardLogic(monster, 1); turnCount++; updateUI(); isProcessing = false;
        }, 800);
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

function checkLevelUp(u) {
    if(u.xp.length >= 5) {
        u.lvl++; u.xp = []; playSound('sfx-levelup'); shuffle(u.deck); updateUI();
        let lvlEl = document.getElementById(u.id+'-lvl'); lvlEl.classList.add('level-up-anim'); setTimeout(() => lvlEl.classList.remove('level-up-anim'), 1000);
    }
}

function checkEndGame(){ 
    if(player.hp<=0 || monster.hp<=0) { 
        isProcessing = true; MusicController.stopCurrent();
        setTimeout(()=>{ 
            let title = document.getElementById('end-title'); 
            let isWin = player.hp > 0;
            title.innerText = isWin ? "VITÓRIA" : "DERROTA"; 
            title.className = isWin ? "win-theme" : "lose-theme";
            playSound(isWin ? 'sfx-win' : 'sfx-lose');
            if(isWin && window.registrarVitoriaOnline) window.registrarVitoriaOnline(); 
            else if (window.registrarDerrotaOnline) window.registrarDerrotaOnline();
            document.getElementById('end-screen').classList.add('visible'); 
        }, 1000); 
    } 
}

function getBestAIMove() {
    let moves = []; 
    monster.hand.forEach((card, index) => { if(card !== monster.disabled) moves.push({ card: card, index: index }); });
    if(moves.length === 0) return null;
    return moves[0];
}

function drawCardLogic(u, qty) { for(let i=0; i<qty; i++) if(u.deck.length > 0) u.hand.push(u.deck.pop()); u.hand.sort(); }
function resetUnit(u) { u.hp = 6; u.maxHp = 6; u.lvl = 1; u.xp = []; u.hand = []; u.deck = []; for(let k in DECK_TEMPLATE) for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k); shuffle(u.deck); }
function shuffle(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }
function checkCardLethality(cardKey) { if(cardKey === 'ATAQUE') return player.lvl >= monster.hp ? 'red' : false; return false; }

function animateFly(startId, endId, cardKey, cb, initialDeal = false, isToTable = false, isPlayer = false) {
    let s; if (typeof startId === 'string') { let el = document.getElementById(startId); if (!el) s = { top: 0, left: 0, width: 0, height: 0 }; else s = el.getBoundingClientRect(); } else { s = startId; }
    let e = { top: 0, left: 0 }; let destEl = document.getElementById(endId); if(destEl) e = destEl.getBoundingClientRect();

    const fly = document.createElement('div');
    fly.className = `card flying-card ${CARDS_DB[cardKey].color}`;
    let imgUrl = getCardArt(cardKey, isPlayer);
    fly.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div>`;
    if (isToTable) fly.classList.add('card-bounce');

    if(typeof startId !== 'string' && s.width > 0) { fly.style.width = s.width + 'px'; fly.style.height = s.height + 'px'; } 
    else { let w = window.innerWidth < 768 ? '84px' : '105px'; let h = window.innerWidth < 768 ? '120px' : '150px'; fly.style.width=w; fly.style.height=h; }

    let tableW = window.innerWidth < 768 ? '110px' : '180px'; let tableH = window.innerWidth < 768 ? '170px' : '260px';
    fly.style.top=s.top+'px'; fly.style.left=s.left+'px';
    if(endId.includes('xp')) fly.style.transform='scale(0.3)';
    document.body.appendChild(fly); fly.offsetHeight;
    if(isToTable) { fly.style.width=tableW; fly.style.height=tableH; }
    fly.style.top=e.top+'px'; fly.style.left=e.left+'px';
    setTimeout(() => { fly.remove(); if(cb) cb(); }, 250);
}

function renderTable(key, slotId, isPlayer = false) { 
    let el = document.getElementById(slotId); el.innerHTML = ''; 
    let card = document.createElement('div'); 
    card.className = `card ${CARDS_DB[key].color} card-on-table`; 
    let imgUrl = getCardArt(key, isPlayer);
    card.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div>`; 
    el.appendChild(card); 
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

// --- UTILIDADES ---
function showCenterText(txt, col) { let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; if(col) el.style.color = col; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }
function showFloatingText(eid, txt, col) { let el = document.createElement('div'); el.className='floating-text'; el.innerText=txt; el.style.color=col; let parent = document.getElementById(eid); if(parent) { let rect = parent.getBoundingClientRect(); el.style.left = (rect.left + rect.width/2) + 'px'; el.style.top = (rect.top) + 'px'; document.body.appendChild(el); } else { document.body.appendChild(el); } setTimeout(()=>el.remove(), 2000); }
window.toggleConfig = function() { let p = document.getElementById('config-panel'); if(p.style.display==='flex'){ p.style.display='none'; p.classList.remove('active'); } else { p.style.display='flex'; p.classList.add('active'); } }
window.toggleFullScreen = function() { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); else if (document.exitFullscreen) document.exitFullscreen(); }
window.cancelModal = function() { document.getElementById('modal-overlay').style.display='none'; isProcessing = false; }
window.openModal = function(t,d,opts,cb) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-desc').innerText=d; let g=document.getElementById('modal-btns'); g.innerHTML=''; opts.forEach(o=>{ let b=document.createElement('button'); b.className='mini-btn'; b.innerText=o; b.onclick=()=>{document.getElementById('modal-overlay').style.display='none'; cb(o)}; g.appendChild(b); }); document.getElementById('modal-overlay').style.display='flex'; }

// ======================================================
// 7. PRELOAD
// ======================================================

function preloadGame() {
    console.log("Iniciando Preload de " + totalAssets + " recursos...");
    ASSETS_TO_LOAD.images.forEach(src => { 
        let img = new Image(); img.src = src; window.gameAssets.push(img);
        img.onload = () => updateLoader(); 
        img.onerror = () => updateLoader(); 
    });
    ASSETS_TO_LOAD.audio.forEach(a => { 
        let s = new Audio(); s.src = a.src; s.preload = 'auto'; if(a.loop) s.loop = true; 
        audios[a.id] = s; window.gameAssets.push(s);
        s.onloadedmetadata = () => updateLoader(); 
        s.onerror = () => updateLoader(); 
        setTimeout(() => { if(s.readyState === 0) updateLoader(); }, 3000); 
    });
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
            if (!MusicController.currentTrackId || (audios['bgm-menu'] && audios['bgm-menu'].paused)) { MusicController.play('bgm-menu'); }
        }, { once: true });
    }
}

function initGlobalHoverLogic() {
    let lastTarget = null;
    document.body.addEventListener('mouseover', (e) => {
        const selector = 'button, .circle-btn, #btn-fullscreen, .deck-option, .mini-btn';
        const target = e.target.closest(selector);
        if (target && target !== lastTarget) { lastTarget = target; window.playUIHoverSound(); } 
        else if (!target) { lastTarget = null; }
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) { currentUser = user; window.goToLobby(true); } 
    else { currentUser = null; window.showScreen('start-screen'); MusicController.play('bgm-menu'); }
});

preloadGame();
