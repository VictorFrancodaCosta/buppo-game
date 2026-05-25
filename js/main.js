import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { app, auth, db, loginWithGoogle, logoutGoogle, saveMatchHistoryDB, registrarVitoriaDB, registrarDerrotaDB, notifyAbandonmentDB } from './firebase_network.js';
import { stringToSeed, shuffle, generateShuffledDeck, resetUnit, getBestAIMove, checkCardLethality, drawCardLogic } from './game_logic.js';
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, increment, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 
window.pvpUnsubscribe = null; 
let searchInterval = null;

// NOVAS VARIÁVEIS DE CONTROLE DE ÁUDIO
window.masterVol = 0.5; 
window.musicEnabled = true;
window.sfxEnabled = true;

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

let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let isProcessing = false; let turnCount = 1; let playerHistory = []; 
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
window.latestMatchData = null; 

function cleanupMatchState() {
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
    currentTrackId: null,
    fadeTimer: null,
    play(trackId) {
        if (!audios[trackId]) return;
        try {
            if (this.currentTrackId === trackId) {
                if (audios[trackId].paused && window.musicEnabled) {
                    const audio = audios[trackId];
                    if (audio.readyState >= 2) audio.currentTime = 0;
                    audio.volume = 0; audio.play().catch(()=>{});
                    this.fadeIn(audio, 0.5 * window.masterVol);
                }
                return; 
            } 
            const maxVol = 0.5 * window.masterVol;
            if (this.currentTrackId && audios[this.currentTrackId]) {
                const oldAudio = audios[this.currentTrackId];
                this.fadeOut(oldAudio);
            }
            if (trackId && audios[trackId]) {
                const newAudio = audios[trackId];
                if (newAudio.readyState >= 2) newAudio.currentTime = 0;
                if (window.musicEnabled) {
                    newAudio.volume = 0; newAudio.play().catch(()=>{});
                    this.fadeIn(newAudio, maxVol);
                }
            }
            this.currentTrackId = trackId;
        } catch(e) { console.warn("MusicController:", e); }
    },
    stopCurrent() {
        if (this.currentTrackId && audios[this.currentTrackId]) { this.fadeOut(audios[this.currentTrackId]); }
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

window.playNavSound = function() { 
    if(!window.sfxEnabled) return;
    let s = audios['sfx-nav']; 
    if(s) { 
        try { if (s.readyState >= 2) s.currentTime = 0; s.play().catch(()=>{}); } catch(e) {}
    } 
};

let lastHoverTime = 0;
window.playUIHoverSound = function() {
    if(!window.sfxEnabled) return;
    let now = Date.now();
    if (now - lastHoverTime < 50) return; 
    let base = audios['sfx-ui-hover'];
    if(base) { 
        try { let s = base.cloneNode(); s.volume = 0.3 * (window.masterVol || 1.0); s.play().catch(()=>{}); lastHoverTime = now; } catch(e){}
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
        if(configBtn) configBtn.style.display = 'flex'; // Mudança: Agora config aparece no saguão também
        const panel = document.getElementById('config-overlay');
        if(panel) { panel.style.display = 'none'; }
    }
}

window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) {
        ds.style.display = 'flex'; ds.style.opacity = '1'; ds.style.pointerEvents = 'auto'; 
        document.querySelectorAll('.deck-option').forEach(opt => {
            opt.style = ""; const img = opt.querySelector('img'); if(img) img.style = "";
        });
    }
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
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

window.selectDeck = function(deckType) {
    if(audios['sfx-deck-select'] && window.sfxEnabled) { try { audios['sfx-deck-select'].currentTime = 0; audios['sfx-deck-select'].play().catch(()=>{}); } catch(e){} }
    window.currentDeck = deckType; 
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 
    if (deckType === 'mage') document.body.classList.add('theme-mago'); else document.body.classList.add('theme-cavaleiro');
    document.querySelectorAll('.deck-option').forEach(opt => {
        if(opt.getAttribute('onclick').includes(`'${deckType}'`)) {
            opt.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            opt.style.transform = "scale(1.15) translateY(-20px)";
            opt.style.filter = "brightness(1.3) drop-shadow(0 0 20px var(--gold))";
            opt.style.zIndex = "100";
            const img = opt.querySelector('img'); if(img) img.style.filter = "grayscale(0%) brightness(1.2)";
        } else {
            opt.style.transition = "all 0.3s ease"; opt.style.transform = "scale(0.8) translateY(10px)";
            opt.style.opacity = "0.2"; opt.style.filter = "grayscale(100%)";
        }
    });

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
    const transText = transScreen.querySelector('.trans-text');
    if(transText) transText.innerText = "PREPARANDO BATALHA...";
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
    // CORREÇÃO: Remove temas ao voltar pro lobby
    document.body.classList.remove('force-landscape', 'theme-cavaleiro', 'theme-mago');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) { ds.style.opacity = '0'; ds.style.pointerEvents = 'none'; ds.style.display = 'none'; ds.classList.remove('active'); }
    if (skipAnim) { window.goToLobby(false); } 
    else {
        const transScreen = document.getElementById('transition-overlay');
        const transText = transScreen.querySelector('.trans-text');
        if(transText) transText.innerText = "RETORNANDO AO SAGUÃO...";
        if(transScreen) transScreen.classList.add('active');
        setTimeout(() => {
            window.goToLobby(false); 
            setTimeout(() => { if(transScreen) transScreen.classList.remove('active'); }, 1000); 
        }, 500);
    }
}

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) { window.showScreen('start-screen'); MusicController.play('bgm-menu'); return; }
    cleanupMatchState(); isProcessing = false; 
    
    // CORREÇÃO: Garante fundo do saguão limpo
    document.body.classList.remove('theme-cavaleiro', 'theme-mago'); 

    let bg = document.getElementById('game-background'); if(bg) bg.classList.add('lobby-mode');
    MusicController.play('bgm-menu'); createLobbyFlares();
      
    const userRef = doc(db, "players", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0, settings: { vol: 0.5, music: true, sfx: true } });
        document.getElementById('lobby-username').innerText = `OLÁ, ${currentUser.displayName.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: 0 | PONTOS: 0`;
        window.updateVol('master', 0.5);
    } else {
        const d = userSnap.data();
        document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;
        
        if(d.settings) {
            window.masterVol = d.settings.vol !== undefined ? d.settings.vol : 0.5;
            window.musicEnabled = d.settings.music !== undefined ? d.settings.music : true;
            window.sfxEnabled = d.settings.sfx !== undefined ? d.settings.sfx : true;
            
            let slider = document.getElementById('vol-slider'); if(slider) slider.value = window.masterVol;
            let chkM = document.getElementById('check-music'); if(chkM) chkM.checked = window.musicEnabled;
            let chkS = document.getElementById('check-sfx'); if(chkS) chkS.checked = window.sfxEnabled;
            
            window.updateVol('master', window.masterVol);
            if (!window.musicEnabled && MusicController.currentTrackId && audios[MusicController.currentTrackId]) {
                audios[MusicController.currentTrackId].pause();
            } else if (window.musicEnabled && MusicController.currentTrackId && audios[MusicController.currentTrackId]) {
                audios[MusicController.currentTrackId].play().catch(()=>{});
            }
        }
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
    window.showScreen('lobby-screen'); document.getElementById('end-screen').classList.remove('visible'); 
    document.getElementById('btn-config-toggle').style.display = 'flex';
};

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; window.isResolvingTurn = false; window.pvpSelectedCardIndex = null; 
    startCinematicLoop(); window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand'); if (handEl) { handEl.innerHTML = ''; handEl.classList.add('preparing'); }
    if (window.gameMode === 'pvp' && window.pvpStartData) {
        if (window.myRole === 'player1') {
            resetUnit(player, window.pvpStartData.player1.deck, 'player1'); resetUnit(monster, window.pvpStartData.player2.deck, 'player2');
        } else {
            resetUnit(player, window.pvpStartData.player2.deck, 'player2'); resetUnit(monster, window.pvpStartData.player1.deck, 'player1');
        }
    } else {
        resetUnit(player, null, 'pve'); resetUnit(monster, null, 'pve'); 
    }
    turnCount = 1; playerHistory = [];
    drawCardLogic(monster, 6); drawCardLogic(player, 6); 
    updateUI(); dealAllInitialCards();
    if(window.gameMode === 'pvp') startPvPListener();
}

