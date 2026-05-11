import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, orderBy, limit, onSnapshot, increment, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
} catch (e) {}

let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
window.gameAssets = []; 
window.pvpUnsubscribe = null; 
let searchInterval = null;

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
        'assets/img/logo_buppo.webp',
        'assets/img/mesa_cavaleiro.webp',
        'assets/img/mesa_mago.webp',
        'assets/img/bg_saguao.webp',
        'assets/img/ui_moldura_perfil.webp',
        'assets/img/ui_placa_selecao.webp',
        'assets/img/card_selecao_cavaleiro.webp',
        'assets/img/card_selecao_mago.webp',
        'assets/img/deck_verso_cavaleiro.webp',
        'assets/img/deck_verso_mago.webp',
        'assets/img/card_verso_padrao.webp',
        'assets/img/ui_mesa_deck.webp',
        'assets/img/ui_area_xp.webp',
        'assets/img/carta_ataque_cavaleiro.webp',
        'assets/img/carta_bloqueio_cavaleiro.webp',
        'assets/img/carta_descansar_cavaleiro.webp',
        'assets/img/carta_desarmar_cavaleiro.webp',
        'assets/img/carta_treinar_cavaleiro.webp',
        'assets/img/carta_ataque_mago.webp',
        'assets/img/carta_bloqueio_mago.webp',
        'assets/img/carta_descansar_mago.webp',
        'assets/img/carta_desarmar_mago.webp',
        'assets/img/carta_treinar_mago.webp',
        'assets/img/cluster_jogador.webp',
        'assets/img/cluster_inimigo.webp'
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
let isLethalHover = false; 
let mixerInterval = null;

window.masterVol = 1.0; 
window.musicVol = 1.0; 
window.sfxVol = 1.0;   
window.isMuted = false;

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
    window.currentMatchId = null;
    window.myRole = null; 
    window.pvpStartData = null;
    window.pvpSelectedCardIndex = null;
    window.isResolvingTurn = false;
    window.latestMatchData = null;
    isProcessing = false;
    const sb = document.getElementById('pvp-status-bar');
    if(sb) sb.remove();
}

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
    for(let k in DECK_TEMPLATE) { for(let i=0; i<DECK_TEMPLATE[k]; i++) deck.push(k); }
    shuffle(deck); return deck;
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
                    this.fadeIn(audio, 0.5 * window.masterVol * window.musicVol);
                }
                return; 
            } 
            const maxVol = 0.5 * window.masterVol * window.musicVol;
            if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]);
            const newAudio = audios[trackId];
            if (newAudio.readyState >= 2) newAudio.currentTime = 0;
            if (!window.isMuted) {
                newAudio.volume = 0; 
                newAudio.play().catch(()=>{});
                this.fadeIn(newAudio, maxVol);
            }
            this.currentTrackId = trackId;
        } catch(e) {}
    },
    stopCurrent() {
        if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]);
        this.currentTrackId = null;
    },
    fadeOut(audio) {
        if(!audio) return;
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) { vol -= 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); }
            } else { try { audio.volume = 0; audio.pause(); } catch(e){} clearInterval(fadeOutInt); }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        if(!audio) return;
        let vol = 0; audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) { vol += 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); }
            } else { try { audio.volume = targetVol; } catch(e){} clearInterval(fadeInInt); }
        }, 50);
    }
};

window.playNavSound = function() { 
    let s = audios['sfx-nav']; 
    if(s && !window.isMuted) { 
        try {
            if (s.readyState >= 2) s.currentTime = 0; 
            s.volume = 0.8 * window.masterVol * window.sfxVol; 
            s.play().catch(()=>{});
        } catch(e) {}
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
            s.volume = 0.3 * window.masterVol * window.sfxVol;
            s.play().catch(()=>{}); 
            lastHoverTime = now;
        } catch(e){}
    }
};

function playSound(key) { 
    if(window.isMuted) return; 
    if(audios[key]) { 
        try {
            let finalVol = window.masterVol * window.sfxVol;
            if (key === 'sfx-levelup') {
                audios[key].volume = 1.0 * finalVol;
                if (audios[key].readyState >= 2) audios[key].currentTime = 0; 
                audios[key].play().catch(()=>{});
                let clone = audios[key].cloneNode();
                clone.volume = audios[key].volume;
                clone.play().catch(()=>{});
            } else {
                if (audios[key].readyState >= 2) audios[key].currentTime = 0; 
                if (key === 'sfx-train') audios[key].volume = 0.5 * finalVol;
                else if (key === 'sfx-ui-hover') audios[key].volume = 0.3 * finalVol;
                else audios[key].volume = 0.8 * finalVol;
                audios[key].play().catch(()=>{}); 
            }
        } catch(e){}
    } 
}

