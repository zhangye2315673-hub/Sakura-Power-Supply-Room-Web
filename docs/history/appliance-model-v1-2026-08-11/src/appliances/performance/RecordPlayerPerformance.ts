import * as THREE from 'three';
import type { PoweredAnimationDriver } from '../poweredAnimation';

export const RECORD_PLAYER_TIMELINE_OWNER = 'ApplianceMechanics/RecordPlayerPerformance';
export const RECORD_PLAYER_EFFECT_OWNER = 'RecordPlayerPerformance';

export const RECORD_PLAYER_TIMELINE = {
  knobOnStart: 0.06,
  knobOnEnd: 0.28,
  platterStart: 0.15,
  platterFullSpeed: 1,
  cueLiftStart: 0.35,
  cueLiftEnd: 0.65,
  cueSweepStart: 0.62,
  cueSweepEnd: 1.12,
  stylusLowerStart: 1.12,
  stylusLowerEnd: 1.5,
  performanceStart: 1.42,
  climaxStart: 2.72,
  climaxPeak: 3.28,
  climaxEnd: 3.82,
  fadeStart: 3.76,
  returnLiftStart: 4.12,
  returnLiftEnd: 4.36,
  platterSlowStart: 4.05,
  returnSweepStart: 4.3,
  returnSweepEnd: 4.82,
  returnLowerStart: 4.78,
  resetPoseAt: 5.08,
} as const;

export type RecordPlayerPerformancePhase =
  | 'idle'
  | 'powering-on'
  | 'cueing'
  | 'playing'
  | 'climax'
  | 'fading'
  | 'returning'
  | 'idle-reset';

export type RecordPlayerPerformanceDiagnostics = {
  time: number;
  phase: RecordPlayerPerformancePhase;
  timelineOwner: typeof RECORD_PLAYER_TIMELINE_OWNER;
  effectOwner: typeof RECORD_PLAYER_EFFECT_OWNER;
  initialLidPose: 'open';
  knobTurn: number;
  indicatorStrength: number;
  platterAngle: number;
  platterSpeed: number;
  tonearmSweep: number;
  tonearmLift: number;
  stylusState: 'rest' | 'lifted' | 'moving-to-edge' | 'lowering' | 'playing-edge' | 'returning';
  beatRebound: number;
  climaxStrength: number;
  effectEnergy: number;
  activeWaveRings: number;
  activeNotes: number;
  activeLightPoints: number;
  activeRhythmParticles: number;
  activeSoftStars: number;
  totalActiveEffects: number;
  waveGeometry: 'closed-irregular-tube';
  noteGeometry: 'beveled-extrusion';
  forbiddenFlatEffects: readonly ['PlaneGeometry', 'Sprite', 'Line'];
  sharedSpectacleEffects: 'disabled';
};

export type RecordPlayerPerformanceController = PoweredAnimationDriver & {
  apply: (time: number, power: number) => void;
  reset: () => void;
  diagnostics: RecordPlayerPerformanceDiagnostics;
};

type Pose = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

type MaterialPose = {
  material: THREE.MeshToonMaterial;
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  opacity: number;
  transparent: boolean;
};

type EffectRig = {
  root: THREE.Group;
  waves: THREE.Mesh[];
  notes: THREE.Mesh[];
  lights: THREE.Mesh[];
  rhythms: THREE.Mesh[];
  stars: THREE.Mesh[];
};

const TAU = Math.PI * 2;
const PLATTER_RATE = 6.35;
const PLATTER_CENTER = new THREE.Vector3(-0.35, 1.2, 0);
const EFFECT_COLORS = [0xff7198, 0xffb455, 0x71d8d0, 0x8aa8ff, 0xca8cff, 0xffe58b] as const;

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function smootherstep(value: number): number {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function windowPulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function capture(object: THREE.Object3D | null | undefined): Pose | null {
  if (!object) return null;
  return {
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  };
}

function restore(pose: Pose): void {
  pose.object.position.copy(pose.position);
  pose.object.quaternion.copy(pose.quaternion);
  pose.object.scale.copy(pose.scale);
  pose.object.visible = pose.visible;
}

function meshMaterial(mesh: THREE.Mesh): THREE.MeshToonMaterial {
  return mesh.material as THREE.MeshToonMaterial;
}

function makeEffectMaterial(color: number, opacity: number): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    emissive: new THREE.Color(color).multiplyScalar(0.55),
    emissiveIntensity: 0.65,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}

