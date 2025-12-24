import { DECK_TEMPLATE } from './data.js';

export class GameEngine {
    constructor() {
        // Estado inicial vazio
        this.player = this._createUnit('p', 'Você');
        this.monster = this._createUnit('m', 'Monstro');
        this.turnCount = 1;
        this.history = []; // Histórico de jogadas do player (para a IA)
        this.isGameOver = false;
    }

    // --- CONFIGURAÇÃO INICIAL ---

    // Cria a estrutura básica de uma unidade
    _createUnit(id, name) {
        return { 
            id, 
            name, 
            hp: 6, 
            maxHp: 6, 
            lvl: 1, 
            hand: [], 
            deck: [], 
            xp: [], 
            disabled: null, // Carta bloqueada (Desarmar)
            bonusBlock: 0, 
            bonusAtk: 0 
        };
    }

    // Reinicia a partida
    startMatch() {
        this.turnCount = 1;
        this.history = [];
        this.isGameOver = false;
        
        this._resetUnitState(this.player);
        this._resetUnitState(this.monster);

        // Compra mão inicial (6 cartas)
        this.drawCards(this.player, 6);
        this.drawCards(this.monster, 6);

        return {
            player: this.player,
            monster: this.monster,
            turn: this.turnCount
        };
    }

    _resetUnitState(u) {
        u.hp = 6; u.maxHp = 6; u.lvl = 1;
        u.xp = []; u.hand = []; u.deck = [];
        u.disabled = null; u.bonusBlock = 0; u.bonusAtk = 0;
        
        // Reconstrói o deck
        for(let k in DECK_TEMPLATE) {
            for(let i=0; i<DECK_TEMPLATE[k]; i++) u.deck.push(k);
        }
        this._shuffle(u.deck);
    }

    // --- LÓGICA DE TURNO ---

    /**
     * Executa um turno completo.
     * @param {number} playerCardIndex - Índice da carta na mão do jogador.
     * @param {string|null} playerDisarmChoice - Se jogou DESARMAR, qual ação bloquear no inimigo.
     */
    playTurn(playerCardIndex, playerDisarmChoice = null) {
        if (this.isGameOver) return null;

        // 1. Jogador joga carta
        if (!this.player.hand[playerCardIndex]) return null;
        const pCard = this.player.hand.splice(playerCardIndex, 1)[0];
        this.history.push(pCard);

        // 2. IA decide e joga carta
        const aiMove = this._getBestAIMove();
        let mCard = 'ATAQUE'; // Fallback
        
        if (aiMove) {
            mCard = aiMove.card;
            this.monster.hand.splice(aiMove.index, 1);
        } else {
            // Se o monstro não tiver cartas (erro de borda), compra 1 e joga
            if (this.monster.hand.length === 0) this.drawCards(this.monster, 1);
            if (this.monster.hand.length > 0) mCard = this.monster.hand.pop();
        }

        // 3. IA escolhe alvo do Desarmar (se ela usou Desarmar)
        let mDisarmTarget = null;
        if (mCard === 'DESARMAR') {
            mDisarmTarget = this._getAIDisarmTarget();
        }

        // 4. Resolve o Combate Matemático
        const result = this._resolveCombat(pCard, mCard, playerDisarmChoice, mDisarmTarget);

        // 5. Aplica os resultados no Estado
        this.player.hp -= result.pDmgTaken;
        this.monster.hp -= result.mDmgTaken;
        
        // Cura
        if (result.pHeal > 0) this.player.hp = Math.min(this.player.maxHp, this.player.hp + result.pHeal);
        if (result.mHeal > 0) this.monster.hp = Math.min(this.monster.maxHp, this.monster.hp + result.mHeal);

        // Bloqueios para o próximo turno
        this.player.disabled = result.nextPlayerDisabled;
        this.monster.disabled = result.nextMonsterDisabled;

        // 6. Processa XP (Treinar ou Bônus)
        const pXPGains = this._processXPEvents(this.player, pCard, mCard, result);
        const mXPGains = this._processXPEvents(this.monster, mCard, pCard, result, true); // true = invertido

        // 7. Checa Level Up
        const pLevelUp = this._checkLevelUp(this.player);
        const mLevelUp = this._checkLevelUp(this.monster);

        // 8. Checa Fim de Jogo
        if (this.player.hp <= 0 || this.monster.hp <= 0) {
            this.isGameOver = true;
        } else {
            // Prepara próximo turno se ninguém morreu
            if(pLevelUp) {
                 this.drawCards(this.player, 1); // Draw extra pós level up (simplificado)
                 // Nota: Reset de deck ocorre dentro do _checkLevelUp se necessário
            }
            if(mLevelUp) {
                 this.drawCards(this.monster, 1);
            }
            
            // Compra carta normal de turno
            if (!pLevelUp) this.drawCards(this.player, 1);
            if (!mLevelUp) this.drawCards(this.monster, 1);
            
            this.turnCount++;
        }

        return {
            pCard, mCard,
            result,
            playerState: this.player,
            monsterState: this.monster,
            isGameOver: this.isGameOver,
            events: {
                pLevelUp,
                mLevelUp,
                pXPGained: pXPGains,
                mXPGained: mXPGains
            }
        };
    }

