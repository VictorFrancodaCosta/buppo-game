import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, increment, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app, auth, db, loginWithGoogle, logoutGoogle, saveMatchHistoryDB, registrarVitoriaDB, registrarDerrotaDB, notifyAbandonmentDB } from './firebase_network.js';

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 
window.pvpUnsubscribe = null; 
let searchInterval = null;

// CONTROLES DE ÁUDIO
window.masterVol = 0.5; 
window.musicEnabled = true;
window.sfxEnabled = true;

let isLethalHover = false; 
let mixerInterval = null;

// --- ESTADOS GLOBAIS ---
window.isMatchStarting = false;
window.isDealingCards = false; // Controle de animação da mão
window.currentDeck = 'knight';
window.myRole = null; 
window.currentMatchId = null;
window.pvpSelectedCardIndex = null; 
window.isResolvingTurn = false; 
window.pvpStartData = null; 
window.latestMatchData = null; 

let isProcessing = false; 
let turnCount = 1; 
let playerHistory = []; 

let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };

// --- ASSETS LOCAIS ---
const MAGE_ASSETS = {
    'ATAQUE': 'assets/img/carta_ataque_mago.webp',
    'BLOQUEIO': 'assets/img/carta_bloqueio_mago.webp',
    'DESCANSAR': 'assets/img/carta_descansar_mago.webp',
    'DESARMAR': 'assets/img/carta_desarmar_mago.webp',
    'TREINAR': 'assets/img/carta_treinar_mago.webp',
    'DECK_IMG': 'assets/img/deck_verso_mago.webp',
    'DECK_SELECT': 'assets/img/card_selecao_mago.webp'
};

const ASSETS_TO_LOAD = {
    images: [
        'assets/img/logo_buppo.webp', 'assets/img/mesa_cavaleiro.webp', 'assets/img/mesa_mago.webp',
        'assets/img/bg_saguao.webp', 'assets/img/ui_moldura_perfil.webp', 'assets/img/ui_placa_selecao.webp',
        'assets/img/card_selecao_cavaleiro.webp', 'assets/img/card_selecao_mago.webp',
        'assets/img/deck_verso_cavaleiro.webp', 'assets/img/deck_verso_mago.webp',
        'assets/img/card_verso_padrao.webp', 'assets/img/ui_mesa_deck.webp', 'assets/img/ui_area_xp.webp',
        'assets/img/carta_ataque_cavaleiro.webp', 'assets/img/carta_bloqueio_cavaleiro.webp',
        'assets/img/carta_descansar_cavaleiro.webp', 'assets/img/carta_desarmar_cavaleiro.webp',
        'assets/img/carta_treinar_cavaleiro.webp', 'assets/img/carta_ataque_mago.webp',
        'assets/img/carta_bloqueio_mago.webp', 'assets/img/carta_descansar_mago.webp',
        'assets/img/carta_desarmar_mago.webp', 'assets/img/carta_treinar_mago.webp',
        'assets/img/cluster_jogador.webp', 'assets/img/cluster_inimigo.webp'
    ],
    audio: [
        { id: 'bgm-menu', src: 'assets/audio/musica_menu.mp3', loop: true }, 
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

// ==========================================
// FUNÇÕES DE LÓGICA DE JOGO NATIVAS
// (Trazidas para o main.js para evitar ReferenceError)
// ==========================================
function stringToSeed(str) { let hash = 0; for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); return Math.abs(hash); }
function shuffle(array, seed = null) { let rng = Math.random; if (seed !== null) { let currentSeed = seed; rng = function() { currentSeed = (currentSeed * 9301 + 49297) % 233280; return currentSeed / 233280; } } for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }
function generateShuffledDeck() { let deck = []; for(let k in DECK_TEMPLATE) { for(let i=0; i<DECK_TEMPLATE[k]; i++) deck.push(k); } shuffle(deck); return deck; }
function resetUnit(u, predefinedDeck = null, role = null) { u.hp = 6; u.maxHp = 6; u.lvl = 1; u.xp = []; u.hand = []; u.originalRole = role || 'pve'; if (predefinedDeck) { u.deck = [...predefinedDeck]; } else { u.deck = []; for(let k in DECK_TEMPLATE) { for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k); } shuffle(u.deck); } u.disabled = null; u.bonusBlock = 0; u.bonusAtk = 0; }
function checkCardLethality(cardKey, pUnit, mUnit) { if(cardKey === 'ATAQUE') { let damage = pUnit.lvl; return damage >= mUnit.hp ? 'red' : false; } if(cardKey === 'BLOQUEIO') { let reflect = 1 + pUnit.bonusBlock; return reflect >= mUnit.hp ? 'blue' : false; } return false; }
function drawCardLogic(u, qty) { for(let i=0; i<qty; i++) if(u.deck.length > 0) u.hand.push(u.deck.pop()); u.hand.sort(); }
function getBestAIMove(mUnit, pUnit, pHistory, tCount) {
    let moves = []; mUnit.hand.forEach((card, index) => { if(card !== mUnit.disabled) { moves.push({ card: card, index: index, score: 0 }); } }); if(moves.length === 0) return null;
    let recentHistory = pHistory.slice(-5); let attackCount = recentHistory.filter(c => c === 'ATAQUE').length; let playerAggro = recentHistory.length > 0 ? (attackCount / recentHistory.length) : 0.5;
    let threatLvl = pUnit.lvl + pUnit.bonusAtk; let amIDying = mUnit.hp <= threatLvl; let myDmg = mUnit.lvl + mUnit.bonusAtk; let canKill = pUnit.hp <= myDmg;
    moves.forEach(m => { let score = 50; if (m.card === 'ATAQUE') { if (canKill) score += 500; if (playerAggro < 0.4) score += 40; if (amIDying) score -= 30; } else if (m.card === 'BLOQUEIO') { if (amIDying) score += 100; if (playerAggro > 0.6) score += 60; if (threatLvl >= 3) score += 40; } else if (m.card === 'DESCANSAR') { if (mUnit.hp === mUnit.maxHp) score -= 100; else if (mUnit.hp <= 3) score += 50; if (playerAggro > 0.7) score -= 40; } else if (m.card === 'DESARMAR') { if (amIDying) score += 120; if (playerAggro > 0.8) score += 50; } else if (m.card === 'TREINAR') { if (tCount < 5) score += 30; if (amIDying || mUnit.hp <= 3) score -= 200; } m.score = score + Math.random() * 15; });
    moves.sort((a, b) => b.score - a.score); return moves[0];
}

// --- LÓGICA DE LIMPEZA ---
window.cleanupMatchState = function() {
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    if (searchInterval) { clearInterval(searchInterval); searchInterval = null; }
    window.currentMatchId = null; window.myRole = null; window.pvpStartData = null;
    window.pvpSelectedCardIndex = null; window.isResolvingTurn = false; window.latestMatchData = null;
    isProcessing = false;
    const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove();
}

function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) return MAGE_ASSETS[cardKey];
    return CARDS_DB[cardKey].img;
}

const MusicController = {
    currentTrackId: null, fadeTimer: null,
    play(trackId) {
        if (!audios[trackId]) return;
        try {
            if (this.currentTrackId === trackId) {
                if (audios[trackId].paused && window.musicEnabled) {
                    const audio = audios[trackId]; if (audio.readyState >= 2) audio.currentTime = 0; audio.volume = 0; audio.play().catch(()=>{}); this.fadeIn(audio, 0.5 * window.masterVol);
                } return; 
            } 
            const maxVol = 0.5 * window.masterVol;
            if (this.currentTrackId && audios[this.currentTrackId]) { this.fadeOut(audios[this.currentTrackId]); }
            if (trackId && audios[trackId]) { const newAudio = audios[trackId]; if (newAudio.readyState >= 2) newAudio.currentTime = 0; if (window.musicEnabled) { newAudio.volume = 0; newAudio.play().catch(()=>{}); this.fadeIn(newAudio, maxVol); } }
            this.currentTrackId = trackId;
        } catch(e) {}
    },
    stopCurrent() { if (this.currentTrackId && audios[this.currentTrackId]) { this.fadeOut(audios[this.currentTrackId]); } this.currentTrackId = null; },
    fadeOut(audio) { if(!audio) return; let vol = audio.volume; const fadeOutInt = setInterval(() => { if (vol > 0.05) { vol -= 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); } } else { try { audio.volume = 0; audio.pause(); } catch(e){} clearInterval(fadeOutInt); } }, 50); },
    fadeIn(audio, targetVol) { if(!audio) return; let vol = 0; audio.volume = 0; const fadeInInt = setInterval(() => { if (vol < targetVol - 0.05) { vol += 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); } } else { try { audio.volume = targetVol; } catch(e){} clearInterval(fadeInInt); } }, 50); }
};

window.toggleSoundType = function(type) {
    window.playNavSound();
    if (type === 'music') {
        const check = document.getElementById('check-music'); if(check) window.musicEnabled = check.checked;
        if (!window.musicEnabled) { if (MusicController.currentTrackId && audios[MusicController.currentTrackId]) audios[MusicController.currentTrackId].pause(); } 
        else { if (MusicController.currentTrackId && audios[MusicController.currentTrackId]) audios[MusicController.currentTrackId].play().catch(()=>{}); }
    } else if (type === 'sfx') {
        const check = document.getElementById('check-sfx'); if(check) window.sfxEnabled = check.checked;
    }
    if(window.saveAudioSettings) window.saveAudioSettings();
};

