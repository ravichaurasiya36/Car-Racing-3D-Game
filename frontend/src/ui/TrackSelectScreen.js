export const TRACKS_DATA = [
  {
    id: 'forest',
    trackId: 'forest_crest',
    name: 'Forest Crest Circuit',
    type: 'CIRCUIT',
    status: 'AVAILABLE',
    lapsText: '3 LAPS',
    desc: 'Alpine Woodland Circuit • 3.4 KM Loop',
    icon: '🌲',
    accentColor: '#22c55e',
    gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
    borderGlow: '0 0 24px rgba(34, 197, 94, 0.35)'
  },
  {
    id: 'neon',
    trackId: 'city_neon',
    name: 'Neon City Circuit',
    type: 'CIRCUIT',
    status: 'AVAILABLE',
    lapsText: '3 LAPS',
    desc: 'Metropolitan Dusk Circuit • 4.2 KM Loop',
    icon: '🌆',
    accentColor: '#00f0ff',
    gradient: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
    borderGlow: '0 0 24px rgba(0, 240, 255, 0.35)'
  },
  {
    id: 'desert',
    trackId: 'desert_apex',
    name: 'Desert Apex',
    type: 'POINT_TO_POINT',
    status: 'AVAILABLE',
    lapsText: 'POINT TO POINT',
    desc: 'Open Desert Highway • 6.0 KM Route',
    icon: '🏜️',
    accentColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 88, 12, 0.05) 100%)',
    borderGlow: '0 0 24px rgba(245, 158, 11, 0.35)'
  }
];

export class TrackSelectScreen {
  constructor(onSelectTrackCallback, onBackCallback) {
    this.onSelectTrackCallback = onSelectTrackCallback;
    this.onBackCallback = onBackCallback;
    this.selectedTrackId = 'forest'; // Default selected track state
    this.overlay = null;
    this.buildDOM();
  }

  buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'track-select-overlay';
    this.overlay.className = 'track-select-container';

    this.overlay.innerHTML = `
      <div class="track-select-glass-card">
        <!-- Header -->
        <div class="track-select-header">
          <div class="menu-badge"><span>TRACK REGISTRY</span></div>
          <h2 class="track-select-title">SELECT TRACK</h2>
          <p class="track-select-subtitle">CHOOSE YOUR RACING DESTINATION</p>
        </div>

        <!-- Track Cards Grid -->
        <div class="track-cards-grid" id="track-cards-grid">
          ${this.renderCards()}
        </div>

        <!-- Navigation Actions -->
        <div class="track-select-actions">
          <button id="btn-track-back" class="menu-btn btn-primary">
            <span class="btn-icon">⬅</span>
            <span class="btn-text">MAIN MENU</span>
            <span class="btn-glow"></span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.initEventListeners();
  }

  renderCards() {
    return TRACKS_DATA.map(t => {
      const isSelected = t.id === this.selectedTrackId;
      return `
        <div class="track-card ${isSelected ? 'selected' : ''}" data-id="${t.id}" style="--accent-color: ${t.accentColor}; --card-gradient: ${t.gradient}; --card-glow: ${t.borderGlow};">
          <div class="track-card-top">
            <span class="track-card-icon">${t.icon}</span>
            <span class="track-status-tag ${t.status.toLowerCase()}">${t.status}</span>
          </div>

          <div class="track-card-content">
            <h3 class="track-card-name">${t.name}</h3>
            <div class="track-type-badge">${t.type.replace(/_/g, ' ')}</div>
            <p class="track-card-desc">${t.desc}</p>
            <div class="track-card-laps">${t.lapsText}</div>
          </div>

          <div class="track-card-footer">
            <button class="track-select-action-btn ${isSelected ? 'active' : ''}">
              ${isSelected ? '✓ SELECTED' : 'SELECT'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  updateCardsDOM() {
    const grid = this.overlay.querySelector('#track-cards-grid');
    if (grid) {
      grid.innerHTML = this.renderCards();
      this.initCardClickEvents();
    }
  }

  initEventListeners() {
    const backBtn = this.overlay.querySelector('#btn-track-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.hide();
        if (typeof this.onBackCallback === 'function') {
          this.onBackCallback();
        }
      });
    }

    this.initCardClickEvents();
  }

  initCardClickEvents() {
    const cards = this.overlay.querySelectorAll('.track-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (id && id !== this.selectedTrackId) {
          this.selectedTrackId = id;
          this.updateCardsDOM();
          if (typeof this.onSelectTrackCallback === 'function') {
            this.onSelectTrackCallback(this.selectedTrackId);
          }
        }
      });
    });
  }

  show(currentSelectedTrackId = null) {
    if (currentSelectedTrackId) {
      if (currentSelectedTrackId === 'city' || currentSelectedTrackId === 'city_neon') {
        this.selectedTrackId = 'neon';
      } else if (currentSelectedTrackId === 'desert_apex') {
        this.selectedTrackId = 'desert';
      } else {
        this.selectedTrackId = currentSelectedTrackId;
      }
    }
    this.updateCardsDOM();

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