function startPvPListener() {
    if(!window.currentMatchId) return;
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    const matchRef = doc(db, "matches", window.currentMatchId);
    let namesUpdated = false;
    const ensureMyRole = (data) => {
        if (data.player1 && data.player1.uid === currentUser.uid) window.myRole = 'player1';
        else if (data.player2 && data.player2.uid === currentUser.uid) window.myRole = 'player2';
    };

    window.pvpUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();
        window.latestMatchData = matchData;
        if (matchData.player1.uid !== currentUser.uid && matchData.player2.uid !== currentUser.uid) return;
        ensureMyRole(matchData);

        if (matchData.status === 'abandoned') {
            if (matchData.abandonedBy && currentUser && matchData.abandonedBy !== currentUser.uid) {
                monster.hp = 0; updateUI(); isProcessing = true; MusicController.stopCurrent();
                setTimeout(() => {
                    const title = document.getElementById('end-title'); title.innerText = "VITÓRIA"; title.className = "win-theme";
                    showCenterText("OPONENTE DESISTIU!", "#ffd700"); playSound('sfx-win');
                    if(window.registrarVitoriaOnline) window.registrarVitoriaOnline('pvp');
                    document.getElementById('end-screen').classList.add('visible'); cleanupMatchState();
                }, 500);
            }
            return; 
        }

        if (!namesUpdated && matchData.player1 && matchData.player2) {
            let myName, enemyName;
            if (window.myRole === 'player1') { myName = matchData.player1.name; enemyName = matchData.player2.name; } 
            else { myName = matchData.player2.name; enemyName = matchData.player1.name; }
            const pNameEl = document.querySelector('#p-stats-cluster .unit-name'); const mNameEl = document.querySelector('#m-stats-cluster .unit-name');
            if(pNameEl) pNameEl.innerText = myName; if(mNameEl) mNameEl.innerText = enemyName;
            namesUpdated = true; 
        }

        const p1Ready = matchData.p1Move && matchData.p1Move.length > 0;
        const p2Ready = matchData.p2Move && matchData.p2Move.length > 0;
        updateUI();

        if (p1Ready && p2Ready) {
            if (!window.isResolvingTurn) {
                const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove();
                resolvePvPTurn(matchData.p1Move, matchData.p2Move, matchData.p1Disarm, matchData.p2Disarm);
            }
        } else {
            if (window.myRole === 'player1' && p1Ready && !p2Ready) showPvPStatus("AGUARDANDO OPONENTE...");
            else if (window.myRole === 'player2' && p2Ready && !p1Ready) showPvPStatus("AGUARDANDO OPONENTE...");
        }
          
        if (window.gameMode === 'pvp' && window.myRole) {
            const myServerRole = window.myRole; const enemyServerRole = (window.myRole === 'player1') ? 'player2' : 'player1';
            const myData = matchData[myServerRole]; const enemyData = matchData[enemyServerRole];
            
            if (!window.isResolvingTurn && myData && myData.hp !== undefined) {
                if (myData.hp < player.hp) {
                    let dmg = player.hp - myData.hp; player.hp = myData.hp;
                    showFloatingText('p-lvl', `-${dmg}`, "#ff7675"); triggerDamageEffect(true, true);
                    updateUI(); checkEndGame();
                }
            }
            
            if (enemyData) {
                if(enemyData.deck) monster.deck = [...enemyData.deck];
                const serverXP = enemyData.xp || []; const localXP = monster.xp || [];
                if (serverXP.length > localXP.length) {
                    const startIdx = localXP.length;
                    for (let i = startIdx; i < serverXP.length; i++) {
                        animateFly('m-deck-container', 'm-xp', serverXP[i], () => { triggerXPGlow('m'); }, false, false, false);
                    }
                    monster.xp = [...serverXP]; updateUI();
                } else if (serverXP.length < localXP.length) {
                    monster.xp = [...serverXP];
                    if (enemyData.lvl && enemyData.lvl > monster.lvl) { triggerLevelUpVisuals('m'); playSound('sfx-levelup'); }
                    if(enemyData.lvl) monster.lvl = enemyData.lvl; if(enemyData.maxHp) monster.maxHp = enemyData.maxHp;
                    if(enemyData.bonusAtk !== undefined) monster.bonusAtk = enemyData.bonusAtk;
                    if(enemyData.bonusBlock !== undefined) monster.bonusBlock = enemyData.bonusBlock;
                    if(enemyData.hp !== undefined) monster.hp = enemyData.hp; updateUI();
                }
            }
        }
    });
}

