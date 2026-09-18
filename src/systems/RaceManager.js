import * as THREE from 'three';

export const RaceState = {
  MENU: 'MENU',
  GARAGE: 'GARAGE',
  START_SCREEN: 'START_SCREEN',
  COUNTDOWN: 'COUNTDOWN',
  RACING: 'RACING',
  FINISHED: 'FINISHED'
};

export class RaceManager {
  constructor(racingTrack) {
    this.racingTrack = racingTrack;
    this.curve = racingTrack.getCenterlineCurve();

    this.state = RaceState.MENU;
    this.totalLaps = (racingTrack && racingTrack.isPointToPoint) ? 1 : 3;

    // Event Callback Hooks
    this.onCountdownTick = null;
    this.onLapComplete = null;
    this.onRaceFinish = null;

    // Race Progress & Lap Tracking
    this.completedLaps = 0;
    this.currentLap = 0;
    this.hasReachedMidpoint = false;
    this.hasReachedFarSector = false;
    this.lapCooldown = 0;

    // Timers & Performance Tracking
    this.countdownTimer = 0;
    this.countdownText = '3';
    this.prevCountdownText = '';
    
    this.startTime = 0;
    this.totalTime = 0;
    this.lapStartTime = 0;
    this.currentLapTime = 0;
    this.bestLapTime = null;
    this.lapTimes = [];

    // Wrong-Way Detection
    this.wrongWayTimer = 0;
    this.isWrongWay = false;
  }

  showMenu() {
    this.state = RaceState.MENU;
  }

  showGarage() {
    this.state = RaceState.GARAGE;
  }

  showStartScreen() {
    this.state = RaceState.START_SCREEN;
  }

  startCountdown() {
    this.state = RaceState.COUNTDOWN;
    this.countdownTimer = 0;
    this.countdownText = '3';
    this.prevCountdownText = '';

    this.totalLaps = (this.racingTrack && this.racingTrack.isPointToPoint) ? 1 : 3;
    this.completedLaps = 0;
    this.currentLap = 0;
    this.hasReachedMidpoint = false;
    this.hasReachedFarSector = false;
    this.lapCooldown = 3.0; // Enforce 3s cooldown at start to prevent spawn crossing

    this.totalTime = 0;
    this.currentLapTime = 0;
    this.bestLapTime = null;
    this.lapTimes = [];

    this.wrongWayTimer = 0;
    this.isWrongWay = false;
  }

