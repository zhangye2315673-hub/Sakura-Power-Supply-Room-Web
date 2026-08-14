import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import {
  PRINTER_PAPER_PROFILES,
  PRINTER_PAPER_STOP_END,
} from '../performance/PrinterPaperProfiles';

const REFERENCE_PATH = 'E:/AI/codexAI/sakula/arrow-cube/references/intake/printer/front.png';
const ACTIVE_DURATION = PRINTER_PAPER_STOP_END;
const PAPER_WIDTH = 1.72;
const PAPER_LENGTH = PAPER_WIDTH * Math.SQRT2 * 0.5;
const PAPER_THICKNESS = 0.009;
const PERFORMANCE_PAGE_COUNT = PRINTER_PAPER_PROFILES.length;

function rounded(
  width: number,
  height: number,
  depth: number,
  radius: number,
  segments = 4,
): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, segments, radius);
}

function setPart(mesh: THREE.Mesh, part: string, relief = false): void {
  mesh.userData.part = part;
  if (relief) mesh.userData.explodeWithParent = true;
}

/**
 * A clean, closed A4 sheet. It is deliberately not PlaneGeometry: duplicated
 * top/bottom skins and four edge walls preserve a very thin paper volume. The
 * runtime keeps these vertices in their exact rest pose so the printed sheet
 * stays smooth and uncreased throughout the whole flight.
 */
function cleanPaperGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(
    PAPER_WIDTH,
    PAPER_THICKNESS,
    PAPER_LENGTH,
    1,
    1,
    1,
  );
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.performanceProp = 'clean-flat-volumetric-a4-paper';
  geometry.userData.form = 'clean-uncreased-closed-thin-sheet';
  geometry.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
  return geometry;
}

/**
 * Procedural reconstruction of the supplied three-view Sakura compact printer.
 *
 * Local frame: +Y up, +Z faces the output tray, floor at Y=0. The enclosure,
 * input support, output path, controls and rear inlet are independent runtime
 * parts. Hidden ink cartridges and the internal printhead are not fabricated.
 */