window.playNavSound = function() { if(!window.sfxEnabled) return; let s = audios['sfx-nav']; if(s) { try { if (s.readyState >= 2) s.currentTime = 0; s.play().catch(()=>{}); } catch(e) {} } };

let lastHoverTime = 0;
window.playUIHoverSound = function() { if(!window.sfxEnabled) return; let now = Date.now(); if (now - lastHoverTime < 50) return; let base = audios['sfx-ui-hover']; if(base) { try { let s = base.cloneNode(); s.volume = 0.3 * (window.masterVol || 1.0); s.play().catch(()=>{}); lastHoverTime = now; } catch(e){} } };

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
        if(configBtn) configBtn.style.display = (screenId === 'start-screen') ? 'none' : 'flex';
        const overlay = document.getElementById('config-overlay');
        if(overlay) overlay.style.display = 'none';
    }
}

window.toggleConfig = function() {
    window.playNavSound();
    const overlay = document.getElementById('config-overlay');
    if(!overlay) return;
    const box = overlay.querySelector('.config-box');
    const abandonArea = document.getElementById('abandon-area');

    if (overlay.style.display === 'flex') {
        box.classList.remove('config-pop-in'); box.classList.add('config-pop-out');
        setTimeout(() => { overlay.style.display = 'none'; box.classList.remove('config-pop-out'); }, 200);
    } else {
        const isGameActive = document.getElementById('game-screen').classList.contains('active');
        if(abandonArea) abandonArea.style.display = isGameActive ? 'block' : 'none';
        overlay.style.display = 'flex'; box.classList.add('config-pop-in');
    }
};

window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) { ds.style.display = 'flex'; ds.style.opacity = '1'; ds.style.pointerEvents = 'auto'; const options = document.querySelectorAll('.deck-option'); options.forEach(opt => { opt.style = ""; const img = opt.querySelector('img'); if(img) img.style = ""; }); }
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen().catch(() => {}); } if (screen.orientation && screen.orientation.lock) { screen.orientation.lock('landscape').catch(() => {}); } } catch (e) {}
    window.showScreen('deck-selection-screen');
};

(function createRotateOverlay() { if (!document.getElementById('rotate-overlay')) { const div = document.createElement('div'); div.id = 'rotate-overlay'; div.innerHTML = `<div style="font-size: 50px; margin-bottom: 20px;">↻</div><div>GIRE O CELULAR<br>PARA JOGAR</div>`; document.body.appendChild(div); } })();

window.selectDeck = function(deckType) {
    if(audios['sfx-deck-select'] && window.sfxEnabled) { try { audios['sfx-deck-select'].currentTime = 0; audios['sfx-deck-select'].play().catch(()=>{}); } catch(e){} }
    window.currentDeck = deckType; 
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 
    if (deckType === 'mage') document.body.classList.add('theme-mago'); else document.body.classList.add('theme-cavaleiro');
    const options = document.querySelectorAll('.deck-option');
    options.forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; opt.style.transform = "scale(1.15) translateY(-20px)"; opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))"; opt.style.zIndex = "100"; const img = opt.querySelector('img'); if(img) img.style.filter = "grayscale(0%) brightness(1.2)";
        } else { opt.style.transition = "all 0.3s ease"; opt.style.transform = "scale(0.8) translateY(10px)"; opt.style.opacity = "0.2"; opt.style.filter = "grayscale(100%)"; }
    });
    setTimeout(() => { const selectionScreen = document.getElementById('deck-selection-screen'); selectionScreen.style.transition = "opacity 0.5s"; selectionScreen.style.opacity = "0"; setTimeout(() => { selectionScreen.style.display = 'none'; if (window.gameMode === 'pvp') initiateMatchmaking(); else window.transitionToGame(); }, 500); }, 400);
};

window.transitionToGame = function() {
    const transScreen = document.getElementById('transition-overlay'); const transText = transScreen.querySelector('.trans-text');
    if(transText) transText.innerText = "PREPARANDO BATALHA..."; if(transScreen) transScreen.classList.add('active');
    setTimeout(() => { MusicController.play('bgm-loop'); let bg = document.getElementById('game-background'); if(bg) bg.classList.remove('lobby-mode'); window.showScreen('game-screen'); const handEl = document.getElementById('player-hand'); if(handEl) handEl.innerHTML = ''; setTimeout(() => { if(transScreen) transScreen.classList.remove('active'); setTimeout(() => { startGameFlow(); }, 200); }, 1500); }, 500); 
}

