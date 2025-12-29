// ARQUIVO: js/data.js

export const ACTION_KEYS = ['ATAQUE', 'BLOQUEIO', 'DESCANSAR', 'TREINAR', 'DESARMAR'];

export const DECK_TEMPLATE = {
    'ATAQUE': 10,
    'BLOQUEIO': 8,
    'DESCANSAR': 4,
    'TREINAR': 4,
    'DESARMAR': 4
};

export const CARDS_DB = {
    'ATAQUE': {
        img: 'https://i.ibb.co/jkvc8kRf/01-ATAQUE.png',
        color: 'border-red',
        fCol: '#ff4757',
        icon: '⚔️',
        customTooltip: `
            <div class="tt-desc">Causa <span class="dynamic-val">{PLAYER_LVL}</span> (Nível) de dano ao oponente.</div>

            <div class="tt-cartoon-title cartoon-orange">BÔNUS - GOLPE SURPRESA</div>
            <div class="tt-text">Se o oponente jogar <span class="highlight-card hc-green">DESCANSAR</span> neste turno, coloque a carta do topo de seu baralho em sua área de experiência.</div>

            <div class="tt-cartoon-title cartoon-purple">MAESTRIA EM ATAQUE</div>
            <div class="tt-text">O oponente recebe uma quantidade de dano igual a quantidade de maestrias de ataque que você possui.</div>
        `,
        base: 'Dano = Nível',
        bonus: '+XP se inimigo Descansar',
        mastery: 'Dano Extra = Qtd Maestrias'
    },
    'BLOQUEIO': {
        img: 'https://i.ibb.co/zhFYHsxQ/02-BLOQUEIO.png',
        color: 'border-blue',
        fCol: '#2ed573',
        icon: '🛡️',
        customTooltip: `
            <div class="tt-desc">Previna todo dano de combate causado a você neste turno.</div>

            <div class="tt-cartoon-title cartoon-orange">BÔNUS - CONTRA-GOLPE</div>
            <div class="tt-text">Se o oponente jogar <span class="highlight-card hc-red">ATAQUE</span> neste turno, cause <span class="dynamic-val">{PLAYER_BLOCK_DMG}</span> de dano aquele oponente.</div>

            <div class="tt-cartoon-title cartoon-purple">MAESTRIA EM BLOQUEIO</div>
            <div class="tt-text">Seus Contra-Golpes causam 1 ponto de dano a mais.</div>
        `,
        base: 'Anula Dano',
        bonus: 'Reflete 1 de Dano',
        mastery: '+1 Dano Refletido'
    },
    'DESCANSAR': {
        img: 'https://i.ibb.co/PzV81m5C/03-DESCANSAR.png',
        color: 'border-green',
        fCol: '#7bed9f',
        icon: '❤️',
        customTooltip: `
            <div class="tt-desc">No final do turno, restaure <span class="highlight-val">2</span> pontos de vida.</div>

            <div class="tt-cartoon-title cartoon-orange">BÔNUS - REVITALIZAR</div>
            <div class="tt-text">Se você não receber dano durante o combate deste turno, esta ação restaura <span class="highlight-val">1</span> ponto de vida a mais.</div>
            
        `,
        base: 'Cura 2 HP (3 se não sofrer dano)',
        bonus: 'Nenhum',
        mastery: '+1 HP Máximo Permanente'
    },
    'DESARMAR': {
        img: 'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png',
        color: 'border-yellow',
        fCol: '#ffa502',
        icon: '🚫',
        customTooltip: `
            <div class="tt-desc">Escolha uma ação. O oponente não poderá jogar a ação escolhida durante o próximo turno.</div>

            <div class="tt-cartoon-title cartoon-orange">BÔNUS - COLISÃO PERFEITA</div>
            <div class="tt-text">Se o oponente também jogar <span class="highlight-card hc-yellow">DESARMAR</span> neste turno, ambas ações são anuladas.</div>

            <div class="tt-cartoon-title cartoon-purple">MAESTRIA EM DESARMAR</div>
            <div class="tt-text">Escolha uma ação. O oponente não poderá jogar a ação escolhida durante o próximo turno.</div>
        `,
        base: 'Anula Próxima Ação',
        bonus: 'Nenhum',
        mastery: 'Bloqueia carta específica'
    },
    'TREINAR': {
        img: 'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png',
        color: 'border-purple',
        fCol: '#a29bfe',
        icon: '✨',
        customTooltip: `
            <div class="tt-desc">Coloque a carta do topo de seu baralho em sua área de experiência.</div>

            <div class="tt-cartoon-title cartoon-purple">MAESTRIA EM TREINAR</div>
            <div class="tt-text">Dispare o efeito de maestria de outra ação em sua área de experiência.</div>
        `,
        base: '+1 XP Extra',
        bonus: 'Acelera Level Up',
        mastery: 'Copia outra Maestria'
    }
};
 
 
 
 
