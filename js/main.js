// ARQUIVO: js/main.js (VERSÃO COMPLETA PVE + PVP RANKED)

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

// --- VARIÁVEIS GLOBAIS DE JOGO ---
let currentUser = null;
let myQueueRef = null;
let queueListener = null;
let matchSnapshotListener = null; // Escuta a partida PvP
let matchTimerInterval = null;
let matchSeconds = 0;

window.currentMatchId = null;
window.gameMode = 'pve'; // 'pve' ou 'pvp'
window.myPlayerKey = null; // 'player1' ou 'player2'
window.oppPlayerKey = null;

// Áudios
const audios = {
    'bgm-lobby': new Audio('assets/audio/lobby_theme.mp3'),
    'bgm-battle': new Audio('assets/audio/battle_theme.mp3'),
    'sfx-click': new Audio('assets/audio/click.wav'),
    'sfx-play': new Audio('assets/audio/play_card.wav'),
    'sfx-hit': new Audio('assets/audio/hit.wav'),
    'sfx-block': new Audio('assets/audio/block.wav'),
    'sfx-win': new Audio('assets/audio/win.wav'),
    'sfx-lose': new Audio('assets/audio/lose.wav'),
    'sfx-deck-select': new Audio('assets/audio/deck_select.wav')
};

// Configuração de Audio Loop
audios['bgm-lobby'].loop = true;
audios['bgm-battle'].loop = true;
audios['bgm-lobby'].volume = 0.3;
audios['bgm-battle'].volume = 0.2;

// ESTADO DO JOGO
let player = {
    hp: 6, maxHp: 6,
    xp: 0, level: 1,
    deck: [], hand: [],
    disabled: null // Carta desabilitada pelo inimigo
};

let monster = {
    hp: 10, maxHp: 10,
    deck: [],
    name: "MONSTRO",
    disabled: null
};

let turnCount = 1;
let isProcessing = false;
let gameActive = false;
window.currentDeck = null; // 'knight' ou 'mage'

// =========================================================
//  SISTEMA DE AUTENTICAÇÃO E LOGIN
// =========================================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('lobby-screen').style.display = 'flex';
        
        document.getElementById('user-name').innerText = user.displayName;
        document.getElementById('user-avatar').src = user.photoURL;

        // Tenta criar/atualizar doc do usuário no DB
        const userRef = doc(db, "players", user.uid);
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
            await setDoc(userRef, {
                name: user.displayName,
                email: user.email,
                score: 1000, // Score inicial
                matches: 0,
                wins: 0
            });
            document.getElementById('user-score').innerText = "Pontos: 1000";
        } else {
            document.getElementById('user-score').innerText = "Pontos: " + (snap.data().score || 1000);
        }

        playLobbyMusic();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('lobby-screen').style.display = 'none';
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
//  MATCHMAKING INTELIGENTE (RANKED)
// =========================================================

window.startPvPSearch = async function() {
    if (!currentUser) return;
    window.gameMode = 'pvp';
    window.playNavSound();

    // UI de busca
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'flex';
    const titleEl = document.querySelector('.mm-title');
    titleEl.innerText = "PROCURANDO OPONENTE...";
    titleEl.style.color = "var(--gold)";
    
    // Reset visual
    document.querySelector('.radar-spinner').style.borderColor = "rgba(255, 215, 0, 0.3)";
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

    try {
        // 1. Pega pontuação atual
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        let myScore = 1000;
        if(userSnap.exists()) myScore = userSnap.data().score || 1000;

        // 2. Cria ticket na fila (COM SCORE)
        myQueueRef = doc(collection(db, "queue"));
        const myData = {
            uid: currentUser.uid,
            name: currentUser.displayName,
            score: myScore,
            timestamp: Date.now(),
            matchId: null
        };
        await setDoc(myQueueRef, myData);

        // 3. Ouve o próprio ticket (espera ser escolhido)
        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.matchId) {
                    enterMatch(data.matchId); // Fui escolhido!
                }
            }
        });

        // 4. Tenta buscar alguém compatível ativamente
        findOpponentInQueue(myScore);

    } catch (e) {
        console.error("Erro no Matchmaking:", e);
        cancelPvPSearch();
    }
};

