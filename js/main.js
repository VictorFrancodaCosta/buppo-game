// ARQUIVO: js/main.js (VERSÃO CORRIGIDA)

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

// --- INICIALIZAÇÃO ---
let app, auth, db, provider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    console.log("Firebase conectado com sucesso.");
} catch (e) {
    console.error("Erro ao conectar Firebase:", e);
}

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
let myQueueRef = null;
let queueListener = null;
let matchSnapshotListener = null;
let matchTimerInterval = null;
let matchSeconds = 0;

window.currentMatchId = null;
window.gameMode = 'pve'; 
window.myPlayerKey = null; 
window.oppPlayerKey = null;

// --- ÁUDIOS (COM TRATAMENTO DE ERRO) ---
const audios = {};
const audioFiles = {
    'bgm-lobby': 'assets/audio/lobby_theme.mp3',
    'bgm-battle': 'assets/audio/battle_theme.mp3',
    'sfx-click': 'assets/audio/click.wav',
    'sfx-play': 'assets/audio/play_card.wav',
    'sfx-hit': 'assets/audio/hit.wav',
    'sfx-block': 'assets/audio/block.wav',
    'sfx-win': 'assets/audio/win.wav',
    'sfx-lose': 'assets/audio/lose.wav',
    'sfx-deck-select': 'assets/audio/deck_select.wav'
};

// Tenta carregar áudios, mas não quebra se falhar
for (let key in audioFiles) {
    try {
        let a = new Audio(audioFiles[key]);
        // Se der erro de carregamento (404), ignoramos
        a.onerror = () => { console.warn(`Áudio não encontrado: ${key} (Isso é normal se você não baixou os arquivos)`); };
        audios[key] = a;
    } catch(e) {
        console.warn("Erro ao iniciar áudio:", key);
    }
}

// Config loops se o audio existir
if(audios['bgm-lobby']) { audios['bgm-lobby'].loop = true; audios['bgm-lobby'].volume = 0.3; }
if(audios['bgm-battle']) { audios['bgm-battle'].loop = true; audios['bgm-battle'].volume = 0.2; }

// --- ESTADO DO JOGO ---
let player = { hp: 6, maxHp: 6, xp: 0, level: 1, deck: [], hand: [], disabled: null };
let monster = { hp: 10, maxHp: 10, deck: [], name: "MONSTRO", disabled: null };
let turnCount = 1;
let isProcessing = false;
let gameActive = false;
window.currentDeck = null;

// =========================================================
//  AUTENTICAÇÃO (CORRIGIDA)
// =========================================================

onAuthStateChanged(auth, async (user) => {
    // FUNÇÃO AUXILIAR PARA EVITAR ERRO DE ELEMENTO NULL
    const safeDisplay = (id, displayType) => {
        const el = document.getElementById(id);
        if(el) el.style.display = displayType;
        else console.warn(`Elemento HTML não encontrado: ${id}`);
    };

    if (user) {
        currentUser = user;
        
        // Esconde Login, Mostra Lobby (De forma segura)
        safeDisplay('login-screen', 'none');
        safeDisplay('lobby-screen', 'flex');
        
        const nameEl = document.getElementById('user-name');
        const imgEl = document.getElementById('user-avatar');
        
        if(nameEl) nameEl.innerText = user.displayName;
        if(imgEl) imgEl.src = user.photoURL;

        // DB User Init
        try {
            const userRef = doc(db, "players", user.uid);
            const snap = await getDoc(userRef);
            
            if (!snap.exists()) {
                await setDoc(userRef, {
                    name: user.displayName, email: user.email, score: 1000, matches: 0, wins: 0
                });
                const scoreEl = document.getElementById('user-score');
                if(scoreEl) scoreEl.innerText = "Pontos: 1000";
            } else {
                const scoreEl = document.getElementById('user-score');
                if(scoreEl) scoreEl.innerText = "Pontos: " + (snap.data().score || 1000);
            }
        } catch(e) { console.error("Erro DB User:", e); }

        playLobbyMusic();
    } else {
        safeDisplay('login-screen', 'flex');
        safeDisplay('lobby-screen', 'none');
        stopAllMusic();
    }
});

