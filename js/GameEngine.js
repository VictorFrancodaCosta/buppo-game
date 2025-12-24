// js/GameEngine.js
import { DECK_TEMPLATE, CARDS_DB } from './data.js';

export class GameEngine {
    constructor(callbacks) {
        // callbacks = { onDamage, onHeal, onTurnEnd, onGameOver, etc... }
        this.callbacks = callbacks || {}; 
        
        this.player = this._createUnit('p', 'Você');
        this.monster = this._createUnit('m', 'Monstro');
        this.turnCount = 1;
        this.history = [];
    }

    _createUnit(id, name) {
        return { 
            id, name, hp: 6, maxHp: 6, lvl: 1, 
            hand: [], deck: [], xp: [], 
            disabled: null, bonusBlock: 0, bonusAtk: 0 
        };
    }

    startGame() {
        this.turnCount = 1;
        this._resetUnit(this.player);
        this._resetUnit(this.monster);
        this._drawCards(this.player, 6);
        this._drawCards(this.monster, 6);
        // Avisa a UI para desenhar
        if(this.callbacks.onStateUpdate) this.callbacks.onStateUpdate(this.player, this.monster);
    }

    playTurn(playerCardIndex, playerExtraChoice) {
        // 1. Lógica de retirar carta da mão
        const pCardKey = this.player.hand.splice(playerCardIndex, 1)[0];
        
        // 2. IA decide
        const aiMove = this._getBestAIMove(); 
        const mCardKey = aiMove.card; 
        // remove da mão do monstro...

        // 3. Resolve Combate (Math Only)
        const result = this._resolveCombatMath(pCardKey, mCardKey);
        
        // 4. Aplica Danos
        this.player.hp -= result.pDmg;
        this.monster.hp -= result.mDmg;

        // 5. Avisa UI sobre o que aconteceu (Eventos)
        if(this.callbacks.onTurnResolved) {
            this.callbacks.onTurnResolved({
                pCard: pCardKey,
                mCard: mCardKey,
                result: result,
                newState: { p: this.player, m: this.monster }
            });
        }

        // 6. Checa Fim de Jogo
        if (this.player.hp <= 0 || this.monster.hp <= 0) {
            if(this.callbacks.onGameOver) this.callbacks.onGameOver(this.player.hp > 0);
        }
    }

    _resolveCombatMath(pAct, mAct) {
        let pDmg = 0, mDmg = 0;
        // ... Copie sua lógica de IFs/Dano aqui ...
        // Retorne apenas os valores:
        return { pDmg, mDmg, clash: false };
    }

    _getBestAIMove() {
        // ... Sua lógica de IA aqui ...
        // Retorna { card: 'ATAQUE', index: 0 }
    }

    _resetUnit(u) { /* Lógica de reset e embaralhar deck */ }
    _drawCards(u, qtd) { /* Lógica de comprar cartas */ }
}
