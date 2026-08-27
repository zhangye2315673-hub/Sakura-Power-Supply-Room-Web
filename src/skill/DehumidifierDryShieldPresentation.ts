import * as THREE from 'three';
import { POWERED_ACTIVE_DURATION } from '../appliances/poweredAnimation';

const BOUNDS_PADDING = 1.12;
const MINIMUM_RADIUS = 1.25;
const ARM_DURATION = POWERED_ACTIVE_DURATION;
const TURN_PULSE_DURATION = 1.55;
const ABSORB_DURATION = 1.05;
const ARM_SWEEP_CYCLES = 3;

type DryShieldPhase = 'idle' | 'arming' | 'turn-pulse' | 'absorb';

type DryShieldUniforms = {
  time: { value: number };
  visibility: { value: number };
  progress: { value: number };
  mode: { value: number };
  drainDirection: { value: THREE.Vector3 };
};

export type DehumidifierDryShieldDiagnostics = Readonly<{
  protected: boolean;
  phase: DryShieldPhase;
  visible: boolean;
  opacity: number;
  center: readonly [number, number, number];
  radius: number;
  targetCount: number;
  turnsRemaining: number | null;
  depthWrite: boolean;
  idleVisibility: 0;
  persistentGeometry: false;
  behavior: 'directional-moisture-extraction';
  moisturePattern: 'condense-and-drain';
  shieldShape: 'open-three-panel-air-canopy';
  airflowMode: 'directional-stream-ribbons';
  outletOpen: true;
  sweepCycles: number;
  sweepProgress: number;
  turnPulseCount: number;
  absorbCount: number;
  drainDirection: readonly [number, number, number];
}>;

