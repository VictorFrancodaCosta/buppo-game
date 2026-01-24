// ARQUIVO: js/main.js - VERSÃO DEFINITIVA (MAESTRIA, HISTÓRICO E TOOLTIP)
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
window.masterVol = 1.0; let isLethalHover = false; let mixerInterval = null;

// --- ESTADOS GLOBAIS ---
window.isMatchStarting = false; window.currentDeck = 'knight'; window.myRole = null; 
window.currentMatchId = null; window.pvpSelectedCardIndex = null; 
window.isResolvingTurn = false; window.pvpStartData = null; 

// --- FUNÇÕES DE CARREGAMENTO E ÁUDIO ---
function preloadGame() {
    ASSETS_TO_LOAD.images.forEach(src => { let img = new Image(); img.src = src; img.onload = updateLoader; img.onerror = updateLoader; });
    ASSETS_TO_LOAD.audio.forEach(a => { let s = new Audio(a.src); s.preload = 'auto'; if(a.loop) s.loop = true; audios[a.id] = s; s.onloadedmetadata = updateLoader; s.onerror = updateLoader; });
}

function updateLoader() {
    assetsLoaded++; let pct = Math.min(100, (assetsLoaded / totalAssets) * 100);
    const fill = document.getElementById('loader-fill'); if(fill) fill.style.width = pct + '%';
    if(assetsLoaded >= totalAssets) {
        setTimeout(() => { 
            const loading = document.getElementById('loading-screen'); 
            if(loading) loading.style.display = 'none'; 
            initGlobalHoverLogic();
        }, 800);
    }
}

function playSound(key) {
    if(audios[key]) {
        try {
            audios[key].volume = (key === 'sfx-ui-hover' ? 0.3 : 0.8) * (window.masterVol || 1.0);
            audios[key].currentTime = 0; audios[key].play().catch(()=>{});
        } catch(e){}
    }
}

const MusicController = {
    currentTrackId: null,
    play(id) {
        if (!audios[id] || this.currentTrackId === id) return;
        if (this.currentTrackId && audios[this.currentTrackId]) audios[this.currentTrackId].pause();
        this.currentTrackId = id; audios[id].volume = 0.5 * window.masterVol; audios[id].play().catch(()=>{});
    },
    stopCurrent() { if (this.currentTrackId && audios[this.currentTrackId]) audios[this.currentTrackId].pause(); this.currentTrackId = null; }
};

// --- LOGICA DE JOGO ---
function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) return MAGE_ASSETS[cardKey];
    return CARDS_DB[cardKey].img;
}

function resetUnit(u, deck, role) {
    u.hp = 6; u.maxHp = 6; u.lvl = 1; u.xp = []; u.hand = []; u.bonusAtk = 0; u.bonusBlock = 0; u.disabled = null; u.originalRole = role;
    if(deck) u.deck = [...deck];
    else { u.deck = []; for(let k in DECK_TEMPLATE) for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k); shuffle(u.deck); }
}

function updateUI() {
    const updateUnit = (u) => {
        document.getElementById(u.id+'-lvl').firstChild.nodeValue = u.lvl;
        document.getElementById(u.id+'-hp-txt').innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
        let pct = (Math.max(0,u.hp)/u.maxHp)*100;
        let fill = document.getElementById(u.id+'-hp-fill'); 
        if(fill) { fill.style.width = pct + '%'; fill.style.background = pct > 66 ? "#4cd137" : (pct > 33 ? "#fbc531" : "#e84118"); }
        document.getElementById(u.id+'-deck-count').innerText = u.deck.length;
        
        if(u === player) {
            let hand = document.getElementById('player-hand'); hand.innerHTML = '';
            u.hand.forEach((k, i) => {
                let c = document.createElement('div'); c.className = `card hand-card ${CARDS_DB[k].color}`;
                if(u.disabled === k) c.classList.add('disabled-card');
                c.innerHTML = `<div class="card-art" style="background-image: url('${getCardArt(k, true)}')"></div>`;
                c.onclick = () => onCardClick(i);
                c.onmouseenter = () => { showTT(k); tt.style.display = 'block'; document.body.classList.add('focus-hand'); playSound('sfx-hover'); };
                c.onmouseleave = () => { tt.style.display = 'none'; document.body.classList.remove('focus-hand'); };
                hand.appendChild(c); apply3DTilt(c, true);
            });
        }
        let xp = document.getElementById(u.id+'-xp'); xp.innerHTML = '';
        u.xp.forEach(k => {
            let d = document.createElement('div'); d.className = 'xp-mini';
            d.style.backgroundImage = `url('${getCardArt(k, u === player)}')`;
            xp.appendChild(d);
        });
        let mc = document.getElementById(u.id+'-masteries'); mc.innerHTML = '';
        if(u.bonusAtk > 0) addMI(mc, 'ATAQUE', u.bonusAtk, '#e74c3c', u.id);
        if(u.bonusBlock > 0) addMI(mc, 'BLOQUEIO', u.bonusBlock, '#00cec9', u.id);
    };
    updateUnit(player); updateUnit(monster);
    document.getElementById('turn-txt').innerText = "TURNO " + turnCount;
}

