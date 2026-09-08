import * as THREE from 'three';
import { jelly } from '../style/jelly';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ApplianceKind, ApplianceState } from './ApplianceCatalog';
import type { PetalField } from './PetalField';
import { createSakuraPetalGeometry } from './PetalVisual';
import { PAL } from '../style/palette';
import {
  createLampVolumetricBeam,
  LAMP_BEAM_DEFAULT_LENGTH_LOCAL,
  LAMP_BEAM_FAR_TO_NEAR_RATIO,
  LAMP_BEAM_SOURCE_RADIUS_LOCAL,
  type LampBeamDiagnostics,
} from '../appliances/performance/LampPerformance';
import type { RadioWaveDiagnostics } from '../appliances/performance/RadioPerformance';

type ParticleKind =
  | 'petal' | 'steam' | 'rain' | 'drop' | 'sheet' | 'bubble' | 'note' | 'paper'
  | 'trash' | 'popcorn' | 'rice' | 'ribbon' | 'debris' | 'toast'
  | 'wave' | 'spark' | 'blender-drop' | 'blender-splash';

/** Minimal target contract shared by the game scene and gallery preview. */
export type ApplianceSpectacleTarget = {
  root: THREE.Group;
  state: ApplianceState;
  kind: ApplianceKind;
  facingSide: -1 | 1;
  getActiveElapsed(): number;
};

type Particle = {
  mesh: THREE.Mesh;
  active: boolean;
  owner: ApplianceSpectacleTarget | null;
  age: number;
  life: number;
  position: THREE.Vector3;
  startPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  startVelocity: THREE.Vector3;
  angular: THREE.Vector3;
  gravity: number;
  drag: number;
  baseScale: THREE.Vector3;
  curve: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] | null;
  curve2: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] | null;
  curveSplit: number;
  groundY: number | null;
  bounces: number;
  impactSquash: number;
};

type Session = {
  target: ApplianceSpectacleTarget;
  emitted: Map<string, number>;
  markers: Set<string>;
  slot: AccessorySlot;
};

type AccessorySlot = {
  owner: ApplianceSpectacleTarget | null;
  beam: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  lightPool: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  spot: THREE.SpotLight;
  spotTarget: THREE.Object3D;
  cloud: THREE.Group;
  cloudPuffs: THREE.Mesh[];
  lightning: THREE.Mesh;
};

const POOL_CAPACITY: Record<ParticleKind, number> = {
  petal: 28,
  steam: 26,
  rain: 28,
  // Mixer droplets use a fixed 12-slot pool so a burst never allocates in the
  // render loop. The geometry itself is sized to roughly 0.18-0.22 world units.
  drop: 12,
  sheet: 12,
  bubble: 30,
  note: 22,
  paper: 18,
  trash: 18,
  popcorn: 30,
  rice: 30,
  ribbon: 24,
  debris: 22,
  toast: 6,
  wave: 18,
  spark: 18,
  'blender-drop': 28,
  'blender-splash': 12,
};

const PALETTE = [PAL.blossomDeep, PAL.yellow, PAL.teal, PAL.blue, PAL.purple, PAL.orange];
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

function smoothPulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function sampleCubic(
  target: THREE.Vector3,
  curve: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3],
  progress: number,
): void {
  const [a, b, c, d] = curve;
  const inverse = 1 - progress;
  target.copy(a).multiplyScalar(inverse ** 3)
    .addScaledVector(b, 3 * inverse * inverse * progress)
    .addScaledVector(c, 3 * inverse * progress * progress)
    .addScaledVector(d, progress ** 3);
}

/** Closed, volumetric and deliberately imperfect: never a flat icon or regular torus. */
function stylizedRadioWaveGeometry(variant: number): THREE.TubeGeometry {
  const phase = variant * 0.91;
  const points: THREE.Vector3[] = [];
  const pointCount = 48;
  for (let index = 0; index < pointCount; index += 1) {
    const angle = (index / pointCount) * Math.PI * 2;
    const radialWarp = Math.sin(angle * (3 + variant % 2) + phase) * (0.035 + variant * 0.004)
      + Math.sin(angle * 7 - phase * 0.7) * 0.014;
    const radiusX = 0.43 + radialWarp;
    const radiusY = 0.37 + radialWarp * 0.72;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radiusX,
      Math.sin(angle) * radiusY,
      Math.sin(angle * (2 + variant % 3) + phase) * (0.045 + variant * 0.006),
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.42);
  const geometry = new THREE.TubeGeometry(curve, 96, 0.045 + variant * 0.004, 8, true);
  geometry.computeVertexNormals();
  geometry.userData.performanceProp = 'irregular-volumetric-radio-wave';
  geometry.userData.variant = variant;
  geometry.userData.forbiddenPrimitives = ['PlaneGeometry', 'TorusGeometry', 'Line', 'Sprite'];
  return geometry;
}

function noteGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.13, -0.12);
  shape.bezierCurveTo(-0.25, -0.18, -0.25, 0.02, -0.1, 0.05);
  shape.bezierCurveTo(0.04, 0.08, 0.08, -0.1, -0.03, -0.16);
  shape.lineTo(0.04, 0.46);
  shape.lineTo(0.13, 0.46);
  shape.lineTo(0.13, 0.02);
  shape.bezierCurveTo(0.28, 0.12, 0.32, 0.26, 0.19, 0.34);
  shape.lineTo(0.15, 0.24);
  shape.bezierCurveTo(0.22, 0.19, 0.19, 0.12, 0.13, 0.1);
  shape.lineTo(0.13, -0.08);
  shape.bezierCurveTo(0.08, -0.01, 0.01, -0.04, -0.03, -0.09);
  shape.bezierCurveTo(-0.05, -0.11, -0.08, -0.12, -0.13, -0.12);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.075,
    steps: 1,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 2,
    curveSegments: 5,
  });
  geometry.translate(0, 0, -0.0375);
  return geometry;
}

function sparkGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const points = 10;
  for (let index = 0; index < points; index += 1) {
    const angle = Math.PI * 0.5 + (index / points) * Math.PI * 2;
    const radius = index % 2 === 0 ? 0.34 : 0.13;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    steps: 1,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -0.05);
  return geometry;
}

function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const normalized = parts.map((part) => part.index ? part.toNonIndexed() : part);
  const geometry = mergeGeometries(normalized, false);
  normalized.forEach((part) => part.dispose());
  parts.forEach((part, index) => {
    if (part !== normalized[index]) part.dispose();
  });
  if (!geometry) throw new Error('Unable to merge appliance performance prop geometry.');
  return geometry;
}

function popcornGeometry(): THREE.BufferGeometry {
  const lobes = [
    [0, 0.07, 0, 0.13],
    [-0.09, 0, 0.02, 0.105],
    [0.09, 0.005, -0.015, 0.11],
    [-0.025, -0.02, 0.09, 0.1],
    [0.035, -0.025, -0.09, 0.095],
  ].map(([x, y, z, radius]) => new THREE.IcosahedronGeometry(radius, 1).translate(x, y, z));
  return mergeParts(lobes);
}

