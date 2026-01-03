// ARQUIVO: js/main.js (VERSÃO RESTAURADA E ESTÁVEL)

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    console.log("Firebase Web Iniciado.");
} catch (e) {
    console.error("Erro Firebase:", e);
}

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 
window.pvpUnsubscribe = null; 

// Variáveis de Matchmaking (Sistema Clássico)
let matchTimerInterval = null;
let matchSeconds = 0;
let myQueueRef = null; 
let queueListener = null;
let matchmakingInterval = null; // O Loop de busca ativo

// --- ASSETS LOCAIS ---
const MAGE_ASSETS = {
    'ATAQUE': 'assets/img/carta_ataque_mago.png',
    'BLOQUEIO': 'assets/img/carta_bloqueio_mago.png',
    'DESCANSAR': 'assets/img/carta_descansar_mago.png',
    'DESARMAR': 'assets/img/carta_desarmar_mago.png',
    'TREINAR': 'assets/img/carta_treinar_mago.png',
    'DECK_IMG': 'assets/img/deck_verso_mago.png',
    'DECK_SELECT': 'assets/img/card_selecao_mago.png'
};

const ASSETS_TO_LOAD = {
    images: [
        'assets/img/logo_buppo.png',
        'assets/img/mesa_cavaleiro.png',
        'assets/img/mesa_mago.png',
        'assets/img/bg_saguao.png',
        'assets/img/ui_moldura_perfil.png',
        'assets/img/ui_placa_selecao.png',
        'assets/img/card_selecao_cavaleiro.png',
        'assets/img/card_selecao_mago.png',
        'assets/img/deck_verso_cavaleiro.png',
        'assets/img/deck_verso_mago.png',
        'assets/img/card_verso_padrao.png',
        'assets/img/ui_mesa_deck.png',
        'assets/img/ui_area_xp.png',
        'assets/img/carta_ataque_cavaleiro.png',
        'assets/img/carta_bloqueio_cavaleiro.png',
        'assets/img/carta_descansar_cavaleiro.png',
        'assets/img/carta_desarmar_cavaleiro.png',
        'assets/img/carta_treinar_cavaleiro.png',
        'assets/img/carta_ataque_mago.png',
        'assets/img/carta_bloqueio_mago.png',
        'assets/img/carta_descansar_mago.png',
        'assets/img/carta_desarmar_mago.png',
        'assets/img/carta_treinar_mago.png'
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
let isLethalHover = false; 
let mixerInterval = null;

// --- ESTADOS GLOBAIS ---
window.isMatchStarting = false;
window.currentDeck = 'knight';
window.myRole = null; 
window.currentMatchId = null;
window.pvpSelectedCardIndex = null; 
window.isResolvingTurn = false; 
window.pvpStartData = null; 

function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) {
        return MAGE_ASSETS[cardKey];
    }
    return CARDS_DB[cardKey].img;
}

