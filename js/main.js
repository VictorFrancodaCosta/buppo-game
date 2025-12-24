// ARQUIVO: js/main.js

import { CARDS_DB, DECK_TEMPLATE, ACTION_KEYS } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCVLhOcKqF6igMGRmOWO_GEY9O4gz892Fo",
    authDomain: "buppo-game.firebaseapp.com",
    projectId: "buppo-game",
    storageBucket: "buppo-game.firebasestorage.app",
    messagingSenderId: "950871979140",
    appId: "1:950871979140:web:f2dba12900500c52053ed1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- VARIÁVEIS GLOBAIS ---
let currentUser = null;
const audios = {}; 
let assetsLoaded = 0; 
let totalAssets = 0;
let player = { id:'p', name:'Você', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let monster = { id:'m', name:'Monstro', hp:6, maxHp:6, lvl:1, hand:[], deck:[], xp:[], disabled:null, bonusBlock:0, bonusAtk:0 };
let isProcessing = false; 
let turnCount = 1; 
let playerHistory = []; 
window.masterVol = 1.0; 
let isLethalHover = false; 
let mixerInterval = null;

const ASSETS_TO_LOAD = {
    images: [
        'https://i.ibb.co/60tCyntQ/BUPPO-LOGO-Copiar.png', 'https://i.ibb.co/fVRc0vLs/Gemini-Generated-Image-ilb8d0ilb8d0ilb8.png', 
        'https://i.ibb.co/xqbKSbgx/mesa-com-deck.png', 'https://i.ibb.co/jdZmTHC/CARDBACK.png', 'https://i.ibb.co/wh3J5mTT/DECK-CAVALEIRO.png',
        'https://i.ibb.co/jkvc8kRf/01-ATAQUE.png', 'https://i.ibb.co/zhFYHsxQ/02-BLOQUEIO.png', 'https://i.ibb.co/PzV81m5C/03-DESCANSAR.png',
        'https://i.ibb.co/Q35jW8HZ/05-TREINAR.png', 'https://i.ibb.co/BVNfzPk1/04-DESARMAR.png',
        'https://i.ibb.co/Dfpkhhtr/ARTE-SAGU-O.png', 'https://i.ibb.co/zHZsCnyB/QUADRO-DO-SAGU-O.png'
    ],
    audio: [
        { id: 'bgm-menu', src: 'https://files.catbox.moe/g8a1ux.mp3', loop: true }, 
        { id: 'bgm-loop', src: 'https://files.catbox.moe/57mvtt.mp3', loop: true },
        { id: 'sfx-nav', src: 'https://files.catbox.moe/yc7yrz.mp3' }, 
        { id: 'sfx-deal', src: 'https://files.catbox.moe/vhgxvr.mp3' }, { id: 'sfx-play', src: 'https://files.catbox.moe/jpjd8x.mp3' },
        { id: 'sfx-hit', src: 'https://files.catbox.moe/r1ko7y.mp3' }, { id: 'sfx-block', src: 'https://files.catbox.moe/6zh7w0.mp3' },
        { id: 'sfx-heal', src: 'https://files.catbox.moe/uegibx.mp3' }, { id: 'sfx-levelup', src: 'https://files.catbox.moe/sm8cce.mp3' },
        { id: 'sfx-cine', src: 'https://files.catbox.moe/rysr4f.mp3', loop: true }, { id: 'sfx-hover', src: 'https://files.catbox.moe/wzurt7.mp3' },
        { id: 'sfx-win', src: 'https://files.catbox.moe/a3ls23.mp3' }, { id: 'sfx-lose', src: 'https://files.catbox.moe/n7nyck.mp3' },
        { id: 'sfx-tie', src: 'https://files.catbox.moe/sb18ja.mp3' }
    ]
};
totalAssets = ASSETS_TO_LOAD.images.length + ASSETS_TO_LOAD.audio.length;

// =======================
// FUNÇÕES DE SISTEMA (LOGIN/AUDIO) - Prioridade Alta
// =======================

// Audio Controller Simplificado
const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if (this.currentTrackId === trackId) return;
        const maxVol = 0.5 * window.masterVol;
        if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]);
        if (trackId && audios[trackId]) {
            const newAudio = audios[trackId];
            newAudio.currentTime = (trackId === 'bgm-menu') ? 10 + Math.random() * 40 : 0;
            if (!window.isMuted) {
                newAudio.volume = 0; newAudio.play().catch(()=>{}); this.fadeIn(newAudio, maxVol);
            }
        }
        this.currentTrackId = trackId;
    },
    stopCurrent() { if (this.currentTrackId && audios[this.currentTrackId]) this.fadeOut(audios[this.currentTrackId]); this.currentTrackId = null; },
    fadeOut(audio) { let vol = audio.volume; const i = setInterval(() => { if (vol > 0.05) { vol -= 0.05; audio.volume = vol; } else { audio.volume = 0; audio.pause(); clearInterval(i); } }, 50); },
    fadeIn(audio, targetVol) { let vol = 0; audio.volume = 0; const i = setInterval(() => { if (vol < targetVol - 0.05) { vol += 0.05; audio.volume = vol; } else { audio.volume = targetVol; clearInterval(i); } }, 50); }
};

window.playNavSound = function() { let s = audios['sfx-nav']; if(s) { s.currentTime = 0; s.play().catch(()=>{}); } };

