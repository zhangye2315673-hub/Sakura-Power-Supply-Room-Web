import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import { setHullOutlineStyle } from '../../style/outline';

const REFERENCE_PATH = 'references/intake-v2/dehumidifier/views/front.png';
const ACTIVE_DURATION = 5.2;

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) * (Math.PI * 2 / 10000);
}

function applyDehumidifierOutlineHierarchy(root: THREE.Object3D): void {
  const mainSilhouette = /rounded-cream-upper-shell|removable-sakura-water-tank|cream-crown-around-exhaust/;
  const transparentOrEffect = /collected-water|water-level-window-glint|humidity|droplet|mist|wisp/;
  const fineDetail = /status-lens|glint|slat|divider|fan-blade|intake-slot|drain-port-core|power-inlet|foot/;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.isOutline !== true) return;
    const parentName = object.parent?.name ?? object.name;
    if (transparentOrEffect.test(parentName)) {
      object.visible = false;
      object.userData.outlineTier = 'excluded';
      return;
    }
    const tier = mainSilhouette.test(parentName) ? 'main' : fineDetail.test(parentName) ? 'detail' : 'structure';
    setHullOutlineStyle(object, {
      thickness: tier === 'main' ? 0.0048 : tier === 'structure' ? 0.0041 : 0.0033,
      variation: 0.18,
      phase: stableOutlinePhase(parentName),
    });
    object.userData.outlineTier = tier;
    object.userData.outlineStable = true;
  });
}
function rounded(
  width: number,
  height: number,
  depth: number,
  radius: number,
  segments = 4,
): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, segments, radius);
}

type LoftLevel = {
  y: number;
  width: number;
  depth: number;
  radius: number;
  centerZ?: number;
  slopeZ?: number;
};

function roundedRectangleRing(
  width: number,
  depth: number,
  radius: number,
  segmentsPerCorner = 6,
): THREE.Vector2[] {
  const halfWidth = width * 0.5;
  const halfDepth = depth * 0.5;
  const cornerRadius = Math.min(radius, halfWidth, halfDepth);
  const centers = [
    [halfWidth - cornerRadius, halfDepth - cornerRadius, 0],
    [-halfWidth + cornerRadius, halfDepth - cornerRadius, Math.PI * 0.5],
    [-halfWidth + cornerRadius, -halfDepth + cornerRadius, Math.PI],
    [halfWidth - cornerRadius, -halfDepth + cornerRadius, Math.PI * 1.5],
  ] as const;
  const points: THREE.Vector2[] = [];
  centers.forEach(([cx, cz, startAngle]) => {
    for (let index = 0; index < segmentsPerCorner; index += 1) {
      const angle = startAngle + (index / segmentsPerCorner) * Math.PI * 0.5;
      points.push(new THREE.Vector2(
        cx + Math.cos(angle) * cornerRadius,
        cz + Math.sin(angle) * cornerRadius,
      ));
    }
  });
  return points;
}

/**
 * Rounded-rectangle loft used instead of stacked boxes. Each horizontal ring
 * can taper and shift in Z, while the crown ring can tilt down toward the rear.
 */
function makeRoundedLoft(
  levels: LoftLevel[],
  segmentsPerCorner = 7,
  capTop = true,
): THREE.BufferGeometry {
  const rings = levels.map((level) => roundedRectangleRing(
    level.width,
    level.depth,
    level.radius,
    segmentsPerCorner,
  ));
  const ringSize = rings[0].length;
  const positions: number[] = [];
  rings.forEach((ring, levelIndex) => {
    const level = levels[levelIndex];
    ring.forEach((point) => {
      const z = point.y + (level.centerZ ?? 0);
      positions.push(point.x, level.y + (level.slopeZ ?? 0) * point.y, z);
    });
  });

  const bottomCenter = positions.length / 3;
  positions.push(0, levels[0].y, levels[0].centerZ ?? 0);
  const topCenter = positions.length / 3;
  if (capTop) {
    const top = levels.at(-1)!;
    positions.push(0, top.y, top.centerZ ?? 0);
  }

  const indices: number[] = [];
  for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex += 1) {
    const lower = levelIndex * ringSize;
    const upper = (levelIndex + 1) * ringSize;
    for (let index = 0; index < ringSize; index += 1) {
      const next = (index + 1) % ringSize;
      indices.push(lower + index, upper + index, upper + next);
      indices.push(lower + index, upper + next, lower + next);
    }
  }
  for (let index = 0; index < ringSize; index += 1) {
    const next = (index + 1) % ringSize;
    indices.push(bottomCenter, index, next);
    if (capTop) {
      const topOffset = (levels.length - 1) * ringSize;
      indices.push(topCenter, topOffset + next, topOffset + index);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeRoundedRectangleFrame(
  outerWidth: number,
  outerDepth: number,
  outerRadius: number,
  innerWidth: number,
  innerDepth: number,
  innerRadius: number,
  thickness: number,
): THREE.BufferGeometry {
  const outer = roundedRectangleRing(outerWidth, outerDepth, outerRadius, 3);
  const inner = roundedRectangleRing(innerWidth, innerDepth, innerRadius, 3).reverse();
  const shape = new THREE.Shape(outer);
  shape.holes.push(new THREE.Path(inner));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geometry.rotateX(Math.PI * 0.5);
  return geometry;
}

function setPart(mesh: THREE.Mesh, part: string, relief = false): void {
  mesh.userData.part = part;
  if (relief) mesh.userData.explodeWithParent = true;
}

function makeFanBladeGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0.08, -0.04);
  shape.bezierCurveTo(0.2, -0.17, 0.48, -0.17, 0.56, -0.02);
  shape.bezierCurveTo(0.44, 0.09, 0.22, 0.12, 0.08, 0.04);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 2,
    curveSegments: 5,
  });
  geometry.rotateX(Math.PI * 0.5);
  geometry.translate(0, 0.012, 0);
  return geometry;
}

