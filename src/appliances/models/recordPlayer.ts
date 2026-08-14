import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { setHullOutlineStyle } from '../../style/outline';
import {
  ApplianceModelKit,
  orientCylinderBetween,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import { ensureRecordPlayerPerformanceRig } from '../performance/RecordPlayerPerformance';

const REFERENCE_PATH = 'references/intake/record-player/front.png';

function rounded(width: number, height: number, depth: number, radius: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, 1, radius);
}

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) * (Math.PI * 2 / 10000);
}

function applyRecordPlayerOutlineHierarchy(root: THREE.Object3D): void {
  const main = /rounded-body-shell|body-side-facet|raised-lid-shell|lid-side-spine|top-deck|front-grille-panel|black-vinyl-platter/;
  const structure = /lower-shell-seam|lid-inner-border|top-lid-latch|rear-hinge|pink-platter-perimeter|tonearm-base|tonearm-counterweight|tonearm-(?:rise|sweep)|pink-cartridge|speed-control-knob|recessed-carry-handle|rear-io-plate|foot-/;
  const excluded = /transparent-lid-panel|performance-|power-status-indicator/;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.isOutline !== true) return;
    const source = object.parent?.name ?? object.name;
    const sourceMesh = object.parent instanceof THREE.Mesh ? object.parent : null;
    const materials = sourceMesh
      ? (Array.isArray(sourceMesh.material) ? sourceMesh.material : [sourceMesh.material])
      : [];
    if (excluded.test(source) || materials.some((material) => material.transparent)) {
      object.visible = false;
      object.userData.outlineTier = 'excluded';
      return;
    }
    const tier = main.test(source) ? 'main' : structure.test(source) ? 'structure' : 'detail';
    setHullOutlineStyle(object, {
      thickness: tier === 'main' ? 0.0048 : tier === 'structure' ? 0.0041 : 0.0033,
      variation: 0.18,
      phase: stableOutlinePhase(source),
    });
    object.userData.outlineTier = tier;
    object.userData.outlineStable = true;
  });
}

function addCylinderBetween(
  kit: ApplianceModelKit,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  parent: THREE.Object3D,
  radialSegments = 12,
): THREE.Mesh {
  const mesh = kit.mesh(name, new THREE.CylinderGeometry(radius, radius, 1, radialSegments), material, parent, false);
  orientCylinderBetween(mesh, start, end);
  return mesh;
}

/**
 * SAKURA three-view reconstruction of the compact suitcase record player.
 * +Y is up, +Z is the front/grille side, and the floor is y=0.
 */