window.transitionToLobby = function(skipAnim = false) {
    window.cleanupMatchState(); document.body.classList.remove('force-landscape');
    const ds = document.getElementById('deck-selection-screen'); if(ds) { ds.style.opacity = '0'; ds.style.pointerEvents = 'none'; ds.style.display = 'none'; ds.classList.remove('active'); }
    if (skipAnim) { window.goToLobby(false); }
    else { const transScreen = document.getElementById('transition-overlay'); const transText = transScreen.querySelector('.trans-text'); if(transText) transText.innerText = "RETORNANDO AO SAGUÃO..."; if(transScreen) transScreen.classList.add('active'); setTimeout(() => { window.goToLobby(false); setTimeout(() => { if(transScreen) transScreen.classList.remove('active'); }, 1000); }, 500); }
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) { window.showScreen('start-screen'); document.body.classList.remove('theme-cavaleiro', 'theme-mago'); MusicController.play('bgm-menu'); return; }
    window.cleanupMatchState(); document.body.classList.remove('theme-cavaleiro', 'theme-mago');
    let bg = document.getElementById('game-background'); if(bg) bg.classList.add('lobby-mode'); MusicController.play('bgm-menu'); createLobbyFlares();
      
    const userRef = doc(db, "players", currentUser.uid); const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0, settings: { vol: 0.5, music: true, sfx: true } });
        document.getElementById('lobby-username').innerText = `OLÁ, ${currentUser.displayName.split(' ')[0].toUpperCase()}`; document.getElementById('lobby-stats').innerText = `VITÓRIAS: 0 | PONTOS: 0`; window.updateVol('master', 0.5);
    } else {
        const d = userSnap.data(); document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`; document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;
        if(d.settings) {
            window.masterVol = d.settings.vol !== undefined ? d.settings.vol : 0.5; window.musicEnabled = d.settings.music !== undefined ? d.settings.music : true; window.sfxEnabled = d.settings.sfx !== undefined ? d.settings.sfx : true;
            let slider = document.getElementById('vol-slider'); if(slider) slider.value = window.masterVol;
            let chkM = document.getElementById('check-music'); if(chkM) chkM.checked = window.musicEnabled;
            let chkS = document.getElementById('check-sfx'); if(chkS) chkS.checked = window.sfxEnabled;
            window.updateVol('master', window.masterVol);
            if (!window.musicEnabled && MusicController.currentTrackId && audios[MusicController.currentTrackId]) { audios[MusicController.currentTrackId].pause(); } else if (window.musicEnabled && MusicController.currentTrackId && audios[MusicController.currentTrackId]) { audios[MusicController.currentTrackId].play().catch(()=>{}); }
        }
    }
    const q = query(collection(db, "players"), orderBy("score", "desc"), limit(10));
    onSnapshot(q, (snapshot) => { let html = '<table id="ranking-table"><thead><tr><th>#</th><th>JOGADOR</th><th>PTS</th></tr></thead><tbody>'; let pos = 1; snapshot.forEach((doc) => { const p = doc.data(); let rankClass = pos === 1 ? "rank-1" : (pos === 2 ? "rank-2" : (pos === 3 ? "rank-3" : "")); html += `<tr class="${rankClass}"><td class="rank-pos">${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`; pos++; }); html += '</tbody></table>'; document.getElementById('ranking-content').innerHTML = html; });
    window.showScreen('lobby-screen'); document.getElementById('end-screen').classList.remove('visible'); 
};

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; window.isResolvingTurn = false; window.pvpSelectedCardIndex = null; 
    const oldStatus = document.getElementById('pvp-status-bar'); if(oldStatus) oldStatus.remove();
    startCinematicLoop(); window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand'); if (handEl) { handEl.innerHTML = ''; handEl.classList.add('preparing'); }
    
    if (window.gameMode === 'pvp' && window.pvpStartData) {
        if (window.myRole === 'player1') { resetUnit(player, window.pvpStartData.player1.deck, 'player1'); resetUnit(monster, window.pvpStartData.player2.deck, 'player2'); } 
        else { resetUnit(player, window.pvpStartData.player2.deck, 'player2'); resetUnit(monster, window.pvpStartData.player1.deck, 'player1'); }
    } else { resetUnit(player, null, 'pve'); resetUnit(monster, null, 'pve'); }
    
    turnCount = 1; playerHistory = [];
    drawCardLogic(monster, 6); drawCardLogic(player, 6); 
    
    updateUI(); 
    dealAllInitialCards();
    if(window.gameMode === 'pvp') startPvPListener();
}

function startPvPListener() {
    if(!window.currentMatchId) return; if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    const matchRef = doc(db, "matches", window.currentMatchId); let namesUpdated = false;
    const ensureMyRole = (data) => { if (data.player1 && data.player1.uid === currentUser.uid) window.myRole = 'player1'; else if (data.player2 && data.player2.uid === currentUser.uid) window.myRole = 'player2'; };

    window.pvpUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return; const matchData = docSnap.data(); window.latestMatchData = matchData;
        if (matchData.player1.uid !== currentUser.uid && matchData.player2.uid !== currentUser.uid) return;
        ensureMyRole(matchData);

        if (matchData.status === 'abandoned') {
            if (matchData.abandonedBy && currentUser && matchData.abandonedBy !== currentUser.uid) {
                monster.hp = 0; updateUI(); isProcessing = true; MusicController.stopCurrent();
                setTimeout(() => { const title = document.getElementById('end-title'); title.innerText = "VITÓRIA"; title.className = "win-theme"; showCenterText("OPONENTE DESISTIU!", "#ffd700"); playSound('sfx-win'); if(window.registrarVitoriaOnline) window.registrarVitoriaOnline('pvp'); document.getElementById('end-screen').classList.add('visible'); window.cleanupMatchState(); }, 500);
            } return; 
        }

        if (!namesUpdated && matchData.player1 && matchData.player2) {
            let myName, enemyName; if (window.myRole === 'player1') { myName = matchData.player1.name; enemyName = matchData.player2.name; } else { myName = matchData.player2.name; enemyName = matchData.player1.name; }
            const pNameEl = document.querySelector('#p-stats-cluster .unit-name'); const mNameEl = document.querySelector('#m-stats-cluster .unit-name'); if(pNameEl) pNameEl.innerText = myName; if(mNameEl) mNameEl.innerText = enemyName; namesUpdated = true; 
        }

        const p1Ready = matchData.p1Move && matchData.p1Move.length > 0; const p2Ready = matchData.p2Move && matchData.p2Move.length > 0; updateUI();
        if (p1Ready && p2Ready) { if (!window.isResolvingTurn) { const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove(); resolvePvPTurn(matchData.p1Move, matchData.p2Move, matchData.p1Disarm, matchData.p2Disarm); } } else { if (window.myRole === 'player1' && p1Ready && !p2Ready) showPvPStatus("AGUARDANDO OPONENTE..."); else if (window.myRole === 'player2' && p2Ready && !p1Ready) showPvPStatus("AGUARDANDO OPONENTE..."); }
          
        if (window.gameMode === 'pvp' && window.myRole) {
            const myServerRole = window.myRole; const enemyServerRole = (window.myRole === 'player1') ? 'player2' : 'player1'; const myData = matchData[myServerRole]; const enemyData = matchData[enemyServerRole];
            if (!window.isResolvingTurn && myData && myData.hp !== undefined) { if (myData.hp < player.hp) { let dmg = player.hp - myData.hp; player.hp = myData.hp; showFloatingText('p-lvl', `-${dmg}`, "#ff7675"); triggerDamageEffect(true, true); updateUI(); checkEndGame(); } }
            if (enemyData) {
                if(enemyData.deck) monster.deck = [...enemyData.deck];
                const serverXP = enemyData.xp || []; const localXP = monster.xp || [];
                if (serverXP.length > localXP.length) { const startIdx = localXP.length; for (let i = startIdx; i < serverXP.length; i++) { const newCardKey = serverXP[i]; animateFly('m-deck-container', 'm-xp', newCardKey, () => { triggerXPGlow('m'); }, false, false, false); } monster.xp = [...serverXP]; updateUI(); } 
                else if (serverXP.length < localXP.length) {
                    monster.xp = [...serverXP];
                    if (enemyData.lvl && enemyData.lvl > monster.lvl) { triggerLevelUpVisuals('m'); playSound('sfx-levelup'); }
                    if(enemyData.lvl) monster.lvl = enemyData.lvl; if(enemyData.maxHp) monster.maxHp = enemyData.maxHp; if(enemyData.bonusAtk !== undefined) monster.bonusAtk = enemyData.bonusAtk; if(enemyData.bonusBlock !== undefined) monster.bonusBlock = enemyData.bonusBlock; if(enemyData.hp !== undefined) monster.hp = enemyData.hp; if(enemyData.hand !== undefined) monster.hand = [...enemyData.hand]; updateUI();
                }
            }
        }
    });
}

function showPvPStatus(msg) { let el = document.getElementById('pvp-status-bar'); if (!el) { el = document.createElement('div'); el.id = 'pvp-status-bar'; el.style.position = 'fixed'; el.style.top = '15%'; el.style.left = '50%'; el.style.transform = 'translateX(-50%)'; el.style.background = 'rgba(0,0,0,0.7)'; el.style.color = '#ffd700'; el.style.padding = '10px 20px'; el.style.borderRadius = '20px'; el.style.zIndex = '9999'; el.style.fontSize = '14px'; el.style.border = '1px solid #ffd700'; el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'; document.body.appendChild(el); } el.innerText = msg; }
function checkEndGame(){ if(player.hp<=0 || monster.hp<=0) { isProcessing = true; isLethalHover = false; MusicController.stopCurrent(); const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove(); setTimeout(()=>{ let title = document.getElementById('end-title'); let isWin = player.hp > 0; let isTie = player.hp <= 0 && monster.hp <= 0; if(isTie) { title.innerText = "EMPATE"; title.className = "tie-theme"; playSound('sfx-tie'); } else if(isWin) { title.innerText = "VITÓRIA"; title.className = "win-theme"; playSound('sfx-win'); } else { title.innerText = "DERROTA"; title.className = "lose-theme"; playSound('sfx-lose'); } if(isWin && !isTie) { if(window.registrarVitoriaOnline) window.registrarVitoriaOnline('pvp'); } else { if(window.registrarDerrotaOnline) window.registrarDerrotaOnline(window.gameMode); } document.getElementById('end-screen').classList.add('visible'); }, 1000); } else { isProcessing = false; } }

onAuthStateChanged(auth, (user) => { if (user) { currentUser = user; window.goToLobby(true); } else { currentUser = null; window.showScreen('start-screen'); const bg = document.getElementById('game-background'); if(bg) bg.classList.remove('lobby-mode'); const btnTxt = document.getElementById('btn-text'); if(btnTxt) btnTxt.innerText = "LOGIN COM GOOGLE"; MusicController.play('bgm-menu'); } });
window.googleLogin = async function() { window.playNavSound(); const btnText = document.getElementById('btn-text'); btnText.innerText = "CONECTANDO..."; try { await loginWithGoogle(); } catch (error) { btnText.innerText = "ERRO - TENTE NOVAMENTE"; setTimeout(() => btnText.innerText = "LOGIN COM GOOGLE", 3000); } };
window.handleLogout = function() { window.playNavSound(); logoutGoogle().then(() => { location.reload(); }); };

async function saveMatchHistory(result, pointsChange) {
    if (!currentUser) return;
    try { let enemyName = "PVE"; if (window.gameMode === 'pvp') { if (window.pvpStartData) { enemyName = (window.myRole === 'player1') ? window.pvpStartData.player2.name : window.pvpStartData.player1.name; } if (!enemyName || enemyName === "PVE") { const domName = document.querySelector('#m-stats-cluster .unit-name'); if (domName && domName.innerText !== 'Monstro') enemyName = domName.innerText; } if(enemyName) enemyName = enemyName.split(' ')[0].toUpperCase(); } await saveMatchHistoryDB(currentUser, enemyName, window.gameMode || 'pve', window.currentDeck, pointsChange); } catch (e) {}
}

window.registrarVitoriaOnline = async function(modo = 'pve') { if(!currentUser) return; try { let modoAtual = window.gameMode || 'pve'; if (modo === 'pvp') modoAtual = 'pvp'; let pontosGanhos = await registrarVitoriaDB(currentUser, modoAtual); if(pontosGanhos > 0) await saveMatchHistory('WIN', pontosGanhos); } catch(e) {} };
window.registrarDerrotaOnline = async function(modo = 'pve') { if(!currentUser) return; try { let modoAtual = window.gameMode || 'pve'; if (modo === 'pvp') modoAtual = 'pvp'; let pontosPerdidos = await registrarDerrotaDB(currentUser, modoAtual); if(pontosPerdidos !== 0) await saveMatchHistory('LOSS', pontosPerdidos); } catch(e) {} };

window.restartMatch = function() { document.getElementById('end-screen').classList.remove('visible'); setTimeout(startGameFlow, 50); MusicController.play('bgm-loop'); }
async function notifyAbandonment() { if (!window.currentMatchId || !currentUser) return; await notifyAbandonmentDB(window.currentMatchId, currentUser.uid); }
window.abandonMatch = function() { if(document.getElementById('game-screen').classList.contains('active')) { window.toggleConfig(); window.openModal("ABANDONAR?", "Sair da partida contará como DERROTA. Tem certeza?", ["CANCELAR", "SAIR"], async (choice) => { if (choice === "SAIR") { if (window.gameMode === 'pvp') { await notifyAbandonment(); } window.registrarDerrotaOnline(window.gameMode); window.transitionToLobby(); } }); } }

function preloadGame() { ASSETS_TO_LOAD.images.forEach(src => { let img = new Image(); img.src = src; window.gameAssets.push(img); img.onload = () => updateLoader(); img.onerror = () => updateLoader(); }); ASSETS_TO_LOAD.audio.forEach(a => { let s = new Audio(); s.src = a.src; s.preload = 'auto'; if(a.loop) s.loop = true; audios[a.id] = s; window.gameAssets.push(s); s.onloadedmetadata = () => updateLoader(); s.onerror = () => updateLoader(); setTimeout(() => { if(s.readyState === 0) updateLoader(); }, 2000); }); }
function updateLoader() { assetsLoaded++; let pct = Math.min(100, (assetsLoaded / totalAssets) * 100); const fill = document.getElementById('loader-fill'); if(fill) fill.style.width = pct + '%'; if(assetsLoaded >= totalAssets) { if(window.updateVol) window.updateVol('master', window.masterVol || 0.5); setTimeout(() => { const loading = document.getElementById('loading-screen'); if(loading) { loading.style.opacity = '0'; setTimeout(() => loading.style.display = 'none', 500); } if(!window.hoverLogicInitialized) { initGlobalHoverLogic(); window.hoverLogicInitialized = true; } }, 800); document.body.addEventListener('click', () => { if (!MusicController.currentTrackId || (audios['bgm-menu'] && audios['bgm-menu'].paused && window.musicEnabled)) { MusicController.play('bgm-menu'); } }, { once: true }); } }
function initGlobalHoverLogic() { let lastTarget = null; document.body.addEventListener('mouseover', (e) => { const selector = 'button, .circle-btn, #btn-fullscreen, .deck-option, .mini-btn'; const target = e.target.closest(selector); if (target && target !== lastTarget) { lastTarget = target; window.playUIHoverSound(); } else if (!target) { lastTarget = null; } }); }

window.onload = function() { const deckScreen = document.getElementById('deck-selection-screen'); if (deckScreen) { let backBtn = deckScreen.querySelector('.btn-back'); if (!backBtn) backBtn = deckScreen.querySelector('.circle-btn'); if (!backBtn) backBtn = deckScreen.querySelector('button'); if (backBtn) { backBtn.style.zIndex = "9999"; backBtn.style.pointerEvents = "all"; backBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); window.playNavSound(); window.transitionToLobby(true); }; } } };
window.addEventListener('beforeunload', () => { if (window.gameMode === 'pvp' && window.currentMatchId && !document.getElementById('end-screen').classList.contains('visible')) { notifyAbandonment(); } });
window.toggleFullScreen = function() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => console.log(e)); } else { if (document.exitFullscreen) { document.exitFullscreen(); } } }

function createLobbyFlares() { const container = document.getElementById('lobby-particles'); if(!container) return; container.innerHTML = ''; for(let i=0; i < 70; i++) { let flare = document.createElement('div'); flare.className = 'lobby-flare'; flare.style.left = Math.random() * 100 + '%'; flare.style.top = Math.random() * 100 + '%'; let size = 4 + Math.random() * 18; flare.style.width = size + 'px'; flare.style.height = size + 'px'; flare.style.animationDuration = (3 + Math.random() * 5) + 's'; flare.style.animationDelay = (Math.random() * 4) + 's'; container.appendChild(flare); } }
function startCinematicLoop() { const c = audios['sfx-cine']; if(c) {try { c.volume = 0; c.play().catch(()=>{}); } catch(e){} if(mixerInterval) clearInterval(mixerInterval); mixerInterval = setInterval(updateAudioMixer, 30); }}
function updateAudioMixer() { const cineAudio = audios['sfx-cine']; if(!cineAudio) return; const mVol = window.masterVol || 1.0; const maxCine = 0.6 * mVol; let targetCine = isLethalHover ? maxCine : 0; if(!window.sfxEnabled) { try { cineAudio.volume = 0; } catch(e){} return; } try { if(cineAudio.volume < targetCine) cineAudio.volume = Math.min(targetCine, cineAudio.volume + 0.05); else if(cineAudio.volume > targetCine) cineAudio.volume = Math.max(targetCine, cineAudio.volume - 0.05); } catch(e){} }

window.updateVol = function(type, val) { 
    if(type==='master') window.masterVol = parseFloat(val); 
    ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-hit-mage', 'sfx-block', 'sfx-block-mage', 'sfx-heal', 'sfx-levelup', 'sfx-train', 'sfx-disarm', 'sfx-deck-select', 'sfx-hover', 'sfx-ui-hover', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'sfx-nav'].forEach(k => { 
        if(audios[k]) { let vol = window.masterVol || 1.0; try { if(k === 'sfx-ui-hover') { audios[k].volume = 0.3 * vol; } else if (k === 'sfx-levelup') { audios[k].volume = 1.0 * vol; } else if (k === 'sfx-train') { audios[k].volume = 0.5 * vol; } else { audios[k].volume = 0.8 * vol; } } catch(e){} }
    }); 
    if(window.saveAudioSettings && type==='master') window.saveAudioSettings();
}
function playSound(key) { if (!window.sfxEnabled && !key.startsWith('bgm')) return; if(audios[key]) { try { if (key === 'sfx-levelup') { audios[key].volume = 1.0 * (window.masterVol || 1.0); if (audios[key].readyState >= 2) audios[key].currentTime = 0; audios[key].play().catch(e => console.log(e)); let clone = audios[key].cloneNode(); clone.volume = audios[key].volume; clone.play().catch(()=>{}); } else { if (audios[key].readyState >= 2) audios[key].currentTime = 0; audios[key].play().catch(e => console.log(e)); } } catch(e){} } }

window.saveAudioSettings = async function() { if (!currentUser) return; try { const userRef = doc(db, "players", currentUser.uid); await updateDoc(userRef, { settings: { vol: window.masterVol, music: window.musicEnabled, sfx: window.sfxEnabled } }); } catch(e) {} }
function initAmbientParticles() { const container = document.getElementById('ambient-particles'); if(!container) return; for(let i=0; i<50; i++) { let d = document.createElement('div'); d.className = 'ember'; d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (5 + Math.random() * 5) + 's'; d.style.setProperty('--mx', (Math.random() - 0.5) * 50 + 'px'); container.appendChild(d); } } initAmbientParticles();
function spawnParticles(x, y, color) { for(let i=0; i<15; i++) { let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color; p.style.left = x + 'px'; p.style.top = y + 'px'; let angle = Math.random() * Math.PI * 2; let vel = 50 + Math.random() * 100; p.style.setProperty('--tx', `${Math.cos(angle)*vel}px`); p.style.setProperty('--ty', `${Math.sin(angle)*vel}px`); document.body.appendChild(p); setTimeout(() => p.remove(), 800); } }

function triggerDamageEffect(isPlayer, playAudio = true) { try { if(playAudio) { if(!isPlayer && window.currentDeck === 'mage') { playSound('sfx-hit-mage'); } else { playSound('sfx-hit'); } } let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId); if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#ff4757'); } if (isPlayer) { document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 400); if(window.triggerDamageEffect) window.triggerDamageEffect(); let ov = document.getElementById('dmg-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 150); } } } catch(e) {} }
function triggerCritEffect() { let ov = document.getElementById('crit-overlay'); if(ov) { ov.style.opacity = '1'; document.body.style.filter = "grayscale(0.8) contrast(1.2)"; document.body.style.transition = "filter 0.05s"; setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => { document.body.style.transition = "filter 0.5s"; document.body.style.filter = "none"; }, 800); }, 100); } }
function triggerHealEffect(isPlayer) { try { let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId); if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#2ecc71'); } if (isPlayer) { if(window.triggerHealEffect) window.triggerHealEffect(); let ov = document.getElementById('heal-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 300); } } } catch(e) {} }
function triggerBlockEffect(isPlayer) { try { if(isPlayer && window.currentDeck === 'mage') { playSound('sfx-block-mage'); } else { playSound('sfx-block'); } if (!isPlayer) { if(window.triggerBlockEffect) window.triggerBlockEffect(); let ov = document.getElementById('block-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 200); } document.body.classList.add('shake-screen'); setTimeout(() => document.body.classList.remove('shake-screen'), 200); } } catch(e) {} }
function triggerXPGlow(unitId) { let xpArea = document.getElementById(unitId + '-xp'); if(xpArea) { xpArea.classList.add('xp-glow'); setTimeout(() => xpArea.classList.remove('xp-glow'), 600); } }
function showCenterText(txt, col) { let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; if(col) el.style.color = col; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }

function dealCardsAnimated(containerId, cb) {
    if(window.sfxEnabled) playSound('sfx-deal');
    const handEl = document.getElementById(containerId);
    if(!handEl) { if(cb) cb(); return; }
    const cards = Array.from(handEl.children);
    if(cards.length === 0) { if(cb) cb(); return; }
    cards.forEach((cardEl, i) => { cardEl.classList.add('intro-anim'); cardEl.style.animationDelay = (i * 0.1) + 's'; cardEl.style.opacity = '1'; });
    setTimeout(() => { cards.forEach(c => { c.classList.remove('intro-anim'); c.style.animationDelay = ''; c.style.opacity = '1'; }); if(cb) cb(); }, 500 + cards.length * 100);
}

function dealAllInitialCards() { 
    isProcessing = true; window.isMatchStarting = false; window.isDealingCards = true; 
    dealCardsAnimated('player-hand', () => { window.isDealingCards = false; isProcessing = false; updateUI(); }); 
}

function onCardClick(index) {
    if(isProcessing) return; if (!player.hand[index]) return;
    if (window.gameMode === 'pvp' && window.pvpSelectedCardIndex !== null) return;
    playSound('sfx-play'); document.body.classList.remove('focus-hand'); document.body.classList.remove('cinematic-active'); document.body.classList.remove('tension-active');
    document.getElementById('tooltip-box').style.display = 'none'; isLethalHover = false; 
    let cardKey = player.hand[index];
    if(player.disabled === cardKey) { showCenterText("DESARMADA!"); return; }
    if(cardKey === 'DESARMAR') { window.openModal('ALVO DO DESARME', 'Qual ação bloquear no inimigo?', ACTION_KEYS, (choice) => { if(window.gameMode === 'pvp') { lockInPvPMove(index, choice); } else { playCardFlow(index, choice); } }); } 
    else { if(window.gameMode === 'pvp') { lockInPvPMove(index, null); } else { playCardFlow(index, null); } }
}

async function lockInPvPMove(index, disarmChoice) {
    if (!window.myRole && window.pvpStartData && currentUser) { if (window.pvpStartData.player1.uid === currentUser.uid) window.myRole = 'player1'; else window.myRole = 'player2'; }
    const handContainer = document.getElementById('player-hand'); const cardEl = handContainer.children[index]; if(cardEl) { cardEl.classList.add('card-selected'); }
    window.pvpSelectedCardIndex = index; isProcessing = true; showPvPStatus("AGUARDANDO OPONENTE...");
    const cardKey = player.hand[index]; const matchRef = doc(db, "matches", window.currentMatchId);
    const updateField = (window.myRole === 'player1') ? 'p1Move' : 'p2Move'; const disarmField = (window.myRole === 'player1') ? 'p1Disarm' : 'p2Disarm';
    try { await updateDoc(matchRef, { [updateField]: cardKey, [disarmField]: disarmChoice || null }); } 
    catch (e) { isProcessing = false; window.pvpSelectedCardIndex = null; if(cardEl) cardEl.classList.remove('card-selected'); const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove(); showCenterText("ERRO AO ENVIAR", "red"); }
}

async function playCardFlow(index, pDisarmChoice) {
    isProcessing = true; let cardKey = player.hand.splice(index, 1)[0]; playerHistory.push(cardKey);
    let aiMove = getBestAIMove(monster, player, playerHistory, turnCount); let mCardKey = 'ATAQUE'; let mDisarmTarget = null; 
    if(aiMove) { mCardKey = aiMove.card; monster.hand.splice(aiMove.index, 1); if(mCardKey === 'DESARMAR') { if(player.hp <= (monster.lvl + monster.bonusAtk + 2)) { mDisarmTarget = 'BLOQUEIO'; } else { let pCounts = {}; player.xp.forEach(x => pCounts[x] = (pCounts[x]||0)+1); let bestTarget = null; for(let k in pCounts) if(pCounts[k] >= 3) bestTarget = k; if(bestTarget) mDisarmTarget = bestTarget; else mDisarmTarget = 'ATAQUE'; } } } 
    else { if(monster.hand.length > 0) mCardKey = monster.hand.pop(); else { drawCardLogic(monster, 1); if(monster.hand.length > 0) mCardKey = monster.hand.pop(); } }

    let handContainer = document.getElementById('player-hand'); let realCardEl = handContainer.children[index]; let startRect = null;
    if(realCardEl) { startRect = realCardEl.getBoundingClientRect(); realCardEl.style.transition = 'none'; realCardEl.style.setProperty('opacity', '0', 'important'); realCardEl.style.setProperty('visibility', 'hidden', 'important'); realCardEl.innerHTML = ''; realCardEl.style.border = 'none'; realCardEl.style.background = 'none'; realCardEl.style.boxShadow = 'none'; }
    
    animateFly(startRect || 'player-hand', 'p-slot', cardKey, () => { renderTable(cardKey, 'p-slot', true); updateUI(); }, false, true, true); 
    const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 - (window.innerWidth < 768 ? 42 : 52.5) };
    animateFly(opponentHandOrigin, 'm-slot', mCardKey, () => { renderTable(mCardKey, 'm-slot', false); setTimeout(() => resolveTurn(cardKey, mCardKey, pDisarmChoice, mDisarmTarget), 500); }, false, true, false);
}

async function resolvePvPTurn(p1Move, p2Move, p1Disarm, p2Disarm) {
    if (window.isResolvingTurn) return; window.isResolvingTurn = true; isProcessing = true; 
    const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove();
    let myMove, enemyMove, myDisarmChoice, enemyDisarmChoice;
    if (window.myRole === 'player1') { myMove = p1Move; enemyMove = p2Move; myDisarmChoice = p1Disarm; enemyDisarmChoice = p2Disarm; } else { myMove = p2Move; enemyMove = p1Move; myDisarmChoice = p2Disarm; enemyDisarmChoice = p1Disarm; }
    try {
        if (window.pvpSelectedCardIndex === null || window.pvpSelectedCardIndex === undefined) { window.pvpSelectedCardIndex = player.hand.indexOf(myMove); }
        const handContainer = document.getElementById('player-hand'); let myCardEl = null; let startRect = null;
        if (handContainer) { if (window.pvpSelectedCardIndex > -1 && handContainer.children[window.pvpSelectedCardIndex]) { myCardEl = handContainer.children[window.pvpSelectedCardIndex]; } else { const handCards = Array.from(handContainer.children); if(handCards.length > 0) myCardEl = handCards[0]; } }
        if (myCardEl) { startRect = myCardEl.getBoundingClientRect(); myCardEl.classList.remove('card-selected'); myCardEl.style.opacity = '0'; }
        if (window.pvpSelectedCardIndex > -1 && player.hand[window.pvpSelectedCardIndex] === myMove) { player.hand.splice(window.pvpSelectedCardIndex, 1); window.pvpSelectedCardIndex = null; } else { const idx = player.hand.indexOf(myMove); if(idx > -1) player.hand.splice(idx, 1); window.pvpSelectedCardIndex = null; }
        playerHistory.push(myMove);
        animateFly(startRect || 'player-hand', 'p-slot', myMove, () => { renderTable(myMove, 'p-slot', true); }, false, true, true);
        const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 }; animateFly(opponentHandOrigin, 'm-slot', enemyMove, () => { renderTable(enemyMove, 'm-slot', false); }, false, true, false);
    } catch (e) {}

    setTimeout(() => {
        try {
            if (window.myRole === 'player1') { setTimeout(() => { const matchRef = doc(db, "matches", window.currentMatchId); updateDoc(matchRef, { p1Move: null, p2Move: null, p1Disarm: null, p2Disarm: null, turn: increment(1) }); }, 4000); }
            resolveTurn(myMove, enemyMove, myDisarmChoice, enemyDisarmChoice);
        } catch (error) { updateUI(); window.isResolvingTurn = false; isProcessing = false; } 
        setTimeout(() => { window.pvpSelectedCardIndex = null; window.isResolvingTurn = false; if (isProcessing) { isProcessing = false; } }, 4500);
    }, 600);
}

async function commitTurnToDB(pAct, extraCard = null) {
    if (!window.currentMatchId) return; const matchRef = doc(db, "matches", window.currentMatchId);
    let newXP = [...player.xp]; let newDeck = [...player.deck]; 
    try { let updateData = {}; if (window.myRole === 'player1') { updateData['player1.xp'] = newXP; updateData['player1.deck'] = newDeck; } else { updateData['player2.xp'] = newXP; updateData['player2.deck'] = newDeck; } await updateDoc(matchRef, updateData); } catch (e) {}
}

function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    let pDmg = 0, mDmg = 0;
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train'); if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');
    if(mAct === 'ATAQUE') { pDmg += monster.lvl; } if(pAct === 'ATAQUE') { mDmg += player.lvl; }
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') { mDmg += (1 + player.bonusBlock); } } if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') { pDmg += (1 + monster.bonusBlock); } }

    let clash = false; let pBlocks = (pAct === 'BLOQUEIO' && mAct === 'ATAQUE'); let mBlocks = (mAct === 'BLOQUEIO' && pAct === 'ATAQUE'); 
    if(pBlocks) { clash = true; triggerBlockEffect(true); } else if(mBlocks) { clash = true; triggerBlockEffect(false); }

    let nextPlayerDisabled = null; let nextMonsterDisabled = null;
    if(mAct === 'DESARMAR') { if(mDisarmTarget) nextPlayerDisabled = mDisarmTarget; else nextPlayerDisabled = 'ATAQUE'; } if(pAct === 'DESARMAR') { nextMonsterDisabled = pDisarmChoice; }
    if(pAct === 'DESARMAR' && mAct === 'DESARMAR') { nextPlayerDisabled = null; nextMonsterDisabled = null; showCenterText("ANULADO", "#aaa"); }

    player.disabled = nextPlayerDisabled; monster.disabled = nextMonsterDisabled;
    if(pDmg >= 4 || mDmg >= 4) triggerCritEffect();

    if(pDmg > 0) { player.hp -= pDmg; showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); let soundOn = !(clash && mAct === 'BLOQUEIO'); if (!mBlocks) { triggerDamageEffect(true, soundOn); } }
    if(mDmg > 0) { monster.hp -= mDmg; showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); let soundOn = !(clash && pAct === 'BLOQUEIO'); triggerDamageEffect(false, soundOn); }
    
    updateUI(); let pDead = player.hp <= 0, mDead = monster.hp <= 0;
    
    if(!pDead && pAct === 'DESCANSAR') { let healAmount = (pDmg === 0) ? 3 : 2; player.hp = Math.min(player.maxHp, player.hp + healAmount); showFloatingText('p-lvl', `+${healAmount} HP`, "#55efc4"); triggerHealEffect(true); playSound('sfx-heal'); }
    if(!mDead && mAct === 'DESCANSAR') { let healAmount = (mDmg === 0) ? 3 : 2; monster.hp = Math.min(monster.maxHp, monster.hp + healAmount); triggerHealEffect(false); playSound('sfx-heal'); }

    function handleExtraXP(u) { 
        if (window.gameMode === 'pvp' && window.currentMatchId) { if (u === player) { if(u.deck.length > 0) { let card = u.deck.pop(); animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { u.xp.push(card); triggerXPGlow(u.id); updateUI(); }, false, false, true); } } } 
        else { if(u.deck.length > 0) { let card = u.deck.pop(); animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { u.xp.push(card); triggerXPGlow(u.id); updateUI(); }, false, false, (u.id === 'p')); } }
    }

    if(!pDead && pAct === 'TREINAR') handleExtraXP(player); if(!mDead && mAct === 'TREINAR') handleExtraXP(monster);
    if(!pDead && pAct === 'ATAQUE' && mAct === 'DESCANSAR') handleExtraXP(player); if(!mDead && mAct === 'ATAQUE' && pAct === 'DESCANSAR') handleExtraXP(monster);

    setTimeout(() => {
        animateFly('p-slot', 'p-xp', pAct, () => { 
            if(!pDead) { player.xp.push(pAct); triggerXPGlow('p'); updateUI(); if (window.gameMode === 'pvp') { commitTurnToDB(pAct); } } 
            
            checkLevelUp(player, (leveledUp) => { 
                if(!pDead) {
                    if(!leveledUp) { drawCardLogic(player, 1); }
                    turnCount++; updateUI(); isProcessing = false; 
                } 
            }); 
        }, false, false, true);

        animateFly('m-slot', 'm-xp', mAct, () => { 
            if (window.gameMode !== 'pvp' && !mDead) { monster.xp.push(mAct); triggerXPGlow('m'); updateUI(); } 
            checkLevelUp(monster, (leveledUp) => { 
                if(!mDead && !leveledUp) { drawCardLogic(monster, 1); }
                checkEndGame(); 
            }); 
        }, false, false, false);
        
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}

// === LÓGICA DE LEVEL UP COM COMPRA ANIMADA ===
function checkLevelUp(u, doneCb) {
    if(u.xp.length >= 5) {
        let xpContainer = document.getElementById(u.id + '-xp'); 
        let minis = Array.from(xpContainer.getElementsByClassName('xp-mini'));
        minis.forEach(realCard => {
            let rect = realCard.getBoundingClientRect(); 
            let clone = document.createElement('div'); clone.className = 'xp-anim-clone'; clone.style.left = rect.left + 'px'; clone.style.top = rect.top + 'px'; clone.style.width = rect.width + 'px'; clone.style.height = rect.height + 'px'; clone.style.backgroundImage = realCard.style.backgroundImage;
            if (u.id === 'p') clone.classList.add('xp-fly-up'); else clone.classList.add('xp-fly-down'); document.body.appendChild(clone);
        });
        minis.forEach(m => m.style.opacity = '0');

        setTimeout(() => {
            let counts = {}; u.xp.forEach(x => counts[x] = (counts[x]||0)+1); let triggers = []; for(let k in counts) if(counts[k] >= 3 && k !== 'DESCANSAR') triggers.push(k);
            
            processMasteries(u, triggers, () => {
                let lvlEl = document.getElementById(u.id+'-lvl'); u.lvl++; lvlEl.classList.add('level-up-anim'); triggerLevelUpVisuals(u.id); playSound('sfx-levelup'); setTimeout(() => lvlEl.classList.remove('level-up-anim'), 1000);

                let deckContainerId = (u.id === 'p') ? 'p-deck-container' : 'm-deck';
                if (u.id === 'p') {
                    const handEl = document.getElementById('player-hand');
                    if (handEl) {
                        const cardsDOM = Array.from(handEl.children);
                        cardsDOM.forEach((cardEl, i) => {
                            let rect = cardEl.getBoundingClientRect(); let key = u.hand[i];
                            if (key) { animateFly(rect, deckContainerId, key, null, false, false, true); }
                            cardEl.style.opacity = '0'; 
                        });
                    }
                }

                setTimeout(() => {
                    u.xp.forEach(x => u.deck.push(x)); u.xp = []; 
                    u.hand.forEach(x => u.deck.push(x)); u.hand = [];
                    
                    if (window.gameMode === 'pvp' && window.currentMatchId) {
                        let s = stringToSeed(window.currentMatchId + u.originalRole) + u.lvl;
                        shuffle(u.deck, s); drawCardLogic(u, 6);
                        if (u === player) { syncLevelUpToDB(u); }
                    } else {
                        shuffle(u.deck); drawCardLogic(u, 6);
                    }

                    let clones = document.getElementsByClassName('xp-anim-clone'); while(clones.length > 0) clones[0].remove();
                    
                    if (u.id === 'p') {
                        window.isDealingCards = true;
                        updateUI(); 
                        dealCardsAnimated('player-hand', () => { window.isDealingCards = false; updateUI(); doneCb(true); });
                    } else {
                        updateUI(); doneCb(true);
                    }
                }, 400); 
            });
        }, 1000); 
    } else { doneCb(false); }
}

function triggerLevelUpVisuals(unitId) { let clusterId = (unitId === 'p') ? 'p-stats-cluster' : 'm-stats-cluster'; let cluster = document.getElementById(clusterId); if(!cluster) return; const text = document.createElement('div'); text.innerText = "LEVEL UP!"; text.className = 'levelup-text'; if (unitId === 'p') { text.classList.add('lvl-anim-up'); } else { text.classList.add('lvl-anim-down'); } cluster.appendChild(text); setTimeout(() => { text.remove(); }, 2000); }
function processMasteries(u, triggers, cb) { if(triggers.length === 0) { cb(); return; } let type = triggers.shift(); if(type === 'TREINAR' && u.id === 'p') { let opts = [...new Set(u.xp.filter(x => x !== 'TREINAR'))]; if(opts.length > 0) window.openModal("MAESTRIA SUPREMA", "Copiar qual maestria?", opts, (c) => { if(c === 'DESARMAR') { window.openModal("MAESTRIA TÁTICA", "Bloquear qual ação?", ACTION_KEYS, (targetAction) => { monster.disabled = targetAction; showFloatingText('m-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }); } else { applyMastery(u,c); processMasteries(u, triggers, cb); } }); else processMasteries(u, triggers, cb); } else if(type === 'DESARMAR' && u.id === 'p') { window.openModal("MAESTRIA TÁTICA", "Bloquear qual ação?", ACTION_KEYS, (c) => { monster.disabled = c; showFloatingText('m-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }); } else if(type === 'TREINAR' && u.id === 'm') { let opts = [...new Set(u.xp.filter(x => x !== 'TREINAR' && x !== 'DESCANSAR'))]; if(opts.length > 0) { let choice = opts[0]; if(u.hp <= 4 && opts.includes('DESCANSAR')) choice = 'DESCANSAR'; else if(opts.includes('ATAQUE')) choice = 'ATAQUE'; else if(opts.includes('BLOQUEIO')) choice = 'BLOQUEIO'; if(choice === 'DESARMAR') { let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); } else { applyMastery(u, choice); } } processMasteries(u, triggers, cb); } else if(type === 'DESARMAR' && u.id === 'm') { let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); } else { applyMastery(u, type); processMasteries(u, triggers, cb); } }
function applyMastery(u, k) { if(k === 'ATAQUE') { u.bonusAtk++; let target = (u === player) ? monster : player; target.hp -= u.bonusAtk; showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675"); triggerDamageEffect(u !== player); checkEndGame(); } if(k === 'BLOQUEIO') u.bonusBlock++; if(k === 'DESCANSAR') { u.maxHp++; showFloatingText(u.id+'-hp-txt', "+1 MAX", "#55efc4"); } updateUI(); }

function animateFly(startId, endId, cardKey, cb, initialDeal = false, isToTable = false, isPlayer = false) {
    let s; if (typeof startId === 'string') { let el = document.getElementById(startId); if (!el) s = { top: 0, left: 0, width: 0, height: 0 }; else s = el.getBoundingClientRect(); } else { s = startId; }
    let e = { top: 0, left: 0 }; let destEl = document.getElementById(endId); if(destEl) e = destEl.getBoundingClientRect();
    const fly = document.createElement('div'); fly.className = `card flying-card ${CARDS_DB[cardKey].color}`;
    let imgUrl = getCardArt(cardKey, isPlayer); fly.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div>`;
    if (isToTable) fly.classList.add('card-bounce');
    if(typeof startId !== 'string' && s.width > 0) { fly.style.width = s.width + 'px'; fly.style.height = s.height + 'px'; } else { let w = window.innerWidth < 768 ? '84px' : '105px'; let h = window.innerWidth < 768 ? '120px' : '150px'; fly.style.width=w; fly.style.height=h; }
    let tableW = window.innerWidth < 768 ? '110px' : '180px'; let tableH = window.innerWidth < 768 ? '170px' : '260px';
    fly.style.top=s.top+'px'; fly.style.left=s.left+'px'; if(endId.includes('xp')) fly.style.transform='scale(0.3)';
    document.body.appendChild(fly); fly.offsetHeight;
    if(isToTable) { fly.style.width=tableW; fly.style.height=tableH; }
    fly.style.top=e.top+'px'; fly.style.left=e.left+'px'; setTimeout(() => { fly.remove(); if(cb) cb(); }, 250);
}

function renderTable(key, slotId, isPlayer = false) { let el = document.getElementById(slotId); el.innerHTML = ''; let card = document.createElement('div'); card.className = `card ${CARDS_DB[key].color} card-on-table`; let imgUrl = getCardArt(key, isPlayer); card.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div>`; el.appendChild(card); }

function updateUI() { 
    if (window.isDealingCards && !window.isMatchStarting) return; // Trava a atualização pesada no meio de lidar
    updateUnit(player); updateUnit(monster); document.getElementById('turn-txt').innerText = "TURNO " + turnCount; 
}

function updateUnit(u) {
    document.getElementById(u.id+'-lvl').firstChild.nodeValue = u.lvl; document.getElementById(u.id+'-hp-txt').innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
    let hpPct = (Math.max(0,u.hp)/u.maxHp)*100; let hpFill = document.getElementById(u.id+'-hp-fill'); hpFill.style.width = hpPct + '%';
    if(hpPct > 66) hpFill.style.background = "#4cd137"; else if(hpPct > 33) hpFill.style.background = "#fbc531"; else hpFill.style.background = "#e84118";
    document.getElementById(u.id+'-deck-count').innerText = u.deck.length;
    
    if(u === player) {
        let deckImgEl = document.getElementById('p-deck-img');
        if(window.currentDeck === 'mage') { deckImgEl.src = MAGE_ASSETS.DECK_IMG; } else { deckImgEl.src = 'assets/img/deck_verso_cavaleiro.webp'; }
    }

    if(u===player) {
        let hc=document.getElementById('player-hand'); hc.innerHTML='';
        if (isProcessing) { hc.style.pointerEvents = 'none'; } else { hc.style.pointerEvents = 'auto'; }
        let moveInDB = null; if (window.gameMode === 'pvp' && window.latestMatchData) { const role = window.myRole; const field = role === 'player1' ? 'p1Move' : 'p2Move'; moveInDB = window.latestMatchData[field]; }

        u.hand.forEach((k,i)=>{
            let c=document.createElement('div'); c.className=`card hand-card ${CARDS_DB[k].color}`; c.style.setProperty('--flare-col', CARDS_DB[k].fCol);
            if(u.disabled===k) c.classList.add('disabled-card');
            
            const isLocallySelected = (window.gameMode === 'pvp' && window.pvpSelectedCardIndex === i);
            const isDBSelected = (window.gameMode === 'pvp' && moveInDB === k && window.pvpSelectedCardIndex === null);

            if (isLocallySelected || isDBSelected) { c.classList.add('card-selected'); hc.style.pointerEvents = 'none'; }
            if(window.isMatchStarting || window.isDealingCards) { c.style.opacity = '0'; } else { c.style.opacity = '1'; }

            let lethalType = checkCardLethality(k, player, monster); let flaresHTML = ''; for(let f=1; f<=25; f++) flaresHTML += `<div class="flare-spark fs-${f}"></div>`;
            let imgUrl = getCardArt(k, true); c.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div><div class="flares-container">${flaresHTML}</div>`;
            c.onclick=()=>onCardClick(i); bindFixedTooltip(c,k); 
            c.onmouseenter = (e) => { bindFixedTooltip(c,k).onmouseenter(e); document.body.classList.add('focus-hand'); document.body.classList.add('cinematic-active'); if(lethalType) { isLethalHover = true; document.body.classList.add('tension-active'); } playSound('sfx-hover'); };
            c.onmouseleave = (e) => { tt.style.display='none'; document.body.classList.remove('focus-hand'); document.body.classList.remove('cinematic-active'); document.body.classList.remove('tension-active'); isLethalHover = false; };
            hc.appendChild(c); apply3DTilt(c, true);
        });
    }
    
    let xc=document.getElementById(u.id+'-xp'); xc.innerHTML='';
    u.xp.forEach(k=>{ 
        let d=document.createElement('div'); d.className='xp-mini'; let imgUrl = getCardArt(k, (u === player)); d.style.backgroundImage = `url('${imgUrl}')`; 
        d.onmouseenter = () => { document.body.classList.add('focus-xp'); playSound('sfx-hover'); }; d.onmouseleave = () => { document.body.classList.remove('focus-xp'); }; xc.appendChild(d); 
    });
    
    let mc=document.getElementById(u.id+'-masteries'); mc.innerHTML='';
    if(u.bonusAtk>0) addMI(mc, 'ATAQUE', u.bonusAtk, '#e74c3c', u.id); if(u.bonusBlock>0) addMI(mc, 'BLOQUEIO', u.bonusBlock, '#00cec9', u.id); 
}

