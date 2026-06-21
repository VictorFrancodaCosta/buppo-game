// ARQUIVO: js/audio_controller.js

export const audios = {};
window.masterVol = 0.5;
window.musicEnabled = false;
window.sfxEnabled = false;

let lastHoverTime = 0;
let lastLobbyButtonHoverTime = 0;
let mixerInterval = null;
let audioUnlockAttempts = 0;
const fadeTimers = new WeakMap();
let uiAudioContext = null;
const uiAudioBuffers = {};
const uiAudioLoading = {};
let lastLobbyHoverElement = null;

function getBaseVolume(key) {
    if(key === 'sfx-ui-hover') return 0.3;
    if(key === 'sfx-button') return 0.78;
    if(key === 'sfx-levelup' || key === 'sfx-coin') return 1.0;
    if(key === 'sfx-mastery') return 0.95;
    if(key === 'sfx-train') return 0.5;
    if(key && key.startsWith('bgm')) return 0.5;
    if(key === 'sfx-cine') return 0.6;
    return 0.8;
}

function clearAudioFade(audio) {
    const timer = fadeTimers.get(audio);
    if(timer) {
        clearInterval(timer);
        fadeTimers.delete(audio);
    }
}

function getUiAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx) return null;
    if(!uiAudioContext) uiAudioContext = new AudioCtx();
    return uiAudioContext;
}

function loadUiBuffer(key) {
    if(uiAudioBuffers[key]) return Promise.resolve(uiAudioBuffers[key]);
    if(uiAudioLoading[key]) return uiAudioLoading[key];
    const audio = audios[key];
    const ctx = getUiAudioContext();
    if(!audio || !ctx) return Promise.resolve(null);
    const src = audio.currentSrc || audio.src;
    uiAudioLoading[key] = fetch(src)
        .then(response => response.arrayBuffer())
        .then(buffer => ctx.decodeAudioData(buffer))
        .then(decoded => {
            uiAudioBuffers[key] = decoded;
            return decoded;
        })
        .catch(() => null)
        .finally(() => { delete uiAudioLoading[key]; });
    return uiAudioLoading[key];
}

function warmUiAudioBuffers() {
    ['sfx-button', 'sfx-ui-hover', 'sfx-nav'].forEach(key => loadUiBuffer(key));
}

function playUiBuffer(key, volumeMultiplier) {
    const ctx = getUiAudioContext();
    const buffer = uiAudioBuffers[key];
    if(!ctx || !buffer || ctx.state !== 'running' || !window.sfxEnabled) return false;
    try {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = volumeMultiplier * (window.masterVol || 1.0);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        return true;
    } catch(e) {
        return false;
    }
}

function playSfxClone(key, fallbackKey = null, volumeMultiplier = null) {
    const audioKey = audios[key] ? key : fallbackKey;
    const base = audioKey ? audios[audioKey] : null;
    if(!base || !window.sfxEnabled) return false;
    const baseVolume = volumeMultiplier ?? getBaseVolume(audioKey);
    if(playUiBuffer(audioKey, baseVolume)) return true;
    try {
        const s = base.cloneNode();
        s.muted = false;
        s.volume = baseVolume * (window.masterVol || 1.0);
        s.play().catch(()=>{});
        loadUiBuffer(audioKey);
        return true;
    } catch(e) {
        return false;
    }
}

function getPreferredMusicTrack() {
    if(document.getElementById('game-screen')?.classList.contains('active')) return 'bgm-loop';
    return 'bgm-menu';
}

export const MusicController = {
    currentTrackId: null,
    fadeTimer: null,
    play(trackId) {
        if (!audios[trackId]) return;
        try {
            if (this.currentTrackId === trackId) {
                if (audios[trackId].paused && window.musicEnabled) {
                    const audio = audios[trackId];
                    if (audio.readyState >= 2) audio.currentTime = 0;
                    audio.volume = 0; audio.play().catch(()=>{});
                    this.fadeIn(audio, 0.5 * window.masterVol);
                }
                return;
            }
            const maxVol = 0.5 * window.masterVol;
            if (this.currentTrackId && audios[this.currentTrackId]) {
                const oldAudio = audios[this.currentTrackId];
                this.fadeOut(oldAudio);
            }
            if (trackId && audios[trackId]) {
                const newAudio = audios[trackId];
                if (newAudio.readyState >= 2) newAudio.currentTime = 0;
                if (window.musicEnabled) {
                    newAudio.volume = 0; newAudio.play().catch(()=>{});
                    this.fadeIn(newAudio, maxVol);
                }
            }
            this.currentTrackId = trackId;
        } catch(e) {}
    },
    stopCurrent() {
        if (this.currentTrackId && audios[this.currentTrackId]) { this.fadeOut(audios[this.currentTrackId]); }
        this.currentTrackId = null;
    },
    fadeOut(audio) {
        if(!audio) return;
        clearAudioFade(audio);
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) { vol -= 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); } }
            else { try { audio.volume = 0; audio.pause(); } catch(e){} clearInterval(fadeOutInt); fadeTimers.delete(audio); }
        }, 50);
        fadeTimers.set(audio, fadeOutInt);
    },
    fadeIn(audio, targetVol) {
        if(!audio) return;
        clearAudioFade(audio);
        let vol = 0; audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) { vol += 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); } }
            else { try { audio.volume = targetVol; } catch(e){} clearInterval(fadeInInt); fadeTimers.delete(audio); }
        }, 50);
        fadeTimers.set(audio, fadeInInt);
    }
};

