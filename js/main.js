// ARQUIVO: js/main.js (VERSÃO FINAL CORRIGIDA)

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

// --- INICIALIZAÇÃO FIREBASE ---
let app, auth, db, provider;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    console.log("Firebase Web Iniciado.");
} catch (e) { console.error("Erro Firebase:", e); }

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 

// Variáveis de Jogo
let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let isProcessing = false; 
let turnCount = 1; 
let playerHistory = []; 
window.masterVol = 1.0; 
let isLethalHover = false; 
let mixerInterval = null;

// Variáveis de Matchmaking e PvP
let matchTimerInterval = null;
let matchSeconds = 0;
let myQueueRef = null;      // Referência na fila
let queueListener = null;   // Listener da fila
let matchUnsub = null;      // Listener da partida
window.isGameRunning = false;
window.currentMatchId = null;
window.isMatchStarting = false;
window.currentDeck = 'knight';
window.gameMode = 'pve';

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
        'https://i.ibb.co/zhx4QY51/MESA-DE-JOGO.png',
        'https://i.ibb.co/Z1GNKZGp/MESA-DE-JOGO-MAGO.png',
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

// --- HELPER FUNCTIONS ---
function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) {
        return MAGE_ASSETS[cardKey];
    }
    return CARDS_DB[cardKey].img;
}

// --- FUNÇÃO CRÍTICA QUE FALTAVA ---
const tt = document.getElementById('tooltip-box');
function bindFixedTooltip(el, k) { 
    const updatePos = () => { 
        let rect = el.getBoundingClientRect(); 
        if(tt) tt.style.left = (rect.left + rect.width / 2) + 'px'; 
    }; 
    return { 
        onmouseenter: (e) => { 
            showTT(k); 
            if(tt) {
                tt.style.bottom = (window.innerWidth < 768 ? '280px' : '420px'); 
                tt.style.top = 'auto'; 
                tt.classList.remove('tooltip-anim-up'); 
                tt.classList.remove('tooltip-anim-down'); 
                tt.classList.add('tooltip-anim-up'); 
                updatePos(); 
            }
            el.addEventListener('mousemove', updatePos); 
        } 
    }; 
}

function showTT(k) {
    let db = CARDS_DB[k];
    document.getElementById('tt-title').innerHTML = k; 
    if (db.customTooltip) {
        let content = db.customTooltip;
        let currentLvl = (typeof player !== 'undefined' && player.lvl) ? player.lvl : 1;
        content = content.replace('{PLAYER_LVL}', currentLvl);
        let bonusBlock = (typeof player !== 'undefined' && player.bonusBlock) ? player.bonusBlock : 0;
        let reflectDmg = 1 + bonusBlock;
        content = content.replace('{PLAYER_BLOCK_DMG}', reflectDmg);
        document.getElementById('tt-content').innerHTML = content;
    } else {
        document.getElementById('tt-content').innerHTML = `<span class='tt-label'>Base</span><span class='tt-val'>${db.base}</span><span class='tt-label' style='color:var(--accent-orange)'>Bônus</span><span class='tt-val'>${db.bonus}</span><span class='tt-label' style='color:var(--accent-purple)'>Maestria</span><span class='tt-val'>${db.mastery}</span>`;
    }
    tt.style.display = 'block';
}

function bindMasteryTooltip(el, key, value, ownerId) {
    return {
        onmouseenter: (e) => {
            let db=CARDS_DB[key];
            document.getElementById('tt-title').innerHTML = key; 
            document.getElementById('tt-content').innerHTML = `<span class='tt-label' style='color:var(--accent-blue)'>Bônus Atual</span><span class='tt-val'>+${value}</span><span class='tt-label' style='color:var(--accent-red)'>Efeito</span><span class='tt-val'>${db.mastery}</span>`;
            tt.style.display = 'block';
            tt.classList.remove('tooltip-anim-up'); tt.classList.remove('tooltip-anim-down'); 
            void tt.offsetWidth; let rect = el.getBoundingClientRect();
            if(ownerId === 'p') { tt.classList.add('tooltip-anim-up'); tt.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; tt.style.top = 'auto'; } 
            else { tt.classList.add('tooltip-anim-down'); tt.style.top = (rect.bottom + 10) + 'px'; tt.style.bottom = 'auto'; }
            tt.style.left = (rect.left + rect.width/2) + 'px'; tt.style.transform = "translateX(-50%)"; 
        }
    };
}

