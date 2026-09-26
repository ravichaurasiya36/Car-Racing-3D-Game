import * as THREE from 'three';

export class CarPlaceholder {
  constructor() {
    this.mesh = new THREE.Group();
    this.wheels = [];
    this.frontWheelGroupL = new THREE.Group();
    this.frontWheelGroupR = new THREE.Group();
    this.speed = 0;
    this.maxSpeed = 12;
    this.rotationAngle = 0;

    this.buildCarMesh();
  }

  buildCarMesh() {
    // Car Dimensions
    const bodyLength = 4.2;
    const bodyWidth = 2.0;
    const bodyHeight = 0.9;

    // 1. Lower Chassis (Main Body)
    const bodyGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      roughness: 0.3,
      metalness: 0.8
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.8;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.mesh.add(bodyMesh);

    // 2. Cabin / Glass Canopy
    const cabinGeo = new THREE.BoxGeometry(bodyWidth * 0.75, 0.7, bodyLength * 0.45);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x111625,
      roughness: 0.1,
      metalness: 0.9
    });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, bodyHeight + 0.25, -0.2);
    cabinMesh.castShadow = true;
    this.mesh.add(cabinMesh);

    // 3. Front Hood Accent Stripe
    const stripeGeo = new THREE.BoxGeometry(0.3, 0.02, bodyLength * 0.5);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.5,
      roughness: 0.2
    });
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.set(0, bodyHeight / 2 + 0.81, 0.5);
    this.mesh.add(stripeMesh);

    // 4. Wheels Creation
    const wheelRadius = 0.42;
    const wheelThickness = 0.35;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 24);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.2
    });

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, wheelThickness + 0.02, 12);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.9,
      roughness: 0.2
    });

    // Wheel positions relative to center
    const frontZ = 1.3;
    const rearZ = -1.3;
    const xOffset = bodyWidth / 2 + 0.1;
    const wheelY = wheelRadius;

    // Create 4 Wheels
    const createWheelMesh = () => {
      const group = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      group.add(tire);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      group.add(rim);

      return group;
    };

    // Front Left Wheel (In steering group)
    const flWheel = createWheelMesh();
    this.frontWheelGroupL.position.set(xOffset, wheelY, frontZ);
    this.frontWheelGroupL.add(flWheel);
    this.mesh.add(this.frontWheelGroupL);
    this.wheels.push(flWheel);

    // Front Right Wheel (In steering group)
    const frWheel = createWheelMesh();
    this.frontWheelGroupR.position.set(-xOffset, wheelY, frontZ);
    this.frontWheelGroupR.add(frWheel);
    this.mesh.add(this.frontWheelGroupR);
    this.wheels.push(frWheel);

    // Rear Left Wheel
    const rlWheel = createWheelMesh();
    rlWheel.position.set(xOffset, wheelY, rearZ);
    this.mesh.add(rlWheel);
    this.wheels.push(rlWheel);

    // Rear Right Wheel
    const rrWheel = createWheelMesh();
    rrWheel.position.set(-xOffset, wheelY, rearZ);
    this.mesh.add(rrWheel);
    this.wheels.push(rrWheel);

    // 5. Headlights with forward beam light
    const lightGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const headlightL = new THREE.Mesh(lightGeo, lightMat);
    headlightL.position.set(0.65, 0.75, bodyLength / 2 + 0.01);
    this.mesh.add(headlightL);

    const headlightR = new THREE.Mesh(lightGeo, lightMat);
    headlightR.position.set(-0.65, 0.75, bodyLength / 2 + 0.01);
    this.mesh.add(headlightR);

    // Spotlight beams
    const spotLight = new THREE.SpotLight(0xffffff, 3);
    spotLight.position.set(0, 0.8, bodyLength / 2);
    spotLight.target.position.set(0, 0, bodyLength / 2 + 10);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.4;
    spotLight.distance = 25;
    this.mesh.add(spotLight);
    this.mesh.add(spotLight.target);

    // 6. Taillights
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0033,
      emissiveIntensity: 0.8
    });
    const tailGeo = new THREE.BoxGeometry(0.4, 0.15, 0.05);

    const taillightL = new THREE.Mesh(tailGeo, tailMat);
    taillightL.position.set(0.65, 0.8, -bodyLength / 2 - 0.01);
    this.mesh.add(taillightL);

    const taillightR = new THREE.Mesh(tailGeo, tailMat);
    taillightR.position.set(-0.65, 0.8, -bodyLength / 2 - 0.01);
    this.mesh.add(taillightR);
  }

  setPhysicsState(speed, steerAngle) {
    this.speed = speed;
    this.targetSteer = steerAngle;
  }

  update(delta, elapsedTime) {
    // Wheel spin rotation proportional to vehicle velocity
    const wheelSpinSpeed = (this.speed / 0.42) * delta;
    for (const wheel of this.wheels) {
      wheel.rotation.x += wheelSpinSpeed;
    }

    // Steering wheel angle visualization
    const currentSteer = this.targetSteer || 0;
    this.frontWheelGroupL.rotation.y = THREE.MathUtils.lerp(this.frontWheelGroupL.rotation.y, currentSteer, delta * 12);
    this.frontWheelGroupR.rotation.y = THREE.MathUtils.lerp(this.frontWheelGroupR.rotation.y, currentSteer, delta * 12);

    // Subtle suspension bob / engine vibration when driving
    const vib = Math.abs(this.speed) > 0.5 ? Math.sin(elapsedTime * 25) * 0.015 : Math.sin(elapsedTime * 4) * 0.01;
    this.mesh.position.y = vib;
  }

  getMesh() {
    return this.mesh;
  }
}
