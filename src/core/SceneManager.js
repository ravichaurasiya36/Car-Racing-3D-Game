import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();

    // Natural bright sunny daytime sky background color and clear atmospheric fog
    const skyColor = new THREE.Color(0x6eb7fb);
    const fogColor = new THREE.Color(0x9ed1fb);

    this.scene.background = skyColor;
    // Clear atmospheric distance haze allowing long-range visibility
    this.scene.fog = new THREE.FogExp2(fogColor, 0.0006);

    this.setupSkyDome();
    this.setupLighting();
  }

  setupSkyDome() {
    // Multi-layered procedural canvas sky dome with soft cumulus & cirrus clouds
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Vertical sky gradient from horizon to zenith
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0.0, '#9ed1fb'); // Natural horizon sky haze
    gradient.addColorStop(0.2, '#7abafd'); // Low clear sky
    gradient.addColorStop(0.65, '#5da5f8'); // Crisp zenith sky blue
    gradient.addColorStop(1.0, '#428ee6');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render multi-layered organic cumulus cloud clusters
    const drawCloudCluster = (x, y, scale, opacity) => {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.shadowColor = 'rgba(180, 210, 245, 0.35)';
      ctx.shadowBlur = 15 * scale;
      
      const puffCount = 7 + Math.floor(Math.random() * 5);
      for (let p = 0; p < puffCount; p++) {
        const px = x + (Math.random() - 0.5) * 120 * scale;
        const py = y + (Math.random() - 0.5) * 35 * scale;
        const rx = (35 + Math.random() * 55) * scale;
        const ry = (18 + Math.random() * 28) * scale;

        ctx.beginPath();
        ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    // Distant high cirrus clouds (soft transparent wisps)
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * (canvas.height * 0.35);
      drawCloudCluster(x, y, 0.6 + Math.random() * 0.8, 0.22 + Math.random() * 0.15);
    }

    // Mid-altitude realistic cumulus cloud banks
    for (let i = 0; i < 22; i++) {
      const x = Math.random() * canvas.width;
      const y = (canvas.height * 0.15) + Math.random() * (canvas.height * 0.35);
      drawCloudCluster(x, y, 0.9 + Math.random() * 1.2, 0.32 + Math.random() * 0.25);
    }

    const skyTexture = new THREE.CanvasTexture(canvas);
    const skyGeo = new THREE.SphereGeometry(950, 48, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);
  }

  setupLighting() {
    // 1. Hemisphere Light (Bright daytime sky blue to soft ground bounce)
    const skyColor = 0xbae6fd;
    const groundColor = 0x52796f;
    this.hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, 1.25);
    this.hemisphereLight.position.set(0, 100, 0);
    this.scene.add(this.hemisphereLight);

    // 2. Main Directional Sunlight (Bright sunny daylight with soft PCF shadows)
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    this.sunLight.position.set(80, 110, 50);
    this.sunLight.castShadow = true;

    // High resolution shadow map covering active driving zone
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 280;

    const shadowBounds = 90;
    this.sunLight.shadow.camera.left = -shadowBounds;
    this.sunLight.shadow.camera.right = shadowBounds;
    this.sunLight.shadow.camera.top = shadowBounds;
    this.sunLight.shadow.camera.bottom = -shadowBounds;
    this.sunLight.shadow.bias = -0.0002;
    this.sunLight.shadow.normalBias = 0.03;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // 3. Soft Ambient Fill Light (Eliminates pitch-black shadowed areas)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);
  }

  update(carPosition) {
    if (carPosition) {
      if (this.skyMesh) {
        this.skyMesh.position.set(carPosition.x, 0, carPosition.z);
      }
      if (this.sunLight) {
        // Smoothly track sun shadow camera centered near the player's car position
        this.sunLight.position.set(carPosition.x + 55, carPosition.y + 85, carPosition.z + 35);
        this.sunLight.target.position.set(carPosition.x, carPosition.y, carPosition.z);
        this.sunLight.target.updateMatrixWorld();
      }
    }
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }

  getScene() {
    return this.scene;
  }
}