export function createRecordPlayerModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const accentSoft = accent.clone().offsetHSL(0, -0.08, 0.08).getHex();
  const accentDark = accent.clone().offsetHSL(0, -0.06, -0.1).getHex();

  const cream = kit.material(0xf8ead7, { tint: 0x776b75 });
  const creamLight = kit.material(0xfff5e7, { tint: 0x817583 });
  const pink = kit.material(accentSoft, { tint: 0x735f73 });
  const pinkDark = kit.material(accentDark, { tint: 0x5d5066 });
  const vinyl = kit.material(0x24252b, { tint: 0x46434c });
  const grilleMaterial = kit.material(accentDark, { tint: 0x655267 });
  const cavity = kit.material(0x3a343d, { tint: 0x302c35 });
  const rubber = kit.material(0x5e5660, { tint: 0x49434f });
  const metal = kit.material(0xb8afb0, { tint: 0x77717a });
  const lidMaterial = kit.material(0xf0e0d3, {
    tint: accentDark,
    transparent: true,
    opacity: 0.26,
  });
  lidMaterial.depthWrite = false;

  const bodyPivot = kit.pivot('record-player-body-pivot');
  bodyPivot.position.y = 0.54;
  const body = kit.mesh('record-player-rounded-body-shell', rounded(3.55, 0.78, 2.5, 0.14), cream, bodyPivot);
  body.userData.part = 'body-shell';

  const sideFacetGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, false);
  const sideFacetPositions: readonly (readonly [number, number])[] = [[-1.65, -1], [1.65, 1]];
  sideFacetPositions.forEach(([x, direction], index) => {
    const facet = kit.mesh(`record-player-body-side-facet-${index + 1}`, sideFacetGeometry, pink, bodyPivot);
    facet.rotation.z = Math.PI * 0.5;
    facet.scale.set(0.33, 0.08, 0.82);
    facet.position.set(x, -0.015, 0);
    facet.rotation.y = direction * 0.08;
    facet.userData.part = 'body-side-facets';
  });

  const topDeck = kit.mesh('record-player-top-deck', rounded(3.38, 0.08, 2.34, 0.035), creamLight, bodyPivot, false);
  topDeck.position.y = 0.43;
  topDeck.userData.explodeWithParent = true;
  const lowerSeam = kit.mesh('record-player-lower-shell-seam', rounded(3.44, 0.045, 2.52, 0.018), pinkDark, bodyPivot, false);
  lowerSeam.position.y = -0.3;
  lowerSeam.userData.explodeWithParent = true;

  const grillePanel = kit.mesh('record-player-front-grille-panel', rounded(3.28, 0.4, 0.045, 0.07), cavity, bodyPivot);
  grillePanel.position.set(0, -0.04, 1.265);
  grillePanel.userData.part = 'speaker-grille';
  const slatGeometry = rounded(3.08, 0.025, 0.035, 0.012);
  for (let index = 0; index < 11; index += 1) {
    const slat = kit.mesh(`record-player-speaker-grille-slat-${index + 1}`, slatGeometry, grilleMaterial, bodyPivot, false);
    slat.position.set(0, -0.195 + index * 0.031, 1.298);
    slat.userData.part = 'grille-slat-array';
    slat.userData.explodeWithParent = true;
  }
  const speakerBadge = kit.mesh('record-player-front-speaker-badge', new THREE.CylinderGeometry(0.13, 0.13, 0.035, 8), creamLight, bodyPivot, false);
  speakerBadge.rotation.x = Math.PI * 0.5;
  speakerBadge.position.set(-1.39, -0.04, 1.292);
  speakerBadge.userData.part = 'speaker-badge';
  const speakerPulse = kit.mesh('record-player-front-speaker-pulse-mark', new THREE.TorusGeometry(0.075, 0.018, 5, 8), pinkDark, bodyPivot, false);
  speakerPulse.position.set(-1.39, -0.04, 1.313);
  speakerPulse.userData.explodeWithParent = true;

  const footGeometry = rounded(0.34, 0.16, 0.34, 0.055);
  const footPositions: readonly (readonly [number, number])[] = [
    [-1.4, 0.98], [1.4, 0.98], [-1.4, -0.98], [1.4, -0.98],
  ];
  footPositions.forEach(([x, z], index) => {
    const foot = kit.mesh(`record-player-foot-${index + 1}`, footGeometry, rubber, kit.root, false);
    foot.position.set(x, 0.08, z);
    foot.userData.part = 'feet';
  });

  const lidPivot = kit.pivot('record-player-lid-hinge-pivot');
  lidPivot.position.set(0, 1, -1.19);
  lidPivot.userData.rotationAxis = [1, 0, 0];
  kit.socket('record-player-lid-attachment-socket', lidPivot, [0, 0, 0]);
  const lidShell = kit.mesh('record-player-raised-lid-shell', rounded(3.46, 2.42, 0.15, 0.15), cream, lidPivot);
  lidShell.position.set(0, 1.21, -0.02);
  lidShell.userData.part = 'lid-shell';
  const lidSideSpineGeometry = rounded(0.1, 2.18, 0.13, 0.035);
  [-1.61, 1.61].forEach((x, index) => {
    const spine = kit.mesh(`record-player-lid-side-spine-${index + 1}`, lidSideSpineGeometry, pink, lidPivot, false);
    spine.position.set(x, 1.21, 0.048);
    spine.userData.part = 'lid-side-spines';
  });
  const lidInset = kit.mesh('record-player-transparent-lid-panel', rounded(3.16, 2.12, 0.035, 0.1), lidMaterial, lidPivot, false);
  lidInset.position.set(0, 1.21, 0.075);
  lidInset.renderOrder = 5;
  lidInset.userData.part = 'lid-panel';
  const lidBorder = kit.mesh('record-player-lid-inner-border', rounded(3.24, 2.2, 0.04, 0.105), creamLight, lidPivot, false);
  lidBorder.position.set(0, 1.21, 0.052);
  lidBorder.scale.z = 0.98;
  lidBorder.userData.explodeWithParent = true;
  const latch = kit.mesh('record-player-top-lid-latch', rounded(0.38, 0.16, 0.12, 0.035), pink, lidPivot);
  latch.position.set(0, 2.34, 0.08);
  latch.userData.part = 'lid-latch';
  const latchInset = kit.mesh('record-player-lid-latch-inset', rounded(0.22, 0.055, 0.02, 0.012), pinkDark, lidPivot, false);
  latchInset.position.set(0, 2.3, 0.148);
  latchInset.userData.explodeWithParent = true;
  lidPivot.rotation.x = -0.16;

  const hingePositions = [-1.16, 1.16];
  hingePositions.forEach((x, index) => {
    const hinge = kit.mesh(`record-player-rear-hinge-${index + 1}`, rounded(0.32, 0.25, 0.13, 0.04), pink, bodyPivot);
    hinge.position.set(x, 0.37, -1.275);
    hinge.userData.part = 'hinge-pair';
    const pin = kit.mesh(`record-player-rear-hinge-pin-${index + 1}`, new THREE.CylinderGeometry(0.045, 0.045, 0.25, 12), metal, bodyPivot, false);
    pin.rotation.z = Math.PI * 0.5;
    pin.position.set(x, 0.37, -1.34);
    pin.userData.explodeWithParent = true;
  });

  const platterPivot = kit.pivot('record-player-platter-spin-pivot', bodyPivot);
  platterPivot.position.set(-0.35, 0.51, 0);
  platterPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('record-player-platter-axis-socket', platterPivot, [0, 0.18, 0]);
  const platter = kit.mesh('record-player-black-vinyl-platter', new THREE.CylinderGeometry(1.08, 1.08, 0.075, 12), vinyl, platterPivot);
  platter.position.y = 0.06;
  platter.userData.part = 'platter';
  const platterRim = kit.mesh('record-player-pink-platter-perimeter', new THREE.TorusGeometry(1.055, 0.075, 6, 12), pink, platterPivot, false);
  platterRim.rotation.x = Math.PI * 0.5;
  platterRim.position.y = 0.1;
  platterRim.userData.explodeWithParent = true;
  const recordLabel = kit.mesh('record-player-record-label-ring', new THREE.CylinderGeometry(0.38, 0.38, 0.018, 12), cavity, platterPivot, false);
  recordLabel.position.y = 0.102;
  recordLabel.userData.explodeWithParent = true;
  const labelRing = kit.mesh('record-player-record-label-rim', new THREE.TorusGeometry(0.31, 0.02, 5, 12), metal, platterPivot, false);
  labelRing.rotation.x = Math.PI * 0.5;
  labelRing.position.y = 0.116;
  labelRing.userData.explodeWithParent = true;
  const spindle = kit.mesh('record-player-center-spindle', new THREE.CylinderGeometry(0.035, 0.045, 0.22, 14), metal, platterPivot);
  spindle.position.y = 0.17;
  spindle.userData.part = 'spindle';
  [0.54, 0.72, 0.9].forEach((radius, index) => {
    const groove = kit.mesh(`record-player-vinyl-groove-${index + 1}`, new THREE.TorusGeometry(radius, 0.012, 4, 12), pinkDark, platterPivot, false);
    groove.rotation.x = Math.PI * 0.5;
    groove.position.y = 0.105;
    groove.userData.part = 'vinyl-grooves';
    groove.userData.explodeWithParent = true;
  });

  const tonearmPivot = kit.pivot('record-player-tonearm-pivot', bodyPivot);
  tonearmPivot.position.set(1.05, 0.55, -0.62);
  tonearmPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('record-player-tonearm-attachment-socket', tonearmPivot, [0, 0, 0]);
  const tonearmBase = kit.mesh('record-player-tonearm-base', new THREE.CylinderGeometry(0.22, 0.24, 0.16, 10), pinkDark, tonearmPivot);
  tonearmBase.position.y = 0.1;
  tonearmBase.userData.part = 'tonearm-base';
  const tonearmCuePivot = kit.pivot('record-player-tonearm-cue-pivot', tonearmPivot);
  tonearmCuePivot.position.set(0, 0.2, 0);
  tonearmCuePivot.userData.translationAxis = [0, 1, 0];
  tonearmCuePivot.userData.purpose = 'lift-and-lower-the-complete-tonearm-before-and-after-sweep';
  const counterweight = kit.mesh('record-player-tonearm-counterweight', new THREE.CylinderGeometry(0.105, 0.12, 0.22, 8), pink, tonearmCuePivot);
  counterweight.rotation.z = Math.PI * 0.5;
  counterweight.position.set(0.07, 0.055, -0.045);
  counterweight.userData.part = 'tonearm-counterweight';
  const armStart = new THREE.Vector3(0, 0, 0);
  const armMid = new THREE.Vector3(-0.12, 0.16, 0.08);
  const armEnd = new THREE.Vector3(-0.48, 0.14, 0.23);
  addCylinderBetween(kit, 'record-player-tonearm-rise', armStart, armMid, 0.067, cream, tonearmCuePivot, 8);
  addCylinderBetween(kit, 'record-player-tonearm-sweep', armMid, armEnd, 0.058, creamLight, tonearmCuePivot, 8);
  const cartridge = kit.mesh('record-player-pink-cartridge', rounded(0.31, 0.16, 0.21, 0.035), pink, tonearmCuePivot);
  cartridge.position.copy(armEnd).add(new THREE.Vector3(-0.09, -0.015, 0.01));
  cartridge.userData.part = 'cartridge';
  const stylus = kit.mesh('record-player-stylus-tip', new THREE.CylinderGeometry(0.018, 0.018, 0.13, 8), metal, tonearmCuePivot, false);
  stylus.position.copy(armEnd).add(new THREE.Vector3(-0.1, -0.1, 0.01));
  stylus.rotation.z = 0.12;
  stylus.userData.explodeWithParent = true;

  const controlPivot = kit.pivot('record-player-control-knob-pivot', bodyPivot);
  controlPivot.position.set(1.4, 0.52, 0.88);
  controlPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('record-player-control-socket', controlPivot, [0, 0.2, 0]);
  const knob = kit.mesh('record-player-speed-control-knob', new THREE.CylinderGeometry(0.19, 0.21, 0.13, 10), pink, controlPivot);
  knob.position.y = 0.11;
  knob.userData.part = 'control-knob';
  const knobIndex = kit.mesh('record-player-control-index-mark', rounded(0.035, 0.02, 0.1, 0.01), creamLight, controlPivot, false);
  knobIndex.position.set(0, 0.185, 0.1);
  knobIndex.userData.explodeWithParent = true;
  const indicator = kit.indicator([1.59, 1.03, 0.91], 0.032);
  indicator.name = 'record-player-power-status-indicator';

  const handlePivot = kit.pivot('record-player-rear-handle-pivot', bodyPivot);
  handlePivot.position.set(0, -0.02, -1.255);
  kit.socket('record-player-handle-attachment-socket', handlePivot, [0, 0.28, 0]);
  const handleMounts = [-0.4, 0.4];
  handleMounts.forEach((x, index) => {
    const mount = kit.mesh(`record-player-handle-mount-${index + 1}`, rounded(0.26, 0.3, 0.12, 0.055), pink, handlePivot);
    mount.position.set(x, 0.18, -0.015);
    mount.userData.part = 'handle-mount';
  });
  const handleBar = kit.mesh('record-player-recessed-carry-handle', rounded(0.72, 0.18, 0.16, 0.075), creamLight, handlePivot);
  handleBar.position.set(0, 0.18, -0.08);
  handleBar.userData.part = 'carry-handle';
  const handleCavity = kit.mesh('record-player-handle-cavity', rounded(0.55, 0.06, 0.025, 0.02), cavity, handlePivot, false);
  handleCavity.position.set(0, 0.12, -0.17);
  handleCavity.userData.explodeWithParent = true;

  const ioPlate = kit.mesh('record-player-rear-io-plate', rounded(0.62, 0.26, 0.06, 0.06), pink, bodyPivot);
  ioPlate.position.set(1.08, -0.1, -1.275);
  ioPlate.userData.part = 'rear-io';
  const ioPositions = [-0.14, 0.14];
  ioPositions.forEach((x, index) => {
    const socket = kit.mesh(`record-player-rear-io-socket-${index + 1}`, new THREE.CylinderGeometry(0.075, 0.075, 0.04, 20), index === 0 ? pinkDark : cavity, bodyPivot, false);
    socket.rotation.x = Math.PI * 0.5;
    socket.position.set(1.08 + x, -0.1, -1.32);
    socket.userData.part = 'io-sockets';
  });
  kit.socket('record-player-power-connection-socket', bodyPivot, [0.94, -0.1, -1.36]);
  kit.socket('record-player-audio-connection-socket', bodyPivot, [1.22, -0.1, -1.36]);

  const motorPivot = kit.pivot('record-player-inferred-motor-pivot', bodyPivot);
  motorPivot.position.set(-0.18, 0.55, -0.35);
  motorPivot.visible = false;
  kit.socket('record-player-motor-drive-socket', motorPivot, [0, 0, 0]);

  ensureRecordPlayerPerformanceRig(kit.root, kit.materials);
  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'low cream rounded suitcase-like base shell with a pink lower seam rail and four independent feet',
        'raised cream lid with inset transparent panel, inner border and centered pink latch',
        'dark circular vinyl platter with pink perimeter, label ring and center spindle',
        'right-rear bent tonearm with independent pivot, pink cartridge and hanging stylus tip',
        'front cavity and eleven horizontal Sakura-pink speaker grille slats',
        'right top control knob with index mark and emissive power indicator',
        'rear two hinge blocks, recessed handle with mounts and dual circular I/O sockets',
      ],
      inferred: [
        'internal motor, belt, speaker cone, amplifier and wiring are hidden; motor pivot/socket is non-rendered',
        'hinge stop angle and exact rear connector identities are inferred from side/back silhouettes',
        'record groove relief and stylus contact are simplified for real-time performance',
      ],
    },
  );

  build.root.userData.referenceDimensions = {
    totalWidth: 3.55,
    totalHeight: 3.4,
    totalDepth: 2.85,
    baseWidth: 3.55,
    baseHeight: 0.78,
    baseDepth: 2.5,
    deckWidth: 3.38,
    deckDepth: 2.34,
    lidWidth: 3.46,
    lidClosedDepth: 2.42,
    lidOpenAngle: 0.16,
    platterDiameter: 2.06,
  };
  build.root.userData.activeDuration = 5.2;
  build.root.userData.externalPerformanceCue = {
    type: 'record-player-performance-owned-volumetrics',
    socket: 'record-player-motor-drive-socket',
    effectOwner: 'RecordPlayerPerformance',
    timelineOwner: 'ApplianceMechanics/RecordPlayerPerformance',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
    legacyGenericNotes: 'removed',
    beatWindow: [1.42, 4.58],
    avoidPlatterIntersection: true,
  };
  build.root.userData.recordPlayerPerformanceRig = {
    initialLidPose: 'open',
    initialLidRotationX: lidPivot.rotation.x,
    timelineOwner: 'ApplianceMechanics/RecordPlayerPerformance',
    effectOwner: 'RecordPlayerPerformance',
    mechanicalNodes: {
      wholeMachine: build.root.name,
      lid: lidPivot.name,
      platter: platterPivot.name,
      tonearmSweep: tonearmPivot.name,
      tonearmCue: tonearmCuePivot.name,
      controlKnob: controlPivot.name,
      indicator: indicator.name,
    },
    effectGeometry: {
      wave: 'closed-irregular-tube',
      notes: 'beveled-extrusion',
      particles: 'volumetric-only',
      forbidden: ['PlaneGeometry', 'Sprite', 'Line'],
    },
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  };
  build.root.userData.sculptRuntime.colliders = [
    { id: 'record-player-body', type: 'box', node: 'record-player-body-pivot' },
    { id: 'record-player-lid', type: 'box', node: 'record-player-lid-hinge-pivot' },
    { id: 'record-player-platter', type: 'cylinder', node: 'record-player-platter-spin-pivot', trigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    ['record-player-rounded-body-shell', 'record-player-top-deck'],
    ['record-player-raised-lid-shell', 'record-player-transparent-lid-panel', 'record-player-lid-inner-border'],
    ['record-player-speaker-grille-panel', 'record-player-speaker-grille-slat-1'],
    ['record-player-black-vinyl-platter', 'record-player-pink-platter-perimeter'],
  ];
  build.root.traverse((object) => {
    if (object.name.startsWith('record-player-performance-')) {
      build.root.userData.sculptRuntime.nodes[object.name] = object;
    }
  });
  build.root.userData.outlineContract = {
    main: 0.0048,
    structure: 0.0041,
    detail: 0.0033,
    variation: 0.18,
    stable: true,
    style: 'SAKURA low-poly three-band ink; transparent lid and volumetric music effects excluded',
  };
  build.root.userData.recordPlayerV2 = {
    geometryLanguage: 'faceted-sakura-suitcase-turntable',
    referenceStatus: 'conditional-fallback-v1-three-view-not-gpt-image-2',
    frozenRuntime: [
      'record-player-body-pivot',
      'record-player-lid-hinge-pivot',
      'record-player-platter-spin-pivot',
      'record-player-tonearm-pivot',
      'record-player-tonearm-cue-pivot',
      'record-player-control-knob-pivot',
      'record-player-motor-drive-socket',
    ],
    effectCenter: [-0.35, 1.2, 0],
    envelopePolicy: 'archived v1 bounds, ground and runtime anchors are authoritative',
  };
  applyRecordPlayerOutlineHierarchy(build.root);
  return build;
}
