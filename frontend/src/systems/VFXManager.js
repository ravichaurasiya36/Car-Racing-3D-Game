import * as THREE from 'three';

export class VFXManager {
  constructor(scene, carMesh) {
    this.scene = scene;
    this.carMesh = carMesh;

    // Object Pools
    this.exhaustPool = [];
    this.activeExhaust = [];
    this.maxExhaust = 24;

    this.skidPool = [];
    this.activeSkid = [];
    this.maxSkid = 45;

    this.spawnTimerSkid = 0;

    this.wasAccelerating = false;
    this.prevSpeed = 0;

    this.flameLengthScale = 0;
    this.flameWidthScale = 0;

    this.onExhaustPop = null;

    this.initExhaustNozzles();
    this.initSingleExhaustFlames();
    this.initSkidParticles();
    this.initSandDustParticles();
  }

  // Soft Radial Gradient Texture Generator for Seamless Continuous Sand Dust Stream
  createSoftSandDustTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.70, 'rgba(255, 255, 255, 0.25)');
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Desert Sand Dust Particle Pool
  initSandDustParticles() {
    this.sandPool = [];
    this.activeSand = [];
    this.maxSand = 140;
    this.spawnTimerSand = 0;

    const sandTexture = this.createSoftSandDustTexture();
    const geo = new THREE.PlaneGeometry(0.85, 0.85);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xda9652, // Warm vibrant desert sand golden-tan
      map: sandTexture,
      transparent: true,
      opacity: 0.70,
      depthWrite: false, // Prevents z-buffer sorting artifacts for seamless cloud blending
      side: THREE.DoubleSide
    });

    for (let i = 0; i < this.maxSand; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.sandPool.push({
        mesh,
        life: 0,
        maxLife: 0.50,
        vel: new THREE.Vector3(),
        rotVel: 0,
        scale: 1.0
      });
    }
  }

  // 1. Permanent Exhaust Nozzle Hot Glow Rings attached to car rear pipes
  initExhaustNozzles() {
    this.nozzleGlowGroup = new THREE.Group();

    const ringGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
    ringGeo.rotateX(Math.PI / 2);

    this.nozzleMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff3300,
      emissiveIntensity: 0.3,
      roughness: 0.2
    });

    this.pipeL = new THREE.Mesh(ringGeo, this.nozzleMat);
    this.pipeL.position.set(0.32, 0.58, -2.18);
    this.nozzleGlowGroup.add(this.pipeL);

    this.pipeR = new THREE.Mesh(ringGeo, this.nozzleMat);
    this.pipeR.position.set(-0.32, 0.58, -2.18);
    this.nozzleGlowGroup.add(this.pipeR);

    this.carMesh.add(this.nozzleGlowGroup);
  }

  // Synchronize nozzle positions and re-attach flame groups if car variant changed
  syncExhaustPositions(racingCar) {
    if (!this.carMesh) return;

    let positions = [
      { x: 0.32, y: 0.58, z: -2.18 },
      { x: -0.32, y: 0.58, z: -2.18 }
    ];

    if (racingCar && typeof racingCar.getExhaustPositions === 'function') {
      positions = racingCar.getExhaustPositions();
    }

    if (positions && positions.length >= 2) {
      const posL = positions[0];
      const posR = positions[1];

      if (this.pipeL) this.pipeL.position.set(posL.x, posL.y, posL.z);
      if (this.pipeR) this.pipeR.position.set(posR.x, posR.y, posR.z);

      if (this.flameL && this.flameL.group) this.flameL.group.position.set(posL.x, posL.y, posL.z);
      if (this.flameR && this.flameR.group) this.flameR.group.position.set(posR.x, posR.y, posR.z);
    }

    if (this.nozzleGlowGroup && this.nozzleGlowGroup.parent !== this.carMesh) {
      this.carMesh.add(this.nozzleGlowGroup);
    }
    if (this.flameL && this.flameL.group && this.flameL.group.parent !== this.carMesh) {
      this.carMesh.add(this.flameL.group);
    }
    if (this.flameR && this.flameR.group && this.flameR.group.parent !== this.carMesh) {
      this.carMesh.add(this.flameR.group);
    }
  }

  // Helper to construct soft flame lathe geometry
  createFlameLatheGeometry(baseRadius, maxRadius, length, segmentCount = 20, heightSegments = 24) {
    const points = [];
    for (let i = 0; i <= heightSegments; i++) {
      const t = i / heightSegments; // 0 (base at nozzle) to 1 (tip)
      const y = t * length;

      let r;
      if (t < 0.2) {
        const u = t / 0.2;
        r = THREE.MathUtils.lerp(baseRadius, maxRadius, Math.sin(u * Math.PI * 0.5));
      } else {
        const u = (t - 0.2) / 0.8;
        r = maxRadius * Math.cos(u * Math.PI * 0.5);
      }
      r = Math.max(0.001, r);
      points.push(new THREE.Vector2(r, y));
    }

    const geo = new THREE.LatheGeometry(points, segmentCount);
    // Rotate so base is at Z=0 (nozzle tip) and length extends backward along -Z
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  // Custom ShaderMaterial for soft, volumetric, realistic exhaust fire
  createRealisticFlameMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Flowing organic wave distortion along Z axis (vUv.y goes 0 at nozzle to 1 at tip)
          float flow = uTime * 24.0;
          float wave = sin(vUv.y * 14.0 - flow) * 0.08 * vUv.y;
          float n = (noise(vec2(vUv.x * 5.0, vUv.y * 8.0 - flow * 0.4)) - 0.5) * 0.15 * vUv.y;

          pos.x += (wave + n) * normal.x;
          pos.y += (wave + n) * normal.y;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uIntensity;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          float y = vUv.y; // 0.0 = exhaust nozzle, 1.0 = tip

          // Dynamic flowing combustion noise
          float fireNoise = noise(vec2(vUv.x * 6.0, y * 12.0 - uTime * 28.0));
          float detailNoise = noise(vec2(vUv.x * 12.0 + uTime * 8.0, y * 20.0 - uTime * 35.0));
          float turbulence = mix(fireNoise, detailNoise, 0.4);

          // Soft edge falloff (rim transparency eliminates solid 3D mesh border!)
          float rim = sin(vUv.x * 3.14159265);
          float edgeSoftness = pow(rim, 1.3);

          // Tip taper falloff (smooth soft tip)
          float tipSoftness = smoothstep(1.0, 0.04, y);

          // Nozzle white-hot core boost right at base
          float nozzleCore = smoothstep(0.35, 0.0, y);

          // Combined Alpha
          float alpha = edgeSoftness * tipSoftness * (0.6 + 0.4 * turbulence) * uIntensity;
          alpha = clamp(alpha, 0.0, 1.0);

          // 4-Color Ramp:
          // White-hot core -> Bright Yellow -> Hot Orange -> Deep Red-Orange rim/tip
          vec3 colorWhiteHot = vec3(1.0, 1.0, 0.92);
          vec3 colorYellow   = vec3(1.0, 0.85, 0.12);
          vec3 colorOrange   = vec3(1.0, 0.45, 0.04);
          vec3 colorRed      = vec3(0.95, 0.14, 0.02);

          vec3 finalColor;
          if (y < 0.18) {
            float t = y / 0.18;
            finalColor = mix(colorWhiteHot, colorYellow, t);
          } else if (y < 0.52) {
            float t = (y - 0.18) / 0.34;
            finalColor = mix(colorYellow, colorOrange, t);
          } else {
            float t = (y - 0.52) / 0.48;
            finalColor = mix(colorOrange, colorRed, t);
          }

          // Boost core luminosity right at nozzle
          finalColor += colorWhiteHot * nozzleCore * 0.7;

          // Modulate brightness with turbulence
          finalColor *= (1.3 + turbulence * 0.5) * uIntensity;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
  }

  createSingleFlameGroup() {
    const group = new THREE.Group();
    const flameMat = this.createRealisticFlameMaterial();

    // 1. Soft Volumetric Body Shell
    const bodyGeo = this.createFlameLatheGeometry(0.08, 0.15, 1.15, 20, 24);
    const bodyMesh = new THREE.Mesh(bodyGeo, flameMat);
    group.add(bodyMesh);

    // 2. Internal Core Quad Blade (Adds dense central fire core visible from all angles)
    const planeGeo = new THREE.PlaneGeometry(0.24, 1.15, 12, 16);
    planeGeo.translate(0, 0.575, 0);
    planeGeo.rotateX(-Math.PI / 2);

    const quadMesh1 = new THREE.Mesh(planeGeo, flameMat);
    group.add(quadMesh1);

    const quadMesh2 = new THREE.Mesh(planeGeo, flameMat);
    quadMesh2.rotation.z = Math.PI / 2;
    group.add(quadMesh2);

    return {
      group,
      flameMat,
      bodyMesh
    };
  }

  // 2. Single Continuous Flame Jet per Exhaust Nozzle (Anchored directly at rear pipes)
  initSingleExhaustFlames() {
    this.flameL = this.createSingleFlameGroup();
    this.flameL.group.position.set(0.32, 0.58, -2.18);
    this.flameL.group.visible = false;
    this.carMesh.add(this.flameL.group);

    this.flameR = this.createSingleFlameGroup();
    this.flameR.group.position.set(-0.32, 0.58, -2.18);
    this.flameR.group.visible = false;
    this.carMesh.add(this.flameR.group);
  }

  // 3. Fine, Subtle Road Dust (60% Smaller, Low-Opacity)
  initSkidParticles() {
    const geo = new THREE.SphereGeometry(0.08, 8, 8); // Small 0.08m radius
    const mat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.35,
      roughness: 0.9,
      metalness: 0.05
    });

    for (let i = 0; i < this.maxSkid; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.skidPool.push({
        mesh,
        life: 0,
        maxLife: 0.35,
        vel: new THREE.Vector3(),
        scale: 1.0
      });
    }
  }

  update(delta, speedKmH, steerAngle, isAccelerating, isBraking, isGarageMode = false, racingCar = null, isOffRoadSand = false) {
    if (!this.carMesh) return;

    // Ensure exhaust flame groups and positions are synchronized with active 3D vehicle model
    this.syncExhaustPositions(racingCar);

    const carPos = this.carMesh.position;
    const heading = this.carMesh.rotation.y;
    const forwardX = Math.sin(heading);
    const forwardZ = Math.cos(heading);
    const absSpeed = Math.abs(speedKmH);

    // In Garage showroom mode, activate showcase idle flame pulse
    if (isGarageMode) {
      isAccelerating = true;
    }

    // 1. UPDATE EXHAUST NOZZLE HOT GLOW
    if (this.nozzleMat) {
      const targetNozzleEmissive = isAccelerating ? (absSpeed > 100 ? 4.0 : 2.2) : 0.3;
      this.nozzleMat.emissiveIntensity = THREE.MathUtils.lerp(
        this.nozzleMat.emissiveIntensity,
        targetNozzleEmissive,
        delta * 12
      );
    }

    // 2. CHECK FOR THROTTLE RELEASE BACKFIRE POP
    if (this.wasAccelerating && !isAccelerating && absSpeed > 90) {
      if (Math.random() < 0.35) { // 35% chance on high speed throttle lift
        this.flameLengthScale = 2.4;
        this.flameWidthScale = 1.6;
        if (typeof this.onExhaustPop === 'function') {
          this.onExhaustPop();
        }
      }
    }
    this.wasAccelerating = isAccelerating;
    this.prevSpeed = absSpeed;

    // 3. SINGLE CONTINUOUS FLAME SCALE UPDATE
    const speedRatio = Math.min(1.0, absSpeed / 200);
    let targetLength = 0.0;
    let targetWidth = 0.0;

    if (isAccelerating) {
      if (isGarageMode) {
        const garageFlicker = Math.sin(Date.now() * 0.006) * 0.25 + 1.0;
        targetLength = 0.95 * garageFlicker;
        targetWidth = 0.75 * garageFlicker;
      } else {
        targetLength = 0.45 + speedRatio * 2.15;
        targetWidth = 0.55 + speedRatio * 0.90;
      }
    }

    const lerpRate = isAccelerating ? 12.0 : 16.0;
    this.flameLengthScale = THREE.MathUtils.lerp(this.flameLengthScale, targetLength, delta * lerpRate);
    this.flameWidthScale = THREE.MathUtils.lerp(this.flameWidthScale, targetWidth, delta * lerpRate);

    // Natural organic micro-flicker
    const now = Date.now() * 0.03;
    const flickerZ = 1.0 + Math.sin(now) * 0.05 + (Math.random() - 0.5) * 0.06;
    const flickerXY = 1.0 + Math.cos(now * 1.3) * 0.04 + (Math.random() - 0.5) * 0.05;

    const timeVal = Date.now() * 0.001;
    const intensityVal = 0.85 + speedRatio * 0.65;

    if (this.flameL) {
      if (this.flameL.flameMat) {
        this.flameL.flameMat.uniforms.uTime.value = timeVal;
        this.flameL.flameMat.uniforms.uIntensity.value = intensityVal;
      }
      if (this.flameLengthScale < 0.03) {
        this.flameL.group.visible = false;
      } else {
        this.flameL.group.visible = true;
        const w = this.flameWidthScale * flickerXY;
        const l = this.flameLengthScale * flickerZ;
        this.flameL.group.scale.set(w, w, l);
      }
    }

    if (this.flameR) {
      if (this.flameR.flameMat) {
        this.flameR.flameMat.uniforms.uTime.value = timeVal;
        this.flameR.flameMat.uniforms.uIntensity.value = intensityVal;
      }
      if (this.flameLengthScale < 0.03) {
        this.flameR.group.visible = false;
      } else {
        this.flameR.group.visible = true;
        const w = this.flameWidthScale * flickerXY;
        const l = this.flameLengthScale * flickerZ;
        this.flameR.group.scale.set(w, w, l);
      }
    }

    // 4. SUBTLE TIRE / ROAD DUST EMISSION (Small, soft, low-emission)
    const steerSkidFactor = Math.abs(steerAngle) > 0.20 && absSpeed > 35;
    const brakeSkidFactor = isBraking && absSpeed > 45;
    const isSkidding = steerSkidFactor || brakeSkidFactor;

    this.spawnTimerSkid += delta;
    if (isSkidding && this.spawnTimerSkid >= 0.06) {
      this.spawnTimerSkid = 0;

      const rearZ = -1.35;
      const wheelOffsetsX = [0.85, -0.85];

      for (const rx of wheelOffsetsX) {
        if (this.skidPool.length > 0) {
          const p = this.skidPool.pop();
          p.life = 0;
          p.maxLife = 0.30 + Math.random() * 0.12;

          const worldX = carPos.x + forwardX * rearZ + Math.cos(heading) * rx;
          const worldY = carPos.y + 0.05; // Low road surface contact
          const worldZ = carPos.z + forwardZ * rearZ - Math.sin(heading) * rx;

          p.mesh.position.set(worldX, worldY, worldZ);
          p.vel.set(
            (Math.random() - 0.5) * 0.4,
            0.2 + Math.random() * 0.3,
            (Math.random() - 0.5) * 0.4
          );

          p.mesh.material.opacity = 0.35;
          p.scale = 0.6 + Math.random() * 0.3;
          p.mesh.scale.set(p.scale, p.scale, p.scale);
          p.mesh.visible = true;

          this.activeSkid.push(p);
        }
      }
    }

    // Update Active Tire Dust Particles
    for (let i = this.activeSkid.length - 1; i >= 0; i--) {
      const p = this.activeSkid[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
        this.skidPool.push(p);
        this.activeSkid.splice(i, 1);
      } else {
        const progress = p.life / p.maxLife;
        p.mesh.position.x += p.vel.x * delta;
        p.mesh.position.y += p.vel.y * delta;
        p.mesh.position.z += p.vel.z * delta;

        p.mesh.material.opacity = (1 - progress) * 0.35;
        const currentScale = p.scale * (1 + progress * 0.7);
        p.mesh.scale.set(currentScale, currentScale, currentScale);
      }
    }

    // 5. CONTINUOUS DESERT SAND DUST TRAIL (Active ONLY when on Desert Apex Sand)
    if (isOffRoadSand && absSpeed > 6) {
      this.spawnTimerSand += delta;
      // Gapless continuous spawn interval (12ms to 22ms)
      const spawnInterval = Math.max(0.012, 0.030 - (absSpeed / 180) * 0.018);

      if (this.spawnTimerSand >= spawnInterval) {
        this.spawnTimerSand = 0;
        const rearZ = -1.15;
        const wheelOffsetsX = [0.82, -0.82];

        for (const rx of wheelOffsetsX) {
          if (this.sandPool && this.sandPool.length > 0) {
            const p = this.sandPool.pop();
            p.life = 0;
            p.maxLife = 0.42 + Math.random() * 0.16; // ~0.50s average lifetime

            // Elevate spawn point safely above terrain (carPos.y + 0.35) to prevent ground z-clipping
            const worldX = carPos.x + forwardX * rearZ + Math.cos(heading) * rx;
            const worldY = carPos.y + 0.35;
            const worldZ = carPos.z + forwardZ * rearZ - Math.sin(heading) * rx;

            p.mesh.position.set(worldX, worldY, worldZ);
            p.mesh.rotation.x = -Math.PI / 4 + (Math.random() - 0.5) * 0.3;
            p.mesh.rotation.y = heading + (Math.random() - 0.5) * 0.4;
            p.mesh.rotation.z = Math.random() * Math.PI * 2;
            p.rotVel = (Math.random() - 0.5) * 2.0;

            p.vel.set(
              (Math.random() - 0.5) * 0.4 - forwardX * (absSpeed * 0.02),
              0.35 + Math.random() * 0.40,
              (Math.random() - 0.5) * 0.4 - forwardZ * (absSpeed * 0.02)
            );

            p.mesh.material.opacity = 0.70;
            p.scale = 0.85 + Math.random() * 0.45;
            p.mesh.scale.set(p.scale, p.scale, p.scale);
            p.mesh.visible = true;

            this.activeSand.push(p);
          }
        }
      }
    }

    // Update Active Sand Dust Particles
    if (this.activeSand) {
      for (let i = this.activeSand.length - 1; i >= 0; i--) {
        const p = this.activeSand[i];
        p.life += delta;

        if (p.life >= p.maxLife) {
          p.mesh.visible = false;
          this.sandPool.push(p);
          this.activeSand.splice(i, 1);
        } else {
          const progress = p.life / p.maxLife;
          p.mesh.position.x += p.vel.x * delta;
          p.mesh.position.y += p.vel.y * delta;
          p.mesh.position.z += p.vel.z * delta;

          p.mesh.rotation.z += p.rotVel * delta;

          // Vibrant, smooth linear fade out
          p.mesh.material.opacity = (1 - progress) * 0.70;

          // Continuous expanding trail growth
          const currentScale = p.scale * (1 + progress * 1.8);
          p.mesh.scale.set(currentScale, currentScale, currentScale);
        }
      }
    }
  }

  getSkidFactor(speedKmH, steerAngle, isBraking) {
    if (Math.abs(speedKmH) < 25) return 0;
    const steerSkid = Math.abs(steerAngle) > 0.20 ? Math.min(1.0, (Math.abs(speedKmH) / 180) * (Math.abs(steerAngle) / 0.45)) : 0;
    const brakeSkid = isBraking ? Math.min(0.8, Math.abs(speedKmH) / 150) : 0;
    return Math.max(steerSkid, brakeSkid);
  }
}

