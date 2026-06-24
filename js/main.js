// ARQUIVO: js/main.js
import { CARDS_DB, ACTION_KEYS } from './data.js';
import { auth, db, loginWithGoogle, logoutGoogle, saveMatchHistoryDB, registrarVitoriaDB, registrarDerrotaDB, registrarEmpateDB, notifyAbandonmentDB } from './firebase_network.js?v=2026.06.19.7';
import { stringToSeed, shuffle, drawCardLogic as baseDraw, resetUnit, getBestAIMove, checkCardLethality, generateShuffledDeck } from './game_logic.js';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, orderBy, limit, onSnapshot, increment, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// IMPORTANDO OS NOVOS MODULOS
import { audios, MusicController, playSound, startCinematicLoop } from './audio_controller.js?v=2026.06.22.4';
import { showCenterText, showFloatingText, triggerDamageEffect, triggerCritEffect, triggerHealEffect, triggerBlockEffect, triggerXPGlow, triggerLevelUpVisuals, triggerAttackSlash, triggerBlockShield, triggerRestAura, triggerTrainDeckGlow, triggerDisarmSeal, triggerHpImpact, triggerHealPulse, triggerDeckDrawGlow, showCombatCue, showMasteryBanner, highlightMasteryXP, triggerCriticalDamagePop, triggerClusterExplosion, apply3DTilt, animateFly, renderTable, MAGE_ASSETS, getCardArt, initGlobalHoverLogic, createLobbyFlares } from './ui_controller.js?v=2026.06.23.1';
import { initiateMatchmaking } from './matchmaking.js?v=2026.06.24.25';

// --- VARIAVEIS GLOBAIS DE ESTADO ---
window.currentUser = null;
let assetsLoaded = 0;
window.gameAssets = [];
window.pvpUnsubscribe = null;
window.isProcessing = false;
window.isLethalHover = false;
let turnCount = 1;
let playerHistory = [];

window.isMatchStarting = false;
window.currentDeck = 'knight';
window.playerInventory = [];
window.equippedItems = {};
window.myRole = null;
window.currentMatchId = null;
window.pvpSelectedCardIndex = null;
window.isResolvingTurn = false;
window.pvpWaitingForTurnReset = false;
window.pvpLocalResolutionComplete = false;
window.matchRewardGold = 0;
window.opponentMatchRewardGold = 0;
window.currentGoldCoins = 0;
window.matchRewardState = null;
window.matchRewardAnimationQueue = { player: [], opponent: [] };
window.matchRewardAnimationTimers = { player: null, opponent: null };
window.turnTimerInterval = null;
window.turnTimeLeft = 10;
window.turnTimerActive = false;
window.turnTimerLastBeep = 0;
window.pvpStartData = null;
window.latestMatchData = null;
window.friendsRefreshInterval = null;
window.presenceInterval = null;
window.friendInviteUnsubscribe = null;
window.outgoingInviteUnsubscribe = null;
window.selectedFriendUid = null;
window.pendingFriendInvite = null;
window.friendlyRematchRound = 0;
window.suppressFriendlyAbandon = false;
window.fullscreenEnabled = false;
window.cacheRefreshComplete = false;
window.desktopUpdateStatus = { state: 'idle' };
window.currentProfileLevel = 1;
window.currentProfileXp = 0;
window.currentLobbyRank = null;
window.currentLobbyScore = 0;

const ASSETS_TO_LOAD = {
    images: [
        'assets/img/logo_buppo.webp', 'assets/img/mesa_cavaleiro.webp', 'assets/img/mesa_mago.webp',
        'assets/img/profile_asset.webp',
        'assets/img/bg_saguao.webp', 'assets/img/bg_saguao_cartas_teste.png', 'assets/img/ui_moldura_perfil.webp', 'assets/img/ui_placa_selecao.webp',
        'assets/img/card_selecao_cavaleiro.webp', 'assets/img/card_selecao_mago.webp',
        'assets/img/deck_verso_cavaleiro.webp', 'assets/img/deck_verso_mago.webp',
        'assets/img/card_verso_padrao.webp', 'assets/img/ui_mesa_deck.webp', 'assets/img/ui_area_xp.webp',
        'assets/img/carta_ataque_cavaleiro.webp', 'assets/img/carta_bloqueio_cavaleiro.webp',
        'assets/img/carta_descansar_cavaleiro.webp', 'assets/img/carta_desarmar_cavaleiro.webp',
        'assets/img/carta_treinar_cavaleiro.webp', 'assets/img/carta_ataque_mago.webp',
        'assets/img/carta_bloqueio_mago.webp', 'assets/img/carta_descansar_mago.webp',
        'assets/img/carta_desarmar_mago.webp', 'assets/img/carta_treinar_mago.webp',
        'assets/img/cluster_jogador.webp', 'assets/img/cluster_inimigo.webp', 'assets/img/mochila.webp', 'assets/img/janela_mochila.webp', 'assets/img/titulo_mochila.webp',
        'assets/img/janela_loja.webp', 'assets/img/titulo_loja.webp',
        'assets/img/borda_cavaleiro_loja.webp', 'assets/img/borda_mago_loja.webp', 'assets/img/borda_arqueiro_loja.webp',
        'assets/img/borda_ladino_loja.webp', 'assets/img/borda_oraculo_loja.webp',
        'assets/img/ui_selo_pronto.png', 'assets/img/borda_metalica_card.webp',
        'assets/img/borda_bosque_elfico_card.webp?v=2026.06.24.5', 'assets/img/borda_chama_arcana_card.webp?v=2026.06.24.5',
        'assets/img/borda_mao_dourada_card.webp?v=2026.06.24.5', 'assets/img/borda_visao_astral_card.webp?v=2026.06.24.5'
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
        { id: 'sfx-clusterbreak', src: 'assets/audio/sfx_clusterbreak.mp3' },
        { id: 'sfx-mastery', src: 'assets/audio/maestria_bonus.mp3' },
        { id: 'sfx-cine', src: 'assets/audio/ambience_cine.mp3', loop: true },
        { id: 'sfx-hover', src: 'assets/audio/sfx_hover_carta.mp3' },
        { id: 'sfx-ui-hover', src: 'assets/audio/sfx_hover_ui.mp3' },
        { id: 'sfx-button', src: 'assets/audio/sfx_botao.mp3' },
        { id: 'sfx-deck-select', src: 'assets/audio/sfx_selecionar_deck.mp3' },
        { id: 'sfx-coin', src: 'assets/audio/sfx_coin.mp3' },
        { id: 'sfx-win', src: 'assets/audio/sfx_vitoria.mp3' },
        { id: 'sfx-lose', src: 'assets/audio/sfx_derrota.mp3' },
        { id: 'sfx-tie', src: 'assets/audio/sfx_empate.mp3' }
    ]
};
let totalAssets = ASSETS_TO_LOAD.images.length + ASSETS_TO_LOAD.audio.length;
let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0, originalRole: 'pve' };

window.cleanupMatchState = function() {
    stopTurnTimer();
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    window.currentMatchId = null; window.myRole = null; window.pvpStartData = null;
    window.pvpSelectedCardIndex = null; window.isResolvingTurn = false; window.pvpWaitingForTurnReset = false; window.pvpLocalResolutionComplete = false; window.latestMatchData = null;
    window.isProcessing = false;
    clearHoverFocusState(true);
    clearPvPStatus();
    updatePvPReadyIndicator(false, false);
    
    // LIMPEZA DA MESA (GARANTE QUE O TEMA DO DECK SEJA REMOVIDO)
    document.body.classList.remove('theme-cavaleiro', 'theme-mago');
}

window.applyDeckTheme = function(deckType = window.currentDeck) {
    window.currentDeck = deckType || 'knight';
    document.body.classList.remove('theme-cavaleiro', 'theme-mago');
    if (window.currentDeck === 'mage') document.body.classList.add('theme-mago');
    else document.body.classList.add('theme-cavaleiro');
}

