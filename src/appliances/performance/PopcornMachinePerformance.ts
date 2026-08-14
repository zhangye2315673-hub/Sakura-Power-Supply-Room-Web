import * as THREE from 'three';

const TAU = Math.PI * 2;

export const POPCORN_MACHINE_TIMELINE = Object.freeze({
  warmupEnd: 0.46,
  rapidPopStart: 0.46,
  burstStart: 0.92,
  climaxStart: 3.2,
  settleStart: 4.6,
  stopEnd: 5.2,
  internalPieceCount: 80,
  staticPieceCount: 56,
  poweredPieceCount: 24,
  externalPieceCount: 48,
  minimumInternalFrequencyHz: 7.4,
});

export type PopcornMachinePerformanceDiagnostics = {
  time: number;
  phase: 'idle' | 'warmup' | 'rapid-pop' | 'outward-burst' | 'settle';
  motionEnvelope: number;
  internalPieceCount: number;
  staticPieceCount: number;
  animatedStaticPieces: number;
  internalVisible: number;
  internalJumping: number;
  minimumInternalFrequencyHz: number;
  maximumInternalFrequencyHz: number;
  maximumInternalJumpHeight: number;
  externalPieceCount: number;
  visibleExternal: number;
  externalFrontmostZ: number;
  outwardMinimumDistance: number;
  peakHeightSpread: number;
  externalGeometryMatchesInterior: boolean;
  externalMaterialMatchesInterior: boolean;
  direction: 'inside-to-outside-positive-z';
  effectOwner: 'PopcornMachinePerformance';
  timelineOwner: 'ApplianceMechanics/PopcornMachinePerformance';
};

export type PopcornMachinePerformanceController = {
  apply(time: number, power: number): void;
  reset(): void;
  signal(): number;
  diagnostics: PopcornMachinePerformanceDiagnostics;
};

type InternalPiece = {
  index: number;
  seed: THREE.Object3D | null;
  piece: THREE.Mesh;
  source: THREE.Vector3;
  target: THREE.Vector3;
  baseScale: number;
  phase: number;
  frequency: number;
  jumpHeight: number;
  spin: THREE.Vector3;
};

type ExternalPiece = {
  index: number;
  piece: THREE.Mesh;
  path: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
  launchTime: number;
  flightDuration: number;
  baseScale: number;
  spinRate: THREE.Vector3;
};

type StaticPiece = {
  batch: THREE.InstancedMesh;
  instanceIndex: number;
  idlePosition: THREE.Vector3;
  idleRotation: THREE.Euler;
  idleScale: THREE.Vector3;
  phase: number;
  frequency: number;
  jumpHeight: number;
};

function suffixIndex(name: string): number {
  return Number(name.match(/(\d+)$/)?.[1] ?? 0);
}

function asVector(value: unknown, fallback = new THREE.Vector3()): THREE.Vector3 {
  return Array.isArray(value) && value.length >= 3
    ? new THREE.Vector3(Number(value[0]), Number(value[1]), Number(value[2]))
    : fallback.clone();
}

function cubicPoint(
  target: THREE.Vector3,
  path: ExternalPiece['path'],
  t: number,
): THREE.Vector3 {
  const inverse = 1 - t;
  const inverse2 = inverse * inverse;
  const t2 = t * t;
  return target.set(
    inverse2 * inverse * path[0].x
      + 3 * inverse2 * t * path[1].x
      + 3 * inverse * t2 * path[2].x
      + t2 * t * path[3].x,
    inverse2 * inverse * path[0].y
      + 3 * inverse2 * t * path[1].y
      + 3 * inverse * t2 * path[2].y
      + t2 * t * path[3].y,
    inverse2 * inverse * path[0].z
      + 3 * inverse2 * t * path[1].z
      + 3 * inverse * t2 * path[2].z
      + t2 * t * path[3].z,
  );
}