function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function shuffle(array, seed = null) {
    let rng = Math.random; 
    if (seed !== null) {
        let currentSeed = seed;
        rng = function() {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        }
    }
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateShuffledDeck() {
    let deck = [];
    for(let k in DECK_TEMPLATE) {
        for(let i=0; i<DECK_TEMPLATE[k]; i++) deck.push(k);
    }
    shuffle(deck);
    return deck;
}

// --- MUSIC CONTROLLER (Continuo) ---
const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if (!audios[trackId]) return;
        try {
            if (this.currentTrackId === trackId) {
                if (audios[trackId].paused && !window.isMuted) {
                    const audio = audios[trackId];
                    if (audio.readyState >= 2) audio.currentTime = 0;
                    audio.volume = 0;
                    audio.play().catch(()=>{});
                    this.fadeIn(audio, 0.5 * window.masterVol);
                }
                return; 
            } 
            const maxVol = 0.5 * window.masterVol;
            if (this.currentTrackId && audios[this.currentTrackId]) {
                this.fadeOut(audios[this.currentTrackId]);
            }
            if (trackId && audios[trackId]) {
                const newAudio = audios[trackId];
                if (newAudio.readyState >= 2) newAudio.currentTime = 0;
                if (!window.isMuted) {
                    newAudio.volume = 0; 
                    newAudio.play().catch(()=>{});
                    this.fadeIn(newAudio, maxVol);
                }
            }
            this.currentTrackId = trackId;
        } catch(e) { console.warn("MusicController:", e); }
    },
    stopCurrent() {
        if (this.currentTrackId && audios[this.currentTrackId]) {
            this.fadeOut(audios[this.currentTrackId]);
        }
        this.currentTrackId = null;
    },
    fadeOut(audio) {
        if(!audio) return;
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) {
                vol -= 0.05;
                try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); }
            } else {
                try { audio.volume = 0; audio.pause(); } catch(e){}
                clearInterval(fadeOutInt);
            }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        if(!audio) return;
        let vol = 0;
        audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) {
                vol += 0.05;
                try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); }
            } else {
                try { audio.volume = targetVol; } catch(e){}
                clearInterval(fadeInInt);
            }
        }, 50);
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
    if(!window.isMuted && MusicController.currentTrackId) {
        const audio = audios[MusicController.currentTrackId];
        if(audio && audio.paused) audio.play().catch(()=>{});
    }
}

window.playNavSound = function() { 
    let s = audios['sfx-nav']; 
    if(s) { 
        try {
            if (s.readyState >= 2) s.currentTime = 0; 
            s.play().catch(()=>{});
        } catch(e) { console.warn("NavSound", e); }
    } 
};

let lastHoverTime = 0;
window.playUIHoverSound = function() {
    let now = Date.now();
    if (now - lastHoverTime < 50) return; 
    let base = audios['sfx-ui-hover'];
    if(base && !window.isMuted) { 
        try {
            let s = base.cloneNode(); 
            s.volume = 0.3 * (window.masterVol || 1.0);
            s.play().catch(()=>{}); 
            lastHoverTime = now;
        } catch(e){}
    }
};

window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    const configBtn = document.getElementById('btn-config-toggle');
    const surrenderBtn = document.getElementById('btn-surrender');
    if(screenId === 'game-screen') {
        if(surrenderBtn) surrenderBtn.style.display = 'block';
        if(configBtn) configBtn.style.display = 'flex'; 
    } else {
        if(surrenderBtn) surrenderBtn.style.display = 'none';
        if(configBtn) configBtn.style.display = 'none';
        const panel = document.getElementById('config-panel');
        if(panel) { panel.style.display = 'none'; panel.classList.remove('active'); }
    }
}

// --- AUTHENTICATION E LOGIN (BLINDADO) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário autenticado:", user.displayName);
        currentUser = user;
        window.goToLobby(true); 
    } else {
        console.log("Nenhum usuário logado.");
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
    try {
        await signInWithPopup(auth, provider);
        // O onAuthStateChanged vai cuidar do resto
    } catch (error) {
        console.error("Erro no Login:", error);
        btnText.innerText = "ERRO - TENTE NOVAMENTE";
        setTimeout(() => btnText.innerText = "LOGIN COM GOOGLE", 3000);
    }
};

window.handleLogout = function() {
    window.playNavSound();
    signOut(auth).then(() => { location.reload(); });
};

// --- NAVEGAÇÃO E DECK ---
window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) {
        ds.style.display = 'flex';
        ds.style.opacity = '1';
        ds.style.pointerEvents = 'auto'; 
        const options = document.querySelectorAll('.deck-option');
        options.forEach(opt => {
            opt.style = "";
            const img = opt.querySelector('img');
            if(img) img.style = "";
        });
    }
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    } catch (e) { console.log(e); }
    window.showScreen('deck-selection-screen');
};

