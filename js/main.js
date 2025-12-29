// ARQUIVO: js/main.js

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    console.log("Firebase conectado.");
} catch (e) {
    console.error("Erro Firebase:", e);
}

// === VARIÁVEIS DE JOGO ===
let player = {
    lvl: 1, hp: 6, maxHp: 6, xp: 0, 
    deck: [], hand: [], 
    masteries: [], // Array de strings: keys das cartas maestria
    wins: 0
};

let enemy = {
    lvl: 1, hp: 6, maxHp: 6,
    masteries: [], // Inimigo também pode ter maestria no futuro
    nextMove: null // IA decide
};

let turnCount = 1;
let isPlayerTurn = true; // Na prática, jogadas simultâneas, mas usamos pra controle de fluxo
let gameActive = false;
let userProfile = null; // Dados do Firebase

// ELEMENTOS DOM
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-board')
};

// --- PRELOAD DE IMAGENS ---
const ASSETS_TO_LOAD = [
    'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png',
    'https://i.ibb.co/Dfpkhhtr/ARTE-SAGU-O.png',
    // Cartas
    'https://i.ibb.co/jkvc8kRf/01-ATAQUE.png',
    'https://i.ibb.co/Lhbk5j0j/02-BLOQUEIO.png',
    'https://i.ibb.co/gZ7k290d/03-DESCANSAR.png',
    'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png',
    'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png'
];

function preloadGame() {
    ASSETS_TO_LOAD.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}
preloadGame();

// === SISTEMA DE LOGIN ===
const btnLogin = document.getElementById('btn-login'); // Se existir no futuro
const btnLogout = document.getElementById('btn-logout');

if(btnLogout) {
    btnLogout.addEventListener('click', () => {
        signOut(auth).then(() => {
            alert("Desconectado!");
            location.reload();
        });
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Logado:", user.displayName);
        // Carregar Perfil
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            userProfile = docSnap.data();
        } else {
            // Criar novo
            userProfile = {
                name: user.displayName,
                email: user.email,
                totalWins: 0,
                createdAt: new Date()
            };
            await setDoc(docRef, userProfile);
        }
        updateUIProfile();
    } else {
        // Se quiser forçar login, descomente:
        // signInWithPopup(auth, provider);
        console.log("Sem usuário logado (Modo Visitante)");
    }
});

function updateUIProfile() {
    if(userProfile && document.getElementById('win-count')) {
        document.getElementById('win-count').textContent = userProfile.totalWins || 0;
    }
}

async function registrarVitoriaOnline() {
    if(!auth.currentUser) return;
    const docRef = doc(db, "users", auth.currentUser.uid);
    try {
        await updateDoc(docRef, {
            totalWins: (userProfile.totalWins || 0) + 1
        });
        userProfile.totalWins++;
        updateUIProfile();
    } catch(e) {
        console.error("Erro ao salvar vitória", e);
    }
}

// === LÓGICA DO JOGO (PVE) ===

const btnPlayMatch = document.getElementById('btn-play-match');
const btnBackMenu = document.getElementById('btn-back-menu');

if(btnPlayMatch) {
    btnPlayMatch.addEventListener('click', startGame);
}

if(btnBackMenu) {
    btnBackMenu.addEventListener('click', () => {
        gameActive = false;
        screens.game.classList.add('hidden');
        screens.start.style.display = 'flex'; // ou 'flex' dependendo do CSS
    });
}

function startGame() {
    gameActive = true;
    screens.start.style.display = 'none';
    screens.game.classList.remove('hidden');
    
    // Reset Stats
    player.lvl = 1; player.hp = 6; player.maxHp = 6; player.xp = 0;
    player.masteries = [];
    enemy.lvl = 1; enemy.hp = 6; enemy.maxHp = 6; enemy.masteries = [];
    turnCount = 1;

    // Gerar Deck
    buildDeck();
    shuffleDeck();
    drawHand(5);

    updateBoardUI();
}

function buildDeck() {
    player.deck = [];
    // Baseado no Template
    for (let key in DECK_TEMPLATE) {
        let qtd = DECK_TEMPLATE[key];
        for(let i=0; i<qtd; i++) player.deck.push(key);
    }
}

function shuffleDeck() {
    for (let i = player.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
    }
    updateDeckUI();
}

function drawHand(qtd) {
    for(let i=0; i<qtd; i++) {
        if(player.deck.length === 0) {
            // Deck acabou: Fadiga ou embaralhar descarte? 
            // Regra simples: sem cartas, recebe dano (Fadiga) ou nada acontece
            break;
        }
        const cardKey = player.deck.pop();
        player.hand.push(cardKey);
    }
    updateDeckUI();
    renderHand();
}