function makeWaterDropletGeometry(): THREE.BufferGeometry {
  // Use a blunt, bead-like profile. The old profile converged to a needle at
  // the top, which read as a sharp cone when the suction timeline stretched it.
  const profile = [
    new THREE.Vector2(0.055, 0.29),
    new THREE.Vector2(0.12, 0.265),
    new THREE.Vector2(0.18, 0.19),
    new THREE.Vector2(0.2, 0.07),
    new THREE.Vector2(0.19, -0.08),
    new THREE.Vector2(0.16, -0.19),
    new THREE.Vector2(0.095, -0.265),
    new THREE.Vector2(0.035, -0.29),
    new THREE.Vector2(0, -0.275),
  ];
  const geometry = new THREE.LatheGeometry(profile, 16);
  geometry.computeVertexNormals();
  return geometry;
}

function makeMistLobeGeometry(seed: number): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(0.2, 1);
  const position = geometry.getAttribute('position');
  const vertex = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    const warp = 0.82
      + Math.sin(index * 2.17 + seed * 1.93) * 0.11
      + Math.cos(index * 0.73 + seed * 2.71) * 0.07;
    vertex.multiplyScalar(warp);
    vertex.x *= 1.08 + (seed % 3) * 0.08;
    vertex.y *= 0.88 + ((seed + 1) % 3) * 0.07;
    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeVaporWispGeometry(seed: number): THREE.BufferGeometry {
  const sway = seed % 2 === 0 ? 1 : -1;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16 * sway, -0.2, 0),
    new THREE.Vector3(0.05 * sway, -0.08, 0.055),
    new THREE.Vector3(-0.06 * sway, 0.08, -0.045),
    new THREE.Vector3(0.13 * sway, 0.23, 0.015),
  ]);
  return new THREE.TubeGeometry(curve, 8, 0.035, 6, false);
}

type HumidityEffectKind = 'droplet' | 'mist' | 'wisp';

type HumidityEffectDefinition = {
  kind: HumidityEffectKind;
  start: readonly [number, number, number];
  control: readonly [number, number, number];
  target: readonly [number, number, number];
  spawn: number;
  capture: number;
  size: number;
};

