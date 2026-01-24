// ARQUIVO: js/main.js - VERSÃO DEFINITIVA (CORREÇÃO DE BLOQUEIO DE CLIQUES)
import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, increment, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
} catch (e) { console.error(e); }

let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let isProcessing = false;
window.masterVol = 1.0;
const tt = document.getElementById('tooltip-box');

// --- SISTEMA DE TELAS E CLIQUES ---
window.showScreen = function(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // Garante que telas inativas não bloqueiem cliques
    });
    const activeScreen = document.getElementById(id);
    if(activeScreen) {
        activeScreen.classList.add('active');
        activeScreen.style.display = 'flex';
    }
};

// Esconde o loading de forma agressiva
function hideLoading() {
    const loader = document.getElementById('loading-screen');
    if(loader) {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        setTimeout(() => loader.style.display = 'none', 500);
    }
}

// --- LOGIN ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        window.goToLobby();
        hideLoading();
    } else {
        currentUser = null;
        window.showScreen('start-screen');
        hideLoading();
    }
});

window.googleLogin = async function() {
    try {
        await signInWithPopup(auth, provider);
    } catch (e) { console.error(e); }
};

window.goToLobby = async function() {
    if(!currentUser) return;
    isProcessing = false;
    window.showScreen('lobby-screen');
    document.getElementById('game-background').classList.add('lobby-mode');
    
    const userRef = doc(db, "players", currentUser.uid);
    const snap = await getDoc(userRef);
    if(!snap.exists()) await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0 });
    
    const d = (await getDoc(userRef)).data();
    document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
    document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;
};

// --- CORE GAMEPLAY CORRIGIDO (MAESTRIA E HISTÓRICO) ---
function onCardClick(idx) {
    if(isProcessing) return;
    if(tt) tt.style.display = 'none';
    
    playSound('sfx-play');
    if(window.gameMode === 'pvp') {
        lockInPvPMove(idx, null);
    } else {
        playCardFlow(idx, null);
    }
}

async function commitTurnToDB() {
    if (!window.currentMatchId || window.gameMode !== 'pvp') return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    const myKey = window.myRole;
    const oppKey = (window.myRole === 'player1') ? 'player2' : 'player1';

    await updateDoc(matchRef, {
        [`${myKey}.hp`]: player.hp,
        [`${myKey}.xp`]: player.xp,
        [`${myKey}.lvl`]: player.lvl,
        [`${myKey}.bonusAtk`]: player.bonusAtk,
        [`${myKey}.bonusBlock`]: player.bonusBlock,
        [`${oppKey}.hp`]: monster.hp // Envia o dano da maestria calculado localmente
    });
}

function applyMastery(u, k) {
    if(k === 'ATAQUE') {
        u.bonusAtk++;
        let target = (u === player) ? monster : player;
        target.hp -= u.bonusAtk;
        showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675");
    }
    if(k === 'BLOQUEIO') u.bonusBlock++;
    if(k === 'DESCANSAR') u.maxHp++;
    updateUI();
}

async function saveMatchHistory(result, points) {
    if (!currentUser) return;
    let enemy = "TREINAMENTO";
    if (window.gameMode === 'pvp') {
        const nameEl = document.querySelector('#m-stats-cluster .unit-name');
        enemy = (nameEl && nameEl.innerText !== "MONSTRO") ? nameEl.innerText.toUpperCase() : "OPONENTE";
    }
    await addDoc(collection(db, "players", currentUser.uid, "history"), {
        result, opponent: enemy, mode: window.gameMode, points, timestamp: Date.now()
    });
}

// --- SINCRONIZAÇÃO PVP ---
function startPvPListener() {
    const matchRef = doc(db, "matches", window.currentMatchId);
    window.pvpUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        const oppKey = (window.myRole === 'player1') ? 'player2' : 'player1';
        const oppData = data[oppKey];
        const myData = data[window.myRole];

        // Atualiza meu HP (se o oponente me deu dano de maestria)
        if(myData && myData.hp !== player.hp) {
            player.hp = myData.hp;
            updateUI();
        }

        // Atualiza dados do oponente
        if(oppData) {
            monster.hp = oppData.hp;
            monster.lvl = oppData.lvl;
            monster.xp = oppData.xp || [];
            updateUI();
        }

        if (data.p1Move && data.p2Move && !window.isResolvingTurn) {
            resolvePvPTurn(data.p1Move, data.p2Move, data.p1Disarm, data.p2Disarm);
        }
    });
}

// --- BOOT E AUXILIARES ---
function updateUI() {
    const up = (u) => {
        const hpTxt = document.getElementById(u.id+'-hp-txt');
        if(hpTxt) hpTxt.innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
        
        if(u === player) {
            const h = document.getElementById('player-hand');
            h.innerHTML = '';
            u.hand.forEach((k, i) => {
                const c = document.createElement('div');
                c.className = `card hand-card ${CARDS_DB[k].color}`;
                c.innerHTML = `<div class="card-art" style="background-image: url('${CARDS_DB[k].img}')"></div>`;
                c.onclick = () => onCardClick(i);
                h.appendChild(c);
            });
        }
    };
    up(player); up(monster);
}

function preloadGame() {
    const total = ASSETS_TO_LOAD.images.length + ASSETS_TO_LOAD.audio.length;
    ASSETS_TO_LOAD.images.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => { assetsLoaded++; if(assetsLoaded >= total) hideLoading(); };
    });
    ASSETS_TO_LOAD.audio.forEach(a => {
        audios[a.id] = new Audio(a.src);
        audios[a.id].oncanplaythrough = () => { assetsLoaded++; if(assetsLoaded >= total) hideLoading(); };
    });
}

// Inicializadores Globais
window.startPvE = () => { window.gameMode = 'pve'; window.openDeckSelector(); };
window.startPvPSearch = () => { window.gameMode = 'pvp'; window.openDeckSelector(); };
window.playNavSound = () => { if(audios['sfx-nav']) audios['sfx-nav'].play(); };
const MusicController = { play: (id) => { if(audios[id]) audios[id].play(); } };
function playSound(id) { if(audios[id]) { audios[id].currentTime = 0; audios[id].play(); } }

preloadGame();
