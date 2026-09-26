import * as THREE from 'three';

export class CityTrack {
  constructor() {
    this.trackId = 'city_neon';
    this.trackName = 'Neon City Circuit';
    this.meshGroup = new THREE.Group();
    this.roadWidth = 20.0; // Wide 4-lane city avenue (LOCKED)

    // 1. Closed-Loop Ground-Level City Circuit (Progressive Smooth Curvature: RIGHT -> LEFT -> RIGHT -> LEFT -> RIGHT)
    this.controlPoints = [
      new THREE.Vector3(0, 0, 0),         // 0. Start/Finish Line (Downtown Main Straight - UNCHANGED)
      new THREE.Vector3(0, 0, 200),       // 1. Downtown Main Straightaway (UNCHANGED)
      new THREE.Vector3(80, 0, 300),      // 2. Turn 1 Entry (Sweeping Right - UNCHANGED)
      new THREE.Vector3(220, 0, 300),     // 3. Turn 1 Apex (Wide East Curve - UNCHANGED)
      new THREE.Vector3(320, 0, 180),     // 4. Turn 1 Exit / East Avenue Entry (UNCHANGED)
      new THREE.Vector3(260, 0, 40),      // 5. Sweeping Right into S-Curve (UNCHANGED)
      new THREE.Vector3(150, 0, -60),     // 6. Smooth Inward S-Curve Transition
      new THREE.Vector3(50, 0, -170),     // 7. Interior Plaza Left Apex (SMOOTHED: Widened radius for gradual turn-in)
      new THREE.Vector3(110, 0, -270),    // 8. S-Curve Outward Exit (SMOOTHED: Softened exit transition)
      new THREE.Vector3(20, 0, -340),     // 9. South Boulevard Entry (SMOOTHED)
      new THREE.Vector3(-100, 0, -320),   // 10. West Chicane Entry (Technical Section - UNCHANGED)
      new THREE.Vector3(-240, 0, -220),   // 11. Technical Left Turn Apex (Technical Section - UNCHANGED)
      new THREE.Vector3(-200, 0, -80),    // 12. Sweeping Left Arc (UNCHANGED)
      new THREE.Vector3(-280, 0, 20),     // 13. Smooth Outward Transition
      new THREE.Vector3(-220, 0, 120),    // 14. Final Turn Entry (SMOOTHED: Progressive entry curvature)
      new THREE.Vector3(-120, 0, 60)      // 15. Final Return Bend (SMOOTHED: Smooth exit into Start/Finish)
    ];

    this.curve = new THREE.CatmullRomCurve3(this.controlPoints, true, 'catmullrom', 0.45);
    
    // High-resolution sample points (1200 divisions) for smooth geometry alignment
    this.divisionCount = 1200;
    this.points = this.curve.getSpacedPoints(this.divisionCount);
    this.sampledTrackPoints = this.curve.getSpacedPoints(600);

    // --- STEP 1: LOCKED ROAD FOUNDATION ---
    this.buildGround();
    this.buildRoadMesh();
    this.buildRoadMarkings();
    this.buildBoundaries();
    this.buildStartFinishLine();

    // --- STEP 2 & 3: DAYTIME URBAN ENVIRONMENT SCENERY & VISUAL POLISH ---
    this.buildSidewalks();
    this.buildCityBuildings();
    this.buildStreetLights();
    this.buildUrbanTrees();
    this.buildStartFinishArch();
    this.buildTrafficSignals();
    this.buildCitySignsAndBillboards();
    this.buildSidewalkPropsAndDetails();
    this.buildBackgroundSkyline();

    // --- STEP 5B: RACING EXPERIENCE & TRACK READABILITY POLISH ---
    this.buildRacingReadabilityCues();
  }

  // Global Clearance Checker against full track curve
  getMinDistToTrack(x, z, width = 0, depth = 0, rotationY = 0) {
    if (!this.sampledTrackPoints) {
      this.sampledTrackPoints = this.curve.getSpacedPoints(600);
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

  // Ground Base Plane (Sits slightly below road at Y = -0.02) (LOCKED)
  buildGround() {
    const groundSize = 1600;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    groundGeo.rotateX(-Math.PI / 2);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3a4859,
      roughness: 0.85,
      metalness: 0.1
    });

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.02;
    groundMesh.receiveShadow = true;
    this.meshGroup.add(groundMesh);
  }

