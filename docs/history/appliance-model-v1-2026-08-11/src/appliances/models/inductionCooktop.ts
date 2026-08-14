import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'references/intake/induction-cooktop/front.png';
const ACTIVE_DURATION = 5.2;

function rounded(width: number, height: number, depth: number, radius: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, 4, radius);
}

function markPart(object: THREE.Object3D, part: string, relief = false): void {
  object.userData.part = part;
  if (relief) object.userData.explodeWithParent = true;
}

function instanceCluster(
  kit: ApplianceModelKit,
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  matrices: readonly THREE.Matrix4[],
  parent: THREE.Object3D,
  part: string,
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.applianceId = kit.options.id;
  markPart(mesh, part);
  matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  kit.interactiveMeshes.push(mesh);
  kit.nodes.set(name, mesh);
  return mesh;
}

function horizontalBar(
  kit: ApplianceModelKit,
  name: string,
  width: number,
  position: readonly [number, number, number],
  material: THREE.Material,
  parent: THREE.Object3D,
): THREE.Mesh {
  const bar = kit.mesh(name, rounded(width, 0.018, 0.025, 0.008), material, parent, false);
  bar.position.set(...position);
  return bar;
}

/**
 * Three-view reconstruction of the supplied Sakura portable induction cooktop.
 *
 * Local frame: +Y up, +Z toward the control edge, floor at Y=0. The admitted
 * views are top, right side and underside. Internal coil, airflow and wiring
 * are hidden; the powered pot and steam are explicit interaction cues.
 */
