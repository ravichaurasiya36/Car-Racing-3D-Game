import * as THREE from 'three';

export class Engine {
  constructor(canvasId = 'game-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found.`);
    }

    // 1. Clock & Timers
    this.clock = new THREE.Clock();
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.currentFps = 60;
    this.updateCallbacks = [];

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Initial isometric-style view pointing toward the center
    this.camera.position.set(0, 8, 14);
    this.camera.lookAt(0, 1, 0);

    // 0. Mobile Detection (Reliable UA + Touch check)
    this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
                    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Resize & Orientation Event Listeners
    this.baseFov = 60;
    const handleResize = () => this.onWindowResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });

    // FPS DOM Element
    this.fpsElement = document.getElementById('fps-counter');
    
    // Initial call to ensure camera FOV is correctly framed for current aspect ratio
    this.onWindowResize();
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;

    // Dynamically adjust vertical FOV in portrait mode (aspect < 1) so 3D car remains properly framed
    if (aspect < 1) {
      // Scale FOV up slightly for narrow screens, capped between 60deg and 82deg
      this.camera.fov = Math.min(82, Math.max(60, this.baseFov / (aspect * 0.95)));
    } else {
      this.camera.fov = this.baseFov;
    }

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
  }

  addUpdateCallback(callback) {
    if (typeof callback === 'function') {
      this.updateCallbacks.push(callback);
    }
  }

  start(scene) {
    this.scene = scene;
    this.clock.start();

    this.renderer.setAnimationLoop(() => {
      const delta = this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();

      // FPS Calculation
      this.frameCount++;
      this.fpsTimer += delta;
      if (this.fpsTimer >= 0.5) {
        this.currentFps = Math.round(this.frameCount / this.fpsTimer);
        if (this.fpsElement) {
          this.fpsElement.textContent = `${this.currentFps} FPS`;
        }
        this.frameCount = 0;
        this.fpsTimer = 0;
      }

      // Execute registered entity updates
      for (const callback of this.updateCallbacks) {
        callback(delta, elapsedTime);
      }

      // Render Scene
      if (this.scene) {
        this.renderer.render(this.scene, this.camera);
      }
    });
  }
}
