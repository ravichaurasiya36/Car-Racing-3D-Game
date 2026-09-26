export class MultiplayerUsernameScreen {
  constructor(onContinueCallback, onBackCallback) {
    this.onContinueCallback = onContinueCallback;
    this.onBackCallback = onBackCallback;
    this.overlay = null;
    this.buildDOM();
  }

  buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'multiplayer-username-overlay';
    this.overlay.className = 'multiplayer-container';

    this.overlay.innerHTML = `
      <div class="multiplayer-glass-card">
        <!-- Header -->
        <div class="multiplayer-header">
          <div class="header-badge"><span>MULTIPLAYER ENTRY</span></div>
          <h2 class="panel-title">MULTIPLAYER</h2>
        </div>

        <div class="panel-divider"></div>

        <!-- Username Input Section -->
        <div class="username-entry-section">
          <label class="username-label" for="multiplayer-username-input">ENTER YOUR NAME</label>
          <div class="input-wrapper">
            <input type="text" id="multiplayer-username-input" class="username-input" placeholder="e.g. RACER_X" maxlength="16" autocomplete="off" spellcheck="false">
          </div>
          <div id="username-error" class="username-error" style="display: none;">Username cannot be empty.</div>
        </div>

        <div class="panel-divider"></div>

        <!-- Footer / Action Buttons -->
        <div class="panel-actions multiplayer-actions">
          <button id="btn-multiplayer-continue" class="panel-btn btn-primary btn-multiplayer-continue">
            <span class="btn-text">CONTINUE</span>
            <span class="btn-icon">▶</span>
            <span class="btn-glow"></span>
          </button>
          <button id="btn-multiplayer-back" class="panel-btn btn-secondary btn-multiplayer-back">
            <span class="btn-icon">⬅️</span>
            <span class="btn-text">BACK</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.initEvents();
  }

  initEvents() {
    const continueBtn = this.overlay.querySelector('#btn-multiplayer-continue');
    const backBtn = this.overlay.querySelector('#btn-multiplayer-back');
    const inputField = this.overlay.querySelector('#multiplayer-username-input');
    const errorMsg = this.overlay.querySelector('#username-error');

    // Isolate input events from global game controls (InputManager)
    inputField.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        continueBtn.click();
      }
    });

    inputField.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    // Filter input to remove spaces or handle ENTER key if needed
    inputField.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

    if (continueBtn) {
      continueBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const username = inputField.value.trim();
        
        if (username.length === 0) {
          errorMsg.textContent = 'Please enter a valid display name.';
          errorMsg.style.display = 'block';
          inputField.classList.add('error');
          return;
        }

        // Clear errors
        errorMsg.style.display = 'none';
        inputField.classList.remove('error');

        // Execute callback with validated username
        if (typeof this.onContinueCallback === 'function') {
          this.onContinueCallback(username);
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
        if (typeof this.onBackCallback === 'function') {
          this.onBackCallback();
        }
      });
    }

    // Clear error on input
    inputField.addEventListener('input', () => {
      errorMsg.style.display = 'none';
      inputField.classList.remove('error');
    });

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

  show() {
    if (!this.overlay) return;
    
    // Clear field on show
    const inputField = this.overlay.querySelector('#multiplayer-username-input');
    const errorMsg = this.overlay.querySelector('#username-error');
    if (inputField) {
      inputField.value = '';
      inputField.classList.remove('error');
    }
    if (errorMsg) {
      errorMsg.style.display = 'none';
    }

    this.overlay.style.display = 'flex';
    void this.overlay.offsetWidth;
    this.overlay.classList.add('active');

    // Auto-focus input after transition
    setTimeout(() => {
      if (inputField) inputField.focus();
    }, 350);
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.overlay.style.display = 'none';
    }
  }
}