function bindMasteryTooltip(el, key, value, ownerId) { return { onmouseenter: (e) => { let db=CARDS_DB[key]; document.getElementById('tt-title').innerHTML = key; document.getElementById('tt-content').innerHTML = `<span class='tt-label' style='color:var(--accent-blue)'>Bônus Atual</span><span class='tt-val'>+${value}</span><span class='tt-label' style='color:var(--accent-red)'>Efeito</span><span class='tt-val'>${db.mastery}</span>`; tt.style.display = 'block'; tt.classList.remove('tooltip-anim-up'); tt.classList.remove('tooltip-anim-down'); void tt.offsetWidth; let rect = el.getBoundingClientRect(); if(ownerId === 'p') { tt.classList.add('tooltip-anim-up'); tt.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; tt.style.top = 'auto'; } else { tt.classList.add('tooltip-anim-down'); tt.style.top = (rect.bottom + 10) + 'px'; tt.style.bottom = 'auto'; } tt.style.left = (rect.left + rect.width/2) + 'px'; tt.style.transform = "translateX(-50%)"; } }; }
function addMI(parent, key, value, col, ownerId){ let d = document.createElement('div'); d.className = 'mastery-icon'; d.innerHTML = `${CARDS_DB[key].icon}<span class="mastery-lvl">${value}</span>`; d.style.borderColor = col; let handlers = bindMasteryTooltip(d, key, value, ownerId); d.onmouseenter = handlers.onmouseenter; d.onmouseleave = () => { tt.style.display = 'none'; }; parent.appendChild(d); }
function showFloatingText(eid, txt, col) { let el = document.createElement('div'); el.className='floating-text'; el.innerText=txt; el.style.color=col; let parent = document.getElementById(eid); if(parent) { let rect = parent.getBoundingClientRect(); el.style.left = (rect.left + rect.width/2) + 'px'; el.style.top = (rect.top) + 'px'; document.body.appendChild(el); } else { document.body.appendChild(el); } setTimeout(()=>el.remove(), 2000); }
window.openModal = function(t,d,opts,cb) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-desc').innerText=d; let g=document.getElementById('modal-btns'); g.innerHTML=''; opts.forEach(o=>{ let b=document.createElement('button'); b.className='mini-btn'; b.innerText=o; b.onclick=()=>{document.getElementById('modal-overlay').style.display='none'; cb(o)}; g.appendChild(b); }); document.getElementById('modal-overlay').style.display='flex'; }
window.cancelModal = function() { document.getElementById('modal-overlay').style.display='none'; isProcessing = false; }
const tt=document.getElementById('tooltip-box');
function bindFixedTooltip(el,k) { const updatePos = () => { let rect = el.getBoundingClientRect(); tt.style.left = (rect.left + rect.width / 2) + 'px'; }; return { onmouseenter: (e) => { showTT(k); tt.style.bottom = (window.innerWidth < 768 ? '280px' : '420px'); tt.style.top = 'auto'; tt.classList.remove('tooltip-anim-up'); tt.classList.remove('tooltip-anim-down'); tt.classList.add('tooltip-anim-up'); updatePos(); el.addEventListener('mousemove', updatePos); } }; }
function showTT(k) { let db = CARDS_DB[k]; document.getElementById('tt-title').innerHTML = k; if (db.customTooltip) { let content = db.customTooltip; let currentLvl = (typeof player !== 'undefined' && player.lvl) ? player.lvl : 1; content = content.replace('{PLAYER_LVL}', currentLvl); let bonusBlock = (typeof player !== 'undefined' && player.bonusBlock) ? player.bonusBlock : 0; let reflectDmg = 1 + bonusBlock; content = content.replace('{PLAYER_BLOCK_DMG}', reflectDmg); document.getElementById('tt-content').innerHTML = content; } else { document.getElementById('tt-content').innerHTML = `<span class='tt-label'>Base</span><span class='tt-val'>${db.base}</span><span class='tt-label' style='color:var(--accent-orange)'>Bônus</span><span class='tt-val'>${db.bonus}</span><span class='tt-label' style='color:var(--accent-purple)'>Maestria</span><span class='tt-val'>${db.mastery}</span>`; } tt.style.display = 'block'; }
function apply3DTilt(element, isHand = false) { if(window.innerWidth < 768) return; element.addEventListener('mousemove', (e) => { const rect = element.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const xPct = (x / rect.width) - 0.5; const yPct = (y / rect.height) - 0.5; element.style.setProperty('--rx', xPct); element.style.setProperty('--ry', yPct); let lift = isHand ? 'translateY(-140px) scale(2.3)' : 'scale(1.1)'; let rotate = `rotateX(${yPct * -40}deg) rotateY(${xPct * 40}deg)`; if(element.classList.contains('disabled-card')) rotate = `rotateX(${yPct * -10}deg) rotateY(${xPct * 10}deg)`; element.style.transform = `${lift} ${rotate}`; let art = element.querySelector('.card-art'); if(art) art.style.backgroundPosition = `${50 + (xPct * 20)}% ${50 + (yPct * 20)}%`; }); element.addEventListener('mouseleave', () => { element.style.transform = isHand ? 'translateY(0) scale(1)' : 'scale(1)'; let art = element.querySelector('.card-art'); if(art) art.style.backgroundPosition = 'center'; element.style.setProperty('--rx', 0); element.style.setProperty('--ry', 0); }); }

