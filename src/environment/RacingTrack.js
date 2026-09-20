import * as THREE from 'three';

export class RacingTrack {
  constructor() {
    this.trackId = 'forest_crest';
    this.trackName = 'Forest Crest Circuit';
    this.meshGroup = new THREE.Group();
    this.roadWidth = 16.0; // Track width in world units

    // 1. Create Closed-Loop Track Curve Path (New Layout: Spacious Non-Intersecting R-L-R-L Peanut)
    this.controlPoints = [
      new THREE.Vector3(0, 0, 0),         // Start/Finish (Bottom left of indent)
      new THREE.Vector3(300, 0, 0),       // Main Straight
      
      new THREE.Vector3(500, 0, -200),    // Broad RIGHT (Entry)
      new THREE.Vector3(400, 0, -500),    // Broad RIGHT (Apex)
      new THREE.Vector3(100, 0, -400),    // Broad LEFT (Indent)
      
      new THREE.Vector3(-300, 0, -500),   // Broad RIGHT (Entry)
      new THREE.Vector3(-400, 0, -200),   // Broad RIGHT (Apex)
      new THREE.Vector3(-100, 0, -100)    // Broad LEFT (Indent)
    ];

    this.curve = new THREE.CatmullRomCurve3(this.controlPoints, true, 'catmullrom', 0.5);
    
    // Sample curve for geometry generation
    this.divisionCount = 500;
    this.points = this.curve.getSpacedPoints(this.divisionCount);

    this.buildRoadMesh();
    this.buildShoulders();
    this.buildRoadMarkings();
    this.buildApexKerbs();
    this.buildStartFinishLine();
    this.buildGuardrailsAndBarriers();
    this.buildTrackSigns();
  }

  createAsphaltTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base dark weathered asphalt color
    ctx.fillStyle = '#2b2e32';
    ctx.fillRect(0, 0, 512, 512);

    // Multi-frequency fine aggregate granule noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 24;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Dark tire wear rubber tracks along left and right wheel lines
    ctx.fillStyle = 'rgba(20, 22, 25, 0.35)';
    // Left wheel lane rubber wear
    ctx.fillRect(80, 0, 60, 512);
    // Right wheel lane rubber wear
    ctx.fillRect(372, 0, 60, 512);

    // Subtle longitudinal asphalt seam/wear lines
    ctx.strokeStyle = 'rgba(15, 17, 20, 0.2)';
    ctx.lineWidth = 3;
    for (let l = 0; l < 5; l++) {
      const lx = 40 + l * 105;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, 512);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

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
      
      // Calculate perpendicular right vector (in X-Z plane)
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Left and Right edge vertices
      const leftVert = point.clone().addScaledVector(right, -halfWidth);
      const rightVert = point.clone().addScaledVector(right, halfWidth);

      const vi = i * 2;
      
      // Position left vertex
      positions[vi * 3] = leftVert.x;
      positions[vi * 3 + 1] = leftVert.y + 0.05; // Slightly elevated above terrain
      positions[vi * 3 + 2] = leftVert.z;

      // Position right vertex
      positions[(vi + 1) * 3] = rightVert.x;
      positions[(vi + 1) * 3 + 1] = rightVert.y + 0.05;
      positions[(vi + 1) * 3 + 2] = rightVert.z;

      // Normals facing UP
      normals[vi * 3] = 0; normals[vi * 3 + 1] = 1; normals[vi * 3 + 2] = 0;
      normals[(vi + 1) * 3] = 0; normals[(vi + 1) * 3 + 1] = 1; normals[(vi + 1) * 3 + 2] = 0;

