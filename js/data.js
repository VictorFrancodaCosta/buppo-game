// ARQUIVO: js/data.js

export const CARDS_DB = {
    'ATAQUE': { color: 'red', fCol: '#e74c3c', icon: '⚔️', img: 'https://i.ibb.co/jkvc8kRf/01-ATAQUE.png', base: 'Dano = Nível.', bonus: 'Se inimigo DESCANSAR, ganhe XP.', mastery: '+1 dano acumulativo.' },
    'BLOQUEIO': { color: 'blue', fCol: '#00cec9', icon: '🛡️', img: 'https://i.ibb.co/zhFYHsxQ/02-BLOQUEIO.png', base: 'Previne ATAQUE.', bonus: 'Reflete 1 dano.', mastery: 'Reflexão +1.' },
    'DESCANSAR': { color: 'green', fCol: '#2ecc71', icon: '💚', img: 'https://i.ibb.co/PzV81m5C/03-DESCANSAR.png', base: 'Cura 2 HP.', bonus: 'Se full HP/Sem dano, +1 cura.', mastery: 'Aumenta HP Maximo.' },
    'TREINAR': { color: 'purple', fCol: '#9b59b6', icon: '🎓', img: 'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png', base: 'Compra carta p/ XP.', bonus: 'Nenhum.', mastery: 'Copia outra maestria.' },
    'DESARMAR': { color: 'orange', fCol: '#f39c12', icon: '🔒', img: 'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png', base: 'Bloqueia ação.', bonus: 'Colisão anula.', mastery: 'Escolhe alvo.' }
};

export const ACTION_KEYS = Object.keys(CARDS_DB);

export const DECK_TEMPLATE = { 'ATAQUE': 8, 'BLOQUEIO': 8, 'DESARMAR': 5, 'DESCANSAR': 4, 'TREINAR': 5 };