function createWaveGeometry(variant: number): THREE.TubeGeometry {
  const points: THREE.Vector3[] = [];
  const count = 40;
  for (let index = 0; index < count; index += 1) {
    const angle = index / count * TAU;
    const ripple = Math.sin(angle * (3 + variant) + variant * 0.8) * 0.055;
    points.push(new THREE.Vector3(
      Math.cos(angle) * (0.56 + ripple),
      Math.sin(angle * 2 + variant) * 0.035,
      Math.sin(angle) * (0.45 + ripple * 0.7),
    ));
  }
  const geometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.42),
    96,
    0.045 + variant * 0.006,
    8,
    true,
  );
  geometry.userData.performanceProp = 'record-player-volumetric-wave-ring';
  geometry.userData.closed = true;
  geometry.userData.hasThickness = true;
  return geometry;
}

function createNoteGeometry(variant: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const headScale = variant % 2 === 0 ? 1 : 0.88;
  shape.moveTo(-0.15 * headScale, -0.16);
  shape.bezierCurveTo(-0.29 * headScale, -0.2, -0.3 * headScale, 0.01, -0.12 * headScale, 0.06);
  shape.bezierCurveTo(0.03, 0.09, 0.1, -0.1, -0.02, -0.17);
  shape.lineTo(0.05, 0.48);
  shape.lineTo(0.15, 0.48);
  shape.lineTo(0.15, variant % 3 === 0 ? 0.12 : 0.02);
  shape.bezierCurveTo(0.31, 0.13, 0.34, 0.28, 0.21, 0.37);
  shape.lineTo(0.17, 0.25);
  shape.bezierCurveTo(0.24, 0.2, 0.2, 0.13, 0.15, 0.11);
  shape.lineTo(0.15, -0.09);
  shape.bezierCurveTo(0.08, -0.01, 0.02, -0.05, -0.02, -0.1);
  shape.bezierCurveTo(-0.06, -0.13, -0.1, -0.15, -0.15 * headScale, -0.16);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.085 + variant * 0.008,
    steps: 1,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geometry.center();
  geometry.userData.performanceProp = 'record-player-volumetric-note';
  geometry.userData.hasThickness = true;
  return geometry;
}

function createStarGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI * 0.5 + index / 10 * TAU;
    const radius = index % 2 === 0 ? 0.18 : 0.075;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.014,
    bevelSegments: 2,
  });
  geometry.center();
  geometry.userData.performanceProp = 'record-player-soft-volumetric-star';
  geometry.userData.hasThickness = true;
  return geometry;
}

function findMeshes(root: THREE.Object3D, prefix: string): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.name.startsWith(prefix)) meshes.push(object);
  });
  return meshes;
}

