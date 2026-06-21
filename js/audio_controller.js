// ARQUIVO: js/audio_controller.js

export const audios = {};

window.masterVol = 0.5;
window.musicEnabled = false;
window.sfxEnabled = false;

let lastHoverTime = 0;
let lastLobbyButtonHoverTime = 0;
let lastLobbyHoverElement = null;
let mixerInterval = null;
let audioUnlocked = false;
let saveTimer = null;

function baseVolume(key) {
    if(key === 'sfx-ui-hover') return 0.45;
    if(key === 'sfx-button') return 1.0;
    if(key === 'sfx-levelup' || key === 'sfx-coin') return 1.0;
    if(key === 'sfx-mastery') return 0.95;
    if(key === 'sfx-train') return 0.5;
    if(key === 'sfx-cine') return 0.6;
    if(key && key.startsWith('bgm')) return 0.5;
    return 0.8;
}

function preferredMusicTrack() {
    return document.getElementById('game-screen')?.classList.contains('active') ? 'bgm-loop' : 'bgm-menu';
}

function scheduleSaveSettings() {
    if(!window.saveAudioSettings) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => window.saveAudioSettings?.(), 220);
}

function setAudioVolume(key, audio) {
    if(!audio) return;
    try {
        const isMusic = key.startsWith('bgm');
        audio.volume = Math.max(0, Math.min(1, baseVolume(key) * (window.masterVol || 0)));
        audio.muted = isMusic ? !window.musicEnabled : !window.sfxEnabled;
    } catch(e) {}
}

window.applyAudioSettings = function({ persist = true } = {}) {
    Object.entries(audios).forEach(([key, audio]) => setAudioVolume(key, audio));

    Object.entries(audios).forEach(([key, audio]) => {
        if(!key.startsWith('bgm') || !audio) return;
        try {
            if(!window.musicEnabled) {
                audio.pause();
                audio.muted = true;
            }
        } catch(e) {}
    });

    if(window.musicEnabled) {
        const trackId = MusicController.currentTrackId || preferredMusicTrack();
        MusicController.play(trackId);
    }

    if(persist) scheduleSaveSettings();
};

function playSfx(key, fallbackKey = null, volume = null) {
    if(!window.sfxEnabled) return false;
    const audioKey = audios[key] ? key : fallbackKey;
    const source = audioKey ? audios[audioKey] : null;
    if(!source) return false;

    try {
        const sound = source.cloneNode(true);
        sound.loop = false;
        sound.muted = false;
        sound.volume = Math.max(0, Math.min(1, (volume ?? baseVolume(audioKey)) * (window.masterVol || 0)));
        sound.play().catch(() => {});
        return true;
    } catch(e) {
        try {
            source.muted = false;
            source.volume = Math.max(0, Math.min(1, (volume ?? baseVolume(audioKey)) * (window.masterVol || 0)));
            if(source.readyState >= 2) source.currentTime = 0;
            source.play().catch(() => {});
            return true;
        } catch(err) {
            return false;
        }
    }
}

export const MusicController = {
    currentTrackId: null,
    play(trackId) {
        if(!trackId || !audios[trackId]) return;
        const next = audios[trackId];
        try {
            if(this.currentTrackId && this.currentTrackId !== trackId && audios[this.currentTrackId]) {
                audios[this.currentTrackId].pause();
            }
            this.currentTrackId = trackId;
            setAudioVolume(trackId, next);
            if(window.musicEnabled) {
                next.muted = false;
                if(next.paused) next.play().catch(() => {});
            }
        } catch(e) {}
    },
    stopCurrent() {
        if(this.currentTrackId && audios[this.currentTrackId]) {
            try { audios[this.currentTrackId].pause(); } catch(e) {}
        }
        this.currentTrackId = null;
    },
    fadeOut(audio) {
        if(!audio) return;
        try { audio.pause(); } catch(e) {}
    },
    fadeIn(audio, targetVol) {
        if(!audio) return;
        try {
            audio.volume = Math.max(0, Math.min(1, targetVol));
            if(window.musicEnabled) audio.play().catch(() => {});
        } catch(e) {}
    }
};

window.unlockGameAudio = function() {
    audioUnlocked = true;
    Object.entries(audios).forEach(([key, audio]) => {
        if(!audio || key.startsWith('bgm')) return;
        try {
            const previousMuted = audio.muted;
            const previousVolume = audio.volume;
            audio.muted = true;
            audio.volume = 0;
            const attempt = audio.play();
            if(attempt && typeof attempt.then === 'function') {
                attempt.then(() => {
                    try {
                        audio.pause();
                        if(audio.readyState >= 2) audio.currentTime = 0;
                        audio.muted = previousMuted;
                        audio.volume = previousVolume;
                    } catch(e) {}
                }).catch(() => {
                    try {
                        audio.muted = previousMuted;
                        audio.volume = previousVolume;
                    } catch(e) {}
                });
            }
        } catch(e) {}
    });
};

