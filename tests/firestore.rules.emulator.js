import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

const projectId = 'buppo-game-rules-test';
let environment;

function database(uid) {
    return environment.authenticatedContext(uid, { email: `${uid}@example.test` }).firestore();
}

async function seed(path, value) {
    await environment.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), path), value);
    });
}

before(async () => {
    const rules = await readFile('firestore.rules', 'utf8');
    const [host, rawPort] = String(process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
    environment = await initializeTestEnvironment({
        projectId,
        firestore: { host, port: Number(rawPort), rules }
    });
});

beforeEach(async () => environment.clearFirestore());
after(async () => environment?.cleanup());

test('nega todo acesso anônimo a jogadores', async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'players/u1')));
    await assertFails(setDoc(doc(db, 'players/u1'), { name: 'Intruso' }));
});

test('jogador cria e atualiza o próprio perfil, mas não o perfil alheio', async () => {
    const db = database('u1');
    await assertSucceeds(setDoc(doc(db, 'players/u1'), { name: 'U1', friends: [], goldCoins: 0 }));
    await assertSucceeds(updateDoc(doc(db, 'players/u1'), { goldCoins: 10 }));
    await assertFails(setDoc(doc(db, 'players/u2'), { name: 'U2', friends: [] }));
});

test('ranking autenticado pode ler perfis, mas histórico permanece privado', async () => {
    await seed('players/u2', { name: 'U2', friends: [], goldCoins: 4 });
    await seed('players/u2/history/h1', { result: 'WIN' });
    const db = database('u1');
    await assertSucceeds(getDoc(doc(db, 'players/u2')));
    await assertFails(getDoc(doc(db, 'players/u2/history/h1')));
});

test('amizade permite somente adicionar ou remover o próprio uid no outro perfil', async () => {
    await seed('players/u1', { name: 'U1', friends: ['u2'] });
    await seed('players/u2', { name: 'U2', friends: [] });
    const u1 = database('u1');
    const u3 = database('u3');
    await assertSucceeds(updateDoc(doc(u1, 'players/u2'), { friends: ['u1'] }));
    await assertFails(updateDoc(doc(u3, 'players/u2'), { friends: ['u1', 'u3', 'outro'] }));
});

test('ids públicos não podem ser sequestrados por outro jogador', async () => {
    const u1 = database('u1');
    const u2 = database('u2');
    await assertSucceeds(setDoc(doc(u1, 'playerIds/ABCD'), { uid: 'u1' }));
    await assertFails(updateDoc(doc(u2, 'playerIds/ABCD'), { uid: 'u2' }));
});

test('fila e criação de partida funcionam apenas em lote para participantes', async () => {
    await seed('queue/q1', { uid: 'u1', status: 'waiting', matchId: null, cancelled: false });
    await seed('queue/q2', { uid: 'u2', status: 'waiting', matchId: null, cancelled: false });
    const db = database('u1');
    const batch = writeBatch(db);
    batch.set(doc(db, 'matches/m1'), {
        status: 'playing',
        player1: { uid: 'u1' },
        player2: { uid: 'u2' }
    });
    batch.update(doc(db, 'queue/q1'), { matchId: 'm1', status: 'matched' });
    batch.update(doc(db, 'queue/q2'), { matchId: 'm1', status: 'matched' });
    await assertSucceeds(batch.commit());
    await assert.equal((await getDoc(doc(db, 'matches/m1'))).exists(), true);
});

test('dono pode cancelar a própria fila e usuários autenticados podem consultar candidatos', async () => {
    await seed('queue/q1', { uid: 'u1', status: 'waiting', matchId: null, cancelled: false });
    const u1 = database('u1');
    const u2 = database('u2');
    await assertSucceeds(updateDoc(doc(u1, 'queue/q1'), { status: 'cancelled', cancelled: true }));
    await assertSucceeds(getDocs(collection(u2, 'queue')));
});