function addMI(parent, key, value, col, ownerId){ 
    let d = document.createElement('div'); d.className = 'mastery-icon'; 
    d.innerHTML = `${CARDS_DB[key].icon}<span class="mastery-lvl">${value}</span>`;
    d.style.borderColor = col; 
    let handlers = bindMasteryTooltip(d, key, value, ownerId);
    d.onmouseenter = handlers.onmouseenter; d.onmouseleave = () => { tt.style.display = 'none'; }; parent.appendChild(d); 
}

function apply3DTilt(element, isHand = false) { 
    if(window.innerWidth < 768) return; 
    element.addEventListener('mousemove', (e) => { 
        const rect = element.getBoundingClientRect(); 
        const x = e.clientX - rect.left; const y = e.clientY - rect.top; 
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

// --- AUDIO CONTROLLER ---
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
    stopCurrent() { if (this.currentTrackId && audios[this.currentTrackId]) { this.fadeOut(audios[this.currentTrackId]); } this.currentTrackId = null; },
    fadeOut(audio) {
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => { if (vol > 0.05) { vol -= 0.05; audio.volume = vol; } else { audio.volume = 0; audio.pause(); clearInterval(fadeOutInt); } }, 50);
    },
    fadeIn(audio, targetVol) {
        let vol = 0; audio.volume = 0;
        const fadeInInt = setInterval(() => { if (vol < targetVol - 0.05) { vol += 0.05; audio.volume = vol; } else { audio.volume = targetVol; clearInterval(fadeInInt); } }, 50);
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
    if(!window.isMuted && MusicController.currentTrackId) { const audio = audios[MusicController.currentTrackId]; if(audio && audio.paused) audio.play(); }
}

window.playNavSound = function() { let s = audios['sfx-nav']; if(s) { s.currentTime = 0; s.play().catch(()=>{}); } };
window.playUIHoverSound = function() {
    let now = Date.now(); if (now - lastHoverTime < 50) return; 
    let base = audios['sfx-ui-hover']; if(base && !window.isMuted) { let s = base.cloneNode(); s.volume = 0.3 * (window.masterVol || 1.0); s.play().catch(()=>{}); lastHoverTime = now; }
};

window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    const configBtn = document.getElementById('btn-config-toggle');
    const surrenderBtn = document.getElementById('btn-surrender');
    if(screenId === 'game-screen') { if(surrenderBtn) surrenderBtn.style.display = 'block'; if(configBtn) configBtn.style.display = 'flex'; } 
    else { if(surrenderBtn) surrenderBtn.style.display = 'none'; if(configBtn) configBtn.style.display = 'none'; const panel = document.getElementById('config-panel'); if(panel) { panel.style.display = 'none'; panel.classList.remove('active'); } }
}

window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen().catch(() => {}); }
        if (screen.orientation && screen.orientation.lock) { screen.orientation.lock('landscape').catch(() => {}); }
    } catch (e) { console.log(e); }
    window.showScreen('deck-selection-screen');
};

(function createRotateOverlay() {
    if (!document.getElementById('rotate-overlay')) {
        const div = document.createElement('div'); div.id = 'rotate-overlay';
        div.innerHTML = `<div style="font-size: 50px; margin-bottom: 20px;">↻</div><div>GIRE O CELULAR<br>PARA JOGAR</div>`;
        document.body.appendChild(div);
    }
})();