window.startPvE = function() { window.gameMode = 'pve'; window.playNavSound(); window.openDeckSelector(); };
window.startPvPSearch = function() { if (!currentUser) return; window.gameMode = 'pvp'; window.playNavSound(); window.openDeckSelector(); };

async function initiateMatchmaking() {
    window.cleanupMatchState();
    const mmScreen = document.getElementById('matchmaking-screen'); mmScreen.style.display = 'flex';
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE..."; document.querySelector('.mm-title').style.color = "var(--gold)"; document.querySelector('.radar-spinner').style.borderColor = "rgba(255, 215, 0, 0.3)"; document.querySelector('.radar-spinner').style.animation = "spin 1s linear infinite"; document.querySelector('.cancel-btn').style.display = "block";
    let matchSeconds = 0; const timerEl = document.getElementById('mm-timer'); timerEl.innerText = "00:00";
    let matchTimerInterval = setInterval(() => { matchSeconds++; let m = Math.floor(matchSeconds / 60).toString().padStart(2, '0'); let s = (matchSeconds % 60).toString().padStart(2, '0'); timerEl.innerText = `${m}:${s}`; }, 1000);
    try {
        let myQueueRef = doc(collection(db, "queue")); 
        const myData = { uid: currentUser.uid, name: currentUser.displayName, deck: window.currentDeck, timestamp: Date.now(), matchId: null, cancelled: false, status: 'waiting' };
        await setDoc(myQueueRef, myData);
        let queueListener = onSnapshot(myQueueRef, (docSnap) => { if (docSnap.exists()) { const data = docSnap.data(); if (data.matchId) { clearInterval(matchTimerInterval); queueListener(); enterMatch(data.matchId); } } });
        if (searchInterval) clearInterval(searchInterval);
        findOpponentInQueue(myQueueRef);
        searchInterval = setInterval(() => { if (document.getElementById('matchmaking-screen').style.display === 'flex' && document.querySelector('.mm-title').innerText !== "PARTIDA ENCONTRADA!") { findOpponentInQueue(myQueueRef); } else { clearInterval(searchInterval); } }, 4000);
    } catch (e) { window.cancelPvPSearch(); }
}

