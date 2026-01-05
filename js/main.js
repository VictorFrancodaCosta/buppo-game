// ARQUIVO: js/main.js (VERSÃO FINAL: FIX LOAD SCREEN + TURNOS + ABANDONO)

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, increment, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Variável para controlar o loop de busca de partida
let searchInterval = null;

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

const MusicController = {
    currentTrackId: null,
    fadeTimer: null,
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
                return; // Já está tocando a música certa, não faz nada (SEM CORTES)
            } 
            
            // Troca de música (Fade Out da antiga)
            const maxVol = 0.5 * window.masterVol;
            if (this.currentTrackId && audios[this.currentTrackId]) {
                const oldAudio = audios[this.currentTrackId];
                this.fadeOut(oldAudio);
            }
            
            // Fade In da nova
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

// --- CONTROLE DE TELA CHEIA E ROTAÇÃO ---
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

(function createRotateOverlay() {
    if (!document.getElementById('rotate-overlay')) {
        const div = document.createElement('div');
        div.id = 'rotate-overlay';
        div.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 20px;">↻</div>
            <div>GIRE O CELULAR<br>PARA JOGAR</div>
        `;
        document.body.appendChild(div);
    }
})();

// --- SELEÇÃO DE DECK ---
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
        MusicController.play('bgm-loop'); // TROCA DE MÚSICA AQUI
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

// CORREÇÃO CRÍTICA: Transição para o Saguão (SEM PARAR MÚSICA)
window.transitionToLobby = function(skipAnim = false) {
    console.log("EXECUTANDO: Voltar ao Saguão... Pular Animação?", skipAnim);
    
    // 1. Limpeza Geral
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    document.body.classList.remove('force-landscape');
    
    // 2. Esconder a tela de Deck imediatamente
    const ds = document.getElementById('deck-selection-screen');
    if(ds) {
        ds.style.opacity = '0';
        ds.style.pointerEvents = 'none';
        ds.style.display = 'none'; 
        ds.classList.remove('active');
    }

    // 3. Lógica de Navegação
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
    
    // O MusicController vai checar: se 'bgm-menu' já toca, ele mantém. Se não (veio do jogo), ele troca.
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

// === NOVO: COMMITAR O TURNO AO DB ===
async function commitTurnToDB(pAct) {
    if (!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    
    try {
        // Busca estado atual para append seguro
        const matchSnap = await getDoc(matchRef);
        if (!matchSnap.exists()) return;
        const data = matchSnap.data();
        
        let xpArray, xpField;
        if (window.myRole === 'player1') {
            xpArray = data.player1.xp || [];
            xpField = 'player1.xp';
        } else {
            xpArray = data.player2.xp || [];
            xpField = 'player2.xp';
        }

        // Adiciona a carta jogada (pAct)
        xpArray.push(pAct);
        
        await updateDoc(matchRef, {
            [xpField]: xpArray
        });
        console.log(`Turno commitado: ${pAct} adicionada ao XP no DB.`);
        
    } catch (e) {
        console.error("Erro ao commitar turno ao DB:", e);
    }
}

// CORREÇÃO CRÍTICA: LISTENER AGORA CONTROLA A ANIMAÇÃO DO INIMIGO
function startPvPListener() {
    if(!window.currentMatchId) return;
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    const matchRef = doc(db, "matches", window.currentMatchId);
    let namesUpdated = false;
    console.log("Iniciando escuta PvP na partida:", window.currentMatchId);
    
    // Helper para garantir role
    const ensureMyRole = (data) => {
        if (window.myRole) return;
        if(data.player1.uid === currentUser.uid) window.myRole = 'player1';
        else window.myRole = 'player2';
    };

    window.pvpUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();
        ensureMyRole(matchData);

        // 1. CHECAGEM DE ABANDONO (PRIORIDADE MÁXIMA)
        if (matchData.status === 'abandoned') {
            // Se eu não sou quem abandonou, eu ganhei
            if (matchData.abandonedBy && currentUser && matchData.abandonedBy !== currentUser.uid) {
                console.log("Oponente desconectou. Decretando vitória.");
                monster.hp = 0;
                updateUI();
                isProcessing = true;
                MusicController.stopCurrent();
                setTimeout(() => {
                    const title = document.getElementById('end-title');
                    title.innerText = "VITÓRIA";
                    title.className = "win-theme";
                    showCenterText("OPONENTE DESISTIU!", "#ffd700");
                    playSound('sfx-win');
                    if(window.registrarVitoriaOnline) window.registrarVitoriaOnline('pvp');
                    document.getElementById('end-screen').classList.add('visible');
                    // Desliga listener para evitar conflitos
                    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
                }, 500);
            }
            return; // Sai da função, nada mais importa
        }

        if (!namesUpdated && matchData.player1 && matchData.player2) {
            let myName, enemyName;
            if (window.myRole === 'player1') {
                myName = matchData.player1.name;
                enemyName = matchData.player2.name;
            } else {
                myName = matchData.player2.name;
                enemyName = matchData.player1.name;
            }
            const pNameEl = document.querySelector('#p-stats-cluster .unit-name');
            const mNameEl = document.querySelector('#m-stats-cluster .unit-name');
            if(pNameEl) pNameEl.innerText = myName;
            if(mNameEl) mNameEl.innerText = enemyName;
            namesUpdated = true; 
        }

        // 2. CHECAGEM DE TURNO COMPLETO (PRIORIDADE ALTA)
        if (matchData.p1Move && matchData.p2Move) {
            if (!window.isResolvingTurn) {
                console.log("Turno pronto! Resolvendo...");
                resolvePvPTurn(matchData.p1Move, matchData.p2Move, matchData.p1Disarm, matchData.p2Disarm);
            }
            // Retorna para evitar que sync de XP ocorra DURANTE resolução
            return; 
        }
        
        // 3. SYNC EXTRA: ATUALIZA VISUALMENTE XP
        try {
            if (window.gameMode === 'pvp' && window.myRole) {
                const myData = matchData[window.myRole];
                const enemyRole = (window.myRole === 'player1') ? 'player2' : 'player1';
                const enemyData = matchData[enemyRole];
                
                // --- SYNC MEU XP (VOCÊ) ---
                if (myData && myData.xp && myData.xp.length > player.xp.length) {
                    const newCardsStartIndex = player.xp.length;
                    for (let i = newCardsStartIndex; i < myData.xp.length; i++) {
                        const newCard = myData.xp[i];
                        console.log(`[LISTENER-SELF] Ganhei XP do DB: ${newCard}`);
                        animateFly('p-deck-container', 'p-xp', newCard, () => {
                             triggerXPGlow('p');
                        }, false, false, true);
                    }
                    player.xp = myData.xp;
                    if(myData.deck) player.deck = [...myData.deck]; 
                    updateUI();
                }

                // --- SYNC XP INIMIGO ---
                if (enemyData && enemyData.xp && enemyData.xp.length > monster.xp.length) {
                    const newCardsStartIndex = monster.xp.length;
                    for (let i = newCardsStartIndex; i < enemyData.xp.length; i++) {
                        const newCard = enemyData.xp[i];
                        console.log(`[LISTENER-ENEMY] Inimigo ganhou XP: ${newCard}`);
                        animateFly('m-deck-container', 'm-xp', newCard, () => {
                             triggerXPGlow('m');
                        }, false, false, false);
                    }
                    monster.xp = enemyData.xp;
                    if(enemyData.deck) monster.deck = [...enemyData.deck];
                    updateUI();
                    
                    // IMPORTANTE: VERIFICA SE O INIMIGO UPOU DE NÍVEL PELO LISTENER
                    checkLevelUp(monster, () => {}); 
                }
            }
        } catch (syncError) {
            console.error("Erro na sincronização visual (ignorado para não travar jogo):", syncError);
        }
    });
}

// === NOVO: ATUALIZA O DB APÓS LEVEL UP (PARA LIMPAR XP NO BANCO) ===
async function syncLevelUpToDB(u) {
    if (!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    
    // Determina quais campos atualizar
    let updates = {};
    let targetRole = window.myRole; 
    
    if (targetRole === 'player1') {
        updates['player1.xp'] = []; // Limpa XP
        updates['player1.deck'] = u.deck; // Salva baralho embaralhado
        updates['player1.lvl'] = u.lvl; // Salva nível
    } else {
        updates['player2.xp'] = [];
        updates['player2.deck'] = u.deck;
        updates['player2.lvl'] = u.lvl;
    }
    
    try {
        console.log("Sincronizando Level Up ao DB...", updates);
        await updateDoc(matchRef, updates);
    } catch(e) {
        console.error("Erro ao sincronizar Level Up:", e);
    }
}

// --- NOVA FUNÇÃO: Sincroniza efeito TREINAR via Banco de Dados ---
async function applyTrainEffectPvP(matchId, myRole) {
    const matchRef = doc(db, "matches", matchId);
    try {
        const matchSnap = await getDoc(matchRef);
        if (!matchSnap.exists()) return;
        const data = matchSnap.data();

        let deckArray, xpArray, deckField, xpField;

        if (myRole === 'player1') {
            deckArray = data.player1.deck || []; 
            xpArray = data.player1.xp || [];
            deckField = 'player1.deck';
            xpField = 'player1.xp'; 
        } else {
            deckArray = data.player2.deck || [];
            xpArray = data.player2.xp || [];
            deckField = 'player2.deck';
            xpField = 'player2.xp';
        }

        if (deckArray.length > 0) {
            const cardMoved = deckArray.pop(); 
            console.log(`Efeito TREINAR (DB): Movendo ${cardMoved} para XP.`);
            xpArray.push(cardMoved);
            
            await updateDoc(matchRef, {
                [deckField]: deckArray,
                [xpField]: xpArray
            });
        }
    } catch (e) {
        console.error("Erro ao aplicar efeito TREINAR no DB:", e);
    }
}

async function resolvePvPTurn(p1Move, p2Move, p1Disarm, p2Disarm) {
    if (window.isResolvingTurn) return; 
    window.isResolvingTurn = true; 
    isProcessing = true; 
    
    const centerTxt = document.querySelector('.center-text');
    if(centerTxt) centerTxt.remove();

    let myMove, enemyMove, myDisarmChoice, enemyDisarmChoice;
    if (window.myRole === 'player1') {
        myMove = p1Move; enemyMove = p2Move;
        myDisarmChoice = p1Disarm; enemyDisarmChoice = p2Disarm;
    } else {
        myMove = p2Move; enemyMove = p1Move;
        myDisarmChoice = p2Disarm; enemyDisarmChoice = p1Disarm;
    }

    try {
        if (window.pvpSelectedCardIndex === null || window.pvpSelectedCardIndex === undefined) {
            window.pvpSelectedCardIndex = player.hand.indexOf(myMove);
        }
        const handContainer = document.getElementById('player-hand');
        let myCardEl = null;
        let startRect = null;

        if (handContainer) {
            if (window.pvpSelectedCardIndex > -1 && handContainer.children[window.pvpSelectedCardIndex]) {
                myCardEl = handContainer.children[window.pvpSelectedCardIndex];
            } else {
                const handCards = Array.from(handContainer.children);
                if(handCards.length > 0) myCardEl = handCards[0]; 
            }
        }
        if (myCardEl) {
            startRect = myCardEl.getBoundingClientRect();
            myCardEl.classList.remove('card-selected');
            myCardEl.style.opacity = '0';
        }
        
        if (window.pvpSelectedCardIndex > -1) {
            player.hand.splice(window.pvpSelectedCardIndex, 1);
        } else {
            const idx = player.hand.indexOf(myMove);
            if(idx > -1) player.hand.splice(idx, 1);
        }
        playerHistory.push(myMove);

        animateFly(startRect || 'player-hand', 'p-slot', myMove, () => {
            renderTable(myMove, 'p-slot', true);
        }, false, true, true);

        const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 };
        animateFly(opponentHandOrigin, 'm-slot', enemyMove, () => {
            renderTable(enemyMove, 'm-slot', false);
        }, false, true, false);

    } catch (e) {
        console.error("Erro na preparação visual (ignorado):", e);
    }

    setTimeout(() => {
        try {
            if (window.myRole === 'player1') {
                setTimeout(() => {
                    const matchRef = doc(db, "matches", window.currentMatchId);
                    updateDoc(matchRef, {
                        p1Move: null, p2Move: null,
                        p1Disarm: null, p2Disarm: null,
                        turn: increment(1) 
                    }).then(() => console.log("Turno limpo no DB."))
                      .catch(err => console.error("Erro ao limpar turno:", err));
                }, 4000); 
            }
            resolveTurn(myMove, enemyMove, myDisarmChoice, enemyDisarmChoice);
        } catch (error) {
            console.error("CRASH NO RESOLVE TURN:", error);
            updateUI();
            window.isResolvingTurn = false;
            isProcessing = false;
        } 
        
        setTimeout(() => {
            window.pvpSelectedCardIndex = null;
            window.isResolvingTurn = false;
            if (isProcessing) isProcessing = false;
        }, 4500);

    }, 600);
}

function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    let pDmg = 0, mDmg = 0;
    
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train');
    if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');

    if(mAct === 'ATAQUE') { pDmg += monster.lvl; }
    if(pAct === 'ATAQUE') { mDmg += player.lvl; }
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') { mDmg += (1 + player.bonusBlock); } }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') { pDmg += (1 + monster.bonusBlock); } }

    let clash = false;
    let pBlocks = (pAct === 'BLOQUEIO' && mAct === 'ATAQUE'); 
    let mBlocks = (mAct === 'BLOQUEIO' && pAct === 'ATAQUE'); 
    
    if(pBlocks) { clash = true; triggerBlockEffect(true); }
    else if(mBlocks) { clash = true; triggerBlockEffect(false); }

    let nextPlayerDisabled = null; let nextMonsterDisabled = null;
    if(mAct === 'DESARMAR') { if(mDisarmTarget) nextPlayerDisabled = mDisarmTarget; else nextPlayerDisabled = 'ATAQUE'; }
    if(pAct === 'DESARMAR') { nextMonsterDisabled = pDisarmChoice; }
    if(pAct === 'DESARMAR' && mAct === 'DESARMAR') { nextPlayerDisabled = null; nextMonsterDisabled = null; showCenterText("ANULADO", "#aaa"); }

    player.disabled = nextPlayerDisabled; monster.disabled = nextMonsterDisabled;
    if(pDmg >= 4 || mDmg >= 4) triggerCritEffect();

    if(pDmg > 0) { 
        player.hp -= pDmg; 
        showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); 
        let soundOn = !(clash && mAct === 'BLOQUEIO'); 
        if (!mBlocks) { triggerDamageEffect(true, soundOn); }
    }

    if(mDmg > 0) { 
        monster.hp -= mDmg; 
        showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); 
        let soundOn = !(clash && pAct === 'BLOQUEIO'); 
        triggerDamageEffect(false, soundOn); 
    }
    
    updateUI();
    let pDead = player.hp <= 0, mDead = monster.hp <= 0;
    
    if(!pDead && pAct === 'DESCANSAR') { let healAmount = (pDmg === 0) ? 3 : 2; player.hp = Math.min(player.maxHp, player.hp + healAmount); showFloatingText('p-lvl', `+${healAmount} HP`, "#55efc4"); triggerHealEffect(true); playSound('sfx-heal'); }
    if(!mDead && mAct === 'DESCANSAR') { let healAmount = (mDmg === 0) ? 3 : 2; monster.hp = Math.min(monster.maxHp, monster.hp + healAmount); triggerHealEffect(false); playSound('sfx-heal'); }

    function handleExtraXP(u) { 
        if (window.gameMode === 'pvp' && window.currentMatchId) {
             if (u === player) {
                 if(u.deck.length > 0) {
                     applyTrainEffectPvP(window.currentMatchId, window.myRole);
                 }
             }
        } 
        else {
            if(u.deck.length > 0) { 
                let card = u.deck.pop(); 
                animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { 
                    u.xp.push(card); triggerXPGlow(u.id); updateUI(); 
                }, false, false, (u.id === 'p')); 
            } 
        }
    }

    if(!pDead && pAct === 'TREINAR') handleExtraXP(player); if(!mDead && mAct === 'TREINAR') handleExtraXP(monster);
    if(!pDead && pAct === 'ATAQUE' && mAct === 'DESCANSAR') handleExtraXP(player); if(!mDead && mAct === 'ATAQUE' && pAct === 'DESCANSAR') handleExtraXP(monster);

    setTimeout(() => {
        animateFly('p-slot', 'p-xp', pAct, () => { 
            if (window.gameMode === 'pvp' && !pDead) {
                commitTurnToDB(pAct); 
            } else if(!pDead) { 
                player.xp.push(pAct); 
                triggerXPGlow('p'); 
                updateUI(); 
            } 
            
            checkLevelUp(player, () => { 
                if(!pDead) drawCardAnimated(player, 'p-deck-container', 'player-hand', () => { drawCardLogic(player, 1); turnCount++; updateUI(); isProcessing = false; }); 
            }); 
        }, false, false, true);

        animateFly('m-slot', 'm-xp', mAct, () => { 
            if (window.gameMode !== 'pvp' && !mDead) { 
                monster.xp.push(mAct); 
                triggerXPGlow('m'); 
                updateUI(); 
            } 
            checkLevelUp(monster, () => { 
                if(!mDead) drawCardLogic(monster, 1); 
                checkEndGame(); 
            }); 
        }, false, false, false);
        
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

function checkLevelUp(u, doneCb) {
    if(u.xp.length >= 5) {
        let xpContainer = document.getElementById(u.id + '-xp'); 
        let minis = Array.from(xpContainer.getElementsByClassName('xp-mini'));
        minis.forEach(realCard => {
            let rect = realCard.getBoundingClientRect(); 
            let clone = document.createElement('div'); 
            clone.className = 'xp-anim-clone';
            clone.style.left = rect.left + 'px'; 
            clone.style.top = rect.top + 'px'; 
            clone.style.width = rect.width + 'px'; 
            clone.style.height = rect.height + 'px'; 
            clone.style.backgroundImage = realCard.style.backgroundImage;
            if (u.id === 'p') clone.classList.add('xp-fly-up'); else clone.classList.add('xp-fly-down');
            document.body.appendChild(clone);
        });
        minis.forEach(m => m.style.opacity = '0');

        setTimeout(() => {
            let counts = {}; 
            u.xp.forEach(x => counts[x] = (counts[x]||0)+1); 
            let triggers = []; 
            for(let k in counts) if(counts[k] >= 3 && k !== 'DESCANSAR') triggers.push(k);
            
            processMasteries(u, triggers, () => {
                let lvlEl = document.getElementById(u.id+'-lvl'); 
                u.lvl++; 
                lvlEl.classList.add('level-up-anim'); 
                triggerLevelUpVisuals(u.id); 
                playSound('sfx-levelup'); 
                setTimeout(() => lvlEl.classList.remove('level-up-anim'), 1000);

                u.xp.forEach(x => u.deck.push(x)); 
                u.xp = []; 
                
                if (window.gameMode === 'pvp' && window.currentMatchId) {
                    let s = stringToSeed(window.currentMatchId + u.originalRole) + u.lvl;
                    shuffle(u.deck, s);
                    if (u === player) {
                        syncLevelUpToDB(u);
                    }
                } else {
                    shuffle(u.deck);
                }

                let clones = document.getElementsByClassName('xp-anim-clone'); 
                while(clones.length > 0) clones[0].remove();
                updateUI(); 
                doneCb();
            });
        }, 1000); 
    } else { doneCb(); }
}

function triggerLevelUpVisuals(unitId) {
    let clusterId = (unitId === 'p') ? 'p-stats-cluster' : 'm-stats-cluster';
    let cluster = document.getElementById(clusterId);
    if(!cluster) return;
    const text = document.createElement('div');
    text.innerText = "LEVEL UP!";
    text.className = 'levelup-text'; 
    if (unitId === 'p') { text.classList.add('lvl-anim-up'); } else { text.classList.add('lvl-anim-down'); }
    cluster.appendChild(text);
    setTimeout(() => { text.remove(); }, 2000);
}

function processMasteries(u, triggers, cb) {
    if(triggers.length === 0) { cb(); return; } let type = triggers.shift();
    if(type === 'TREINAR' && u.id === 'p') { let opts = [...new Set(u.xp.filter(x => x !== 'TREINAR'))]; if(opts.length > 0) window.openModal("MAESTRIA SUPREMA", "Copiar qual maestria?", opts, (c) => { if(c === 'DESARMAR') { window.openModal("MAESTRIA TÁTICA", "Bloquear qual ação?", ACTION_KEYS, (targetAction) => { monster.disabled = targetAction; showFloatingText('m-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }); } else { applyMastery(u,c); processMasteries(u, triggers, cb); } }); else processMasteries(u, triggers, cb); } 
    else if(type === 'DESARMAR' && u.id === 'p') { window.openModal("MAESTRIA TÁTICA", "Bloquear qual ação?", ACTION_KEYS, (c) => { monster.disabled = c; showFloatingText('m-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }); } 
    else if(type === 'TREINAR' && u.id === 'm') {
        let opts = [...new Set(u.xp.filter(x => x !== 'TREINAR' && x !== 'DESCANSAR'))]; 
        if(opts.length > 0) {
            let choice = opts[0];
            if(u.hp <= 4 && opts.includes('DESCANSAR')) choice = 'DESCANSAR';
            else if(opts.includes('ATAQUE')) choice = 'ATAQUE';
            else if(opts.includes('BLOQUEIO')) choice = 'BLOQUEIO';
            if(choice === 'DESARMAR') { let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); } else { applyMastery(u, choice); }
        }
        processMasteries(u, triggers, cb);
    }
    else if(type === 'DESARMAR' && u.id === 'm') { let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }
    else { applyMastery(u, type); processMasteries(u, triggers, cb); }
}
function applyMastery(u, k) { if(k === 'ATAQUE') { u.bonusAtk++; let target = (u === player) ? monster : player; target.hp -= u.bonusAtk; showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675"); triggerDamageEffect(u !== player); checkEndGame(); } if(k === 'BLOQUEIO') u.bonusBlock++; if(k === 'DESCANSAR') { u.maxHp++; showFloatingText(u.id+'-hp-txt', "+1 MAX", "#55efc4"); } updateUI(); }
function drawCardLogic(u, qty) { for(let i=0; i<qty; i++) if(u.deck.length > 0) u.hand.push(u.deck.pop()); u.hand.sort(); }

function animateFly(startId, endId, cardKey, cb, initialDeal = false, isToTable = false, isPlayer = false) {
    let s; if (typeof startId === 'string') { let el = document.getElementById(startId); if (!el) s = { top: 0, left: 0, width: 0, height: 0 }; else s = el.getBoundingClientRect(); } else { s = startId; }
    let e = { top: 0, left: 0 }; let destEl = document.getElementById(endId); if(destEl) e = destEl.getBoundingClientRect();

    const fly = document.createElement('div');
    fly.className = `card flying-card ${CARDS_DB[cardKey].color}`;
    
    let imgUrl = getCardArt(cardKey, isPlayer);
    fly.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div>`;
    if (isToTable) fly.classList.add('card-bounce');

    if(typeof startId !== 'string' && s.width > 0) { fly.style.width = s.width + 'px'; fly.style.height = s.height + 'px'; } 
    else { let w = window.innerWidth < 768 ? '84px' : '105px'; let h = window.innerWidth < 768 ? '120px' : '150px'; fly.style.width=w; fly.style.height=h; }

    let tableW = window.innerWidth < 768 ? '110px' : '180px';
    let tableH = window.innerWidth < 768 ? '170px' : '260px';

    fly.style.top=s.top+'px'; fly.style.left=s.left+'px';
    if(endId.includes('xp')) fly.style.transform='scale(0.3)';
    document.body.appendChild(fly); fly.offsetHeight;
    
    if(isToTable) { fly.style.width=tableW; fly.style.height=tableH; }
    fly.style.top=e.top+'px'; fly.style.left=e.left+'px';
    setTimeout(() => { fly.remove(); if(cb) cb(); }, 250);
}

function drawCardAnimated(unit, deckId, handId, cb) { 
    if(cb) cb(); 
}

function renderTable(key, slotId, isPlayer = false) { 
    let el = document.getElementById(slotId); 
    el.innerHTML = ''; 
    let card = document.createElement('div'); 
    card.className = `card ${CARDS_DB[key].color} card-on-table`; 
    let imgUrl = getCardArt(key, isPlayer);
    card.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div>`; 
    el.appendChild(card); 
}

function updateUI() { updateUnit(player); updateUnit(monster); document.getElementById('turn-txt').innerText = "TURNO " + turnCount; }

function updateUnit(u) {
    document.getElementById(u.id+'-lvl').firstChild.nodeValue = u.lvl;
    document.getElementById(u.id+'-hp-txt').innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
    let hpPct = (Math.max(0,u.hp)/u.maxHp)*100;
    let hpFill = document.getElementById(u.id+'-hp-fill'); hpFill.style.width = hpPct + '%';
    if(hpPct > 66) hpFill.style.background = "#4cd137"; else if(hpPct > 33) hpFill.style.background = "#fbc531"; else hpFill.style.background = "#e84118";
    document.getElementById(u.id+'-deck-count').innerText = u.deck.length;
    
    if(u === player) {
        let deckImgEl = document.getElementById('p-deck-img');
        if(window.currentDeck === 'mage') {
            deckImgEl.src = MAGE_ASSETS.DECK_IMG;
        } else {
            deckImgEl.src = 'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png';
        }
    }

    if(u===player) {
        let hc=document.getElementById('player-hand'); hc.innerHTML='';
        u.hand.forEach((k,i)=>{
            let c=document.createElement('div'); c.className=`card hand-card ${CARDS_DB[k].color}`;
            c.style.setProperty('--flare-col', CARDS_DB[k].fCol);
            if(u.disabled===k) c.classList.add('disabled-card');
            
            if(window.isMatchStarting) {
                c.style.opacity = '0';
            } else {
                c.style.opacity = '1';
            }

            let lethalType = checkCardLethality(k); 
            let flaresHTML = ''; for(let f=1; f<=25; f++) flaresHTML += `<div class="flare-spark fs-${f}"></div>`;
            
            let imgUrl = getCardArt(k, true);
            c.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div><div class="flares-container">${flaresHTML}</div>`;
            
            c.onclick=()=>onCardClick(i); bindFixedTooltip(c,k); 
            c.onmouseenter = (e) => { bindFixedTooltip(c,k).onmouseenter(e); document.body.classList.add('focus-hand'); document.body.classList.add('cinematic-active'); if(lethalType) { isLethalHover = true; document.body.classList.add('tension-active'); } playSound('sfx-hover'); };
            c.onmouseleave = (e) => { tt.style.display='none'; document.body.classList.remove('focus-hand'); document.body.classList.remove('cinematic-active'); document.body.classList.remove('tension-active'); isLethalHover = false; };
            hc.appendChild(c); apply3DTilt(c, true);
        });
    }
    
    let xc=document.getElementById(u.id+'-xp'); xc.innerHTML='';
    u.xp.forEach(k=>{ 
        let d=document.createElement('div'); 
        d.className='xp-mini'; 
        let imgUrl = getCardArt(k, (u === player));
        d.style.backgroundImage = `url('${imgUrl}')`; 
        d.onmouseenter = () => { document.body.classList.add('focus-xp'); playSound('sfx-hover'); }; 
        d.onmouseleave = () => { document.body.classList.remove('focus-xp'); }; 
        xc.appendChild(d); 
    });
    
    let mc=document.getElementById(u.id+'-masteries'); mc.innerHTML='';
    if(u.bonusAtk>0) addMI(mc, 'ATAQUE', u.bonusAtk, '#e74c3c', u.id); 
    if(u.bonusBlock>0) addMI(mc, 'BLOQUEIO', u.bonusBlock, '#00cec9', u.id); 
}

