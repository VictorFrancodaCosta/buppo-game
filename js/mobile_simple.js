import { CARDS_DB, ACTION_KEYS } from './data.js';
import { resetUnit, drawCardLogic, getBestAIMove, generateShuffledDeck } from './game_logic.js';

const MOBILE_ART = {
    ATAQUE: 'assets/img/mobile/card_attack.png',
    BLOQUEIO: 'assets/img/mobile/card_block.png',
    DESCANSAR: 'assets/img/mobile/card_rest.png',
    TREINAR: 'assets/img/mobile/card_train.png',
    DESARMAR: 'assets/img/mobile/card_disarm.png'
};

const player = { id: 'p', name: 'Voce', hp: 6, maxHp: 6, lvl: 1, hand: [], deck: [], xp: [], disabled: null, bonusBlock: 0, bonusAtk: 0 };
const monster = { id: 'm', name: 'IA', hp: 6, maxHp: 6, lvl: 1, hand: [], deck: [], xp: [], disabled: null, bonusBlock: 0, bonusAtk: 0 };

let turn = 1;
let history = [];
let processing = false;

function isMobileSimple() {
    return window.BUPPO_MOBILE_SIMPLE === true || new URLSearchParams(location.search).has('mobile');
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    document.getElementById('btn-config-toggle')?.style.setProperty('display', id === 'game-screen' ? 'flex' : 'none');
}

function hideLoading() {
    const loading = document.getElementById('loading-screen');
    if (!loading) return;
    loading.style.opacity = '0';
    loading.style.display = 'none';
}

function setupMobileShell() {
    window.BUPPO_MOBILE_SIMPLE = true;
    window.isMobileSimpleMode = true;
    document.documentElement.classList.add('mobile-simple');
    document.documentElement.classList.remove('force-landscape');
    document.body.classList.add('mobile-simple');
    document.body.classList.remove('force-landscape');
    const bg = document.getElementById('game-background');
    if (bg) bg.classList.remove('lobby-mode');
    hideLoading();
}

function clampHp(unit) {
    unit.hp = Math.max(0, Math.min(unit.maxHp, unit.hp));
}

function renderUnit(unit) {
    document.getElementById(`${unit.id}-lvl`).textContent = unit.lvl;
    document.getElementById(`${unit.id}-hp-txt`).textContent = `${unit.hp}/${unit.maxHp}`;
    const hpFill = document.getElementById(`${unit.id}-hp-fill`);
    if (hpFill) {
        const pct = (unit.hp / unit.maxHp) * 100;
        hpFill.style.width = `${pct}%`;
        hpFill.style.background = pct > 66 ? '#4cd137' : (pct > 33 ? '#fbc531' : '#e84118');
    }
    const deckCount = document.getElementById(`${unit.id}-deck-count`);
    if (deckCount) deckCount.textContent = unit.deck.length;

    const xp = document.getElementById(`${unit.id}-xp`);
    if (xp) {
        xp.innerHTML = '';
        unit.xp.forEach(cardKey => {
            const mini = document.createElement('div');
            mini.className = 'xp-mini';
            mini.style.backgroundImage = `url('${MOBILE_ART[cardKey] || CARDS_DB[cardKey].img}')`;
            xp.appendChild(mini);
        });
    }

    const mastery = document.getElementById(`${unit.id}-masteries`);
    if (mastery) {
        mastery.innerHTML = '';
        if (unit.bonusAtk > 0) mastery.appendChild(createMastery('A', unit.bonusAtk, '#e74c3c'));
        if (unit.bonusBlock > 0) mastery.appendChild(createMastery('B', unit.bonusBlock, '#00cec9'));
    }
}

function createMastery(label, value, color) {
    const el = document.createElement('div');
    el.className = 'mastery-icon';
    el.style.borderColor = color;
    el.innerHTML = `<span class="mastery-symbol">${label}</span><span class="mastery-lvl">${value}</span>`;
    return el;
}

function renderHand() {
    const hand = document.getElementById('player-hand');
    if (!hand) return;
    hand.innerHTML = '';
    hand.style.pointerEvents = processing ? 'none' : 'auto';
    player.hand.forEach((cardKey, index) => {
        const card = createCard(cardKey);
        card.classList.add('hand-card');
        if (player.disabled === cardKey) card.classList.add('disabled-card');
        card.onclick = () => chooseCard(index);
        hand.appendChild(card);
    });
}

function createCard(cardKey) {
    const card = document.createElement('div');
    card.className = `card ${CARDS_DB[cardKey]?.color || ''}`;
    card.innerHTML = `<div class="card-art" style="background-image: url('${MOBILE_ART[cardKey] || CARDS_DB[cardKey].img}')"></div>`;
    return card;
}

function render() {
    document.getElementById('turn-txt').innerHTML = `<span class="turn-label">TURNO ${turn}</span>`;
    renderUnit(player);
    renderUnit(monster);
    renderHand();
}

function showCue(text, color = '#ffd700') {
    const cue = document.createElement('div');
    cue.className = 'center-text';
    cue.textContent = text;
    cue.style.color = color;
    document.body.appendChild(cue);
    setTimeout(() => cue.remove(), 850);
}

