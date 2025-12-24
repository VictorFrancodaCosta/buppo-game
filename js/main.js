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
            document.getElementById('lobby-username').innerText = `OLÁ, ${user.displayName.split(' ')[0].toUpperCase()}`;
            net.subscribeToRanking((data) => ui.updateRanking(data));
            audio.playMusic('bgm-menu');
        } else {
            ui.showScreen('start-screen');
            audio.playMusic('bgm-menu');
        }
    });

    // 3. Bind de botões globais (Para funcionar com o onclick do HTML)
    
    // Login / Logout
    window.googleLogin = () => net.login();
    window.handleLogout = () => { net.logout(); location.reload(); };

    // Áudio e UI Básica
    window.playNavSound = () => audio.play('sfx-nav');
    
    window.toggleMute = () => {
        const isMuted = audio.toggleMute();
        const btn = document.getElementById('btn-sound');
        // Ícones SVG simples para feedback visual
        const iconOn = `<svg viewBox="0 0 24 24" style="width:100%; height:100%; fill:#eee;"><path d="M3,9v6h4l5,5V4L7,9H3z M16.5,12c0-1.77-1.02-3.29-2.5-4.03v8.05C15.48,15.29,16.5,13.77,16.5,12z M14,3.23v2.06 c2.89,0.86,5,3.54,5,6.71s-2.11,5.85-5,6.71v2.06c4.01-0.91,7-4.49,7-8.77S18.01,4.14,14,3.23z"/></svg>`;
        const iconOff = `<svg viewBox="0 0 24 24" style="width:100%; height:100%; fill:#eee;"><path d="M16.5,12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45,2.45C16.42,12.5,16.5,12.26,16.5,12z M19,12c0,0.94-0.2,1.82-0.54,2.64l1.51,1.51C20.63,14.91,21,13.5,21,12c0-4.28-2.99-7.86-7-8.77v2.06C16.89,6.15,19,8.83,19,12z M4.27,3L3,4.27l4.56,4.56C7.39,8.91,7.2,8.96,7,9H3v6h4l5,5v-6.73l4.25,4.25c-0.67,0.52-1.42,0.93-2.25,1.18v2.06c1.38-0.31,2.63-0.95,3.69-1.81L19.73,21L21,19.73L9,7.73V4L4.27,3z M12,4L9.91,6.09L12,8.18V4z"/></svg>`;
        if(btn) btn.innerHTML = isMuted ? iconOff : iconOn;
    };

    window.toggleFullScreen = () => {
        if (!document.fullscreenElement) { 
            document.documentElement.requestFullscreen().catch(e => console.log(e)); 
        } else { 
            if (document.exitFullscreen) document.exitFullscreen(); 
        }
    };

    window.toggleConfig = () => {
        const p = document.getElementById('config-panel');
        if (p.style.display === 'flex') {
            p.style.display = 'none';
            p.classList.remove('active');
            document.body.classList.remove('config-mode');
        } else {
            p.style.display = 'flex';
            p.classList.add('active');
            document.body.classList.add('config-mode');
        }
    };
    
    // Controle de Volume (Sliders)
    window.updateVol = (type, val) => {
        // Simplesmente atualiza o masterVol no AudioManager se você implementar lá
        // Por enquanto, ajustamos direto no objeto se acessível ou ignoramos
        if(audio) audio.masterVol = parseFloat(val);
    };

    // Navegação e Fluxo de Jogo
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

    window.abandonMatch = () => {
         window.toggleConfig(); 
         if(window.confirm("Tem certeza que deseja sair? Contará como derrota.")) {
             net.registerResult(false); // Registra derrota
             window.transitionToLobby(); 
         }
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