window.googleLogin = async function() {
    window.playNavSound(); 
    const btnText = document.getElementById('btn-text');
    btnText.innerText = "CONECTANDO...";
    try { await signInWithPopup(auth, provider); } 
    catch (error) { console.error(error); btnText.innerText = "ERRO"; setTimeout(() => btnText.innerText = "LOGIN COM GOOGLE", 3000); }
};

window.handleLogout = function() { window.playNavSound(); signOut(auth).then(() => { location.reload(); }); };

// Firebase Auth Listener
onAuthStateChanged(auth, (user) => {
    // Remove loading screen
    const loader = document.getElementById('loading-screen');
    if(loader) { loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 500); }

    if (user) {
        currentUser = user;
        window.goToLobby(true); 
    } else {
        currentUser = null;
        window.showScreen('start-screen');
        const bg = document.getElementById('game-background');
        if(bg) bg.classList.remove('lobby-mode');
        const btnTxt = document.getElementById('btn-text');
        if(btnTxt) btnTxt.innerText = "LOGIN COM GOOGLE";
        MusicController.play('bgm-menu');
    }
});

// =======================
// SETUP DO CANVAS (ANIMAÇÃO NOVA)
// =======================

let canvas = document.getElementById('fx-canvas');
if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'fx-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '15000';
    document.body.appendChild(canvas);
}
const ctx = canvas.getContext('2d');
let particles = [];
let flyingCards = [];
const imageCache = {};

// Cache de Imagens das Cartas
Object.keys(CARDS_DB).forEach(key => {
    const img = new Image(); 
    img.src = CARDS_DB[key].img;
    imageCache[key] = img;
});

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Função de Easing (Bounce)
function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// Classe da Carta Voadora (Canvas)
class FlyingCard {
    constructor(targetX, targetY, width, height, cardKey, onLand) {
        this.tx = targetX;
        this.ty = targetY;
        this.w = width;
        this.h = height;
        this.key = cardKey;
        this.onLand = onLand;
        
        // Começa de BAIXO da tela
        this.startY = window.innerHeight + 150; 
        
        this.x = targetX; // Alinhado horizontalmente com o destino
        this.y = this.startY;
        
        this.progress = 0;
        this.speed = 0.015; // Velocidade da subida
        this.finished = false;
    }

    update() {
        if (this.finished) return;
        this.progress += this.speed;
        if (this.progress >= 1) {
            this.progress = 1;
            this.finished = true;
            if (this.onLand) this.onLand();
        }
        const ease = easeOutBack(this.progress);
        this.y = this.startY + (this.ty - this.startY) * ease;
    }

    draw(ctx) {
        const img = imageCache[this.key];
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 10;
        
        if (img && img.complete) {
            // Desenha imagem
            ctx.drawImage(img, this.x, this.y, this.w, this.h);
            
            // Desenha borda colorida baseada na raridade/tipo
            let borderColor = '#333';
            if(CARDS_DB[this.key]) {
               let colClass = CARDS_DB[this.key].color; // ex: 'border-red'
               if(colClass.includes('red')) borderColor = '#ff4757';
               if(colClass.includes('blue')) borderColor = '#00cec9';
               if(colClass.includes('yellow')) borderColor = '#ffa502';
               if(colClass.includes('purple')) borderColor = '#a29bfe';
            }
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            // Hack simples para borda arredondada no canvas sem clip complexo
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = "#222";
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();
    }
}

// Classe Partícula
class Particle {
    constructor(x, y, color, type) {
        this.x = x; this.y = y; this.color = color; this.type = type;
        const a = Math.random() * 6.28;
        if(type==='explosion'){ const s=Math.random()*5+2; this.vx=Math.cos(a)*s; this.vy=Math.sin(a)*s; this.life=1; this.d=0.03; this.sz=Math.random()*6+2; }
        else if(type==='heal'){ this.vx=(Math.random()-0.5)*2; this.vy=-(Math.random()*2+1); this.life=1; this.d=0.01; this.sz=Math.random()*4+2; }
        else { this.vx=(Math.random()-0.5)*8; this.vy=(Math.random()-0.5)*8; this.life=1; this.d=0.05; this.sz=Math.random()*3+1; }
    }
    update(){ this.x+=this.vx; this.y+=this.vy; this.life-=this.d; if(this.type==='explosion')this.vy+=0.2; }
    draw(c){ c.globalAlpha=Math.max(0,this.life); c.fillStyle=this.color; c.beginPath(); 
    if(this.type==='heal')c.arc(this.x,this.y,this.sz,0,6.28); else c.rect(this.x-this.sz/2,this.y-this.sz/2,this.sz,this.sz); c.fill(); c.globalAlpha=1; }
}

// Loop Principal
function fxLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); particles[i].draw(ctx);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    for (let i = flyingCards.length - 1; i >= 0; i--) {
        flyingCards[i].update(); flyingCards[i].draw(ctx);
        if (flyingCards[i].finished) flyingCards.splice(i, 1);
    }
    requestAnimationFrame(fxLoop);
}
fxLoop();

