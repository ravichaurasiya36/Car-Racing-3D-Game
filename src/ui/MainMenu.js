export class MainMenu {
  constructor(onPlayCallback, onTrackSelectCallback, onGarageCallback, onBestTimesCallback, onLeaderboardCallback) {
    this.onPlayCallback = onPlayCallback;
    this.onTrackSelectCallback = onTrackSelectCallback;
    this.onGarageCallback = onGarageCallback;
    this.onBestTimesCallback = onBestTimesCallback;
    this.onLeaderboardCallback = onLeaderboardCallback;
    this.menuOverlay = null;
    this.buildMenuDOM();
  }

  buildMenuDOM() {
    // 1. Create Main Menu Overlay Container
    this.menuOverlay = document.createElement('div');
    this.menuOverlay.id = 'main-menu-overlay';
    this.menuOverlay.className = 'main-menu-container active';

    this.menuOverlay.innerHTML = `
      <div class="menu-glass-card">
        <!-- Brand / Game Title Header -->
        <div class="menu-brand">
          <div class="menu-badge"><span>NEXT-GEN 3D RACING</span></div>
          <h1 class="menu-title">CAR RACING</h1>
          <p class="menu-subtitle">APEX VELOCITY SUPERCAR EDITION</p>
        </div>

        <!-- Navigation Buttons Stack -->
        <div class="menu-actions">
          <button id="btn-play-race" class="menu-btn btn-primary">
            <span class="btn-icon">▶</span>
            <span class="btn-text">PLAY RACE</span>
            <span class="btn-glow"></span>
          </button>

          <button id="btn-track-select" class="menu-btn btn-secondary" title="Select Circuit or Point-to-Point Track">
            <span class="btn-icon">🗺️</span>
            <span class="btn-text">TRACK SELECT</span>
            <span class="badge-tag gold">NEW</span>
          </button>

          <button id="btn-garage" class="menu-btn btn-secondary" title="Inspect & Select Supercars in 3D Showroom">
            <span class="btn-icon">🏎️</span>
            <span class="btn-text">GARAGE</span>
            <span class="badge-tag gold">3D</span>
          </button>

          <button id="btn-best-times" class="menu-btn btn-secondary" title="View Personal Best Telemetry & Track Records">
            <span class="btn-icon">🏆</span>
            <span class="btn-text">BEST TIMES</span>
          </button>

          <button id="btn-leaderboard" class="menu-btn btn-secondary" title="View Official Leaderboard Rankings">
            <span class="btn-icon">🥇</span>
            <span class="btn-text">LEADERBOARD</span>
          </button>

          <button id="btn-multiplayer" class="menu-btn btn-secondary disabled" title="2-Player Multiplayer coming soon">
            <span class="btn-icon">🎮</span>
            <span class="btn-text">2 PLAYER / MULTIPLAYER</span>
            <span class="badge-tag">SOON</span>
          </button>

          <button id="btn-settings" class="menu-btn btn-secondary disabled" title="Settings coming soon">
            <span class="btn-icon">⚙️</span>
            <span class="btn-text">SETTINGS</span>
            <span class="badge-tag">SOON</span>
          </button>
        </div>

        <!-- Vehicle Spec Footer Feature Bar -->
        <div class="menu-footer-info">
          <div class="info-item">
            <span class="label">CURRENT CAR</span>
            <span class="val highlight" id="menu-car-name">LAMBORGHINI AVENTADOR SVJ</span>
          </div>
          <div class="info-item">
            <span class="label">ENGINE</span>
            <span class="val" id="menu-car-engine">6.5L V12 COMBUS</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.menuOverlay);
    this.initEventListeners();
  }

  initEventListeners() {
    const playBtn = this.menuOverlay.querySelector('#btn-play-race');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.hide();
        if (typeof this.onPlayCallback === 'function') {
          this.onPlayCallback();
        }
      });
    }

    const trackSelectBtn = this.menuOverlay.querySelector('#btn-track-select');
    if (trackSelectBtn) {
      trackSelectBtn.addEventListener('click', () => {
        this.hide();
        if (typeof this.onTrackSelectCallback === 'function') {
          this.onTrackSelectCallback();
        }
      });
    }

    const garageBtn = this.menuOverlay.querySelector('#btn-garage');
    if (garageBtn) {
      garageBtn.addEventListener('click', () => {
        this.hide();
        if (typeof this.onGarageCallback === 'function') {
          this.onGarageCallback();
        }
      });
    }

    const bestTimesBtn = this.menuOverlay.querySelector('#btn-best-times');
    if (bestTimesBtn) {
      bestTimesBtn.addEventListener('click', () => {
        if (typeof this.onBestTimesCallback === 'function') {
          this.onBestTimesCallback();
        }
      });
    }

    const leaderboardBtn = this.menuOverlay.querySelector('#btn-leaderboard');
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => {
        if (typeof this.onLeaderboardCallback === 'function') {
          this.onLeaderboardCallback();
        }
      });
    }

    // Optional subtle feedback for disabled buttons
    const disabledBtns = this.menuOverlay.querySelectorAll('.menu-btn.disabled');
    disabledBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 400);
      });
    });
  }

  updateSelectedVehicle(vehicle) {
    if (!vehicle || !this.menuOverlay) return;
    const nameElem = this.menuOverlay.querySelector('#menu-car-name');
    const engineElem = this.menuOverlay.querySelector('#menu-car-engine');
    if (nameElem) nameElem.textContent = vehicle.name;
    if (engineElem) engineElem.textContent = vehicle.engine;
  }

  show(vehicle = null) {
    if (vehicle) {
      this.updateSelectedVehicle(vehicle);
    }
    if (this.menuOverlay) {
      this.menuOverlay.style.display = 'flex';
      // Force reflow for CSS opacity transition
      void this.menuOverlay.offsetWidth;
      this.menuOverlay.classList.add('active');
    }
  }

  hide() {
    if (this.menuOverlay) {
      this.menuOverlay.classList.remove('active');
      this.menuOverlay.style.display = 'none';
    }
  }
}
