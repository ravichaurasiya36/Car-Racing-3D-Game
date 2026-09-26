export class RaceStartScreen {
  constructor(vehicleManager, onStartRaceCallback, onBackCallback, onTrackSelectCallback) {
    this.vehicleManager = vehicleManager;
    this.onStartRaceCallback = onStartRaceCallback;
    this.onBackCallback = onBackCallback;
    this.onTrackSelectCallback = onTrackSelectCallback;
    this.overlay = null;
    this.buildDOM();
  }

  buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'race-start-overlay';
    this.overlay.className = 'race-start-container';

    const vehicle = this.vehicleManager ? this.vehicleManager.getSelectedVehicle('player1') : null;
    const carName = vehicle ? vehicle.name : 'LAMBORGHINI AVENTADOR SVJ';
    const carEngine = vehicle ? `${vehicle.engine} • ${vehicle.power.split('@')[0].trim()}` : '6.5L V12 • 770 HP';
    const carPaint = vehicle ? vehicle.colorName : 'GIALLO YELLOW METALLIC';
    const carDrivetrain = vehicle ? vehicle.drivetrain : 'AWD SUPERSPORT';

    this.overlay.innerHTML = `
      <div class="start-glass-card">
        <!-- Top Briefing Header -->
        <div class="start-header">
          <div class="start-badge">
            <span class="pulse-dot"></span>
            <span>RACE BRIEFING & GRID SETUP</span>
          </div>
          <h2 class="start-title">NEON CITY CIRCUIT</h2>
          <p class="start-subtitle">METROPOLITAN DUSK CIRCUIT • 4.2 KM GROUND LOOP</p>
        </div>

        <!-- Information Panels Grid -->
        <div class="start-grid">
          <!-- Track & Event Card -->
          <div class="start-info-panel">
            <div class="panel-header">
              <span class="panel-icon">🏁</span>
              <span class="panel-title">EVENT INFO</span>
            </div>
            <div class="panel-rows">
              <div class="panel-row">
                <span class="row-label">SELECT TRACK</span>
                <div style="display: flex; gap: 6px;">
                  <button id="btn-track-city" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #00f0ff; background: rgba(0,240,255,0.2); color: #fff; cursor: pointer; font-size: 11px; font-weight: 700;">🌆 CITY</button>
                  <button id="btn-track-forest" style="padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: #aaa; cursor: pointer; font-size: 11px; font-weight: 700;">🌲 FOREST</button>
                  <button id="btn-track-desert" style="padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: #aaa; cursor: pointer; font-size: 11px; font-weight: 700;">🏜️ DESERT</button>
                </div>
              </div>
              <div class="panel-row">
                <span class="row-label">RACE TYPE</span>
                <span class="row-val highlight" id="start-race-type">TIME TRIAL / SINGLE PLAYER</span>
              </div>
              <div class="panel-row">
                <span class="row-label">RACE MODE</span>
                <span class="row-val" id="start-laps-val">3 LAPS</span>
              </div>
              <div class="panel-row">
                <span class="row-label">BEST RECORD</span>
                <span class="row-val gold" id="start-best-lap">--:--.---</span>
              </div>
              <div class="panel-row">
                <span class="row-label">WEATHER / TIME</span>
                <span class="row-val" id="start-weather-val">BRIGHT SUNNY DAYLIGHT</span>
              </div>
            </div>
          </div>

          <!-- Car Specifications Card -->
          <div class="start-info-panel">
            <div class="panel-header">
              <span class="panel-icon">🏎️</span>
              <span class="panel-title">SELECTED SUPERCAR</span>
            </div>
            <div class="panel-rows">
              <div class="panel-row">
                <span class="row-label">MODEL</span>
                <span class="row-val highlight" id="start-car-name">${carName}</span>
              </div>
              <div class="panel-row">
                <span class="row-label">ENGINE & POWER</span>
                <span class="row-val" id="start-car-engine">${carEngine}</span>
              </div>
              <div class="panel-row">
                <span class="row-label">PAINT FINISH</span>
                <span class="row-val gold" id="start-car-paint">${carPaint}</span>
              </div>
              <div class="panel-row">
                <span class="row-label">DRIVETRAIN</span>
                <span class="row-val" id="start-car-drivetrain">${carDrivetrain}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Driver Grid / Multiplayer Roster Compatibility Slot -->
        <div class="start-roster-section">
          <div class="roster-header">
            <span class="roster-title">GRID ROSTER</span>
            <span class="roster-tag">2 PLAYER MULTIPLAYER READY</span>
          </div>
          <div class="roster-grid">
            <!-- Player 1 Active Slot -->
            <div class="roster-card active-p1">
              <div class="p-badge p1">P1</div>
              <div class="p-info">
                <span class="p-name">PLAYER 1 (YOU)</span>
                <span class="p-car" id="roster-p1-car">${carName}</span>
              </div>
              <div class="p-status ready">READY</div>
            </div>

            <!-- Player 2 Open Slot -->
            <div class="roster-card open-p2">
              <div class="p-badge p2">P2</div>
              <div class="p-info">
                <span class="p-name">PLAYER 2</span>
                <span class="p-car">OPEN MULTIPLAYER SLOT</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Start & Navigation Actions -->
        <div class="start-actions">
          <button id="btn-start-race" class="start-btn btn-launch">
            <span class="btn-icon">🏁</span>
            <span class="btn-text">START RACE</span>
            <span class="btn-glow"></span>
          </button>

          <button id="btn-back-menu" class="start-btn btn-back">
            <span class="btn-icon">⬅</span>
            <span class="btn-text">MAIN MENU</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.initEventListeners();
  }

  initEventListeners() {
    const startBtn = this.overlay.querySelector('#btn-start-race');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.hide();
        if (typeof this.onStartRaceCallback === 'function') {
          this.onStartRaceCallback();
        }
      });
    }

    const backBtn = this.overlay.querySelector('#btn-back-menu');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.hide();
        if (typeof this.onBackCallback === 'function') {
          this.onBackCallback();
        }
      });
    }

    const forestBtn = this.overlay.querySelector('#btn-track-forest');
    const cityBtn = this.overlay.querySelector('#btn-track-city');
    const desertBtn = this.overlay.querySelector('#btn-track-desert');

    if (forestBtn) {
      forestBtn.addEventListener('click', () => {
        if (typeof this.onTrackSelectCallback === 'function') {
          this.onTrackSelectCallback('forest_crest');
        }
      });
    }
    if (cityBtn) {
      cityBtn.addEventListener('click', () => {
        if (typeof this.onTrackSelectCallback === 'function') {
          this.onTrackSelectCallback('city_neon');
        }
      });
    }
    if (desertBtn) {
      desertBtn.addEventListener('click', () => {
        if (typeof this.onTrackSelectCallback === 'function') {
          this.onTrackSelectCallback('desert_apex');
        }
      });
    }
  }

  show(bestLapFormatted = '--:--.---', activeTrack = null) {
    const bestLapElem = this.overlay.querySelector('#start-best-lap');
    if (bestLapElem) {
      bestLapElem.textContent = bestLapFormatted || '--:--.---';
    }

    const titleElem = this.overlay.querySelector('.start-title');
    const subtitleElem = this.overlay.querySelector('.start-subtitle');
    const weatherElem = this.overlay.querySelector('#start-weather-val');
    const lapsElem = this.overlay.querySelector('#start-laps-val');

    const forestBtn = this.overlay.querySelector('#btn-track-forest');
    const cityBtn = this.overlay.querySelector('#btn-track-city');
    const desertBtn = this.overlay.querySelector('#btn-track-desert');

    if (activeTrack) {
      const trackId = activeTrack.trackId;
      if (titleElem) titleElem.textContent = (activeTrack.trackName || 'NEON CITY CIRCUIT').toUpperCase();

      if (trackId === 'city_neon') {
        if (subtitleElem) subtitleElem.textContent = 'METROPOLITAN DUSK CIRCUIT • 4.2 KM GROUND LOOP';
        if (weatherElem) weatherElem.textContent = 'BRIGHT SUNNY DAYLIGHT';
        if (lapsElem) lapsElem.textContent = '3 LAPS';
      } else if (trackId === 'desert_apex') {
        if (subtitleElem) subtitleElem.textContent = 'OPEN DESERT HIGHWAY • 6.0 KM POINT-TO-POINT';
        if (weatherElem) weatherElem.textContent = 'HOT SUNNY DESERT DAYLIGHT';
        if (lapsElem) lapsElem.textContent = 'STAGE 1 / 1 (POINT-TO-POINT)';
      } else {
        if (subtitleElem) subtitleElem.textContent = 'ALPINE WOODLAND TRACK • 3.4 KM CIRCUIT';
        if (weatherElem) weatherElem.textContent = 'CLEAR DAYLIGHT';
        if (lapsElem) lapsElem.textContent = '3 LAPS';
      }

      const buttons = [
        { id: 'city_neon', btn: cityBtn, color: '#00f0ff', bg: 'rgba(0,240,255,0.2)' },
        { id: 'forest_crest', btn: forestBtn, color: '#22c55e', bg: 'rgba(34,197,94,0.2)' },
        { id: 'desert_apex', btn: desertBtn, color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' }
      ];

      buttons.forEach(b => {
        if (b.btn) {
          if (b.id === trackId) {
            b.btn.style.border = `1px solid ${b.color}`;
            b.btn.style.background = b.bg;
            b.btn.style.color = '#fff';
          } else {
            b.btn.style.border = '1px solid rgba(255,255,255,0.2)';
            b.btn.style.background = 'rgba(0,0,0,0.4)';
            b.btn.style.color = '#aaa';
          }
        }
      });
    }

    if (this.vehicleManager) {
      const vehicle = this.vehicleManager.getSelectedVehicle('player1');
      const cust = this.vehicleManager.getCustomization('player1', vehicle.id);
      const paintObj = this.vehicleManager.getPaintObj(cust.paintId);
      const paintName = paintObj ? `${paintObj.name.toUpperCase()} METALLIC` : vehicle.colorName;

      const nameElem = this.overlay.querySelector('#start-car-name');
      const engineElem = this.overlay.querySelector('#start-car-engine');
      const paintElem = this.overlay.querySelector('#start-car-paint');
      const driveElem = this.overlay.querySelector('#start-car-drivetrain');
      const rosterP1 = this.overlay.querySelector('#roster-p1-car');

      if (nameElem) nameElem.textContent = vehicle.name;
      if (engineElem) engineElem.textContent = `${vehicle.engine} • ${vehicle.power.split('@')[0].trim()}`;
      if (paintElem) paintElem.textContent = paintName;
      if (driveElem) driveElem.textContent = vehicle.drivetrain;
      if (rosterP1) rosterP1.textContent = vehicle.name;
    }

    if (this.overlay) {
      this.overlay.style.display = 'flex';
      void this.overlay.offsetWidth;
      this.overlay.classList.add('active');
    }
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.overlay.style.display = 'none';
    }
  }
}