window.selectDeck = function(deckType) {
    if(audios['sfx-deck-select']) {
        try {
            audios['sfx-deck-select'].currentTime = 0;
            audios['sfx-deck-select'].play().catch(()=>{});
        } catch(e){}
    }

    window.currentDeck = deckType; 
    
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 
    if (deckType === 'mage') {
        document.body.classList.add('theme-mago');
    } else {
        document.body.classList.add('theme-cavaleiro');
    }

    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))";
            opt.style.zIndex = "100";
            const img = opt.querySelector('img');
            if(img) img.style.filter = "grayscale(0%) brightness(1.2)";
        } else {
            opt.style.transition = "all 0.3s ease";
            opt.style.transform = "scale(0.8) translateY(10px)";
            opt.style.opacity = "0.2";
            opt.style.filter = "grayscale(100%)";
        }
    });

    setTimeout(() => {
        const selectionScreen = document.getElementById('deck-selection-screen');
        selectionScreen.style.transition = "opacity 0.5s";
        selectionScreen.style.opacity = "0";

        setTimeout(() => {
            selectionScreen.style.display = 'none';
            if (window.gameMode === 'pvp') {
                initiateMatchmaking(); 
            } else {
                window.transitionToGame();
            }
        }, 500);
    }, 400);
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

window.transitionToLobby = function(skipAnim = false) {
    console.log("Voltando ao Saguão. SkipAnim:", skipAnim);
    
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    document.body.classList.remove('force-landscape');
    
    // Força o fechamento da tela de decks
    const ds = document.getElementById('deck-selection-screen');
    if(ds) {
        ds.style.opacity = '0';
        ds.style.pointerEvents = 'none';
        ds.style.display = 'none'; 
        ds.classList.remove('active');
    }

    if (skipAnim) {
        window.goToLobby(false);
    } else {
        const transScreen = document.getElementById('transition-overlay');
        const transText = transScreen.querySelector('.trans-text');
        if(transText) transText.innerText = "RETORNANDO AO SAGUÃO...";
        if(transScreen) transScreen.classList.add('active');
        
        setTimeout(() => {
            window.goToLobby(false); 
            setTimeout(() => {
                if(transScreen) transScreen.classList.remove('active');
            }, 1000); 
        }, 500);
    }
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
    
    try {
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
        
        // Ranking Listener
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
    } catch(e) {
        console.error("Erro ao carregar lobby:", e);
    }

    window.showScreen('lobby-screen');
    document.getElementById('end-screen').classList.remove('visible'); 
};


// ======================================================
// MATCHMAKING CLÁSSICO E ROBUSTO (POLLING)
// ======================================================

// Botão PvE (Treino)
window.startPvE = function() {
    window.gameMode = 'pve'; 
    window.playNavSound();
    window.openDeckSelector(); 
};

// Botão PvP
window.startPvPSearch = function() {
    if (!currentUser) return; 
    window.gameMode = 'pvp'; 
    window.playNavSound();
    window.openDeckSelector(); 
};

async function initiateMatchmaking() {
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'flex';
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE...";
    document.querySelector('.mm-title').style.color = "var(--gold)";
    document.querySelector('.radar-spinner').style.borderColor = "rgba(255, 215, 0, 0.3)";
    document.querySelector('.radar-spinner').style.animation = "spin 1s linear infinite";
    document.querySelector('.cancel-btn').style.display = "block";
    
    // Inicia Timer Visual Imediatamente
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
        // 1. Cria ou Atualiza o Ticket na Fila
        myQueueRef = doc(collection(db, "queue")); // Gera ID novo sempre
        // Para evitar lixo, podemos usar o UID como ID do documento
        myQueueRef = doc(db, "queue", currentUser.uid);

        await setDoc(myQueueRef, {
            uid: currentUser.uid,
            name: currentUser.displayName,
            deck: window.currentDeck, 
            score: 0, 
            timestamp: Date.now(),
            matchId: null
        });

        // 2. Ouve o próprio ticket para ver se alguém me escolheu
        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.matchId) {
                    enterMatch(data.matchId); 
                }
            }
        });

        // 3. Inicia o Loop de Busca Ativa (Polling)
        if (matchmakingInterval) clearInterval(matchmakingInterval);
        matchmakingInterval = setInterval(checkForOpponents, 2000); 
        checkForOpponents(); // Tenta uma vez na hora

    } catch (e) {
        console.error("Erro no Matchmaking:", e);
        cancelPvPSearch();
    }
}