async function findOpponentInQueue(myQueueRef) {
    try {
        const queueRef = collection(db, "queue"); const q = query(queueRef, orderBy("timestamp", "desc"), limit(20)); const querySnapshot = await getDocs(q);
        let opponentDoc = null; const now = Date.now();
        for (const docSnap of querySnapshot.docs) { const data = docSnap.data(); if (data.uid === currentUser.uid) continue; if (data.matchId !== null) continue; if (data.cancelled === true) continue; if (now - data.timestamp > 120000) { continue; } opponentDoc = docSnap; break; }
        if (opponentDoc) {
            if (searchInterval) clearInterval(searchInterval);
            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9); const oppRef = opponentDoc.ref;
            await updateDoc(oppRef, { matchId: matchId }); if (myQueueRef) { await updateDoc(myQueueRef, { matchId: matchId }); }
            const p1DeckCards = generateShuffledDeck(); const p2DeckCards = generateShuffledDeck();
            await createMatchDocument(matchId, currentUser.uid, opponentDoc.data().uid, currentUser.displayName, opponentDoc.data().name, window.currentDeck, opponentDoc.data().deck, p1DeckCards, p2DeckCards);
        }
    } catch (e) {}
}

async function createMatchDocument(matchId, p1Id, p2Id, p1Name, p2Name, p1DeckType, p2DeckType, p1DeckCards, p2DeckCards) {
    const matchRef = doc(db, "matches", matchId); const cleanName1 = p1Name ? p1Name.split(' ')[0].toUpperCase() : "JOGADOR 1"; const cleanName2 = p2Name ? p2Name.split(' ')[0].toUpperCase() : "JOGADOR 2"; const d1Type = p1DeckType || 'knight'; const d2Type = p2DeckType || 'knight';
    await setDoc(matchRef, { player1: { uid: p1Id, name: cleanName1, deckType: d1Type, hp: 6, status: 'selecting', hand: [], deck: p1DeckCards, xp: [] }, player2: { uid: p2Id, name: cleanName2, deckType: d2Type, hp: 6, status: 'selecting', hand: [], deck: p2DeckCards, xp: [] }, turn: 1, status: 'playing', createdAt: Date.now() });
}