const HUMIDITY_EFFECTS: readonly HumidityEffectDefinition[] = [
  { kind: 'droplet', start: [-2.15, 0.72, 1.18], control: [-1.66, 2.08, 1.28], target: [-0.5, 2.88, 0.2], spawn: 0.42, capture: 3.9, size: 0.9 },
  { kind: 'mist', start: [2.22, 1.02, 1.06], control: [1.78, 2.32, 1.18], target: [0.5, 2.88, 0.15], spawn: 0.55, capture: 4.02, size: 1.2 },
  { kind: 'wisp', start: [-1.72, 2.08, 1.42], control: [-1.12, 2.72, 1.08], target: [-0.28, 2.9, 0.28], spawn: 0.64, capture: 3.72, size: 1.15 },
  { kind: 'droplet', start: [1.58, 2.42, 1.46], control: [1.24, 2.75, 1.02], target: [0.3, 2.89, 0.24], spawn: 0.72, capture: 4.08, size: 0.72 },
  { kind: 'mist', start: [-2.36, 1.62, 0.62], control: [-1.56, 2.4, 0.7], target: [-0.62, 2.86, 0.22], spawn: 0.82, capture: 3.88, size: 0.92 },
  { kind: 'wisp', start: [2.38, 1.78, 0.64], control: [1.5, 2.53, 0.76], target: [0.62, 2.86, 0.22], spawn: 0.9, capture: 4.14, size: 0.96 },
  { kind: 'droplet', start: [-1.08, 0.48, 1.82], control: [-0.9, 1.82, 1.52], target: [-0.14, 2.9, 0.32], spawn: 1.0, capture: 3.58, size: 1.08 },
  { kind: 'mist', start: [0.92, 0.64, 1.92], control: [1.08, 1.98, 1.58], target: [0.12, 2.9, 0.31], spawn: 1.08, capture: 3.96, size: 1.05 },
  { kind: 'wisp', start: [-2.02, 2.72, 0.9], control: [-1.22, 3.02, 0.76], target: [-0.44, 2.9, 0.12], spawn: 1.16, capture: 4.2, size: 0.84 },
  { kind: 'droplet', start: [2.06, 2.88, 0.82], control: [1.22, 3.08, 0.7], target: [0.45, 2.9, 0.12], spawn: 1.24, capture: 4.18, size: 0.88 },
  { kind: 'mist', start: [-0.32, 3.42, 1.42], control: [-0.5, 3.18, 0.92], target: [-0.18, 2.9, 0.16], spawn: 1.34, capture: 3.84, size: 0.8 },
  { kind: 'wisp', start: [0.54, 3.54, 1.22], control: [0.62, 3.2, 0.78], target: [0.2, 2.9, 0.14], spawn: 1.44, capture: 4.12, size: 0.86 },
  { kind: 'droplet', start: [-2.46, 0.92, 0.54], control: [-1.5, 2.0, 0.74], target: [-0.56, 2.86, 0.22], spawn: 1.52, capture: 4.0, size: 0.78 },
  { kind: 'mist', start: [2.52, 0.78, 0.58], control: [1.52, 2.06, 0.72], target: [0.56, 2.86, 0.22], spawn: 1.62, capture: 4.22, size: 0.88 },
  { kind: 'wisp', start: [-1.4, 1.42, 1.36], control: [-1.02, 2.42, 0.94], target: [-0.3, 2.87, 0.24], spawn: 1.72, capture: 4.1, size: 1.05 },
  { kind: 'droplet', start: [1.44, 1.58, 1.3], control: [0.96, 2.48, 0.88], target: [0.34, 2.87, 0.24], spawn: 1.82, capture: 4.24, size: 0.82 },
  { kind: 'mist', start: [-0.86, 0.54, 1.72], control: [-0.64, 1.96, 1.1], target: [-0.12, 2.88, 0.24], spawn: 1.92, capture: 4.16, size: 0.96 },
  { kind: 'wisp', start: [0.76, 0.68, 1.82], control: [0.68, 2.02, 1.12], target: [0.14, 2.88, 0.24], spawn: 2.02, capture: 4.26, size: 0.92 },
];

// Each actor completes shortly after it appears, with a deliberate stagger.
// This creates a continuous intake stream instead of a single end-of-timeline
// group disappearing together.
const HUMIDITY_CAPTURE_OFFSET = 0.82;
const HUMIDITY_CAPTURE_STEP = 0.13;

/**
 * Three-view reconstruction of the SAKURA compact compressor dehumidifier.
 * Local frame: +Y up, +Z front, floor at Y=0. Exterior proportions, vents,
 * tank seam and drain are observed; compressor, evaporator and tank float are
 * hidden and deliberately omitted rather than represented as known geometry.
 */