async function checkForOpponents() {
    try {
        // Busca na fila
        const queueRef = collection(db, "queue");
        const q = query(queueRef, limit(20)); // Pega os primeiros 20
        const querySnapshot = await getDocs(q);

        let targetDoc = null;
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Regras: Não sou eu, não tem matchId, não cancelou
            if (data.uid !== currentUser.uid && !data.matchId && !data.cancelled) {
                if (!targetDoc) targetDoc = docSnap;
            }
        });

        if (targetDoc) {
            console.log("Encontrei oponente livre:", targetDoc.data().name);
            
            // Para de buscar para não parear com 2 pessoas
            if (matchmakingInterval) clearInterval(matchmakingInterval);

            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            
            // 1. Cria a partida no banco
            const p1DeckCards = generateShuffledDeck();
            const p2DeckCards = generateShuffledDeck();

            await createMatchDocument(
                matchId, 
                currentUser.uid, targetDoc.data().uid, 
                currentUser.displayName, targetDoc.data().name,
                window.currentDeck, targetDoc.data().deck,
                p1DeckCards, p2DeckCards
            );

            // 2. Atualiza o oponente (ele vai ver pelo listener dele)
            await updateDoc(targetDoc.ref, { matchId: matchId });

            // 3. Atualiza a mim mesmo (eu vou ver pelo meu listener)
            if (myQueueRef) {
                await updateDoc(myQueueRef, { matchId: matchId });
            }
        }
    } catch (e) {
        console.log("Buscando...", e);
    }
}

async function createMatchDocument(matchId, p1Id, p2Id, p1Name, p2Name, p1DeckType, p2DeckType, p1DeckCards, p2DeckCards) {
    const matchRef = doc(db, "matches", matchId);
    
    const cleanName1 = p1Name ? p1Name.split(' ')[0].toUpperCase() : "JOGADOR 1";
    const cleanName2 = p2Name ? p2Name.split(' ')[0].toUpperCase() : "JOGADOR 2";
    const d1Type = p1DeckType || 'knight';
    const d2Type = p2DeckType || 'knight';

    await setDoc(matchRef, {
        player1: { 
            uid: p1Id, name: cleanName1, deckType: d1Type, hp: 6, 
            status: 'selecting', hand: [], deck: p1DeckCards, xp: [] 
        },
        player2: { 
            uid: p2Id, name: cleanName2, deckType: d2Type, hp: 6, 
            status: 'selecting', hand: [], deck: p2DeckCards, xp: [] 
        },
        turn: 1,
        status: 'playing', 
        createdAt: Date.now()
    });
}

// --- CANCELAR BUSCA ---
window.cancelPvPSearch = async function() {
    window.playNavSound();
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'none';

    // Para todos os loops
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (matchmakingInterval) clearInterval(matchmakingInterval);
    if (queueListener) { queueListener(); queueListener = null; }
    
    if (myQueueRef) {
        try { await deleteDoc(myQueueRef); } catch(e){} // Remove da fila
        myQueueRef = null;
    }
    
    console.log("Busca cancelada.");
    window.transitionToLobby(true); 
};

// --- ENTRAR NA PARTIDA ---
async function enterMatch(matchId) {
    console.log("ENTRANDO NA PARTIDA:", matchId);
    
    if (queueListener) queueListener();
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (matchmakingInterval) clearInterval(matchmakingInterval);

    // Pequeno delay pra garantir sincronia
    await new Promise(r => setTimeout(r, 500));

    const matchRef = doc(db, "matches", matchId);
    let matchSnap = await getDoc(matchRef);

    // Retry se não achar de primeira
    if(!matchSnap.exists()) {
        console.warn("Partida não encontrada, tentando de novo...");
        await new Promise(r => setTimeout(r, 1000));
        matchSnap = await getDoc(matchRef);
    }

    if(matchSnap.exists()) {
        const data = matchSnap.data();
        window.pvpStartData = data; 

        if(data.player1.uid === currentUser.uid) window.myRole = 'player1';
        else window.myRole = 'player2';

        document.querySelector('.mm-title').innerText = "PARTIDA ENCONTRADA!";
        document.querySelector('.mm-title').style.color = "#2ecc71";
        document.querySelector('.radar-spinner').style.borderColor = "#2ecc71";
        document.querySelector('.radar-spinner').style.animation = "none";
        document.querySelector('.cancel-btn').style.display = "none";

        setTimeout(() => {
            const mmScreen = document.getElementById('matchmaking-screen');
            mmScreen.style.display = 'none';
            window.currentMatchId = matchId;
            window.transitionToGame(); 
        }, 1500);
    } else {
        console.error("ERRO: Partida inválida.");
        window.cancelPvPSearch();
    }
}

