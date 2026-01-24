// ARQUIVO: js/main.js - VERSÃO COM CORREÇÃO DE MAESTRIA, HISTÓRICO E TOOLTIP
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
    console.log("Firebase Web Iniciado.");
} catch (e) {
    console.error("Erro Firebase (Modo Offline):", e);
}

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 
window.pvpUnsubscribe = null; 
let searchInterval = null;
const tt = document.getElementById('tooltip-box');

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

// --- FUNÇÕES DE UTILIDADE ---
function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) return MAGE_ASSETS[cardKey];
    return CARDS_DB[cardKey].img;
}

function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
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
    for(let k in DECK_TEMPLATE) for(let i=0; i<DECK_TEMPLATE[k]; i++) deck.push(k);
    shuffle(deck);
    return deck;
}

// --- CONTROLE DE MÚSICA ---
const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if (!audios[trackId]) return;
        try {
            if (this.currentTrackId === trackId) {
                if (audios[trackId].paused && !window.isMuted) {
                    const audio = audios[trackId];
                    if (audio.readyState >= 2) audio.currentTime = 0;
                    audio.volume = 0; audio.play().catch(()=>{});
                    this.fadeIn(audio, 0.5 * window.masterVol);
                }
                return; 
            } 
            const maxVol = 0.5 * window.masterVol;
            if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]);
            if (trackId && audios[trackId]) {
                const newAudio = audios[trackId];
                if (newAudio.readyState >= 2) newAudio.currentTime = 0;
                if (!window.isMuted) {
                    newAudio.volume = 0; newAudio.play().catch(()=>{});
                    this.fadeIn(newAudio, maxVol);
                }
            }
            this.currentTrackId = trackId;
        } catch(e) { console.warn("MusicController:", e); }
    },
    stopCurrent() {
        if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]);
        this.currentTrackId = null;
    },
    fadeOut(audio) {
        if(!audio) return;
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) { vol -= 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); } }
            else { try { audio.volume = 0; audio.pause(); } catch(e){} clearInterval(fadeOutInt); }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        if(!audio) return;
        let vol = 0; audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) { vol += 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); } }
            else { try { audio.volume = targetVol; } catch(e){} clearInterval(fadeInInt); }
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
};

window.playNavSound = function() { let s = audios['sfx-nav']; if(s) try { s.currentTime = 0; s.play().catch(()=>{}); } catch(e){} };

let lastHoverTime = 0;
window.playUIHoverSound = function() {
    let now = Date.now(); if (now - lastHoverTime < 50) return;
    let base = audios['sfx-ui-hover'];
    if(base && !window.isMuted) try { let s = base.cloneNode(); s.volume = 0.3 * (window.masterVol || 1.0); s.play().catch(()=>{}); lastHoverTime = now; } catch(e){}
};

// --- NAVEGAÇÃO DE TELAS ---
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

window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) {
        ds.style.display = 'flex'; ds.style.opacity = '1'; ds.style.pointerEvents = 'auto'; 
        document.querySelectorAll('.deck-option').forEach(opt => { opt.style = ""; const img = opt.querySelector('img'); if(img) img.style = ""; });
    }
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (e) {}
    window.showScreen('deck-selection-screen');
};

window.selectDeck = function(deckType) {
    if(audios['sfx-deck-select']) try { audios['sfx-deck-select'].currentTime = 0; audios['sfx-deck-select'].play().catch(()=>{}); } catch(e){}
    window.currentDeck = deckType; 
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 
    document.body.classList.add(deckType === 'mage' ? 'theme-mago' : 'theme-cavaleiro');

    document.querySelectorAll('.deck-option').forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))";
            opt.style.zIndex = "100";
        } else {
            opt.style.opacity = "0.2"; opt.style.filter = "grayscale(100%)";
        }
    });

    setTimeout(() => {
        const sel = document.getElementById('deck-selection-screen');
        sel.style.opacity = "0";
        setTimeout(() => {
            sel.style.display = 'none';
            if (window.gameMode === 'pvp') initiateMatchmaking(); 
            else window.transitionToGame();
        }, 500);
    }, 400);
};

