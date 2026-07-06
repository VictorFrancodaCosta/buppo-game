import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
        await addDoc(historyRef, {
            result: result || (pointsChange < 0 ? 'LOSS' : (pointsChange === 1 ? 'TIE' : 'WIN')),
            opponent: enemyName,
            mode: gameMode || 'pve',
            deck: currentDeck,
            points: pointsChange,
            ...details,
            timestamp: Date.now()
        });
        console.log("Histórico salvo para oponente:", enemyName);
    } catch (e) { 
        console.error("Erro ao salvar histórico:", e); 
    }
}

export async function registrarVitoriaDB(currentUser, gameMode, bonusGold = 0, stolenGold = 0) {
    if(!currentUser) return { points: 0, gold: 0, xpGained: 0, profileLevel: 1, profileXp: 0 };
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        let moedasGanhas = Math.max(0, bonusGold || 0) + Math.max(0, stolenGold || 0);
        let xpGained = (gameMode === 'pvp') ? 16 : 5;
        let profileLevel = 1;
        let profileXp = 0;
        if(userSnap.exists()) {
            const data = userSnap.data();
            profileLevel = Math.max(1, data.profileLevel || 1);
            profileXp = Math.max(0, data.profileXp || 0) + xpGained;
            while(profileXp >= 100) {
                profileXp -= 100;
                profileLevel += 1;
            }
            await updateDoc(userRef, {
                totalWins: (data.totalWins || 0) + 1,
                goldCoins: (data.goldCoins || 0) + moedasGanhas,
                profileLevel,
                profileXp
            });
        }
        return { points: 0, gold: moedasGanhas, xpGained, profileLevel, profileXp };
    } catch(e) { 
        console.error("Erro ao registrar vitoria:", e); 
        return { points: 0, gold: 0, xpGained: 0, profileLevel: 1, profileXp: 0 }; 
    }
}

export async function registrarDerrotaDB(currentUser, gameMode, goldLost = 0) {
    if(!currentUser) return { points: 0, goldLost: 0 };
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        let moedasPerdidas = 0;
        if(userSnap.exists()) {
            const data = userSnap.data();
            moedasPerdidas = Math.min(Math.max(0, data.goldCoins || 0), Math.max(0, goldLost || 0));
            await updateDoc(userRef, {
                goldCoins: Math.max(0, (data.goldCoins || 0) - moedasPerdidas)
            });
        }
        return { points: 0, goldLost: moedasPerdidas };
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
            abandonedBy: userId
        });
    } catch (e) { 
        console.error("Erro ao notificar abandono:", e); 
    }
}
