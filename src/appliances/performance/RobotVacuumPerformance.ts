import * as THREE from 'three';

const TAU = Math.PI * 2;

export const ROBOT_VACUUM_TIMELINE = Object.freeze({
  engageEnd: 0.46,
  circleStart: 0.46,
  circleEnd: 4.52,
  settleStart: 4.58,
  settleEnd: 5.2,
  circleRadius: 1.45,
  wheelRadius: 0.145,
  halfTrack: 0.55,
  sideBrushRate: 27,
  mainBrushRate: 22,
  lidarRate: 13,
});

type RobotVacuumPhase = 'idle' | 'engage' | 'sweeping' | 'returned' | 'settling' | 'complete';

export type RobotVacuumPerformanceDiagnostics = {
  time: number;
  phase: RobotVacuumPhase;
  circleProgress: number;
  circleRadius: number;
  distanceFromOrigin: number;
  headingRadians: number;
  brushSpeed: number;
  collectedDebris: number;
  visibleDebris: number;
  visibleSuctionLights: number;
  effectOwner: 'robot-vacuum-model-rig';
  timelineOwner: 'ApplianceMechanics/RobotVacuumPerformance';
  forbiddenLegacyEffects: readonly ['PlaneGeometry', 'Sprite', 'dust-trail'];
};

export type RobotVacuumPerformanceController = {
  apply(time: number, power: number): void;
  reset(): void;
  signal(): number;
  diagnostics: RobotVacuumPerformanceDiagnostics;
};

type Pose = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

type DebrisRig = {
  object: THREE.Group;
  start: THREE.Vector3;
  rest: Pose;
  pickupStart: number;
  push: THREE.Vector3;
};

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function smootherstep(value: number): number {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function pose(object: THREE.Object3D | undefined): Pose | null {
  return object ? {
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  } : null;
}

function restore(state: Pose | null): void {
  if (!state) return;
  state.object.position.copy(state.position);
  state.object.quaternion.copy(state.quaternion);
  state.object.scale.copy(state.scale);
  state.object.visible = state.visible;
}

function spinSeconds(time: number): number {
  const upStart = 0.03;
  const upEnd = ROBOT_VACUUM_TIMELINE.engageEnd;
  const downStart = ROBOT_VACUUM_TIMELINE.settleStart;
  const downEnd = ROBOT_VACUUM_TIMELINE.settleEnd;
  if (time <= upStart) return 0;
  const upDuration = upEnd - upStart;
  if (time < upEnd) {
    const u = (time - upStart) / upDuration;
    return upDuration * (u ** 3 - 0.5 * u ** 4);
  }
  const steady = upDuration * 0.5 + Math.max(0, Math.min(time, downStart) - upEnd);
  if (time <= downStart) return steady;
  const downDuration = downEnd - downStart;
  const u = clamp01((time - downStart) / downDuration);
  return steady + downDuration * (u - u ** 3 + 0.5 * u ** 4);
}

function makePaperGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.16, -0.09);
  shape.lineTo(0.13, -0.07);
  shape.lineTo(0.17, 0.045);
  shape.lineTo(0.045, 0.1);
  shape.lineTo(-0.14, 0.075);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.035,
    steps: 1,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 1,
  });
  geometry.rotateX(Math.PI * 0.5);
  return geometry;
}