window.selectDeck = function(deckType) {
    if(audios['sfx-deck-select'] && window.sfxEnabled) { try { audios['sfx-deck-select'].currentTime = 0; audios['sfx-deck-select'].play().catch(()=>{}); } catch(e){} }
    
    // Aplica a nova mesa escolhida
    window.applyDeckTheme(deckType);
    
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

window.startLobbyModeWithDeck = function(mode, deckType) {
    if(mode !== 'pvp' && mode !== 'pve') return;
    if(mode === 'pvp' && !window.currentUser) return;
    if(audios['sfx-deck-select'] && window.sfxEnabled) {
        try {
            audios['sfx-deck-select'].currentTime = 0;
            audios['sfx-deck-select'].play().catch(()=>{});
        } catch(e) {}
    }
    window.gameMode = mode;
    window.applyDeckTheme(deckType);
    window.closeLobbyModeChooser?.();
    setTimeout(() => {
        if(mode === 'pvp') initiateMatchmaking();
        else window.transitionToGame();
    }, 260);
};

window.transitionToGame = function() {
    if (window.gameMode === 'pvp' || window.gameMode === 'pve') document.body.classList.add('force-landscape');
    updatePresence();
    const transScreen = document.getElementById('transition-overlay');
    const transText = transScreen.querySelector('.trans-text');
    if(transText) transText.innerText = "PREPARANDO BATALHA...";
    if(transScreen) transScreen.classList.add('active');
    MusicController.transitionTo?.('bgm-loop', { fadeOutMs: 780, fadeInMs: 980, restart: true });
    setTimeout(() => {
        if (window.gameMode === 'pvp' || window.gameMode === 'pve') window.applyDeckTheme(window.currentDeck);
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
    if (isFriendlyMatch() && window.currentMatchId && window.currentUser && !window.suppressFriendlyAbandon) {
        updateDoc(doc(db, "matches", window.currentMatchId), { status: 'abandoned', abandonedBy: window.currentUser.uid }).catch(() => {});
    }
    window.suppressFriendlyAbandon = false;
    window.cleanupMatchState();
    document.body.classList.remove('end-win-active', 'end-loss-active', 'end-tie-active');
    document.body.classList.remove('force-landscape');
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
    if(!window.currentUser) { 
        window.showScreen('start-screen'); 
        document.body.classList.remove('theme-cavaleiro', 'theme-mago');
        MusicController.stopCurrent();
        return; 
    }
    window.cleanupMatchState(); window.isProcessing = false;
    
    // FORCA A REMOCAO DAS MESAS DOS DECKS
    document.body.classList.remove('theme-cavaleiro', 'theme-mago');
    
    let bg = document.getElementById('game-background'); if(bg) bg.classList.add('lobby-mode');
    createLobbyFlares();

    const userRef = doc(db, "players", window.currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        const gameId = await generateUniqueGameId(window.currentUser.uid);
        await setDoc(userRef, { name: window.currentUser.displayName, gameId, score: 0, totalWins: 0, goldCoins: 0, profileLevel: 1, profileXp: 0, friends: [], inventory: [], equippedItems: {}, lastSeen: Date.now(), settings: { vol: 0.5, music: true, sfx: true, fullscreen: false } });
        window.currentPlayerGameId = gameId;
        window.currentLobbyScore = 0;
        updatePlayerInventoryState([], {});
        updateLobbyProfileProgress(1, 0);
        renderLobbyIdentity(window.currentUser.displayName, gameId);
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: 0 | PONTOS: 0`;
        updateLobbyGoldWallet(0);
        window.musicEnabled = true;
        window.sfxEnabled = true;
        let chkM = document.getElementById('check-music'); if(chkM) chkM.checked = true;
        let chkS = document.getElementById('check-sfx'); if(chkS) chkS.checked = true;
        window.updateVol('master', 0.5);
        window.applyFullscreenPreference(false);
        MusicController.play('bgm-menu');
    } else {
        const d = userSnap.data();
        const gameId = await ensurePlayerGameId(userRef, d);
        window.currentPlayerGameId = gameId;
        window.currentLobbyScore = Math.max(0, Number(d.score) || 0);
        updatePlayerInventoryState(d.inventory || [], d.equippedItems || {});
        updateLobbyProfileProgress(d.profileLevel || 1, d.profileXp || 0);
        renderLobbyIdentity(d.name || window.currentUser.displayName, gameId);
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins || 0} | PONTOS: ${d.score || 0}`;

        updateLobbyGoldWallet(d.goldCoins || 0);

        if(d.settings) {
            window.masterVol = d.settings.vol !== undefined ? d.settings.vol : 0.5;
            window.musicEnabled = d.settings.music !== undefined ? d.settings.music : true;
            window.sfxEnabled = d.settings.sfx !== undefined ? d.settings.sfx : true;
            window.fullscreenEnabled = d.settings.fullscreen === true;

            let slider = document.getElementById('vol-slider'); if(slider) slider.value = window.masterVol;
            let chkM = document.getElementById('check-music'); if(chkM) chkM.checked = window.musicEnabled;
            let chkS = document.getElementById('check-sfx'); if(chkS) chkS.checked = window.sfxEnabled;
            let chkF = document.getElementById('check-fullscreen'); if(chkF) chkF.checked = window.fullscreenEnabled;

            window.updateVol('master', window.masterVol);
            window.applyFullscreenPreference(window.fullscreenEnabled);
            if (!window.musicEnabled && MusicController.currentTrackId && audios[MusicController.currentTrackId]) {
                audios[MusicController.currentTrackId].pause();
                MusicController.currentTrackId = null;
            } else if (window.musicEnabled) {
                MusicController.play('bgm-menu');
            }
        } else {
            window.musicEnabled = true;
            window.sfxEnabled = true;
            window.fullscreenEnabled = false;
            let chkF = document.getElementById('check-fullscreen'); if(chkF) chkF.checked = false;
            let chkM = document.getElementById('check-music'); if(chkM) chkM.checked = true;
            let chkS = document.getElementById('check-sfx'); if(chkS) chkS.checked = true;
            MusicController.play('bgm-menu');
        }
    }
    startPresenceHeartbeat();
    startFriendsPanel();
    window.refreshShopInventoryState?.();
    window.renderInventoryItems?.();
    const q = query(collection(db, "players"), orderBy("score", "desc"));
    onSnapshot(q, (snapshot) => {
        let html = '<table id="ranking-table"><thead><tr><th>#</th><th>JOGADOR</th><th>PTS</th></tr></thead><tbody>';
        let pos = 1;
        let myRank = null;
        snapshot.forEach((doc) => {
            const p = doc.data();
            if(window.currentUser && doc.id === window.currentUser.uid) myRank = pos;
            if(pos <= 10) {
                let rankClass = pos === 1 ? "rank-1" : (pos === 2 ? "rank-2" : (pos === 3 ? "rank-3" : ""));
                html += `<tr class="${rankClass}"><td class="rank-pos">${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`;
            }
            pos++;
        });
        html += '</tbody></table>';
        document.getElementById('ranking-content').innerHTML = html;
        window.currentLobbyRank = myRank;
        updateLobbyBottomProfileBar();
    });
    if(document.activeElement && document.activeElement.closest && document.activeElement.closest('#end-screen')) document.activeElement.blur();
    window.showScreen('lobby-screen'); document.getElementById('end-screen').classList.remove('visible');
    document.getElementById('btn-config-toggle').style.display = 'flex';
};

function updateLobbyGoldWallet(amount = 0) {
    window.currentGoldCoins = Math.max(0, amount || 0);
    const count = document.getElementById('lobby-gold-count');
    if(count) count.innerText = window.currentGoldCoins;
    updateLobbyBottomProfileBar();
    window.syncLobbyShopGold?.();
}

const SHOP_ITEMS = {
    metallic_border: {
        id: 'metallic_border',
        name: 'BORDA - GUARDA REAL',
        slot: 'cardBorder',
        price: 600,
        cssClass: 'royal',
        asset: 'assets/img/borda_metalica_card.webp'
    },
    elven_forest_border: {
        id: 'elven_forest_border',
        name: 'BORDA - SENTINELA VERDE',
        slot: 'cardBorder',
        price: 600,
        cssClass: 'elven',
        asset: 'assets/img/borda_bosque_elfico_card.webp?v=2026.06.24.5'
    },
    mage_fire_border: {
        id: 'mage_fire_border',
        name: 'BORDA - CHAMA ARCANA',
        slot: 'cardBorder',
        price: 600,
        cssClass: 'mage',
        asset: 'assets/img/borda_chama_arcana_card.webp?v=2026.06.24.5'
    },
    rogue_gold_border: {
        id: 'rogue_gold_border',
        name: 'BORDA - MÃO DOURADA',
        slot: 'cardBorder',
        price: 600,
        cssClass: 'rogue',
        asset: 'assets/img/borda_mao_dourada_card.webp?v=2026.06.24.5'
    },
    oracle_border: {
        id: 'oracle_border',
        name: 'BORDA - VISÃO ASTRAL',
        slot: 'cardBorder',
        price: 600,
        cssClass: 'oracle',
        asset: 'assets/img/borda_visao_astral_card.webp?v=2026.06.24.5'
    }
};
window.SHOP_ITEMS = SHOP_ITEMS;

const BORDER_REWARD_RULES = {
    metallic_border: {
        blockEffective: 2,
        mastery: { BLOQUEIO: 1 }
    },
    mage_fire_border: {
        attackEffective: 1,
        mastery: { ATAQUE: 1 }
    },
    elven_forest_border: {
        play: { DESCANSAR: 3 },
        mastery: { DESCANSAR: 5 }
    },
    rogue_gold_border: {
        play: { DESARMAR: 4 },
        mastery: { DESARMAR: 7 }
    },
    oracle_border: {
        play: { TREINAR: 1 },
        levelUp: 1,
        mastery: { TREINAR: 5 }
    }
};

const DECK_REWARD_RULES = {
    knight: {
        play: { BLOQUEIO: 2 },
        mastery: { BLOQUEIO: 1 }
    }
};

function updatePlayerInventoryState(inventory = [], equippedItems = {}) {
    window.playerInventory = Array.isArray(inventory) ? [...new Set(inventory)] : [];
    window.equippedItems = equippedItems && typeof equippedItems === 'object' ? { ...equippedItems } : {};
    const equippedBorder = SHOP_ITEMS[window.equippedItems.cardBorder];
    document.body.classList.remove('player-card-border-royal', 'player-card-border-elven', 'player-card-border-mage', 'player-card-border-rogue', 'player-card-border-oracle');
    document.body.style.removeProperty('--player-card-border-url');
    if(equippedBorder?.cssClass) document.body.classList.add(`player-card-border-${equippedBorder.cssClass}`);
    window.refreshShopInventoryState?.();
    window.renderInventoryItems?.();
}

window.isPlayerCardSkinEquipped = function(itemId) {
    return !!itemId && window.equippedItems?.cardBorder === itemId;
};

window.getEquippedCardBorderItem = function() {
    return SHOP_ITEMS[window.equippedItems?.cardBorder] || null;
};

window.openPurchaseConfirm = function(itemName, onConfirm) {
    let overlay = document.getElementById('purchase-confirm-overlay');
    if(!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'purchase-confirm-overlay';
        overlay.className = 'purchase-confirm-overlay';
        overlay.innerHTML = `
            <div class="purchase-confirm-box" role="dialog" aria-modal="true" aria-label="Confirmar compra">
                <div class="purchase-confirm-question"></div>
                <div class="purchase-confirm-actions">
                    <button class="purchase-confirm-choice" type="button" data-purchase-choice="SIM">SIM</button>
                    <button class="purchase-confirm-choice" type="button" data-purchase-choice="NÃO">NÃO</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (event) => {
            if(event.target === overlay) overlay.classList.remove('visible');
        });
        overlay.querySelectorAll('[data-purchase-choice]').forEach((button) => {
            button.addEventListener('click', () => {
                const choice = button.dataset.purchaseChoice;
                overlay.classList.remove('visible');
                if(choice === 'SIM' && typeof overlay.confirmHandler === 'function') overlay.confirmHandler();
            });
        });
    }
    const question = overlay.querySelector('.purchase-confirm-question');
    if(question) question.textContent = `COMPRAR ${itemName}?`;
    overlay.confirmHandler = onConfirm;
    overlay.classList.add('visible');
};

window.confirmShopPurchase = function(itemId) {
    const item = SHOP_ITEMS[itemId];
    if(!item) return;
    if(window.playerInventory?.includes(itemId)) {
        window.openInventory?.();
        return;
    }
    window.openPurchaseConfirm(item.name, () => window.purchaseShopItem(itemId));
};

window.purchaseShopItem = async function(itemId) {
    const item = SHOP_ITEMS[itemId];
    if(!item || !window.currentUser) return;
    const price = Math.max(0, item.price || 0);
    if((window.currentGoldCoins || 0) < price) {
        window.openModal('OURO INSUFICIENTE', `VOCÊ PRECISA DE ${price} OURO.`, ['OK']);
        return;
    }
    const nextInventory = [...new Set([...(window.playerInventory || []), itemId])];
    const nextGold = Math.max(0, (window.currentGoldCoins || 0) - price);
    try {
        const userRef = doc(db, "players", window.currentUser.uid);
        await updateDoc(userRef, { goldCoins: nextGold, inventory: nextInventory, equippedItems: window.equippedItems || {} });
        updateLobbyGoldWallet(nextGold);
        updatePlayerInventoryState(nextInventory, window.equippedItems || {});
        window.syncLobbyShopGold?.();
        window.refreshShopInventoryState?.();
    } catch(e) {
        console.error("Erro ao comprar item:", e);
    }
};

window.toggleInventoryEquip = async function(itemId) {
    const item = SHOP_ITEMS[itemId];
    if(!item || !window.currentUser || !window.playerInventory?.includes(itemId)) return;
    const nextEquipped = { ...(window.equippedItems || {}) };
    if(nextEquipped[item.slot] === itemId) delete nextEquipped[item.slot];
    else nextEquipped[item.slot] = itemId;
    try {
        const userRef = doc(db, "players", window.currentUser.uid);
        await updateDoc(userRef, { equippedItems: nextEquipped });
        updatePlayerInventoryState(window.playerInventory || [], nextEquipped);
        updateUI();
    } catch(e) {
        console.error("Erro ao equipar item:", e);
    }
};

window.getShopItemState = function(itemId) {
    const owned = window.playerInventory?.includes(itemId) === true;
    const equipped = window.isPlayerCardSkinEquipped?.(itemId) === true;
    return { owned, equipped };
};

function updateLobbyProfileProgress(level = 1, xp = 0) {
    window.currentProfileLevel = Math.max(1, Number(level) || 1);
    window.currentProfileXp = Math.max(0, Math.min(99, Number(xp) || 0));
}

function updateLobbyBottomProfileBar() {
    const nameEl = document.getElementById('profile-asset-name');
    const ranking = document.getElementById('profile-asset-ranking');
    const gold = document.getElementById('profile-asset-gold-count');
    const name = getPlayerFirstName(window.currentLobbyPlayerName || (window.currentUser && window.currentUser.displayName) || 'JOGADOR');
    const gameId = window.currentPlayerGameId || '----';
    const score = Math.max(0, Number(window.currentLobbyScore) || 0);
    const elo = getLobbyElo(score);
    if(nameEl) nameEl.innerHTML = `${name} <span class="profile-asset-id-inline" id="profile-asset-id">#${gameId}</span>`;
    if(ranking) {
        ranking.textContent = `${elo.label} #${score}`;
        ranking.className = `profile-asset-ranking elo-${elo.key}`;
    }
    if(gold) gold.textContent = window.currentGoldCoins || 0;
}

window.updateLobbyBottomProfileBar = updateLobbyBottomProfileBar;

function getLobbyElo(score = 0) {
    if(score > 700) return { key: 'diamante', label: 'DIAMANTE' };
    if(score >= 401) return { key: 'ouro', label: 'OURO' };
    if(score >= 201) return { key: 'prata', label: 'PRATA' };
    if(score >= 101) return { key: 'bronze', label: 'BRONZE' };
    return { key: 'madeira', label: 'MADEIRA' };
}

function renderTurnDisplay() {
    const turnEl = document.getElementById('turn-txt');
    if(!turnEl) return;
    const time = Number.isFinite(window.turnTimeLeft) ? window.turnTimeLeft : 10;
    turnEl.innerHTML = `<span class="turn-label">TURNO ${turnCount}</span>`;
    const shouldShowTimer = window.gameMode === 'pvp' && window.currentMatchId && window.myRole && !document.getElementById('end-screen')?.classList.contains('visible');
    if(!shouldShowTimer) {
        const existingTimer = document.getElementById('turn-timer');
        if(existingTimer) existingTimer.remove();
        return;
    }
    let timerEl = document.getElementById('turn-timer');
    if(!timerEl) {
        timerEl = document.createElement('div');
        timerEl.id = 'turn-timer';
        document.body.appendChild(timerEl);
    }
    timerEl.className = `turn-timer ${time <= 5 ? 'danger' : ''}`;
    timerEl.textContent = time;
}

function playTurnTimerTick() {
    if(!window.sfxEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if(!AudioCtx) return;
        if(!window.turnTimerAudioCtx) window.turnTimerAudioCtx = new AudioCtx();
        const ctx = window.turnTimerAudioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 760;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.105);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    } catch(e) {}
}

function stopTurnTimer(removeVisual = true) {
    if(window.turnTimerInterval) {
        clearInterval(window.turnTimerInterval);
        window.turnTimerInterval = null;
    }
    window.turnTimerActive = false;
    if(removeVisual) {
        const timerEl = document.getElementById('turn-timer');
        if(timerEl) timerEl.remove();
    }
}

function startTurnTimer() {
    stopTurnTimer();
    if(window.gameMode !== 'pvp' || !window.currentMatchId || !window.myRole) return;
    if(document.getElementById('end-screen')?.classList.contains('visible')) return;
    if(!player || !Array.isArray(player.hand) || player.hand.length === 0) return;
    window.turnTimeLeft = 10;
    window.turnTimerLastBeep = 0;
    window.turnTimerActive = true;
    renderTurnDisplay();
    window.turnTimerInterval = setInterval(() => {
        if(window.gameMode !== 'pvp' || !window.currentMatchId || !window.myRole || document.getElementById('end-screen')?.classList.contains('visible')) {
            stopTurnTimer();
            return;
        }
        window.turnTimeLeft = Math.max(0, (window.turnTimeLeft || 0) - 1);
        if(window.turnTimeLeft <= 5 && window.turnTimeLeft > 0 && window.turnTimerLastBeep !== window.turnTimeLeft) {
            window.turnTimerLastBeep = window.turnTimeLeft;
            playTurnTimerTick();
        }
        renderTurnDisplay();
        if(window.turnTimeLeft <= 0) {
            if(window.pvpSelectedCardIndex === null && !window.isResolvingTurn && !window.pvpWaitingForTurnReset) {
                handleTurnTimeout();
            }
            stopTurnTimer(false);
            renderTurnDisplay();
        }
    }, 1000);
}

function getAutoPlayableCardIndex() {
    if(!player || !Array.isArray(player.hand) || player.hand.length === 0) return -1;
    const available = player.hand.findIndex(card => card !== player.disabled);
    return available >= 0 ? available : 0;
}

function handleTurnTimeout() {
    if(window.gameMode !== 'pvp' || !window.currentMatchId || !window.myRole) return;
    if(window.isResolvingTurn || window.pvpWaitingForTurnReset || window.pvpSelectedCardIndex !== null) return;
    const index = getAutoPlayableCardIndex();
    if(index < 0) return;
    const cardKey = player.hand[index];
    showCombatCue("TEMPO ESGOTADO", "red", 760);
    playSound('sfx-play');
    if(window.gameMode === 'pvp') lockInPvPMove(index, cardKey === 'DESARMAR' ? 'ATAQUE' : null);
    else playCardFlow(index, cardKey === 'DESARMAR' ? 'ATAQUE' : null);
}

function getPlayerFirstName(name = "JOGADOR") {
    return String(name || "JOGADOR").split(' ')[0].toUpperCase();
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function renderLobbyIdentity(name, gameId) {
    const el = document.getElementById('lobby-username');
    const safeName = escapeHTML(getPlayerFirstName(name));
    const safeId = escapeHTML(gameId || "----");
    window.currentLobbyPlayerName = name || (window.currentUser && window.currentUser.displayName) || 'JOGADOR';
    setTimeout(() => renderLobbyAvatar(name), 0);
    updateLobbyBottomProfileBar();
    if(!el) return;
    el.innerHTML = `OL\u00c1, ${safeName} <span class="player-game-id">#${safeId}</span>`;
}

function renderLobbyAvatar(name) {
    const avatar = document.getElementById('lobby-avatar');
    const photoURL = window.currentUser && window.currentUser.photoURL ? window.currentUser.photoURL : '';
    const initial = getPlayerFirstName(name || (window.currentUser && window.currentUser.displayName) || 'JOGADOR').charAt(0) || 'B';
    if(avatar) {
        avatar.textContent = photoURL ? '' : initial;
        if(photoURL) {
            avatar.style.setProperty('background-image', `url("${photoURL}")`, 'important');
            avatar.classList.add('has-photo');
        } else {
            avatar.style.removeProperty('background-image');
            avatar.classList.remove('has-photo');
        }
    }
    const profileAvatar = document.getElementById('profile-asset-avatar');
    if(profileAvatar) {
        profileAvatar.textContent = photoURL ? '' : initial;
        if(photoURL) {
            profileAvatar.style.setProperty('background-image', `url("${photoURL}")`, 'important');
            profileAvatar.classList.add('has-photo');
        } else {
            profileAvatar.style.removeProperty('background-image');
            profileAvatar.classList.remove('has-photo');
        }
    }
}

function isFriendOnline(lastSeen) {
    return Number.isFinite(lastSeen) && (Date.now() - lastSeen) < 90000;
}

function getPresenceState(friend) {
    const lastSeen = Number(friend.lastSeen || 0);
    const age = Date.now() - lastSeen;
    if(!Number.isFinite(lastSeen) || lastSeen <= 0 || age > 300000) return { status: 'offline', label: 'OFFLINE', clickable: false };
    if(age > 90000) return { status: 'away', label: 'AUSENTE', clickable: false };
    if(friend.activityStatus === 'in_match') return { status: 'busy', label: 'EM PARTIDA', clickable: false };
    if(friend.activityStatus === 'queue') return { status: 'busy', label: 'OCUPADO', clickable: false };
    return { status: 'online', label: 'ONLINE', clickable: true };
}

function renderFriendsList(friends = [], requests = []) {
    const list = document.getElementById('friends-list');
    if(!list) return;
    if(friends.length === 0 && requests.length === 0) {
        list.innerHTML = '<div class="friends-empty">Nenhum amigo ainda</div>';
        return;
    }
    const requestsHtml = requests.length ? `<div class="friend-section-title">SOLICITACOES</div>${requests.map(req => {
        const safeName = escapeHTML(getPlayerFirstName(req.fromName));
        const safeId = escapeHTML(req.fromGameId || '----');
        return `<div class="friend-request-row">
            <div class="friend-request-name">${safeName} <span class="friend-meta">#${safeId}</span></div>
            <div class="friend-request-actions">
                <button class="accept" onclick="window.acceptFriendRequest('${escapeHTML(req.id)}')">ACEITAR</button>
                <button class="decline" onclick="window.declineFriendRequest('${escapeHTML(req.id)}')">RECUSAR</button>
            </div>
        </div>`;
    }).join('')}` : '';
    const friendsHtml = friends.length ? `<div class="friend-section-title">AMIGOS</div>${friends.map(friend => {
        const presence = getPresenceState(friend);
        const safeName = escapeHTML(getPlayerFirstName(friend.name));
        const safeId = escapeHTML(friend.gameId || '----');
        return `<div class="friend-row ${presence.clickable ? 'online' : ''}" data-friend-uid="${escapeHTML(friend.uid)}" data-friend-name="${safeName}" data-can-invite="${presence.clickable ? '1' : '0'}">
            <span class="friend-status-dot ${presence.status}"></span>
            <div class="friend-main">
                <div class="friend-name">${safeName}</div>
                <div class="friend-meta">#${safeId} - ${presence.label}</div>
            </div>
        </div>`;
    }).join('')}` : '';
    list.innerHTML = requestsHtml + friendsHtml;
    list.querySelectorAll('.friend-row').forEach(row => {
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            showFriendActionPopover(row);
        });
    });
}

async function refreshFriendsList() {
    if(!window.currentUser) return;
    const list = document.getElementById('friends-list');
    if(list) list.innerHTML = '<div class="friends-empty">Carregando amigos...</div>';
    try {
        const userRef = doc(db, "players", window.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if(!userSnap.exists()) { renderFriendsList([]); return; }
        const friendIds = Array.isArray(userSnap.data().friends) ? userSnap.data().friends : [];
        const uniqueIds = [...new Set(friendIds)].filter(uid => uid && uid !== window.currentUser.uid);
        if(uniqueIds.length !== friendIds.length) await updateDoc(userRef, { friends: uniqueIds });
        const friends = await Promise.all(uniqueIds.map(async uid => {
            const snap = await getDoc(doc(db, "players", uid));
            if(!snap.exists()) return null;
            return { uid, ...snap.data() };
        }));
        const reqQuery = query(collection(db, "friendRequests"), where("toUid", "==", window.currentUser.uid), where("status", "==", "pending"));
        const reqSnap = await getDocs(reqQuery);
        const requests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(req => req.fromUid !== window.currentUser.uid);
        const presenceRank = { online: 0, busy: 1, away: 2, offline: 3 };
        renderFriendsList(
            friends.filter(Boolean).sort((a, b) => (presenceRank[getPresenceState(a).status] - presenceRank[getPresenceState(b).status]) || getPlayerFirstName(a.name).localeCompare(getPlayerFirstName(b.name))),
            requests
        );
    } catch(e) {
        if(list) list.innerHTML = '<div class="friends-empty">Erro ao carregar amigos</div>';
    }
}

function startFriendsPanel() {
    refreshFriendsList();
    listenForFriendInvites();
    if(window.friendsRefreshInterval) clearInterval(window.friendsRefreshInterval);
    window.friendsRefreshInterval = setInterval(refreshFriendsList, 12000);
}

function startPresenceHeartbeat() {
    updatePresence();
    if(window.presenceInterval) clearInterval(window.presenceInterval);
    window.presenceInterval = setInterval(updatePresence, 10000);
}

async function updatePresence() {
    if(!window.currentUser) return;
    try {
        const gameActive = document.getElementById('game-screen') && document.getElementById('game-screen').classList.contains('active') && !document.getElementById('end-screen').classList.contains('visible');
        const queueActive = document.getElementById('matchmaking-screen') && document.getElementById('matchmaking-screen').style.display === 'flex';
        const deckActive = document.getElementById('deck-selection-screen') && document.getElementById('deck-selection-screen').classList.contains('active');
        const activityStatus = gameActive ? 'in_match' : ((queueActive || deckActive) ? 'queue' : 'online');
        await setDoc(doc(db, "players", window.currentUser.uid), { lastSeen: Date.now(), activityStatus }, { merge: true });
    } catch(e) {}
}
window.updatePresence = updatePresence;

function setFriendAddStatus(message, type = '') {
    const status = document.getElementById('friend-add-status');
    if(!status) return;
    status.className = `friend-add-status ${type}`.trim();
    status.innerText = message || '';
}

function hideFriendActionPopover() {
    const popover = document.getElementById('friend-action-popover');
    if(popover) popover.style.display = 'none';
    window.selectedFriendUid = null;
}

function showFriendActionPopover(row) {
    const popover = document.getElementById('friend-action-popover');
    if(!popover) return;
    window.selectedFriendUid = row.dataset.friendUid;
    const inviteButton = document.getElementById('friend-invite-action');
    if(inviteButton) inviteButton.disabled = row.dataset.canInvite !== '1';
    const rect = row.getBoundingClientRect();
    popover.style.left = Math.max(8, rect.left - 8) + 'px';
    popover.style.top = (rect.bottom + 8) + 'px';
    popover.style.display = 'block';
}

document.addEventListener('click', (e) => {
    const popover = document.getElementById('friend-action-popover');
    if(popover && popover.style.display === 'block' && !popover.contains(e.target) && !e.target.closest('.friend-row')) {
        hideFriendActionPopover();
    }
});

window.inviteSelectedFriend = async function() {
    if(!window.currentUser || !window.selectedFriendUid) return;
    const toUid = window.selectedFriendUid;
    hideFriendActionPopover();
    try {
        const inviteRef = doc(collection(db, "friendInvites"));
        await setDoc(inviteRef, {
            fromUid: window.currentUser.uid,
            fromName: getPlayerFirstName(window.currentUser.displayName),
            fromGameId: window.currentPlayerGameId || null,
            fromDeckType: window.currentDeck || 'knight',
            fromEquippedItems: { ...(window.equippedItems || {}) },
            toUid,
            status: 'pending',
            createdAt: Date.now()
        });
        showPvPStatus("CONVITE ENVIADO");
        setTimeout(clearPvPStatus, 1400);
        if(window.outgoingInviteUnsubscribe) window.outgoingInviteUnsubscribe();
        window.outgoingInviteUnsubscribe = onSnapshot(inviteRef, (snap) => {
            if(!snap.exists()) return;
            const data = snap.data();
            if(data.status === 'accepted' && data.matchId) enterFriendlyMatch(data.matchId);
            if(data.status === 'declined') {
                clearPvPStatus();
                showCenterText("CONVITE RECUSADO", "#ff7675");
                if(window.outgoingInviteUnsubscribe) window.outgoingInviteUnsubscribe();
            }
        });
    } catch(e) {
        showCenterText("ERRO AO CONVIDAR", "#ff7675");
    }
};

window.removeSelectedFriend = async function() {
    if(!window.currentUser || !window.selectedFriendUid) return;
    const friendUid = window.selectedFriendUid;
    hideFriendActionPopover();
    try {
        const myRef = doc(db, "players", window.currentUser.uid);
        const friendRef = doc(db, "players", friendUid);
        const mySnap = await getDoc(myRef);
        const friendSnap = await getDoc(friendRef);
        const myFriends = mySnap.exists() && Array.isArray(mySnap.data().friends) ? mySnap.data().friends : [];
        const friendFriends = friendSnap.exists() && Array.isArray(friendSnap.data().friends) ? friendSnap.data().friends : [];
        await updateDoc(myRef, { friends: myFriends.filter(uid => uid !== friendUid) });
        if(friendSnap.exists()) await updateDoc(friendRef, { friends: friendFriends.filter(uid => uid !== window.currentUser.uid) });
        showCenterText("AMIZADE DESFEITA", "#ffd700");
        refreshFriendsList();
    } catch(e) {
        showCenterText("ERRO AO REMOVER", "#ff7675");
    }
};

function listenForFriendInvites() {
    if(!window.currentUser || window.friendInviteUnsubscribe) return;
    const q = query(collection(db, "friendInvites"), where("toUid", "==", window.currentUser.uid), where("status", "==", "pending"));
    window.friendInviteUnsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if(change.type !== 'added') return;
            const data = change.doc.data();
            if(Date.now() - (data.createdAt || 0) > 120000) return;
            window.pendingFriendInvite = { id: change.doc.id, ...data };
            const text = document.getElementById('friend-invite-text');
            if(text) text.innerText = `${data.fromName || 'Jogador'} esta te convidando para uma partida.`;
            const screen = document.getElementById('friend-invite-screen');
            if(screen) screen.style.display = 'flex';
            playSound('sfx-nav');
        });
    });
}