window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    const configBtn = document.getElementById('btn-config-toggle');
    const surrenderBtn = document.getElementById('btn-surrender');
    const separator = document.getElementById('cfg-separator');
    
    if(screenId === 'game-screen' || screenId === 'lobby-screen') {
        if(configBtn) configBtn.style.display = 'flex'; 
        if (screenId === 'game-screen') {
            if(surrenderBtn) surrenderBtn.style.display = 'block';
            if(separator) separator.style.display = 'block';
        } else {
            if(surrenderBtn) surrenderBtn.style.display = 'none';
            if(separator) separator.style.display = 'none';
        }
    } else {
        if(configBtn) configBtn.style.display = 'none';
        const panel = document.getElementById('config-panel');
        if(panel) { panel.style.display = 'none'; panel.classList.remove('active'); }
    }
}

window.openDeckSelector = function() {
    document.body.classList.add('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) {
        ds.style.display = 'flex';
        ds.style.opacity = '1';
        ds.style.pointerEvents = 'auto'; 
        const options = document.querySelectorAll('.deck-option');
        options.forEach(opt => { opt.style = ""; const img = opt.querySelector('img'); if(img) img.style = ""; });
    }
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
    if (deckType === 'mage') document.body.classList.add('theme-mago');
    else document.body.classList.add('theme-cavaleiro');

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
            if (window.gameMode === 'pvp') initiateMatchmaking(); 
            else window.transitionToGame();
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
    cleanupMatchState(); 
    document.body.classList.remove('force-landscape');
    const ds = document.getElementById('deck-selection-screen');
    if(ds) { ds.style.opacity = '0'; ds.style.pointerEvents = 'none'; ds.style.display = 'none'; ds.classList.remove('active'); }

    if (skipAnim) {
        window.goToLobby(false);
    } else {
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
    if(!currentUser) {
        window.showScreen('start-screen');
        MusicController.play('bgm-menu'); 
        return;
    }
    cleanupMatchState(); 
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

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    window.isResolvingTurn = false; 
    window.pvpSelectedCardIndex = null; 
    const oldStatus = document.getElementById('pvp-status-bar');
    if(oldStatus) oldStatus.remove();

    startCinematicLoop(); 
    window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand');
    if (handEl) { handEl.innerHTML = ''; handEl.classList.add('preparing'); }
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
                    cleanupMatchState();
                }, 500);
            }
            return; 
        }

        if (!namesUpdated && matchData.player1 && matchData.player2) {
            let myName, enemyName;
            if (window.myRole === 'player1') { myName = matchData.player1.name; enemyName = matchData.player2.name; } 
            else { myName = matchData.player2.name; enemyName = matchData.player1.name; }
            const pNameEl = document.querySelector('#p-stats-cluster .unit-name');
            const mNameEl = document.querySelector('#m-stats-cluster .unit-name');
            if(pNameEl) pNameEl.innerText = myName;
            if(mNameEl) mNameEl.innerText = enemyName;
            namesUpdated = true; 
        }

        const p1Ready = matchData.p1Move && matchData.p1Move.length > 0;
        const p2Ready = matchData.p2Move && matchData.p2Move.length > 0;
        updateUI();

        if (p1Ready && p2Ready) {
            if (!window.isResolvingTurn) {
                const sb = document.getElementById('pvp-status-bar');
                if(sb) sb.remove();
                resolvePvPTurn(matchData.p1Move, matchData.p2Move, matchData.p1Disarm, matchData.p2Disarm);
            }
        } else {
            if (window.myRole === 'player1' && p1Ready && !p2Ready) showPvPStatus("AGUARDANDO OPONENTE...");
            else if (window.myRole === 'player2' && p2Ready && !p1Ready) showPvPStatus("AGUARDANDO OPONENTE...");
        }
          
        if (window.gameMode === 'pvp' && window.myRole) {
            const myServerRole = window.myRole;
            const enemyServerRole = (window.myRole === 'player1') ? 'player2' : 'player1';
            const myData = matchData[myServerRole];
            const enemyData = matchData[enemyServerRole];
            
            if (!window.isResolvingTurn && myData && myData.hp !== undefined) {
                if (myData.hp < player.hp) {
                    let dmg = player.hp - myData.hp;
                    player.hp = myData.hp;
                    showFloatingText('p-lvl', `-${dmg}`, "#ff7675");
                    triggerDamageEffect(true, true);
                    updateUI(); checkEndGame();
                }
            }
            
            if (enemyData) {
                if(enemyData.deck) monster.deck = [...enemyData.deck];
                const serverXP = enemyData.xp || [];
                const localXP = monster.xp || [];

                if (serverXP.length > localXP.length) {
                    const startIdx = localXP.length;
                    for (let i = startIdx; i < serverXP.length; i++) {
                        const newCardKey = serverXP[i]; 
                        animateFly('m-deck-container', 'm-xp', newCardKey, () => { triggerXPGlow('m'); }, false, false, false);
                    }
                    monster.xp = [...serverXP];
                    updateUI();
                } 
                else if (serverXP.length < localXP.length) {
                    monster.xp = [...serverXP];
                    if (enemyData.lvl && enemyData.lvl > monster.lvl) { triggerLevelUpVisuals('m'); playSound('sfx-levelup'); }
                    if(enemyData.lvl) monster.lvl = enemyData.lvl;
                    if(enemyData.maxHp) monster.maxHp = enemyData.maxHp;
                    if(enemyData.bonusAtk !== undefined) monster.bonusAtk = enemyData.bonusAtk;
                    if(enemyData.bonusBlock !== undefined) monster.bonusBlock = enemyData.bonusBlock;
                    if(enemyData.hp !== undefined) monster.hp = enemyData.hp; 
                    updateUI();
                }
            }
        }
    });
}

