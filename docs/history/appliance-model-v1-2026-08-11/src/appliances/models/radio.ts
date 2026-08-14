import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_17 (3).png';
const ACTIVE_DURATION = 5.2;
const ANTENNA_REST_ANGLE = 1.12;

function shiftedAccent(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function addRoundedBar(
  kit: ApplianceModelKit,
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  parent: THREE.Object3D,
): THREE.Mesh {
  const mesh = kit.mesh(
    name,
    new RoundedBoxGeometry(width, height, depth, 2, Math.min(height * 0.48, 0.022)),
    material,
    parent,
    false,
  );
  mesh.userData.explodeWithParent = true;
  return mesh;
}

/**
 * Procedural reconstruction of the supplied three-view tabletop radio.
 *
 * Local frame: +Y up, +Z front, floor at Y=0. The radio is a compound
 * assembly: shell, inset front/rear panels, speaker system, control cluster,
 * and a separate hinged telescopic antenna. Hidden electronics are omitted.
 */
export function createRadioModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = shiftedAccent(options.accent, 0.16, -0.1);
  const accentMid = shiftedAccent(options.accent, 0.075, -0.05);
  const accentDark = shiftedAccent(options.accent, -0.08, -0.02);

  const shellMaterial = kit.material(0xf1e9d9, { tint: 0x72677b });
  const shellHighlightMaterial = kit.material(0xf8f0df, { tint: 0x786b80 });
  const accentMaterial = kit.material(accentMid, { tint: 0x6b5d73 });
  const accentLightMaterial = kit.material(accentLight, { tint: 0x766477 });
  const accentDarkMaterial = kit.material(accentDark, { tint: 0x5f5268 });
  const cavityMaterial = kit.material(0x373746, { tint: 0x302b3a });
  const screenMaterial = kit.material(0x515667, {
    tint: 0x393443,
    emissive: 0x9aaac0,
  });
  const glassMaterial = kit.material(0xb9c2ca, {
    tint: 0x777184,
    transparent: true,
    opacity: 0.32,
  });
  const metalMaterial = kit.material(0xb8bdc3, { tint: 0x5d5867 });
  const darkMetalMaterial = kit.material(0x727683, { tint: 0x4e4857 });
  const rubberMaterial = kit.material(0x5c5964, { tint: 0x46414e });

  const shell = kit.mesh(
    'radio-outer-shell',
    new RoundedBoxGeometry(2.8, 1.62, 0.8, 4, 0.2),
    shellMaterial,
  );
  shell.position.y = 0.9;

  // A shallow inner lip keeps the front panel visibly nested inside the shell.
  const frontLip = kit.mesh(
    'radio-front-panel-lip',
    new RoundedBoxGeometry(2.53, 1.32, 0.075, 3, 0.14),
    shellHighlightMaterial,
  );
  frontLip.position.set(0, 0.91, 0.435);

  const frontPanel = kit.mesh(
    'radio-front-panel',
    new RoundedBoxGeometry(2.42, 1.22, 0.065, 3, 0.12),
    accentMaterial,
  );
  frontPanel.position.set(0, 0.91, 0.48);

  // Speaker module: separate recessed cavity, pulsing diaphragm, raised frame,
  // and sixteen true geometry slats rather than a flat texture.
  const speakerFrame = kit.mesh(
    'radio-speaker-frame',
    new RoundedBoxGeometry(1.2, 0.98, 0.075, 3, 0.12),
    shellHighlightMaterial,
  );
  speakerFrame.position.set(-0.65, 0.92, 0.535);

  const speakerCavity = kit.mesh(
    'radio-speaker-cavity',
    new RoundedBoxGeometry(1.08, 0.86, 0.055, 3, 0.085),
    cavityMaterial,
  );
  speakerCavity.position.set(-0.65, 0.92, 0.582);

  const speakerPivot = kit.pivot('radio-speaker-diaphragm-pivot');
  speakerPivot.position.set(-0.65, 0.92, 0.595);
  const speakerSocket = kit.socket('radio-speaker-socket', speakerPivot, [0, 0, 0.13]);
  speakerSocket.userData.direction = [0, 0, 1];
  speakerSocket.userData.emissionRule = 'front-only-no-body-crossing';
  const speakerDiaphragm = kit.mesh(
    'radio-speaker-diaphragm',
    new RoundedBoxGeometry(0.98, 0.76, 0.025, 2, 0.07),
    accentDarkMaterial,
    speakerPivot,
    false,
  );
  speakerDiaphragm.userData.explodeWithParent = true;

  for (let index = 0; index < 16; index += 1) {
    const slat = addRoundedBar(
      kit,
      `radio-speaker-slat-${index + 1}`,
      1.03,
      0.035,
      0.04,
      shellHighlightMaterial,
      kit.root,
    );
    slat.position.set(-0.65, 0.565 + index * 0.047, 0.635);
  }

  // Frequency display: a framed dark dial face, subdued glass, repeated ticks,
  // and a movable Sakura-colored tuning cursor.
  const displayFrame = kit.mesh(
    'radio-frequency-frame',
    new RoundedBoxGeometry(0.86, 0.5, 0.085, 3, 0.105),
    shellHighlightMaterial,
  );
  displayFrame.position.set(0.63, 1.23, 0.545);

  const displayFace = kit.mesh(
    'radio-frequency-face',
    new RoundedBoxGeometry(0.73, 0.37, 0.045, 2, 0.072),
    screenMaterial,
  );
  displayFace.position.set(0.63, 1.23, 0.602);

  for (let index = 0; index < 9; index += 1) {
    const tick = addRoundedBar(
      kit,
      `radio-frequency-tick-${index + 1}`,
      0.012,
      index % 2 === 0 ? 0.105 : 0.065,
      0.018,
      shellHighlightMaterial,
      kit.root,
    );
    tick.position.set(0.34 + index * 0.073, 1.23, 0.636);
  }

  const pointerPivot = kit.pivot('radio-frequency-pointer-pivot');
  pointerPivot.position.set(0.63, 1.23, 0.655);
  const pointerVertical = addRoundedBar(
    kit,
    'radio-frequency-pointer-vertical',
    0.018,
    0.28,
    0.018,
    accentLightMaterial,
    pointerPivot,
  );
  const pointerHorizontal = addRoundedBar(
    kit,
    'radio-frequency-pointer-horizontal',
    0.62,
    0.018,
    0.018,
    accentLightMaterial,
    pointerPivot,
  );
  pointerVertical.position.set(0, 0, 0);
  pointerHorizontal.position.set(0, 0, -0.002);

  const glass = kit.mesh(
    'radio-frequency-glass',
    new RoundedBoxGeometry(0.74, 0.38, 0.02, 2, 0.07),
    glassMaterial,
    kit.root,
    false,
  );
  glass.position.set(0.63, 1.23, 0.681);
  glass.userData.explodeWithParent = true;

  // Dual controls retain the reference's unequal hierarchy. Both are real
  // pivots so a viewer or future interaction system can turn them directly.
  const volumePivot = kit.pivot('radio-volume-knob-pivot');
  volumePivot.position.set(0.36, 0.665, 0.57);
  volumePivot.userData.rotationAxis = [0, 0, 1];
  const volumeRing = kit.mesh(
    'radio-volume-knob-ring',
    new THREE.CylinderGeometry(0.175, 0.175, 0.07, 20),
    accentDarkMaterial,
    volumePivot,
  );
  volumeRing.rotation.x = Math.PI * 0.5;
  const volumeKnob = kit.mesh(
    'radio-volume-knob',
    new THREE.CylinderGeometry(0.145, 0.145, 0.09, 20),
    shellHighlightMaterial,
    volumePivot,
  );
  volumeKnob.rotation.x = Math.PI * 0.5;
  volumeKnob.position.z = 0.055;
  const volumeIndex = addRoundedBar(
    kit,
    'radio-volume-index',
    0.018,
    0.075,
    0.014,
    cavityMaterial,
    volumePivot,
  );
  volumeIndex.position.set(0, 0.055, 0.11);

  const tuningPivot = kit.pivot('radio-tuning-knob-pivot');
  tuningPivot.position.set(0.92, 0.66, 0.57);
  tuningPivot.userData.rotationAxis = [0, 0, 1];
  const tuningOuterRing = kit.mesh(
    'radio-tuning-knob-outer-ring',
    new THREE.CylinderGeometry(0.29, 0.29, 0.075, 24),
    accentDarkMaterial,
    tuningPivot,
  );
  tuningOuterRing.rotation.x = Math.PI * 0.5;
  const tuningInnerRing = kit.mesh(
    'radio-tuning-knob-inner-ring',
    new THREE.CylinderGeometry(0.255, 0.255, 0.095, 24),
    shellHighlightMaterial,
    tuningPivot,
  );
  tuningInnerRing.rotation.x = Math.PI * 0.5;
  tuningInnerRing.position.z = 0.055;
  const tuningKnob = kit.mesh(
    'radio-tuning-knob',
    new THREE.CylinderGeometry(0.205, 0.205, 0.11, 24),
    accentLightMaterial,
    tuningPivot,
  );
  tuningKnob.rotation.x = Math.PI * 0.5;
  tuningKnob.position.z = 0.115;

  const tinyIndicator = kit.mesh(
    'radio-tuning-ready-dot',
    new THREE.SphereGeometry(0.022, 8, 6),
    darkMetalMaterial,
    kit.root,
    false,
  );
  tinyIndicator.position.set(0.35, 0.905, 0.655);
  tinyIndicator.userData.explodeWithParent = true;
  kit.indicator([0.61, 0.415, 0.665], 0.037);

  // Rear cover is intentionally complete even though it is not seen in the
  // default game angle: the inspection viewer can orbit to compare it.
  const rearPanel = kit.mesh(
    'radio-rear-access-panel',
    new RoundedBoxGeometry(2.18, 0.92, 0.04, 3, 0.1),
    shellHighlightMaterial,
  );
  rearPanel.position.set(0, 0.88, -0.425);

  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const vent = addRoundedBar(
        kit,
        `radio-rear-vent-r${row + 1}-c${column + 1}`,
        0.22,
        0.035,
        0.022,
        darkMetalMaterial,
        kit.root,
      );
      vent.position.set(-0.45 + column * 0.3, 1.04 - row * 0.135, -0.457);
    }
  }

  for (const x of [-0.92, 0.92]) {
    const screw = kit.mesh(
      `radio-rear-fastener-${x < 0 ? 'left' : 'right'}`,
      new THREE.CylinderGeometry(0.048, 0.048, 0.026, 12),
      metalMaterial,
      kit.root,
      false,
    );
    screw.rotation.x = Math.PI * 0.5;
    screw.position.set(x, 0.47, -0.46);
    screw.userData.explodeWithParent = true;
  }

  // Four separate pads preserve the slight air gap visible in both front and back views.
  for (const x of [-1.05, 1.05]) {
    for (const z of [-0.25, 0.25]) {
      const foot = kit.mesh(
        `radio-foot-${x < 0 ? 'left' : 'right'}-${z < 0 ? 'rear' : 'front'}`,
        new RoundedBoxGeometry(0.25, 0.12, 0.28, 2, 0.045),
        rubberMaterial,
        kit.root,
        false,
      );
      foot.position.set(x, 0.06, z);
    }
  }

  // Back-mounted hinge: bracket and axle stay on the shell, while all antenna
  // segments live below the hinge pivot and overlap slightly at their joints.
  const antennaBracket = kit.mesh(
    'radio-antenna-hinge-bracket',
    new RoundedBoxGeometry(0.18, 0.36, 0.095, 2, 0.055),
    darkMetalMaterial,
  );
  antennaBracket.position.set(0.99, 1.48, -0.42);

  const antennaHinge = kit.pivot('radio-antenna-hinge-pivot');
  antennaHinge.position.set(0.99, 1.57, -0.34);
  antennaHinge.rotation.z = ANTENNA_REST_ANGLE;
  antennaHinge.userData.hingeAxis = [0, 0, 1];
  antennaHinge.userData.rotationRange = [0, 1.42];
  kit.socket('radio-antenna-root-socket', antennaHinge, [0, 0, 0]);

  const hingeAxle = kit.mesh(
    'radio-antenna-hinge-axle',
    new THREE.CylinderGeometry(0.075, 0.075, 0.14, 14),
    metalMaterial,
    antennaHinge,
  );
  hingeAxle.rotation.x = Math.PI * 0.5;

  const segmentLengths = [1.35, 1.2, 1.05] as const;
  const segmentRadii = [0.042, 0.032, 0.023] as const;
  const storedStarts = [0.055, 0.34, 0.59] as const;
  const extendedStarts = [0.055, 1.28, 2.42] as const;
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const length = segmentLengths[index];
    const extensionPivot = kit.pivot(`radio-antenna-extension-pivot-${index + 1}`, antennaHinge);
    extensionPivot.position.y = storedStarts[index];
    extensionPivot.userData.restY = storedStarts[index];
    extensionPivot.userData.extendedY = extendedStarts[index];
    extensionPivot.userData.extensionAxis = [0, 1, 0];
    const segment = kit.mesh(
      `radio-antenna-segment-${index + 1}`,
      new THREE.CylinderGeometry(segmentRadii[index] * 0.86, segmentRadii[index], length, 10),
      index === 0 ? darkMetalMaterial : metalMaterial,
      extensionPivot,
    );
    segment.position.y = length * 0.5;
    segment.userData.explodeWithParent = true;
    if (index > 0) {
      const collar = kit.mesh(
        `radio-antenna-segment-${index + 1}-collar`,
        new THREE.CylinderGeometry(segmentRadii[index] * 1.22, segmentRadii[index] * 1.28, 0.065, 10),
        darkMetalMaterial,
        extensionPivot,
      );
      collar.position.y = 0.0325;
      collar.userData.explodeWithParent = true;
    }
  }
  const tipExtensionPivot = kit.pivot('radio-antenna-tip-extension-pivot', antennaHinge);
  // The terminal knob is a cap, not a separately floating telescopic part.
  // Start it on the highest stored section and let the shared mechanics keep
  // it on the current highest section throughout extension and retraction.
  tipExtensionPivot.position.y = Math.max(
    ...storedStarts.map((start, index) => start + segmentLengths[index]),
  );
  tipExtensionPivot.userData.tracksHighestAntennaSection = true;
  tipExtensionPivot.userData.trackedSections = segmentLengths.map((length, index) => ({
    pivot: `radio-antenna-extension-pivot-${index + 1}`,
    length,
  }));
  const antennaCap = kit.mesh(
    'radio-antenna-tip-cap',
    new THREE.SphereGeometry(0.082, 12, 8),
    darkMetalMaterial,
    tipExtensionPivot,
  );
  antennaCap.position.y = 0.09;
  antennaCap.scale.y = 1.08;
  antennaCap.userData.persistentAntennaTip = true;
  antennaCap.userData.explodeWithParent = true;

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'wide rounded cream outer shell with inset Sakura-colored front panel',
        'separate speaker cavity, raised frame and sixteen horizontal grille slats',
        'beveled frequency window with repeated ticks, glass face and crosshair cursor',
        'unequal volume and tuning knobs with concentric layered rims',
        'rear recessed service panel, four-by-four vent array and two fasteners',
        'four low rounded feet',
        'three nested telescopic antenna segments with independent extension pivots, collars and a hinged tip',
      ],
      inferred: [
        'speaker diaphragm depth and motion are inferred because the grille hides the cone',
        'internal tuning mechanism, electronics and acoustic chamber are not reconstructed',
        'underside fasteners and battery compartment are not visible and the floor shell is closed',
        'rear access-panel thickness and hinge construction are reasonable structural inferences',
      ],
    },
  );
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.radioRig = {
    qualityContract: 'docs/sculpt-specs/radio/quality-contract.md',
    antenna: {
      restAngle: ANTENNA_REST_ANGLE,
      activeAngle: 0.035,
      extensionPivots: [
        'radio-antenna-extension-pivot-2',
        'radio-antenna-extension-pivot-3',
      ],
      terminalCap: 'radio-antenna-tip-extension-pivot',
      terminalRule: 'always-on-highest-section-top',
    },
    speakerEmitter: {
      socket: 'radio-speaker-socket',
      localDirection: [0, 0, 1],
      rule: 'front-only-no-body-crossing',
    },
  };
  return build;
}
