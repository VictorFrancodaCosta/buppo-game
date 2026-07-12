(() => {
    'use strict';
    const reduceMotion = () => window.reducedMotionEnabled === true || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const active = () => document.body.classList.contains('theme-cavaleiro');
    const timers = new Map();

    function buildLayer() {
        if(document.getElementById('knight-cinema')) return;
        const cinema = document.createElement('div');
        cinema.id = 'knight-cinema';
        cinema.setAttribute('aria-hidden', 'true');
        cinema.innerHTML = '<div class="knight-grade"></div><div class="knight-caustic"></div><div class="knight-dust"></div>';
        document.body.appendChild(cinema);
        const edge = document.createElement('div'); edge.id = 'knight-edge-light'; edge.setAttribute('aria-hidden','true'); document.body.appendChild(edge);
        const dust = cinema.querySelector('.knight-dust');
        for(let i=0;i<22;i++) {
            const mote = document.createElement('i'); mote.className='knight-dust-mote';
            mote.style.left = `${4 + Math.random()*92}%`;
            mote.style.top = `${80 + Math.random()*24}%`;
            mote.style.setProperty('--size',`${1.2+Math.random()*3.3}px`);
            mote.style.setProperty('--duration',`${7+Math.random()*9}s`);
            mote.style.setProperty('--delay',`${-Math.random()*14}s`);
            mote.style.setProperty('--drift',`${-60+Math.random()*120}px`);
            dust.appendChild(mote);
        }
    }

    function pulseClass(name, ms) {
        document.body.classList.remove(name); void document.body.offsetWidth; document.body.classList.add(name);
        clearTimeout(timers.get(name)); timers.set(name,setTimeout(()=>document.body.classList.remove(name),ms));
    }

    function sparks(targetIsPlayer, count=18) {
        const target = document.getElementById(targetIsPlayer ? 'p-stats-cluster' : 'm-stats-cluster');
        const rect = target?.getBoundingClientRect();
        const x = rect ? rect.left + rect.width/2 : innerWidth/2;
        const y = rect ? rect.top + rect.height/2 : innerHeight/2;
        for(let i=0;i<count;i++) {
            const s=document.createElement('i'); s.className='knight-spark';
            s.style.setProperty('--x',`${x+(Math.random()-.5)*70}px`); s.style.setProperty('--y',`${y+(Math.random()-.5)*45}px`);
            s.style.setProperty('--w',`${18+Math.random()*56}px`); s.style.setProperty('--r',`${Math.random()*360}deg`);
            s.style.setProperty('--d',`${70+Math.random()*190}px`); s.style.setProperty('--t',`${.35+Math.random()*.32}s`);
            document.body.appendChild(s); setTimeout(()=>s.remove(),850);
        }
    }

    function flashEdge() {
        if(reduceMotion()) return;
        const el=document.getElementById('knight-edge-light');
        if(!el) return;
        el.classList.remove('active'); void el.offsetWidth; el.classList.add('active');
        setTimeout(()=>el.classList.remove('active'),560);
    }

    function impact(kind, targetIsPlayer=false, deckType='knight') {
        if(deckType !== 'knight' || !active()) return;
        if(kind==='attack') { pulseClass('knight-impacting',560); flashEdge(); sparks(targetIsPlayer, reduceMotion()?5:24); }
        if(kind==='block') { pulseClass('knight-blocking',820); sparks(targetIsPlayer, reduceMotion()?4:14); }
        if(kind==='heal') pulseClass('knight-healing',950);
    }

    function syncVitals() {
        if(!active()) {
            if(document.body.classList.contains('knight-danger')) document.body.classList.remove('knight-danger');
            return;
        }
        const bar=document.getElementById('p-hp-bar');
        const now=Number(bar?.getAttribute('aria-valuenow') || document.getElementById('p-hp-txt')?.textContent?.split('/')[0]);
        const max=Number(bar?.getAttribute('aria-valuemax') || document.getElementById('p-hp-txt')?.textContent?.split('/')[1]);
        const shouldWarn = max>0 && now/max<=.34 && now>0;
        if(document.body.classList.contains('knight-danger') !== shouldWarn) document.body.classList.toggle('knight-danger', shouldWarn);
    }

    buildLayer();
    addEventListener('pointermove',e=>{ if(!active() || reduceMotion()) return; document.documentElement.style.setProperty('--knight-parallax-x',`${((e.clientX/innerWidth)-.5)*-5}px`); document.documentElement.style.setProperty('--knight-parallax-y',`${((e.clientY/innerHeight)-.5)*-4}px`); },{passive:true});
    new MutationObserver(syncVitals).observe(document.body,{attributes:true,attributeFilter:['class']});
    const hpText = document.getElementById('p-hp-txt');
    if(hpText) new MutationObserver(syncVitals).observe(hpText,{subtree:true,childList:true,characterData:true});
    window.KnightVisuals={impact,syncVitals,victory(){ if(active()) { flashEdge(); sparks(false,reduceMotion()?8:42); } }};
    syncVitals();
})();
