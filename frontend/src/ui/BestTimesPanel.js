export class BestTimesPanel {
  constructor(onBackCallback) {
    this.onBackCallback = onBackCallback;
    this.overlay = null;
    this.buildDOM();
  }

  buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'best-times-overlay';
    this.overlay.className = 'best-times-container';

    this.overlay.innerHTML = `
      <div class="best-times-glass-card">
        <!-- Header -->
        <div class="best-times-header">
          <div class="header-badge"><span>OFFICIAL RECORDS</span></div>
          <h2 class="panel-title">🏆 PERSONAL BEST TIMES</h2>
          <p class="panel-subtitle">TRACK: FOREST CREST CIRCUIT</p>
        </div>

        <div class="panel-divider"></div>

        <!-- Clean Empty State Notice (shown if 0 races completed) -->
        <div id="best-times-empty-notice" class="best-times-empty-card" style="display: none;">
          <span class="empty-icon">🏁</span>
          <h3 class="empty-title">NO RECORDS YET</h3>
          <p class="empty-subtitle">Complete your first 3-lap race on Forest Crest Circuit to establish official track telemetry and personal best times!</p>
        </div>

        <!-- Telemetry Cards -->
        <div class="records-grid">
          <div class="record-card highlight-card">
            <span class="card-icon">🥇</span>
            <div class="card-body">
              <span class="card-label">BEST TOTAL RACE TIME</span>
              <span id="record-total-time" class="card-val gold-text">--:--.---</span>
            </div>
          </div>

          <div class="record-card highlight-card">
            <span class="card-icon">⚡</span>
            <div class="card-body">
              <span class="card-label">BEST LAP TIME</span>
              <span id="record-best-lap" class="card-val cyan-text">--:--.---</span>
            </div>
          </div>

          <div class="record-card">
            <span class="card-icon">🏁</span>
            <div class="card-body">
              <span class="card-label">COMPLETED RACES</span>
              <span id="record-races-count" class="card-val">0</span>
            </div>
          </div>

          <div class="record-card">
            <span class="card-icon">🏎️</span>
            <div class="card-body">
              <span class="card-label">BEST VEHICLE</span>
              <span id="record-best-car" class="card-val">--</span>
            </div>
          </div>

          <div class="record-card full-width">
            <span class="card-icon">🎨</span>
            <div class="card-body">
              <span class="card-label">BEST PAINT USED</span>
              <span id="record-best-paint" class="card-val">--</span>
            </div>
          </div>
        </div>

        <div class="panel-divider"></div>

        <!-- Footer / Action Button -->
        <div class="panel-actions">
          <button id="btn-close-best-times" class="panel-btn btn-secondary">
            <span class="btn-icon">⬅️</span>
            <span class="btn-text">BACK TO MENU</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.initEvents();
  }

  initEvents() {
    const closeBtn = this.overlay.querySelector('#btn-close-best-times');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
        if (typeof this.onBackCallback === 'function') {
          this.onBackCallback();
        }
      });
    }

    // Backdrop click close support
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
        if (typeof this.onBackCallback === 'function') {
          this.onBackCallback();
        }
      }
    });
  }

  show(record, bestTimeManager) {
    if (!this.overlay) return;

    const emptyNotice = this.overlay.querySelector('#best-times-empty-notice');
    const totalTimeEl = this.overlay.querySelector('#record-total-time');
    const bestLapEl = this.overlay.querySelector('#record-best-lap');
    const racesCountEl = this.overlay.querySelector('#record-races-count');
    const carEl = this.overlay.querySelector('#record-best-car');
    const paintEl = this.overlay.querySelector('#record-best-paint');

    const completedRaces = record ? (record.completedRaces || 0) : 0;
    const hasRecords = completedRaces > 0 && record.bestTotalTime !== null;

    if (emptyNotice) {
      emptyNotice.style.display = hasRecords ? 'none' : 'flex';
    }

    if (totalTimeEl) {
      totalTimeEl.textContent = bestTimeManager ? bestTimeManager.formatTime(record?.bestTotalTime) : '--:--.---';
    }

    if (bestLapEl) {
      bestLapEl.textContent = bestTimeManager ? bestTimeManager.formatTime(record?.bestLapTime) : '--:--.---';
    }

    if (racesCountEl) {
      racesCountEl.textContent = completedRaces;
    }

    if (carEl) {
      carEl.textContent = record?.bestVehicle || record?.bestVehicleName || '--';
    }

    if (paintEl) {
      paintEl.textContent = record?.bestPaint || record?.bestPaintName || '--';
    }

    this.overlay.style.display = 'flex';
    void this.overlay.offsetWidth;
    this.overlay.classList.add('active');
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.overlay.style.display = 'none';
    }
  }
}
