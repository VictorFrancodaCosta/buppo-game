// ARQUIVO: js/main.js (VERSÃO WEB PURA)

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, where, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCVLhOcKqF6igMGRmOWO_GEY9O4gz892Fo",
    authDomain: "buppo-game.firebaseapp.com",
    projectId: "buppo-game",
    storageBucket: "buppo-game.firebasestorage.app",
    messagingSenderId: "950871979140",
    appId: "1:950871979140:web:f2dba12900500c52053ed1"
};

// --- INICIALIZAÇÃO SIMPLES ---
let app, auth, db, provider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    console.log("Firebase Web Iniciado.");
} catch (e) {
    console.error("Erro Firebase:", e);
}

// --- VARIÁVEIS GLOBAIS DO JOGO ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 

// --- ASSETS ---
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
        'https://i.ibb.co/zhx4QY51/MESA-DE-JOGO.png', // Atualizado para nova mesa Cavaleiro
        'https://i.ibb.co/Z1GNKZGp/MESA-DE-JOGO-MAGO.png', // Atualizado para nova mesa Mago
        'https://i.ibb.co/Dfpkhhtr/ARTE-SAGU-O.png',
        'https://i.ibb.co/zHZsCnyB/QUADRO-DO-SAGU-O.png',
        'https://i.ibb.co/GSWpX5C/PLACA-SELE-O.png',
        'https://i.ibb.co/fzr36qbR/SELE-O-DE-DECK-CAVALEIRO.png',
        'https://i.ibb.co/bjBcKN6c/SELE-O-DE-DECK-MAGO.png',
        'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png',
        'https://i.ibb.co/jdZmTHC/CARDBACK.png',
        'https://i.ibb.co/jkvc8kRf/01-ATAQUE.png',
        'https://i.ibb.co/zhFYHsxQ/02-BLOQUEIO.png',
        'https://i.ibb.co/PzV81m5C/03-DESCANSAR.png',
        'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png',
        'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png',
        'https://i.ibb.co/xqbKSbgx/mesa-com-deck.png',
        'https://i.ibb.co/xKcyL7Qm/01-ATAQUE-MAGO.png',
        'https://i.ibb.co/pv2CCXKR/02-BLOQUEIO-MAGO.png',
        'https://i.ibb.co/sv98P3JK/03-DESCANSAR-MAGO.png',
        'https://i.ibb.co/Q7SmhYQk/04-DESARMAR-MAGO.png',
        'https://i.ibb.co/8LGTJCn4/05-TREINAR-MAGO.png',
        'https://i.ibb.co/XZ8qc166/DECK-MAGO.png',
        'https://i.ibb.co/mCFs1Ggc/SELE-O-DE-DECK-MAGO.png',
        'https://i.ibb.co/SXPndxhb/AREA-DE-EXPERIENCIA.png'
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
window.isPvP = false; // Novo flag para diferenciar PvP de PvE
window.currentMatchId = null;
window.myQueueRef = null;
window.queueListener = null;
window.matchListener = null;
window.matchTimerInterval = null;
window.matchSeconds = 0;
window.playerKey = null; // 'player1' ou 'player2'

// Função para carregar assets (exemplo, assumindo parte original)
function loadAssets() {
    ASSETS_TO_LOAD.images.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => assetsLoaded++;
        window.gameAssets.push(img);
    });
    ASSETS_TO_LOAD.audio.forEach(audioData => {
        const audio = new Audio(audioData.src);
        audio.loop = audioData.loop || false;
        audio.preload = 'auto';
        audio.oncanplaythrough = () => assetsLoaded++;
        audios[audioData.id] = audio;
    });
    // Atualizar barra de loading, etc.
}

// Função playNavSound (exemplo original)
window.playNavSound = function() {
    if (audios['sfx-nav']) audios['sfx-nav'].play();
};

// --- AUTENTICAÇÃO (assumindo parte original)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        // Atualizar UI para logado
    } else {
        // Mostrar login
    }
});

// Função para login (exemplo)
window.login = async function() {
    try {
        await signInWithPopup(auth, provider);
    } catch (e) {
        console.error(e);
    }
};

