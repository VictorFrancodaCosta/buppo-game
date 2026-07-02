// ARQUIVO: js/matchmaking.js
import { db } from './firebase_network.js';
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { generateShuffledDeck } from './game_logic.js';

export let matchTimerInterval = null;
export let matchSeconds = 0;
export let myQueueRef = null;
export let queueListener = null;
export let searchInterval = null;

window.startPvE = function() { window.gameMode = 'pve'; window.playNavSound(); window.openDeckSelector(); };
window.startPvPSearch = function() { if (!window.currentUser) return; window.gameMode = 'pvp'; window.playNavSound(); window.openDeckSelector(); };

export async function initiateMatchmaking() {
    if(window.cleanupMatchState) window.cleanupMatchState();
    if(window.applyDeckTheme) window.applyDeckTheme(window.currentDeck);
    const mmScreen = document.getElementById('matchmaking-screen'); mmScreen.style.display = 'flex';
    if(window.updatePresence) window.updatePresence();
    document.querySelector('.mm-title').innerText = "PROCURANDO OPONENTE..."; document.querySelector('.mm-title').style.color = "var(--gold)";
    document.querySelector('.radar-spinner').style.borderColor = "rgba(255, 215, 0, 0.3)"; document.querySelector('.radar-spinner').style.animation = "spin 1s linear infinite"; document.querySelector('.cancel-btn').style.display = "block";
    matchSeconds = 0; const timerEl = document.getElementById('mm-timer'); timerEl.innerText = "00:00";
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    matchTimerInterval = setInterval(() => { matchSeconds++; let m = Math.floor(matchSeconds / 60).toString().padStart(2, '0'); let s = (matchSeconds % 60).toString().padStart(2, '0'); timerEl.innerText = `${m}:${s}`; }, 1000);

    try {
        myQueueRef = doc(collection(db, "queue"));
        const myData = { uid: window.currentUser.uid, name: window.currentUser.displayName, gameId: window.currentPlayerGameId || null, deck: window.currentDeck, equippedItems: window.getClassEquipmentByDeckType?.(window.currentDeck) || {}, timestamp: Date.now(), matchId: null, cancelled: false, status: 'waiting' };
        await setDoc(myQueueRef, myData);
        queueListener = onSnapshot(myQueueRef, (docSnap) => {
            if (docSnap.exists()) { const data = docSnap.data(); if (data.matchId) enterMatch(data.matchId); }
        });
        if (searchInterval) clearInterval(searchInterval);
        findOpponentInQueue();
        searchInterval = setInterval(() => {
            if (document.getElementById('matchmaking-screen').style.display === 'flex' && document.querySelector('.mm-title').innerText !== "PARTIDA ENCONTRADA!") {
                findOpponentInQueue();
            } else { clearInterval(searchInterval); }
        }, 4000);
    } catch (e) { window.cancelPvPSearch(); }
}

async function findOpponentInQueue() {
    try {
        const queueRef = collection(db, "queue");
        const q = query(queueRef, orderBy("timestamp", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        let opponentDoc = null; const now = Date.now();
        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            if (data.uid === window.currentUser.uid || data.matchId !== null || data.cancelled === true) continue;
            if (now - data.timestamp > 120000) continue;
            opponentDoc = docSnap; break;
        }
        if (opponentDoc) {
            if (searchInterval) clearInterval(searchInterval);
            const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            const oppRef = opponentDoc.ref;
            const p1DeckCards = generateShuffledDeck(); const p2DeckCards = generateShuffledDeck();
            await createMatchDocument(matchId, window.currentUser.uid, opponentDoc.data().uid, window.currentUser.displayName, opponentDoc.data().name, window.currentPlayerGameId || null, opponentDoc.data().gameId || null, window.currentDeck, opponentDoc.data().deck, window.getClassEquipmentByDeckType?.(window.currentDeck) || {}, window.getClassEquipmentByDeckType?.(opponentDoc.data().deck) || {}, p1DeckCards, p2DeckCards);
            await updateDoc(oppRef, { matchId: matchId });
            if (myQueueRef) await updateDoc(myQueueRef, { matchId: matchId });
        }
    } catch (e) { console.error("Erro ao buscar oponente:", e); }
}

async function createMatchDocument(matchId, p1Id, p2Id, p1Name, p2Name, p1GameId, p2GameId, p1DeckType, p2DeckType, p1EquippedItems, p2EquippedItems, p1DeckCards, p2DeckCards) {
    const matchRef = doc(db, "matches", matchId);
    const cleanName1 = p1Name ? p1Name.split(' ')[0].toUpperCase() : "JOGADOR 1"; const cleanName2 = p2Name ? p2Name.split(' ')[0].toUpperCase() : "JOGADOR 2";
    const d1Type = p1DeckType || 'knight'; const d2Type = p2DeckType || 'knight';
    const p1Hand = []; const p2Hand = [];
    for(let i = 0; i < 6; i++) {
        if(p1DeckCards.length > 0) p1Hand.push(p1DeckCards.pop());
        if(p2DeckCards.length > 0) p2Hand.push(p2DeckCards.pop());
    }
    p1Hand.sort(); p2Hand.sort();
    await setDoc(matchRef, {
        player1: { uid: p1Id, name: cleanName1, gameId: p1GameId || null, deckType: d1Type, equippedItems: window.getClassEquipmentByDeckType?.(d1Type) || { ...(p1EquippedItems || {}) }, hp: 6, status: 'selecting', hand: p1Hand, deck: p1DeckCards, xp: [] },
        player2: { uid: p2Id, name: cleanName2, gameId: p2GameId || null, deckType: d2Type, equippedItems: window.getClassEquipmentByDeckType?.(d2Type) || { ...(p2EquippedItems || {}) }, hp: 6, status: 'selecting', hand: p2Hand, deck: p2DeckCards, xp: [] },
        turn: 1, status: 'playing', createdAt: Date.now()
    });
}

window.cancelPvPSearch = async function() {
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    if (searchInterval) clearInterval(searchInterval);
    const mmScreen = document.getElementById('matchmaking-screen'); mmScreen.style.display = 'none';
    if(window.updatePresence) window.updatePresence();
    if (myQueueRef) { await updateDoc(myQueueRef, { cancelled: true }); myQueueRef = null; }
    if(window.transitionToLobby) window.transitionToLobby(true);
};

async function enterMatch(matchId) {
    if (queueListener) queueListener(); if (matchTimerInterval) clearInterval(matchTimerInterval);
    const matchRef = doc(db, "matches", matchId); const matchSnap = await getDoc(matchRef);
    if(matchSnap.exists()) {
        const data = matchSnap.data(); window.pvpStartData = data;
        if(data.player1.uid === window.currentUser.uid) window.myRole = 'player1'; else window.myRole = 'player2';
        const myDeckType = window.myRole === 'player1' ? data.player1.deckType : data.player2.deckType;
        if(window.applyDeckTheme) window.applyDeckTheme(myDeckType);
    }
    document.querySelector('.mm-title').innerText = "PARTIDA ENCONTRADA!"; document.querySelector('.mm-title').style.color = "#2ecc71";
    document.querySelector('.radar-spinner').style.borderColor = "#2ecc71"; document.querySelector('.radar-spinner').style.animation = "none"; document.querySelector('.cancel-btn').style.display = "none";
    setTimeout(() => { const mmScreen = document.getElementById('matchmaking-screen'); mmScreen.style.display = 'none'; window.currentMatchId = matchId; if(window.transitionToGame) window.transitionToGame(); }, 1500);
}