function createDebrisField(root: THREE.Group): { field: THREE.Group; debris: DebrisRig[]; lights: THREE.Mesh[] } {
  const existing = root.getObjectByName('robot-vacuum-debris-field');
  if (existing instanceof THREE.Group && Array.isArray(existing.userData.debrisRigs)) {
    return {
      field: existing,
      debris: existing.userData.debrisRigs as DebrisRig[],
      lights: existing.userData.suctionLights as THREE.Mesh[],
    };
  }

  const field = new THREE.Group();
  field.name = 'robot-vacuum-debris-field';
  field.userData.effectOwner = 'robot-vacuum-model-rig';
  field.userData.volumetricOnly = true;
  field.visible = false;
  root.add(field);
  const materials = [
    new THREE.MeshToonMaterial({ color: 0xffe4b8 }),
    new THREE.MeshToonMaterial({ color: 0x786775 }),
    new THREE.MeshToonMaterial({ color: 0xd69272 }),
    new THREE.MeshToonMaterial({ color: 0x9cb5a0 }),
    new THREE.MeshToonMaterial({ color: 0x5f5669 }),
  ];
  const starts = [
    new THREE.Vector3(-0.12, 0.035, 0.48),
    new THREE.Vector3(-1.34, 0.04, 1.43),
    new THREE.Vector3(-2.78, 0.04, -0.42),
    new THREE.Vector3(-0.86, 0.04, -1.36),
    new THREE.Vector3(-0.28, 0.05, -0.48),
  ];
  const pickupStarts = [0.82, 1.62, 2.44, 3.3, 4.02];
  const names = ['paper-scrap', 'dust-clump', 'granules', 'fragment', 'hairball'];
  const debris: DebrisRig[] = [];

  names.forEach((name, index) => {
    const group = new THREE.Group();
    group.name = `robot-vacuum-debris-${name}`;
    const add = (geometry: THREE.BufferGeometry, material = materials[index]): void => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `${group.name}-volume-${group.children.length + 1}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    };
    if (index === 0) add(makePaperGeometry());
    if (index === 1) {
      for (let lobe = 0; lobe < 4; lobe += 1) {
        add(new THREE.IcosahedronGeometry(0.085 - lobe * 0.008, 0));
        group.children.at(-1)!.position.set((lobe - 1.5) * 0.055, lobe % 2 * 0.035, (lobe % 3 - 1) * 0.04);
      }
    }
    if (index === 2) {
      for (let grain = 0; grain < 5; grain += 1) {
        add(new THREE.DodecahedronGeometry(0.04 + (grain % 2) * 0.012, 0));
        group.children.at(-1)!.position.set((grain - 2) * 0.055, 0, (grain % 2) * 0.045);
      }
    }
    if (index === 3) {
      add(new THREE.TetrahedronGeometry(0.13, 0));
      add(new THREE.TetrahedronGeometry(0.07, 0));
      group.children[1].position.set(0.11, -0.02, 0.04);
    }
    if (index === 4) add(new THREE.TorusKnotGeometry(0.09, 0.022, 28, 5, 2, 3));
    group.position.copy(starts[index]);
    group.rotation.y = index * 0.73;
    field.add(group);
    const rest = pose(group);
    if (!rest) throw new Error(`Unable to capture robot vacuum debris rest pose: ${group.name}`);
    debris.push({
      object: group,
      start: starts[index].clone(),
      rest,
      pickupStart: pickupStarts[index],
      push: new THREE.Vector3(index % 2 === 0 ? 0.22 : -0.22, 0.06, 0.14),
    });
  });

  const lights: THREE.Mesh[] = [];
  for (let index = 0; index < 6; index += 1) {
    const material = new THREE.MeshToonMaterial({
      color: 0xfff1a8,
      emissive: 0xff9f4a,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.92,
    });
    const light = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035 + (index % 2) * 0.012, 0), material);
    light.name = `robot-vacuum-suction-light-${index + 1}`;
    light.visible = false;
    field.add(light);
    lights.push(light);
  }
  field.userData.debrisRigs = debris;
  field.userData.suctionLights = lights;
  return { field, debris, lights };
}

/**
 * Installs the model-owned debris/suction rig before the first performance
 * session so activation never changes the appliance hierarchy. Model factories
 * may pass their material set to keep disposal ownership complete.
 */
export function ensureRobotVacuumPerformanceRig(
  root: THREE.Group,
  materials?: Set<THREE.Material>,
): void {
  const { field } = createDebrisField(root);
  if (!materials) return;
  field.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const entries = Array.isArray(object.material) ? object.material : [object.material];
    entries.forEach((material) => materials.add(material));
  });
}

export function createRobotVacuumPerformance(root: THREE.Group): RobotVacuumPerformanceController {
  const motion = root.getObjectByName('robot-vacuum-motion-pivot');
  const chassis = root.getObjectByName('robot-vacuum-chassis-pivot');
  const lidar = root.getObjectByName('robot-vacuum-lidar-rotor-pivot');
  const mainBrush = root.getObjectByName('robot-vacuum-main-brush-pivot');
  const leftBrush = root.getObjectByName('robot-vacuum-left-side-brush-pivot');
  const rightBrush = root.getObjectByName('robot-vacuum-right-side-brush-pivot');
  const leftWheel = root.getObjectByName('robot-vacuum-left-drive-wheel-pivot');
  const rightWheel = root.getObjectByName('robot-vacuum-right-drive-wheel-pivot');
  const tracked = [motion, chassis, lidar, mainBrush, leftBrush, rightBrush, leftWheel, rightWheel]
    .map((object) => pose(object))
    .filter((state): state is Pose => state !== null);
  const { field, debris, lights } = createDebrisField(root);
  const lightRest = lights.map((light) => pose(light))
    .filter((state): state is Pose => state !== null);
  const statusMeshes = ['robot-vacuum-lidar-status-ring', 'robot-vacuum-top-power-button']
    .map((name) => root.getObjectByName(name))
    .filter((object): object is THREE.Mesh => object instanceof THREE.Mesh);
  const statusRest = statusMeshes.map((mesh) => {
    const material = mesh.material as THREE.MeshToonMaterial;
    return { material, color: material.color.clone(), emissive: material.emissive.clone(), intensity: material.emissiveIntensity };
  });
  let signalValue = 0;
  const diagnostics: RobotVacuumPerformanceDiagnostics = {
    time: 0,
    phase: 'idle',
    circleProgress: 0,
    circleRadius: ROBOT_VACUUM_TIMELINE.circleRadius,
    distanceFromOrigin: 0,
    headingRadians: 0,
    brushSpeed: 0,
    collectedDebris: 0,
    visibleDebris: 0,
    visibleSuctionLights: 0,
    effectOwner: 'robot-vacuum-model-rig',
    timelineOwner: 'ApplianceMechanics/RobotVacuumPerformance',
    forbiddenLegacyEffects: ['PlaneGeometry', 'Sprite', 'dust-trail'],
  };
  root.userData.robotVacuumPerformance = diagnostics;

  const reset = (): void => {
    tracked.forEach(restore);
    debris.forEach(({ rest }) => restore(rest));
    lightRest.forEach(restore);
    field.visible = false;
    statusRest.forEach(({ material, color, emissive, intensity }) => {
      material.color.copy(color);
      material.emissive.copy(emissive);
      material.emissiveIntensity = intensity;
    });
    signalValue = 0;
    Object.assign(diagnostics, {
      time: 0,
      phase: 'idle',
      circleProgress: 0,
      distanceFromOrigin: 0,
      headingRadians: 0,
      brushSpeed: 0,
      collectedDebris: 0,
      visibleDebris: 0,
      visibleSuctionLights: 0,
    });
  };

  const apply = (rawTime: number, rawPower: number): void => {
    tracked.forEach(restore);
    const time = Math.max(0, rawTime);
    const power = clamp01(rawPower);
    const timeline = ROBOT_VACUUM_TIMELINE;
    const progress = smootherstep((time - timeline.circleStart) / (timeline.circleEnd - timeline.circleStart));
    const angle = progress * TAU;
    const settle = smootherstep((time - timeline.settleStart) / (timeline.settleEnd - timeline.settleStart));
    const heading = progress >= 1 ? -TAU * (1 - settle) : -angle;
    if (motion) {
      motion.position.x += timeline.circleRadius * (Math.cos(angle) - 1);
      motion.position.z += timeline.circleRadius * Math.sin(angle);
      motion.rotation.y += heading;
    }
    if (chassis) {
      const lean = THREE.MathUtils.smoothstep(time, 0.05, 0.24)
        * (1 - THREE.MathUtils.smoothstep(time, 0.42, 0.82));
      chassis.rotation.x += 0.075 * lean * power;
    }
    const spin = spinSeconds(time);
    if (lidar) lidar.rotation.y += spin * timeline.lidarRate;
    if (mainBrush) mainBrush.rotation.x += spin * timeline.mainBrushRate;
    if (leftBrush) leftBrush.rotation.y -= spin * timeline.sideBrushRate;
    if (rightBrush) rightBrush.rotation.y += spin * timeline.sideBrushRate;
    const wheelTurns = TAU * progress / timeline.wheelRadius;
    if (leftWheel) leftWheel.rotation.x += wheelTurns * (timeline.circleRadius - timeline.halfTrack);
    if (rightWheel) rightWheel.rotation.x += wheelTurns * (timeline.circleRadius + timeline.halfTrack);

    const activeEnvelope = THREE.MathUtils.smoothstep(time, 0.03, timeline.engageEnd)
      * (1 - THREE.MathUtils.smoothstep(time, timeline.settleStart, timeline.settleEnd)) * power;
    field.visible = time > 0 && power > 0.001;
    const complete = smootherstep((time - timeline.circleEnd) / (timeline.settleEnd - timeline.circleEnd));
    statusRest.forEach(({ material, color }) => {
      material.color.copy(color).lerp(new THREE.Color(0x79e8b0), complete);
      material.emissive.set(complete > 0.55 ? 0x4fe79a : 0xff607f);
      material.emissiveIntensity = 0.2 + activeEnvelope * 1.9 + complete * 0.7;
    });

    lightRest.forEach(restore);
    const suctionTarget = new THREE.Vector3(motion?.position.x ?? 0, 0.07, motion?.position.z ?? 0);
    let collectedDebris = 0;
    let visibleDebris = 0;
    let visibleSuctionLights = 0;
    debris.forEach((rig, index) => {
      restore(rig.rest);
      if (!field.visible) {
        rig.object.visible = false;
        return;
      }
      const pickup = clamp01((time - rig.pickupStart) / 0.56);
      if (pickup >= 0.97) {
        rig.object.visible = false;
        collectedDebris += 1;
        return;
      }
      rig.object.visible = true;
      visibleDebris += 1;
      const brushPush = smootherstep(pickup / 0.36);
      const suction = smootherstep((pickup - 0.28) / 0.72);
      rig.object.position.copy(rig.start).lerp(rig.start.clone().add(rig.push), brushPush);
      rig.object.position.lerp(suctionTarget, suction);
      rig.object.position.y += Math.sin(pickup * Math.PI) * 0.14;
      rig.object.rotation.y += pickup * 2.8 * (index % 2 === 0 ? 1 : -1);
      rig.object.scale.setScalar(1 - suction * 0.88);
      if (pickup > 0.28) {
        for (let sparkIndex = 0; sparkIndex < 2; sparkIndex += 1) {
          const light = lights[(index * 2 + sparkIndex) % lights.length];
          const lightProgress = clamp01((pickup - 0.28) / 0.69 + sparkIndex * 0.1);
          light.visible = true;
          light.position.copy(rig.object.position).lerp(suctionTarget, lightProgress);
          light.position.y += Math.sin(lightProgress * Math.PI) * (0.12 + sparkIndex * 0.05);
          light.scale.setScalar(Math.max(0.12, 1 - lightProgress));
          visibleSuctionLights += 1;
        }
      }
    });
    signalValue = Math.max(activeEnvelope, complete * (1 - settle));
    Object.assign(diagnostics, {
      time,
      phase: time <= 0
        ? 'idle'
        : time < timeline.circleStart
          ? 'engage'
          : time < timeline.circleEnd
            ? 'sweeping'
            : time < timeline.settleStart
              ? 'returned'
              : time < timeline.settleEnd
                ? 'settling'
                : 'complete',
      circleProgress: progress,
      distanceFromOrigin: motion ? Math.hypot(motion.position.x, motion.position.z) : 0,
      headingRadians: heading,
      brushSpeed: timeline.sideBrushRate * activeEnvelope,
      collectedDebris,
      visibleDebris,
      visibleSuctionLights,
    });
  };

  return { apply, reset, signal: () => signalValue, diagnostics };
}