window.transitionToGame = function() {
    const trans = document.getElementById('transition-overlay');
    if(trans) { trans.querySelector('.trans-text').innerText = "PREPARANDO BATALHA..."; trans.classList.add('active'); }
    setTimeout(() => {
        MusicController.play('bgm-loop'); 
        let bg = document.getElementById('game-background'); if(bg) bg.classList.remove('lobby-mode');
        window.showScreen('game-screen');
        document.getElementById('player-hand').innerHTML = '';
        setTimeout(() => { if(trans) trans.classList.remove('active'); setTimeout(startGameFlow, 200); }, 1500);
    }, 500); 
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) { window.showScreen('start-screen'); MusicController.play('bgm-menu'); return; }
    isProcessing = false; 
    let bg = document.getElementById('game-background'); if(bg) bg.classList.add('lobby-mode');
    MusicController.play('bgm-menu'); createLobbyFlares();
    
    const userRef = doc(db, "players", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0 });
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
            let rankClass = pos <= 3 ? `rank-${pos}` : "";
            html += `<tr class="${rankClass}"><td class="rank-pos">${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`;
            pos++;
        });
        document.getElementById('ranking-content').innerHTML = html + '</tbody></table>';
    });
    window.showScreen('lobby-screen');
    document.getElementById('end-screen').classList.remove('visible'); 
};

// --- FLUXO DE JOGO ---
function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; window.isResolvingTurn = false; window.pvpSelectedCardIndex = null; 
    startCinematicLoop(); window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand'); if (handEl) { handEl.innerHTML = ''; handEl.classList.add('preparing'); }

    if (window.gameMode === 'pvp' && window.pvpStartData) {
        if (window.myRole === 'player1') {
            resetUnit(player, window.pvpStartData.player1.deck, 'player1');
            resetUnit(monster, window.pvpStartData.player2.deck, 'player2');
        } else {
            resetUnit(player, window.pvpStartData.player2.deck, 'player2');
            resetUnit(monster, window.pvpStartData.player1.deck, 'player1');
        }
    } else {
        resetUnit(player, null, 'pve'); resetUnit(monster, null, 'pve'); 
    }
    turnCount = 1; playerHistory = [];
    drawCardLogic(monster, 6); drawCardLogic(player, 6); 
    updateUI(); dealAllInitialCards();
    if(window.gameMode === 'pvp') startPvPListener();
}

// --- LISTENER PVP CORRIGIDO ---
function startPvPListener() {
    if(!window.currentMatchId) return;
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    const matchRef = doc(db, "matches", window.currentMatchId);
    let namesUpdated = false;

    window.pvpUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();

        if (matchData.status === 'abandoned' && matchData.abandonedBy !== currentUser.uid) {
            monster.hp = 0; updateUI(); isProcessing = true;
            setTimeout(() => {
                const title = document.getElementById('end-title'); title.innerText = "VITÓRIA"; title.className = "win-theme";
                showCenterText("OPONENTE DESISTIU!", "#ffd700"); playSound('sfx-win');
                window.registrarVitoriaOnline('pvp');
                document.getElementById('end-screen').classList.add('visible');
                if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
            }, 500);
            return;
        }

        if (!namesUpdated && matchData.player1 && matchData.player2) {
            const myName = (window.myRole === 'player1') ? matchData.player1.name : matchData.player2.name;
            const enemyName = (window.myRole === 'player1') ? matchData.player2.name : matchData.player1.name;
            document.querySelector('#p-stats-cluster .unit-name').innerText = myName;
            document.querySelector('#m-stats-cluster .unit-name').innerText = enemyName;
            namesUpdated = true; 
        }

        if (matchData.p1Move && matchData.p2Move && !window.isResolvingTurn) {
            resolvePvPTurn(matchData.p1Move, matchData.p2Move, matchData.p1Disarm, matchData.p2Disarm);
        }
        
        // --- SYNC REATIVO DE STATUS (HP/XP/LVL) ---
        const enemyRole = (window.myRole === 'player1') ? 'player2' : 'player1';
        const enemyData = matchData[enemyRole];
        const myData = matchData[window.myRole];

        if (myData && myData.hp !== undefined) {
            // Sincroniza meu próprio HP (Dano de Maestria vindo do oponente)
            if (myData.hp !== player.hp) {
                player.hp = myData.hp;
                updateUI();
            }
        }

        if (enemyData) {
            // Sincroniza HP do inimigo
            if(enemyData.hp !== undefined && enemyData.hp !== monster.hp) {
                monster.hp = enemyData.hp;
            }
            // Sincroniza XP e Animações
            const serverXP = enemyData.xp || [];
            if (serverXP.length > monster.xp.length) {
                const newCardKey = serverXP[serverXP.length - 1];
                animateFly('m-deck-container', 'm-xp', newCardKey, () => { triggerXPGlow('m'); }, false, false, false);
                monster.xp = [...serverXP];
            } else if (serverXP.length < monster.xp.length || (enemyData.lvl > monster.lvl)) {
                if (enemyData.lvl > monster.lvl) { triggerLevelUpVisuals('m'); playSound('sfx-levelup'); }
                monster.xp = [...serverXP];
                monster.lvl = enemyData.lvl || monster.lvl;
                monster.maxHp = enemyData.maxHp || monster.maxHp;
                monster.bonusAtk = enemyData.bonusAtk !== undefined ? enemyData.bonusAtk : monster.bonusAtk;
                monster.bonusBlock = enemyData.bonusBlock !== undefined ? enemyData.bonusBlock : monster.bonusBlock;
            }
            updateUI();
        }
    });
}

