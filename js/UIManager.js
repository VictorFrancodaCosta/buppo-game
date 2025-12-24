import { CARDS_DB } from './data.js';

export class UIManager {
    constructor() {
        this.els = {
            hand: document.getElementById('player-hand'),
            pSlot: document.getElementById('p-slot'),
            mSlot: document.getElementById('m-slot'),
            turnTxt: document.getElementById('turn-txt')
        };
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if(target) target.classList.add('active');
        
        // Ajusta backgrounds
        const bg = document.getElementById('game-background');
        if(screenId === 'lobby-screen') bg.classList.add('lobby-mode');
        else bg.classList.remove('lobby-mode');
    }

    updateStats(player, monster) {
        this._updateUnitUI(player);
        this._updateUnitUI(monster);
    }

    _updateUnitUI(u) {
        const id = u.id;
        document.getElementById(id+'-lvl').innerText = u.lvl;
        document.getElementById(id+'-hp-txt').innerText = `${Math.max(0, u.hp)}/${u.maxHp}`;
        
        const pct = (Math.max(0, u.hp) / u.maxHp) * 100;
        const bar = document.getElementById(id+'-hp-fill');
        bar.style.width = pct + '%';
        bar.style.background = pct > 66 ? "#4cd137" : (pct > 33 ? "#fbc531" : "#e84118");
        
        document.getElementById(id+'-deck-count').innerText = u.deck.length;

        // Atualiza XP
        const xpContainer = document.getElementById(id+'-xp');
        xpContainer.innerHTML = '';
        u.xp.forEach(k => {
            let d = document.createElement('div');
            d.className = 'xp-mini';
            d.style.backgroundImage = `url('${CARDS_DB[k].img}')`;
            xpContainer.appendChild(d);
        });
    }

    renderHand(hand, onCardClick, disabledCard) {
        this.els.hand.innerHTML = '';
        hand.forEach((key, index) => {
            const c = document.createElement('div');
            c.className = `card hand-card ${CARDS_DB[key].color}`;
            if (disabledCard === key) c.classList.add('disabled-card');
            
            // Reutilizando seu HTML de flares
            let flares = ''; for(let f=1; f<=10; f++) flares += `<div class="flare-spark fs-${f}"></div>`;
            c.innerHTML = `<div class="card-art" style="background-image: url('${CARDS_DB[key].img}')"></div><div class="flares-container">${flares}</div>`;
            
            c.onclick = () => onCardClick(index);
            
            // Efeito visual de entrada
            c.style.opacity = '0';
            setTimeout(() => c.style.opacity = '1', index * 100);
            
            this.els.hand.appendChild(c);
        });
    }

    // Animação de cartas voando (Visual Only)
    animateCombat(pCardKey, mCardKey, callback) {
        // Anima Player
        this._flyCard('player-hand', 'p-slot', pCardKey);
        
        // Anima Monstro
        setTimeout(() => {
            // Posição fictícia da mão do inimigo (topo da tela)
            const enemyHandPos = { top: -100, left: window.innerWidth/2, width: 0, height: 0 };
            this._flyCard(enemyHandPos, 'm-slot', mCardKey);
            
            // Renderiza na mesa e limpa voadores
            setTimeout(() => {
                this._renderTable(pCardKey, 'p-slot');
                this._renderTable(mCardKey, 'm-slot');
                if(callback) callback();
            }, 600);
        }, 200);
    }

    _flyCard(start, endId, key) {
        let s = (typeof start === 'string') ? document.getElementById(start).getBoundingClientRect() : start;
        let e = document.getElementById(endId).getBoundingClientRect();
        
        const fly = document.createElement('div');
        fly.className = `card flying-card ${CARDS_DB[key].color}`;
        fly.innerHTML = `<div class="card-art" style="background-image: url('${CARDS_DB[key].img}')"></div>`;
        fly.style.width = '100px'; fly.style.height = '140px';
        fly.style.top = s.top + 'px'; fly.style.left = s.left + 'px';
        
        document.body.appendChild(fly);
        
        // Força reflow para ativar transição CSS
        fly.getBoundingClientRect(); 
        
        fly.style.top = e.top + 'px'; fly.style.left = e.left + 'px';
        setTimeout(() => fly.remove(), 600);
    }

    _renderTable(key, slotId) {
        const el = document.getElementById(slotId);
        el.innerHTML = `<div class="card ${CARDS_DB[key].color} card-on-table"><div class="card-art" style="background-image: url('${CARDS_DB[key].img}')"></div></div>`;
    }

    clearTable() {
        this.els.pSlot.innerHTML = '';
        this.els.mSlot.innerHTML = '';
    }

    updateRanking(data) {
        let html = '<table id="ranking-table"><thead><tr><th>#</th><th>JOGADOR</th><th>PTS</th></tr></thead><tbody>';
        data.forEach((p, i) => {
            html += `<tr><td>${i+1}</td><td>${p.name}</td><td>${p.score}</td></tr>`;
        });
        html += '</tbody></table>';
        document.getElementById('ranking-content').innerHTML = html;
    }
    
    setLoading(pct) {
        const fill = document.getElementById('loader-fill');
        if(fill) fill.style.width = pct + '%';
        if(pct >= 100) document.getElementById('loading-screen').style.display = 'none';
    }

    showEndScreen(title, className) {
        const screen = document.getElementById('end-screen');
        const t = document.getElementById('end-title');
        t.innerText = title;
        t.className = className;
        screen.classList.add('visible');
    }
}