function showPvPStatus(msg) {
    let el = document.getElementById('pvp-status-bar');
    if (!el) {
        el = document.createElement('div'); el.id = 'pvp-status-bar';
        el.style.position = 'fixed'; el.style.top = '15%'; el.style.left = '50%'; el.style.transform = 'translateX(-50%)';
        el.style.background = 'rgba(0,0,0,0.7)'; el.style.color = '#ffd700'; el.style.padding = '10px 20px';
        el.style.borderRadius = '20px'; el.style.zIndex = '9999'; el.style.fontSize = '14px'; el.style.border = '1px solid #ffd700';
        document.body.appendChild(el);
    }
    el.innerText = msg;
}

function checkEndGame(){ 
    if(player.hp<=0 || monster.hp<=0) { 
        isProcessing = true; isLethalHover = false; MusicController.stopCurrent();
        const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove();
        setTimeout(()=>{ 
            let title = document.getElementById('end-title'); let isWin = player.hp > 0; let isTie = player.hp <= 0 && monster.hp <= 0;
            if(isTie) { title.innerText = "EMPATE"; title.className = "tie-theme"; playSound('sfx-tie'); } 
            else if(isWin) { title.innerText = "VITÓRIA"; title.className = "win-theme"; playSound('sfx-win'); } 
            else { title.innerText = "DERROTA"; title.className = "lose-theme"; playSound('sfx-lose'); } 
            
            if(isWin && !isTie) { if(window.registrarVitoriaOnline) window.registrarVitoriaOnline('pvp'); } 
            else { if(window.registrarDerrotaOnline) window.registrarDerrotaOnline(window.gameMode); }
            document.getElementById('end-screen').classList.add('visible'); 
        }, 1000); 
    } else { isProcessing = false; } 
}

