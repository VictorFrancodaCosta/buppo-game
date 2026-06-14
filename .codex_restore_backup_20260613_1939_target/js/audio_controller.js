// ARQUIVO: js/audio_controller.js

export const audios = {};
window.masterVol = 0.5;
window.musicEnabled = true;
window.sfxEnabled = true;

let lastHoverTime = 0;
let mixerInterval = null;

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
        let vol = audio.volume;
        const fadeOutInt = setInterval(() => {
            if (vol > 0.05) { vol -= 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeOutInt); } }
            else { try { audio.volume = 0; audio.pause(); } catch(e){} clearInterval(fadeOutInt); }
        }, 50);
    },
    fadeIn(audio, targetVol) {
        if(!audio) return;
        let vol = 0; audio.volume = 0;
        const fadeInInt = setInterval(() => {
            if (vol < targetVol - 0.05) { vol += 0.05; try { audio.volume = vol; } catch(e){ clearInterval(fadeInInt); } }
            else { try { audio.volume = targetVol; } catch(e){} clearInterval(fadeInInt); }
        }, 50);
    }
};

window.playNavSound = function() {
    if(!window.sfxEnabled) return;
    let s = audios['sfx-nav'];
    if(s) {
        try { if (s.readyState >= 2) s.currentTime = 0; s.play().catch(()=>{}); } catch(e) {}
    }
};

window.playUIHoverSound = function() {
    if(!window.sfxEnabled) return;
    let now = Date.now();
    if (now - lastHoverTime < 50) return;
    let base = audios['sfx-ui-hover'];
    if(base) {
        try { let s = base.cloneNode(); s.volume = 0.3 * (window.masterVol || 1.0); s.play().catch(()=>{}); lastHoverTime = now; } catch(e){}
    }
};

window.updateVol = function(type, val) {
    if(type==='master') window.masterVol = parseFloat(val);
    ['sfx-deal', 'sfx-play', 'sfx-hit', 'sfx-hit-mage', 'sfx-block', 'sfx-block-mage', 'sfx-heal', 'sfx-levelup', 'sfx-train', 'sfx-disarm', 'sfx-mastery', 'sfx-deck-select', 'sfx-hover', 'sfx-ui-hover', 'sfx-win', 'sfx-lose', 'sfx-tie', 'bgm-menu', 'bgm-loop', 'sfx-nav', 'sfx-cine'].forEach(k => {
        if(audios[k]) {
            let baseVol = 0.8;
            if(k === 'sfx-ui-hover') baseVol = 0.3;
            else if (k === 'sfx-levelup') baseVol = 1.0;
            else if (k === 'sfx-mastery') baseVol = 0.95;
            else if (k === 'sfx-train') baseVol = 0.5;
            else if (k.startsWith('bgm')) baseVol = 0.5;
            else if (k === 'sfx-cine') baseVol = 0.6;
            try { audios[k].volume = baseVol * window.masterVol; } catch(e){}
        }
    });
    if(window.saveAudioSettings) window.saveAudioSettings();
}

window.toggleSoundType = function(type) {
    window.playNavSound();
    if (type === 'music') {
        window.musicEnabled = document.getElementById('check-music').checked;
        if (!window.musicEnabled) {
            if (MusicController.currentTrackId && audios[MusicController.currentTrackId]) audios[MusicController.currentTrackId].pause();
        } else {
            if (MusicController.currentTrackId && audios[MusicController.currentTrackId]) audios[MusicController.currentTrackId].play().catch(()=>{});
        }
    } else {
        window.sfxEnabled = document.getElementById('check-sfx').checked;
    }
    if(window.saveAudioSettings) window.saveAudioSettings();
};

export function playSound(key) {
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
