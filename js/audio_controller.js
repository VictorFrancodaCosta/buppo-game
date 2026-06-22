// ARQUIVO: js/audio_controller.js

export const audios = {};
window.audios = audios;
window.__buppoAudioNodes = window.__buppoAudioNodes || [];

window.masterVol = 0.5;
window.musicEnabled = false;
window.sfxEnabled = false;

const CORE_AUDIO_ASSETS = [
    { id: 'bgm-menu', src: 'assets/audio/musica_menu.mp3', loop: true },
    { id: 'bgm-loop', src: 'assets/audio/musica_batalha.mp3', loop: true },
    { id: 'sfx-nav', src: 'assets/audio/sfx_click.mp3' },
    { id: 'sfx-deal', src: 'assets/audio/sfx_dar_cartas.mp3' },
    { id: 'sfx-play', src: 'assets/audio/sfx_jogar_carta.mp3' },
    { id: 'sfx-hit', src: 'assets/audio/sfx_dano_fisico.mp3' },
    { id: 'sfx-hit-mage', src: 'assets/audio/sfx_dano_magico.mp3' },
    { id: 'sfx-block', src: 'assets/audio/sfx_bloqueio.mp3' },
    { id: 'sfx-block-mage', src: 'assets/audio/sfx_bloqueio_magico.mp3' },
    { id: 'sfx-heal', src: 'assets/audio/sfx_cura.mp3' },
    { id: 'sfx-levelup', src: 'assets/audio/sfx_levelup.mp3' },
    { id: 'sfx-train', src: 'assets/audio/sfx_treinar.mp3' },
    { id: 'sfx-disarm', src: 'assets/audio/sfx_desarmar.mp3' },
    { id: 'sfx-mastery', src: 'assets/audio/maestria_bonus.mp3' },
    { id: 'sfx-cine', src: 'assets/audio/ambience_cine.mp3', loop: true },
    { id: 'sfx-hover', src: 'assets/audio/sfx_hover_carta.mp3' },
    { id: 'sfx-ui-hover', src: 'assets/audio/sfx_hover_ui.mp3' },
    { id: 'sfx-button', src: 'assets/audio/sfx_botao.mp3' },
    { id: 'sfx-deck-select', src: 'assets/audio/sfx_selecionar_deck.mp3' },
    { id: 'sfx-coin', src: 'assets/audio/sfx_coin.mp3' },
    { id: 'sfx-win', src: 'assets/audio/sfx_vitoria.mp3' },
    { id: 'sfx-lose', src: 'assets/audio/sfx_derrota.mp3' },
    { id: 'sfx-tie', src: 'assets/audio/sfx_empate.mp3' }
];

let lastHoverTime = 0;
let lastLobbyButtonHoverTime = 0;
let lastLobbyButtonSelectTime = 0;
let lastLobbyHoverElement = null;
let mixerInterval = null;
let audioUnlocked = false;
let saveTimer = null;
const musicFadeTimers = new WeakMap();

function registerAudioNode(audio, key = '') {
    if(!audio) return audio;
    audio.datasetKey = key || audio.datasetKey || '';
    if(!window.__buppoAudioNodes.includes(audio)) window.__buppoAudioNodes.push(audio);
    return audio;
}

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

