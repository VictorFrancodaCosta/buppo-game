// === NOVA FUNÇÃO: Sincroniza Level Up via Banco de Dados ===
async function syncLevelUpToDB(u) {
    if (!window.currentMatchId) return;
    const matchRef = doc(db, "matches", window.currentMatchId);
    
    // Define qual campo atualizar no banco
    let targetKey = "";
    if (u === player) {
        targetKey = (window.myRole === 'player1') ? 'player1' : 'player2';
    } else {
        targetKey = (window.myRole === 'player1') ? 'player2' : 'player1';
    }
    
    let updates = {};
    updates[`${targetKey}.xp`] = [];        // Limpa a XP no banco
    updates[`${targetKey}.deck`] = u.deck;  // Salva o novo deck embaralhado
    updates[`${targetKey}.lvl`] = u.lvl;    // Salva o novo nível
    
    try {
        console.log(`[SYNC] Enviando Level Up de ${targetKey} para o DB...`);
        await updateDoc(matchRef, updates);
    } catch(e) {
        console.error("Erro ao sincronizar Level Up:", e);
    }
}
