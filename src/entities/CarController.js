import * as THREE from 'three';

export class CarController {
  constructor(carEntity) {
    this.carEntity = carEntity;
    this.mesh = carEntity.getMesh();

    // Vehicle Physics Config
    this.speed = 0;
    this.maxSpeed = 200 / 3.6;     // Max forward speed (exactly 200 km/h)
    this.maxReverseSpeed = -9.0;   // Max reverse speed (~32 km/h)
    this.acceleration = 18.0;      // Forward acceleration rate (m/s²)
    this.deceleration = 8.0;       // Coasting drag deceleration rate (m/s²)
    this.braking = 26.0;           // Active brake deceleration rate (m/s²)
    
    // Steering Config
    this.heading = 0;              // World yaw angle in radians
    this.steerAngle = 0;           // Current wheel steer visual angle
    this.maxSteerAngle = 0.45;     // Max wheel turn angle in radians (~25 deg)
    this.steeringSensitivity = 2.4;// Turn rate factor
  }

  update(delta, inputState, offRoadDrag = 0, maxSpeedOverride = null) {
    if (!this.mesh) return;

    const { forward, backward, left, right } = inputState;
    const effectiveAsphaltMaxSpeed = maxSpeedOverride !== null ? maxSpeedOverride : this.maxSpeed;
    const targetMaxSpeed = offRoadDrag > 0 ? (90 / 3.6) : effectiveAsphaltMaxSpeed;

    // 1. Acceleration, Deceleration & Braking Logic
    if (forward) {
      if (this.speed < 0) {
        // Active braking while reversing
        this.speed += this.braking * delta;
        if (this.speed > 0) this.speed = 0;
      } else {
        // Moving forward
        if (offRoadDrag > 0 && this.speed > targetMaxSpeed) {
          // Off-road sand drag decelerates car down to 90 km/h
          this.speed -= offRoadDrag * delta;
          if (this.speed < targetMaxSpeed) this.speed = targetMaxSpeed;
        } else {
          // Accelerating forward
          this.speed += this.acceleration * delta;
          if (this.speed > targetMaxSpeed) this.speed = targetMaxSpeed;
        }
      }
    } else if (backward) {
      if (this.speed > 0) {
        // Active braking while moving forward
        this.speed -= (this.braking + (offRoadDrag > 0 ? offRoadDrag * 0.5 : 0)) * delta;
        if (this.speed < 0) this.speed = 0;
      } else {
        // Reversing
        this.speed -= (this.acceleration * 0.6) * delta;
        const maxRev = offRoadDrag > 0 ? -6.0 : this.maxReverseSpeed;
        if (this.speed < maxRev) this.speed = maxRev;
      }
    } else {
      // Coasting / Natural Drag Deceleration
      if (offRoadDrag > 0 && this.speed > targetMaxSpeed) {
        this.speed -= offRoadDrag * delta;
        if (this.speed < targetMaxSpeed) this.speed = targetMaxSpeed;
      } else if (this.speed > 0) {
        const dragRate = offRoadDrag > 0 ? offRoadDrag : this.deceleration;
        this.speed -= dragRate * delta;
        if (this.speed < 0) this.speed = 0;
      } else if (this.speed < 0) {
        this.speed += this.deceleration * delta;
        if (this.speed > 0) this.speed = 0;
      }
    }

    // 2. Speed-Dependent Steering Logic
    const speedRatio = Math.abs(this.speed) / effectiveAsphaltMaxSpeed;
    let targetSteer = 0;

    if (left) targetSteer = this.maxSteerAngle;
    else if (right) targetSteer = -this.maxSteerAngle;

    // Smoothly return or turn wheels
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, delta * 12);

    // Apply rotation only when moving (steering effectiveness scales with velocity)
    if (Math.abs(this.speed) > 0.1) {
      // Turn factor scales with speed to avoid spinning in place
      const turnFactor = Math.min(1.0, speedRatio * 1.5 + 0.2);
      // Invert turning direction when moving in reverse
      const reverseDir = this.speed >= 0 ? 1 : -1;
      
      this.heading += targetSteer * this.steeringSensitivity * turnFactor * reverseDir * delta;
    }

    // 3. Apply Heading Rotation to Car Mesh
    this.mesh.rotation.y = this.heading;

    // 4. Calculate Vector Velocity & Translate Position
    const vx = Math.sin(this.heading) * this.speed;
    const vz = Math.cos(this.heading) * this.speed;

    this.mesh.position.x += vx * delta;
    this.mesh.position.z += vz * delta;

    // 5. Update Car Entity Visual Effects (wheels, headlights, brake lights)
    const isBraking = (this.speed > 0.5 && backward) || (this.speed < -0.5 && forward);
    if (this.carEntity && typeof this.carEntity.setPhysicsState === 'function') {
      this.carEntity.setPhysicsState(this.speed, this.steerAngle, isBraking);
    }
  }

  setPosition(x, y, z) {
    if (this.mesh) {
      this.mesh.position.set(x, y, z);
    }
  }

  setHeading(headingAngle) {
    this.heading = headingAngle;
    if (this.mesh) {
      this.mesh.rotation.y = headingAngle;
    }
  }

  getSpeedKmH() {
    return Math.round(Math.abs(this.speed) * 3.6);
  }

  getHeading() {
    return this.heading;
  }

  getPosition() {
    return this.mesh.position;
  }
}