// --- LÓGICA DE CARTAS E TURNOS ---
function onCardClick(index) {
    if(isProcessing || !player.hand[index]) return;
    if (window.gameMode === 'pvp' && window.pvpSelectedCardIndex !== null) return;

    // Failsafe Tooltip: Esconde imediatamente ao clicar
    if(tt) tt.style.display = 'none';
    document.body.classList.remove('focus-hand', 'cinematic-active', 'tension-active');

    playSound('sfx-play');
    let cardKey = player.hand[index];
    if(player.disabled === cardKey) { showCenterText("DESARMADA!"); return; }
    
    if(cardKey === 'DESARMAR') { 
        window.openModal('ALVO DO DESARME', 'Qual ação bloquear no inimigo?', ACTION_KEYS, (choice) => {
            if(window.gameMode === 'pvp') lockInPvPMove(index, choice); 
            else playCardFlow(index, choice);
        }); 
    } else { 
        if(window.gameMode === 'pvp') lockInPvPMove(index, null); 
        else playCardFlow(index, null);
    }
}

async function lockInPvPMove(index, disarmChoice) {
    const cardEl = document.getElementById('player-hand').children[index];
    if(cardEl) cardEl.classList.add('card-selected');
    window.pvpSelectedCardIndex = index;
    isProcessing = true; showCenterText("AGUARDANDO OPONENTE...", "#ffd700");

    const matchRef = doc(db, "matches", window.currentMatchId);
    const moveField = (window.myRole === 'player1') ? 'p1Move' : 'p2Move';
    const disarmField = (window.myRole === 'player1') ? 'p1Disarm' : 'p2Disarm';
    
    try { await updateDoc(matchRef, { [moveField]: player.hand[index], [disarmField]: disarmChoice || null }); }
    catch (e) { isProcessing = false; window.pvpSelectedCardIndex = null; if(cardEl) cardEl.classList.remove('card-selected'); }
}