// FX Helpers Globais
window.spawnParticles = function(x, y, col, type='explosion') { for(let i=0;i<(type==='explosion'?30:15);i++) particles.push(new Particle(x, y, col, type)); }
window.triggerDamageEffect = function(isP, play=true) { 
    if(play) playSound('sfx-hit'); 
    let el = document.getElementById(isP?'p-slot':'m-slot');
    if(el){ let r=el.getBoundingClientRect(); window.spawnParticles(r.left+r.width/2,r.top+r.height/2,'#ff4757','explosion'); }
    document.body.classList.add('shake-screen'); setTimeout(()=>document.body.classList.remove('shake-screen'),400);
    let o=document.getElementById('dmg-overlay'); if(o){o.style.opacity='1'; setTimeout(()=>o.style.opacity='0',150);}
}
window.triggerHealEffect = function(isP) { 
    let el = document.getElementById(isP?'p-slot':'m-slot');
    if(el){ let r=el.getBoundingClientRect(); window.spawnParticles(r.left+r.width/2,r.top+r.height/2,'#2ecc71','heal'); }
    let o=document.getElementById('heal-overlay'); if(o){o.style.opacity='1'; setTimeout(()=>o.style.opacity='0',300);}
}
window.triggerBlockEffect = function() { 
    playSound('sfx-block'); window.spawnParticles(window.innerWidth/2,window.innerHeight/2,'#74b9ff','block'); 
    let o=document.getElementById('block-overlay'); if(o){o.style.opacity='1'; setTimeout(()=>o.style.opacity='0',200);}
    document.body.classList.add('shake-screen'); setTimeout(()=>document.body.classList.remove('shake-screen'),200);
}

// =======================
// LÓGICA DE JOGO PRINCIPAL
// =======================

function dealAllInitialCards() {
    isProcessing = true; 
    playSound('sfx-deal'); 
    
    const handEl = document.getElementById('player-hand'); 
    const cards = Array.from(handEl.children);
    
    if(cards.length === 0) { isProcessing = false; return; }

    // Garante invisibilidade
    cards.forEach(c => c.style.opacity = '0');

    // Cria as cartas no Canvas
    cards.forEach((cardEl, i) => {
        let cardKey = player.hand[i]; // Pega a chave correta da mão
        if(!cardKey) return;

        setTimeout(() => {
            const rect = cardEl.getBoundingClientRect();
            
            flyingCards.push(new FlyingCard(
                rect.left, 
                rect.top, 
                rect.width, 
                rect.height, 
                cardKey, 
                () => {
                    // Swap Canvas -> DOM
                    cardEl.style.transition = 'none';
                    cardEl.style.opacity = '1';
                    playSound('sfx-hover');
                }
            ));
            
            if(i === cards.length - 1) {
                setTimeout(() => { isProcessing = false; }, 1000);
            }
        }, i * 200); // Intervalo
    });
}

// Compra de carta no meio do turno
function drawCardAnimated(unit, deckId, handId, cb) { 
    if(unit.deck.length===0) { cb(); return; } 

    if (unit.id === 'p') {
        cb(); // Executa lógica de dados (adiciona na mão do player)
        
        // Agora busca a carta que acabou de ser criada no DOM
        const handEl = document.getElementById('player-hand');
        const newCardEl = handEl.lastElementChild;
        const cardKey = player.hand[player.hand.length-1];

        if (newCardEl && cardKey) {
            newCardEl.style.opacity = '0';
            const rect = newCardEl.getBoundingClientRect();
            
            flyingCards.push(new FlyingCard(
                rect.left, 
                rect.top, 
                rect.width, 
                rect.height, 
                cardKey, 
                () => {
                    newCardEl.style.transition = 'none';
                    newCardEl.style.opacity = '1';
                    playSound('sfx-hover');
                }
            ));
        }
    } else {
        cb();
    }
}

function startGameFlow() {
    document.getElementById('end-screen').classList.remove('visible');
    isProcessing = false; 
    startCinematicLoop();
    resetUnit(player); 
    resetUnit(monster); 
    turnCount = 1; 
    playerHistory = [];
    
    drawCardLogic(monster, 6); 
    drawCardLogic(player, 6); 
    
    updateUI(); 
    
    // Força invisibilidade antes da animação
    const handEl = document.getElementById('player-hand'); 
    if(handEl) Array.from(handEl.children).forEach(c => c.style.opacity = '0');

    setTimeout(() => { dealAllInitialCards(); }, 100);
}

function updateUI() { 
    updateUnit(player); 
    updateUnit(monster); 
    document.getElementById('turn-txt').innerText = "TURNO " + turnCount; 
}

