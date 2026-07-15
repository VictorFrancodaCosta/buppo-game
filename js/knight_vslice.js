(() => {
    'use strict';

    const THEMES = {
        knight: { bodyClass: 'theme-cavaleiro', primary: '#ffc83d', secondary: '#58b9ff', spark: '#fff7d1' },
        mage: { bodyClass: 'theme-mago', primary: '#a88bff', secondary: '#39f2e1', spark: '#f4efff' },
        archer: { bodyClass: 'theme-arqueiro', primary: '#74e879', secondary: '#f4cf63', spark: '#edffd8' },
        rogue: { bodyClass: 'theme-ladino', primary: '#f6cf4d', secondary: '#ff6557', spark: '#fff0a8' },
        oracle: { bodyClass: 'theme-oraculo', primary: '#c066ff', secondary: '#6bcfff', spark: '#faeaff' }
    };
    const timers = new Map();
    const reduceMotion = () => window.reducedMotionEnabled === true || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gameIsActive = () => document.getElementById('game-screen')?.classList.contains('active');

    function activeTheme() {
        return Object.entries(THEMES).find(([, theme]) => document.body.classList.contains(theme.bodyClass)) || null;
    }

    function buildLayer() {
        if(document.getElementById('class-cinema')) return;
        const cinema = document.createElement('div');
        cinema.id = 'class-cinema';
        cinema.setAttribute('aria-hidden', 'true');
        cinema.innerHTML = '<div class="class-grade"></div><div class="class-caustic"></div><div class="class-particles"></div>';
        document.body.appendChild(cinema);

        const edge = document.createElement('div');
        edge.id = 'class-edge-light';
        edge.setAttribute('aria-hidden', 'true');
        document.body.appendChild(edge);

        const particles = cinema.querySelector('.class-particles');
        for(let i = 0; i < 22; i++) {
            const mote = document.createElement('i');
            mote.className = 'class-mote';
            mote.style.left = `${4 + Math.random() * 92}%`;
            mote.style.top = `${80 + Math.random() * 24}%`;
            mote.style.setProperty('--size', `${1.2 + Math.random() * 3.3}px`);
            mote.style.setProperty('--duration', `${7 + Math.random() * 9}s`);
            mote.style.setProperty('--delay', `${-Math.random() * 14}s`);
            mote.style.setProperty('--drift', `${-60 + Math.random() * 120}px`);
            particles.appendChild(mote);
        }
    }

    function pulseClass(name, ms) {
        document.body.classList.remove(name);
        void document.body.offsetWidth;
        document.body.classList.add(name);
        clearTimeout(timers.get(name));
        timers.set(name, setTimeout(() => document.body.classList.remove(name), ms));
    }

    function setImpactPalette(deckType) {
        const theme = THEMES[deckType] || activeTheme()?.[1] || THEMES.knight;
        document.documentElement.style.setProperty('--impact-primary', theme.primary);
        document.documentElement.style.setProperty('--impact-secondary', theme.secondary);
        document.documentElement.style.setProperty('--impact-spark', theme.spark);
        return theme;
    }

    function sparks(targetIsPlayer, count = 18, deckType = 'knight') {
        const theme = setImpactPalette(deckType);
        const target = document.getElementById(targetIsPlayer ? 'p-stats-cluster' : 'm-stats-cluster');
        const rect = target?.getBoundingClientRect();
        const x = rect ? rect.left + rect.width / 2 : innerWidth / 2;
        const y = rect ? rect.top + rect.height / 2 : innerHeight / 2;
        for(let i = 0; i < count; i++) {
            const spark = document.createElement('i');
            spark.className = `class-spark class-spark-${deckType}`;
            spark.style.setProperty('--x', `${x + (Math.random() - .5) * 70}px`);
            spark.style.setProperty('--y', `${y + (Math.random() - .5) * 45}px`);
            spark.style.setProperty('--w', `${18 + Math.random() * 56}px`);
            spark.style.setProperty('--r', `${Math.random() * 360}deg`);
            spark.style.setProperty('--d', `${70 + Math.random() * 190}px`);
            spark.style.setProperty('--t', `${.35 + Math.random() * .32}s`);
            spark.style.setProperty('--spark-primary', theme.primary);
            spark.style.setProperty('--spark-secondary', theme.secondary);
            spark.style.setProperty('--spark-core', theme.spark);
            document.body.appendChild(spark);
            setTimeout(() => spark.remove(), 850);
        }
    }

    function flashEdge(deckType = 'knight') {
        if(reduceMotion()) return;
        setImpactPalette(deckType);
        const edge = document.getElementById('class-edge-light');
        if(!edge) return;
        edge.classList.remove('active');
        void edge.offsetWidth;
        edge.classList.add('active');
        setTimeout(() => edge.classList.remove('active'), 560);
    }

    function impact(kind, targetIsPlayer = false, deckType = 'knight') {
        if(!gameIsActive() || !THEMES[deckType]) return;
        if(kind === 'attack') {
            pulseClass('class-impacting', 560);
            flashEdge(deckType);
            sparks(targetIsPlayer, reduceMotion() ? 5 : 22, deckType);
        }
        if(kind === 'block') {
            pulseClass('class-blocking', 820);
            sparks(targetIsPlayer, reduceMotion() ? 4 : 13, deckType);
        }
        if(kind === 'heal') {
            setImpactPalette(deckType);
            pulseClass('class-healing', 950);
        }
    }

    function syncVitals() {
        if(!activeTheme()) {
            if(document.body.classList.contains('class-danger')) document.body.classList.remove('class-danger');
            if(document.body.classList.contains('knight-danger')) document.body.classList.remove('knight-danger');
            return;
        }
        const bar = document.getElementById('p-hp-bar');
        const hpText = document.getElementById('p-hp-txt')?.textContent?.split('/') || [];
        const now = Number(bar?.getAttribute('aria-valuenow') || hpText[0]);
        const max = Number(bar?.getAttribute('aria-valuemax') || hpText[1]);
        const shouldWarn = max > 0 && now / max <= .34 && now > 0;
        if(document.body.classList.contains('class-danger') !== shouldWarn) document.body.classList.toggle('class-danger', shouldWarn);
        if(document.body.classList.contains('knight-danger')) document.body.classList.remove('knight-danger');
    }

    function victory() {
        const current = activeTheme();
        if(!current) return;
        const [deckType] = current;
        flashEdge(deckType);
        sparks(false, reduceMotion() ? 8 : 38, deckType);
    }

    buildLayer();
    addEventListener('pointermove', event => {
        if(!activeTheme() || reduceMotion()) return;
        document.documentElement.style.setProperty('--class-parallax-x', `${((event.clientX / innerWidth) - .5) * -5}px`);
        document.documentElement.style.setProperty('--class-parallax-y', `${((event.clientY / innerHeight) - .5) * -4}px`);
    }, { passive: true });
    new MutationObserver(syncVitals).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const hpText = document.getElementById('p-hp-txt');
    if(hpText) new MutationObserver(syncVitals).observe(hpText, { subtree: true, childList: true, characterData: true });

    window.ClassVisuals = { impact, syncVitals, victory };
    window.KnightVisuals = window.ClassVisuals;
    syncVitals();
})();
