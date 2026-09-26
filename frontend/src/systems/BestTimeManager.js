export class BestTimeManager {
  constructor() {
    this.storageKey = 'apex_velocity_best_times_v1';
    this.data = this.loadData();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('⚠️ Could not access localStorage for best times:', e);
    }
    return {};
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('⚠️ Could not save best times to localStorage:', e);
    }
  }

  getRecordKey(playerSlot = 'player1', trackId = 'forest_crest') {
    return `${playerSlot}_${trackId}`;
  }

  getRecord(playerSlot = 'player1', trackId = 'forest_crest') {
    const key = this.getRecordKey(playerSlot, trackId);
    const stored = this.data[key];

    return {
      playerSlot,
      trackId,
      bestTotalTime: stored?.bestTotalTime ?? null,
      bestLapTime: stored?.bestLapTime ?? null,
      completedRaces: stored?.completedRaces ?? 0,
      bestVehicle: stored?.bestVehicle ?? stored?.bestVehicleName ?? null,
      bestVehicleId: stored?.bestVehicleId ?? null,
      bestVehicleName: stored?.bestVehicleName ?? null,
      bestPaint: stored?.bestPaint ?? stored?.bestPaintName ?? null,
      bestPaintId: stored?.bestPaintId ?? null,
      bestPaintName: stored?.bestPaintName ?? null,
      timestamp: stored?.timestamp ?? stored?.lastUpdated ?? null,
      lastUpdated: stored?.lastUpdated ?? stored?.timestamp ?? null
    };
  }

  processResult(result) {
    const playerSlot = result.playerSlot || 'player1';
    const trackId = result.trackId || 'forest_crest';
    const key = this.getRecordKey(playerSlot, trackId);

    const currentRecord = this.getRecord(playerSlot, trackId);
    let isNewTotalBest = false;
    let isNewLapBest = false;

    // Evaluate Total Race Time (Faster time replaces old best)
    if (typeof result.totalTime === 'number' && result.totalTime > 0) {
      if (currentRecord.bestTotalTime === null || result.totalTime < currentRecord.bestTotalTime) {
        isNewTotalBest = true;
        currentRecord.bestTotalTime = result.totalTime;
        currentRecord.bestVehicle = result.vehicleName || result.vehicleId || null;
        currentRecord.bestVehicleId = result.vehicleId || null;
        currentRecord.bestVehicleName = result.vehicleName || null;
        currentRecord.bestPaint = result.paintName || result.paintId || null;
        currentRecord.bestPaintId = result.paintId || null;
        currentRecord.bestPaintName = result.paintName || null;
      }
    }

    // Evaluate Best Lap Time (Faster lap replaces old best lap)
    if (typeof result.bestLap === 'number' && result.bestLap > 0) {
      if (currentRecord.bestLapTime === null || result.bestLap < currentRecord.bestLapTime) {
        isNewLapBest = true;
        currentRecord.bestLapTime = result.bestLap;
      }
    }

    // Increment completed races count exactly once per finished race
    currentRecord.completedRaces = (currentRecord.completedRaces || 0) + 1;

    const now = result.timestamp || Date.now();
    currentRecord.timestamp = now;
    currentRecord.lastUpdated = now;

    this.data[key] = currentRecord;
    this.saveData();

    return {
      isNewTotalBest,
      isNewLapBest,
      isAnyBest: isNewTotalBest || isNewLapBest,
      record: currentRecord
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

  clearRecords() {
    this.data = {};
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('⚠️ Could not clear localStorage:', e);
    }
  }
}