function withBuildVersion(src) {
    const version = window.BUPPO_BUILD_VERSION || Date.now();
    if(!src || /^(https?:|data:|blob:)/i.test(src)) return src;
    return `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
}

function ensureAudioRegistry() {
    CORE_AUDIO_ASSETS.forEach(asset => {
        if(audios[asset.id]) {
            registerAudioNode(audios[asset.id], asset.id);
            return;
        }
        const audio = new Audio();
        audio.src = withBuildVersion(asset.src);
        audio.preload = 'auto';
        audio.loop = asset.loop === true;
        audios[asset.id] = registerAudioNode(audio, asset.id);
        setAudioVolume(asset.id, audio);
    });
    window.audios = audios;
    return audios;
}

function preferredMusicTrack() {
    const gameActive = document.getElementById('game-screen')?.classList.contains('active');
    const endVisible = document.getElementById('end-screen')?.classList.contains('visible');
    return gameActive && !endVisible ? 'bgm-loop' : 'bgm-menu';
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

function stopMusicFade(audio) {
    const timer = musicFadeTimers.get(audio);
    if(timer) {
        clearInterval(timer);
        musicFadeTimers.delete(audio);
    }
}

function fadeMusic(audio, targetVolume, durationMs, done = null) {
    if(!audio) return;
    stopMusicFade(audio);
    const startVolume = Number.isFinite(audio.volume) ? audio.volume : 0;
    const startedAt = performance.now();
    const duration = Math.max(1, durationMs || 1);
    const timer = setInterval(() => {
        const t = Math.min(1, (performance.now() - startedAt) / duration);
        try { audio.volume = startVolume + (targetVolume - startVolume) * t; } catch(e) {}
        if(t >= 1) {
            clearInterval(timer);
            musicFadeTimers.delete(audio);
            if(done) done();
        }
    }, 32);
    musicFadeTimers.set(audio, timer);
}

function stopOtherMusicTracks(targetId, fadeOutMs = 0) {
    Object.entries(audios).forEach(([key, audio]) => {
        if(!key.startsWith('bgm') || key === targetId || !audio) return;
        stopMusicFade(audio);
        try {
            if(fadeOutMs > 0 && !audio.paused && !audio.muted) {
                fadeMusic(audio, 0, fadeOutMs, () => {
                    try {
                        audio.pause();
                        audio.currentTime = 0;
                        audio.muted = true;
                    } catch(e) {}
                });
            } else {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = true;
                audio.volume = 0;
            }
        } catch(e) {}
    });
}

function enforceExclusiveMusic(trackId) {
    const official = trackId ? audios[trackId] : null;
    const tracked = [
        ...Object.entries(audios).filter(([key]) => key.startsWith('bgm')).map(([key, audio]) => ({ key, audio })),
        ...(window.__buppoAudioNodes || []).map(audio => ({ key: audio.datasetKey || '', audio }))
    ];
    tracked.forEach(({ key, audio }) => {
        if(!audio) return;
        const src = String(audio.currentSrc || audio.src || '');
        const isMusic = key.startsWith('bgm') || src.includes('musica_menu') || src.includes('musica_batalha');
        if(!isMusic) return;
        stopMusicFade(audio);
        if(audio !== official) {
            try {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = true;
                audio.volume = 0;
            } catch(e) {}
        }
    });
}

window.syncBuppoMusic = function(forceTrackId = null) {
    ensureAudioRegistry();
    if(forceTrackId === 'none' || !window.musicEnabled) {
        enforceExclusiveMusic(null);
        MusicController.currentTrackId = null;
        return;
    }
    MusicController.play(forceTrackId || preferredMusicTrack());
};

window.applyAudioSettings = function({ persist = true } = {}) {
    ensureAudioRegistry();
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

    window.syncBuppoMusic();

    if(persist) scheduleSaveSettings();
};

function playSfx(key, fallbackKey = null, volume = null) {
    ensureAudioRegistry();
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
    play(trackId, options = {}) {
        ensureAudioRegistry();
        if(!trackId || !audios[trackId]) return;
        const next = audios[trackId];
        try {
            if(this.currentTrackId && this.currentTrackId !== trackId && audios[this.currentTrackId]) {
                stopMusicFade(audios[this.currentTrackId]);
                audios[this.currentTrackId].pause();
            }
            enforceExclusiveMusic(trackId);
            this.currentTrackId = trackId;
            setAudioVolume(trackId, next);
            if(window.musicEnabled) {
                stopMusicFade(next);
                next.muted = false;
                if(options.restart && next.readyState >= 2) next.currentTime = 0;
                if(options.fadeInMs) next.volume = 0;
                if(next.paused) next.play().catch(() => {});
                if(options.fadeInMs) fadeMusic(next, baseVolume(trackId) * (window.masterVol || 0), options.fadeInMs);
            }
        } catch(e) {}
    },
    transitionTo(trackId, options = {}) {
        ensureAudioRegistry();
        if(!trackId || !audios[trackId]) return;
            const fadeInMs = options.fadeInMs ?? 900;
            const next = audios[trackId];

        try {
            enforceExclusiveMusic(trackId);

            this.currentTrackId = trackId;
            setAudioVolume(trackId, next);
            if(window.musicEnabled) {
                stopMusicFade(next);
                next.muted = false;
                next.volume = 0;
                if(options.restart !== false && next.readyState >= 2) next.currentTime = 0;
                next.play().catch(() => {});
                fadeMusic(next, baseVolume(trackId) * (window.masterVol || 0), fadeInMs);
            }
        } catch(e) {}
    },
    stopCurrent() {
        ensureAudioRegistry();
        stopOtherMusicTracks(null);
        if(this.currentTrackId && audios[this.currentTrackId]) {
            try {
                stopMusicFade(audios[this.currentTrackId]);
                audios[this.currentTrackId].pause();
                audios[this.currentTrackId].currentTime = 0;
            } catch(e) {}
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
    ensureAudioRegistry();
    audioUnlocked = true;
    Object.entries(audios).forEach(([key, audio]) => {
        if(!audio || key.startsWith('bgm')) return;
        registerAudioNode(audio, key);
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

window.playLobbyButtonSelectSound = function() {
    const now = Date.now();
    if(now - lastLobbyButtonSelectTime < 80) return;
    if(playSfx('sfx-nav')) lastLobbyButtonSelectTime = now;
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
        input.addEventListener('change', (event) => {
            event.stopImmediatePropagation();
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
window.repairBuppoAudio = function() {
    ensureAudioRegistry();
    window.applyAudioSettings({ persist: false });
    return Object.keys(audios);
};

ensureAudioRegistry();

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

document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('#lobby-screen .lobby-menu-button');
    if(!button) return;
    window.playLobbyButtonSelectSound();
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
