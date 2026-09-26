import * as THREE from 'three';

export class DesertTrack {
  constructor() {
    this.trackId = 'desert_apex';
    this.trackName = 'Desert Apex';
    this.isPointToPoint = true;
    this.hasOpenBoundaries = true;
    this.meshGroup = new THREE.Group();
    this.roadWidth = 20.0; // 20m wide desert highway (LOCKED)

    // 1. Open Point-to-Point Spline Control Points (~6.0 KM Driving Distance, NOT CLOSED — LOCKED)
    this.controlPoints = [
      new THREE.Vector3(0, 0, 0),         // 0. START (Desert Base Camp)
      new THREE.Vector3(0, 0, 328),       // 1. Main Desert Straightaway
      new THREE.Vector3(73, 0, 620),      // 2. Entry Right Sweeper
      new THREE.Vector3(219, 0, 839),     // 3. Right Sweeper Apex
      new THREE.Vector3(438, 0, 949),     // 4. Exit Right Sweeper
      new THREE.Vector3(803, 0, 1058),    // 5. Long East Highway Straight
      new THREE.Vector3(1131, 0, 985),    // 6. Entry Left Sweeper
      new THREE.Vector3(1387, 0, 766),    // 7. Left Sweeper Apex
      new THREE.Vector3(1533, 0, 474),    // 8. Technical Oasis Section Entry
      new THREE.Vector3(1496, 0, 219),    // 9. Technical Chicane Left
      new THREE.Vector3(1606, 0, -36),    // 10. Technical Chicane Right
      new THREE.Vector3(1861, 0, -182),   // 11. High-Speed Plateau Straight Entry
      new THREE.Vector3(2263, 0, -292),   // 12. High-Speed Plateau Straight
      new THREE.Vector3(2591, 0, -219),   // 13. Right Sweeper Entry
      new THREE.Vector3(2810, 0, -36),    // 14. Right Sweeper Apex
      new THREE.Vector3(2883, 0, 219),    // 15. Left Turn Entry
      new THREE.Vector3(2774, 0, 511),    // 16. Left Turn Apex
      new THREE.Vector3(2664, 0, 839),    // 17. Final Straightaway Approach
      new THREE.Vector3(2664, 0, 1204),   // 18. Final Straightaway
      new THREE.Vector3(2664, 0, 1496)    // 19. FINISH GANTRY (6.0 KM Endpoint, separate from Start)
    ];

    // Open CatmullRom Curve (closed = false)
    this.curve = new THREE.CatmullRomCurve3(this.controlPoints, false, 'catmullrom', 0.45);
    
    // High-density sampling (2000 division points for ~6km curve)
    this.divisionCount = 2000;
    this.points = this.curve.getSpacedPoints(this.divisionCount);
    this.sampledTrackPoints = this.curve.getSpacedPoints(800);

    // --- STEP 1 & 2: DESERT FOUNDATION, ROAD & LANDSCAPE SYSTEM ---
    this.buildGround();
    this.buildRoadMesh();
    this.buildRoadShoulders();
    this.buildRoadMarkings();
    this.buildCurbs();
    this.buildSandDunes();
    this.buildRockFormations();
    this.buildDistantMesas();
    this.buildDesertVegetation();
    this.buildStartArea();
    this.buildFinishArea();
  }

  // Clearance Checker for Desert Props
  getMinDistToTrack(x, z, width = 0, depth = 0, rotationY = 0) {
    if (!this.sampledTrackPoints) {
      this.sampledTrackPoints = this.curve.getSpacedPoints(800);
    }
    const hw = width / 2;
    const hd = depth / 2;
    const cos = Math.cos(rotationY);
    const sin = Math.sin(rotationY);

    const localCorners = (width > 0 && depth > 0) ? [
      { x: 0, z: 0 },
      { x: -hw, z: -hd },
      { x: hw, z: -hd },
      { x: -hw, z: hd },
      { x: hw, z: hd }
    ] : [{ x: 0, z: 0 }];

    let globalMinSq = Infinity;

    localCorners.forEach(c => {
      const gx = x + (c.x * cos - c.z * sin);
      const gz = z + (c.x * sin + c.z * cos);

      for (let i = 0; i < this.sampledTrackPoints.length; i++) {
        const p = this.sampledTrackPoints[i];
        const dx = gx - p.x;
        const dz = gz - p.z;
        const sqDist = dx * dx + dz * dz;
        if (sqDist < globalMinSq) {
          globalMinSq = sqDist;
        }
      }
    });

    return Math.sqrt(globalMinSq);
  }

