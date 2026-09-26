import * as THREE from 'three';

export class RacingCar {
  constructor() {
    this.meshGroup = new THREE.Group();
    this.wheels = [];
    this.frontWheelPivotL = new THREE.Group();
    this.frontWheelPivotR = new THREE.Group();

    this.speed = 0;
    this.targetSteer = 0;
    this.isBraking = false;

    this.paintMat = null;
    this.rimMat = null;
    this.caliperMat = null;

    this.currentVariant = 'lamborghini_svj';
    this.buildVibrantYellowLamborghiniMesh();
  }

  setVehicleVariant(vehicleId = 'lamborghini_svj') {
    if (this.currentVariant === vehicleId && this.meshGroup.children.length > 0) {
      return;
    }

    this.disposeMeshGroup();

    switch (vehicleId) {
      case 'ferrari_488':
        this.buildRossoApex488Mesh();
        break;
      case 'bugatti_hypercar':
        this.buildApexRoyaleHyperGTMesh();
        break;
      case 'lamborghini_svj':
      default:
        this.buildVibrantYellowLamborghiniMesh();
        break;
    }

    this.currentVariant = vehicleId;
  }

  getExhaustPositions() {
    switch (this.currentVariant) {
      case 'ferrari_488':
        return [
          { x: 0.42, y: 0.42, z: -2.18 },
          { x: -0.42, y: 0.42, z: -2.18 }
        ];
      case 'bugatti_hypercar':
        return [
          { x: 0.28, y: 0.44, z: -2.32 },
          { x: -0.28, y: 0.44, z: -2.32 }
        ];
      case 'lamborghini_svj':
      default:
        return [
          { x: 0.32, y: 0.58, z: -2.18 },
          { x: -0.32, y: 0.58, z: -2.18 }
        ];
    }
  }

  setPaint(paintObj) {
    if (!paintObj || !this.paintMat) return;
    this.paintMat.color.setHex(paintObj.numHex);
    this.paintMat.roughness = paintObj.roughness;
    this.paintMat.metalness = paintObj.metalness;
    if (paintObj.emissive !== undefined) {
      this.paintMat.emissive.setHex(paintObj.emissive);
    } else {
      this.paintMat.emissive.setHex(0x000000);
    }
    this.paintMat.needsUpdate = true;
  }

  setWheelStyle(wheelObj) {
    if (!wheelObj) return;
    if (this.rimMat) {
      this.rimMat.color.setHex(wheelObj.rimColor);
      this.rimMat.roughness = wheelObj.rimRoughness;
      this.rimMat.metalness = wheelObj.rimMetalness;
      this.rimMat.needsUpdate = true;
    }
    if (this.caliperMat) {
      this.caliperMat.color.setHex(wheelObj.caliperColor);
      this.caliperMat.needsUpdate = true;
    }
  }

  applyCustomization(config = {}) {
    if (config.vehicleId) {
      this.setVehicleVariant(config.vehicleId);
    }
    if (config.paintObj) {
      this.setPaint(config.paintObj);
    }
    if (config.wheelStyleObj) {
      this.setWheelStyle(config.wheelStyleObj);
    }
  }

  disposeMeshGroup() {
    const disposeNode = (node) => {
      if (node.geometry) node.geometry.dispose();
      if (node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach(m => m.dispose());
        } else {
          node.material.dispose();
        }
      }
    };

    while (this.meshGroup.children.length > 0) {
      const child = this.meshGroup.children[0];
      child.traverse(disposeNode);
      this.meshGroup.remove(child);
    }