window.cancelPvPSearch = async function() { window.transitionToLobby(true); };
async function enterMatch(matchId) { const matchRef = doc(db, "matches", matchId); const matchSnap = await getDoc(matchRef); if(matchSnap.exists()) { const data = matchSnap.data(); window.pvpStartData = data; if(data.player1.uid === currentUser.uid) window.myRole = 'player1'; else window.myRole = 'player2'; } document.querySelector('.mm-title').innerText = "PARTIDA ENCONTRADA!"; document.querySelector('.mm-title').style.color = "#2ecc71"; document.querySelector('.radar-spinner').style.borderColor = "#2ecc71"; document.querySelector('.radar-spinner').style.animation = "none"; document.querySelector('.cancel-btn').style.display = "none"; setTimeout(() => { const mmScreen = document.getElementById('matchmaking-screen'); mmScreen.style.display = 'none'; window.currentMatchId = matchId; window.transitionToGame(); }, 1500); }

async function syncLevelUpToDB(u) {
    if (!window.currentMatchId) return; const matchRef = doc(db, "matches", window.currentMatchId); let updates = {}; let targetKey = ""; let opponentKey = ""; 
    if (u === player) { targetKey = (window.myRole === 'player1') ? 'player1' : 'player2'; opponentKey = (window.myRole === 'player1') ? 'player2' : 'player1'; } else { targetKey = (window.myRole === 'player1') ? 'player2' : 'player1'; }
    updates[`${targetKey}.xp`] = []; updates[`${targetKey}.deck`] = u.deck; updates[`${targetKey}.hand`] = u.hand; updates[`${targetKey}.lvl`] = u.lvl; updates[`${targetKey}.hp`] = u.hp; updates[`${targetKey}.maxHp`] = u.maxHp; updates[`${targetKey}.bonusAtk`] = u.bonusAtk; updates[`${targetKey}.bonusBlock`] = u.bonusBlock; 
    if (u === player) { updates[`${opponentKey}.hp`] = monster.hp; }
    try { await updateDoc(matchRef, updates); } catch(e) {}
}