onAuthStateChanged(auth, (user) => {
    if (user) { currentUser = user; window.goToLobby(true); } 
    else {
        currentUser = null; window.showScreen('start-screen');
        const bg = document.getElementById('game-background'); if(bg) bg.classList.remove('lobby-mode');
        const btnTxt = document.getElementById('btn-text'); if(btnTxt) btnTxt.innerText = "LOGIN COM GOOGLE";
        MusicController.play('bgm-menu'); 
    }
});

window.googleLogin = async function() {
    window.playNavSound(); const btnText = document.getElementById('btn-text'); btnText.innerText = "CONECTANDO...";
    try { await loginWithGoogle(); } catch (error) { btnText.innerText = "ERRO - TENTE NOVAMENTE"; setTimeout(() => btnText.innerText = "LOGIN COM GOOGLE", 3000); }
};

window.handleLogout = function() {
    window.playNavSound(); logoutGoogle().then(() => { location.reload(); });
};

async function saveMatchHistory(result, pointsChange) {
    if (!currentUser) return;
    let enemyName = "PVE"; 
    if (window.gameMode === 'pvp') {
        if (window.pvpStartData) enemyName = (window.myRole === 'player1') ? window.pvpStartData.player2.name : window.pvpStartData.player1.name;
        if (!enemyName || enemyName === "PVE") {
            const domName = document.querySelector('#m-stats-cluster .unit-name');
            if (domName && domName.innerText !== 'Monstro') enemyName = domName.innerText;
        }
        if(enemyName) enemyName = enemyName.split(' ')[0].toUpperCase();
    }
    await saveMatchHistoryDB(currentUser, enemyName, window.gameMode, window.currentDeck, pointsChange);
}