async function resolvePvPTurn(p1Move, p2Move, p1Disarm, p2Disarm) {
    if (window.isResolvingTurn) return; window.isResolvingTurn = true; isProcessing = true;
    const centerTxt = document.querySelector('.center-text'); if(centerTxt) centerTxt.remove();

    let myMove = (window.myRole === 'player1') ? p1Move : p2Move;
    let enemyMove = (window.myRole === 'player1') ? p2Move : p1Move;
    let myDisarm = (window.myRole === 'player1') ? p1Disarm : p2Disarm;
    let enemyDisarm = (window.myRole === 'player1') ? p2Disarm : p1Disarm;

    const handContainer = document.getElementById('player-hand');
    let myCardEl = handContainer.children[window.pvpSelectedCardIndex || 0];
    let startRect = myCardEl ? myCardEl.getBoundingClientRect() : null;
    
    if(myCardEl) myCardEl.style.opacity = '0';
    player.hand.splice(window.pvpSelectedCardIndex || 0, 1);
    playerHistory.push(myMove);

    animateFly(startRect || 'player-hand', 'p-slot', myMove, () => renderTable(myMove, 'p-slot', true), false, true, true);
    animateFly({ top: -160, left: window.innerWidth / 2 }, 'm-slot', enemyMove, () => renderTable(enemyMove, 'm-slot', false), false, true, false);

    setTimeout(() => {
        if (window.myRole === 'player1') {
            updateDoc(doc(db, "matches", window.currentMatchId), { p1Move: null, p2Move: null, p1Disarm: null, p2Disarm: null, turn: increment(1) });
        }
        resolveTurn(myMove, enemyMove, myDisarm, enemyDisarm);
        
        setTimeout(() => {
            window.pvpSelectedCardIndex = null; window.isResolvingTurn = false; isProcessing = false;
        }, 3500);
    }, 600);
}

