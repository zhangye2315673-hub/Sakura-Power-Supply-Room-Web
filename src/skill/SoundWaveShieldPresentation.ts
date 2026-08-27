import * as THREE from 'three';
import { POWERED_ACTIVE_DURATION } from '../appliances/poweredAnimation';

const BOUNDS_PADDING = 1.11;
const MINIMUM_RADIUS = 1.25;
const ARM_DURATION = POWERED_ACTIVE_DURATION;
const REMINDER_DURATION = 3.45;
const REMINDER_INTERVAL = 8.5;
const IMPACT_DURATION = 0.9;
const ARM_RING_CYCLES = 4;
const REMINDER_RING_CYCLES = 3;

type SoundWaveShieldPhase = 'idle' | 'arming' | 'reminder' | 'impact';

type SoundWaveShieldUniforms = {
  time: { value: number };
  visibility: { value: number };
  mode: { value: number };
  progress: { value: number };
  impactDirection: { value: THREE.Vector3 };
};

export type SoundWaveShieldDiagnostics = Readonly<{
  protected: boolean;
  phase: SoundWaveShieldPhase;
  visible: boolean;
  opacity: number;
  center: readonly [number, number, number];
  radius: number;
  targetCount: number;
  depthWrite: boolean;
  idleVisibility: 0;
  persistentGeometry: false;
  waveBandMode: 'spherical-latitude';
  impactProgress: number;
  reminderCount: number;
  impactCount: number;
  reminderInterval: number;
  secondsUntilReminder: number;
  appearanceRingCycles: number;
  surfaceRingProgress: number;
}>;