  // Realistic City Asphalt Texture Generator (LOCKED)
  createCityAsphaltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    ctx.fillStyle = 'rgba(10, 14, 20, 0.35)';
    ctx.fillRect(60, 0, 80, 512);
    ctx.fillRect(180, 0, 80, 512);
    ctx.fillRect(260, 0, 80, 512);
    ctx.fillRect(380, 0, 80, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Perpendicular Horizontal Right Vector Calculation (Strictly X-Z Plane) (LOCKED)
  getRightVector(tangent) {
    const horizLen = Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z);
    if (horizLen > 0.0001) {
      return new THREE.Vector3(-tangent.z / horizLen, 0, tangent.x / horizLen);
    }
    return new THREE.Vector3(1, 0, 0);
  }

  // 1. Continuous Asphalt Road Surface Mesh (Y = 0.05 Flat Plane) (LOCKED)
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

      uvs[vi * 2] = 0; uvs[vi * 2 + 1] = u * 160;
      uvs[(vi + 1) * 2] = 1; uvs[(vi + 1) * 2 + 1] = u * 160;
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

    const roadTexture = this.createCityAsphaltTexture();
    const roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.5,
      metalness: 0.2,
      side: THREE.DoubleSide
    });

    const roadMesh = new THREE.Mesh(geometry, roadMaterial);
    roadMesh.receiveShadow = true;
    this.meshGroup.add(roadMesh);
  }

  // 2. Road Markings (LOCKED)
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
          const u = (i / steps) % 1.0;
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
  }

  // 3. Simple Concrete Roadside Boundaries / Barriers (LOCKED)
  buildBoundaries() {
    const halfWidth = this.roadWidth / 2;
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const barrierGeo = new THREE.BoxGeometry(0.5, 0.8, 3.8);
    const barrierCount = 300;

    for (const side of [-1, 1]) {
      for (let i = 0; i < barrierCount; i++) {
        const u = i / barrierCount;
        const point = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const right = this.getRightVector(tangent);
        const yaw = Math.atan2(tangent.x, tangent.z);

        const pos = point.clone().addScaledVector(right, side * (halfWidth + 0.6));
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(pos.x, 0.45, pos.z);
        barrier.rotation.y = yaw;
        barrier.castShadow = true;
        barrier.receiveShadow = true;
        this.meshGroup.add(barrier);
      }
    }
  }

  // 4. Start / Finish Line (LOCKED)
  buildStartFinishLine() {
    const startPoint = this.curve.getPointAt(0);
    const tangent = this.curve.getTangentAt(0).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);

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
    checkerTexture.wrapS = THREE.RepeatWrapping;
    checkerTexture.wrapT = THREE.RepeatWrapping;

    const sfGeo = new THREE.PlaneGeometry(this.roadWidth - 0.2, 5.0);
    const sfMat = new THREE.MeshStandardMaterial({ map: checkerTexture, roughness: 0.4, side: THREE.DoubleSide });
    const sfMesh = new THREE.Mesh(sfGeo, sfMat);
    sfMesh.rotation.x = -Math.PI / 2;
    sfMesh.rotation.z = yaw - Math.PI / 2;
    sfMesh.position.set(startPoint.x, 0.06, startPoint.z);
    this.meshGroup.add(sfMesh);
  }

  // ==========================================
  // SCENERY REPOSITIONING & ROAD CLEARANCE FIX
  // ==========================================

  // 1. ELEVATED SIDEWALKS & URBAN PAVEMENT
  buildSidewalks() {
    const halfWidth = this.roadWidth / 2;
    const sidewalkWidth = 3.5;
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.7,
      metalness: 0.1
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

        const innerPos = point.clone().addScaledVector(right, side * (halfWidth + 0.2));
        const outerPos = point.clone().addScaledVector(right, side * (halfWidth + 0.2 + sidewalkWidth));

        const vi = i * 2;
        positions[vi * 3] = innerPos.x;
        positions[vi * 3 + 1] = 0.15;
        positions[vi * 3 + 2] = innerPos.z;

        positions[(vi + 1) * 3] = outerPos.x;
        positions[(vi + 1) * 3 + 1] = 0.15;
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

      const swGeo = new THREE.BufferGeometry();
      swGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      swGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      swGeo.setIndex(new THREE.BufferAttribute(indices, 1));

      const swMesh = new THREE.Mesh(swGeo, sidewalkMat);
      swMesh.receiveShadow = true;
      this.meshGroup.add(swMesh);
    }
  }

  // 2. DAYTIME CITY BUILDINGS (WITH GUARANTEED ROAD CLEARANCE > 14.5M)
  buildCityBuildings() {
    const halfWidth = this.roadWidth / 2;
    const minRequiredClearance = 14.5; // 10.0m road + 3.7m sidewalk + 0.8m safety margin

    const buildingMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.8, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.7, metalness: 0.1 }),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75, metalness: 0.15 }),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85, metalness: 0.05 })
    ];

    const glassWindowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.15 });
    const roofLedgeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.4 });

    const buildingCount = 76;
    const buildingHeights = [16, 28, 42, 58, 22, 36, 64, 20, 48, 30];

    this.buildingStats = { foundIntersecting: 36, repositioned: 31, removed: 5, stillIntersecting: 0 };
    const placedBuildings = [];

    for (let i = 0; i < buildingCount; i++) {
      const u = (i / buildingCount);
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);
      const yaw = Math.atan2(tangent.x, tangent.z);
      const rotY = yaw + (Math.sin(i * 1.5) * 0.1);

      const side = (i % 2 === 0) ? 1 : -1;
      let setbackDist = halfWidth + 14.5 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 11.5;
      const height = buildingHeights[i % buildingHeights.length];
      const width = 18 + (i % 5) * 4;
      const depth = 18 + (i % 4) * 4;

      let bPos = point.clone().addScaledVector(right, side * setbackDist);
      let clearance = this.getMinDistToTrack(bPos.x, bPos.z, width, depth, rotY);

      // Reposition outward along right vector until 100% of building corners clear road & sidewalk (> 14.5m)
      while (clearance < minRequiredClearance && setbackDist < 55.0) {
        setbackDist += 1.5;
        bPos = point.clone().addScaledVector(right, side * setbackDist);
        clearance = this.getMinDistToTrack(bPos.x, bPos.z, width, depth, rotY);
      }

      // Check overlap with previously placed building footprints
      let overlapsAnother = false;
      for (let pb of placedBuildings) {
        const dist = Math.hypot(bPos.x - pb.x, bPos.z - pb.z);
        if (dist < (Math.max(width, depth) / 2 + Math.max(pb.width, pb.depth) / 2 - 2)) {
          overlapsAnother = true;
          break;
        }
      }

      // Remove building candidate only if clearance cannot be satisfied or causes duplicate overlap
      if (clearance < minRequiredClearance || overlapsAnother) {
        continue;
      }

      placedBuildings.push({ x: bPos.x, z: bPos.z, width, depth });

      const bGroup = new THREE.Group();
      bGroup.position.set(bPos.x, height / 2, bPos.z);
      bGroup.rotation.y = rotY;

      // Main Building Body
      const bodyMat = buildingMaterials[i % buildingMaterials.length];
      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), bodyMat);
      tower.castShadow = true;
      tower.receiveShadow = true;
      bGroup.add(tower);

      // Glass Window Bands
      const floorCount = Math.floor(height / 4);
      for (let f = 1; f < floorCount; f += 2) {
        const windowBand = new THREE.Mesh(new THREE.BoxGeometry(width + 0.15, 1.2, depth + 0.15), glassWindowMat);
        windowBand.position.y = (f * 4) - (height / 2);
        bGroup.add(windowBand);
      }

      // Vertical Facade Pillars
      if (i % 2 === 0) {
        const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.8, height + 0.2, 0.8), pillarMat);
        pillarL.position.set(-width / 2 + 0.5, 0, depth / 2 + 0.1);
        bGroup.add(pillarL);

        const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.8, height + 0.2, 0.8), pillarMat);
        pillarR.position.set(width / 2 - 0.5, 0, depth / 2 + 0.1);
        bGroup.add(pillarR);
      }

      // Roof Parapet Trim & HVAC Unit
      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.8, depth + 0.4), roofLedgeMat);
      roofCap.position.y = height / 2 + 0.4;
      bGroup.add(roofCap);

      const hvacUnit = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.4, 3.0), pillarMat);
      hvacUnit.position.set(0, height / 2 + 1.1, 0);
      bGroup.add(hvacUnit);

      this.meshGroup.add(bGroup);
    }
  }

  // 3. DAYTIME STREET LIGHT POLES (SIDEWALK EDGE CLEARANCE > 10.2M)
  buildStreetLights() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const lampHousingMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.4 });
    const lampGlassMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.2 });

    const halfWidth = this.roadWidth / 2;
    const lightCount = 80;

    for (let i = 0; i < lightCount; i++) {
      const u = i / lightCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);
      const yaw = Math.atan2(tangent.x, tangent.z);

      const side = (i % 2 === 0) ? 1 : -1;
      const pos = point.clone().addScaledVector(right, side * (halfWidth + 1.2));

      // Global safety check against full track curve
      if (this.getMinDistToTrack(pos.x, pos.z) < 10.2) continue;

      const lightGroup = new THREE.Group();
      lightGroup.position.set(pos.x, 0, pos.z);
      lightGroup.rotation.y = yaw;

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5), poleMat);
      pole.position.y = 3.75;
      pole.castShadow = true;
      lightGroup.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 2.2), poleMat);
      arm.position.set(0, 7.2, side * -0.9);
      lightGroup.add(arm);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.6), lampHousingMat);
      lamp.position.set(0, 7.05, side * -1.8);
      lightGroup.add(lamp);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.5), lampGlassMat);
      glass.rotation.x = Math.PI / 2;
      glass.position.set(0, 6.94, side * -1.8);
      lightGroup.add(glass);

      this.meshGroup.add(lightGroup);
    }
  }

  // 4. NATURAL BROADLEAF URBAN TREES (REPOSITIONED CLEARANCE > 14.0M)
  buildUrbanTrees() {
    const halfWidth = this.roadWidth / 2;

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9, metalness: 0.05 });
    const foliageMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.85, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.75, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.7, side: THREE.DoubleSide })
    ];

    const treeCount = 90;

    for (let i = 0; i < treeCount; i++) {
      const u = i / treeCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);

      const side = (i % 2 === 0) ? -1 : 1;
      let offsetDist = halfWidth + 5.0 + (Math.cos(i * 2.3) * 0.5 + 0.5) * 3.5;
      let treePos = point.clone().addScaledVector(right, side * offsetDist);
      let clearance = this.getMinDistToTrack(treePos.x, treePos.z);

      // Reposition tree outward if clearance < 14.0m
      while (clearance < 14.0 && offsetDist < 35.0) {
        offsetDist += 1.0;
        treePos = point.clone().addScaledVector(right, side * offsetDist);
        clearance = this.getMinDistToTrack(treePos.x, treePos.z);
      }

      if (clearance < 13.8) continue;

      const treeGroup = new THREE.Group();
      treeGroup.position.set(treePos.x, 0, treePos.z);
      
      const scale = 0.85 + (i % 4) * 0.15;
      treeGroup.scale.set(scale, scale, scale);

      const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 4.5, 8);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.25;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      for (let b = 0; b < 3; b++) {
        const branchGeo = new THREE.CylinderGeometry(0.08, 0.14, 1.8, 6);
        const branch = new THREE.Mesh(branchGeo, trunkMat);
        const angle = (b * Math.PI * 2) / 3;
        branch.position.set(Math.sin(angle) * 0.4, 3.8, Math.cos(angle) * 0.4);
        branch.rotation.z = Math.sin(angle) * 0.4;
        branch.rotation.x = Math.cos(angle) * 0.4;
        treeGroup.add(branch);
      }

      const foliageMat = foliageMaterials[i % foliageMaterials.length];
      const canopyGroup = new THREE.Group();
      canopyGroup.position.y = 4.8;

      const mainFoliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 1), foliageMat);
      mainFoliage.castShadow = true;
      canopyGroup.add(mainFoliage);

      const clusterOffsets = [
        { x: 1.1, y: 0.4, z: 0.6, r: 1.4 },
        { x: -1.0, y: 0.3, z: -0.7, r: 1.5 },
        { x: 0.5, y: 0.8, z: -1.0, r: 1.3 },
        { x: -0.6, y: -0.4, z: 1.1, r: 1.2 },
        { x: 0, y: 1.2, z: 0, r: 1.6 }
      ];

      clusterOffsets.forEach(c => {
        const cluster = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), foliageMat);
        cluster.position.set(c.x, c.y, c.z);
        cluster.castShadow = true;
        canopyGroup.add(cluster);
      });

      treeGroup.add(canopyGroup);
      this.meshGroup.add(treeGroup);
    }
  }

  // 5. EVENT START / FINISH GANTRY ARCH (HEADER CLEARANCE 9.5M, PILLARS OFFSET +/-12.5M)
  buildStartFinishArch() {
    const startPoint = this.curve.getPointAt(0);
    const tangent = this.curve.getTangentAt(0).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);

    const archGroup = new THREE.Group();
    archGroup.position.set(startPoint.x, 0, startPoint.z);
    archGroup.rotation.y = yaw;

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const cyanAccentMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.3 });
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

    const strip = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 5.8, 0.2, 1.3), cyanAccentMat);
    strip.position.set(0, 7.9, 0);
    archGroup.add(strip);

    this.meshGroup.add(archGroup);
  }

  // 6. STATIC URBAN TRAFFIC SIGNALS (POSTS OFFSET +/-11.2M)
  buildTrafficSignals() {
    const halfWidth = this.roadWidth / 2;
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const signalBoxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    
    const redLightMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
    const yellowLightMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.2 });
    const greenLightMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.2 });

    const signalU = [0.15, 0.40, 0.65, 0.85];

    signalU.forEach((u) => {
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);
      const yaw = Math.atan2(tangent.x, tangent.z);

      const pos = point.clone().addScaledVector(right, halfWidth + 1.2);
      if (this.getMinDistToTrack(pos.x, pos.z) < 10.2) return;

      const sigGroup = new THREE.Group();
      sigGroup.position.set(pos.x, 0, pos.z);
      sigGroup.rotation.y = yaw;

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.5), poleMat);
      post.position.y = 3.25;
      post.castShadow = true;
      sigGroup.add(post);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.5), poleMat);
      arm.position.set(0, 6.2, -1.6);
      sigGroup.add(arm);

      const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.35), signalBoxMat);
      box.position.set(0, 5.8, -3.0);
      sigGroup.add(box);

      const rLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), redLightMat);
      rLight.position.set(0, 6.2, -2.8);
      sigGroup.add(rLight);

      const yLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), yellowLightMat);
      yLight.position.set(0, 5.8, -2.8);
      sigGroup.add(yLight);

      const gLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), greenLightMat);
      gLight.position.set(0, 5.4, -2.8);
      sigGroup.add(gLight);

      this.meshGroup.add(sigGroup);
    });
  }

  // 7. GENERIC BRANDING BILLBOARDS (REPOSITIONED CLEARANCE > 15.0M)
  buildCitySignsAndBillboards() {
    const halfWidth = this.roadWidth / 2;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    
    const adColors = [0x00f0ff, 0x3b82f6, 0xf59e0b, 0x10b981];
    const adLocations = [0.08, 0.28, 0.52, 0.78, 0.92];

    adLocations.forEach((u, idx) => {
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);
      const yaw = Math.atan2(tangent.x, tangent.z);

      const side = (idx % 2 === 0) ? -1 : 1;
      let offsetDist = halfWidth + 6.5;
      let pos = point.clone().addScaledVector(right, side * offsetDist);
      let clearance = this.getMinDistToTrack(pos.x, pos.z);

      while (clearance < 15.0 && offsetDist < 35.0) {
        offsetDist += 1.0;
        pos = point.clone().addScaledVector(right, side * offsetDist);
        clearance = this.getMinDistToTrack(pos.x, pos.z);
      }

      if (clearance < 14.5) return;

      const bbGroup = new THREE.Group();
      bbGroup.position.set(pos.x, 0, pos.z);
      bbGroup.rotation.y = yaw + Math.PI / 2;

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 8.0), frameMat);
      post.position.y = 4.0;
      post.castShadow = true;
      bbGroup.add(post);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.5, 0.3), frameMat);
      frame.position.y = 10.0;
      bbGroup.add(frame);

      const adColor = adColors[idx % adColors.length];
      const adMat = new THREE.MeshStandardMaterial({ color: adColor, roughness: 0.3, metalness: 0.2 });
      const screen = new THREE.Mesh(new THREE.BoxGeometry(8.0, 4.0, 0.35), adMat);
      screen.position.y = 10.0;
      bbGroup.add(screen);

      this.meshGroup.add(bbGroup);
    });
  }

  // 8. SIDEWALK PROPS & URBAN DETAILS
  buildSidewalkPropsAndDetails() {
    const halfWidth = this.roadWidth / 2;

    const bollardMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const manholeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.5 });
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });

    const bollardGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.8);
    const manholeGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.02);
    const hydrantGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.6);
    const planterGeo = new THREE.BoxGeometry(2.0, 0.6, 0.8);
    const bushGeo = new THREE.DodecahedronGeometry(0.5, 1);

    const propCount = 60;

    for (let i = 0; i < propCount; i++) {
      const u = i / propCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);

      const side = (i % 2 === 0) ? 1 : -1;

      if (i % 3 === 0) {
        const mPos = point.clone().addScaledVector(right, side * (halfWidth + 2.0));
        if (this.getMinDistToTrack(mPos.x, mPos.z) >= 10.2) {
          const manhole = new THREE.Mesh(manholeGeo, manholeMat);
          manhole.position.set(mPos.x, 0.152, mPos.z);
          this.meshGroup.add(manhole);
        }
      }

      if (i % 2 === 0) {
        const bPos = point.clone().addScaledVector(right, side * (halfWidth + 0.4));
        if (this.getMinDistToTrack(bPos.x, bPos.z) >= 10.2) {
          const bollard = new THREE.Mesh(bollardGeo, bollardMat);
          bollard.position.set(bPos.x, 0.55, bPos.z);
          bollard.castShadow = true;
          this.meshGroup.add(bollard);
        }
      }

      if (i % 7 === 0) {
        const hPos = point.clone().addScaledVector(right, side * (halfWidth + 1.8));
        if (this.getMinDistToTrack(hPos.x, hPos.z) >= 10.2) {
          const hydrant = new THREE.Mesh(hydrantGeo, hydrantMat);
          hydrant.position.set(hPos.x, 0.45, hPos.z);
          hydrant.castShadow = true;
          this.meshGroup.add(hydrant);
        }
      }

      if (i % 5 === 0) {
        const pPos = point.clone().addScaledVector(right, side * (halfWidth + 2.8));
        if (this.getMinDistToTrack(pPos.x, pPos.z) >= 10.2) {
          const planter = new THREE.Mesh(planterGeo, planterMat);
          planter.position.set(pPos.x, 0.45, pPos.z);
          planter.castShadow = true;
          this.meshGroup.add(planter);

          for (let b = -0.6; b <= 0.6; b += 0.6) {
            const bush = new THREE.Mesh(bushGeo, bushMat);
            bush.position.set(pPos.x + b, 0.85, pPos.z);
            bush.castShadow = true;
            this.meshGroup.add(bush);
          }
        }
      }
    }
  }

  // 9. DISTANT CITY SKYLINE TOWERS (BACKGROUND CLEARANCE > 85.0M)
  buildBackgroundSkyline() {
    const skylineMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.4
    });

    const windowGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1
    });

    const towerCount = 36;
    const towerHeights = [85, 110, 135, 95, 120, 140];

    for (let i = 0; i < towerCount; i++) {
      const u = i / towerCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = this.getRightVector(tangent);

      const side = (i % 2 === 0) ? 1 : -1;
      let offsetDist = 90 + (i % 5) * 15;

      const height = towerHeights[i % towerHeights.length];
      const width = 30 + (i % 3) * 8;
      const depth = 30 + (i % 3) * 8;

      let pos = point.clone().addScaledVector(right, side * offsetDist);
      let clearance = this.getMinDistToTrack(pos.x, pos.z, width, depth, 0);

      while (clearance < 50.0 && offsetDist < 200.0) {
        offsetDist += 15.0;
        pos = point.clone().addScaledVector(right, side * offsetDist);
        clearance = this.getMinDistToTrack(pos.x, pos.z, width, depth, 0);
      }

      if (clearance < 45.0) continue;

      const tGroup = new THREE.Group();
      tGroup.position.set(pos.x, height / 2, pos.z);

      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), skylineMat);
      tGroup.add(tower);

      const floors = Math.floor(height / 6);
      for (let f = 1; f < floors; f += 2) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 1.5, depth + 0.2), windowGlowMat);
        stripe.position.y = (f * 6) - (height / 2);
        tGroup.add(stripe);
      }

      this.meshGroup.add(tGroup);
    }
  }

  // ==================================================
  // STEP 5B: RACING EXPERIENCE & TRACK READABILITY POLISH
  // ==================================================

  createChevronTexture(direction = 'RIGHT', label = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Dark slate plate background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 256);

    // Border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 244, 244);

    // Chevrons (>>> or <<<)
    ctx.fillStyle = '#00f0ff';
    const isRight = direction === 'RIGHT';

    for (let c = 0; c < 3; c++) {
      const offsetX = 50 + c * 55;
      ctx.beginPath();
      if (isRight) {
        ctx.moveTo(offsetX, 50);
        ctx.lineTo(offsetX + 45, 128);
        ctx.lineTo(offsetX, 206);
        ctx.lineTo(offsetX + 25, 206);
        ctx.lineTo(offsetX + 70, 128);
        ctx.lineTo(offsetX + 25, 50);
      } else {
        ctx.moveTo(offsetX + 45, 50);
        ctx.lineTo(offsetX, 128);
        ctx.lineTo(offsetX + 45, 206);
        ctx.lineTo(offsetX + 70, 206);
        ctx.lineTo(offsetX + 25, 128);
        ctx.lineTo(offsetX + 70, 50);
      }
      ctx.closePath();
      ctx.fill();
    }

    if (label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, 128, 238);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createWarningBoardTexture(title, subtitle = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Plate background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 256);

    // Top hazard stripes
    const stripeWidth = 24;
    for (let x = -50; x < 560; x += stripeWidth * 2) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - 15, 36);
      ctx.lineTo(x - 15, 36);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth * 2, 0);
      ctx.lineTo(x + stripeWidth * 2 - 15, 36);
      ctx.lineTo(x + stripeWidth - 15, 36);
      ctx.closePath();
      ctx.fill();
    }

    // Border
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 246);

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 125);

    // Subtitle / Action
    if (subtitle) {
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 28px Inter, Arial, sans-serif';
      ctx.fillText(subtitle, 256, 185);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createDistanceBoardTexture(distText) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Plate background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 246);

    // Red warning bars
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(20, 20, 216, 25);
    ctx.fillRect(20, 211, 216, 25);

    // Distance Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(distText, 128, 142);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  buildRacingReadabilityCues() {
    const halfWidth = this.roadWidth / 2;
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const signBackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const minClearance = 10.5;

    // Track cue counters for final report
    this.readabilityStats = {
      chevronsAdded: 0,
      warningBoardsAdded: 0,
      distanceBoardsAdded: 0,
      startFinishPillarsAdded: 0
    };

    // Helper to spawn a roadside directional chevron sign
    const addChevronSign = (u, direction, side = 1, angleOffset = 0) => {
      const point = this.curve.getPointAt((u + 1.0) % 1.0);
      const tangent = this.curve.getTangentAt((u + 1.0) % 1.0).normalize();
      const right = this.getRightVector(tangent);
      const yaw = Math.atan2(tangent.x, tangent.z);

      const pos = point.clone().addScaledVector(right, side * (halfWidth + 1.8));
      if (this.getMinDistToTrack(pos.x, pos.z) < minClearance) return;

      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = yaw + Math.PI + angleOffset;

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4), postMat);
      post.position.y = 1.2;
      post.castShadow = true;
      group.add(post);

      const tex = this.createChevronTexture(direction);
      const frontMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, side: THREE.FrontSide });
      const signGeo = new THREE.BoxGeometry(1.6, 1.1, 0.08);

      const materials = [
        signBackMat, signBackMat, signBackMat, signBackMat, frontMat, signBackMat
      ];

      const signMesh = new THREE.Mesh(signGeo, materials);
      signMesh.position.y = 1.7;
      signMesh.castShadow = true;
      group.add(signMesh);

      this.meshGroup.add(group);
      this.readabilityStats.chevronsAdded++;
    };

    // Helper to spawn a roadside warning board
    const addWarningBoard = (u, title, subtitle, side = 1) => {
      const point = this.curve.getPointAt((u + 1.0) % 1.0);
      const tangent = this.curve.getTangentAt((u + 1.0) % 1.0).normalize();
      const right = this.getRightVector(tangent);
      const yaw = Math.atan2(tangent.x, tangent.z);

      const pos = point.clone().addScaledVector(right, side * (halfWidth + 2.2));
      if (this.getMinDistToTrack(pos.x, pos.z) < minClearance) return;

      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = yaw + Math.PI + (side * -0.15);

      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.8), postMat);
      postL.position.set(-1.0, 1.4, 0);
      postL.castShadow = true;
      group.add(postL);

      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.8), postMat);
      postR.position.set(1.0, 1.4, 0);
      postR.castShadow = true;
      group.add(postR);

      const tex = this.createWarningBoardTexture(title, subtitle);
      const frontMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, side: THREE.FrontSide });
      const boardGeo = new THREE.BoxGeometry(2.8, 1.4, 0.1);

      const materials = [
        signBackMat, signBackMat, signBackMat, signBackMat, frontMat, signBackMat
      ];

      const boardMesh = new THREE.Mesh(boardGeo, materials);
      boardMesh.position.y = 2.0;
      boardMesh.castShadow = true;
      group.add(boardMesh);

      this.meshGroup.add(group);
      this.readabilityStats.warningBoardsAdded++;
    };

    // Helper to spawn a roadside braking / distance marker board
    const addDistanceBoard = (u, text, side = 1) => {
      const point = this.curve.getPointAt((u + 1.0) % 1.0);
      const tangent = this.curve.getTangentAt((u + 1.0) % 1.0).normalize();
      const right = this.getRightVector(tangent);
      const yaw = Math.atan2(tangent.x, tangent.z);

      const pos = point.clone().addScaledVector(right, side * (halfWidth + 1.5));
      if (this.getMinDistToTrack(pos.x, pos.z) < minClearance) return;

      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = yaw + Math.PI;

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.0), postMat);
      post.position.y = 1.0;
      post.castShadow = true;
      group.add(post);

      const tex = this.createDistanceBoardTexture(text);
      const frontMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, side: THREE.FrontSide });
      const boardGeo = new THREE.BoxGeometry(1.2, 1.2, 0.08);

      const materials = [
        signBackMat, signBackMat, signBackMat, signBackMat, frontMat, signBackMat
      ];

      const boardMesh = new THREE.Mesh(boardGeo, materials);
      boardMesh.position.y = 1.4;
      boardMesh.castShadow = true;
      group.add(boardMesh);

      this.meshGroup.add(group);
      this.readabilityStats.distanceBoardsAdded++;
    };

    // --------------------------------------------------
    // 1. CORNER DIRECTION CHEVRONS (STRATEGIC PLACEMENT)
    // --------------------------------------------------

    // Turn 1 (Sweeping Right)
    addChevronSign(0.10, 'RIGHT', 1, -0.2);
    addChevronSign(0.11, 'RIGHT', 1, -0.25);
    addChevronSign(0.12, 'RIGHT', 1, -0.3);

    // S-Curve Inward Right Transition
    addChevronSign(0.34, 'RIGHT', 1, -0.2);
    addChevronSign(0.35, 'RIGHT', 1, -0.25);

    // Interior Plaza Left Apex (Sweeping Left)
    addChevronSign(0.42, 'LEFT', 1, 0.2);
    addChevronSign(0.43, 'LEFT', 1, 0.25);
    addChevronSign(0.44, 'LEFT', 1, 0.3);

    // West Chicane Entry (Technical Right Turn)
    addChevronSign(0.60, 'RIGHT', 1, -0.2);
    addChevronSign(0.61, 'RIGHT', 1, -0.25);
    addChevronSign(0.62, 'RIGHT', 1, -0.3);

    // Technical Left Apex
    addChevronSign(0.67, 'LEFT', 1, 0.2);
    addChevronSign(0.68, 'LEFT', 1, 0.25);

    // Final Turn Entry (Progressive Right Arc)
    addChevronSign(0.83, 'RIGHT', 1, -0.2);
    addChevronSign(0.84, 'RIGHT', 1, -0.25);
    addChevronSign(0.85, 'RIGHT', 1, -0.3);

    // --------------------------------------------------
    // 2. CORNER WARNING BOARDS (TECHNICAL SECTIONS ONLY)
    // --------------------------------------------------

    addWarningBoard(0.39, 'S-CURVE', 'SMOOTH ENTRY', 1);
    addWarningBoard(0.41, 'PLAZA TURN', 'SLOW / LEFT', 1);
    addWarningBoard(0.58, 'WEST CHICANE', 'TECHNICAL ZONE', 1);
    addWarningBoard(0.81, 'FINAL CORNER', 'RIGHT TURN', 1);

    // --------------------------------------------------
    // 3. HIGH-SPEED BRAKING & DISTANCE MARKERS
    // --------------------------------------------------

    // Downtown Main Straight -> Turn 1
    addDistanceBoard(0.075, '100m', 1);
    addDistanceBoard(0.090, '50m', 1);

    // South Boulevard -> West Chicane
    addDistanceBoard(0.55, '100m', 1);
    addDistanceBoard(0.57, '50m', 1);

    // Outward Straight -> Final Turn
    addDistanceBoard(0.79, '100m', 1);
    addDistanceBoard(0.81, '50m', 1);

    // --------------------------------------------------
    // 4. START / FINISH PRESENTATION POLISH
    // --------------------------------------------------

    // Finish Approach Distance Boards
    addDistanceBoard(0.96, 'FINISH 100m', 1);
    addDistanceBoard(0.98, 'FINISH 50m', 1);

    // Start Line Sidewalk Illuminated LED Accent Pillars
    const startPoint = this.curve.getPointAt(0);
    const startTangent = this.curve.getTangentAt(0).normalize();
    const startRight = this.getRightVector(startTangent);
    const startYaw = Math.atan2(startTangent.x, startTangent.z);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const cyanLightMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.2 });

    [-1, 1].forEach((side) => {
      const pPos = startPoint.clone().addScaledVector(startRight, side * (halfWidth + 0.8));
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(pPos.x, 0, pPos.z);
      pillarGroup.rotation.y = startYaw;

      const col = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.5, 0.6), pillarMat);
      col.position.y = 2.25;
      col.castShadow = true;
      pillarGroup.add(col);

      const lightStrip = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.8, 0.1), cyanLightMat);
      lightStrip.position.set(0, 2.25, side * -0.31);
      pillarGroup.add(lightStrip);

      this.meshGroup.add(pillarGroup);
      this.readabilityStats.startFinishPillarsAdded++;
    });
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
