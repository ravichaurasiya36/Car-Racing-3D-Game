export class LeaderboardManager {
  constructor() {
    this.storageKey = 'apex_velocity_leaderboard_v1';
    this.data = this.loadData();
    this.maxEntriesPerTrack = 10;
  }

  loadData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not load leaderboard from localStorage:', e);
    }
    return {};
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('⚠️ Could not save leaderboard to localStorage:', e);
    }
  }

  getEntries(trackId = 'forest_crest') {
    const list = this.data[trackId];
    if (!Array.isArray(list)) {
      return [];
    }
    return [...list];
  }

  addEntry(entry) {
    if (!entry || typeof entry.totalTime !== 'number' || entry.totalTime <= 0) {
      return { isTop10: false, rank: -1 };
    }

    const trackId = entry.trackId || 'forest_crest';
    const list = this.getEntries(trackId);

    const newEntry = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      playerId: entry.playerId || 'player1',
      playerName: entry.playerName || 'RAVI',
      trackId: trackId,
      trackName: entry.trackName || 'Forest Crest Circuit',
      vehicleId: entry.vehicleId || 'lamborghini_aventador',
      vehicleName: entry.vehicleName || 'Lamborghini Aventador SVJ',
      paintId: entry.paintId || 'factory_finish',
      paintName: entry.paintName || 'Factory Finish',
      totalTime: entry.totalTime,
      bestLap: entry.bestLap || null,
      finishPosition: entry.finishPosition || 1,
      timestamp: entry.timestamp || Date.now()
    };

    list.push(newEntry);

    // Primary sort: totalTime ascending (fastest total time = Rank 1)
    // Secondary sort: bestLap ascending
    list.sort((a, b) => {
      if (a.totalTime !== b.totalTime) {
        return a.totalTime - b.totalTime;
      }
      const lapA = (typeof a.bestLap === 'number' && a.bestLap > 0) ? a.bestLap : Infinity;
      const lapB = (typeof b.bestLap === 'number' && b.bestLap > 0) ? b.bestLap : Infinity;
      return lapA - lapB;
    });

    // Determine rank of newly added entry
    const rankIndex = list.findIndex(item => item.id === newEntry.id);
    const rank = rankIndex !== -1 ? rankIndex + 1 : -1;
    const isTop10 = rank >= 1 && rank <= this.maxEntriesPerTrack;

    // Prune entries outside Top 10 per track
    this.data[trackId] = list.slice(0, this.maxEntriesPerTrack);
    this.saveData();

    return {
      isTop10,
      rank,
      entries: this.data[trackId]
    };
  }

  formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds <= 0) {
      return '--:--.---';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  clearLeaderboard(trackId = null) {
    if (trackId) {
      delete this.data[trackId];
    } else {
      this.data = {};
    }
    this.saveData();
  }
}