async function findOpponentInQueue(myScore) {
    try {
        const queueRef = collection(db, "queue");
        // Busca os 20 mais antigos para tentar parear quem espera há mais tempo
        const q = query(queueRef, orderBy("timestamp", "asc"), limit(20));
        const querySnapshot = await getDocs(q);

        let bestOpponent = null;
        let minDiff = Infinity;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Regras: Não sou eu, não tem partida, não cancelou
            if (data.uid !== currentUser.uid && !data.matchId && !data.cancelled) {
                
                // CÁLCULO DE DIFERENÇA DE RANKING
                let diff = Math.abs((data.score || 1000) - myScore);
                
                // Procura o MAIS PRÓXIMO possível
                // (Se quisesse limitar a 500, faria: if (diff < minDiff && diff <= 500))
                if (diff < minDiff) {
                    minDiff = diff;
                    bestOpponent = docSnap;
                }
            }
        });

        // Se encontrou alguém
        if (bestOpponent) {
            console.log(`Oponente encontrado! Score: ${bestOpponent.data().score} (Diff: ${minDiff})`);
            
            const opponentId = bestOpponent.data().uid;
            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

            // 1. Atualiza o oponente (avisa que achou)
            await updateDoc(bestOpponent.ref, { matchId: matchId });
            
            // 2. Atualiza a mim mesmo
            if (myQueueRef) {
                await updateDoc(myQueueRef, { matchId: matchId });
            }

            // 3. Cria o documento da partida
            await createMatchDocument(matchId, currentUser.uid, opponentId);
        }

    } catch (e) {
        console.error("Erro ao buscar oponente:", e);
    }
}

async function createMatchDocument(matchId, p1Uid, p2Uid) {
    const matchRef = doc(db, "matches", matchId);
    await setDoc(matchRef, {
        player1: { uid: p1Uid, hp: 6, deckType: null, status: 'selecting' }, // status: selecting, ready
        player2: { uid: p2Uid, hp: 6, deckType: null, status: 'selecting' },
        turn: 1,
        moves: {}, // { 1: { player1: 'ATAQUE', player2: 'BLOQUEIO' } }
        winner: null,
        timestamp: Date.now()
    });
}

window.cancelPvPSearch = async function() {
    window.playNavSound();
    
    // UI Cleanup
    document.getElementById('matchmaking-screen').style.display = 'none';
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    
    if (queueListener) { queueListener(); queueListener = null; }

    if (myQueueRef) {
        // Marca como cancelado para não ser pego por outros
        await updateDoc(myQueueRef, { cancelled: true });
        myQueueRef = null;
    }
    console.log("Busca cancelada.");
};

window.enterMatch = function(matchId) {
    console.log("PARTIDA ENCONTRADA! ID:", matchId);
    
    // Limpa fila
    if (queueListener) queueListener();
    if (matchTimerInterval) clearInterval(matchTimerInterval);

    // Feedback Visual
    const titleEl = document.querySelector('.mm-title');
    titleEl.innerText = "PARTIDA ENCONTRADA!";
    titleEl.style.color = "#2ecc71";
    document.querySelector('.radar-spinner').style.borderColor = "#2ecc71";
    document.querySelector('.radar-spinner').style.animation = "none";
    document.querySelector('.cancel-btn').style.display = "none";

    setTimeout(() => {
        document.getElementById('matchmaking-screen').style.display = 'none';
        window.currentMatchId = matchId;
        
        // --- INICIA LISTENER PVP ---
        startPvPListener();
        
        // Abre seleção
        window.openDeckSelector(); 
    }, 1500);
};

// =========================================================
//  LISTENER E SINCRONIZAÇÃO DA PARTIDA PVP
// =========================================================

