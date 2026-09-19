import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class ForestWildlife {
  constructor(scene, curve, roadWidth, getNearestTrackPoint) {
    this.scene = scene;
    this.curve = curve;
    this.roadWidth = roadWidth;
    this.getNearestTrackPoint = getNearestTrackPoint;

    this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
      (navigator.maxTouchPoints > 2 && window.innerWidth <= 1024);

    this.group = new THREE.Group();
    
    // Arrays for animated entities
    this.deerEntities = [];
    this.rabbitEntities = [];
    this.perchedBirds = [];
    this.flyingBirds = [];
    this.flyingFlockGroup = null;

    // Build Environment Layers
    this.initSharedMaterials();
    this.buildDeerHerds();
    this.buildSmallAnimals();
    this.buildBirds();
    this.buildForestFloorDetails();
    this.buildRangerCabin();

    this.scene.add(this.group);
  }

  initSharedMaterials() {
    // Deer Materials
    this.deerFurMat = new THREE.MeshStandardMaterial({ color: 0x8a5832, roughness: 0.85, metalness: 0.05 });
    this.deerBellyMat = new THREE.MeshStandardMaterial({ color: 0xd9c2a7, roughness: 0.9, metalness: 0.0 });
    this.deerHoofMat = new THREE.MeshStandardMaterial({ color: 0x241a14, roughness: 0.7 });
    this.deerEyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 });
    this.deerAntlerMat = new THREE.MeshStandardMaterial({ color: 0xbaa896, roughness: 0.85 });

    // Rabbit Materials
    this.rabbitFurMat = new THREE.MeshStandardMaterial({ color: 0x9e8c7c, roughness: 0.9 });
    this.rabbitEarMat = new THREE.MeshStandardMaterial({ color: 0xcca8a1, roughness: 0.9 });

    // Wild Boar Materials
    this.boarMat = new THREE.MeshStandardMaterial({ color: 0x3d332a, roughness: 0.92 });
    this.tuskMat = new THREE.MeshStandardMaterial({ color: 0xedebe4, roughness: 0.4 });

    // Bird Materials
    this.birdFeatherMat = new THREE.MeshStandardMaterial({ color: 0x2e3d30, roughness: 0.7 });
    this.birdBeakMat = new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.5 });

    // Forest Details Materials
    this.mushroomCapMat = new THREE.MeshStandardMaterial({ color: 0xb83228, roughness: 0.6 });
    this.mushroomStemMat = new THREE.MeshStandardMaterial({ color: 0xf0ede6, roughness: 0.8 });
    this.brownMushroomCapMat = new THREE.MeshStandardMaterial({ color: 0x5e4128, roughness: 0.7 });
    
    this.logBarkMat = new THREE.MeshStandardMaterial({ color: 0x4a3625, roughness: 0.9 });
    this.logEndMat = new THREE.MeshStandardMaterial({ color: 0x8a7054, roughness: 0.85 });
    this.mossMat = new THREE.MeshStandardMaterial({ color: 0x3b6329, roughness: 0.9 });

    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x6e7275, roughness: 0.88, metalness: 0.08 });
    this.fernMat = new THREE.MeshStandardMaterial({ color: 0x2a5e23, roughness: 0.7, side: THREE.DoubleSide });

    // Cabin Materials
    this.cabinLogMat = new THREE.MeshStandardMaterial({ color: 0x543c28, roughness: 0.88 });
    this.cabinRoofMat = new THREE.MeshStandardMaterial({ color: 0x2b2520, roughness: 0.85 });
    this.stoneChimneyMat = new THREE.MeshStandardMaterial({ color: 0x525252, roughness: 0.9 });
  }

  // --- 1. PROCEDURAL 3D DEER GENERATOR & PLACEMENT ---

  createDeerMesh(isStag = false) {
    const deerGroup = new THREE.Group();
    const animParts = {};

    // Torso / Body
    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.48, 1.4, 8);
    torsoGeo.rotateZ(Math.PI / 2);
    const torso = new THREE.Mesh(torsoGeo, this.deerFurMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    torso.receiveShadow = true;
    deerGroup.add(torso);
    animParts.torso = torso;

    // White chest/belly accent
    const bellyGeo = new THREE.CylinderGeometry(0.35, 0.4, 1.1, 8);
    bellyGeo.rotateZ(Math.PI / 2);
    const belly = new THREE.Mesh(bellyGeo, this.deerBellyMat);
    belly.position.set(0, -0.06, 0);
    torso.add(belly);

    // Legs (4 slender jointed legs)
    const legGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.95, 6);
    const hoofGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.15, 6);
    
    const legOffsets = [
      { x: 0.5, z: 0.22 },
      { x: 0.5, z: -0.22 },
      { x: -0.5, z: 0.22 },
      { x: -0.5, z: -0.22 }
    ];

    legOffsets.forEach(off => {
      const leg = new THREE.Mesh(legGeo, this.deerFurMat);
      leg.position.set(off.x, -0.5, off.z);
      leg.castShadow = true;
      torso.add(leg);

      const hoof = new THREE.Mesh(hoofGeo, this.deerHoofMat);
      hoof.position.y = -0.52;
      leg.add(hoof);
    });

    // Neck (Angled forward & upward)
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0.6, 0.2, 0);
    torso.add(neckGroup);
    animParts.neck = neckGroup;

    const neckGeo = new THREE.CylinderGeometry(0.22, 0.32, 0.85, 8);
    const neck = new THREE.Mesh(neckGeo, this.deerFurMat);
    neck.position.set(0.18, 0.35, 0);
    neck.rotation.z = -0.45;
    neck.castShadow = true;
    neckGroup.add(neck);

    // Head (Head + Snout + Ears)
    const headGroup = new THREE.Group();
    headGroup.position.set(0.38, 0.72, 0);
    neckGroup.add(headGroup);
    animParts.head = headGroup;

    const headGeo = new THREE.BoxGeometry(0.38, 0.32, 0.32);
    const head = new THREE.Mesh(headGeo, this.deerFurMat);
    head.castShadow = true;
    headGroup.add(head);

    // Snout
    const snoutGeo = new THREE.ConeGeometry(0.15, 0.42, 6);
    snoutGeo.rotateZ(-Math.PI / 2);
    const snout = new THREE.Mesh(snoutGeo, this.deerFurMat);
    snout.position.set(0.32, -0.04, 0);
    headGroup.add(snout);

    // Snout Nose Tip
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), this.deerHoofMat);
    noseTip.position.set(0.52, -0.04, 0);
    headGroup.add(noseTip);

    // Eyes
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), this.deerEyeMat);
    eyeR.position.set(0.12, 0.06, 0.16);
    const eyeL = eyeR.clone();
    eyeL.position.z = -0.16;
    headGroup.add(eyeR);
    headGroup.add(eyeL);

    // Ears (Right & Left - animated)
    const earGeo = new THREE.ConeGeometry(0.08, 0.32, 5);
    earGeo.rotateZ(-Math.PI / 3);
    
    const earR = new THREE.Mesh(earGeo, this.deerFurMat);
    earR.position.set(-0.08, 0.18, 0.18);
    earR.rotation.x = 0.3;
    headGroup.add(earR);
    animParts.earR = earR;

    const earL = new THREE.Mesh(earGeo, this.deerFurMat);
    earL.position.set(-0.08, 0.18, -0.18);
    earL.rotation.x = -0.3;
    headGroup.add(earL);
    animParts.earL = earL;

    // Tail
    const tailGeo = new THREE.ConeGeometry(0.07, 0.25, 5);
    tailGeo.rotateZ(Math.PI / 4);
    const tail = new THREE.Mesh(tailGeo, this.deerBellyMat);
    tail.position.set(-0.72, 0.1, 0);
    torso.add(tail);

    // Antlers (If Stag)
    if (isStag) {
      const antlerGroup = new THREE.Group();
      antlerGroup.position.set(0.02, 0.22, 0);

      for (const side of [1, -1]) {
        // Main Beam
        const mainBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.65, 5), this.deerAntlerMat);
        mainBeam.position.set(0.05, 0.3, side * 0.14);
        mainBeam.rotation.set(-side * 0.25, 0, 0.35);
        mainBeam.castShadow = true;
        antlerGroup.add(mainBeam);

        // Tines
        for (let t = 0; t < 3; t++) {
          const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.28, 5), this.deerAntlerMat);
          tine.position.set(0.12 + t * 0.08, 0.38 + t * 0.1, side * (0.2 + t * 0.06));
          tine.rotation.set(-side * 0.4, 0, 0.8);
          antlerGroup.add(tine);
        }
      }
      headGroup.add(antlerGroup);
    }

    deerGroup.scale.set(1.25, 1.25, 1.25);
    return { mesh: deerGroup, parts: animParts };
  }

  buildDeerHerds() {
    // Asymmetric Deer Groups placed in deep forest away from the track
    const herdConfigs = this.isMobile ? [
      { u: 0.24, side: -1, dist: 23.0, count: 2, isStag: [true, false] },
      { u: 0.86, side: 1, dist: 25.0, count: 1, isStag: [true] }
    ] : [
      { u: 0.08, side: 1, dist: 20.5, count: 1, isStag: [true] }, // Lone Stag looking over clearing
      { u: 0.24, side: -1, dist: 23.0, count: 3, isStag: [true, false, false] }, // Family trio in forest glade
      { u: 0.44, side: 1, dist: 28.0, count: 4, isStag: [true, false, false, false] }, // Grazing herd
      { u: 0.68, side: -1, dist: 21.5, count: 2, isStag: [false, false] }, // 2 Does near mushroom patch
      { u: 0.86, side: 1, dist: 25.0, count: 2, isStag: [true, false] } // Pair standing near hill slope
    ];

    herdConfigs.forEach((cfg, herdIdx) => {
      const p = this.curve.getPointAt(cfg.u);
      const tangent = this.curve.getTangentAt(cfg.u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      for (let i = 0; i < cfg.count; i++) {
        const isStag = cfg.isStag[i];
        const deerObj = this.createDeerMesh(isStag);

        // Position with natural cluster offset
        const offsetX = (i - (cfg.count - 1) / 2) * 4.2 + (Math.sin(i * 1.7) * 1.8);
        const offsetZ = (Math.cos(i * 2.3) * 3.5);

        const pos = p.clone().addScaledVector(right, cfg.side * (cfg.dist + offsetZ));
        pos.x += tangent.x * offsetX;
        pos.z += tangent.z * offsetX;

        // Verify distance safety zone (must be >= 18m from track)
        const check = this.getNearestTrackPoint(pos.x, pos.z);
        if (check.distance < 18) {
          const pushDir = pos.clone().sub(check.point).normalize();
          pos.copy(check.point).addScaledVector(pushDir, 19.5);
        }

        deerObj.mesh.position.copy(pos);

        // Face towards road or random natural angle
        const angleToRoad = Math.atan2(p.x - pos.x, p.z - pos.z) + (i % 2 === 0 ? 0.3 : -0.6);
        deerObj.mesh.rotation.y = angleToRoad;

        this.group.add(deerObj.mesh);

        // Register for procedural behavior animation loop
        this.deerEntities.push({
          mesh: deerObj.mesh,
          parts: deerObj.parts,
          baseRotY: angleToRoad,
          animSeed: herdIdx * 10 + i,
          isGrazing: i === 1 || i === 3,
          grazingTimer: Math.random() * Math.PI * 2
        });
      }
    });
  }

  // --- 2. SMALL FOREST ANIMALS (RABBITS & WILD BOAR) ---

  createRabbitMesh() {
    const rabbitGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.DodecahedronGeometry(0.28, 1);
    bodyGeo.scale(0.85, 0.9, 1.25);
    const body = new THREE.Mesh(bodyGeo, this.rabbitFurMat);
    body.position.y = 0.22;
    body.castShadow = true;
    rabbitGroup.add(body);

    // Head
    const headGeo = new THREE.DodecahedronGeometry(0.16, 1);
    const head = new THREE.Mesh(headGeo, this.rabbitFurMat);
    head.position.set(0, 0.28, 0.24);
    rabbitGroup.add(head);

    // Ears
    const earGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.32, 5);
    for (const zOff of [0.07, -0.07]) {
      const ear = new THREE.Mesh(earGeo, this.rabbitFurMat);
      ear.position.set(-0.04, 0.44, 0.2 + zOff);
      ear.rotation.set(-0.2, 0, zOff * 2);
      rabbitGroup.add(ear);
    }

    // Fluffy Tail
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), this.deerBellyMat);
    tail.position.set(0, 0.22, -0.32);
    rabbitGroup.add(tail);

    return { mesh: rabbitGroup, head };
  }

  createWildBoarMesh() {
    const boarGroup = new THREE.Group();

    // Stocky Torso
    const bodyGeo = new THREE.CylinderGeometry(0.48, 0.52, 1.3, 8);
    bodyGeo.rotateZ(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, this.boarMat);
    body.position.y = 0.55;
    body.castShadow = true;
    boarGroup.add(body);

    // Head & Snout
    const headGeo = new THREE.ConeGeometry(0.42, 0.75, 7);
    headGeo.rotateZ(-Math.PI / 2);
    const head = new THREE.Mesh(headGeo, this.boarMat);
    head.position.set(0.55, 0.55, 0);
    head.castShadow = true;
    boarGroup.add(head);

    // White Ivory Tusks
    for (const side of [0.18, -0.18]) {
      const tusk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.22, 5), this.tuskMat);
      tusk.position.set(0.85, 0.48, side);
      tusk.rotation.set(side * 1.2, 0, 0.6);
      boarGroup.add(tusk);
    }

    // Short Stout Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.4, 6);
    for (const xOff of [0.35, -0.35]) {
      for (const zOff of [0.3, -0.3]) {
        const leg = new THREE.Mesh(legGeo, this.boarMat);
        leg.position.set(xOff, 0.2, zOff);
        leg.castShadow = true;
        boarGroup.add(leg);
      }
    }

    return { mesh: boarGroup };
  }

  buildSmallAnimals() {
    // Rabbit Groups near grass bushes
    const rabbitLocs = this.isMobile ? [
      { u: 0.16, side: 1, dist: 22, count: 2 }
    ] : [
      { u: 0.16, side: 1, dist: 22, count: 2 },
      { u: 0.56, side: -1, dist: 26, count: 3 },
      { u: 0.78, side: 1, dist: 24, count: 2 }
    ];

    rabbitLocs.forEach((loc, groupIdx) => {
      const p = this.curve.getPointAt(loc.u);
      const tangent = this.curve.getTangentAt(loc.u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      for (let r = 0; r < loc.count; r++) {
        const rabbit = this.createRabbitMesh();
        const pos = p.clone().addScaledVector(right, loc.side * (loc.dist + r * 1.5));
        pos.x += tangent.x * (r * 1.2);
        pos.z += tangent.z * (r * 1.2);

        const check = this.getNearestTrackPoint(pos.x, pos.z);
        if (check.distance < 18) {
          pos.copy(check.point).addScaledVector(pos.clone().sub(check.point).normalize(), 20);
        }

        rabbit.mesh.position.copy(pos);
        rabbit.mesh.rotation.y = Math.random() * Math.PI * 2;
        this.group.add(rabbit.mesh);

        this.rabbitEntities.push({
          mesh: rabbit.mesh,
          head: rabbit.head,
          animSeed: groupIdx * 5 + r,
          baseY: pos.y
        });
      }
    });

    // 1 Wild Boar foraging deep in woods
    const pBoar = this.curve.getPointAt(0.36);
    const tangentB = this.curve.getTangentAt(0.36).normalize();
    const rightB = new THREE.Vector3(-tangentB.z, 0, tangentB.x).normalize();
    const boarPos = pBoar.clone().addScaledVector(rightB, -36);

    const boar = this.createWildBoarMesh();
    boar.mesh.position.copy(boarPos);
    boar.mesh.rotation.y = Math.PI * 0.75;
    this.group.add(boar.mesh);
  }

  // --- 3. BIRDS (PERCHED & FLYING FLOCK) ---

  createBirdMesh() {
    const birdGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.ConeGeometry(0.12, 0.42, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, this.birdFeatherMat);
    body.castShadow = true;
    birdGroup.add(body);

    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 5), this.birdBeakMat);
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0, 0.26);
    birdGroup.add(beak);

    // Wings (Articulated for wing flap animation)
    const wingGeo = new THREE.BoxGeometry(0.45, 0.02, 0.18);
    wingGeo.translate(0.22, 0, 0);

    const wingR = new THREE.Mesh(wingGeo, this.birdFeatherMat);
    wingR.position.set(0.06, 0.02, 0);
    birdGroup.add(wingR);

    const wingL = new THREE.Mesh(wingGeo, this.birdFeatherMat);
    wingL.scale.set(-1, 1, 1);
    wingL.position.set(-0.06, 0.02, 0);
    birdGroup.add(wingL);

    return { mesh: birdGroup, wingR, wingL };
  }

  buildBirds() {
    // 1. Perched Birds on Tree Canopy Heights
    const perchedBirdCount = this.isMobile ? 3 : 10;
    for (let b = 0; b < perchedBirdCount; b++) {
      const u = (b / perchedBirdCount) + 0.04;
      const p = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = (b % 2 === 0 ? 1 : -1);

      const birdObj = this.createBirdMesh();
      const birdPos = p.clone().addScaledVector(right, side * (24 + (b % 3) * 6));
      birdPos.y = 7.5 + (b % 4) * 1.2; // Perched up in tree canopy height

      birdObj.mesh.position.copy(birdPos);
      birdObj.mesh.rotation.y = Math.random() * Math.PI * 2;
      this.group.add(birdObj.mesh);

      this.perchedBirds.push({
        mesh: birdObj.mesh,
        animSeed: b,
        baseRotY: birdObj.mesh.rotation.y
      });
    }

    // 2. Flying Bird Flock Traveling High Above Forest (Desktop Only)
    if (!this.isMobile) {
      this.flyingFlockGroup = new THREE.Group();
      
      for (let f = 0; f < 5; f++) {
        const birdObj = this.createBirdMesh();
        birdObj.mesh.position.set((f - 2) * 1.8, (f % 2) * 0.4, -f * 1.4);
        birdObj.mesh.rotation.y = Math.PI; // Flying forward
        this.flyingFlockGroup.add(birdObj.mesh);

        this.flyingBirds.push({
          wingR: birdObj.wingR,
          wingL: birdObj.wingL,
          seed: f
        });
      }

      this.flyingFlockGroup.position.set(0, 28, 0);
      this.group.add(this.flyingFlockGroup);
    }
  }

  // --- 4. NATURAL FOREST FLOOR LIFE (MUSHROOMS, LOGS, ROCKS, FERNS) ---

  buildForestFloorDetails() {
    // A. MUSHROOM CLUSTERS (8 clusters near tree bases & shaded forest ground)
    const mushroomLocs = [
      { u: 0.12, side: 1, dist: 20 },
      { u: 0.28, side: -1, dist: 22 },
      { u: 0.38, side: 1, dist: 25 },
      { u: 0.52, side: -1, dist: 21 },
      { u: 0.64, side: 1, dist: 24 },
      { u: 0.74, side: -1, dist: 22 },
      { u: 0.88, side: 1, dist: 26 },
      { u: 0.96, side: -1, dist: 20 }
    ];

    mushroomLocs.forEach((mLoc, clusterIdx) => {
      const p = this.curve.getPointAt(mLoc.u);
      const tangent = this.curve.getTangentAt(mLoc.u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const centerPos = p.clone().addScaledVector(right, mLoc.side * mLoc.dist);

      const count = 8 + (clusterIdx % 4) * 3;
      const isRedCap = clusterIdx % 2 === 0;
      const capMat = isRedCap ? this.mushroomCapMat : this.brownMushroomCapMat;

      for (let m = 0; m < count; m++) {
        const mGroup = new THREE.Group();
        const stemHeight = 0.15 + Math.random() * 0.25;
        const capRadius = 0.1 + Math.random() * 0.18;

        // Stem
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, stemHeight, 6), this.mushroomStemMat);
        stem.position.y = stemHeight / 2;
        mGroup.add(stem);

        // Cap
        const cap = new THREE.Mesh(new THREE.SphereGeometry(capRadius, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), capMat);
        cap.position.y = stemHeight;
        cap.castShadow = true;
        mGroup.add(cap);

        // Placement inside cluster radius
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * 1.8;
        mGroup.position.set(centerPos.x + Math.cos(angle) * rad, 0, centerPos.z + Math.sin(angle) * rad);

        this.group.add(mGroup);
      }
    });

    // B. FALLEN LOGS (10 mossy decaying logs lying on terrain)
    for (let l = 0; l < 10; l++) {
      const u = (l / 10) + 0.03;
      const p = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = (l % 2 === 0 ? 1 : -1);

      const logGroup = new THREE.Group();
      const len = 3.5 + Math.random() * 2.5;
      const rad = 0.35 + Math.random() * 0.25;

      // Main Log Body
      const logBody = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.85, rad, len, 8), this.logBarkMat);
      logBody.rotateZ(Math.PI / 2);
      logBody.position.y = rad;
      logBody.castShadow = true;
      logBody.receiveShadow = true;
      logGroup.add(logBody);

      // Moss Patch on top
      const moss = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.88, rad * 1.02, len * 0.65, 8, 1, false, 0, Math.PI), this.mossMat);
      moss.rotateZ(Math.PI / 2);
      moss.position.set(0, rad + 0.02, 0);
      logGroup.add(moss);

      const pos = p.clone().addScaledVector(right, side * (21 + (l % 4) * 5));
      
      const check = this.getNearestTrackPoint(pos.x, pos.z);
      if (check.distance < 18) {
        pos.copy(check.point).addScaledVector(pos.clone().sub(check.point).normalize(), 20);
      }

      logGroup.position.copy(pos);
      logGroup.rotation.y = Math.random() * Math.PI;
      this.group.add(logGroup);
    }

    // C. WEATHERED GRANITE BOULDERS (18 mossy rocks along hill slopes)
    for (let r = 0; r < 18; r++) {
      const u = (r / 18) + 0.02;
      const p = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = (r % 2 === 0 ? 1 : -1);

      const rockGeo = new THREE.DodecahedronGeometry(1.2 + Math.random() * 1.4, 1);
      // Displace vertices for organic weathered shape
      const posAttr = rockGeo.attributes.position;
      for (let v = 0; v < posAttr.count; v++) {
        const vx = posAttr.getX(v);
        const vy = posAttr.getY(v);
        const vz = posAttr.getZ(v);
        posAttr.setXYZ(v, vx * (0.8 + Math.random() * 0.4), vy * (0.6 + Math.random() * 0.4), vz * (0.8 + Math.random() * 0.4));
      }
      rockGeo.computeVertexNormals();

      const rock = new THREE.Mesh(rockGeo, this.rockMat);
      const pos = p.clone().addScaledVector(right, side * (26 + (r % 5) * 6));

      const check = this.getNearestTrackPoint(pos.x, pos.z);
      if (check.distance < 19) {
        pos.copy(check.point).addScaledVector(pos.clone().sub(check.point).normalize(), 22);
      }

      rock.position.copy(pos);
      rock.position.y = 0.5;
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    }

    // D. DENSE FERN CLUSTERS (24 fern plants framing roadside clear zone edge)
    const fernFrondGeo = new THREE.PlaneGeometry(0.4, 1.2, 2, 4);
    fernFrondGeo.translate(0, 0.6, 0);

    for (let f = 0; f < 24; f++) {
      const u = (f / 24);
      const p = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = (f % 2 === 0 ? 1 : -1);

      const fernGroup = new THREE.Group();
      // 7 radiating fronds per fern plant
      for (let i = 0; i < 7; i++) {
        const frond = new THREE.Mesh(fernFrondGeo, this.fernMat);
        frond.rotation.y = (i / 7) * Math.PI * 2;
        frond.rotation.x = 0.4 + Math.random() * 0.2;
        frond.castShadow = true;
        fernGroup.add(frond);
      }

      const pos = p.clone().addScaledVector(right, side * (14.5 + (f % 3) * 2.5));
      fernGroup.position.copy(pos);
      fernGroup.scale.setScalar(0.9 + Math.random() * 0.4);
      this.group.add(fernGroup);
    }
  }

  // --- 5. RANGER CABIN (VERY LIMITED: 1 CABIN DEEP IN WOODS) ---

  buildRangerCabin() {
    // 1 Rustic Wooden Ranger Cabin placed deep in forest (u = 0.52, offset -42m)
    const p = this.curve.getPointAt(0.52);
    const tangent = this.curve.getTangentAt(0.52).normalize();
    const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const cabinPos = p.clone().addScaledVector(right, -42);

    const cabinGroup = new THREE.Group();

    // Log Body House (Width 6m, Height 3.2m, Depth 4.8m)
    const body = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.2, 4.8), this.cabinLogMat);
    body.position.y = 1.6;
    body.castShadow = true;
    body.receiveShadow = true;
    cabinGroup.add(body);

    // Gabled Roof
    const roofGeo = new THREE.ConeGeometry(4.2, 2.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.scale(1.2, 1.0, 1.3);
    const roof = new THREE.Mesh(roofGeo, this.cabinRoofMat);
    roof.position.y = 4.1;
    roof.castShadow = true;
    cabinGroup.add(roof);

    // Rustic Stone Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.2, 0.9), this.stoneChimneyMat);
    chimney.position.set(2.2, 2.1, -1.2);
    chimney.castShadow = true;
    cabinGroup.add(chimney);

    // Front Porch & Stacked Firewood
    const porch = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.25, 1.8), this.cabinLogMat);
    porch.position.set(0, 0.12, 3.1);
    cabinGroup.add(porch);

    // Stacked Firewood Logs on Porch
    for (let i = 0; i < 6; i++) {
      const firewood = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.2, 6), this.logBarkMat);
      firewood.rotateZ(Math.PI / 2);
      firewood.position.set(-1.4 + (i % 3) * 0.3, 0.35 + Math.floor(i / 3) * 0.25, 3.1);
      cabinGroup.add(firewood);
    }

    cabinGroup.position.copy(cabinPos);
    cabinGroup.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 2;
    this.group.add(cabinGroup);
  }

  // --- 6. PROCEDURAL BEHAVIOR ANIMATION LOOP ---

  update(delta, elapsedTime) {
    if (this.isMobile) return; // Completely disable expensive CPU animation math on mobile

    // 1. Deer Idle & Grazing Animations (Head tilt, ear wiggling, body breathing pitch)
    this.deerEntities.forEach(d => {
      const time = elapsedTime + d.animSeed;

      // Gentle Torso Breathing
      d.parts.torso.position.y = 1.05 + Math.sin(time * 2.0) * 0.015;

      // Head Rotation & Pitch
      if (d.isGrazing) {
        // Grazing down & up interpolations
        const grazeCycle = Math.sin(time * 0.4);
        const pitch = grazeCycle > 0 ? 0.8 : -0.2; // Pitch head down to grass
        d.parts.neck.rotation.z = THREE.MathUtils.lerp(d.parts.neck.rotation.z, -0.45 + pitch, delta * 2.0);
        d.parts.head.rotation.y = Math.sin(time * 1.5) * 0.2;
      } else {
        // Looking around towards environment/road
        const lookYaw = Math.sin(time * 0.8) * 0.35 + Math.sin(time * 2.2) * 0.12;
        d.parts.head.rotation.y = THREE.MathUtils.lerp(d.parts.head.rotation.y, lookYaw, delta * 3.0);
        d.parts.head.rotation.x = Math.sin(time * 1.2) * 0.08;
      }

      // Ear Wiggling (Random fast twitch every few seconds)
      const earTwitch = Math.sin(time * 12.0) > 0.8 ? Math.sin(time * 24.0) * 0.25 : 0;
      d.parts.earR.rotation.z = earTwitch;
      d.parts.earL.rotation.z = -earTwitch;
    });

    // 2. Rabbit Subtle Nose/Head Twitching
    this.rabbitEntities.forEach(r => {
      const time = elapsedTime + r.animSeed;
      r.head.rotation.y = Math.sin(time * 3.5) * 0.25;
      r.mesh.position.y = r.baseY + Math.max(0, Math.sin(time * 4.0)) * 0.04;
    });

    // 3. Perched Birds Subtle Head Turns
    this.perchedBirds.forEach(b => {
      const time = elapsedTime + b.animSeed;
      b.mesh.rotation.y = b.baseRotY + Math.sin(time * 1.8) * 0.4;
    });

    // 4. Flying Birds Path Orbit & Wing Flapping
    if (this.flyingFlockGroup) {
      // Smooth circular loop flight path high above forest
      const flightRadius = 140;
      const angle = elapsedTime * 0.08;
      const fx = Math.cos(angle) * flightRadius;
      const fz = Math.sin(angle) * flightRadius;

      this.flyingFlockGroup.position.set(fx, 32 + Math.sin(elapsedTime * 0.3) * 4, fz);
      this.flyingFlockGroup.rotation.y = -angle + Math.PI / 2;

      // Wing Flap Rotation
      const wingFlap = Math.sin(elapsedTime * 14.0) * 0.55;
      this.flyingBirds.forEach(b => {
        b.wingR.rotation.z = wingFlap;
        b.wingL.rotation.z = -wingFlap;
      });
    }
  }
}