function renderHand() {
    const handDiv = document.getElementById('player-hand');
    handDiv.innerHTML = '';
    
    player.hand.forEach((key, index) => {
        const cardData = CARDS_DB[key];
        const el = document.createElement('div');
        el.className = `card ${cardData.color}`;
        el.style.backgroundImage = `url('${cardData.img}')`;
        // Fallback content
        el.innerHTML = `
            <div class="card-content">
                <div class="card-icon" style="color:${cardData.fCol}">${cardData.icon}</div>
                <div class="card-name">${key}</div>
            </div>
        `;
        
        // Tooltip Events
        el.onmouseenter = (e) => showTooltip(e, key);
        el.onmouseleave = hideTooltip;
        el.onmousemove = (e) => moveTooltip(e);

        // Click Event (Jogar Carta)
        el.onclick = () => playCard(index);

        handDiv.appendChild(el);
    });
}

function showTooltip(e, key) {
    const tt = document.getElementById('tooltip-box');
    const title = document.getElementById('tt-title');
    const content = document.getElementById('tt-content');
    const db = CARDS_DB[key];

    title.textContent = key;
    title.style.color = db.fCol;
    
    // Replace placeholders
    let desc = db.customTooltip;
    desc = desc.replace('{PLAYER_LVL}', player.lvl);
    
    content.innerHTML = desc;
    tt.style.display = 'block';
}

function moveTooltip(e) {
    const tt = document.getElementById('tooltip-box');
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    let left = e.clientX + 15;
    let top = e.clientY - 100;

    if(left + 280 > w) left = e.clientX - 290;
    if(top < 0) top = 10;
    
    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
}

function hideTooltip() {
    document.getElementById('tooltip-box').style.display = 'none';
}

// === TURNO E BATALHA ===
let blockNextAction = null; // Para 'DESARMAR'

function playCard(handIndex) {
    if(!gameActive) return;

    const playerMove = player.hand[handIndex];
    player.hand.splice(handIndex, 1); // Remove da mão
    renderHand();

    // IA Decide
    const enemyMove = getBestAIMove(playerMove);

    // Animação Slot
    showSlots(playerMove, enemyMove);

    // Resolver Resultado (Pequeno delay pra ver as cartas)
    setTimeout(() => {
        resolveTurn(playerMove, enemyMove);
        endTurnCleanup();
    }, 1500);
}

function getBestAIMove(pMove) {
    // IA Simples: Aleatória ponderada
    // Se o player estiver morrendo, IA ataca. 
    // Se IA estiver morrendo, IA bloqueia ou cura (Descansar).
    
    const keys = ACTION_KEYS; // ['ATAQUE', 'BLOQUEIO', 'DESCANSAR', 'TREINAR', 'DESARMAR']
    
    // Lógica básica
    let r = Math.random();
    
    // Se Player usou DESARMAR turno passado e bloqueou algo:
    // (Simplificação: IA ignora bloqueio específico por enquanto, joga random)

    if (enemy.hp <= 2) {
        // Prioriza defesa
        if(r > 0.4) return 'BLOQUEIO';
        if(r > 0.1) return 'DESCANSAR';
    }
    
    // Aleatório puro
    return keys[Math.floor(Math.random() * keys.length)];
}

function showSlots(pKey, eKey) {
    const pSlot = document.getElementById('p-slot');
    const mSlot = document.getElementById('m-slot');
    
    // Limpar classes antigas
    pSlot.className = 'slot'; mSlot.className = 'slot';

    // Player
    const pData = CARDS_DB[pKey];
    pSlot.style.backgroundImage = `url('${pData.img}')`;
    pSlot.classList.add(pData.color);

    // Enemy
    const eData = CARDS_DB[eKey];
    mSlot.style.backgroundImage = `url('${eData.img}')`;
    mSlot.classList.add(eData.color);
}