async function createFriendlyMatch(invite) {
    const matchId = "friend_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const p1DeckCards = generateShuffledDeck();
    const p2DeckCards = generateShuffledDeck();
    const p1Hand = [];
    const p2Hand = [];
    for(let i = 0; i < 6; i++) {
        if(p1DeckCards.length > 0) p1Hand.push(p1DeckCards.pop());
        if(p2DeckCards.length > 0) p2Hand.push(p2DeckCards.pop());
    }
    p1Hand.sort();
    p2Hand.sort();
    await setDoc(doc(db, "matches", matchId), {
        friendly: true,
        rematchRound: 0,
        player1Rematch: false,
        player2Rematch: false,
        player1: { uid: invite.fromUid, name: invite.fromName || "JOGADOR 1", gameId: invite.fromGameId || null, deckType: invite.fromDeckType || 'knight', equippedItems: { ...(invite.fromEquippedItems || {}) }, hp: 6, status: 'selecting', hand: p1Hand, deck: p1DeckCards, xp: [] },
        player2: { uid: window.currentUser.uid, name: getPlayerFirstName(window.currentUser.displayName), gameId: window.currentPlayerGameId || null, deckType: window.currentDeck || 'knight', equippedItems: { ...(window.equippedItems || {}) }, hp: 6, status: 'selecting', hand: p2Hand, deck: p2DeckCards, xp: [] },
        turn: 1,
        status: 'playing',
        createdAt: Date.now()
    });
    return matchId;
}

async function enterFriendlyMatch(matchId) {
    const snap = await getDoc(doc(db, "matches", matchId));
    if(!snap.exists()) return;
    const data = snap.data();
    window.gameMode = 'pvp';
    window.currentMatchId = matchId;
    window.pvpStartData = data;
    window.friendlyRematchRound = data.rematchRound || 0;
    window.myRole = data.player1.uid === window.currentUser.uid ? 'player1' : 'player2';
    const myDeckType = window.myRole === 'player1' ? data.player1.deckType : data.player2.deckType;
    window.applyDeckTheme(myDeckType);
    const inviteScreen = document.getElementById('friend-invite-screen');
    if(inviteScreen) inviteScreen.style.display = 'none';
    if(window.outgoingInviteUnsubscribe) window.outgoingInviteUnsubscribe();
    window.transitionToGame();
}

window.acceptFriendInvite = async function() {
    if(!window.pendingFriendInvite) return;
    const invite = window.pendingFriendInvite;
    try {
        const matchId = await createFriendlyMatch(invite);
        await updateDoc(doc(db, "friendInvites", invite.id), { status: 'accepted', matchId, acceptedAt: Date.now(), toDeckType: window.currentDeck || 'knight', toEquippedItems: { ...(window.equippedItems || {}) } });
        window.pendingFriendInvite = null;
        enterFriendlyMatch(matchId);
    } catch(e) {
        showCenterText("ERRO AO ACEITAR", "#ff7675");
    }
};

window.declineFriendInvite = async function() {
    if(!window.pendingFriendInvite) return;
    try {
        await updateDoc(doc(db, "friendInvites", window.pendingFriendInvite.id), { status: 'declined', declinedAt: Date.now() });
    } catch(e) {}
    window.pendingFriendInvite = null;
    const screen = document.getElementById('friend-invite-screen');
    if(screen) screen.style.display = 'none';
};

window.openAddFriendModal = function() {
    window.playNavSound();
    const screen = document.getElementById('add-friend-screen');
    const input = document.getElementById('friend-id-input');
    if(input) input.value = '';
    setFriendAddStatus('');
    if(screen) screen.style.display = 'flex';
    setTimeout(() => { if(input) input.focus(); }, 80);
};

window.closeAddFriendModal = function() {
    window.playNavSound();
    const screen = document.getElementById('add-friend-screen');
    if(screen) screen.style.display = 'none';
};

window.addFriendByGameId = async function() {
    if(!window.currentUser) return;
    const input = document.getElementById('friend-id-input');
    const rawId = input ? input.value : '';
    const gameId = rawId.replace('#', '').trim().toUpperCase();
    if(!gameId) { setFriendAddStatus('Digite um ID valido.', 'error'); return; }
    setFriendAddStatus('Procurando jogador...');
    try {
        const idSnap = await getDoc(doc(db, "playerIds", gameId));
        if(!idSnap.exists()) { setFriendAddStatus('Jogador nao encontrado.', 'error'); return; }
        const friendUid = idSnap.data().uid;
        if(!friendUid || friendUid === window.currentUser.uid) { setFriendAddStatus('Esse ID pertence a voce.', 'error'); return; }
        const friendSnap = await getDoc(doc(db, "players", friendUid));
        if(!friendSnap.exists()) { setFriendAddStatus('Jogador nao encontrado.', 'error'); return; }
        const userRef = doc(db, "players", window.currentUser.uid);
        const userSnap = await getDoc(userRef);
        const currentFriends = userSnap.exists() && Array.isArray(userSnap.data().friends) ? userSnap.data().friends : [];
        if(currentFriends.includes(friendUid)) { setFriendAddStatus('Esse jogador ja esta na sua lista.', 'error'); return; }
        const outgoing = await getDocs(query(collection(db, "friendRequests"), where("fromUid", "==", window.currentUser.uid), where("toUid", "==", friendUid), where("status", "==", "pending")));
        const incoming = await getDocs(query(collection(db, "friendRequests"), where("fromUid", "==", friendUid), where("toUid", "==", window.currentUser.uid), where("status", "==", "pending")));
        if(!outgoing.empty) { setFriendAddStatus('Solicitacao ja enviada.', 'error'); return; }
        if(!incoming.empty) { setFriendAddStatus('Esse jogador ja te enviou uma solicitacao.', 'error'); return; }
        await setDoc(doc(collection(db, "friendRequests")), {
            fromUid: window.currentUser.uid,
            fromName: getPlayerFirstName(window.currentUser.displayName),
            fromGameId: window.currentPlayerGameId || null,
            toUid: friendUid,
            toName: getPlayerFirstName(friendSnap.data().name),
            toGameId: friendSnap.data().gameId || null,
            status: 'pending',
            createdAt: Date.now()
        });
        setFriendAddStatus('Solicitacao enviada!', 'success');
        setTimeout(() => window.closeAddFriendModal(), 700);
    } catch(e) {
        setFriendAddStatus('Nao foi possivel adicionar agora.', 'error');
    }
};

window.acceptFriendRequest = async function(requestId) {
    if(!window.currentUser || !requestId) return;
    try {
        const reqRef = doc(db, "friendRequests", requestId);
        const reqSnap = await getDoc(reqRef);
        if(!reqSnap.exists()) return;
        const req = reqSnap.data();
        if(req.toUid !== window.currentUser.uid || req.status !== 'pending') return;
        const myRef = doc(db, "players", window.currentUser.uid);
        const otherRef = doc(db, "players", req.fromUid);
        const mySnap = await getDoc(myRef);
        const otherSnap = await getDoc(otherRef);
        const myFriends = mySnap.exists() && Array.isArray(mySnap.data().friends) ? mySnap.data().friends : [];
        const otherFriends = otherSnap.exists() && Array.isArray(otherSnap.data().friends) ? otherSnap.data().friends : [];
        await updateDoc(myRef, { friends: [...new Set([...myFriends, req.fromUid])] });
        await updateDoc(otherRef, { friends: [...new Set([...otherFriends, window.currentUser.uid])] });
        await updateDoc(reqRef, { status: 'accepted', acceptedAt: Date.now() });
        refreshFriendsList();
    } catch(e) {}
};

window.declineFriendRequest = async function(requestId) {
    if(!window.currentUser || !requestId) return;
    try {
        const reqRef = doc(db, "friendRequests", requestId);
        const reqSnap = await getDoc(reqRef);
        if(reqSnap.exists() && reqSnap.data().toUid === window.currentUser.uid) {
            await updateDoc(reqRef, { status: 'declined', declinedAt: Date.now() });
        }
        refreshFriendsList();
    } catch(e) {}
};

function buildGameIdCandidate(uid, attempt = 0) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let hash = 2166136261;
    const input = `${uid}:${attempt}`;
    for(let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619) >>> 0;
    }
    let id = "";
    for(let i = 0; i < 4; i++) {
        hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
        id += alphabet[hash % alphabet.length];
    }
    return id;
}

async function generateUniqueGameId(uid) {
    for(let attempt = 0; attempt < 120; attempt++) {
        const candidate = buildGameIdCandidate(uid, attempt);
        const idRef = doc(db, "playerIds", candidate);
        const idSnap = await getDoc(idRef);
        if(!idSnap.exists() || idSnap.data().uid === uid) {
            await setDoc(idRef, { uid, updatedAt: Date.now() }, { merge: true });
            return candidate;
        }
    }
    return buildGameIdCandidate(uid, Date.now());
}

async function ensurePlayerGameId(userRef, playerData) {
    if(playerData && playerData.gameId) {
        try {
            await setDoc(doc(db, "playerIds", playerData.gameId), { uid: window.currentUser.uid, updatedAt: Date.now() }, { merge: true });
        } catch(e) {}
        return playerData.gameId;
    }
    const gameId = await generateUniqueGameId(window.currentUser.uid);
    await updateDoc(userRef, { gameId });
    return gameId;
}