function startPvPListener() {
    if (!window.currentMatchId) return;

    const matchRef = doc(db, "matches", window.currentMatchId);
    
    matchSnapshotListener = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();

        // 1. Identificar quem sou eu (apenas na primeira vez)
        if (!window.myPlayerKey) {
            if (matchData.player1.uid === currentUser.uid) {
                window.myPlayerKey = 'player1'; 
                window.oppPlayerKey = 'player2';
            } else {
                window.myPlayerKey = 'player2'; 
                window.oppPlayerKey = 'player1';
            }
            console.log("Sou o " + window.myPlayerKey);
        }

        // 2. Verificar Início de Jogo (Ambos Prontos)
        // Se ambos escolheram o deck e eu ainda estou na tela de seleção
        if (matchData.player1.status === 'ready' && matchData.player2.status === 'ready') {
            const selScreen = document.getElementById('deck-selection-screen');
            if (selScreen.style.display !== 'none' && selScreen.style.opacity !== '0') {
                console.log("Ambos prontos! Iniciando...");
                
                // Fecha tela de seleção suavemente
                selScreen.style.opacity = "0";
                setTimeout(() => {
                    setupPvPGame(matchData); // Configura nome do inimigo, etc
                    window.transitionToGame();
                }, 500);
            }
        }

        // 3. Verificar Resolução de Turno
        if (matchData.moves && matchData.moves[matchData.turn]) {
            const currentTurnMoves = matchData.moves[matchData.turn];
            // Se ambos jogaram e eu não estou processando animação
            if (currentTurnMoves.player1 && currentTurnMoves.player2 && !isProcessing) {
                console.log("Turno completo. Resolvendo...");
                
                const myMove = currentTurnMoves[window.myPlayerKey];
                const oppMove = currentTurnMoves[window.oppPlayerKey];
                
                resolvePvPTurn(myMove, oppMove);
            }
        }
        
        // 4. Verificar Fim de Jogo Remoto (Desistência ou vitoria computada lá)
        if (matchData.winner && gameActive) {
            // Lógica de fim de jogo (se quiser garantir sync extra)
        }
    });
}

async function setupPvPGame(matchData) {
    const oppData = matchData[window.oppPlayerKey];
    
    // Tenta pegar o nome real
    try {
        const oppUserDoc = await getDoc(doc(db, "players", oppData.uid));
        if(oppUserDoc.exists()) {
            monster.name = oppUserDoc.data().name.split(' ')[0].toUpperCase();
        } else {
            monster.name = "OPONENTE";
        }
    } catch(e) { monster.name = "OPONENTE"; }

    // Reseta estados
    monster.hp = 6; monster.maxHp = 6;
    monster.deck = []; // Deck inimigo é abstrato no client
    monster.disabled = null;
    
    updateUI();
}

// =========================================================
//  LÓGICA DE JOGO (DECK, MOVIMENTOS, RESOLUÇÃO)
// =========================================================

window.startPvE = function() {
    window.gameMode = 'pve';
    window.currentMatchId = null;
    window.playNavSound();
    window.openDeckSelector();
}

window.openDeckSelector = function() {
    document.getElementById('lobby-screen').style.display = 'none';
    const selScreen = document.getElementById('deck-selection-screen');
    selScreen.style.display = 'flex';
    selScreen.style.opacity = '1';
    
    // Reseta visual dos cards
    document.querySelectorAll('.deck-option').forEach(opt => {
        opt.style.opacity = "1";
        opt.style.filter = "none";
        opt.style.transform = "none";
    });
};

window.selectDeck = async function(deckType) {
    if(audios['sfx-deck-select']) {
        audios['sfx-deck-select'].currentTime = 0;
        audios['sfx-deck-select'].play().catch(()=>{});
    }

    window.currentDeck = deckType;
    
    // Tema visual
    document.body.classList.remove('theme-cavaleiro', 'theme-mago');
    if (deckType === 'mage') document.body.classList.add('theme-mago');
    else document.body.classList.add('theme-cavaleiro');

    // UI Feedback
    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))";
        } else {
            opt.style.opacity = "0.2";
            opt.style.filter = "grayscale(100%)";
        }
    });

    // --- DECISÃO: PVE ou PVP ---
    if (window.gameMode === 'pvp' && window.currentMatchId) {
        // MODO PVP: Avisa o servidor e espera
        showCenterText("AGUARDANDO OPONENTE...", "#ffd700");
        
        const matchRef = doc(db, "matches", window.currentMatchId);
        
        // Atualiza meu status
        let updateData = {};
        updateData[`${window.myPlayerKey}.deckType`] = deckType;
        updateData[`${window.myPlayerKey}.status`] = 'ready';
        
        await updateDoc(matchRef, updateData);
        // O startPvPListener vai detectar quando o outro estiver pronto
        
    } else {
        // MODO PVE: Vai direto
        setTimeout(() => {
            const selScreen = document.getElementById('deck-selection-screen');
            selScreen.style.opacity = "0";
            setTimeout(() => {
                window.transitionToGame();
                setTimeout(() => selScreen.style.opacity = "1", 500); // Reset invisivel
            }, 500);
        }, 400);
    }
};

window.transitionToGame = function() {
    document.getElementById('deck-selection-screen').style.display = 'none';
    const gameScreen = document.getElementById('game-screen');
    gameScreen.style.display = 'flex';
    
    // Inicia música de batalha
    stopAllMusic();
    audios['bgm-battle'].play().catch(()=>{});

    startGame();
};