  update(delta, carController) {
    if (!carController) return;

    // 0. MENU, GARAGE OR START SCREEN STATE (No race timers or movement processing)
    if (this.state === RaceState.MENU || this.state === RaceState.GARAGE || this.state === RaceState.START_SCREEN) {
      return;
    }

    // 1. COUNTDOWN STATE
    if (this.state === RaceState.COUNTDOWN) {
      this.countdownTimer += delta;

      if (this.countdownTimer < 1.0) {
        this.countdownText = '3';
      } else if (this.countdownTimer < 2.0) {
        this.countdownText = '2';
      } else if (this.countdownTimer < 3.0) {
        this.countdownText = '1';
      } else if (this.countdownTimer < 3.8) {
        this.countdownText = 'GO!';
      } else {
        // Transition to RACING
        this.state = RaceState.RACING;
        this.countdownText = '';
        this.startTime = performance.now();
        this.lapStartTime = this.startTime;
        this.hasReachedMidpoint = false;
        this.hasReachedFarSector = false;
        this.lapCooldown = 3.0;
      }

      // Check for countdown step change to trigger audio callback
      if (this.countdownText !== this.prevCountdownText) {
        this.prevCountdownText = this.countdownText;
        if (this.countdownText && typeof this.onCountdownTick === 'function') {
          this.onCountdownTick(this.countdownText);
        }
      }
      return;
    }

    // 2. RACING STATE
    if (this.state === RaceState.RACING) {
      const now = performance.now();
      this.totalTime = (now - this.startTime) / 1000;
      this.currentLapTime = (now - this.lapStartTime) / 1000;

      if (this.lapCooldown > 0) {
        this.lapCooldown -= delta;
      }

      // Query current track progress parameter u (0.0 to 1.0)
      const carPos = carController.getPosition();
      const u = this.getTrackProgress(carPos);

      // Point-to-Point Track Logic (Desert Apex: 1 Stage from Start u=0.0 to Finish u=1.0)
      if (this.racingTrack && this.racingTrack.isPointToPoint) {
        this.totalLaps = 1;
        this.currentLap = 1;

        if (this.lapCooldown <= 0 && u >= 0.90) {
          const finishPoint = this.curve.getPointAt(1.0);
          const finishTangent = this.curve.getTangentAt(1.0).normalize();

          // Vector from Finish Line plane to car position
          const dx = carPos.x - finishPoint.x;
          const dz = carPos.z - finishPoint.z;

          // Signed distance along finish tangent vector (positive = crossed plane, negative = before plane)
          const distAlongTangent = dx * finishTangent.x + dz * finishTangent.z;

          // Lateral distance perpendicular to finish line
          const rightX = -finishTangent.z;
          const rightZ = finishTangent.x;
          const lateralDist = Math.abs(dx * rightX + dz * rightZ);

          const roadWidth = this.racingTrack.getRoadWidth ? this.racingTrack.getRoadWidth() : 20.0;
          const maxLateral = (roadWidth / 2) + 8.0;

          // Vehicle heading direction check
          const heading = carController.getHeading();
          const carDirX = Math.sin(heading);
          const carDirZ = Math.cos(heading);
          const dot = carDirX * finishTangent.x + carDirZ * finishTangent.z;

          // Trigger ONLY when car physically reaches/crosses the finish plane (distAlongTangent >= 0.0m)
          if (distAlongTangent >= 0.0 && distAlongTangent <= 20.0 && lateralDist <= maxLateral && dot > 0.1) {
            this.completedLaps = 1;
            this.lapTimes = [this.totalTime];
            this.bestLapTime = this.totalTime;
            this.finishRace(now);
            return;
          }
        }
        return;
      }

      // Track Mandatory Circuit Progress Milestones
      if (u >= 0.35 && u <= 0.65) {
        this.hasReachedMidpoint = true;
      }
      if (u >= 0.70 && u <= 0.95) {
        this.hasReachedFarSector = true;
      }

      // Check Start/Finish Line Crossing Condition
      if (this.hasReachedMidpoint && this.hasReachedFarSector && u < 0.12 && this.lapCooldown <= 0) {
        const tangent = this.curve.getTangentAt(u).normalize();
        const heading = carController.getHeading();
        const carDirX = Math.sin(heading);
        const carDirZ = Math.cos(heading);

        const dot = carDirX * tangent.x + carDirZ * tangent.z;

        if (dot > 0.1) {
          // Completed Lap!
          this.completedLaps++;
          this.lapTimes.push(this.currentLapTime);

          if (this.bestLapTime === null || this.currentLapTime < this.bestLapTime) {
            this.bestLapTime = this.currentLapTime;
          }

          if (this.completedLaps >= this.totalLaps) {
            // Immediately Finish Race on 3rd Lap Crossing!
            this.finishRace(now);
            return;
          } else {
            // Advance to Next Lap
            this.currentLap = this.completedLaps;
            this.lapStartTime = now;
            this.currentLapTime = 0;
            this.hasReachedMidpoint = false;
            this.hasReachedFarSector = false;
            this.lapCooldown = 3.0; // Prevent double trigger

            if (typeof this.onLapComplete === 'function') {
              this.onLapComplete(this.completedLaps);
            }
          }
        }
      }

      // Wrong-Way Detection
      const tangent = this.curve.getTangentAt(u).normalize();
      const heading = carController.getHeading();
      const carDirX = Math.sin(heading);
      const carDirZ = Math.cos(heading);
      const dot = carDirX * tangent.x + carDirZ * tangent.z;

      if (dot < -0.35 && Math.abs(carController.speed) > 1.2) {
        this.wrongWayTimer += delta;
        if (this.wrongWayTimer > 0.8) {
          this.isWrongWay = true;
        }
      } else {
        this.wrongWayTimer = 0;
        this.isWrongWay = false;
      }
    }
  }

  finishRace(now) {
    this.state = RaceState.FINISHED;
    this.totalTime = (now - this.startTime) / 1000;
    this.currentLap = this.totalLaps;
    this.isWrongWay = false;

    if (typeof this.onRaceFinish === 'function') {
      this.onRaceFinish();
    }
  }

  getTrackProgress(carPos) {
    // Fast closest point parameter lookup along curve
    let minSqDist = Infinity;
    let bestU = 0;

    const samples = 120;
    for (let i = 0; i < samples; i++) {
      const u = i / samples;
      const p = this.curve.getPointAt(u);
      const dx = carPos.x - p.x;
      const dz = carPos.z - p.z;
      const sqDist = dx * dx + dz * dz;

      if (sqDist < minSqDist) {
        minSqDist = sqDist;
        bestU = u;
      }
    }

    return bestU;
  }

  restart(carController) {
    // 1. Reset car position & heading to Start/Finish line
    const startPos = this.curve.getPointAt(0);
    const startTangent = this.curve.getTangentAt(0).normalize();
    const initialHeading = Math.atan2(startTangent.x, startTangent.z);

    carController.setPosition(startPos.x, 0.05, startPos.z);
    carController.setHeading(initialHeading);
    carController.speed = 0;

    // 2. Restart Race State & Countdown
    this.startCountdown();
  }

  formatTime(seconds) {
    if (seconds === null || seconds === undefined) return '--:--.---';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const mmStr = String(mins).padStart(2, '0');
    const ssStr = String(secs).padStart(2, '0');
    const msStr = String(ms).padStart(3, '0');

    return `${mmStr}:${ssStr}.${msStr}`;
  }
}
