export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.muted = false;

    // Simulated Supercar Engine State
    this.simulatedRpm = 1000; // Idle 1000 RPM -> Max 8600 RPM
    this.currentGear = 1;

    // Engine Audio Nodes
    this.engineOscCore = null;    // Fundamental firing frequency
    this.engineOscSub = null;     // Deep V10 chassis sub-bass
    this.engineOscMid = null;     // Mid-range exhaust growl
    this.engineOscScream = null;  // High-RPM V10 screaming harmonics

    this.engineFilter = null;
    this.engineShaper = null;
    this.engineGain = null;
    this.engineRunning = false;

    // Skid Audio Nodes
    this.skidSource = null;
    this.skidGain = null;
    this.skidFilter = null;

    // Brake Audio Nodes
    this.brakeGain = null;

    this.setupInteractionListeners();
  }

  setupInteractionListeners() {
    const resumeAudio = () => {
      if (!this.ctx) {
        this.initAudioContext();
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          if (!this.engineRunning) this.startEngine();
        });
      } else if (!this.engineRunning) {
        this.startEngine();
      }
    };

    window.addEventListener('pointerdown', resumeAudio, { passive: true });
    window.addEventListener('touchstart', resumeAudio, { passive: true });
    window.addEventListener('keydown', resumeAudio, { passive: true });
    window.addEventListener('click', resumeAudio, { passive: true });
  }

  initAudioContext() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.isInitialized = true;

      this.setupSupercarEngineSynth();
      this.setupSkidSynth();
      this.setupBrakeSynth();

      if (this.ctx.state === 'running') {
        this.startEngine();
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  // Generate soft overdrive curve for authentic mechanical engine warmth
  createDistortionCurve(amount = 20) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  setupSupercarEngineSynth() {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Master Engine Gain Node
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, now);

    // 2. Heavy Engine Lowpass Filter (Caps high-frequency screech strictly under 520 Hz)
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(180, now);
    this.engineFilter.Q.setValueAtTime(1.8, now);

    // 3. Soft Overdrive Waveshaper for mechanical combustion warmth
    this.engineShaper = this.ctx.createWaveShaper();
    this.engineShaper.curve = this.createDistortionCurve(10);
    this.engineShaper.oversample = '4x';

    // 4. Sub-Bass Dedicated Lowpass Filter for massive low-end weight
    this.subFilter = this.ctx.createBiquadFilter();
    this.subFilter.type = 'lowpass';
    this.subFilter.frequency.setValueAtTime(140, now);

    // 5. Oscillator Layers
    // Layer 1: Fundamental Firing Pulse (Sawtooth for mechanical growl)
    this.engineOscCore = this.ctx.createOscillator();
    this.engineOscCore.type = 'sawtooth';
    this.engineOscCore.frequency.setValueAtTime(28, now); // Deep 28 Hz idle

    // Layer 2: Massive Sub-Bass Body (Triangle for chest-thumping low-end)
    this.engineOscSub = this.ctx.createOscillator();
    this.engineOscSub.type = 'triangle';
    this.engineOscSub.frequency.setValueAtTime(14, now);

    this.subGainNode = this.ctx.createGain();
    this.subGainNode.gain.setValueAtTime(0.85, now);
    this.engineOscSub.connect(this.subGainNode);
    this.subGainNode.connect(this.subFilter);
    this.subFilter.connect(this.engineGain);

    // Layer 3: Mid-Range Mechanical Intake & Torque (Sawtooth for intake growl)
    this.engineOscMid = this.ctx.createOscillator();
    this.engineOscMid.type = 'sawtooth';
    this.engineOscMid.frequency.setValueAtTime(42, now);

    const midGainNode = this.ctx.createGain();
    midGainNode.gain.setValueAtTime(0.45, now);
    this.engineOscMid.connect(midGainNode);

    // Layer 4: Low-Frequency Throttle Exhaust Thrust (Square wave for exhaust rumble under load)
    this.engineOscExhaust = this.ctx.createOscillator();
    this.engineOscExhaust.type = 'square';
    this.engineOscExhaust.frequency.setValueAtTime(21, now);

    this.exhaustThrustGain = this.ctx.createGain();
    this.exhaustThrustGain.gain.setValueAtTime(0.2, now);
    this.engineOscExhaust.connect(this.exhaustThrustGain);

    // Layer 5: Tamed High-Frequency Detail (Low gain, strictly lowpass-filtered)
    this.engineOscHigh = this.ctx.createOscillator();
    this.engineOscHigh.type = 'sawtooth';
    this.engineOscHigh.frequency.setValueAtTime(56, now);

    this.highDetailGain = this.ctx.createGain();
    this.highDetailGain.gain.setValueAtTime(0.04, now);
    this.engineOscHigh.connect(this.highDetailGain);

    // Node Connections to Waveshaper & Lowpass Filter
    this.engineOscCore.connect(this.engineShaper);
    midGainNode.connect(this.engineShaper);
    this.exhaustThrustGain.connect(this.engineShaper);
    this.highDetailGain.connect(this.engineShaper);

    this.engineShaper.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
  }

  startEngine() {
    if (!this.ctx || this.engineRunning) return;
    try {
      this.engineOscCore.start();
      this.engineOscSub.start();
      this.engineOscMid.start();
      if (this.engineOscExhaust) this.engineOscExhaust.start();
      if (this.engineOscHigh) this.engineOscHigh.start();
      this.engineRunning = true;
    } catch (e) {}
  }

  setupSkidSynth() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.skidSource = this.ctx.createBufferSource();
    this.skidSource.buffer = buffer;
    this.skidSource.loop = true;

    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    this.skidFilter.Q.setValueAtTime(3.2, this.ctx.currentTime);

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.skidSource.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.ctx.destination);

    try {
      this.skidSource.start();
    } catch (e) {}
  }

  setupBrakeSynth() {
    if (!this.ctx) return;

    this.brakeGain = this.ctx.createGain();
    this.brakeGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    const brakeFilter = this.ctx.createBiquadFilter();
    brakeFilter.type = 'highpass';
    brakeFilter.frequency.setValueAtTime(2100, this.ctx.currentTime);

    if (this.skidSource) {
      this.skidSource.connect(brakeFilter);
      brakeFilter.connect(this.brakeGain);
      this.brakeGain.connect(this.ctx.destination);
    }
  }


  updateEngine(speedKmH, isAccelerating, delta = 0.016) {
    if (!this.ctx || !this.engineRunning || this.muted) return;

    const now = this.ctx.currentTime;
    const absSpeed = Math.abs(speedKmH);

    // 1. Arcade 4-Speed Gear Box Simulation for Sound RPM Computation
    let gear = 1;
    let gearSpeedMin = 0;
    let gearSpeedMax = 55;
    let minRpm = 1000;
    let maxRpm = 6500;

    if (absSpeed > 165) {
      gear = 4;
      gearSpeedMin = 165;
      gearSpeedMax = 200;
      minRpm = 4800;
      maxRpm = 7500;
    } else if (absSpeed > 110) {
      gear = 3;
      gearSpeedMin = 110;
      gearSpeedMax = 165;
      minRpm = 4000;
      maxRpm = 7000;
    } else if (absSpeed > 55) {
      gear = 2;
      gearSpeedMin = 55;
      gearSpeedMax = 110;
      minRpm = 3200;
      maxRpm = 6600;
    }

    this.currentGear = gear;

    // Calculate Target RPM based on gear ratio and throttle boost
    const gearProgress = Math.min(1.0, Math.max(0, (absSpeed - gearSpeedMin) / (gearSpeedMax - gearSpeedMin)));
    let targetRpm = minRpm + gearProgress * (maxRpm - minRpm);

    if (absSpeed < 1.0) {
      targetRpm = 1000; // Idle RPM at 0 KM/H
    } else if (isAccelerating) {
      targetRpm += 350; // Throttle rev boost
    }

    // Smooth RPM revving physics
    const revSpeed = isAccelerating ? 12.0 : 7.0;
    this.simulatedRpm += (targetRpm - this.simulatedRpm) * Math.min(1.0, delta * revSpeed);

    // 2. Heavy V10/V12 Firing Frequencies (Capped strictly for deep, muscular sound!)
    // Idle 1000 RPM -> 28 Hz core frequency
    // Max 7500 RPM -> 175 Hz core frequency MAX! (ZERO angry cat screeching!)
    const rpmRatio = (this.simulatedRpm - 1000) / (7500 - 1000);
    const coreFreq = 28 + Math.pow(rpmRatio, 0.9) * 147;
    const subFreq = coreFreq * 0.5;
    const midFreq = coreFreq * 1.5;
    const exhaustFreq = coreFreq * 0.75;
    const highFreq = coreFreq * 2.0;

    // Lowpass Filter Opening (Warm opening: 180 Hz idle -> 480 Hz max revs)
    const filterFreq = 180 + Math.pow(rpmRatio, 1.1) * 260 + (isAccelerating ? 80 : 0);

    // Volume Curve:
    // 0 KM/H: Quiet deep idle (gain ~0.03)
    // 50 KM/H: Moderate deep note (gain ~0.09)
    // 100 KM/H: Thick mid growl (gain ~0.18)
    // 150 KM/H: Heavy supercar roar (gain ~0.26)
    // 200 KM/H: Powerful, heavy, aggressive supercar (gain ~0.34)
    const speedRatio = Math.min(1.0, absSpeed / 200);
    const baseGain = 0.03 + Math.pow(speedRatio, 1.05) * 0.29;
    const targetGain = isAccelerating ? baseGain * 1.2 : baseGain * 0.85;

    // Exhaust Thrust Boost on active throttle
    const targetExhaustThrust = isAccelerating ? 0.35 : 0.12;
    if (this.exhaustThrustGain) {
      this.exhaustThrustGain.gain.setTargetAtTime(targetExhaustThrust, now, 0.08);
    }

    // High detail gain capped at 0.06 to prevent any screeching
    if (this.highDetailGain) {
      this.highDetailGain.gain.setTargetAtTime(0.04 + speedRatio * 0.03, now, 0.1);
    }

    // Apply smooth time constants (0.08s - 0.1s) for zero pitch jitter
    this.engineOscCore.frequency.setTargetAtTime(coreFreq, now, 0.08);
    this.engineOscSub.frequency.setTargetAtTime(subFreq, now, 0.08);
    this.engineOscMid.frequency.setTargetAtTime(midFreq, now, 0.08);
    if (this.engineOscExhaust) this.engineOscExhaust.frequency.setTargetAtTime(exhaustFreq, now, 0.08);
    if (this.engineOscHigh) this.engineOscHigh.frequency.setTargetAtTime(highFreq, now, 0.08);

    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.1);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  updateSkid(skidIntensity) {
    if (!this.ctx || !this.skidGain || this.muted) return;

    const now = this.ctx.currentTime;
    const intensity = Math.min(1.0, Math.max(0, skidIntensity));
    const targetGain = intensity > 0.05 ? intensity * 0.16 : 0.0001;

    this.skidGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  updateBrake(isBraking, speedKmH) {
    if (!this.ctx || !this.brakeGain || this.muted) return;

    const now = this.ctx.currentTime;
    const targetGain = (isBraking && speedKmH > 15) ? Math.min(0.1, (speedKmH / 200) * 0.12) : 0.0001;

    this.brakeGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  playExhaustPop() {
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCountdownBeep(isGo = false) {
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGo ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    } else {
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    }

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isGo ? 0.45 : 0.2));
  }

  playImpactSound(intensity = 1.0) {
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.15);

    const volume = Math.min(0.4, 0.15 + intensity * 0.2);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playLapSound() {
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }

  playFinishFanfare() {
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const chordNotes = [523.25, 659.25, 783.99, 1046.50];

    chordNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.85);
    });
  }
}


