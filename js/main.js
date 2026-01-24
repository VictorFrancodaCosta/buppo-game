// ARQUIVO: js/main.js - VERSÃO FINAL CORRIGIDA (LOGIN, MAESTRIA E HISTÓRICO)
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
} catch (e) { console.error("Firebase Init Error:", e); }

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 
window.pvpUnsubscribe = null; 
let searchInterval = null;
let matchTimerInterval = null;
let myQueueRef = null;
let queueListener = null;

const MAGE_ASSETS = {
    'ATAQUE': 'assets/img/carta_ataque_mago.png',
    'BLOQUEIO': 'assets/img/carta_bloqueio_mago.png',
    'DESCANSAR': 'assets/img/carta_descansar_mago.png',
    'DESARMAR': 'assets/img/carta_desarmar_mago.png',
    'TREINAR': 'assets/img/carta_treinar_mago.png',
    'DECK_IMG': 'assets/img/deck_verso_mago.png'
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

// --- ELEMENTOS DE UI ---
const tt = document.getElementById('tooltip-box');

// --- FLOW DE LOGIN CORRIGIDO ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("Usuário autenticado:", user.displayName);
        window.goToLobby(true);
    } else {
        currentUser = null;
        window.showScreen('start-screen');
        MusicController.play('bgm-menu');
    }
});

window.googleLogin = async function() {
    window.playNavSound();
    try {
        await signInWithPopup(auth, provider);
    } catch (e) {
        console.error("Login Error:", e);
        alert("Erro ao conectar com Google.");
    }
};

window.goToLobby = async function(isAuto = false) {
    if(!currentUser) return;
    isProcessing = false;
    
    // UI Setup
    document.getElementById('game-background').classList.add('lobby-mode');
    MusicController.play('bgm-menu');
    
    const userRef = doc(db, "players", currentUser.uid);
    let userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
        await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0 });
        userSnap = await getDoc(userRef);
    }
    
    const d = userSnap.data();
    document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
    document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;
    
    // Leaderboard
    const q = query(collection(db, "players"), orderBy("score", "desc"), limit(10));
    onSnapshot(q, (snapshot) => {
        let html = '<table id="ranking-table"><thead><tr><th>#</th><th>JOGADOR</th><th>PTS</th></tr></thead><tbody>';
        let pos = 1;
        snapshot.forEach((doc) => {
            const p = doc.data();
            html += `<tr><td>${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`;
            pos++;
        });
        document.getElementById('ranking-content').innerHTML = html + '</tbody></table>';
    });
    
    window.showScreen('lobby-screen');
    createLobbyFlares();
};

// --- CORE GAME LOGIC (MAESTRIA E SYNC) ---
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
        data[`${oppKey}.hp`] = monster.hp; // Transmite o dano da Maestria
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
    if(k === 'DESCANSAR') { 
        u.maxHp++; 
        showFloatingText(u.id+'-hp-txt', "+1 MAX", "#55efc4"); 
    } 
    updateUI(); 
}

