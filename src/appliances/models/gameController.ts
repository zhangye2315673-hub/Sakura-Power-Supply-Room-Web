import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import { setHullOutlineStyle } from '../../style/outline';

const REFERENCE_PATH = 'references/intake-v2/game-controller/views/front.png';
const ACTIVE_DURATION = 5.2;

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 0xffffffff) * Math.PI * 2;
}

function applyGameControllerOutlineHierarchy(root: THREE.Object3D): void {
  const mainSilhouette = /cream-(front|rear)-shell|front-pink-grip-panel|rear-pink-grip-panel/;
  const fineDetail = /grip-boundary-seam|button-.*-crown|cap-inset|shoulder-hinge-cap|battery-cover-seam|upper-shell-highlight/;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.isOutline !== true) return;
    const parentName = object.parent?.name ?? object.name;
    const tier = mainSilhouette.test(parentName) ? 'main' : fineDetail.test(parentName) ? 'detail' : 'structure';
    setHullOutlineStyle(object, {
      thickness: tier === 'main' ? 0.0048 : tier === 'structure' ? 0.0041 : 0.0033,
      variation: 0.18,
      phase: stableOutlinePhase(parentName),
    });
    object.userData.outlineTier = tier;
  });
}

function rounded(width: number, height: number, depth: number, radius: number, segments = 1): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, segments, radius);
}

function extrude(shape: THREE.Shape, depth: number, bevelSize: number): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize,
    bevelThickness: bevelSize,
    curveSegments: 6,
    steps: 1,
  });
  geometry.translate(0, 0, -depth * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

function controllerOutline(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-2.38, 0.52);
  [
    [-2.31, 1.06], [-2.03, 1.55], [-1.62, 1.74], [-0.92, 1.88],
    [0.92, 1.88], [1.62, 1.74], [2.03, 1.55], [2.31, 1.06], [2.38, 0.52],
    [2.44, -0.2], [2.31, -1.18], [2.05, -1.48], [1.79, -1.58], [1.52, -1.69],
    [1.28, -1.47], [1.08, -1.05], [0.84, -0.56], [0.56, -0.4], [0.3, -0.43],
    [0, -0.47], [-0.3, -0.43], [-0.56, -0.4], [-0.84, -0.56], [-1.08, -1.05],
    [-1.28, -1.47], [-1.52, -1.69], [-1.79, -1.58], [-2.05, -1.48], [-2.31, -1.18],
    [-2.44, -0.2],
  ].forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  return shape;
}

function gripPanel(side: -1 | 1): THREE.Shape {
  const s = side;
  const shape = new THREE.Shape();
  shape.moveTo(s * 2.36, 0.0);
  [
    [s * 2.34, -0.5], [s * 2.2, -1.16], [s * 1.96, -1.48], [s * 1.78, -1.61],
    [s * 1.53, -1.7], [s * 1.3, -1.47], [s * 1.1, -1.03], [s * 1.22, -0.62],
    [s * 1.48, -0.25], [s * 1.82, 0.12], [s * 2.08, 0.14], [s * 2.36, 0.0],
  ].forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  return shape;
}

function dpadShape(): THREE.Shape {
  const s = new THREE.Shape();
  const a = 0.24;
  const b = 0.58;
  s.moveTo(-a, b);
  s.lineTo(a, b); s.quadraticCurveTo(a + 0.08, b, a + 0.08, b - 0.08);
  s.lineTo(a + 0.08, a + 0.08); s.lineTo(b - 0.08, a + 0.08);
  s.quadraticCurveTo(b, a + 0.08, b, a);
  s.lineTo(b, -a); s.quadraticCurveTo(b, -a - 0.08, b - 0.08, -a - 0.08);
  s.lineTo(a + 0.08, -a - 0.08); s.lineTo(a + 0.08, -b + 0.08);
  s.quadraticCurveTo(a + 0.08, -b, a, -b);
  s.lineTo(-a, -b); s.quadraticCurveTo(-a - 0.08, -b, -a - 0.08, -b + 0.08);
  s.lineTo(-a - 0.08, -a - 0.08); s.lineTo(-b + 0.08, -a - 0.08);
  s.quadraticCurveTo(-b, -a - 0.08, -b, -a);
  s.lineTo(-b, a); s.quadraticCurveTo(-b, a + 0.08, -b + 0.08, a + 0.08);
  s.lineTo(-a - 0.08, a + 0.08); s.lineTo(-a - 0.08, b - 0.08);
  s.quadraticCurveTo(-a - 0.08, b, -a, b);
  s.closePath();
  return s;
}

function starGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const points = 10;
  for (let index = 0; index < points; index += 1) {
    const angle = Math.PI * 0.5 + (index / points) * Math.PI * 2;
    const radius = index % 2 === 0 ? 0.28 : 0.13;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return extrude(shape, 0.15, 0.025);
}

function electricBoltGeometry(variant: number): THREE.TubeGeometry {
  const side = variant % 2 === 0 ? 1 : -1;
  const depth = (variant % 3 - 1) * 0.035;
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.11 * side, 0.22, depth),
    new THREE.Vector3(-0.08 * side, 0.43, -depth),
    new THREE.Vector3(0.13 * side, 0.66, depth * 0.5),
    new THREE.Vector3(0.02 * side, 0.88, 0),
  ], false, 'centripetal', 0.5);
  const geometry = new THREE.TubeGeometry(path, 18, 0.038, 6, false);
  geometry.computeVertexNormals();
  geometry.userData.performanceProp = 'volumetric-electric-bolt';
  return geometry;
}

function mark(mesh: THREE.Mesh, part: string, relief = false): void {
  mesh.userData.part = part;
  if (relief) mesh.userData.explodeWithParent = true;
}

/** Procedural three-view reconstruction of the Sakura wireless game controller. */
export function createGameControllerModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const accentColor = accent.clone().offsetHSL(0, -0.035, 0.055).getHex();
  const accentLight = accent.clone().offsetHSL(0, -0.07, 0.12).getHex();
  const accentDark = accent.clone().offsetHSL(0, 0.015, -0.13).getHex();

  const cream = kit.material(0xf6eddc, { tint: 0x927d86 });
  const creamLight = kit.material(0xfff7e8, { tint: 0xaa9292 });
  const pink = kit.material(accentColor, { tint: 0x8f6574 });
  const pinkLight = kit.material(accentLight, { tint: 0xa77781 });
  const pinkDark = kit.material(accentDark, { tint: 0x6b4e5b });
  const cavity = kit.material(0x69505a, { tint: 0x423743 });
  const fastener = kit.material(0x897263, { tint: 0x55464d });
  const statusMaterial = kit.indicatorMaterial;
  const homeMaterial = kit.material(accentLight, { tint: 0xa77781, emissive: 0x000000 });
  const energyGold = kit.material(0xffd56a, { tint: 0xc86873, emissive: 0xff9b45 });
  const energyRose = kit.material(0xff7fa3, { tint: 0x9b4d77, emissive: 0xff315f });
  const energyBlue = kit.material(0x76e2ff, { tint: 0x6d78ba, emissive: 0x3a9fff });

  const motion = kit.pivot('game-controller-motion-pivot');
  motion.position.y = 1.67;
  kit.socket('game-controller-centre-socket', motion, [0, 0.15, 0]);

  const shellGeometry = extrude(controllerOutline(), 0.62, 0.12);
  const frontShell = kit.mesh('game-controller-cream-front-shell', shellGeometry, cream, motion);
  frontShell.position.z = 0.14;
  mark(frontShell, 'front-shell');
  const rearShell = kit.mesh('game-controller-cream-rear-shell', shellGeometry.clone(), cream, motion);
  rearShell.scale.set(0.985, 0.985, 0.83);
  rearShell.position.z = -0.47;
  mark(rearShell, 'rear-shell');

  const upperHighlight = kit.mesh('game-controller-upper-shell-highlight', rounded(3.5, 0.1, 0.06, 0.04, 3), creamLight, motion, false);
  upperHighlight.position.set(0, 1.55, 0.53);
  mark(upperHighlight, 'front-shell', true);

  const gripMeshes: THREE.Mesh[] = [];
  for (const side of [-1, 1] as const) {
    const label = side < 0 ? 'left' : 'right';
    const frontPanel = kit.mesh(`game-controller-${label}-front-pink-grip-panel`, extrude(gripPanel(side), 0.13, 0.065), pink, motion);
    frontPanel.position.z = 0.49;
    mark(frontPanel, `${label}-grip-panel`);
    const rearPanel = kit.mesh(`game-controller-${label}-rear-pink-grip-panel`, extrude(gripPanel(side), 0.11, 0.055), pink, motion);
    rearPanel.position.z = -0.78;
    mark(rearPanel, `${label}-grip-panel`);
    gripMeshes.push(frontPanel, rearPanel);
    const boundary = kit.mesh(`game-controller-${label}-grip-boundary-seam`, rounded(0.76, 0.05, 0.035, 0.018, 1), pinkDark, motion);
    boundary.position.set(side * 1.65, 0.02, 0.57);
    boundary.rotation.z = side * -0.62;
    mark(boundary, `${label}-grip-panel`, true);
  }

  const dpadPivot = kit.pivot('game-controller-dpad-pivot', motion);
  dpadPivot.position.set(-1.23, 0.55, 0.51);
  dpadPivot.userData.rotationAxis = [1, 1, 0];
  kit.socket('game-controller-dpad-socket', motion, [-1.23, 0.55, 0.51]);
  const dpadCavity = kit.mesh('game-controller-dpad-dark-cavity', extrude(dpadShape(), 0.055, 0.075), cavity, dpadPivot, false);
  dpadCavity.scale.setScalar(1.055);
  dpadCavity.position.z = -0.015;
  mark(dpadCavity, 'dpad', true);
  const dpad = kit.mesh('game-controller-rounded-cross-dpad', extrude(dpadShape(), 0.15, 0.065), pink, dpadPivot);
  dpad.position.z = 0.035;
  mark(dpad, 'dpad');
  const dpadInset = kit.mesh('game-controller-dpad-centre-inset', rounded(0.34, 0.34, 0.045, 0.1, 3), pinkLight, dpadPivot, false);
  dpadInset.position.z = 0.19;
  mark(dpadInset, 'dpad', true);

  const faceButtonPivots: THREE.Group[] = [];
  const faceButtons: readonly [number, number][] = [[1.28, 0.82], [1.63, 0.49], [1.31, 0.15], [0.96, 0.48]];
  const faceGeometry = new THREE.CylinderGeometry(0.22, 0.235, 0.17, 12, 1);
  faceButtons.forEach(([x, y], index) => {
    const cavityRing = kit.mesh(
      `game-controller-face-button-${index + 1}-cavity-ring`,
      new THREE.TorusGeometry(0.25, 0.026, 5, 12),
      cavity,
      motion,
      false,
    );
    cavityRing.position.set(x, y, 0.575);
    mark(cavityRing, `face-button-${index + 1}`, true);
    const pivot = kit.pivot(`game-controller-face-button-${index + 1}-pivot`, motion);
    pivot.position.set(x, y, 0.56);
    pivot.userData.translationAxis = [0, 0, -1];
    const button = kit.mesh(`game-controller-face-button-${index + 1}`, faceGeometry, pinkLight, pivot);
    button.rotation.x = Math.PI * 0.5;
    mark(button, `face-button-${index + 1}`);
    const inset = kit.mesh(`game-controller-face-button-${index + 1}-crown`, new THREE.TorusGeometry(0.15, 0.014, 4, 12), pink, pivot, false);
    inset.position.z = 0.095;
    mark(inset, `face-button-${index + 1}`, true);
    kit.socket(`game-controller-face-button-${index + 1}-burst-socket`, pivot, [0, 0, 0.16]);
    faceButtonPivots.push(pivot);
  });

  const stickPivots: THREE.Group[] = [];
  const stickPositions = [-0.58, 0.58] as const;
  const socketGeometry = new THREE.TorusGeometry(0.405, 0.06, 6, 12);
  stickPositions.forEach((x, index) => {
    const socket = kit.mesh(`game-controller-stick-${index + 1}-cream-socket-ring`, socketGeometry, creamLight, motion);
    socket.position.set(x, -0.38, 0.56);
    mark(socket, `stick-${index + 1}-socket`);
    const cavityRing = kit.mesh(`game-controller-stick-${index + 1}-cavity-ring`, new THREE.TorusGeometry(0.34, 0.028, 5, 12), cavity, motion, false);
    cavityRing.position.set(x, -0.38, 0.585);
    mark(cavityRing, `stick-${index + 1}-socket`, true);
    const pivot = kit.pivot(`game-controller-stick-${index + 1}-pivot`, motion);
    pivot.position.set(x, -0.38, 0.59);
    pivot.userData.rotationAxis = [1, 1, 0];
    kit.socket(`game-controller-stick-${index + 1}-axis-socket`, motion, [x, -0.38, 0.59]);
    const stem = kit.mesh(`game-controller-stick-${index + 1}-stem`, new THREE.CylinderGeometry(0.14, 0.16, 0.22, 10), pinkDark, pivot, false);
    stem.rotation.x = Math.PI * 0.5;
    stem.position.z = 0.09;
    mark(stem, `analog-stick-${index + 1}`);
    const cap = kit.mesh(`game-controller-stick-${index + 1}-pink-cap`, new THREE.CylinderGeometry(0.34, 0.305, 0.19, 12, 1), pinkLight, pivot);
    cap.rotation.x = Math.PI * 0.5;
    cap.position.z = 0.23;
    mark(cap, `analog-stick-${index + 1}`);
    const capInset = kit.mesh(`game-controller-stick-${index + 1}-cap-inset`, new THREE.TorusGeometry(0.225, 0.02, 4, 12), pink, pivot, false);
    capInset.position.z = 0.34;
    mark(capInset, `analog-stick-${index + 1}`, true);
    stickPivots.push(pivot);
  });

  const homePivot = kit.pivot('game-controller-home-button-pivot', motion);
  homePivot.position.set(0, 0.92, 0.56);
  homePivot.userData.translationAxis = [0, 0, -1];
  const home = kit.mesh('game-controller-round-home-button', new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12), homeMaterial, homePivot);
  home.rotation.x = Math.PI * 0.5;
  mark(home, 'home-button');
  const selectPivot = kit.pivot('game-controller-select-button-pivot', motion);
  selectPivot.position.set(0, 0.46, 0.56);
  selectPivot.userData.translationAxis = [0, 0, -1];
  const select = kit.mesh('game-controller-horizontal-select-button', rounded(0.36, 0.17, 0.13, 0.055, 1), pinkLight, selectPivot);
  mark(select, 'select-button');

  const statusLens = kit.mesh('game-controller-rose-status-lens', new THREE.SphereGeometry(0.07, 10, 6), statusMaterial, motion, false);
  statusLens.scale.set(1.65, 0.48, 0.55);
  statusLens.position.set(0, 0.67, 0.69);
  mark(statusLens, 'status-lens');

  const shoulderPivots: THREE.Group[] = [];
  for (const side of [-1, 1] as const) {
    const label = side < 0 ? 'left' : 'right';
    const bumperPivot = kit.pivot(`game-controller-${label}-bumper-pivot`, motion);
    bumperPivot.position.set(side * 1.53, 1.86, -0.35);
    bumperPivot.userData.rotationAxis = [1, 0, 0];
    kit.socket(`game-controller-${label}-bumper-hinge-socket`, motion, [side * 1.53, 1.86, -0.35]);
    const bumper = kit.mesh(`game-controller-${label}-pink-bumper`, rounded(0.96, 0.23, 0.5, 0.075, 1), pinkLight, bumperPivot);
    bumper.position.set(0, 0.04, 0.02);
    bumper.rotation.y = side * -0.08;
    mark(bumper, `${label}-bumper`);
    const triggerPivot = kit.pivot(`game-controller-${label}-trigger-pivot`, motion);
    triggerPivot.position.set(side * 1.56, 1.73, -0.68);
    triggerPivot.userData.rotationAxis = [1, 0, 0];
    kit.socket(`game-controller-${label}-trigger-hinge-socket`, motion, [side * 1.56, 1.73, -0.68]);
    const trigger = kit.mesh(`game-controller-${label}-pink-trigger`, rounded(0.82, 0.22, 0.46, 0.07, 1), pink, triggerPivot);
    trigger.position.z = -0.05;
    trigger.rotation.y = side * -0.08;
    mark(trigger, `${label}-trigger`);
    const hingeCap = kit.mesh(
      `game-controller-${label}-shoulder-hinge-cap`,
      new THREE.CylinderGeometry(0.105, 0.105, 0.14, 8, 1),
      pinkDark,
      bumperPivot,
      false,
    );
    hingeCap.rotation.z = Math.PI * 0.5;
    hingeCap.position.set(side * 0.41, 0.015, 0.03);
    mark(hingeCap, `${label}-bumper`, true);
    shoulderPivots.push(bumperPivot, triggerPivot);
  }

  // Model-owned performance props. Every effect is closed geometry with real
  // thickness; the shared game/gallery timeline only toggles and transforms it.
  const effectRoot = kit.pivot('game-controller-ultimate-effects-pivot', motion);
  const burstOrigins: readonly [number, number, number][] = [
    [-2.65, 1.52, 0.93], [2.65, 1.52, 0.93], [-2.62, -2.05, 0.98],
    [2.62, -2.05, 0.98], [0, 2.22, 0.98],
  ];
  const starGeo = starGeometry();
  burstOrigins.forEach(([x, y, z], index) => {
    const star = kit.mesh(`game-controller-ultimate-star-${index + 1}`, starGeo, energyGold, effectRoot, false);
    star.position.set(x, y, z);
    star.visible = false;
    star.userData.performanceEffect = 'volumetric-star';
    star.userData.effectIndex = index;
    mark(star, 'ultimate-effects', true);
  });
  for (let index = 0; index < 4; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const bolt = kit.mesh(
      `game-controller-ultimate-electric-bolt-${index + 1}`,
      electricBoltGeometry(index),
      energyBlue,
      effectRoot,
      false,
    );
    // Electric accents sit beyond the left/right silhouette instead of
    // reading as details embedded in the controller shell.
    bolt.position.set(side * (2.72 + Math.floor(index / 2) * 0.28), 0.72 - (index % 2) * 1.34, 0.9);
    bolt.rotation.z = side * (0.52 + index * 0.08);
    bolt.visible = false;
    bolt.userData.performanceEffect = 'volumetric-electric-bolt';
    bolt.userData.effectIndex = index;
    mark(bolt, 'ultimate-effects', true);
  }
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const shard = kit.mesh(
      `game-controller-ultimate-impact-shard-${index + 1}`,
      index % 2 === 0 ? new THREE.OctahedronGeometry(0.15, 0) : new THREE.TetrahedronGeometry(0.17, 0),
      index % 3 === 0 ? energyRose : energyGold,
      effectRoot,
      false,
    );
    // The burst starts on an outside ellipse, then expands farther outward.
    shard.position.set(Math.cos(angle) * 2.62, Math.sin(angle) * 1.92 + 0.2, 0.96);
    shard.scale.set(0.72, 1.45, 0.82);
    shard.visible = false;
    shard.userData.performanceEffect = 'volumetric-impact-shard';
    shard.userData.effectIndex = index;
    shard.userData.burstAngle = angle;
    mark(shard, 'ultimate-effects', true);
  }
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + 0.3;
    const point = kit.mesh(
      `game-controller-ultimate-energy-point-${index + 1}`,
      new THREE.IcosahedronGeometry(0.085, 1),
      energyBlue,
      effectRoot,
      false,
    );
    point.position.set(Math.cos(angle) * 2.9, Math.sin(angle) * 2.2 + 0.18, 1.02);
    point.visible = false;
    point.userData.performanceEffect = 'volumetric-energy-point';
    point.userData.effectIndex = index;
    point.userData.burstAngle = angle;
    mark(point, 'ultimate-effects', true);
  }

  const rearPivot = kit.pivot('game-controller-rear-service-pivot', motion);
  const cover = kit.mesh('game-controller-rear-battery-cover', rounded(0.98, 0.61, 0.075, 0.075, 1), creamLight, rearPivot);
  cover.position.set(0, -0.15, -0.83);
  mark(cover, 'rear-battery-cover');
  const coverSeam = kit.mesh('game-controller-rear-battery-cover-seam', rounded(1.07, 0.7, 0.035, 0.09, 1), cavity, rearPivot, false);
  coverSeam.position.set(0, -0.15, -0.80);
  coverSeam.renderOrder = -1;
  mark(coverSeam, 'rear-battery-cover', true);
  const rearInset = kit.mesh('game-controller-rear-upper-centre-inset', rounded(0.82, 0.24, 0.085, 0.06, 1), pinkLight, rearPivot);
  rearInset.position.set(0, 1.35, -0.89);
  mark(rearInset, 'rear-port-cover');
  kit.socket('game-controller-power-connection-socket-inferred', rearPivot, [0, 1.35, -0.87]);

  const screwGeometry = new THREE.CylinderGeometry(0.072, 0.072, 0.035, 8);
  const screwPositions: readonly [number, number][] = [[-0.92, -0.44], [0.92, -0.44], [-1.96, -1.24], [1.96, -1.24]];
  screwPositions.forEach(([x, y], index) => {
    const screw = kit.mesh(`game-controller-rear-screw-${index + 1}`, screwGeometry, fastener, rearPivot, false);
    screw.rotation.x = Math.PI * 0.5;
    screw.position.set(x, y, -0.9);
    mark(screw, 'rear-screw-array');
  });

  // Freeze the archived v1 Box3 fallback anchors as explicit zero-geometry
  // sockets. Visual silhouette or outline changes can no longer move cables.
  kit.socket('game-controller-left-connection-socket', kit.root, [-3.13244048, 1.78511376, 1.14]);
  kit.socket('game-controller-right-connection-socket', kit.root, [3.12759112, 1.78511376, 1.14]);
  kit.socket('game-controller-top-connection-socket', kit.root, [-0.00242468, 4.24035533, 1.14]);
  kit.socket('game-controller-bottom-connection-socket', kit.root, [-0.00242468, -0.67012782, 1.14]);

  applyGameControllerOutlineHierarchy(kit.root);

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'faceted cream front and rear shells with broad upper deck, narrow waist, deep lower notch and flared ergonomic handles',
        'four separately modeled low-poly pink front/rear grip panels with outlined diagonal material boundaries',
        'faceted cross D-pad, four independent twelve-sided face buttons, two enlarged analog assemblies and two central controls',
        'chunkier two-layer left/right shoulder wedges with frozen hinge pivots and sockets',
        'recessed face-button wells, shoulder hinge caps and independent press pivots for every input family',
        'model-owned extruded stars, tubular electric bolts, polyhedral impact shards and icosahedral energy points for the ultimate burst',
        'rear battery cover, cover seam, upper centre inset, four screw heads and full perimeter shell separation',
      ],
      inferred: [
        'PCB, rumble motors, stick gimbals, button membranes, trigger springs and battery contacts are hidden and omitted',
        'rear upper-centre inset function and internal port cavity are inferred; only the observed exterior cover is reconstructed',
        'battery latch, screw drive pattern and exact underside shell wall thickness are not resolved by the supplied views',
      ],
    },
  );

  build.root.userData.referenceDimensions = {
    overallWidth: 4.8,
    overallHeight: 3.35,
    shellDepth: 1.28,
    stickSpacing: 1.16,
    lowerNotchWidth: 1.35,
  };
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.previewLightingProfile = 'sakura-appliance-v2';
  build.root.userData.sculptRuntime.colliders = [
    { id: 'controller-central-shell', type: 'box', node: 'game-controller-motion-pivot' },
    { id: 'controller-left-grip', type: 'capsule', node: 'game-controller-left-front-pink-grip-panel' },
    { id: 'controller-right-grip', type: 'capsule', node: 'game-controller-right-front-pink-grip-panel' },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'controller-shells', nodes: ['game-controller-cream-front-shell', 'game-controller-cream-rear-shell'] },
    { id: 'controller-front-controls', nodes: ['game-controller-dpad-pivot', 'game-controller-stick-1-pivot', 'game-controller-stick-2-pivot'] },
    { id: 'controller-shoulders', nodes: shoulderPivots.map((pivot) => pivot.name) },
    { id: 'controller-ultimate-effects', nodes: ['game-controller-ultimate-effects-pivot'] },
    { id: 'controller-rear-service', nodes: ['game-controller-rear-service-pivot'] },
  ];
  build.root.userData.gameControllerEffectContract = {
    owner: 'game-controller-model-rig',
    timelineOwner: 'AppliancePerformanceSystem',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
    volumeForms: ['extruded-star', 'tube-bolt', 'octahedral-impact-shard', 'icosahedral-energy-point'],
  };
  return build;
}
