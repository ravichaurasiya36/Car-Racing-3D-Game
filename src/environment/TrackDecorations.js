import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ForestWildlife } from './ForestWildlife.js';

export class TrackDecorations {
  constructor(scene, racingTrack) {
    this.scene = scene;
    this.racingTrack = racingTrack;
    this.meshGroup = new THREE.Group();

    this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
      (navigator.maxTouchPoints > 2 && window.innerWidth <= 1024);

    this.curve = racingTrack.getCenterlineCurve();
    this.roadWidth = racingTrack.getRoadWidth();

    this.buildTerrain();
    this.buildMountainRanges();
    this.buildInstancedOrganicVegetation();
    this.buildRoadsideCivilization();
    this.buildUtilityPolesWithWires();
    
    // Build Forest Wildlife & Natural Floor Life
    this.forestWildlife = new ForestWildlife(this.meshGroup, this.curve, this.roadWidth, (x, z) => this.getNearestTrackPoint(x, z));
  }

  buildTerrain() {
    // Large undulating green terrain surrounding the circuit
    const terrainSize = 1200;
    const segments = 128;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    const baseGreen = new THREE.Color(0x4c8335); // Lush grass green
    const hillGreen = new THREE.Color(0x366827); // Deep meadow green
    const dirtColor = new THREE.Color(0x6e684d); // Roadside dirt/gravel blend

    // Deform terrain with soft rolling hills while keeping track zone flat
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      // Calculate distance to nearest point on track curve
      const trackPoint = this.getNearestTrackPoint(vx, vz);
      const distToTrack = trackPoint.distance;

      let height = 0;

      // Smooth elevation increase outside the track safety boundary (beyond 22m)
      if (distToTrack > 22) {
        const factor = Math.min(1.0, (distToTrack - 22) / 110);
        // Multi-frequency sine waves for natural rolling landscape hills
        const n1 = Math.sin(vx * 0.014) * Math.cos(vz * 0.014) * 16.0;
        const n2 = Math.sin(vx * 0.032 + 1.2) * Math.cos(vz * 0.028 + 0.5) * 7.0;
        height = (n1 + n2) * factor;
      }

      posAttr.setY(i, height);

      // Vertex color blending based on height and distance to track
      let vertexColor = baseGreen.clone();
      if (distToTrack < 18) {
        const blend = (distToTrack - 8) / 10;
        vertexColor.lerpColors(dirtColor, baseGreen, Math.max(0, blend));
      } else {
        const heightFactor = Math.min(1.0, Math.max(0, height / 16));
        vertexColor.lerpColors(baseGreen, hillGreen, heightFactor);
      }

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.meshGroup.add(terrainMesh);
  }

  getNearestTrackPoint(x, z) {
    const samples = 120;
    let minSqDist = Infinity;
    let bestPoint = null;

    for (let i = 0; i < samples; i++) {
      const u = i / samples;
      const p = this.curve.getPointAt(u);
      const dx = x - p.x;
      const dz = z - p.z;
      const sqDist = dx * dx + dz * dz;

      if (sqDist < minSqDist) {
        minSqDist = sqDist;
        bestPoint = p;
      }
    }

    return {
      point: bestPoint,
      distance: Math.sqrt(minSqDist)
    };
  }