    // --- CÁLCULOS DE COMBATE (Puro Math) ---

    _resolveCombat(pAct, mAct, pDisarmChoice, mDisarmTarget) {
        let pDmgRaw = 0; // Dano que o player CAUSA
        let mDmgRaw = 0; // Dano que o monstro CAUSA

        // Cálculo Base
        if (pAct === 'ATAQUE') pDmgRaw += this.player.lvl;
        if (mAct === 'ATAQUE') mDmgRaw += this.monster.lvl;

        // Cálculo Bloqueio/Refletir
        let pDmgTaken = 0;
        let mDmgTaken = 0;
        let clash = false;

        // Player defende?
        if (pAct === 'BLOQUEIO') {
            if (mAct === 'ATAQUE') {
                // Bloqueio com sucesso (Reflete dano)
                pDmgRaw += (1 + this.player.bonusBlock); // Player causa dano refletido
                clash = true;
            }
            // Se bloqueou, não toma dano (a menos que seja algo imparável no futuro)
        } else {
            // Se não bloqueou, toma o dano que o monstro causou
            pDmgTaken = mDmgRaw;
        }

        // Monstro defende?
        if (mAct === 'BLOQUEIO') {
            if (pAct === 'ATAQUE') {
                mDmgRaw += (1 + this.monster.bonusBlock); // Monstro causa dano refletido
                clash = true;
            }
            mDmgTaken = 0; // Monstro anulou ataque
        } else {
            mDmgTaken = pDmgRaw;
        }

        // Lógica de Desarmar (Define quem fica bloqueado no PRÓXIMO turno)
        let nextPlayerDisabled = null;
        let nextMonsterDisabled = null;

        if (mAct === 'DESARMAR') nextPlayerDisabled = mDisarmTarget || 'ATAQUE';
        if (pAct === 'DESARMAR') nextMonsterDisabled = pDisarmChoice;

        // Colisão de Desarme (Anula ambos)
        if (pAct === 'DESARMAR' && mAct === 'DESARMAR') {
            nextPlayerDisabled = null;
            nextMonsterDisabled = null;
        }

        // Lógica de Cura (Descansar)
        let pHeal = 0;
        let mHeal = 0;

        if (pAct === 'DESCANSAR') pHeal = (pDmgTaken === 0) ? 3 : 2; // Bônus se não tomou dano
        if (mAct === 'DESCANSAR') mHeal = (mDmgTaken === 0) ? 3 : 2;

        return {
            pDmgTaken,
            mDmgTaken,
            pHeal,
            mHeal,
            clash,
            nextPlayerDisabled,
            nextMonsterDisabled
        };
    }

    // --- GERENCIAMENTO DE XP E NÍVEL ---

    _processXPEvents(unit, myCard, oppCard, result, isEnemy = false) {
        let cardsGained = [];
        
        // 1. Ganha a própria carta jogada (se estiver vivo)
        // Nota: No original isso era assíncrono. Aqui definimos que ganha.
        if (unit.hp > 0) {
            unit.xp.push(myCard);
            cardsGained.push(myCard);
        }

        // 2. Bônus da carta TREINAR (Ganha carta do topo do deck)
        if (unit.hp > 0 && myCard === 'TREINAR' && unit.deck.length > 0) {
            const extra = unit.deck.pop();
            unit.xp.push(extra);
            cardsGained.push(extra);
        }

        // 3. Bônus de ATAQUE vs DESCANSAR (Punição)
        // Se EU ataquei e o OPONENTE descansou -> Ganho XP extra
        if (unit.hp > 0 && myCard === 'ATAQUE' && oppCard === 'DESCANSAR' && unit.deck.length > 0) {
            const extra = unit.deck.pop();
            unit.xp.push(extra);
            cardsGained.push(extra);
        }

        return cardsGained;
    }

