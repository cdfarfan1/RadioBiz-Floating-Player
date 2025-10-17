if (!customElements.get('radio-player')) {
    class RadioPlayer extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });

            const playerWidth = this.getAttribute('player-width') || '320';
            const buttonColor = this.getAttribute('button-color') || '#ff007a';
            const userLogo = "https://radiobiz.com.ar/wp-content/uploads/2023/02/cropped-ICON-radiobiz.png";
            const startCollapsedMobile = this.getAttribute('start-collapsed-mobile') === 'true';

            // --- Lógica de Posicionamiento Inteligente (v2.6) ---
            let lastPosition = JSON.parse(localStorage.getItem('radioPlayerPosition'));
            if (lastPosition) {
                // Si la posición guardada está fuera de la pantalla actual, anúlala.
                // Usamos 88px como búfer, el tamaño del reproductor plegado.
                const isPositionOutOfBounds = 
                    lastPosition.left > window.innerWidth - 88 || 
                    lastPosition.top > window.innerHeight - 88;

                if (isPositionOutOfBounds) {
                    lastPosition = null; // Anula la posición para que se aplique la de por defecto.
                    localStorage.removeItem('radioPlayerPosition'); // Limpia el dato incorrecto.
                }
            }

            const lastPlayerState = JSON.parse(localStorage.getItem('radioPlayerState'));

            const initialTop = (lastPosition && typeof lastPosition.top === 'number') ? `${lastPosition.top}px` : (this.getAttribute('initial-top') || 'auto');
            const initialLeft = (lastPosition && typeof lastPosition.left === 'number') ? `${lastPosition.left}px` : (this.getAttribute('initial-left') || 'auto');
            const initialVolume = (lastPlayerState && typeof lastPlayerState.volume === 'number') ? lastPlayerState.volume : 0.5;
            const shouldBePlaying = !!(lastPlayerState && lastPlayerState.isPlaying);
            let isCollapsed = (lastPlayerState && typeof lastPlayerState.isCollapsed === 'boolean') 
                ? lastPlayerState.isCollapsed 
                : (startCollapsedMobile && window.innerWidth < 768);

            this.shadowRoot.innerHTML = `
                <style>
                    :host { display: block; position: fixed; z-index: 10000; font-family: sans-serif; 
                           top: ${initialTop}; left: ${initialLeft}; right: ${initialLeft === 'auto' ? '20px' : 'auto'}; bottom: ${initialTop === 'auto' ? '20px' : 'auto'}; touch-action: none; }
                    .player-container { position: relative; width: ${playerWidth}px; max-width: 90vw; transition: width 0.3s ease, height 0.3s ease; }
                    .wrapper { display: flex; flex-direction: column; background: rgba(20, 20, 20, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); 
                               border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); 
                               width: 100%; padding: 15px; transition: all 0.3s ease; box-sizing: border-box; }
                    .drag-handle { position: absolute; left: -15px; top: 50%; transform: translateY(-50%); width: 30px; height: 50px; background-color: rgba(20,20,20,0.7); 
                                   border-radius: 10px 0 0 10px; cursor: move; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.1); border-right: none; z-index:1; }
                    .drag-handle svg { width: 12px; height: 12px; fill: #fff; }
                    .main-panel { display: flex; align-items: center; width: 100%; }
                    .cover-art-container { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
                    .cover-art-image { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; animation: spin 10s linear infinite; animation-play-state: paused; background-color: #333; }
                    .wrapper.is-playing .cover-art-image { animation-play-state: running; }
                    .play-btn-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
                    .cover-art-container:hover .play-btn-overlay, .player-container.collapsed .play-btn-overlay { opacity: 1; }
                    .play-btn-overlay svg { width: 35px; height: 35px; fill: #fff; }
                    
                    .song-info { display: flex; flex-direction: column; justify-content: center; min-width: 0; margin-left: 15px; text-align: left; color: #fff; overflow: hidden; }
                    .song-title, .song-artist { white-space: nowrap; }
                    .song-title.is-overflowing, .song-artist.is-overflowing { animation: marquee 12s linear infinite; }
                    .song-title { font-size: 1.1em; font-weight: 700; }
                    .song-artist { font-size: 0.9em; opacity: 0.9; }

                    .volume-bar { width: 100%; padding: 10px 0 0 0; box-sizing: border-box; }
                    .volume-slider { width: 100%; cursor: pointer; -webkit-appearance: none; appearance: none; background: rgba(255,255,255,0.3); border-radius: 5px; height: 5px; }
                    .volume-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 15px; height: 15px; border-radius: 50%; background: ${buttonColor}; cursor: pointer; }
                    .toggle-collapse-btn { position: absolute; top: 0; right: 0; width: 28px; height: 28px; border-radius: 50%; background: #333; border: 2px solid #fff; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 2; transition: all 0.3s; transform: translate(40%, -40%); }
                    .toggle-collapse-btn svg { width: 16px; height: 16px; fill: #fff; transition: transform 0.3s; }
                    
                    /* --- Controles Plegados --- */
                    .collapsed-controls { position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 110%); display: none; align-items: center; flex-direction: column; gap: 8px; }
                    .volume-icon-collapsed { cursor: pointer; width: 24px; height: 24px; fill: #fff; opacity: 0.8; transition: opacity 0.2s; }
                    .volume-icon-collapsed:hover { opacity: 1; }
                    .volume-popup { position: absolute; bottom: 35px; background: rgba(30,30,30,0.8); backdrop-filter: blur(5px); border-radius: 8px; padding: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); 
                                      transform-origin: bottom center; transition: transform 0.2s ease, opacity 0.2s ease; opacity: 0; transform: scale(0.8); pointer-events: none; }
                    .volume-popup.visible { opacity: 1; transform: scale(1); pointer-events: auto; }
                    .volume-slider-popup { width: 120px; }

                    /* --- ESTADOS PLEGADOS --- */
                    .player-container.collapsed { width: 88px; }
                    .player-container.collapsed .wrapper { width: 88px; height: 88px; padding: 0; border-radius: 50%; background: none; backdrop-filter: none; box-shadow: none; border: 4px solid ${buttonColor}; }
                    .player-container.collapsed .drag-handle { left: 50%; top: -15px; transform: translate(-50%, 0) rotate(90deg); }
                    .player-container.collapsed .song-info, .player-container.collapsed .volume-bar { display: none; }
                    .player-container.collapsed .play-btn-overlay { background: rgba(0,0,0,0.5); }
                    .player-container.collapsed .main-panel { height: 100%; align-items: center; justify-content: center; }
                    .player-container.collapsed .cover-art-container { width: 80px; height: 80px; }
                    .player-container.collapsed .toggle-collapse-btn { transform: translate(0, -130%) rotate(180deg); }
                    .player-container.collapsed .collapsed-controls { display: flex; }
                    
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes marquee {
                        0% { transform: translateX(5%); }
                        15% { transform: translateX(5%); }
                        85% { transform: translateX(calc(-100% - 5px)); }
                        100% { transform: translateX(calc(-100% - 5px)); }
                    }
                </style>

                <div class="player-container ${isCollapsed ? 'collapsed' : ''}">
                    <div class="drag-handle" title="Mover reproductor"><svg viewBox="0 0 24 24"><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg></div>
                    <div class="toggle-collapse-btn" title="Plegar/Desplegar"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></div>
                    <div class="wrapper">
                        <div class="main-panel">
                            <div class="cover-art-container">
                                <img src="${userLogo}" class="cover-art-image" alt="RadioBiz Logo">
                                <div class="play-btn-overlay" title="Play/Pause">
                                    <svg class="play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                                    <svg class="pause-icon" viewBox="0 0 24 24" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
                                </div>
                            </div>
                            <div class="song-info">
                                <div class="song-title">Radio en Vivo</div>
                                <div class="song-artist">RadioBiz</div>
                            </div>
                        </div>
                        <div class="volume-bar">
                            <input type="range" class="volume-slider" min="0" max="1" step="0.01">
                        </div>
                    </div>
                    <div class="collapsed-controls">
                        <div class="volume-popup">
                            <input type="range" class="volume-slider volume-slider-popup" min="0" max="1" step="0.01">
                        </div>
                        <svg class="volume-icon-collapsed" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
                    </div>
                    <audio src="https://streamssl.radiodanz.com/live" crossOrigin="anonymous"></audio>
                </div>
            `;

            // --- Lógica del reproductor ---
            this.audio = this.shadowRoot.querySelector('audio');
            this.container = this.shadowRoot.querySelector('.player-container');
            this.wrapper = this.shadowRoot.querySelector('.wrapper');
            this.dragHandle = this.shadowRoot.querySelector('.drag-handle');
            this.playBtnOverlay = this.shadowRoot.querySelector('.play-btn-overlay');
            this.playIcon = this.shadowRoot.querySelector('.play-icon');
            this.pauseIcon = this.shadowRoot.querySelector('.pause-icon');
            this.volumeSlider = this.shadowRoot.querySelector('.volume-bar .volume-slider');
            this.volumeSliderPopup = this.shadowRoot.querySelector('.volume-slider-popup');
            this.volumeIconCollapsed = this.shadowRoot.querySelector('.volume-icon-collapsed');
            this.volumePopup = this.shadowRoot.querySelector('.volume-popup');
            this.toggleBtn = this.shadowRoot.querySelector('.toggle-collapse-btn');
            this.songInfoEl = this.shadowRoot.querySelector('.song-info');
            this.songTitleEl = this.shadowRoot.querySelector('.song-title');
            this.songArtistEl = this.shadowRoot.querySelector('.song-artist');
            this.coverArtEl = this.shadowRoot.querySelector('.cover-art-image');
            this.userLogo = userLogo;
            this.volumePopupTimeout = null;
            this.volumeSyncInterval = null; 

            this.setVolume(initialVolume);
            if (shouldBePlaying) {
                this.togglePlay(true);
            }

            this.initDrag();
            this.addEventListeners();
            this.connectToPusher();
            this.updateSongInfo("Radio en Vivo", "RadioBiz");
            this.startVolumeSync(); 
        }

        disconnectedCallback() {
            if (this.volumeSyncInterval) {
                clearInterval(this.volumeSyncInterval);
            }
        }

        addEventListeners() {
            this.playBtnOverlay.addEventListener('click', () => this.togglePlay());
            this.toggleBtn.addEventListener('click', (e) => { e.preventDefault(); this.toggleCollapse(); });
            
            this.volumeSlider.addEventListener('input', () => this.setVolume(this.volumeSlider.value));
            this.volumeSliderPopup.addEventListener('input', () => {
                this.setVolume(this.volumeSliderPopup.value);
                clearTimeout(this.volumePopupTimeout);
                this.hideVolumePopup(3000);
            });

            this.volumeIconCollapsed.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleVolumePopup();
            });

            document.addEventListener('click', (e) => {
                if (!this.shadowRoot.contains(e.target)) {
                   this.hideVolumePopup();
                }
            });
        }

        startVolumeSync() {
            if (this.volumeSyncInterval) clearInterval(this.volumeSyncInterval);
            this.volumeSyncInterval = setInterval(() => {
                if (this.audio.volume.toFixed(2) !== parseFloat(this.volumeSlider.value).toFixed(2)) {
                    this.syncVolumeUI();
                    this.savePlayerState();
                }
            }, 250);
        }
        
        syncVolumeUI() {
            const currentVolume = this.audio.volume;
            this.volumeSlider.value = currentVolume;
            this.volumeSliderPopup.value = currentVolume;
        }

        toggleVolumePopup() {
            const isVisible = this.volumePopup.classList.toggle('visible');
            if (isVisible) {
                this.hideVolumePopup(3000);
            } else {
                clearTimeout(this.volumePopupTimeout);
            }
        }
        
        hideVolumePopup(delay = 0) {
            clearTimeout(this.volumePopupTimeout);
            if (delay > 0) {
                this.volumePopupTimeout = setTimeout(() => this.volumePopup.classList.remove('visible'), delay);
            } else {
                this.volumePopup.classList.remove('visible');
            }
        }

        setVolume(value) {
            const newVolume = parseFloat(value);
            this.audio.volume = newVolume;
            this.syncVolumeUI();
            this.savePlayerState();
        }

        savePlayerState() {
            const state = { isPlaying: !this.audio.paused, volume: this.audio.volume, isCollapsed: this.container.classList.contains('collapsed') };
            localStorage.setItem('radioPlayerState', JSON.stringify(state));
        }

        togglePlay(forcePlay = false) {
            if (this.audio.paused || forcePlay) {
                this.audio.play().then(() => {
                    this.wrapper.classList.add('is-playing');
                    this.playIcon.style.display = 'none';
                    this.pauseIcon.style.display = 'block';
                    this.savePlayerState();
                }).catch(e => console.error("Error al reproducir:", e));
            } else {
                this.audio.pause();
                this.wrapper.classList.remove('is-playing');
                this.playIcon.style.display = 'block';
                this.pauseIcon.style.display = 'none';
                this.savePlayerState();
            }
        }

        toggleCollapse() {
            this.container.classList.toggle('collapsed');
            this.hideVolumePopup();
            this.savePlayerState();
            setTimeout(() => {
                this.checkTextOverflow(this.songTitleEl);
                this.checkTextOverflow(this.songArtistEl);
            }, 300);
        }

        initDrag() {
            let isDragging = false, offsetX, offsetY;

            const onDragStart = (e) => {
                isDragging = true;
                this.style.transition = 'none';
                const rect = this.getBoundingClientRect();
                const event = e.touches ? e.touches[0] : e;
                offsetX = event.clientX - rect.left;
                offsetY = event.clientY - rect.top;
                document.addEventListener('mousemove', onDragMove, { passive: false });
                document.addEventListener('touchmove', onDragMove, { passive: false });
                document.addEventListener('mouseup', onDragEnd, { once: true });
                document.addEventListener('touchend', onDragEnd, { once: true });
            };

            const onDragMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                const event = e.touches ? e.touches[0] : e;
                this.style.top = `${event.clientY - offsetY}px`;
                this.style.left = `${event.clientX - offsetX}px`;
                this.style.right = 'auto';
                this.style.bottom = 'auto';
            };

            const onDragEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                this.style.transition = '';
                localStorage.setItem('radioPlayerPosition', JSON.stringify({ top: this.offsetTop, left: this.offsetLeft }));
                document.removeEventListener('mousemove', onDragMove);
                document.removeEventListener('touchmove', onDragMove);
            };

            this.dragHandle.addEventListener('mousedown', onDragStart);
            this.dragHandle.addEventListener('touchstart', onDragStart);
        }
        
        connectToPusher() { try { const pusher = new Pusher('08f8a8f099aa48f998b3', { cluster: 'mt1', wsHost: 'pusher.electronicmusicradiogroup.org', wssPort: 443, forceTLS: true }); const channel = pusher.subscribe('radio-danz'); channel.bind('update-title', (data) => this.updateSongInfo(data.title, data.artist)); channel.bind('update-cover', (data) => data && data.cover && this.updateCoverArt(data.cover)); } catch (e) { console.error("Error con Pusher:", e); } }
        
        updateSongInfo(title, artist) { 
            this.songTitleEl.textContent = title || 'Radio en Vivo'; 
            this.songArtistEl.textContent = artist || 'RadioBiz';
            this.checkTextOverflow(this.songTitleEl);
            this.checkTextOverflow(this.songArtistEl);
        }

        checkTextOverflow(element) {
            setTimeout(() => {
                const container = this.songInfoEl;
                if (!container) return;
                const isOverflowing = element.scrollWidth > container.clientWidth;
                if (isOverflowing) {
                    element.classList.add('is-overflowing');
                } else {
                    element.classList.remove('is-overflowing');
                }
            }, 50);
        }

        updateCoverArt(url) { if (!url || this.coverArtEl.src === url) return; const img = new Image(); img.src = url; img.onload = () => { this.coverArtEl.src = url; }; img.onerror = () => { this.coverArtEl.src = this.userLogo; }; }
    }
    customElements.define('radio-player', RadioPlayer);
}