    this.wheels = [];
    this.frontWheelPivotL = new THREE.Group();
    this.frontWheelPivotR = new THREE.Group();
  }

  buildVibrantYellowLamborghiniMesh() {
    const bodyLength = 4.85;
    const bodyWidth = 2.32;

    this.paintMat = new THREE.MeshStandardMaterial({
      color: 0xffd21f,
      roughness: 0.14,
      metalness: 0.38,
      emissive: 0x332600,
      emissiveIntensity: 0.2,
      envMapIntensity: 1.8
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x11141a,
      roughness: 0.42,
      metalness: 0.6
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x050812,
      roughness: 0.04,
      metalness: 0.95,
      transparent: true,
      opacity: 0.9
    });

    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.85, metalness: 0.05 });
    this.rimMat = new THREE.MeshStandardMaterial({ color: 0x22262d, roughness: 0.16, metalness: 0.94 });
    const discMat = new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.35, metalness: 0.85 });
    this.caliperMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.2, metalness: 0.5 });
    const exhaustMetalMat = new THREE.MeshStandardMaterial({ color: 0x4a4e57, roughness: 0.25, metalness: 0.95 });

    // Ground AO Shadow
    const shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.75, 5.35).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.48 })
    );
    shadowMesh.position.y = 0.015;
    this.meshGroup.add(shadowMesh);

    // Body Monocoque Tub
    const tubMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.18, bodyLength * 0.88, 14).rotateX(Math.PI / 2).scale(1.0, 0.35, 1.0),
      this.paintMat
    );
    tubMesh.position.set(0, 0.32, 0);
    tubMesh.castShadow = true;
    tubMesh.receiveShadow = true;
    this.meshGroup.add(tubMesh);

    // Wedge Nose & Front Splitter
    const noseMesh = new THREE.Mesh(
      new THREE.ConeGeometry(bodyWidth * 0.46, 1.45, 8).rotateX(-Math.PI / 2).scale(1.0, 0.3, 1.0),
      this.paintMat
    );
    noseMesh.position.set(0, 0.32, 1.78);
    noseMesh.castShadow = true;
    this.meshGroup.add(noseMesh);

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.96, 0.06, 0.62), carbonMat);
    splitter.position.set(0, 0.15, 2.34);
    splitter.castShadow = true;
    this.meshGroup.add(splitter);

    for (const side of [1.04, -1.04]) {
      const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.45), carbonMat);
      winglet.position.set(side, 0.22, 2.3);
      winglet.rotation.z = side * -0.2;
      this.meshGroup.add(winglet);
    }

    // Hood
    const hoodMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth * 0.76, 0.18, 1.55).rotateX(-0.14),
      this.paintMat
    );
    hoodMesh.position.set(0, 0.45, 1.35);
    hoodMesh.castShadow = true;
    this.meshGroup.add(hoodMesh);

    // Greenhouse Canopy & Glass
    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.32, 1.45), this.paintMat);
    roofMesh.position.set(0, 0.88, -0.15);
    roofMesh.castShadow = true;
    this.meshGroup.add(roofMesh);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.48, 1.15).rotateX(0.55), glassMat);
    windshield.position.set(0, 0.72, 0.62);
    this.meshGroup.add(windshield);

    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.45, 1.35).rotateX(-0.35), glassMat);
    rearGlass.position.set(0, 0.75, -0.92);
    this.meshGroup.add(rearGlass);

    // Rear Haunches & Engine Bay Louvers
    for (const side of [0.92, -0.92]) {
      const haunch = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 2.1), this.paintMat);
      haunch.position.set(side, 0.48, -0.65);
      haunch.castShadow = true;
      this.meshGroup.add(haunch);
    }

    for (let i = 0; i < 5; i++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.03, 0.18), carbonMat);
      louver.position.set(0, 0.76 + i * 0.03, -0.45 - i * 0.22);
      louver.rotation.x = -0.22;
      this.meshGroup.add(louver);
    }

    // Rear ALA Wing
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.05, 0.48), carbonMat);
    wingBlade.position.set(0, 1.08, -2.15);
    wingBlade.castShadow = true;
    this.meshGroup.add(wingBlade);

    for (const side of [0.65, -0.65]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.28), carbonMat);
      strut.position.set(side, 0.84, -2.12);
      this.meshGroup.add(strut);
    }

    // Rear Diffuser & High-Position Dual Exhaust Nozzles
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.28, 0.65), carbonMat);
    diffuser.position.set(0, 0.24, -2.1);
    this.meshGroup.add(diffuser);

    for (const side of [0.32, -0.32]) {
      const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.35, 16).rotateX(Math.PI / 2), exhaustMetalMat);
      exhaustPipe.position.set(side, 0.58, -2.18);
      this.meshGroup.add(exhaustPipe);
    }

    // Taillights
    this.brakeLightMat = new THREE.MeshStandardMaterial({
      color: 0xff0022,
      emissive: 0xff0022,
      emissiveIntensity: 0.3,
      roughness: 0.2
    });

    for (const side of [0.72, -0.72]) {
      const brakeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.08), this.brakeLightMat);
      brakeMesh.position.set(side, 0.62, -2.18);
      this.meshGroup.add(brakeMesh);
    }

    // Wheels & Suspension
    this.buildSupercarWheels(tireMat, this.rimMat, discMat, this.caliperMat);

    // Headlights
    this.buildSupercarHeadlights();
  }

  buildRossoApex488Mesh() {
    const bodyLength = 4.65;
    const bodyWidth = 2.26;

    this.paintMat = new THREE.MeshStandardMaterial({
      color: 0xdd0b18,
      roughness: 0.12,
      metalness: 0.42,
      emissive: 0x220004,
      emissiveIntensity: 0.2,
      envMapIntensity: 2.0
    });

    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.42, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x050812, roughness: 0.04, metalness: 0.95, transparent: true, opacity: 0.9 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.85, metalness: 0.05 });
    this.rimMat = new THREE.MeshStandardMaterial({ color: 0x1e222a, roughness: 0.15, metalness: 0.95 });
    const discMat = new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.35, metalness: 0.85 });
    this.caliperMat = new THREE.MeshStandardMaterial({ color: 0xffd21f, roughness: 0.2, metalness: 0.5 });
    const exhaustMetalMat = new THREE.MeshStandardMaterial({ color: 0x3a3e47, roughness: 0.2, metalness: 0.95 });

    // Ground AO Shadow
    const shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 5.1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.48 })
    );
    shadowMesh.position.y = 0.015;
    this.meshGroup.add(shadowMesh);

    // Sculpted Body Tub
    const tubMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.08, 1.15, bodyLength * 0.85, 16).rotateX(Math.PI / 2).scale(1.0, 0.36, 1.0),
      this.paintMat
    );
    tubMesh.position.set(0, 0.33, 0);
    tubMesh.castShadow = true;
    tubMesh.receiveShadow = true;
    this.meshGroup.add(tubMesh);

    // Rounded Aerodynamic Nose
    const noseMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 16, 16).scale(1.05, 0.32, 1.25),
      this.paintMat
    );
    noseMesh.position.set(0, 0.34, 1.45);
    noseMesh.castShadow = true;
    this.meshGroup.add(noseMesh);

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.92, 0.06, 0.58), carbonMat);
    splitter.position.set(0, 0.14, 2.22);
    splitter.castShadow = true;
    this.meshGroup.add(splitter);

    // Slanted Windshield & Roof Canopy
    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.34, 1.35), this.paintMat);
    roofMesh.position.set(0, 0.89, -0.12);
    roofMesh.castShadow = true;
    this.meshGroup.add(roofMesh);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.46, 1.12).rotateX(0.52), glassMat);
    windshield.position.set(0, 0.74, 0.58);
    this.meshGroup.add(windshield);

    // Large Side Intake Scoops
    for (const side of [0.95, -0.95]) {
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.85), carbonMat);
      scoop.position.set(side, 0.48, -0.42);
      this.meshGroup.add(scoop);
    }

    // Rear Spoiler Lip & Diffuser
    const rearLip = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.35), carbonMat);
    rearLip.position.set(0, 0.82, -2.15);
    this.meshGroup.add(rearLip);

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.28, 0.62), carbonMat);
    diffuser.position.set(0, 0.22, -2.08);
    this.meshGroup.add(diffuser);

    for (const side of [0.42, -0.42]) {
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 16).rotateX(Math.PI / 2), exhaustMetalMat);
      exhaust.position.set(side, 0.42, -2.18);
      this.meshGroup.add(exhaust);
    }

    // Twin Round Taillights
    this.brakeLightMat = new THREE.MeshStandardMaterial({
      color: 0xff0022,
      emissive: 0xff0022,
      emissiveIntensity: 0.3,
      roughness: 0.2
    });

    for (const side of [0.65, -0.65]) {
      const taillight = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 24).rotateX(Math.PI / 2), this.brakeLightMat);
      taillight.position.set(side, 0.64, -2.16);
      this.meshGroup.add(taillight);
    }

    this.buildSupercarWheels(tireMat, this.rimMat, discMat, this.caliperMat);
    this.buildSupercarHeadlights();
  }

  buildApexRoyaleHyperGTMesh() {
    const bodyLength = 4.95;
    const bodyWidth = 2.42;

    this.paintMat = new THREE.MeshStandardMaterial({
      color: 0x0a3880,
      roughness: 0.12,
      metalness: 0.85,
      emissive: 0x000822,
      emissiveIntensity: 0.15,
      envMapIntensity: 2.4
    });

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe0e6ed, roughness: 0.05, metalness: 0.98 });
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.38, metalness: 0.65 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x050812, roughness: 0.04, metalness: 0.95, transparent: true, opacity: 0.9 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.85, metalness: 0.05 });
    this.rimMat = new THREE.MeshStandardMaterial({ color: 0x22262d, roughness: 0.12, metalness: 0.95 });
    const discMat = new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.35, metalness: 0.85 });
    this.caliperMat = new THREE.MeshStandardMaterial({ color: 0xffd21f, roughness: 0.18, metalness: 0.85 });
    const exhaustMetalMat = new THREE.MeshStandardMaterial({ color: 0x4a4e57, roughness: 0.2, metalness: 0.95 });

    // Ground AO Shadow
    const shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.85, 5.25).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.52 })
    );
    shadowMesh.position.y = 0.015;
    this.meshGroup.add(shadowMesh);

    // Sculpted Wide Monocoque Hypercar Body
    const tubMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.18, 1.25, bodyLength * 0.88, 18).rotateX(Math.PI / 2).scale(1.0, 0.34, 1.0),
      this.paintMat
    );
    tubMesh.position.set(0, 0.34, 0);
    tubMesh.castShadow = true;
    tubMesh.receiveShadow = true;
    this.meshGroup.add(tubMesh);

    // Iconic Bugatti Horseshoe Front Grille Arch Surround
    const grilleArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.05, 12, 24, Math.PI),
      chromeMat
    );
    grilleArch.position.set(0, 0.38, 2.16);
    grilleArch.rotation.z = Math.PI;
    this.meshGroup.add(grilleArch);

    const grilleInner = new THREE.Mesh(
      new THREE.CircleGeometry(0.36, 24, Math.PI),
      carbonMat
    );
    grilleInner.position.set(0, 0.38, 2.15);
    grilleInner.rotation.z = Math.PI;
    this.meshGroup.add(grilleInner);

    // Front Nose & Splitter
    const noseMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.12, 16, 16).scale(1.04, 0.3, 1.2),
      this.paintMat
    );
    noseMesh.position.set(0, 0.34, 1.55);
    noseMesh.castShadow = true;
    this.meshGroup.add(noseMesh);

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth * 0.94, 0.06, 0.65), carbonMat);
    splitter.position.set(0, 0.14, 2.32);
    splitter.castShadow = true;
    this.meshGroup.add(splitter);

    // Signature Bugatti Side C-Line Swoop Curves
    for (const side of [1.06, -1.06]) {
      const cLine = new THREE.Mesh(
        new THREE.TorusGeometry(0.85, 0.04, 12, 32, Math.PI * 1.3),
        chromeMat
      );
      cLine.position.set(side, 0.62, -0.1);
      cLine.rotation.y = side * (Math.PI / 2);
      cLine.rotation.x = 0.2;
      this.meshGroup.add(cLine);
    }

    // Canopy Roof & Slanted Windshield
    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.32, 1.42), this.paintMat);
    roofMesh.position.set(0, 0.88, -0.15);
    roofMesh.castShadow = true;
    this.meshGroup.add(roofMesh);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.46, 1.15).rotateX(0.54), glassMat);
    windshield.position.set(0, 0.74, 0.6);
    this.meshGroup.add(windshield);

    // Massive Side Intake Scoops & W16 Engine Cover
    for (const side of [1.02, -1.02]) {
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 1.1), carbonMat);
      scoop.position.set(side, 0.48, -0.45);
      this.meshGroup.add(scoop);
    }

    for (let i = 0; i < 4; i++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.03, 0.16), carbonMat);
      louver.position.set(0, 0.78 + i * 0.03, -0.45 - i * 0.24);
      louver.rotation.x = -0.18;
      this.meshGroup.add(louver);
    }

    // Active Aero Rear Wing & Diffuser
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.06, 0.45), carbonMat);
    wingBlade.position.set(0, 1.06, -2.12);
    wingBlade.castShadow = true;
    this.meshGroup.add(wingBlade);

    for (const side of [0.72, -0.72]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.26), carbonMat);
      strut.position.set(side, 0.84, -2.1);
      this.meshGroup.add(strut);
    }

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.3, 0.68), carbonMat);
    diffuser.position.set(0, 0.22, -2.22);
    this.meshGroup.add(diffuser);

    // Quad Rear Exhaust Pipes Arrangement
    for (const side of [0.28, -0.28, 0.14, -0.14]) {
      const exhaustPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.35, 16).rotateX(Math.PI / 2),
        exhaustMetalMat
      );
      exhaustPipe.position.set(side, 0.44, -2.32);
      this.meshGroup.add(exhaustPipe);
    }

    // Full-Width Rear Lightbar
    this.brakeLightMat = new THREE.MeshStandardMaterial({
      color: 0xff0022,
      emissive: 0xff0022,
      emissiveIntensity: 0.35,
      roughness: 0.2
    });

    const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.06, 0.08), this.brakeLightMat);
    lightbar.position.set(0, 0.64, -2.25);
    this.meshGroup.add(lightbar);

    // Wheels & Headlights
    this.buildSupercarWheels(tireMat, this.rimMat, discMat, this.caliperMat);
    this.buildHypercarHeadlights();
  }

  buildHypercarHeadlights() {
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const side of [0.82, -0.82]) {
      for (let i = 0; i < 4; i++) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), ledMat);
        block.position.set(side + (i * 0.04 - 0.06) * (side > 0 ? 1 : -1), 0.48, 2.15);
        this.meshGroup.add(block);
      }
    }

    const spotLight = new THREE.SpotLight(0xffffff, 3.2);
    spotLight.position.set(0, 0.52, 2.1);
    spotLight.target.position.set(0, 0, 18);
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.35;
    spotLight.distance = 35;
    this.meshGroup.add(spotLight);
    this.meshGroup.add(spotLight.target);
  }

  buildSupercarWheels(tireMat, rimMat, discMat, caliperMat) {
    const frontRadius = 0.42;
    const rearRadius = 0.44;
    const frontWidth = 0.34;
    const rearWidth = 0.38;
    const xOffset = 0.98;
    const frontZ = 1.48;
    const rearZ = -1.35;

    const createPerformanceWheel = (radius, width) => {
      const wheelGroup = new THREE.Group();

      const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, tireMat);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      const rimGeo = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width + 0.01, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rimMesh);

      const discGeo = new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, 0.05, 16);
      discGeo.rotateZ(Math.PI / 2);
      const discMesh = new THREE.Mesh(discGeo, discMat);
      wheelGroup.add(discMesh);

      const caliperGeo = new THREE.BoxGeometry(0.12, radius * 0.48, width * 0.7);
      const caliperMesh = new THREE.Mesh(caliperGeo, caliperMat);
      caliperMesh.position.set(0, radius * 0.32, 0);
      wheelGroup.add(caliperMesh);

      return wheelGroup;
    };

    // Front Left
    const flWheel = createPerformanceWheel(frontRadius, frontWidth);
    flWheel.position.set(0, 0, 0);
    this.frontWheelPivotL.position.set(xOffset, frontRadius, frontZ);
    this.frontWheelPivotL.add(flWheel);
    this.meshGroup.add(this.frontWheelPivotL);
    this.wheels.push(flWheel);

    // Front Right
    const frWheel = createPerformanceWheel(frontRadius, frontWidth);
    frWheel.position.set(0, 0, 0);
    this.frontWheelPivotR.position.set(-xOffset, frontRadius, frontZ);
    this.frontWheelPivotR.add(frWheel);
    this.meshGroup.add(this.frontWheelPivotR);
    this.wheels.push(frWheel);

    // Rear Left
    const rlWheel = createPerformanceWheel(rearRadius, rearWidth);
    rlWheel.position.set(xOffset, rearRadius, rearZ);
    this.meshGroup.add(rlWheel);
    this.wheels.push(rlWheel);

    // Rear Right
    const rrWheel = createPerformanceWheel(rearRadius, rearWidth);
    rrWheel.position.set(-xOffset, rearRadius, rearZ);
    this.meshGroup.add(rrWheel);
    this.wheels.push(rrWheel);
  }

  buildSupercarHeadlights() {
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const side of [0.75, -0.75]) {
      const drl1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.06), ledMat);
      drl1.position.set(side, 0.52, 2.15);
      drl1.rotation.y = side * -0.24;
      this.meshGroup.add(drl1);

      const drl2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.06), ledMat);
      drl2.position.set(side * 0.9, 0.44, 2.16);
      drl2.rotation.set(0.1, side * -0.24, side * 0.4);
      this.meshGroup.add(drl2);

      const proj = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), ledMat);
      proj.position.set(side * 0.78, 0.5, 2.16);
      this.meshGroup.add(proj);
    }

    const spotLight = new THREE.SpotLight(0xffffff, 2.8);
    spotLight.position.set(0, 0.52, 2.1);
    spotLight.target.position.set(0, 0, 18);
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.35;
    spotLight.distance = 35;
    this.meshGroup.add(spotLight);
    this.meshGroup.add(spotLight.target);
  }

  setPhysicsState(speed, steerAngle, isBraking) {
    this.speed = speed;
    this.targetSteer = steerAngle;
    this.isBraking = isBraking;
  }

  update(delta, elapsedTime) {
    const wheelSpinSpeed = (this.speed / 0.42) * delta;
    for (const wheel of this.wheels) {
      wheel.rotation.x += wheelSpinSpeed;
    }

    const currentSteer = this.targetSteer || 0;
    this.frontWheelPivotL.rotation.y = THREE.MathUtils.lerp(this.frontWheelPivotL.rotation.y, currentSteer, delta * 12);
    this.frontWheelPivotR.rotation.y = THREE.MathUtils.lerp(this.frontWheelPivotR.rotation.y, currentSteer, delta * 12);

    if (this.brakeLightMat) {
      const targetEmissive = this.isBraking ? 2.4 : 0.3;
      this.brakeLightMat.emissiveIntensity = THREE.MathUtils.lerp(
        this.brakeLightMat.emissiveIntensity,
        targetEmissive,
        delta * 14
      );
    }

    const vib = Math.abs(this.speed) > 0.5 ? Math.sin(elapsedTime * 25) * 0.012 : Math.sin(elapsedTime * 4) * 0.008;
    this.meshGroup.position.y = vib;
  }

  getMesh() {
    return this.meshGroup;
  }
}