window.openHistory = async function() {
    if(!currentUser) return; window.playNavSound(); const screen = document.getElementById('history-screen'); const container = document.getElementById('history-list-container'); screen.style.display = 'flex'; container.innerHTML = '<div style="color:#888; text-align:center; margin-top:20px;">Consultando arquivos...</div>';
    try {
        const historyRef = collection(db, "players", currentUser.uid, "history"); const q = query(historyRef, orderBy("timestamp", "desc"), limit(20)); const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { container.innerHTML = '<div style="color:#888; text-align:center; margin-top:20px;">Nenhuma batalha registrada ainda.</div>'; return; }
        let html = '';
        querySnapshot.forEach((doc) => { const h = doc.data(); const date = new Date(h.timestamp); const dateStr = `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`; const resultClass = h.result === 'WIN' ? 'win' : 'loss'; const resultTxt = h.result === 'WIN' ? 'VITÓRIA' : 'DERROTA'; const scoreTxt = h.points > 0 ? `+${h.points}` : `${h.points}`; let vsText = ""; if (h.opponent === 'PVE' || h.mode === 'pve') { vsText = `${resultTxt} PVE`; } else { vsText = `${resultTxt} vs ${h.opponent}`; } html += `<div class="history-item ${resultClass}"><div><div class="h-vs">${vsText}</div><div class="h-date">${dateStr} | ${h.mode.toUpperCase()}</div></div><div class="h-score">${scoreTxt} PTS</div></div>`; });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<div style="color:red; text-align:center;">Erro ao carregar.</div>'; }
};
window.closeHistory = function() { window.playNavSound(); document.getElementById('history-screen').style.display = 'none'; };

setTimeout(() => { if (assetsLoaded < totalAssets) { updateLoader(); const loading = document.getElementById('loading-screen'); if(loading) loading.style.display = 'none'; if(!window.hoverLogicInitialized) { initGlobalHoverLogic(); window.hoverLogicInitialized = true; } } }, 3000); 
preloadGame();