function createEffectRig(root: THREE.Group): EffectRig {
  const existing = root.getObjectByName('record-player-performance-effects');
  if (existing instanceof THREE.Group) {
    return {
      root: existing,
      waves: findMeshes(existing, 'record-player-performance-wave-ring-'),
      notes: findMeshes(existing, 'record-player-performance-note-'),
      lights: findMeshes(existing, 'record-player-performance-light-point-'),
      rhythms: findMeshes(existing, 'record-player-performance-rhythm-particle-'),
      stars: findMeshes(existing, 'record-player-performance-soft-star-'),
    };
  }

  const effectRoot = new THREE.Group();
  effectRoot.name = 'record-player-performance-effects';
  effectRoot.userData.effectOwner = RECORD_PLAYER_EFFECT_OWNER;
  effectRoot.userData.timelineOwner = RECORD_PLAYER_TIMELINE_OWNER;
  effectRoot.userData.sharedSpectacleEffects = 'disabled';
  effectRoot.userData.geometryContract = {
    wave: 'closed-irregular-tube',
    note: 'beveled-extrusion',
    lightPoint: 'icosahedron',
    rhythmParticle: 'capsule',
    softStar: 'beveled-extrusion',
    forbidden: ['PlaneGeometry', 'Sprite', 'Line'],
  };
  effectRoot.visible = false;
  root.add(effectRoot);

  const waveGeometries = [0, 1, 2].map(createWaveGeometry);
  const noteGeometries = [0, 1, 2].map(createNoteGeometry);
  const starGeometry = createStarGeometry();
  const lightGeometry = new THREE.IcosahedronGeometry(0.055, 1);
  const rhythmGeometry = new THREE.CapsuleGeometry(0.035, 0.12, 4, 8);
  const materials = EFFECT_COLORS.map((color) => makeEffectMaterial(color, 0.78));
  const softMaterials = [
    makeEffectMaterial(0xffefb2, 0.52),
    makeEffectMaterial(0xffc8db, 0.48),
    makeEffectMaterial(0xd7efff, 0.46),
  ];

  const waves: THREE.Mesh[] = [];
  for (let index = 0; index < 12; index += 1) {
    const mesh = new THREE.Mesh(waveGeometries[index % waveGeometries.length], materials[index % materials.length]);
    mesh.name = `record-player-performance-wave-ring-${index + 1}`;
    mesh.visible = false;
    mesh.renderOrder = 6;
    effectRoot.add(mesh);
    waves.push(mesh);
  }

  const notes: THREE.Mesh[] = [];
  for (let index = 0; index < 18; index += 1) {
    const mesh = new THREE.Mesh(noteGeometries[index % noteGeometries.length], materials[(index + 1) % materials.length]);
    mesh.name = `record-player-performance-note-${index + 1}`;
    mesh.visible = false;
    mesh.renderOrder = 7;
    effectRoot.add(mesh);
    notes.push(mesh);
  }

  const lights: THREE.Mesh[] = [];
  for (let index = 0; index < 24; index += 1) {
    const mesh = new THREE.Mesh(lightGeometry, materials[(index + 2) % materials.length]);
    mesh.name = `record-player-performance-light-point-${index + 1}`;
    mesh.visible = false;
    mesh.renderOrder = 8;
    effectRoot.add(mesh);
    lights.push(mesh);
  }

  const rhythms: THREE.Mesh[] = [];
  for (let index = 0; index < 20; index += 1) {
    const mesh = new THREE.Mesh(rhythmGeometry, materials[(index + 3) % materials.length]);
    mesh.name = `record-player-performance-rhythm-particle-${index + 1}`;
    mesh.visible = false;
    mesh.renderOrder = 7;
    effectRoot.add(mesh);
    rhythms.push(mesh);
  }

  const stars: THREE.Mesh[] = [];
  for (let index = 0; index < 12; index += 1) {
    const mesh = new THREE.Mesh(starGeometry, softMaterials[index % softMaterials.length]);
    mesh.name = `record-player-performance-soft-star-${index + 1}`;
    mesh.visible = false;
    mesh.renderOrder = 8;
    effectRoot.add(mesh);
    stars.push(mesh);
  }

  return { root: effectRoot, waves, notes, lights, rhythms, stars };
}

/** Installs the stable model-owned effect hierarchy before first activation. */
export function ensureRecordPlayerPerformanceRig(
  root: THREE.Group,
  materials?: Set<THREE.Material>,
): void {
  const rig = createEffectRig(root);
  if (!materials) return;
  rig.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const entries = Array.isArray(object.material) ? object.material : [object.material];
    entries.forEach((material) => materials.add(material));
  });
}

function phaseAt(time: number, power: number): RecordPlayerPerformancePhase {
  if (time <= 0 || power <= 0.001) return 'idle';
  if (time < RECORD_PLAYER_TIMELINE.knobOnEnd + 0.12) return 'powering-on';
  if (time < RECORD_PLAYER_TIMELINE.stylusLowerEnd) return 'cueing';
  if (time < RECORD_PLAYER_TIMELINE.climaxStart) return 'playing';
  if (time < RECORD_PLAYER_TIMELINE.climaxEnd) return 'climax';
  if (time < RECORD_PLAYER_TIMELINE.returnLiftStart) return 'fading';
  if (time < RECORD_PLAYER_TIMELINE.resetPoseAt) return 'returning';
  return 'idle-reset';
}

