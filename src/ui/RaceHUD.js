import { RaceState } from '../systems/RaceManager.js';

export class RaceHUD {
  constructor(raceManager, carController) {
    this.raceManager = raceManager;
    this.carController = carController;

    // DOM Elements
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownText = document.getElementById('countdown-text');
    
    this.lapValueElement = document.getElementById('lap-value');
    this.totalTimeElement = document.getElementById('total-time-val');
    this.lapTimeElement = document.getElementById('lap-time-val');
    this.bestTimeElement = document.getElementById('best-time-val');
    
    this.wrongWayBadge = document.getElementById('wrong-way-badge');
    
    this.finishModal = document.getElementById('finish-modal');
    this.finishTotalTime = document.getElementById('finish-total-time');
    this.finishBestTime = document.getElementById('finish-best-time');
    this.restartBtn = document.getElementById('restart-race-btn');

    this.initListeners();
  }

  initListeners() {
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => {
        this.raceManager.restart(this.carController);
        if (this.finishModal) {
          this.finishModal.classList.remove('active');
        }
      });
    }
  }

  update() {
    const { state, countdownText, currentLap, totalLaps, totalTime, currentLapTime, bestLapTime, isWrongWay } = this.raceManager;

    const hudContainer = document.getElementById('hud-container');
    if (hudContainer) {
      hudContainer.style.display = (state === RaceState.MENU || state === RaceState.GARAGE || state === RaceState.START_SCREEN) ? 'none' : 'flex';
    }

    if (state === RaceState.MENU || state === RaceState.GARAGE || state === RaceState.START_SCREEN) {
      if (this.countdownOverlay) this.countdownOverlay.style.display = 'none';
      if (this.wrongWayBadge) this.wrongWayBadge.style.display = 'none';
      if (this.finishModal) this.finishModal.classList.remove('active');
      return;
    }

    // 1. COUNTDOWN DISPLAY
    if (state === RaceState.COUNTDOWN) {
      if (this.countdownOverlay && this.countdownText) {
        this.countdownOverlay.style.display = 'flex';
        if (this.countdownText.textContent !== countdownText) {
          this.countdownText.textContent = countdownText;
          // Trigger scale animation restart
          this.countdownText.className = 'countdown-num pulse';
        }
      }
      if (this.finishModal) this.finishModal.classList.remove('active');
      if (this.wrongWayBadge) this.wrongWayBadge.style.display = 'none';
    } else {
      if (this.countdownOverlay) {
        this.countdownOverlay.style.display = 'none';
      }
    }

    // 2. TELEMETRY DISPLAY
    if (this.lapValueElement) {
      if (this.raceManager.racingTrack && this.raceManager.racingTrack.isPointToPoint) {
        this.lapValueElement.textContent = 'STAGE 1 / 1';
      } else {
        this.lapValueElement.textContent = `${currentLap} / ${totalLaps}`;
      }
    }

    if (this.totalTimeElement) {
      this.totalTimeElement.textContent = this.raceManager.formatTime(totalTime);
    }

    if (this.lapTimeElement) {
      this.lapTimeElement.textContent = this.raceManager.formatTime(currentLapTime);
    }

    if (this.bestTimeElement) {
      this.bestTimeElement.textContent = this.raceManager.formatTime(bestLapTime);
    }

    // 3. WRONG-WAY WARNING
    if (this.wrongWayBadge) {
      this.wrongWayBadge.style.display = (state === RaceState.RACING && isWrongWay) ? 'flex' : 'none';
    }

    // 4. FINISH MODAL (Superseded by Phase 9 RaceResultsScreen)
    if (this.finishModal) {
      this.finishModal.classList.remove('active');
    }
  }
}
