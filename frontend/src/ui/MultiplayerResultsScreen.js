export class MultiplayerResultsScreen {
  constructor(onReturnToLobby, onRematchRequest) {
    this.onReturnToLobby = onReturnToLobby;
    this.onRematchRequest = onRematchRequest;
    this.buildDOM();
    this.bindEvents();
  }

  buildDOM() {
    // 1. Winner Banner (shown immediately)
    this.winnerBanner = document.createElement('div');
    this.winnerBanner.id = 'multiplayer-winner-banner';
    this.winnerBanner.style.cssText = `
      position: absolute;
      top: 15%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 240, 255, 0.2);
      border: 2px solid #00f0ff;
      color: #fff;
      padding: 1rem 3rem;
      border-radius: 30px;
      font-family: var(--font-sans);
      font-size: 2.5rem;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      text-shadow: 0 0 10px #00f0ff;
      box-shadow: 0 0 30px rgba(0, 240, 255, 0.4);
      z-index: 100;
      display: none;
      pointer-events: none;
      animation: winnerPulse 1s infinite alternate;
    `;

    // Add animation dynamically
    if (!document.getElementById('mp-winner-anim')) {
      const style = document.createElement('style');
      style.id = 'mp-winner-anim';
      style.textContent = `
        @keyframes winnerPulse {
          0% { transform: translateX(-50%) scale(0.95); opacity: 0.9; }
          100% { transform: translateX(-50%) scale(1.05); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // 2. Final Results Modal (shown when both finish)
    this.finalModal = document.createElement('div');
    this.finalModal.className = 'modal-overlay';
    this.finalModal.id = 'multiplayer-final-modal';
    
    this.finalModal.innerHTML = `
      <div class="modal-card">
        <div class="modal-icon">🏆</div>
        <h2>FINAL RESULT</h2>
        <div class="finish-stats" id="mp-final-stats">
          <!-- Dynamically populated -->
        </div>
        <div id="mp-rematch-status" style="margin-top: 1rem; color: #ffb700; font-weight: bold; font-family: var(--font-mono); font-size: 0.9rem; text-shadow: 0 0 10px rgba(255,183,0,0.5); display: none;">
          WAITING FOR OPPONENT...
        </div>
        <div style="display: flex; gap: 10px; margin-top: 1rem;">
          <button id="mp-btn-rematch" class="action-btn" style="flex: 1; background: linear-gradient(135deg, #ffb700 0%, #ff8800 100%);">
            REMATCH
          </button>
          <button id="mp-btn-return-lobby" class="action-btn" style="flex: 1;">
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.winnerBanner);
    document.body.appendChild(this.finalModal);
  }

  bindEvents() {
    const btnReturn = this.finalModal.querySelector('#mp-btn-return-lobby');
    const btnRematch = this.finalModal.querySelector('#mp-btn-rematch');

    if (btnReturn) {
      btnReturn.addEventListener('click', () => {
        this.hide();
        if (this.onReturnToLobby) this.onReturnToLobby();
      });
    }

    if (btnRematch) {
      btnRematch.addEventListener('click', () => {
        btnRematch.disabled = true;
        btnRematch.style.opacity = '0.5';
        const statusEl = this.finalModal.querySelector('#mp-rematch-status');
        if (statusEl) {
          statusEl.textContent = 'WAITING FOR OPPONENT...';
          statusEl.style.display = 'block';
        }
        if (this.onRematchRequest) this.onRematchRequest();
      });
    }
  }

  updateRematchStatus(status) {
    const statusEl = this.finalModal.querySelector('#mp-rematch-status');
    if (statusEl && !status.allConfirmed) {
      statusEl.textContent = `${status.requesterUsername} REQUESTED REMATCH!`;
      statusEl.style.display = 'block';
    }
  }

  showWinnerBanner(winnerUsername) {
    this.winnerBanner.textContent = `${winnerUsername} WON!`;
    this.winnerBanner.style.display = 'block';
  }

  resetRematchState() {
    const btnRematch = this.finalModal.querySelector('#mp-btn-rematch');
    if (btnRematch) {
      btnRematch.disabled = false;
      btnRematch.style.opacity = '1';
    }
    const statusEl = this.finalModal.querySelector('#mp-rematch-status');
    if (statusEl) {
      statusEl.style.display = 'none';
    }
  }

  showFinalResults(results) {
    this.winnerBanner.style.display = 'none';
    
    const statsContainer = this.finalModal.querySelector('#mp-final-stats');
    statsContainer.innerHTML = ''; // Clear previous

    results.forEach((res, index) => {
      const position = index + 1;
      const placementText = res.isWinner ? 'WON!' : '2nd PLACE';
      const color = res.isWinner ? '#00f0ff' : '#8a99ad';
      
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.style.marginBottom = '10px';
      row.innerHTML = `
        <span class="stat-label" style="font-size:1.1rem; color:${color}; font-weight:bold;">
          ${position}. ${res.username}
        </span>
        <span class="stat-val highlight" style="font-size:1.1rem; color:${color};">
          ${placementText}
        </span>
      `;
      statsContainer.appendChild(row);
    });

    this.finalModal.classList.add('active');
    
    this.resetRematchState();
  }

  hide() {
    if (this.winnerBanner) this.winnerBanner.style.display = 'none';
    if (this.finalModal) this.finalModal.classList.remove('active');
  }
}
