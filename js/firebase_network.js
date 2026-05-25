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

export async function saveMatchHistoryDB(currentUser, enemyName, gameMode, currentDeck, pointsChange) {
    if (!currentUser) return;
    try {
        const historyRef = collection(db, "players", currentUser.uid, "history");
        await addDoc(historyRef, {
            result: pointsChange > 0 ? 'WIN' : 'LOSS',
            opponent: enemyName,
            mode: gameMode || 'pve',
            deck: currentDeck,
            points: pointsChange,
            timestamp: Date.now()
        });
        console.log("Histórico salvo para oponente:", enemyName);
    } catch (e) { 
        console.error("Erro ao salvar histórico:", e); 
    }
}

export async function registrarVitoriaDB(currentUser, gameMode) {
    if(!currentUser) return 0;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        let pontosGanhos = (gameMode === 'pvp') ? 8 : 1;
        if(userSnap.exists()) {
            const data = userSnap.data();
            await updateDoc(userRef, {
                totalWins: (data.totalWins || 0) + 1,
                score: (data.score || 0) + pontosGanhos
            });
        }
        return pontosGanhos;
    } catch(e) { 
        console.error("Erro ao registrar vitoria:", e); 
        return 0; 
    }
}

export async function registrarDerrotaDB(currentUser, gameMode) {
    if(!currentUser) return 0;
    try {
        const userRef = doc(db, "players", currentUser.uid);
        const userSnap = await getDoc(userRef);
        let pontosPerdidos = (gameMode === 'pvp') ? 8 : 3;
        if(userSnap.exists()) {
            const data = userSnap.data();
            let novoScore = Math.max(0, (data.score || 0) - pontosPerdidos);
            await updateDoc(userRef, { score: novoScore });
        }
        return -pontosPerdidos;
    } catch(e) { 
        console.error("Erro ao registrar derrota:", e); 
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