      // UV Coordinates
      uvs[vi * 2] = 0; uvs[vi * 2 + 1] = u * 60;
      uvs[(vi + 1) * 2] = 1; uvs[(vi + 1) * 2 + 1] = u * 60;
    }

    // Build Quad Indices
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

    const asphaltTexture = this.createAsphaltTexture();
    const roadMaterial = new THREE.MeshStandardMaterial({
      map: asphaltTexture,
      roughness: 0.72,
      metalness: 0.12
    });

    const roadMesh = new THREE.Mesh(geometry, roadMaterial);
    roadMesh.receiveShadow = true;
    this.meshGroup.add(roadMesh);
  }

  buildShoulders() {
    // 1.2m wide dirt/gravel transition shoulder strips along both sides of road
    const halfWidth = this.roadWidth / 2;
    const shoulderWidth = 1.4;
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x5c5647, // Dirt/gravel tone
      roughness: 0.9,
      metalness: 0.05
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
        const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const innerPos = point.clone().addScaledVector(right, side * halfWidth);
        const outerPos = point.clone().addScaledVector(right, side * (halfWidth + shoulderWidth));

        const vi = i * 2;
        positions[vi * 3] = innerPos.x;
        positions[vi * 3 + 1] = innerPos.y + 0.04;
        positions[vi * 3 + 2] = innerPos.z;

        positions[(vi + 1) * 3] = outerPos.x;
        positions[(vi + 1) * 3 + 1] = outerPos.y + 0.02;
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

      const shoulderGeo = new THREE.BufferGeometry();
      shoulderGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      shoulderGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      shoulderGeo.setIndex(new THREE.BufferAttribute(indices, 1));

      const shoulderMesh = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulderMesh.receiveShadow = true;
      this.meshGroup.add(shoulderMesh);
    }
  }

  buildRoadMarkings() {
    const halfWidth = this.roadWidth / 2;

    // Edge stripe geometry (Clean solid white lines at road margins)
    const edgeGeoL = new THREE.BufferGeometry();
    const edgeGeoR = new THREE.BufferGeometry();

    const posL = new Float32Array((this.divisionCount + 1) * 6);
    const posR = new Float32Array((this.divisionCount + 1) * 6);

    for (let i = 0; i <= this.divisionCount; i++) {
      const u = i / this.divisionCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const offsetL = halfWidth - 0.4;
      const offsetR = halfWidth - 0.4;

      const pL = point.clone().addScaledVector(right, -offsetL);
      const pR = point.clone().addScaledVector(right, offsetR);

      // Left Line
      posL[i * 6] = pL.x - right.x * 0.15; posL[i * 6 + 1] = pL.y + 0.07; posL[i * 6 + 2] = pL.z - right.z * 0.15;
      posL[i * 6 + 3] = pL.x + right.x * 0.15; posL[i * 6 + 4] = pL.y + 0.07; posL[i * 6 + 5] = pL.z + right.z * 0.15;

      // Right Line
      posR[i * 6] = pR.x - right.x * 0.15; posR[i * 6 + 1] = pR.y + 0.07; posR[i * 6 + 2] = pR.z - right.z * 0.15;
      posR[i * 6 + 3] = pR.x + right.x * 0.15; posR[i * 6 + 4] = pR.y + 0.07; posR[i * 6 + 5] = pR.z + right.z * 0.15;
    }

    const indices = new Uint32Array(this.divisionCount * 6);
    let ii = 0;
    for (let i = 0; i < this.divisionCount; i++) {
      const vi = i * 2;
      indices[ii++] = vi; indices[ii++] = vi + 1; indices[ii++] = vi + 2;
      indices[ii++] = vi + 1; indices[ii++] = vi + 3; indices[ii++] = vi + 2;
    }

    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xeaeaea, roughness: 0.5 });

    edgeGeoL.setAttribute('position', new THREE.BufferAttribute(posL, 3));
    edgeGeoL.setIndex(new THREE.BufferAttribute(indices, 1));
    this.meshGroup.add(new THREE.Mesh(edgeGeoL, stripeMat));

    edgeGeoR.setAttribute('position', new THREE.BufferAttribute(posR, 3));
    edgeGeoR.setIndex(new THREE.BufferAttribute(indices, 1));
    this.meshGroup.add(new THREE.Mesh(edgeGeoR, stripeMat));

    // Center Dashed Yellow Highway Markings
    const dashCount = 90;
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xebaf2d, roughness: 0.45 });

    for (let i = 0; i < dashCount; i++) {
      const u = i / dashCount;
      const point = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      
      const dashGeo = new THREE.BoxGeometry(0.28, 0.02, 2.8);
      const dash = new THREE.Mesh(dashGeo, yellowMat);
      dash.position.copy(point);
      dash.position.y += 0.07;
      dash.rotation.y = Math.atan2(tangent.x, tangent.z);
      dash.receiveShadow = true;
      this.meshGroup.add(dash);
    }
  }

  buildApexKerbs() {
    // Red & White striped rumble kerbs placed along corner inner apexes
    const kerbRedMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });
    const kerbWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 });
    const halfWidth = this.roadWidth / 2;

    // Corner ranges along curve
    const apexZones = [
      { startU: 0.12, endU: 0.18, side: -1 }, // Turn 1 inner apex
      { startU: 0.26, endU: 0.32, side: 1 },  // Turn 2 inner apex
      { startU: 0.44, endU: 0.50, side: -1 }, // Turn 4 inner apex
      { startU: 0.58, endU: 0.64, side: 1 },  // Turn 5 inner apex
      { startU: 0.74, endU: 0.82, side: -1 }, // Hairpin inner apex
      { startU: 0.88, endU: 0.94, side: 1 }   // Turn 7 inner apex
    ];

    const kerbGeo = new THREE.BoxGeometry(1.2, 0.14, 1.0);

    for (const zone of apexZones) {
      const steps = 32;
      for (let s = 0; s < steps; s++) {
        const u = zone.startU + (s / steps) * (zone.endU - zone.startU);
        const point = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const yaw = Math.atan2(tangent.x, tangent.z);

        const pos = point.clone().addScaledVector(right, zone.side * (halfWidth + 0.3));
        const kerb = new THREE.Mesh(kerbGeo, s % 2 === 0 ? kerbRedMat : kerbWhiteMat);
        kerb.position.copy(pos);
        kerb.position.y += 0.09;
        kerb.rotation.y = yaw;
        kerb.rotation.z = zone.side * 0.12; // Slanted towards road edge
        kerb.receiveShadow = true;
        kerb.castShadow = true;
        this.meshGroup.add(kerb);
      }
    }
  }

  buildStartFinishLine() {
    const startPoint = this.curve.getPointAt(0);
    const tangent = this.curve.getTangentAt(0).normalize();

    // Procedural Checkerboard Texture for Start/Finish Line
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const cols = 12;
    const rows = 2;
    const cw = canvas.width / cols;
    const ch = canvas.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#151515';
        ctx.fillRect(c * cw, r * ch, cw, ch);
      }
    }

    const checkerTexture = new THREE.CanvasTexture(canvas);
    checkerTexture.wrapS = THREE.RepeatWrapping;
    checkerTexture.wrapT = THREE.RepeatWrapping;

    const sfGeo = new THREE.PlaneGeometry(this.roadWidth - 0.2, 4.0);
    const sfMat = new THREE.MeshStandardMaterial({
      map: checkerTexture,
      roughness: 0.5,
      side: THREE.DoubleSide
    });

    const startFinishMesh = new THREE.Mesh(sfGeo, sfMat);
    startFinishMesh.rotation.x = -Math.PI / 2;
    startFinishMesh.rotation.z = Math.atan2(tangent.x, tangent.z) - Math.PI / 2;
    startFinishMesh.position.copy(startPoint);
    startFinishMesh.position.y += 0.08;
    startFinishMesh.receiveShadow = true;

    this.meshGroup.add(startFinishMesh);

    // Modern Daytime Motorsport Start/Finish Truss Gantry Arch
    const archGroup = new THREE.Group();
    const trussMat = new THREE.MeshStandardMaterial({ color: 0xd0d4dc, metalness: 0.85, roughness: 0.25 });
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
    const bannerTextMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const redLightMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
    const greenLightMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.2 });

    // Left and Right Vertical Truss Pillars
    const pHeight = 8.5;
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, pHeight, 8), trussMat);
    pL.position.set(-this.roadWidth / 2 - 1.2, pHeight / 2, 0);
    pL.castShadow = true;
    archGroup.add(pL);

    const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, pHeight, 8), trussMat);
    pR.position.set(this.roadWidth / 2 + 1.2, pHeight / 2, 0);
    pR.castShadow = true;
    archGroup.add(pR);

    // Crossbar Header Box
    const headerWidth = this.roadWidth + 3.2;
    const headerBox = new THREE.Mesh(new THREE.BoxGeometry(headerWidth, 1.4, 1.0), bannerMat);
    headerBox.position.set(0, pHeight - 0.2, 0);
    headerBox.castShadow = true;
    archGroup.add(headerBox);

    // White Center Banner Panel
    const bannerPanel = new THREE.Mesh(new THREE.BoxGeometry(8, 0.9, 1.05), bannerTextMat);
    bannerPanel.position.set(0, pHeight - 0.2, 0);
    archGroup.add(bannerPanel);

    // Signal Light Fixtures (Start Lights)
    for (let i = -2; i <= 2; i++) {
      const lightHousing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.3), trussMat);
      lightHousing.position.set(i * 1.2, pHeight - 1.2, 0.5);
      archGroup.add(lightHousing);

      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), i >= 1 ? greenLightMat : redLightMat);
      lamp.position.set(i * 1.2, pHeight - 1.2, 0.65);
      archGroup.add(lamp);
    }

    archGroup.position.copy(startPoint);
    archGroup.rotation.y = Math.atan2(tangent.x, tangent.z);
    this.meshGroup.add(archGroup);
  }

  buildGuardrailsAndBarriers() {
    const halfWidth = this.roadWidth / 2;
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      metalness: 0.85,
      roughness: 0.3
    });
    const wBeamMat = new THREE.MeshStandardMaterial({
      color: 0xc4cbcf, // Galvanized steel
      metalness: 0.88,
      roughness: 0.26
    });

    const guardrailCount = 220;
    const postGeo = new THREE.BoxGeometry(0.32, 1.15, 0.32);

    // Create 3D Extruded Corrugated W-Beam Guardrail along track curves
    for (let side = -1; side <= 1; side += 2) {
      const railPositions = [];
      for (let i = 0; i <= guardrailCount; i++) {
        const u = i / guardrailCount;
        const point = this.curve.getPointAt(u);
        const tangent = this.curve.getTangentAt(u).normalize();
        const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const yaw = Math.atan2(tangent.x, tangent.z);

        const pos = point.clone().addScaledVector(right, side * (halfWidth + 0.9));
        pos.y += 0.58; // Center beam height

        // Galvanized Support Post
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.copy(pos);
        post.rotation.y = yaw;
        post.castShadow = true;
        this.meshGroup.add(post);

        railPositions.push(pos);
      }

      // Connect posts with corrugated 3D W-beam rail segments
      for (let i = 0; i < railPositions.length - 1; i++) {
        const p1 = railPositions[i];
        const p2 = railPositions[i + 1];
        const dist = p1.distanceTo(p2);
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        const dir = p2.clone().sub(p1).normalize();

        const beamGroup = new THREE.Group();

        // Upper corrugated ridge
        const topRidge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, dist + 0.08), wBeamMat);
        topRidge.position.set(0, 0.15, 0);
        topRidge.castShadow = true;
        beamGroup.add(topRidge);

        // Lower corrugated ridge
        const botRidge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, dist + 0.08), wBeamMat);
        botRidge.position.set(0, -0.15, 0);
        botRidge.castShadow = true;
        beamGroup.add(botRidge);

        // Center recessed valley
        const centerValley = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, dist + 0.08), wBeamMat);
        centerValley.position.set(-0.02, 0, 0);
        centerValley.castShadow = true;
        beamGroup.add(centerValley);

        beamGroup.position.copy(mid);
        beamGroup.rotation.y = Math.atan2(dir.x, dir.z);
        this.meshGroup.add(beamGroup);
      }
    }
  }

  buildTrackSigns() {
    // Add turn warning chevron signs on sharp curve outer edges
    const signLocations = [
      { u: 0.14, text: 'CHEVRON_RIGHT', yawOffset: 0.2 },
      { u: 0.28, text: 'CHEVRON_LEFT', yawOffset: -0.2 },
      { u: 0.46, text: 'CHEVRON_RIGHT', yawOffset: 0.3 },
      { u: 0.60, text: 'CHEVRON_LEFT', yawOffset: -0.3 },
      { u: 0.77, text: 'HAIRPIN_WARNING', yawOffset: 0.4 },
      { u: 0.90, text: 'CHEVRON_LEFT', yawOffset: -0.2 }
    ];

    const postMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.8, roughness: 0.3 });
    const signYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
    const arrowBlackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
    const halfWidth = this.roadWidth / 2;

    for (const loc of signLocations) {
      const point = this.curve.getPointAt(loc.u);
      const tangent = this.curve.getTangentAt(loc.u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const yaw = Math.atan2(tangent.x, tangent.z);

      // Outer curve side placement
      const side = loc.text.includes('RIGHT') ? -1 : 1;
      const signPos = point.clone().addScaledVector(right, side * (halfWidth + 2.8));

      const signGroup = new THREE.Group();
      signGroup.position.copy(signPos);

      // Support Post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2), postMat);
      post.position.y = 1.6;
      post.castShadow = true;
      signGroup.add(post);

      // Signboard Panel
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.1), signYellowMat);
      panel.position.y = 2.4;
      panel.rotation.y = yaw + Math.PI / 2 + loc.yawOffset;
      panel.castShadow = true;
      signGroup.add(panel);

      // Black Chevron Arrow Graphic
      const arrow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.12), arrowBlackMat);
      arrow.position.set(0, 2.4, 0.02);
      arrow.rotation.y = yaw + Math.PI / 2 + loc.yawOffset;
      arrow.rotation.z = Math.PI / 4;
      signGroup.add(arrow);

      this.meshGroup.add(signGroup);
    }
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