function toastProfile(inset = 0): THREE.Shape {
  const shape = new THREE.Shape();
  const half = 0.39 - inset;
  const bottom = -0.39 + inset;
  const sideTop = 0.16 - inset * 0.18;
  const shoulderOuter = 0.43 - inset * 0.72;
  const shoulderInner = 0.34 - inset * 0.68;
  const notch = 0.305 - inset * 0.48;
  shape.moveTo(-half * 0.88, bottom);
  shape.quadraticCurveTo(-half, bottom, -half, bottom + 0.08);
  shape.lineTo(-half, sideTop);
  shape.bezierCurveTo(-half, shoulderInner, -half * 0.75, shoulderOuter, -half * 0.31, shoulderOuter);
  shape.bezierCurveTo(-half * 0.12, shoulderOuter, -half * 0.1, notch, 0, notch);
  shape.bezierCurveTo(half * 0.1, notch, half * 0.12, shoulderOuter, half * 0.31, shoulderOuter);
  shape.bezierCurveTo(half * 0.75, shoulderOuter, half, shoulderInner, half, sideTop);
  shape.lineTo(half, bottom + 0.08);
  shape.quadraticCurveTo(half, bottom, half * 0.88, bottom);
  shape.closePath();
  return shape;
}

function extrudeToastLayer(shape: THREE.Shape, depth: number, centreZ: number, bevel: number): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel * 0.72,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geometry.translate(0, 0, centreZ - depth * 0.5);
  return geometry;
}

function toastPerformanceGeometry(): THREE.BufferGeometry {
  const outline = extrudeToastLayer(toastProfile(), 0.205, 0, 0.03).scale(1.055, 1.055, 1.08);
  const crust = extrudeToastLayer(toastProfile(), 0.19, 0, 0.028);
  const crumbFront = extrudeToastLayer(toastProfile(0.085), 0.035, 0.113, 0.018);
  const crumbBack = extrudeToastLayer(toastProfile(0.085), 0.035, -0.113, 0.018);
  const parts = [outline, crust, crumbFront, crumbBack].map((part) => part.index ? part.toNonIndexed() : part);
  const geometry = mergeGeometries(parts, true);
  parts.forEach((part) => part.dispose());
  [outline, crust, crumbFront, crumbBack].forEach((part, index) => {
    if (part !== parts[index]) part.dispose();
  });
  if (!geometry) throw new Error('Unable to build layered toast performance geometry.');
  geometry.computeVertexNormals();
  geometry.userData.performanceProp = 'layered-toast-slice';
  geometry.userData.components = ['outline-hull', 'crust-volume', 'crumb-front', 'crumb-back'];
  return geometry;
}

function trashGeometry(variant: number): THREE.BufferGeometry {
  if (variant === 0) return new THREE.DodecahedronGeometry(0.2, 1).scale(1.08, 0.82, 0.94);
  if (variant === 1) {
    return mergeParts([
      new THREE.CylinderGeometry(0.09, 0.105, 0.34, 10).translate(0, -0.015, 0),
      new THREE.CylinderGeometry(0.055, 0.07, 0.11, 10).translate(0, 0.21, 0),
      new THREE.CylinderGeometry(0.061, 0.061, 0.045, 10).translate(0, 0.285, 0),
    ]);
  }
  return new RoundedBoxGeometry(0.32, 0.27, 0.22, 2, 0.045);
}

function blenderDropGeometry(variant: number): THREE.BufferGeometry {
  if (variant === 0) return new THREE.IcosahedronGeometry(0.17, 2).scale(0.9, 1.12, 0.9);
  if (variant === 1) return new THREE.SphereGeometry(0.16, 12, 8).scale(0.72, 1.72, 0.72);
  if (variant === 2) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.28, 0),
      new THREE.Vector3(-0.025, -0.08, 0.012),
      new THREE.Vector3(0.035, 0.14, -0.012),
      new THREE.Vector3(0, 0.32, 0),
    ], false, 'centripetal', 0.5);
    return new THREE.TubeGeometry(curve, 18, 0.085, 8, false);
  }
  return mergeParts([
    new THREE.SphereGeometry(0.15, 10, 7).scale(1.08, 0.82, 0.94),
    new THREE.SphereGeometry(0.085, 9, 6).translate(0.12, 0.14, -0.025),
  ]);
}

function blenderSplashGeometry(variant: number): THREE.BufferGeometry {
  if (variant === 0) {
    const shape = new THREE.Shape();
    const count = 18;
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2;
      const radius = index % 3 === 0 ? 0.55 : index % 3 === 1 ? 0.31 : 0.42;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.72;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      steps: 1,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      bevelSegments: 2,
      curveSegments: 2,
    });
    geometry.translate(0, 0, -0.05);
    return geometry;
  }
  if (variant === 1) {
    const points = Array.from({ length: 30 }, (_, index) => {
      const angle = index / 30 * Math.PI * 2;
      const radius = 0.39 + Math.sin(angle * 5 + 0.7) * 0.055;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0.06 + Math.max(0, Math.sin(angle * 5 + 0.2)) * 0.16,
      );
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.42), 72, 0.075, 8, true);
  }
  const puddleParts: THREE.BufferGeometry[] = [
    new THREE.SphereGeometry(0.22, 12, 8).scale(1.28, 0.28, 1.08),
  ];
  for (let index = 0; index < 7; index += 1) {
    const angle = index / 7 * Math.PI * 2 + 0.18;
    const radius = index % 2 === 0 ? 0.34 : 0.29;
    const lobe = new THREE.SphereGeometry(0.12 + (index % 3) * 0.012, 9, 6)
      .scale(1.65, 0.34, 0.72)
      .rotateY(-angle)
      .translate(Math.cos(angle) * radius, (index % 2) * 0.018, Math.sin(angle) * radius);
    puddleParts.push(lobe);
  }
  return mergeParts(puddleParts);
}

export class ApplianceSpectacleSystem {
  readonly root = new THREE.Group();
  private readonly lampSpot = new THREE.SpotLight(0xffe9a0, 0, 8, Math.PI * 0.2, 0.6, 1.5);
  private readonly lampSpotTarget = new THREE.Object3D();
  private readonly pools = new Map<ParticleKind, Particle[]>();
  private readonly sessions = new Map<ApplianceSpectacleTarget, Session>();
  private readonly slots: AccessorySlot[] = [];
  private readonly geometries = new Set<THREE.BufferGeometry>();
  private readonly materials = new Set<THREE.Material>();
  private readonly cameraUp = new THREE.Vector3();
  private readonly cameraRight = new THREE.Vector3();
  private readonly cameraForward = new THREE.Vector3();
  private readonly projected = new THREE.Vector3();
  private readonly socketScale = new THREE.Vector3();
  private readonly basePosition = new THREE.Vector3();
  private readonly beamEnd = new THREE.Vector3();
  private activeCamera: THREE.PerspectiveCamera | null = null;
  private readonly origin = new THREE.Vector3();
  private readonly worldScale = new THREE.Vector3();
  private randomState = 0x5a17cafe;

  constructor() {
    this.root.name = 'appliance-spectacle-system';
    // Keep one zero-intensity spotlight in the scene from the loading phase.
    // Toggling a light's visibility changes Three.js' light-count defines and
    // makes every cable/appliance shader compile again on the first lamp use.
    this.lampSpot.name = 'lamp-physical-spotlight';
    this.lampSpot.penumbra = 0.72;
    this.lampSpot.decay = 1.7;
    this.lampSpot.visible = true;
    this.lampSpot.userData.performanceEffect = true;
    this.lampSpotTarget.name = 'lamp-physical-spotlight-target';
    this.root.add(this.lampSpot, this.lampSpotTarget);
    this.lampSpot.target = this.lampSpotTarget;
    (Object.keys(POOL_CAPACITY) as ParticleKind[]).forEach((kind) => this.buildPool(kind));
    for (let index = 0; index < 8; index += 1) this.slots.push(this.buildAccessorySlot());
  }

