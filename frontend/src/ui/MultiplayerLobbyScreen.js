import { MultiplayerClient } from '../network/MultiplayerClient.js';
import { VEHICLE_CATALOG } from '../systems/VehicleManager.js';

function getCarDisplayName(carId) {
  if (!carId) return 'SELECTING...'; // Fallback for missing/pending state
  const car = VEHICLE_CATALOG.find(c => c.id === carId);
  return car ? car.name : carId;
}

const CAR_IDS = VEHICLE_CATALOG.map(c => c.id);

export class MultiplayerLobbyScreen {
  constructor(onBackToUsernameCallback, vehicleManager) {
    this.onBackToUsernameCallback = onBackToUsernameCallback;
    this.vehicleManager = vehicleManager;
    this.overlay = null;
    this.username = 'UNKNOWN';
    this.currentRoomCode = '';
    this.localSelectedCar = 'lamborghini_svj';
    this.localSelectedTrack = 'forest';
    
    this.multiplayerClient = new MultiplayerClient();
    this.setupNetworkCallbacks();

    // UI State: 'main', 'create', 'join'
    this.viewState = 'main'; 
    this.buildDOM();
  }

  setupNetworkCallbacks() {
    this.multiplayerClient.onRoomCreated = (roomCode) => {
      this.currentRoomCode = roomCode;
      this.overlay.querySelector('#created-room-code').textContent = this.currentRoomCode;
      this.overlay.querySelector('#room-you-name').textContent = this.username;
      
      const placeholderMsg = this.overlay.querySelector('#join-placeholder-msg');
      if (placeholderMsg) placeholderMsg.style.display = 'none';

      this.switchView('create');
    };

    this.multiplayerClient.onJoinedRoom = (roomCode) => {
      this.currentRoomCode = roomCode;
      this.overlay.querySelector('#created-room-code').textContent = this.currentRoomCode;
      this.overlay.querySelector('#room-you-name').textContent = this.username;
      
      const placeholderMsg = this.overlay.querySelector('#join-placeholder-msg');
      if (placeholderMsg) placeholderMsg.style.display = 'none';

      this.switchView('create'); // Transition to the same waiting room view
    };

    this.multiplayerClient.onRoomState = (players) => {
      // Find local player to sync our own display
      const localPlayer = players.find(p => p.playerId === this.multiplayerClient.currentPlayerId);
      if (localPlayer) {
        if (localPlayer.selectedCar) {
          this.localSelectedCar = localPlayer.selectedCar;
          const youCarEl = this.overlay.querySelector('#room-you-car');
          if (youCarEl) youCarEl.textContent = getCarDisplayName(this.localSelectedCar);
        }
        
        const btnReady = this.overlay.querySelector('#btn-toggle-ready');
        if (btnReady) {
          if (localPlayer.ready) {
            btnReady.textContent = 'READY';
            btnReady.className = 'ready-btn ready panel-btn btn-primary';
          } else {
            btnReady.textContent = 'NOT READY';
            btnReady.className = 'ready-btn not-ready panel-btn btn-secondary';
          }
        }
      }

      // Update UI with player presence
      const playerItems = this.overlay.querySelectorAll('.room-player-item');
      const youEl = playerItems[0];
      const waitingEl = playerItems[1];

      if (!youEl || !waitingEl) return;

      const otherPlayer = players.find(p => p.playerId !== this.multiplayerClient.currentPlayerId);
      const readyStatusEl = this.overlay.querySelector('#room-ready-status');

      if (otherPlayer) {
        // Room is full
        waitingEl.classList.remove('waiting');
        waitingEl.innerHTML = `
          <span class="player-icon">🏎️</span>
          <div class="player-info">
            <span class="player-name">${otherPlayer.username}</span>
            <span class="player-car-name">${getCarDisplayName(otherPlayer.selectedCar)}</span>
            <span class="player-ready-state" style="font-weight: bold; color: ${otherPlayer.ready ? '#4ade80' : '#f87171'};">${otherPlayer.ready ? 'READY' : 'NOT READY'}</span>
          </div>
          <span class="player-status badge-tag">P2</span>
        `;

        if (localPlayer && localPlayer.ready && otherPlayer.ready) {
          if (readyStatusEl) {
            readyStatusEl.style.display = 'block';
            readyStatusEl.textContent = 'READY — WAITING TO START';
          }
          const btnStartRace = this.overlay.querySelector('#btn-start-multiplayer-race');
          if (btnStartRace) {
            btnStartRace.style.display = 'block';
          }
        } else {
          if (readyStatusEl) readyStatusEl.style.display = 'none';
          const btnStartRace = this.overlay.querySelector('#btn-start-multiplayer-race');
          if (btnStartRace) {
            btnStartRace.style.display = 'none';
          }
        }
      } else {
        // Waiting for player
        waitingEl.classList.add('waiting');
        waitingEl.innerHTML = `
          <span class="player-icon empty">⏳</span>
          <div class="player-info">
            <span class="player-name">WAITING FOR PLAYER...</span>
            <span class="player-car-name"></span>
          </div>
        `;
        if (readyStatusEl) readyStatusEl.style.display = 'none';
        const btnStartRace = this.overlay.querySelector('#btn-start-multiplayer-race');
        if (btnStartRace) {
          btnStartRace.style.display = 'none';
        }
      }
    };

    this.multiplayerClient.onError = (errorType) => {
      const errorMsg = this.overlay.querySelector('#room-code-error');
      const placeholderMsg = this.overlay.querySelector('#join-placeholder-msg');
      const inputField = this.overlay.querySelector('#room-code-input');
      
      if (!errorMsg || !inputField) return;

      if (errorType === 'ROOM_NOT_FOUND') {
        errorMsg.textContent = 'Room not found.';
      } else if (errorType === 'ROOM_FULL') {
        errorMsg.textContent = 'Room is full.';
      } else if (errorType === 'CONNECTION_ERROR') {
        errorMsg.textContent = 'Connection failed. Ensure server is running.';
      } else {
        errorMsg.textContent = errorType;
      }
      
      errorMsg.style.display = 'block';
      if (placeholderMsg) placeholderMsg.style.display = 'none';
      inputField.classList.add('error');
    };

    this.multiplayerClient.onDisconnected = () => {
      // Return to main lobby view on disconnect
      if (this.viewState !== 'main') {
        this.switchView('main');
      }
    };
  }

  buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'multiplayer-lobby-overlay';
    this.overlay.className = 'multiplayer-container';

    this.overlay.innerHTML = `
      <div class="multiplayer-glass-card">
        <!-- Header -->
        <div class="multiplayer-header">
          <div class="header-badge"><span>MULTIPLAYER LOBBY</span></div>
          <h2 class="panel-title">APEX VELOCITY</h2>
          <p class="panel-subtitle" id="lobby-username-display">PLAYER: --</p>
        </div>

        <div class="panel-divider"></div>

        <!-- VIEW 1: Main Lobby Options -->
        <div id="lobby-view-main" class="lobby-view-section">
          <button id="btn-lobby-create" class="panel-btn btn-primary">
            <span class="btn-icon">✨</span>
            <span class="btn-text">CREATE ROOM</span>
            <span class="btn-glow"></span>
          </button>
          
          <button id="btn-lobby-join" class="panel-btn btn-secondary">
            <span class="btn-icon">🔍</span>
            <span class="btn-text">JOIN ROOM</span>
          </button>
        </div>

        <!-- VIEW 2: Create Room (Placeholder) -->
        <div id="lobby-view-create" class="lobby-view-section" style="display: none;">
          <div class="room-code-display-box">
            <span class="room-code-label">ROOM CODE</span>
            <span id="created-room-code" class="room-code-value">------</span>
            <button id="btn-copy-code" class="copy-btn">
              <span class="copy-icon">📋</span> COPY CODE
            </button>
            <div id="copy-confirmation" class="copy-confirmation">COPIED</div>
          </div>
          
          <div class="room-players-list">
            <div class="room-player-item you">
              <span class="player-icon">🏎️</span>
              <div class="player-info">
                <span id="room-you-name" class="player-name">--</span>
                <span id="room-you-car" class="player-car-name">LAMBORGHINI SVJ</span>
              </div>
              <button id="btn-cycle-car" class="cycle-car-btn" title="Change Car">🚗</button>
              <button id="btn-toggle-ready" class="ready-btn not-ready panel-btn btn-secondary" style="margin-right: 10px; padding: 0.2rem 0.5rem; font-size: 0.8rem;">NOT READY</button>
              <span class="player-status badge-tag gold">YOU</span>
            </div>
            <div class="room-player-item waiting">
              <span class="player-icon empty">⏳</span>
              <div class="player-info">
                <span class="player-name">WAITING FOR PLAYER...</span>
                <span class="player-car-name"></span>
              </div>
            </div>
          </div>
          <div id="room-ready-status" class="room-ready-status" style="display: none; text-align: center; margin-top: 1rem; color: #4ade80; font-weight: bold; font-size: 1.2rem; text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);">
            READY — WAITING TO START
          </div>
          <button id="btn-start-multiplayer-race" class="panel-btn btn-primary" style="display: none; width: 100%; margin-top: 1rem;">
            <span class="btn-icon">🏁</span>
            <span class="btn-text">START RACE</span>
            <span class="btn-glow"></span>
          </button>
        </div>

        <!-- VIEW 3: Join Room (Placeholder) -->
        <div id="lobby-view-join" class="lobby-view-section" style="display: none;">
          <div class="username-entry-section">
            <label class="username-label" for="room-code-input">ENTER ROOM CODE</label>
            <div class="input-wrapper">
              <input type="text" id="room-code-input" class="username-input room-code-input" placeholder="e.g. A7K29P" maxlength="6" autocomplete="off" spellcheck="false" style="text-transform: uppercase;">
            </div>
            <div id="room-code-error" class="username-error" style="display: none;">Room code cannot be empty.</div>
            <div id="join-placeholder-msg" class="join-placeholder-msg" style="display: none;">
              Online room connection will be available in the next multiplayer phase.
            </div>
          </div>
          
          <button id="btn-submit-join" class="panel-btn btn-primary" style="margin-top: 1rem;">
            <span class="btn-icon">▶</span>
            <span class="btn-text">JOIN</span>
            <span class="btn-glow"></span>
          </button>
        </div>

        <div class="panel-divider"></div>

        <!-- Footer / Action Buttons -->
        <div class="panel-actions">
          <button id="btn-lobby-back" class="panel-btn btn-secondary">
            <span class="btn-icon">⬅️</span>
            <span class="btn-text">BACK</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.initEvents();
  }

  generateRoomCode() {
    // Deprecated: Handled by server
    return '';
  }

  initEvents() {
    const btnCreate = this.overlay.querySelector('#btn-lobby-create');
    const btnJoin = this.overlay.querySelector('#btn-lobby-join');
    const btnBack = this.overlay.querySelector('#btn-lobby-back');
    const btnSubmitJoin = this.overlay.querySelector('#btn-submit-join');
    const btnCopyCode = this.overlay.querySelector('#btn-copy-code');
    const inputField = this.overlay.querySelector('#room-code-input');
    const errorMsg = this.overlay.querySelector('#room-code-error');
    const placeholderMsg = this.overlay.querySelector('#join-placeholder-msg');
    const btnCycleCar = this.overlay.querySelector('#btn-cycle-car');
    const btnToggleReady = this.overlay.querySelector('#btn-toggle-ready');
    const btnStartRace = this.overlay.querySelector('#btn-start-multiplayer-race');

    // Input Isolation (from Phase 1)
    inputField.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        btnSubmitJoin.click();
      }
    });

    inputField.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    inputField.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

    if (btnCycleCar) {
      btnCycleCar.addEventListener('click', (e) => {
        e.preventDefault();
        const currentIdx = CAR_IDS.indexOf(this.localSelectedCar);
        const nextIdx = (currentIdx + 1) % CAR_IDS.length;
        this.localSelectedCar = CAR_IDS[nextIdx];
        
        const paintId = this.vehicleManager ? this.vehicleManager.getCustomization('player1', this.localSelectedCar).paintId : 'giallo_yellow';
        this.multiplayerClient.updateCar(this.localSelectedCar, paintId);
      });
    }

    if (btnToggleReady) {
      btnToggleReady.addEventListener('click', (e) => {
        e.preventDefault();
        const isReady = btnToggleReady.classList.contains('ready');
        this.multiplayerClient.setReady(!isReady);
      });
    }

    if (btnStartRace) {
      btnStartRace.addEventListener('click', (e) => {
        e.preventDefault();
        this.multiplayerClient.startRace();
      });
    }

    // Main Lobby Options
    if (btnCreate) {
      btnCreate.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Show connecting state temporarily on button
        const originalText = btnCreate.innerHTML;
        btnCreate.innerHTML = `<span class="btn-text">CONNECTING...</span>`;
        btnCreate.disabled = true;

        try {
          const paintId = this.vehicleManager ? this.vehicleManager.getCustomization('player1', this.localSelectedCar).paintId : 'giallo_yellow';
          await this.multiplayerClient.createRoom(this.username, this.localSelectedCar, this.localSelectedTrack, paintId);
        } catch (err) {
          console.error("Connection failed", err);
          // Revert button
          btnCreate.innerHTML = originalText;
          btnCreate.disabled = false;
        }

        // Revert button (if successful, view changes quickly anyway)
        btnCreate.innerHTML = originalText;
        btnCreate.disabled = false;
      });
    }

    if (btnJoin) {
      btnJoin.addEventListener('click', (e) => {
        e.preventDefault();
        inputField.value = '';
        inputField.classList.remove('error');
        errorMsg.style.display = 'none';
        placeholderMsg.style.display = 'none';
        this.switchView('join');
        setTimeout(() => {
          if (inputField) inputField.focus();
        }, 100);
      });
    }

    // Join Submit
    if (btnSubmitJoin) {
      btnSubmitJoin.addEventListener('click', async (e) => {
        e.preventDefault();
        const code = inputField.value.trim().toUpperCase();
        
        if (code.length === 0) {
          errorMsg.textContent = 'Please enter a valid room code.';
          errorMsg.style.display = 'block';
          placeholderMsg.style.display = 'none';
          inputField.classList.add('error');
          return;
        }

        // Clear error, show connecting msg
        errorMsg.style.display = 'none';
        inputField.classList.remove('error');
        placeholderMsg.textContent = 'Connecting...';
        placeholderMsg.style.display = 'block';

        try {
          const paintId = this.vehicleManager ? this.vehicleManager.getCustomization('player1', this.localSelectedCar).paintId : 'giallo_yellow';
          await this.multiplayerClient.joinRoom(code, this.username, this.localSelectedCar, paintId);
        } catch (err) {
          console.error("Connection failed", err);
          errorMsg.textContent = 'Connection failed. Ensure server is running.';
          errorMsg.style.display = 'block';
          placeholderMsg.style.display = 'none';
          inputField.classList.add('error');
        }
      });
    }

    // Copy Code
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(this.currentRoomCode).then(() => {
            const copyConf = this.overlay.querySelector('#copy-confirmation');
            if (copyConf) {
              copyConf.classList.add('show');
              setTimeout(() => {
                copyConf.classList.remove('show');
              }, 2000);
            }
          }).catch(err => {
            console.warn("Clipboard copy failed: ", err);
          });
        }
      });
    }

    // Input validation clearance
    inputField.addEventListener('input', () => {
      errorMsg.style.display = 'none';
      placeholderMsg.style.display = 'none';
      inputField.classList.remove('error');
    });

    // Back Navigation
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.viewState === 'create' || this.viewState === 'join') {
          this.multiplayerClient.disconnect();
          this.switchView('main');
        } else {
          this.hide();
          if (typeof this.onBackToUsernameCallback === 'function') {
            this.onBackToUsernameCallback();
          }
        }
      });
    }

    // Backdrop click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        if (this.viewState === 'create' || this.viewState === 'join') {
          this.multiplayerClient.disconnect();
          this.switchView('main');
        } else {
          this.hide();
          if (typeof this.onBackToUsernameCallback === 'function') {
            this.onBackToUsernameCallback();
          }
        }
      }
    });
  }

  switchView(view) {
    this.viewState = view;
    this.overlay.querySelector('#lobby-view-main').style.display = (view === 'main') ? 'flex' : 'none';
    this.overlay.querySelector('#lobby-view-create').style.display = (view === 'create') ? 'flex' : 'none';
    this.overlay.querySelector('#lobby-view-join').style.display = (view === 'join') ? 'flex' : 'none';
  }

  show(username, selectedCarId, selectedTrackId) {
    if (!this.overlay) return;
    
    if (username) {
      this.username = username;
      this.overlay.querySelector('#lobby-username-display').textContent = `PLAYER: ${this.username}`;
    }

    if (selectedCarId) {
      this.localSelectedCar = selectedCarId;
      const youCarEl = this.overlay.querySelector('#room-you-car');
      if (youCarEl) youCarEl.textContent = getCarDisplayName(this.localSelectedCar);
    }

    if (selectedTrackId) {
      this.localSelectedTrack = selectedTrackId;
    }

    this.switchView('main');

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
