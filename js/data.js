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
        // AQUI ESTÁ A MÁGICA: Texto customizado em HTML
        customTooltip: `
            <div class="tt-desc">Causa <span class="highlight-val">(Nível)</span> de dano ao oponente.</div>

            <div class="tt-cartoon-title cartoon-orange">BÔNUS - GOLPE SURPRESA</div>
            <div class="tt-text">Se o oponente jogar <span class="highlight-card">DESCANSAR</span> neste turno, coloque a carta do topo de seu baralho em sua área de experiência.</div>

            <div class="tt-cartoon-title cartoon-purple">MAESTRIA EM ATAQUE</div>
            <div class="tt-text">O oponente recebe uma quantidade de dano igual a quantidade de maestrias de ataque que você possui.</div>
        `,
        // Mantemos os dados antigos caso precise de fallback
        base: 'Dano = Nível',
        bonus: '+XP se inimigo Descansar',
        mastery: 'Dano Extra = Qtd Maestrias'
    },
    'BLOQUEIO': {
        img: 'https://i.ibb.co/zhFYHsxQ/02-BLOQUEIO.png',
        color: 'border-blue',
        fCol: '#2ed573',
        icon: '🛡️',
        base: 'Anula Dano',
        bonus: 'Reflete 1 de Dano',
        mastery: '+1 Dano Refletido'
    },
    'DESCANSAR': {
        img: 'https://i.ibb.co/PzV81m5C/03-DESCANSAR.png',
        color: 'border-green',
        fCol: '#7bed9f',
        icon: '❤️',
        base: 'Cura 2 HP (3 se não sofrer dano)',
        bonus: 'Nenhum',
        mastery: '+1 HP Máximo Permanente'
    },
    'DESARMAR': {
        img: 'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png',
        color: 'border-yellow',
        fCol: '#ffa502',
        icon: '🚫',
        base: 'Anula Próxima Ação',
        bonus: 'Nenhum',
        mastery: 'Bloqueia carta específica'
    },
    'TREINAR': {
        img: 'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png',
        color: 'border-purple',
        fCol: '#a29bfe',
        icon: '✨',
        base: '+1 XP Extra',
        bonus: 'Acelera Level Up',
        mastery: 'Copia outra Maestria'
    }
};