  buildMountainRanges() {
    // 3D Organic Mountain Range backdrop framing the horizon
    const mountainGroup = new THREE.Group();
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x3d5a45,
      roughness: 0.92,
      metalness: 0.04
    });

    const ringRadius = 560;
    const ridgeSegments = 64;

    const mountainGeo = new THREE.CylinderGeometry(ringRadius + 80, ringRadius - 40, 110, ridgeSegments, 12, true);
    const posAttr = mountainGeo.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      const angle = Math.atan2(z, x);
      const normalizedY = (y + 55) / 110;

      if (normalizedY > 0.05) {
        const n1 = Math.sin(angle * 6.0) * Math.cos(angle * 4.0) * 35.0;
        const n2 = Math.sin(angle * 14.0 + 1.2) * 16.0;
        const n3 = Math.cos(angle * 28.0) * 6.0;
        const ridgeDisplacement = (n1 + n2 + n3) * Math.pow(normalizedY, 1.4);

        const rScale = 1.0 + (ridgeDisplacement / ringRadius);
        posAttr.setX(i, x * rScale);
        posAttr.setZ(i, z * rScale);
        posAttr.setY(i, y + ridgeDisplacement * 0.4);
      }
    }

    mountainGeo.computeVertexNormals();
    const mountainMesh = new THREE.Mesh(mountainGeo, mountainMat);
    mountainMesh.position.y = 45;
    mountainGroup.add(mountainMesh);

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + 0.1;
      const r = ringRadius + 90 + Math.random() * 60;
      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;
      const peakH = 65 + Math.random() * 45;
      const peakR = 45 + Math.random() * 35;

      const peakGeo = new THREE.ConeGeometry(peakR, peakH, 8);
      const peakMesh = new THREE.Mesh(peakGeo, mountainMat);
      peakMesh.position.set(px, peakH / 2 + 10, pz);
      peakMesh.rotation.y = Math.random() * Math.PI;
      mountainGroup.add(peakMesh);
    }

    this.meshGroup.add(mountainGroup);
  }

  // --- PROCEDURAL ORGANIC TREE GEOMETRY GENERATORS ---

  // --- PROCEDURAL 3D TREE SPECIES GENERATORS (INSPIRED BY PHOTO REFERENCE) ---

  createMajesticOakGeometries() {
    // Majestic Ancient Oak (Direct Reference Photo Spec):
    // Flared root buttresses, gnarled main trunk, 4 scaffold boughs, secondary branching, and 32 leaf-puff clusters with sky gaps
    const trunkParts = [];
    const foliageParts = [];

    // 1. Flared Root Buttresses (5 roots spreading at ground level)
    for (let r = 0; r < 5; r++) {
      const angle = (r / 5) * Math.PI * 2 + 0.2;
      const root = new THREE.CylinderGeometry(0.2, 0.6, 1.6, 6);
      root.translate(0, 0.8, 0);
      root.rotateX(0.5);
      root.rotateY(angle);
      trunkParts.push(root);
    }

    // 2. Tapered Main Trunk
    const mainTrunk = new THREE.CylinderGeometry(0.75, 1.25, 3.2, 10);
    mainTrunk.translate(0, 1.6, 0);
    trunkParts.push(mainTrunk);

    // 3. 4 Massive Primary Scaffold Boughs extending outward (canopy wider than tall)
    const scaffoldBoughs = [
      { rBase: 0.55, rTip: 0.35, len: 4.2, y: 2.4, rx: 0.5, rz: -0.75, ry: 0.3 },
      { rBase: 0.52, rTip: 0.32, len: 4.5, y: 2.6, rx: -0.45, rz: 0.7, ry: 1.9 },
      { rBase: 0.48, rTip: 0.30, len: 4.0, y: 2.8, rx: 0.65, rz: 0.4, ry: 3.6 },
      { rBase: 0.45, rTip: 0.28, len: 3.8, y: 3.0, rx: -0.6, rz: -0.55, ry: 5.1 }
    ];

    for (const b of scaffoldBoughs) {
      const bough = new THREE.CylinderGeometry(b.rTip, b.rBase, b.len, 7);
      bough.translate(0, b.len / 2, 0);
      bough.rotateX(b.rx);
      bough.rotateZ(b.rz);
      bough.rotateY(b.ry);
      bough.translate(0, b.y, 0);
      trunkParts.push(bough);

      // Secondary branches splitting off each scaffold bough
      for (let sb = 0; sb < 2; sb++) {
        const secLen = 2.2 + sb * 0.4;
        const secBranch = new THREE.CylinderGeometry(b.rTip * 0.5, b.rTip * 0.8, secLen, 5);
        secBranch.translate(0, secLen / 2, 0);
        secBranch.rotateX(b.rx + (sb === 0 ? 0.3 : -0.2));
        secBranch.rotateZ(b.rz + (sb === 0 ? -0.2 : 0.3));
        secBranch.rotateY(b.ry + (sb * 0.8));
        secBranch.translate(Math.sin(b.ry) * 2.2, b.y + 1.2 + sb * 0.6, Math.cos(b.ry) * 2.2);
        trunkParts.push(secBranch);
      }
    }

    // 4. 32 Leaf Puff Clusters arranged along outer perimeter (leaving sky gaps through center)
    const clusterBaseGeo = new THREE.DodecahedronGeometry(1.4, this.isMobile ? 0 : 1);
    const pos = clusterBaseGeo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const vx = pos.getX(v);
      const vy = pos.getY(v);
      const vz = pos.getZ(v);
      const n = (Math.sin(vx * 4) * Math.cos(vz * 4)) * 0.18;
      pos.setXYZ(v, vx + n, vy + n, vz + n);
    }
    clusterBaseGeo.computeVertexNormals();

    const clusterLocs = [
      // Top Outer Crown
      { x: 0, y: 7.2, z: 0, s: 1.4 },
      { x: 1.6, y: 7.0, z: 1.2, s: 1.2 },
      { x: -1.8, y: 6.9, z: -1.1, s: 1.25 },
      { x: 1.2, y: 7.4, z: -1.4, s: 1.15 },
      { x: -1.4, y: 7.1, z: 1.5, s: 1.2 },
      // Mid Spreading Layer (Outer Perimeter)
      { x: 3.8, y: 5.4, z: 0.8, s: 1.3 },
      { x: 4.2, y: 4.6, z: -1.2, s: 1.2 },
      { x: -3.9, y: 5.6, z: -0.9, s: 1.35 },
      { x: -4.1, y: 4.8, z: 1.4, s: 1.25 },
      { x: 1.2, y: 5.8, z: 3.8, s: 1.3 },
      { x: -1.5, y: 5.6, z: -3.9, s: 1.3 },
      { x: -1.1, y: 5.4, z: 3.9, s: 1.2 },
      { x: 1.4, y: 5.7, z: -3.7, s: 1.25 },
      // Lower Hanging Limbs (Matching Photo Reference)
      { x: 4.8, y: 3.8, z: 0.2, s: 1.1 },
      { x: -4.9, y: 4.0, z: -0.4, s: 1.15 },
      { x: 2.2, y: 4.2, z: 4.2, s: 1.05 },
      { x: -2.4, y: 4.0, z: -4.3, s: 1.1 },
      { x: -2.2, y: 4.1, z: 4.1, s: 1.05 },
      { x: 2.5, y: 4.3, z: -4.1, s: 1.1 },
      // Outer Filler Clusters
      { x: 2.8, y: 6.4, z: 2.0, s: 1.1 },
      { x: -2.9, y: 6.2, z: -2.2, s: 1.15 },
      { x: -2.6, y: 6.5, z: 2.1, s: 1.05 },
      { x: 2.7, y: 6.3, z: -2.3, s: 1.1 },
      { x: 0.8, y: 7.8, z: 0.6, s: 1.0 },
      { x: -0.9, y: 7.6, z: -0.7, s: 1.0 },
      { x: 4.5, y: 4.8, z: 1.8, s: 0.95 },
      { x: -4.6, y: 5.0, z: -1.9, s: 1.0 },
      { x: 1.8, y: 4.9, z: 4.6, s: 0.9 },
      { x: -1.9, y: 4.7, z: -4.7, s: 0.95 },
      { x: 3.4, y: 5.8, z: -2.8, s: 0.9 },
      { x: -3.5, y: 5.9, z: 2.9, s: 0.95 },
      { x: 0, y: 8.2, z: 0, s: 0.9 }
    ];

    for (const c of clusterLocs) {
      const puff = clusterBaseGeo.clone();
      puff.scale(c.s * 1.1, c.s * 0.85, c.s * 1.1);
      puff.translate(c.x, c.y, c.z);
      foliageParts.push(puff);
    }

    const trunkGeo = BufferGeometryUtils.mergeGeometries(trunkParts);
    const foliageGeo = BufferGeometryUtils.mergeGeometries(foliageParts);

    return { trunkGeo, foliageGeo };
  }

  createTallOakGeometries() {
    // Tall Ancient Oak: Taller trunk, elevated dome canopy, 28 leaf clusters
    const trunkParts = [];
    const foliageParts = [];

    // Root Buttresses
    for (let r = 0; r < 4; r++) {
      const angle = (r / 4) * Math.PI * 2 + 0.1;
      const root = new THREE.CylinderGeometry(0.18, 0.5, 1.5, 6);
      root.translate(0, 0.75, 0);
      root.rotateX(0.45);
      root.rotateY(angle);
      trunkParts.push(root);
    }

    // Tall Main Trunk
    const mainTrunk = new THREE.CylinderGeometry(0.65, 1.0, 4.5, 9);
    mainTrunk.translate(0, 2.25, 0);
    trunkParts.push(mainTrunk);

    // 4 Upright Scaffold Boughs
    const scaffoldBoughs = [
      { rBase: 0.45, rTip: 0.28, len: 3.8, y: 3.5, rx: 0.35, rz: -0.5, ry: 0.4 },
      { rBase: 0.42, rTip: 0.26, len: 4.0, y: 3.7, rx: -0.3, rz: 0.55, ry: 2.0 },
      { rBase: 0.40, rTip: 0.24, len: 3.6, y: 4.0, rx: 0.45, rz: 0.3, ry: 3.7 },
      { rBase: 0.38, rTip: 0.22, len: 3.4, y: 4.2, rx: -0.4, rz: -0.4, ry: 5.3 }
    ];

    for (const b of scaffoldBoughs) {
      const bough = new THREE.CylinderGeometry(b.rTip, b.rBase, b.len, 6);
      bough.translate(0, b.len / 2, 0);
      bough.rotateX(b.rx);
      bough.rotateZ(b.rz);
      bough.rotateY(b.ry);
      bough.translate(0, b.y, 0);
      trunkParts.push(bough);
    }

    // 28 Leaf Clusters forming elevated dome
    const clusterBaseGeo = new THREE.DodecahedronGeometry(1.35, this.isMobile ? 0 : 1);
    const clusterLocs = [
      { x: 0, y: 9.0, z: 0, s: 1.4 },
      { x: 1.5, y: 8.5, z: 1.1, s: 1.2 },
      { x: -1.6, y: 8.6, z: -1.0, s: 1.2 },
      { x: 1.1, y: 8.8, z: -1.3, s: 1.1 },
      { x: -1.2, y: 8.7, z: 1.4, s: 1.15 },
      { x: 3.0, y: 7.2, z: 0.6, s: 1.25 },
      { x: -3.1, y: 7.4, z: -0.7, s: 1.3 },
      { x: 0.9, y: 7.5, z: 3.1, s: 1.2 },
      { x: -1.0, y: 7.3, z: -3.2, s: 1.2 },
      { x: 3.8, y: 5.8, z: 0.2, s: 1.05 },
      { x: -3.9, y: 6.0, z: -0.3, s: 1.1 },
      { x: 1.8, y: 6.2, z: 3.4, s: 1.0 },
      { x: -1.9, y: 6.1, z: -3.5, s: 1.0 },
      { x: 2.2, y: 8.2, z: 1.6, s: 1.05 },
      { x: -2.3, y: 8.0, z: -1.7, s: 1.05 },
      { x: 1.4, y: 8.3, z: -2.0, s: 1.0 },
      { x: -1.5, y: 8.1, z: 2.1, s: 1.0 },
      { x: 0, y: 9.8, z: 0, s: 0.9 }
    ];

    for (const c of clusterLocs) {
      const puff = clusterBaseGeo.clone();
      puff.scale(c.s, c.s * 0.9, c.s);
      puff.translate(c.x, c.y, c.z);
      foliageParts.push(puff);
    }

    const trunkGeo = BufferGeometryUtils.mergeGeometries(trunkParts);
    const foliageGeo = BufferGeometryUtils.mergeGeometries(foliageParts);

    return { trunkGeo, foliageGeo };
  }

  createBroadCountrysideOakGeometries() {
    // Broad Countryside Oak: Exceptionally wide horizontal branch spread with low-hanging outer limbs
    const trunkParts = [];
    const foliageParts = [];

    // 5 Spreading Root Buttresses
    for (let r = 0; r < 5; r++) {
      const angle = (r / 5) * Math.PI * 2 + 0.3;
      const root = new THREE.CylinderGeometry(0.2, 0.65, 1.8, 6);
      root.translate(0, 0.9, 0);
      root.rotateX(0.55);
      root.rotateY(angle);
      trunkParts.push(root);
    }

    const mainTrunk = new THREE.CylinderGeometry(0.8, 1.35, 2.8, 10);
    mainTrunk.translate(0, 1.4, 0);
    trunkParts.push(mainTrunk);

    // 4 Wide Horizontal Scaffold Boughs
    const scaffoldBoughs = [
      { rBase: 0.6, rTip: 0.38, len: 5.2, y: 2.2, rx: 0.6, rz: -0.85, ry: 0.2 },
      { rBase: 0.58, rTip: 0.35, len: 5.4, y: 2.4, rx: -0.55, rz: 0.8, ry: 1.8 },
      { rBase: 0.52, rTip: 0.32, len: 4.8, y: 2.6, rx: 0.7, rz: 0.45, ry: 3.5 },
      { rBase: 0.50, rTip: 0.30, len: 4.6, y: 2.7, rx: -0.65, rz: -0.6, ry: 5.0 }
    ];

    for (const b of scaffoldBoughs) {
      const bough = new THREE.CylinderGeometry(b.rTip, b.rBase, b.len, 7);
      bough.translate(0, b.len / 2, 0);
      bough.rotateX(b.rx);
      bough.rotateZ(b.rz);
      bough.rotateY(b.ry);
      bough.translate(0, b.y, 0);
      trunkParts.push(bough);
    }

    // 36 Wide Canopy Leaf Clusters
    const clusterBaseGeo = new THREE.DodecahedronGeometry(1.5, this.isMobile ? 0 : 1);
    const clusterLocs = [
      { x: 0, y: 6.8, z: 0, s: 1.4 },
      { x: 2.2, y: 6.4, z: 1.4, s: 1.25 },
      { x: -2.3, y: 6.3, z: -1.3, s: 1.3 },
      { x: 4.8, y: 4.8, z: 0.9, s: 1.35 },
      { x: -4.9, y: 5.0, z: -1.0, s: 1.4 },
      { x: 1.4, y: 5.2, z: 4.8, s: 1.35 },
      { x: -1.6, y: 5.1, z: -4.9, s: 1.35 },
      { x: 5.6, y: 3.5, z: 0.2, s: 1.15 },
      { x: -5.7, y: 3.7, z: -0.3, s: 1.2 },
      { x: 2.5, y: 3.8, z: 5.2, s: 1.1 },
      { x: -2.6, y: 3.7, z: -5.3, s: 1.15 },
      { x: 3.2, y: 5.8, z: 2.4, s: 1.15 },
      { x: -3.3, y: 5.7, z: -2.5, s: 1.2 },
      { x: 0, y: 7.6, z: 0, s: 1.0 }
    ];

    for (const c of clusterLocs) {
      const puff = clusterBaseGeo.clone();
      puff.scale(c.s * 1.15, c.s * 0.8, c.s * 1.15);
      puff.translate(c.x, c.y, c.z);
      foliageParts.push(puff);
    }

    const trunkGeo = BufferGeometryUtils.mergeGeometries(trunkParts);
    const foliageGeo = BufferGeometryUtils.mergeGeometries(foliageParts);

    return { trunkGeo, foliageGeo };
  }

  createRoadsideOakGeometries() {
    // Compact Roadside Oak: 22 leaf clusters, compact footprint for framing track margins
    const trunkParts = [];
    const foliageParts = [];

    // Root Buttresses
    for (let r = 0; r < 4; r++) {
      const angle = (r / 4) * Math.PI * 2 + 0.2;
      const root = new THREE.CylinderGeometry(0.16, 0.48, 1.4, 6);
      root.translate(0, 0.7, 0);
      root.rotateX(0.48);
      root.rotateY(angle);
      trunkParts.push(root);
    }

    const mainTrunk = new THREE.CylinderGeometry(0.6, 0.95, 3.0, 8);
    mainTrunk.translate(0, 1.5, 0);
    trunkParts.push(mainTrunk);

    const scaffoldBoughs = [
      { rBase: 0.42, rTip: 0.26, len: 3.4, y: 2.2, rx: 0.45, rz: -0.6, ry: 0.3 },
      { rBase: 0.38, rTip: 0.24, len: 3.6, y: 2.4, rx: -0.4, rz: 0.55, ry: 2.1 },
      { rBase: 0.35, rTip: 0.22, len: 3.2, y: 2.6, rx: 0.5, rz: 0.3, ry: 3.8 }
    ];

    for (const b of scaffoldBoughs) {
      const bough = new THREE.CylinderGeometry(b.rTip, b.rBase, b.len, 6);
      bough.translate(0, b.len / 2, 0);
      bough.rotateX(b.rx);
      bough.rotateZ(b.rz);
      bough.rotateY(b.ry);
      bough.translate(0, b.y, 0);
      trunkParts.push(bough);
    }

    const clusterBaseGeo = new THREE.DodecahedronGeometry(1.3, this.isMobile ? 0 : 1);
    const clusterLocs = [
      { x: 0, y: 6.2, z: 0, s: 1.3 },
      { x: 1.8, y: 5.4, z: 0.6, s: 1.15 },
      { x: -1.9, y: 5.5, z: -0.5, s: 1.2 },
      { x: 0.7, y: 5.8, z: 1.8, s: 1.05 },
      { x: -0.8, y: 5.6, z: -1.7, s: 1.1 },
      { x: 2.8, y: 4.4, z: 0.4, s: 1.0 },
      { x: -2.9, y: 4.5, z: -0.3, s: 1.05 },
      { x: 0, y: 7.0, z: 0, s: 0.9 }
    ];

    for (const c of clusterLocs) {
      const puff = clusterBaseGeo.clone();
      puff.scale(c.s * 1.1, c.s * 0.85, c.s * 1.1);
      puff.translate(c.x, c.y, c.z);
      foliageParts.push(puff);
    }

    const trunkGeo = BufferGeometryUtils.mergeGeometries(trunkParts);
    const foliageGeo = BufferGeometryUtils.mergeGeometries(foliageParts);

    return { trunkGeo, foliageGeo };
  }

  buildInstancedOrganicVegetation() {
    const dummy = new THREE.Object3D();

    // Road half-width is 8.0m. Gravel shoulder extends to 9.4m. Guardrail is at 8.9m.
    // Max tree canopy radius is ~6.5m.
    // Minimum tree trunk clearance must be 17.5m so canopy edge stops at 11.0m (1.6m outside shoulder!).
    const minTreeClearance = 17.5;
    const minBushClearance = 11.5;

    const treePositions = [];
    const bushPositions = [];

    const curveDivision = 280;
    for (let i = 0; i < curveDivision; i++) {
      const u = i / curveDivision;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Tree scatter distances (Sparse open-field / Icelandic countryside feel)
      const treeDistances = [28, 65, 115];
      for (const side of [-1, 1]) {
        for (const dist of treeDistances) {
          // Drastically reduce tree count (only keep ~12% of candidate spots) to create sparse environment
          if (Math.random() > 0.12) continue;

          const jitterX = (Math.random() - 0.5) * 12;
          const jitterZ = (Math.random() - 0.5) * 12;
          const pos = point.clone().addScaledVector(right, side * (dist + Math.random() * 5));
          pos.x += jitterX;
          pos.z += jitterZ;

          const nearest = this.getNearestTrackPoint(pos.x, pos.z);
          
          // Extra clearance on corner inner apexes to maintain clear line-of-sight
          let requiredClearance = minTreeClearance;
          if (dist < 30) {
            // Check if near a tight curve apex (Turns at u ~ 0.15, 0.28, 0.48, 0.60, 0.78, 0.91)
            const isCornerZone = (u > 0.10 && u < 0.20) || (u > 0.24 && u < 0.34) || 
                                 (u > 0.42 && u < 0.52) || (u > 0.55 && u < 0.65) || 
                                 (u > 0.72 && u < 0.84) || (u > 0.86 && u < 0.95);
            if (isCornerZone) {
              requiredClearance = 23.0; // 23m clearance on curve apexes for unobstructed line-of-sight!
            }
          }

          if (nearest.distance >= requiredClearance) {
            treePositions.push({
              pos,
              distFromTrack: nearest.distance,
              nearestPoint: nearest.point
            });
          }
        }
      }

      // Bush scatter distances (12m to 16m from track centerline, just outside guardrail)
      for (const side of [-1, 1]) {
        if (i % 2 === 0 && Math.random() < 0.25) { // Reduced bush density for open feel
          const bDist = 12.5 + Math.random() * 3.5;
          const bPos = point.clone().addScaledVector(right, side * bDist);
          bPos.x += (Math.random() - 0.5) * 2;
          bPos.z += (Math.random() - 0.5) * 2;

          const nearestB = this.getNearestTrackPoint(bPos.x, bPos.z);
          if (nearestB.distance >= minBushClearance) {
            bushPositions.push({
              pos: bPos,
              distFromTrack: nearestB.distance
            });
          }
        }
      }
    }

    // Palette of natural foliage green color shades inspired by photo reference
    const foliagePalette = [
      new THREE.Color(0x244b25), // Deep shadow green
      new THREE.Color(0x356e30), // Rich summer oak green
      new THREE.Color(0x589436), // Sunlit golden-green
      new THREE.Color(0x457b2e), // Natural warm olive green
      new THREE.Color(0x2d5c2b)  // Deep leaf green
    ];

    const barkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.92 });
    const foliageMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.05 });

    // Procedural oak tree variations
    const speciesGeos = [
      this.createMajesticOakGeometries(),
      this.createTallOakGeometries(),
      this.createBroadCountrysideOakGeometries(),
      this.createRoadsideOakGeometries()
    ];

    const speciesCount = 4;
    const itemsPerSpecies = Math.floor(treePositions.length / speciesCount);

    for (let sp = 0; sp < speciesCount; sp++) {
      const geo = speciesGeos[sp];
      const count = itemsPerSpecies;

      const trunkMesh = new THREE.InstancedMesh(geo.trunkGeo, barkMat, count);
      const foliageMesh = new THREE.InstancedMesh(geo.foliageGeo, foliageMat, count);
      trunkMesh.castShadow = true;
      foliageMesh.castShadow = false;
      trunkMesh.receiveShadow = true;
      foliageMesh.receiveShadow = false;

      let idx = 0;
      for (let i = sp; i < treePositions.length && idx < count; i += speciesCount) {
        const item = treePositions[i];
        
        // Slightly smaller scale for trees closer to 18m, full scale for distant trees
        const distFactor = Math.min(1.0, (item.distFromTrack - 17.5) / 25.0);
        const scaleFactor = (0.7 + distFactor * 0.4) * (0.85 + Math.random() * 0.35);

        const rotY = Math.random() * Math.PI * 2;

        // Slight posture tilt AWAY from road direction to ensure zero canopy overhang
        const dirAwayX = item.pos.x - item.nearestPoint.x;
        const dirAwayZ = item.pos.z - item.nearestPoint.z;
        const awayLen = Math.sqrt(dirAwayX * dirAwayX + dirAwayZ * dirAwayZ) || 1;
        const tiltX = (dirAwayZ / awayLen) * 0.05;
        const tiltZ = (-dirAwayX / awayLen) * 0.05;

        dummy.position.copy(item.pos);
        dummy.position.y = 0;
        dummy.rotation.set(tiltX, rotY, tiltZ);
        dummy.scale.set(scaleFactor, scaleFactor, scaleFactor);
        dummy.updateMatrix();

        trunkMesh.setMatrixAt(idx, dummy.matrix);
        foliageMesh.setMatrixAt(idx, dummy.matrix);

        const color = foliagePalette[(idx + sp) % foliagePalette.length];
        foliageMesh.setColorAt(idx, color);

        idx++;
      }

      trunkMesh.instanceMatrix.needsUpdate = true;
      foliageMesh.instanceMatrix.needsUpdate = true;
      if (foliageMesh.instanceColor) foliageMesh.instanceColor.needsUpdate = true;

      this.meshGroup.add(trunkMesh);
      this.meshGroup.add(foliageMesh);
    }

    // Roadside Organic Bushes & Shrubs (strictly outside guardrail at 11.5m to 16m)
    const bushCount = Math.min(350, bushPositions.length);
    const bushGeo = new THREE.DodecahedronGeometry(1.2, this.isMobile ? 0 : 1);
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.8 });
    const bushMesh = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
    bushMesh.castShadow = true;

    for (let i = 0; i < bushCount; i++) {
      const item = bushPositions[i];
      const s = 0.6 + Math.random() * 0.6;
      dummy.position.copy(item.pos);
      dummy.position.y = 0.6 * s;
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(s, s * 0.85, s);
      dummy.updateMatrix();
      bushMesh.setMatrixAt(i, dummy.matrix);
    }
    bushMesh.instanceMatrix.needsUpdate = true;
    this.meshGroup.add(bushMesh);

    // Granite Boulders & Rocks (scattered beyond 15m from track centerline)
    const rockCount = Math.min(200, treePositions.length);
    const rockGeo = new THREE.DodecahedronGeometry(1.5, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9, metalness: 0.1 });
    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;

    let rockIdx = 0;
    for (let i = 1; i < treePositions.length && rockIdx < rockCount; i += 4) {
      const item = treePositions[i];
      if (item.distFromTrack < 50) {
        const s = 0.5 + Math.random() * 0.85;
        dummy.position.copy(item.pos);
        dummy.position.y = 0.5 * s;
        dummy.rotation.set(Math.random(), Math.random(), Math.random());
        dummy.scale.set(s * 1.2, s * 0.75, s * 1.1);
        dummy.updateMatrix();
        rockMesh.setMatrixAt(rockIdx++, dummy.matrix);
      }
    }
    rockMesh.instanceMatrix.needsUpdate = true;
    this.meshGroup.add(rockMesh);
  }

  buildRoadsideCivilization() {
    // Believable roadside houses, modern villas, and commercial buildings placed in clusters
    const buildingClusters = [
      // Cluster 1: Main straight suburban village
      { centerX: -35, centerZ: 60, count: 5, radius: 25 },
      // Cluster 2: Turn 2/3 hill side villas
      { centerX: 150, centerZ: 140, count: 6, radius: 30 },
      // Cluster 3: Back straight hamlet
      { centerX: 145, centerZ: -100, count: 4, radius: 25 },
      // Cluster 4: Hairpin bend hamlet
      { centerX: -80, centerZ: -120, count: 5, radius: 28 }
    ];

    const wallMatA = new THREE.MeshStandardMaterial({ color: 0xf4f1de, roughness: 0.6 });
    const wallMatB = new THREE.MeshStandardMaterial({ color: 0xe0e1dd, roughness: 0.5 });
    const wallMatC = new THREE.MeshStandardMaterial({ color: 0xddb892, roughness: 0.7 });
    const roofRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 }); // Terracotta tile roof
    const roofDarkMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.4 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.5 });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.7 });
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });

    for (const cluster of buildingClusters) {
      for (let i = 0; i < cluster.count; i++) {
        const angle = (i / cluster.count) * Math.PI * 2 + (Math.random() * 0.4);
        const dist = 14 + Math.random() * cluster.radius;
        const x = cluster.centerX + Math.cos(angle) * dist;
        const z = cluster.centerZ + Math.sin(angle) * dist;

        // Check clearance to track
        const nearest = this.getNearestTrackPoint(x, z);
        if (nearest.distance < 14) continue;

        const houseGroup = new THREE.Group();
        houseGroup.position.set(x, 0, z);

        // Face house towards nearest track point
        const dx = nearest.point.x - x;
        const dz = nearest.point.z - z;
        const facingYaw = Math.atan2(dx, dz);
        houseGroup.rotation.y = facingYaw;

        const isModern = i % 2 === 0;
        const w = 7 + Math.random() * 4;
        const h = 4.5 + Math.random() * 2;
        const d = 7 + Math.random() * 4;

        if (!isModern) {
          // Classic Countryside Pitched-Roof House
          const wallMat = i % 3 === 0 ? wallMatA : wallMatC;
          const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
          body.position.y = h / 2;
          body.castShadow = true;
          body.receiveShadow = true;
          houseGroup.add(body);

          // Gabled Roof with Overhang Eaves
          const roofHeight = 2.6;
          const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.78, roofHeight, 4);
          const roof = new THREE.Mesh(roofGeo, roofRedMat);
          roof.position.y = h + roofHeight / 2;
          roof.rotation.y = Math.PI / 4;
          roof.castShadow = true;
          houseGroup.add(roof);

          // Front Door
          const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), doorMat);
          door.position.set(0, 1.1, d / 2 + 0.06);
          houseGroup.add(door);

          // Window Frames with Glass Sheen
          for (const wx of [-w * 0.28, w * 0.28]) {
            const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 0.12), roofDarkMat);
            winFrame.position.set(wx, h * 0.6, d / 2 + 0.05);
            houseGroup.add(winFrame);

            const winGlass = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.15), windowMat);
            winGlass.position.set(wx, h * 0.6, d / 2 + 0.07);
            houseGroup.add(winGlass);
          }
        } else {
          // Modern Villa Architecture
          const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMatB);
          body.position.y = h / 2;
          body.castShadow = true;
          body.receiveShadow = true;
          houseGroup.add(body);

          // Upper floor accent box
          const upper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 3, d * 0.7), wallMatC);
          upper.position.set(w * 0.15, h + 1.5, 0);
          upper.castShadow = true;
          houseGroup.add(upper);

          // Flat Roof Trim
          const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.4, d + 0.4), roofDarkMat);
          roofTrim.position.y = h + 0.2;
          houseGroup.add(roofTrim);

          // Glass Balcony Front
          const glass = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 1.1, 0.1), windowMat);
          glass.position.set(w * 0.15, h + 1.2, d * 0.35 + 0.06);
          houseGroup.add(glass);
        }

        // Roadside Wooden Fence around property front
        const fenceWidth = w + 3;
        const fence = new THREE.Mesh(new THREE.BoxGeometry(fenceWidth, 1.0, 0.15), fenceMat);
        fence.position.set(0, 0.5, d / 2 + 2.5);
        fence.castShadow = true;
        houseGroup.add(fence);

        this.meshGroup.add(houseGroup);
      }
    }
  }

  buildUtilityPolesWithWires() {
    // Telegraph & Utility poles with crossbars and insulator pins lining roadside straightaways
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.8 });
    const wireMat = new THREE.LineBasicMaterial({ color: 0x111827, linewidth: 1 });
    const halfWidth = this.roadWidth / 2;

    const poleCount = 45;
    const polePositions = [];

    for (let i = 0; i < poleCount; i++) {
      const u = (i / poleCount);
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const yaw = Math.atan2(tangent.x, tangent.z);

      // Place utility poles 11.5m to the right side of the road
      const polePos = point.clone().addScaledVector(right, halfWidth + 3.5);
      polePositions.push({ pos: polePos, yaw });

      const poleGroup = new THREE.Group();
      poleGroup.position.copy(polePos);

      // Main Vertical Wooden Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 7.5), poleMat);
      pole.position.y = 3.75;
      pole.castShadow = true;
      poleGroup.add(pole);

      // Steel Crossbar
      const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.15), poleMat);
      crossbar.position.set(0, 6.8, 0);
      crossbar.rotation.y = yaw + Math.PI / 2;
      crossbar.castShadow = true;
      poleGroup.add(crossbar);

      // Insulator Pins
      for (const offset of [-0.9, 0, 0.9]) {
        const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25), metalMat);
        insulator.position.set(offset * Math.cos(yaw), 7.0, offset * Math.sin(yaw));
        poleGroup.add(insulator);
      }

      this.meshGroup.add(poleGroup);
    }

    // Connect utility poles with hanging overhead wires
    for (let i = 0; i < polePositions.length - 1; i++) {
      const p1 = polePositions[i].pos.clone(); p1.y += 7.0;
      const p2 = polePositions[i + 1].pos.clone(); p2.y += 7.0;

      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      mid.y -= 0.6; // Wire catenary sag

      const wireCurve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = wireCurve.getPoints(12);
      const wireGeo = new THREE.BufferGeometry().setFromPoints(points);
      const wireLine = new THREE.Line(wireGeo, wireMat);
      this.meshGroup.add(wireLine);
    }
  }

  update(delta, elapsedTime) {
    if (this.forestWildlife) {
      this.forestWildlife.update(delta, elapsedTime);
    }
  }

  getMesh() {
    return this.meshGroup;
  }
}