function bindMasteryTooltip(el, key, value, ownerId) {
    return {
        onmouseenter: (e) => {
            let db=CARDS_DB[key];
            document.getElementById('tt-title').innerHTML = key; 
            document.getElementById('tt-content').innerHTML = `<span class='tt-label' style='color:var(--accent-blue)'>Bônus Atual</span><span class='tt-val'>+${value}</span><span class='tt-label' style='color:var(--accent-red)'>Efeito</span><span class='tt-val'>${db.mastery}</span>`;
            tt.style.display = 'block';
            tt.classList.remove('tooltip-anim-up'); tt.classList.remove('tooltip-anim-down'); 
            void tt.offsetWidth; 
            let rect = el.getBoundingClientRect();
            if(ownerId === 'p') {
                tt.classList.add('tooltip-anim-up');
                tt.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
                tt.style.top = 'auto';
            } else {
                tt.classList.add('tooltip-anim-down');
                tt.style.top = (rect.bottom + 10) + 'px';
                tt.style.bottom = 'auto';
            }
            tt.style.left = (rect.left + rect.width/2) + 'px';
            tt.style.transform = "translateX(-50%)"; 
        }
    };
}

function addMI(parent, key, value, col, ownerId){ 
    let d = document.createElement('div'); d.className = 'mastery-icon'; 
    d.innerHTML = `${CARDS_DB[key].icon}<span class="mastery-lvl">${value}</span>`;
    d.style.borderColor = col; 
    let handlers = bindMasteryTooltip(d, key, value, ownerId);
    d.onmouseenter = handlers.onmouseenter;
    d.onmouseleave = () => { tt.style.display = 'none'; }; 
    parent.appendChild(d); 
}

