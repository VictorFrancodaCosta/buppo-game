// js/UIManager.js
import { CARDS_DB } from './data.js';

export class UIManager {
    constructor() {
        // Cachear elementos do DOM no construtor melhora performance
        this.els = {
            pHp: document.getElementById('p-hp-fill'),
            mHp: document.getElementById('m-hp-fill'),
            hand: document.getElementById('player-hand'),
            // ... outros elementos
        };
    }

    updateStats(player, monster) {
        // Atualiza barras de vida, textos de nível, etc.
        this.els.pHp.style.width = (player.hp / player.maxHp * 100) + '%';
        this.els.mHp.style.width = (monster.hp / monster.maxHp * 100) + '%';
        // ...
    }

    renderHand(handArray, onCardClick) {
        this.els.hand.innerHTML = '';
        handArray.forEach((key, index) => {
            const cardEl = this._createCardElement(key);
            cardEl.onclick = () => onCardClick(index); // Callback para o Main
            this.els.hand.appendChild(cardEl);
        });
    }

    animateCombat(pCard, mCard, callback) {
        // Sua lógica complexa de animateFly vai aqui
        // Quando terminar animação -> chama callback
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    _createCardElement(key) {
        // Cria a DIV da carta, adiciona classes CSS, tooltips, tilt 3D...
        const div = document.createElement('div');
        // ...
        return div;
    }
}
