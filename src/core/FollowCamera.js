import * as THREE from 'three';

export class FollowCamera {
  constructor(camera, targetMesh) {
    this.camera = camera;
    this.targetMesh = targetMesh;

    // Follow Camera Parameters
    this.distance = 8.5;       // Distance behind the car
    this.height = 4.0;         // Height above the car
    this.lookAtHeight = 1.2;   // Look at target height
    this.smoothSpeed = 8.0;    // Interpolation dampening speed

    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    // Dynamic FOV & Camera Shake Parameters
    this.baseFov = 60;
    this.maxFov = 70;
    this.shakeIntensity = 0;
    this.shakeOffset = new THREE.Vector3();

    // Initialize camera position behind target
    if (this.targetMesh) {
      const pos = this.targetMesh.position;
      const rotY = this.targetMesh.rotation.y;
      this.currentPosition.set(
        pos.x - Math.sin(rotY) * this.distance,
        pos.y + this.height,
        pos.z - Math.cos(rotY) * this.distance
      );
      this.currentLookAt.set(pos.x, pos.y + this.lookAtHeight, pos.z);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentLookAt);
    }
  }

  triggerShake(intensity = 0.35) {
    // Clamp shake intensity to keep it subtle and comfortable
    this.shakeIntensity = Math.min(0.6, Math.max(this.shakeIntensity, intensity));
  }

  update(delta, heading, speedKmH = 0, isMenuMode = false, isStartScreenMode = false, isGarageMode = false) {
    if (!this.targetMesh) return;

    const targetPos = this.targetMesh.position;

    if (isGarageMode) {
      if (this.garageAngle === undefined) this.garageAngle = 0;
      this.garageAngle += delta * 0.35; // Slow cinematic orbit around supercar

      const radius = 6.2;
      const height = 1.6;
      const idealX = targetPos.x + Math.sin(this.garageAngle) * radius;
      const idealY = targetPos.y + height;
      const idealZ = targetPos.z + Math.cos(this.garageAngle) * radius;

      const idealLookX = targetPos.x;
      const idealLookY = targetPos.y + 0.85;
      const idealLookZ = targetPos.z;

      const lerpFactor = 1 - Math.exp(-4.0 * delta);
      this.currentPosition.x += (idealX - this.currentPosition.x) * lerpFactor;
      this.currentPosition.y += (idealY - this.currentPosition.y) * lerpFactor;
      this.currentPosition.z += (idealZ - this.currentPosition.z) * lerpFactor;

      this.currentLookAt.x += (idealLookX - this.currentLookAt.x) * lerpFactor;
      this.currentLookAt.y += (idealLookY - this.currentLookAt.y) * lerpFactor;
      this.currentLookAt.z += (idealLookZ - this.currentLookAt.z) * lerpFactor;

      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    if (isMenuMode || isStartScreenMode) {
      // Sleek Showcase Camera Framing the Yellow Supercar
      const menuAngle = isStartScreenMode ? heading + 0.45 : heading + 0.65;
      const camDist = isStartScreenMode ? 5.8 : 6.5;
      const camHeight = isStartScreenMode ? 1.5 : 1.8;
      const idealX = targetPos.x + Math.sin(menuAngle) * camDist;
      const idealY = targetPos.y + camHeight;
      const idealZ = targetPos.z + Math.cos(menuAngle) * camDist;

      const idealLookX = targetPos.x;
      const idealLookY = targetPos.y + 0.85;
      const idealLookZ = targetPos.z;

      const lerpFactor = 1 - Math.exp(-4.0 * delta);
      this.currentPosition.x += (idealX - this.currentPosition.x) * lerpFactor;
      this.currentPosition.y += (idealY - this.currentPosition.y) * lerpFactor;
      this.currentPosition.z += (idealZ - this.currentPosition.z) * lerpFactor;

      this.currentLookAt.x += (idealLookX - this.currentLookAt.x) * lerpFactor;
      this.currentLookAt.y += (idealLookY - this.currentLookAt.y) * lerpFactor;
      this.currentLookAt.z += (idealLookZ - this.currentLookAt.z) * lerpFactor;

      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    // Calculate ideal camera position behind the car based on heading
    const idealX = targetPos.x - Math.sin(heading) * this.distance;
    const idealY = targetPos.y + this.height;
    const idealZ = targetPos.z - Math.cos(heading) * this.distance;

    // Calculate ideal camera lookAt target slightly ahead of the car
    const idealLookX = targetPos.x + Math.sin(heading) * 2.0;
    const idealLookY = targetPos.y + this.lookAtHeight;
    const idealLookZ = targetPos.z + Math.cos(heading) * 2.0;

    // Smooth Framerate-Independent Lerp
    const lerpFactor = 1 - Math.exp(-this.smoothSpeed * delta);

    this.currentPosition.set(idealX, idealY, idealZ);

    this.currentLookAt.x += (idealLookX - this.currentLookAt.x) * lerpFactor;
    this.currentLookAt.y += (idealLookY - this.currentLookAt.y) * lerpFactor;
    this.currentLookAt.z += (idealLookZ - this.currentLookAt.z) * lerpFactor;

    // 1. Dynamic Speed FOV Scaling (Base 60° -> Max 70° at 200 KM/H)
    const speedRatio = Math.min(1.0, Math.max(0, speedKmH) / 200);
    const targetFov = this.baseFov + speedRatio * (this.maxFov - this.baseFov);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 4);
    this.camera.updateProjectionMatrix();

    // 2. Camera Shake Decay & Position Offset
    if (this.shakeIntensity > 0.005) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, 0, delta * 12);
    } else {
      this.shakeOffset.set(0, 0, 0);
      this.shakeIntensity = 0;
    }

    const finalCamPos = this.currentPosition.clone().add(this.shakeOffset);
    this.camera.position.copy(finalCamPos);
    this.camera.lookAt(this.currentLookAt);
  }
}