export function createPopcornMachinePerformance(
  root: THREE.Group,
): PopcornMachinePerformanceController {
  const rotor = root.getObjectByName('popcorn-machine-popper-pivot');
  const rotorRest = rotor?.quaternion.clone();
  const internalMeshes: THREE.Mesh[] = [];
  const externalMeshes: THREE.Mesh[] = [];
  const staticPieces: StaticPiece[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh && object.name.includes('popped-kernel')) {
      const entries = Array.isArray(object.userData.performanceInstances)
        ? object.userData.performanceInstances as Array<Record<string, unknown>>
        : [];
      entries.forEach((entry) => {
        const rotation = asVector(entry.idleRotation);
        staticPieces.push({
          batch: object,
          instanceIndex: Number(entry.instanceIndex),
          idlePosition: asVector(entry.idlePosition),
          idleRotation: new THREE.Euler(rotation.x, rotation.y, rotation.z),
          idleScale: asVector(entry.idleScale, new THREE.Vector3(1, 1, 1)),
          phase: Number(entry.phase ?? 0),
          frequency: Number(entry.frequency ?? 7.55),
          jumpHeight: Number(entry.jumpHeight ?? 0.09),
        });
      });
    }
    if (object instanceof THREE.Mesh) {
      if (object.name.startsWith('popcorn-machine-powered-pop-')) internalMeshes.push(object);
      if (object.name.startsWith('popcorn-machine-outward-pop-')) externalMeshes.push(object);
    }
  });
  internalMeshes.sort((a, b) => suffixIndex(a.name) - suffixIndex(b.name));
  externalMeshes.sort((a, b) => suffixIndex(a.name) - suffixIndex(b.name));

  const internal: InternalPiece[] = internalMeshes.map((piece, arrayIndex) => {
    const index = suffixIndex(piece.name) || arrayIndex + 1;
    return {
      index,
      seed: root.getObjectByName(`popcorn-machine-unpopped-seed-${index}`) ?? null,
      piece,
      source: piece.position.clone(),
      target: asVector(piece.userData.performanceTarget, piece.position),
      baseScale: Number(piece.userData.performanceScale ?? 0.86),
      phase: Number(piece.userData.performancePhase ?? 0.46 + arrayIndex * 0.075),
      frequency: Number(piece.userData.performanceJumpFrequencyHz ?? 7.4 + arrayIndex % 6 * 0.38),
      jumpHeight: Number(piece.userData.performanceJumpHeight ?? 0.46 + arrayIndex % 4 * 0.055),
      spin: asVector(piece.userData.performanceRotation, new THREE.Vector3(1, 2, 1)),
    };
  });
  const external: ExternalPiece[] = externalMeshes.map((piece, arrayIndex) => {
    const rawPath = Array.isArray(piece.userData.performancePath)
      ? piece.userData.performancePath as unknown[]
      : [];
    const source = piece.position.clone();
    return {
      index: suffixIndex(piece.name) || arrayIndex + 1,
      piece,
      path: [
        asVector(rawPath[0], source),
        asVector(rawPath[1], source),
        asVector(rawPath[2], source),
        asVector(rawPath[3], source),
      ],
      launchTime: Number(piece.userData.performanceLaunchTime ?? 0.92 + arrayIndex * 0.115),
      flightDuration: Number(piece.userData.performanceFlightDuration ?? 1.08),
      baseScale: Number(piece.userData.performanceScale ?? 0.9),
      spinRate: asVector(piece.userData.performanceRotationRate, new THREE.Vector3(6, 8, 5)),
    };
  });

  const interiorGeometries = new Set(internal.map(({ piece }) => piece.geometry));
  const interiorMaterials = new Set(internal.map(({ piece }) => piece.material));
  const externalGeometryMatchesInterior = external.every(({ piece }) => interiorGeometries.has(piece.geometry));
  const externalMaterialMatchesInterior = external.every(({ piece }) => interiorMaterials.has(piece.material));
  const outwardMinimumDistance = external.length > 0
    ? Math.min(...external.map(({ path }) => path[3].z - path[0].z))
    : 0;
  const crestHeights = external.map(({ path }) => path[2].y);
  const peakHeightSpread = crestHeights.length > 0
    ? Math.max(...crestHeights) - Math.min(...crestHeights)
    : 0;
  const internalFrequencies = [
    ...staticPieces.map(({ frequency }) => frequency),
    ...internal.map(({ frequency }) => frequency),
  ];
  const minimumInternalFrequencyHz = internalFrequencies.length > 0
    ? Math.min(...internalFrequencies)
    : 0;
  const maximumInternalFrequencyHz = internalFrequencies.length > 0
    ? Math.max(...internalFrequencies)
    : 0;
  const samplePosition = new THREE.Vector3();
  const staticTransform = new THREE.Object3D();
  let signalValue = 0;

  const diagnostics: PopcornMachinePerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    motionEnvelope: 0,
    internalPieceCount: staticPieces.length + internal.length,
    staticPieceCount: staticPieces.length,
    animatedStaticPieces: 0,
    internalVisible: 0,
    internalJumping: 0,
    minimumInternalFrequencyHz,
    maximumInternalFrequencyHz,
    maximumInternalJumpHeight: 0,
    externalPieceCount: external.length,
    visibleExternal: 0,
    externalFrontmostZ: 0,
    outwardMinimumDistance,
    peakHeightSpread,
    externalGeometryMatchesInterior,
    externalMaterialMatchesInterior,
    direction: 'inside-to-outside-positive-z',
    effectOwner: 'PopcornMachinePerformance',
    timelineOwner: 'ApplianceMechanics/PopcornMachinePerformance',
  };
  root.userData.popcornMachinePerformance = diagnostics;

  const reset = (): void => {
    if (rotor && rotorRest) rotor.quaternion.copy(rotorRest);
    staticPieces.forEach((rig) => {
      staticTransform.position.copy(rig.idlePosition);
      staticTransform.rotation.copy(rig.idleRotation);
      staticTransform.scale.copy(rig.idleScale);
      staticTransform.updateMatrix();
      rig.batch.setMatrixAt(rig.instanceIndex, staticTransform.matrix);
    });
    new Set(staticPieces.map(({ batch }) => batch)).forEach((batch) => {
      batch.instanceMatrix.needsUpdate = true;
    });
    internal.forEach(({ seed, piece, source }) => {
      if (seed) seed.visible = true;
      piece.visible = false;
      piece.position.copy(source);
      piece.rotation.set(0, 0, 0);
      piece.scale.setScalar(0.001);
    });
    external.forEach(({ piece, path }) => {
      piece.visible = false;
      piece.position.copy(path[0]);
      piece.rotation.set(0, 0, 0);
      piece.scale.set(1, 1, 1);
    });
    signalValue = 0;
    Object.assign(diagnostics, {
      time: 0,
      phase: 'idle',
      motionEnvelope: 0,
      internalVisible: 0,
      internalJumping: 0,
      animatedStaticPieces: 0,
      maximumInternalJumpHeight: 0,
      visibleExternal: 0,
      externalFrontmostZ: 0,
    });
  };

  const apply = (rawTime: number, rawPower: number): void => {
    const time = Math.max(0, rawTime);
    const power = THREE.MathUtils.clamp(rawPower, 0, 1);
    const startup = THREE.MathUtils.smoothstep(time, 0.08, POPCORN_MACHINE_TIMELINE.warmupEnd);
    const settle = 1 - THREE.MathUtils.smoothstep(
      time,
      POPCORN_MACHINE_TIMELINE.settleStart,
      POPCORN_MACHINE_TIMELINE.stopEnd,
    );
    const envelope = startup * settle * power;
    const climax = THREE.MathUtils.smoothstep(time, POPCORN_MACHINE_TIMELINE.climaxStart, 3.72)
      * (1 - THREE.MathUtils.smoothstep(time, 4.35, POPCORN_MACHINE_TIMELINE.stopEnd));
    signalValue = envelope;

    if (rotor && rotorRest) {
      rotor.quaternion.copy(rotorRest);
      rotor.rotateY(time * (12.5 + climax * 6.5) * envelope);
    }

    let internalVisible = 0;
    let internalJumping = 0;
    let maximumInternalJumpHeight = 0;
    const packedJumpWave = Math.pow(Math.abs(Math.sin(time * TAU * 7.6)), 1.55);
    staticPieces.forEach((rig) => {
      const jump = 0.095 * packedJumpWave * envelope;
      staticTransform.position.copy(rig.idlePosition);
      staticTransform.position.y += jump;
      staticTransform.rotation.copy(rig.idleRotation);
      staticTransform.rotation.x += Math.sin(time * 6.2 + rig.phase) * 0.18 * envelope;
      staticTransform.rotation.y += time * (1.3 + rig.instanceIndex % 5 * 0.18) * envelope;
      staticTransform.rotation.z += Math.cos(time * 5.4 + rig.phase) * 0.14 * envelope;
      staticTransform.scale.copy(rig.idleScale);
      staticTransform.updateMatrix();
      rig.batch.setMatrixAt(rig.instanceIndex, staticTransform.matrix);
      if (packedJumpWave > 0.18) internalJumping += 1;
      maximumInternalJumpHeight = Math.max(maximumInternalJumpHeight, jump);
    });
    new Set(staticPieces.map(({ batch }) => batch)).forEach((batch) => {
      batch.instanceMatrix.needsUpdate = true;
    });
    internalVisible += staticPieces.length;
    internal.forEach((rig) => {
      const age = time - rig.phase;
      const active = age >= 0 && envelope > 0.003;
      if (rig.seed) rig.seed.visible = age < 0;
      rig.piece.visible = active;
      if (!active) return;
      const cycle = ((age * rig.frequency + rig.index * 0.173) % 1 + 1) % 1;
      const jumpWave = Math.pow(Math.max(0, Math.sin(cycle * Math.PI)), 1.45);
      const jump = rig.jumpHeight * (1 + climax * 0.58) * jumpWave * envelope;
      rig.piece.position.copy(rig.target);
      rig.piece.position.x += Math.sin(time * TAU * (2.6 + rig.index % 4 * 0.18) + rig.index) * 0.012 * envelope;
      rig.piece.position.y = Math.min(CHAMBER_CEILING, rig.piece.position.y + jump);
      rig.piece.position.z += Math.cos(time * TAU * (2.3 + rig.index % 5 * 0.16) + rig.index) * 0.008 * envelope;
      rig.piece.position.x = THREE.MathUtils.clamp(rig.piece.position.x, -0.8, 0.8);
      rig.piece.position.z = THREE.MathUtils.clamp(rig.piece.position.z, -0.47, 0.47);
      rig.piece.rotation.set(
        (rig.spin.x + 4.2) * age,
        (rig.spin.y + 5.4) * age,
        (rig.spin.z + 3.7) * age,
      );
      const expansion = THREE.MathUtils.smoothstep(age, 0, 0.13);
      rig.piece.scale.setScalar(rig.baseScale * expansion * (0.94 + jumpWave * 0.1));
      internalVisible += 1;
      if (jumpWave > 0.18) internalJumping += 1;
      maximumInternalJumpHeight = Math.max(maximumInternalJumpHeight, jump);
    });

    let visibleExternal = 0;
    let externalFrontmostZ = 0;
    external.forEach((rig) => {
      const age = time - rig.launchTime;
      const progress = age / rig.flightDuration;
      const active = progress >= 0 && progress <= 1 && envelope > 0.003;
      rig.piece.visible = active;
      if (!active) return;
      cubicPoint(samplePosition, rig.path, THREE.MathUtils.clamp(progress, 0, 1));
      rig.piece.position.copy(samplePosition);
      rig.piece.rotation.set(
        rig.spinRate.x * age + rig.index * 0.19,
        rig.spinRate.y * age + rig.index * 0.31,
        rig.spinRate.z * age + rig.index * 0.13,
      );
      const appear = THREE.MathUtils.smoothstep(progress, 0, 0.08);
      const depart = 1 - THREE.MathUtils.smoothstep(progress, 0.9, 1);
      rig.piece.scale.setScalar(rig.baseScale * Math.max(0.001, appear * depart) * envelope);
      visibleExternal += 1;
      externalFrontmostZ = Math.max(externalFrontmostZ, rig.piece.position.z);
    });

    Object.assign(diagnostics, {
      time,
      phase: time < POPCORN_MACHINE_TIMELINE.warmupEnd
        ? 'warmup'
        : time < POPCORN_MACHINE_TIMELINE.burstStart
          ? 'rapid-pop'
          : time < POPCORN_MACHINE_TIMELINE.settleStart
            ? 'outward-burst'
            : 'settle',
      motionEnvelope: envelope,
      internalVisible,
      internalJumping,
      animatedStaticPieces: envelope > 0.003 ? staticPieces.length : 0,
      maximumInternalJumpHeight,
      visibleExternal,
      externalFrontmostZ,
    });
  };

  reset();
  return { apply, reset, signal: () => signalValue, diagnostics };
}

const CHAMBER_CEILING = 2.68;
