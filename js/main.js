// ARQUIVO: js/main.js
import { ASSETS_TO_LOAD } from './data.js';
import { NetworkManager } from './Network.js';
import { AudioManager } from './AudioManager.js';
import { UIManager } from './UIManager.js';
import { GameEngine } from './GameEngine.js';

// --- INICIALIZAÇÃO ---
const net = new NetworkManager();
const audio = new AudioManager();
const ui = new UIManager();
const game = new GameEngine();

// --- ESTADO GLOBAL (UI Flags) ---
let isProcessingTurn = false;

// --- CONFIGURAÇÃO DO LOOP DE JOGO ---
async function init() {
    // 1. Carrega Assets
    await audio.loadAll(ASSETS_TO_LOAD);
    ui.setLoading(100);

    // 2. Configura Rede e Login
    net.onAuthChange((user) => {
        if (user) {
            ui.showScreen('lobby-screen');
            document.getElementById('lobby-username').innerText = `OLÁ, ${user.displayName.toUpperCase()}`;
            net.subscribeToRanking((data) => ui.updateRanking(data));
            audio.playMusic('bgm-menu');
        } else {
            ui.showScreen('start-screen');
            audio.playMusic('bgm-menu');
        }
    });

    // 3. Bind de botões globais
    window.googleLogin = () => net.login();
    window.handleLogout = () => { net.logout(); location.reload(); };
    window.toggleMute = () => {
        const isMuted = audio.toggleMute();
        // Atualiza ícone se necessário (simplificado)
    };
    
    window.transitionToGame = () => {
        ui.showScreen('game-screen');
        startNewMatch();
    };
    
    window.restartMatch = () => {
        document.getElementById('end-screen').classList.remove('visible');
        startNewMatch();
    };
    
    window.transitionToLobby = () => {
        document.getElementById('end-screen').classList.remove('visible');
        ui.showScreen('lobby-screen');
        audio.playMusic('bgm-menu');
    };
}

// --- FLUXO DA PARTIDA ---
function startNewMatch() {
    isProcessingTurn = false;
    audio.playMusic('bgm-loop');
    
    // Engine reinicia matemática
    game.startMatch();
    
    // UI reinicia visual
    ui.clearTable();
    updateGameUI();
    
    // Animação inicial de cartas
    ui.renderHand(game.player.hand, onPlayerCardClick, game.player.disabled);
    audio.play('sfx-deal');
}

function updateGameUI() {
    ui.updateStats(game.player, game.monster);
    document.getElementById('turn-txt').innerText = "TURNO " + game.turnCount;
}

// --- INTERAÇÃO DO JOGADOR ---
function onPlayerCardClick(index) {
    if (isProcessingTurn) return;
    
    // Validação básica se está bloqueado
    const cardKey = game.player.hand[index];
    if (game.player.disabled === cardKey) {
        // Opcional: Mostrar aviso visual "BLOQUEADO"
        return;
    }

    isProcessingTurn = true;
    audio.play('sfx-play');

    // Executa turno na Engine
    // Nota: Simplifiquei DESARMAR para não precisar de Modals complexos agora
    const turnData = game.playTurn(index, null); 

    if (!turnData) return; // Erro ou fim de jogo

    // Renderiza a mão imediatamente (sem a carta jogada)
    ui.renderHand(game.player.hand, onPlayerCardClick, game.player.disabled);

    // Anima o Combate
    ui.animateCombat(turnData.pCard, turnData.mCard, () => {
        // Resolve Efeitos Pós-Animação
        resolveTurnVisuals(turnData);
    });
}

function resolveTurnVisuals(data) {
    const { result, isGameOver, events } = data;

    // Toca sons baseados no resultado matemático
    if (result.clash) audio.play('sfx-block');
    else if (result.pDmgTaken > 0 || result.mDmgTaken > 0) audio.play('sfx-hit');
    
    if (result.pHeal > 0 || result.mHeal > 0) audio.play('sfx-heal');

    // Atualiza barras de vida e XP
    updateGameUI();
    ui.clearTable();

    // Level Up FX
    if (events.pLevelUp) audio.play('sfx-levelup');

    if (isGameOver) {
        audio.playMusic(null); // Stop music
        const isWin = game.player.hp > 0;
        const isTie = game.player.hp <= 0 && game.monster.hp <= 0;
        
        setTimeout(() => {
            if (isTie) {
                audio.play('sfx-tie');
                ui.showEndScreen("EMPATE", "tie-theme");
            } else if (isWin) {
                audio.play('sfx-win');
                ui.showEndScreen("VITÓRIA", "win-theme");
                net.registerResult(true);
            } else {
                audio.play('sfx-lose');
                ui.showEndScreen("DERROTA", "lose-theme");
                net.registerResult(false);
            }
        }, 1000);
    } else {
        isProcessingTurn = false;
        // Re-renderiza mão para garantir estado correto
        ui.renderHand(game.player.hand, onPlayerCardClick, game.player.disabled);
    }
}

// Inicia tudo
init();