function updateUnit(u) {
    document.getElementById(u.id+'-lvl').textContent = u.lvl;
    document.getElementById(u.id+'-hp-txt').innerText = `${Math.max(0,u.hp)}/${u.maxHp}`;
    let hpPct = (Math.max(0,u.hp)/u.maxHp)*100;
    let hpFill = document.getElementById(u.id+'-hp-fill');
    hpFill.style.width = hpPct + '%';
    hpFill.style.background = hpPct > 66 ? '#4cd137' : (hpPct > 33 ? '#fbc531' : '#e84118');
    document.getElementById(u.id+'-deck-count').innerText = u.deck.length;

    let xc = document.getElementById(u.id+'-xp'); xc.innerHTML=''; 
    u.xp.forEach(k=>{let d=document.createElement('div');d.className='xp-mini';d.style.backgroundImage=`url('${CARDS_DB[k].img}')`;xc.appendChild(d)});
    
    let mc = document.getElementById(u.id+'-masteries'); mc.innerHTML='';
    if(u.bonusAtk>0) addMI(mc,'ATAQUE',u.bonusAtk,'#e74c3c',u.id); 
    if(u.bonusBlock>0) addMI(mc,'BLOQUEIO',u.bonusBlock,'#00cec9',u.id);
    
    if(u === player) {
        let h = document.getElementById('player-hand'); 
        h.innerHTML = '';
        u.hand.forEach((k,i) => {
            let c = document.createElement('div'); 
            c.className = `card hand-card ${CARDS_DB[k].color}`; 
            c.style.setProperty('--flare-col', CARDS_DB[k].fCol);
            if(u.disabled===k) c.classList.add('disabled-card');
            
            c.innerHTML = `<div class="card-art" style="background-image: url('${CARDS_DB[k].img}')"></div>`;
            
            c.onclick = () => onCardClick(i); 
            bindTT(c,k); 
            h.appendChild(c); 
            apply3DTilt(c, true);
            
            c.onmouseenter = e => { 
                bindTT(c,k).onmouseenter(e); 
                document.body.classList.add('focus-hand'); 
                playSound('sfx-hover'); 
                if(checkCardLethality(k)) { isLethalHover=true; document.body.classList.add('tension-active'); }
            };
            c.onmouseleave = () => { 
                document.getElementById('tooltip-box').style.display='none'; 
                document.body.classList.remove('focus-hand','tension-active'); 
                isLethalHover=false; 
            }
        });
    }
}

// Funções de Gameplay (Combate)
function checkCardLethality(k) { if(k==='ATAQUE') return player.lvl>=monster.hp?'red':false; if(k==='BLOQUEIO') return (1+player.bonusBlock)>=monster.hp?'blue':false; return false; }

function onCardClick(i) {
    if(isProcessing) return; if (!player.hand[i]) return;
    playSound('sfx-play'); document.body.classList.remove('focus-hand','cinematic-active','tension-active');
    document.getElementById('tooltip-box').style.display='none'; isLethalHover=false; 
    let k = player.hand[i];
    if(player.disabled===k) { showCenterText("DESARMADA!"); return; }
    if(k==='DESARMAR') window.openModal('ALVO DO DESARME', 'Bloquear ação?', ACTION_KEYS, (c)=>playCardFlow(i,c)); 
    else playCardFlow(i, null);
}

function playCardFlow(idx, pDisarm) {
    isProcessing = true; 
    let pKey = player.hand.splice(idx, 1)[0]; 
    playerHistory.push(pKey);
    let ai = getBestAIMove(); 
    let mKey = 'ATAQUE'; let mDisarm = null; 
    
    if(ai) { 
        mKey = ai.card; monster.hand.splice(ai.index, 1); 
        if(mKey==='DESARMAR'){ if(player.hp<=4)mDisarm='BLOQUEIO'; else mDisarm='ATAQUE'; } 
    } else { 
        if(monster.hand.length>0) mKey=monster.hand.pop(); 
        else { drawCardLogic(monster,1); if(monster.hand.length>0) mKey=monster.hand.pop(); } 
    }

    let pHandEl = document.getElementById('player-hand'); 
    if(pHandEl.children[idx]) pHandEl.children[idx].style.opacity = '0'; 

    // Animação de Combate (DOM ainda é melhor para Mão -> Mesa)
    animateFly('player-hand', 'p-slot', pKey, () => { renderTable(pKey, 'p-slot'); updateUI(); }, false, true); 
    animateFly({top:-150,left:window.innerWidth/2}, 'm-slot', mKey, () => { renderTable(mKey, 'm-slot'); setTimeout(()=>resolveTurn(pKey, mKey, pDisarm, mDisarm), 500); }, false, true);
}