function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    let pDmg = 0, mDmg = 0;
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train');
    if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');

    if(mAct === 'ATAQUE') pDmg += monster.lvl;
    if(pAct === 'ATAQUE') mDmg += player.lvl;
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') mDmg += (1 + player.bonusBlock); }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') pDmg += (1 + monster.bonusBlock); }

    if(pAct === 'BLOQUEIO' && mAct === 'ATAQUE') triggerBlockEffect(true);
    else if(mAct === 'BLOQUEIO' && pAct === 'ATAQUE') triggerBlockEffect(false);

    player.disabled = (mAct === 'DESARMAR') ? (mDisarmTarget || 'ATAQUE') : null;
    monster.disabled = (pAct === 'DESARMAR') ? pDisarmChoice : null;

    player.hp -= pDmg; monster.hp -= mDmg;
    if(pDmg > 0) { showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); triggerDamageEffect(true, true); }
    if(mDmg > 0) { showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); triggerDamageEffect(false, true); }
    
    if(player.hp > 0 && pAct === 'DESCANSAR') { 
        let h = (pDmg === 0) ? 3 : 2; player.hp = Math.min(player.maxHp, player.hp + h); 
        showFloatingText('p-lvl', `+${h} HP`, "#55efc4"); triggerHealEffect(true); playSound('sfx-heal'); 
    }
    if(monster.hp > 0 && mAct === 'DESCANSAR') { 
        let h = (mDmg === 0) ? 3 : 2; monster.hp = Math.min(monster.maxHp, monster.hp + h); 
        triggerHealEffect(false); playSound('sfx-heal'); 
    }

    updateUI();

    // PROCESSAMENTO DE XP E MAESTRIAS (O dano de maestria ocorre aqui, após o descanso)
    setTimeout(() => {
        const handleXP = (u, act) => {
            animateFly(u.id === 'p' ? 'p-slot' : 'm-slot', u.id + '-xp', act, () => {
                u.xp.push(act); triggerXPGlow(u.id); updateUI();
                checkLevelUp(u, () => {
                    if(u === monster) {
                        if (window.gameMode === 'pvp') commitTurnToDB(); 
                        checkEndGame();
                    } else {
                        if(player.hp > 0) drawCardLogic(player, 1);
                    }
                });
            }, false, false, u === player);
        };
        handleXP(player, pAct); handleXP(monster, mAct);
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

// --- SINCRONIZAÇÃO COMPLETA DE MAESTRIA ---
async function commitTurnToDB() {
    if (!window.currentMatchId || window.gameMode !== 'pvp') return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    try {
        const myKey = window.myRole;
        const oppKey = (window.myRole === 'player1') ? 'player2' : 'player1';
        let data = {};
        // Envia meu estado completo
        data[`${myKey}.hp`] = player.hp;
        data[`${myKey}.xp`] = player.xp;
        data[`${myKey}.lvl`] = player.lvl;
        data[`${myKey}.maxHp`] = player.maxHp;
        data[`${myKey}.bonusAtk`] = player.bonusAtk;
        data[`${myKey}.bonusBlock`] = player.bonusBlock;
        data[`${myKey}.deck`] = player.deck;
        // Crucial: Envia o HP do oponente atualizado (caso eu tenha dado dano de maestria)
        data[`${oppKey}.hp`] = monster.hp;
        
        await updateDoc(matchRef, data);
    } catch (e) { console.error("Erro Sync:", e); }
}

function applyMastery(u, k) { 
    if(k === 'ATAQUE') { 
        u.bonusAtk++; 
        let target = (u === player) ? monster : player; 
        target.hp -= u.bonusAtk; // Dano da Maestria
        showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675"); 
        triggerDamageEffect(u !== player); 
    } 
    if(k === 'BLOQUEIO') u.bonusBlock++; 
    if(k === 'DESCANSAR') { u.maxHp++; showFloatingText(u.id+'-hp-txt', "+1 MAX", "#55efc4"); } 
    updateUI(); 
}

function checkLevelUp(u, done) {
    if(u.xp.length >= 5) {
        triggerLevelUpVisuals(u.id); playSound('sfx-levelup');
        let triggers = []; let counts = {}; u.xp.forEach(x => counts[x] = (counts[x]||0)+1);
        for(let k in counts) if(counts[k] >= 3 && k !== 'DESCANSAR') triggers.push(k);
        
        processMasteries(u, triggers, () => {
            u.lvl++; u.xp.forEach(x => u.deck.push(x)); u.xp = [];
            if (window.gameMode === 'pvp') {
                shuffle(u.deck, stringToSeed(window.currentMatchId + u.originalRole) + u.lvl);
            } else shuffle(u.deck);
            updateUI(); done();
        });
    } else done();
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
        // IA ou Oponente
        if(type === 'ATAQUE' || type === 'BLOQUEIO') applyMastery(u, type);
        processMasteries(u, triggers, cb);
    }
}

// --- HISTÓRICO E FINALIZAÇÃO ---
function checkEndGame() {
    if(player.hp <= 0 || monster.hp <= 0) {
        isProcessing = true; MusicController.stopCurrent();
        setTimeout(() => {
            let title = document.getElementById('end-title');
            let isWin = player.hp > 0; let isTie = player.hp <= 0 && monster.hp <= 0;
            if(isTie) { title.innerText = "EMPATE"; title.className = "tie-theme"; playSound('sfx-tie'); window.registrarEmpateOnline(); }
            else if(isWin) { title.innerText = "VITÓRIA"; title.className = "win-theme"; playSound('sfx-win'); window.registrarVitoriaOnline(window.gameMode); }
            else { title.innerText = "DERROTA"; title.className = "lose-theme"; playSound('sfx-lose'); window.registrarDerrotaOnline(window.gameMode); }
            document.getElementById('end-screen').classList.add('visible');
        }, 1000);
    }
}

window.registrarEmpateOnline = async function() { await saveMatchHistory('TIE', 0); };

async function saveMatchHistory(result, pointsChange) {
    if (!currentUser) return;
    try {
        let enemyName = "TREINAMENTO";
        if (window.gameMode === 'pvp') {
            const nameEl = document.querySelector('#m-stats-cluster .unit-name');
            if (nameEl && !nameEl.innerText.includes("MONSTRO")) enemyName = nameEl.innerText.split(' ')[0].toUpperCase();
            else if (window.pvpStartData) {
                const opp = (window.myRole === 'player1') ? window.pvpStartData.player2 : window.pvpStartData.player1;
                enemyName = opp.name.split(' ')[0].toUpperCase();
            }
        }
        await addDoc(collection(db, "players", currentUser.uid, "history"), {
            result, opponent: enemyName, mode: window.gameMode || 'pve',
            deck: window.currentDeck, points: pointsChange, timestamp: Date.now()
        });
    } catch (e) { console.error("Erro histórico:", e); }
}

window.registrarVitoriaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    const userRef = doc(db, "players", currentUser.uid);
    const snap = await getDoc(userRef);
    if(snap.exists()) {
        let pts = (modo === 'pvp') ? 8 : 1;
        await updateDoc(userRef, { totalWins: increment(1), score: increment(pts) });
        await saveMatchHistory('WIN', pts);
    }
};