function startGameFlow() {
    stopTurnTimer();
    document.body.classList.remove('end-win-active', 'end-loss-active', 'end-tie-active');
    document.getElementById('end-screen').classList.remove('visible');
    window.isProcessing = false; window.isResolvingTurn = false; window.pvpSelectedCardIndex = null;
    window.pvpWaitingForTurnReset = false; window.pvpLocalResolutionComplete = false;
    startCinematicLoop(); window.isMatchStarting = true;
    const handEl = document.getElementById('player-hand'); if (handEl) { handEl.innerHTML = ''; handEl.classList.add('preparing'); }
    if (window.gameMode === 'pvp' && window.pvpStartData) {
        if (window.myRole === 'player1') {
            window.applyDeckTheme(window.pvpStartData.player1.deckType);
            resetUnit(player, window.pvpStartData.player1.deck, 'player1'); resetUnit(monster, window.pvpStartData.player2.deck, 'player2');
            player.deckType = window.pvpStartData.player1.deckType || 'knight';
            monster.deckType = window.pvpStartData.player2.deckType || 'knight';
            player.equippedItems = { ...(window.pvpStartData.player1.equippedItems || window.equippedItems || {}) };
            monster.equippedItems = { ...(window.pvpStartData.player2.equippedItems || {}) };
            hydrateInitialPvPHand(player, window.pvpStartData.player1);
            hydrateInitialPvPHand(monster, window.pvpStartData.player2);
        } else {
            window.applyDeckTheme(window.pvpStartData.player2.deckType);
            resetUnit(player, window.pvpStartData.player2.deck, 'player2'); resetUnit(monster, window.pvpStartData.player1.deck, 'player1');
            player.deckType = window.pvpStartData.player2.deckType || 'knight';
            monster.deckType = window.pvpStartData.player1.deckType || 'knight';
            player.equippedItems = { ...(window.pvpStartData.player2.equippedItems || window.equippedItems || {}) };
            monster.equippedItems = { ...(window.pvpStartData.player1.equippedItems || {}) };
            hydrateInitialPvPHand(player, window.pvpStartData.player2);
            hydrateInitialPvPHand(monster, window.pvpStartData.player1);
        }
    } else {
        window.applyDeckTheme(window.currentDeck);
        resetUnit(player, null, 'pve'); resetUnit(monster, null, 'pve');
        player.deckType = window.currentDeck || 'knight';
        monster.deckType = 'knight';
        player.equippedItems = { ...(window.equippedItems || {}) };
        monster.equippedItems = {};
        baseDraw(monster, 6); baseDraw(player, 6);
    }
    turnCount = 1; playerHistory = [];
    resetMatchRewardGold();
    updateUI(); dealAllInitialCards();
    if(window.gameMode === 'pvp') startPvPListener();
    updatePresence();
}

function hydrateInitialPvPHand(unit, serverData) {
    if(serverData && Array.isArray(serverData.hand) && serverData.hand.length > 0) {
        unit.hand = [...serverData.hand];
        unit.hand.sort();
    } else {
        baseDraw(unit, 6);
    }
}

function startPvPListener() {
    if(!window.currentMatchId) return;
    if (window.pvpUnsubscribe) { window.pvpUnsubscribe(); window.pvpUnsubscribe = null; }
    const matchRef = doc(db, "matches", window.currentMatchId);
    let namesUpdated = false;
    const ensureMyRole = (data) => {
        if (data.player1 && data.player1.uid === window.currentUser.uid) window.myRole = 'player1';
        else if (data.player2 && data.player2.uid === window.currentUser.uid) window.myRole = 'player2';
    };

    window.pvpUnsubscribe = onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();
        window.latestMatchData = matchData;
        if (matchData.player1.uid !== window.currentUser.uid && matchData.player2.uid !== window.currentUser.uid) return;
        ensureMyRole(matchData);

        if (matchData.status === 'abandoned') {
            if (matchData.friendly) {
                if (matchData.abandonedBy && window.currentUser && matchData.abandonedBy !== window.currentUser.uid) {
                    showCenterText("JOGADOR SAIU", "#ffd700");
                    window.suppressFriendlyAbandon = true;
                    setTimeout(() => window.transitionToLobby(true), 700);
                }
                return;
            }
            if (matchData.abandonedBy && window.currentUser && matchData.abandonedBy !== window.currentUser.uid) {
                monster.hp = 0; updateUI(); window.isProcessing = true; MusicController.stopCurrent();
                setTimeout(() => {
                    const title = document.getElementById('end-title'); title.innerText = "VITÓRIA"; title.className = "win-theme";
                    showCenterText("OPONENTE DESISTIU!", "#ffd700"); playSound('sfx-win');
                    triggerEndScreenFx('win'); showEndPoints(8);
                    if(window.registrarVitoriaOnline) window.registrarVitoriaOnline('pvp');
                    document.getElementById('end-screen').classList.add('visible'); window.cleanupMatchState();
                }, 500);
            }
            return;
        }

        if (matchData.friendly && matchData.status === 'playing' && (matchData.rematchRound || 0) > window.friendlyRematchRound) {
            window.friendlyRematchRound = matchData.rematchRound || 0;
            window.pvpStartData = matchData;
            clearPvPStatus();
            const endScreen = document.getElementById('end-screen');
            if(endScreen) endScreen.classList.remove('visible');
            const pts = document.getElementById('end-points');
            if(pts) pts.remove();
            const gold = document.getElementById('end-gold-reward');
            if(gold) gold.remove();
            window.transitionToGame();
            return;
        }

        if (matchData.friendly && matchData.status === 'finished') {
            const myRematch = window.myRole === 'player1' ? matchData.player1Rematch : matchData.player2Rematch;
            const otherRematch = window.myRole === 'player1' ? matchData.player2Rematch : matchData.player1Rematch;
            if(matchData.player1Rematch && matchData.player2Rematch && window.myRole === 'player1') {
                resetFriendlyMatchForRematch(matchData).catch(() => {});
                return;
            }
            if(myRematch && !otherRematch) showPvPStatus("AGUARDANDO JOGADOR");
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
            updatePvPReadyIndicator(true, true);
            if (!window.isResolvingTurn) {
                clearPvPStatus();
                resolvePvPTurn(matchData);
            }
        } else {
            const myReady = window.myRole === 'player1' ? p1Ready : p2Ready;
            const opponentReady = window.myRole === 'player1' ? p2Ready : p1Ready;
            updatePvPReadyIndicator(myReady, opponentReady);
            const didFinishTurnReset = finishPvPTurnResetIfReady(matchData);
            if (!didFinishTurnReset) {
                if (myReady && !opponentReady) showPvPStatus("AGUARDANDO OPONENTE...");
                else if (!myReady && opponentReady) showPvPStatus("OPONENTE PRONTO");
                else if (!window.pvpWaitingForTurnReset) clearPvPStatus();
            }
        }

        if (window.gameMode === 'pvp' && window.myRole) {
            const myServerRole = window.myRole; const enemyServerRole = (window.myRole === 'player1') ? 'player2' : 'player1';
            const myData = matchData[myServerRole]; const enemyData = matchData[enemyServerRole];

            if (!window.isResolvingTurn && myData) {
                syncUnitFromServer(player, myData, true);
            }

            if (enemyData && !window.isResolvingTurn) {
                const serverXP = enemyData.xp || []; const localXP = monster.xp || [];
                syncUnitFromServer(monster, enemyData, false, false);
                if (serverXP.length > localXP.length) {
                    const startIdx = localXP.length;
                    for (let i = startIdx; i < serverXP.length; i++) {
                        animateFly('m-deck-container', 'm-xp', serverXP[i], () => { triggerXPGlow('m'); }, false, false, false);
                    }
                    monster.xp = [...serverXP]; updateUI();
                } else if (serverXP.length < localXP.length) {
                    monster.xp = [...serverXP];
                    if (enemyData.lvl && enemyData.lvl > monster.lvl) { triggerLevelUpVisuals('m'); playSound('sfx-levelup'); }
                    updateUI();
                }
            }
        }
    });
}

function showPvPStatus(msg) {
    document.body.classList.add('pvp-waiting-table');
    let el = document.getElementById('pvp-status-bar');
    if (!el) {
        el = document.createElement('div'); el.id = 'pvp-status-bar';
        el.style.position = 'fixed'; el.style.top = '46%'; el.style.left = '50%'; el.style.transform = 'translate(-50%, -50%)';
        el.style.background = 'rgba(0,0,0,0.7)'; el.style.color = '#ffd700'; el.style.padding = '10px 20px';
        el.style.borderRadius = '20px'; el.style.zIndex = '9999'; el.style.fontSize = '14px'; el.style.border = '1px solid #ffd700';
        document.body.appendChild(el);
    }
    el.innerText = msg;
}

function clearPvPStatus() {
    const sb = document.getElementById('pvp-status-bar');
    if(sb) sb.remove();
    document.body.classList.remove('pvp-waiting-table');
}

function updatePvPReadyIndicator(myReady, opponentReady) {
    if(window.gameMode !== 'pvp') return;
    const playerHud = document.getElementById('p-stats-cluster');
    const enemyHud = document.getElementById('m-stats-cluster');
    if(playerHud) playerHud.classList.toggle('pvp-ready-glow', !!myReady);
    if(enemyHud) enemyHud.classList.toggle('pvp-ready-glow', !!opponentReady);
}

function resetHandCardVisualState() {
    clearHoverFocusState(true);
    const handContainer = document.getElementById('player-hand');
    if (!handContainer) return;
    Array.from(handContainer.children).forEach(card => {
        card.classList.remove('card-selected');
        card.style.transform = '';
        card.style.zIndex = '';
        card.style.filter = '';
    });
}

function clearHoverFocusState(force = false) {
    const activeHover = document.querySelector('.hand-card:hover, .xp-mini:hover');
    if(force || !activeHover) {
        document.body.classList.remove('focus-hand', 'focus-xp', 'cinematic-active', 'tension-active');
        window.isLethalHover = false;
        const tooltip = document.getElementById('tooltip-box');
        if(tooltip) tooltip.style.display = 'none';
    }
}

function finishPvPTurnResetIfReady(matchData = window.latestMatchData) {
    if (!window.pvpWaitingForTurnReset || !window.pvpLocalResolutionComplete || !matchData) return false;
    const p1Ready = matchData.p1Move && matchData.p1Move.length > 0;
    const p2Ready = matchData.p2Move && matchData.p2Move.length > 0;
    if (p1Ready || p2Ready) return false;
    window.pvpWaitingForTurnReset = false;
    window.pvpLocalResolutionComplete = false;
    window.pvpSelectedCardIndex = null;
    window.isResolvingTurn = false;
    window.isProcessing = false;
    resetHandCardVisualState();
    updateUI();
    clearPvPStatus();
    updatePvPReadyIndicator(false, false);
    startTurnTimer();
    return true;
}

function syncUnitFromServer(u, data, showPlayerDamage = false, syncXp = true) {
    if (!data) return;
    if (data.hp !== undefined && data.hp !== u.hp) {
        const oldHp = u.hp;
        u.hp = data.hp;
        if (showPlayerDamage && data.hp < oldHp) {
            showFloatingText('p-lvl', `-${oldHp - data.hp}`, "#ff7675");
            triggerDamageEffect(true, true);
        }
    }
    if(data.deck) u.deck = [...data.deck];
    if(syncXp && data.xp) u.xp = [...data.xp];
    if(data.lvl) u.lvl = data.lvl;
    if(data.maxHp) u.maxHp = data.maxHp;
    if(data.bonusAtk !== undefined) u.bonusAtk = data.bonusAtk;
    if(data.bonusBlock !== undefined) u.bonusBlock = data.bonusBlock;
    if(data.disabled !== undefined) u.disabled = data.disabled;
    if(data.equippedItems !== undefined) u.equippedItems = { ...(data.equippedItems || {}) };
    if(data.deckType !== undefined) u.deckType = data.deckType || 'knight';
    updateUI();
    if (showPlayerDamage) checkEndGame();
}

function serializeUnitState(u) {
    return {
        hp: u.hp,
        maxHp: u.maxHp,
        lvl: u.lvl,
        deck: [...u.deck],
        xp: [...u.xp],
        disabled: u.disabled || null,
        bonusAtk: u.bonusAtk || 0,
        bonusBlock: u.bonusBlock || 0,
        deckType: u.deckType || 'knight',
        equippedItems: { ...(u.equippedItems || {}) }
    };
}

function isFriendlyMatch() {
    return !!((window.latestMatchData && window.latestMatchData.friendly) || (window.pvpStartData && window.pvpStartData.friendly));
}

async function resetFriendlyMatchForRematch(matchData) {
    if(!window.currentMatchId || !matchData) return;
    const p1DeckCards = generateShuffledDeck();
    const p2DeckCards = generateShuffledDeck();
    const p1Hand = [];
    const p2Hand = [];
    for(let i = 0; i < 6; i++) {
        if(p1DeckCards.length > 0) p1Hand.push(p1DeckCards.pop());
        if(p2DeckCards.length > 0) p2Hand.push(p2DeckCards.pop());
    }
    p1Hand.sort();
    p2Hand.sort();
    await updateDoc(doc(db, "matches", window.currentMatchId), {
        player1: { ...matchData.player1, hp: 6, maxHp: 6, lvl: 1, hand: p1Hand, deck: p1DeckCards, xp: [], disabled: null, bonusAtk: 0, bonusBlock: 0 },
        player2: { ...matchData.player2, hp: 6, maxHp: 6, lvl: 1, hand: p2Hand, deck: p2DeckCards, xp: [], disabled: null, bonusAtk: 0, bonusBlock: 0 },
        p1Move: null,
        p2Move: null,
        p1Disarm: null,
        p2Disarm: null,
        player1Rematch: false,
        player2Rematch: false,
        turn: 1,
        status: 'playing',
        rematchRound: increment(1)
    });
}

function hydratePvPResolutionState(matchData) {
    if (!matchData || !window.myRole) return;
    const myData = matchData[window.myRole];
    const enemyRole = window.myRole === 'player1' ? 'player2' : 'player1';
    const enemyData = matchData[enemyRole];
    syncUnitFromServer(player, myData, false);
    syncUnitFromServer(monster, enemyData, false);
}

async function publishResolvedPvPTurn() {
    if (!window.currentMatchId || window.myRole !== 'player1') return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    const updates = {
        p1Move: null,
        p2Move: null,
        p1Disarm: null,
        p2Disarm: null,
        turn: increment(1)
    };
    if (window.myRole === 'player1') {
        Object.assign(updates, {
            player1: { ...window.latestMatchData.player1, ...serializeUnitState(player) },
            player2: { ...window.latestMatchData.player2, ...serializeUnitState(monster) }
        });
    }
    await updateDoc(matchRef, updates);
}

function checkEndGame(){
    if(player.hp<=0 || monster.hp<=0) {
        stopTurnTimer();
        window.isProcessing = true; window.isLethalHover = false; MusicController.stopCurrent();
        clearPvPStatus();
        setTimeout(()=>{
            let title = document.getElementById('end-title'); let isWin = player.hp > 0; let isTie = player.hp <= 0 && monster.hp <= 0;
            if(isFriendlyMatch()) {
                const existingPoints = document.getElementById('end-points');
                if(existingPoints) existingPoints.remove();
                const existingGold = document.getElementById('end-gold-reward');
                if(existingGold) existingGold.remove();
                if(isTie) { title.innerText = "EMPATE"; title.className = "tie-theme"; playSound('sfx-tie'); triggerEndScreenFx('tie'); }
                else if(isWin) { title.innerText = "VITÓRIA"; title.className = "win-theme"; playSound('sfx-win'); triggerEndScreenFx('win'); }
                else { title.innerText = "DERROTA"; title.className = "lose-theme"; playSound('sfx-lose'); triggerEndScreenFx('loss'); }
                const secondaryBtn = document.querySelector('#end-screen .secondary-btn');
                if(secondaryBtn) secondaryBtn.innerText = "SAIR PARA O SAGUÃO";
                if(window.currentMatchId && window.myRole === 'player1') {
                    updateDoc(doc(db, "matches", window.currentMatchId), { status: 'finished', player1Rematch: false, player2Rematch: false }).catch(() => {});
                }
                document.getElementById('end-screen').classList.add('visible');
                updatePresence();
                return;
            }
            const normalSecondaryBtn = document.querySelector('#end-screen .secondary-btn');
            if(normalSecondaryBtn) normalSecondaryBtn.innerText = "SAGUÃO";
            if(isTie) { title.innerText = "EMPATE"; title.className = "tie-theme"; playSound('sfx-tie'); triggerEndScreenFx('tie'); showEndPoints(1); }
            else if(isWin) { title.innerText = "VITÓRIA"; title.className = "win-theme"; playSound('sfx-win'); triggerEndScreenFx('win'); showEndPoints(window.gameMode === 'pvp' ? 8 : 3); }
            else { title.innerText = "DERROTA"; title.className = "lose-theme"; playSound('sfx-lose'); triggerEndScreenFx('loss'); showEndPoints(-3); }

            if(isTie) { if(window.registrarEmpateOnline) window.registrarEmpateOnline(window.gameMode); }
            else if(isWin) { if(window.registrarVitoriaOnline) window.registrarVitoriaOnline(window.gameMode); }
            else { if(window.registrarDerrotaOnline) window.registrarDerrotaOnline(window.gameMode); }
            document.getElementById('end-screen').classList.add('visible');
        }, 1000);
    } else if (window.gameMode !== 'pvp' || !window.pvpWaitingForTurnReset) { window.isProcessing = false; }
}