window.googleLogin = async function() {
    try {
        window.playNavSound();
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erro login:", error);
        alert("Erro no login: " + error.message);
    }
};

window.logout = function() {
    window.playNavSound();
    signOut(auth);
    location.reload();
};

// =========================================================
//  MATCHMAKING (RANKED)
// =========================================================

window.startPvPSearch = async function() {
    if (!currentUser) return;
    window.gameMode = 'pvp';
    window.playNavSound();

    const mmScreen = document.getElementById('matchmaking-screen');
    if(mmScreen) mmScreen.style.display = 'flex';
    
    // UI Reset
    const titleEl = document.querySelector('.mm-title');
    if(titleEl) {
        titleEl.innerText = "PROCURANDO OPONENTE...";
        titleEl.style.color = "var(--gold)";
    }
    const spinner = document.querySelector('.radar-spinner');
    if(spinner) {
        spinner.style.borderColor = "rgba(255, 215, 0, 0.3)";
        spinner.style.animation = "spin 1s linear infinite";
    }
    const cancelBtn = document.querySelector('.cancel-btn');
    if(cancelBtn) cancelBtn.style.display = "block";

    // Timer
    matchSeconds = 0;
    const timerEl = document.getElementById('mm-timer');
    if(timerEl) timerEl.innerText = "00:00";
    
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    matchTimerInterval = setInterval(() => {
        matchSeconds++;
        let m = Math.floor(matchSeconds / 60).toString().padStart(2, '0');
        let s = (matchSeconds % 60).toString().padStart(2, '0');
        if(timerEl) timerEl.innerText = `${m}:${s}`;
    }, 1000);

    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        let myScore = 1000;
        if(userSnap.exists()) myScore = userSnap.data().score || 1000;

        myQueueRef = doc(collection(db, "queue"));
        const myData = {
            uid: currentUser.uid, name: currentUser.displayName, score: myScore,
            timestamp: Date.now(), matchId: null
        };
        await setDoc(myQueueRef, myData);

        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.matchId) enterMatch(data.matchId);
            }
        });

        findOpponentInQueue(myScore);
    } catch (e) {
        console.error("Erro no Matchmaking:", e);
        cancelPvPSearch();
    }
};

async function findOpponentInQueue(myScore) {
    try {
        const queueRef = collection(db, "queue");
        const q = query(queueRef, orderBy("timestamp", "asc"), limit(20));
        const querySnapshot = await getDocs(q);

        let bestOpponent = null;
        let minDiff = Infinity;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.uid !== currentUser.uid && !data.matchId && !data.cancelled) {
                let diff = Math.abs((data.score || 1000) - myScore);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestOpponent = docSnap;
                }
            }
        });

        if (bestOpponent) {
            console.log("Oponente encontrado!");
            const opponentId = bestOpponent.data().uid;
            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

            await updateDoc(bestOpponent.ref, { matchId: matchId });
            if (myQueueRef) await updateDoc(myQueueRef, { matchId: matchId });
            await createMatchDocument(matchId, currentUser.uid, opponentId);
        }
    } catch (e) {
        console.error("Erro ao buscar:", e);
    }
}

async function createMatchDocument(matchId, p1Uid, p2Uid) {
    const matchRef = doc(db, "matches", matchId);
    await setDoc(matchRef, {
        player1: { uid: p1Uid, hp: 6, deckType: null, status: 'selecting' },
        player2: { uid: p2Uid, hp: 6, deckType: null, status: 'selecting' },
        turn: 1, moves: {}, winner: null, timestamp: Date.now()
    });
}

window.cancelPvPSearch = async function() {
    window.playNavSound();
    const mmScreen = document.getElementById('matchmaking-screen');
    if(mmScreen) mmScreen.style.display = 'none';
    
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (queueListener) { queueListener(); queueListener = null; }

    if (myQueueRef) {
        await updateDoc(myQueueRef, { cancelled: true });
        myQueueRef = null;
    }
};

