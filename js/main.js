import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { app, auth, db, loginWithGoogle, logoutGoogle, saveMatchHistoryDB, registrarVitoriaDB, registrarDerrotaDB, notifyAbandonmentDB } from './firebase_network.js';
import { stringToSeed, shuffle, generateShuffledDeck, resetUnit, getBestAIMove, checkCardLethality } from './game_logic.js';
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, increment, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 
window.pvpUnsubscribe = null; 
let searchInterval = null;

// CONTROLES DE ÁUDIO NOVOS
window.masterVol = 1.0; 
window.musicMuted = false;
window.sfxMuted = false;

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
        'assets/img/carta_desarmar_mago.webp', 'assets/img/carta_treinar_mago.webp'
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
let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let isProcessing = false; let turnCount = 1; let playerHistory = []; 
let isLethalHover = false; let mixerInterval = null;

// --- ESTADOS GLOBAIS ---
window.isMatchStarting = false; window.currentDeck = 'knight'; window.myRole = null; 
window.currentMatchId = null; window.pvpSelectedCardIndex = null; 
window.isResolvingTurn = false; window.pvpStartData = null; window.latestMatchData = null; 

// --- CONTROLE DE MÚSICA ---
const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if (!audios[trackId]) return;
        try {
            if (this.currentTrackId === trackId) {
                if (audios[trackId].paused && !window.musicMuted) {
                    const audio = audios[trackId];
                    if (audio.readyState >= 2) audio.currentTime = 0;
                    audio.volume = 0; audio.play().catch(()=>{});
                    this.fadeIn(audio, 0.5 * window.masterVol);
                }
                return; 
            } 
            if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]);
            
            if (trackId && audios[trackId]) {
                const newAudio = audios[trackId];
                if (newAudio.readyState >= 2) newAudio.currentTime = 0;
                if (!window.musicMuted) {
                    newAudio.volume = 0; newAudio.play().catch(()=>{});
                    this.fadeIn(newAudio, 0.5 * window.masterVol);
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
        if(!audio) return; let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) { vol -= 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); } } 
            else { try { audio.volume = 0; audio.pause(); } catch(e){} clearInterval(fadeOutInt); }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        if(!audio) return; let vol = 0; audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) { vol += 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); } } 
            else { try { audio.volume = targetVol; } catch(e){} clearInterval(fadeInInt); }
        }, 50);
    }
};

// --- CONFIGURAÇÕES E MODAIS ---
window.toggleConfig = function() {
    window.playNavSound();
    const panel = document.getElementById('config-panel');
    const content = panel.querySelector('.config-content');
    const abandonArea = document.getElementById('abandon-area');

    if (panel.style.display === 'flex') {
        content.classList.remove('config-pop-in'); content.classList.add('config-pop-out');
        setTimeout(() => { panel.style.display = 'none'; content.classList.remove('config-pop-out'); }, 200);
    } else {
        const isGameActive = document.getElementById('game-screen').classList.contains('active');
        abandonArea.style.display = isGameActive ? 'block' : 'none';
        panel.style.display = 'flex'; content.classList.add('config-pop-in');
    }
};

document.getElementById('config-panel').addEventListener('click', function(e) {
    if (e.target === this) window.toggleConfig();
});

window.updateVol = function(type, val) { 
    if(type==='master') window.masterVol = parseFloat(val); 
    ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-hit-mage', 'sfx-block', 'sfx-block-mage', 'sfx-heal', 'sfx-levelup', 'sfx-train', 'sfx-disarm', 'sfx-deck-select', 'sfx-hover', 'sfx-ui-hover', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'sfx-nav'].forEach(k => { 
        if(audios[k]) {
            let vol = window.masterVol || 1.0;
            try {
                if(k === 'sfx-ui-hover') audios[k].volume = 0.3 * vol;
                else if (k === 'sfx-levelup') audios[k].volume = 1.0 * vol;
                else if (k === 'sfx-train') audios[k].volume = 0.5 * vol;
                else audios[k].volume = 0.8 * vol;
            } catch(e){}
        }
    }); 
}

window.toggleSoundType = function(type) {
    window.playNavSound();
    if (type === 'music') {
        window.musicMuted = !document.getElementById('check-music').checked;
        if (window.musicMuted) {
            if (MusicController.currentTrackId && audios[MusicController.currentTrackId]) audios[MusicController.currentTrackId].pause();
        } else {
            if (MusicController.currentTrackId && audios[MusicController.currentTrackId]) audios[MusicController.currentTrackId].play().catch(()=>{});
        }
    } else {
        window.sfxMuted = !document.getElementById('check-sfx').checked;
    }
};