function showPvPStatus(msg) {
    let el = document.getElementById('pvp-status-bar');
    if (!el) {
        el = document.createElement('div');
        el.id = 'pvp-status-bar';
        el.style.position = 'fixed'; el.style.top = '15%'; el.style.left = '50%'; el.style.transform = 'translateX(-50%)';
        el.style.background = 'rgba(0,0,0,0.7)'; el.style.color = '#ffd700'; el.style.padding = '10px 20px';
        el.style.borderRadius = '20px'; el.style.zIndex = '9999'; el.style.fontSize = '14px';
        el.style.border = '1px solid #ffd700'; el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        document.body.appendChild(el);
    }
    el.innerText = msg;
}

function checkEndGame(){ 
    if(player.hp<=0 || monster.hp<=0) { 
        isProcessing = true; 
        isLethalHover = false; 
        MusicController.stopCurrent();
        const sb = document.getElementById('pvp-status-bar');
        if(sb) sb.remove();

        setTimeout(()=>{ 
            let title = document.getElementById('end-title'); 
            let isWin = player.hp > 0;
            let isTie = player.hp <= 0 && monster.hp <= 0;
            if(isTie) { title.innerText = "EMPATE"; title.className = "tie-theme"; playSound('sfx-tie'); } 
            else if(isWin) { title.innerText = "VITÓRIA"; title.className = "win-theme"; playSound('sfx-win'); } 
            else { title.innerText = "DERROTA"; title.className = "lose-theme"; playSound('sfx-lose'); } 
            
            if(isWin && !isTie) { if(window.registrarVitoriaOnline) window.registrarVitoriaOnline('pvp'); } 
            else { if(window.registrarDerrotaOnline) window.registrarDerrotaOnline(window.gameMode); }
            document.getElementById('end-screen').classList.add('visible'); 
        }, 1000); 
    } else { isProcessing = false; } 
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadUserSettings();
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
    catch (error) { btnText.innerText = "ERRO - TENTE NOVAMENTE"; setTimeout(() => btnText.innerText = "LOGIN COM GOOGLE", 3000); }
};

window.handleLogout = function() {
    window.playNavSound();
    signOut(auth).then(() => { location.reload(); });
};

async function saveMatchHistory(result, pointsChange) {
    if (!currentUser) return;
    try {
        let enemyName = "PVE"; 
        if (window.gameMode === 'pvp') {
            if (window.pvpStartData) enemyName = (window.myRole === 'player1') ? window.pvpStartData.player2.name : window.pvpStartData.player1.name;
            if (!enemyName || enemyName === "PVE") {
                const domName = document.querySelector('#m-stats-cluster .unit-name');
                if (domName && domName.innerText !== 'Monstro') enemyName = domName.innerText;
            }
            if(enemyName) enemyName = enemyName.split(' ')[0].toUpperCase();
        }

        const historyRef = collection(db, "players", currentUser.uid, "history");
        await addDoc(historyRef, { result: result, opponent: enemyName, mode: window.gameMode || 'pve', deck: window.currentDeck, points: pointsChange, timestamp: Date.now() });
    } catch (e) { console.error("Erro ao salvar histórico:", e); }
}

window.registrarVitoriaOnline = async function(modo = 'pve') {
    if(!currentUser) return;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(userSnap.exists()) {
            const data = userSnap.data();
            let modoAtual = window.gameMode || 'pve';
            if (modo === 'pvp') modoAtual = 'pvp';
            let pontosGanhos = (modoAtual === 'pvp') ? 8 : 1; 
            await updateDoc(userRef, { totalWins: (data.totalWins || 0) + 1, score: (data.score || 0) + pontosGanhos });
            await saveMatchHistory('WIN', pontosGanhos);
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
            let modoAtual = window.gameMode || 'pve';
            if (modo === 'pvp') modoAtual = 'pvp';
            let pontosPerdidos = (modoAtual === 'pvp') ? 8 : 3;
            let novoScore = Math.max(0, (data.score || 0) - pontosPerdidos);
            await updateDoc(userRef, { score: novoScore });
            await saveMatchHistory('LOSS', -pontosPerdidos);
        }
    } catch(e) {}
};

