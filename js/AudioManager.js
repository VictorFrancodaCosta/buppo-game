export class AudioManager {
    constructor() {
        this.audios = {};
        this.isMuted = false;
        this.currentTrackId = null;
    }

    loadAll(assetList) {
        let loaded = 0;
        return new Promise((resolve) => {
            assetList.audio.forEach(item => {
                const s = new Audio();
                s.src = item.src;
                s.preload = 'auto';
                if (item.loop) s.loop = true;
                
                s.onloadedmetadata = () => {
                    loaded++;
                    if(loaded === assetList.audio.length) resolve();
                };
                s.onerror = () => { loaded++; if(loaded === assetList.audio.length) resolve(); };
                this.audios[item.id] = s;
            });
            // Carrega imagens também apenas para garantir cache, se necessário
            assetList.images.forEach(src => { let img = new Image(); img.src = src; });
        });
    }

    play(id) {
        if (this.isMuted || !this.audios[id]) return;
        const s = this.audios[id];
        s.currentTime = 0;
        s.volume = 0.8; 
        s.play().catch(() => {});
    }

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

    toggleMute() {
        this.isMuted = !this.isMuted;
        Object.values(this.audios).forEach(a => a.muted = this.isMuted);
        if(!this.isMuted && this.currentTrackId) this.audios[this.currentTrackId].play();
        return this.isMuted;
    }

    _fadeOut(audio) {
        let vol = audio.volume;
        const fade = setInterval(() => {
            if (vol > 0.05) { vol -= 0.05; audio.volume = vol; }
            else { audio.volume = 0; audio.pause(); clearInterval(fade); }
        }, 50);
    }

    _fadeIn(audio) {
        let vol = 0;
        const fade = setInterval(() => {
            if (vol < 0.75) { vol += 0.05; audio.volume = vol; }
            else { clearInterval(fade); }
        }, 50);
    }
}