  getStateSummary(): {
    sessions: number;
    activeTotal: number;
    activeByKind: Record<string, number>;
    capacityByKind: Record<string, number>;
    activeToastNdc: [number, number, number] | null;
    lampBeam: LampBeamDiagnostics | null;
    radioWave: RadioWaveDiagnostics | null;
    blenderSplash: {
      activeDroplets: number;
      activeSplashes: number;
      geometryVariants: number[];
      sourceSocket: string;
      sourceSockets: string[];
      volumeForms: string[];
    } | null;
  } {
    const activeByKind: Record<string, number> = {};
    this.pools.forEach((pool, kind) => {
      activeByKind[kind] = pool.reduce((count, particle) => count + Number(particle.active), 0);
    });
    const toast = this.pools.get('toast')?.find((particle) => particle.active) ?? null;
    const toastNdc = toast && this.activeCamera
      ? toast.position.clone().project(this.activeCamera)
      : null;
    const lampSlot = [...this.sessions.values()].find((session) => session.target.kind === 'lamp')?.slot;
    const lampBeam = lampSlot?.beam.visible
      ? lampSlot.beam.userData.lampDiagnostics as LampBeamDiagnostics | undefined
      : undefined;
    const radioSession = [...this.sessions.values()].find((session) => session.target.kind === 'radio');
    const radioWaves = (this.pools.get('wave') ?? []).filter((particle) => (
      particle.active && particle.owner === radioSession?.target
    ));
    const radioBase = radioSession?.target.root.userData.radioWaveDiagnostics as Omit<
      RadioWaveDiagnostics,
      'activeCount' | 'geometryVariants' | 'minVelocityDotForward'
    > | undefined;
    const velocityDots = radioWaves.map((particle) => Number(
      particle.mesh.userData.radioWave?.velocityDotForward ?? Number.NaN,
    )).filter(Number.isFinite);
    const radioWave: RadioWaveDiagnostics | null = radioBase
      ? {
        ...radioBase,
        activeCount: radioWaves.length,
        geometryVariants: [...new Set(radioWaves.map((particle) => Number(
          particle.mesh.userData.geometryVariant ?? -1,
        )))],
        minVelocityDotForward: velocityDots.length > 0 ? Math.min(...velocityDots) : null,
      }
      : null;
    const blenderSession = [...this.sessions.values()].find((session) => session.target.kind === 'blender');
    const blenderDroplets = (this.pools.get('blender-drop') ?? []).filter((particle) => (
      particle.active && particle.owner === blenderSession?.target
    ));
    const blenderSplashes = (this.pools.get('blender-splash') ?? []).filter((particle) => (
      particle.active && particle.owner === blenderSession?.target
    ));
    const blenderBase = blenderSession?.target.root.userData.blenderSpectacleDiagnostics as {
      sourceSocket?: string;
      origins?: number[][];
      volumeForms?: string[];
    } | undefined;
    const blenderSplash = blenderBase
      ? {
        activeDroplets: blenderDroplets.length,
        activeSplashes: blenderSplashes.length,
        geometryVariants: [...new Set([...blenderDroplets, ...blenderSplashes].map((particle) => Number(
          particle.mesh.userData.geometryVariant ?? -1,
        )))],
        sourceSocket: blenderBase.sourceSocket ?? 'blender-splash-mouth-socket',
        sourceSockets: ['blender-splash-mouth-socket', 'blender-splash-right-gap-socket'],
        volumeForms: blenderBase.volumeForms ?? [],
      }
      : null;
    return {
      sessions: this.sessions.size,
      activeTotal: Object.values(activeByKind).reduce((sum, count) => sum + count, 0),
      activeByKind,
      capacityByKind: { ...POOL_CAPACITY },
      activeToastNdc: toastNdc ? [toastNdc.x, toastNdc.y, toastNdc.z] : null,
      lampBeam: lampBeam ?? null,
      radioWave,
      blenderSplash,
    };
  }

  update(
    delta: number,
    elapsed: number,
    camera: THREE.PerspectiveCamera,
    targets: readonly ApplianceSpectacleTarget[],
    petals: PetalField,
  ): void {
    camera.updateMatrixWorld(true);
    this.activeCamera = camera;
    this.cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    this.cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    camera.getWorldDirection(this.cameraForward);

    for (const target of targets) {
      if (target.state !== 'active') continue;
      const session = this.ensureSession(target);
      this.updateSession(session, target.getActiveElapsed(), elapsed, petals);
    }
    for (const [target, session] of [...this.sessions]) {
      if (target.state === 'active' && targets.includes(target)) continue;
      this.releaseSession(session);
      this.sessions.delete(target);
    }
    this.updateParticles(delta);
  }

  reset(): void {
    this.sessions.forEach((session) => this.releaseSession(session));
    this.sessions.clear();
    this.pools.forEach((pool) => pool.forEach((particle) => {
      particle.active = false;
      particle.owner = null;
      particle.mesh.visible = false;
    }));
  }

  stop(target: ApplianceSpectacleTarget, preserveDetachedToast = false): void {
    const session = this.sessions.get(target);
    if (session) {
      this.releaseSession(session);
      this.sessions.delete(target);
    }
    this.pools.forEach((pool, kind) => pool.forEach((particle) => {
      if (particle.owner !== target) return;
      if (preserveDetachedToast && kind === 'toast' && particle.active) {
        // The appliance power session may finish before the ballistic prop has
        // crossed the lower viewport edge. Detach ownership but keep physics
        // running; reset()/dispose() still clear it deterministically.
        particle.owner = null;
        return;
      }
      particle.active = false;
      particle.owner = null;
      particle.mesh.visible = false;
    }));
  }

  dispose(): void {
    this.reset();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.lampSpot.dispose();
    this.root.removeFromParent();
  }

  private ensureSession(target: ApplianceSpectacleTarget): Session {
    const existing = this.sessions.get(target);
    if (existing) return existing;
    const slot = this.slots.find((candidate) => candidate.owner === null) ?? this.slots[0];
    if (slot.owner) {
      const previous = this.sessions.get(slot.owner);
      if (previous) this.sessions.delete(slot.owner);
    }
    slot.owner = target;
    const session: Session = { target, emitted: new Map(), markers: new Set(), slot };
    this.sessions.set(target, session);
    return session;
  }

  private releaseSession(session: Session): void {
    if (session.target.kind === 'radio') delete session.target.root.userData.radioWaveDiagnostics;
    if (session.target.kind === 'blender') delete session.target.root.userData.blenderSpectacleDiagnostics;
    session.slot.owner = null;
    session.slot.beam.visible = false;
    session.slot.lightPool.visible = false;
    if (session.target.kind === 'lamp') session.slot.spot.intensity = 0;
    session.slot.cloud.visible = false;
    session.slot.lightning.visible = false;
  }