window.restartMatch = function() {
    document.getElementById('end-screen').classList.remove('visible');
    setTimeout(startGameFlow, 50);
    MusicController.play('bgm-loop'); 
}

async function notifyAbandonment() {
    if (!window.currentMatchId || !currentUser) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    try { await updateDoc(matchRef, { status: 'abandoned', abandonedBy: currentUser.uid }); } catch (e) {}
}

window.abandonMatch = function() {
    if(document.getElementById('game-screen').classList.contains('active')) {
        window.toggleConfig(); 
        window.openModal(
            "ABANDONAR?", "Sair da partida contará como DERROTA. Tem certeza?", ["CANCELAR", "SAIR"], 
            async (choice) => { 
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
    ASSETS_TO_LOAD.images.forEach(src => { 
        let img = new Image(); img.src = src; window.gameAssets.push(img);
        img.onload = () => updateLoader(); img.onerror = () => updateLoader(); 
    });
    ASSETS_TO_LOAD.audio.forEach(a => { 
        let s = new Audio(); s.src = a.src; s.preload = 'auto'; if(a.loop) s.loop = true; 
        audios[a.id] = s; window.gameAssets.push(s);
        s.onloadedmetadata = () => updateLoader(); s.onerror = () => updateLoader(); 
        setTimeout(() => { if(s.readyState === 0) updateLoader(); }, 2000); 
    });
}

function updateLoader() {
    assetsLoaded++; 
    let pct = Math.min(100, (assetsLoaded / totalAssets) * 100); 
    const fill = document.getElementById('loader-fill');
    if(fill) fill.style.width = pct + '%';
    if(assetsLoaded >= totalAssets) {
        if(window.updateVol) window.updateVol('master', window.masterVol || 1.0, false);
        setTimeout(() => {
            const loading = document.getElementById('loading-screen');
            if(loading) {
                loading.style.opacity = '0';
                setTimeout(() => loading.style.display = 'none', 500);
            }
            if(!window.hoverLogicInitialized) { initGlobalHoverLogic(); window.hoverLogicInitialized = true; }
        }, 800); 
        document.body.addEventListener('click', () => { 
            if (!MusicController.currentTrackId || (audios['bgm-menu'] && audios['bgm-menu'].paused)) MusicController.play('bgm-menu');
        }, { once: true });
    }
}

function initGlobalHoverLogic() {
    let lastTarget = null;
    document.body.addEventListener('mouseover', (e) => {
        const selector = 'button, .circle-btn, #btn-fullscreen, .deck-option, .mini-btn';
        const target = e.target.closest(selector);
        if (target && target !== lastTarget) { lastTarget = target; window.playUIHoverSound(); } 
        else if (!target) { lastTarget = null; }
    });
}

window.addEventListener('beforeunload', () => {
    if (window.gameMode === 'pvp' && window.currentMatchId && !document.getElementById('end-screen').classList.contains('visible')) { notifyAbandonment(); }
});

window.toggleFullScreen = function() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => console.log(e)); } 
    else { if (document.exitFullscreen) document.exitFullscreen(); }
}

function createLobbyFlares() {
    const container = document.getElementById('lobby-particles');
    if(!container) return; container.innerHTML = ''; 
    for(let i=0; i < 70; i++) {
        let flare = document.createElement('div');
        flare.className = 'lobby-flare';
        flare.style.left = Math.random() * 100 + '%'; flare.style.top = Math.random() * 100 + '%';
        let size = 4 + Math.random() * 18; 
        flare.style.width = size + 'px'; flare.style.height = size + 'px';
        flare.style.animationDuration = (3 + Math.random() * 5) + 's'; 
        flare.style.animationDelay = (Math.random() * 4) + 's';
        container.appendChild(flare);
    }
}

function startCinematicLoop() { const c = audios['sfx-cine']; if(c) {try { c.volume = 0; c.play().catch(()=>{}); } catch(e){} if(mixerInterval) clearInterval(mixerInterval); mixerInterval = setInterval(updateAudioMixer, 30); }}

function updateAudioMixer() { 
    const cineAudio = audios['sfx-cine']; 
    if(!cineAudio) return; 
    const mVol = window.masterVol || 1.0;
    const maxCine = 0.6 * mVol; 
    let targetCine = isLethalHover ? maxCine : 0; 
    if(window.isMuted) { try { cineAudio.volume = 0; } catch(e){} return; }
    try {
        if(cineAudio.volume < targetCine) cineAudio.volume = Math.min(targetCine, cineAudio.volume + 0.05); 
        else if(cineAudio.volume > targetCine) cineAudio.volume = Math.max(targetCine, cineAudio.volume - 0.05); 
    } catch(e){}
}