// --- MATCHMAKING ---
window.startPvPSearch = async function() {
    window.playNavSound();
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'flex';
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE...";
    document.querySelector('.mm-title').style.color = "#ffd700";
    document.querySelector('.radar-spinner').style.borderColor = "#ffd700";
    document.querySelector('.radar-spinner').style.animation = "spin 1s linear infinite";
    document.querySelector('.cancel-btn').style.display = "block";
    
    // Timer Visual
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

    // Timeout na busca (3min)
    setTimeout(() => {
        if (mmScreen.style.display === 'flex') {
            cancelPvPSearch();
            alert("Nenhum oponente encontrado. Tente novamente.");
        }
    }, 180000);

    try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        const myScore = userSnap.exists() ? userSnap.data().score || 0 : 0;

        myQueueRef = doc(collection(db, "queue")); 
        const myData = {
            uid: currentUser.uid,
            name: currentUser.displayName,
            score: myScore,
            timestamp: Date.now(),
            matchId: null,
            active: true
        };
        await setDoc(myQueueRef, myData);

        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.matchId) {
                    enterMatch(data.matchId);
                }
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
        const q = query(queueRef, 
            where("score", ">=", myScore - 100),
            where("score", "<=", myScore + 100),
            where("active", "==", true),
            orderBy("timestamp", "asc"), 
            limit(10)
        );
        const querySnapshot = await getDocs(q);

        let opponentDoc = null;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.uid !== currentUser.uid && !data.matchId && data.active) {
                opponentDoc = doc;
            }
        });

        if (opponentDoc) {
            const opponentId = opponentDoc.data().uid;
            console.log("Oponente encontrado na fila:", opponentId);

            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

            await updateDoc(opponentDoc.ref, { matchId: matchId, active: false });

            if (myQueueRef) {
                await updateDoc(myQueueRef, { matchId: matchId, active: false });
            }

            await createMatchDocument(matchId, currentUser.uid, opponentId);
        }

    } catch (e) {
        console.error("Erro ao buscar oponente:", e);
    }
}

async function createMatchDocument(matchId, p1Id, p2Id) {
    const matchRef = doc(db, "matches", matchId);
    await setDoc(matchRef, {
        player1: { uid: p1Id, hp: 6, maxHp: 6, lvl: 1, hand: [], deck: [], xp: [], disabled: null, bonusBlock: 0, bonusAtk: 0, status: 'selecting', action: null, deckType: null },
        player2: { uid: p2Id, hp: 6, maxHp: 6, lvl: 1, hand: [], deck: [], xp: [], disabled: null, bonusBlock: 0, bonusAtk: 0, status: 'selecting', action: null, deckType: null },
        turn: 1,
        status: 'waiting_decks',
        createdAt: Date.now(),
        lastUpdated: Date.now()
    });
}

window.cancelPvPSearch = async function() {
    window.playNavSound();
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'none';
    
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    
    if (queueListener) {
        queueListener(); 
        queueListener = null;
    }

    if (myQueueRef) {
        await updateDoc(myQueueRef, { active: false }); 
        myQueueRef = null;
    }
    
    console.log("Busca cancelada.");
};

function enterMatch(matchId) {
    console.log("PARTIDA ENCONTRADA! ID:", matchId);
    
    if (queueListener) queueListener();
    if (matchTimerInterval) clearInterval(matchTimerInterval);

    document.querySelector('.mm-title').innerText = "PARTIDA ENCONTRADA!";
    document.querySelector('.mm-title').style.color = "#2ecc71";
    document.querySelector('.radar-spinner').style.borderColor = "#2ecc71";
    document.querySelector('.radar-spinner').style.animation = "none";
    document.querySelector('.cancel-btn').style.display = "none";

    setTimeout(() => {
        const mmScreen = document.getElementById('matchmaking-screen');
        mmScreen.style.display = 'none';
        
        window.currentMatchId = matchId;
        window.isPvP = true;
        
        window.openDeckSelector(); 
        
    }, 1500);
}

// Assumindo funções originais como openDeckSelector, selectDeck, etc.
window.openDeckSelector = function() {
    // Mostrar tela de seleção de deck
    document.getElementById('deck-selection-screen').style.display = 'flex';
};