window.enterMatch = function(matchId) {
    console.log("PARTIDA:", matchId);
    if (queueListener) queueListener();
    if (matchTimerInterval) clearInterval(matchTimerInterval);

    const titleEl = document.querySelector('.mm-title');
    if(titleEl) { titleEl.innerText = "PARTIDA ENCONTRADA!"; titleEl.style.color = "#2ecc71"; }
    
    const spinner = document.querySelector('.radar-spinner');
    if(spinner) { spinner.style.animation = "none"; spinner.style.borderColor = "#2ecc71"; }
    
    const cancelBtn = document.querySelector('.cancel-btn');
    if(cancelBtn) cancelBtn.style.display = "none";

    setTimeout(() => {
        const mmScreen = document.getElementById('matchmaking-screen');
        if(mmScreen) mmScreen.style.display = 'none';
        window.currentMatchId = matchId;
        startPvPListener();
        window.openDeckSelector(); 
    }, 1500);
};

// =========================================================
//  LISTENER PVP
// =========================================================

function startPvPListener() {
    if (!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    
    matchSnapshotListener = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();

        if (!window.myPlayerKey) {
            if (matchData.player1.uid === currentUser.uid) {
                window.myPlayerKey = 'player1'; window.oppPlayerKey = 'player2';
            } else {
                window.myPlayerKey = 'player2'; window.oppPlayerKey = 'player1';
            }
        }

        // Verifica Início
        if (matchData.player1.status === 'ready' && matchData.player2.status === 'ready') {
            const selScreen = document.getElementById('deck-selection-screen');
            if (selScreen && selScreen.style.display !== 'none' && selScreen.style.opacity !== '0') {
                selScreen.style.opacity = "0";
                setTimeout(() => {
                    setupPvPGame(matchData);
                    window.transitionToGame();
                }, 500);
            }
        }

        // Verifica Turno
        if (matchData.moves && matchData.moves[matchData.turn]) {
            const currentTurnMoves = matchData.moves[matchData.turn];
            if (currentTurnMoves.player1 && currentTurnMoves.player2 && !isProcessing) {
                resolvePvPTurn(currentTurnMoves[window.myPlayerKey], currentTurnMoves[window.oppPlayerKey]);
            }
        }
        
        // Fim de Jogo Remoto
        if (matchData.winner && gameActive) { /* Lógica extra se precisar */ }
    });
}

async function setupPvPGame(matchData) {
    const oppData = matchData[window.oppPlayerKey];
    try {
        const oppUserDoc = await getDoc(doc(db, "players", oppData.uid));
        if(oppUserDoc.exists()) monster.name = oppUserDoc.data().name.split(' ')[0].toUpperCase();
        else monster.name = "OPONENTE";
    } catch(e) { monster.name = "OPONENTE"; }
    monster.hp = 6; monster.maxHp = 6; monster.deck = []; monster.disabled = null;
    updateUI();
}

// =========================================================
//  LÓGICA DE JOGO
// =========================================================

window.startPvE = function() {
    window.gameMode = 'pve';
    window.currentMatchId = null;
    window.playNavSound();
    window.openDeckSelector();
}

window.openDeckSelector = function() {
    const lobby = document.getElementById('lobby-screen');
    if(lobby) lobby.style.display = 'none';
    
    const selScreen = document.getElementById('deck-selection-screen');
    if(selScreen) {
        selScreen.style.display = 'flex';
        selScreen.style.opacity = '1';
    }
    
    document.querySelectorAll('.deck-option').forEach(opt => {
        opt.style.opacity = "1"; opt.style.filter = "none"; opt.style.transform = "none";
    });
};

