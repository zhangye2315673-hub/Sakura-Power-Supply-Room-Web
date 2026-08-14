import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月3日 16_17_49 (2).png';
const CHAMBER_MIN_Y = 1.42;
const CHAMBER_MAX_Y = 2.72;
const CHAMBER_HALF_X = 0.82;
const CHAMBER_HALF_Z = 0.49;

type StaticPopcornPiece = {
  batch: THREE.InstancedMesh;
  instanceIndex: number;
  idlePosition: THREE.Vector3;
  idleRotation: THREE.Euler;
  idleScale: THREE.Vector3;
  phase: number;
};

type PackedPopcornPiece = {
  position: THREE.Vector3;
  radius: number;
};

function tone(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function signedPower(value: number, exponent: number): number {
  if (value === 0) return 0;
  return Math.sign(value) * Math.abs(value) ** exponent;
}

function reverseWinding(geometry: THREE.BufferGeometry): void {
  const index = geometry.index;
  if (!index) return;
  for (let offset = 0; offset < index.count; offset += 3) {
    const second = index.getX(offset + 1);
    index.setX(offset + 1, index.getX(offset + 2));
    index.setX(offset + 2, second);
  }
  index.needsUpdate = true;
  geometry.computeVertexNormals();
}

/** A low superelliptic dome. The rectangular plan is essential: a revolved
 * circular cap makes the side elevation much too deep for the turn-sheet. */
function lowRoundedDome(
  xRadius: number,
  yRadius: number,
  zRadius: number,
): ParametricGeometry {
  const maximumLatitude = 1.34;
  const planExponent = 0.63;
  const geometry = new ParametricGeometry((u, v, target) => {
    const longitude = u * Math.PI * 2 - Math.PI;
    const latitude = v * maximumLatitude;
    const radial = Math.cos(latitude);
    target.set(
      xRadius * radial * signedPower(Math.cos(longitude), planExponent),
      yRadius * Math.sin(latitude),
      zRadius * radial * signedPower(Math.sin(longitude), planExponent),
    );
  }, 32, 14);
  reverseWinding(geometry);
  return geometry;
}

function archGeometry(
  width: number,
  height: number,
  depth: number,
  openingInset = 0,
): THREE.ExtrudeGeometry {
  const half = width * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-half, -height * 0.5);
  shape.lineTo(-half, height * 0.12);
  shape.quadraticCurveTo(-half, height * 0.5, 0, height * 0.5);
  shape.quadraticCurveTo(half, height * 0.5, half, height * 0.12);
  shape.lineTo(half, -height * 0.5);
  shape.closePath();
  if (openingInset > 0) {
    const innerWidth = width - openingInset * 2;
    const innerHeight = height - openingInset * 2;
    const innerHalf = innerWidth * 0.5;
    const hole = new THREE.Path();
    hole.moveTo(innerHalf, -innerHeight * 0.5);
    hole.lineTo(innerHalf, innerHeight * 0.12);
    hole.quadraticCurveTo(innerHalf, innerHeight * 0.5, 0, innerHeight * 0.5);
    hole.quadraticCurveTo(-innerHalf, innerHeight * 0.5, -innerHalf, innerHeight * 0.12);
    hole.lineTo(-innerHalf, -innerHeight * 0.5);
    hole.closePath();
    shape.holes.push(hole);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.045,
    bevelThickness: 0.035,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -depth * 0.5);
  return geometry;
}

function wedgeGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.24, -0.12);
  shape.lineTo(0.22, -0.12);
  shape.lineTo(0.08, 0.14);
  shape.lineTo(-0.15, 0.14);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.025,
    bevelThickness: 0.02,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -0.08);
  return geometry;
}

