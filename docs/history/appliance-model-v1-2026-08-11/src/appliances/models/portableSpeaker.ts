import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'references/intake/portable-speaker/front.png';
// Slightly longer tail keeps the denser climax audible/visible before the
// cabinet settles back to its idle pose.
const ACTIVE_DURATION = 5.45;

function rounded(width: number, height: number, depth: number, radius: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, 5, radius);
}

function carryHandleGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-1.7, 0);
  shape.lineTo(-1.7, 0.92);
  shape.bezierCurveTo(-1.7, 1.78, -1.04, 2.24, 0, 2.24);
  shape.bezierCurveTo(1.04, 2.24, 1.7, 1.78, 1.7, 0.92);
  shape.lineTo(1.7, 0);
  shape.lineTo(1.46, 0);
  shape.lineTo(1.46, 0.9);
  shape.bezierCurveTo(1.46, 1.58, 0.9, 1.98, 0, 1.98);
  shape.bezierCurveTo(-0.9, 1.98, -1.46, 1.58, -1.46, 0.9);
  shape.lineTo(-1.46, 0);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.46,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.045,
    bevelThickness: 0.045,
    curveSegments: 18,
  });
  geometry.translate(0, 0, -0.23);
  geometry.computeVertexNormals();
  return geometry;
}