window.registrarVitoriaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    let modoAtual = (window.gameMode === 'pvp' || modo === 'pvp') ? 'pvp' : 'pve';
    const pts = await registrarVitoriaDB(currentUser, modoAtual);
    if(pts > 0) await saveMatchHistory('WIN', pts);
};

window.registrarDerrotaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    let modoAtual = (window.gameMode === 'pvp' || modo === 'pvp') ? 'pvp' : 'pve';
    const pts = await registrarDerrotaDB(currentUser, modoAtual);
    if(pts !== 0) await saveMatchHistory('LOSS', pts);
};

window.restartMatch = function() { document.getElementById('end-screen').classList.remove('visible'); setTimeout(startGameFlow, 50); MusicController.play('bgm-loop'); }

async function notifyAbandonment() {
    if (!window.currentMatchId || !currentUser) return;
    await notifyAbandonmentDB(window.currentMatchId, currentUser.uid);
}

window.abandonMatch = function() {
    if(document.getElementById('game-screen').classList.contains('active')) {
        window.toggleConfig(); 
        window.openModal("ABANDONAR?", "Sair da partida contará como DERROTA. Tem certeza?", ["CANCELAR", "SAIR"], async (choice) => { 
                if (choice === "SAIR") {
                    if (window.gameMode === 'pvp') await notifyAbandonment(); 
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
        if(window.updateVol) window.updateVol('master', window.masterVol);
        setTimeout(() => {
            const loading = document.getElementById('loading-screen');
            if(loading) { loading.style.opacity = '0'; setTimeout(() => loading.style.display = 'none', 500); }
            if(!window.hoverLogicInitialized) { initGlobalHoverLogic(); window.hoverLogicInitialized = true; }
        }, 800); 
        document.body.addEventListener('click', () => { if (!MusicController.currentTrackId || (audios['bgm-menu'] && audios['bgm-menu'].paused && window.musicEnabled)) { MusicController.play('bgm-menu'); } }, { once: true });
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
        if (backBtn) {
            backBtn.style.zIndex = "9999"; backBtn.style.pointerEvents = "all"; 
            backBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); window.playNavSound(); window.transitionToLobby(true); };
        }
    }
};

document.addEventListener('click', function(e) {
    const target = e.target.closest('#deck-selection-screen .circle-btn, #deck-selection-screen .btn-back, #deck-selection-screen button, .return-btn');
    if (target) { e.stopPropagation(); window.playNavSound(); window.transitionToLobby(true); }
});

window.addEventListener('beforeunload', () => { if (window.gameMode === 'pvp' && window.currentMatchId && !document.getElementById('end-screen').classList.contains('visible')) notifyAbandonment(); });

window.toggleFullScreen = function() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => console.log(e)); } else { if (document.exitFullscreen) document.exitFullscreen(); }
}

function createLobbyFlares() {
    const container = document.getElementById('lobby-particles'); if(!container) return; container.innerHTML = ''; 
    for(let i=0; i < 70; i++) {
        let flare = document.createElement('div'); flare.className = 'lobby-flare'; flare.style.left = Math.random() * 100 + '%'; flare.style.top = Math.random() * 100 + '%';
        let size = 4 + Math.random() * 18; flare.style.width = size + 'px'; flare.style.height = size + 'px'; flare.style.animationDuration = (3 + Math.random() * 5) + 's'; flare.style.animationDelay = (Math.random() * 4) + 's';
        container.appendChild(flare);
    }
}