test('terceiros não leem nem alteram partidas alheias', async () => {
    await seed('matches/m1', { status: 'playing', player1: { uid: 'u1' }, player2: { uid: 'u2' } });
    const outsider = database('u3');
    await assertFails(getDoc(doc(outsider, 'matches/m1')));
    await assertFails(updateDoc(doc(outsider, 'matches/m1'), { p1Move: 'ATAQUE' }));
});

test('identidades dos participantes não podem mudar durante a partida', async () => {
    await seed('matches/m1', { status: 'playing', player1: { uid: 'u1' }, player2: { uid: 'u2' } });
    const db = database('u1');
    await assertFails(updateDoc(doc(db, 'matches/m1'), { player2: { uid: 'u3' } }));
});

test('participantes enviam jogadas, publicam estado, abandonam e solicitam revanche', async () => {
    await seed('matches/m1', {
        status: 'playing',
        player1: { uid: 'u1', hand: ['ATAQUE'], hp: 6 },
        player2: { uid: 'u2', hand: ['BLOQUEIO'], hp: 6 }
    });
    const u1 = database('u1');
    const u2 = database('u2');
    await assertSucceeds(updateDoc(doc(u1, 'matches/m1'), { p1Move: 'ATAQUE', p1Disarm: null }));
    await assertSucceeds(updateDoc(doc(u2, 'matches/m1'), { p2Move: 'BLOQUEIO', p2Disarm: null }));
    await assertSucceeds(updateDoc(doc(u1, 'matches/m1'), {
        player1: { uid: 'u1', hand: ['TREINAR'], hp: 5 },
        player2: { uid: 'u2', hand: ['DESCANSAR'], hp: 6 },
        p1Move: null,
        p2Move: null
    }));
    await assertSucceeds(updateDoc(doc(u2, 'matches/m1'), { player2Rematch: true }));
    await assertSucceeds(updateDoc(doc(u2, 'matches/m1'), { status: 'abandoned', abandonedBy: 'u2' }));
});

test('liquidação é criada uma vez e nunca pode ser alterada ou removida', async () => {
    await seed('players/u1', { name: 'U1', friends: [] });
    const db = database('u1');
    const ref = doc(db, 'players/u1/settlements/m1');
    await assertSucceeds(setDoc(ref, { result: 'WIN', goldDelta: 3 }));
    await assertFails(updateDoc(ref, { goldDelta: 999 }));
});

test('histórico pode ser criado e consultado somente pelo dono', async () => {
    await seed('players/u1', { name: 'U1', friends: [] });
    const u1 = database('u1');
    const u2 = database('u2');
    await assertSucceeds(setDoc(doc(u1, 'players/u1/history/h1'), { result: 'WIN', timestamp: 1 }));
    await assertSucceeds(getDocs(collection(u1, 'players/u1/history')));
    await assertFails(getDocs(collection(u2, 'players/u1/history')));
});

test('solicitações e convites ficam restritos aos dois participantes', async () => {
    const u1 = database('u1');
    const u3 = database('u3');
    await assertSucceeds(setDoc(doc(u1, 'friendRequests/r1'), { fromUid: 'u1', toUid: 'u2', status: 'pending' }));
    await assertFails(getDoc(doc(u3, 'friendRequests/r1')));
    const u2 = database('u2');
    await assertSucceeds(getDocs(query(collection(u2, 'friendRequests'), where('toUid', '==', 'u2'), where('status', '==', 'pending'))));
    await assertSucceeds(updateDoc(doc(u2, 'friendRequests/r1'), { status: 'accepted' }));
    await assertSucceeds(setDoc(doc(u1, 'friendInvites/i1'), { fromUid: 'u1', toUid: 'u2', status: 'pending' }));
    await assertSucceeds(getDocs(query(collection(u2, 'friendInvites'), where('toUid', '==', 'u2'), where('status', '==', 'pending'))));
    await assertSucceeds(updateDoc(doc(u2, 'friendInvites/i1'), { status: 'accepted' }));
    await assertFails(updateDoc(doc(u3, 'friendInvites/i1'), { status: 'accepted' }));
});
