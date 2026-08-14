import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

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
  shape.quadraticCurveTo(-1.09, 0.24, -1.11, 0.36);
  shape.lineTo(-1.02, 1.37);
  shape.quadraticCurveTo(-0.99, 1.58, -0.77, 1.63);
  shape.quadraticCurveTo(0, 1.70, 0.77, 1.63);
  shape.quadraticCurveTo(0.99, 1.58, 1.02, 1.37);
  shape.lineTo(1.11, 0.36);
  shape.quadraticCurveTo(1.09, 0.24, 1.01, 0.24);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.18,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.075,
    bevelThickness: 0.075,
    curveSegments: 18,
    steps: 1,
  });
  geometry.translate(0, 0, -0.59);
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
    new RoundedBoxGeometry(1.62, 0.075, 0.36, 4, 0.085),
    metalMaterial,
  );
  slotRim.position.set(0, 1.69, 0.01);
  const slotCavity = kit.mesh(
    'toaster-slot-cavity',
    new RoundedBoxGeometry(1.42, 0.083, 0.20, 3, 0.055),
    cavityMaterial,
  );
  slotCavity.position.set(0, 1.722, 0.01);
  const slotGlow = kit.mesh(
    'toaster-slot-glow',
    new RoundedBoxGeometry(1.25, 0.028, 0.105, 2, 0.032),
    heaterMaterial,
    kit.root,
    false,
  );
  slotGlow.position.set(0, 1.767, 0.01);

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
    new THREE.CylinderGeometry(0.25, 0.25, 0.105, 22),
    accentDarkMaterial,
    knobPivot,
  );
  knobBase.rotation.x = Math.PI * 0.5;
  const knob = kit.mesh(
    'toaster-browning-knob',
    new THREE.CylinderGeometry(0.21, 0.22, 0.13, 22),
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
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'rounded lower-wide tapered shell and stepped base band',
        'three-layer recessed top slot with metal rim',
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
  return result;
}
