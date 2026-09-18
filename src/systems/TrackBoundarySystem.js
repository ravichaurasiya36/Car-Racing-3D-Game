import * as THREE from 'three';

export class TrackBoundarySystem {
  constructor(racingTrack) {
    this.racingTrack = racingTrack;
    this.curve = racingTrack.getCenterlineCurve();
    this.roadWidth = racingTrack.getRoadWidth();
    this.carWidthMargin = 1.6; // Car half-width margin

    this.onCollision = null;
    this.lastU = 0; // Monotonic track progress parameter

    // Precompute 600 high-density sample points along curve for 60 FPS closest-point lookup
    this.sampleCount = 600;
    this.samples = [];
    for (let i = 0; i < this.sampleCount; i++) {
      const u = i / this.sampleCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      this.samples.push({ u, point, tangent, index: i });
    }
  }

  resetProgress() {
    this.lastU = 0;
  }

  getOffRoadDrag(carController) {
    if (!carController || !this.racingTrack) return 0;

    // Track Isolation: ONLY execute sand physics on Desert Apex (hasOpenBoundaries + isPointToPoint)
    if (this.racingTrack.hasOpenBoundaries && this.racingTrack.isPointToPoint) {
      const carPos = carController.getPosition();
      const result = this.getClosestPointOnTrack(carPos);
      const roadHalfWidth = 10.0; // 10.0m half-width for 20.0m asphalt highway

      if (result.distance > roadHalfWidth) {
        return 35.0; // Off-road sand deceleration rate (m/s²)
      }
    }
    return 0;
  }

  getClosestPointOnTrack(carPos) {
    let minSqDist = Infinity;
    let bestIndex = 0;

    // Localized search window around last known progress (± 40 samples = ~280 meters)
    const centerIdx = Math.round(this.lastU * this.sampleCount);
    const windowSize = 40;

    for (let offset = -windowSize; offset <= windowSize; offset++) {
      let idx = (centerIdx + offset) % this.sampleCount;
      if (idx < 0) idx += this.sampleCount;

      const p = this.samples[idx].point;
      const dx = carPos.x - p.x;
      const dz = carPos.z - p.z;
      const sqDist = dx * dx + dz * dz;

      if (sqDist < minSqDist) {
        minSqDist = sqDist;
        bestIndex = idx;
      }
    }

    // Fallback global check if car is far away (e.g. initial spawn)
    if (minSqDist > 1600) {
      for (let i = 0; i < this.sampleCount; i++) {
        const p = this.samples[i].point;
        const dx = carPos.x - p.x;
        const dz = carPos.z - p.z;
        const sqDist = dx * dx + dz * dz;

        if (sqDist < minSqDist) {
          minSqDist = sqDist;
          bestIndex = i;
        }
      }
    }

    // Fine local refinement around bestIndex
    let bestU = this.samples[bestIndex].u;
    let bestPoint = this.samples[bestIndex].point;
    let bestTangent = this.samples[bestIndex].tangent;

    const step = 1 / this.sampleCount;
    const searchRange = 4;
    for (let offset = -searchRange; offset <= searchRange; offset++) {
      let u = bestU + (offset * step * 0.15);
      if (u < 0) u += 1;
      if (u > 1) u -= 1;

      const p = this.curve.getPointAt(u);
      const dx = carPos.x - p.x;
      const dz = carPos.z - p.z;
      const sqDist = dx * dx + dz * dz;

      if (sqDist < minSqDist) {
        minSqDist = sqDist;
        bestU = u;
        bestPoint = p;
        bestTangent = this.curve.getTangentAt(u).normalize();
      }
    }

    this.lastU = bestU;

    return {
      point: bestPoint,
      tangent: bestTangent,
      u: bestU,
      distance: Math.sqrt(minSqDist)
    };
  }

  constrain(carController, delta = 0.016) {
    if (!carController) return;

    const carPos = carController.getPosition();
    const result = this.getClosestPointOnTrack(carPos);

    // 1. Direct EXACT height match to the ground-level road surface (point.y + 0.05)
    carPos.y = result.point.y + 0.05;

    // 2. Smooth ground pitch orientation
    carController.mesh.rotation.x = THREE.MathUtils.lerp(carController.mesh.rotation.x, 0, 0.25);

    // Desert Apex Sand / Off-Road Physics
    if (this.racingTrack.hasOpenBoundaries && this.racingTrack.isPointToPoint) {
      const roadHalfWidth = 10.5; // Asphalt road + curb half-width (10.5m)
      if (result.distance > roadHalfWidth) {
        // Car is off-road on Desert Sand! Apply sand drag resistance
        const targetSandSpeed = 90 / 3.6; // ~25.0 m/s = 90 km/h equilibrium top speed on sand
        const sandDragRate = 38.0;        // m/s² drag rate (overcomes 18 m/s² forward accel for ~70 km/h per sec drop)

        if (Math.abs(carController.speed) > targetSandSpeed) {
          const sign = Math.sign(carController.speed);
          const currentAbsSpeed = Math.abs(carController.speed);
          const newAbsSpeed = Math.max(targetSandSpeed, currentAbsSpeed - sandDragRate * delta);
          carController.speed = sign * newAbsSpeed;
        }
      }

      const desertMaxDist = 500.0; // Wide open desert limit (500m from centerline)
      if (result.distance > desertMaxDist) {
        const closest = result.point;
        let dirX = carPos.x - closest.x;
        let dirZ = carPos.z - closest.z;
        const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
        if (len > 0.0001) { dirX /= len; dirZ /= len; } else { dirX = 1; dirZ = 0; }
        carPos.x = closest.x + dirX * desertMaxDist;
        carPos.z = closest.z + dirZ * desertMaxDist;
        carController.speed *= 0.5;
      }
      return;
    }

    const maxAllowedDist = (this.roadWidth / 2) - this.carWidthMargin;

    // 3. Boundary distance constraint (20m road width)
    if (result.distance > maxAllowedDist) {
      const closest = result.point;

      // Trigger collision callback if moving at significant speed
      const speed = Math.abs(carController.speed);
      if (speed > 1.5 && typeof this.onCollision === 'function') {
        const intensity = Math.min(1.0, speed / carController.maxSpeed);
        this.onCollision(intensity);
      }

      // Calculate direction vector from centerline to car
      let dirX = carPos.x - closest.x;
      let dirZ = carPos.z - closest.z;
      const len = Math.sqrt(dirX * dirX + dirZ * dirZ);

      if (len > 0.0001) {
        dirX /= len;
        dirZ /= len;
      } else {
        dirX = 1;
        dirZ = 0;
      }

      // Reposition car back onto boundary limit
      carPos.x = closest.x + dirX * maxAllowedDist;
      carPos.z = closest.z + dirZ * maxAllowedDist;

      // Apply barrier contact friction (dampen vehicle speed)
      carController.speed *= 0.65;
    }
  }
}