function popcornGeometry(): THREE.BufferGeometry {
  const lobes = [
    { p: [-0.07, 0.02, 0.01] as const, s: [1.05, 0.82, 0.88] as const },
    { p: [0.07, 0.025, 0.015] as const, s: [0.92, 1.02, 0.88] as const },
    { p: [0.0, 0.085, -0.025] as const, s: [0.88, 0.9, 0.9] as const },
    { p: [0.005, -0.035, 0.055] as const, s: [1.0, 0.72, 0.9] as const },
    { p: [-0.015, 0.015, -0.065] as const, s: [0.8, 0.78, 0.82] as const },
  ].map(({ p, s }, index) => {
    const geometry = new THREE.SphereGeometry(index === 2 ? 0.095 : 0.09, 7, 5);
    geometry.scale(s[0], s[1], s[2]);
    geometry.translate(p[0], p[1], p[2]);
    return geometry;
  });
  const merged = mergeGeometries(lobes, false);
  lobes.forEach((geometry) => geometry.dispose());
  if (!merged) throw new Error('Could not merge popcorn lobe geometry.');
  merged.computeVertexNormals();
  return merged;
}

function boundedPosition(target: THREE.Vector3): THREE.Vector3 {
  target.x = THREE.MathUtils.clamp(target.x, -CHAMBER_HALF_X, CHAMBER_HALF_X);
  target.y = THREE.MathUtils.clamp(target.y, CHAMBER_MIN_Y, CHAMBER_MAX_Y);
  target.z = THREE.MathUtils.clamp(target.z, -CHAMBER_HALF_Z, CHAMBER_HALF_Z);
  return target;
}

function staggeredPackedPosition(
  random: () => number,
  packedPieces: PackedPopcornPiece[],
  radius: number,
  makeCandidate: () => THREE.Vector3,
  attempts = 72,
  clearanceOffsets: readonly number[] = [0],
): THREE.Vector3 {
  let bestCandidate = boundedPosition(makeCandidate());
  let bestClearance = -Infinity;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = boundedPosition(makeCandidate());
    let nearestClearance = Infinity;
    for (const offset of clearanceOffsets) {
      const clearancePosition = candidate.clone().setY(candidate.y + offset);
      for (const packed of packedPieces) {
        const clearance = clearancePosition.distanceTo(packed.position) / (radius + packed.radius);
        nearestClearance = Math.min(nearestClearance, clearance);
      }
    }
    // A tiny seeded tie-break stops equally clear wall/corner candidates from
    // settling into a repeated scan order while keeping the build deterministic.
    const scoredClearance = nearestClearance + random() * 0.002;
    if (scoredClearance > bestClearance) {
      bestClearance = scoredClearance;
      bestCandidate = candidate;
    }
  }
  clearanceOffsets.forEach((offset) => {
    packedPieces.push({
      position: bestCandidate.clone().setY(bestCandidate.y + offset),
      radius,
    });
  });
  return bestCandidate;
}

/**
 * Procedural reconstruction of the supplied three-view popcorn machine.
 *
 * Local frame: +Y up, +Z front/dispense side, floor at Y=0. Transparent
 * panels, support frames, popper, food system, outlet and controls are kept as
 * independent named runtime parts. Hidden heater/gearbox geometry is omitted.
 */