export function createInductionCooktopModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const pink = accent.clone().offsetHSL(0, -0.025, 0).getHex();

  const cream = kit.material(0xf6eddf, { tint: 0x8c7e83 });
  const creamHighlight = kit.material(0xfff7e9, { tint: 0xa08f91 });
  const glass = kit.material(pink, { tint: 0x986f7c, emissive: pink });
  glass.emissiveIntensity = 0;
  const mint = kit.material(0xa9c5b5, { tint: 0x708f88 });
  const rubber = kit.material(0x87a99b, { tint: 0x58726c });
  const ink = kit.material(0x55474a, { tint: 0x3d363f });
  const cavity = kit.material(0x494044, { tint: 0x332e36 });
  const cordRubber = kit.material(0x756a68, { tint: 0x4e474c });
  const metal = kit.material(0xb8afa6, { tint: 0x6d6871 });

  const heatMaterial = kit.material(0xff8d78, {
    tint: 0xd5576d,
    emissive: 0xff503f,
    transparent: true,
    opacity: 0,
  });
  heatMaterial.depthWrite = false;
  const soupMaterial = kit.material(0xf6b28a, {
    tint: 0xc87972,
    emissive: 0xd95f4d,
    transparent: true,
    opacity: 0.88,
  });
  const soupFoam = kit.material(0xffd5ae, {
    tint: 0xdf907a,
    emissive: 0xff8d72,
    transparent: true,
    opacity: 0.84,
  });
  const steamMaterial = kit.material(0xfff2e9, {
    tint: 0xc9b8c6,
    emissive: 0xffd8d2,
    transparent: true,
    opacity: 0.72,
  });
  const potInterior = kit.material(0x6e5c5e, { tint: 0x4b4249 });
  potInterior.side = THREE.BackSide;
  const meat = kit.material(0xf2a6a2, { tint: 0xba6875 });
  const meatMarbling = kit.material(0xffe3d5, { tint: 0xd8aaa7 });
  const tofu = kit.material(0xffe4a8, { tint: 0xc7a96f });
  const vegetable = kit.material(0x79b98d, { tint: 0x4f8068 });
  const vegetableLight = kit.material(0xb9d596, { tint: 0x78966d });
  const meatball = kit.material(0xc98569, { tint: 0x8f5d59 });

  const enclosurePivot = kit.pivot('induction-cooktop-enclosure-pivot');
  const lowerBand = kit.mesh(
    'induction-cooktop-mint-lower-band',
    rounded(3.58, 0.34, 3.43, 0.31),
    mint,
    enclosurePivot,
  );
  lowerBand.position.y = 0.29;
  markPart(lowerBand, 'lower-band');

  const mainShell = kit.mesh(
    'induction-cooktop-cream-main-enclosure',
    rounded(3.62, 0.42, 3.47, 0.32),
    cream,
    enclosurePivot,
  );
  mainShell.position.y = 0.43;
  markPart(mainShell, 'main-enclosure');

  const topPivot = kit.pivot('induction-cooktop-top-surface-pivot', enclosurePivot);
  const bezel = kit.mesh(
    'induction-cooktop-raised-cream-bezel',
    rounded(3.48, 0.15, 3.33, 0.3),
    creamHighlight,
    topPivot,
  );
  bezel.position.y = 0.625;
  markPart(bezel, 'top-bezel');

  const panelSeam = kit.mesh(
    'induction-cooktop-inset-panel-seam',
    rounded(3.34, 0.025, 3.19, 0.265),
    ink,
    topPivot,
    false,
  );
  panelSeam.position.y = 0.69;
  markPart(panelSeam, 'seam-system');

  const panel = kit.mesh(
    'induction-cooktop-pink-glass-ceramic-panel',
    rounded(3.31, 0.075, 3.16, 0.255),
    glass,
    topPivot,
  );
  panel.position.y = 0.72;
  markPart(panel, 'cooking-panel');

  const heatingPivot = kit.pivot('induction-cooktop-heating-zone-pivot', topPivot);
  heatingPivot.position.set(0, 0.777, -0.28);
  heatingPivot.userData.materialState = 'induction-zone';
  kit.socket('induction-cooktop-pan-seat-socket', heatingPivot, [0, 0.02, 0]);

  const dashGeometry = new THREE.BoxGeometry(0.052, 0.018, 0.018);
  const dashMatrices = Array.from({ length: 64 }, (_, index) => {
    const angle = index * Math.PI * 2 / 64;
    return new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(angle) * 1.13, 0, Math.sin(angle) * 1.13),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -angle, 0)),
      new THREE.Vector3(1, 1, 1),
    );
  });
  instanceCluster(
    kit,
    'induction-cooktop-heater-dash-ring',
    dashGeometry,
    ink,
    dashMatrices,
    heatingPivot,
    'heating-zone',
  );

  const heaterCenter = kit.mesh(
    'induction-cooktop-heater-center-dot',
    new THREE.CylinderGeometry(0.025, 0.025, 0.018, 12),
    ink,
    heatingPivot,
    false,
  );
  markPart(heaterCenter, 'heating-zone', true);

  const heatRings: THREE.Mesh[] = [];
  [0.56, 0.82, 1.08].forEach((radius, index) => {
    const ring = kit.mesh(
      `induction-cooktop-powered-heat-ring-${index + 1}`,
      new THREE.TorusGeometry(radius, 0.025, 7, 48),
      heatMaterial,
      heatingPivot,
      false,
    );
    ring.rotation.x = Math.PI * 0.5;
    ring.position.y = 0.035 + index * 0.004;
    ring.visible = false;
    markPart(ring, 'powered-heat-effect');
    heatRings.push(ring);
  });

  const controlPivot = kit.pivot('induction-cooktop-control-assembly-pivot', topPivot);
  controlPivot.position.set(0, 0.78, 1.18);
  kit.socket('induction-cooktop-control-socket', controlPivot, [0, 0, 0]);

  const buttonGeometry = new THREE.CylinderGeometry(0.145, 0.145, 0.055, 24);
  const buttonRingGeometry = new THREE.TorusGeometry(0.145, 0.018, 6, 24);
  const buttons: Array<{ id: string; x: number; part: string }> = [
    { id: 'timer', x: -1.13, part: 'timer-button' },
    { id: 'mode', x: -0.69, part: 'mode-button' },
    { id: 'power', x: 1.12, part: 'power-button' },
  ];
  const buttonPivots = buttons.map(({ id, x, part }) => {
    const pivot = kit.pivot(`induction-cooktop-${id}-button-pivot`, controlPivot);
    pivot.position.x = x;
    pivot.userData.translationAxis = [0, 1, 0];
    kit.socket(`induction-cooktop-${id}-button-socket`, pivot, [0, 0, 0]);
    const face = kit.mesh(`induction-cooktop-${id}-button-face`, buttonGeometry, creamHighlight, pivot);
    markPart(face, part);
    const ring = kit.mesh(`induction-cooktop-${id}-button-ring`, buttonRingGeometry, ink, pivot, false);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.y = 0.034;
    markPart(ring, part, true);
    return pivot;
  });

  const timerIcon = kit.mesh(
    'induction-cooktop-timer-icon-ring',
    new THREE.TorusGeometry(0.058, 0.011, 5, 18),
    ink,
    buttonPivots[0],
    false,
  );
  timerIcon.rotation.x = Math.PI * 0.5;
  timerIcon.position.y = 0.067;
  markPart(timerIcon, 'timer-button', true);
  const timerHand = horizontalBar(kit, 'induction-cooktop-timer-hand', 0.052, [0.015, 0.068, -0.006], ink, buttonPivots[0]);
  timerHand.rotation.y = -0.72;
  markPart(timerHand, 'timer-button', true);

  const modeIcon = kit.mesh(
    'induction-cooktop-mode-icon',
    new THREE.SphereGeometry(0.045, 10, 7),
    ink,
    buttonPivots[1],
    false,
  );
  modeIcon.scale.set(0.65, 0.18, 1.1);
  modeIcon.position.y = 0.07;
  markPart(modeIcon, 'mode-button', true);
  const modeTip = kit.mesh(
    'induction-cooktop-mode-icon-tip',
    new THREE.ConeGeometry(0.035, 0.075, 9),
    ink,
    buttonPivots[1],
    false,
  );
  modeTip.position.set(0.02, 0.078, -0.025);
  markPart(modeTip, 'mode-button', true);

  const powerIcon = kit.mesh(
    'induction-cooktop-power-icon-ring',
    new THREE.TorusGeometry(0.056, 0.011, 5, 18),
    ink,
    buttonPivots[2],
    false,
  );
  powerIcon.rotation.x = Math.PI * 0.5;
  powerIcon.position.y = 0.067;
  markPart(powerIcon, 'power-button', true);
  const powerStem = kit.mesh(
    'induction-cooktop-power-icon-stem',
    rounded(0.018, 0.018, 0.075, 0.006),
    ink,
    buttonPivots[2],
    false,
  );
  powerStem.position.set(0, 0.072, -0.035);
  markPart(powerStem, 'power-button', true);

  const knobPivot = kit.pivot('induction-cooktop-rotary-knob-pivot', controlPivot);
  knobPivot.userData.rotationAxis = [0, 1, 0];
  knobPivot.userData.rotationRange = [-2.1, 2.1];
  kit.socket('induction-cooktop-rotary-knob-axis-socket', knobPivot, [0, 0, 0]);
  const knobShadow = kit.mesh(
    'induction-cooktop-rotary-knob-dark-rim',
    new THREE.CylinderGeometry(0.3, 0.3, 0.105, 28),
    ink,
    knobPivot,
  );
  markPart(knobShadow, 'control-knob');
  const knob = kit.mesh(
    'induction-cooktop-cream-rotary-knob',
    new THREE.CylinderGeometry(0.265, 0.275, 0.125, 28),
    creamHighlight,
    knobPivot,
  );
  knob.position.y = 0.055;
  markPart(knob, 'control-knob', true);
  const knobIndex = horizontalBar(kit, 'induction-cooktop-knob-index', 0.018, [0, 0.13, -0.18], ink, knobPivot);
  knobIndex.scale.z = 2.2;
  markPart(knobIndex, 'control-knob', true);

  const minus = horizontalBar(kit, 'induction-cooktop-minus-glyph', 0.08, [-0.4, 0.012, 0], ink, controlPivot);
  markPart(minus, 'control-glyphs');
  const plusHorizontal = horizontalBar(kit, 'induction-cooktop-plus-horizontal', 0.08, [0.4, 0.012, 0], ink, controlPivot);
  markPart(plusHorizontal, 'control-glyphs');
  const plusVertical = horizontalBar(kit, 'induction-cooktop-plus-vertical', 0.08, [0.4, 0.013, 0], ink, controlPivot);
  plusVertical.rotation.y = Math.PI * 0.5;
  markPart(plusVertical, 'control-glyphs');
  const indicator = kit.indicator([0.34, 0.795, 1.18], 0.025);
  indicator.name = 'induction-cooktop-status-indicator';
  markPart(indicator, 'control-indicator');

  const sideVentPivot = kit.pivot('induction-cooktop-right-side-vent-pivot', enclosurePivot);
  const ventGeometry = new THREE.BoxGeometry(0.025, 0.18, 0.045);
  const ventMatrices = Array.from({ length: 9 }, (_, index) => new THREE.Matrix4().makeTranslation(1.82, 0.43, -0.46 + index * 0.12));
  instanceCluster(kit, 'induction-cooktop-nine-side-vents', ventGeometry, cavity, ventMatrices, sideVentPivot, 'side-vents');

  const undersidePivot = kit.pivot('induction-cooktop-underside-service-pivot', enclosurePivot);
  undersidePivot.position.y = 0.105;
  const fanPivot = kit.pivot('induction-cooktop-underside-fan-pivot', undersidePivot);
  fanPivot.position.set(0.4, 0, 0.34);
  fanPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('induction-cooktop-fan-axis-socket', fanPivot, [0, 0, 0]);
  const fanCavity = kit.mesh(
    'induction-cooktop-underside-fan-cavity',
    new THREE.CylinderGeometry(0.72, 0.72, 0.025, 36),
    cavity,
    fanPivot,
    false,
  );
  markPart(fanCavity, 'fan-grille');

  const rotorPivot = kit.pivot('induction-cooktop-inferred-fan-rotor-pivot', fanPivot);
  rotorPivot.position.y = -0.025;
  const rotorBladeGeometry = rounded(0.18, 0.022, 0.48, 0.065);
  for (let index = 0; index < 5; index += 1) {
    const bladePivot = kit.pivot(`induction-cooktop-inferred-fan-blade-pivot-${index + 1}`, rotorPivot);
    bladePivot.rotation.y = index * Math.PI * 2 / 5;
    const blade = kit.mesh(
      `induction-cooktop-inferred-fan-blade-${index + 1}`,
      rotorBladeGeometry,
      glass,
      bladePivot,
      false,
    );
    blade.position.z = 0.23;
    markPart(blade, 'inferred-fan-rotor');
  }
  const rotorHub = kit.mesh(
    'induction-cooktop-inferred-fan-hub',
    new THREE.CylinderGeometry(0.105, 0.105, 0.05, 18),
    ink,
    rotorPivot,
    false,
  );
  markPart(rotorHub, 'inferred-fan-rotor');

  const grilleMatrices: THREE.Matrix4[] = [];
  const grilleQuaternion = new THREE.Quaternion();
  [0.27, 0.38, 0.49, 0.6, 0.69].forEach((radius, ringIndex) => {
    const count = 10 + ringIndex * 2;
    for (let index = 0; index < count; index += 1) {
      const angle = index * Math.PI * 2 / count + ringIndex * 0.075;
      grilleQuaternion.setFromEuler(new THREE.Euler(0, Math.PI * 0.5 - angle, 0));
      grilleMatrices.push(new THREE.Matrix4().compose(
        new THREE.Vector3(Math.cos(angle) * radius, -0.055, Math.sin(angle) * radius),
        grilleQuaternion.clone(),
        new THREE.Vector3(1, 1, 1),
      ));
    }
  });
  instanceCluster(
    kit,
    'induction-cooktop-concentric-fan-grille-slots',
    new THREE.BoxGeometry(0.14, 0.025, 0.052),
    cream,
    grilleMatrices,
    fanPivot,
    'fan-grille',
  );
  const fanOuterRing = kit.mesh(
    'induction-cooktop-fan-grille-outer-ring',
    new THREE.TorusGeometry(0.74, 0.026, 7, 40),
    ink,
    fanPivot,
    false,
  );
  fanOuterRing.rotation.x = Math.PI * 0.5;
  fanOuterRing.position.y = -0.06;
  markPart(fanOuterRing, 'fan-grille', true);

  const cablePivot = kit.pivot('induction-cooktop-cable-storage-pivot', undersidePivot);
  cablePivot.position.set(-0.44, -0.04, -1.31);
  kit.socket('induction-cooktop-cable-trough-socket', cablePivot, [-0.93, 0, 0]);
  const cableRecess = kit.mesh(
    'induction-cooktop-cable-storage-recess',
    rounded(2.05, 0.045, 0.5, 0.12),
    cavity,
    cablePivot,
    false,
  );
  markPart(cableRecess, 'cable-trough');
  const cableInner = kit.mesh(
    'induction-cooktop-cable-trough-cream-inset',
    rounded(1.87, 0.018, 0.35, 0.08),
    cream,
    cablePivot,
    false,
  );
  cableInner.position.y = -0.035;
  markPart(cableInner, 'cable-trough', true);

  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.86, -0.075, -0.02),
    new THREE.Vector3(-0.78, -0.085, 0.13),
    new THREE.Vector3(-0.3, -0.09, 0.14),
    new THREE.Vector3(0.16, -0.09, 0.13),
    new THREE.Vector3(0.35, -0.08, -0.04),
  ]);
  const cord = kit.mesh(
    'induction-cooktop-stored-power-cord',
    new THREE.TubeGeometry(cordCurve, 30, 0.035, 8, false),
    cordRubber,
    cablePivot,
    false,
  );
  markPart(cord, 'power-cord');
  const strainRelief = kit.mesh(
    'induction-cooktop-cord-strain-relief',
    rounded(0.22, 0.07, 0.12, 0.03),
    cordRubber,
    cablePivot,
    false,
  );
  strainRelief.position.set(0.43, -0.075, -0.04);
  markPart(strainRelief, 'power-cord');
  const plug = kit.mesh(
    'induction-cooktop-stored-two-pin-plug',
    rounded(0.3, 0.105, 0.22, 0.04),
    creamHighlight,
    cablePivot,
  );
  plug.position.set(0.68, -0.08, -0.04);
  markPart(plug, 'stored-power-plug');
  for (const [z, label] of [[-0.075, 'rear'], [0.075, 'front']] as const) {
    const pin = kit.mesh(
      `induction-cooktop-stored-plug-pin-${label}`,
      new THREE.CylinderGeometry(0.022, 0.022, 0.19, 10),
      metal,
      cablePivot,
      false,
    );
    pin.rotation.z = Math.PI * 0.5;
    pin.position.set(0.92, -0.08, -0.04 + z);
    markPart(pin, 'stored-power-plug', true);
  }
  kit.socket('induction-cooktop-power-cable-socket', cablePivot, [1.04, -0.08, -0.04]);

  const footGeometry = new THREE.CylinderGeometry(0.14, 0.16, 0.15, 18);
  const footPositions = [
    [-1.38, 1.25, 'front-left'],
    [1.38, 1.25, 'front-right'],
    [-1.38, -1.25, 'rear-left'],
    [1.38, -1.25, 'rear-right'],
  ] as const;
  footPositions.forEach(([x, z, label]) => {
    const footPivot = kit.pivot(`induction-cooktop-foot-${label}-pivot`, enclosurePivot);
    footPivot.position.set(x, 0.075, z);
    kit.socket(`induction-cooktop-foot-${label}-socket`, footPivot, [0, 0.075, 0]);
    const foot = kit.mesh(`induction-cooktop-rubber-foot-${label}`, footGeometry, rubber, footPivot, false);
    markPart(foot, 'foot-array');
  });

  // The cookware is part of the appliance's readable idle silhouette. Heat,
  // boiling and food motion remain powered, but the pot itself is never spawned
  // late by the performance timeline.
  const cookwarePivot = kit.pivot('induction-cooktop-powered-cookware-pivot', heatingPivot);
  cookwarePivot.position.y = 0.03;
  cookwarePivot.visible = true;
  const panBottom = kit.mesh(
    'induction-cooktop-hotpot-thick-bottom',
    new THREE.CylinderGeometry(1.11, 1.03, 0.16, 40),
    ink,
    cookwarePivot,
  );
  panBottom.position.y = 0.1;
  markPart(panBottom, 'powered-cookware');
  const panWall = kit.mesh(
    'induction-cooktop-hotpot-outer-wall',
    new THREE.CylinderGeometry(1.18, 1.1, 0.7, 40, 1, true),
    creamHighlight,
    cookwarePivot,
  );
  panWall.position.y = 0.5;
  markPart(panWall, 'powered-cookware');
  const panInnerWall = kit.mesh(
    'induction-cooktop-hotpot-inner-cavity',
    new THREE.CylinderGeometry(1.07, 1.02, 0.58, 40, 1, true),
    potInterior,
    cookwarePivot,
    false,
  );
  panInnerWall.position.y = 0.52;
  markPart(panInnerWall, 'powered-cookware-interior');
  const panRim = kit.mesh(
    'induction-cooktop-hotpot-rolled-rim',
    new THREE.TorusGeometry(1.125, 0.055, 9, 48),
    ink,
    cookwarePivot,
  );
  panRim.rotation.x = Math.PI * 0.5;
  panRim.position.y = 0.86;
  markPart(panRim, 'powered-cookware-rim');
  const soup = kit.mesh(
    'induction-cooktop-powered-simmer-surface',
    new THREE.CylinderGeometry(1.03, 1.03, 0.035, 40),
    soupMaterial,
    cookwarePivot,
    false,
  );
  soup.position.y = 0.74;
  markPart(soup, 'powered-cookware', true);

  const boilRig = kit.pivot('induction-cooktop-volumetric-boil-rig', cookwarePivot);
  boilRig.userData.performanceEffect = true;
  const boilBubbleGeometry = new THREE.IcosahedronGeometry(0.105, 1);
  for (let index = 0; index < 14; index += 1) {
    const angle = index * 2.399963229728653;
    const radius = 0.18 + (index % 5) * 0.145;
    const bubble = kit.mesh(
      `induction-cooktop-soup-rolling-bubble-${index + 1}`,
      boilBubbleGeometry,
      soupFoam,
      boilRig,
      false,
    );
    bubble.position.set(Math.cos(angle) * radius, 0.77, Math.sin(angle) * radius);
    bubble.scale.setScalar(0.68 + (index % 4) * 0.11);
    bubble.visible = false;
    bubble.userData.performanceEffect = true;
    bubble.userData.bubbleIndex = index;
    bubble.userData.basePosition = bubble.position.toArray();
    markPart(bubble, 'volumetric-boil-effects');
  }

  const steamRig = kit.pivot('induction-cooktop-volumetric-steam-rig', cookwarePivot);
  steamRig.userData.performanceEffect = true;
  const steamMainGeometry = new THREE.DodecahedronGeometry(0.2, 0);
  const steamLobeGeometry = new THREE.DodecahedronGeometry(0.135, 0);
  const steamCurlGeometry = new THREE.TorusGeometry(0.13, 0.035, 6, 14);
  for (let index = 0; index < 18; index += 1) {
    const cloud = kit.pivot(`induction-cooktop-steam-cloud-${index + 1}-pivot`, steamRig);
    const angle = index * 2.399963229728653;
    const radius = 0.12 + (index % 5) * 0.13;
    cloud.position.set(Math.cos(angle) * radius, 0.9, Math.sin(angle) * radius);
    cloud.visible = false;
    cloud.userData.performanceEffect = true;
    cloud.userData.steamIndex = index;
    cloud.userData.basePosition = cloud.position.toArray();
    const main = kit.mesh(
      `induction-cooktop-steam-cloud-${index + 1}-main-lobe`,
      steamMainGeometry,
      steamMaterial,
      cloud,
      false,
    );
    main.scale.set(0.78 + (index % 3) * 0.12, 1.05, 0.72);
    markPart(main, 'volumetric-steam-effects');
    for (const [lobeIndex, sign] of [-1, 1].entries()) {
      const lobe = kit.mesh(
        `induction-cooktop-steam-cloud-${index + 1}-side-lobe-${lobeIndex + 1}`,
        steamLobeGeometry,
        steamMaterial,
        cloud,
        false,
      );
      lobe.position.set(sign * 0.13, 0.07 + lobeIndex * 0.04, sign * -0.035);
      lobe.scale.set(1, 0.82 + lobeIndex * 0.16, 0.78);
      markPart(lobe, 'volumetric-steam-effects', true);
    }
    const curl = kit.mesh(
      `induction-cooktop-steam-cloud-${index + 1}-closed-curl`,
      steamCurlGeometry,
      steamMaterial,
      cloud,
      false,
    );
    curl.position.y = 0.23;
    curl.rotation.set(Math.PI * 0.5, angle, 0);
    curl.scale.set(0.8, 1, 0.72);
    markPart(curl, 'volumetric-steam-effects', true);
  }

  for (const [side, sign] of [['left', -1], ['right', 1]] as const) {
    const handlePivot = kit.pivot(`induction-cooktop-hotpot-${side}-handle-pivot`, cookwarePivot);
    handlePivot.userData.rotationAxis = [0, 0, 1];
    kit.socket(`induction-cooktop-hotpot-${side}-handle-socket`, handlePivot, [sign * 1.08, 0.58, 0]);
    for (const [z, end] of [[-0.27, 'rear'], [0.27, 'front']] as const) {
      const mount = kit.mesh(
        `induction-cooktop-hotpot-${side}-handle-${end}-mount`,
        new THREE.CylinderGeometry(0.105, 0.105, 0.22, 18),
        ink,
        handlePivot,
      );
      mount.rotation.z = Math.PI * 0.5;
      mount.position.set(sign * 1.13, 0.59, z);
      markPart(mount, `powered-cookware-${side}-handle`);
    }
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 1.13, 0.59, -0.27),
      new THREE.Vector3(sign * 1.43, 0.62, -0.25),
      new THREE.Vector3(sign * 1.5, 0.64, 0),
      new THREE.Vector3(sign * 1.43, 0.62, 0.25),
      new THREE.Vector3(sign * 1.13, 0.59, 0.27),
    ]);
    const grip = kit.mesh(
      `induction-cooktop-hotpot-${side}-loop-handle`,
      new THREE.TubeGeometry(handleCurve, 24, 0.085, 8, false),
      ink,
      handlePivot,
    );
    markPart(grip, `powered-cookware-${side}-handle`);
  }

  type FoodMotion = {
    mesh: THREE.Object3D;
    basePosition: THREE.Vector3;
    baseRotation: THREE.Euler;
    phase: number;
    bob: number;
  };
  const foodMotions: FoodMotion[] = [];
  const registerFood = (mesh: THREE.Object3D, part: string, phase: number, bob = 0.025): void => {
    markPart(mesh, part);
    foodMotions.push({
      mesh,
      basePosition: mesh.position.clone(),
      baseRotation: mesh.rotation.clone(),
      phase,
      bob,
    });
  };

  const meatSlicePositions = [
    [-0.52, 0.785, -0.3, -0.28],
    [-0.18, 0.79, 0.42, 0.32],
    [0.52, 0.785, -0.22, 0.62],
  ] as const;
  meatSlicePositions.forEach(([x, y, z, yaw], index) => {
    const slicePivot = kit.pivot(`induction-cooktop-hotpot-meat-slice-${index + 1}-pivot`, cookwarePivot);
    slicePivot.position.set(x, y, z);
    slicePivot.rotation.y = yaw;
    const slice = kit.mesh(
      `induction-cooktop-hotpot-meat-slice-${index + 1}`,
      rounded(0.42, 0.055, 0.23, 0.07),
      meat,
      slicePivot,
    );
    markPart(slice, 'hotpot-meat-slices');
    for (const stripeZ of [-0.055, 0.055]) {
      const stripe = kit.mesh(
        `induction-cooktop-hotpot-meat-slice-${index + 1}-marbling-${stripeZ < 0 ? 'rear' : 'front'}`,
        rounded(0.34, 0.012, 0.027, 0.01),
        meatMarbling,
        slicePivot,
        false,
      );
      stripe.position.set(0, 0.034, stripeZ);
      markPart(stripe, 'hotpot-meat-slices', true);
    }
    registerFood(slicePivot, 'hotpot-meat-slices', index * 1.9, 0.02);
  });

  const tofuPositions = [
    [-0.55, 0.82, 0.25],
    [0.08, 0.815, -0.42],
    [0.48, 0.82, 0.35],
  ] as const;
  tofuPositions.forEach(([x, y, z], index) => {
    const cube = kit.mesh(
      `induction-cooktop-hotpot-tofu-cube-${index + 1}`,
      rounded(0.27, 0.16, 0.27, 0.045),
      tofu,
      cookwarePivot,
    );
    cube.position.set(x, y, z);
    cube.rotation.y = 0.22 + index * 0.7;
    registerFood(cube, 'hotpot-tofu-cubes', 0.7 + index * 1.6, 0.032);
  });

  const meatballPositions = [
    [-0.2, 0.845, -0.08],
    [0.24, 0.84, 0.12],
    [0.7, 0.835, 0.02],
    [-0.72, 0.835, -0.02],
  ] as const;
  meatballPositions.forEach(([x, y, z], index) => {
    const ball = kit.mesh(
      `induction-cooktop-hotpot-meatball-${index + 1}`,
      new THREE.SphereGeometry(0.14, 14, 10),
      meatball,
      cookwarePivot,
    );
    ball.position.set(x, y, z);
    registerFood(ball, 'hotpot-meatballs', 1.1 + index * 1.25, 0.04);
  });

  const vegetablePositions = [
    [-0.73, 0.82, 0.52, -0.55],
    [0.18, 0.82, 0.56, 0.1],
    [0.7, 0.82, -0.48, 0.62],
  ] as const;
  vegetablePositions.forEach(([x, y, z, yaw], index) => {
    const vegetablePivot = kit.pivot(`induction-cooktop-hotpot-vegetable-${index + 1}-pivot`, cookwarePivot);
    vegetablePivot.position.set(x, y, z);
    vegetablePivot.rotation.y = yaw;
    const leaf = kit.mesh(
      `induction-cooktop-hotpot-vegetable-leaf-${index + 1}`,
      new THREE.SphereGeometry(0.22, 12, 8),
      index % 2 === 0 ? vegetable : vegetableLight,
      vegetablePivot,
    );
    leaf.scale.set(1.28, 0.18, 0.72);
    markPart(leaf, 'hotpot-vegetables');
    const stem = kit.mesh(
      `induction-cooktop-hotpot-vegetable-stem-${index + 1}`,
      rounded(0.24, 0.055, 0.065, 0.022),
      vegetableLight,
      vegetablePivot,
      false,
    );
    stem.position.x = -0.19;
    markPart(stem, 'hotpot-vegetables', true);
    registerFood(vegetablePivot, 'hotpot-vegetables', 0.35 + index * 2.15, 0.028);
  });

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'low rounded-square cream enclosure with inset Sakura-pink glass-ceramic panel and mint lower band',
        'large dotted circular cooking-zone mark with center dot and a front control strip',
        'three independent layered circular buttons, large center rotary knob, plus/minus marks and status indicator',
        'exact nine-slot right-side vent array, four separate mint rubber feet and low side profile',
        'underside concentric fan grille, cable storage recess, U-shaped cord, strain relief and two-pin plug',
        'separate pivots and sockets for heating zone, knob, buttons, fan, feet, cookware seat and power connection',
        'large powered-use hotpot with thick base, complete outer and inner walls, rolled rim and two independently mounted loop handles',
        'separate visible meat slices with marbling, tofu cubes, leafy vegetables, meatballs and fourteen closed-volume boiling bubbles inside the hotpot',
        'eighteen multi-lobe Low Poly steam clouds with closed torus curl volumes and no Plane, Sprite or Line effects',
      ],
      inferred: [
        'isolated rear-wall seam is inferred from the shared rounded enclosure because no rear elevation is supplied',
        'fan impeller shape is inferred behind the observed underside grille; induction coil and internal airflow are omitted',
        'cable trough depth, cord attachment and strain-relief overlap are inferred from underside shadows',
        'powered hotpot, food contents, thermal rings and steam are interaction cues designed from the requested appliance use and are not claimed as supplied reference geometry',
      ],
    },
  );

  build.root.userData.referenceDimensions = {
    bodyWidth: 3.62,
    bodyDepth: 3.47,
    bodyThickness: 0.58,
    overallHeight: 0.795,
    heatingZoneDiameter: 2.26,
    hotpotOuterDiameter: 2.36,
    hotpotInteriorDiameter: 2.14,
    hotpotHeight: 0.91,
    hotpotHandleSpan: 3.0,
    visibleFoodPieces: foodMotions.length,
    controlEdgeOffset: 1.18,
  };
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.externalPerformanceCue = {
    type: 'induction-cooktop-owned-volumetric-hotpot',
    boilBubbleCount: 14,
    steamCloudCount: 18,
    foodPieceCount: foodMotions.length,
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  };
  build.root.userData.sculptRuntime.colliders = [
    { id: 'induction-cooktop-body', type: 'box', node: 'induction-cooktop-enclosure-pivot' },
    { id: 'induction-cooktop-heating-zone', type: 'cylinder', node: 'induction-cooktop-heating-zone-pivot', trigger: true },
    { id: 'induction-cooktop-controls', type: 'box', node: 'induction-cooktop-control-assembly-pivot', trigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'cooktop-enclosure', nodes: ['induction-cooktop-enclosure-pivot'] },
    { id: 'cooktop-surface', nodes: ['induction-cooktop-top-surface-pivot', 'induction-cooktop-heating-zone-pivot'] },
    { id: 'cooktop-controls', nodes: ['induction-cooktop-control-assembly-pivot'] },
    { id: 'cooktop-underside-service', nodes: ['induction-cooktop-underside-service-pivot'] },
    { id: 'cooktop-powered-cookware', nodes: ['induction-cooktop-powered-cookware-pivot'] },
  ];
  return build;
}