window.toggleConfig = function() { 
    let p = document.getElementById('config-panel'); 
    if(p.style.display==='flex'){ 
        p.style.display='none'; p.classList.remove('active'); document.body.classList.remove('config-mode'); 
    } else { 
        p.style.display='flex'; p.classList.add('active'); document.body.classList.add('config-mode'); 
    } 
}
document.addEventListener('click', function(e) { 
    const panel = document.getElementById('config-panel'); 
    const btn = document.getElementById('btn-config-toggle'); 
    if (panel && panel.classList.contains('active') && !panel.contains(e.target) && (btn && !btn.contains(e.target))) window.toggleConfig(); 
});

window.updateVol = function(type, val, shouldSave = true) { 
    const value = parseFloat(val);
    if(type === 'master') window.masterVol = value; 
    if(type === 'music') window.musicVol = value; 
    if(type === 'sfx') window.sfxVol = value; 

    const txtEl = document.getElementById(`val-${type}`);
    if(txtEl) txtEl.innerText = Math.round(value * 100) + "%";

    if(MusicController.currentTrackId && audios[MusicController.currentTrackId]) {
        let finalMusicVol = window.isMuted ? 0 : (0.5 * window.masterVol * window.musicVol);
        audios[MusicController.currentTrackId].volume = finalMusicVol;
    }

    if(shouldSave) saveUserSettings();
}

window.toggleMasterMute = function() {
    window.isMuted = !window.isMuted;
    window.playNavSound();
    applyMuteVisuals();
    window.updateVol('master', window.masterVol); 
    saveUserSettings();
};

function applyMuteVisuals() {
    const btn = document.getElementById('master-mute-btn');
    if(btn) {
        if(window.isMuted) { btn.innerText = "DESLIGADO"; btn.classList.add('mute-off'); } 
        else { btn.innerText = "LIGADO"; btn.classList.remove('mute-off'); }
    }
}

function updateSlidersUI() {
    if(document.getElementById('slide-master')) document.getElementById('slide-master').value = window.masterVol;
    if(document.getElementById('slide-music')) document.getElementById('slide-music').value = window.musicVol;
    if(document.getElementById('slide-sfx')) document.getElementById('slide-sfx').value = window.sfxVol;
    ['master', 'music', 'sfx'].forEach(t => {
        const el = document.getElementById(`val-${t}`);
        if(el) el.innerText = Math.round((t === 'master' ? window.masterVol : (t === 'music' ? window.musicVol : window.sfxVol)) * 100) + "%";
    });
}

window.openSoundMenu = function() {
    window.toggleConfig(); 
    window.playNavSound();
    document.getElementById('settings-overlay').style.display = 'flex';
    document.getElementById('sound-modal').style.display = 'block';
    document.getElementById('about-modal').style.display = 'none';
};

window.openAboutMenu = function() {
    window.toggleConfig(); 
    window.playNavSound();
    document.getElementById('settings-overlay').style.display = 'flex';
    document.getElementById('sound-modal').style.display = 'none';
    document.getElementById('about-modal').style.display = 'block';
};

window.closeSettingsModal = function(e) {
    if (e && e.target !== document.getElementById('settings-overlay')) return;
    window.playNavSound();
    document.getElementById('settings-overlay').style.display = 'none';
};

function initAmbientParticles() { const container = document.getElementById('ambient-particles'); if(!container) return; for(let i=0; i<50; i++) { let d = document.createElement('div'); d.className = 'ember'; d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (5 + Math.random() * 5) + 's'; d.style.setProperty('--mx', (Math.random() - 0.5) * 50 + 'px'); container.appendChild(d); } }
initAmbientParticles();

function spawnParticles(x, y, color) { for(let i=0; i<15; i++) { let p = document.createElement('div'); p.className = 'particle'; p.style.backgroundColor = color; p.style.left = x + 'px'; p.style.top = y + 'px'; let angle = Math.random() * Math.PI * 2; let vel = 50 + Math.random() * 100; p.style.setProperty('--tx', `${Math.cos(angle)*vel}px`); p.style.setProperty('--ty', `${Math.sin(angle)*vel}px`); document.body.appendChild(p); setTimeout(() => p.remove(), 800); } }

function triggerDamageEffect(isPlayer, playAudio = true) { 
    try { 
        if(playAudio) { if(!isPlayer && window.currentDeck === 'mage') playSound('sfx-hit-mage'); else playSound('sfx-hit'); } 
        let elId = isPlayer ? 'p-slot' : 'm-slot'; 
        let slot = document.getElementById(elId); 
        if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#ff4757'); } 
        if (isPlayer) {
            document.body.classList.add('shake-screen'); 
            setTimeout(() => document.body.classList.remove('shake-screen'), 400); 
            if(window.triggerDamageEffect) window.triggerDamageEffect(); 
            let ov = document.getElementById('dmg-overlay'); 
            if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 150); } 
        }
    } catch(e) {} 
}

