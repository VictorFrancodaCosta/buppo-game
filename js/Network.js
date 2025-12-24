import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCVLhOcKqF6igMGRmOWO_GEY9O4gz892Fo",
    authDomain: "buppo-game.firebaseapp.com",
    projectId: "buppo-game",
    storageBucket: "buppo-game.firebasestorage.app",
    messagingSenderId: "950871979140",
    appId: "1:950871979140:web:f2dba12900500c52053ed1"
};

export class NetworkManager {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.provider = new GoogleAuthProvider();
        this.currentUser = null;
    }

    async login() {
        try { await signInWithPopup(this.auth, this.provider); } 
        catch (error) { console.error("Erro Login:", error); throw error; }
    }

    logout() { return signOut(this.auth); }

    onAuthChange(callback) {
        onAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;
            if (user) await this._ensureUserRecord(user);
            callback(user);
        });
    }

    async _ensureUserRecord(user) {
        const userRef = doc(this.db, "players", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            await setDoc(userRef, { name: user.displayName, score: 0, totalWins: 0 });
        }
    }

    subscribeToRanking(callback) {
        const q = query(collection(this.db, "players"), orderBy("score", "desc"), limit(10));
        return onSnapshot(q, (snapshot) => {
            const data = [];
            snapshot.forEach(d => data.push(d.data()));
            callback(data);
        });
    }

    async registerResult(isWin) {
        if (!this.currentUser) return;
        const userRef = doc(this.db, "players", this.currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            const updates = isWin 
                ? { totalWins: (data.totalWins || 0) + 1, score: (data.score || 0) + 100 }
                : { score: (data.score || 0) + 10 };
            await updateDoc(userRef, updates);
        }
    }
}