function resolveTurn(pAct, mAct, pDisarm, mDisarm) {
    let pDmg=0, mDmg=0;
    if(mAct==='ATAQUE') pDmg+=monster.lvl; if(pAct==='ATAQUE') mDmg+=player.lvl;
    if(pAct==='BLOQUEIO'){ pDmg=0; if(mAct==='ATAQUE') mDmg+=(1+player.bonusBlock); }
    if(mAct==='BLOQUEIO'){ mDmg=0; if(pAct==='ATAQUE') pDmg+=(1+monster.bonusBlock); }
    
    let clash=(pAct==='BLOQUEIO'&&mAct==='ATAQUE')||(mAct==='BLOQUEIO'&&pAct==='ATAQUE');
    if(clash) triggerBlockEffect();

    let nextPDis=null, nextMDis=null;
    if(mAct==='DESARMAR') nextPDis = mDisarm || 'ATAQUE';
    if(pAct==='DESARMAR') nextMDis = pDisarm;
    if(pAct==='DESARMAR' && mAct==='DESARMAR') { nextPDis=null; nextMDis=null; showCenterText("ANULADO", "#aaa"); }

    player.disabled=nextPDis; monster.disabled=nextMDis;
    if(pDmg>=4||mDmg>=4) triggerCritEffect();
    if(pDmg>0){ player.hp-=pDmg; showFloatingText('p-lvl',`-${pDmg}`,"#ff7675"); triggerDamageEffect(true, !clash); }
    if(mDmg>0){ monster.hp-=mDmg; showFloatingText('m-lvl',`-${mDmg}`,"#ff7675"); triggerDamageEffect(false, !clash); }
    
    updateUI();
    let pDead=player.hp<=0, mDead=monster.hp<=0;
    
    if(!pDead && pAct==='DESCANSAR'){ let h=(pDmg===0)?3:2; player.hp=Math.min(player.maxHp,player.hp+h); showFloatingText('p-lvl',`+${h} HP`,"#55efc4"); triggerHealEffect(true); playSound('sfx-heal'); }
    if(!mDead && mAct==='DESCANSAR'){ let h=(mDmg===0)?3:2; monster.hp=Math.min(monster.maxHp,monster.hp+h); triggerHealEffect(false); playSound('sfx-heal'); }

    function xp(u){ if(u.deck.length>0){ let c=u.deck.pop(); animateFly(u.id+'-deck-container', u.id+'-xp', c, ()=>{ u.xp.push(c); triggerXPGlow(u.id); updateUI(); }); } }
    if(!pDead && pAct==='TREINAR') xp(player); if(!mDead && mAct==='TREINAR') xp(monster);
    if(!pDead && pAct==='ATAQUE' && mAct==='DESCANSAR') xp(player); if(!mDead && mAct==='ATAQUE' && pAct==='DESCANSAR') xp(monster);

    setTimeout(() => {
        animateFly('p-slot', 'p-xp', pAct, () => { if(!pDead){ player.xp.push(pAct); triggerXPGlow('p'); updateUI(); } checkLevelUp(player, ()=>{ if(!pDead) drawCardAnimated(player, 'p-deck', 'p-hand', ()=>{ drawCardLogic(player,1); turnCount++; updateUI(); isProcessing=false; }); }); });
        animateFly('m-slot', 'm-xp', mAct, () => { if(!mDead){ monster.xp.push(mAct); triggerXPGlow('m'); updateUI(); } checkLevelUp(monster, ()=>{ if(!mDead) drawCardLogic(monster,1); checkEndGame(); }); });
        document.getElementById('p-slot').innerHTML=''; document.getElementById('m-slot').innerHTML='';
    }, 700);
}

function checkLevelUp(u, cb) {
    if(u.xp.length>=5) {
        let xc=document.getElementById(u.id+'-xp'); let minis=Array.from(xc.getElementsByClassName('xp-mini'));
        minis.forEach(r=>{ 
            let rect=r.getBoundingClientRect(); let c=document.createElement('div'); c.className='xp-anim-clone '+(u.id==='p'?'xp-fly-up':'xp-fly-down');
            c.style.left=rect.left+'px'; c.style.top=rect.top+'px'; c.style.backgroundImage=r.style.backgroundImage; document.body.appendChild(c);
        });
        minis.forEach(m=>m.style.opacity='0');
        setTimeout(()=>{
            let counts={}; u.xp.forEach(x=>counts[x]=(counts[x]||0)+1); let trigs=[]; for(let k in counts)if(counts[k]>=3&&k!=='DESCANSAR')trigs.push(k);
            processMasteries(u, trigs, ()=>{
                document.getElementById(u.id+'-lvl').classList.add('level-up-anim'); u.lvl++; playSound('sfx-levelup'); setTimeout(()=>document.getElementById(u.id+'-lvl').classList.remove('level-up-anim'),1000);
                u.xp.forEach(x=>u.deck.push(x)); u.xp=[]; shuffle(u.deck);
                Array.from(document.getElementsByClassName('xp-anim-clone')).forEach(c=>c.remove());
                updateUI(); cb();
            });
        },1000);
    } else cb();
}

function processMasteries(u, trigs, cb) {
    if(trigs.length===0){cb();return;} let t=trigs.shift();
    if(u.id==='p'){
        if(t==='TREINAR'){ let opts=[...new Set(u.xp.filter(x=>x!=='TREINAR'))]; if(opts.length) window.openModal("MAESTRIA", "Copiar qual?", opts, c=>{ if(c==='DESARMAR')window.openModal("TÁTICA","Bloquear?",ACTION_KEYS,k=>{monster.disabled=k;processMasteries(u,trigs,cb)}); else{applyMastery(u,c);processMasteries(u,trigs,cb)} }); else processMasteries(u,trigs,cb); }
        else if(t==='DESARMAR'){ window.openModal("TÁTICA","Bloquear?",ACTION_KEYS,c=>{monster.disabled=c;processMasteries(u,trigs,cb)}); }
        else { applyMastery(u,t); processMasteries(u,trigs,cb); }
    } else {
        if(t==='TREINAR'){ let opts=[...new Set(u.xp.filter(x=>x!=='TREINAR'&&x!=='DESCANSAR'))]; if(opts.length) applyMastery(u,opts[0]); }
        else if(t==='DESARMAR'){ let tg=player.hp<=4?'BLOQUEIO':'ATAQUE'; player.disabled=tg; }
        else applyMastery(u,t);
        processMasteries(u,trigs,cb);
    }
}

