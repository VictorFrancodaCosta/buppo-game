import test from 'node:test';
import assert from 'node:assert/strict';
import { isSameTurnSnapshot, validateMoveSubmission } from '../js/match_protocol.js';

function match(overrides = {}) {
    return {
        status: 'playing', turn: 2, p1Move: null, p2Move: null,
        player1: { uid: 'u1', hand: ['ATAQUE', 'DESARMAR'], disabled: null },
        player2: { uid: 'u2', hand: ['BLOQUEIO'], disabled: null },
        ...overrides
    };
}

test('protocolo aceita somente carta presente na mão do participante', () => {
    assert.deepEqual(validateMoveSubmission(match(), 'u1', 'ATAQUE'), { role: 'player1', moveField: 'p1Move', disarmField: 'p1Disarm' });
    assert.throws(() => validateMoveSubmission(match(), 'u1', 'TREINAR'), /MOVE_NOT_ALLOWED/);
    assert.throws(() => validateMoveSubmission(match(), 'intruso', 'ATAQUE'), /MATCH_STATE_INVALID/);
});

test('desarmar exige alvo oficial e jogada não pode ser repetida', () => {
    assert.doesNotThrow(() => validateMoveSubmission(match(), 'u1', 'DESARMAR', 'BLOQUEIO'));
    assert.throws(() => validateMoveSubmission(match(), 'u1', 'DESARMAR', 'INVALIDA'), /DISARM_TARGET_INVALID/);
    assert.throws(() => validateMoveSubmission(match({ p1Move: 'ATAQUE' }), 'u1', 'ATAQUE'), /MOVE_ALREADY_SUBMITTED/);
});

test('comparação de turno detecta resolução concorrente', () => {
    const expected = match({ p1Move: 'ATAQUE', p2Move: 'BLOQUEIO' });
    assert.equal(isSameTurnSnapshot({ ...expected }, expected), true);
    assert.equal(isSameTurnSnapshot({ ...expected, turn: 3 }, expected), false);
});