function resolveTurn(pAct, mAct, pDis, mDis) {
    let pDmg = 0, mDmg = 0;
    if(mAct === 'ATAQUE') pDmg += monster.lvl;
    if(pAct === 'ATAQUE') mDmg += player.lvl;
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') mDmg += (1 + player.bonusBlock); }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') pDmg += (1 + monster.bonusBlock); }

    player.hp -= pDmg; monster.hp -= mDmg;
    updateUI();

    if(player.hp > 0 && pAct === 'DESCANSAR') { 
        let h = (pDmg === 0) ? 3 : 2; player.hp = Math.min(player.maxHp, player.hp + h); 
        triggerHealEffect(true); playSound('sfx-heal'); 
    }
    if(monster.hp > 0 && mAct === 'DESCANSAR') { 
        let h = (mDmg === 0) ? 3 : 2; monster.hp = Math.min(monster.maxHp, monster.hp + h); 
        triggerHealEffect(false); playSound('sfx-heal'); 
    }

    setTimeout(() => {
        const handleXP = (u, act, isOpp) => {
            animateFly(u.id+'-slot', u.id+'-xp', act, () => {
                u.xp.push(act);
                checkLevelUp(u, () => {
                    if(isOpp) { 
                        if(window.gameMode === 'pvp') commitTurnToDB(); 
                        checkEndGame(); 
                    } else if(player.hp > 0) drawCardLogic(player, 1);
                    updateUI();
                });
            }, false, false, !isOpp);
        };
        handleXP(player, pAct, false); handleXP(monster, mAct, true);
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

// --- HISTÓRICO COM NOMES REAIS ---
async function saveMatchHistory(result, points) {
    if (!currentUser) return;
    let enemy = "TREINAMENTO";
    if (window.gameMode === 'pvp') {
        const nameEl = document.querySelector('#m-stats-cluster .unit-name');
        if (nameEl && !nameEl.innerText.includes("MONSTRO")) {
            enemy = nameEl.innerText.split(' ')[0].toUpperCase();
        }
    }
    await addDoc(collection(db, "players", currentUser.uid, "history"), { 
        result, opponent: enemy, mode: window.gameMode, points, timestamp: Date.now() 
    });
}

// --- ASSETS E UI HELPERS ---
function preloadGame() {
    ASSETS_TO_LOAD.images.forEach(src => { let img = new Image(); img.src = src; img.onload = updateLoader; img.onerror = updateLoader; });
    ASSETS_TO_LOAD.audio.forEach(a => { let s = new Audio(a.src); s.preload = 'auto'; if(a.loop) s.loop = true; audios[a.id] = s; s.onloadedmetadata = updateLoader; s.onerror = updateLoader; });
}

function updateLoader() {
    assetsLoaded++; let pct = Math.min(100, (assetsLoaded / totalAssets) * 100);
    const fill = document.getElementById('loader-fill'); if(fill) fill.style.width = pct + '%';
    if(assetsLoaded >= totalAssets) {
        setTimeout(() => { document.getElementById('loading-screen').style.display = 'none'; }, 500);
    }
}

const MusicController = {
    currentTrackId: null,
    play(id) {
        if (!audios[id] || this.currentTrackId === id) return;
        if (this.currentTrackId && audios[this.currentTrackId]) audios[this.currentTrackId].pause();
        this.currentTrackId = id; audios[id].volume = 0.4 * window.masterVol; audios[id].play().catch(()=>{});
    }
};

window.playNavSound = () => { if(audios['sfx-nav']) { audios['sfx-nav'].currentTime = 0; audios['sfx-nav'].play().catch(()=>{}); } };

// --- RESTANTE DAS FUNÇÕES (Obrigatórias para funcionamento) ---
function shuffle(a, s=null) {
    let r = s ? () => { s = (s * 9301 + 49297) % 233280; return s / 233280; } : Math.random;
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
}

function showScreen(id) { 
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
window.showScreen = showScreen;

function updateUI() {
    const up = (u) => {
        const lvlEl = document.getElementById(u.id+'-lvl');
        if(lvlEl) lvlEl.firstChild.nodeValue = u.lvl;
        document.getElementById(u.id+'-hp-txt').innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
        let pct = (Math.max(0,u.hp)/u.maxHp)*100;
        let fill = document.getElementById(u.id+'-hp-fill');
        if(fill) fill.style.width = pct + '%';
        
        if(u === player) {
            let h = document.getElementById('player-hand'); h.innerHTML = '';
            u.hand.forEach((k, i) => {
                let c = document.createElement('div'); c.className = `card hand-card ${CARDS_DB[k].color}`;
                c.innerHTML = `<div class="card-art" style="background-image: url('${getCardArt(k, true)}')"></div>`;
                c.onclick = () => onCardClick(i);
                c.onmouseenter = () => { showTT(k); tt.style.display = 'block'; playSound('sfx-hover'); };
                c.onmouseleave = () => tt.style.display = 'none';
                h.appendChild(c);
            });
        }
        let xp = document.getElementById(u.id+'-xp'); xp.innerHTML = '';
        u.xp.forEach(k => {
            let d = document.createElement('div'); d.className = 'xp-mini';
            d.style.backgroundImage = `url('${getCardArt(k, u === player)}')`;
            xp.appendChild(d);
        });
    };
    up(player); up(monster);
}

function onCardClick(idx) {
    if(isProcessing) return;
    if(tt) tt.style.display = 'none';
    const card = player.hand[idx];
    playSound('sfx-play');
    if(window.gameMode === 'pvp') lockInPvPMove(idx, null);
    else playCardFlow(idx, null);
}

// Injeção de funções globais para o HTML
window.startPvE = () => { window.gameMode = 'pve'; window.openDeckSelector(); };
window.startPvPSearch = () => { window.gameMode = 'pvp'; window.openDeckSelector(); };
window.handleLogout = () => signOut(auth).then(() => location.reload());

// --- SISTEMA DE FILA ---
async function initiateMatchmaking() {
    window.showScreen('matchmaking-screen');
    myQueueRef = doc(collection(db, "queue"));
    await setDoc(myQueueRef, { uid: currentUser.uid, name: currentUser.displayName, timestamp: Date.now(), matchId: null });
    
    queueListener = onSnapshot(myQueueRef, (snap) => {
        if (snap.exists() && snap.data().matchId) enterMatch(snap.data().matchId);
    });

    searchInterval = setInterval(async () => {
        const q = query(collection(db, "queue"), orderBy("timestamp", "desc"), limit(5));
        const s = await getDocs(q);
        s.forEach(async dSnap => {
            const d = dSnap.data();
            if (d.uid !== currentUser.uid && !d.matchId) {
                const mid = "match_" + Date.now();
                await updateDoc(dSnap.ref, { matchId: mid });
                await updateDoc(myQueueRef, { matchId: mid });
                createMatchDoc(mid, d.uid, d.name);
            }
        });
    }, 3000);
}

async function createMatchDoc(mid, oppId, oppName) {
    await setDoc(doc(db, "matches", mid), {
        player1: { uid: currentUser.uid, name: currentUser.displayName, hp: 6, deck: generateShuffledDeck(), xp: [] },
        player2: { uid: oppId, name: oppName, hp: 6, deck: generateShuffledDeck(), xp: [] },
        status: 'playing'
    });
}

async function enterMatch(mid) {
    clearInterval(searchInterval);
    window.currentMatchId = mid;
    const s = await getDoc(doc(db, "matches", mid));
    window.pvpStartData = s.data();
    window.myRole = (s.data().player1.uid === currentUser.uid) ? 'player1' : 'player2';
    window.transitionToGame();
}

// Inicializadores extras
function playSound(k) { if(audios[k]) { audios[k].currentTime = 0; audios[k].play().catch(()=>{}); } }
function showTT(k) { document.getElementById('tt-title').innerText = k; document.getElementById('tt-content').innerHTML = CARDS_DB[k].customTooltip || `Dano: ${CARDS_DB[k].base}`; }
function drawCardLogic(u, q) { for(let i=0; i<q; i++) if(u.deck.length > 0) u.hand.push(u.deck.pop()); u.hand.sort(); }
function apply3DTilt(e) { e.onmousemove = (ev) => { e.style.transform = 'scale(1.05) rotateY(10deg)'; }; e.onmouseleave = () => e.style.transform = ''; }
function createLobbyFlares() { /* ... flares logic ... */ }

preloadGame();
