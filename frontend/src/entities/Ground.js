import * as THREE from 'three';

export class Ground {
  constructor(size = 200) {
    this.meshGroup = new THREE.Group();

    // 1. Base Ground Surface Mesh
    const geometry = new THREE.PlaneGeometry(size, size, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x121624,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.meshGroup.add(plane);

    // 2. Neon Racing Grid Overlay for spatial perspective
    const gridHelper = new THREE.GridHelper(size, 80, 0x00f0ff, 0x1f293d);
    gridHelper.position.y = 0.02; // Slightly above ground plane to prevent z-fighting
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.opacity = 0.4;
      gridHelper.material.transparent = true;
    }
    this.meshGroup.add(gridHelper);

    // 3. Decorative Track Center Line Strip
    const stripGeo = new THREE.PlaneGeometry(4, size);
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.2,
      roughness: 0.5,
      transparent: true,
      opacity: 0.15
    });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.y = 0.03;
    this.meshGroup.add(strip);
  }

  getMesh() {
    return this.meshGroup;
  }
}