function startGame() {
    gameActive = true;
    turnCount = 1;
    isProcessing = false;

    // Player Stats
    player.hp = 6; player.maxHp = 6;
    player.xp = 0; player.level = 1;
    player.deck = buildDeck(window.currentDeck);
    player.hand = [];
    player.disabled = null;

    // Monstro / Oponente
    if (window.gameMode === 'pve') {
        monster.name = "MONSTRO";
        monster.hp = 10; monster.maxHp = 10;
        monster.deck = buildDeck('monster');
        monster.disabled = null;
    } 
    // No PvP, monster stats já foram resetados no setupPvPGame

    drawHand(3);
    updateUI();
    document.getElementById('turn-txt').innerText = "TURNO 1";
    document.getElementById('m-slot').innerHTML = '';
    document.getElementById('p-slot').innerHTML = '';
}

function buildDeck(type) {
    let deck = [];
    // Gera deck com base no template
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
        else {
            // Recicla descarte se acabar (simplificado: reseta um novo deck)
            player.deck = buildDeck(window.currentDeck);
            player.hand.push(player.deck.pop());
        }
    }
    renderHand();
}

function renderHand() {
    const handDiv = document.getElementById('player-hand');
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
        
        // Verifica se está desabilitada
        if(player.disabled === cardKey) {
            el.classList.add('disabled-card');
            el.innerHTML += `<div style="position:absolute; inset:0; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; color:red; font-size:2rem; font-weight:bold; transform:rotate(-15deg);">X</div>`;
        }

        el.onclick = () => onCardClick(idx);
        el.oncontextmenu = (e) => { e.preventDefault(); showTooltip(cardKey, e.clientX, e.clientY); };
        
        // Tooltip Mobile (Touch longo)
        let pressTimer;
        el.ontouchstart = (e) => { 
            pressTimer = setTimeout(() => showTooltip(cardKey, e.touches[0].clientX, e.touches[0].clientY), 500); 
        };
        el.ontouchend = () => clearTimeout(pressTimer);
        
        handDiv.appendChild(el);
    });
}

