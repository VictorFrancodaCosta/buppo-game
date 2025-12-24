// js/main.js
import { NetworkManager } from './Network.js';
import { AudioManager } from './AudioManager.js';
import { GameEngine } from './GameEngine.js';
import { UIManager } from './UIManager.js';
import { ASSETS_TO_LOAD } from './data.js';

const net = new NetworkManager();
const audio = new AudioManager();
const ui = new UIManager();

// Configurando a Engine com callbacks para ligar Logica -> Visual
const game = new GameEngine({
    onStateUpdate: (p, m) => ui.updateStats(p, m),
    onTurnResolved: (data) => {
        // Quando a engine calcula o turno:
        ui.animateCombat(data.pCard, data.mCard, () => {
            // Após animação, atualiza UI e toca sons
            ui.updateStats(data.newState.p, data.newState.m);
            if(data.result.pDmg > 0) audio.play('sfx-hit');
            // etc...
        });
    },
    onGameOver: (isWin) => {
        net.registerResult(isWin);
        ui.showEndScreen(isWin);
    }
});

// Inicialização
async function init() {
    await audio.loadAll(ASSETS_TO_LOAD.audio); // Agora assíncrono!
    ui.hideLoader();
    
    net.onAuthChange((user) => {
        if(user) {
            ui.showScreen('lobby-screen');
            net.subscribeToRanking(data => ui.updateRanking(data));
        } else {
            ui.showScreen('start-screen');
        }
    });
}

// Expondo funções globais para botões HTML (onclick="...")
window.startGame = () => {
    game.startGame();
    ui.showScreen('game-screen');
    // Renderiza mão inicial
    ui.renderHand(game.player.hand, (index) => {
        game.playTurn(index); // Jogador clicou na carta
    });
};

window.googleLogin = () => net.login();
// ... etc

init();
