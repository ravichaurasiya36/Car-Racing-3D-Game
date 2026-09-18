export class TouchControls {
  constructor(inputManager) {
    this.inputManager = inputManager;
    this.container = document.getElementById('touch-controls-container');

    if (!this.container) {
      this.createTouchUI();
    } else {
      this.attachListeners();
    }
  }

  createTouchUI() {
    const hud = document.getElementById('hud-container');
    if (!hud) return;

    this.container = document.createElement('div');
    this.container.id = 'touch-controls-container';
    this.container.className = 'touch-controls-overlay';

    this.container.innerHTML = `
      <div class="touch-cluster steer-cluster">
        <button class="touch-btn btn-left" data-action="left" aria-label="Steer Left">
          <span class="btn-icon">◄</span>
        </button>
        <button class="touch-btn btn-right" data-action="right" aria-label="Steer Right">
          <span class="btn-icon">►</span>
        </button>
      </div>
      <div class="touch-cluster accel-cluster">
        <button class="touch-btn btn-up" data-action="forward" aria-label="Accelerate">
          <span class="btn-icon">▲</span>
          <span class="btn-label">ACCEL</span>
        </button>
        <button class="touch-btn btn-down" data-action="backward" aria-label="Brake or Reverse">
          <span class="btn-icon">▼</span>
          <span class="btn-label">BRAKE</span>
        </button>
      </div>
    `;

    hud.appendChild(this.container);
    this.attachListeners();
  }

  attachListeners() {
    if (!this.container) return;

    const buttons = this.container.querySelectorAll('.touch-btn');

    buttons.forEach((btn) => {
      const action = btn.getAttribute('data-action');
      if (!action) return;

      const activePointers = new Set();

      const setPressedState = (isPressed) => {
        if (isPressed) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
        this.inputManager.setInputState(action, isPressed);
      };

      // Pointer Event Handlers supporting multi-touch & press-and-hold
      btn.addEventListener('pointerdown', (e) => {
        if (e.cancelable) e.preventDefault();
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (err) {}
        activePointers.add(e.pointerId);
        setPressedState(true);
      });

      const releasePointer = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e) {
          activePointers.delete(e.pointerId);
          try {
            if (btn.hasPointerCapture && btn.hasPointerCapture(e.pointerId)) {
              btn.releasePointerCapture(e.pointerId);
            }
          } catch (err) {}
        } else {
          activePointers.clear();
        }
        if (activePointers.size === 0) {
          setPressedState(false);
        }
      };

      btn.addEventListener('pointerup', releasePointer);
      btn.addEventListener('pointercancel', releasePointer);

      // Fallback when pointer leaves element without pointer capture
      btn.addEventListener('pointerleave', (e) => {
        if (!btn.hasPointerCapture || !btn.hasPointerCapture(e.pointerId)) {
          releasePointer(e);
        }
      });

      // Prevent native context menu on long touch press
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }
}