function resetMatchRewardGold() {
    window.matchRewardGold = 0;
    window.opponentMatchRewardGold = 0;
    window.matchRewardState = null;
    if(window.matchRewardAnimationTimers) {
        if(window.matchRewardAnimationTimers.player) clearTimeout(window.matchRewardAnimationTimers.player);
        if(window.matchRewardAnimationTimers.opponent) clearTimeout(window.matchRewardAnimationTimers.opponent);
    }
    window.matchRewardAnimationQueue = { player: [], opponent: [] };
    window.matchRewardAnimationTimers = { player: null, opponent: null };
    const reward = document.getElementById('p-match-reward-gold');
    if(reward) reward.remove();
    const enemyReward = document.getElementById('m-match-reward-gold');
    if(enemyReward) enemyReward.remove();
    document.querySelectorAll('.reward-coin-fly, .reward-coin-label-fly').forEach(el => el.remove());
}

const MATCH_REWARD_LABELS = {
    EFFECTIVE_ATTACK: 'ATAQUE EFETIVO',
    LEVEL_UP: 'MAIS FORTE',
    PERFECT_DEFENSE: 'DEFESA PERFEITA',
    PLAY_BLOCK: 'BLOQUEIO',
    PLAY_RESTORE: 'RESTAURAR',
    PLAY_DISARM: 'DESARMAR',
    PLAY_TRAIN: 'TREINAR',
    MASTERY_ATTACK: 'MAESTRIA EM ATAQUE',
    MASTERY_BLOCK: 'MAESTRIA EM BLOQUEIO',
    MASTERY_RESTORE: 'MAESTRIA EM RESTAURAR',
    MASTERY_DISARM: 'MAESTRIA EM DESARMAR',
    MASTERY_TRAIN: 'MAESTRIA EM TREINAR'
};

function awardMatchRewardGold(amount = 1, label = MATCH_REWARD_LABELS.EFFECTIVE_ATTACK) {
    awardMatchRewardGoldFor(player, amount, label);
}

function getUnitEquippedBorderId(u) {
    if(u === player) return u.equippedItems?.cardBorder || window.equippedItems?.cardBorder || null;
    return u?.equippedItems?.cardBorder || null;
}

function getUnitBorderRewardRules(u) {
    return BORDER_REWARD_RULES[getUnitEquippedBorderId(u)] || null;
}

function getUnitDeckRewardRules(u) {
    return DECK_REWARD_RULES[u?.deckType || 'knight'] || null;
}

function sumRewardRules(u, getter) {
    return [getUnitDeckRewardRules(u), getUnitBorderRewardRules(u)]
        .reduce((total, rules) => total + Math.max(0, Number(getter(rules) || 0)), 0);
}

function awardBorderPlayRewardGold(u, cardKey) {
    const amount = sumRewardRules(u, rules => rules?.play?.[cardKey]);
    if(amount <= 0) return;
    const label = cardKey === 'BLOQUEIO' ? MATCH_REWARD_LABELS.PLAY_BLOCK : (cardKey === 'DESCANSAR' ? MATCH_REWARD_LABELS.PLAY_RESTORE : (cardKey === 'DESARMAR' ? MATCH_REWARD_LABELS.PLAY_DISARM : MATCH_REWARD_LABELS.PLAY_TRAIN));
    awardMatchRewardGoldFor(u, amount, label);
}

function awardAttackRewardGold(u, damage) {
    if(damage <= 0) return;
    const amount = sumRewardRules(u, rules => rules?.attackEffective);
    if(amount > 0) awardMatchRewardGoldFor(u, amount, MATCH_REWARD_LABELS.EFFECTIVE_ATTACK);
}

function awardBlockRewardGold(u) {
    const amount = sumRewardRules(u, rules => rules?.blockEffective);
    if(amount > 0) awardMatchRewardGoldFor(u, amount, MATCH_REWARD_LABELS.PERFECT_DEFENSE);
}

function awardLevelRewardGold(u) {
    const amount = sumRewardRules(u, rules => rules?.levelUp);
    if(amount > 0) awardMatchRewardGoldFor(u, amount, MATCH_REWARD_LABELS.LEVEL_UP);
}

function awardMasteryRewardGold(u, masteryKey) {
    const amount = sumRewardRules(u, rules => rules?.mastery?.[masteryKey]);
    if(amount <= 0) return;
    const labels = {
        ATAQUE: MATCH_REWARD_LABELS.MASTERY_ATTACK,
        BLOQUEIO: MATCH_REWARD_LABELS.MASTERY_BLOCK,
        DESCANSAR: MATCH_REWARD_LABELS.MASTERY_RESTORE,
        DESARMAR: MATCH_REWARD_LABELS.MASTERY_DISARM,
        TREINAR: MATCH_REWARD_LABELS.MASTERY_TRAIN
    };
    awardMatchRewardGoldFor(u, amount, labels[masteryKey] || 'MAESTRIA');
}

function playRewardCoinSound(delay = 0) {
    if(!window.sfxEnabled) return;
    setTimeout(() => {
        if(audios['sfx-coin']) {
            playSound('sfx-coin');
            return;
        }
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if(!AudioCtx) return;
            const ctx = new AudioCtx();
            const gain = ctx.createGain();
            const oscA = ctx.createOscillator();
            const oscB = ctx.createOscillator();
            const now = ctx.currentTime;
            oscA.type = 'triangle';
            oscB.type = 'sine';
            oscA.frequency.setValueAtTime(880, now);
            oscA.frequency.exponentialRampToValueAtTime(1568, now + 0.09);
            oscB.frequency.setValueAtTime(1760, now + 0.05);
            oscB.frequency.exponentialRampToValueAtTime(2349, now + 0.16);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.18, now + 0.018);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
            oscA.connect(gain);
            oscB.connect(gain);
            gain.connect(ctx.destination);
            oscA.start(now);
            oscB.start(now + 0.045);
            oscA.stop(now + 0.22);
            oscB.stop(now + 0.22);
            setTimeout(() => ctx.close().catch(()=>{}), 320);
        } catch(e) {}
    }, delay);
}

function getRewardCoinTargetRect(isPlayerReward) {
    const reward = document.getElementById(isPlayerReward ? 'p-match-reward-gold' : 'm-match-reward-gold');
    const coin = reward ? reward.querySelector('img') : null;
    const target = coin || reward;
    if(!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, size: Math.max(rect.width, rect.height) };
}

function animateRewardCoinLabel(isPlayerReward, labels = []) {
    const target = getRewardCoinTargetRect(isPlayerReward);
    if(!target || labels.length === 0) return;
    const labelFx = document.createElement('div');
    labelFx.className = 'reward-coin-label-fly';
    labelFx.style.left = `${target.x}px`;
    labelFx.style.top = `${target.y + (isPlayerReward ? -62 : 62)}px`;
    labelFx.innerHTML = labels.map(label => `<span>${label}</span>`).join('');
    document.body.appendChild(labelFx);

    labelFx.animate([
        { transform: 'translate(-50%, -50%) translateY(8px) scale(0.74)', opacity: 0 },
        { transform: 'translate(-50%, -50%) translateY(-4px) scale(1.16)', opacity: 1, offset: 0.18 },
        { transform: 'translate(-50%, -50%) translateY(0) scale(1)', opacity: 1, offset: 0.78 },
        { transform: 'translate(-50%, -50%) translateY(-10px) scale(0.94)', opacity: 0 }
    ], {
        duration: 2500,
        easing: 'cubic-bezier(0.15, 0.86, 0.22, 1)',
        fill: 'forwards'
    }).onfinish = () => labelFx.remove();
}

function animateRewardCoin(isPlayerReward, index = 0, onPop = null) {
    const delay = index * 170;
    setTimeout(() => {
        if(typeof onPop === 'function') onPop();
        playRewardCoinSound(0);
        const reward = document.getElementById(isPlayerReward ? 'p-match-reward-gold' : 'm-match-reward-gold');
        if(!reward) return;
        reward.classList.remove('coin-pop-active');
        void reward.offsetWidth;
        reward.classList.add('coin-pop-active');
        setTimeout(() => reward.classList.remove('coin-pop-active'), 1050);
    }, delay);
}

function setRewardWalletDisplay(isPlayerReward, amount) {
    const cluster = document.getElementById(isPlayerReward ? 'p-stats-cluster' : 'm-stats-cluster');
    if(!cluster || amount <= 0) return null;
    const id = isPlayerReward ? 'p-match-reward-gold' : 'm-match-reward-gold';
    let reward = document.getElementById(id);
    if(!reward) {
        reward = document.createElement('div');
        reward.id = id;
        reward.className = `match-reward-gold ${isPlayerReward ? 'player-reward-gold' : 'enemy-reward-gold'}`;
        cluster.appendChild(reward);
    }
    reward.setAttribute('aria-label', `Ouro da partida: ${amount}`);
    reward.innerHTML = `<span class="reward-wallet-coin"><img src="assets/img/moeda_ouro.png" alt="Moeda de ouro"></span><span>x${amount}</span>`;
    return reward;
}

function queueRewardCoinAnimation(isPlayerReward, amount, label) {
    const side = isPlayerReward ? 'player' : 'opponent';
    if(!window.matchRewardAnimationQueue) window.matchRewardAnimationQueue = { player: [], opponent: [] };
    if(!window.matchRewardAnimationTimers) window.matchRewardAnimationTimers = { player: null, opponent: null };
    const previousAmount = isPlayerReward ? Math.max(0, (window.matchRewardGold || 0) - amount) : Math.max(0, (window.opponentMatchRewardGold || 0) - amount);
    window.matchRewardAnimationQueue[side].push({ amount, label, previousAmount });
    if(window.matchRewardAnimationTimers[side]) clearTimeout(window.matchRewardAnimationTimers[side]);
    window.matchRewardAnimationTimers[side] = setTimeout(() => {
        const batch = window.matchRewardAnimationQueue[side] || [];
        window.matchRewardAnimationQueue[side] = [];
        window.matchRewardAnimationTimers[side] = null;
        const total = batch.reduce((sum, item) => sum + Math.max(0, item.amount || 0), 0);
        const labels = [...new Set(batch.map(item => item.label).filter(Boolean))];
        const startAmount = batch.length ? Math.max(0, batch[0].previousAmount || 0) : 0;
        setRewardWalletDisplay(isPlayerReward, startAmount + 1);
        animateRewardCoinLabel(isPlayerReward, labels);
        for(let i = 0; i < total; i++) {
            animateRewardCoin(isPlayerReward, i, () => setRewardWalletDisplay(isPlayerReward, startAmount + i + 1));
        }
    }, 90);
}

function awardMatchRewardGoldFor(u, amount = 1, label = MATCH_REWARD_LABELS.EFFECTIVE_ATTACK) {
    if(isFriendlyMatch()) return;
    if(!window.currentUser || amount <= 0) return;
    const isPlayerReward = u === player;
    if(isPlayerReward) {
        window.matchRewardGold = (window.matchRewardGold || 0) + amount;
    } else {
        window.opponentMatchRewardGold = (window.opponentMatchRewardGold || 0) + amount;
    }
    queueRewardCoinAnimation(isPlayerReward, amount, label);
}

function renderMatchRewardGold(isPlayerReward = true) {
    const amount = isPlayerReward ? (window.matchRewardGold || 0) : (window.opponentMatchRewardGold || 0);
    return setRewardWalletDisplay(isPlayerReward, amount, false);
}

function animateEndCounter(el, finalValue, formatter) {
    if(!el) return;
    const value = Math.abs(finalValue || 0);
    const duration = 760;
    const start = performance.now();
    const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(value * eased);
        el.textContent = formatter(current);
        if(progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = formatter(value);
        }
    };
    el.textContent = formatter(0);
    requestAnimationFrame(tick);
}

function showEndPoints(points, goldReward = null) {
    const content = document.querySelector('#end-screen .end-content');
    if(!content) return;
    const oldRewardRow = document.getElementById('end-reward-row');
    if(oldRewardRow && oldRewardRow.children.length === 0) oldRewardRow.remove();
    let rewardStack = document.getElementById('end-reward-stack');
    if(!rewardStack) {
        rewardStack = document.createElement('div');
        rewardStack.id = 'end-reward-stack';
        const title = document.getElementById('end-title');
        if(title && title.nextSibling) content.insertBefore(rewardStack, title.nextSibling);
        else content.appendChild(rewardStack);
    }
    let el = document.getElementById('end-points');
    if(!el) {
        el = document.createElement('div');
        el.id = 'end-points';
        rewardStack.appendChild(el);
    } else if(el.parentElement !== rewardStack) {
        rewardStack.appendChild(el);
    }
    el.className = points < 0 ? 'points-loss' : (points === 1 ? 'points-tie' : 'points-win');
    const pointIcon = points < 0 ? 'down' : 'up';
    el.innerHTML = `<span class="end-points-arrow ${pointIcon}" aria-hidden="true"></span><span class="end-points-count"></span>`;
    const pointSpan = el.querySelector('.end-points-count');
    const pointSign = points > 0 ? '+' : (points < 0 ? '-' : '');
    animateEndCounter(pointSpan, points, value => `${pointSign}${value} PTS`);

    const reward = goldReward !== null ? Math.max(0, goldReward || 0) : (points >= 0 ? (window.matchRewardGold || 0) : 0);
    const lostGold = points < 0 ? Math.min(window.currentGoldCoins || 0, window.opponentMatchRewardGold || 0) : 0;
    let goldEl = document.getElementById('end-gold-reward');
    if(reward > 0 || lostGold > 0) {
        if(!goldEl) {
            goldEl = document.createElement('div');
            goldEl.id = 'end-gold-reward';
            goldEl.className = 'end-reward-gold';
            rewardStack.appendChild(goldEl);
        } else if(goldEl.parentElement !== rewardStack) {
            rewardStack.appendChild(goldEl);
        }
        goldEl.classList.toggle('gold-loss', lostGold > 0);
        goldEl.innerHTML = `<img src="assets/img/moeda_ouro.png" alt="Moeda de ouro"><span></span>`;
        const goldSpan = goldEl.querySelector('span');
        const goldSign = lostGold > 0 ? '-' : '+';
        const goldValue = lostGold > 0 ? lostGold : reward;
        animateEndCounter(goldSpan, goldValue, value => `${goldSign}${value} OURO`);
    } else if(goldEl) {
        goldEl.remove();
    }
}

function triggerEndScreenFx(result) {
    document.body.classList.remove('end-win-active', 'end-loss-active', 'end-tie-active');
    document.body.classList.add(`end-${result}-active`);
    if(result !== 'win') return;
    for(let i = 0; i < 46; i++) {
        const conf = document.createElement('span');
        conf.className = 'victory-confetti';
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.animationDelay = (Math.random() * 0.55) + 's';
        conf.style.setProperty('--drift', `${(Math.random() - 0.5) * 180}px`);
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 2600);
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) { window.currentUser = user; window.goToLobby(true); }
    else {
        window.currentUser = null; window.showScreen('start-screen');
        const bg = document.getElementById('game-background'); if(bg) bg.classList.remove('lobby-mode');
        
        // FORCA A REMOCAO DOS TEMAS AO DESLOGAR
        document.body.classList.remove('theme-cavaleiro', 'theme-mago');
        
        window.musicEnabled = false;
        window.sfxEnabled = false;
        MusicController.stopCurrent();
    }
});