function startGame() {
    setupMobileShell();
    turn = 1;
    history = [];
    processing = false;
    resetUnit(player, generateShuffledDeck(), 'pve');
    resetUnit(monster, generateShuffledDeck(), 'pve');
    drawCardLogic(player, 6);
    drawCardLogic(monster, 6);
    document.getElementById('end-screen')?.classList.remove('visible');
    document.getElementById('p-slot').innerHTML = '';
    document.getElementById('m-slot').innerHTML = '';
    showScreen('game-screen');
    render();
}

function chooseCard(index) {
    if (processing || !player.hand[index]) return;
    const cardKey = player.hand[index];
    if (player.disabled === cardKey) {
        showCue('CARTA BLOQUEADA', '#ff7675');
        return;
    }
    if (cardKey === 'DESARMAR') {
        const choice = window.prompt?.('Qual acao bloquear? ATAQUE, BLOQUEIO, DESCANSAR, TREINAR ou DESARMAR', 'ATAQUE') || 'ATAQUE';
        resolveTurn(index, ACTION_KEYS.includes(choice.toUpperCase()) ? choice.toUpperCase() : 'ATAQUE');
    } else {
        resolveTurn(index, null);
    }
}

function resolveTurn(playerIndex, disarmChoice) {
    processing = true;
    const pCard = player.hand.splice(playerIndex, 1)[0];
    const ai = getBestAIMove(monster, player, history, turn) || { index: 0, card: monster.hand[0] };
    const mCard = monster.hand.splice(ai.index, 1)[0];
    const mDisarmChoice = mCard === 'DESARMAR' ? 'ATAQUE' : null;

    document.getElementById('p-slot').innerHTML = '';
    document.getElementById('m-slot').innerHTML = '';
    document.getElementById('p-slot').appendChild(createCard(pCard));
    document.getElementById('m-slot').appendChild(createCard(mCard));

    setTimeout(() => {
        applyCombat(pCard, mCard, disarmChoice, mDisarmChoice);
        history.push(pCard);
        afterTurn(pCard, mCard);
    }, 420);
}

function applyCombat(pCard, mCard, pDisarm, mDisarm) {
    const pBlocks = pCard === 'BLOQUEIO';
    const mBlocks = mCard === 'BLOQUEIO';
    const pAttacks = pCard === 'ATAQUE';
    const mAttacks = mCard === 'ATAQUE';

    if (pAttacks && !mBlocks) monster.hp -= player.lvl + player.bonusAtk;
    if (mAttacks && !pBlocks) player.hp -= monster.lvl + monster.bonusAtk;
    if (pBlocks && mAttacks) monster.hp -= 1 + player.bonusBlock;
    if (mBlocks && pAttacks) player.hp -= 1 + monster.bonusBlock;

    if (pCard === 'DESCANSAR') player.hp += pAttacks ? 2 : 3;
    if (mCard === 'DESCANSAR') monster.hp += mAttacks ? 2 : 3;
    if (pCard === 'DESARMAR') monster.disabled = pDisarm;
    else monster.disabled = null;
    if (mCard === 'DESARMAR') player.disabled = mDisarm;
    else player.disabled = null;

    clampHp(player);
    clampHp(monster);
}

function afterTurn(pCard, mCard) {
    if (checkEnd()) return;
    player.xp.push(pCard);
    monster.xp.push(mCard);
    levelIfNeeded(player);
    levelIfNeeded(monster);
    drawCardLogic(player, 1);
    drawCardLogic(monster, 1);
    turn += 1;
    processing = false;
    render();
}

function levelIfNeeded(unit) {
    while (unit.xp.length >= 3) {
        const spent = unit.xp.splice(0, 3);
        unit.deck.unshift(...spent);
        unit.lvl += 1;
        unit.maxHp += 1;
        unit.hp = unit.maxHp;
        if (spent.includes('ATAQUE')) unit.bonusAtk += 1;
        if (spent.includes('BLOQUEIO')) unit.bonusBlock += 1;
        showCue('LEVEL UP!', '#ffd700');
    }
}

function checkEnd() {
    if (player.hp > 0 && monster.hp > 0) return false;
    render();
    const title = document.getElementById('end-title');
    const result = player.hp <= 0 && monster.hp <= 0 ? 'EMPATE' : (monster.hp <= 0 ? 'VITORIA' : 'DERROTA');
    if (title) {
        title.textContent = result;
        title.className = result === 'VITORIA' ? 'win-theme' : (result === 'EMPATE' ? 'tie-theme' : 'lose-theme');
    }
    document.getElementById('end-points')?.remove();
    document.getElementById('end-gold-reward')?.remove();
    document.getElementById('end-screen')?.classList.add('visible');
    processing = false;
    return true;
}

window.startMobileSimpleMatch = startGame;
window.restartMatch = startGame;
window.transitionToLobby = () => {
    setupMobileShell();
    document.getElementById('end-screen')?.classList.remove('visible');
    showScreen('start-screen');
};

if (isMobileSimple()) {
    setupMobileShell();
    showScreen('start-screen');
}
