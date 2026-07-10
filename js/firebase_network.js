import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, setDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { safeDisplayName, safeIdentifier, safeInteger } from './security.js?v=2026.07.10.3';

export const FIRESTORE_SCHEMA_VERSION = 1;

const firebaseConfig = {
    apiKey: "AIzaSyCVLhOcKqF6igMGRmOWO_GEY9O4gz892Fo",
    authDomain: "buppo-game.firebaseapp.com",
    projectId: "buppo-game",
    storageBucket: "buppo-game.firebasestorage.app",
    messagingSenderId: "950871979140",
    appId: "1:950871979140:web:f2dba12900500c52053ed1"
};

export let app, auth, db, provider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    console.log("Firebase Web Iniciado.");
} catch (e) {
    console.error("Erro Firebase (Modo Offline):", e);
}

export async function loginWithGoogle() {
    return await signInWithPopup(auth, provider);
}

export async function logoutGoogle() {
    await signOut(auth);
}

export async function saveMatchHistoryDB(currentUser, enemyName, gameMode, currentDeck, pointsChange, result = null, details = {}) {
    if (!currentUser) return;
    try {
        const historyRef = collection(db, "players", currentUser.uid, "history");
        const historyData = {
            result: result || (pointsChange < 0 ? 'LOSS' : (pointsChange === 1 ? 'TIE' : 'WIN')),
            opponent: safeDisplayName(enemyName, 'OPONENTE'),
            mode: gameMode || 'pve',
            deck: currentDeck,
            points: Number(pointsChange) || 0,
            ...details,
            timestamp: Date.now(),
            createdAt: serverTimestamp(),
            schemaVersion: FIRESTORE_SCHEMA_VERSION
        };
        const settlementId = safeIdentifier(details.settlementId);
        if(settlementId) await setDoc(doc(historyRef, settlementId), historyData);
        else await addDoc(historyRef, historyData);
        console.log("Histórico salvo para oponente:", enemyName);
    } catch (e) { 
        console.error("Erro ao salvar histórico:", e); 
    }
}

export async function registrarVitoriaDB(currentUser, gameMode, bonusGold = 0, stolenGold = 0, settlementId = null) {
    if(!currentUser) return { points: 0, gold: 0, xpGained: 0, profileLevel: 1, profileXp: 0 };
    try {
        const userRef = doc(db, "players", currentUser.uid);
        let moedasGanhas = Math.max(0, bonusGold || 0) + Math.max(0, stolenGold || 0);
        const xpGained = (gameMode === 'pvp') ? 16 : 5;
        const safeSettlementId = safeIdentifier(settlementId);
        const settlementRef = safeSettlementId && globalThis.BUPPO_ENABLE_SETTLEMENT_LEDGER === true ? doc(db, "players", currentUser.uid, "settlements", safeSettlementId) : null;
        return await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            const settlementSnap = settlementRef ? await transaction.get(settlementRef) : null;
            if(!userSnap.exists()) return { points: 0, gold: 0, xpGained: 0, profileLevel: 1, profileXp: 0, totalGold: 0, totalWins: 0 };
            const data = userSnap.data();
            const processedSettlements = Array.isArray(data.processedSettlements) ? data.processedSettlements.filter(Boolean).slice(-49) : [];
            if((settlementSnap && settlementSnap.exists()) || (safeSettlementId && processedSettlements.includes(safeSettlementId))) {
                return { points: 0, gold: 0, xpGained: 0, profileLevel: Math.max(1, data.profileLevel || 1), profileXp: Math.max(0, data.profileXp || 0), totalGold: Math.max(0, data.goldCoins || 0), totalWins: Math.max(0, data.totalWins || 0), duplicate: true };
            }
            let profileLevel = safeInteger(data.profileLevel, 1, 1, 9999);
            let profileXp = safeInteger(data.profileXp, 0, 0) + xpGained;
            while(profileXp >= 100) {
                profileXp -= 100;
                profileLevel += 1;
            }
            const totalWins = Math.max(0, Number(data.totalWins) || 0) + 1;
            const totalGold = Math.max(0, Number(data.goldCoins) || 0) + moedasGanhas;
            const result = { points: 0, gold: moedasGanhas, xpGained, profileLevel, profileXp, totalGold, totalWins };
            transaction.update(userRef, {
                totalWins,
                goldCoins: totalGold,
                profileLevel,
                profileXp,
                schemaVersion: FIRESTORE_SCHEMA_VERSION,
                updatedAt: serverTimestamp(),
                ...(safeSettlementId ? { processedSettlements: [...processedSettlements, safeSettlementId] } : {})
            });
            if(settlementRef) transaction.set(settlementRef, { settlementId: safeSettlementId, result: 'WIN', mode: gameMode || 'pve', goldDelta: moedasGanhas, xpDelta: xpGained, createdAt: serverTimestamp(), schemaVersion: FIRESTORE_SCHEMA_VERSION });
            return result;
        });
    } catch(e) { 
        console.error("Erro ao registrar vitoria:", e); 
        return { points: 0, gold: 0, xpGained: 0, profileLevel: 1, profileXp: 0 }; 
    }
}