window.selectDeck = async function(deckType) {
    if(audios['sfx-deck-select']) { audios['sfx-deck-select'].currentTime = 0; audios['sfx-deck-select'].play().catch(()=>{}); }

    window.currentDeck = deckType;
    document.body.classList.remove('theme-cavaleiro', 'theme-mago');
    if (deckType === 'mage') document.body.classList.add('theme-mago');
    else document.body.classList.add('theme-cavaleiro');

    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))";
        } else {
            opt.style.opacity = "0.2"; opt.style.filter = "grayscale(100%)";
        }
    });

    if (window.gameMode === 'pvp' && window.currentMatchId) {
        showCenterText("AGUARDANDO OPONENTE...", "#ffd700");
        const matchRef = doc(db, "matches", window.currentMatchId);
        let updateData = {};
        updateData[`${window.myPlayerKey}.deckType`] = deckType;
        updateData[`${window.myPlayerKey}.status`] = 'ready';
        await updateDoc(matchRef, updateData);
    } else {
        setTimeout(() => {
            const selScreen = document.getElementById('deck-selection-screen');
            if(selScreen) selScreen.style.opacity = "0";
            setTimeout(() => {
                window.transitionToGame();
                if(selScreen) setTimeout(() => selScreen.style.opacity = "1", 500);
            }, 500);
        }, 400);
    }
};

window.transitionToGame = function() {
    const deckScreen = document.getElementById('deck-selection-screen');
    if(deckScreen) deckScreen.style.display = 'none';
    
    const gameScreen = document.getElementById('game-screen');
    if(gameScreen) gameScreen.style.display = 'flex';
    
    stopAllMusic();
    if(audios['bgm-battle']) audios['bgm-battle'].play().catch(()=>{});
    startGame();
};

function startGame() {
    gameActive = true; turnCount = 1; isProcessing = false;
    player.hp = 6; player.maxHp = 6; player.xp = 0; player.level = 1;
    player.deck = buildDeck(window.currentDeck); player.hand = []; player.disabled = null;

    if (window.gameMode === 'pve') {
        monster.name = "MONSTRO"; monster.hp = 10; monster.maxHp = 10;
        monster.deck = buildDeck('monster'); monster.disabled = null;
    } 
    drawHand(3); updateUI();
    const turnTxt = document.getElementById('turn-txt');
    if(turnTxt) turnTxt.innerText = "TURNO 1";
    cleanTable();
}

