export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    this.activeInputNames = new Set();
    this.keysDisplayElement = document.getElementById('keys-list');

    this.initListeners();
  }

  initListeners() {
    // Keyboard Event Listeners
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));

    // Touch Event Gesture Shielding (Prevent right click / context menu)
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleKey(event, isPressed) {
    const code = event.code;
    let actionMapped = true;

    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.setInputState('forward', isPressed, 'FORWARD');
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.setInputState('backward', isPressed, 'BACKWARD');
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.setInputState('left', isPressed, 'LEFT');
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.setInputState('right', isPressed, 'RIGHT');
        break;
      default:
        actionMapped = false;
        break;
    }

    if (actionMapped && event.cancelable) {
      event.preventDefault();
    }
  }

  setInputState(action, isPressed, labelName) {
    if (this.keys.hasOwnProperty(action)) {
      this.keys[action] = isPressed;

      const name = labelName || action.toUpperCase();
      if (isPressed) {
        this.activeInputNames.add(name);
      } else {
        this.activeInputNames.delete(name);
      }

      this.updateHUD();
    }
  }

  updateHUD() {
    if (!this.keysDisplayElement) return;

    if (this.activeInputNames.size === 0) {
      this.keysDisplayElement.textContent = 'None';
      this.keysDisplayElement.className = 'none';
    } else {
      this.keysDisplayElement.textContent = Array.from(this.activeInputNames).join(', ');
      this.keysDisplayElement.className = 'active';
    }
  }

  getState() {
    return { ...this.keys };
  }
}