function startCinematicLoop() { const c = audios['sfx-cine']; if(c) {try { c.volume = 0; c.play().catch(()=>{}); } catch(e){} if(mixerInterval) clearInterval(mixerInterval); mixerInterval = setInterval(updateAudioMixer, 30); }}

function updateAudioMixer() { 
    const cineAudio = audios['sfx-cine']; if(!cineAudio) return; 
    const mVol = window.masterVol || 0.5; const maxCine = 0.6 * mVol; let targetCine = isLethalHover ? maxCine : 0; 
    if(!window.sfxEnabled) { try { cineAudio.volume = 0; } catch(e){} return; }
    try {
        if(cineAudio.volume < targetCine) cineAudio.volume = Math.min(targetCine, cineAudio.volume + 0.05); 
        else if(cineAudio.volume > targetCine) cineAudio.volume = Math.max(targetCine, cineAudio.volume - 0.05); 
    } catch(e){}
}

// === NOVO SISTEMA DE CONFIGURAÇÕES ===
window.saveAudioSettings = async function() {
    if (!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        await updateDoc(userRef, {
            settings: { vol: window.masterVol, music: window.musicEnabled, sfx: window.sfxEnabled }
        });
    } catch(e) { console.error("Erro ao salvar config", e); }
}

window.updateVol = function(type, val) { 
    if(type==='master') window.masterVol = parseFloat(val); 
    ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-hit-mage', 'sfx-block', 'sfx-block-mage', 'sfx-heal', 'sfx-levelup', 'sfx-train', 'sfx-disarm', 'sfx-deck-select', 'sfx-hover', 'sfx-ui-hover', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'bgm-loop', 'sfx-nav', 'sfx-cine'].forEach(k => { 
        if(audios[k]) {
            let baseVol = 0.8;
            if(k === 'sfx-ui-hover') baseVol = 0.3;
            else if (k === 'sfx-levelup') baseVol = 1.0;
            else if (k === 'sfx-train') baseVol = 0.5;
            else if (k.startsWith('bgm')) baseVol = 0.5;
            else if (k === 'sfx-cine') baseVol = 0.6;
            try { audios[k].volume = baseVol * window.masterVol; } catch(e){}
        }
    }); 
    if(window.saveAudioSettings) window.saveAudioSettings();
}

window.toggleSoundType = function(type) {
    window.playNavSound();
    if (type === 'music') {
        window.musicEnabled = document.getElementById('check-music').checked;
        if (!window.musicEnabled) {
            if (MusicController.currentTrackId && audios[MusicController.currentTrackId]) audios[MusicController.currentTrackId].pause();
        } else {
            if (MusicController.currentTrackId && audios[MusicController.currentTrackId]) audios[MusicController.currentTrackId].play().catch(()=>{});
        }
    } else {
        window.sfxEnabled = document.getElementById('check-sfx').checked;
    }
    if(window.saveAudioSettings) window.saveAudioSettings();
};

window.toggleConfig = function() { 
    window.playNavSound();
    const overlay = document.getElementById('config-overlay'); 
    const box = overlay.querySelector('.config-box');
    const abandonArea = document.getElementById('abandon-area');

    if (overlay.style.display === 'flex') {
        box.classList.remove('config-pop-in'); 
        box.classList.add('config-pop-out');
        setTimeout(() => { overlay.style.display = 'none'; box.classList.remove('config-pop-out'); }, 200);
    } else { 
        const isGameActive = document.getElementById('game-screen').classList.contains('active');
        if(abandonArea) abandonArea.style.display = isGameActive ? 'block' : 'none';
        overlay.style.display = 'flex'; box.classList.add('config-pop-in'); 
    } 
};

// FECHAR AO CLICAR FORA DA JANELA
document.addEventListener('click', function(e) { 
    const overlay = document.getElementById('config-overlay'); 
    if (overlay && overlay.style.display === 'flex') {
        if (e.target === overlay) {
            window.toggleConfig();
        }
    }
});