function buildDeck(type) {
    let deck = [];
    for (let key in DECK_TEMPLATE) {
        for(let i=0; i<DECK_TEMPLATE[key]; i++) deck.push(key);
    }
    return shuffle(deck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawHand(amount) {
    for(let i=0; i<amount; i++) {
        if(player.deck.length > 0) player.hand.push(player.deck.pop());
        else { player.deck = buildDeck(window.currentDeck); player.hand.push(player.deck.pop()); }
    }
    renderHand();
}

function renderHand() {
    const handDiv = document.getElementById('player-hand');
    if(!handDiv) return;
    handDiv.innerHTML = '';
    
    player.hand.forEach((cardKey, idx) => {
        const cardData = CARDS_DB[cardKey];
        const el = document.createElement('div');
        el.className = `card ${cardData.color}`;
        el.innerHTML = `
            <div class="card-icon" style="color:${cardData.fCol}">${cardData.icon}</div>
            <div class="card-title">${cardKey}</div>
            <div class="card-desc">${cardData.base}</div>
        `;
        if(player.disabled === cardKey) {
            el.classList.add('disabled-card');
            el.innerHTML += `<div style="position:absolute; inset:0; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; color:red; font-size:2rem; font-weight:bold; transform:rotate(-15deg);">X</div>`;
        }
        el.onclick = () => onCardClick(idx);
        el.oncontextmenu = (e) => { e.preventDefault(); showTooltip(cardKey, e.clientX, e.clientY); };
        let pressTimer;
        el.ontouchstart = (e) => { pressTimer = setTimeout(() => showTooltip(cardKey, e.touches[0].clientX, e.touches[0].clientY), 500); };
        el.ontouchend = () => clearTimeout(pressTimer);
        handDiv.appendChild(el);
    });
}

window.onCardClick = function(index) {
    if(isProcessing || !gameActive || !player.hand[index]) return;
    let cardKey = player.hand[index];
    
    if(player.disabled === cardKey) { 
        showCenterText("ESTA CARTA ESTÁ BLOQUEADA!", "#e74c3c"); 
        playSound('sfx-block'); return; 
    }
    
    if(cardKey === 'DESARMAR') { 
        window.openModal('ALVO DO DESARME', 'Qual ação bloquear no inimigo?', ACTION_KEYS, (choice) => {
            if(window.gameMode === 'pvp') sendPvPMove(index, cardKey, choice);
            else playCardFlow(index, choice);
        }); 
    } else { 
        if(window.gameMode === 'pvp') sendPvPMove(index, cardKey, null);
        else playCardFlow(index, null);
    }
};

async function sendPvPMove(index, cardKey, disarmChoice) {
    playSound('sfx-play');
    const tb = document.getElementById('tooltip-box');
    if(tb) tb.style.display = 'none';
    
    player.hand.splice(index, 1);
    renderHand();
    isProcessing = true;
    showCenterText("AGUARDANDO OPONENTE...", "#fff");

    let movePayload = cardKey;
    if (cardKey === 'DESARMAR') movePayload = { card: 'DESARMAR', target: disarmChoice };

    const matchRef = doc(db, "matches", window.currentMatchId);
    let updateData = {};
    updateData[`moves.${turnCount}.${window.myPlayerKey}`] = movePayload;
    await updateDoc(matchRef, updateData);
}

function playCardFlow(index, pDisarmChoice) {
    playSound('sfx-play');
    const tb = document.getElementById('tooltip-box');
    if(tb) tb.style.display = 'none';
    isProcessing = true;

    const pCardKey = player.hand.splice(index, 1)[0];
    renderHand(); renderTable(pCardKey, 'p-slot', true);

    const mCardKey = monster.deck.length > 0 ? monster.deck.pop() : 'ATAQUE'; 
    if(monster.deck.length === 0) monster.deck = buildDeck('monster');
    
    let mDisarmTarget = null;
    if(mCardKey === 'DESARMAR') {
        const options = ['ATAQUE', 'BLOQUEIO', 'TREINAR'];
        mDisarmTarget = options[Math.floor(Math.random()*options.length)];
    }

    const origin = { top: -100, left: window.innerWidth/2 };
    animateFly(origin, 'm-slot', mCardKey, () => {
        renderTable(mCardKey, 'm-slot', false);
        setTimeout(() => resolveTurn(pCardKey, mCardKey, pDisarmChoice, mDisarmTarget), 600);
    }, false, true, false);
}

window.resolvePvPTurn = function(myMoveData, oppMoveData) {
    const msg = document.getElementById('center-msg');
    if(msg) msg.style.opacity = '0';

    let myCard = (typeof myMoveData === 'object') ? myMoveData.card : myMoveData;
    let myDisarmTarget = (typeof myMoveData === 'object') ? myMoveData.target : null;
    let oppCard = (typeof oppMoveData === 'object') ? oppMoveData.card : oppMoveData;
    let oppDisarmTarget = (typeof oppMoveData === 'object') ? oppMoveData.target : null;

    renderTable(myCard, 'p-slot', true);
    const origin = { top: -150, left: window.innerWidth / 2 };
    
    animateFly(origin, 'm-slot', oppCard, () => {
        renderTable(oppCard, 'm-slot', false);
        setTimeout(() => {
            resolveTurn(myCard, oppCard, myDisarmTarget, oppDisarmTarget);
            if (window.myPlayerKey === 'player1') {
                updateDoc(doc(db, "matches", window.currentMatchId), { turn: turnCount + 1 });
            }
        }, 600);
    }, false, true, false);
}

function resolveTurn(pKey, mKey, pDisarmChoice, mDisarmTarget) {
    const pData = CARDS_DB[pKey];
    let pBlocked = (player.disabled === pKey);
    let mBlocked = (monster.disabled === mKey);

    player.disabled = null; monster.disabled = null;
    if(pBlocked) { showCenterText("VOCÊ ESTAVA BLOQUEADO!", "#e74c3c"); playSound('sfx-block'); }

    if(!pBlocked && pKey === 'DESARMAR' && pDisarmChoice) {
        monster.disabled = pDisarmChoice; 
        createEffectText('BLOQUEADO', 'm-slot', '#f1c40f');
    }
    if(!mBlocked && mKey === 'DESARMAR' && mDisarmTarget) {
        player.disabled = mDisarmTarget; showFullBlockEffect(mDisarmTarget);
    }

    if (!pBlocked && pKey === 'ATAQUE') {
        let dmg = player.level + countMastery('ATAQUE');
        if (!mBlocked && mKey === 'BLOQUEIO') {
            playSound('sfx-block'); createEffectText("BLOQUEADO", 'm-slot', '#3498db');
        } else if(!mBlocked && mKey === 'DESCANSAR') {
            playSound('sfx-hit'); monster.hp -= dmg; createDamageNumber(dmg, 'm-slot');
            player.xp++; createEffectText("+XP", 'p-xp', '#a29bfe');
        } else {
            playSound('sfx-hit'); monster.hp -= dmg; createDamageNumber(dmg, 'm-slot');
        }
    }

    if (!mBlocked && mKey === 'ATAQUE') {
        let dmg = (window.gameMode === 'pvp') ? 1 : (1 + Math.floor(turnCount/5));
        if (!pBlocked && pKey === 'BLOQUEIO') {
            playSound('sfx-block'); createEffectText("BLOQUEADO", 'p-slot', '#3498db');
            player.hp = Math.min(player.hp + 1, player.maxHp); createEffectText("+1 HP", 'p-slot', '#2ecc71');
        } else {
            playSound('sfx-hit'); player.hp -= dmg; createDamageNumber(dmg, 'p-slot');
        }
    }

    if (!pBlocked && pKey === 'DESCANSAR') {
        let heal = 1 + countMastery('DESCANSAR');
        player.hp = Math.min(player.hp + heal, player.maxHp); window.triggerHealEffect();
    }
    if (!pBlocked && pKey === 'TREINAR') {
        player.xp++; createEffectText("+XP", 'p-xp', '#a29bfe');
    }
    if (!mBlocked && mKey === 'DESCANSAR') {
        monster.hp = Math.min(monster.hp + 1, monster.maxHp); createEffectText("+1 HP", 'm-slot', '#2ecc71');
    }

    if (player.xp >= 3) {
        player.level++; player.xp = 0; player.maxHp++; player.hp = player.maxHp;
        playSound('sfx-deck-select'); showCenterText("LEVEL UP!", "#f1c40f"); addMasteryIcon();
    }

    updateUI();

    if (player.hp <= 0) endGame(false);
    else if (monster.hp <= 0) endGame(true);
    else {
        setTimeout(() => {
            cleanTable(); drawHand(1); turnCount++;
            const t = document.getElementById('turn-txt');
            if(t) t.innerText = "TURNO " + turnCount;
            isProcessing = false;
        }, 1500);
    }
}

async function endGame(victory) {
    gameActive = false; isProcessing = true;
    if(victory) playSound('sfx-win'); else playSound('sfx-lose');

    const overlay = document.getElementById('game-over-overlay');
    if(overlay) overlay.style.display = 'flex';
    const title = document.getElementById('go-title');
    if(title) { title.innerText = victory ? "VITÓRIA!" : "DERROTA"; title.style.color = victory ? "#2ecc71" : "#e74c3c"; }
    const desc = document.getElementById('go-desc');
    if(desc) desc.innerText = victory ? "Você venceu o combate!" : "Ainda há muito o que aprender...";

    if(window.gameMode === 'pvp' && window.currentMatchId) {
        const matchRef = doc(db, "matches", window.currentMatchId);
        if (victory) {
            updateDoc(matchRef, { winner: window.myPlayerKey });
            const userRef = doc(db, "players", currentUser.uid);
            const userSnap = await getDoc(userRef);
            let currentScore = userSnap.data().score || 1000;
            await updateDoc(userRef, { score: currentScore + 25, wins: (userSnap.data().wins||0)+1, matches: (userSnap.data().matches||0)+1 });
        } else {
             const userRef = doc(db, "players", currentUser.uid);
             const userSnap = await getDoc(userRef);
             await updateDoc(userRef, { score: Math.max(0, (userSnap.data().score||1000) - 20), matches: (userSnap.data().matches||0)+1 });
        }
    }
}

window.transitionToLobby = function() {
    const overlay = document.getElementById('game-over-overlay');
    if(overlay) overlay.style.display = 'none';
    const gameScreen = document.getElementById('game-screen');
    if(gameScreen) gameScreen.style.display = 'none';
    const lobby = document.getElementById('lobby-screen');
    if(lobby) lobby.style.display = 'flex';
    
    stopAllMusic(); playLobbyMusic();

    if (matchSnapshotListener) { matchSnapshotListener(); matchSnapshotListener = null; }
    window.gameMode = 'pve'; window.currentMatchId = null; window.myPlayerKey = null;
};

// =========================================================
//  UI HELPERS
// =========================================================

function updateUI() {
    const pHpTxt = document.getElementById('p-hp-txt');
    if(pHpTxt) pHpTxt.innerText = `${player.hp}/${player.maxHp}`;
    
    const pHpFill = document.getElementById('p-hp-fill');
    if(pHpFill) pHpFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
    
    const pLvl = document.getElementById('p-lvl');
    if(pLvl) pLvl.innerText = player.level;
    
    const xpDiv = document.getElementById('p-xp');
    if(xpDiv) {
        xpDiv.innerHTML = '';
        for(let i=0; i<3; i++) {
            let dot = document.createElement('div');
            dot.className = i < player.xp ? 'xp-dot active' : 'xp-dot';
            xpDiv.appendChild(dot);
        }
    }

    const deckCount = document.getElementById('p-deck-count');
    if(deckCount) deckCount.innerText = player.deck.length;

    const enName = document.querySelector('#opponent-area .unit-name');
    if(enName) enName.innerText = monster.name;
    
    const mHpTxt = document.getElementById('m-hp-txt');
    if(mHpTxt) mHpTxt.innerText = `${monster.hp}/${monster.maxHp}`;
    
    const mHpFill = document.getElementById('m-hp-fill');
    if(mHpFill) mHpFill.style.width = `${(monster.hp / monster.maxHp) * 100}%`;
}

function renderTable(cardKey, slotId, isPlayer) {
    const slot = document.getElementById(slotId);
    if(!slot) return;
    const data = CARDS_DB[cardKey];
    slot.innerHTML = `
        <div class="card ${data.color} in-play">
             <div class="card-icon" style="color:${data.fCol}">${data.icon}</div>
             <div class="card-title">${cardKey}</div>
        </div>
    `;
    const cardEl = slot.firstElementChild;
    cardEl.animate([{ transform: 'scale(0.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'ease-out' });
}

function cleanTable() {
    const pSlot = document.getElementById('p-slot');
    const mSlot = document.getElementById('m-slot');
    if(pSlot && pSlot.firstChild) { pSlot.firstChild.style.opacity = '0'; pSlot.firstChild.style.transform = 'translateY(-20px)'; }
    if(mSlot && mSlot.firstChild) { mSlot.firstChild.style.opacity = '0'; mSlot.firstChild.style.transform = 'translateY(20px)'; }
    setTimeout(() => { if(pSlot) pSlot.innerHTML = ''; if(mSlot) mSlot.innerHTML = ''; }, 300);
}

function animateFly(from, toId, cardKey, onComplete, isPlayerToTable, isEnemyToTable, isFlip) {
    const toEl = document.getElementById(toId);
    if(!toEl) { if(onComplete) onComplete(); return; }
    
    const rectTo = toEl.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = `card ${CARDS_DB[cardKey].color}`;
    if(isEnemyToTable) fly.innerHTML = `<div class="card-icon">${CARDS_DB[cardKey].icon}</div>`;
    
    Object.assign(fly.style, { position: 'fixed', width: '100px', height: '140px', left: (from.left || 0) + 'px', top: (from.top || 0) + 'px', transition: 'all 0.5s ease-in-out', zIndex: '9999' });
    document.body.appendChild(fly);

    requestAnimationFrame(() => {
        fly.style.left = (rectTo.left + rectTo.width/2 - 50) + 'px';
        fly.style.top = (rectTo.top + rectTo.height/2 - 70) + 'px';
        fly.style.transform = 'scale(1.1)';
    });
    setTimeout(() => { fly.remove(); if(onComplete) onComplete(); }, 500);
}

function createDamageNumber(amount, slotId) {
    const slot = document.getElementById(slotId);
    if(!slot) return;
    const rect = slot.getBoundingClientRect();
    const el = document.createElement('div');
    el.innerText = "-" + amount; el.className = 'damage-text';
    el.style.left = (rect.left + 40) + 'px'; el.style.top = (rect.top) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function createEffectText(text, slotId, color) {
    const slot = document.getElementById(slotId);
    if(!slot) return;
    const rect = slot.getBoundingClientRect();
    const el = document.createElement('div');
    el.innerText = text;
    Object.assign(el.style, { position: 'fixed', color: color, fontWeight: 'bold', fontSize: '1.5rem', textShadow: '0 0 5px #000', zIndex: '2000', left: (rect.left + 20) + 'px', top: (rect.top - 20) + 'px' });
    el.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-30px)', opacity: 0 }], { duration: 800 });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function showCenterText(text, color) {
    const msg = document.getElementById('center-msg');
    if(!msg) return;
    msg.innerText = text; msg.style.color = color || '#fff'; msg.style.opacity = '1';
    msg.style.transform = 'translate(-50%, -50%) scale(1.2)';
    setTimeout(() => {
        msg.style.transform = 'translate(-50%, -50%) scale(1)';
        setTimeout(() => { if(!isProcessing) msg.style.opacity = '0'; }, 1500);
    }, 100);
}

function showFullBlockEffect(actionName) {
    const blockText = document.createElement('div');
    blockText.innerText = "BLOQUEOU " + actionName + "!";
    Object.assign(blockText.style, { position: 'fixed', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Bangers', cursive", fontSize: '4rem', color: '#e74c3c', textShadow: '0 0 20px black', zIndex: '9000', pointerEvents: 'none' });
    document.body.appendChild(blockText);
    blockText.animate([{ opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' }, { opacity: 1, transform: 'translate(-50%, -50%) scale(1.2)' }, { opacity: 0, transform: 'translate(-50%, -50%) scale(1.5)' }], { duration: 1500 });
    setTimeout(() => blockText.remove(), 1500);
}

function addMasteryIcon() {
    const row = document.getElementById('p-masteries');
    if(row) { const icon = document.createElement('div'); icon.className = 'mastery-icon'; icon.innerText = '★'; row.appendChild(icon); }
}

function countMastery(type) { return player.level - 1; }

window.showTooltip = function(cardKey, x, y) {
    const box = document.getElementById('tooltip-box');
    const data = CARDS_DB[cardKey];
    document.getElementById('tt-title').innerText = cardKey;
    document.getElementById('tt-title').style.color = data.fCol;
    let content = data.customTooltip.replace('{PLAYER_LVL}', player.level);
    document.getElementById('tt-content').innerHTML = content;
    box.style.display = 'block';
    let left = x + 20; let top = y - 50;
    if (left + 250 > window.innerWidth) left = x - 270;
    if (top + 300 > window.innerHeight) top = window.innerHeight - 320;
    box.style.left = left + 'px'; box.style.top = top + 'px';
};

document.body.onclick = (e) => { if(!e.target.closest('.card')) { const b = document.getElementById('tooltip-box'); if(b) b.style.display = 'none'; } };

window.openModal = function(title, desc, options, callback) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-desc').innerText = desc;
    const container = document.getElementById('modal-options');
    container.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'modal-btn'; btn.innerText = opt;
        btn.onclick = () => { overlay.style.display = 'none'; callback(opt); };
        container.appendChild(btn);
    });
    overlay.style.display = 'flex';
};

function playSound(key) {
    if(audios[key]) { audios[key].currentTime = 0; audios[key].play().catch(()=>{}); }
}

function playLobbyMusic() {
    if(audios['bgm-battle']) audios['bgm-battle'].pause();
    if(audios['bgm-lobby']) audios['bgm-lobby'].play().catch(()=>{});
}

function stopAllMusic() {
    if(audios['bgm-lobby']) audios['bgm-lobby'].pause();
    if(audios['bgm-battle']) audios['bgm-battle'].pause();
}
