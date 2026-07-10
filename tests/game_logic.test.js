import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTION_KEYS, DECK_TEMPLATE } from '../js/data.js';
import { stringToSeed, shuffle, generateShuffledDeck, resetUnit, drawCardLogic, getBestAIMove, checkCardLethality } from '../js/game_logic.js';

test('a mesma semente produz o mesmo embaralhamento', () => {
    const first = [...ACTION_KEYS, ...ACTION_KEYS];
    const second = [...first];
    const seed = stringToSeed('partida-segura');
    shuffle(first, seed);
    shuffle(second, seed);
    assert.deepEqual(first, second);
});

test('o deck gerado preserva exatamente a composição oficial', () => {
    const deck = generateShuffledDeck();
    const expectedSize = Object.values(DECK_TEMPLATE).reduce((total, value) => total + value, 0);
    assert.equal(deck.length, expectedSize);
    for (const [card, amount] of Object.entries(DECK_TEMPLATE)) {
        assert.equal(deck.filter((value) => value === card).length, amount);
    }
});

test('comprar cartas nunca cria cartas quando o deck termina', () => {
    const unit = {};
    resetUnit(unit, ['ATAQUE', 'BLOQUEIO'], 'pve');
    drawCardLogic(unit, 6);
    assert.equal(unit.hand.length, 2);
    assert.equal(unit.deck.length, 0);
});

test('a IA nunca escolhe uma carta desabilitada', () => {
    const monster = { hand: ['ATAQUE', 'BLOQUEIO'], disabled: 'ATAQUE', hp: 6, maxHp: 6, lvl: 1, bonusAtk: 0 };
    const player = { hp: 6, lvl: 1, bonusAtk: 0 };
    const move = getBestAIMove(monster, player, [], 1);
    assert.equal(move.card, 'BLOQUEIO');
});

test('indicador de letalidade respeita dano atual sem alterar estado', () => {
    const player = { lvl: 3, bonusBlock: 1 };
    const monster = { hp: 2 };
    assert.equal(checkCardLethality('ATAQUE', player, monster), 'red');
    assert.equal(checkCardLethality('BLOQUEIO', player, monster), 'blue');
    assert.equal(monster.hp, 2);
});