window.playNavSound = function() {
    playSfx('sfx-nav');
};

window.playUIHoverSound = function() {
    const now = Date.now();
    if(now - lastHoverTime < 55) return;
    if(playSfx('sfx-ui-hover')) lastHoverTime = now;
};

window.playLobbyButtonHoverSound = function() {
    const now = Date.now();
    if(now - lastLobbyButtonHoverTime < 95) return;
    if(playSfx('sfx-button', audios['sfx-ui-hover'] ? 'sfx-ui-hover' : 'sfx-nav')) {
        lastLobbyButtonHoverTime = now;
    }
};

window.updateVol = function(type, val) {
    if(type === 'master') {
        const parsed = parseFloat(val);
        window.masterVol = Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0.5;
    }
    window.applyAudioSettings({ persist: true });
};

window.toggleSoundType = function(type) {
    if(type === 'music') {
        const music = document.getElementById('check-music');
        window.musicEnabled = music ? music.checked : !window.musicEnabled;
    } else if(type === 'sfx') {
        const sfx = document.getElementById('check-sfx');
        window.sfxEnabled = sfx ? sfx.checked : !window.sfxEnabled;
    }
    window.applyAudioSettings({ persist: true });
    if(type === 'sfx' && window.sfxEnabled) window.playLobbyButtonHoverSound();
};

function bindAudioSettingsControls() {
    const slider = document.getElementById('vol-slider');
    const music = document.getElementById('check-music');
    const sfx = document.getElementById('check-sfx');

    if(slider && slider.dataset.audioBound !== '1') {
        slider.dataset.audioBound = '1';
        const apply = () => {
            window.unlockGameAudio();
            window.updateVol('master', slider.value);
        };
        slider.addEventListener('input', apply);
        slider.addEventListener('change', apply);
        slider.addEventListener('pointerdown', () => window.unlockGameAudio());
    }

    [
        { input: music, type: 'music' },
        { input: sfx, type: 'sfx' }
    ].forEach(({ input, type }) => {
        if(!input || input.dataset.audioBound === '1') return;
        input.dataset.audioBound = '1';
        input.addEventListener('change', () => {
            window.unlockGameAudio();
            window.toggleSoundType(type);
        });
        const label = input.closest('label');
        if(label && label.dataset.audioBound !== '1') {
            label.dataset.audioBound = '1';
            label.addEventListener('pointerdown', () => window.unlockGameAudio(), { capture: true });
        }
    });
}

window.bindAudioSettingsControls = bindAudioSettingsControls;

if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAudioSettingsControls);
} else {
    bindAudioSettingsControls();
}

['pointerdown', 'click', 'keydown', 'touchstart'].forEach(eventName => {
    document.addEventListener(eventName, () => window.unlockGameAudio(), { capture: true, passive: true });
});

document.addEventListener('pointerover', (event) => {
    const button = event.target?.closest?.('#lobby-screen .lobby-menu-button');
    if(!button || button === lastLobbyHoverElement) return;
    lastLobbyHoverElement = button;
    window.playLobbyButtonHoverSound();
}, true);

document.addEventListener('pointerout', (event) => {
    const button = event.target?.closest?.('#lobby-screen .lobby-menu-button');
    if(button && !button.contains(event.relatedTarget)) lastLobbyHoverElement = null;
}, true);

export function playSound(key) {
    if(!window.sfxEnabled && !key.startsWith('bgm')) return;
    if(key.startsWith('bgm')) {
        MusicController.play(key);
    } else if(key === 'sfx-levelup') {
        playSfx(key, null, 1.0);
        setTimeout(() => playSfx(key, null, 0.9), 22);
    } else {
        playSfx(key);
    }
}

export function startCinematicLoop() {
    const cine = audios['sfx-cine'];
    if(!cine) return;
    try {
        cine.loop = true;
        cine.volume = 0;
        cine.muted = !window.sfxEnabled;
        cine.play().catch(() => {});
    } catch(e) {}
    if(mixerInterval) clearInterval(mixerInterval);
    mixerInterval = setInterval(updateAudioMixer, 30);
}

function updateAudioMixer() {
    const cineAudio = audios['sfx-cine'];
    if(!cineAudio) return;
    const target = window.sfxEnabled && window.isLethalHover ? baseVolume('sfx-cine') * (window.masterVol || 0) : 0;
    try {
        cineAudio.muted = !window.sfxEnabled;
        if(cineAudio.volume < target) cineAudio.volume = Math.min(target, cineAudio.volume + 0.05);
        else if(cineAudio.volume > target) cineAudio.volume = Math.max(target, cineAudio.volume - 0.05);
    } catch(e) {}
}