// --- AÇÃO DO JOGADOR ---
window.onCardClick = function(index) {
    if(isProcessing) return; 
    if(!gameActive) return;
    if (!player.hand[index]) return;
    
    let cardKey = player.hand[index];
    
    // Check Desarme
    if(player.disabled === cardKey) { 
        showCenterText("ESTA CARTA ESTÁ BLOQUEADA!", "#e74c3c"); 
        playSound('sfx-block');
        return; 
    }
    
    // Lógica de Desarme (precisa escolher alvo)
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

// --- FLUXO PVP: ENVIAR MOVIMENTO ---
async function sendPvPMove(index, cardKey, disarmChoice) {
    playSound('sfx-play');
    document.getElementById('tooltip-box').style.display = 'none';
    
    // 1. Remove carta da mão (Local)
    player.hand.splice(index, 1);
    renderHand(); // Atualiza UI

    // 2. Bloqueia UI
    isProcessing = true;
    showCenterText("AGUARDANDO OPONENTE...", "#fff");

    // 3. Prepara payload
    let movePayload = cardKey;
    if (cardKey === 'DESARMAR') {
        movePayload = { card: 'DESARMAR', target: disarmChoice };
    }

    // 4. Envia para o Firebase
    const matchRef = doc(db, "matches", window.currentMatchId);
    let updateData = {};
    updateData[`moves.${turnCount}.${window.myPlayerKey}`] = movePayload;

    await updateDoc(matchRef, updateData);
    // Agora esperamos o listener (startPvPListener) chamar resolvePvPTurn
}

// --- FLUXO PVE: LÓGICA IMEDIATA ---
function playCardFlow(index, pDisarmChoice) {
    playSound('sfx-play');
    document.getElementById('tooltip-box').style.display = 'none';
    isProcessing = true;

    // 1. Jogador joga carta
    const pCardKey = player.hand.splice(index, 1)[0];
    renderHand();
    renderTable(pCardKey, 'p-slot', true);

    // 2. Monstro joga carta (IA)
    const mCardKey = monster.deck.length > 0 ? monster.deck.pop() : 'ATAQUE'; 
    if(monster.deck.length === 0) monster.deck = buildDeck('monster');
    
    // IA do Monstro (Decisão simples de desarmar)
    let mDisarmTarget = null;
    if(mCardKey === 'DESARMAR') {
        const options = ['ATAQUE', 'BLOQUEIO', 'TREINAR'];
        mDisarmTarget = options[Math.floor(Math.random()*options.length)];
    }

    // Animação de entrada do inimigo
    const origin = { top: -100, left: window.innerWidth/2 };
    animateFly(origin, 'm-slot', mCardKey, () => {
        renderTable(mCardKey, 'm-slot', false);
        setTimeout(() => {
            resolveTurn(pCardKey, mCardKey, pDisarmChoice, mDisarmTarget);
        }, 600);
    }, false, true, false);
}

// --- RESOLUÇÃO DE TURNO (PVP) ---
window.resolvePvPTurn = function(myMoveData, oppMoveData) {
    // Esconde texto de aguarde
    const msg = document.getElementById('center-msg');
    if(msg) msg.style.opacity = '0';

    // Normaliza dados
    let myCard = (typeof myMoveData === 'object') ? myMoveData.card : myMoveData;
    let myDisarmTarget = (typeof myMoveData === 'object') ? myMoveData.target : null;
    
    let oppCard = (typeof oppMoveData === 'object') ? oppMoveData.card : oppMoveData;
    let oppDisarmTarget = (typeof oppMoveData === 'object') ? oppMoveData.target : null;

    // Mostra minha carta na mesa (caso não esteja, mas no pvp ja removemos da mao)
    renderTable(myCard, 'p-slot', true);

    // Animação da carta do oponente vindo do "topo"
    // No PvP, a mão do oponente não existe visualmente, então vem do topo centro
    const origin = { top: -150, left: window.innerWidth / 2 };
    
    animateFly(origin, 'm-slot', oppCard, () => {
        renderTable(oppCard, 'm-slot', false);
        setTimeout(() => {
            // Chama a lógica principal de cálculo
            resolveTurn(myCard, oppCard, myDisarmTarget, oppDisarmTarget);
            
            // Incrementa turno no Firebase (apenas Player 1 faz para evitar conflito)
            if (window.myPlayerKey === 'player1') {
                updateDoc(doc(db, "matches", window.currentMatchId), { turn: turnCount + 1 });
            }
        }, 600);
    }, false, true, false);
}

// --- RESOLUÇÃO MATEMÁTICA E EFEITOS (COMUM PARA PVE E PVP) ---
function resolveTurn(pKey, mKey, pDisarmChoice, mDisarmTarget) {
    const pData = CARDS_DB[pKey];
    const mData = CARDS_DB[mKey];

    // Checa Desarme (Quem foi bloqueado?)
    let pBlocked = (player.disabled === pKey);
    let mBlocked = (monster.disabled === mKey);

    // Efeitos de Desarme da Rodada Anterior são limpos AGORA
    player.disabled = null;
    monster.disabled = null;

    // Se a carta atual foi bloqueada na rodada passada, ela falha.
    if(pBlocked) { showCenterText("VOCÊ ESTAVA BLOQUEADO!", "#e74c3c"); playSound('sfx-block'); }
    if(mBlocked) { /* Monstro bloqueado */ }

    // Aplica novos Desarmes (para o PRÓXIMO turno)
    if(!pBlocked && pKey === 'DESARMAR' && pDisarmChoice) {
        monster.disabled = pDisarmChoice; // Monstro ficará bloqueado prox turno
        createEffectText('BLOQUEADO', 'm-slot', '#f1c40f');
    }
    if(!mBlocked && mKey === 'DESARMAR' && mDisarmTarget) {
        player.disabled = mDisarmTarget;
        // Efeito visual no player
        // createEffectText('BLOQUEADO', 'p-slot', '#f1c40f'); // Opcional
        showFullBlockEffect(mDisarmTarget); // Efeito visualzão na tela
    }

    // --- CÁLCULO DE COMBATE ---
    
    // 1. ATAQUE vs ???
    if (!pBlocked && pKey === 'ATAQUE') {
        let dmg = player.level;
        // Maestria: Dano = Maestrias
        const masteries = countMastery('ATAQUE');
        if(masteries > 0) dmg = masteries;

        if (!mBlocked && mKey === 'BLOQUEIO') {
            playSound('sfx-block');
            createEffectText("BLOQUEADO", 'm-slot', '#3498db');
            // Bônus Bloqueio do Inimigo? (Simplesmente anula dano aqui)
        } else if(!mBlocked && mKey === 'DESCANSAR') {
            // Golpe Surpresa: +1 XP se inimigo descansa
            playSound('sfx-hit');
            monster.hp -= dmg;
            createDamageNumber(dmg, 'm-slot');
            player.xp++;
            createEffectText("+XP", 'p-xp', '#a29bfe');
        } else {
            // Dano normal
            playSound('sfx-hit');
            monster.hp -= dmg;
            createDamageNumber(dmg, 'm-slot');
        }
    }

    // 2. MONSTRO ATACA
    if (!mBlocked && mKey === 'ATAQUE') {
        let dmg = 1 + Math.floor(turnCount/5); // Dano escala com tempo no PvE, no PvP seria level do oponente
        if(window.gameMode === 'pvp') dmg = 1; // Simplificação PvP (ou pegar level do oponente via DB)

        if (!pBlocked && pKey === 'BLOQUEIO') {
            playSound('sfx-block');
            createEffectText("BLOQUEADO", 'p-slot', '#3498db');
            
            // Bônus Bloqueio Player: Se bloqueou ataque, cura 1
            player.hp = Math.min(player.hp + 1, player.maxHp);
            createEffectText("+1 HP", 'p-slot', '#2ecc71');
        } else {
            playSound('sfx-hit');
            player.hp -= dmg;
            createDamageNumber(dmg, 'p-slot');
        }
    }

    // 3. CURA / TREINO
    if (!pBlocked && pKey === 'DESCANSAR') {
        let heal = 1 + countMastery('DESCANSAR');
        player.hp = Math.min(player.hp + heal, player.maxHp);
        window.triggerHealEffect(); // Efeito visual do effects.js
    }
    if (!pBlocked && pKey === 'TREINAR') {
        player.xp++;
        createEffectText("+XP", 'p-xp', '#a29bfe');
    }

    // Monstro Recupera (Simplificado)
    if (!mBlocked && mKey === 'DESCANSAR') {
        monster.hp = Math.min(monster.hp + 1, monster.maxHp);
        createEffectText("+1 HP", 'm-slot', '#2ecc71');
    }

    // CHECK LEVEL UP
    if (player.xp >= 3) {
        player.level++;
        player.xp = 0;
        player.maxHp++;
        player.hp = player.maxHp;
        playSound('sfx-deck-select'); // Level up sound
        showCenterText("LEVEL UP!", "#f1c40f");
        addMasteryIcon();
    }

    updateUI();

    // CHECK FIM DE JOGO
    if (player.hp <= 0) endGame(false);
    else if (monster.hp <= 0) endGame(true);
    else {
        // Próximo Turno
        setTimeout(() => {
            cleanTable();
            drawHand(1);
            turnCount++;
            document.getElementById('turn-txt').innerText = "TURNO " + turnCount;
            isProcessing = false;
        }, 1500);
    }
}

// --- FIM DE JOGO ---
async function endGame(victory) {
    gameActive = false;
    isProcessing = true;
    
    if(victory) playSound('sfx-win');
    else playSound('sfx-lose');

    const overlay = document.getElementById('game-over-overlay');
    const title = document.getElementById('go-title');
    const desc = document.getElementById('go-desc');

    overlay.style.display = 'flex';
    title.innerText = victory ? "VITÓRIA!" : "DERROTA";
    title.style.color = victory ? "#2ecc71" : "#e74c3c";
    desc.innerText = victory ? "Você venceu o combate!" : "Ainda há muito o que aprender...";

    // Atualiza Stats no Firebase
    if(window.gameMode === 'pvp' && window.currentMatchId) {
        const matchRef = doc(db, "matches", window.currentMatchId);
        
        // Define vencedor no BD
        // Apenas um cliente precisa setar o winner pra evitar writes duplicados, mas setar sobrescrevendo é ok.
        if (victory) {
            updateDoc(matchRef, { winner: window.myPlayerKey });
            
            // Atualiza Score Pessoal
            const userRef = doc(db, "players", currentUser.uid);
            const userSnap = await getDoc(userRef);
            let currentScore = userSnap.data().score || 1000;
            let wins = userSnap.data().wins || 0;
            
            await updateDoc(userRef, {
                score: currentScore + 25,
                wins: wins + 1,
                matches: (userSnap.data().matches || 0) + 1
            });
        } else {
             // Derrota
             const userRef = doc(db, "players", currentUser.uid);
             const userSnap = await getDoc(userRef);
             let currentScore = userSnap.data().score || 1000;
             await updateDoc(userRef, {
                score: Math.max(0, currentScore - 20), // Perde pontos
                matches: (userSnap.data().matches || 0) + 1
            });
        }
    }
}

window.transitionToLobby = function() {
    document.getElementById('game-over-overlay').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'flex';
    
    stopAllMusic();
    playLobbyMusic();

    // Limpa listeners PvP
    if (matchSnapshotListener) {
        matchSnapshotListener();
        matchSnapshotListener = null;
    }
    
    window.gameMode = 'pve';
    window.currentMatchId = null;
    window.myPlayerKey = null;
};

// =========================================================
//  FUNÇÕES VISUAIS E UTILITÁRIOS
// =========================================================

function updateUI() {
    // Player
    document.getElementById('p-hp-txt').innerText = `${player.hp}/${player.maxHp}`;
    const pHpPct = (player.hp / player.maxHp) * 100;
    document.getElementById('p-hp-fill').style.width = `${pHpPct}%`;
    document.getElementById('p-lvl').innerText = player.level;
    
    // XP
    document.getElementById('p-xp').innerHTML = '';
    for(let i=0; i<3; i++) {
        let dot = document.createElement('div');
        dot.className = i < player.xp ? 'xp-dot active' : 'xp-dot';
        document.getElementById('p-xp').appendChild(dot);
    }

    // Deck Count
    document.getElementById('p-deck-count').innerText = player.deck.length;

    // Monstro
    document.querySelector('#opponent-area .unit-name').innerText = monster.name;
    document.getElementById('m-hp-txt').innerText = `${monster.hp}/${monster.maxHp}`;
    const mHpPct = (monster.hp / monster.maxHp) * 100;
    document.getElementById('m-hp-fill').style.width = `${mHpPct}%`;
}

function renderTable(cardKey, slotId, isPlayer) {
    const slot = document.getElementById(slotId);
    const data = CARDS_DB[cardKey];
    
    slot.innerHTML = `
        <div class="card ${data.color} in-play">
             <div class="card-icon" style="color:${data.fCol}">${data.icon}</div>
             <div class="card-title">${cardKey}</div>
        </div>
    `;
    
    // Efeito de entrada
    const cardEl = slot.firstElementChild;
    cardEl.animate([
        { transform: 'scale(0.5)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
    ], { duration: 300, easing: 'ease-out' });
}

function cleanTable() {
    const pSlot = document.getElementById('p-slot');
    const mSlot = document.getElementById('m-slot');

    if(pSlot.firstChild) {
        pSlot.firstChild.style.opacity = '0';
        pSlot.firstChild.style.transform = 'translateY(-20px)';
    }
    if(mSlot.firstChild) {
        mSlot.firstChild.style.opacity = '0';
        mSlot.firstChild.style.transform = 'translateY(20px)';
    }
    
    setTimeout(() => {
        pSlot.innerHTML = '';
        mSlot.innerHTML = '';
    }, 300);
}

// Animação de Carta Voando (Visual Only)
function animateFly(from, toId, cardKey, onComplete, isPlayerToTable, isEnemyToTable, isFlip) {
    const toEl = document.getElementById(toId);
    const rectTo = toEl.getBoundingClientRect();
    
    // Cria clone voador
    const fly = document.createElement('div');
    fly.className = `card ${CARDS_DB[cardKey].color}`;
    // Se for inimigo, pode mostrar verso ou frente? Vamos mostrar frente no reveal
    if(isEnemyToTable) {
        // Carta voando do inimigo (pode ser verso, mas aqui já mostra o que é)
         fly.innerHTML = `<div class="card-icon">${CARDS_DB[cardKey].icon}</div>`;
    }
    
    fly.style.position = 'fixed';
    fly.style.width = '100px'; 
    fly.style.height = '140px';
    fly.style.left = (from.left || 0) + 'px';
    fly.style.top = (from.top || 0) + 'px';
    fly.style.transition = 'all 0.5s ease-in-out';
    fly.style.zIndex = '9999';
    
    document.body.appendChild(fly);

    // Trigger
    requestAnimationFrame(() => {
        fly.style.left = (rectTo.left + rectTo.width/2 - 50) + 'px';
        fly.style.top = (rectTo.top + rectTo.height/2 - 70) + 'px';
        fly.style.transform = 'scale(1.1)'; // Leve zoom no impacto
    });

    setTimeout(() => {
        fly.remove();
        if(onComplete) onComplete();
    }, 500);
}

// Textos Flutuantes
function createDamageNumber(amount, slotId) {
    const slot = document.getElementById(slotId);
    const rect = slot.getBoundingClientRect();
    
    const el = document.createElement('div');
    el.innerText = "-" + amount;
    el.className = 'damage-text';
    el.style.left = (rect.left + 40) + 'px';
    el.style.top = (rect.top) + 'px';
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function createEffectText(text, slotId, color) {
    const slot = document.getElementById(slotId);
    const rect = slot.getBoundingClientRect();
    
    const el = document.createElement('div');
    el.innerText = text;
    el.style.position = 'fixed';
    el.style.color = color;
    el.style.fontWeight = 'bold';
    el.style.fontSize = '1.5rem';
    el.style.textShadow = '0 0 5px #000';
    el.style.zIndex = '2000';
    el.style.left = (rect.left + 20) + 'px';
    el.style.top = (rect.top - 20) + 'px';
    el.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-30px)', opacity: 0 }
    ], { duration: 800 });
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function showCenterText(text, color) {
    const msg = document.getElementById('center-msg');
    msg.innerText = text;
    msg.style.color = color || '#fff';
    msg.style.opacity = '1';
    msg.style.transform = 'translate(-50%, -50%) scale(1.2)';
    
    setTimeout(() => {
        msg.style.transform = 'translate(-50%, -50%) scale(1)';
        setTimeout(() => {
           if(!isProcessing) msg.style.opacity = '0'; // Só apaga se não estiver travado
        }, 1500);
    }, 100);
}

// Efeito de Bloqueio Tela Inteira (vinda do effects.js original logic)
function showFullBlockEffect(actionName) {
    const blockText = document.createElement('div');
    blockText.innerText = "BLOQUEOU " + actionName + "!";
    blockText.style.position = 'fixed';
    blockText.style.top = '45%';
    blockText.style.left = '50%';
    blockText.style.transform = 'translate(-50%, -50%)';
    blockText.style.fontFamily = "'Bangers', cursive";
    blockText.style.fontSize = '4rem';
    blockText.style.color = '#e74c3c';
    blockText.style.textShadow = '0 0 20px black';
    blockText.style.zIndex = '9000';
    blockText.style.pointerEvents = 'none';
    
    document.body.appendChild(blockText);
    
    blockText.animate([
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1.2)' },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1.5)' }
    ], { duration: 1500 });
    
    setTimeout(() => blockText.remove(), 1500);
}

