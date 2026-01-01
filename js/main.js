// ATUALIZAÇÃO: Listener com Indicador de "Inimigo Pronto"
function startPvPListener() {
    if(!window.currentMatchId) return;

    const matchRef = doc(db, "matches", window.currentMatchId);
    let namesUpdated = false;

    onSnapshot(matchRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const matchData = docSnap.data();

        // 1. Atualiza Nomes (Igual antes)
        if (!namesUpdated && matchData.player1 && matchData.player2) {
            let myName, enemyName;
            if (window.myRole === 'player1') {
                myName = matchData.player1.name; enemyName = matchData.player2.name;
            } else {
                myName = matchData.player2.name; enemyName = matchData.player1.name;
            }
            const pNameEl = document.querySelector('#p-stats-cluster .unit-name');
            const mNameEl = document.querySelector('#m-stats-cluster .unit-name');
            if(pNameEl) pNameEl.innerText = myName;
            if(mNameEl) mNameEl.innerText = enemyName;
            namesUpdated = true; 
        }

        // 2. DETECTAR SE O INIMIGO JOGOU (NOVO!)
        let enemyHasPlayed = false;
        if (window.myRole === 'player1' && matchData.p2Move) enemyHasPlayed = true;
        else if (window.myRole === 'player2' && matchData.p1Move) enemyHasPlayed = true;

        updateEnemyReadyState(enemyHasPlayed);

        // 3. Se AMBOS jogaram, resolve o turno
        if (matchData.p1Move && matchData.p2Move) {
            // Remove o indicador visual antes de animar
            updateEnemyReadyState(false); 
            
            if (!window.isResolvingTurn) {
                resolvePvPTurn(matchData.p1Move, matchData.p2Move, matchData.p1Disarm, matchData.p2Disarm);
            }
        }
    });
}

// NOVA FUNÇÃO AUXILIAR VISUAL
function updateEnemyReadyState(isReady) {
    const mCluster = document.getElementById('m-stats-cluster');
    const mImg = document.querySelector('#m-stats-cluster .char-portrait'); // ou o container
    
    // Remove badge antiga se existir
    const oldBadge = document.getElementById('enemy-ready-badge');
    if(oldBadge) oldBadge.remove();

    if (isReady && mCluster) {
        mCluster.classList.add('enemy-ready-pulse');
        
        // Cria a etiqueta "PRONTO!"
        const badge = document.createElement('div');
        badge.id = 'enemy-ready-badge';
        badge.className = 'ready-badge';
        badge.innerText = "PRONTO!";
        mCluster.appendChild(badge);
        
        // Toca um som sutil se o jogador ainda não tinha visto (opcional)
        // if (!window.enemyWasReady) playSound('sfx-hover'); 
        window.enemyWasReady = true;
    } else if (mCluster) {
        mCluster.classList.remove('enemy-ready-pulse');
        window.enemyWasReady = false;
    }
}