  private updateSession(session: Session, time: number, elapsed: number, petals: PetalField): void {
    const target = session.target;
    target.root.updateWorldMatrix(true, true);
    target.root.getWorldScale(this.worldScale);
    const unit = THREE.MathUtils.clamp(this.worldScale.x * 2.4, 0.42, 1.18);
    target.root.getWorldPosition(this.origin);
    const inward = this.cameraRight.clone().multiplyScalar(-target.facingSide);
    const towardCamera = this.cameraForward.clone().negate();

    switch (target.kind) {
      case 'lamp': this.updateLamp(session, time, unit); break;
      case 'fan': this.updateFan(session, time, unit, inward, petals); break;
      case 'radio': this.updateRadio(session, time, unit); break;
      // The record player owns volumetric waves, notes, rhythm particles and
      // soft stars on its mechanical timeline. Do not layer generic notes.
      case 'record-player': break;
      // The portable speaker owns one deterministic bass-wave rig under the same
      // mechanical timeline as its whole-body pulse. Do not layer generic notes.
      case 'portable-speaker': break;
      // Television and humidifier own closed, model-like effect rigs on the
      // same mechanical timeline. Do not stack generic debris/weather pools.
      case 'television': break;
      case 'humidifier': break;
      case 'toaster': this.updateToaster(session, time, unit); break;
      case 'refrigerator': break;
      case 'washer': break;
      case 'microwave': this.updateMicrowave(session, time, unit); break;
      case 'coffee-maker': break;
      case 'kettle': this.updateKettle(session, time, unit); break;
      case 'rice-cooker': break;
      case 'phone': break;
      case 'robot-vacuum': break;
      case 'bubble-machine': break;
      // The gumball machine owns its same-language split capsule, toy and
      // volumetric stars. Do not layer the former generic pool capsule over it.
      case 'gumball-machine': break;
      case 'popcorn-machine': break;
      // The clock owns closed stereo-wave and vibration-arc meshes on the
      // shared mechanical timeline. Do not layer the former ribbon pool.
      case 'alarm-clock': break;
      case 'smart-bin': break;
      case 'stand-mixer': this.updateMixer(session, time); break;
      case 'blender': this.updateBlender(session, time, unit, towardCamera); break;
      // PrinterPerformance owns six flexible volumetric A4 pages. Do not
      // layer the former generic paper curve pool over the model rig.
      case 'printer': break;
      // The cooktop owns its closed soup bubbles and steam-cloud rig. Generic
      // pooled drops/steam would break the pot/food causal timeline.
      case 'induction-cooktop': break;
      case 'dehumidifier': this.updateDehumidifier(session, time, unit); break;
      case 'desktop-computer': this.updateDesktop(session, time, unit); break;
      // The controller's stars, electric bolts and impact bodies are model-owned
      // closed geometry driven by the shared mechanical timeline.
      case 'game-controller': break;
    }
    void elapsed;
  }

  private updateLamp(session: Session, time: number, unit: number): void {
    const slot = session.slot;
    const socketNode = session.target.root.getObjectByName('lamp-light-socket');
    const socket = this.socketWorld(session.target, ['lamp-light-socket'], this.origin);
    const direction = this.socketDirection(session.target, 'lamp-light-socket', [0, -1, 0]);
    if (socketNode) socketNode.getWorldScale(this.socketScale);
    else this.socketScale.copy(this.worldScale);
    const radialScale = (Math.abs(this.socketScale.x) + Math.abs(this.socketScale.z)) * 0.5;
    const apertureLocal = Number(socketNode?.userData.apertureRadius ?? LAMP_BEAM_SOURCE_RADIUS_LOCAL);
    const sourceRadius = Math.max(0.02, apertureLocal * radialScale);
    const farRadius = sourceRadius * LAMP_BEAM_FAR_TO_NEAR_RATIO;
    this.basePosition.set(0, 0, 0);
    session.target.root.localToWorld(this.basePosition);
    const defaultLength = LAMP_BEAM_DEFAULT_LENGTH_LOCAL * unit;
    const floorDistance = direction.y < -0.16
      ? (socket.y - this.basePosition.y) / -direction.y
      : Number.NaN;
    const length = Number.isFinite(floorDistance) && floorDistance > sourceRadius * 2
      ? THREE.MathUtils.clamp(floorDistance, 2.3 * unit, defaultLength)
      : defaultLength;
    const climax = smoothPulse(time, 2.64, 3.24, 3.94);
    this.beamEnd.copy(socket).addScaledVector(direction, length);
    slot.beam.visible = true;
    slot.beam.position.copy(socket).addScaledVector(direction, length * 0.5);
    slot.beam.quaternion.setFromUnitVectors(Y_AXIS, direction);
    // Geometry convention is -Y = lamp mouth and +Y = broad ground end.
    // X/Z scale therefore equals the exact world-space shade aperture radius.
    slot.beam.scale.set(sourceRadius, length, sourceRadius);
    slot.beam.material.uniforms.uOpacity.value = 0.15 + climax * 0.065;
    slot.lightPool.visible = true;
    slot.lightPool.position.copy(this.beamEnd);
    slot.lightPool.position.y += 0.012;
    slot.lightPool.quaternion.identity();
    slot.lightPool.scale.set(farRadius * 1.08, 1, farRadius * 1.08);
    slot.lightPool.material.uniforms.uOpacity.value = 0.32 + climax * 0.12;
    slot.spot.position.copy(socket);
    slot.spotTarget.position.copy(this.beamEnd);
    slot.spot.angle = THREE.MathUtils.clamp(Math.atan2(farRadius, length), 0.18, Math.PI * 0.34);
    slot.spot.intensity = 9.5 + climax * 2.5;
    slot.spot.distance = length * 1.35;
    const head = session.target.root.getObjectByName('lamp-head-hinge-pivot');
    slot.beam.userData.lampDiagnostics = {
      timelineTime: time,
      headPhase: head?.userData.performancePhase ?? 'wake',
      headPitch: head?.rotation.x ?? 0,
      headRoll: head?.rotation.z ?? 0,
      sourceRadius,
      farRadius,
      farToNearRatio: farRadius / sourceRadius,
      length,
      spotAngle: slot.spot.angle,
      socket: [socket.x, socket.y, socket.z],
      direction: [direction.x, direction.y, direction.z],
      groundSpot: [slot.lightPool.position.x, slot.lightPool.position.y, slot.lightPool.position.z],
      geometryAxis: '-Y-near/+Y-far',
    } satisfies LampBeamDiagnostics;
  }

  private updateFan(session: Session, time: number, unit: number, inward: THREE.Vector3, petals: PetalField): void {
    const origin = this.socketWorld(session.target, ['fan-front-air-socket', 'fan-rotor-axis-socket'], this.origin);
    const climax = time >= 3.7 && time <= 4.8;
    this.emitEvery(session, 'fan-petals', time, climax ? 0.045 : 0.085, () => {
      const count = climax ? 3 : 2;
      // Fan bursts use the shared seasonal field so spring petals, summer
      // leaves, autumn leaves and winter flakes cross-fade with the same
      // SeasonController weights as the ambient canopy.
      petals.burst(origin, inward, count);
      for (let index = 0; index < count; index += 1) {
        const velocity = inward.clone().multiplyScalar((5.8 + this.random() * (climax ? 4.5 : 2.8)) * unit)
          .addScaledVector(this.cameraUp, (this.random() - 0.5) * 1.75 * unit)
          .addScaledVector(this.cameraForward, (this.random() - 0.5) * 1.05 * unit);
        // Keep the pooled slot active for diagnostics/back-pressure accounting,
        // but do not render a second, always-spring petal on top of the
        // seasonal PetalField burst.
        this.spawn('petal', session.target, origin, velocity, 2.35, {
          drag: 0.08,
          scale: 0.85 + this.random() * 0.85,
          visible: false,
        });
      }
    });
    petals.applyWind(origin, inward, climax ? 0.72 : 0.34, (climax ? 7.5 : 5.4) * unit);
  }