function showFloatingText(eid, txt, col) { 
    let el = document.createElement('div'); 
    el.className='floating-text'; 
    el.innerText=txt; 
    el.style.color=col; 
    let parent = document.getElementById(eid);
    if(parent) {
        let rect = parent.getBoundingClientRect();
        el.style.left = (rect.left + rect.width/2) + 'px';
        el.style.top = (rect.top) + 'px';
        document.body.appendChild(el); 
    } else {
         document.body.appendChild(el);
    }
    setTimeout(()=>el.remove(), 2000); 
}

window.openModal = function(t,d,opts,cb) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-desc').innerText=d; let g=document.getElementById('modal-btns'); g.innerHTML=''; opts.forEach(o=>{ let b=document.createElement('button'); b.className='mini-btn'; b.innerText=o; b.onclick=()=>{document.getElementById('modal-overlay').style.display='none'; cb(o)}; g.appendChild(b); }); document.getElementById('modal-overlay').style.display='flex'; }
window.cancelModal = function() { document.getElementById('modal-overlay').style.display='none'; isProcessing = false; }
const tt=document.getElementById('tooltip-box');

function bindFixedTooltip(el,k) { 
    const updatePos = () => { 
        let rect = el.getBoundingClientRect(); 
        tt.style.left = (rect.left + rect.width / 2) + 'px'; 
    }; 
    return { 
        onmouseenter: (e) => { 
            showTT(k); 
            tt.style.bottom = (window.innerWidth < 768 ? '280px' : '420px'); 
            tt.style.top = 'auto'; 
            
            tt.classList.remove('tooltip-anim-up'); 
            tt.classList.remove('tooltip-anim-down'); 
            tt.classList.add('tooltip-anim-up'); 
            updatePos(); 
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
        document.getElementById('tt-content').innerHTML = `
            <span class='tt-label'>Base</span><span class='tt-val'>${db.base}</span>
            <span class='tt-label' style='color:var(--accent-orange)'>Bônus</span><span class='tt-val'>${db.bonus}</span>
            <span class='tt-label' style='color:var(--accent-purple)'>Maestria</span><span class='tt-val'>${db.mastery}</span>
        `;
    }
    tt.style.display = 'block';
}

function apply3DTilt(element, isHand = false) { 
    if(window.innerWidth < 768) return; 
    
    element.addEventListener('mousemove', (e) => { 
        const rect = element.getBoundingClientRect(); 
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top; 
        const xPct = (x / rect.width) - 0.5; 
        const yPct = (y / rect.height) - 0.5; 
        
        element.style.setProperty('--rx', xPct);
        element.style.setProperty('--ry', yPct);

        let lift = isHand ? 'translateY(-140px) scale(2.3)' : 'scale(1.1)'; 
        let rotate = `rotateX(${yPct * -40}deg) rotateY(${xPct * 40}deg)`; 
        if(element.classList.contains('disabled-card')) rotate = `rotateX(${yPct * -10}deg) rotateY(${xPct * 10}deg)`; 
        
        element.style.transform = `${lift} ${rotate}`; 
        
        let art = element.querySelector('.card-art'); 
        if(art) art.style.backgroundPosition = `${50 + (xPct * 20)}% ${50 + (yPct * 20)}%`; 
    }); 
    
    element.addEventListener('mouseleave', () => { 
        element.style.transform = isHand ? 'translateY(0) scale(1)' : 'scale(1)'; 
        let art = element.querySelector('.card-art'); 
        if(art) art.style.backgroundPosition = 'center'; 
        element.style.setProperty('--rx', 0);
        element.style.setProperty('--ry', 0);
    }); 
}

// ======================================================
// LÓGICA DE MATCHMAKING E DECK
// ======================================================

let matchTimerInterval = null;
let matchSeconds = 0;
let myQueueRef = null; 
let queueListener = null;

// Botão PvE (Treino) - Vai direto para seleção de deck
window.startPvE = function() {
    window.gameMode = 'pve'; 
    window.playNavSound();
    window.openDeckSelector(); 
};

// --- INICIAR JOGO (Botão PvP) ---
window.startPvPSearch = function() {
    if (!currentUser) return; 
    window.gameMode = 'pvp'; // Define que é PvP
    window.playNavSound();
    window.openDeckSelector(); // Vai para a escolha de cartas PRIMEIRO
};

// --- FUNÇÃO QUE INICIA A FILA APÓS ESCOLHER O DECK ---
async function initiateMatchmaking() {
    console.log("--- INICIANDO MATCHMAKING ---");
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'flex';
    
    // Reset visual
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE...";
    document.querySelector('.mm-title').style.color = "var(--gold)";
    document.querySelector('.radar-spinner').style.borderColor = "rgba(255, 215, 0, 0.3)";
    document.querySelector('.radar-spinner').style.animation = "spin 1s linear infinite";
    document.querySelector('.cancel-btn').style.display = "block";
    
    // Timer visual
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
        // 1. Criar meu Ticket na Fila
        myQueueRef = doc(collection(db, "queue")); 
        const myData = {
            uid: currentUser.uid,
            name: currentUser.displayName,
            deck: window.currentDeck,
            timestamp: Date.now(),
            matchId: null,
            cancelled: false, // Importante
            status: 'waiting'
        };
        
        console.log("Criando ticket na fila...", myData);
        await setDoc(myQueueRef, myData);
        console.log("Ticket criado com ID:", myQueueRef.id);

        // 2. Ouvir meu próprio ticket (para saber se alguém me achou)
        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.matchId) {
                    console.log("ALGUÉM ME ACHOU! MatchID:", data.matchId);
                    enterMatch(data.matchId); 
                }
            }
        });

        // 3. Buscar oponentes ativamente (Repetir a cada 4 segundos)
        // Isso resolve o problema de "ficar esperando eternamente"
        if (searchInterval) clearInterval(searchInterval);
        
        // Tenta agora
        findOpponentInQueue();
        
        // E continua tentando
        searchInterval = setInterval(() => {
            // Só busca se ainda estiver esperando
            if (document.getElementById('matchmaking-screen').style.display === 'flex' 
                && document.querySelector('.mm-title').innerText !== "PARTIDA ENCONTRADA!") {
                console.log("Tentando buscar novamente...");
                findOpponentInQueue();
            } else {
                clearInterval(searchInterval);
            }
        }, 4000);

    } catch (e) {
        console.error("ERRO GRAVE no Matchmaking:", e);
        cancelPvPSearch();
    }
}