window.selectDeck = async function(deckType) {
    // Lógica visual local
    if (window.isPvP) {
        const matchRef = doc(db, "matches", window.currentMatchId);
        const matchSnap = await getDoc(matchRef);
        const data = matchSnap.data();
        window.playerKey = (currentUser.uid === data.player1.uid) ? 'player1' : 'player2';
        await updateDoc(matchRef, {
            [`${window.playerKey}.deckType`]: deckType,
            [`${window.playerKey}.status`]: 'ready'
        });

        window.matchListener = onSnapshot(matchRef, (snap) => {
            const data = snap.data();
            if (data.player1.status === 'ready' && data.player2.status === 'ready') {
                startPvPMatch(data);
            } else {
                // UI de espera
                console.log("Aguardando oponente...");
            }
            handleMatchSnapshot(snap); // Nova função para atualizar UI e resolver turnos
        });
    } else {
        // PvE: Iniciar jogo local
        startPvEGame(deckType);
    }
};

// Função para gerar deck (assumindo original)
function generateDeck(template) {
    let deck = [];
    for (let key in template) {
        for (let i = 0; i < template[key]; i++) {
            deck.push(key);
        }
    }
    return shuffle(deck); // Assumir shuffle function
}

// Função shuffle (exemplo)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Função drawCards (exemplo)
function drawCards(deck, num) {
    return deck.splice(0, num);
}

// Nova função startPvPMatch
async function startPvPMatch(data) {
    const myDeckType = data[window.playerKey].deckType;
    const otherKey = window.playerKey === 'player1' ? 'player2' : 'player1';
    const otherDeckType = data[otherKey].deckType;

    player = { ...player, uid: currentUser.uid, deckType: myDeckType };
    monster = { ...monster, uid: data[otherKey].uid, deckType: otherDeckType, name: 'Oponente' };

    const initialDeck = generateDeck(DECK_TEMPLATE);
    const initialHand = drawCards(initialDeck, 5);

    const matchRef = doc(db, "matches", window.currentMatchId);
    await updateDoc(matchRef, {
        [`${window.playerKey}.deck`]: initialDeck,
        [`${window.playerKey}.hand`]: initialHand,
        status: 'in_progress'
    });

    document.body.classList.add(`theme-${myDeckType}`);

    // Iniciar jogo: render hand, play bgm, etc.
    renderHand();
    playBgm('bgm-loop');
    // Forçar landscape no mobile
    document.body.classList.add('force-landscape');
}

// Função para playCard
window.playCard = async function(card) {
    if (isProcessing) return;
    isProcessing = true;

    if (window.isPvP) {
        const matchRef = doc(db, "matches", window.currentMatchId);
        await updateDoc(matchRef, {
            [`${window.playerKey}.action`]: card.key
        });
        // Desabilitar hand
        disableHand();
        console.log("Aguardando oponente...");
    } else {
        // PvE: Lógica original contra IA
        const monsterAction = chooseMonsterAction(); // Assumir função IA
        resolveTurn(card.key, monsterAction);
    }
};

// Nova função para handleMatchSnapshot (resolução e update UI)
function handleMatchSnapshot(snap) {
    const data = snap.data();
    if (!data) return;

    // Atualizar estados locais
    const myData = data[window.playerKey];
    const otherData = data[window.playerKey === 'player1' ? 'player2' : 'player1'];

    player.hp = myData.hp;
    player.maxHp = myData.maxHp;
    player.lvl = myData.lvl;
    player.hand = myData.hand;
    player.deck = myData.deck;
    player.xp = myData.xp;
    // etc.

    monster.hp = otherData.hp;
    // etc.

    // Resolver turno se ambos actions setadas
    if (data.player1.action && data.player2.action && data.status === 'in_progress') {
        const amIHost = window.playerKey === 'player1';
        if (amIHost) {
            resolvePvPTurn(data);
        }
    }

    // Atualizar UI
    updateHpBars();
    renderHand();
    // Trigger animações baseadas em mudanças
    // Ex: if previousHp > player.hp triggerDamageEffect()

    // Fim de jogo
    if (data.status === 'ended') {
        showEndScreen(data.winner === currentUser.uid ? 'win' : 'lose');
        if (matchListener) matchListener();
    }
}