function triggerCritEffect() { let ov = document.getElementById('crit-overlay'); if(ov) { ov.style.opacity = '1'; document.body.style.filter = "grayscale(0.8) contrast(1.2)"; document.body.style.transition = "filter 0.05s"; setTimeout(() => { ov.style.opacity = '0'; setTimeout(() => { document.body.style.transition = "filter 0.5s"; document.body.style.filter = "none"; }, 800); }, 100); } }

function triggerHealEffect(isPlayer) { 
    try { 
        let elId = isPlayer ? 'p-slot' : 'm-slot'; 
        let slot = document.getElementById(elId); 
        if(slot) { let r = slot.getBoundingClientRect(); if(r.width>0) spawnParticles(r.left+r.width/2, r.top+r.height/2, '#2ecc71'); } 
        if (isPlayer) {
            if(window.triggerHealEffect) window.triggerHealEffect();
            let ov = document.getElementById('heal-overlay'); 
            if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 300); } 
        }
    } catch(e) {} 
}

function triggerBlockEffect(isPlayer) { 
    try { 
        if(isPlayer && window.currentDeck === 'mage') playSound('sfx-block-mage'); else playSound('sfx-block'); 
        if (!isPlayer) {
             if(window.triggerBlockEffect) window.triggerBlockEffect(); 
             let ov = document.getElementById('block-overlay'); 
             if(ov) { ov.style.opacity = '1'; setTimeout(() => ov.style.opacity = '0', 200); } 
             document.body.classList.add('shake-screen'); 
             setTimeout(() => document.body.classList.remove('shake-screen'), 200); 
        }
    } catch(e) {} 
}

function triggerXPGlow(unitId) { let xpArea = document.getElementById(unitId + '-xp'); if(xpArea) { xpArea.classList.add('xp-glow'); setTimeout(() => xpArea.classList.remove('xp-glow'), 600); } }
function showCenterText(txt, col) { let el = document.createElement('div'); el.className = 'center-text'; el.innerText = txt; if(col) el.style.color = col; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }

function resetUnit(u, predefinedDeck = null, role = null) { 
    u.hp = 6; u.maxHp = 6; u.lvl = 1; u.xp = []; u.hand = []; u.originalRole = role || 'pve'; 
    if (predefinedDeck) { u.deck = [...predefinedDeck]; } else {
        u.deck = []; 
        for(let k in DECK_TEMPLATE) { for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k); } 
        shuffle(u.deck); 
    }
    u.disabled = null; u.bonusBlock = 0; u.bonusAtk = 0; 
}

function dealAllInitialCards() {
    isProcessing = true; playSound('sfx-deal'); 
    const handEl = document.getElementById('player-hand'); 
    const cards = Array.from(handEl.children);
    cards.forEach((cardEl, i) => { cardEl.classList.add('intro-anim'); cardEl.style.animationDelay = (i * 0.1) + 's'; cardEl.style.opacity = ''; });
    window.isMatchStarting = false;
    if(handEl) handEl.classList.remove('preparing');
    setTimeout(() => { cards.forEach(c => { c.classList.remove('intro-anim'); c.style.animationDelay = ''; }); isProcessing = false; }, 2000); 
}

function checkCardLethality(cardKey) { if(cardKey === 'ATAQUE') { let damage = player.lvl; return damage >= monster.hp ? 'red' : false; } if(cardKey === 'BLOQUEIO') { let reflect = 1 + player.bonusBlock; return reflect >= monster.hp ? 'blue' : false; } return false; }

function onCardClick(index) {
    if(isProcessing) return; if (!player.hand[index]) return;
    if (window.gameMode === 'pvp' && window.pvpSelectedCardIndex !== null) return;

    let hc = document.getElementById('player-hand');
    if (hc) hc.style.pointerEvents = 'none';

    playSound('sfx-play'); 
    document.body.classList.remove('focus-hand', 'cinematic-active', 'tension-active'); 
    document.getElementById('tooltip-box').style.display = 'none'; 
    isLethalHover = false; 
    
    let cardKey = player.hand[index];
    if(player.disabled === cardKey) { 
        showCenterText("DESARMADA!"); 
        if (hc) hc.style.pointerEvents = 'auto'; 
        return; 
    }
    
    if(cardKey === 'DESARMAR') { 
        window.openModal('ALVO DO DESARME', 'Qual ação bloquear no inimigo?', ACTION_KEYS, (choice) => {
            if(window.gameMode === 'pvp') lockInPvPMove(index, choice); else playCardFlow(index, choice); 
        }); 
    } else { 
        if(window.gameMode === 'pvp') lockInPvPMove(index, null); else playCardFlow(index, null); 
    }
}

