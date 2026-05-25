import { DECK_TEMPLATE } from './data.js';

export function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

export function shuffle(array, seed = null) {
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

export function generateShuffledDeck() {
    let deck = [];
    for(let k in DECK_TEMPLATE) {
        for(let i = 0; i < DECK_TEMPLATE[k]; i++) deck.push(k);
    }
    shuffle(deck);
    return deck;
}

export function resetUnit(u, predefinedDeck = null, role = null) {
    u.hp = 6; 
    u.maxHp = 6; 
    u.lvl = 1; 
    u.xp = []; 
    u.hand = []; 
    u.originalRole = role || 'pve';
    
    if (predefinedDeck) {
        u.deck = [...predefinedDeck]; 
    } else {
        u.deck = generateShuffledDeck(); 
    }
    
    u.disabled = null; 
    u.bonusBlock = 0; 
    u.bonusAtk = 0; 
}

export function getBestAIMove(monster, player, playerHistory, turnCount) {
    let moves = []; 
    monster.hand.forEach((card, index) => { 
        if(card !== monster.disabled) {
            moves.push({ card: card, index: index, score: 0 }); 
        }
    });
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

export function checkCardLethality(cardKey, player, monster) { 
    if(cardKey === 'ATAQUE') { 
        let damage = player.lvl; 
        return damage >= monster.hp ? 'red' : false; 
    } 
    if(cardKey === 'BLOQUEIO') { 
        let reflect = 1 + player.bonusBlock; 
        return reflect >= monster.hp ? 'blue' : false; 
    } 
    return false; 
}