function playSound(key) { 
    if (window.sfxMuted && !key.startsWith('bgm')) return;
    if(audios[key]) { 
        try {
            if (key === 'sfx-levelup') {
                audios[key].volume = 1.0 * (window.masterVol || 1.0);
                if (audios[key].readyState >= 2) audios[key].currentTime = 0; 
                audios[key].play().catch(()=>{});
                let clone = audios[key].cloneNode(); clone.volume = audios[key].volume; clone.play().catch(()=>{});
            } else {
                if (audios[key].readyState >= 2) audios[key].currentTime = 0; 
                audios[key].play().catch(()=>{}); 
            }
        } catch(e){}
    } 
}

window.playNavSound = function() { playSound('sfx-nav'); };

let lastHoverTime = 0;
window.playUIHoverSound = function() {
    if (window.sfxMuted) return;
    let now = Date.now();
    if (now - lastHoverTime < 50) return; 
    let base = audios['sfx-ui-hover'];
    if(base) { try { let s = base.cloneNode(); s.volume = 0.3 * (window.masterVol || 1.0); s.play().catch(()=>{}); lastHoverTime = now; } catch(e){} }
};

// --- FUNÇÕES BASICAS E DE JOGO ---
function getCardArt(cardKey, isPlayer) {
    if (isPlayer && window.currentDeck === 'mage' && MAGE_ASSETS[cardKey]) return MAGE_ASSETS[cardKey];
    return CARDS_DB[cardKey].img;
}

window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) { ds.style.display = 'flex'; ds.style.opacity = '1'; ds.style.pointerEvents = 'auto'; }
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (e) {}
    window.showScreen('deck-selection-screen');
};

window.selectDeck = function(deckType) {
    playSound('sfx-deck-select');
    window.currentDeck = deckType; 
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 
    if (deckType === 'mage') document.body.classList.add('theme-mago'); else document.body.classList.add('theme-cavaleiro');
    
    setTimeout(() => {
        const selectionScreen = document.getElementById('deck-selection-screen');
        selectionScreen.style.transition = "opacity 0.5s"; selectionScreen.style.opacity = "0";
        setTimeout(() => {
            selectionScreen.style.display = 'none';
            if (window.gameMode === 'pvp') initiateMatchmaking(); else window.transitionToGame();
        }, 500);
    }, 400);
};

window.transitionToGame = function() {
    const transScreen = document.getElementById('transition-overlay');
    if(transScreen) transScreen.classList.add('active');
    setTimeout(() => {
        MusicController.play('bgm-loop'); 
        let bg = document.getElementById('game-background'); if(bg) bg.classList.remove('lobby-mode');
        window.showScreen('game-screen');
        const handEl = document.getElementById('player-hand'); if(handEl) handEl.innerHTML = '';
        setTimeout(() => {
            if(transScreen) transScreen.classList.remove('active');
            setTimeout(() => { startGameFlow(); }, 200); 
        }, 1500);
    }, 500); 
}

window.transitionToLobby = function(skipAnim = false) {
    cleanupMatchState(); 
    document.body.classList.remove('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) { ds.style.opacity = '0'; ds.style.pointerEvents = 'none'; ds.style.display = 'none'; }
    if (skipAnim) { window.goToLobby(false); } 
    else {
        const transScreen = document.getElementById('transition-overlay');
        if(transScreen) transScreen.classList.add('active');
        setTimeout(() => {
            window.goToLobby(false); 
            setTimeout(() => { if(transScreen) transScreen.classList.remove('active'); }, 1000); 
        }, 500);
    }
}

function cleanupMatchState() {
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    if (searchInterval) { clearInterval(searchInterval); searchInterval = null; }
    window.currentMatchId = null; window.myRole = null; window.pvpStartData = null;
    window.pvpSelectedCardIndex = null; window.isResolvingTurn = false; window.latestMatchData = null;
    isProcessing = false;
    const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove();
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) { window.showScreen('start-screen'); MusicController.play('bgm-menu'); return; }
    cleanupMatchState(); isProcessing = false; 
    let bg = document.getElementById('game-background'); if(bg) bg.classList.add('lobby-mode');
    MusicController.play('bgm-menu'); 
      
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
    
    // Puxa ranking
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
    window.showScreen('lobby-screen'); document.getElementById('end-screen').classList.remove('visible'); 
};

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; window.isResolvingTurn = false; window.pvpSelectedCardIndex = null; 
    window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand'); if (handEl) { handEl.innerHTML = ''; handEl.classList.add('preparing'); }
    if (window.gameMode === 'pvp' && window.pvpStartData) {
        if (window.myRole === 'player1') { resetUnit(player, window.pvpStartData.player1.deck, 'player1'); resetUnit(monster, window.pvpStartData.player2.deck, 'player2'); } 
        else { resetUnit(player, window.pvpStartData.player2.deck, 'player2'); resetUnit(monster, window.pvpStartData.player1.deck, 'player1'); }
    } else { resetUnit(player, null, 'pve'); resetUnit(monster, null, 'pve'); }
    turnCount = 1; playerHistory = [];
    drawCardLogic(monster, 6); drawCardLogic(player, 6); 
    updateUI(); dealAllInitialCards();
    if(window.gameMode === 'pvp') startPvPListener();
}