export function createDehumidifierModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const pink = accent.clone().offsetHSL(0, -0.055, 0.07).getHex();
  const pinkLight = accent.clone().offsetHSL(0, -0.1, 0.16).getHex();
  const pinkDark = accent.clone().offsetHSL(0, 0.015, -0.11).getHex();

  const cream = kit.material(0xf5eadb, { tint: 0x81727b });
  const creamLight = kit.material(0xfff6e8, { tint: 0x9a8587 });
  const pinkShell = kit.material(pink, { tint: 0x8c6575 });
  const pinkEdge = kit.material(pinkLight, { tint: 0xa97882 });
  const pinkShadow = kit.material(pinkDark, { tint: 0x6d5262 });
  const mintDark = kit.material(0x6e8f86, { tint: 0x405e5c });
  const cavity = kit.material(0x554e50, { tint: 0x38383f });
  const water = kit.material(0x86c7cf, {
    tint: 0x6a8f99,
    transparent: true,
    opacity: 0.72,
  });
  water.depthWrite = false;
  const waterGlint = kit.material(0xfff6e8, {
    tint: 0x9a8587,
    transparent: true,
    opacity: 0.48,
  });
  waterGlint.depthWrite = false;
  const dropletMaterial = kit.material(0x7dcddd, {
    tint: 0x4d91a1,
    transparent: true,
    opacity: 0.84,
  });
  const mistMaterial = kit.material(0xd3eef1, {
    tint: 0x9abcc7,
    transparent: true,
    opacity: 0.68,
  });
  const wispMaterial = kit.material(0xb6dfe7, {
    tint: 0x7ea9b7,
    transparent: true,
    opacity: 0.74,
  });
  const suctionGlow = kit.material(0xbfeafb, { emissive: 0x7cddff });
  suctionGlow.emissiveIntensity = 0;
  kit.indicatorMaterial.emissiveIntensity = 0;

  // Every physical component is parented below this one action root. The
  // humidity field intentionally remains its sibling so suction trajectories
  // do not inherit the machine's squash/stretch.
  const wholeMachinePivot = kit.pivot('dehumidifier-whole-machine-pivot');
  wholeMachinePivot.userData.animationRole = 'whole-appliance-root';

  // Blockout: one continuous tapered envelope split only at the real tank seam.
  const bodyPivot = kit.pivot('dehumidifier-main-body-pivot', wholeMachinePivot);
  const upperShell = kit.mesh(
    'dehumidifier-rounded-cream-upper-shell',
    makeRoundedLoft([
      { y: 1.17, width: 2.08, depth: 1.36, radius: 0.16 },
      { y: 1.34, width: 2.08, depth: 1.36, radius: 0.17 },
      { y: 2.38, width: 2.04, depth: 1.30, radius: 0.2, centerZ: 0.025 },
      { y: 2.64, width: 1.98, depth: 1.22, radius: 0.23, centerZ: 0.055 },
      { y: 2.76, width: 1.86, depth: 1.08, radius: 0.25, centerZ: 0.075, slopeZ: -0.213 },
    ], 3, false),
    cream,
    bodyPivot,
  );
  setPart(upperShell, 'upper-shell');

  const shellHighlight = kit.mesh(
    'dehumidifier-front-upper-shell-highlight',
    rounded(1.66, 0.035, 0.022, 0.012, 2),
    creamLight,
    bodyPivot,
    false,
  );
  shellHighlight.position.set(-0.02, 2.5, 0.666);
  setPart(shellHighlight, 'shell-highlight', true);

  const shoulderFacetGeometry = rounded(0.13, 0.82, 0.024, 0.02, 2);
  for (const [side, x, tilt] of [['left', -0.935, 0.12], ['right', 0.935, -0.12]] as const) {
    const facet = kit.mesh(
      `dehumidifier-front-${side}-shoulder-facet`,
      shoulderFacetGeometry,
      creamLight,
      bodyPivot,
      false,
    );
    facet.position.set(x, 2.05, 0.626);
    facet.rotation.z = tilt;
    setPart(facet, 'upper-shell-facets', true);
  }

  // The tank has a forward translation pivot and release socket for catalog interaction.
  const tankPivot = kit.pivot('dehumidifier-water-tank-slide-pivot', wholeMachinePivot);
  tankPivot.userData.translationAxis = [0, 0, 1];
  tankPivot.userData.translationRange = [0, 0.58];
  kit.socket('dehumidifier-water-tank-release-socket', tankPivot, [0, 0.62, 0.68]);
  const tankShell = kit.mesh(
    'dehumidifier-removable-sakura-water-tank',
    makeRoundedLoft([
      { y: 0.12, width: 1.82, depth: 1.14, radius: 0.14, centerZ: 0.015 },
      { y: 0.18, width: 1.96, depth: 1.28, radius: 0.18, centerZ: 0.012 },
      { y: 0.34, width: 2.07, depth: 1.36, radius: 0.2 },
      { y: 0.95, width: 2.09, depth: 1.38, radius: 0.17 },
      { y: 1.16, width: 2.08, depth: 1.36, radius: 0.15 },
    ], 3),
    pinkShell,
    tankPivot,
  );
  setPart(tankShell, 'water-tank');

  const tankTopSeam = kit.mesh(
    'dehumidifier-continuous-tank-seam',
    rounded(2.045, 0.024, 1.365, 0.011, 2),
    pinkShadow,
    tankPivot,
    false,
  );
  tankTopSeam.position.set(0, 1.165, 0);
  setPart(tankTopSeam, 'tank-seam', true);

  // Front water-level window is deeply layered: frame, dark well, moving water and highlight.
  const levelPivot = kit.pivot('dehumidifier-water-level-window-pivot', tankPivot);
  levelPivot.position.set(0, 0.63, 0.692);
  const levelFrame = kit.mesh(
    'dehumidifier-vertical-water-level-frame',
    rounded(0.13, 0.68, 0.034, 0.055, 5),
    pinkShadow,
    levelPivot,
  );
  setPart(levelFrame, 'water-level-window');
  const levelWell = kit.mesh(
    'dehumidifier-water-level-dark-well',
    rounded(0.082, 0.6, 0.026, 0.034, 4),
    cavity,
    levelPivot,
    false,
  );
  levelWell.position.z = 0.035;
  setPart(levelWell, 'water-level-window', true);
  const waterFill = kit.mesh(
    'dehumidifier-visible-collected-water-column',
    rounded(0.052, 0.53, 0.018, 0.021, 4),
    water,
    levelPivot,
    false,
  );
  waterFill.position.set(0, -0.2332, 0.052);
  waterFill.scale.y = 0.12;
  waterFill.renderOrder = 4;
  setPart(waterFill, 'collected-water', true);
  const levelGlint = kit.mesh(
    'dehumidifier-water-level-window-glint',
    rounded(0.011, 0.45, 0.006, 0.004, 2),
    waterGlint,
    levelPivot,
    false,
  );
  levelGlint.position.set(-0.019, 0.02, 0.065);
  setPart(levelGlint, 'water-level-window', true);

  // Embedded crown outlet: a real rounded frame with a hole, dense slats and dividers.
  const crownPivot = kit.pivot('dehumidifier-crown-surface-pivot', wholeMachinePivot);
  crownPivot.position.set(0, 2.76, 0.075);
  crownPivot.rotation.x = 0.21;
  const exhaustPivot = kit.pivot('dehumidifier-top-exhaust-pivot', wholeMachinePivot);
  exhaustPivot.position.set(0, 2.707, 0.075);
  // The review camera is only slightly elevated, so the embedded outlet uses
  // a ten-degree forward-facing rake: front lip low, rear lip high. The shell
  // loft terminates on the same plane, preventing the old floating-deck read.
  exhaustPivot.rotation.x = 0.38;
  kit.socket('dehumidifier-dry-air-output-socket', exhaustPivot, [0, 0.035, 0]);
  kit.socket('dehumidifier-moisture-intake-socket', exhaustPivot, [0, 0.16, 0]);
  const crownCap = kit.mesh(
    'dehumidifier-cream-crown-around-exhaust',
    makeRoundedRectangleFrame(1.86, 1.08, 0.25, 1.75, 0.61, 0.2, 0.035),
    cream,
    crownPivot,
    false,
  );
  setPart(crownCap, 'upper-shell', true);
  const exhaustCavity = kit.mesh(
    'dehumidifier-top-exhaust-dark-cavity',
    rounded(1.67, 0.04, 0.51, 0.19, 5),
    cavity,
    exhaustPivot,
    false,
  );
  exhaustCavity.position.y = -0.035;
  setPart(exhaustCavity, 'top-exhaust');
  const exhaustRim = kit.mesh(
    'dehumidifier-mint-top-exhaust-rim',
    makeRoundedRectangleFrame(1.82, 0.66, 0.28, 1.64, 0.49, 0.19, 0.045),
    suctionGlow,
    exhaustPivot,
  );
  exhaustRim.position.y = 0.018;
  setPart(exhaustRim, 'top-exhaust', true);

  const fanPivot = kit.pivot('dehumidifier-exhaust-fan-pivot', exhaustPivot);
  fanPivot.position.y = -0.055;
  fanPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('dehumidifier-fan-axis-socket', fanPivot, [0, 0, 0]);
  const fanHub = kit.mesh(
    'dehumidifier-exhaust-fan-hub',
    new THREE.CylinderGeometry(0.15, 0.15, 0.045, 18),
    mintDark,
    fanPivot,
    false,
  );
  setPart(fanHub, 'exhaust-fan');
  const bladeGeometry = makeFanBladeGeometry();
  for (let index = 0; index < 6; index += 1) {
    const blade = kit.mesh(
      `dehumidifier-exhaust-fan-blade-${index + 1}`,
      bladeGeometry,
      mintDark,
      fanPivot,
      false,
    );
    blade.rotation.y = index * Math.PI / 3;
    setPart(blade, 'exhaust-fan');
  }

  const slatCount = 13;
  const grilleSlats = new THREE.InstancedMesh(
    rounded(1.56, 0.024, 0.013, 0.006, 2),
    mintDark,
    slatCount,
  );
  grilleSlats.name = 'dehumidifier-top-grille-horizontal-slat-array';
  grilleSlats.castShadow = true;
  grilleSlats.receiveShadow = true;
  grilleSlats.userData.applianceId = options.id;
  setPart(grilleSlats, 'top-grille-array');
  const slatMatrix = new THREE.Matrix4();
  for (let index = 0; index < slatCount; index += 1) {
    slatMatrix.makeTranslation(0, 0.026, -0.22 + index * (0.44 / (slatCount - 1)));
    grilleSlats.setMatrixAt(index, slatMatrix);
  }
  grilleSlats.instanceMatrix.needsUpdate = true;
  exhaustPivot.add(grilleSlats);
  kit.interactiveMeshes.push(grilleSlats);
  kit.nodes.set(grilleSlats.name, grilleSlats);

  const dividerXs = [-0.58, -0.29, 0, 0.29, 0.58];
  const grilleDividers = new THREE.InstancedMesh(
    rounded(0.018, 0.028, 0.48, 0.008, 2),
    mintDark,
    dividerXs.length,
  );
  grilleDividers.name = 'dehumidifier-top-grille-vertical-divider-array';
  grilleDividers.castShadow = true;
  grilleDividers.receiveShadow = true;
  grilleDividers.userData.applianceId = options.id;
  setPart(grilleDividers, 'top-grille-array');
  dividerXs.forEach((x, index) => {
    slatMatrix.makeTranslation(x, 0.028, 0);
    grilleDividers.setMatrixAt(index, slatMatrix);
  });
  grilleDividers.instanceMatrix.needsUpdate = true;
  exhaustPivot.add(grilleDividers);
  kit.interactiveMeshes.push(grilleDividers);
  kit.nodes.set(grilleDividers.name, grilleDividers);

  // The control is deliberately proud of the face: even at its pressed depth
  // it must remain visible instead of being swallowed by the enclosure.
  const controlPivot = kit.pivot('dehumidifier-front-control-button-pivot', wholeMachinePivot);
  controlPivot.position.set(0, 2.03, 0.712);
  controlPivot.userData.translationAxis = [0, 0, -1];
  kit.socket('dehumidifier-front-control-socket', controlPivot, [0, 0, 0]);
  const controlRing = kit.mesh(
    'dehumidifier-front-control-shadow-ring',
    new THREE.CylinderGeometry(0.2, 0.2, 0.07, 12),
    pinkShadow,
    controlPivot,
  );
  controlRing.rotation.x = Math.PI * 0.5;
  setPart(controlRing, 'control-button');
  const controlFace = kit.mesh(
    'dehumidifier-front-round-sakura-control',
    new THREE.CylinderGeometry(0.164, 0.164, 0.075, 12),
    pinkEdge,
    controlPivot,
  );
  controlFace.rotation.x = Math.PI * 0.5;
  controlFace.position.z = 0.048;
  setPart(controlFace, 'control-button', true);
  const controlGlint = kit.mesh(
    'dehumidifier-control-button-glint',
    new THREE.TorusGeometry(0.154, 0.006, 4, 12),
    creamLight,
    controlPivot,
    false,
  );
  controlGlint.position.z = 0.092;
  setPart(controlGlint, 'control-button', true);

  // Back service panel, directly constrained by the rear reference view.
  const rearServicePivot = kit.pivot('dehumidifier-rear-service-pivot', wholeMachinePivot);
  rearServicePivot.position.z = -0.695;
  const handleWell = kit.mesh(
    'dehumidifier-rear-carry-handle-recess',
    rounded(0.72, 0.22, 0.06, 0.09, 4),
    cavity,
    rearServicePivot,
  );
  handleWell.position.y = 2.43;
  setPart(handleWell, 'rear-carry-handle');
  const handleInner = kit.mesh(
    'dehumidifier-rear-carry-handle-inner-lip',
    rounded(0.57, 0.095, 0.035, 0.04, 3),
    creamLight,
    rearServicePivot,
    false,
  );
  handleInner.position.set(0, 2.43, -0.035);
  setPart(handleInner, 'rear-carry-handle', true);

  const intakeFrame = kit.mesh(
    'dehumidifier-rear-air-intake-frame',
    rounded(1.42, 1.07, 0.055, 0.12, 4),
    creamLight,
    rearServicePivot,
  );
  intakeFrame.position.y = 1.68;
  setPart(intakeFrame, 'rear-air-intake');
  const intakeWell = kit.mesh(
    'dehumidifier-rear-air-intake-dark-well',
    rounded(1.25, 0.9, 0.035, 0.08, 4),
    cavity,
    rearServicePivot,
    false,
  );
  intakeWell.position.set(0, 1.68, -0.035);
  setPart(intakeWell, 'rear-air-intake', true);

  const ventGeometry = rounded(0.49, 0.035, 0.03, 0.014, 2);
  for (let row = 0; row < 13; row += 1) {
    for (const [column, x] of [[0, -0.31], [1, 0.31]] as const) {
      const vent = kit.mesh(
        `dehumidifier-rear-intake-slot-r${row + 1}-c${column + 1}`,
        ventGeometry,
        cream,
        rearServicePivot,
        false,
      );
      vent.position.set(x, 1.28 + row * 0.067, -0.072);
      setPart(vent, 'rear-intake-slot-array');
    }
  }

  const drainPivot = kit.pivot('dehumidifier-rear-drain-port-pivot', rearServicePivot);
  drainPivot.position.set(0, 0.2, -0.03);
  kit.socket('dehumidifier-continuous-drain-hose-socket', drainPivot, [0, 0, -0.12]);
  const drainRing = kit.mesh(
    'dehumidifier-rear-drain-port-ring',
    new THREE.CylinderGeometry(0.145, 0.145, 0.075, 20),
    pinkShadow,
    drainPivot,
  );
  drainRing.rotation.x = Math.PI * 0.5;
  setPart(drainRing, 'rear-drain-port');
  const drainCore = kit.mesh(
    'dehumidifier-rear-drain-port-core',
    new THREE.CylinderGeometry(0.075, 0.075, 0.095, 18),
    cavity,
    drainPivot,
    false,
  );
  drainCore.rotation.x = Math.PI * 0.5;
  drainCore.position.z = -0.025;
  setPart(drainCore, 'rear-drain-port', true);

  // The turn sheet does not show an inlet; this socket is an interaction-only inference.
  const powerInlet = kit.mesh(
    'dehumidifier-inferred-lower-rear-power-inlet',
    rounded(0.25, 0.15, 0.055, 0.035, 3),
    pinkShadow,
    rearServicePivot,
  );
  powerInlet.position.set(0.72, 0.23, -0.015);
  setPart(powerInlet, 'inferred-power-inlet');
  kit.socket('dehumidifier-power-cable-socket', rearServicePivot, [0.72, 0.23, -0.1]);

  const footGeometry = rounded(0.34, 0.11, 0.28, 0.04, 3);
  for (const [x, z, label] of [
    [-0.75, 0.45, 'front-left'],
    [0.75, 0.45, 'front-right'],
    [-0.75, -0.45, 'rear-left'],
    [0.75, -0.45, 'rear-right'],
  ] as const) {
    const foot = kit.mesh(`dehumidifier-foot-${label}`, footGeometry, pinkShadow, bodyPivot, false);
    foot.position.set(x, 0.07, z);
    setPart(foot, 'foot-array');
  }

  const effectField = kit.pivot('dehumidifier-humidity-field-pivot');
  effectField.userData.effectType = 'volumetric-humidity-field';
  const dropletGeometry = makeWaterDropletGeometry();
  const mistGeometries = [0, 1, 2].map((seed) => makeMistLobeGeometry(seed));
  HUMIDITY_EFFECTS.forEach((effect, index) => {
    const pivot = kit.pivot(`dehumidifier-humidity-particle-pivot-${index + 1}`, effectField);
    pivot.position.fromArray(effect.start);
    pivot.visible = false;
    pivot.userData.effectKind = effect.kind;
    pivot.userData.trajectoryStart = [...effect.start];
    pivot.userData.trajectoryControl = [...effect.control];
    pivot.userData.trajectoryTarget = [...effect.target];
    pivot.userData.spawnTime = effect.spawn;
    pivot.userData.captureTime = effect.spawn + HUMIDITY_CAPTURE_OFFSET + index * HUMIDITY_CAPTURE_STEP;
    pivot.userData.captureOrder = index;
    pivot.userData.baseSize = effect.size;
    pivot.userData.volumetricEffect = true;

    if (effect.kind === 'droplet') {
      const drop = kit.mesh(
        `dehumidifier-volumetric-water-droplet-${index + 1}`,
        dropletGeometry,
        dropletMaterial,
        pivot,
        false,
      );
      drop.scale.setScalar(effect.size);
      setPart(drop, 'volumetric-humidity-effects');
      return;
    }

    if (effect.kind === 'wisp') {
      const wisp = kit.mesh(
        `dehumidifier-volumetric-vapor-wisp-${index + 1}`,
        makeVaporWispGeometry(index),
        wispMaterial,
        pivot,
        false,
      );
      wisp.scale.setScalar(effect.size);
      setPart(wisp, 'volumetric-humidity-effects');
      return;
    }

    const lobeOffsets = [
      [-0.15, 0.02, 0.02],
      [0.11, 0.07, -0.025],
      [0.015, -0.09, 0.08],
    ] as const;
    lobeOffsets.forEach((offset, lobeIndex) => {
      const lobe = kit.mesh(
        `dehumidifier-volumetric-mist-lobe-${index + 1}-${lobeIndex + 1}`,
        mistGeometries[lobeIndex],
        mistMaterial,
        pivot,
        false,
      );
      lobe.position.fromArray(offset);
      lobe.scale.setScalar(effect.size * (0.78 + lobeIndex * 0.12));
      setPart(lobe, 'volumetric-humidity-effects');
    });
  });

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'continuously tapered rounded cream enclosure sharing its side contour with the Sakura-pink lower water tank',
        'embedded mint rounded-rectangle top exhaust with a true open frame, thirteen dense slats, five dividers and a recessed six-blade fan',
        'shallow flush circular front control, narrow status lens and reference-thin inset vertical water-level window',
        'rear carry-handle recess, framed two-column intake grille, centered lower drain port and four feet',
        'removable-tank pivot plus tank release, dry-air output, drain-hose, fan-axis and power-cable sockets',
        'eighteen opaque/translucent 3D humidity actors built as lathed droplets, irregular low-poly mist lobes and tubular vapor wisps, all curving into the top grille without Plane or Sprite effects',
        'one whole-machine action root shared by shell, tank, crown, controls, rear service panel and feet so squash/stretch never separates the assembly',
      ],
      inferred: [
        'compressor, evaporator coil, condenser, internal fan duct, tank float and control electronics are hidden and omitted',
        'the exact top-fan blade profile and depth below the dense exhaust grille are inferred from the visible outlet opening',
        'water behind the narrow level lens is animated conceptually; the opaque tank does not reveal its actual internal level',
        'lower-rear power inlet position is inferred because the turn sheet shows a drain port but no electrical connector',
        'underside fasteners, filter retention clips and the internal carry-handle wall thickness are not visible',
      ],
    },
  );

  applyDehumidifierOutlineHierarchy(build.root);

  build.root.userData.referenceDimensions = {
    overallWidth: 2.09,
    overallHeight: 2.79,
    overallDepth: 1.38,
    tankHeight: 1.16,
    topExhaustWidth: 1.82,
    rearIntakeWidth: 1.42,
  };
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.visualRevision = {
    id: 'dehumidifier-v2',
    style: 'SAKURA exaggerated low-poly Toon',
    referenceMode: 'admitted-existing-three-view',
    outline: { main: 0.0048, structure: 0.0041, detail: 0.0033, variation: 0.18 },
    frozenRig: true,
  };
  build.root.userData.dehumidifierEffectContract = {
    timelineOwner: 'AppliancePerformanceSystem',
    machineMotionRoot: 'dehumidifier-whole-machine-pivot',
    suctionSocket: 'dehumidifier-moisture-intake-socket',
    particleCount: HUMIDITY_EFFECTS.length,
    captureOrder: {
      mode: 'staggered-after-spawn',
      offset: HUMIDITY_CAPTURE_OFFSET,
      step: HUMIDITY_CAPTURE_STEP,
    },
    effectGeometry: ['LatheGeometry water droplets', 'irregular IcosahedronGeometry mist lobes', 'TubeGeometry vapor wisps'],
    forbiddenGeometry: ['PlaneGeometry', 'Sprite'],
    fanRotationDuringSkill: false,
  };
  build.root.userData.sculptRuntime.colliders = [
    { id: 'dehumidifier-upper-shell', type: 'box', node: 'dehumidifier-rounded-cream-upper-shell' },
    { id: 'dehumidifier-water-tank', type: 'box', node: 'dehumidifier-water-tank-slide-pivot' },
    { id: 'dehumidifier-top-exhaust-trigger', type: 'box', node: 'dehumidifier-top-exhaust-pivot', trigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'dehumidifier-enclosure', nodes: ['dehumidifier-whole-machine-pivot', 'dehumidifier-main-body-pivot', 'dehumidifier-rounded-cream-upper-shell'] },
    { id: 'dehumidifier-tank-system', nodes: ['dehumidifier-water-tank-slide-pivot', 'dehumidifier-water-level-window-pivot'] },
    { id: 'dehumidifier-air-system', nodes: ['dehumidifier-top-exhaust-pivot', 'dehumidifier-exhaust-fan-pivot'] },
    { id: 'dehumidifier-controls', nodes: ['dehumidifier-front-control-button-pivot'] },
    { id: 'dehumidifier-rear-service', nodes: ['dehumidifier-rear-service-pivot', 'dehumidifier-rear-drain-port-pivot'] },
  ];
  return build;
}