export function createPrinterModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const pink = accent.clone().offsetHSL(0, -0.035, 0.055).getHex();
  const pinkLight = accent.clone().offsetHSL(0, -0.07, 0.13).getHex();
  const pinkDark = accent.clone().offsetHSL(0, 0.015, -0.12).getHex();

  const cream = kit.material(0xf6edde, { tint: 0x8c7b82 });
  const creamLight = kit.material(0xfff8ea, { tint: 0xa39194 });
  const pinkShell = kit.material(pink, { tint: 0x8c6575 });
  const pinkEdge = kit.material(pinkLight, { tint: 0xa87982 });
  const pinkShadow = kit.material(pinkDark, { tint: 0x6f5362 });
  const cavity = kit.material(0x6e535b, { tint: 0x493d48 });
  const rollerRubber = kit.material(0x514950, { tint: 0x38343e });
  const paper = kit.material(0xfffcf2, { tint: 0xb2a1a0 });
  const inletDark = kit.material(0x38343a, { tint: 0x26242c });

  // Blockout: low, broad enclosure with the strongly projecting output tray.
  const bodyPivot = kit.pivot('printer-main-body-pivot');
  const body = kit.mesh(
    'printer-rounded-main-enclosure',
    rounded(3.4, 1.58, 2.38, 0.24, 5),
    cream,
    bodyPivot,
  );
  body.position.set(0, 0.94, 0);
  setPart(body, 'main-shell');

  const lowerBand = kit.mesh(
    'printer-continuous-pink-lower-band',
    rounded(3.27, 0.16, 2.4, 0.075, 3),
    pinkShell,
    bodyPivot,
  );
  lowerBand.position.set(0, 0.2, 0);
  setPart(lowerBand, 'rear-lower-band');

  const topLidPivot = kit.pivot('printer-top-access-lid-pivot', bodyPivot);
  topLidPivot.position.set(0, 1.73, 0.01);
  topLidPivot.userData.rotationAxis = [1, 0, 0];
  topLidPivot.userData.rotationRange = [0, 0.42];
  kit.socket('printer-top-lid-hinge-socket', topLidPivot, [0, 0, -0.88]);
  const topLid = kit.mesh(
    'printer-thin-rounded-top-lid',
    rounded(3.33, 0.16, 2.29, 0.15, 4),
    creamLight,
    topLidPivot,
  );
  topLid.position.y = -0.11;
  setPart(topLid, 'top-lid');
  const lidSeam = kit.mesh(
    'printer-front-top-lid-seam',
    rounded(3.12, 0.035, 0.035, 0.015, 2),
    pinkShadow,
    topLidPivot,
    false,
  );
  lidSeam.position.set(0, -0.18, 1.155);
  setPart(lidSeam, 'top-lid', true);
  const shellHighlightBand = kit.mesh(
    'printer-front-shell-highlight-band',
    rounded(3.08, 0.045, 0.035, 0.016, 2),
    creamLight,
    bodyPivot,
    false,
  );
  shellHighlightBand.position.set(0, 1.54, 1.195);
  setPart(shellHighlightBand, 'shell-highlight-band');

  // Rear input assembly. The pivot is at the observed lower support hinge.
  const paperSupportPivot = kit.pivot('printer-rear-paper-support-pivot');
  paperSupportPivot.position.set(0, 1.58, -0.82);
  paperSupportPivot.rotation.x = -0.17;
  paperSupportPivot.userData.rotationAxis = [1, 0, 0];
  paperSupportPivot.userData.rotationRange = [-0.17, 0.06];
  kit.socket('printer-paper-support-hinge-socket', paperSupportPivot, [0, 0, 0]);

  const supportStructure = kit.mesh(
    'printer-rear-paper-support-structural-plate',
    rounded(2.28, 0.86, 0.12, 0.14, 4),
    pinkEdge,
    paperSupportPivot,
  );
  supportStructure.position.set(0, 0.39, -0.08);
  setPart(supportStructure, 'rear-paper-support');

  const supportBackplate = kit.mesh(
    'printer-wide-pink-paper-support-backplate',
    rounded(2.16, 0.78, 0.18, 0.13, 4),
    pinkShell,
    paperSupportPivot,
  );
  supportBackplate.position.set(0, 0.37, 0);
  setPart(supportBackplate, 'rear-support-backplate');
  const supportGrip = kit.mesh(
    'printer-rear-support-lower-finger-recess',
    rounded(1.18, 0.11, 0.035, 0.05, 3),
    pinkEdge,
    paperSupportPivot,
    false,
  );
  supportGrip.position.set(0, 0.08, -0.105);
  setPart(supportGrip, 'rear-support-backplate', true);

  const guideGeometry = rounded(0.18, 1.05, 0.22, 0.08, 3);
  for (const [x, label] of [[-0.91, 'left'], [0.91, 'right']] as const) {
    const guide = kit.mesh(
      `printer-paper-guide-${label}`,
      guideGeometry,
      pinkEdge,
      paperSupportPivot,
    );
    guide.position.set(x, 0.58, 0.02);
    setPart(guide, 'paper-guide-array');
  }

  const inputPaperPivot = kit.pivot('printer-input-paper-pivot', paperSupportPivot);
  inputPaperPivot.position.set(0, 0.67, -0.01);
  kit.socket('printer-input-paper-seat-socket', inputPaperPivot, [0, -0.58, 0]);
  const inputPaper = kit.mesh(
    'printer-warm-white-input-paper',
    rounded(1.62, 1.15, 0.035, 0.025, 2),
    paper,
    inputPaperPivot,
    false,
  );
  setPart(inputPaper, 'input-paper');

  // Front output cavity is layered deeply enough to preserve the dark throat.
  const outputPivot = kit.pivot('printer-output-cavity-pivot');
  outputPivot.position.set(0, 0.77, 1.18);
  const cavityBack = kit.mesh(
    'printer-deep-output-cavity',
    rounded(2.28, 0.61, 0.18, 0.13, 4),
    cavity,
    outputPivot,
  );
  cavityBack.position.z = 0.035;
  setPart(cavityBack, 'output-cavity');
  const cavityFloor = kit.mesh(
    'printer-output-cavity-inner-floor',
    rounded(2.04, 0.12, 0.42, 0.045, 3),
    pinkShadow,
    outputPivot,
  );
  cavityFloor.position.set(0, -0.22, 0.16);
  setPart(cavityFloor, 'output-cavity', true);

  const lipTop = kit.mesh(
    'printer-output-inner-lip-top',
    rounded(2.45, 0.14, 0.14, 0.055, 3),
    pinkEdge,
    outputPivot,
  );
  lipTop.position.set(0, 0.32, 0.1);
  setPart(lipTop, 'output-cavity-inner-lip');
  for (const [x, label] of [[-1.16, 'left'], [1.16, 'right']] as const) {
    const side = kit.mesh(
      `printer-output-inner-lip-${label}`,
      rounded(0.15, 0.58, 0.14, 0.055, 3),
      pinkEdge,
      outputPivot,
    );
    side.position.set(x, 0.02, 0.1);
    setPart(side, 'output-cavity-inner-lip');
  }

  const rollerPivot = kit.pivot('printer-feed-roller-pivot', outputPivot);
  rollerPivot.position.set(0, 0.01, 0.22);
  rollerPivot.userData.rotationAxis = [1, 0, 0];
  kit.socket('printer-paper-exit-socket', outputPivot, [0, -0.02, 0.35]);
  const rollerGeometry = new THREE.CylinderGeometry(0.085, 0.085, 0.7, 14);
  for (const [x, label] of [[-0.55, 'left'], [0.55, 'right']] as const) {
    const roller = kit.mesh(
      `printer-feed-roller-${label}`,
      rollerGeometry,
      rollerRubber,
      rollerPivot,
      false,
    );
    roller.position.x = x;
    roller.rotation.z = Math.PI * 0.5;
    setPart(roller, 'feed-roller-array');
  }
  const carriagePivot = kit.pivot('printer-inferred-print-carriage-pivot', outputPivot);
  carriagePivot.position.set(0, 0.14, 0.075);
  const carriage = kit.mesh(
    'printer-inferred-printhead-carriage',
    rounded(0.56, 0.14, 0.08, 0.035, 3),
    pinkShadow,
    carriagePivot,
    false,
  );
  setPart(carriage, 'inferred-print-carriage');

  // Five printer-owned sheets share the same clean A4 geometry contract but
  // receive separate launch, loop and fall profiles in PrinterPerformance.
  const paperPerformanceRig = kit.pivot('printer-performance-paper-rig');
  paperPerformanceRig.userData.performanceOwner = 'PrinterPerformance';
  paperPerformanceRig.userData.sourceSocket = 'printer-paper-exit-socket';
  const pageStart = new THREE.Vector3(0, 0.75, 1.53 - PAPER_LENGTH * 0.5);
  for (let index = 0; index < PERFORMANCE_PAGE_COUNT; index += 1) {
    const pageNumber = index + 1;
    const profile = PRINTER_PAPER_PROFILES[index];
    const pagePivot = kit.pivot(`printer-performance-page-${pageNumber}`, paperPerformanceRig);
    pagePivot.position.copy(pageStart);
    pagePivot.visible = false;
    pagePivot.userData.performanceEffect = true;
    pagePivot.userData.paperProfileId = profile.id;
    pagePivot.userData.launchTime = profile.launchTime;
    pagePivot.userData.flightDuration = profile.flightDuration;
    pagePivot.userData.feedEnd = profile.feedEnd;
    pagePivot.userData.glideEnd = profile.glideEnd;
    pagePivot.userData.fallFirstStop = profile.fallFirstStop;
    const pageMesh = kit.mesh(
      `printer-clean-a4-output-page-${pageNumber}`,
      cleanPaperGeometry(),
      paper,
      pagePivot,
      false,
    );
    pageMesh.frustumCulled = false;
    // Thin moving paper casts a triangulated software-shadow silhouette that
    // reads like folded corners. Keep the sheet lit, but do not let it cast or
    // receive those hard model-review shadows.
    pageMesh.castShadow = false;
    pageMesh.receiveShadow = false;
    pageMesh.userData.performanceEffect = true;
    pageMesh.userData.performanceProp = 'clean-flat-volumetric-a4-paper';
    pageMesh.userData.paperWidth = PAPER_WIDTH;
    pageMesh.userData.paperLength = PAPER_LENGTH;
    pageMesh.userData.paperThickness = PAPER_THICKNESS;
    pageMesh.userData.aspectRatio = PAPER_LENGTH / PAPER_WIDTH;
    pageMesh.userData.sourceSocket = 'printer-paper-exit-socket';
    pageMesh.userData.lifecycle = 'continuous-feed-loop-slow-depth-fall-recycle';
    pageMesh.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
    setPart(pageMesh, 'performance-paper-stream');
  }

  // Output tray rotates about the lower lip and remains open in the reference pose.
  const trayPivot = kit.pivot('printer-output-tray-hinge-pivot');
  trayPivot.position.set(0, 0.39, 1.21);
  trayPivot.userData.rotationAxis = [1, 0, 0];
  trayPivot.userData.rotationRange = [-0.08, 1.18];
  kit.socket('printer-output-tray-hinge-socket', trayPivot, [0, 0, 0]);
  const tray = kit.mesh(
    'printer-projecting-pink-output-tray',
    rounded(2.22, 0.13, 0.86, 0.11, 4),
    pinkShell,
    trayPivot,
  );
  tray.position.set(0, -0.06, 0.42);
  setPart(tray, 'output-tray');
  const trayInset = kit.mesh(
    'printer-output-tray-cream-inset',
    rounded(1.66, 0.025, 0.54, 0.025, 2),
    pinkEdge,
    trayPivot,
    false,
  );
  trayInset.position.set(0, 0.015, 0.37);
  setPart(trayInset, 'output-tray', true);
  const trayGrip = kit.mesh(
    'printer-output-tray-front-grip',
    rounded(0.92, 0.045, 0.13, 0.035, 3),
    pinkEdge,
    trayPivot,
    false,
  );
  trayGrip.position.set(0, 0.02, 0.79);
  setPart(trayGrip, 'tray-handle');

  // Layered right-front control and independent status lens.
  const controlPivot = kit.pivot('printer-main-control-button-pivot');
  controlPivot.position.set(0.98, 1.31, 1.26);
  controlPivot.userData.translationAxis = [0, 0, -1];
  kit.socket('printer-main-control-socket', controlPivot, [0, 0, 0]);
  const controlOuter = kit.mesh(
    'printer-main-control-outer-ring',
    new THREE.CylinderGeometry(0.17, 0.17, 0.055, 24),
    pinkShadow,
    controlPivot,
  );
  controlOuter.rotation.x = Math.PI * 0.5;
  setPart(controlOuter, 'control-button');
  const controlFace = kit.mesh(
    'printer-main-control-pink-face',
    new THREE.CylinderGeometry(0.145, 0.145, 0.07, 24),
    pinkEdge,
    controlPivot,
  );
  controlFace.rotation.x = Math.PI * 0.5;
  controlFace.position.z = 0.025;
  setPart(controlFace, 'control-button', true);
  const controlHighlight = kit.mesh(
    'printer-main-control-highlight',
    new THREE.TorusGeometry(0.13, 0.012, 6, 24),
    creamLight,
    controlPivot,
    false,
  );
  controlHighlight.position.z = 0.065;
  setPart(controlHighlight, 'control-button', true);

  const status = kit.indicator([1.36, 1.31, 1.275], 0.058);
  status.name = 'printer-small-status-indicator';
  status.userData.part = 'status-indicator';

  // Rear details are directly constrained by the back view.
  const rearPivot = kit.pivot('printer-rear-service-pivot');
  rearPivot.position.set(0, 0, -1.205);
  const inletFrame = kit.mesh(
    'printer-rear-power-inlet-pink-frame',
    rounded(0.31, 0.31, 0.09, 0.055, 3),
    pinkShadow,
    rearPivot,
  );
  inletFrame.position.set(-1.24, 0.51, 0);
  setPart(inletFrame, 'rear-power-inlet');
  const inletCore = kit.mesh(
    'printer-rear-power-inlet-dark-core',
    rounded(0.19, 0.19, 0.07, 0.035, 3),
    inletDark,
    rearPivot,
    false,
  );
  inletCore.position.set(-1.24, 0.51, -0.075);
  setPart(inletCore, 'rear-power-inlet', true);
  const inletPin = kit.mesh(
    'printer-rear-power-inlet-center-pin',
    new THREE.SphereGeometry(0.035, 10, 7),
    creamLight,
    rearPivot,
    false,
  );
  inletPin.position.set(-1.24, 0.51, -0.12);
  setPart(inletPin, 'rear-power-inlet', true);
  kit.socket('printer-power-cable-socket', rearPivot, [-1.24, 0.51, -0.17]);

  const footGeometry = rounded(0.48, 0.12, 0.38, 0.055, 3);
  for (const [x, z, label] of [
    [-1.18, 0.88, 'front-left'],
    [1.18, 0.88, 'front-right'],
    [-1.18, -0.88, 'rear-left'],
    [1.18, -0.88, 'rear-right'],
  ] as const) {
    const foot = kit.mesh(`printer-foot-${label}`, footGeometry, pinkShadow, kit.root, false);
    foot.position.set(x, 0.09, z);
    setPart(foot, 'foot-array');
  }

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'wide low cream enclosure with large rounded corners, thin top lid and continuous lower pink band',
        'backward-leaning rear paper support with pink backplate, twin guides and warm-white input page',
        'deep dark output cavity, raised pink inner lip, projecting hinged tray and centered front grip',
        'layered right-front circular control, independent status indicator and rear-right framed power inlet',
        'four separate feet, paper exit socket, tray hinge socket, support hinge socket and cable socket',
        'five clean, flat, closed paper volumes with staggered launches, distinct paths and a named exit socket',
      ],
      inferred: [
        'paired rubber feed rollers are only partially implied by the output throat and are reconstructed for readable motion',
        'only a small purpose-readable printhead carriage is inferred; cartridge bay, ink routing, controller board and internal gearing are hidden and omitted',
        'tray hinge depth, paper path curvature and support stop angles are inferred from the fixed open views',
        'underside screws, vents, tread and power cable geometry are not visible; the rear socket is the connection anchor',
      ],
    },
  );

  build.root.userData.referenceDimensions = {
    bodyWidth: 3.4,
    bodyHeight: 1.58,
    bodyDepth: 2.38,
    overallHeight: 2.78,
    trayProjection: 0.86,
    outputOpeningWidth: 2.28,
  };
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.printerPerformanceRig = {
    owner: 'PrinterPerformance',
    sourceSocket: 'printer-paper-exit-socket',
    pageCount: PERFORMANCE_PAGE_COUNT,
    pageDimensions: {
      width: PAPER_WIDTH,
      length: PAPER_LENGTH,
      thickness: PAPER_THICKNESS,
      aspectRatio: PAPER_LENGTH / PAPER_WIDTH,
    },
    launchTimes: PRINTER_PAPER_PROFILES.map((profile) => profile.launchTime),
    flightDurations: PRINTER_PAPER_PROFILES.map((profile) => profile.flightDuration),
    profiles: PRINTER_PAPER_PROFILES.map((profile) => profile.id),
    lifecycle: 'visible-from-exit-through-bottom-viewport-exit',
    sharedSpectacleEffects: 'disabled',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  };
  build.root.userData.sculptRuntime.colliders = [
    { id: 'printer-main-body', type: 'box', node: 'printer-main-body-pivot' },
    { id: 'printer-paper-support', type: 'box', node: 'printer-rear-paper-support-pivot' },
    { id: 'printer-output-tray', type: 'box', node: 'printer-output-tray-hinge-pivot' },
    { id: 'printer-output-cavity-trigger', type: 'box', node: 'printer-output-cavity-pivot', trigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'printer-enclosure', nodes: ['printer-main-body-pivot', 'printer-top-access-lid-pivot'] },
    { id: 'printer-input-system', nodes: ['printer-rear-paper-support-pivot', 'printer-input-paper-pivot'] },
    { id: 'printer-output-system', nodes: ['printer-output-cavity-pivot', 'printer-output-tray-hinge-pivot', 'printer-paper-exit-socket', 'printer-performance-paper-rig'] },
    { id: 'printer-controls', nodes: ['printer-main-control-button-pivot'] },
    { id: 'printer-rear-service', nodes: ['printer-rear-service-pivot'] },
  ];
  return build;
}