    _checkLevelUp(unit) {
        if (unit.xp.length >= 5) {
            // Processa Maestrias (Simplificado para o Engine não depender de UI)
            this._autoProcessMasteries(unit);
            
            unit.lvl++;
            
            // Recicla XP de volta pro Deck
            unit.xp.forEach(x => unit.deck.push(x));
            unit.xp = [];
            this._shuffle(unit.deck);
            
            return true;
        }
        return false;
    }

    // Simplificação das Maestrias para rodar sem Modals UI por enquanto
    _autoProcessMasteries(unit) {
        const counts = {};
        unit.xp.forEach(x => counts[x] = (counts[x]||0)+1);
        
        for (let k in counts) {
            if (counts[k] >= 3) {
                // Aplica bônus direto
                if (k === 'ATAQUE') {
                    unit.bonusAtk++;
                    // O dano imediato da maestria seria aplicado aqui, 
                    // mas para simplificar vamos deixar apenas o buff de status
                    // ou aplicar dano direto no oponente:
                    const target = (unit.id === 'p') ? this.monster : this.player;
                    target.hp -= unit.bonusAtk; 
                }
                if (k === 'BLOQUEIO') unit.bonusBlock++;
                if (k === 'DESCANSAR') unit.maxHp++;
                
                // TREINAR e DESARMAR requerem escolhas complexas. 
                // Neste refactor inicial, vamos ignorar ou dar um bônus genérico (Heal)
                // para não quebrar o jogo sem a UI de Modal.
                if (k === 'TREINAR' || k === 'DESARMAR') {
                    unit.hp = Math.min(unit.hp + 2, unit.maxHp);
                }
            }
        }
    }

    // --- IA ---
    
    _getBestAIMove() {
        let moves = [];
        this.monster.hand.forEach((card, index) => {
            if (card !== this.monster.disabled) {
                moves.push({ card, index, score: 0 });
            }
        });

        if (moves.length === 0) return null;

        // Lógica copiada e adaptada do original
        let recentHistory = this.history.slice(-5);
        let attackCount = recentHistory.filter(c => c === 'ATAQUE').length;
        let playerAggro = recentHistory.length > 0 ? (attackCount / recentHistory.length) : 0.5;

        let threatLvl = this.player.lvl + this.player.bonusAtk;
        let amIDying = this.monster.hp <= threatLvl;
        let myDmg = this.monster.lvl + this.monster.bonusAtk;
        let canKill = this.player.hp <= myDmg;

        moves.forEach(m => {
            let score = 50;
            if (m.card === 'ATAQUE') {
                if (canKill) score += 500;
                if (playerAggro < 0.4) score += 40;
                if (amIDying) score -= 30;
            } else if (m.card === 'BLOQUEIO') {
                if (amIDying) score += 100;
                if (playerAggro > 0.6) score += 60;
                if (threatLvl >= 3) score += 40;
            } else if (m.card === 'DESCANSAR') {
                if (this.monster.hp === this.monster.maxHp) score -= 100;
                else if (this.monster.hp <= 3) score += 50;
                if (playerAggro > 0.7) score -= 40;
            } else if (m.card === 'DESARMAR') {
                if (amIDying) score += 120;
                if (playerAggro > 0.8) score += 50;
            } else if (m.card === 'TREINAR') {
                if (this.turnCount < 5) score += 30;
                if (amIDying || this.monster.hp <= 3) score -= 200;
            }
            m.score = score + Math.random() * 15;
        });

        moves.sort((a, b) => b.score - a.score);
        return moves[0];
    }

    _getAIDisarmTarget() {
        // IA escolhe o que bloquear no player
        if (this.player.hp <= (this.monster.lvl + this.monster.bonusAtk + 2)) {
            return 'BLOQUEIO'; // Tenta impedir player de se defender se puder matar
        }
        
        // Bloqueia o que o player mais usa no XP atual
        let pCounts = {};
        this.player.xp.forEach(x => pCounts[x] = (pCounts[x]||0)+1);
        let bestTarget = null;
        for(let k in pCounts) if(pCounts[k] >= 3) bestTarget = k;
        
        return bestTarget || 'ATAQUE';
    }

    // --- UTILITÁRIOS ---

    drawCards(unit, qty) {
        for (let i = 0; i < qty; i++) {
            if (unit.deck.length > 0) unit.hand.push(unit.deck.pop());
        }
        unit.hand.sort();
    }

    _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