// Função para resolvePvPTurn (host only)
async function resolvePvPTurn(data) {
    const p1Action = data.player1.action;
    const p2Action = data.player2.action;
    let p1State = { ...data.player1 };
    let p2State = { ...data.player2 };

    // Lógica de resolução simétrica (similar PvE mas para ambos)
    // Exemplo simplificado: Calcular danos, curas, etc.
    if (p1Action === 'ATAQUE') {
        if (p2Action !== 'BLOQUEIO') {
            p2State.hp -= p1State.lvl + p1State.bonusAtk;
        } else {
            // Block logic
            p1State.hp -= 1 + p2State.bonusBlock; // Contra-golpe
        }
    }
    // Similar para p2Action...
    // Handle outros actions: DESCANSAR cura, etc.
    // Handle mastery, bonus, disabled

    // Check level ups, draw cards if needed

    // Check winner
    let winner = null;
    if (p1State.hp <= 0 && p2State.hp > 0) winner = data.player2.uid;
    else if (p2State.hp <= 0 && p1State.hp > 0) winner = data.player1.uid;
    else if (p1State.hp <= 0 && p2State.hp <= 0) winner = 'tie';

    const updates = {
        player1: { ...p1State, action: null },
        player2: { ...p2State, action: null },
        turn: data.turn + 1,
        lastUpdated: Date.now()
    };
    if (winner) {
        updates.status = 'ended';
        updates.winner = winner;
    }

    const matchRef = doc(db, "matches", window.currentMatchId);
    await runTransaction(db, async (transaction) => {
        const matchSnap = await transaction.get(matchRef);
        transaction.update(matchRef, updates);
    });

    // Atualizar scores se winner
    if (winner && winner !== 'tie') {
        const winnerRef = doc(db, "users", winner);
        await updateDoc(winnerRef, { score: increment(10) }); // Assumir increment
    }
}

// Função para disableHand (exemplo)
function disableHand() {
    // Adicionar class disabled às cartas
}

// Função para updateHpBars (exemplo)
function updateHpBars() {
    document.getElementById('p-hp-txt').innerText = `${player.hp}/${player.maxHp}`;
    // etc.
}

// Função para renderHand (exemplo original)
function renderHand() {
    const handWrapper = document.getElementById('player-hand');
    handWrapper.innerHTML = '';
    player.hand.forEach(cardKey => {
        const card = CARDS_DB[cardKey];
        const cardEl = document.createElement('div');
        cardEl.classList.add('card');
        cardEl.innerHTML = `<img src="${card.img}">`; // Simplificado
        cardEl.onclick = () => playCard({key: cardKey});
        handWrapper.appendChild(cardEl);
    });
}

// Função para showEndScreen (exemplo)
function showEndScreen(result) {
    const endScreen = document.getElementById('end-screen');
    endScreen.style.display = 'flex';
    document.getElementById('end-title').innerText = result === 'win' ? 'VITÓRIA' : result === 'lose' ? 'DERROTA' : 'EMPATE';
    // Play sfx-win/lose/tie
}

// Função para startPvEGame (PvE original)
function startPvEGame(deckType) {
    // Gerar decks, hands, init jogo local
    player.deck = generateDeck(DECK_TEMPLATE);
    player.hand = drawCards(player.deck, 5);
    monster.deck = generateDeck(DECK_TEMPLATE);
    monster.hand = drawCards(monster.deck, 5);
    // etc.
}

// Função IA para monster (PvE)
function chooseMonsterAction() {
    // Lógica simples: random ou smart AI
    return ACTION_KEYS[Math.floor(Math.random() * ACTION_KEYS.length)];
}

// Função resolveTurn (PvE)
function resolveTurn(playerAction, monsterAction) {
    // Lógica similar a resolvePvPTurn, mas local
    // Atualizar HP, trigger effects, check win/lose
}

// --- OUTRAS FUNÇÕES ORIGINAIS ---
// Assumindo funções como toggleConfig, toggleMute, updateVol, abandonMatch, etc.
window.toggleConfig = function() {
    // Toggle panel
};

window.toggleMute = function() {
    // Mute audio
};

window.updateVol = function(type, value) {
    // Update volume
};

window.abandonMatch = function() {
    if (isPvP) {
        // Set disconnected, give win to opponent
    } else {
        // PvE reset
    }
};

// Handle desconexão
window.addEventListener('beforeunload', () => {
    if (isPvP && currentMatchId) {
        const matchRef = doc(db, "matches", currentMatchId);
        updateDoc(matchRef, { [`${playerKey}.status`]: 'disconnected' });
    }
});

// Init app
loadAssets();
// etc.