// --- MAESTRIA E SINCRONIZAÇÃO ---
async function commitTurnToDB() {
    if (!window.currentMatchId || window.gameMode !== 'pvp') return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    try {
        const myKey = window.myRole; const oppKey = (window.myRole === 'player1') ? 'player2' : 'player1';
        let data = {};
        data[`${myKey}.hp`] = player.hp;
        data[`${myKey}.xp`] = player.xp;
        data[`${myKey}.lvl`] = player.lvl;
        data[`${myKey}.maxHp`] = player.maxHp;
        data[`${myKey}.bonusAtk`] = player.bonusAtk;
        data[`${myKey}.bonusBlock`] = player.bonusBlock;
        data[`${myKey}.deck`] = player.deck;
        data[`${oppKey}.hp`] = monster.hp; // Envia dano da maestria
        await updateDoc(matchRef, data);
    } catch (e) { console.error("Sync Error:", e); }
}

function applyMastery(u, k) { 
    if(k === 'ATAQUE') { 
        u.bonusAtk++; let target = (u === player) ? monster : player; 
        target.hp -= u.bonusAtk; showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675"); 
        triggerDamageEffect(u !== player); 
    } 
    if(k === 'BLOQUEIO') u.bonusBlock++; 
    if(k === 'DESCANSAR') { u.maxHp++; showFloatingText(u.id+'-hp-txt', "+1 MAX", "#55efc4"); } 
    updateUI(); 
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

function resolveTurn(pAct, mAct, pDis, mDis) {
    let pDmg = 0, mDmg = 0;
    if(mAct === 'ATAQUE') pDmg += monster.lvl;
    if(pAct === 'ATAQUE') mDmg += player.lvl;
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') mDmg += (1 + player.bonusBlock); }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') pDmg += (1 + monster.bonusBlock); }

    player.hp -= pDmg; monster.hp -= mDmg;
    if(pDmg > 0) { triggerDamageEffect(true); showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); }
    if(mDmg > 0) { triggerDamageEffect(false); showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); }

    if(player.hp > 0 && pAct === 'DESCANSAR') { 
        let h = (pDmg === 0) ? 3 : 2; player.hp = Math.min(player.maxHp, player.hp + h); 
        triggerHealEffect(true); playSound('sfx-heal'); 
    }
    if(monster.hp > 0 && mAct === 'DESCANSAR') { 
        let h = (mDmg === 0) ? 3 : 2; monster.hp = Math.min(monster.maxHp, monster.hp + h); 
        triggerHealEffect(false); playSound('sfx-heal'); 
    }
    updateUI();

    setTimeout(() => {
        const handleXP = (u, act, isOpp) => {
            animateFly(u.id+'-slot', u.id+'-xp', act, () => {
                u.xp.push(act); updateUI();
                checkLevelUp(u, () => {
                    if(isOpp) { if(window.gameMode === 'pvp') commitTurnToDB(); checkEndGame(); }
                    else if(player.hp > 0) drawCardLogic(player, 1);
                });
            }, false, false, !isOpp);
        };
        handleXP(player, pAct, false); handleXP(monster, mAct, true);
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

// --- HISTÓRICO E UI ---
async function saveMatchHistory(result, points) {
    if (!currentUser) return;
    let enemy = "TREINAMENTO";
    if (window.gameMode === 'pvp') {
        const nameEl = document.querySelector('#m-stats-cluster .unit-name');
        if (nameEl && !nameEl.innerText.includes("MONSTRO")) enemy = nameEl.innerText.split(' ')[0].toUpperCase();
    }
    await addDoc(collection(db, "players", currentUser.uid, "history"), { result, opponent: enemy, mode: window.gameMode, points, timestamp: Date.now() });
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

function checkEndGame() {
    if(player.hp <= 0 || monster.hp <= 0) {
        isProcessing = true; MusicController.stopCurrent();
        setTimeout(() => {
            let title = document.getElementById('end-title');
            let isWin = player.hp > 0; let isTie = player.hp <= 0 && monster.hp <= 0;
            if(isTie) { title.innerText = "EMPATE"; saveMatchHistory('TIE', 0); playSound('sfx-tie'); }
            else if(isWin) { title.innerText = "VITÓRIA"; window.registrarVitoriaOnline(window.gameMode); playSound('sfx-win'); }
            else { title.innerText = "DERROTA"; window.registrarDerrotaOnline(window.gameMode); playSound('sfx-lose'); }
            document.getElementById('end-screen').classList.add('visible');
        }, 1000);
    }
}

// --- BOOTSTRAP ---
onAuthStateChanged(auth, (user) => {
    if (user) { currentUser = user; window.goToLobby(true); }
    else { currentUser = null; window.showScreen('start-screen'); MusicController.play('bgm-menu'); }
});

// Funções de preenchimento obrigatório para evitar erros de referência
function shuffle(a, s=null) {
    let r = s ? () => { s = (s * 9301 + 49297) % 233280; return s / 233280; } : Math.random;
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
}

function drawCardLogic(u, q) { for(let i=0; i<q; i++) if(u.deck.length > 0) u.hand.push(u.deck.pop()); u.hand.sort(); }

function showTT(k) {
    document.getElementById('tt-title').innerText = k;
    let content = CARDS_DB[k].customTooltip || `Base: ${CARDS_DB[k].base}`;
    document.getElementById('tt-content').innerHTML = content.replace('{PLAYER_LVL}', player.lvl);
}

function initGlobalHoverLogic() {
    document.addEventListener('mouseover', (e) => {
        if (!e.target.closest('.hand-card') && !e.target.closest('.mastery-icon')) if(tt) tt.style.display = 'none';
    });
}

function apply3DTilt(el, isH) {
    el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect(); const x = (e.clientX - r.left)/r.width - 0.5; const y = (e.clientY - r.top)/r.height - 0.5;
        el.style.transform = `${isH ? 'translateY(-20px) scale(1.1)' : ''} rotateX(${y*-20}deg) rotateY(${x*20}deg)`;
    });
    el.addEventListener('mouseleave', () => el.style.transform = '');
}

function showFloatingText(id, t, c) {
    let el = document.createElement('div'); el.className = 'floating-text'; el.innerText = t; el.style.color = c;
    let r = document.getElementById(id).getBoundingClientRect();
    el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 2000);
}