async function findOpponentInQueue() {
    try {
        console.log("Executando findOpponentInQueue...");
        const queueRef = collection(db, "queue");
        
        // QUERY SIMPLIFICADA:
        // Traz os últimos 20 tickets. Removemos os 'where' complexos 
        // para evitar problemas de índice. Filtraremos no Javascript (Client-side).
        const q = query(
            queueRef, 
            orderBy("timestamp", "desc"), 
            limit(20)
        );

        const querySnapshot = await getDocs(q);
        console.log(`Encontrados ${querySnapshot.size} tickets no total (incluindo velhos/eu).`);

        let opponentDoc = null;
        const now = Date.now();

        // FILTRAGEM MANUAL (Mais seguro para esse estágio)
        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            const docId = docSnap.id;

            // 1. Não posso ser eu mesmo
            if (data.uid === currentUser.uid) continue;

            // 2. Tem que estar esperando (sem matchId)
            if (data.matchId !== null) continue;

            // 3. Não pode ter cancelado
            if (data.cancelled === true) continue;

            // 4. VERIFICAÇÃO DE "ZUMBI"
            // Se o ticket tem mais de 2 minutos, ignoramos (jogador fechou o app)
            if (now - data.timestamp > 120000) {
                console.log(`Ticket ${docId} ignorado (Muito antigo/Zumbi)`);
                continue;
            }

            // ACHAMOS UM VÁLIDO!
            console.log("Oponente VÁLIDO encontrado:", data.name);
            opponentDoc = docSnap;
            break; // Para o loop
        }

        if (opponentDoc) {
            console.log("Iniciando processo de match com:", opponentDoc.data().name);
            
            // Para o intervalo de busca para não tentar parear duas vezes
            if (searchInterval) clearInterval(searchInterval);

            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            const oppRef = opponentDoc.ref;

            // TENTA TRAVAR O OPONENTE (Atualização Atômica seria ideal, mas vamos simples)
            await updateDoc(oppRef, { matchId: matchId });
            
            // Atualiza meu ticket
            if (myQueueRef) {
                await updateDoc(myQueueRef, { matchId: matchId });
            }

            // Gera decks e cria a sala
            const p1DeckCards = generateShuffledDeck();
            const p2DeckCards = generateShuffledDeck();

            await createMatchDocument(
                matchId, 
                currentUser.uid, opponentDoc.data().uid, 
                currentUser.displayName, opponentDoc.data().name,
                window.currentDeck, opponentDoc.data().deck,
                p1DeckCards, p2DeckCards
            );
        } else {
            console.log("Nenhum oponente compatível encontrado nesta rodada.");
        }

    } catch (e) {
        console.error("Erro ao buscar oponente na lista:", e);
    }
}
// ATUALIZAÇÃO: Agora salvamos os DECKS COMPLETOS no banco
async function createMatchDocument(matchId, p1Id, p2Id, p1Name, p2Name, p1DeckType, p2DeckType, p1DeckCards, p2DeckCards) {
    const matchRef = doc(db, "matches", matchId);
    
    const cleanName1 = p1Name ? p1Name.split(' ')[0].toUpperCase() : "JOGADOR 1";
    const cleanName2 = p2Name ? p2Name.split(' ')[0].toUpperCase() : "JOGADOR 2";
    const d1Type = p1DeckType || 'knight';
    const d2Type = p2DeckType || 'knight';

    await setDoc(matchRef, {
        player1: { 
            uid: p1Id, 
            name: cleanName1, 
            deckType: d1Type, 
            hp: 6, 
            status: 'selecting', 
            hand: [], 
            deck: p1DeckCards, // Salva o array embaralhado
            xp: [] 
        },
        player2: { 
            uid: p2Id, 
            name: cleanName2, 
            deckType: d2Type, 
            hp: 6, 
            status: 'selecting', 
            hand: [], 
            deck: p2DeckCards, // Salva o array embaralhado
            xp: [] 
        },
        turn: 1,
        status: 'playing', 
        createdAt: Date.now()
    });
}

