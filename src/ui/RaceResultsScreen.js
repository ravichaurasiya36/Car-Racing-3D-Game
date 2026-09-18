export class RaceResultsScreen {
  constructor(onRaceAgainCallback, onMainMenuCallback) {
    this.onRaceAgainCallback = onRaceAgainCallback;
    this.onMainMenuCallback = onMainMenuCallback;

    this.overlay = null;
    this.buildDOM();
  }

  buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'race-results-overlay';
    this.overlay.className = 'race-results-container';

    this.overlay.innerHTML = `
      <div class="results-glass-card">
        <!-- Personal Best Dynamic Banner (Hidden by default) -->
        <div id="results-pb-badge" class="results-pb-badge" style="display: none;">
          <span class="pb-star">⭐</span>
          <span id="results-pb-text">NEW PERSONAL BEST!</span>
          <span class="pb-star">⭐</span>
        </div>

        <!-- Header Title & Position Badge -->
        <div class="results-header">
          <div class="results-title-group">
            <h1 class="results-title">RACE COMPLETE</h1>
            <p class="results-subtitle">OFFICIAL TELEMETRY & PERFORMANCE</p>
          </div>
          <div class="position-badge gold">
            <span class="pos-label">POS</span>
            <span id="results-position-val" class="pos-val">P1</span>
          </div>
        </div>

        <div class="results-divider"></div>

        <!-- Stat Grid -->
        <div class="results-stats-grid">
          <div class="stat-card primary-stat">
            <span class="stat-icon">⏱️</span>
            <div class="stat-meta">
              <span class="stat-label">TOTAL RACE TIME</span>
              <span id="results-total-time" class="stat-val highlight">00:00.000</span>
            </div>
          </div>

          <div class="stat-card primary-stat">
            <span class="stat-icon">⚡</span>
            <div class="stat-meta">
              <span class="stat-label">BEST LAP</span>
              <span id="results-best-lap" class="stat-val highlight">00:00.000</span>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-icon">🏁</span>
            <div class="stat-meta">
              <span class="stat-label">LAP COUNT</span>
              <span id="results-laps" class="stat-val">3 / 3</span>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-icon">🏎️</span>
            <div class="stat-meta">
              <span class="stat-label">SELECTED CAR</span>
              <span id="results-car-name" class="stat-val">Apex Royale Hyper GT</span>
            </div>
          </div>

          <div class="stat-card full-width">
            <span class="stat-icon">🎨</span>
            <div class="stat-meta">
              <span class="stat-label">SELECTED PAINT</span>
              <span id="results-paint-name" class="stat-val">Metallic Blue</span>
            </div>
          </div>
        </div>

        <div class="results-divider"></div>

        <!-- Action Buttons -->
        <div class="results-actions">
          <button id="btn-results-race-again" class="results-btn btn-primary">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">RACE AGAIN</span>
            <span class="btn-glow"></span>
          </button>

          <button id="btn-results-main-menu" class="results-btn btn-secondary">
            <span class="btn-icon">🏠</span>
            <span class="btn-text">MAIN MENU</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.initEvents();
  }

  initEvents() {
    const raceAgainBtn = this.overlay.querySelector('#btn-results-race-again');
    if (raceAgainBtn) {
      raceAgainBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
        if (typeof this.onRaceAgainCallback === 'function') {
          this.onRaceAgainCallback();
        }
      });
    }

    const mainMenuBtn = this.overlay.querySelector('#btn-results-main-menu');
    if (mainMenuBtn) {
      mainMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
        if (typeof this.onMainMenuCallback === 'function') {
          this.onMainMenuCallback();
        }
      });
    }
  }

  show(data, pbFlags = {}) {
    // data: { totalTimeFormatted, bestLapFormatted, completedLaps, totalLaps, carName, paintName, position }
    // pbFlags: { isNewTotalBest, isNewLapBest, isAnyBest }
    if (!this.overlay) return;

    const totalTimeEl = this.overlay.querySelector('#results-total-time');
    const bestLapEl = this.overlay.querySelector('#results-best-lap');
    const lapsEl = this.overlay.querySelector('#results-laps');
    const carNameEl = this.overlay.querySelector('#results-car-name');
    const paintNameEl = this.overlay.querySelector('#results-paint-name');
    const posEl = this.overlay.querySelector('#results-position-val');
    const pbBadge = this.overlay.querySelector('#results-pb-badge');
    const pbText = this.overlay.querySelector('#results-pb-text');

    if (totalTimeEl) totalTimeEl.textContent = data.totalTimeFormatted || '00:00.000';
    if (bestLapEl) bestLapEl.textContent = data.bestLapFormatted || '--:--.---';
    if (lapsEl) lapsEl.textContent = `${data.completedLaps || 3} / ${data.totalLaps || 3}`;
    if (carNameEl) carNameEl.textContent = data.carName || 'Apex Supercar';
    if (paintNameEl) paintNameEl.textContent = data.paintName || 'Factory Finish';
    if (posEl) posEl.textContent = data.position || 'P1';

    // Personal Best Banner logic
    if (pbBadge && pbText) {
      if (pbFlags.isNewTotalBest && pbFlags.isNewLapBest) {
        pbBadge.style.display = 'inline-flex';
        pbText.textContent = 'NEW PERSONAL BEST (RACE & LAP)!';
      } else if (pbFlags.isNewTotalBest) {
        pbBadge.style.display = 'inline-flex';
        pbText.textContent = 'NEW BEST TOTAL TIME!';
      } else if (pbFlags.isNewLapBest) {
        pbBadge.style.display = 'inline-flex';
        pbText.textContent = 'NEW BEST LAP!';
      } else {
        pbBadge.style.display = 'none';
      }
    }

    this.overlay.style.display = 'flex';
    void this.overlay.offsetWidth; // Force layout recalculation for animation
    this.overlay.classList.add('active');
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.overlay.style.display = 'none';
    }
  }
}
