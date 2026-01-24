// ARQUIVO: js/main.js - VERSÃO DEFINITIVA COM TODAS AS CORREÇÕES APLICADAS
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
} catch (e) { console.error("Firebase Error:", e); }

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
const tt = document.getElementById('tooltip-box');

// --- ASSETS ---
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

// --- ESTADOS GLOBAIS ---
window.isMatchStarting = false; window.currentDeck = 'knight'; window.myRole = null; 
window.currentMatchId = null; window.pvpSelectedCardIndex = null; 
window.isResolvingTurn = false; window.pvpStartData = null; 

// --- CONTROLE DE TELAS (FIX DE BLOQUEIO DE CLIQUES) ---
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

function hideLoading() {
    const loader = document.getElementById('loading-screen');
    if(loader) {
        loader.style.opacity = '0';
        loader.style.pointerEvents = 'none';
        setTimeout(() => loader.style.display = 'none', 500);
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
    hideLoading();
});

window.googleLogin = async function() {
    window.playNavSound();
    try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
};

window.goToLobby = async function(isAuto = false) {
    if(!currentUser) return;
    isProcessing = false;
    document.getElementById('game-background').classList.add('lobby-mode');
    MusicController.play('bgm-menu');
    
    const userRef = doc(db, "players", currentUser.uid);
    let userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0 });
    }
    
    const d = (await getDoc(userRef)).data();
    document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
    document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;
    
    // Ranking
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

// --- CORE GAMEPLAY (MAESTRIA E SINCRONIZAÇÃO) ---
async function commitTurnToDB() {
    if (!window.currentMatchId || window.gameMode !== 'pvp') return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    const myKey = window.myRole;
    const oppKey = (window.myRole === 'player1') ? 'player2' : 'player1';

    try {
        await updateDoc(matchRef, {
            [`${myKey}.hp`]: player.hp,
            [`${myKey}.xp`]: player.xp,
            [`${myKey}.lvl`]: player.lvl,
            [`${myKey}.maxHp`]: player.maxHp,
            [`${myKey}.bonusAtk`]: player.bonusAtk,
            [`${myKey}.bonusBlock`]: player.bonusBlock,
            [`${myKey}.deck`]: player.deck,
            [`${oppKey}.hp`]: monster.hp // Sincroniza o dano causado pela Maestria
        });
    } catch(e) { console.error("Sync Error:", e); }
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
        } else if (window.pvpStartData) {
            const oppKey = (window.myRole === 'player1') ? 'player2' : 'player1';
            enemy = window.pvpStartData[oppKey].name.split(' ')[0].toUpperCase();
        }
    }
    await addDoc(collection(db, "players", currentUser.uid, "history"), { 
        result, opponent: enemy, mode: window.gameMode, points, timestamp: Date.now() 
    });
}

// --- TOOLTIP FAILSAFE ---
document.addEventListener('mouseover', (e) => {
    if (!e.target.closest('.hand-card') && !e.target.closest('.mastery-icon') && !e.target.closest('.xp-mini')) {
        if(tt) tt.style.display = 'none';
    }
});

function onCardClick(idx) {
    if(isProcessing) return;
    if(tt) tt.style.display = 'none'; // Fecha tooltip no clique
    document.body.classList.remove('focus-hand');
    
    if(window.gameMode === 'pvp') lockInPvPMove(idx, null);
    else playCardFlow(idx, null);
}

// --- PVP LISTENER ---
function startPvPListener() {
    if(!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    window.pvpUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        
        // Sincroniza HP vindo do banco (Maestria do Oponente)
        const myData = data[window.myRole];
        if(myData && myData.hp !== undefined && myData.hp !== player.hp) {
            player.hp = myData.hp;
            updateUI();
        }

        const oppKey = (window.myRole === 'player1') ? 'player2' : 'player1';
        const oppData = data[oppKey];
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

// --- BOOT E UTILITÁRIOS ---
function preloadGame() {
    ASSETS_TO_LOAD.images.forEach(src => { let img = new Image(); img.src = src; img.onload = updateLoader; img.onerror = updateLoader; });
    ASSETS_TO_LOAD.audio.forEach(a => { let s = new Audio(a.src); s.preload = 'auto'; if(a.loop) s.loop = true; audios[a.id] = s; s.onloadedmetadata = updateLoader; s.onerror = updateLoader; });
}

function updateLoader() {
    assetsLoaded++; let pct = Math.min(100, (assetsLoaded / totalAssets) * 100);
    const fill = document.getElementById('loader-fill'); if(fill) fill.style.width = pct + '%';
    if(assetsLoaded >= totalAssets) setTimeout(hideLoading, 800);
}

const MusicController = {
    currentTrackId: null,
    play(id) {
        if (!audios[id] || this.currentTrackId === id) return;
        if (this.currentTrackId && audios[this.currentTrackId]) audios[this.currentTrackId].pause();
        this.currentTrackId = id; audios[id].volume = 0.4 * window.masterVol; audios[id].play().catch(()=>{});
    }
};

function playSound(k) { if(audios[k]) { audios[k].currentTime = 0; audios[k].play().catch(()=>{}); } }
window.playNavSound = () => playSound('sfx-nav');

// Safety Loader (Failsafe 3 segundos)
setTimeout(() => { hideLoading(); }, 3000);

// Exportações para HTML
window.startPvE = () => { window.gameMode = 'pve'; window.openDeckSelector(); };
window.startPvPSearch = () => { window.gameMode = 'pvp'; window.openDeckSelector(); };
window.handleLogout = () => signOut(auth).then(() => location.reload());

// ... (Funções auxiliares como shuffle, drawCardLogic, animateFly, renderTable, showTT, showFloatingText, etc. devem permanecer como no seu código original estável) ...

preloadGame();
