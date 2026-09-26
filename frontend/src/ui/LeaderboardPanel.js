export class LeaderboardPanel {
  constructor(onBackCallback, onStartRaceCallback) {
    this.onBackCallback = onBackCallback;
    this.onStartRaceCallback = onStartRaceCallback;
    this.overlay = null;
    this.localPlayerId = 'player1';
    this.buildDOM();
  }

  buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'leaderboard-overlay';
    this.overlay.className = 'leaderboard-container';

    this.overlay.innerHTML = `
      <div class="leaderboard-glass-card">
        <!-- Header -->
        <div class="leaderboard-header">
          <div class="header-brand-group">
            <div class="header-badge"><span>OFFICIAL TELEMETRY</span></div>
            <h2 class="panel-title">🏆 LEADERBOARD</h2>
            <p class="panel-subtitle">TRACK: FOREST CREST CIRCUIT</p>
          </div>
          <div class="track-badge">
            <span class="badge-icon">🏁</span>
            <span class="badge-text">TOP 10</span>
          </div>
        </div>

        <div class="panel-divider"></div>

        <!-- Empty State Container (shown when 0 entries exist) -->
        <div id="leaderboard-empty-notice" class="leaderboard-empty-card" style="display: none;">
          <span class="empty-icon">🏆</span>
          <h3 class="empty-title">NO LEADERBOARD RECORDS</h3>
          <p class="empty-subtitle">Complete a race to set your first leaderboard time.</p>
          <button id="btn-empty-start-race" class="panel-btn btn-primary" style="margin-top: 10px;">
            <span class="btn-icon">▶</span>
            <span class="btn-text">START RACE</span>
            <span class="btn-glow"></span>
          </button>
        </div>

        <!-- Leaderboard Data Content Container -->
        <div id="leaderboard-content" class="leaderboard-content">
          <!-- Desktop / Tablet Table View -->
          <div class="leaderboard-table-wrapper">
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th class="col-rank">RANK</th>
                  <th class="col-driver">DRIVER</th>
                  <th class="col-car">CAR</th>
                  <th class="col-best-lap">BEST LAP</th>
                  <th class="col-total-time">TOTAL TIME</th>
                </tr>
              </thead>
              <tbody id="leaderboard-table-body">
                <!-- Rows injected dynamically -->
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards Stack View -->
          <div id="leaderboard-mobile-cards" class="leaderboard-mobile-cards">
            <!-- Mobile cards injected dynamically -->
          </div>
        </div>

        <div class="panel-divider"></div>

        <!-- Footer / Action Button -->
        <div class="panel-actions">
          <button id="btn-close-leaderboard" class="panel-btn btn-secondary">
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
    const closeBtn = this.overlay.querySelector('#btn-close-leaderboard');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
        if (typeof this.onBackCallback === 'function') {
          this.onBackCallback();
        }
      });
    }

    const emptyStartBtn = this.overlay.querySelector('#btn-empty-start-race');
    if (emptyStartBtn) {
      emptyStartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
        if (typeof this.onStartRaceCallback === 'function') {
          this.onStartRaceCallback();
        }
      });
    }

    // Backdrop click support
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
        if (typeof this.onBackCallback === 'function') {
          this.onBackCallback();
        }
      }
    });
  }

  show(entries = [], leaderboardManager = null, localPlayerId = 'player1') {
    if (!this.overlay) return;
    this.localPlayerId = localPlayerId;

    const emptyNotice = this.overlay.querySelector('#leaderboard-empty-notice');
    const content = this.overlay.querySelector('#leaderboard-content');
    const tbody = this.overlay.querySelector('#leaderboard-table-body');
    const mobileContainer = this.overlay.querySelector('#leaderboard-mobile-cards');

    const hasEntries = Array.isArray(entries) && entries.length > 0;

    if (emptyNotice) {
      emptyNotice.style.display = hasEntries ? 'none' : 'flex';
    }

    if (content) {
      content.style.display = hasEntries ? 'block' : 'none';
    }

    if (hasEntries && tbody && mobileContainer && leaderboardManager) {
      let tableHtml = '';
      let mobileHtml = '';

      entries.forEach((entry, idx) => {
        const rank = idx + 1;
        const isCurrentPlayer = entry.playerId === this.localPlayerId;
        const totalTimeStr = leaderboardManager.formatTime(entry.totalTime);
        const bestLapStr = leaderboardManager.formatTime(entry.bestLap);

        // Rank Badge Styling
        let rankBadgeClass = 'rank-normal';
        let rankIcon = `#${rank}`;
        if (rank === 1) {
          rankBadgeClass = 'rank-gold';
          rankIcon = '🥇 #1';
        } else if (rank === 2) {
          rankBadgeClass = 'rank-silver';
          rankIcon = '🥈 #2';
        } else if (rank === 3) {
          rankBadgeClass = 'rank-bronze';
          rankIcon = '🥉 #3';
        }

        const playerTag = isCurrentPlayer ? '<span class="you-badge">YOU</span>' : '';
        const rowHighlightClass = isCurrentPlayer ? 'is-current-player' : '';

        // Desktop Table Row
        tableHtml += `
          <tr class="leaderboard-row ${rankBadgeClass} ${rowHighlightClass}">
            <td class="col-rank"><span class="rank-badge">${rankIcon}</span></td>
            <td class="col-driver"><span class="driver-name">${entry.playerName || 'RAVI'}</span> ${playerTag}</td>
            <td class="col-car"><span class="car-name">${entry.vehicleName || 'Apex Supercar'}</span></td>
            <td class="col-best-lap"><span class="lap-val">${bestLapStr}</span></td>
            <td class="col-total-time"><span class="total-val highlight">${totalTimeStr}</span></td>
          </tr>
        `;

        // Mobile Card Stack
        mobileHtml += `
          <div class="leaderboard-mobile-card ${rankBadgeClass} ${rowHighlightClass}">
            <div class="mobile-card-header">
              <span class="rank-badge">${rankIcon}</span>
              <div class="driver-info">
                <span class="driver-name">${entry.playerName || 'RAVI'}</span>
                ${playerTag}
              </div>
            </div>
            <div class="mobile-card-body">
              <div class="mobile-stat">
                <span class="stat-lbl">CAR</span>
                <span class="stat-val car-name">${entry.vehicleName || 'Apex Supercar'}</span>
              </div>
              <div class="mobile-stat-row">
                <div class="mobile-stat">
                  <span class="stat-lbl">BEST LAP</span>
                  <span class="stat-val lap-val">${bestLapStr}</span>
                </div>
                <div class="mobile-stat">
                  <span class="stat-lbl">TOTAL TIME</span>
                  <span class="stat-val total-val highlight">${totalTimeStr}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      tbody.innerHTML = tableHtml;
      mobileContainer.innerHTML = mobileHtml;
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