window.registrarDerrotaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    const userRef = doc(db, "players", currentUser.uid);
    const snap = await getDoc(userRef);
    if(snap.exists()) {
        let pts = (modo === 'pvp') ? 8 : 3;
        await updateDoc(userRef, { score: Math.max(0, (snap.data().score || 0) - pts) });
        await saveMatchHistory('LOSS', -pts);
    }
};

// --- INTERFACE DE HISTÓRICO ---
window.openHistory = async function() {
    window.playNavSound();
    const screen = document.getElementById('history-screen');
    const container = document.getElementById('history-list-container');
    screen.style.display = 'flex';
    container.innerHTML = '<div style="color:#888; text-align:center; margin-top:20px;">Carregando pergaminhos...</div>';
    try {
        const q = query(collection(db, "players", currentUser.uid, "history"), orderBy("timestamp", "desc"), limit(20));
        const snap = await getDocs(q);
        if (snap.empty) { container.innerHTML = '<div style="text-align:center; margin-top:20px;">Nenhuma batalha encontrada.</div>'; return; }
        let html = '';
        snap.forEach(doc => {
            const h = doc.data();
            const date = new Date(h.timestamp);
            const resClass = h.result.toLowerCase();
            const resTxt = h.result === 'WIN' ? 'VITÓRIA' : (h.result === 'TIE' ? 'EMPATE' : 'DERROTA');
            html += `
                <div class="history-item ${resClass}">
                    <div><div class="h-vs">${resTxt} vs ${h.opponent}</div><div class="h-date">${date.toLocaleDateString()} ${h.mode.toUpperCase()}</div></div>
                    <div class="h-score">${h.points > 0 ? '+' : ''}${h.points} PTS</div>
                </div>`;
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = 'Erro ao carregar.'; }
};

window.closeHistory = function() { window.playNavSound(); document.getElementById('history-screen').style.display = 'none'; };

// --- RESTO DO CÓDIGO (Sfx, Partículas, UI) ---
function triggerDamageEffect(isPlayer, playAudio = true) {
    if(playAudio) playSound(isPlayer ? 'sfx-hit' : (window.currentDeck === 'mage' ? 'sfx-hit-mage' : 'sfx-hit'));
    let slot = document.getElementById(isPlayer ? 'p-slot' : 'm-slot');
    if(slot) { let r = slot.getBoundingClientRect(); spawnParticles(r.left+r.width/2, r.top+r.height/2, '#ff4757'); }
    if(isPlayer) { document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 400); }
}

function spawnParticles(x, y, color) {
    for(let i=0; i<15; i++) {
        let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color;
        p.style.left = x + 'px'; p.style.top = y + 'px';
        let a = Math.random() * Math.PI * 2; let v = 50 + Math.random() * 100;
        p.style.setProperty('--tx', `${Math.cos(a)*v}px`); p.style.setProperty('--ty', `${Math.sin(a)*v}px`);
        document.body.appendChild(p); setTimeout(() => p.remove(), 800);
    }
}

function updateUI() {
    const updateU = (u) => {
        document.getElementById(u.id+'-lvl').firstChild.nodeValue = u.lvl;
        document.getElementById(u.id+'-hp-txt').innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
        let pct = (Math.max(0,u.hp)/u.maxHp)*100;
        let fill = document.getElementById(u.id+'-hp-fill'); fill.style.width = pct + '%';
        fill.style.background = pct > 66 ? "#4cd137" : (pct > 33 ? "#fbc531" : "#e84118");
        document.getElementById(u.id+'-deck-count').innerText = u.deck.length;
        
        if(u === player) {
            let hand = document.getElementById('player-hand'); hand.innerHTML = '';
            u.hand.forEach((k, i) => {
                let c = document.createElement('div'); c.className = `card hand-card ${CARDS_DB[k].color}`;
                if(u.disabled === k) c.classList.add('disabled-card');
                let img = getCardArt(k, true);
                c.innerHTML = `<div class="card-art" style="background-image: url('${img}')"></div><div class="flares-container"></div>`;
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
    updateU(player); updateU(monster);
    document.getElementById('turn-txt').innerText = "TURNO " + turnCount;
}

// --- TOOLTIP GLOBAL FAILSAFE ---
document.addEventListener('mouseover', (e) => {
    if (!e.target.closest('.hand-card') && !e.target.closest('.mastery-icon') && !e.target.closest('.xp-mini')) {
        if(tt) tt.style.display = 'none';
    }
});

function showTT(k) {
    let db = CARDS_DB[k]; document.getElementById('tt-title').innerText = k;
    let content = db.customTooltip || `<span class='tt-label'>Base</span><span class='tt-val'>${db.base}</span>`;
    content = content.replace('{PLAYER_LVL}', player.lvl).replace('{PLAYER_BLOCK_DMG}', 1 + player.bonusBlock);
    document.getElementById('tt-content').innerHTML = content;
}

// --- INICIALIZAÇÃO E BOOT ---
onAuthStateChanged(auth, (user) => {
    if (user) { currentUser = user; window.goToLobby(true); }
    else { currentUser = null; window.showScreen('start-screen'); MusicController.play('bgm-menu'); }
});

window.googleLogin = async function() {
    try { await signInWithPopup(auth, provider); }
    catch (e) { console.error(e); }
};

// ... Funções auxiliares de animação e UI que não mudaram significativamente ...
function animateFly(start, endId, cardKey, cb, deal, table, isP) {
    let s = (typeof start === 'string') ? document.getElementById(start).getBoundingClientRect() : start;
    let e = document.getElementById(endId).getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = `card flying-card ${CARDS_DB[cardKey].color}`;
    fly.innerHTML = `<div class="card-art" style="background-image: url('${getCardArt(cardKey, isP)}')"></div>`;
    fly.style.position = 'fixed'; fly.style.top = s.top+'px'; fly.style.left = s.left+'px';
    fly.style.width = '100px'; fly.style.height = '140px'; fly.style.zIndex = '1000'; fly.style.transition = 'all 0.4s ease';
    document.body.appendChild(fly); fly.offsetHeight;
    fly.style.top = e.top+'px'; fly.style.left = e.left+'px';
    if(endId.includes('xp')) fly.style.transform = 'scale(0.2)';
    setTimeout(() => { fly.remove(); if(cb) cb(); }, 400);
}

function renderTable(key, slotId, isP) {
    let el = document.getElementById(slotId); el.innerHTML = '';
    let c = document.createElement('div'); c.className = `card ${CARDS_DB[key].color} card-on-table`;
    c.innerHTML = `<div class="card-art" style="background-image: url('${getCardArt(key, isP)}')"></div>`;
    el.appendChild(c);
}

function resetUnit(u, deck, role) {
    u.hp = 6; u.maxHp = 6; u.lvl = 1; u.xp = []; u.hand = []; u.bonusAtk = 0; u.bonusBlock = 0; u.disabled = null;
    u.originalRole = role;
    if(deck) u.deck = [...deck];
    else { u.deck = []; for(let k in DECK_TEMPLATE) for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k); shuffle(u.deck); }
}

function addMI(p, k, v, col, id) {
    let d = document.createElement('div'); d.className = 'mastery-icon';
    d.innerHTML = `${CARDS_DB[k].icon}<span class="mastery-lvl">${v}</span>`;
    d.style.borderColor = col;
    d.onmouseenter = () => {
        document.getElementById('tt-title').innerText = k;
        document.getElementById('tt-content').innerHTML = `Bônus: +${v}<br>${CARDS_DB[k].mastery}`;
        tt.style.display = 'block';
    };
    d.onmouseleave = () => tt.style.display = 'none';
    p.appendChild(d);
}

// Inicializações finais
preloadGame();