// Helpers e Utilidades
function getBestAIMove() {
    let moves=[]; monster.hand.forEach((c,i)=>{ if(c!==monster.disabled) moves.push({card:c, index:i, score:0}); });
    if(moves.length===0) return null;
    let hist=playerHistory.slice(-5); let aggro=hist.length>0?(hist.filter(c=>c==='ATAQUE').length/hist.length):0.5;
    let dying=monster.hp<=(player.lvl+player.bonusAtk);
    moves.forEach(m=>{
        let s=50;
        if(m.card==='ATAQUE'){ if(player.hp<=(monster.lvl+monster.bonusAtk)) s+=500; if(aggro<0.4)s+=40; if(dying)s-=30; }
        else if(m.card==='BLOQUEIO'){ if(dying)s+=100; if(aggro>0.6)s+=60; }
        else if(m.card==='DESCANSAR'){ if(monster.hp===monster.maxHp)s-=100; else if(monster.hp<=3)s+=50; }
        else if(m.card==='DESARMAR'){ if(dying)s+=120; if(aggro>0.8)s+=50; }
        else if(m.card==='TREINAR'){ if(turnCount<5)s+=30; if(dying)s-=200; }
        m.score=s+Math.random()*15;
    });
    moves.sort((a,b)=>b.score-a.score); return moves[0];
}

function checkEndGame(){ 
    if(player.hp<=0 || monster.hp<=0) { 
        isProcessing = true; isLethalHover = false; MusicController.stopCurrent();
        setTimeout(()=>{ 
            let title = document.getElementById('end-title'); 
            let win = player.hp > 0; let tie = player.hp <= 0 && monster.hp <= 0;
            if(tie) { title.innerText="EMPATE"; title.className="tie-theme"; playSound('sfx-tie'); }
            else if(win) { title.innerText="VITÓRIA"; title.className="win-theme"; playSound('sfx-win'); }
            else { title.innerText="DERROTA"; title.className="lose-theme"; playSound('sfx-lose'); }
            if(win && !tie) window.registrarVitoriaOnline(); else window.registrarDerrotaOnline();
            document.getElementById('end-screen').classList.add('visible'); 
        }, 1000); 
    } else isProcessing = false; 
}

function applyMastery(u, k) { 
    if(k==='ATAQUE'){ u.bonusAtk++; let t=u===player?monster:player; t.hp-=u.bonusAtk; showFloatingText(t.id+'-lvl',`-${u.bonusAtk}`,'#ff7675'); triggerDamageEffect(u!==player); checkEndGame(); }
    if(k==='BLOQUEIO')u.bonusBlock++; if(k==='DESCANSAR'){ u.maxHp++; showFloatingText(u.id+'-hp-txt','+1 MAX','#55efc4'); } updateUI();
}
function drawCardLogic(u, qty) { for(let i=0;i<qty;i++)if(u.deck.length>0)u.hand.push(u.deck.pop()); u.hand.sort(); }
function animateFly(sId, eId, k, cb, ini, tbl) {
    let s; if(typeof sId==='string'){ let el=document.getElementById(sId); if(!el)s={top:0,left:0,width:0}; else s=el.getBoundingClientRect(); } else s=sId;
    let e={top:0,left:0}; let dest=document.getElementById(eId); if(dest) e=dest.getBoundingClientRect();
    let f=document.createElement('div'); f.className=`card flying-card ${CARDS_DB[k].color}`;
    f.innerHTML=`<div class="card-art" style="background-image: url('${CARDS_DB[k].img}')"></div>`;
    if(tbl) f.classList.add('card-bounce');
    let w=window.innerWidth<768?'84px':'105px'; let h=window.innerWidth<768?'120px':'150px';
    f.style.width=s.width>0?s.width+'px':w; f.style.height=s.height>0?s.height+'px':h;
    f.style.top=s.top+'px'; f.style.left=s.left+'px'; document.body.appendChild(f);
    setTimeout(()=>{ f.style.top=e.top+'px'; f.style.left=e.left+'px'; if(tbl){f.style.width=(window.innerWidth<768?'110px':'180px');f.style.height=(window.innerWidth<768?'170px':'260px');} },10);
    setTimeout(()=>{ f.remove(); if(cb)cb(); },600);
}
function renderTable(k,s){ let el=document.getElementById(s); el.innerHTML=''; let c=document.createElement('div'); c.className=`card ${CARDS_DB[k].color} card-on-table`; c.innerHTML=`<div class="card-art" style="background-image: url('${CARDS_DB[k].img}')"></div>`; el.appendChild(c); }
function addMI(p,k,v,c,oid){ let d=document.createElement('div'); d.className='mastery-icon'; d.innerHTML=`${CARDS_DB[k].icon}<span class="mastery-lvl">${v}</span>`; d.style.borderColor=c; bindTT(d,k,v,oid); p.appendChild(d); }
function bindTT(el,k,v,oid){ 
    return { onmouseenter:()=>{ 
        let tt=document.getElementById('tooltip-box'); let db=CARDS_DB[k]; document.getElementById('tt-title').innerHTML=k; 
        if(v) document.getElementById('tt-content').innerHTML=`<span class='tt-val'>+${v}</span> - ${db.mastery}`;
        else document.getElementById('tt-content').innerHTML=db.customTooltip?db.customTooltip.replace('{PLAYER_LVL}',player.lvl):`<span class='tt-val'>${db.base}</span>`;
        tt.style.display='block'; let r=el.getBoundingClientRect(); tt.style.left=(r.left+r.width/2)+'px'; tt.style.top=(oid==='m'?r.bottom+10:r.top-10-tt.offsetHeight)+'px'; 
    }};
}
function showFloatingText(eid,t,c){ let el=document.createElement('div'); el.className='floating-text'; el.innerText=t; el.style.color=c; let p=document.getElementById(eid); if(p){let r=p.getBoundingClientRect(); el.style.left=(r.left+r.width/2)+'px'; el.style.top=r.top+'px';} document.body.appendChild(el); setTimeout(()=>el.remove(),2000); }
function showCenterText(t,c){let el=document.createElement('div');el.className='center-text';el.innerText=t;if(c)el.style.color=c;document.body.appendChild(el);setTimeout(()=>el.remove(),1000);}
window.openModal=function(t,d,o,c){document.getElementById('modal-title').innerText=t;document.getElementById('modal-desc').innerText=d;let g=document.getElementById('modal-btns');g.innerHTML='';o.forEach(k=>{let b=document.createElement('button');b.className='mini-btn';b.innerText=k;b.onclick=()=>{document.getElementById('modal-overlay').style.display='none';c(k)};g.appendChild(b)});document.getElementById('modal-overlay').style.display='flex';}
window.cancelModal=function(){document.getElementById('modal-overlay').style.display='none';isProcessing=false;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}
window.toggleConfig = function() { let p = document.getElementById('config-panel'); if(p.style.display==='flex'){ p.style.display='none'; p.classList.remove('active'); document.body.classList.remove('config-mode'); } else { p.style.display='flex'; p.classList.add('active'); document.body.classList.add('config-mode'); } }
document.addEventListener('click', function(e) { const panel = document.getElementById('config-panel'); const btn = document.getElementById('btn-config-toggle'); if (panel && panel.classList.contains('active') && !panel.contains(e.target) && (btn && !btn.contains(e.target))) window.toggleConfig(); });
window.toggleFullScreen = function() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(e => console.log(e)); } else { if (document.exitFullscreen) { document.exitFullscreen(); } } }
window.updateVol = function(type, val) { if(type==='master') window.masterVol = parseFloat(val); }

