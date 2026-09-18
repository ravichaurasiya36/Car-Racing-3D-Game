import * as THREE from 'three';

export class GarageShowroom {
  constructor(position = new THREE.Vector3(500, 0, 500)) {
    this.position = position;
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.buildShowroomEnvironment();
    this.buildLighting();
  }

  buildShowroomEnvironment() {
    // 1. Polished Mirror Showroom Floor Platform
    const floorGeo = new THREE.CircleGeometry(24, 64);
    floorGeo.rotateX(-Math.PI / 2);

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f18,
      roughness: 0.12,
      metalness: 0.88,
      envMapIntensity: 2.2
    });

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // Subtle Gold Center Stage Accent Ring
    const ringGeo = new THREE.RingGeometry(5.2, 5.35, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd21f,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.005;
    this.group.add(ringMesh);

    // Outer Cyan Accent Ring
    const outerRingGeo = new THREE.RingGeometry(11.8, 11.92, 64);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRingMesh.position.y = 0.005;
    this.group.add(outerRingMesh);

    // 2. Dark Studio Curved Wall Backdrop
    const wallGeo = new THREE.CylinderGeometry(23.5, 23.5, 14, 64, 1, true, Math.PI * 0.25, Math.PI * 1.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0a0d16,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.BackSide
    });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.y = 7;
    this.group.add(wallMesh);

    // 3. Subtle Vertical Studio LED Light Strips on Walls
    for (let i = -3; i <= 3; i++) {
      const angle = (i * 0.35);
      const stripGeo = new THREE.BoxGeometry(0.12, 12, 0.08);
      const stripMat = new THREE.MeshBasicMaterial({
        color: (i % 2 === 0) ? 0xffd21f : 0x00f0ff
      });
      const stripMesh = new THREE.Mesh(stripGeo, stripMat);
      
      const radius = 23.2;
      stripMesh.position.set(
        Math.sin(angle) * radius,
        6,
        -Math.cos(angle) * radius
      );
      stripMesh.rotation.y = angle;
      this.group.add(stripMesh);
    }
  }

  buildLighting() {
    // 1. Studio Key Overhead Spotlight
    const keyLight = new THREE.SpotLight(0xffffff, 3.5);
    keyLight.position.set(0, 14, 4);
    keyLight.angle = 0.65;
    keyLight.penumbra = 0.5;
    keyLight.decay = 1.2;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    this.group.add(keyLight);
    this.group.add(keyLight.target);

    // 2. Warm Giallo Gold Side Fill Light
    const goldFill = new THREE.SpotLight(0xffd21f, 1.8);
    goldFill.position.set(-8, 5, 8);
    goldFill.angle = 0.8;
    goldFill.penumbra = 0.8;
    this.group.add(goldFill);

    // 3. Crisp Cyan Rear Rim Light (Highlights Wing & Rear Haunches)
    const cyanRim = new THREE.SpotLight(0x00f0ff, 2.2);
    cyanRim.position.set(8, 6, -8);
    cyanRim.angle = 0.8;
    cyanRim.penumbra = 0.8;
    this.group.add(cyanRim);

    // 4. Soft Ambient Studio Fill
    const studioAmbient = new THREE.AmbientLight(0x1a2035, 0.6);
    this.group.add(studioAmbient);
  }

  getGroup() {
    return this.group;
  }

  getPosition() {
    return this.position;
  }
}
