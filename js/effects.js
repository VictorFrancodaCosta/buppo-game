// ARQUIVO: js/effects.js

// 1. EFEITO DE CURA
window.triggerHealEffect = function() {
    const body = document.body;
    const overlay = document.getElementById('heal-overlay');
    const light = document.getElementById('holy-light');
    const particlesContainer = document.getElementById('particles-container');

    // Som (Se existir no main.js, isso toca lá, mas podemos garantir aqui se quiser)
    // Por enquanto, só visual:

    // 1. Respiro
    body.classList.remove('screen-breathe');
    void body.offsetWidth; // Reset
    body.classList.add('screen-breathe');

    // 2. Aura e Luz
    overlay.classList.remove('active');
    light.classList.remove('active');
    void overlay.offsetWidth; 
    overlay.classList.add('active');
    light.classList.add('active');

    // 3. Partículas
    if (particlesContainer) {
        particlesContainer.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            const isCross = Math.random() > 0.3;
            if (isCross) {
                particle.classList.add('heal-particle');
                particle.textContent = "+";
                const size = Math.random() * 2 + 1.5;
                particle.style.fontSize = size + 'rem';
            } else {
                particle.classList.add('sparkle-particle');
                // Partícula branca/verde
            }
            particle.style.left = Math.random() * 100 + 'vw';
            const duration = Math.random() * 1 + 1.5;
            particle.style.animationDuration = duration + 's';
            const delay = Math.random() * 0.5;
            particle.style.animationDelay = delay + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // Limpeza
    setTimeout(() => {
        body.classList.remove('screen-breathe');
        overlay.classList.remove('active');
        light.classList.remove('active');
        if(particlesContainer) particlesContainer.innerHTML = '';
    }, 2500);
}

// 2. EFEITO DE DANO
window.triggerDamageEffect = function() {
    const body = document.body;
    const bloodContainer = document.getElementById('blood-container');
    const cutLine = document.getElementById('cut-line');

    // 1. Tremor
    body.classList.remove('shake-screen-hard');
    void body.offsetWidth; 
    body.classList.add('shake-screen-hard');

    // 2. Corte
    cutLine.classList.remove('active');
    void cutLine.offsetWidth;
    cutLine.classList.add('active');

    // 3. Sangue
    bloodContainer.innerHTML = ''; 
    // Manchas Grandes
    for(let i=0; i<4; i++) {
        const bigSpot = document.createElement('div');
        bigSpot.classList.add('blood-spot', 'big-splatter');
        const size = Math.random() * 100 + 100; 
        bigSpot.style.width = size + 'px';
        bigSpot.style.height = size + 'px';
        bigSpot.style.left = (Math.random() * 100 - 10) + '%';
        bigSpot.style.top = (Math.random() * 100 - 10) + '%';
        bigSpot.style.animationDelay = (Math.random() * 0.1) + 's';
        bloodContainer.appendChild(bigSpot);
    }
    // Gotas
    const drops = Math.floor(Math.random() * 10 + 20);
    for(let i=0; i < drops; i++) {
        const drop = document.createElement('div');
        drop.classList.add('blood-spot');
        const size = Math.random() * 25 + 10;
        drop.style.width = size + 'px';
        drop.style.height = size + 'px';
        drop.style.left = Math.random() * 100 + 'vw';
        drop.style.top = Math.random() * 100 + 'vh';
        const deform = Math.random() * 20 + 40; 
        drop.style.borderRadius = `${deform}% ${100-deform}% ${deform}% ${100-deform}%`;
        drop.style.animationDelay = (Math.random() * 0.2 + 0.1) + 's';
        bloodContainer.appendChild(drop);
    }

    // Limpeza
    setTimeout(() => {
        body.classList.remove('shake-screen-hard');
        cutLine.classList.remove('active');
        bloodContainer.innerHTML = '';
    }, 2600);
}

// 3. EFEITO DE BLOQUEIO
window.triggerBlockEffect = function() {
    const body = document.body;
    const overlay = document.getElementById('block-overlay');
    const shockwave = document.getElementById('shockwave');

    // 1. Recuo
    body.classList.remove('screen-recoil');
    void body.offsetWidth; 
    body.classList.add('screen-recoil');

    // 2. Overlay e Onda
    overlay.classList.remove('active');
    shockwave.classList.remove('active');
    void overlay.offsetWidth;
    overlay.classList.add('active');
    shockwave.classList.add('active');

    // 3. Limpeza
    setTimeout(() => {
        body.classList.remove('screen-recoil');
        overlay.classList.remove('active');
        shockwave.classList.remove('active');
    }, 700);
}