function platterMotion(time: number): { angle: number; speed: number } {
  const local = Math.max(0, time - RECORD_PLAYER_TIMELINE.platterStart);
  const accelDuration = RECORD_PLAYER_TIMELINE.platterFullSpeed - RECORD_PLAYER_TIMELINE.platterStart;
  const fullSpeedDuration = RECORD_PLAYER_TIMELINE.platterSlowStart - RECORD_PLAYER_TIMELINE.platterFullSpeed;
  const slowDuration = RECORD_PLAYER_TIMELINE.resetPoseAt - RECORD_PLAYER_TIMELINE.platterSlowStart;
  const accelAngle = 0.5 * PLATTER_RATE * accelDuration;
  const stableAngle = PLATTER_RATE * fullSpeedDuration;
  if (local <= accelDuration) {
    const progress = local / accelDuration;
    return {
      angle: 0.5 * PLATTER_RATE * local * progress,
      speed: PLATTER_RATE * progress,
    };
  }
  if (time <= RECORD_PLAYER_TIMELINE.platterSlowStart) {
    return {
      angle: accelAngle + PLATTER_RATE * (time - RECORD_PLAYER_TIMELINE.platterFullSpeed),
      speed: PLATTER_RATE,
    };
  }
  const slowTime = Math.min(slowDuration, time - RECORD_PLAYER_TIMELINE.platterSlowStart);
  const progress = slowTime / slowDuration;
  return {
    angle: accelAngle + stableAngle + PLATTER_RATE * slowTime - 0.5 * PLATTER_RATE * slowTime * progress,
    speed: PLATTER_RATE * (1 - progress),
  };
}

function applyOpacity(mesh: THREE.Mesh, opacity: number, emissive: number): void {
  const material = meshMaterial(mesh);
  material.opacity = opacity;
  material.emissiveIntensity = emissive;
}

function hideEffects(rig: EffectRig): void {
  [...rig.waves, ...rig.notes, ...rig.lights, ...rig.rhythms, ...rig.stars].forEach((mesh) => {
    mesh.visible = false;
    mesh.scale.set(1, 1, 1);
  });
}