  // 1. Vast Open Sand Terrain Base (14,000m x 14,000m, Y = -0.02)
  buildGround() {
    const groundSize = 14000;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    groundGeo.rotateX(-Math.PI / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const sandTexture = new THREE.CanvasTexture(canvas);
    sandTexture.wrapS = THREE.RepeatWrapping;
    sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(140, 140);

    const groundMat = new THREE.MeshStandardMaterial({
      map: sandTexture,
      roughness: 0.9,
      metalness: 0.05
    });

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(1500, -0.02, 500);
    groundMesh.receiveShadow = true;
    this.meshGroup.add(groundMesh);
  }

  createDesertAsphaltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2c3038';
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      data[i] = Math.min(255, Math.max(0, data[i] + noise + 10)); // Desert dust tint
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + 6));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  getRightVector(tangent) {
    const horizLen = Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z);
    if (horizLen > 0.0001) {
      return new THREE.Vector3(-tangent.z / horizLen, 0, tangent.x / horizLen);
    }
    return new THREE.Vector3(1, 0, 0);
  }

  // 2. Continuous 20m Asphalt Road Mesh (Y = 0.05 — LOCKED)
  buildRoadMesh() {
    const halfWidth = this.roadWidth / 2;
    const vertexCount = (this.divisionCount + 1) * 2;
    const indexCount = this.divisionCount * 6;

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint32Array(indexCount);

    for (let i = 0; i <= this.divisionCount; i++) {
      const u = i / this.divisionCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);

      const leftVert = point.clone().addScaledVector(right, -halfWidth);
      const rightVert = point.clone().addScaledVector(right, halfWidth);

      const vi = i * 2;
      positions[vi * 3] = leftVert.x;
      positions[vi * 3 + 1] = 0.05;
      positions[vi * 3 + 2] = leftVert.z;

      positions[(vi + 1) * 3] = rightVert.x;
      positions[(vi + 1) * 3 + 1] = 0.05;
      positions[(vi + 1) * 3 + 2] = rightVert.z;

      normals[vi * 3] = 0; normals[vi * 3 + 1] = 1; normals[vi * 3 + 2] = 0;
      normals[(vi + 1) * 3] = 0; normals[(vi + 1) * 3 + 1] = 1; normals[(vi + 1) * 3 + 2] = 0;

      uvs[vi * 2] = 0; uvs[vi * 2 + 1] = u * 240;
      uvs[(vi + 1) * 2] = 1; uvs[(vi + 1) * 2 + 1] = u * 240;
    }

    let ii = 0;
    for (let i = 0; i < this.divisionCount; i++) {
      const vi = i * 2;
      indices[ii++] = vi; indices[ii++] = vi + 1; indices[ii++] = vi + 2;
      indices[ii++] = vi + 1; indices[ii++] = vi + 3; indices[ii++] = vi + 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const roadTexture = this.createDesertAsphaltTexture();
    const roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.6,
      metalness: 0.15,
      side: THREE.DoubleSide
    });

    const roadMesh = new THREE.Mesh(geometry, roadMaterial);
    roadMesh.receiveShadow = true;
    this.meshGroup.add(roadMesh);
  }

  // Natural Road-to-Sand Transition Shoulders (4.0m wide on both sides, Y = 0.048)
  buildRoadShoulders() {
    const halfWidth = this.roadWidth / 2;
    const shoulderWidth = 4.0;
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0xc49463,
      roughness: 0.95,
      metalness: 0.02
    });

    for (const side of [-1, 1]) {
      const vertexCount = (this.divisionCount + 1) * 2;
      const indexCount = this.divisionCount * 6;

      const positions = new Float32Array(vertexCount * 3);
      const normals = new Float32Array(vertexCount * 3);
      const indices = new Uint32Array(indexCount);

      for (let i = 0; i <= this.divisionCount; i++) {
        const u = i / this.divisionCount;
        const point = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const right = this.getRightVector(tangent);

        const innerPos = point.clone().addScaledVector(right, side * (halfWidth + 0.1));
        const outerPos = point.clone().addScaledVector(right, side * (halfWidth + 0.1 + shoulderWidth));

        const vi = i * 2;
        positions[vi * 3] = innerPos.x;
        positions[vi * 3 + 1] = 0.048;
        positions[vi * 3 + 2] = innerPos.z;

        positions[(vi + 1) * 3] = outerPos.x;
        positions[(vi + 1) * 3 + 1] = 0.048;
        positions[(vi + 1) * 3 + 2] = outerPos.z;

        normals[vi * 3] = 0; normals[vi * 3 + 1] = 1; normals[vi * 3 + 2] = 0;
        normals[(vi + 1) * 3] = 0; normals[(vi + 1) * 3 + 1] = 1; normals[(vi + 1) * 3 + 2] = 0;
      }

      let ii = 0;
      for (let i = 0; i < this.divisionCount; i++) {
        const vi = i * 2;
        indices[ii++] = vi; indices[ii++] = vi + 1; indices[ii++] = vi + 2;
        indices[ii++] = vi + 1; indices[ii++] = vi + 3; indices[ii++] = vi + 2;
      }

      const sGeo = new THREE.BufferGeometry();
      sGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      sGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      sGeo.setIndex(new THREE.BufferAttribute(indices, 1));

      const sMesh = new THREE.Mesh(sGeo, shoulderMat);
      sMesh.receiveShadow = true;
      this.meshGroup.add(sMesh);
    }
  }

  // 3. Yellow Center & White Lane Markings (Y = 0.052 — LOCKED)
  buildRoadMarkings() {
    const halfWidth = this.roadWidth / 2;

    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xffd21f,
      roughness: 0.4,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });

    const steps = this.divisionCount;

    const buildMarkingMesh = (offsets, width, isDashed, material) => {
      const hw = width / 2;

      offsets.forEach((offset) => {
        const vertexCount = (steps + 1) * 2;
        const positions = new Float32Array(vertexCount * 3);
        const normals = new Float32Array(vertexCount * 3);

        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const point = this.curve.getPointAt(u);
          const tangent = this.curve.getTangentAt(u).normalize();
          const right = this.getRightVector(tangent);

          const leftVert = point.clone().addScaledVector(right, offset - hw);
          const rightVert = point.clone().addScaledVector(right, offset + hw);

          const vi = i * 2;
          positions[vi * 3] = leftVert.x;
          positions[vi * 3 + 1] = 0.052;
          positions[vi * 3 + 2] = leftVert.z;

          positions[(vi + 1) * 3] = rightVert.x;
          positions[(vi + 1) * 3 + 1] = 0.052;
          positions[(vi + 1) * 3 + 2] = rightVert.z;

          normals[vi * 3] = 0; normals[vi * 3 + 1] = 1; normals[vi * 3 + 2] = 0;
          normals[(vi + 1) * 3] = 0; normals[(vi + 1) * 3 + 1] = 1; normals[(vi + 1) * 3 + 2] = 0;
        }

        const indices = [];
        for (let i = 0; i < steps; i++) {
          if (isDashed && Math.floor(i / 4) % 2 === 1) continue;

          const vi = i * 2;
          indices.push(vi, vi + 1, vi + 2);
          indices.push(vi + 1, vi + 3, vi + 2);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geo.setIndex(indices);

        const mesh = new THREE.Mesh(geo, material);
        mesh.receiveShadow = true;
        this.meshGroup.add(mesh);
      });
    };

    buildMarkingMesh([-0.18, 0.18], 0.22, false, yellowMat);
    buildMarkingMesh([-halfWidth * 0.5, halfWidth * 0.5], 0.30, true, whiteMat);
    buildMarkingMesh([-halfWidth + 0.3, halfWidth - 0.3], 0.25, false, whiteMat);
  }

  // 4. Low Curb Accents on Apexes (Y = 0.08 — LOCKED)
  buildCurbs() {
    const halfWidth = this.roadWidth / 2;
    const curbMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const curbMatWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const curbGeo = new THREE.BoxGeometry(0.5, 0.12, 1.8);

    const apexUList = [0.15, 0.38, 0.48, 0.72, 0.88];

    apexUList.forEach((u) => {
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);
      const yaw = Math.atan2(tangent.x, tangent.z);

      for (let k = -8; k <= 8; k++) {
        const offsetU = u + (k * 0.0012);
        if (offsetU < 0 || offsetU > 1) continue;
        const p = this.curve.getPointAt(offsetU);
        const t = this.curve.getTangentAt(offsetU).normalize();
        const r = this.getRightVector(t);
        const y = Math.atan2(t.x, t.z);

        const side = (u === 0.38 || u === 0.88) ? -1 : 1;
        const pos = p.clone().addScaledVector(r, side * (halfWidth + 0.25));

        const mat = Math.abs(k) % 2 === 0 ? curbMatRed : curbMatWhite;
        const curb = new THREE.Mesh(curbGeo, mat);
        curb.position.set(pos.x, 0.08, pos.z);
        curb.rotation.y = y;
        curb.receiveShadow = true;
        this.meshGroup.add(curb);
      }
    });
  }

  // 5. NATURAL SAND DUNES (MID-GROUND & DISTANT DESERT — CLEARANCE > 16.0M)
  buildSandDunes() {
    const halfWidth = this.roadWidth / 2;
    const minClearance = 16.0;

    const duneMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.9, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0xc59660, roughness: 0.88, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0xe0b182, roughness: 0.92, metalness: 0.05 })
    ];

    const duneCount = 120;

    for (let i = 0; i < duneCount; i++) {
      const u = i / duneCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);
      const yaw = Math.atan2(tangent.x, tangent.z);

      const side = (i % 2 === 0) ? 1 : -1;
      let offsetDist = halfWidth + 18.0 + (Math.sin(i * 2.7) * 0.5 + 0.5) * 60.0;
      let pos = point.clone().addScaledVector(right, side * offsetDist);

      const duneLength = 25.0 + (i % 5) * 12.0;
      const duneWidth = 15.0 + (i % 4) * 8.0;
      const duneHeight = 3.5 + (i % 6) * 2.2;
      const rotY = yaw + (Math.cos(i * 1.9) * 0.4);

      let clearance = this.getMinDistToTrack(pos.x, pos.z, duneWidth, duneLength, rotY);
      while (clearance < minClearance && offsetDist < 140.0) {
        offsetDist += 8.0;
        pos = point.clone().addScaledVector(right, side * offsetDist);
        clearance = this.getMinDistToTrack(pos.x, pos.z, duneWidth, duneLength, rotY);
      }

      if (clearance < 15.0) continue;

      const dGeo = new THREE.ConeGeometry(duneWidth, duneHeight, 8);
      dGeo.scale(1.0, 1.0, duneLength / duneWidth);
      const dMat = duneMaterials[i % duneMaterials.length];

      const dune = new THREE.Mesh(dGeo, dMat);
      dune.position.set(pos.x, duneHeight / 2 - 0.4, pos.z);
      dune.rotation.y = rotY;
      dune.rotation.z = Math.sin(i * 1.5) * 0.08;
      dune.receiveShadow = true;
      this.meshGroup.add(dune);
    }
  }

  // 6. DESERT ROCK FORMATIONS & CLUSTERED BOULDERS (CLEARANCE > 18.0M)
  buildRockFormations() {
    const halfWidth = this.roadWidth / 2;
    const minClearance = 18.0;

    const rockMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xa87b51, roughness: 0.9, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x8c5b36, roughness: 0.85, metalness: 0.15 }),
      new THREE.MeshStandardMaterial({ color: 0xb86f43, roughness: 0.92, metalness: 0.08 })
    ];

    const rockCount = 140;

    for (let i = 0; i < rockCount; i++) {
      const u = i / rockCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);

      const side = (i % 2 === 0) ? -1 : 1;
      let offsetDist = halfWidth + 20.0 + (Math.cos(i * 3.3) * 0.5 + 0.5) * 75.0;
      let pos = point.clone().addScaledVector(right, side * offsetDist);

      const scale = 1.2 + (i % 5) * 0.8;
      let clearance = this.getMinDistToTrack(pos.x, pos.z, scale * 3.5, scale * 3.5, 0);

      while (clearance < minClearance && offsetDist < 150.0) {
        offsetDist += 6.0;
        pos = point.clone().addScaledVector(right, side * offsetDist);
        clearance = this.getMinDistToTrack(pos.x, pos.z, scale * 3.5, scale * 3.5, 0);
      }

      if (clearance < 16.5) continue;

      const rGroup = new THREE.Group();
      rGroup.position.set(pos.x, 0, pos.z);
      rGroup.rotation.y = Math.sin(i * 2.1) * Math.PI;

      const rMat = rockMaterials[i % rockMaterials.length];

      // Main Central Boulder
      const mainRock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0 * scale, 1), rMat);
      mainRock.position.y = 1.2 * scale;
      mainRock.scale.set(1.1, 0.75, 0.9);
      mainRock.castShadow = true;
      mainRock.receiveShadow = true;
      rGroup.add(mainRock);

      // Satellite Rocks in Cluster
      if (i % 2 === 0) {
        const sub1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 * scale, 1), rMat);
        sub1.position.set(1.6 * scale, 0.6 * scale, 0.8 * scale);
        sub1.scale.set(0.9, 0.6, 1.0);
        sub1.castShadow = true;
        rGroup.add(sub1);

        const sub2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9 * scale, 1), rMat);
        sub2.position.set(-1.4 * scale, 0.4 * scale, -1.0 * scale);
        sub2.castShadow = true;
        rGroup.add(sub2);
      }

      this.meshGroup.add(rGroup);
    }
  }

  // 7. DISTANT DESERT MESAS & MOUNTAIN FORMATIONS (OUTER HORIZON CLEARANCE > 250.0M)
  buildDistantMesas() {
    const mesaMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x9c6644, roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: 0x7a4b2a, roughness: 0.92 }),
      new THREE.MeshStandardMaterial({ color: 0x8b5a3c, roughness: 0.90 })
    ];

    const mesaCount = 42;

    for (let i = 0; i < mesaCount; i++) {
      const u = i / mesaCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);

      const side = (i % 2 === 0) ? 1 : -1;
      let offsetDist = 320 + (i % 6) * 80;

      const width = 120 + (i % 4) * 45;
      const height = 45 + (i % 5) * 25;
      const depth = 120 + (i % 4) * 45;

      let pos = point.clone().addScaledVector(right, side * offsetDist);
      let clearance = this.getMinDistToTrack(pos.x, pos.z, width, depth, 0);

      while (clearance < 200.0 && offsetDist < 600.0) {
        offsetDist += 50.0;
        pos = point.clone().addScaledVector(right, side * offsetDist);
        clearance = this.getMinDistToTrack(pos.x, pos.z, width, depth, 0);
      }

      if (clearance < 180.0) continue;

      const mGroup = new THREE.Group();
      mGroup.position.set(pos.x, height / 2, pos.z);
      mGroup.rotation.y = (i * 0.7);

      const mMat = mesaMaterials[i % mesaMaterials.length];

      // Flat-top Mesa Body
      const mesaBody = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.35, width * 0.5, height, 8), mMat);
      mesaBody.receiveShadow = true;
      mGroup.add(mesaBody);

      // Top Plateau Cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.36, width * 0.37, 2.5, 8), mMat);
      cap.position.y = height / 2 + 1.25;
      mGroup.add(cap);

      this.meshGroup.add(mGroup);
    }
  }

  // 8. SPARSE DESERT VEGETATION (SAGUARO CACTI, JOSHUA TREES, SHRUBS — CLEARANCE > 16.0M)
  buildDesertVegetation() {
    const halfWidth = this.roadWidth / 2;
    const minClearance = 16.0;

    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.7, metalness: 0.05 });
    const joshuaTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const joshuaLeavesMat = new THREE.MeshStandardMaterial({ color: 0x4f6d42, roughness: 0.8 });
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x7a8450, roughness: 0.85 });

    const cactusTrunkGeo = new THREE.CylinderGeometry(0.25, 0.32, 4.2);
    const cactusArmGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.8);
    const shrubGeo = new THREE.DodecahedronGeometry(1.2, 1);

    const vegCount = 200;

    for (let i = 0; i < vegCount; i++) {
      const u = i / vegCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);

      const side = (i % 2 === 0) ? 1 : -1;
      let offsetDist = halfWidth + 14.0 + (Math.sin(i * 3.1) * 0.5 + 0.5) * 45.0;
      let pos = point.clone().addScaledVector(right, side * offsetDist);

      let clearance = this.getMinDistToTrack(pos.x, pos.z);
      while (clearance < minClearance && offsetDist < 90.0) {
        offsetDist += 4.0;
        pos = point.clone().addScaledVector(right, side * offsetDist);
        clearance = this.getMinDistToTrack(pos.x, pos.z);
      }

      if (clearance < 15.0) continue;

      if (i % 4 === 0) {
        // Large Saguaro Cactus
        const cGroup = new THREE.Group();
        cGroup.position.set(pos.x, 0, pos.z);
        cGroup.rotation.y = Math.sin(i * 1.7) * Math.PI;

        const trunk = new THREE.Mesh(cactusTrunkGeo, cactusMat);
        trunk.position.y = 2.1;
        trunk.castShadow = true;
        cGroup.add(trunk);

        const armL = new THREE.Mesh(cactusArmGeo, cactusMat);
        armL.position.set(-0.65, 2.6, 0);
        armL.rotation.z = Math.PI / 3;
        armL.castShadow = true;
        cGroup.add(armL);

        const armR = new THREE.Mesh(cactusArmGeo, cactusMat);
        armR.position.set(0.65, 3.1, 0);
        armR.rotation.z = -Math.PI / 3;
        armR.castShadow = true;
        cGroup.add(armR);

        this.meshGroup.add(cGroup);
      } else if (i % 4 === 1) {
        // Desert Joshua Tree
        const jGroup = new THREE.Group();
        jGroup.position.set(pos.x, 0, pos.z);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3.5), joshuaTrunkMat);
        trunk.position.y = 1.75;
        trunk.castShadow = true;
        jGroup.add(trunk);

        for (let b = 0; b < 3; b++) {
          const angle = (b * Math.PI * 2) / 3;
          const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.4), joshuaTrunkMat);
          branch.position.set(Math.sin(angle) * 0.4, 3.0, Math.cos(angle) * 0.4);
          branch.rotation.z = Math.sin(angle) * 0.5;
          jGroup.add(branch);

          const leafCluster = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), joshuaLeavesMat);
          leafCluster.position.set(Math.sin(angle) * 0.8, 3.7, Math.cos(angle) * 0.8);
          leafCluster.castShadow = true;
          jGroup.add(leafCluster);
        }

        this.meshGroup.add(jGroup);
      } else {
        // Desert Shrub / Scrub Bush
        const shrub = new THREE.Mesh(shrubGeo, shrubMat);
        shrub.position.set(pos.x, 0.6, pos.z);
        shrub.scale.set(1.0 + (i % 3) * 0.3, 0.7 + (i % 2) * 0.2, 1.0 + (i % 3) * 0.3);
        shrub.castShadow = true;
        this.meshGroup.add(shrub);
      }
    }
  }

  // 9. Start Area Presentation (u = 0.0 — LOCKED)
  buildStartArea() {
    const startPoint = this.curve.getPointAt(0);
    const startTangent = this.curve.getTangentAt(0).normalize();
    const startYaw = Math.atan2(startTangent.x, startTangent.z);

    // Start Line Decal
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 12; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
        ctx.fillRect(c * (256 / 12), r * 32, 256 / 12, 32);
      }
    }

    const checkerTexture = new THREE.CanvasTexture(canvas);
    const startGeo = new THREE.PlaneGeometry(this.roadWidth - 0.2, 5.0);
    const startMat = new THREE.MeshStandardMaterial({ map: checkerTexture, roughness: 0.4, side: THREE.DoubleSide });
    const startMesh = new THREE.Mesh(startGeo, startMat);
    startMesh.rotation.x = -Math.PI / 2;
    startMesh.rotation.z = startYaw - Math.PI / 2;
    startMesh.position.set(startPoint.x, 0.06, startPoint.z);
    this.meshGroup.add(startMesh);

    // Overhead START Gantry Arch
    const archGroup = new THREE.Group();
    archGroup.position.set(startPoint.x, 0, startPoint.z);
    archGroup.rotation.y = startYaw;

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const yellowAccentMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const bannerWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

    const pL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9.5, 1.4), metalMat);
    pL.position.set(-this.roadWidth / 2 - 2.5, 4.75, 0);
    pL.castShadow = true;
    archGroup.add(pL);

    const pR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9.5, 1.4), metalMat);
    pR.position.set(this.roadWidth / 2 + 2.5, 4.75, 0);
    pR.castShadow = true;
    archGroup.add(pR);

    const header = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 6.0, 1.6, 1.2), metalMat);
    header.position.set(0, 8.8, 0);
    header.castShadow = true;
    archGroup.add(header);

    const banner = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 4.5, 1.2, 1.25), bannerWhiteMat);
    banner.position.set(0, 8.8, 0);
    archGroup.add(banner);

    const strip = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 5.8, 0.2, 1.3), yellowAccentMat);
    strip.position.set(0, 7.9, 0);
    archGroup.add(strip);

    this.meshGroup.add(archGroup);
  }

  // 10. Finish Area Presentation (u = 1.0 — Separate Endpoint, FINISH Gantry — LOCKED)
  buildFinishArea() {
    const finishPoint = this.curve.getPointAt(1.0);
    const finishTangent = this.curve.getTangentAt(1.0).normalize();
    const finishYaw = Math.atan2(finishTangent.x, finishTangent.z);

    // Finish Line Decal
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 12; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#ef4444';
        ctx.fillRect(c * (256 / 12), r * 32, 256 / 12, 32);
      }
    }

    const finishTexture = new THREE.CanvasTexture(canvas);
    const finishGeo = new THREE.PlaneGeometry(this.roadWidth - 0.2, 5.0);
    const finishMat = new THREE.MeshStandardMaterial({ map: finishTexture, roughness: 0.4, side: THREE.DoubleSide });
    const finishMesh = new THREE.Mesh(finishGeo, finishMat);
    finishMesh.rotation.x = -Math.PI / 2;
    finishMesh.rotation.z = finishYaw - Math.PI / 2;
    finishMesh.position.set(finishPoint.x, 0.06, finishPoint.z);
    this.meshGroup.add(finishMesh);

    // Overhead FINISH Gantry Board
    const gantryGroup = new THREE.Group();
    gantryGroup.position.set(finishPoint.x, 0, finishPoint.z);
    gantryGroup.rotation.y = finishYaw;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const redAccentMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });

    // Pillars
    const pL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 10.0, 1.6), frameMat);
    pL.position.set(-this.roadWidth / 2 - 2.8, 5.0, 0);
    pL.castShadow = true;
    gantryGroup.add(pL);

    const pR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 10.0, 1.6), frameMat);
    pR.position.set(this.roadWidth / 2 + 2.8, 5.0, 0);
    pR.castShadow = true;
    gantryGroup.add(pR);

    // Header Frame
    const header = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 6.5, 2.4, 1.4), frameMat);
    header.position.set(0, 9.2, 0);
    header.castShadow = true;
    gantryGroup.add(header);

    // FINISH Canvas Banner Texture
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 1024;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');

    bCtx.fillStyle = '#0f172a';
    bCtx.fillRect(0, 0, 1024, 256);

    // Checkered End Bands
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        bCtx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#ef4444';
        bCtx.fillRect(c * 24, r * 64, 24, 64);
        bCtx.fillRect(1024 - (c + 1) * 24, r * 64, 24, 64);
      }
    }

    // Border
    bCtx.strokeStyle = '#ef4444';
    bCtx.lineWidth = 12;
    bCtx.strokeRect(100, 10, 824, 236);

    // Bold FINISH Text
    bCtx.fillStyle = '#ffffff';
    bCtx.font = '900 110px Inter, Arial, sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('FINISH', 512, 165);

    const bTex = new THREE.CanvasTexture(bCanvas);
    const bMat = new THREE.MeshStandardMaterial({ map: bTex, roughness: 0.3, side: THREE.DoubleSide });

    const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 4.8, 2.0, 1.45), bMat);
    bannerMesh.position.set(0, 9.2, 0);
    gantryGroup.add(bannerMesh);

    // Red Bottom Trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 6.2, 0.3, 1.5), redAccentMat);
    trim.position.set(0, 7.85, 0);
    gantryGroup.add(trim);

    this.meshGroup.add(gantryGroup);
  }

  getCenterlineCurve() {
    return this.curve;
  }

  getRoadWidth() {
    return this.roadWidth;
  }

  getMesh() {
    return this.meshGroup;
  }
}