window.googleLogin = async function() {
    window.playNavSound(); const btnText = document.getElementById('btn-text'); btnText.innerText = "CONECTANDO...";
    try { await loginWithGoogle(); } catch (error) { btnText.innerText = "ERRO - TENTE NOVAMENTE"; setTimeout(() => btnText.innerText = "LOGIN COM GOOGLE", 3000); }
};

window.handleLogout = function() { window.playNavSound(); logoutGoogle().then(() => { location.reload(); }); };

async function saveMatchHistory(result, pointsChange) {
    if (!window.currentUser) return;
    let enemyName = "PVE";
    if (window.gameMode === 'pvp') {
        if (window.pvpStartData) enemyName = (window.myRole === 'player1') ? window.pvpStartData.player2.name : window.pvpStartData.player1.name;
        if (!enemyName || enemyName === "PVE") {
            const domName = document.querySelector('#m-stats-cluster .unit-name');
            if (domName && domName.innerText !== 'Monstro') enemyName = domName.innerText;
        }
        if(enemyName) enemyName = enemyName.split(' ')[0].toUpperCase();
    }
    await saveMatchHistoryDB(window.currentUser, enemyName, window.gameMode, window.currentDeck, pointsChange, result);
}

async function persistMatchRewardGoldOnly() {
    const gold = Math.max(0, window.matchRewardGold || 0);
    if(!window.currentUser || gold <= 0) return 0;
    try {
        await updateDoc(doc(db, "players", window.currentUser.uid), { goldCoins: increment(gold) });
        updateLobbyGoldWallet((window.currentGoldCoins || 0) + gold);
        return gold;
    } catch(e) {
        return 0;
    }
}

window.registrarVitoriaOnline = async function(modo = 'pve') {
    if(!window.currentUser) return;
    let modoAtual = (window.gameMode === 'pvp' || modo === 'pvp') ? 'pvp' : 'pve';
    const reward = await registrarVitoriaDB(window.currentUser, modoAtual, window.matchRewardGold || 0, 0);
    if(Number.isFinite(reward.gold)) updateLobbyGoldWallet((window.currentGoldCoins || 0) + reward.gold);
    if(Number.isFinite(reward.profileLevel) && Number.isFinite(reward.profileXp)) updateLobbyProfileProgress(reward.profileLevel, reward.profileXp);
    const pts = reward.points || 0;
    if(pts !== 0) {
        window.currentLobbyScore = Math.max(0, (Number(window.currentLobbyScore) || 0) + pts);
        updateLobbyBottomProfileBar();
    }
    if(pts > 0) await saveMatchHistory('WIN', pts);
};

window.registrarDerrotaOnline = async function(modo = 'pve') {
    if(!window.currentUser) return;
    let modoAtual = (window.gameMode === 'pvp' || modo === 'pvp') ? 'pvp' : 'pve';
    const result = await registrarDerrotaDB(window.currentUser, modoAtual, window.opponentMatchRewardGold || 0);
    if(Number.isFinite(result.goldLost)) updateLobbyGoldWallet((window.currentGoldCoins || 0) - result.goldLost);
    const pts = result.points || 0;
    if(pts !== 0) {
        window.currentLobbyScore = Math.max(0, (Number(window.currentLobbyScore) || 0) + pts);
        updateLobbyBottomProfileBar();
    }
    if(pts !== 0) await saveMatchHistory('LOSS', pts);
};

window.registrarEmpateOnline = async function(modo = 'pve') {
    if(!window.currentUser) return;
    let modoAtual = (window.gameMode === 'pvp' || modo === 'pvp') ? 'pvp' : 'pve';
    const pts = await registrarEmpateDB(window.currentUser, modoAtual);
    await persistMatchRewardGoldOnly();
    if(pts > 0) {
        window.currentLobbyScore = Math.max(0, (Number(window.currentLobbyScore) || 0) + pts);
        updateLobbyBottomProfileBar();
    }
    if(pts > 0) await saveMatchHistory('TIE', pts);
};

window.restartMatch = function() {
    if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if(isFriendlyMatch() && window.currentMatchId && window.myRole) {
        const rematchField = window.myRole === 'player1' ? 'player1Rematch' : 'player2Rematch';
        updateDoc(doc(db, "matches", window.currentMatchId), { [rematchField]: true }).then(async () => {
            showPvPStatus("AGUARDANDO JOGADOR");
            const snap = await getDoc(doc(db, "matches", window.currentMatchId));
            if(!snap.exists()) return;
            const data = snap.data();
            if(data.player1Rematch && data.player2Rematch && window.myRole === 'player1') {
                await resetFriendlyMatchForRematch(data);
            }
        }).catch(() => {});
        return;
    }
    document.getElementById('end-screen').classList.remove('visible');
    const pts = document.getElementById('end-points');
    if(pts) pts.remove();
    const gold = document.getElementById('end-gold-reward');
    if(gold) gold.remove();
    document.body.classList.remove('end-win-active', 'end-loss-active', 'end-tie-active');

    if(window.gameMode === 'pvp') {
        const selectedDeck = window.currentDeck || 'knight';
        window.cleanupMatchState();
        window.gameMode = 'pvp';
        window.applyDeckTheme(selectedDeck);
        initiateMatchmaking();
        return;
    }

    setTimeout(startGameFlow, 50);
    MusicController.play('bgm-loop');
}

async function notifyAbandonment() {
    if (!window.currentMatchId || !window.currentUser) return;
    await notifyAbandonmentDB(window.currentMatchId, window.currentUser.uid);
}

window.abandonMatch = function() {
    if(document.getElementById('game-screen').classList.contains('active')) {
        stopTurnTimer();
        window.toggleConfig();
        window.openModal("ABANDONAR?", "Sair da partida contará como DERROTA. Tem certeza?", ["CANCELAR", "SAIR"], async (choice) => {
                if (choice === "SAIR") {
                    stopTurnTimer();
                    if (window.gameMode === 'pvp') await notifyAbandonment();
                    if (!isFriendlyMatch()) window.registrarDerrotaOnline(window.gameMode);
                    window.transitionToLobby();
                } else if (window.gameMode === 'pvp') {
                    startTurnTimer();
                }
            }
        );
    }
}

function preloadGame() {
    ASSETS_TO_LOAD.images.forEach(src => { let img = new Image(); img.src = withRuntimeVersion(src); window.gameAssets.push(img); img.onload = () => updateLoader(); img.onerror = () => updateLoader(); });
    ASSETS_TO_LOAD.audio.forEach(a => {
        let s = audios[a.id] || new Audio();
        s.src = s.src || withRuntimeVersion(a.src);
        s.preload = 'auto';
        if(a.loop) s.loop = true;
        if(window.__buppoAudioNodes && !window.__buppoAudioNodes.includes(s)) window.__buppoAudioNodes.push(s);
        s.datasetKey = a.id;
        audios[a.id] = s;
        window.gameAssets.push(s);
        s.onloadedmetadata = () => {
            if(window.applyAudioSettings) window.applyAudioSettings({ persist: false });
            updateLoader();
        };
        s.onerror = () => updateLoader(); setTimeout(() => { if(s.readyState === 0) updateLoader(); }, 2000);
    });
}