/** A closed tube, not a camera-facing ring card: thickness survives every review angle. */
function bassWaveGeometry(variant: number): THREE.TubeGeometry {
  const points: THREE.Vector3[] = [];
  const pointCount = 48;
  const phase = variant * 0.71;
  for (let index = 0; index < pointCount; index += 1) {
    const angle = (index / pointCount) * Math.PI * 2;
    const radialWarp = Math.sin(angle * 3 + phase) * 0.024
      + Math.sin(angle * 7 - phase * 0.6) * 0.01;
    points.push(new THREE.Vector3(
      Math.cos(angle) * (0.72 + radialWarp),
      Math.sin(angle) * (0.64 + radialWarp * 0.72),
      Math.sin(angle * 2 + phase) * 0.028,
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.42);
  const geometry = new THREE.TubeGeometry(curve, 96, 0.052 + (variant % 3) * 0.009, 8, true);
  geometry.computeVertexNormals();
  geometry.userData.performanceProp = 'portable-speaker-volumetric-bass-wave';
  geometry.userData.geometryProfile = 'closed-irregular-tube';
  geometry.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
  return geometry;
}

function addInstancedPerforations(
  kit: ApplianceModelKit,
  parent: THREE.Object3D,
  material: THREE.Material,
): THREE.InstancedMesh {
  const positions: THREE.Vector3[] = [];
  const columns = 22;
  const rows = 23;
  for (let row = 0; row < rows; row += 1) {
    const y = 0.74 + row * 0.116;
    for (let column = 0; column < columns; column += 1) {
      const x = -1.18 + column * 0.112;
      const roundedBoundary = Math.abs(x) < 1.13 || (Math.abs(x) < 1.24 && y > 0.86 && y < 3.17);
      const controlClearance = x > 0.73 && y < 1.22;
      if (roundedBoundary && !controlClearance) positions.push(new THREE.Vector3(x, y, 0.93));
    }
  }

  const geometry = new THREE.CylinderGeometry(0.027, 0.027, 0.045, 8);
  const holes = new THREE.InstancedMesh(geometry, material, positions.length);
  holes.name = 'portable-speaker-grille-perforations';
  holes.castShadow = false;
  holes.receiveShadow = true;
  holes.userData.applianceId = kit.options.id;
  holes.userData.part = 'grille-perforations';
  holes.userData.instanceCount = positions.length;
  holes.userData.basePositions = positions.map((position) => position.toArray());
  holes.userData.rhythmicDisplacement = 'radial-delayed-instance-wave';
  const dummy = new THREE.Object3D();
  for (let index = 0; index < positions.length; index += 1) {
    dummy.position.copy(positions[index]);
    dummy.rotation.set(Math.PI * 0.5, 0, 0);
    dummy.updateMatrix();
    holes.setMatrixAt(index, dummy.matrix);
  }
  holes.instanceMatrix.needsUpdate = true;
  parent.add(holes);
  kit.interactiveMeshes.push(holes);
  kit.nodes.set(holes.name, holes);
  return holes;
}

function tag(mesh: THREE.Mesh, part: string, relief = false): void {
  mesh.userData.part = part;
  if (relief) mesh.userData.explodeWithParent = true;
}

/** Three-view procedural reconstruction of the SAKURA portable speaker. */
export function createPortableSpeakerModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const pink = accent.clone().offsetHSL(0, -0.04, 0.045).getHex();
  const pinkLight = accent.clone().offsetHSL(0, -0.08, 0.14).getHex();
  const pinkDark = accent.clone().offsetHSL(0, 0.02, -0.11).getHex();

  const shellMaterial = kit.material(pink, { tint: 0x806b78 });
  const shellHighlightMaterial = kit.material(pinkLight, { tint: 0x987d83 });
  const shellSeamMaterial = kit.material(pinkDark, { tint: 0x66535f });
  const creamMaterial = kit.material(0xf7ead7, { tint: 0x9b8790 });
  const creamHighlightMaterial = kit.material(0xfff5e5, { tint: 0xad9696 });
  const mintMaterial = kit.material(0xd0eee2, { tint: 0x95b9ad });
  const cavityMaterial = kit.material(0x4b4347, { tint: 0x39343c });
  const rubberMaterial = kit.material(0x696165, { tint: 0x423d45 });

  // Every visible machine part belongs to one bass root. Effects remain root siblings so
  // emitted waves can expand without being repeatedly squashed by later beats.
  const wholeMachinePivot = kit.pivot('portable-speaker-whole-machine-pivot');
  wholeMachinePivot.userData.animationRole = 'whole-appliance-root';
  const cabinetPivot = kit.pivot('portable-speaker-cabinet-pivot', wholeMachinePivot);
  const cabinet = kit.mesh(
    'portable-speaker-cabinet-shell',
    rounded(3.2, 3.55, 1.45, 0.32),
    shellMaterial,
    cabinetPivot,
  );
  cabinet.position.y = 1.84;
  tag(cabinet, 'cabinet-shell');

  const crownHighlight = kit.mesh(
    'portable-speaker-cabinet-crown-highlight',
    rounded(2.72, 0.18, 1.17, 0.08),
    shellHighlightMaterial,
    cabinetPivot,
    false,
  );
  crownHighlight.position.set(0, 3.47, -0.02);
  tag(crownHighlight, 'cabinet-shell', true);

  const frontSeam = kit.mesh(
    'portable-speaker-front-fascia-seam',
    rounded(2.86, 3.05, 0.08, 0.28),
    shellSeamMaterial,
    cabinetPivot,
    false,
  );
  frontSeam.position.set(0, 1.92, 0.738);
  tag(frontSeam, 'front-fascia-seam', true);

  const fasciaPivot = kit.pivot('portable-speaker-front-fascia-pivot', cabinetPivot);
  const fascia = kit.mesh(
    'portable-speaker-front-fascia',
    rounded(2.76, 2.95, 0.13, 0.25),
    creamMaterial,
    fasciaPivot,
  );
  fascia.position.set(0, 1.92, 0.805);
  tag(fascia, 'front-fascia');

  const fasciaInset = kit.mesh(
    'portable-speaker-fascia-inner-inset',
    rounded(2.52, 2.72, 0.025, 0.2),
    creamHighlightMaterial,
    fasciaPivot,
    false,
  );
  fasciaInset.position.set(0, 1.95, 0.882);
  tag(fasciaInset, 'front-fascia', true);

  const driverPulsePivot = kit.pivot('portable-speaker-driver-pulse-pivot', fasciaPivot);
  driverPulsePivot.position.set(-0.22, 1.94, 0.902);
  driverPulsePivot.userData.animationRole = 'speaker-diaphragm';
  driverPulsePivot.userData.travelAxis = [0, 0, 1];
  // The visible front is intentionally only the perforated fascia at rest.
  // Previous translucent driver layers read as leftover circular face plates.

  const grillePerforations = addInstancedPerforations(kit, fasciaPivot, cavityMaterial);

  const powerButtonPivot = kit.pivot('portable-speaker-power-button-pivot', fasciaPivot);
  powerButtonPivot.position.set(1.0, 0.91, 0.94);
  powerButtonPivot.userData.rotationAxis = [0, 0, 1];
  const buttonOuter = kit.mesh(
    'portable-speaker-power-button-outer-ring',
    new THREE.TorusGeometry(0.27, 0.034, 9, 32),
    shellSeamMaterial,
    powerButtonPivot,
  );
  tag(buttonOuter, 'power-control');
  const buttonBezel = kit.mesh(
    'portable-speaker-power-button-bezel',
    new THREE.CylinderGeometry(0.245, 0.245, 0.07, 32),
    creamHighlightMaterial,
    powerButtonPivot,
    false,
  );
  buttonBezel.rotation.x = Math.PI * 0.5;
  buttonBezel.position.z = 0.015;
  tag(buttonBezel, 'power-control', true);
  const buttonFace = kit.mesh(
    'portable-speaker-power-button-face',
    new THREE.CylinderGeometry(0.18, 0.18, 0.075, 28),
    creamMaterial,
    powerButtonPivot,
    false,
  );
  buttonFace.rotation.x = Math.PI * 0.5;
  buttonFace.position.z = 0.055;
  tag(buttonFace, 'power-control', true);
  const powerArc = kit.mesh(
    'portable-speaker-power-glyph-arc',
    new THREE.TorusGeometry(0.083, 0.014, 5, 18, Math.PI * 1.52),
    shellSeamMaterial,
    powerButtonPivot,
    false,
  );
  powerArc.rotation.z = Math.PI * 0.24;
  powerArc.position.z = 0.102;
  tag(powerArc, 'power-control', true);
  const powerStem = kit.mesh(
    'portable-speaker-power-glyph-stem',
    rounded(0.026, 0.112, 0.02, 0.008),
    shellSeamMaterial,
    powerButtonPivot,
    false,
  );
  powerStem.position.set(0, 0.055, 0.105);
  tag(powerStem, 'power-control', true);

  const indicator = kit.indicator([1.0, 0.42, 0.944], 0.05);
  indicator.name = 'portable-speaker-status-indicator';
  fasciaPivot.add(indicator);
  kit.nodes.set(indicator.name, indicator);
  tag(indicator, 'status-indicator');

  const handlePivot = kit.pivot('portable-speaker-handle-pivot', wholeMachinePivot);
  handlePivot.position.y = 2.72;
  handlePivot.userData.rotationAxis = [1, 0, 0];
  const handle = kit.mesh(
    'portable-speaker-carry-handle',
    carryHandleGeometry(),
    shellMaterial,
    handlePivot,
  );
  tag(handle, 'carry-handle');
  const handleHighlight = kit.mesh(
    'portable-speaker-handle-crown-highlight',
    rounded(1.65, 0.055, 0.35, 0.025),
    shellHighlightMaterial,
    handlePivot,
    false,
  );
  handleHighlight.position.set(0, 2.1, 0);
  tag(handleHighlight, 'carry-handle', true);

  [-1, 1].forEach((side, index) => {
    const sideName = side < 0 ? 'left' : 'right';
    const hingePivot = kit.pivot(`portable-speaker-${sideName}-hinge-pivot`, cabinetPivot);
    hingePivot.position.set(side * 1.65, 2.72, 0);
    hingePivot.userData.rotationAxis = [1, 0, 0];
    kit.socket(`portable-speaker-handle-${sideName}-hinge-socket`, hingePivot, [0, 0, 0]);
    const hingeOuter = kit.mesh(
      `portable-speaker-${sideName}-hinge-outer-cap`,
      new THREE.CylinderGeometry(0.29, 0.29, 0.16, 28),
      shellSeamMaterial,
      hingePivot,
    );
    hingeOuter.rotation.z = Math.PI * 0.5;
    tag(hingeOuter, `handle-hinge-${index + 1}`);
    const hingeCream = kit.mesh(
      `portable-speaker-${sideName}-hinge-cream-cap`,
      new THREE.CylinderGeometry(0.235, 0.235, 0.19, 28),
      creamMaterial,
      hingePivot,
      false,
    );
    hingeCream.rotation.z = Math.PI * 0.5;
    hingeCream.position.x = side * 0.035;
    tag(hingeCream, `handle-hinge-${index + 1}`, true);
    const hingeInset = kit.mesh(
      `portable-speaker-${sideName}-hinge-center-disc`,
      new THREE.CylinderGeometry(0.17, 0.17, 0.205, 24),
      creamHighlightMaterial,
      hingePivot,
      false,
    );
    hingeInset.rotation.z = Math.PI * 0.5;
    hingeInset.position.x = side * 0.045;
    tag(hingeInset, `handle-hinge-${index + 1}`, true);

    const mintInsert = kit.mesh(
      `portable-speaker-handle-${sideName}-mint-insert`,
      rounded(0.035, 1.29, 0.35, 0.02),
      mintMaterial,
      handlePivot,
      false,
    );
    // The side elevation exposes a mint insert on the outer face of the strap.
    mintInsert.position.set(side * 1.73, 0.69, 0);
    tag(mintInsert, 'carry-handle', true);
  });

  const rearPivot = kit.pivot('portable-speaker-rear-service-pivot', cabinetPivot);
  const rearPanel = kit.mesh(
    'portable-speaker-rear-service-panel',
    rounded(1.46, 0.68, 0.1, 0.1),
    creamMaterial,
    rearPivot,
  );
  rearPanel.position.set(0, 0.53, -0.756);
  tag(rearPanel, 'rear-service-panel');
  const rearSlotRim = kit.mesh(
    'portable-speaker-rear-port-rim',
    rounded(0.48, 0.1, 0.035, 0.035),
    shellSeamMaterial,
    rearPivot,
    false,
  );
  rearSlotRim.position.set(0, 0.56, -0.818);
  tag(rearSlotRim, 'rear-service-panel', true);
  const rearSlot = kit.mesh(
    'portable-speaker-rear-horizontal-port',
    rounded(0.39, 0.055, 0.04, 0.022),
    cavityMaterial,
    rearPivot,
    false,
  );
  rearSlot.position.set(0, 0.56, -0.843);
  tag(rearSlot, 'rear-service-panel', true);

  const sharedFootGeometry = rounded(0.46, 0.13, 0.58, 0.05);
  [-1.18, 1.18].forEach((x, index) => {
    const foot = kit.mesh(
      `portable-speaker-rubber-foot-${index + 1}`,
      sharedFootGeometry,
      rubberMaterial,
      cabinetPivot,
    );
    foot.position.set(x, 0.04, 0);
    tag(foot, `foot-${index + 1}`);
  });

  kit.socket('portable-speaker-sound-wave-socket', fasciaPivot, [-0.22, 1.94, 1.08]);
  kit.socket('portable-speaker-power-cable-socket', rearPivot, [0, 0.56, -0.86]);

  const bassWaveRoot = kit.pivot('portable-speaker-bass-wave-root');
  bassWaveRoot.position.set(-0.22, 1.94, 1.08);
  bassWaveRoot.userData.effectOwner = 'PortableSpeakerPerformance';
  bassWaveRoot.userData.emitterSocket = 'portable-speaker-sound-wave-socket';
  for (let index = 0; index < 8; index += 1) {
    const material = kit.material(index >= 4 ? 0xffa0bd : 0xbcefdc, {
      tint: index >= 4 ? 0xa55d78 : 0x6faaa0,
      emissive: index >= 4 ? 0xff6e9b : 0x73e6c4,
      transparent: true,
      opacity: 0,
    });
    material.depthWrite = false;
    material.emissiveIntensity = 0;
    const wave = new THREE.Mesh(bassWaveGeometry(index), material);
    wave.name = `portable-speaker-bass-wave-ring-${index + 1}`;
    wave.visible = false;
    wave.castShadow = false;
    wave.receiveShadow = false;
    wave.frustumCulled = false;
    wave.renderOrder = 6;
    wave.userData.applianceId = options.id;
    wave.userData.part = 'sound-wave-effect';
    wave.userData.explodeWithParent = true;
    wave.userData.performanceProp = 'volumetric-bass-wave';
    wave.userData.geometryProfile = 'closed-irregular-tube';
    wave.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
    bassWaveRoot.add(wave);
    kit.nodes.set(wave.name, wave);
  }
  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'slightly-taller-than-wide rounded pink cabinet with a deep side profile',
        'cream recessed front fascia and dense instanced circular perforation field',
        'lower-right concentric power button, raised power glyph and mint status indicator',
        'broad extruded carry-handle arch with paired cream hinge caps and mint side inserts',
        'cream lower rear service panel with one horizontal recessed port',
        'paired shallow rubber feet, shell seams and satin highlight layers',
        'clean perforated fascia with no exposed translucent driver face plates',
        'independent whole-machine bass root, hidden driver pivot and closed TubeGeometry wave rig',
      ],
      inferred: [
        'single full-range driver count, cone profile, suspension compliance and enclosure volume are inferred from common compact-speaker construction',
        'handle hinge mechanism, angular stops and internal cable routing are not visible',
        'rear horizontal slot function and panel depth are ambiguous in the supplied back view',
        'powered diaphragm glow and thick irregular sound-wave tubes are purpose-driven animation cues',
      ],
    },
  );

  build.root.userData.referenceDimensions = {
    cabinetWidth: 3.2,
    cabinetHeight: 3.55,
    cabinetDepth: 1.45,
    totalHeight: 4.96,
    fasciaSize: [2.76, 2.95],
    hingeAxisHeight: 2.72,
    grilleInstanceCount: grillePerforations.count,
  };
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.portableSpeakerRig = {
    timelineOwner: 'AppliancePerformanceSystem',
    performanceModule: 'PortableSpeakerPerformance',
    wholeMachineNode: 'portable-speaker-whole-machine-pivot',
    driverNode: 'portable-speaker-driver-pulse-pivot',
    emitterSocket: 'portable-speaker-sound-wave-socket',
    waveRoot: 'portable-speaker-bass-wave-root',
    waveCount: 8,
    waveGeometry: 'closed-irregular-tube',
    forbiddenFlatEffects: ['PlaneGeometry', 'Sprite', 'Line'],
  };
  build.root.userData.sculptRuntime.colliders = [
    { id: 'portable-speaker-cabinet', type: 'box', node: 'portable-speaker-cabinet-shell' },
    { id: 'portable-speaker-handle', type: 'box', node: 'portable-speaker-carry-handle', trigger: true },
    { id: 'portable-speaker-power-control', type: 'cylinder', node: 'portable-speaker-power-button-face', trigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'cabinet-shell', nodes: ['portable-speaker-cabinet-pivot'] },
    { id: 'front-acoustic-assembly', nodes: ['portable-speaker-front-fascia-pivot', 'portable-speaker-driver-pulse-pivot'] },
    { id: 'carry-handle-assembly', nodes: ['portable-speaker-handle-pivot', 'portable-speaker-left-hinge-pivot', 'portable-speaker-right-hinge-pivot'] },
    { id: 'rear-service-assembly', nodes: ['portable-speaker-rear-service-pivot'] },
  ];
  return build;
}