window.playNavSound = function() {
    if(!window.sfxEnabled) return;
    playSfxClone('sfx-nav');
};

window.playUIHoverSound = function() {
    if(!window.sfxEnabled) return;
    let now = Date.now();
    if (now - lastHoverTime < 50) return;
    if(playSfxClone('sfx-ui-hover')) lastHoverTime = now;
};

window.playLobbyButtonHoverSound = function() {
    if(!window.sfxEnabled) return;
    let now = Date.now();
    if(now - lastLobbyButtonHoverTime < 110) return;
    if(playSfxClone('sfx-button', audios['sfx-ui-hover'] ? 'sfx-ui-hover' : 'sfx-nav')) lastLobbyButtonHoverTime = now;
};

window.unlockGameAudio = function() {
    const keys = Object.keys(audios);
    const ctx = getUiAudioContext();
    if(ctx) {
        ctx.resume().then(() => warmUiAudioBuffers()).catch(()=>{});
    }
    if(!keys.length || audioUnlockAttempts > 8) return;
    audioUnlockAttempts++;
    keys.forEach((key) => {
        const audio = audios[key];
        if(!audio || audio.loop) return;
        try {
            const previousVolume = audio.volume;
            audio.muted = true;
            const playPromise = audio.play();
            if(playPromise && typeof playPromise.then === 'function') {
                playPromise.then(() => {
                    try {
                        audio.pause();
                        if(audio.readyState >= 2) audio.currentTime = 0;
                        audio.muted = false;
                        audio.volume = previousVolume;
                    } catch(e) {}
                }).catch(() => {
                    try {
                        audio.muted = false;
                        audio.volume = previousVolume;
                    } catch(e) {}
                });
            } else {
                audio.pause();
                if(audio.readyState >= 2) audio.currentTime = 0;
                audio.muted = false;
                audio.volume = previousVolume;
            }
        } catch(e) {}
    });
};

['pointerdown', 'click', 'keydown', 'touchstart'].forEach((eventName) => {
    document.addEventListener(eventName, () => window.unlockGameAudio?.(), { capture: true, passive: true });
});

window.bindAudioSettingsControls = function() {
    const slider = document.getElementById('vol-slider');
    const music = document.getElementById('check-music');
    const sfx = document.getElementById('check-sfx');
    if(slider && slider.dataset.audioBound !== '1') {
        slider.dataset.audioBound = '1';
        const applySlider = () => {
            window.unlockGameAudio?.();
            window.updateVol('master', slider.value);
        };
        slider.addEventListener('input', applySlider);
        slider.addEventListener('change', applySlider);
        slider.addEventListener('pointerdown', () => window.unlockGameAudio?.());
    }
    if(music && music.dataset.audioBound !== '1') {
        music.dataset.audioBound = '1';
        const applyMusic = () => {
            window.unlockGameAudio?.();
            window.toggleSoundType('music');
        };
        music.addEventListener('input', applyMusic);
        music.addEventListener('change', applyMusic);
        const label = music.closest('label');
        if(label) {
            label.addEventListener('click', (event) => {
                event.preventDefault();
                music.checked = !music.checked;
                applyMusic();
            });
        }
    }
    if(sfx && sfx.dataset.audioBound !== '1') {
        sfx.dataset.audioBound = '1';
        const applySfx = () => {
            window.unlockGameAudio?.();
            window.toggleSoundType('sfx');
        };
        sfx.addEventListener('input', applySfx);
        sfx.addEventListener('change', applySfx);
        const label = sfx.closest('label');
        if(label) {
            label.addEventListener('click', (event) => {
                event.preventDefault();
                sfx.checked = !sfx.checked;
                applySfx();
            });
        }
    }
};

if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.bindAudioSettingsControls?.());
} else {
    window.bindAudioSettingsControls?.();
}