// --- CANCELAR BUSCA ---
window.cancelPvPSearch = async function() {
    // 1. Limpa os intervalos de busca
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (searchInterval) clearInterval(searchInterval); // <--- ADICIONE ISSO
    
    // ... (o resto do código continua igual: deletar ticket, esconder tela, etc)
    const mmScreen = document.getElementById('matchmaking-screen');
    mmScreen.style.display = 'none';

    if (myQueueRef) {
        // Marca como cancelado para não aparecer nas buscas dos outros
        await updateDoc(myQueueRef, { cancelled: true });
        myQueueRef = null;
    }
    
    // Volta ao lobby
    window.transitionToLobby(true);
};

// --- ENTRAR NA PARTIDA (Sucesso) ---
async function enterMatch(matchId) {
    console.log("PARTIDA ENCONTRADA! ID:", matchId);
    
    if (queueListener) queueListener();
    if (matchTimerInterval) clearInterval(matchTimerInterval);

    const matchRef = doc(db, "matches", matchId);
    const matchSnap = await getDoc(matchRef);
    if(matchSnap.exists()) {
        const data = matchSnap.data();
        
        // SALVAR DADOS INICIAIS (incluindo decks) GLOBALMENTE
        window.pvpStartData = data; 

        if(data.player1.uid === currentUser.uid) window.myRole = 'player1';
        else window.myRole = 'player2';
    }

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
}

preloadGame();