// --- GAME LOGIC & UI ---
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
    if(hpPct > 66) hpFill.style.background = "#4cd137"; else if(hpPct > 33) hpFill.style.background = "#fbc531"; else hpFill.style.background = "#e84118";
    document.getElementById(u.id+'-deck-count').innerText = u.deck.length;
    
    if(u === player) {
        let deckImgEl = document.getElementById('p-deck-img');
        deckImgEl.src = (window.currentDeck === 'mage') ? MAGE_ASSETS.DECK_IMG : 'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png';
    }

    if(u===player) {
        let hc=document.getElementById('player-hand'); hc.innerHTML='';
        u.hand.forEach((k,i)=>{
            let c=document.createElement('div'); c.className=`card hand-card ${CARDS_DB[k].color}`;
            c.style.setProperty('--flare-col', CARDS_DB[k].fCol);
            if(u.disabled===k) c.classList.add('disabled-card');
            
            // Corrige opacidade inicial
            c.style.opacity = window.isMatchStarting ? '0' : '1';

            let lethalType = checkCardLethality(k); 
            let flaresHTML = ''; for(let f=1; f<=25; f++) flaresHTML += `<div class="flare-spark fs-${f}"></div>`;
            let imgUrl = getCardArt(k, true);
            c.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div><div class="flares-container">${flaresHTML}</div>`;
            c.onclick=()=>onCardClick(i); 
            
            // Chama o bindFixedTooltip aqui (AGORA DEFINIDO)
            let ttHandler = bindFixedTooltip(c,k);
            c.onmouseenter = (e) => { 
                ttHandler.onmouseenter(e); 
                document.body.classList.add('focus-hand'); document.body.classList.add('cinematic-active'); 
                if(lethalType) { isLethalHover = true; document.body.classList.add('tension-active'); } 
                playSound('sfx-hover'); 
            };
            c.onmouseleave = (e) => { if(tt) tt.style.display='none'; document.body.classList.remove('focus-hand'); document.body.classList.remove('cinematic-active'); document.body.classList.remove('tension-active'); isLethalHover = false; };
            hc.appendChild(c); apply3DTilt(c, true);
        });
    }
    
    let xc=document.getElementById(u.id+'-xp'); xc.innerHTML='';
    u.xp.forEach(k=>{ 
        let d=document.createElement('div'); d.className='xp-mini'; 
        let imgUrl = getCardArt(k, (u === player)); d.style.backgroundImage = `url('${imgUrl}')`; 
        d.onmouseenter = () => { document.body.classList.add('focus-xp'); playSound('sfx-hover'); }; 
        d.onmouseleave = () => { document.body.classList.remove('focus-xp'); }; 
        xc.appendChild(d); 
    });
    
    let mc=document.getElementById(u.id+'-masteries'); mc.innerHTML='';
    if(u.bonusAtk>0) addMI(mc, 'ATAQUE', u.bonusAtk, '#e74c3c', u.id); 
    if(u.bonusBlock>0) addMI(mc, 'BLOQUEIO', u.bonusBlock, '#00cec9', u.id); 
}

// --- MATCHMAKING & PVP ---
window.startPvE = function() { window.gameMode = 'pve'; window.playNavSound(); window.openDeckSelector(); };

window.startPvPSearch = async function() {
    if (!currentUser) return; 
    window.gameMode = 'pvp';
    window.playNavSound();

    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'flex';
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE...";
    document.querySelector('.mm-title').style.color = "var(--gold)";
    document.querySelector('.radar-spinner').style.borderColor = "rgba(255, 215, 0, 0.3)";
    document.querySelector('.radar-spinner').style.borderTopColor = "var(--gold)";
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
        myQueueRef = doc(collection(db, "queue")); 
        const myData = { uid: currentUser.uid, name: currentUser.displayName, score: 0, timestamp: Date.now(), matchId: null };
        await setDoc(myQueueRef, myData);

        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.matchId) { enterMatch(data.matchId); }
            }
        });
        findOpponentInQueue();
    } catch (e) { console.error("Erro no Matchmaking:", e); cancelPvPSearch(); }
};

async function findOpponentInQueue() {
    try {
        const queueRef = collection(db, "queue");
        const q = query(queueRef, orderBy("timestamp", "asc"), limit(50));
        const querySnapshot = await getDocs(q);
        let opponentDoc = null;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const isValid = !data.matchId && !data.cancelled && (Date.now() - data.timestamp < 3600000);
            if (data.uid !== currentUser.uid && isValid) { if (!opponentDoc) opponentDoc = doc; }
        });

        if (opponentDoc) {
            const opponentId = opponentDoc.data().uid;
            console.log("Oponente encontrado:", opponentId);
            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            await updateDoc(opponentDoc.ref, { matchId: matchId });
            if (myQueueRef) { await updateDoc(myQueueRef, { matchId: matchId }); }
            await createMatchDocument(matchId, currentUser.uid, opponentId);
        }
    } catch (e) { console.error("Erro ao buscar oponente:", e); }
}

async function createMatchDocument(matchId, p1Id, p2Id) {
    const matchRef = doc(db, "matches", matchId);
    await setDoc(matchRef, {
        player1: { uid: p1Id, hp: 6, status: 'selecting', hand: [], deck: [], xp: [] },
        player2: { uid: p2Id, hp: 6, status: 'selecting', hand: [], deck: [], xp: [] },
        turn: 1, status: 'waiting_decks', createdAt: Date.now()
    });
}

window.cancelPvPSearch = async function() {
    window.playNavSound();
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'none';
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (queueListener) { queueListener(); queueListener = null; }
    if (myQueueRef) { await updateDoc(myQueueRef, { cancelled: true }); myQueueRef = null; }
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
        document.getElementById('matchmaking-screen').style.display = 'none';
        window.currentMatchId = matchId;
        window.isGameRunning = false;
        startMatchListener(matchId);
        window.openDeckSelector(); 
    }, 1500);
}

function startMatchListener(matchId) {
    if (matchUnsub) matchUnsub();
    matchUnsub = onSnapshot(doc(db, "matches", matchId), async (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();
        
        if (matchData.status === 'playing' && !window.isGameRunning) {
            console.log("Tudo pronto! Iniciando jogo...");
            window.isGameRunning = true;
            window.transitionToGame(); 
        }

        if (matchData.status === 'playing') {
            syncMatchState(matchData);
        }

        if (currentUser.uid === matchData.player1.uid && 
            matchData.status === 'waiting_decks' &&
            matchData.player1.status === 'ready' && 
            matchData.player2.status === 'ready') {
            console.log("HOST: Ambos prontos. Gerando decks...");
            await initializeMatchDecks(matchId, matchData);
        }
    });
}

function syncMatchState(data) {
    const isP1 = (currentUser.uid === data.player1.uid);
    const myData = isP1 ? data.player1 : data.player2;
    const oppData = isP1 ? data.player2 : data.player1;

    player.hp = myData.hp;
    player.maxHp = 6 + (myData.maxHpBonus || 0);
    player.lvl = 1 + (myData.xp ? Math.floor(myData.xp.length / 5) : 0);
    player.hand = Array.isArray(myData.hand) ? myData.hand : [];
    player.deck = myData.deck || [];
    player.xp = myData.xp || [];
    player.disabled = myData.disabled || null;

    monster.name = oppData.class === 'mage' ? "MAGO RIVAL" : "CAVALEIRO RIVAL";
    monster.hp = oppData.hp;
    monster.maxHp = 6 + (oppData.maxHpBonus || 0);
    monster.lvl = 1 + (oppData.xp ? Math.floor(oppData.xp.length / 5) : 0);
    monster.hand = new Array(oppData.hand ? oppData.hand.length : 0).fill('unknown'); 
    monster.deck = oppData.deck || [];
    monster.xp = oppData.xp || [];
    monster.disabled = oppData.disabled || null;

    turnCount = data.turn;
    updateUI();

    const handEl = document.getElementById('player-hand');
    if (handEl && player.hand.length > 0) {
        if(handEl.classList.contains('preparing')) {
            handEl.classList.remove('preparing');
            dealAllInitialCards(); 
        }
        if (!window.isMatchStarting) {
            Array.from(handEl.children).forEach(c => c.style.opacity = '1');
        }
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

window.selectDeck = async function(deckType) {
    if(audios['sfx-deck-select']) { audios['sfx-deck-select'].currentTime = 0; audios['sfx-deck-select'].play().catch(()=>{}); }
    window.currentDeck = deckType; 
    document.body.classList.remove('theme-cavaleiro', 'theme-mago');
    document.body.classList.add(deckType === 'mage' ? 'theme-mago' : 'theme-cavaleiro');

    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))";
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
                console.log("Deck escolhido. Aguardando início...");
            }
        } catch(e) { console.error("Erro ao salvar deck:", e); }
    } else {
        setTimeout(() => {
            const selectionScreen = document.getElementById('deck-selection-screen');
            selectionScreen.style.opacity = "0";
            setTimeout(() => {
                window.transitionToGame();
                setTimeout(() => {
                    selectionScreen.style.opacity = "1";
                    options.forEach(opt => opt.style = "");
                }, 500);
            }, 500);
        }, 400);
    }
};

window.transitionToGame = function() {
    const transScreen = document.getElementById('transition-overlay');
    const transText = transScreen.querySelector('.trans-text');
    if(transText) transText.innerText = "PREPARANDO BATALHA...";
    if(transScreen) transScreen.classList.add('active');
    setTimeout(() => {
        MusicController.play('bgm-loop'); 
        let bg = document.getElementById('game-background');
        if(bg) bg.classList.remove('lobby-mode');
        window.showScreen('game-screen');
        const handEl = document.getElementById('player-hand'); 
        if(handEl) handEl.innerHTML = '';
        setTimeout(() => {
            if(transScreen) transScreen.classList.remove('active');
            setTimeout(() => { startGameFlow(); }, 200); 
        }, 1500);
    }, 500); 
}

window.transitionToLobby = function() {
    const transScreen = document.getElementById('transition-overlay');
    const transText = transScreen.querySelector('.trans-text');
    if(transText) transText.innerText = "RETORNANDO AO SAGUÃO...";
    if(transScreen) transScreen.classList.add('active');
    MusicController.stopCurrent(); 
    setTimeout(() => {
        window.goToLobby(false); 
        setTimeout(() => {
            if(transScreen) transScreen.classList.remove('active');
        }, 1000); 
    }, 500);
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) {
        window.showScreen('start-screen');
        MusicController.play('bgm-menu'); 
        return;
    }
    isProcessing = false; 
    let bg = document.getElementById('game-background');
    if(bg) bg.classList.add('lobby-mode');
    
    MusicController.play('bgm-menu'); 
    createLobbyFlares();
    
    const userRef = doc(db, "players", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0 });
        document.getElementById('lobby-username').innerText = `OLÁ, ${currentUser.displayName.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: 0 | PONTOS: 0`;
    } else {
        const d = userSnap.data();
        document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;
    }
    const q = query(collection(db, "players"), orderBy("score", "desc"), limit(10));
    onSnapshot(q, (snapshot) => {
        let html = '<table id="ranking-table"><thead><tr><th>#</th><th>JOGADOR</th><th>PTS</th></tr></thead><tbody>';
        let pos = 1;
        snapshot.forEach((doc) => {
            const p = doc.data();
            let rankClass = pos === 1 ? "rank-1" : (pos === 2 ? "rank-2" : (pos === 3 ? "rank-3" : ""));
            html += `<tr class="${rankClass}"><td class="rank-pos">${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`;
            pos++;
        });
        html += '</tbody></table>';
        document.getElementById('ranking-content').innerHTML = html;
    });
    window.showScreen('lobby-screen');
    document.getElementById('end-screen').classList.remove('visible'); 
};

window.handleLogout = function() {
    window.playNavSound();
    signOut(auth).then(() => { location.reload(); });
};

// --- AUTH LISTENER ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        window.goToLobby(true); 
    } else {
        currentUser = null;
        window.showScreen('start-screen');
        const bg = document.getElementById('game-background');
        if(bg) bg.classList.remove('lobby-mode');
        const btnTxt = document.getElementById('btn-text');
        if(btnTxt) btnTxt.innerText = "LOGIN COM GOOGLE";
        MusicController.play('bgm-menu'); 
    }
});

window.googleLogin = async function() {
    window.playNavSound(); 
    const btnText = document.getElementById('btn-text');
    btnText.innerText = "CONECTANDO...";
    try { await signInWithPopup(auth, provider); } 
    catch (error) { console.error("Erro no Login:", error); btnText.innerText = "ERRO - TENTE NOVAMENTE"; setTimeout(() => btnText.innerText = "LOGIN COM GOOGLE", 3000); }
};

window.registrarVitoriaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            let modoAtual = window.gameMode || 'pve';
            let pontosGanhos = (modoAtual === 'pvp') ? 8 : 1; 
            await updateDoc(userRef, { totalWins: (data.totalWins || 0) + 1, score: (data.score || 0) + pontosGanhos });
            console.log(`Vitória registrada (${modoAtual}): +${pontosGanhos} pontos.`);
        }
    } catch(e) { console.error("Erro ao salvar vitória:", e); }
};

window.registrarDerrotaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            let modoAtual = window.gameMode || 'pve';
            let pontosPerdidos = (modoAtual === 'pvp') ? 8 : 3;
            let novoScore = Math.max(0, (data.score || 0) - pontosPerdidos);
            await updateDoc(userRef, { score: novoScore });
            console.log(`Derrota registrada (${modoAtual}): -${pontosPerdidos} pontos.`);
        }
    } catch(e) { console.error("Erro ao salvar derrota:", e); }
};

window.restartMatch = function() {
    document.getElementById('end-screen').classList.remove('visible');
    setTimeout(startGameFlow, 50);
    MusicController.play('bgm-loop'); 
}

window.abandonMatch = function() {
    if(document.getElementById('game-screen').classList.contains('active')) {
        window.toggleConfig(); 
        window.openModal("ABANDONAR?", "Sair da partida contará como DERROTA. Tem certeza?", ["CANCELAR", "SAIR"], (choice) => {
            if (choice === "SAIR") { window.registrarDerrotaOnline(); window.transitionToLobby(); }
        });
    }
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    startCinematicLoop(); 
    
    // CORREÇÃO CRÍTICA PARA PVP:
    // Se for PvP, não resetamos as variáveis locais, pois o syncMatchState fará isso.
    if (window.gameMode === 'pvp') {
        window.isMatchStarting = false;
        const handEl = document.getElementById('player-hand');
        if(handEl) {
            handEl.classList.remove('preparing');
            // Força atualização visual caso as cartas já estejam lá mas ocultas
            Array.from(handEl.children).forEach(c => c.style.opacity = '1');
        }
        return; 
    }
    
    // FLUXO PVE (Mantido)
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

// Funções de Jogo Auxiliares (Definidas no escopo global para o HTML acessar)
window.showCenterText = showCenterText;
window.openModal = function(t,d,opts,cb) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-desc').innerText=d; let g=document.getElementById('modal-btns'); g.innerHTML=''; opts.forEach(o=>{ let b=document.createElement('button'); b.className='mini-btn'; b.innerText=o; b.onclick=()=>{document.getElementById('modal-overlay').style.display='none'; cb(o)}; g.appendChild(b); }); document.getElementById('modal-overlay').style.display='flex'; }
window.cancelModal = function() { document.getElementById('modal-overlay').style.display='none'; isProcessing = false; }

function showCenterText(txt, col) { let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; if(col) el.style.color = col; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }
function checkLevelUp(u, doneCb) { if(u.xp.length >= 5) { let xpContainer = document.getElementById(u.id + '-xp'); let minis = Array.from(xpContainer.getElementsByClassName('xp-mini')); minis.forEach(realCard => { let rect = realCard.getBoundingClientRect(); let clone = document.createElement('div'); clone.className = 'xp-anim-clone'; clone.style.left = rect.left + 'px'; clone.style.top = rect.top + 'px'; clone.style.width = rect.width + 'px'; clone.style.height = rect.height + 'px'; clone.style.backgroundImage = realCard.style.backgroundImage; if (u.id === 'p') clone.classList.add('xp-fly-up'); else clone.classList.add('xp-fly-down'); document.body.appendChild(clone); }); minis.forEach(m => m.style.opacity = '0'); setTimeout(() => { let counts = {}; u.xp.forEach(x => counts[x] = (counts[x]||0)+1); let triggers = []; for(let k in counts) if(counts[k] >= 3 && k !== 'DESCANSAR') triggers.push(k); processMasteries(u, triggers, () => { let lvlEl = document.getElementById(u.id+'-lvl'); u.lvl++; lvlEl.classList.add('level-up-anim'); triggerLevelUpVisuals(u.id); playSound('sfx-levelup'); setTimeout(() => lvlEl.classList.remove('level-up-anim'), 1000); u.xp.forEach(x => u.deck.push(x)); u.xp = []; shuffle(u.deck); let clones = document.getElementsByClassName('xp-anim-clone'); while(clones.length > 0) clones[0].remove(); updateUI(); doneCb(); }); }, 1000); } else { doneCb(); } }
function resetUnit(u) { u.hp = 6; u.maxHp = 6; u.lvl = 1; u.xp = []; u.hand = []; u.deck = []; u.disabled = null; u.bonusBlock = 0; u.bonusAtk = 0; for(let k in DECK_TEMPLATE) for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k); shuffle(u.deck); }
function shuffle(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }
function drawCardLogic(u, qty) { for(let i=0; i<qty; i++) if(u.deck.length > 0) u.hand.push(u.deck.pop()); u.hand.sort(); }
function dealAllInitialCards() { isProcessing = true; playSound('sfx-deal'); const handEl = document.getElementById('player-hand'); const cards = Array.from(handEl.children); cards.forEach((cardEl, i) => { cardEl.classList.add('intro-anim'); cardEl.style.animationDelay = (i * 0.1) + 's'; cardEl.style.opacity = ''; }); window.isMatchStarting = false; if(handEl) handEl.classList.remove('preparing'); setTimeout(() => { cards.forEach(c => { c.classList.remove('intro-anim'); c.style.animationDelay = ''; }); isProcessing = false; }, 2000); }
function checkCardLethality(cardKey) { if(cardKey === 'ATAQUE') { let damage = player.lvl; return damage >= monster.hp ? 'red' : false; } if(cardKey === 'BLOQUEIO') { let reflect = 1 + player.bonusBlock; return reflect >= monster.hp ? 'blue' : false; } return false; }

// Inicializa o jogo
preloadGame();