// === LÓGICA DE RESOLUÇÃO (CORE) ===
function resolveTurn(pMove, eMove) {
    const log = [];
    
    // 1. Verificar Desarmar anterior
    // Se implementado complexo, checaríamos blockNextAction aqui.
    
    // 2. Ações simultâneas
    // Vamos processar efeitos do Player e Enemy
    
    let pDmg = 0; 
    let eDmg = 0;
    let pHeal = 0;
    let eHeal = 0;
    let pXP = 0;

    // --- PLAYER ACTIONS ---
    if (pMove === 'ATAQUE') {
        let dmg = player.lvl;
        // Mastery Bonus
        if(hasMastery(player, 'ATAQUE')) {
            // Dano = Nvl + Qtd Maestria Ataque
            const count = player.masteries.filter(m => m === 'ATAQUE').length;
            dmg += count;
        }
        // Bonus vs Descansar
        if(eMove === 'DESCANSAR') pXP += 1;
        
        pDmg += dmg;
    }
    
    if (pMove === 'BLOQUEIO') {
        // Anula dano (processado no final)
        // Bonus vs Ataque
        if(eMove === 'ATAQUE') pXP += 1; 
        // Mastery: Refletir 1 dano? (Exemplo)
    }

    if (pMove === 'DESCANSAR') {
        pHeal += player.lvl;
        if(eMove === 'BLOQUEIO' || eMove === 'TREINAR') {
            // Bonus: +1 Cura extra? Ou XP? 
            // Data.js diz: "Se oponente não atacar, cura em dobro" (Exemplo hipotético, seguindo tooltip)
            // Vamos checar data.js tooltip logic se necessário. Assumindo padrão simples:
        }
    }

    if (pMove === 'TREINAR') {
        pXP += 1;
        // Bonus vs Bloqueio
        if(eMove === 'BLOQUEIO') pXP += 1;
    }

    if (pMove === 'DESARMAR') {
        // Lógica complexa de anular proximo turno.
        // Simplificado: Se colisão (Ambos Desarmar), nada acontece
    }

    // --- ENEMY ACTIONS (Simetrico mas simples) ---
    if (eMove === 'ATAQUE') eDmg += enemy.lvl;
    if (eMove === 'DESCANSAR') eHeal += enemy.lvl;
    
    
    // --- RESOLUÇÃO DE COMBATE (CLASH) ---
    
    // BLOQUEIOS
    if (pMove === 'BLOQUEIO') {
        eDmg = 0; // Bloqueio total
        // Trigger visual shield
        playSound('block');
    }
    if (eMove === 'BLOQUEIO') {
        pDmg = 0;
    }
    
    // DESARMAR COLISÃO
    if (pMove === 'DESARMAR' && eMove === 'DESARMAR') {
        // Nula tudo
        pDmg=0; eDmg=0; pHeal=0; eHeal=0; pXP=0;
    }

    // APLICAR
    if(pDmg > 0) {
        enemy.hp -= pDmg;
        shakeScreen();
        createDamageText(pDmg, 'enemy');
    }
    if(eDmg > 0) {
        player.hp -= eDmg;
        shakeScreen();
        createDamageText(eDmg, 'player');
    }
    
    if(pHeal > 0) {
        player.hp = Math.min(player.hp + pHeal, player.maxHp);
        if(window.triggerHealEffect) window.triggerHealEffect();
    }
    if(eHeal > 0) {
        enemy.hp = Math.min(enemy.hp + eHeal, enemy.maxHp);
    }
    
    // XP Process
    if(pXP > 0) {
        gainXP(pXP);
    }

    updateBoardUI();
    checkWinCondition();
}

function gainXP(amount) {
    player.xp += amount;
    // Check Level Up (A cada 3 XP = 1 Nvl, ex)
    // Ou usar slots de XP visual
    const xpNeeded = 2 + player.lvl; // Curva simples: 3, 4, 5...
    
    // Visual update acontece no updateBoardUI
    // Lógica real de level up:
    if(player.xp >= xpNeeded) {
        player.xp -= xpNeeded;
        player.lvl++;
        player.maxHp += 2;
        player.hp += 2; // Cura ao upar
        
        // Ganha Maestria (Carta aleatória do descarte ou deck?)
        // Simplificado: Ganha maestria da carta que usou pra ganhar XP?
        // Vamos dar uma maestria aleatória
        const m = ACTION_KEYS[Math.floor(Math.random() * ACTION_KEYS.length)];
        player.masteries.push(m);
        
        showLevelUpEffect();
    }
}

function hasMastery(unit, type) {
    return unit.masteries.includes(type);
}

function endTurnCleanup() {
    turnCount++;
    document.getElementById('turn-txt').textContent = `TURNO ${turnCount}`;
    
    // Repor mão
    if(player.hand.length < 5) {
        drawHand(1);
    }
}