  private updateRadio(session: Session, time: number, unit: number): void {
    const forward = this.socketDirection(session.target, 'radio-speaker-socket', [0, 0, 1]);
    const origin = this.socketWorld(session.target, ['radio-speaker-socket'], this.origin)
      .addScaledVector(forward, 0.09 * unit);
    session.target.root.userData.radioWaveDiagnostics = {
      timeline: time,
      emitter: 'radio-speaker-socket',
      source: origin.toArray(),
      forward: forward.toArray(),
      geometry: 'closed-irregular-tube',
      frontOnly: true,
    };
    const emitWave = (life: number, scale: number, speed: number): void => {
      const velocity = forward.clone().multiplyScalar(speed * unit);
      const wave = this.spawn('wave', session.target, origin, velocity, life, { drag: 0.34, scale });
      if (!wave) return;
      wave.mesh.quaternion.setFromUnitVectors(Z_AXIS, forward);
      wave.mesh.rotateZ((this.random() - 0.5) * 0.82);
      wave.angular.set(
        (this.random() - 0.5) * 0.24,
        (this.random() - 0.5) * 0.24,
        (this.random() - 0.5) * 0.7,
      );
      wave.baseScale.set(
        scale * (0.88 + this.random() * 0.2),
        scale * (0.78 + this.random() * 0.28),
        scale * (0.72 + this.random() * 0.3),
      );
      wave.mesh.userData.wavePhase = this.random() * Math.PI * 2;
      wave.mesh.userData.radioWave = {
        emitter: 'radio-speaker-socket',
        profile: 'closed-irregular-tube',
        source: origin.toArray(),
        forward: forward.toArray(),
        velocityDotForward: velocity.dot(forward),
        noBodyCrossing: velocity.dot(forward) > 0,
      };
    };
    [1.05, 2.05, 3.05].forEach((threshold, index) => {
      this.once(session, `radio-wave-${index}`, time, threshold, () => {
        emitWave(1.24, (0.39 + index * 0.035) * unit, 0.52);
      });
    });
    if (time > 3.72 && time < 4.72) {
      this.emitEvery(session, 'radio-climax-waves', time, 0.18, () => {
        emitWave(1.08, (0.48 + this.random() * 0.11) * unit, 0.72);
      });
    }
  }

  private updateToaster(session: Session, time: number, unit: number): void {
    this.once(session, 'toast-launch', time, 3.72, () => {
      const origin = this.socketWorld(session.target, ['toaster-external-toast-launch-socket', 'toaster-carriage-socket'], this.origin);
      const camera = this.activeCamera;
      const projectedOrigin = camera ? origin.clone().project(camera) : new THREE.Vector3(session.target.facingSide * 0.5, 0, 0);
      // Aim the slice centre below the top edge so its modeled crown, not its
      // centre point, approaches the browser safe margin without clipping.
      const apexNdc = new THREE.Vector3(0, 0.58, projectedOrigin.z);
      const apexWorld = camera ? apexNdc.unproject(camera) : origin.clone()
        .addScaledVector(this.cameraUp, 3.2 * unit)
        .addScaledVector(this.cameraRight, -session.target.facingSide * 2.4 * unit);
      const toApex = apexWorld.sub(origin);
      const apexTime = 0.58;
      // Use the actual camera-plane distance. A large arbitrary floor here
      // would move the apex above the browser even when the target NDC is
      // already reachable from the socket.
      const rise = Math.max(0.18 * unit, toApex.dot(this.cameraUp));
      const gravity = (2 * rise) / (apexTime * apexTime);
      const velocity = this.cameraUp.clone().multiplyScalar(gravity * apexTime)
        .addScaledVector(this.cameraRight, toApex.dot(this.cameraRight) / apexTime);
      const toast = this.spawn('toast', session.target, origin, velocity, 4.5, {
        gravity,
        drag: 0,
        scale: unit * 0.82,
      });
      if (toast) {
        toast.angular.set(5.4, session.target.facingSide * 1.15, -session.target.facingSide * 2.15);
        toast.mesh.userData.launchVelocity = velocity.toArray();
        toast.mesh.userData.launchFacingSide = session.target.facingSide;
        toast.mesh.userData.targetApexNdcY = 0.58;
      }
    });
  }

  private updateMicrowave(session: Session, time: number, _unit: number): void {
    // Microwave steam and heat waves are named volumetric model parts owned by
    // MicrowavePerformance. Keep the old generic sphere pool disabled so game
    // and gallery never stack a second visual timeline over the cavity rig.
    session.emitted.set('microwave-model-rig-owned', Math.floor(time * 60));
  }

  private updateKettle(session: Session, time: number, _unit: number): void {
    // Kettle steam is a socket-bound volumetric rig driven by the shared
    // mechanical timeline. Keep this branch allocation-free so the former
    // generic sphere pool cannot overlap the model-like puffs.
    session.emitted.set('kettle-model-rig-owned', Math.floor(time * 60));
  }

  private updateMixer(session: Session, time: number): void {
    // The mixer owns a named volumetric liquid rig in standMixer.ts. Keeping
    // this session marker preserves the shared timeline contract while
    // intentionally emitting none of the old blue `drop` or camera-facing
    // yellow `sheet` pool meshes.
    session.emitted.set('stand-mixer-model-liquid-owned', Math.floor(time * 60));
  }

  private updateBlender(session: Session, time: number, unit: number, towardCamera: THREE.Vector3): void {
    if (time < 3.02 || time > 4.28) return;
    const origins = [
      this.socketWorld(session.target, ['blender-splash-mouth-socket'], this.origin),
      this.socketWorld(session.target, ['blender-splash-right-gap-socket'], this.origin),
    ];
    this.basePosition.set(0, 0, 0);
    session.target.root.localToWorld(this.basePosition);
    const groundY = this.basePosition.y + 0.035 * unit;
    const bursts = [
      { key: 'blender-splash-first', threshold: 3.08, count: 8, strength: 1 },
      { key: 'blender-splash-second', threshold: 3.54, count: 6, strength: 0.76 },
    ] as const;
    bursts.forEach((burst, burstIndex) => {
      this.once(session, burst.key, time, burst.threshold, () => {
        for (let index = 0; index < burst.count; index += 1) {
          const outletIndex = (index + burstIndex) % origins.length;
          const origin = origins[outletIndex];
          const lane = index - (burst.count - 1) * 0.5;
          const side = outletIndex === 0 ? -1 : 1;
          const spread = lane * (0.58 + burstIndex * 0.08) * unit;
          const lift = (5.2 + (index % 3) * 0.9) * unit * burst.strength;
          const forward = (3.8 + (index % 4) * 0.62) * unit * burst.strength;
          const velocity = this.cameraUp.clone().multiplyScalar(lift)
            .addScaledVector(towardCamera, forward)
            .addScaledVector(this.cameraRight, spread + side * 1.35 * unit);
          const drop = this.spawn('blender-drop', session.target, origin, velocity, 1.78 + (index % 3) * 0.13, {
            gravity: 6.8 * unit,
            drag: 0.06,
            groundY,
            bounces: index % 4 === 0 ? 1 : 0,
            scale: (0.68 + (index % 4) * 0.14) * unit,
          });
          if (drop) {
            drop.mesh.userData.blenderSplash = {
              sourceSocket: outletIndex === 0 ? 'blender-splash-mouth-socket' : 'blender-splash-right-gap-socket',
              burst: burstIndex + 1,
              lane,
              form: ['rounded-drop', 'long-drop', 'pulled-tail', 'double-lobed-drop'][Number(drop.mesh.userData.geometryVariant ?? 0)],
            };
          }
        }

        for (let splashIndex = 0; splashIndex < 3; splashIndex += 1) {
          const side = splashIndex - 1;
          const outletIndex = (splashIndex + burstIndex) % origins.length;
          const origin = origins[outletIndex];
          const outletSide = outletIndex === 0 ? -1 : 1;
          const velocity = this.cameraUp.clone().multiplyScalar((3.2 + splashIndex * 0.48) * unit * burst.strength)
            .addScaledVector(towardCamera, (4.2 + splashIndex * 0.42) * unit * burst.strength)
            .addScaledVector(this.cameraRight, (side * 1.15 + outletSide * 1.5) * unit);
          const splash = this.spawn('blender-splash', session.target, origin, velocity, 1.42 + splashIndex * 0.14, {
            gravity: 5.6 * unit,
            drag: 0.11,
            groundY,
            scale: (0.54 + splashIndex * 0.1) * unit,
          });
          if (splash) {
            splash.mesh.userData.blenderSplash = {
              sourceSocket: outletIndex === 0 ? 'blender-splash-mouth-socket' : 'blender-splash-right-gap-socket',
              burst: burstIndex + 1,
              form: ['thick-flat-splash', 'irregular-crown', 'concave-puddle'][Number(splash.mesh.userData.geometryVariant ?? 0)],
            };
          }
        }
      });
    });
    session.target.root.userData.blenderSpectacleDiagnostics = {
      timelineTime: time,
      sourceSocket: 'blender-splash-mouth-socket',
      origins: origins.map((origin) => [origin.x, origin.y, origin.z]),
      groundY,
      volumeForms: ['rounded-drop', 'long-drop', 'pulled-tail', 'double-lobed-drop', 'thick-flat-splash', 'irregular-crown', 'concave-puddle'],
      forbiddenPrimitives: ['PlaneGeometry', 'Line', 'Sprite'],
    };
  }

