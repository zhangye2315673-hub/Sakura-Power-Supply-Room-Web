import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import { setHullOutlineStyle } from '../../style/outline';

const V2_REFERENCE_PATH = 'references/intake-v2/toaster/views/front.png';

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) * (Math.PI * 2 / 10000);
}

function applyToasterOutlineHierarchy(root: THREE.Object3D): void {
  const mainSilhouette = /outer-shell|base-band|slot-rim/;
  const fineDetail = /slider-accent|knob-index|dial-tick|status-indicator|rear-vent|cable-recess|foot|slot-divider|heater-bar/;
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
    object.userData.outlineStable = true;
  });
}

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_19 (6).png';
const ACTIVE_DURATION = 5.2;
const SHELL_FRONT = 0.65;
const CARRIAGE_IDLE_Y = 1.19;
const CARRIAGE_POP_TRAVEL = 0.86;
const LEVER_IDLE_Y = 1.29;
const CONTROL_X = -0.24;

function colorShift(color: THREE.ColorRepresentation, lightness: number, saturation = 0): number {
  return new THREE.Color(color).offsetHSL(0, saturation, lightness).getHex();
}

function taperedShellGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-1.01, 0.24);
  shape.lineTo(-1.09, 0.31);
  shape.lineTo(-1.02, 1.37);
  shape.lineTo(-0.93, 1.55);
  shape.lineTo(-0.72, 1.64);
  shape.lineTo(0.72, 1.64);
  shape.lineTo(0.93, 1.55);
  shape.lineTo(1.02, 1.37);
  shape.lineTo(1.09, 0.31);
  shape.lineTo(1.01, 0.24);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.18,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.075,
    bevelThickness: 0.075,
    curveSegments: 2,
    steps: 1,
  });
  geometry.translate(0, 0, -0.59);
  toCreasedNormals(geometry, Math.PI / 3);
  return geometry;
}

/**
 * Procedural reconstruction of the Sakura two-slot toaster reference.
 *
 * Local frame: +Y up and +Z is the control/front side. The shell, controls,
 * toast carriage and rear service details remain separate runtime components.
 */