document.addEventListener('pointerover', (event) => {
    const button = event.target?.closest?.('#lobby-screen .lobby-menu-button');
    if(!button || button === lastLobbyHoverElement) return;
    lastLobbyHoverElement = button;
    window.playLobbyButtonHoverSound?.();
}, true);

document.addEventListener('pointerout', (event) => {
    const button = event.target?.closest?.('#lobby-screen .lobby-menu-button');
    if(button && !button.contains(event.relatedTarget)) lastLobbyHoverElement = null;
}, true);

window.updateVol = function(type, val) {
    if(type==='master') {
        const parsed = parseFloat(val);
        window.masterVol = Number.isFinite(parsed) ? parsed : 0.5;
    }
    ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-hit-mage', 'sfx-block', 'sfx-block-mage', 'sfx-heal', 'sfx-levelup', 'sfx-train', 'sfx-disarm', 'sfx-mastery', 'sfx-deck-select', 'sfx-coin', 'sfx-hover', 'sfx-ui-hover', 'sfx-button', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'bgm-loop', 'sfx-nav', 'sfx-cine'].forEach(k => {
        if(audios[k]) {
            try {
                if(k.startsWith('bgm') || k === MusicController.currentTrackId) clearAudioFade(audios[k]);
                audios[k].muted = (k.startsWith('bgm') && !window.musicEnabled) || (!k.startsWith('bgm') && !window.sfxEnabled);
                audios[k].volume = getBaseVolume(k) * window.masterVol;
            } catch(e){}
        }
    });
    if(MusicController.currentTrackId && audios[MusicController.currentTrackId]) {
        try {
            audios[MusicController.currentTrackId].muted = !window.musicEnabled;
            audios[MusicController.currentTrackId].volume = getBaseVolume(MusicController.currentTrackId) * window.masterVol;
        } catch(e) {}
    }
    if(window.saveAudioSettings) window.saveAudioSettings();
}

window.toggleSoundType = function(type) {
    if (type === 'music') {
        window.musicEnabled = document.getElementById('check-music').checked;
        if (!window.musicEnabled) {
            Object.keys(audios).forEach((key) => {
                if(!key.startsWith('bgm')) return;
                try {
                    clearAudioFade(audios[key]);
                    audios[key].muted = true;
                    audios[key].pause();
                } catch(e) {}
            });
        } else {
            const targetTrack = MusicController.currentTrackId || getPreferredMusicTrack();
            MusicController.currentTrackId = null;
            if(audios[targetTrack]) audios[targetTrack].muted = false;
            MusicController.play(targetTrack);
            if (audios[targetTrack]) {
                try { audios[targetTrack].volume = getBaseVolume(targetTrack) * window.masterVol; } catch(e) {}
            }
        }
    } else {
        window.sfxEnabled = document.getElementById('check-sfx').checked;
        Object.keys(audios).forEach((key) => {
            if(key.startsWith('bgm')) return;
            try { audios[key].muted = !window.sfxEnabled; } catch(e) {}
        });
        if(window.sfxEnabled) window.playLobbyButtonHoverSound();
    }
    if(type === 'music') window.playNavSound();
    if(window.saveAudioSettings) window.saveAudioSettings();
};

export function playSound(key) {
    if(!window.currentUser) return;
    if (!window.sfxEnabled && !key.startsWith('bgm')) return;
    if(audios[key]) {
        try {
            if (key === 'sfx-levelup') {
                audios[key].volume = 1.0 * window.masterVol;
                if (audios[key].readyState >= 2) audios[key].currentTime = 0;
                audios[key].play().catch(()=>{});
                let clone = audios[key].cloneNode(); clone.volume = audios[key].volume; clone.play().catch(()=>{});
            } else {
                if (audios[key].readyState >= 2) audios[key].currentTime = 0;
                audios[key].play().catch(()=>{});
            }
        } catch(e){}
    }
}

export function startCinematicLoop() { 
    const c = audios['sfx-cine']; 
    if(c) {
        try { c.volume = 0; c.play().catch(()=>{}); } catch(e){} 
        if(mixerInterval) clearInterval(mixerInterval); 
        mixerInterval = setInterval(updateAudioMixer, 30); 
    }
}

function updateAudioMixer() {
    const cineAudio = audios['sfx-cine']; if(!cineAudio) return;
    const mVol = window.masterVol || 0.5; const maxCine = 0.6 * mVol; 
    let targetCine = window.isLethalHover ? maxCine : 0;
    if(!window.sfxEnabled) { try { cineAudio.volume = 0; } catch(e){} return; }
    try {
        if(cineAudio.volume < targetCine) cineAudio.volume = Math.min(targetCine, cineAudio.volume + 0.05);
        else if(cineAudio.volume > targetCine) cineAudio.volume = Math.max(targetCine, cineAudio.volume - 0.05);
    } catch(e){}
}