export function createPopcornMachineModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const random = seededRandom(0x504f5043);
  const accentLight = tone(options.accent, 0.055, -0.035);
  const accentMid = tone(options.accent, -0.015, -0.02);
  const accentDark = tone(options.accent, -0.13, 0.015);

  const shell = kit.material(0xf4ede0, { tint: 0x746a7d });
  const shellLight = kit.material(0xfff8eb, { tint: 0x7b7084 });
  const accent = kit.material(accentMid, { tint: 0x6b5d74 });
  const accentSoft = kit.material(accentLight, { tint: 0x74677c });
  const accentDeep = kit.material(accentDark, { tint: 0x554a60 });
  const cavity = kit.material(0x724946, { tint: 0x4c3538 });
  const seam = kit.material(0x6d625f, { tint: 0x4d4754 });
  const rubber = kit.material(0xbb8484, { tint: 0x604b51 });
  const popcornLight = kit.material(0xf8daa5, { tint: 0x8a6672 });
  const popcornCream = kit.material(0xfdebc4, { tint: 0x8a6672 });
  const kernelGold = kit.material(0xd29d5b, { tint: 0x6b4d52 });
  const warmLamp = kit.material(0xffda94, { emissive: 0xffb059 });
  warmLamp.emissiveIntensity = 0;
  const glass = kit.material(0xf1e3d2, {
    tint: 0x99a3ad,
    transparent: true,
    opacity: 0.18,
  });
  glass.depthWrite = false;
  glass.side = THREE.DoubleSide;

  // Pass 1: lock the tall three-band silhouette before any local details.
  const cabinetPivot = kit.pivot('popcorn-machine-lower-cabinet-pivot');
  const lowerCabinet = kit.mesh(
    'popcorn-machine-rounded-lower-cabinet',
    new RoundedBoxGeometry(2.02, 1.26, 1.34, 5, 0.18),
    shell,
    cabinetPivot,
  );
  lowerCabinet.position.set(0, 0.79, 0);
  lowerCabinet.userData.part = 'lower-cabinet';

  const baseBand = kit.mesh(
    'popcorn-machine-continuous-pink-base-band',
    new RoundedBoxGeometry(2.06, 0.2, 1.38, 4, 0.09),
    accent,
    cabinetPivot,
  );
  baseBand.position.set(0, 0.17, 0);
  baseBand.userData.part = 'base-band';

  const chamberPivot = kit.pivot('popcorn-machine-transparent-chamber-pivot');
  chamberPivot.position.y = 1.39;

  const lowerFrame = kit.mesh(
    'popcorn-machine-lower-chamber-frame',
    new RoundedBoxGeometry(2.0, 0.18, 1.31, 4, 0.075),
    shell,
    chamberPivot,
  );
  lowerFrame.position.y = 0.09;
  lowerFrame.userData.part = 'lower-chamber-frame';

  const upperFrame = kit.mesh(
    'popcorn-machine-wide-upper-chamber-frame',
    new RoundedBoxGeometry(2.08, 0.2, 1.38, 4, 0.075),
    shellLight,
    chamberPivot,
  );
  upperFrame.position.y = 1.4;
  upperFrame.userData.part = 'upper-chamber-frame';

  const domePivot = kit.pivot('popcorn-machine-top-assembly-pivot');
  domePivot.position.y = 2.82;
  const dome = kit.mesh(
    'popcorn-machine-low-pink-dome',
    lowRoundedDome(1.0, 0.5, 0.67),
    accentSoft,
    domePivot,
  );
  dome.position.y = 0;
  dome.userData.part = 'top-dome';
  const domeEave = kit.mesh(
    'popcorn-machine-dome-eave-band',
    new RoundedBoxGeometry(2.12, 0.14, 1.4, 4, 0.065),
    accent,
    domePivot,
  );
  domeEave.position.y = 0.015;
  domeEave.userData.explodeWithParent = true;
  const crown = kit.mesh(
    'popcorn-machine-top-crown',
    new RoundedBoxGeometry(0.34, 0.14, 0.27, 4, 0.055),
    accent,
    domePivot,
  );
  crown.position.y = 0.55;
  crown.userData.part = 'top-crown';
  kit.socket('popcorn-machine-dome-crown-seat', domePivot, [0, 0.49, 0]);

  // Pass 2: four independent clear panels and four structural corner posts.
  const frontPanel = kit.mesh(
    'popcorn-machine-clear-front-panel',
    new RoundedBoxGeometry(1.78, 1.25, 0.028, 3, 0.035),
    glass,
    chamberPivot,
    false,
  );
  frontPanel.position.set(0, 0.74, 0.607);
  frontPanel.renderOrder = 5;
  frontPanel.userData.part = 'front-glass';
  const backPanel = kit.mesh(
    'popcorn-machine-clear-back-panel',
    new RoundedBoxGeometry(1.78, 1.25, 0.028, 3, 0.035),
    glass,
    chamberPivot,
    false,
  );
  backPanel.position.set(0, 0.74, -0.607);
  backPanel.renderOrder = 5;
  backPanel.userData.part = 'back-glass';
  for (const x of [-0.93, 0.93]) {
    const side = kit.mesh(
      `popcorn-machine-clear-${x < 0 ? 'left' : 'right'}-panel`,
      new RoundedBoxGeometry(0.028, 1.25, 1.17, 3, 0.035),
      glass,
      chamberPivot,
      false,
    );
    side.position.set(x, 0.74, 0);
    side.renderOrder = 5;
    side.userData.part = 'side-glass';
  }

  for (const [x, z, label] of [
    [-0.93, 0.6, 'front-left'],
    [0.93, 0.6, 'front-right'],
    [-0.93, -0.6, 'rear-left'],
    [0.93, -0.6, 'rear-right'],
  ] as const) {
    const post = kit.mesh(
      `popcorn-machine-chamber-post-${label}`,
      new RoundedBoxGeometry(0.105, 1.31, 0.105, 3, 0.038),
      shellLight,
      chamberPivot,
    );
    post.position.set(x, 0.75, z);
    post.userData.part = 'chamber-posts';
  }

  // Rotating roof mechanism: drive spindle, disc and three visible stirring arms.
  const popperPivot = kit.pivot('popcorn-machine-popper-pivot', domePivot);
  popperPivot.position.set(0, -0.2, 0);
  popperPivot.userData.rotationAxis = [0, 1, 0];
  popperPivot.userData.rotationRange = [0, Math.PI * 2];
  kit.socket('popcorn-machine-popper-drive-socket', popperPivot, [0, 0.18, 0]);

  const driveColumn = kit.mesh(
    'popcorn-machine-popper-drive-column',
    new THREE.CylinderGeometry(0.13, 0.15, 0.25, 16),
    accent,
    popperPivot,
  );
  driveColumn.position.y = -0.01;
  driveColumn.userData.part = 'popper-column';
  const rotorDisc = kit.mesh(
    'popcorn-machine-popper-rotating-disc',
    new THREE.CylinderGeometry(0.34, 0.38, 0.12, 20),
    accentDeep,
    popperPivot,
  );
  rotorDisc.position.y = -0.16;
  rotorDisc.userData.part = 'popper-rotor';
  for (let index = 0; index < 3; index += 1) {
    const arm = kit.mesh(
      `popcorn-machine-popper-stirring-arm-${index + 1}`,
      new RoundedBoxGeometry(0.48, 0.055, 0.07, 2, 0.025),
      accent,
      popperPivot,
      false,
    );
    arm.position.y = -0.22;
    arm.rotation.y = index * Math.PI * 2 / 3;
    arm.userData.explodeWithParent = true;
  }
  const lamp = kit.mesh(
    'popcorn-machine-warm-popper-lamp',
    new THREE.CylinderGeometry(0.25, 0.29, 0.045, 18),
    warmLamp,
    popperPivot,
    false,
  );
  lamp.position.y = -0.235;
  lamp.renderOrder = 3;

  // Pass 3: true-depth front outlet, projecting tray, controls, rear vents and feet.
  const deliveryPivot = kit.pivot('popcorn-machine-delivery-assembly-pivot', cabinetPivot);
  const chute = kit.mesh(
    'popcorn-machine-deep-arched-delivery-chute',
    archGeometry(0.88, 0.75, 0.16, 0.1),
    cavity,
    deliveryPivot,
  );
  chute.position.set(-0.1, 0.67, 0.69);
  chute.userData.part = 'delivery-chute';
  const chuteBack = kit.mesh(
    'popcorn-machine-delivery-chute-back-wall',
    archGeometry(0.72, 0.6, 0.03, 0.06),
    seam,
    deliveryPivot,
    false,
  );
  chuteBack.position.set(-0.1, 0.64, 0.785);
  chuteBack.userData.explodeWithParent = true;

  const tray = kit.mesh(
    'popcorn-machine-projecting-delivery-tray',
    new RoundedBoxGeometry(0.96, 0.18, 0.56, 4, 0.08),
    accent,
    deliveryPivot,
  );
  tray.position.set(-0.1, 0.34, 0.87);
  tray.rotation.x = -0.06;
  tray.userData.part = 'delivery-tray';
  const trayLip = kit.mesh(
    'popcorn-machine-delivery-tray-front-lip',
    new RoundedBoxGeometry(0.98, 0.24, 0.12, 3, 0.055),
    accentSoft,
    deliveryPivot,
  );
  trayLip.position.set(-0.1, 0.4, 1.12);
  trayLip.userData.explodeWithParent = true;
  kit.socket(
    'popcorn-machine-dispense-socket',
    deliveryPivot,
    [-0.1, 0.76, 0.64],
  );

  const controlPivot = kit.pivot('popcorn-machine-control-pivot', cabinetPivot);
  controlPivot.position.set(0.68, 0.64, 0.71);
  controlPivot.userData.rotationAxis = [0, 0, 1];
  controlPivot.userData.rotationRange = [-0.8, 0.15];
  kit.socket('popcorn-machine-control-socket', controlPivot, [0, 0, 0]);
  const controlSeat = kit.mesh(
    'popcorn-machine-control-dark-seat',
    new THREE.CylinderGeometry(0.17, 0.17, 0.055, 18),
    accentDeep,
    controlPivot,
  );
  controlSeat.rotation.x = Math.PI * 0.5;
  const controlButton = kit.mesh(
    'popcorn-machine-round-control-button',
    new THREE.CylinderGeometry(0.135, 0.145, 0.105, 18),
    accentSoft,
    controlPivot,
  );
  controlButton.rotation.x = Math.PI * 0.5;
  controlButton.position.z = 0.055;
  const controlIndex = kit.mesh(
    'popcorn-machine-control-index-mark',
    new RoundedBoxGeometry(0.025, 0.075, 0.018, 1, 0.007),
    cavity,
    controlPivot,
    false,
  );
  controlIndex.position.set(0, 0.075, 0.12);

  for (const x of [-1.055, 1.055]) {
    const sideHub = kit.mesh(
      `popcorn-machine-side-chamber-hub-${x < 0 ? 'left' : 'right'}`,
      new THREE.CylinderGeometry(0.115, 0.115, 0.075, 16),
      accent,
      chamberPivot,
    );
    sideHub.rotation.z = Math.PI * 0.5;
    sideHub.position.set(x, 0.72, 0.02);
    sideHub.userData.part = 'side-control';
  }
  const sideRelease = kit.mesh(
    'popcorn-machine-side-release-lever-inferred',
    wedgeGeometry(),
    accent,
    cabinetPivot,
  );
  sideRelease.rotation.y = Math.PI * 0.5;
  sideRelease.position.set(-1.05, 0.58, 0.18);
  sideRelease.userData.part = 'side-release';

  const rearPanel = kit.mesh(
    'popcorn-machine-rear-service-panel',
    new RoundedBoxGeometry(1.48, 0.77, 0.035, 3, 0.12),
    shell,
    cabinetPivot,
    false,
  );
  rearPanel.position.set(0, 0.74, -0.687);
  for (let index = 0; index < 10; index += 1) {
    const vent = kit.mesh(
      `popcorn-machine-rear-vent-${index + 1}`,
      new RoundedBoxGeometry(0.045, 0.44, 0.025, 2, 0.02),
      seam,
      cabinetPivot,
      false,
    );
    vent.position.set(-0.49 + index * 0.11, 0.72, -0.713);
    vent.userData.explodeWithParent = true;
  }
  kit.socket('popcorn-machine-power-cable-socket', cabinetPivot, [0, 0.27, -0.72]);

  for (const [x, z, label] of [
    [-0.74, 0.43, 'front-left'],
    [0.74, 0.43, 'front-right'],
    [-0.74, -0.43, 'rear-left'],
    [0.74, -0.43, 'rear-right'],
  ] as const) {
    const foot = kit.mesh(
      `popcorn-machine-foot-${label}`,
      new RoundedBoxGeometry(0.32, 0.12, 0.3, 3, 0.05),
      rubber,
      kit.root,
      false,
    );
    foot.position.set(x, 0.07, z);
    foot.userData.part = 'feet';
  }

  // Popcorn is a deterministic repeated system. One shared five-lobe geometry
  // keeps each piece recognizable without an expensive outline hull per lobe.
  const sharedPopcornGeometry = popcornGeometry();
  sharedPopcornGeometry.computeBoundingSphere();
  const popcornBoundingRadius = sharedPopcornGeometry.boundingSphere?.radius ?? 0.17;
  const staticPieceCount = 56;
  const creamPieceCount = Math.ceil(staticPieceCount / 5);
  const lightPieceCount = staticPieceCount - creamPieceCount;
  const makeStaticBatch = (
    name: string,
    count: number,
    material: THREE.Material,
  ): THREE.InstancedMesh => {
    const batch = new THREE.InstancedMesh(sharedPopcornGeometry, material, count);
    batch.name = name;
    batch.castShadow = true;
    batch.receiveShadow = true;
    batch.renderOrder = 2;
    batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    batch.userData.applianceId = options.id;
    batch.userData.part = 'popcorn-cluster';
    batch.userData.performanceInstances = [];
    kit.root.add(batch);
    kit.interactiveMeshes.push(batch);
    return batch;
  };
  const staticLightBatch = makeStaticBatch(
    'popcorn-machine-popped-kernel-light-batch',
    lightPieceCount,
    popcornLight,
  );
  const staticCreamBatch = makeStaticBatch(
    'popcorn-machine-popped-kernel-cream-batch',
    creamPieceCount,
    popcornCream,
  );
  const staticBatches = [staticLightBatch, staticCreamBatch];
  const staticTransform = new THREE.Object3D();
  const writeStaticInstance = (
    piece: StaticPopcornPiece,
    position: THREE.Vector3,
    rotation: THREE.Euler,
  ): void => {
    staticTransform.position.copy(position);
    staticTransform.rotation.copy(rotation);
    staticTransform.scale.copy(piece.idleScale);
    staticTransform.updateMatrix();
    piece.batch.setMatrixAt(piece.instanceIndex, staticTransform.matrix);
  };
  const packedPieces: PackedPopcornPiece[] = [];
  let lightInstanceIndex = 0;
  let creamInstanceIndex = 0;
  for (let index = 0; index < staticPieceCount; index += 1) {
    const creamPiece = index % 5 === 0;
    const batch = creamPiece ? staticCreamBatch : staticLightBatch;
    const instanceIndex = creamPiece ? creamInstanceIndex++ : lightInstanceIndex++;
    const idleRotation = new THREE.Euler(
      random() * 2.4,
      random() * Math.PI * 2,
      random() * 2.4,
    );
    const scale = 0.86 + random() * 0.3;
    const idleScale = new THREE.Vector3(
      scale * (0.9 + random() * 0.18),
      scale * (0.86 + random() * 0.22),
      scale * (0.9 + random() * 0.18),
    );
    const collisionRadius = popcornBoundingRadius * Math.max(
      idleScale.x,
      idleScale.y,
      idleScale.z,
    );
    // Best-candidate packing produces a dense blue-noise mound: every piece
    // competes for the clearest local gap, so no index-driven rows or stairs
    // survive, and close neighbours remain staggered instead of co-planar.
    const idlePosition = staggeredPackedPosition(
      random,
      packedPieces,
      collisionRadius,
      () => {
        const x = THREE.MathUtils.lerp(-0.72, 0.72, random());
        const z = THREE.MathUtils.lerp(-0.39, 0.39, random());
        const xFalloff = 1 - THREE.MathUtils.clamp((x / 0.76) ** 2, 0, 1);
        const zFalloff = 1 - THREE.MathUtils.clamp((z / 0.43) ** 2, 0, 1);
        const moundTop = 1.91 + xFalloff * 0.24 + zFalloff * 0.075;
        const y = THREE.MathUtils.lerp(1.51, moundTop, random() ** 1.18);
        return new THREE.Vector3(x, y, z);
      },
    );
    const phase = random() * Math.PI * 2;
    const piece: StaticPopcornPiece = {
      batch,
      instanceIndex,
      idlePosition,
      idleRotation,
      idleScale,
      phase,
    };
    writeStaticInstance(piece, idlePosition, idleRotation);
    (batch.userData.performanceInstances as unknown[]).push({
      instanceIndex,
      idlePosition: idlePosition.toArray(),
      idleRotation: [idleRotation.x, idleRotation.y, idleRotation.z],
      idleScale: idleScale.toArray(),
      phase,
      frequency: 7.55 + (index % 7) * 0.31,
      jumpHeight: 0.09 + (index % 5) * 0.012,
    });
  }
  staticBatches.forEach((batch) => { batch.instanceMatrix.needsUpdate = true; });

  // Twenty-four visible kernels pop in a tight sequence. The dedicated
  // performance keeps them jumping rapidly after the initial seed-to-pop
  // swap, so the chamber reads as actively erupting instead of filling once.
  for (let index = 0; index < 24; index += 1) {
    const poppedScale = 0.78 + index % 5 * 0.045;
    const jumpHeight = 0.46 + (index % 4) * 0.055;
    const target = staggeredPackedPosition(
      random,
      packedPieces,
      popcornBoundingRadius * poppedScale,
      () => new THREE.Vector3(
        THREE.MathUtils.lerp(-0.68, 0.68, random()),
        THREE.MathUtils.lerp(1.76, 2.24, random()),
        THREE.MathUtils.lerp(-0.37, 0.37, random()),
      ),
      96,
      [0, jumpHeight * 0.5, jumpHeight + 0.035],
    );
    const seed = kit.mesh(
      `popcorn-machine-unpopped-seed-${index + 1}`,
      new THREE.SphereGeometry(0.052, 7, 5),
      kernelGold,
      kit.root,
      false,
    );
    seed.scale.set(1.25, 0.72, 0.8);
    seed.position.copy(target).setY(1.5 + (index % 2) * 0.055);
    seed.renderOrder = 2;
    const popped = kit.mesh(
      `popcorn-machine-powered-pop-${index + 1}`,
      sharedPopcornGeometry,
      index % 3 === 0 ? popcornCream : popcornLight,
      kit.root,
      false,
    );
    popped.position.copy(seed.position);
    popped.scale.setScalar(0.001);
    popped.visible = false;
    popped.renderOrder = 2;
    seed.userData.performancePhase = 0.46 + index * 0.075;
    popped.userData.performancePhase = 0.46 + index * 0.075;
    popped.userData.performanceTarget = target.toArray();
    popped.userData.performanceRotation = [random() * 2, random() * Math.PI * 2, random() * 2];
    popped.userData.performanceScale = poppedScale;
    popped.userData.performanceJumpHeight = jumpHeight;
    popped.userData.performanceJumpFrequencyHz = 7.4 + (index % 6) * 0.38;
  }

  // Model-owned outward burst pool. These meshes deliberately share the exact
  // same BufferGeometry and material instances as the chamber popcorn. The
  // dedicated performance module moves them from the chamber, through the
  // front outlet, and into the exterior; no second spectacle-style prop exists.
  const burstRoot = kit.pivot('popcorn-machine-outward-burst-root');
  burstRoot.userData.effectOwner = 'PopcornMachinePerformance';
  burstRoot.userData.direction = 'inside-to-outside-positive-z';
  const externalPieceCount = 48;
  for (let index = 0; index < externalPieceCount; index += 1) {
    const lateral = ((index * 13) % 23 - 11) / 11;
    const heightClass = index % 6;
    const source = new THREE.Vector3(-0.1, 0.76, 0.64);
    const outlet = new THREE.Vector3(
      -0.1 + lateral * 0.22,
      0.78 + heightClass * 0.018,
      1.42,
    );
    const crest = new THREE.Vector3(
      -0.1 + lateral * (1.05 + (index % 4) * 0.13),
      2.18 + heightClass * 0.28,
      2.72 + (index % 4) * 0.14,
    );
    const exterior = new THREE.Vector3(
      -0.1 + lateral * (2.5 + (index % 5) * 0.18),
      0.42 + heightClass * 0.38,
      6.5 + (index % 6) * 0.3,
    );
    const piece = kit.mesh(
      `popcorn-machine-outward-pop-${index + 1}`,
      sharedPopcornGeometry,
      index % 5 === 0 ? popcornCream : popcornLight,
      burstRoot,
      false,
    );
    piece.visible = false;
    piece.position.copy(source);
    piece.renderOrder = 3;
    piece.userData.performanceEffect = 'same-language-outward-popcorn';
    piece.userData.performanceLaunchTime = 0.7 + index * 0.068;
    piece.userData.performanceFlightDuration = 1.45 + (index % 5) * 0.07;
    piece.userData.performancePath = [
      source.toArray(),
      outlet.toArray(),
      crest.toArray(),
      exterior.toArray(),
    ];
    piece.userData.performanceRotationRate = [
      5.2 + (index % 4) * 1.15,
      7.4 + (index % 5) * 0.93,
      4.1 + (index % 6) * 0.82,
    ];
    piece.userData.performanceScale = 0.82 + (index % 7) * 0.045;
  }

  const result = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'tall rounded lower cabinet, continuous pink base band and four feet',
        'wide cream chamber frames, four posts and four independent clear panels',
        'low superelliptic pink dome with crown and broad eave',
        'centered drive column, rotating popper disc and three stirring arms',
        'dense deterministic multi-lobed popcorn pile with golden kernels',
        'deep front arch, projecting tray, layered round control and side release',
        'ten rear ventilation slots and separate rear service panel',
        'popper pivot, dispense socket and power-cable socket',
      ],
      inferred: [
        'heater, motor, gearbox and internal dispense gate are hidden and omitted',
        'side triangular projection is interpreted as a release lever',
        'underside tread and power-cable shape are hidden; only a cable socket is provided',
        'popcorn trajectories are purpose-driven while constrained to the observed chamber and outlet',
      ],
    },
  );

  result.root.userData.referenceDimensions = {
    totalWidth: 2.12,
    totalHeight: 3.51,
    totalDepth: 1.4,
    lowerCabinetHeight: 1.42,
    chamberHeight: 1.31,
    domeHeight: 0.69,
    trayProjection: 1.18,
  };
  result.root.userData.activeDuration = 5.2;
  result.root.userData.popcornMachinePerformanceRig = {
    timelineOwner: 'AppliancePerformanceSystem/PopcornMachinePerformance',
    effectOwner: 'PopcornMachinePerformance',
    internalPieceCount: staticPieceCount + 24,
    staticPieceCount,
    poweredPieceCount: 24,
    externalPieceCount,
    geometryLanguage: 'shared-five-lobe-buffer-geometry',
    materialLanguage: 'shared-popcorn-light-and-cream-toon-materials',
    direction: 'chamber-to-front-outlet-to-positive-z-exterior',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  };
  result.root.userData.externalPerformanceCue = {
    type: 'popcorn-screen-spray',
    socket: 'popcorn-machine-dispense-socket',
    poolSize: 18,
    climaxWindow: [3.7, 4.8],
    launchSpeed: [4.8, 7.2],
    cameraBias: 0.72,
  };
  result.root.userData.sculptRuntime.colliders = [
    { id: 'popcorn-machine-cabinet', type: 'box', node: 'popcorn-machine-lower-cabinet-pivot' },
    { id: 'popcorn-machine-chamber', type: 'box', node: 'popcorn-machine-transparent-chamber-pivot', trigger: true },
    { id: 'popcorn-machine-dome', type: 'box', node: 'popcorn-machine-top-assembly-pivot' },
  ];
  result.root.userData.sculptRuntime.destructionGroups = [
    ['popcorn-machine-rounded-lower-cabinet', 'popcorn-machine-continuous-pink-base-band'],
    ['popcorn-machine-clear-front-panel', 'popcorn-machine-clear-back-panel'],
    ['popcorn-machine-low-pink-dome', 'popcorn-machine-top-crown'],
    ['popcorn-machine-deep-arched-delivery-chute', 'popcorn-machine-projecting-delivery-tray'],
  ];
  return result;
}