export function createRecordPlayerPerformance(root: THREE.Group): RecordPlayerPerformanceController {
  const effects = createEffectRig(root);
  const effectObjects = [effects.root, ...effects.waves, ...effects.notes, ...effects.lights, ...effects.rhythms, ...effects.stars];
  const effectPoses = effectObjects.map(capture).filter((pose): pose is Pose => pose !== null);
  const seenEffectMaterials = new Set<THREE.MeshToonMaterial>();
  const effectMaterialPoses: MaterialPose[] = [];
  effectObjects.forEach((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const entries = Array.isArray(object.material) ? object.material : [object.material];
    entries.forEach((entry) => {
      const material = entry as THREE.MeshToonMaterial;
      if (seenEffectMaterials.has(material)) return;
      seenEffectMaterials.add(material);
      effectMaterialPoses.push({
        material,
        color: material.color.clone(),
        emissive: material.emissive.clone(),
        emissiveIntensity: material.emissiveIntensity,
        opacity: material.opacity,
        transparent: material.transparent,
      });
    });
  });
  const rootPose = capture(root);
  const bodyPose = capture(root.getObjectByName('record-player-body-pivot'));
  const lidPose = capture(root.getObjectByName('record-player-lid-hinge-pivot'));
  const platterPose = capture(root.getObjectByName('record-player-platter-spin-pivot'));
  const tonearmPose = capture(root.getObjectByName('record-player-tonearm-pivot'));
  const cuePose = capture(root.getObjectByName('record-player-tonearm-cue-pivot'));
  const knobPose = capture(root.getObjectByName('record-player-control-knob-pivot'));
  const poses = [rootPose, bodyPose, lidPose, platterPose, tonearmPose, cuePose, knobPose]
    .filter((pose): pose is Pose => pose !== null);
  const indicator = root.getObjectByName('record-player-power-status-indicator');
  const indicatorMesh = indicator instanceof THREE.Mesh ? indicator : null;
  const indicatorMaterial = indicatorMesh ? meshMaterial(indicatorMesh) : null;
  const indicatorRest = indicatorMaterial ? {
    color: indicatorMaterial.color.clone(),
    emissive: indicatorMaterial.emissive.clone(),
    intensity: indicatorMaterial.emissiveIntensity,
  } : null;
  let signalValue = 0;

  const diagnostics: RecordPlayerPerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    timelineOwner: RECORD_PLAYER_TIMELINE_OWNER,
    effectOwner: RECORD_PLAYER_EFFECT_OWNER,
    initialLidPose: 'open',
    knobTurn: 0,
    indicatorStrength: 0,
    platterAngle: 0,
    platterSpeed: 0,
    tonearmSweep: 0,
    tonearmLift: 0,
    stylusState: 'rest',
    beatRebound: 0,
    climaxStrength: 0,
    effectEnergy: 0,
    activeWaveRings: 0,
    activeNotes: 0,
    activeLightPoints: 0,
    activeRhythmParticles: 0,
    activeSoftStars: 0,
    totalActiveEffects: 0,
    waveGeometry: 'closed-irregular-tube',
    noteGeometry: 'beveled-extrusion',
    forbiddenFlatEffects: ['PlaneGeometry', 'Sprite', 'Line'],
    sharedSpectacleEffects: 'disabled',
  };
  root.userData.recordPlayerPerformanceDiagnostics = diagnostics;

  const reset = (): void => {
    poses.forEach(restore);
    effectPoses.forEach(restore);
    effectMaterialPoses.forEach((state) => {
      state.material.color.copy(state.color);
      state.material.emissive.copy(state.emissive);
      state.material.emissiveIntensity = state.emissiveIntensity;
      state.material.opacity = state.opacity;
      state.material.transparent = state.transparent;
    });
    hideEffects(effects);
    effects.root.visible = false;
    if (indicatorMaterial && indicatorRest) {
      indicatorMaterial.color.copy(indicatorRest.color);
      indicatorMaterial.emissive.copy(indicatorRest.emissive);
      indicatorMaterial.emissiveIntensity = indicatorRest.intensity;
    }
    signalValue = 0;
    Object.assign(diagnostics, {
      time: 0,
      phase: 'idle',
      knobTurn: 0,
      indicatorStrength: 0,
      platterAngle: 0,
      platterSpeed: 0,
      tonearmSweep: 0,
      tonearmLift: 0,
      stylusState: 'rest',
      beatRebound: 0,
      climaxStrength: 0,
      effectEnergy: 0,
      activeWaveRings: 0,
      activeNotes: 0,
      activeLightPoints: 0,
      activeRhythmParticles: 0,
      activeSoftStars: 0,
      totalActiveEffects: 0,
    } satisfies Partial<RecordPlayerPerformanceDiagnostics>);
  };

  const apply = (rawTime: number, rawPower: number): void => {
    poses.forEach(restore);
    effectPoses.forEach(restore);
    effectMaterialPoses.forEach((state) => {
      state.material.color.copy(state.color);
      state.material.emissive.copy(state.emissive);
      state.material.emissiveIntensity = state.emissiveIntensity;
      state.material.opacity = state.opacity;
      state.material.transparent = state.transparent;
    });
    hideEffects(effects);
    const time = Math.max(0, rawTime);
    const power = clamp01(rawPower);
    if (power <= 0.001) {
      reset();
      diagnostics.time = time;
      return;
    }

    const turnOn = smootherstep((time - RECORD_PLAYER_TIMELINE.knobOnStart)
      / (RECORD_PLAYER_TIMELINE.knobOnEnd - RECORD_PLAYER_TIMELINE.knobOnStart));
    const turnOff = smootherstep((time - 4.64) / (RECORD_PLAYER_TIMELINE.resetPoseAt - 4.64));
    const knobTurn = 2.28 * turnOn * (1 - turnOff);
    if (knobPose) knobPose.object.rotation.y += knobTurn;

    const indicatorStrength = turnOn * (1 - smootherstep((time - 4.7) / 0.38)) * power;
    if (indicatorMaterial && indicatorRest) {
      indicatorMaterial.color.copy(indicatorRest.color).lerp(new THREE.Color(0xffe3a2), indicatorStrength);
      indicatorMaterial.emissive.setHex(indicatorStrength > 0.01 ? 0xff776e : 0x000000);
      indicatorMaterial.emissiveIntensity = indicatorRest.intensity + indicatorStrength * 2.4;
    }

    const platter = platterMotion(time);
    if (platterPose) platterPose.object.rotation.y += platter.angle;

    const cueLift = smootherstep((time - RECORD_PLAYER_TIMELINE.cueLiftStart)
      / (RECORD_PLAYER_TIMELINE.cueLiftEnd - RECORD_PLAYER_TIMELINE.cueLiftStart));
    const cueSweep = smootherstep((time - RECORD_PLAYER_TIMELINE.cueSweepStart)
      / (RECORD_PLAYER_TIMELINE.cueSweepEnd - RECORD_PLAYER_TIMELINE.cueSweepStart));
    const stylusLower = smootherstep((time - RECORD_PLAYER_TIMELINE.stylusLowerStart)
      / (RECORD_PLAYER_TIMELINE.stylusLowerEnd - RECORD_PLAYER_TIMELINE.stylusLowerStart));
    const returnLift = smootherstep((time - RECORD_PLAYER_TIMELINE.returnLiftStart)
      / (RECORD_PLAYER_TIMELINE.returnLiftEnd - RECORD_PLAYER_TIMELINE.returnLiftStart));
    const returnSweep = smootherstep((time - RECORD_PLAYER_TIMELINE.returnSweepStart)
      / (RECORD_PLAYER_TIMELINE.returnSweepEnd - RECORD_PLAYER_TIMELINE.returnSweepStart));
    const returnLower = smootherstep((time - RECORD_PLAYER_TIMELINE.returnLowerStart)
      / (RECORD_PLAYER_TIMELINE.resetPoseAt - RECORD_PLAYER_TIMELINE.returnLowerStart));
    const tonearmSweep = -0.34 * cueSweep * (1 - returnSweep);
    const tonearmLift = 0.14 * cueLift - 0.25 * stylusLower + 0.25 * returnLift - 0.14 * returnLower;
    if (tonearmPose) tonearmPose.object.rotation.y += tonearmSweep;
    if (cuePose) {
      cuePose.object.position.y += tonearmLift;
      cuePose.object.rotation.z += clamp01((tonearmLift + 0.11) / 0.25) * 0.055;
    }

    const playEnvelope = THREE.MathUtils.smoothstep(time, RECORD_PLAYER_TIMELINE.performanceStart, 1.7)
      * (1 - THREE.MathUtils.smoothstep(time, RECORD_PLAYER_TIMELINE.fadeStart, 4.58));
    const climaxStrength = windowPulse(
      time,
      RECORD_PLAYER_TIMELINE.climaxStart,
      RECORD_PLAYER_TIMELINE.climaxPeak,
      RECORD_PLAYER_TIMELINE.climaxEnd,
    );
    const beat = Math.max(0, Math.sin((time - RECORD_PLAYER_TIMELINE.performanceStart) * TAU * 2.15)) ** 6;
    const rebound = beat * playEnvelope * (0.32 + climaxStrength * 0.68) * power;
    if (rootPose) {
      rootPose.object.position.y += rebound * (0.025 + climaxStrength * 0.065);
      rootPose.object.rotation.z += Math.sin(time * 11.4) * playEnvelope * (0.008 + climaxStrength * 0.038) * power;
      rootPose.object.scale.x *= 1 + rebound * (0.006 + climaxStrength * 0.018);
      rootPose.object.scale.y *= 1 - rebound * (0.005 + climaxStrength * 0.012);
    }
    if (bodyPose) {
      bodyPose.object.rotation.z += Math.sin(time * 13.2 + 0.5) * playEnvelope * (0.004 + climaxStrength * 0.014) * power;
    }
    if (lidPose) {
      lidPose.object.rotation.x += Math.sin(time * 16.4) * playEnvelope * (0.006 + climaxStrength * 0.026) * power;
      lidPose.object.rotation.z += Math.sin(time * 12.3 + 0.7) * climaxStrength * 0.018 * power;
    }

    const effectEnergy = playEnvelope * (0.6 + climaxStrength * 0.75) * power;
    effects.root.visible = effectEnergy > 0.005;
    let activeWaveRings = 0;
    let activeNotes = 0;
    let activeLightPoints = 0;
    let activeRhythmParticles = 0;
    let activeSoftStars = 0;
    const density = 0.42 + climaxStrength * 0.46;

    effects.waves.forEach((wave, index) => {
      const phase = (time * 1.36 + index / effects.waves.length) % 1;
      const visible = effects.root.visible && phase < density;
      wave.visible = visible;
      if (!visible) return;
      activeWaveRings += 1;
      const life = phase / density;
      const growth = 0.58 + smootherstep(life) * (2.15 + climaxStrength * 0.95);
      const wobble = Math.sin(life * TAU * 1.5 + index) * (1 - life) * 0.055;
      wave.position.set(
        PLATTER_CENTER.x,
        PLATTER_CENTER.y + 0.16 + life * (1.15 + climaxStrength * 0.38),
        PLATTER_CENTER.z,
      );
      wave.rotation.y = time * 0.35 * (index % 2 === 0 ? 1 : -1);
      wave.rotation.z = wobble;
      wave.scale.set(growth * (1 + wobble), 0.86 + climaxStrength * 0.22, growth * (0.9 - wobble));
      applyOpacity(wave, (1 - smootherstep(life)) * (0.42 + climaxStrength * 0.28) * power, 0.7 + climaxStrength);
    });

    effects.notes.forEach((note, index) => {
      const phase = (time * (0.43 + climaxStrength * 0.16) + index / effects.notes.length) % 1;
      const visible = effects.root.visible && phase < 0.5 + climaxStrength * 0.32;
      note.visible = visible;
      if (!visible) return;
      activeNotes += 1;
      const life = phase / (0.5 + climaxStrength * 0.32);
      const side = index % 2 === 0 ? -1 : 1;
      const angle = index * 2.399 + time * (0.45 + side * 0.08);
      const radius = 0.78 + life * (1.05 + climaxStrength * 0.55) + (index % 3) * 0.12;
      note.position.set(
        PLATTER_CENTER.x + Math.cos(angle) * radius,
        PLATTER_CENTER.y + 0.25 + life * (1.65 + climaxStrength * 0.55) + Math.sin(angle * 2) * 0.12,
        PLATTER_CENTER.z + Math.sin(angle) * radius * 0.68,
      );
      note.rotation.set(time * 0.7 + index * 0.31, angle + Math.PI * 0.5, Math.sin(time * 1.4 + index) * 0.32);
      const scale = (0.42 + (index % 4) * 0.055) * (1 + climaxStrength * 0.55) * (0.84 + Math.sin(life * Math.PI) * 0.24);
      note.scale.setScalar(scale);
      applyOpacity(note, (1 - smootherstep(life)) * (0.7 + climaxStrength * 0.18) * power, 0.72 + climaxStrength * 0.75);
    });

    effects.lights.forEach((light, index) => {
      const phase = (time * (0.58 + climaxStrength * 0.24) + index / effects.lights.length) % 1;
      const visible = effects.root.visible && phase < 0.48 + climaxStrength * 0.38;
      light.visible = visible;
      if (!visible) return;
      activeLightPoints += 1;
      const life = phase / (0.48 + climaxStrength * 0.38);
      const angle = index * 2.17 - time * 0.8;
      const radius = 0.62 + (index % 5) * 0.24 + life * 0.5;
      light.position.set(
        PLATTER_CENTER.x + Math.cos(angle) * radius,
        PLATTER_CENTER.y + 0.2 + life * (1.35 + climaxStrength * 0.5),
        PLATTER_CENTER.z + Math.sin(angle) * radius * 0.8,
      );
      const sparkle = 0.55 + Math.sin(time * 9 + index * 1.7) * 0.2;
      light.scale.setScalar(sparkle * (1 + climaxStrength * 0.48));
      applyOpacity(light, (1 - life) * 0.78 * power, 1 + climaxStrength * 1.25);
    });

    effects.rhythms.forEach((particle, index) => {
      const phase = (time * (0.78 + climaxStrength * 0.32) + index / effects.rhythms.length) % 1;
      const visible = effects.root.visible && phase < 0.4 + climaxStrength * 0.43;
      particle.visible = visible;
      if (!visible) return;
      activeRhythmParticles += 1;
      const life = phase / (0.4 + climaxStrength * 0.43);
      const side = index % 2 === 0 ? -1 : 1;
      const angle = index * 1.91 + side * time * 1.35;
      const radius = 0.72 + (index % 4) * 0.2 + life * (0.4 + climaxStrength * 0.42);
      particle.position.set(
        PLATTER_CENTER.x + Math.cos(angle) * radius,
        PLATTER_CENTER.y + 0.16 + Math.sin(life * Math.PI) * (0.62 + climaxStrength * 0.32),
        PLATTER_CENTER.z + Math.sin(angle) * radius,
      );
      particle.rotation.set(angle, life * TAU + index, Math.PI * 0.5 + angle);
      particle.scale.setScalar((0.72 + climaxStrength * 0.45) * (1 - life * 0.35));
      applyOpacity(particle, (1 - smootherstep(life)) * 0.72 * power, 0.62 + climaxStrength);
    });

    effects.stars.forEach((star, index) => {
      const phase = (time * 0.31 + index / effects.stars.length) % 1;
      const visible = effects.root.visible && phase < 0.46 + climaxStrength * 0.34;
      star.visible = visible;
      if (!visible) return;
      activeSoftStars += 1;
      const life = phase / (0.46 + climaxStrength * 0.34);
      const angle = index * 2.63 + time * 0.22;
      const radius = 1 + (index % 4) * 0.35 + climaxStrength * 0.28;
      star.position.set(
        PLATTER_CENTER.x + Math.cos(angle) * radius,
        PLATTER_CENTER.y + 0.55 + (index % 3) * 0.48 + Math.sin(time * 0.9 + index) * 0.15,
        PLATTER_CENTER.z + Math.sin(angle) * radius * 0.72,
      );
      star.rotation.set(index * 0.27, time * 0.3 + index, time * 0.55 + index * 0.4);
      const twinkle = 0.42 + Math.max(0, Math.sin(time * 3.2 + index)) * 0.34;
      star.scale.setScalar(twinkle * (1 + climaxStrength * 0.52));
      applyOpacity(star, (0.22 + Math.sin(life * Math.PI) * 0.36) * power, 0.55 + climaxStrength * 0.75);
    });

    const totalActiveEffects = activeWaveRings + activeNotes + activeLightPoints
      + activeRhythmParticles + activeSoftStars;
    const stylusState: RecordPlayerPerformanceDiagnostics['stylusState'] = time < RECORD_PLAYER_TIMELINE.cueLiftStart
      ? 'rest'
      : time < RECORD_PLAYER_TIMELINE.cueSweepStart
        ? 'lifted'
        : time < RECORD_PLAYER_TIMELINE.stylusLowerStart
          ? 'moving-to-edge'
          : time < RECORD_PLAYER_TIMELINE.stylusLowerEnd
            ? 'lowering'
            : time < RECORD_PLAYER_TIMELINE.returnLiftStart
              ? 'playing-edge'
              : 'returning';
    signalValue = Math.max(turnOn * (1 - turnOff), platter.speed / PLATTER_RATE, effectEnergy) * power;
    Object.assign(diagnostics, {
      time,
      phase: phaseAt(time, power),
      knobTurn,
      indicatorStrength,
      platterAngle: platter.angle,
      platterSpeed: platter.speed,
      tonearmSweep,
      tonearmLift,
      stylusState,
      beatRebound: rebound,
      climaxStrength,
      effectEnergy,
      activeWaveRings,
      activeNotes,
      activeLightPoints,
      activeRhythmParticles,
      activeSoftStars,
      totalActiveEffects,
    } satisfies Partial<RecordPlayerPerformanceDiagnostics>);
  };

  return {
    apply,
    reset,
    update: apply,
    stop: reset,
    signal: () => signalValue,
    diagnostics,
  };
}