function withRuntimeVersion(src) {
    const version = window.BUPPO_BUILD_VERSION || Date.now();
    if(!src || /^(https?:|data:|blob:)/i.test(src)) return src;
    return `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
}

let desktopUpdateWaiters = [];
let desktopUpdateInitialTimer = null;
let desktopUpdateDownloadTimer = null;

function setLoaderText(text) {
    const loaderText = document.querySelector('.loader-txt');
    if(loaderText) loaderText.textContent = text;
}

function resolveDesktopUpdateWaiters() {
    desktopUpdateWaiters.forEach(resolve => resolve());
    desktopUpdateWaiters = [];
    if(desktopUpdateInitialTimer) {
        clearTimeout(desktopUpdateInitialTimer);
        desktopUpdateInitialTimer = null;
    }
    if(desktopUpdateDownloadTimer) {
        clearTimeout(desktopUpdateDownloadTimer);
        desktopUpdateDownloadTimer = null;
    }
}

function setupDesktopUpdaterBridge() {
    if(!window.buppoDesktopUpdater || typeof window.buppoDesktopUpdater.onStatus !== 'function') {
        window.desktopUpdateStatus = { state: 'disabled' };
        return;
    }

    window.buppoDesktopUpdater.onStatus((status = {}) => {
        window.desktopUpdateStatus = status;
        const percent = Math.round(status.percent || 0);
        if(status.state === 'checking') {
            setLoaderText('VERIFICANDO ATUALIZACOES...');
        } else if(status.state === 'available') {
            setLoaderText('BAIXANDO ATUALIZACAO...');
            if(desktopUpdateInitialTimer) {
                clearTimeout(desktopUpdateInitialTimer);
                desktopUpdateInitialTimer = null;
            }
            if(!desktopUpdateDownloadTimer) {
                desktopUpdateDownloadTimer = setTimeout(resolveDesktopUpdateWaiters, 300000);
            }
        } else if(status.state === 'progress') {
            setLoaderText(`BAIXANDO ATUALIZACAO... ${percent}%`);
        } else if(status.state === 'downloaded') {
            setLoaderText('INSTALANDO ATUALIZACAO...');
        } else if(status.state === 'not-available' || status.state === 'error' || status.state === 'disabled') {
            resolveDesktopUpdateWaiters();
        }
    });
}

function waitForDesktopUpdateCheck() {
    const state = window.desktopUpdateStatus?.state || 'idle';
    if(!window.buppoDesktopUpdater || state === 'not-available' || state === 'error' || state === 'disabled') {
        return Promise.resolve();
    }
    return new Promise(resolve => {
        desktopUpdateWaiters.push(resolve);
        if(state !== 'available' && state !== 'progress' && !desktopUpdateInitialTimer) {
            desktopUpdateInitialTimer = setTimeout(resolveDesktopUpdateWaiters, 8000);
        }
    });
}

async function refreshRuntimeCaches() {
    try {
        await waitForDesktopUpdateCheck();
        setLoaderText('VERIFICANDO CACHE...');
        if('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(reg => reg.unregister().catch(()=>{})));
        }
        if(window.caches && caches.keys) {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key).catch(()=>{})));
        }
    } catch(e) {
        console.warn('Atualizacao de cache ignorada:', e);
    } finally {
        setLoaderText('CARREGANDO RECURSOS...');
        window.cacheRefreshComplete = true;
    }
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
    }
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

document.addEventListener('keydown', function(e) {
    if(e.code !== 'Space' && e.code !== 'Enter') return;
    const active = document.activeElement;
    if(!active || !active.closest || !active.closest('#end-screen')) return;
    const endVisible = document.getElementById('end-screen')?.classList.contains('visible');
    if(!endVisible) {
        e.preventDefault();
        e.stopImmediatePropagation();
        active.blur();
    }
}, true);

document.addEventListener('keyup', function(e) {
    if(e.code !== 'Space' && e.code !== 'Enter') return;
    const active = document.activeElement;
    if(!active || !active.closest || !active.closest('#end-screen')) return;
    const endVisible = document.getElementById('end-screen')?.classList.contains('visible');
    if(!endVisible) {
        e.preventDefault();
        e.stopImmediatePropagation();
        active.blur();
    }
}, true);

window.addEventListener('beforeunload', () => { if (window.gameMode === 'pvp' && window.currentMatchId && !document.getElementById('end-screen').classList.contains('visible')) notifyAbandonment(); });
document.addEventListener('visibilitychange', () => { if(!document.hidden && window.updatePresence) window.updatePresence(); });

function initAmbientParticles() {
    const container = document.getElementById('ambient-particles');
    if(!container) return;
    container.innerHTML = '';
    for(let i=0; i<64; i++) {
        let d = document.createElement('div');
        const sizeClass = i % 9 === 0 ? 'large' : (i % 3 === 0 ? 'tiny' : '');
        d.className = `ember ${sizeClass}`.trim();
        d.style.left = Math.random() * 100 + '%';
        d.style.animationDuration = (7 + Math.random() * 9) + 's';
        d.style.animationDelay = (Math.random() * 10) + 's';
        d.style.setProperty('--mx', (Math.random() - 0.5) * 95 + 'px');
        container.appendChild(d);
    }
}
initAmbientParticles();

function dealAllInitialCards() {
    window.isProcessing = true; playSound('sfx-deal');
    const handEl = document.getElementById('player-hand'); const cards = Array.from(handEl.children);
    cards.forEach((cardEl, i) => { cardEl.classList.add('intro-anim'); cardEl.style.animationDelay = (i * 0.1) + 's'; cardEl.style.opacity = ''; });
    window.isMatchStarting = false;
    if(handEl) handEl.classList.remove('preparing');
    setTimeout(() => { cards.forEach(c => { c.classList.remove('intro-anim'); c.style.animationDelay = ''; }); window.isProcessing = false; if(window.gameMode === 'pvp') startTurnTimer(); }, 2000);
}

function onCardClick(index) {
    if(window.isProcessing) return; if (!player.hand[index]) return;
    if (window.gameMode === 'pvp' && (window.isResolvingTurn || window.pvpWaitingForTurnReset)) return;
    if (window.gameMode === 'pvp' && window.pvpSelectedCardIndex !== null) return;
    let cardKey = player.hand[index];
    if(player.disabled === cardKey) {
        showDisabledCardWarning(index);
        return;
    }
    playSound('sfx-play'); clearHoverFocusState(true);

    if(cardKey === 'DESARMAR') {
        window.openModal('ALVO DO DESARME', 'Qual ação bloquear no inimigo?', ACTION_KEYS, (choice) => {
            if(window.gameMode === 'pvp') lockInPvPMove(index, choice); else playCardFlow(index, choice);
        });
    } else {
        if(window.gameMode === 'pvp') lockInPvPMove(index, null); else playCardFlow(index, null);
    }
}

function showDisabledCardWarning(index) {
    const handContainer = document.getElementById('player-hand');
    const cardEl = handContainer && handContainer.children[index];
    if(!cardEl) { showCenterText("NÃO PODE JOGAR", "#ff7675"); return; }
    cardEl.querySelectorAll('.disabled-card-warning').forEach(el => el.remove());
    const warning = document.createElement('div');
    warning.className = 'disabled-card-warning';
    warning.innerText = "NÃO PODE JOGAR";
    cardEl.appendChild(warning);
    setTimeout(() => warning.remove(), 760);
}

async function lockInPvPMove(index, disarmChoice) {
    if (!window.myRole && window.pvpStartData && window.currentUser) {
        if (window.pvpStartData.player1.uid === window.currentUser.uid) window.myRole = 'player1'; else window.myRole = 'player2';
    }
    const handContainer = document.getElementById('player-hand');
    const cardEl = handContainer.children[index]; if(cardEl) cardEl.classList.add('card-selected');
    window.pvpSelectedCardIndex = index; window.isProcessing = true; showPvPStatus("AGUARDANDO OPONENTE...");

    const cardKey = player.hand[index];
    const matchRef = doc(db, "matches", window.currentMatchId);
    const updateField = (window.myRole === 'player1') ? 'p1Move' : 'p2Move';
    const disarmField = (window.myRole === 'player1') ? 'p1Disarm' : 'p2Disarm';

    try {
        await updateDoc(matchRef, { [updateField]: cardKey, [disarmField]: disarmChoice || null });
    } catch (e) {
        window.isProcessing = false; window.pvpSelectedCardIndex = null;
        if(cardEl) cardEl.classList.remove('card-selected');
        clearPvPStatus();
        showCenterText("ERRO AO ENVIAR", "red");
    }
}

async function playCardFlow(index, pDisarmChoice) {
    window.isProcessing = true; let cardKey = player.hand.splice(index, 1)[0]; playerHistory.push(cardKey);
    let aiMove = getBestAIMove(monster, player, playerHistory, turnCount);
    let mCardKey = 'ATAQUE'; let mDisarmTarget = null;
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
        else { baseDraw(monster, 1); if(monster.hand.length > 0) mCardKey = monster.hand.pop(); }
    }

    let handContainer = document.getElementById('player-hand'); let realCardEl = handContainer.children[index]; let startRect = null;
    if(realCardEl) {
        startRect = realCardEl.getBoundingClientRect(); realCardEl.style.transition = 'none';
        realCardEl.style.setProperty('opacity', '0', 'important'); realCardEl.style.setProperty('visibility', 'hidden', 'important');
        realCardEl.innerHTML = ''; realCardEl.style.border = 'none'; realCardEl.style.background = 'none'; realCardEl.style.boxShadow = 'none';
    }

    animateFly(startRect || 'player-hand', 'p-slot', cardKey, () => { 
        renderTable(cardKey, 'p-slot', true); 
        let sc = document.querySelector('#p-slot .card'); if(sc) sc.classList.add('card-slam-anim');
        updateUI(); 
    }, false, true, true);
    
    const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 - (window.innerWidth < 768 ? 42 : 52.5) };
    animateFly(opponentHandOrigin, 'm-slot', mCardKey, () => { 
        renderTable(mCardKey, 'm-slot', false); 
        let sc = document.querySelector('#m-slot .card'); if(sc) sc.classList.add('card-slam-anim');
        setTimeout(() => resolveTurn(cardKey, mCardKey, pDisarmChoice, mDisarmTarget), 500); 
    }, false, true, false);
}

async function resolvePvPTurn(matchData) {
    if (window.isResolvingTurn) return;
    window.isResolvingTurn = true; window.isProcessing = true; window.pvpWaitingForTurnReset = true; window.pvpLocalResolutionComplete = false;
    clearPvPStatus();
    resetHandCardVisualState();
    hydratePvPResolutionState(matchData);

    let myMove, enemyMove, myDisarmChoice, enemyDisarmChoice;
    const p1Move = matchData.p1Move, p2Move = matchData.p2Move, p1Disarm = matchData.p1Disarm, p2Disarm = matchData.p2Disarm;
    if (window.myRole === 'player1') { myMove = p1Move; enemyMove = p2Move; myDisarmChoice = p1Disarm; enemyDisarmChoice = p2Disarm; }
    else { myMove = p2Move; enemyMove = p1Move; myDisarmChoice = p2Disarm; enemyDisarmChoice = p1Disarm; }

    try {
        if (window.pvpSelectedCardIndex === null || window.pvpSelectedCardIndex === undefined) window.pvpSelectedCardIndex = player.hand.indexOf(myMove);
        const handContainer = document.getElementById('player-hand'); let myCardEl = null; let startRect = null;
        if (handContainer) {
            if (window.pvpSelectedCardIndex > -1 && handContainer.children[window.pvpSelectedCardIndex]) myCardEl = handContainer.children[window.pvpSelectedCardIndex];
            else { const handCards = Array.from(handContainer.children); if(handCards.length > 0) myCardEl = handCards[0]; }
        }
        if (myCardEl) { startRect = myCardEl.getBoundingClientRect(); myCardEl.classList.remove('card-selected'); myCardEl.style.opacity = '0'; myCardEl.style.transform = ''; }
        if (window.pvpSelectedCardIndex > -1 && player.hand[window.pvpSelectedCardIndex] === myMove) {
            player.hand.splice(window.pvpSelectedCardIndex, 1); window.pvpSelectedCardIndex = null;
        } else {
            const idx = player.hand.indexOf(myMove); if(idx > -1) player.hand.splice(idx, 1); window.pvpSelectedCardIndex = null;
        }
        playerHistory.push(myMove);

        animateFly(startRect || 'player-hand', 'p-slot', myMove, () => { 
            renderTable(myMove, 'p-slot', true); 
            let sc = document.querySelector('#p-slot .card'); if(sc) sc.classList.add('card-slam-anim');
        }, false, true, true);
        
        const opponentHandOrigin = { top: -160, left: window.innerWidth / 2 };
        animateFly(opponentHandOrigin, 'm-slot', enemyMove, () => { 
            renderTable(enemyMove, 'm-slot', false); 
            let sc = document.querySelector('#m-slot .card'); if(sc) sc.classList.add('card-slam-anim');
        }, false, true, false);
    } catch (e) {}

    setTimeout(() => {
        try {
            resolveTurn(myMove, enemyMove, myDisarmChoice, enemyDisarmChoice, () => {
                window.pvpLocalResolutionComplete = true;
                if (window.myRole === 'player1') {
                    publishResolvedPvPTurn().catch(err => {
                        console.error(err);
                        window.pvpWaitingForTurnReset = false; window.pvpLocalResolutionComplete = false; window.isResolvingTurn = false; window.isProcessing = false;
                    });
                } else {
                    finishPvPTurnResetIfReady();
                }
            });
        } catch (error) {
            updateUI(); window.pvpWaitingForTurnReset = false; window.pvpLocalResolutionComplete = false; window.isResolvingTurn = false; window.isProcessing = false;
        }
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
    } catch (e) { console.error("Erro ao commitar turno ao DB:", e); }
}

function resolveTurn(pAct, mAct, pDisarmChoice, mDisarmTarget, onComplete = null) {
    let pDmg = 0, mDmg = 0;
    if(pAct === 'TREINAR' || mAct === 'TREINAR') playSound('sfx-train');
    if(pAct === 'DESARMAR' || mAct === 'DESARMAR') playSound('sfx-disarm');

    if(mAct === 'ATAQUE') pDmg += monster.lvl;
    if(pAct === 'ATAQUE') mDmg += player.lvl;
    if(pAct === 'BLOQUEIO') { pDmg = 0; if(mAct === 'ATAQUE') mDmg += (1 + player.bonusBlock); }
    if(mAct === 'BLOQUEIO') { mDmg = 0; if(pAct === 'ATAQUE') pDmg += (1 + monster.bonusBlock); }

    let clash = false; let pBlocks = (pAct === 'BLOQUEIO' && mAct === 'ATAQUE'); let mBlocks = (mAct === 'BLOQUEIO' && pAct === 'ATAQUE');
    if(pBlocks || mBlocks) clash = true;

    let nextPlayerDisabled = null; let nextMonsterDisabled = null;
    if(mAct === 'DESARMAR') { if(mDisarmTarget) nextPlayerDisabled = mDisarmTarget; else nextPlayerDisabled = 'ATAQUE'; }
    if(pAct === 'DESARMAR') { nextMonsterDisabled = pDisarmChoice; }
    const disarmClash = (pAct === 'DESARMAR' && mAct === 'DESARMAR');
    if(disarmClash) { nextPlayerDisabled = null; nextMonsterDisabled = null; }

    player.disabled = nextPlayerDisabled; monster.disabled = nextMonsterDisabled;

    function handleExtraXP(u) {
        const deckId = (u.id === 'm') ? 'm-deck' : u.id+'-deck-container';
        if (window.gameMode === 'pvp' && window.currentMatchId) {
             if (u === player && u.deck.length > 0) {
                 let card = u.deck.pop();
                 triggerDeckDrawGlow(u.id);
                 animateFly(deckId, u.id+'-xp', card, () => { u.xp.push(card); triggerXPGlow(u.id); updateUI(); }, false, false, true);
             }
        } else {
            if(u.deck.length > 0) {
                let card = u.deck.pop();
                triggerDeckDrawGlow(u.id);
                animateFly(deckId, u.id+'-xp', card, () => { u.xp.push(card); triggerXPGlow(u.id); updateUI(); }, false, false, (u.id === 'p'));
            }
        }
    }

    const phaseReveal = () => {
        setTimeout(phaseResult, 180);
    };

    const phaseResult = () => {
        if(pAct === 'TREINAR') triggerTrainDeckGlow(true);
        if(mAct === 'TREINAR') triggerTrainDeckGlow(false);
        if(pBlocks) { triggerBlockShield(true); triggerBlockEffect(true); }
        else if(mBlocks) { triggerBlockShield(false); triggerBlockEffect(false); }
        if(pAct === 'BLOQUEIO') awardBorderPlayRewardGold(player, 'BLOQUEIO');
        if(mAct === 'BLOQUEIO') awardBorderPlayRewardGold(monster, 'BLOQUEIO');
        if(pBlocks) awardBlockRewardGold(player);
        else if(mBlocks) awardBlockRewardGold(monster);
        if(mAct === 'DESARMAR') awardBorderPlayRewardGold(monster, 'DESARMAR');
        if(pAct === 'DESARMAR') awardBorderPlayRewardGold(player, 'DESARMAR');
        if(disarmClash) showCenterText("ANULADO", "#aaa");
        else {
            if(mAct === 'DESARMAR') triggerDisarmSeal(true, nextPlayerDisabled);
            if(pAct === 'DESARMAR') triggerDisarmSeal(false, nextMonsterDisabled);
        }
        const weightPause = (pDmg >= 4 || mDmg >= 4) ? 220 : 120;
        if(pDmg >= 4 || mDmg >= 4) triggerCritEffect();
        setTimeout(phaseDamage, weightPause);
    };

    const phaseDamage = () => {
        if(pDmg > 0) {
            const hpBefore = player.hp;
            player.hp -= pDmg; showFloatingText('p-lvl', `-${pDmg}`, "#ff7675");
            let soundOn = !(clash && mAct === 'BLOQUEIO');
            if(mAct === 'ATAQUE') triggerAttackSlash(true);
            if (!mBlocks) { triggerDamageEffect(true, soundOn); }
            triggerHpImpact(true);
            if(pDmg >= 3) triggerCriticalDamagePop(true);
            if(mAct === 'ATAQUE' && !pBlocks) awardAttackRewardGold(monster, pDmg);
            if(hpBefore > 0 && player.hp <= 0) triggerClusterExplosion(true);
        }
        if(mDmg > 0) {
            const hpBefore = monster.hp;
            monster.hp -= mDmg; showFloatingText('m-lvl', `-${mDmg}`, "#ff7675");
            if(pAct === 'ATAQUE') triggerAttackSlash(false);
            let soundOn = !(clash && pAct === 'BLOQUEIO'); triggerDamageEffect(false, soundOn);
            triggerHpImpact(false);
            if(mDmg >= 3) triggerCriticalDamagePop(false);
            if(pAct === 'ATAQUE' && !mBlocks) awardAttackRewardGold(player, mDmg);
            if(hpBefore > 0 && monster.hp <= 0) triggerClusterExplosion(false);
        }

        updateUI();
        setTimeout(phaseRecovery, (pDmg >= 4 || mDmg >= 4) ? 180 : 80);
    };

    const phaseRecovery = () => {
        let pDead = player.hp <= 0, mDead = monster.hp <= 0;

        if(!pDead && pAct === 'DESCANSAR') {
            awardBorderPlayRewardGold(player, 'DESCANSAR');
            let healAmount = (pDmg === 0) ? 3 : 2;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            showFloatingText('p-lvl', `+${healAmount} HP`, "#55efc4"); triggerHealEffect(true); triggerHealPulse(true); playSound('sfx-heal');
        }
        if(!mDead && mAct === 'DESCANSAR') {
            awardBorderPlayRewardGold(monster, 'DESCANSAR');
            let healAmount = (mDmg === 0) ? 3 : 2;
            monster.hp = Math.min(monster.maxHp, monster.hp + healAmount);
            triggerHealEffect(false); triggerHealPulse(false); playSound('sfx-heal');
        }

        updateUI();

        if(!pDead && pAct === 'TREINAR') { awardBorderPlayRewardGold(player, 'TREINAR'); handleExtraXP(player); }
        if(!mDead && mAct === 'TREINAR') { awardBorderPlayRewardGold(monster, 'TREINAR'); handleExtraXP(monster); }
        if(!pDead && pAct === 'ATAQUE' && mAct === 'DESCANSAR') handleExtraXP(player);
        if(!mDead && mAct === 'ATAQUE' && pAct === 'DESCANSAR') handleExtraXP(monster);

        setTimeout(() => phaseXP(pDead, mDead), 520);
    };

    const phaseXP = (pDead, mDead) => {
        window.deferMasteryEndCheck = true;
        window.pendingRestMasteryHeals = [];
        window.pendingLevelUpSync = null;
        const enemyXpBeforeTurn = monster.xp.length;
        let levelChecksDone = 0;
        const finishLevelChecks = () => {
            levelChecksDone++;
            if(levelChecksDone < 2) return;
            flushRestMasteryHeals();
            window.deferMasteryEndCheck = false;
            if(window.pendingLevelUpSync) {
                syncLevelUpToDB(window.pendingLevelUpSync);
                window.pendingLevelUpSync = null;
            }
            checkEndGame();
            if(onComplete) onComplete();
        };

        animateFly('p-slot', 'p-xp', pAct, () => {
            if(!pDead) {
                player.xp.push(pAct); triggerXPGlow('p'); updateUI();
                if (window.gameMode === 'pvp') commitTurnToDB(pAct);
            }
            checkLevelUp(player, () => { if(player.hp > 0) { triggerDeckDrawGlow('p'); baseDraw(player, 1); turnCount++; updateUI(); showCombatCue("TURNO " + turnCount, "gold"); if(window.gameMode !== 'pvp') window.isProcessing = false; } finishLevelChecks(); });
        }, false, false, true);

        animateFly('m-slot', 'm-xp', mAct, () => {
            if(!mDead) {
                if (window.gameMode !== 'pvp') {
                    monster.xp.push(mAct); triggerXPGlow('m'); updateUI();
                } else if (monster.xp.length === enemyXpBeforeTurn) {
                    monster.xp.push(mAct); triggerXPGlow('m'); updateUI();
                }
            }
            checkLevelUp(monster, () => { if(monster.hp > 0) { triggerDeckDrawGlow('m'); baseDraw(monster, 1); } finishLevelChecks(); });
        }, false, false, false);

        document.getElementById('p-slot').innerHTML = ''; document.getElementById('m-slot').innerHTML = '';
    };

    phaseReveal();
}

function checkLevelUp(u, doneCb) {
    if(u.xp.length >= 5) {
        const xpForLevelUp = [...u.xp];
        let xpContainer = document.getElementById(u.id + '-xp'); let minis = Array.from(xpContainer.getElementsByClassName('xp-mini'));
        xpContainer.classList.add('levelup-xp-consuming');
        minis.forEach(realCard => {
            let rect = realCard.getBoundingClientRect(); let clone = document.createElement('div'); clone.className = 'xp-anim-clone';
            clone.style.left = rect.left + 'px'; clone.style.top = rect.top + 'px'; clone.style.width = rect.width + 'px'; clone.style.height = rect.height + 'px'; clone.style.backgroundImage = realCard.style.backgroundImage;
            if (u.id === 'p') clone.classList.add('xp-fly-up'); else clone.classList.add('xp-fly-down'); document.body.appendChild(clone);
        });
        minis.forEach(m => m.style.opacity = '0');
        setTimeout(() => {
            let counts = {}; xpForLevelUp.forEach(x => counts[x] = (counts[x]||0)+1); let triggers = [];
            for(let k in counts) if(counts[k] >= 3) triggers.push(k);
            triggers.forEach((type, idx) => setTimeout(() => {
                highlightMasteryXP(u.id, type);
                showMasteryBanner(type, u === player);
            }, idx * 700));

            setTimeout(() => processMasteries(u, triggers, () => {
                let lvlEl = document.getElementById(u.id+'-lvl'); u.lvl++;
                awardLevelRewardGold(u);
                lvlEl.classList.add('level-up-anim'); triggerLevelUpVisuals(u.id); playSound('sfx-levelup'); setTimeout(() => lvlEl.classList.remove('level-up-anim'), 1000);
                xpForLevelUp.forEach(x => u.deck.push(x)); u.xp = [];

                if (window.gameMode === 'pvp' && window.currentMatchId) {
                    let s = stringToSeed(window.currentMatchId + u.originalRole) + u.lvl; shuffle(u.deck, s);
                    if (u === player) {
                        if(window.deferMasteryEndCheck) window.pendingLevelUpSync = u;
                        else syncLevelUpToDB(u);
                    }
                } else { shuffle(u.deck); }
                let clones = document.getElementsByClassName('xp-anim-clone'); while(clones.length > 0) clones[0].remove();
                updateUI(); xpContainer.classList.remove('levelup-xp-consuming'); doneCb();
            }), triggers.length > 0 ? 850 : 0);
        }, 1000);
    } else { doneCb(); }
}

function processMasteries(u, triggers, cb) {
    if(triggers.length === 0) { cb(); return; } let type = triggers.shift();
    if(type === 'TREINAR' && u.id === 'p') { awardMasteryRewardGold(u, 'TREINAR'); let opts = [...new Set(u.xp.filter(x => x !== 'TREINAR'))]; if(opts.length > 0) window.openModal("MAESTRIA SUPREMA", "Copiar qual maestria?", opts, (c) => { if(c === 'DESARMAR') { window.openModal("MAESTRIA TÁTICA", "Bloquear qual ação?", ACTION_KEYS, (targetAction) => { monster.disabled = targetAction; showFloatingText('m-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }); } else { applyMastery(u,c); processMasteries(u, triggers, cb); } }); else processMasteries(u, triggers, cb); }
    else if(type === 'DESARMAR' && u.id === 'p') { awardMasteryRewardGold(u, 'DESARMAR'); window.openModal("MAESTRIA TÁTICA", "Bloquear qual ação?", ACTION_KEYS, (c) => { monster.disabled = c; showFloatingText('m-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }); }
    else if(type === 'TREINAR' && u.id === 'm') {
        let opts = [...new Set(u.xp.filter(x => x !== 'TREINAR'))];
        if(opts.length > 0) {
            awardMasteryRewardGold(u, 'TREINAR');
            let choice = opts[0];
            if(u.hp <= 4 && opts.includes('DESCANSAR')) choice = 'DESCANSAR';
            else if(opts.includes('ATAQUE')) choice = 'ATAQUE';
            else if(opts.includes('BLOQUEIO')) choice = 'BLOQUEIO';
            if(choice === 'DESARMAR') { let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); } else { applyMastery(u, choice); }
        }
        processMasteries(u, triggers, cb);
    }
    else if(type === 'DESARMAR' && u.id === 'm') { awardMasteryRewardGold(u, 'DESARMAR'); let target = (player.hp <= 4) ? 'BLOQUEIO' : 'ATAQUE'; player.disabled = target; showFloatingText('p-lvl', "BLOQUEADO!", "#fab1a0"); processMasteries(u, triggers, cb); }
    else { applyMastery(u, type); processMasteries(u, triggers, cb); }
}

function queueRestMasteryHeal(u) {
    if(!window.pendingRestMasteryHeals) window.pendingRestMasteryHeals = [];
    if(!window.pendingRestMasteryHeals.includes(u)) window.pendingRestMasteryHeals.push(u);
}

function flushRestMasteryHeals() {
    if(!window.pendingRestMasteryHeals) return;
    const heals = [...window.pendingRestMasteryHeals];
    window.pendingRestMasteryHeals = [];
    heals.forEach(u => {
        if(u.hp <= 0) return;
        u.hp = u.maxHp;
        showFloatingText(u.id+'-hp-txt', "CURA TOTAL", "#55efc4");
        triggerHealEffect(u === player);
        triggerHealPulse(u === player);
        playSound('sfx-heal');
    });
    updateUI();
}

function applyMastery(u, k) { if(k === 'ATAQUE') { u.bonusAtk++; let target = (u === player) ? monster : player; const hpBefore = target.hp; target.hp -= u.bonusAtk; showFloatingText(target.id + '-lvl', `-${u.bonusAtk}`, "#ff7675"); triggerAttackSlash(target === player); triggerDamageEffect(u !== player); triggerHpImpact(target === player); if(u.bonusAtk >= 3) triggerCriticalDamagePop(target === player); awardMasteryRewardGold(u, 'ATAQUE'); if(hpBefore > 0 && target.hp <= 0) triggerClusterExplosion(target === player); if(!window.deferMasteryEndCheck) checkEndGame(); } if(k === 'BLOQUEIO') { u.bonusBlock++; awardMasteryRewardGold(u, 'BLOQUEIO'); triggerBlockShield(u === player, 'cluster'); } if(k === 'DESCANSAR') { awardMasteryRewardGold(u, 'DESCANSAR'); queueRestMasteryHeal(u); triggerRestAura(u === player); } updateUI(); }

async function syncLevelUpToDB(u) {
    if (!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    let updates = {}; let targetKey = ""; let opponentKey = "";
    if (u === player) { targetKey = (window.myRole === 'player1') ? 'player1' : 'player2'; opponentKey = (window.myRole === 'player1') ? 'player2' : 'player1'; }
    else { targetKey = (window.myRole === 'player1') ? 'player2' : 'player1'; }

    updates[`${targetKey}.xp`] = []; updates[`${targetKey}.deck`] = u.deck; updates[`${targetKey}.lvl`] = u.lvl; updates[`${targetKey}.hp`] = u.hp; updates[`${targetKey}.maxHp`] = u.maxHp; updates[`${targetKey}.bonusAtk`] = u.bonusAtk; updates[`${targetKey}.bonusBlock`] = u.bonusBlock;
    if (u === player) updates[`${opponentKey}.hp`] = monster.hp;
    try { await updateDoc(matchRef, updates); } catch(e) {}
}

window.openHistory = async function() {
    if(!window.currentUser) return;
    window.playNavSound(); const screen = document.getElementById('history-screen'); const container = document.getElementById('history-list-container');
    screen.style.display = 'flex'; container.innerHTML = '<div style="color:#888; text-align:center; margin-top:20px;">Consultando arquivos...</div>';
    try {
        const historyRef = collection(db, "players", window.currentUser.uid, "history");
        const q = query(historyRef, orderBy("timestamp", "desc"), limit(20)); const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { container.innerHTML = '<div style="color:#888; text-align:center; margin-top:20px;">Nenhuma batalha registrada ainda.</div>'; return; }
        let html = '';
        querySnapshot.forEach((doc) => {
            const h = doc.data(); const date = new Date(h.timestamp); const dateStr = `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            const resultClass = h.result === 'WIN' ? 'win' : (h.result === 'TIE' ? 'tie' : 'loss'); const resultTxt = h.result === 'WIN' ? 'VIT\u00d3RIA' : (h.result === 'TIE' ? 'EMPATE' : 'DERROTA'); const scoreTxt = h.points > 0 ? `+${h.points}` : `${h.points}`;
            let vsText = ""; if (h.opponent === 'PVE' || h.mode === 'pve') { vsText = `${resultTxt} PVE`; } else { vsText = `${resultTxt} vs ${h.opponent}`; }
            html += `<div class="history-item ${resultClass}"><div><div class="h-vs">${vsText}</div><div class="h-date">${dateStr} | ${h.mode.toUpperCase()}</div></div><div class="h-score">${scoreTxt} PTS</div></div>`;
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = '<div style="color:red; text-align:center;">Erro ao carregar.</div>'; }
};