// ... Toda a lógica de PvP, Firebase Auth, Animações e Turnos (exatamente iguais ao main.js anterior).
// Como você já tem as funções do Matchmaking, resolveTurn, etc., irei apenas conectar o restante padrão aqui:

function checkEndGame(){ 
    if(player.hp<=0 || monster.hp<=0) { 
        isProcessing = true; isLethalHover = false; MusicController.stopCurrent();
        setTimeout(()=>{ 
            let title = document.getElementById('end-title'); let isWin = player.hp > 0; let isTie = player.hp <= 0 && monster.hp <= 0;
            if(isTie) { title.innerText = "EMPATE"; title.className = "tie-theme"; playSound('sfx-tie'); } 
            else if(isWin) { title.innerText = "VITÓRIA"; title.className = "win-theme"; playSound('sfx-win'); } 
            else { title.innerText = "DERROTA"; title.className = "lose-theme"; playSound('sfx-lose'); } 
            if(isWin && !isTie) { if(window.registrarVitoriaOnline) window.registrarVitoriaOnline('pvp'); } else { if(window.registrarDerrotaOnline) window.registrarDerrotaOnline(window.gameMode); }
            document.getElementById('end-screen').classList.add('visible'); 
        }, 1000); 
    } else { isProcessing = false; } 
}

onAuthStateChanged(auth, (user) => {
    if (user) { currentUser = user; window.goToLobby(true); } 
    else { currentUser = null; window.showScreen('start-screen'); MusicController.play('bgm-menu'); }
});

window.googleLogin = async function() { window.playNavSound(); try { await loginWithGoogle(); } catch (error) {} };
window.handleLogout = function() { window.playNavSound(); logoutGoogle().then(() => { location.reload(); }); };
window.restartMatch = function() { document.getElementById('end-screen').classList.remove('visible'); setTimeout(startGameFlow, 50); MusicController.play('bgm-loop'); }

window.abandonMatch = function() {
    if(document.getElementById('game-screen').classList.contains('active')) {
        window.toggleConfig(); 
        window.openModal("ABANDONAR?", "Sair da partida contará como DERROTA. Tem certeza?", ["CANCELAR", "SAIR"], async (choice) => { 
                if (choice === "SAIR") {
                    if (window.gameMode === 'pvp') await notifyAbandonmentDB(window.currentMatchId, currentUser.uid); 
                    window.registrarDerrotaOnline(window.gameMode);
                    window.transitionToLobby();
                }
            }
        );
    }
}

function preloadGame() {
    ASSETS_TO_LOAD.images.forEach(src => { let img = new Image(); img.src = src; window.gameAssets.push(img); img.onload = () => updateLoader(); img.onerror = () => updateLoader(); });
    ASSETS_TO_LOAD.audio.forEach(a => { 
        let s = new Audio(); s.src = a.src; s.preload = 'auto'; if(a.loop) s.loop = true; audios[a.id] = s; window.gameAssets.push(s);
        s.onloadedmetadata = () => updateLoader(); s.onerror = () => updateLoader(); setTimeout(() => { if(s.readyState === 0) updateLoader(); }, 2000); 
    });
}

function updateLoader() {
    assetsLoaded++; let pct = Math.min(100, (assetsLoaded / totalAssets) * 100); 
    const fill = document.getElementById('loader-fill'); if(fill) fill.style.width = pct + '%';
    if(assetsLoaded >= totalAssets) {
        if(window.updateVol) window.updateVol('master', window.masterVol || 1.0);
        setTimeout(() => {
            const loading = document.getElementById('loading-screen');
            if(loading) { loading.style.opacity = '0'; setTimeout(() => loading.style.display = 'none', 500); }
            if(!window.hoverLogicInitialized) { initGlobalHoverLogic(); window.hoverLogicInitialized = true; }
        }, 800); 
        document.body.addEventListener('click', () => { if (!MusicController.currentTrackId || (audios['bgm-menu'] && audios['bgm-menu'].paused)) { MusicController.play('bgm-menu'); } }, { once: true });
    }
}

function initGlobalHoverLogic() {
    let lastTarget = null;
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('button, .circle-btn, #btn-fullscreen, .deck-option, .mini-btn');
        if (target && target !== lastTarget) { lastTarget = target; window.playUIHoverSound(); } 
        else if (!target) { lastTarget = null; }
    });
}

window.onload = function() {
    const deckScreen = document.getElementById('deck-selection-screen');
    if (deckScreen) {
        let backBtn = deckScreen.querySelector('.btn-back') || deckScreen.querySelector('.circle-btn') || deckScreen.querySelector('button'); 
        if (backBtn) { backBtn.style.zIndex = "9999"; backBtn.style.pointerEvents = "all"; backBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); window.playNavSound(); window.transitionToLobby(true); }; }
    }
};

window.toggleFullScreen = function() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => console.log(e)); } else { if (document.exitFullscreen) document.exitFullscreen(); }
}

preloadGame();