window.goToLobby = async function(isAutoLogin = false) {
    if(!currentUser) { window.showScreen('start-screen'); MusicController.play('bgm-menu'); return; }
    document.getElementById('game-background').classList.add('lobby-mode');
    MusicController.play('bgm-menu'); createLobbyFlares();
    
    const userRef = doc(db, "players", currentUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
        await setDoc(userRef, { name: currentUser.displayName, score: 0, totalWins: 0 });
        document.getElementById('lobby-username').innerText = `OLÁ, ${currentUser.displayName.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = "VITÓRIAS: 0 | PONTOS: 0";
    } else {
        const d = snap.data();
        document.getElementById('lobby-username').innerText = `OLÁ, ${d.name.split(' ')[0].toUpperCase()}`;
        document.getElementById('lobby-stats').innerText = `VITÓRIAS: ${d.totalWins||0} | PONTOS: ${d.score||0}`;
    }
    const q = query(collection(db, "players"), orderBy("score", "desc"), limit(10));
    onSnapshot(q, (snapshot) => {
        let html = '<table id="ranking-table"><thead><tr><th>#</th><th>JOGADOR</th><th>PTS</th></tr></thead><tbody>';
        let pos = 1;
        snapshot.forEach((doc) => {
            const p = doc.data();
            let cls = pos===1?"rank-1":(pos===2?"rank-2":(pos===3?"rank-3":""));
            html += `<tr class="${cls}"><td class="rank-pos">${pos}</td><td>${p.name.split(' ')[0].toUpperCase()}</td><td>${p.score}</td></tr>`;
            pos++;
        });
        document.getElementById('ranking-content').innerHTML = html + '</tbody></table>';
    });
    window.showScreen('lobby-screen'); document.getElementById('end-screen').classList.remove('visible');
}

window.showScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    const surrenderBtn = document.getElementById('btn-surrender');
    const configBtn = document.getElementById('btn-config-toggle');
    if(screenId === 'game-screen') { if(surrenderBtn) surrenderBtn.style.display='block'; if(configBtn) configBtn.style.display='flex'; }
    else { if(surrenderBtn) surrenderBtn.style.display='none'; if(configBtn) configBtn.style.display='none'; document.getElementById('config-panel').style.display='none'; }
}

window.transitionToGame = function() {
    const ts = document.getElementById('transition-overlay'); ts.classList.add('active');
    ts.querySelector('.trans-text').innerText = "PREPARANDO BATALHA...";
    setTimeout(() => {
        MusicController.play('bgm-loop');
        document.getElementById('game-background').classList.remove('lobby-mode');
        window.showScreen('game-screen');
        document.getElementById('player-hand').innerHTML = '';
        setTimeout(() => { ts.classList.remove('active'); setTimeout(startGameFlow, 200); }, 1500);
    }, 500);
}

window.transitionToLobby = function() {
    const ts = document.getElementById('transition-overlay'); ts.classList.add('active');
    ts.querySelector('.trans-text').innerText = "RETORNANDO AO SAGUÃO...";
    MusicController.stopCurrent();
    setTimeout(() => { window.goToLobby(false); setTimeout(() => { ts.classList.remove('active'); }, 1000); }, 500);
}

window.registrarVitoriaOnline = async function() { if(!currentUser)return; try{const r=doc(db,"players",currentUser.uid);const s=await getDoc(r);if(s.exists()){const d=s.data();await updateDoc(r,{totalWins:(d.totalWins||0)+1,score:(d.score||0)+100});}}catch(e){} };
window.registrarDerrotaOnline = async function() { if(!currentUser)return; try{const r=doc(db,"players",currentUser.uid);const s=await getDoc(r);if(s.exists())await updateDoc(r,{score:(s.data().score||0)+10});}catch(e){} };
window.restartMatch = function() { document.getElementById('end-screen').classList.remove('visible'); setTimeout(startGameFlow,50); MusicController.play('bgm-loop'); };
window.abandonMatch = function() { if(document.getElementById('game-screen').classList.contains('active')){window.toggleConfig();if(confirm("Sair? Contará como derrota.")) { window.registrarDerrotaOnline(); window.transitionToLobby(); }}};

function startCinematicLoop() { const c = audios['sfx-cine']; if(c) {c.volume = 0; c.play().catch(()=>{}); if(mixerInterval) clearInterval(mixerInterval); mixerInterval = setInterval(updateAudioMixer, 30); }}
function updateAudioMixer() { 
    const cineAudio = audios['sfx-cine']; if(!cineAudio) return; 
    const mVol = window.masterVol || 1.0; const maxCine = 0.6 * mVol; 
    let targetCine = isLethalHover ? maxCine : 0; 
    if(window.isMuted) { cineAudio.volume = 0; return; }
    if(cineAudio.volume < targetCine) cineAudio.volume = Math.min(targetCine, cineAudio.volume + 0.05); 
    else if(cineAudio.volume > targetCine) cineAudio.volume = Math.max(targetCine, cineAudio.volume - 0.05); 
}

function createLobbyFlares() {
    const container = document.getElementById('lobby-particles');
    if(!container) return;
    container.innerHTML = ''; 
    for(let i=0; i < 70; i++) {
        let flare = document.createElement('div');
        flare.className = 'lobby-flare';
        flare.style.left = Math.random() * 100 + '%';
        flare.style.top = Math.random() * 100 + '%';
        let size = 4 + Math.random() * 18; 
        flare.style.width = size + 'px';
        flare.style.height = size + 'px';
        flare.style.animationDuration = (3 + Math.random() * 5) + 's'; 
        flare.style.animationDelay = (Math.random() * 4) + 's';
        container.appendChild(flare);
    }
}
function initAmbientParticles() { const container = document.getElementById('ambient-particles'); if(!container) return; for(let i=0; i<50; i++) { let d = document.createElement('div'); d.className = 'ember'; d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (5 + Math.random() * 5) + 's'; d.style.setProperty('--mx', (Math.random() - 0.5) * 50 + 'px'); container.appendChild(d); } }
initAmbientParticles();

function apply3DTilt(element, isHand = false) { if(window.innerWidth < 768) return; element.addEventListener('mousemove', (e) => { const rect = element.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const xPct = (x / rect.width) - 0.5; const yPct = (y / rect.height) - 0.5; let lift = isHand ? 'translateY(-100px) scale(1.8)' : 'scale(1.1)'; let rotate = `rotateX(${yPct * -40}deg) rotateY(${xPct * 40}deg)`; if(element.classList.contains('disabled-card')) rotate = `rotateX(${yPct * -10}deg) rotateY(${xPct * 10}deg)`; element.style.transform = `${lift} ${rotate}`; let art = element.querySelector('.card-art'); if(art) art.style.backgroundPosition = `${50 + (xPct * 20)}% ${50 + (yPct * 20)}%`; }); element.addEventListener('mouseleave', () => { element.style.transform = isHand ? 'translateY(0) scale(1)' : 'scale(1)'; let art = element.querySelector('.card-art'); if(art) art.style.backgroundPosition = 'center'; }); }

function preloadGame() {
    ASSETS_TO_LOAD.images.forEach(src => { let i=new Image(); i.src=src; i.onload=updateLoader; i.onerror=updateLoader; });
    ASSETS_TO_LOAD.audio.forEach(a => { let s=new Audio(); s.src=a.src; if(a.loop)s.loop=true; audios[a.id]=s; s.onloadedmetadata=updateLoader; s.onerror=updateLoader; });
}
function updateLoader() {
    assetsLoaded++; let fill = document.getElementById('loader-fill'); if(fill) fill.style.width = Math.min(100,(assetsLoaded/totalAssets)*100)+'%';
    if(assetsLoaded>=totalAssets) {
        setTimeout(() => { let ls=document.getElementById('loading-screen'); if(ls){ls.style.opacity='0'; setTimeout(()=>ls.style.display='none',500);} }, 1000);
        document.body.addEventListener('click', () => { if(!MusicController.currentTrackId) MusicController.play('bgm-menu'); }, {once:true});
    }
}
window.onload = function() { preloadGame(); const b=document.getElementById('btn-sound'); if(b) b.addEventListener('click', (e)=>{e.stopPropagation(); window.toggleMute();}); };

function playSound(key) { if(audios[key]) { audios[key].currentTime = 0; audios[key].play().catch(e => console.log("Audio prevented:", e)); } }
