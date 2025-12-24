// js/AudioManager.js
export class AudioManager {
    constructor() {
        this.audios = {};
        this.masterVol = 1.0;
        this.isMuted = false;
        this.currentTrackId = null;
        this.assetsToLoad = []; // Preencha com sua lista ASSETS_TO_LOAD.audio
    }

    // Carrega tudo e retorna promessa
    loadAll(audioList, onProgress) {
        let loaded = 0;
        return new Promise((resolve) => {
            audioList.forEach(item => {
                const s = new Audio();
                s.src = item.src;
                s.preload = 'auto';
                if (item.loop) s.loop = true;
                
                s.onloadedmetadata = () => {
                    loaded++;
                    if(onProgress) onProgress(loaded, audioList.length);
                    if(loaded === audioList.length) resolve();
                };
                // Fallback para erro
                s.onerror = () => { loaded++; if(loaded===audioList.length) resolve(); };
                
                this.audios[item.id] = s;
            });
        });
    }

    play(id, loop = false) {
        if (!this.audios[id]) return;
        if (this.isMuted) return;
        
        try {
            this.audios[id].currentTime = 0;
            if (loop) this.audios[id].loop = true;
            this.audios[id].volume = 0.8 * this.masterVol;
            this.audios[id].play().catch(e => console.warn("Audio block:", e));
        } catch(e) {}
    }

    // Sua lógica de MusicController (Fade in/out) vem pra cá como método da classe
    playMusic(trackId) {
        if (this.currentTrackId === trackId) return;
        if (this.currentTrackId && this.audios[this.currentTrackId]) {
            this._fadeOut(this.audios[this.currentTrackId]);
        }
        if (trackId && this.audios[trackId]) {
            const newTrack = this.audios[trackId];
            newTrack.volume = 0;
            if(!this.isMuted) newTrack.play().catch(()=>{});
            this._fadeIn(newTrack);
            this.currentTrackId = trackId;
        }
    }

    setMute(isMuted) {
        this.isMuted = isMuted;
        Object.values(this.audios).forEach(a => a.muted = isMuted);
        if(!isMuted && this.currentTrackId) this.audios[this.currentTrackId].play();
    }

    _fadeOut(audio) { /* Sua lógica de fade out aqui */ }
    _fadeIn(audio) { /* Sua lógica de fade in aqui */ }
}