function createMaterial(uniforms: SoundWaveShieldUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'soothing-record-sound-wave-shield-material',
    uniforms: {
      uTime: uniforms.time,
      uVisibility: uniforms.visibility,
      uMode: uniforms.mode,
      uProgress: uniforms.progress,
      uImpactDirection: uniforms.impactDirection,
    },
    vertexShader: `
      varying vec3 vWaveObjectPosition;
      varying vec3 vWaveWorldPosition;
      varying vec3 vWaveWorldNormal;

      void main() {
        vWaveObjectPosition = normalize(position);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWaveWorldPosition = worldPosition.xyz;
        vWaveWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uVisibility;
      uniform float uMode;
      uniform float uProgress;
      uniform vec3 uImpactDirection;

      varying vec3 vWaveObjectPosition;
      varying vec3 vWaveWorldPosition;
      varying vec3 vWaveWorldNormal;

      void main() {
        vec3 direction = normalize(vWaveObjectPosition);
        vec3 viewDirection = normalize(cameraPosition - vWaveWorldPosition);
        float facing = clamp(abs(dot(normalize(vWaveWorldNormal), viewDirection)), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 2.45);
        float azimuth = atan(direction.z, direction.x);
        float wavePhase = direction.y * 5.4
          + sin(azimuth * 2.0 + uTime * 0.34) * 0.34
          - uTime * 0.82;
        float primaryWave = 1.0 - smoothstep(0.035, 0.14, abs(sin(wavePhase * 3.14159265)));
        float secondaryPhase = direction.y * 3.2
          - direction.x * 1.35
          + sin(azimuth * 3.0 - uTime * 0.21) * 0.22
          + uTime * 0.31;
        float secondaryWave = 1.0 - smoothstep(0.045, 0.18, abs(sin(secondaryPhase * 3.14159265)));
        float impactDistance = acos(clamp(dot(direction, normalize(uImpactDirection)), -1.0, 1.0));
        float impactRadius = mix(0.04, 2.45, smoothstep(0.0, 1.0, uProgress));
        float impactWidth = mix(0.18, 0.07, smoothstep(0.0, 0.65, uProgress));
        float impactRing = 1.0 - smoothstep(
          impactWidth * 0.35,
          impactWidth,
          abs(impactDistance - impactRadius)
        );
        impactRing *= uMode;
        float surface = fresnel * 0.4
          + primaryWave * (0.13 + fresnel * 0.18)
          + secondaryWave * (0.045 + fresnel * 0.08)
          + impactRing * (0.52 + fresnel * 0.34);
        vec3 mint = vec3(0.42, 0.88, 0.82);
        vec3 blush = vec3(0.98, 0.57, 0.7);
        vec3 cream = vec3(1.0, 0.93, 0.76);
        float colorPhase = 0.5 + 0.5 * sin(azimuth * 1.6 + direction.y * 3.2 - uTime * 0.18);
        vec3 waveColor = mix(mint, blush, colorPhase * 0.55);
        waveColor = mix(waveColor, cream, impactRing * 0.38);
        float alpha = surface * uVisibility;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(waveColor * (0.72 + surface * 0.48), clamp(alpha, 0.0, 0.5));
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });
}

export class SoundWaveShieldPresentation {
  readonly root = new THREE.Group();
  private readonly geometry = new THREE.SphereGeometry(1, 48, 32);
  private readonly uniforms: SoundWaveShieldUniforms = {
    time: { value: 0 },
    visibility: { value: 0 },
    mode: { value: 0 },
    progress: { value: 0 },
    impactDirection: { value: new THREE.Vector3(0, 0, 1) },
  };
  private readonly material = createMaterial(this.uniforms);
  private readonly mesh = new THREE.Mesh(this.geometry, this.material);
  private readonly bounds = new THREE.Box3();
  private readonly sphere = new THREE.Sphere();
  private protectedState = false;
  private phase: SoundWaveShieldPhase = 'idle';
  private phaseStartedAt = 0;
  private elapsed = 0;
  private nextReminderAt = 0;
  private reminderCount = 0;
  private impactCount = 0;
  private appearanceRingCycles = 0;
  private surfaceRingProgress = 0;
  private visibility = 0;
  private radius = 0;
  private targetCount = 0;

  constructor() {
    this.root.name = 'soothing-record-sound-wave-shield';
    this.mesh.name = 'soothing-record-transient-wave-shell';
    this.mesh.renderOrder = 19;
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
    this.root.add(this.mesh);
  }

  sync(active: boolean, targets: readonly THREE.Object3D[]): void {
    const nextProtected = active && targets.length > 0;
    if (nextProtected) this.updateBounds(targets);
    if (nextProtected && !this.protectedState) {
      this.nextReminderAt = 0;
      this.reminderCount = 0;
      this.startPulse('arming');
    } else if (!nextProtected && this.protectedState) {
      this.nextReminderAt = 0;
      this.stopPulse();
    }
    this.protectedState = nextProtected;
    this.targetCount = nextProtected ? targets.length : 0;
  }

  playImpact(worldPosition: THREE.Vector3): void {
    if (this.radius <= 0) return;
    this.impactCount += 1;
    this.uniforms.impactDirection.value.copy(worldPosition).sub(this.root.position);
    if (this.uniforms.impactDirection.value.lengthSq() < 0.0001) {
      this.uniforms.impactDirection.value.set(0, 0, 1);
    } else {
      this.uniforms.impactDirection.value.normalize();
    }
    this.startPulse('impact');
  }

  update(_delta: number, elapsed: number): void {
    this.elapsed = elapsed;
    this.uniforms.time.value = elapsed;
    if (this.phase === 'idle') {
      if (!this.protectedState) return;
      if (this.nextReminderAt <= 0) this.nextReminderAt = elapsed + REMINDER_INTERVAL;
      if (elapsed >= this.nextReminderAt) {
        this.reminderCount += 1;
        this.nextReminderAt = elapsed + REMINDER_INTERVAL;
        this.startPulse('reminder');
      }
      return;
    }
    const duration = this.phase === 'impact'
      ? IMPACT_DURATION
      : this.phase === 'reminder'
        ? REMINDER_DURATION
        : ARM_DURATION;
    const progress = THREE.MathUtils.clamp((elapsed - this.phaseStartedAt) / duration, 0, 1);
    this.appearanceRingCycles = this.phase === 'arming'
      ? ARM_RING_CYCLES
      : this.phase === 'reminder'
        ? REMINDER_RING_CYCLES
        : 1;
    this.surfaceRingProgress = progress >= 1
      ? 1
      : (progress * this.appearanceRingCycles) % 1;
    const enter = THREE.MathUtils.smoothstep(progress, 0, this.phase === 'impact' ? 0.08 : 0.16);
    const exit = 1 - THREE.MathUtils.smoothstep(progress, this.phase === 'impact' ? 0.48 : 0.42, 1);
    const peakVisibility = this.phase === 'impact' ? 0.88 : this.phase === 'reminder' ? 0.3 : 0.48;
    this.visibility = enter * exit * peakVisibility;
    this.uniforms.visibility.value = this.visibility;
    this.uniforms.mode.value = 1;
    this.uniforms.progress.value = this.surfaceRingProgress;
    this.mesh.scale.setScalar(this.phase === 'impact'
      ? this.impactScale(progress)
      : this.phase === 'reminder'
        ? 0.9 + (1 - (1 - progress) ** 3) * 0.12 + Math.sin(progress * Math.PI) * 0.018
        : 0.8 + (1 - (1 - progress) ** 3) * 0.22 + Math.sin(progress * Math.PI) * 0.025);
    this.mesh.rotation.y = Math.sin(elapsed * 0.19) * 0.035;
    this.mesh.rotation.z = Math.sin(elapsed * 0.13 + 1.1) * 0.025;
    if (progress < 1) return;
    this.stopPulse();
  }

  reset(): void {
    this.protectedState = false;
    this.phase = 'idle';
    this.phaseStartedAt = 0;
    this.elapsed = 0;
    this.nextReminderAt = 0;
    this.reminderCount = 0;
    this.impactCount = 0;
    this.appearanceRingCycles = 0;
    this.surfaceRingProgress = 0;
    this.visibility = 0;
    this.radius = 0;
    this.targetCount = 0;
    this.uniforms.visibility.value = 0;
    this.uniforms.mode.value = 0;
    this.uniforms.progress.value = 0;
    this.uniforms.impactDirection.value.set(0, 0, 1);
    this.mesh.visible = false;
    this.mesh.scale.setScalar(1);
  }

  dispose(): void {
    this.root.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }

  get diagnostics(): SoundWaveShieldDiagnostics {
    return {
      protected: this.protectedState,
      phase: this.phase,
      visible: this.mesh.visible,
      opacity: this.visibility,
      center: this.root.position.toArray(),
      radius: this.radius,
      targetCount: this.targetCount,
      depthWrite: this.material.depthWrite,
      idleVisibility: 0,
      persistentGeometry: false,
      waveBandMode: 'spherical-latitude',
      impactProgress: this.phase === 'impact' ? this.uniforms.progress.value : 0,
      reminderCount: this.reminderCount,
      impactCount: this.impactCount,
      reminderInterval: REMINDER_INTERVAL,
      secondsUntilReminder: this.protectedState && this.phase === 'idle'
        ? Math.max(0, this.nextReminderAt - this.elapsed)
        : 0,
      appearanceRingCycles: this.appearanceRingCycles,
      surfaceRingProgress: this.surfaceRingProgress,
    };
  }

  private updateBounds(targets: readonly THREE.Object3D[]): void {
    this.bounds.makeEmpty();
    targets.forEach((target) => {
      target.updateWorldMatrix(true, true);
      this.bounds.expandByObject(target, true);
    });
    if (this.bounds.isEmpty()) return;
    this.bounds.getBoundingSphere(this.sphere);
    this.radius = Math.max(MINIMUM_RADIUS, this.sphere.radius * BOUNDS_PADDING);
    this.root.position.copy(this.sphere.center);
    this.root.scale.setScalar(this.radius);
  }

  private startPulse(phase: Exclude<SoundWaveShieldPhase, 'idle'>): void {
    this.phase = phase;
    this.phaseStartedAt = performance.now() / 1000;
    this.visibility = 0;
    this.uniforms.visibility.value = 0;
    this.uniforms.mode.value = 1;
    this.uniforms.progress.value = 0;
    this.appearanceRingCycles = phase === 'arming'
      ? ARM_RING_CYCLES
      : phase === 'reminder'
        ? REMINDER_RING_CYCLES
        : 1;
    this.surfaceRingProgress = 0;
    if (phase !== 'impact') {
      this.uniforms.impactDirection.value.set(0.44, 0.18, 1).normalize();
    }
    this.mesh.visible = true;
    this.mesh.scale.setScalar(phase === 'impact' ? 1 : phase === 'reminder' ? 0.9 : 0.8);
  }

  private stopPulse(): void {
    this.phase = 'idle';
    this.phaseStartedAt = this.elapsed;
    this.visibility = 0;
    this.uniforms.visibility.value = 0;
    this.uniforms.mode.value = 0;
    this.uniforms.progress.value = 0;
    this.appearanceRingCycles = 0;
    this.surfaceRingProgress = 0;
    this.mesh.visible = false;
  }

  private impactScale(progress: number): number {
    if (progress < 0.18) return THREE.MathUtils.lerp(1, 0.91, progress / 0.18);
    if (progress < 0.48) return THREE.MathUtils.lerp(0.91, 1.07, (progress - 0.18) / 0.3);
    return THREE.MathUtils.lerp(1.07, 1, (progress - 0.48) / 0.52);
  }
}
