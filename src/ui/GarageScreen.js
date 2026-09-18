export class GarageScreen {
  constructor(vehicleManager, onVehicleChangeCallback, onCustomizationChangeCallback, onSelectCallback, onBackCallback) {
    this.vehicleManager = vehicleManager;
    this.onVehicleChangeCallback = onVehicleChangeCallback;
    this.onCustomizationChangeCallback = onCustomizationChangeCallback;
    this.onSelectCallback = onSelectCallback;
    this.onBackCallback = onBackCallback;

    this.currentIndex = this.vehicleManager.getSelectedIndex('player1');
    this.activeTab = 'cars'; // 'cars' | 'paint' | 'wheels' | 'perf'
    this.overlay = null;

    this.buildDOM();
  }

  buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'garage-overlay';
    this.overlay.className = 'garage-container';

    const currentVehicle = this.vehicleManager.getVehicleByIndex(this.currentIndex);
    const selectedVehicle = this.vehicleManager.getSelectedVehicle('player1');
    const isSelected = currentVehicle.id === selectedVehicle.id;

    const customization = this.vehicleManager.getCustomization('player1', currentVehicle.id);
    const paintPalette = this.vehicleManager.getPaintPalette();
    const wheelStyles = this.vehicleManager.getWheelStyles();
    const perfLevels = this.vehicleManager.getPerformanceLevels();

    this.overlay.innerHTML = `
      <div class="garage-glass-card">
        <!-- Top Showroom Header -->
        <div class="garage-header">
          <div class="header-top-row">
            <div class="garage-badge">
              <span class="pulse-dot"></span>
              <span>3D GARAGE SHOWROOM</span>
            </div>
            <div class="unlock-tag ${currentVehicle.isUnlocked ? 'unlocked' : 'locked'}">
              ${currentVehicle.isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
            </div>
          </div>
          <h1 class="garage-title" id="garage-title">${currentVehicle.name}</h1>
          <p class="garage-subtitle" id="garage-subtitle">${currentVehicle.subtitle}</p>
        </div>

        <!-- Customization Category Navigation Tabs -->
        <div class="garage-tabs-bar">
          <button class="tab-btn active" data-tab="cars">🏎️ CARS</button>
          <button class="tab-btn" data-tab="paint">🎨 PAINT</button>
          <button class="tab-btn" data-tab="wheels">⚙️ WHEELS</button>
          <button class="tab-btn" data-tab="perf">⚡ TUNING</button>
        </div>

        <!-- Tab 1: CARS Carousel Sub-Panel -->
        <div class="tab-subpanel active" id="panel-cars">
          <div class="garage-carousel-nav">
            <button id="btn-prev-car" class="carousel-btn" title="Previous Vehicle">
              <span class="arrow">◀</span>
              <span class="label">PREV CAR</span>
            </button>

            <div class="carousel-counter" id="carousel-counter">
              <span class="cur-num">${this.currentIndex + 1}</span> / <span class="total-num">${this.vehicleManager.getCatalog().length}</span>
            </div>

            <button id="btn-next-car" class="carousel-btn" title="Next Vehicle">
              <span class="label">NEXT CAR</span>
              <span class="arrow">▶</span>
            </button>
          </div>
        </div>

        <!-- Tab 2: PAINT Customization Palette Sub-Panel -->
        <div class="tab-subpanel" id="panel-paint">
          <div class="panel-section-title">CHOOSE PAINT FINISH</div>
          <div class="paint-swatches-grid" id="paint-swatches-grid">
            ${paintPalette.map(p => `
              <button class="swatch-btn ${p.id === customization.paintId ? 'active' : ''}" data-paint-id="${p.id}" title="${p.name}">
                <span class="swatch-color" style="background-color: ${p.hex}"></span>
                <span class="swatch-name">${p.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Tab 3: WHEELS Customization Sub-Panel -->
        <div class="tab-subpanel" id="panel-wheels">
          <div class="panel-section-title">WHEEL RIM STYLES</div>
          <div class="wheels-grid" id="wheels-grid">
            ${wheelStyles.map(w => `
              <button class="wheel-style-btn ${w.id === customization.wheelStyleId ? 'active' : ''}" data-wheel-id="${w.id}">
                <span class="wheel-icon">⚙️</span>
                <span class="wheel-name">${w.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Tab 4: PERFORMANCE Tuning Sub-Panel -->
        <div class="tab-subpanel" id="panel-perf">
          <div class="panel-section-title">PERFORMANCE STRENGTH LEVEL</div>
          <div class="perf-levels-grid" id="perf-levels-grid">
            ${perfLevels.map(p => `
              <button class="perf-level-btn ${p.level === customization.performanceLevel ? 'active' : ''}" data-level="${p.level}">
                <span class="level-tag">LVL ${p.level}</span>
                <span class="level-name">${p.label}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Vehicle Spec Performance Cards -->
        <div class="garage-specs">
          <div class="spec-header">
            <span class="spec-icon">⚡</span>
            <span class="spec-title">PERFORMANCE TELEMETRY</span>
          </div>

          <div class="spec-rows">
            <!-- Top Speed -->
            <div class="spec-item">
              <div class="spec-info">
                <span class="spec-label">TOP SPEED</span>
                <span class="spec-val highlight" id="spec-speed-val">350 KM/H</span>
              </div>
              <div class="spec-bar-track">
                <div class="spec-bar-fill gold" id="spec-speed-bar" style="width: 95%"></div>
              </div>
            </div>

            <!-- Acceleration -->
            <div class="spec-item">
              <div class="spec-info">
                <span class="spec-label">ACCELERATION (0-100 KM/H)</span>
                <span class="spec-val" id="spec-accel-val">2.8 SEC</span>
              </div>
              <div class="spec-bar-track">
                <div class="spec-bar-fill cyan" id="spec-accel-bar" style="width: 95%"></div>
              </div>
            </div>

            <!-- Handling -->
            <div class="spec-item">
              <div class="spec-info">
                <span class="spec-label">HANDLING & STABILITY</span>
                <span class="spec-val" id="spec-handling-val">AWD SUPERSPORT (94/100)</span>
              </div>
              <div class="spec-bar-track">
                <div class="spec-bar-fill cyan" id="spec-handling-bar" style="width: 94%"></div>
              </div>
            </div>

            <!-- Braking -->
            <div class="spec-item">
              <div class="spec-info">
                <span class="spec-label">BRAKING SYSTEM</span>
                <span class="spec-val" id="spec-braking-val">CARBON CERAMIC (92/100)</span>
              </div>
              <div class="spec-bar-track">
                <div class="spec-bar-fill gold" id="spec-braking-bar" style="width: 92%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vehicle Specs Summary Bar -->
        <div class="garage-details-grid">
          <div class="detail-box">
            <span class="label">ENGINE</span>
            <span class="val" id="detail-engine">${currentVehicle.engine}</span>
          </div>
          <div class="detail-box">
            <span class="label">POWER</span>
            <span class="val" id="detail-power">${currentVehicle.power}</span>
          </div>
          <div class="detail-box">
            <span class="label">PAINT FINISH</span>
            <span class="val highlight-gold" id="detail-paint">${currentVehicle.colorName}</span>
          </div>
        </div>

        <!-- Selection Status Badge -->
        <div class="garage-status-bar ${isSelected ? 'selected' : 'available'}" id="garage-status-badge">
          <span class="status-icon">${isSelected ? '✓' : 'ℹ'}</span>
          <span class="status-text" id="status-text">${isSelected ? 'SELECTED FOR RACE (PLAYER 1)' : 'AVAILABLE FOR SELECTION'}</span>
        </div>

        <!-- Action Buttons Stack -->
        <div class="garage-actions">
          <button id="btn-select-car" type="button" class="garage-btn btn-primary-select ${isSelected ? 'selected' : ''}">
            <span class="btn-icon">${isSelected ? '✓' : '🏎️'}</span>
            <span class="btn-text" id="select-btn-text">${isSelected ? 'CAR SELECTED' : 'SELECT THIS CAR'}</span>
            <span class="btn-glow"></span>
          </button>

          <button id="btn-garage-back" type="button" class="garage-btn btn-secondary-back">
            <span class="btn-icon">⬅</span>
            <span class="btn-text">BACK TO MENU</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.initEventListeners();
    this.updateCurrentVehicleView();
  }

  initEventListeners() {
    // Prevent touch/mouse gestures from bubbling past the overlay
    this.overlay.addEventListener('pointerdown', (e) => e.stopPropagation());

    // 1. Tab Switching Event Listeners
    const tabBtns = this.overlay.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const targetTab = btn.getAttribute('data-tab');
        this.activeTab = targetTab;

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const panels = this.overlay.querySelectorAll('.tab-subpanel');
        panels.forEach(p => p.classList.remove('active'));

        const targetPanel = this.overlay.querySelector(`#panel-${targetTab}`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // 2. Carousel Controls
    const prevBtn = this.overlay.querySelector('#btn-prev-car');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const catalog = this.vehicleManager.getCatalog();
        this.currentIndex = (this.currentIndex - 1 + catalog.length) % catalog.length;
        this.updateCurrentVehicleView();
      });
    }

    const nextBtn = this.overlay.querySelector('#btn-next-car');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const catalog = this.vehicleManager.getCatalog();
        this.currentIndex = (this.currentIndex + 1) % catalog.length;
        this.updateCurrentVehicleView();
      });
    }

    // 3. Paint Swatches
    const paintGrid = this.overlay.querySelector('#paint-swatches-grid');
    if (paintGrid) {
      paintGrid.addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.target.closest('.swatch-btn');
        if (btn) {
          e.preventDefault();
          const paintId = btn.getAttribute('data-paint-id');
          const currentVehicle = this.vehicleManager.getVehicleByIndex(this.currentIndex);
          this.vehicleManager.setCustomization('player1', currentVehicle.id, { paintId });
          
          this.overlay.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          this.updateCurrentVehicleView();
        }
      });
    }

    // 4. Wheel Styles
    const wheelsGrid = this.overlay.querySelector('#wheels-grid');
    if (wheelsGrid) {
      wheelsGrid.addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.target.closest('.wheel-style-btn');
        if (btn) {
          e.preventDefault();
          const wheelStyleId = btn.getAttribute('data-wheel-id');
          const currentVehicle = this.vehicleManager.getVehicleByIndex(this.currentIndex);
          this.vehicleManager.setCustomization('player1', currentVehicle.id, { wheelStyleId });

          this.overlay.querySelectorAll('.wheel-style-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          this.updateCurrentVehicleView();
        }
      });
    }

    // 5. Performance Levels
    const perfGrid = this.overlay.querySelector('#perf-levels-grid');
    if (perfGrid) {
      perfGrid.addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.target.closest('.perf-level-btn');
        if (btn) {
          e.preventDefault();
          const level = parseInt(btn.getAttribute('data-level'), 10);
          const currentVehicle = this.vehicleManager.getVehicleByIndex(this.currentIndex);
          this.vehicleManager.setCustomization('player1', currentVehicle.id, { performanceLevel: level });

          this.overlay.querySelectorAll('.perf-level-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          this.updateCurrentVehicleView();
        }
      });
    }

    // 6. Select Button (Strictly selects current vehicle and stays inside Garage)
    const selectBtn = this.overlay.querySelector('#btn-select-car');
    if (selectBtn) {
      const handleSelect = (e) => {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        const currentVehicle = this.vehicleManager.getVehicleByIndex(this.currentIndex);
        this.vehicleManager.setSelectedVehicle('player1', currentVehicle.id);
        this.updateCurrentVehicleView();

        if (typeof this.onSelectCallback === 'function') {
          this.onSelectCallback(currentVehicle.id);
        }
      };

      selectBtn.addEventListener('click', handleSelect);
    }

    // 7. Back Button (Sole button responsible for navigating back to Main Menu)
    const backBtn = this.overlay.querySelector('#btn-garage-back');
    if (backBtn) {
      const handleBack = (e) => {
        if (e) {
          e.stopPropagation();
          e.preventDefault();
        }
        this.hide();
        if (typeof this.onBackCallback === 'function') {
          this.onBackCallback();
        }
      };

      backBtn.addEventListener('click', handleBack);
    }
  }

  updateCurrentVehicleView() {
    const vehicle = this.vehicleManager.getVehicleByIndex(this.currentIndex);
    const selectedVehicle = this.vehicleManager.getSelectedVehicle('player1');
    const isSelected = vehicle.id === selectedVehicle.id;

    const cust = this.vehicleManager.getCustomization('player1', vehicle.id);
    const paintObj = this.vehicleManager.getPaintObj(cust.paintId);
    const wheelObj = this.vehicleManager.getWheelStyleObj(cust.wheelStyleId);
    const effectiveTelemetry = this.vehicleManager.getEffectiveTelemetry(vehicle.id, cust.performanceLevel);

    // Header & Subtitle
    const title = this.overlay.querySelector('#garage-title');
    const subtitle = this.overlay.querySelector('#garage-subtitle');
    const counter = this.overlay.querySelector('#carousel-counter .cur-num');
    
    if (title) title.textContent = vehicle.name;
    if (subtitle) subtitle.textContent = vehicle.subtitle;
    if (counter) counter.textContent = this.currentIndex + 1;

    // Telemetry Bars
    const speedVal = this.overlay.querySelector('#spec-speed-val');
    const speedBar = this.overlay.querySelector('#spec-speed-bar');
    if (speedVal) speedVal.textContent = `${effectiveTelemetry.topSpeedKmH} KM/H`;
    if (speedBar) speedBar.style.width = `${Math.round((effectiveTelemetry.topSpeedKmH / 390) * 100)}%`;

    const accelVal = this.overlay.querySelector('#spec-accel-val');
    const accelBar = this.overlay.querySelector('#spec-accel-bar');
    if (accelVal) accelVal.textContent = `${effectiveTelemetry.accelSec} SEC`;
    if (accelBar) accelBar.style.width = `${Math.round((1 - (parseFloat(effectiveTelemetry.accelSec) - 2.0) / 2.0) * 100)}%`;

    const handlingVal = this.overlay.querySelector('#spec-handling-val');
    const handlingBar = this.overlay.querySelector('#spec-handling-bar');
    if (handlingVal) handlingVal.textContent = `${vehicle.drivetrain} (${effectiveTelemetry.handlingRating}/100)`;
    if (handlingBar) handlingBar.style.width = `${effectiveTelemetry.handlingRating}%`;

    const brakingVal = this.overlay.querySelector('#spec-braking-val');
    const brakingBar = this.overlay.querySelector('#spec-braking-bar');
    if (brakingVal) brakingVal.textContent = `CARBON CERAMIC (${effectiveTelemetry.brakingRating}/100)`;
    if (brakingBar) brakingBar.style.width = `${effectiveTelemetry.brakingRating}%`;

    // Details Grid
    const engine = this.overlay.querySelector('#detail-engine');
    const power = this.overlay.querySelector('#detail-power');
    const paint = this.overlay.querySelector('#detail-paint');
    if (engine) engine.textContent = vehicle.engine;
    if (power) power.textContent = vehicle.power;
    if (paint) paint.textContent = paintObj.name;

    // Update Swatch Active Highlights
    this.overlay.querySelectorAll('.swatch-btn').forEach(b => {
      const pId = b.getAttribute('data-paint-id');
      b.classList.toggle('active', pId === cust.paintId);
    });

    // Update Wheel Active Highlights
    this.overlay.querySelectorAll('.wheel-style-btn').forEach(b => {
      const wId = b.getAttribute('data-wheel-id');
      b.classList.toggle('active', wId === cust.wheelStyleId);
    });

    // Update Perf Active Highlights
    this.overlay.querySelectorAll('.perf-level-btn').forEach(b => {
      const lvl = parseInt(b.getAttribute('data-level'), 10);
      b.classList.toggle('active', lvl === cust.performanceLevel);
    });

    // Status Badge & Button Text
    const statusBadge = this.overlay.querySelector('#garage-status-badge');
    const statusText = this.overlay.querySelector('#status-text');
    const statusIcon = this.overlay.querySelector('.status-icon');
    const selectBtn = this.overlay.querySelector('#btn-select-car');
    const selectBtnText = this.overlay.querySelector('#select-btn-text');

    if (isSelected) {
      if (statusBadge) statusBadge.className = 'garage-status-bar selected';
      if (statusText) statusText.textContent = 'SELECTED FOR RACE (PLAYER 1)';
      if (statusIcon) statusIcon.textContent = '✓';
      if (selectBtn) selectBtn.classList.add('selected');
      if (selectBtnText) selectBtnText.textContent = 'CAR SELECTED';
    } else {
      if (statusBadge) statusBadge.className = 'garage-status-bar available';
      if (statusText) statusText.textContent = 'AVAILABLE FOR SELECTION';
      if (statusIcon) statusIcon.textContent = 'ℹ';
      if (selectBtn) selectBtn.classList.remove('selected');
      if (selectBtnText) selectBtnText.textContent = 'SELECT THIS CAR';
    }

    // Trigger 3D Vehicle Customization Change Callback
    if (typeof this.onVehicleChangeCallback === 'function') {
      this.onVehicleChangeCallback(vehicle.id);
    }

    if (typeof this.onCustomizationChangeCallback === 'function') {
      this.onCustomizationChangeCallback({
        vehicleId: vehicle.id,
        paintObj,
        wheelStyleObj: wheelObj,
        performanceLevel: cust.performanceLevel
      });
    }
  }

  show() {
    this.currentIndex = this.vehicleManager.getSelectedIndex('player1');
    this.updateCurrentVehicleView();

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