function triggerDamageEffect(isP) {
    let id = isP ? 'p-slot' : 'm-slot'; playSound('sfx-hit');
    let r = document.getElementById(id).getBoundingClientRect();
    for(let i=0; i<10; i++) {
        let p = document.createElement('div'); p.className = 'particle'; p.style.left = r.left+'px'; p.style.top = r.top+'px';
        p.style.backgroundColor = '#ff4757'; document.body.appendChild(p); setTimeout(()=>p.remove(), 800);
    }
}

function triggerLevelUpVisuals(uId) {
    let el = document.createElement('div'); el.className = 'levelup-text'; el.innerText = "LEVEL UP!";
    document.getElementById(uId === 'p' ? 'p-stats-cluster' : 'm-stats-cluster').appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

function addMI(p, k, v, c, id) {
    let d = document.createElement('div'); d.className = 'mastery-icon'; d.style.borderColor = c;
    d.innerHTML = `${CARDS_DB[k].icon}<span class="mastery-lvl">${v}</span>`;
    d.onmouseenter = () => { document.getElementById('tt-title').innerText = k; document.getElementById('tt-content').innerText = CARDS_DB[k].mastery; tt.style.display = 'block'; };
    d.onmouseleave = () => tt.style.display = 'none'; p.appendChild(d);
}

function animateFly(sid, eid, k, cb, d, t, isP) {
    let s = document.getElementById(sid).getBoundingClientRect();
    let e = document.getElementById(eid).getBoundingClientRect();
    let f = document.createElement('div'); f.className = `card flying-card ${CARDS_DB[k].color}`;
    f.style.left = s.left+'px'; f.style.top = s.top+'px';
    document.body.appendChild(f); f.offsetHeight;
    f.style.left = e.left+'px'; f.style.top = e.top+'px';
    if(eid.includes('xp')) f.style.transform = 'scale(0.2)';
    setTimeout(() => { f.remove(); if(cb) cb(); }, 400);
}

function renderTable(k, id, isP) {
    let el = document.getElementById(id); el.innerHTML = `<div class="card ${CARDS_DB[k].color} card-on-table"><div class="card-art" style="background-image: url('${getCardArt(k, isP)}')"></div></div>`;
}

// Global Exports
window.googleLogin = async () => { try { await signInWithPopup(auth, provider); } catch(e){} };
window.startPvE = () => { window.gameMode = 'pve'; window.openDeckSelector(); };
window.startPvPSearch = () => { window.gameMode = 'pvp'; window.openDeckSelector(); };
window.openModal = (t, d, opts, cb) => {
    document.getElementById('modal-title').innerText = t; document.getElementById('modal-desc').innerText = d;
    let b = document.getElementById('modal-btns'); b.innerHTML = '';
    opts.forEach(o => { let btn = document.createElement('button'); btn.innerText = o; btn.onclick = () => { document.getElementById('modal-overlay').style.display = 'none'; cb(o); }; b.appendChild(btn); });
    document.getElementById('modal-overlay').style.display = 'flex';
};

// Funções de Matchmaking Omitidas na Versão Anterior (Causa do Bug de Travamento)
async function initiateMatchmaking() {
    document.getElementById('matchmaking-screen').style.display = 'flex';
    myQueueRef = doc(collection(db, "queue"));
    await setDoc(myQueueRef, { uid: currentUser.uid, name: currentUser.displayName, timestamp: Date.now(), matchId: null, status: 'waiting' });
    
    queueListener = onSnapshot(myQueueRef, (snap) => {
        if (snap.exists() && snap.data().matchId) enterMatch(snap.data().matchId);
    });

    searchInterval = setInterval(async () => {
        const q = query(collection(db, "queue"), orderBy("timestamp", "desc"), limit(10));
        const s = await getDocs(q);
        s.forEach(async docSnap => {
            const d = docSnap.data();
            if (d.uid !== currentUser.uid && !d.matchId && (Date.now() - d.timestamp < 60000)) {
                const mid = "match_" + Date.now();
                await updateDoc(docSnap.ref, { matchId: mid });
                await updateDoc(myQueueRef, { matchId: mid });
                await setMatchDoc(mid, d.uid, d.name);
            }
        });
    }, 3000);
}

async function setMatchDoc(mid, oppId, oppName) {
    const p1D = generateShuffledDeck(); const p2D = generateShuffledDeck();
    await setDoc(doc(db, "matches", mid), {
        player1: { uid: currentUser.uid, name: currentUser.displayName, hp: 6, deck: p1D, xp: [] },
        player2: { uid: oppId, name: oppName, hp: 6, deck: p2D, xp: [] },
        status: 'playing', createdAt: Date.now()
    });
}

async function enterMatch(mid) {
    clearInterval(searchInterval); if(queueListener) queueListener();
    window.currentMatchId = mid;
    const s = await getDoc(doc(db, "matches", mid));
    window.pvpStartData = s.data();
    window.myRole = (s.data().player1.uid === currentUser.uid) ? 'player1' : 'player2';
    document.getElementById('matchmaking-screen').style.display = 'none';
    window.transitionToGame();
}

// Iniciar Assets
preloadGame();
