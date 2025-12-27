// ARQUIVO: js/effects.js

// 1. EFEITO DE DANO MASSIVO (Sangue + Corte + Tremor)
window.triggerMassiveDamage = function() {
    const body = document.body;
    const bloodContainer = document.getElementById('blood-container');

    // --- 1. TREMOR ---
    body.classList.remove('shake-screen');
    void body.offsetWidth; 
    body.classList.add('shake-screen');

    // --- 2. O CORTE ---
    const slash = document.createElement('div');
    slash.classList.add('screen-cut-line');
    document.body.appendChild(slash);
    setTimeout(() => { slash.remove(); }, 450);

    // --- 3. SANGUE ---
    if (bloodContainer) {
        bloodContainer.innerHTML = ''; 

        // A) Manchas GRANDES
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

        // B) Gotículas
        const minDrops = 20;
        const maxDrops = 30;
        const numberOfDrops = Math.floor(Math.random() * (maxDrops - minDrops + 1)) + minDrops;
        
        for(let i=0; i < numberOfDrops; i++) {
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

        // Limpeza do container
        setTimeout(() => {
            bloodContainer.innerHTML = '';
        }, 2600);
    }

    // Limpeza da classe de tremor
    setTimeout(() => {
        body.classList.remove('shake-screen');
    }, 500);
}

// 2. EFEITO DE CURA (Luz + Partículas)
window.triggerHealEffect = function() {
    const body = document.body;
    const overlay = document.getElementById('heal-overlay');
    const light = document.getElementById('holy-light');
    const particlesContainer = document.getElementById('particles-container');

    // 1. Respiro
    body.classList.remove('screen-breathe');
    void body.offsetWidth; 
    body.classList.add('screen-breathe');

    // 2. Aura e Luz
    if(overlay) { overlay.classList.remove('active'); void overlay.offsetWidth; overlay.classList.add('active'); }
    if(light) { light.classList.remove('active'); void light.offsetWidth; light.classList.add('active'); }

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
        if(overlay) overlay.classList.remove('active');
        if(light) light.classList.remove('active');
        if(particlesContainer) particlesContainer.innerHTML = '';
    }, 2500);
}

// 3. EFEITO DE BLOQUEIO (Escudo + Onda)
window.triggerBlockEffect = function() {
    const body = document.body;
    const overlay = document.getElementById('block-overlay');
    const shockwave = document.getElementById('shockwave');

    // 1. Recuo
    body.classList.remove('screen-recoil');
    void body.offsetWidth;
    body.classList.add('screen-recoil');

    // 2. Overlay e Onda
    if(overlay) { overlay.classList.remove('active'); void overlay.offsetWidth; overlay.classList.add('active'); }
    if(shockwave) { shockwave.classList.remove('active'); void shockwave.offsetWidth; shockwave.classList.add('active'); }

    // 3. Limpeza
    setTimeout(() => {
        body.classList.remove('screen-recoil');
        if(overlay) overlay.classList.remove('active');
        if(shockwave) shockwave.classList.remove('active');
    }, 700);
}