window.closeHistory = function() { window.playNavSound(); document.getElementById('history-screen').style.display = 'none'; };

function updateUI() {
    updateUnit(player);
    updateUnit(monster);
    renderTurnDisplay();
    setTimeout(() => clearHoverFocusState(false), 0);
}

function updateUnit(u) {
    const cluster = document.getElementById(u.id + '-stats-cluster');
    if(cluster) {
        cluster.classList.toggle('critical-hp-pulse', u.hp === 1);
        if(u.hp > 0) {
            cluster.classList.remove('cluster-defeated-hidden');
            delete cluster.dataset.exploded;
        }
    }
    document.getElementById(u.id+'-lvl').firstChild.nodeValue = u.lvl;
    document.getElementById(u.id+'-hp-txt').innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
    let hpPct = (Math.max(0,u.hp)/u.maxHp)*100;
    let hpFill = document.getElementById(u.id+'-hp-fill'); hpFill.style.width = hpPct + '%';
    if(hpPct > 66) hpFill.style.background = "#4cd137"; else if(hpPct > 33) hpFill.style.background = "#fbc531"; else hpFill.style.background = "#e84118";
    document.getElementById(u.id+'-deck-count').innerText = u.deck.length;

    if(u === player) {
        let deckImgEl = document.getElementById('p-deck-img');
        if(window.currentDeck === 'mage') deckImgEl.src = MAGE_ASSETS.DECK_IMG; else deckImgEl.src = 'assets/img/deck_verso_cavaleiro.webp';
        let hc=document.getElementById('player-hand'); hc.innerHTML='';
        if (window.isProcessing) hc.style.pointerEvents = 'none'; else hc.style.pointerEvents = 'auto';
        const touchLayout = isTouchLayout();
        u.hand.forEach((k,i)=>{
            let c=document.createElement('div'); c.className=`card hand-card ${CARDS_DB[k].color}`; c.style.setProperty('--flare-col', CARDS_DB[k].fCol);
            if(window.getEquippedCardBorderItem?.()) c.classList.add('card-skin-metallic-border');
            if(u.disabled===k) c.classList.add('disabled-card');
            const isLocallySelected = (window.gameMode === 'pvp' && window.pvpSelectedCardIndex === i);
            if (isLocallySelected) { c.classList.add('card-selected'); hc.style.pointerEvents = 'none'; }
            if(window.isMatchStarting) c.style.opacity = '0'; else c.style.opacity = '1';
            let lethalType = checkCardLethality(k, player, monster);
            let flaresHTML = ''; for(let f=1; f<=25; f++) flaresHTML += `<div class="flare-spark fs-${f}"></div>`;
            let imgUrl = getCardArt(k, true); c.innerHTML = `<div class="card-art" style="background-image: url('${imgUrl}')"></div><div class="flares-container">${flaresHTML}</div>`;
            c.onclick=()=>onCardClick(i);
            if(!touchLayout) {
                bindFixedTooltip(c,k);
                c.onmouseenter = (e) => { bindFixedTooltip(c,k).onmouseenter(e); document.body.classList.add('focus-hand'); document.body.classList.add('cinematic-active'); if(lethalType) { window.isLethalHover = true; document.body.classList.add('tension-active'); } playSound('sfx-hover'); };
                c.onmouseleave = (e) => { tt.style.display='none'; document.body.classList.remove('focus-hand', 'cinematic-active', 'tension-active'); window.isLethalHover = false; };
            }
            hc.appendChild(c); apply3DTilt(c, true);
        });
    }

    let xc=document.getElementById(u.id+'-xp'); xc.innerHTML='';
    u.xp.forEach(k=>{
        let d=document.createElement('div'); d.className='xp-mini'; d.dataset.cardKey = k; let imgUrl = getCardArt(k, (u === player)); d.style.backgroundImage = `url('${imgUrl}')`;
        if(u === player && window.getEquippedCardBorderItem?.()) d.classList.add('card-skin-metallic-border');
        if(!isTouchLayout()) {
            d.onmouseenter = () => { document.body.classList.add('focus-xp'); playSound('sfx-hover'); };
            d.onmouseleave = () => { document.body.classList.remove('focus-xp'); };
        }
        xc.appendChild(d);
    });
    let mc=document.getElementById(u.id+'-masteries'); mc.innerHTML='';
    if(u.bonusAtk>0) addMI(mc, 'ATAQUE', u.bonusAtk, '#e74c3c', u.id);
    if(u.bonusBlock>0) addMI(mc, 'BLOQUEIO', u.bonusBlock, '#00cec9', u.id);
}

function isTouchLayout() {
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

function bindMasteryTooltip(el, key, value, ownerId) {
    return {
        onmouseenter: (e) => {
            let db=CARDS_DB[key]; document.getElementById('tt-title').innerHTML = key;
            document.getElementById('tt-content').innerHTML = `<span class='tt-label' style='color:var(--accent-blue)'>Bônus Atual</span><span class='tt-val'>+${value}</span><span class='tt-label' style='color:var(--accent-red)'>Efeito</span><span class='tt-val'>${db.mastery}</span>`;
            const masteryLabel = key === 'ATAQUE' ? 'MAESTRIA EM ATAQUE' : 'MAESTRIA EM BLOQUEIO';
            document.getElementById('tt-title').innerHTML = `${masteryLabel} N\u00cdVEL ${value}`;
            document.getElementById('tt-content').innerHTML = '';
            tt.classList.add('mastery-tooltip');
            tt.style.display = 'block'; tt.classList.remove('tooltip-anim-up', 'tooltip-anim-down'); void tt.offsetWidth;
            let rect = el.getBoundingClientRect();
            if(ownerId === 'p') { tt.classList.add('tooltip-anim-up'); tt.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; tt.style.top = 'auto'; }
            else { tt.classList.add('tooltip-anim-down'); tt.style.top = (rect.bottom + 10) + 'px'; tt.style.bottom = 'auto'; }
            tt.style.left = (rect.left + rect.width/2) + 'px'; tt.style.transform = "translateX(-50%)";
        }
    };
}

function addMI(parent, key, value, col, ownerId){
    let d = document.createElement('div'); d.className = 'mastery-icon'; d.innerHTML = `${CARDS_DB[key].icon}<span class="mastery-lvl">${value}</span>`; d.style.borderColor = col;
    let handlers = bindMasteryTooltip(d, key, value, ownerId); d.onmouseenter = handlers.onmouseenter; d.onmouseleave = () => { tt.style.display = 'none'; tt.classList.remove('mastery-tooltip'); }; parent.appendChild(d);
}

const tt=document.getElementById('tooltip-box');
function bindFixedTooltip(el,k) {
    const updatePos = () => { let rect = el.getBoundingClientRect(); tt.style.left = (rect.left + rect.width / 2) + 'px'; };
    return {
        onmouseenter: (e) => {
            showTT(k); tt.style.bottom = (window.innerWidth < 768 ? '280px' : '420px'); tt.style.top = 'auto';
            tt.classList.remove('tooltip-anim-up', 'tooltip-anim-down'); tt.classList.add('tooltip-anim-up'); updatePos(); el.addEventListener('mousemove', updatePos);
        }
    };
}

function showTT(k) {
    tt.classList.remove('mastery-tooltip');
    let db = CARDS_DB[k]; document.getElementById('tt-title').innerHTML = k;
    if (db.customTooltip) {
        let content = db.customTooltip; let currentLvl = (typeof player !== 'undefined' && player.lvl) ? player.lvl : 1;
        content = content.replace('{PLAYER_LVL}', currentLvl); let bonusBlock = (typeof player !== 'undefined' && player.bonusBlock) ? player.bonusBlock : 0;
        let reflectDmg = 1 + bonusBlock; content = content.replace('{PLAYER_BLOCK_DMG}', reflectDmg); document.getElementById('tt-content').innerHTML = content;
    } else { document.getElementById('tt-content').innerHTML = `<span class='tt-label'>Base</span><span class='tt-val'>${db.base}</span><span class='tt-label' style='color:var(--accent-orange)'>Bônus</span><span class='tt-val'>${db.bonus}</span><span class='tt-label' style='color:var(--accent-purple)'>Maestria</span><span class='tt-val'>${db.mastery}</span>`; }
    tt.style.display = 'block';
}

window.saveAudioSettings = async function() {
    if (!window.currentUser) return;
    try {
        const userRef = doc(db, "players", window.currentUser.uid);
        await updateDoc(userRef, { settings: { vol: window.masterVol, music: window.musicEnabled, sfx: window.sfxEnabled, fullscreen: window.fullscreenEnabled === true } });
    } catch(e) { console.error("Erro ao salvar config", e); }
}

window.applyFullscreenPreference = function(enabled) {
    window.fullscreenEnabled = enabled === true;
    const chk = document.getElementById('check-fullscreen');
    if(chk) chk.checked = window.fullscreenEnabled;
    try {
        if(window.fullscreenEnabled) {
            if(!document.fullscreenElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {
                    document.addEventListener('click', () => {
                        if(window.fullscreenEnabled && !document.fullscreenElement && document.documentElement.requestFullscreen) {
                            document.documentElement.requestFullscreen().catch(()=>{});
                        }
                    }, { once: true });
                });
            }
        } else if(document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(()=>{});
        }
    } catch(e) {}
};

window.toggleFullscreenPreference = function() {
    window.playNavSound();
    const chk = document.getElementById('check-fullscreen');
    window.applyFullscreenPreference(chk ? chk.checked : !window.fullscreenEnabled);
    if(window.saveAudioSettings) window.saveAudioSettings();
};

setTimeout(() => {
    if (assetsLoaded < totalAssets) {
        updateLoader();
        const loading = document.getElementById('loading-screen'); if(loading) loading.style.display = 'none';
        if(!window.hoverLogicInitialized) { initGlobalHoverLogic(); window.hoverLogicInitialized = true; }
    }
}, 3000);

setupDesktopUpdaterBridge();
refreshRuntimeCaches().finally(() => preloadGame());