// --- FUNÇÃO DO JOGO EM SI (START) ---
function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    window.isResolvingTurn = false; 
    window.pvpSelectedCardIndex = null; 
    startCinematicLoop(); 
    window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand');
    if (handEl) {
        handEl.innerHTML = '';
        handEl.classList.add('preparing'); 
    }
    
    if (window.gameMode === 'pvp' && window.pvpStartData) {
        if (window.myRole === 'player1') {
            resetUnit(player, window.pvpStartData.player1.deck, 'player1');
            resetUnit(monster, window.pvpStartData.player2.deck, 'player2');
        } else {
            resetUnit(player, window.pvpStartData.player2.deck, 'player2');
            resetUnit(monster, window.pvpStartData.player1.deck, 'player1');
        }
    } else {
        resetUnit(player, null, 'pve'); 
        resetUnit(monster, null, 'pve'); 
    }

    turnCount = 1; 
    playerHistory = [];
    drawCardLogic(monster, 6); 
    drawCardLogic(player, 6); 
    updateUI(); 
    dealAllInitialCards();

    if(window.gameMode === 'pvp') {
        startPvPListener();
    }
}

// --- LOGICA DE EVENTOS (BOTÕES, ETC) ---
window.onload = function() {
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
        btnSound.onclick = null; 
        btnSound.addEventListener('click', (e) => {
            e.stopPropagation(); 
            window.toggleMute();
        });
    }

    // Botão Voltar do Deck (Força bruta)
    const deckScreen = document.getElementById('deck-selection-screen');
    if (deckScreen) {
        let backBtn = deckScreen.querySelector('.btn-back');
        if (!backBtn) backBtn = deckScreen.querySelector('.circle-btn');
        
        if (backBtn) {
            backBtn.style.zIndex = "9999"; 
            backBtn.style.pointerEvents = "all"; 
            backBtn.onclick = function(e) {
                e.preventDefault(); e.stopPropagation();
                window.playNavSound();
                window.transitionToLobby(true); 
            };
        }
    }
};

// Listener global para garantir cliques
document.addEventListener('click', function(e) {
    const target = e.target.closest('#deck-selection-screen .circle-btn, #deck-selection-screen .btn-back, .return-btn');
    if (target) {
        e.stopPropagation();
        window.playNavSound();
        window.transitionToLobby(true); 
    }
});

// Outras funções utilitárias do jogo (mantidas da versão estável)
window.registrarVitoriaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            let pts = (modo === 'pvp') ? 8 : 1; 
            await updateDoc(userRef, { totalWins: (data.totalWins || 0) + 1, score: (data.score || 0) + pts });
        }
    } catch(e) {}
};

window.registrarDerrotaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            let pts = (modo === 'pvp') ? 8 : 3; 
            let novoScore = Math.max(0, (data.score || 0) - pts);
            await updateDoc(userRef, { score: novoScore });
        }
    } catch(e) {}
};

// ... Restante das funções visuais (Effects, UI) ...
// (Para economizar espaço, as funções visuais como triggerDamageEffect, animateFly, etc 
// são as mesmas da versão estável que você já tem. Se precisar delas coladas aqui, me avise,
// mas o foco era o Auth + Matchmaking que está completo acima).

// Inicia
preloadGame();