// Maestria (Visual)
function addMasteryIcon() {
    const row = document.getElementById('p-masteries');
    const icon = document.createElement('div');
    icon.className = 'mastery-icon';
    icon.innerText = '★'; // Estrela simples
    row.appendChild(icon);
}

function countMastery(type) {
    // Simplificado: Level - 1 = Maestrias totais.
    // Se quiser separar por tipo (Ataque, Defesa), teria que ter salvo escolha.
    // Por enquanto, cada level up dá +1 em tudo ou genérico.
    return player.level - 1; 
}

// Tooltips
window.showTooltip = function(cardKey, x, y) {
    const box = document.getElementById('tooltip-box');
    const data = CARDS_DB[cardKey];
    
    document.getElementById('tt-title').innerText = cardKey;
    document.getElementById('tt-title').style.color = data.fCol;
    
    // Substitui placeholders
    let content = data.customTooltip.replace('{PLAYER_LVL}', player.level);
    document.getElementById('tt-content').innerHTML = content;
    
    box.style.display = 'block';
    
    // Ajuste Posição (evitar sair da tela)
    let left = x + 20;
    let top = y - 50;
    if (left + 250 > window.innerWidth) left = x - 270;
    if (top + 300 > window.innerHeight) top = window.innerHeight - 320;
    
    box.style.left = left + 'px';
    box.style.top = top + 'px';
};

document.body.onclick = (e) => {
    if(!e.target.closest('.card')) {
        document.getElementById('tooltip-box').style.display = 'none';
    }
};

// Modal
window.openModal = function(title, desc, options, callback) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-desc').innerText = desc;
    
    const container = document.getElementById('modal-options');
    container.innerHTML = '';
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'modal-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            overlay.style.display = 'none';
            callback(opt);
        };
        container.appendChild(btn);
    });
    
    overlay.style.display = 'flex';
};

// Sons
function playSound(key) {
    if(audios[key]) {
        audios[key].currentTime = 0;
        audios[key].play().catch(()=>{});
    }
}

function playLobbyMusic() {
    audios['bgm-battle'].pause();
    audios['bgm-lobby'].play().catch(()=>{});
}

function stopAllMusic() {
    audios['bgm-lobby'].pause();
    audios['bgm-battle'].pause();
}