async function lockInPvPMove(index, disarmChoice) {
    if (!window.myRole && window.pvpStartData && currentUser) {
        if (window.pvpStartData.player1.uid === currentUser.uid) window.myRole = 'player1';
        else window.myRole = 'player2';
    }
    const handContainer = document.getElementById('player-hand');
    const cardEl = handContainer.children[index];
    if(cardEl) cardEl.classList.add('card-selected');
    window.pvpSelectedCardIndex = index;
    isProcessing = true; showPvPStatus("AGUARDANDO OPONENTE...");
    const cardKey = player.hand[index];
    const matchRef = doc(db, "matches", window.currentMatchId);
    const updateField = (window.myRole === 'player1') ? 'p1Move' : 'p2Move';
    const disarmField = (window.myRole === 'player1') ? 'p1Disarm' : 'p2Disarm';
    try {
        await updateDoc(matchRef, { [updateField]: cardKey, [disarmField]: disarmChoice || null });
    } catch (e) {
        isProcessing = false; window.pvpSelectedCardIndex = null;
        if(cardEl) cardEl.classList.remove('card-selected');
        const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove();
        showCenterText("ERRO AO ENVIAR", "red");
    }
}

function getBestAIMove() {
    let moves = []; 
    monster.hand.forEach((card, index) => { if(card !== monster.disabled) moves.push({ card: card, index: index, score: 0 }); });
    if(moves.length === 0) return null;
    let recentHistory = playerHistory.slice(-5);
    let attackCount = recentHistory.filter(c => c === 'ATAQUE').length;
    let playerAggro = recentHistory.length > 0 ? (attackCount / recentHistory.length) : 0.5;
    let threatLvl = player.lvl + player.bonusAtk;
    let amIDying = monster.hp <= threatLvl;
    let myDmg = monster.lvl + monster.bonusAtk;
    let canKill = player.hp <= myDmg;
    moves.forEach(m => {
        let score = 50; 
        if (m.card === 'ATAQUE') { if (canKill) score += 500; if (playerAggro < 0.4) score += 40; if (amIDying) score -= 30; }
        else if (m.card === 'BLOQUEIO') { if (amIDying) score += 100; if (playerAggro > 0.6) score += 60; if (threatLvl >= 3) score += 40; }
        else if (m.card === 'DESCANSAR') { if (monster.hp === monster.maxHp) score -= 100; else if (monster.hp <= 3) score += 50; if (playerAggro > 0.7) score -= 40; }
        else if (m.card === 'DESARMAR') { if (amIDying) score += 120; if (playerAggro > 0.8) score += 50; }
        else if (m.card === 'TREINAR') { if (turnCount < 5) score += 30; if (amIDying || monster.hp <= 3) score -= 200; }
        m.score = score + Math.random() * 15; 
    });
    moves.sort((a, b) => b.score - a.score);
    return moves[0];
}

async function playCardFlow(index, pDisarmChoice) {
    isProcessing = true; 
    let cardKey = player.hand.splice(index, 1)[0]; 
    playerHistory.push(cardKey);

    let aiMove = getBestAIMove(); 
    let mCardKey = 'ATAQUE'; 
    let mDisarmTarget = null; 
    if(aiMove) { 
        mCardKey = aiMove.card; monster.hand.splice(aiMove.index, 1); 
        if(mCardKey === 'DESARMAR') { 
            if(player.hp <= (monster.lvl + monster.bonusAtk + 2)) { mDisarmTarget = 'BLOQUEIO'; } 
            else { 
                let pCounts = {}; player.xp.forEach(x => pCounts[x] = (pCounts[x]||0)+1); 
                let bestTarget = null; for(let k in pCounts) if(pCounts[k] >= 3) bestTarget = k; 
                if(bestTarget) mDisarmTarget = bestTarget; else mDisarmTarget = 'ATAQUE'; 
            } 
        } 
    } else { 
        if(monster.hand.length > 0) mCardKey = monster.hand.pop(); 
        else { drawCardLogic(monster, 1); if(monster.hand.length > 0) mCardKey = monster.hand.pop(); } 
    }

    let handContainer = document.getElementById('player-hand'); 
    let realCardEl = handContainer.children[index]; 
    let startRect = null;
    if(realCardEl) { 
        startRect = realCardEl.getBoundingClientRect(); 
        realCardEl.style.transition = 'none'; realCardEl.style.setProperty('opacity', '0', 'important');
        realCardEl.style.setProperty('visibility', 'hidden', 'important'); realCardEl.innerHTML = '';
        realCardEl.style.border = 'none'; realCardEl.style.background = 'none'; realCardEl.style.boxShadow = 'none';
    }
    
    animateFly(startRect || 'player-hand', 'p-slot', cardKey, () => { renderTable(cardKey, 'p-slot', true); updateUI(); }, false, true, true); 
    const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 - (window.innerWidth < 768 ? 42 : 52.5) };
    animateFly(opponentHandOrigin, 'm-slot', mCardKey, () => { renderTable(mCardKey, 'm-slot', false); setTimeout(() => resolveTurn(cardKey, mCardKey, pDisarmChoice, mDisarmTarget), 500); }, false, true, false);
}

