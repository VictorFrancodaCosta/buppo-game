import { ACTION_KEYS } from './data.js?v=2026.07.10.3';

export function validateMoveSubmission(matchData, uid, card, disarmTarget = null) {
    if(!matchData || !uid) throw new Error('MATCH_STATE_INVALID');
    const role = matchData.player1?.uid === uid ? 'player1' : (matchData.player2?.uid === uid ? 'player2' : null);
    if(!role || matchData.status !== 'playing') throw new Error('MATCH_STATE_INVALID');
    if(!ACTION_KEYS.includes(card)) throw new Error('MOVE_NOT_ALLOWED');
    const player = matchData[role];
    if(!Array.isArray(player?.hand) || !player.hand.includes(card) || player.disabled === card) throw new Error('MOVE_NOT_ALLOWED');
    if(card === 'DESARMAR' && !ACTION_KEYS.includes(disarmTarget)) throw new Error('DISARM_TARGET_INVALID');
    if(card !== 'DESARMAR' && disarmTarget !== null) throw new Error('DISARM_TARGET_INVALID');
    const moveField = role === 'player1' ? 'p1Move' : 'p2Move';
    const disarmField = role === 'player1' ? 'p1Disarm' : 'p2Disarm';
    if(matchData[moveField]) throw new Error('MOVE_ALREADY_SUBMITTED');
    return { role, moveField, disarmField };
}

export function isSameTurnSnapshot(current, expected) {
    if(!current || !expected) return false;
    return (Number(current.turn) || 1) === (Number(expected.turn) || 1)
        && current.p1Move === expected.p1Move
        && current.p2Move === expected.p2Move;
}