function playSound(key) { 
    if (!window.sfxEnabled && !key.startsWith('bgm')) return;
    if(audios[key]) { 
        try {
            if (key === 'sfx-levelup') {
                audios[key].volume = 1.0 * window.masterVol;
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

function initAmbientParticles() { const container = document.getElementById('ambient-particles'); if(!container) return; for(let i=0; i<50; i++) { let d = document.createElement('div'); d.className = 'ember'; d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (5 + Math.random() * 5) + 's'; d.style.setProperty('--mx', (Math.random() - 0.5) * 50 + 'px'); container.appendChild(d); } }
initAmbientParticles();

function spawnParticles(x, y, color) { for(let i=0; i<15; i++) { let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color; p.style.left = x + 'px'; p.style.top = y + 'px'; let angle = Math.random() * Math.PI * 2; let vel = 50 + Math.random() * 100; p.style.setProperty('--tx', `${Math.cos(angle)*vel}px`); p.style.setProperty('--ty', `${Math.sin(angle)*vel}px`); document.body.appendChild(p); setTimeout(() => p.remove(), 800); } }

function triggerDamageEffect(isPlayer, playAudio = true) { 
    try { 
        if(playAudio) { if(!isPlayer && window.currentDeck === 'mage') playSound('sfx-hit-mage'); else playSound('sfx-hit'); } 
        let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId); 
        if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#ff4757'); } 
        if (isPlayer) {
            document.body.classList.add('shake-screen-hard'); setTimeout(() => document.body.classList.remove('shake-screen-hard'), 400); 
            if(window.triggerDamageEffect) window.triggerDamageEffect(); 
            let ov = document.getElementById('dmg-overlay-old'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 150); } 
        }
    } catch(e) {} 
}

function triggerCritEffect() { let ov = document.getElementById('crit-overlay'); if(ov) { ov.style.opacity = '1'; document.body.style.filter = "grayscale(0.8) contrast(1.2)"; document.body.style.transition = "filter 0.05s"; setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => { document.body.style.transition = "filter 0.5s"; document.body.style.filter = "none"; }, 800); }, 100); } }

function triggerHealEffect(isPlayer) { 
    try { 
        let elId = isPlayer ? 'p-slot' : 'm-slot'; let slot = document.getElementById(elId); 
        if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#2ecc71'); } 
        if (isPlayer) {
            if(window.triggerHealEffect) window.triggerHealEffect();
            let ov = document.getElementById('heal-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 300); } 
        }
    } catch(e) {} 
}

function triggerBlockEffect(isPlayer) { 
    try { 
        if(isPlayer && window.currentDeck === 'mage') playSound('sfx-block-mage'); else playSound('sfx-block'); 
        if (!isPlayer) {
             if(window.triggerBlockEffect) window.triggerBlockEffect(); 
             let ov = document.getElementById('block-overlay'); if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 200); } 
        }
    } catch(e) { console.warn("Erro no bloqueio:", e); } 
}

function triggerXPGlow(unitId) { let xpArea = document.getElementById(unitId + '-xp'); if(xpArea) { xpArea.classList.add('xp-glow'); setTimeout(() => xpArea.classList.remove('xp-glow'), 600); } }
function showCenterText(txt, col) { let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; if(col) el.style.color = col; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }

function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget) {
    let pDmg = 0, mDmg = 0;
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train');
    if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');

    if(mAct === 'ATAQUE') pDmg += monster.lvl;
    if(pAct === 'ATAQUE') mDmg += player.lvl;
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') mDmg += (1 + player.bonusBlock); }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') pDmg += (1 + monster.bonusBlock); }

    let clash = false; let pBlocks = (pAct === 'BLOQUEIO' && mAct === 'ATAQUE'); let mBlocks = (mAct === 'BLOQUEIO' && pAct === 'ATAQUE'); 
    if(pBlocks) { clash = true; triggerBlockEffect(true); } else if(mBlocks) { clash = true; triggerBlockEffect(false); }

    let nextPlayerDisabled = null; let nextMonsterDisabled = null;
    if(mAct === 'DESARMAR') { if(mDisarmTarget) nextPlayerDisabled = mDisarmTarget; else nextPlayerDisabled = 'ATAQUE'; }
    if(pAct === 'DESARMAR') { nextMonsterDisabled = pDisarmChoice; }
    if(pAct === 'DESARMAR' && mAct === 'DESARMAR') { nextPlayerDisabled = null; nextMonsterDisabled = null; showCenterText("ANULADO", "#aaa"); }

    player.disabled = nextPlayerDisabled; monster.disabled = nextMonsterDisabled;
    if(pDmg >= 4 || mDmg >= 4) triggerCritEffect();

    if(pDmg > 0) { 
        player.hp -= pDmg; showFloatingText('p-lvl', `-${pDmg}`, "#ff7675"); 
        let soundOn = !(clash && mAct === 'BLOQUEIO'); 
        if (!mBlocks) { triggerDamageEffect(true, soundOn); }
    }
    if(mDmg > 0) { 
        monster.hp -= mDmg; showFloatingText('m-lvl', `-${mDmg}`, "#ff7675"); 
        let soundOn = !(clash && pAct === 'BLOQUEIO'); triggerDamageEffect(false, soundOn); 
    }
    
    updateUI(); let pDead = player.hp <= 0, mDead = monster.hp <= 0;
    
    if(!pDead && pAct === 'DESCANSAR') { 
        let healAmount = (pDmg === 0) ? 3 : 2; 
        player.hp = Math.min(player.maxHp, player.hp + healAmount); 
        showFloatingText('p-lvl', `+${healAmount} HP`, "#55efc4"); triggerHealEffect(true); playSound('sfx-heal'); 
    }
    if(!mDead && mAct === 'DESCANSAR') { 
        let healAmount = (mDmg === 0) ? 3 : 2; 
        monster.hp = Math.min(monster.maxHp, monster.hp + healAmount); 
        triggerHealEffect(false); playSound('sfx-heal'); 
    }

    function handleExtraXP(u) { 
        if (window.gameMode === 'pvp' && window.currentMatchId) {
             if (u === player && u.deck.length > 0) {
                 let card = u.deck.pop(); 
                 animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { u.xp.push(card); triggerXPGlow(u.id); updateUI(); }, false, false, true);
             }
        } else {
            if(u.deck.length > 0) { 
                let card = u.deck.pop(); 
                animateFly(u.id+'-deck-container', u.id+'-xp', card, () => { u.xp.push(card); triggerXPGlow(u.id); updateUI(); }, false, false, (u.id === 'p')); 
            } 
        }
    }

    if(!pDead && pAct === 'TREINAR') handleExtraXP(player); 
    if(!mDead && mAct === 'TREINAR') handleExtraXP(monster);
    if(!pDead && pAct === 'ATAQUE' && mAct === 'DESCANSAR') handleExtraXP(player); 
    if(!mDead && mAct === 'ATAQUE' && pAct === 'DESCANSAR') handleExtraXP(monster);

    setTimeout(() => {
        animateFly('p-slot', 'p-xp', pAct, () => { 
            if(!pDead) { 
                player.xp.push(pAct); triggerXPGlow('p'); updateUI(); 
                if (window.gameMode === 'pvp') commitTurnToDB(pAct); 
            } 
            checkLevelUp(player, () => { if(!pDead) { drawCardLogic(player, 1); turnCount++; updateUI(); isProcessing = false; } }); 
        }, false, false, true);

        animateFly('m-slot', 'm-xp', mAct, () => { 
            if (window.gameMode !== 'pvp' && !mDead) { monster.xp.push(mAct); triggerXPGlow('m'); updateUI(); } 
            checkLevelUp(monster, () => { if(!mDead) drawCardLogic(monster, 1); checkEndGame(); }); 
        }, false, false, false);
        
        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    }, 700);
}