async function resolvePvPTurn(p1Move, p2Move, p1Disarm, p2Disarm) {
    if (window.isResolvingTurn) return; 
    window.isResolvingTurn = true; 
    isProcessing = true;
    const sb = document.getElementById('pvp-status-bar'); if(sb) sb.remove();

    let myMove, enemyMove, myDisarmChoice, enemyDisarmChoice;
    if (window.myRole === 'player1') { myMove = p1Move; enemyMove = p2Move; myDisarmChoice = p1Disarm; enemyDisarmChoice = p2Disarm; } 
    else { myMove = p2Move; enemyMove = p1Move; myDisarmChoice = p2Disarm; enemyDisarmChoice = p1Disarm; }

    try {
        if (window.pvpSelectedCardIndex === null || window.pvpSelectedCardIndex === undefined) window.pvpSelectedCardIndex = player.hand.indexOf(myMove);
        const handContainer = document.getElementById('player-hand');
        let myCardEl = null; let startRect = null;

        if (handContainer) {
            if (window.pvpSelectedCardIndex > -1 && handContainer.children[window.pvpSelectedCardIndex]) myCardEl = handContainer.children[window.pvpSelectedCardIndex];
            else { const handCards = Array.from(handContainer.children); if(handCards.length > 0) myCardEl = handCards[0]; }
        }
        if (myCardEl) { startRect = myCardEl.getBoundingClientRect(); myCardEl.classList.remove('card-selected'); myCardEl.style.opacity = '0'; }
        
        if (window.pvpSelectedCardIndex > -1 && player.hand[window.pvpSelectedCardIndex] === myMove) { player.hand.splice(window.pvpSelectedCardIndex, 1); window.pvpSelectedCardIndex = null; } 
        else { const idx = player.hand.indexOf(myMove); if(idx > -1) player.hand.splice(idx, 1); window.pvpSelectedCardIndex = null; }
        
        playerHistory.push(myMove);
        animateFly(startRect || 'player-hand', 'p-slot', myMove, () => { renderTable(myMove, 'p-slot', true); }, false, true, true);
        const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 };
        animateFly(opponentHandOrigin, 'm-slot', enemyMove, () => { renderTable(enemyMove, 'm-slot', false); }, false, true, false);
    } catch (e) {}

    setTimeout(() => {
        try {
            if (window.myRole === 'player1') {
                setTimeout(() => {
                    const matchRef = doc(db, "matches", window.currentMatchId);
                    updateDoc(matchRef, { p1Move: null, p2Move: null, p1Disarm: null, p2Disarm: null, turn: increment(1) }).catch(err => console.error("Erro", err));
                }, 4000); 
            }
            resolveTurn(myMove, enemyMove, myDisarmChoice, enemyDisarmChoice);
        } catch (error) { updateUI(); window.isResolvingTurn = false; isProcessing = false; } 
        setTimeout(() => { window.pvpSelectedCardIndex = null; window.isResolvingTurn = false; if (isProcessing) { isProcessing = false; } }, 4500);
    }, 600);
}

async function commitTurnToDB(pAct, extraCard = null) {
    if (!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    let newXP = [...player.xp]; let newDeck = [...player.deck]; 
    try {
        let updateData = {};
        if (window.myRole === 'player1') { updateData['player1.xp'] = newXP; updateData['player1.deck'] = newDeck; } 
        else { updateData['player2.xp'] = newXP; updateData['player2.deck'] = newDeck; }
        await updateDoc(matchRef, updateData);
    } catch (e) {}
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
    if(pBlocks) { clash = true; triggerBlockEffect(true); } else if(mBlocks) { clash = true; triggerBlockEffect(false); }

    let nextPlayerDisabled = null; let nextMonsterDisabled = null;
    if(mAct === 'DESARMAR') { if(mDisarmTarget) nextPlayerDisabled = mDisarmTarget; else nextPlayerDisabled = 'ATAQUE'; }
    if(pAct === 'DESARMAR') { nextMonsterDisabled = pDisarmChoice; }
    if(pAct === 'DESARMAR' && mAct === 'DESARMAR') { nextPlayerDisabled = null; nextMonsterDisabled = null; showCenterText("ANULADO", "#aaa"); }

    player.disabled = nextPlayerDisabled; monster.disabled = nextMonsterDisabled;
    if(pDmg >= 4 || mDmg >= 4) triggerCritEffect();

    if(pDmg > 0) { player.hp -= pDmg; showFloatingText('p-lvl', `-${pDmg}`, "#ff76