export function createToasterModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const shellMaterial = kit.material(0xf1e9d9, { tint: 0x71667f });
  const shellLightMaterial = kit.material(0xfbf4e8, { tint: 0x766a82 });
  const accentMaterial = kit.material(colorShift(accent, 0.035, -0.04));
  const accentDarkMaterial = kit.material(colorShift(accent, -0.11, -0.02));
  const cavityMaterial = kit.material(0x302b3a, { tint: 0x5f536e });
  const metalMaterial = kit.material(0xaeb4bb, { tint: 0x6d6477 });
  const rubberMaterial = kit.material(0x55515e, { tint: 0x51475f });
  const heaterMaterial = kit.material(0x4f2934, {
    tint: 0x5d4b69,
    emissive: 0xff6c35,
  });

  const shell = kit.mesh('toaster-outer-shell', taperedShellGeometry(), shellMaterial);
  shell.position.y = 0.03;

  const baseBand = kit.mesh(
    'toaster-base-band',
    new RoundedBoxGeometry(2.28, 0.22, 1.25, 4, 0.085),
    accentMaterial,
  );
  baseBand.position.set(0, 0.24, 0);

  const lowerSeam = kit.mesh(
    'toaster-shell-lower-seam',
    new RoundedBoxGeometry(2.13, 0.028, 1.205, 2, 0.012),
    accentDarkMaterial,
    kit.root,
    false,
  );
  lowerSeam.position.set(0, 0.365, 0);

  // The slot is a three-layer recessed assembly rather than a painted stripe.
  const slotRim = kit.mesh(
    'toaster-slot-rim',
    new RoundedBoxGeometry(1.72, 0.105, 0.46, 2, 0.075),
    metalMaterial,
  );
  slotRim.position.set(0, 1.685, 0.01);
  const slotCavity = kit.mesh(
    'toaster-slot-cavity',
    new RoundedBoxGeometry(1.48, 0.09, 0.28, 2, 0.045),
    cavityMaterial,
  );
  slotCavity.position.set(0, 1.722, 0.01);
  const slotGlow = kit.mesh(
    'toaster-slot-glow',
    new RoundedBoxGeometry(1.28, 0.028, 0.13, 1, 0.025),
    heaterMaterial,
    kit.root,
    false,
  );
  slotGlow.position.set(0, 1.767, 0.01);
  const slotDivider = kit.mesh(
    'toaster-slot-divider',
    new RoundedBoxGeometry(0.035, 0.032, 0.24, 1, 0.01),
    metalMaterial,
    kit.root,
    false,
  );
  slotDivider.position.set(0, 1.77, 0.01);

  const carriage = kit.pivot('toaster-toast-carriage');
  carriage.position.set(0, CARRIAGE_IDLE_Y, 0.02);
  carriage.userData.motionAxis = [0, 1, 0];
  carriage.userData.range = [CARRIAGE_IDLE_Y, CARRIAGE_IDLE_Y + CARRIAGE_POP_TRAVEL];
  kit.socket('toaster-carriage-socket', carriage, [0, 0, 0]);
  kit.socket('toaster-external-toast-launch-socket', kit.root, [0, 1.78, 0.02]);

  // Front lever system: deep track, an independent carriage-linked slider,
  // and a projecting handle give the control its identity at gameplay scale.
  const leverTrack = kit.mesh(
    'toaster-lever-track',
    new RoundedBoxGeometry(0.105, 0.68, 0.035, 3, 0.045),
    cavityMaterial,
  );
  leverTrack.position.set(CONTROL_X, 1.02, SHELL_FRONT + 0.102);
  const leverPivot = kit.pivot('toaster-lever-pivot');
  leverPivot.position.set(CONTROL_X, LEVER_IDLE_Y, SHELL_FRONT + 0.15);
  leverPivot.userData.motionAxis = [0, 1, 0];
  const slider = kit.mesh(
    'toaster-lever-slider',
    new RoundedBoxGeometry(0.42, 0.18, 0.15, 3, 0.065),
    shellLightMaterial,
    leverPivot,
  );
  slider.position.z = 0.015;
  const sliderBand = kit.mesh(
    'toaster-lever-slider-accent',
    new RoundedBoxGeometry(0.35, 0.055, 0.17, 2, 0.025),
    accentMaterial,
    leverPivot,
  );
  sliderBand.position.set(0, -0.025, 0.075);
  kit.socket('toaster-lever-handle-socket', leverPivot, [0, 0, 0.13]);

  const knobPivot = kit.pivot('toaster-browning-knob-pivot');
  knobPivot.position.set(CONTROL_X, 0.57, SHELL_FRONT + 0.135);
  knobPivot.userData.rotationAxis = [0, 0, 1];
  const knobBase = kit.mesh(
    'toaster-browning-knob-base',
    new THREE.CylinderGeometry(0.27, 0.27, 0.105, 12),
    accentDarkMaterial,
    knobPivot,
  );
  knobBase.rotation.x = Math.PI * 0.5;
  const knob = kit.mesh(
    'toaster-browning-knob',
    new THREE.CylinderGeometry(0.22, 0.235, 0.13, 12),
    shellLightMaterial,
    knobPivot,
  );
  knob.rotation.x = Math.PI * 0.5;
  knob.position.z = 0.055;
  const knobIndex = kit.mesh(
    'toaster-browning-knob-index',
    new RoundedBoxGeometry(0.025, 0.095, 0.018, 1, 0.008),
    cavityMaterial,
    knobPivot,
    false,
  );
  knobIndex.position.set(0, 0.07, 0.128);

  for (let index = 0; index < 9; index += 1) {
    const angle = THREE.MathUtils.lerp(-Math.PI * 0.72, Math.PI * 0.72, index / 8);
    const tick = kit.mesh(
      `toaster-dial-tick-${index + 1}`,
      new RoundedBoxGeometry(0.018, index % 4 === 0 ? 0.065 : 0.045, 0.018, 1, 0.007),
      cavityMaterial,
      kit.root,
      false,
    );
    tick.position.set(
      CONTROL_X + Math.sin(angle) * 0.31,
      0.57 + Math.cos(angle) * 0.31,
      SHELL_FRONT + 0.178,
    );
    tick.rotation.z = -angle;
  }
  kit.indicator([0.22, 0.56, SHELL_FRONT + 0.18], 0.042);

  // The side elevation shows two controls; both are separated from the shell.
  const sideLever = kit.mesh(
    'toaster-side-upper-control',
    new RoundedBoxGeometry(0.19, 0.16, 0.31, 3, 0.055),
    shellMaterial,
  );
  sideLever.position.set(1.13, 0.93, 0.12);
  sideLever.rotation.z = 0.02;
  const sideButton = kit.mesh(
    'toaster-side-lower-control',
    new RoundedBoxGeometry(0.15, 0.22, 0.25, 3, 0.05),
    accentMaterial,
  );
  sideButton.position.set(1.12, 0.58, 0.09);

  // Rear details are fully modeled because they remain visible in the free-orbit gallery.
  const rearPanel = kit.mesh(
    'toaster-rear-panel',
    new RoundedBoxGeometry(1.08, 0.52, 0.025, 3, 0.1),
    shellMaterial,
  );
  rearPanel.position.set(0.15, 0.94, -SHELL_FRONT - 0.102);
  for (let index = 0; index < 3; index += 1) {
    const vent = kit.mesh(
      `toaster-rear-vent-${index + 1}`,
      new RoundedBoxGeometry(0.54, 0.045, 0.025, 2, 0.02),
      cavityMaterial,
      kit.root,
      false,
    );
    vent.position.set(0.25, 1.05 - index * 0.13, -SHELL_FRONT - 0.131);
  }
  const cableKeeper = kit.mesh(
    'toaster-rear-cable-keeper',
    new RoundedBoxGeometry(0.56, 0.23, 0.055, 3, 0.065),
    shellLightMaterial,
  );
  cableKeeper.position.set(0, 0.36, -SHELL_FRONT - 0.14);
  for (const x of [-0.17, 0.17]) {
    const recessLeg = kit.mesh(
      `toaster-cable-recess-${x < 0 ? 'left' : 'right'}`,
      new RoundedBoxGeometry(0.07, 0.17, 0.035, 2, 0.025),
      cavityMaterial,
      kit.root,
      false,
    );
    recessLeg.position.set(x, 0.36, -SHELL_FRONT - 0.173);
  }
  const cableRecessTop = kit.mesh(
    'toaster-cable-recess-top',
    new RoundedBoxGeometry(0.38, 0.055, 0.035, 2, 0.02),
    cavityMaterial,
    kit.root,
    false,
  );
  cableRecessTop.position.set(0, 0.445, -SHELL_FRONT - 0.173);
  kit.socket('toaster-power-cable-socket', cableKeeper, [0, -0.05, -0.07]);

  for (const [x, z] of [[-0.77, -0.42], [0.77, -0.42], [-0.77, 0.42], [0.77, 0.42]] as const) {
    const foot = kit.mesh(
      `toaster-foot-${x < 0 ? 'left' : 'right'}-${z < 0 ? 'rear' : 'front'}`,
      new RoundedBoxGeometry(0.28, 0.09, 0.29, 2, 0.045),
      rubberMaterial,
      kit.root,
      false,
    );
    foot.position.set(x, 0.055, z);
  }

  const result = kit.finish(
    {
      referencePath: options.referencePath ?? V2_REFERENCE_PATH,
      reconstructed: [
        'eight-plane lower-wide tapered shell with stepped Sakura-pink base band',
        'deep four-layer recessed top slot with faceted metal rim, cavity, heater and centre divider',
        'front vertical lever track, projecting slider and concentric browning dial',
        'nine radial dial ticks and separate status lamp',
        'two projecting side controls',
        'rear panel, three vents, cable keeper recess and four feet',
        'independent single-slice toast carriage with named pivot and sockets',
      ],
      inferred: [
        'heater coils and internal latch are hidden in the reference and intentionally omitted',
        'toast slice thickness, carriage depth and lift travel are inferred for the requested powered animation',
        'rear cable keeper depth and underside foot pads are inferred from the orthographic rear/contact views',
      ],
    },
  );

  result.root.userData.referenceDimensions = {
    totalWidth: 2.28,
    totalHeight: 1.78,
    totalDepth: 1.32,
    shellTopWidth: 2.04,
    shellBaseWidth: 2.22,
    slotWidth: 1.62,
  };
  result.root.userData.activeDuration = ACTIVE_DURATION;
  result.root.userData.externalPerformance = {
    type: 'ballistic-toast-launch',
    socket: 'toaster-external-toast-launch-socket',
    launchTime: 3.72,
    initialVelocity: [0.5, 5.8, 3.9],
    gravity: [0, -7.9, 0],
    angularVelocity: [4.8, -2.1, 7.2],
    peakHoldSeconds: 0.16,
    recycleAfterScreenExit: true,
  };
  result.root.userData.legacyReferencePath = REFERENCE_PATH;
  applyToasterOutlineHierarchy(result.root);
  result.root.userData.sculptRuntime.colliders = [
    { id: 'toaster-body-collider', type: 'box', node: 'toaster-outer-shell' },
    { id: 'toaster-control-collider', type: 'compound', node: 'toaster-lever-pivot' },
  ];
  result.root.userData.sculptRuntime.destructionGroups = [
    { id: 'toaster-shell-group', nodes: ['toaster-outer-shell', 'toaster-base-band'] },
    { id: 'toaster-slot-group', nodes: ['toaster-slot-rim', 'toaster-slot-cavity'] },
    { id: 'toaster-control-group', nodes: ['toaster-lever-pivot', 'toaster-browning-knob-pivot'] },
    { id: 'toaster-rear-group', nodes: ['toaster-rear-panel', 'toaster-rear-cable-keeper'] },
  ];
  return result;
}