  private updateDehumidifier(_session: Session, _time: number, _unit: number): void {
    // The dehumidifier owns one model-rig humidity field. Keeping a second
    // pooled spectacle emitter here caused gameplay/gallery drift and made the
    // suction effect camera-facing instead of physically converging on the top
    // grille. Its lathed droplets, low-poly mist and tube wisps are now driven
    // exclusively by DehumidifierPerformance on the shared model timeline.
  }

  private updateDesktop(session: Session, time: number, unit: number): void {
    // Desktop smoke is an action-ready, named model rig driven by the same
    // mechanical timeline as the tower. Do not layer the generic steam pool
    // over those irregular low-poly volumes.
    session.emitted.set('desktop-model-smoke-owned', Math.floor(time * 60));
    void unit;
  }

  private emitEvery(session: Session, key: string, time: number, interval: number, callback: () => void): void {
    const tick = Math.floor(time / interval);
    const previous = session.emitted.get(key) ?? -1;
    if (tick <= previous) return;
    session.emitted.set(key, tick);
    callback();
  }

  private once(session: Session, key: string, time: number, threshold: number, callback: () => void): void {
    if (time < threshold || session.markers.has(key)) return;
    session.markers.add(key);
    callback();
  }

  private spawn(
    kind: ParticleKind,
    owner: ApplianceSpectacleTarget,
    origin: THREE.Vector3,
    velocity: THREE.Vector3,
    life: number,
    options: {
      gravity?: number;
      drag?: number;
      scale?: number;
      groundY?: number;
      bounces?: number;
      dark?: boolean;
      visible?: boolean;
    } = {},
  ): Particle | null {
    const pool = this.pools.get(kind);
    if (!pool) return null;
    const particle = pool.find((candidate) => !candidate.active) ?? pool.reduce((oldest, candidate) => (
      candidate.age / candidate.life > oldest.age / oldest.life ? candidate : oldest
    ));
    particle.active = true;
    particle.owner = owner;
    particle.age = 0;
    particle.life = life;
    particle.position.copy(origin);
    particle.startPosition.copy(origin);
    particle.velocity.copy(velocity);
    particle.startVelocity.copy(velocity);
    particle.angular.set(
      (this.random() - 0.5) * 8,
      (this.random() - 0.5) * 8,
      (this.random() - 0.5) * 8,
    );
    particle.gravity = options.gravity ?? 0;
    particle.drag = options.drag ?? 0.25;
    particle.curve = null;
    particle.curve2 = null;
    particle.curveSplit = 0.5;
    particle.groundY = options.groundY ?? null;
    particle.bounces = options.bounces ?? 0;
    particle.impactSquash = 0;
    const scale = options.scale ?? 1;
    particle.baseScale.setScalar(scale);
    if (kind === 'ribbon' || kind === 'rain') particle.baseScale.set(scale * 0.42, scale, scale * 0.42);
    if (kind === 'paper') particle.baseScale.set(scale, scale * 0.75, scale);
    if (kind === 'sheet') particle.baseScale.set(scale * 1.35, scale, scale);
    if (kind === 'blender-drop') {
      const variant = Number(particle.mesh.userData.geometryVariant ?? 0);
      particle.baseScale.set(
        scale * (variant === 1 ? 0.78 : 1),
        scale * (variant === 2 ? 1.28 : 1),
        scale * (variant === 1 ? 0.78 : 1),
      );
    }
    if (kind === 'blender-splash') {
      const variant = Number(particle.mesh.userData.geometryVariant ?? 0);
      particle.baseScale.set(scale * (1.1 + variant * 0.12), scale * (0.88 + variant * 0.08), scale);
    }
    particle.mesh.visible = options.visible !== false;
    particle.mesh.position.copy(origin);
    particle.mesh.rotation.set(0, 0, 0);
    particle.mesh.scale.copy(particle.baseScale);
    const material = Array.isArray(particle.mesh.material) ? null : particle.mesh.material as THREE.MeshBasicMaterial;
    if (options.dark && material?.color) material.color.setHex(0x8b8795);
    else if (kind === 'note' || kind === 'ribbon' || kind === 'trash') {
      material?.color.setHex(PALETTE[Math.floor(this.random() * PALETTE.length)]);
    }
    if (kind === 'wave') {
      const normal = this.cameraForward.clone().negate();
      particle.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      particle.angular.set(0, 0, 0);
    } else if (kind === 'sheet') {
      particle.mesh.quaternion.copy(this.cameraForward.lengthSq() > 0
        ? new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.cameraForward.clone().negate())
        : new THREE.Quaternion());
      particle.angular.set(0, 0, (this.random() - 0.5) * 1.8);
    } else if (kind === 'blender-splash') {
      particle.mesh.quaternion.copy(this.cameraForward.lengthSq() > 0
        ? new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.cameraForward.clone().negate())
        : new THREE.Quaternion());
      particle.angular.multiplyScalar(0.32);
    }
    return particle;
  }

  private updateParticles(delta: number): void {
    this.pools.forEach((pool, kind) => {
      pool.forEach((particle) => {
        if (!particle.active) return;
        const flightOverride = typeof window === 'undefined'
          ? undefined
          : window.__APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__;
        const flightClock = kind === 'toast' && Number.isFinite(flightOverride)
          ? Math.max(0, flightOverride as number)
          : null;
        particle.age = flightClock ?? particle.age + delta;
        const toastBelowViewport = kind === 'toast' && particle.age > 0.72 && this.activeCamera
          ? this.projected.copy(particle.position).project(this.activeCamera).y < -1.24
          : false;
        if (particle.age >= particle.life || toastBelowViewport) {
          particle.active = false;
          particle.owner = null;
          particle.mesh.visible = false;
          return;
        }
        const progress = THREE.MathUtils.clamp(particle.age / particle.life, 0, 1);
        if (particle.curve) {
          if (particle.curve2 && progress >= particle.curveSplit) {
            sampleCubic(
              particle.position,
              particle.curve2,
              (progress - particle.curveSplit) / (1 - particle.curveSplit),
            );
          } else {
            sampleCubic(
              particle.position,
              particle.curve,
              particle.curve2 ? progress / particle.curveSplit : progress,
            );
          }
        } else if (flightClock !== null && kind === 'toast') {
          particle.velocity.copy(particle.startVelocity)
            .addScaledVector(this.cameraUp, -particle.gravity * flightClock);
          particle.position.copy(particle.startPosition)
            .addScaledVector(particle.startVelocity, flightClock)
            .addScaledVector(this.cameraUp, -0.5 * particle.gravity * flightClock * flightClock);
        } else {
          particle.velocity.addScaledVector(this.cameraUp, -particle.gravity * delta);
          particle.velocity.multiplyScalar(Math.exp(-particle.drag * delta));
          particle.position.addScaledVector(particle.velocity, delta);
          if (particle.groundY !== null && particle.position.y <= particle.groundY && particle.velocity.y < 0) {
            particle.position.y = particle.groundY;
            particle.impactSquash = 1;
            if (particle.bounces > 0) {
              particle.velocity.y *= -0.48;
              particle.velocity.x *= 0.78;
              particle.velocity.z *= 0.78;
              particle.bounces -= 1;
            } else {
              particle.velocity.set(0, 0, 0);
            }
          }
        }
        particle.mesh.position.copy(particle.position);
        if (flightClock !== null && kind === 'toast') {
          particle.mesh.rotation.set(
            particle.angular.x * flightClock,
            particle.angular.y * flightClock,
            particle.angular.z * flightClock,
          );
        } else {
          particle.mesh.rotation.x += particle.angular.x * delta;
          particle.mesh.rotation.y += particle.angular.y * delta;
          particle.mesh.rotation.z += particle.angular.z * delta;
        }
        const fade = kind === 'toast'
          ? 1
          : Math.min(1, particle.age * 8) * (1 - THREE.MathUtils.smoothstep(progress, 0.76, 1));
        if (kind === 'wave') {
          const phase = Number(particle.mesh.userData.wavePhase ?? 0);
          const growth = 0.34 + THREE.MathUtils.smoothstep(progress, 0, 0.84) * 4.45;
          const morph = Math.sin(progress * Math.PI * 3.2 + phase) * (1 - progress) * 0.115;
          particle.mesh.scale.set(
            particle.baseScale.x * growth * (1 + morph),
            particle.baseScale.y * growth * (1 - morph * 0.78),
            particle.baseScale.z * growth * (0.88 + Math.sin(progress * Math.PI * 2 + phase) * 0.09),
          );
        } else {
          const pulse = kind === 'bubble' || kind === 'steam'
            ? 0.72 + progress * 0.75
            : 1;
          particle.mesh.scale.copy(particle.baseScale).multiplyScalar(pulse * (0.86 + fade * 0.14));
        }
        if (particle.impactSquash > 0.001) {
          particle.mesh.scale.x *= 1 + particle.impactSquash * 0.85;
          particle.mesh.scale.y *= 1 - particle.impactSquash * 0.62;
          particle.mesh.scale.z *= 1 + particle.impactSquash * 0.85;
          particle.impactSquash *= Math.exp(-delta * 11);
        }
        const opacity = fade * (
          kind === 'steam' ? 0.36
            : kind === 'bubble' ? 0.52
              : kind === 'wave' ? 0.64 * (1 - progress)
                : kind === 'blender-splash' ? 0.72
                  : kind === 'blender-drop' ? 0.84
                    : 0.9
        );
        const materials = Array.isArray(particle.mesh.material) ? particle.mesh.material : [particle.mesh.material];
        materials.forEach((material) => { material.opacity = kind === 'toast' ? 1 : opacity; });
      });
    });
  }

  private socketWorld(target: ApplianceSpectacleTarget, names: readonly string[], fallback: THREE.Vector3): THREE.Vector3 {
    for (const name of names) {
      const socket = target.root.getObjectByName(name);
      if (socket) return socket.getWorldPosition(new THREE.Vector3());
    }
    return fallback.clone();
  }

  private socketDirection(target: ApplianceSpectacleTarget, name: string, fallback: readonly [number, number, number]): THREE.Vector3 {
    const socket = target.root.getObjectByName(name);
    if (!socket) return this.cameraForward.clone();
    const local = Array.isArray(socket.userData.direction)
      ? new THREE.Vector3(...socket.userData.direction as [number, number, number])
      : new THREE.Vector3(...fallback);
    return local.applyQuaternion(socket.getWorldQuaternion(new THREE.Quaternion())).normalize();
  }

  private buildPool(kind: ParticleKind): void {
    const variantCount = kind === 'wave' || kind === 'blender-drop'
      ? 4
      : kind === 'trash' || kind === 'blender-splash'
        ? 3
        : 1;
    const geometries = Array.from({ length: variantCount }, (_, index) => this.geometryFor(kind, index));
    geometries.forEach((geometry) => this.geometries.add(geometry));
    const pool: Particle[] = [];
    for (let index = 0; index < POOL_CAPACITY[kind]; index += 1) {
      const material: THREE.Material | THREE.Material[] = kind === 'toast'
        ? [
          new THREE.MeshBasicMaterial({ visible: false }),
          jelly({ color: 0xd58b44, thickness: 0.2 }),
          jelly({ color: 0xffd47e, thickness: 0.16 }),
          jelly({ color: 0xffd47e, thickness: 0.16 }),
        ]
        : kind === 'wave'
          ? new THREE.MeshPhysicalMaterial({
            color: [PAL.blossomDeep, PAL.petal, 0xffa9c3, 0xe47fa9][index % 4],
            emissive: 0xb73b70,
            emissiveIntensity: 0.34,
            roughness: 0.28,
            metalness: 0.04,
            clearcoat: 0.72,
            clearcoatRoughness: 0.2,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
          : kind === 'blender-drop' || kind === 'blender-splash'
            ? new THREE.MeshPhysicalMaterial({
              color: kind === 'blender-drop'
                ? [0xf59ab2, 0xffb1c4, 0xe983a5, 0xffc1ce][index % 4]
                : [0xf28daa, 0xffb6c8, 0xe77fa2][index % 3],
              emissive: 0x8f2f52,
              emissiveIntensity: 0.12,
              roughness: 0.32,
              metalness: 0,
              clearcoat: 0.58,
              clearcoatRoughness: 0.24,
              transparent: true,
              opacity: 0,
              side: THREE.DoubleSide,
              depthWrite: false,
            })
            : new THREE.MeshBasicMaterial({
          color: this.colorFor(kind),
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
          fog: true,
          });
      // Keep wispy steam, light and petals on their authored shaders; only solid
      // emitted objects and liquid volumes acquire the same gel as the device.
      const solid = ['drop', 'sheet', 'bubble', 'note', 'paper', 'trash', 'popcorn', 'rice', 'ribbon', 'debris', 'wave', 'blender-drop', 'blender-splash'].includes(kind);
      let surface = material;
      if (solid && !Array.isArray(material)) {
        const source = material as THREE.MeshBasicMaterial;
        surface = jelly({ color: source.color, transparent: true, opacity: 0, thickness: 0.16 });
        material.dispose();
      }
      (Array.isArray(surface) ? surface : [surface]).forEach((entry) => this.materials.add(entry));
      const mesh = new THREE.Mesh(geometries[index % geometries.length], surface);
      mesh.name = `spectacle-${kind}-${index + 1}`;
      mesh.visible = false;
      mesh.renderOrder = 7;
      mesh.frustumCulled = false;
      if (kind === 'wave') {
        mesh.castShadow = true;
        mesh.userData.performanceProp = 'irregular-volumetric-radio-wave';
        mesh.userData.geometryVariant = index % geometries.length;
      }
      if (kind === 'blender-drop' || kind === 'blender-splash') {
        mesh.castShadow = true;
        mesh.userData.performanceProp = kind === 'blender-drop'
          ? 'volumetric-sakura-smoothie-droplet'
          : 'volumetric-sakura-smoothie-splash';
        mesh.userData.geometryVariant = index % geometries.length;
        mesh.userData.forbiddenPrimitives = ['PlaneGeometry', 'Line', 'Sprite'];
      }
      if (kind === 'toast') {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.performanceProp = 'layered-toast-slice';
        mesh.userData.components = ['toast-crust-volume', 'toast-crumb-front', 'toast-crumb-back', 'toast-outline-hull'];
        mesh.userData.sculptRuntime = {
          pivot: mesh.name,
          launchSocket: 'toaster-external-toast-launch-socket',
          lifecycle: 'ballistic-until-bottom-viewport-exit',
        };
      }
      this.root.add(mesh);
      pool.push({
        mesh,
        active: false,
        owner: null,
        age: 0,
        life: 1,
        position: new THREE.Vector3(),
        startPosition: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        startVelocity: new THREE.Vector3(),
        angular: new THREE.Vector3(),
        gravity: 0,
        drag: 0,
        baseScale: new THREE.Vector3(1, 1, 1),
        curve: null,
        curve2: null,
        curveSplit: 0.5,
        groundY: null,
        bounces: 0,
        impactSquash: 0,
      });
    }
    this.pools.set(kind, pool);
  }

  private geometryFor(kind: ParticleKind, variant = 0): THREE.BufferGeometry {
    switch (kind) {
      case 'petal': return createSakuraPetalGeometry(1.1);
      case 'steam': return new THREE.SphereGeometry(0.16, 8, 6);
      case 'rain': return new THREE.CylinderGeometry(0.018, 0.018, 0.42, 5);
      case 'drop': return new THREE.SphereGeometry(0.195, 9, 7).scale(0.82, 1.28, 0.82);
      case 'sheet': {
        const shape = new THREE.Shape();
        shape.moveTo(0, -0.08);
        shape.quadraticCurveTo(-0.72, 0.12, -0.92, 0.48);
        shape.quadraticCurveTo(0, 0.26, 0.92, 0.48);
        shape.quadraticCurveTo(0.72, 0.12, 0, -0.08);
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.055,
          steps: 1,
          bevelEnabled: true,
          bevelSize: 0.016,
          bevelThickness: 0.016,
          bevelSegments: 2,
          curveSegments: 5,
        });
        geometry.translate(0, 0, -0.0275);
        return geometry;
      }
      case 'bubble': return new THREE.SphereGeometry(0.14, 10, 7);
      case 'note': return noteGeometry();
      case 'paper': return new RoundedBoxGeometry(0.62, 0.84, 0.045, 2, 0.025);
      case 'trash': return trashGeometry(variant);
      case 'popcorn': return popcornGeometry();
      case 'rice': return new THREE.CapsuleGeometry(0.035, 0.11, 3, 6).rotateZ(Math.PI * 0.5);
      case 'ribbon': return new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.42, 0),
          new THREE.Vector3(0.08, -0.18, 0.04),
          new THREE.Vector3(-0.08, 0.08, -0.03),
          new THREE.Vector3(0.06, 0.4, 0),
        ]),
        14,
        0.035,
        6,
        false,
      );
      case 'debris': return new THREE.IcosahedronGeometry(0.12, 0);
      case 'toast': return toastPerformanceGeometry();
      case 'wave': return stylizedRadioWaveGeometry(variant);
      case 'spark': return sparkGeometry();
      case 'blender-drop': return blenderDropGeometry(variant);
      case 'blender-splash': return blenderSplashGeometry(variant);
    }
  }

  private colorFor(kind: ParticleKind): number {
    switch (kind) {
      case 'petal': return PAL.petal;
      case 'steam': return 0xf7f4ff;
      case 'rain':
      case 'drop': return 0x76cde1;
      case 'sheet': return 0xffc956;
      case 'bubble': return 0xd9f8ff;
      case 'note': return PAL.blossomDeep;
      case 'paper': return 0xfffbef;
      case 'trash': return PAL.teal;
      case 'popcorn': return 0xffefb5;
      case 'rice': return 0xfff8dc;
      case 'ribbon': return PAL.purple;
      case 'debris': return 0xc0b7c8;
      case 'toast': return 0xd89255;
      case 'wave': return PAL.blossomDeep;
      case 'spark': return PAL.yellow;
      case 'blender-drop':
      case 'blender-splash': return 0xf59ab2;
    }
  }

  private buildAccessorySlot(): AccessorySlot {
    const beam = createLampVolumetricBeam();
    beam.userData.performanceEffect = true;
    this.materials.add(beam.material);
    this.geometries.add(beam.geometry);
    this.root.add(beam);

    const lightPoolMaterial = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0.32 } },
      vertexShader: `
        varying vec2 vRadial;
        void main() {
          vRadial = position.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vRadial;
        uniform float uOpacity;
        void main() {
          float radial = length(vRadial);
          float halo = 1.0 - smoothstep(0.12, 1.0, radial);
          gl_FragColor = vec4(vec3(1.0, 0.79, 0.38), halo * halo * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.materials.add(lightPoolMaterial);
    const lightPoolGeometry = new THREE.CylinderGeometry(1, 1, 0.018, 40, 1, false);
    this.geometries.add(lightPoolGeometry);
    const lightPool = new THREE.Mesh(lightPoolGeometry, lightPoolMaterial);
    lightPool.name = 'lamp-ground-light-pool-volume';
    lightPool.visible = false;
    lightPool.renderOrder = 4;
    lightPool.frustumCulled = false;
    lightPool.userData.performanceEffect = true;
    this.root.add(lightPool);

    const spot = this.lampSpot;
    const spotTarget = this.lampSpotTarget;

    const cloud = new THREE.Group();
    const cloudPuffs: THREE.Mesh[] = [];
    const cloudGeometry = new THREE.SphereGeometry(0.42, 10, 7);
    this.geometries.add(cloudGeometry);
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xb9aeca, transparent: true, opacity: 0.82, depthWrite: false });
    this.materials.add(cloudMaterial);
    [[-0.55, 0, 0], [-0.2, 0.18, 0.04], [0.2, 0.2, 0], [0.55, 0, 0], [0, -0.08, 0.08]].forEach((position, index) => {
      const puff = new THREE.Mesh(cloudGeometry, cloudMaterial);
      puff.position.set(position[0], position[1], position[2]);
      puff.scale.set(1 + (index % 2) * 0.2, 0.72 + (index % 3) * 0.1, 0.82);
      cloud.add(puff);
      cloudPuffs.push(puff);
    });
    cloud.visible = false;
    cloud.renderOrder = 6;
    this.root.add(cloud);

    const lightningGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.2, 0),
        new THREE.Vector3(-0.14, -0.12, 0),
        new THREE.Vector3(0.04, -0.1, 0),
        new THREE.Vector3(-0.12, -0.55, 0),
      ], false, 'chordal'),
      9,
      0.035,
      6,
      false,
    );
    this.geometries.add(lightningGeometry);
    const lightningMaterial = new THREE.MeshBasicMaterial({ color: 0xfff06a, transparent: true, opacity: 0.95, depthWrite: false });
    this.materials.add(lightningMaterial);
    const lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
    lightning.visible = false;
    lightning.renderOrder = 8;
    this.root.add(lightning);

    return { owner: null, beam, lightPool, spot, spotTarget, cloud, cloudPuffs, lightning };
  }

  private random(): number {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }
}