export async function registrarDerrotaDB(currentUser, gameMode, goldLost = 0, settlementId = null) {
    if(!currentUser) return { points: 0, goldLost: 0 };
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const safeSettlementId = safeIdentifier(settlementId);
        const settlementRef = safeSettlementId && globalThis.BUPPO_ENABLE_SETTLEMENT_LEDGER === true ? doc(db, "players", currentUser.uid, "settlements", safeSettlementId) : null;
        return await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            const settlementSnap = settlementRef ? await transaction.get(settlementRef) : null;
            if(!userSnap.exists()) return { points: 0, goldLost: 0, totalGold: 0 };
            const data = userSnap.data();
            const processedSettlements = Array.isArray(data.processedSettlements) ? data.processedSettlements.filter(Boolean).slice(-49) : [];
            if((settlementSnap && settlementSnap.exists()) || (safeSettlementId && processedSettlements.includes(safeSettlementId))) {
                return { points: 0, goldLost: 0, totalGold: Math.max(0, data.goldCoins || 0), duplicate: true };
            }
            const moedasPerdidas = Math.min(Math.max(0, data.goldCoins || 0), Math.max(0, goldLost || 0));
            const totalGold = Math.max(0, (data.goldCoins || 0) - moedasPerdidas);
            const result = { points: 0, goldLost: moedasPerdidas, totalGold };
            transaction.update(userRef, { goldCoins: totalGold, schemaVersion: FIRESTORE_SCHEMA_VERSION, updatedAt: serverTimestamp(), ...(safeSettlementId ? { processedSettlements: [...processedSettlements, safeSettlementId] } : {}) });
            if(settlementRef) transaction.set(settlementRef, { settlementId: safeSettlementId, result: 'LOSS', mode: gameMode || 'pve', goldDelta: -moedasPerdidas, xpDelta: 0, createdAt: serverTimestamp(), schemaVersion: FIRESTORE_SCHEMA_VERSION });
            return result;
        });
    } catch(e) { 
        console.error("Erro ao registrar derrota:", e); 
        return { points: 0, goldLost: 0 }; 
    }
}

export async function registrarEmpateDB(currentUser, gameMode) {
    if(!currentUser) return 0;
    try {
        return 0;
    } catch(e) {
        console.error("Erro ao registrar empate:", e);
        return 0;
    }
}

export async function notifyAbandonmentDB(matchId, userId) {
    if (!matchId || !userId) return;
    try {
        await updateDoc(doc(db, "matches", matchId), {
            status: 'abandoned',
            abandonedBy: userId,
            updatedAt: serverTimestamp(),
            schemaVersion: FIRESTORE_SCHEMA_VERSION
        });
    } catch (e) { 
        console.error("Erro ao notificar abandono:", e); 
    }
}