function createMaterial(uniforms: DryShieldUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'dehumidifier-directional-dry-air-membrane-material',
    uniforms: {
      uTime: uniforms.time,
      uVisibility: uniforms.visibility,
      uProgress: uniforms.progress,
      uMode: uniforms.mode,
      uDrainDirection: uniforms.drainDirection,
    },
    vertexShader: `
      uniform float uTime;
      uniform float uVisibility;
      uniform vec3 uDrainDirection;

      varying vec3 vDryObjectPosition;
      varying vec3 vDryWorldPosition;
      varying vec3 vDryWorldNormal;

      void main() {
        vec3 direction = normalize(position);
        vec3 drainDirection = normalize(uDrainDirection);
        float drainAxis = dot(direction, drainDirection);
        vec3 lateralDirection = direction - drainDirection * drainAxis;
        float outletTaper = mix(1.06, 0.72, smoothstep(-0.5, 1.0, drainAxis));
        vec3 canopyPosition = lateralDirection * outletTaper
          + drainDirection * drainAxis * 1.08;
        float airRipple = sin(
          direction.x * 5.2
          + direction.y * 6.7
          - direction.z * 4.1
          + uTime * 0.72
        ) * 0.004 * uVisibility;
        vec3 displaced = canopyPosition + normalize(canopyPosition) * airRipple;
        vDryObjectPosition = normalize(position);
        vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
        vDryWorldPosition = worldPosition.xyz;
        vDryWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uVisibility;
      uniform float uProgress;
      uniform float uMode;
      uniform vec3 uDrainDirection;

      varying vec3 vDryObjectPosition;
      varying vec3 vDryWorldPosition;
      varying vec3 vDryWorldNormal;

      float hash21(vec2 point) {
        return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        const float PI = 3.14159265359;
        vec3 direction = normalize(vDryObjectPosition);
        vec3 drainDirection = normalize(uDrainDirection);
        vec3 helper = abs(drainDirection.y) > 0.88 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 tangent = normalize(cross(helper, drainDirection));
        vec3 bitangent = normalize(cross(drainDirection, tangent));
        float axis = dot(direction, drainDirection);
        float azimuth = atan(dot(direction, bitangent), dot(direction, tangent));
        vec2 moistureUv = vec2(azimuth / (PI * 2.0) + 0.5, axis * 0.5 + 0.5);

        float outletMask = 1.0 - smoothstep(0.46, 0.84, axis);
        float panelField = abs(cos(azimuth * 1.5 + 0.32));
        float panelMask = smoothstep(0.16, 0.38, panelField) * outletMask;
        float panelEdge = 1.0 - smoothstep(0.045, 0.13, abs(panelField - 0.3));
        panelEdge *= outletMask;

        float sweepCenter = mix(-1.14, 0.78, uProgress);
        float airflowPacket = 1.0 - smoothstep(0.08, 0.28, abs(axis - sweepCenter));
        float airflowLanes = pow(
          0.5 + 0.5 * cos(azimuth * 7.0 + axis * 4.6 - uTime * 0.24),
          12.0
        );
        float airflowRibbon = airflowPacket * (0.28 + airflowLanes * 0.72) * panelMask;
        float trailingStream = 1.0 - smoothstep(0.04, 0.16, abs(axis - (sweepCenter - 0.2)));
        trailingStream *= airflowLanes * panelMask;
        float wetAhead = smoothstep(sweepCenter - 0.06, sweepCenter + 0.2, axis);

        vec2 gridSize = vec2(22.0, 13.0);
        vec2 driftingUv = moistureUv;
        driftingUv.y -= uTime * mix(0.018, 0.052, smoothstep(-0.2, 0.95, axis));
        vec2 cellId = floor(driftingUv * gridSize);
        vec2 cell = fract(driftingUv * gridSize) - 0.5;
        float randomValue = hash21(cellId);
        cell.x += (randomValue - 0.5) * 0.38;
        cell.y += sin(uTime * (0.45 + randomValue * 0.4) + randomValue * 9.0) * 0.08;
        float droplet = 1.0 - smoothstep(0.07, 0.17, length(cell * vec2(1.35, 0.72)));
        droplet *= step(0.56, randomValue) * wetAhead;

        float suctionChannels = pow(0.5 + 0.5 * sin(azimuth * 11.0 + axis * 3.2 + uTime * 0.42), 10.0);
        suctionChannels *= smoothstep(-0.18, 0.78, axis) * panelMask;
        float clearedWake = 1.0 - wetAhead;

        vec3 viewDirection = normalize(cameraPosition - vDryWorldPosition);
        float facing = clamp(abs(dot(normalize(vDryWorldNormal), viewDirection)), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 2.65);
        float absorbFocus = uMode > 1.5
          ? pow(smoothstep(0.12, 1.0, axis), 2.4) * smoothstep(0.2, 1.0, uProgress)
          : 0.0;

        vec3 dryCyan = vec3(0.48, 0.88, 0.93);
        vec3 cleanWhite = vec3(0.93, 0.98, 0.95);
        vec3 condensedBlue = vec3(0.32, 0.69, 0.86);
        vec3 color = mix(dryCyan, cleanWhite, clearedWake * 0.54 + airflowRibbon * 0.46);
        color = mix(color, condensedBlue, droplet * 0.7 + suctionChannels * 0.32);

        float surface = panelMask * fresnel * 0.055
          + panelEdge * (0.08 + fresnel * 0.08)
          + airflowRibbon * (0.38 + fresnel * 0.18)
          + trailingStream * 0.13
          + droplet * panelMask * (0.24 + fresnel * 0.1)
          + suctionChannels * (0.14 + airflowRibbon * 0.08)
          + absorbFocus * 0.3;
        float alpha = surface * uVisibility;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(color * (0.78 + surface * 0.52), clamp(alpha, 0.0, 0.42));
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });
}

export class DehumidifierDryShieldPresentation {
  readonly root = new THREE.Group();
  private readonly geometry = new THREE.SphereGeometry(1, 48, 32);
  private readonly uniforms: DryShieldUniforms = {
    time: { value: 0 },
    visibility: { value: 0 },
    progress: { value: 0 },
    mode: { value: 0 },
    drainDirection: { value: new THREE.Vector3(0.7, -0.18, 0.69).normalize() },
  };
  private readonly material = createMaterial(this.uniforms);
  private readonly mesh = new THREE.Mesh(this.geometry, this.material);
  private readonly bounds = new THREE.Box3();
  private readonly sphere = new THREE.Sphere();
  private protectedState = false;
  private phase: DryShieldPhase = 'idle';
  private phaseStartedAt = 0;
  private elapsed = 0;
  private visibility = 0;
  private radius = 0;
  private targetCount = 0;
  private turnsRemaining: number | null = null;
  private sweepCycles = 0;
  private sweepProgress = 0;
  private turnPulseCount = 0;
  private absorbCount = 0;

  constructor() {
    this.root.name = 'dehumidifier-dry-air-shield';
    this.mesh.name = 'dehumidifier-transient-moisture-extraction-membrane';
    this.mesh.renderOrder = 19;
    this.mesh.visible = false;
    this.mesh.frustumCulled = false;
    this.root.add(this.mesh);
  }

  sync(
    active: boolean,
    turnsRemaining: number | null,
    targets: readonly THREE.Object3D[],
    sourcePosition?: THREE.Vector3,
  ): void {
    const nextProtected = active && targets.length > 0;
    if (nextProtected) {
      this.updateBounds(targets);
      this.updateDrainDirection(sourcePosition);
    }
    if (nextProtected && !this.protectedState) {
      this.turnsRemaining = turnsRemaining;
      this.startPulse('arming');
    } else if (nextProtected
      && this.protectedState
      && typeof turnsRemaining === 'number'
      && typeof this.turnsRemaining === 'number'
      && turnsRemaining < this.turnsRemaining) {
      this.turnPulseCount += 1;
      this.turnsRemaining = turnsRemaining;
      this.startPulse('turn-pulse');
    } else if (!nextProtected && this.protectedState) {
      this.absorbCount += 1;
      this.turnsRemaining = null;
      this.startPulse('absorb');
    } else if (nextProtected) {
      this.turnsRemaining = turnsRemaining;
    }
    this.protectedState = nextProtected;
    this.targetCount = nextProtected ? targets.length : 0;
  }

  update(_delta: number, elapsed: number): void {
    this.elapsed = elapsed;
    this.uniforms.time.value = elapsed;
    if (this.phase === 'idle') return;
    const duration = this.phase === 'arming'
      ? ARM_DURATION
      : this.phase === 'turn-pulse'
        ? TURN_PULSE_DURATION
        : ABSORB_DURATION;
    const progress = THREE.MathUtils.clamp((elapsed - this.phaseStartedAt) / duration, 0, 1);
    this.sweepCycles = this.phase === 'arming' ? ARM_SWEEP_CYCLES : 1;
    this.sweepProgress = progress >= 1 ? 1 : (progress * this.sweepCycles) % 1;
    const enter = THREE.MathUtils.smoothstep(progress, 0, this.phase === 'absorb' ? 0.06 : 0.12);
    const exit = 1 - THREE.MathUtils.smoothstep(progress, this.phase === 'arming' ? 0.78 : 0.55, 1);
    const peakVisibility = this.phase === 'arming' ? 0.86 : this.phase === 'turn-pulse' ? 0.68 : 0.92;
    this.visibility = enter * exit * peakVisibility;
    this.uniforms.visibility.value = this.visibility;
    this.uniforms.progress.value = this.sweepProgress;
    this.uniforms.mode.value = this.phase === 'arming' ? 0 : this.phase === 'turn-pulse' ? 1 : 2;
    const pulse = Math.sin(progress * Math.PI);
    this.mesh.scale.setScalar(this.phase === 'arming'
      ? THREE.MathUtils.lerp(0.9, 1, THREE.MathUtils.smoothstep(progress, 0, 0.32)) + pulse * 0.008
      : this.phase === 'turn-pulse'
        ? 0.985 + pulse * 0.018
        : THREE.MathUtils.lerp(1.01, 0.94, progress));
    if (progress >= 1) this.stopPulse();
  }

  reset(): void {
    this.protectedState = false;
    this.phase = 'idle';
    this.phaseStartedAt = 0;
    this.elapsed = 0;
    this.visibility = 0;
    this.radius = 0;
    this.targetCount = 0;
    this.turnsRemaining = null;
    this.sweepCycles = 0;
    this.sweepProgress = 0;
    this.turnPulseCount = 0;
    this.absorbCount = 0;
    this.uniforms.visibility.value = 0;
    this.uniforms.progress.value = 0;
    this.uniforms.mode.value = 0;
    this.uniforms.drainDirection.value.set(0.7, -0.18, 0.69).normalize();
    this.mesh.visible = false;
    this.mesh.scale.setScalar(1);
  }

  dispose(): void {
    this.root.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }

  get diagnostics(): DehumidifierDryShieldDiagnostics {
    return {
      protected: this.protectedState,
      phase: this.phase,
      visible: this.mesh.visible,
      opacity: this.visibility,
      center: this.root.position.toArray(),
      radius: this.radius,
      targetCount: this.targetCount,
      turnsRemaining: this.turnsRemaining,
      depthWrite: this.material.depthWrite,
      idleVisibility: 0,
      persistentGeometry: false,
      behavior: 'directional-moisture-extraction',
      moisturePattern: 'condense-and-drain',
      shieldShape: 'open-three-panel-air-canopy',
      airflowMode: 'directional-stream-ribbons',
      outletOpen: true,
      sweepCycles: this.sweepCycles,
      sweepProgress: this.sweepProgress,
      turnPulseCount: this.turnPulseCount,
      absorbCount: this.absorbCount,
      drainDirection: this.uniforms.drainDirection.value.toArray(),
    };
  }

  get petalFlow(): Readonly<{
    active: boolean;
    center: THREE.Vector3;
    direction: THREE.Vector3;
    radius: number;
    strength: number;
  }> {
    const active = this.mesh.visible && this.phase !== 'idle';
    return {
      active,
      center: this.root.position,
      direction: this.uniforms.drainDirection.value,
      radius: this.radius,
      strength: active ? Math.max(0.08, this.visibility) : 0,
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

  private updateDrainDirection(sourcePosition?: THREE.Vector3): void {
    if (!sourcePosition) return;
    this.uniforms.drainDirection.value.copy(sourcePosition).sub(this.root.position);
    if (this.uniforms.drainDirection.value.lengthSq() < 0.0001) {
      this.uniforms.drainDirection.value.set(0.7, -0.18, 0.69);
    }
    this.uniforms.drainDirection.value.normalize();
  }

  private startPulse(phase: Exclude<DryShieldPhase, 'idle'>): void {
    this.phase = phase;
    this.phaseStartedAt = this.elapsed;
    this.visibility = 0;
    this.sweepCycles = phase === 'arming' ? ARM_SWEEP_CYCLES : 1;
    this.sweepProgress = 0;
    this.uniforms.visibility.value = 0;
    this.uniforms.progress.value = 0;
    this.uniforms.mode.value = phase === 'arming' ? 0 : phase === 'turn-pulse' ? 1 : 2;
    this.mesh.visible = true;
    this.mesh.scale.setScalar(phase === 'arming' ? 0.9 : 1);
  }

  private stopPulse(): void {
    this.phase = 'idle';
    this.phaseStartedAt = this.elapsed;
    this.visibility = 0;
    this.sweepCycles = 0;
    this.sweepProgress = 0;
    this.uniforms.visibility.value = 0;
    this.uniforms.progress.value = 0;
    this.uniforms.mode.value = 0;
    this.mesh.visible = false;
    this.mesh.scale.setScalar(1);
  }
}