function updateBoardUI() {
    // HP
    const pHpPct = (player.hp / player.maxHp) * 100;
    const eHpPct = (enemy.hp / enemy.maxHp) * 100;
    
    document.getElementById('p-hp-fill').style.width = `${Math.max(0, pHpPct)}%`;
    document.getElementById('p-hp-txt').textContent = `${player.hp}/${player.maxHp}`;
    
    document.getElementById('e-hp-fill').style.width = `${Math.max(0, eHpPct)}%`;
    document.getElementById('e-hp-txt').textContent = `${enemy.hp}/${enemy.maxHp}`;

    // LVL
    document.getElementById('p-lvl').textContent = player.lvl;
    document.getElementById('e-lvl').textContent = enemy.lvl;

    // XP (Visual Cards)
    const xpDiv = document.getElementById('p-xp');
    xpDiv.innerHTML = '';
    for(let i=0; i<player.xp; i++) {
        const card = document.createElement('div');
        card.className = 'xp-card';
        xpDiv.appendChild(card);
    }

    // Masteries
    renderMasteries('p-masteries', player.masteries);
    renderMasteries('e-masteries', enemy.masteries);
}

function renderMasteries(containerId, masteries) {
    const div = document.getElementById(containerId);
    div.innerHTML = '';
    masteries.forEach(m => {
        const pip = document.createElement('div');
        pip.className = 'mastery-pip';
        const color = CARDS_DB[m].fCol;
        pip.style.backgroundColor = color;
        div.appendChild(pip);
    });
}

function updateDeckUI() {
    document.getElementById('p-deck-count').textContent = player.deck.length;
}

function checkWinCondition() {
    if(player.hp <= 0 && enemy.hp <= 0) {
        endGame(false, "EMPATE!");
    } else if (player.hp <= 0) {
        endGame(false, "DERROTA");
    } else if (enemy.hp <= 0) {
        endGame(true, "VITÓRIA!");
    }
}

function endGame(win, msg) {
    gameActive = false;
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const txt = document.getElementById('modal-msg');
    
    modal.classList.add('active');
    title.textContent = msg;
    title.style.color = win ? 'var(--gold)' : 'var(--accent-red)';
    txt.textContent = win ? "Você destruiu seu oponente!" : "Tente novamente.";

    if(win) {
        registrarVitoriaOnline();
    }
}

// Helpers Visuais
function shakeScreen() {
    document.body.classList.add('shake');
    setTimeout(()=>document.body.classList.remove('shake'), 500);
}

function createDamageText(amount, target) {
    // Simples console log visual ou criar elemento flutuante
    // Implementar floating text se quiser
}

function showLevelUpEffect() {
    // Tocar som e particulas
}

function playSound(type) {
    // Placeholder de som
}

// Expor fechar modal globalmente
window.closeModal = function() {
    document.getElementById('modal-overlay').classList.remove('active');
    // Voltar pro menu se jogo acabou
    if(!gameActive) {
        screens.game.classList.add('hidden');
        screens.start.style.display = 'flex';
    }
};

// ===============================================
// LÓGICA TEMPORÁRIA DE UI DA FILA PVP (FASE 1)
// ===============================================

const btnPlayPvP = document.getElementById('btn-play-pvp');
const queueModal = document.getElementById('queue-modal');
const btnCancelQueue = document.getElementById('btn-cancel-queue');
let queueTimerInterval;
let secondsInQueue = 0;

if(btnPlayPvP) {
    btnPlayPvP.addEventListener('click', () => {
        if(typeof playSound === 'function') playSound('ui'); 
        
        // Abre o modal
        queueModal.classList.add('active');
        
        // Inicia timer visual
        startQueueTimer();
    });
}

if(btnCancelQueue) {
    btnCancelQueue.addEventListener('click', () => {
        if(typeof playSound === 'function') playSound('ui');
        queueModal.classList.remove('active');
        stopQueueTimer();
    });
}

function startQueueTimer() {
    const timerDisplay = document.getElementById('queue-timer');
    const statusMsg = document.getElementById('queue-status-msg');
    
    secondsInQueue = 0;
    timerDisplay.textContent = "00:00";
    statusMsg.textContent = "Procurando jogadores...";
    
    clearInterval(queueTimerInterval);
    queueTimerInterval = setInterval(() => {
        secondsInQueue++;
        const m = Math.floor(secondsInQueue / 60).toString().padStart(2, '0');
        const s = (secondsInQueue % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;

        // Simulação de texto mudando pra parecer vivo
        if(secondsInQueue % 5 === 0) {
            statusMsg.textContent = "Expandindo busca...";
        }
    }, 1000);
}

function stopQueueTimer() {
    clearInterval(queueTimerInterval);
}
