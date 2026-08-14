import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import { setHullOutlineStyle } from '../../style/outline';

const REFERENCE_PATH = 'references/intake-v2/stand-mixer/views/front.png';

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) * (Math.PI * 2 / 10000);
}

function applyStandMixerOutlineHierarchy(root: THREE.Object3D): void {
  const mainSilhouette = /stepped-base-shell|tapered-rear-column|rounded-motor-head|deep-mixing-bowl|rolled-bowl-rim/;
  const fineDetail = /status-indicator|vent-slot|whisk-wire|liquid|dollop|droplet|wave-ridge|cream-settle|foot|dial-index|hinge-inset/;
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

function shifted(color: number, lightness: number): number {
  return new THREE.Color(color).offsetHSL(0, -0.04, lightness).getHex();
}

function rounded(width: number, height: number, depth: number, radius: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, 5, radius);
}

function bowlGeometry(): THREE.LatheGeometry {
  const profile = [
    new THREE.Vector2(0.57, 0),
    new THREE.Vector2(0.73, 0.04),
    new THREE.Vector2(0.91, 0.22),
    new THREE.Vector2(1.05, 0.58),
    new THREE.Vector2(1.1, 1.08),
    new THREE.Vector2(1.14, 1.36),
    new THREE.Vector2(1.09, 1.43),
  ];
  const geometry = new THREE.LatheGeometry(profile, 32);
  geometry.computeVertexNormals();
  return geometry;
}

function handleCurve(angle: number): THREE.CatmullRomCurve3 {
  const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  return new THREE.CatmullRomCurve3([
    radial.clone().multiplyScalar(1.02).setY(1.15),
    radial.clone().multiplyScalar(1.31).setY(1.1),
    radial.clone().multiplyScalar(1.35).setY(0.68),
    radial.clone().multiplyScalar(1.26).setY(0.34),
    radial.clone().multiplyScalar(0.98).setY(0.38),
  ], false, 'catmullrom', 0.5);
}

function columnGeometry(): THREE.ExtrudeGeometry {
  const profile = new THREE.Shape();
  profile.moveTo(1.04, 0);
  profile.lineTo(1.04, 2.92);
  profile.lineTo(0.08, 2.92);
  profile.bezierCurveTo(0.08, 2.2, 0.16, 1.35, 0.48, 0.46);
  profile.bezierCurveTo(0.52, 0.28, 0.55, 0.12, 0.56, 0);
  profile.closePath();
  const geometry = new THREE.ExtrudeGeometry(profile, {
    depth: 0.94,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.07,
    bevelThickness: 0.07,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -0.47);
  geometry.rotateY(Math.PI * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

function whiskWireCurve(angle: number): THREE.CatmullRomCurve3 {
  const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  return new THREE.CatmullRomCurve3([
    radial.clone().multiplyScalar(0.12).setY(-0.02),
    radial.clone().multiplyScalar(0.29).setY(-0.2),
    radial.clone().multiplyScalar(0.48).setY(-0.56),
    radial.clone().multiplyScalar(0.42).setY(-0.88),
    radial.clone().multiplyScalar(0.14).setY(-1.08),
  ], false, 'catmullrom', 0.55);
}

function vortexVolumeGeometry(): THREE.LatheGeometry {
  // A closed liquid volume with a depressed centre. The profile is deliberately
  // asymmetric in height so lighting reads it as a real vortex, not a flat disc.
  const profile = [
    new THREE.Vector2(0, -0.16),
    new THREE.Vector2(0.72, -0.16),
    new THREE.Vector2(0.87, -0.1),
    new THREE.Vector2(0.91, 0.02),
    new THREE.Vector2(0.83, 0.09),
    new THREE.Vector2(0.63, 0.065),
    new THREE.Vector2(0.45, -0.005),
    new THREE.Vector2(0.27, -0.095),
    new THREE.Vector2(0.09, -0.205),
    new THREE.Vector2(0, -0.18),
  ];
  const geometry = new THREE.LatheGeometry(profile, 40);
  geometry.computeVertexNormals();
  geometry.userData.performanceProp = 'closed-volumetric-mixture-vortex';
  geometry.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
  return geometry;
}

function irregularLiquidRingGeometry(index: number): THREE.TubeGeometry {
  const points: THREE.Vector3[] = [];
  const count = 36;
  for (let point = 0; point < count; point += 1) {
    const angle = point / count * Math.PI * 2;
    const radius = 0.36 + index * 0.14
      + Math.sin(angle * (3 + index) + index * 0.8) * 0.035;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle * 4 + index) * (0.025 + index * 0.008),
      Math.sin(angle) * radius,
    ));
  }
  const geometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.42),
    72,
    0.035 + index * 0.008,
    7,
    true,
  );
  geometry.userData.performanceProp = 'volumetric-mixture-wave-ridge';
  geometry.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
  return geometry;
}

function creamPeakGeometry(): THREE.LatheGeometry {
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.2, 0.025),
    new THREE.Vector2(0.27, 0.11),
    new THREE.Vector2(0.2, 0.2),
    new THREE.Vector2(0.13, 0.31),
    new THREE.Vector2(0.075, 0.44),
    new THREE.Vector2(0.02, 0.55),
    new THREE.Vector2(0, 0.59),
  ];
  const geometry = new THREE.LatheGeometry(profile, 24);
  geometry.computeVertexNormals();
  geometry.userData.performanceProp = 'whipped-cream-settle-peak';
  geometry.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
  return geometry;
}

function liquidArcGeometry(index: number): THREE.TubeGeometry {
  const side = index % 2 === 0 ? -1 : 1;
  const reach = 0.72 + (index % 3) * 0.16;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(side * 0.18, 0.32 + (index % 2) * 0.08, 0.04),
    new THREE.Vector3(side * reach * 0.66, 0.66 + (index % 3) * 0.1, 0.1),
    new THREE.Vector3(side * reach, 0.34 + (index % 2) * 0.08, 0.16),
  ], false, 'centripetal', 0.48);
  const geometry = new THREE.TubeGeometry(curve, 24, 0.052 + (index % 3) * 0.012, 8, false);
  geometry.userData.performanceProp = 'volumetric-liquid-pull-arc';
  geometry.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
  return geometry;
}

function liquidDropGeometry(index: number): THREE.LatheGeometry {
  const width = 0.065 + (index % 3) * 0.012;
  const height = 0.18 + (index % 4) * 0.025;
  const geometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, -height * 0.5),
    new THREE.Vector2(width * 0.9, -height * 0.26),
    new THREE.Vector2(width, 0),
    new THREE.Vector2(width * 0.6, height * 0.28),
    new THREE.Vector2(0, height * 0.5),
  ], 12);
  geometry.computeVertexNormals();
  geometry.userData.performanceProp = 'volumetric-liquid-droplet';
  geometry.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
  return geometry;
}

export function createStandMixerModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const pink = shifted(options.accent, 0.02);
  const pinkLight = shifted(options.accent, 0.13);
  const pinkDark = shifted(options.accent, -0.11);
  const cream = kit.material(0xf8ebd5, { tint: 0x7b7181 });
  const creamHighlight = kit.material(0xfff6e6, { tint: 0x867987 });
  const pinkMaterial = kit.material(pink, { tint: 0x76647a });
  const pinkLightMaterial = kit.material(pinkLight, { tint: 0x806d7e });
  const pinkDarkMaterial = kit.material(pinkDark, { tint: 0x665667 });
  const steel = kit.material(0xd8d0c5, { tint: 0x69707c });
  const cavity = kit.material(0x756269, { tint: 0x453f4b });
  const rubber = kit.material(0x514a52, { tint: 0x393540 });
  const mixture = kit.material(0xffd98a, { tint: 0x8a6770, emissive: 0xffb447 });
  mixture.emissiveIntensity = 0.025;
  const creamMixture = kit.material(0xfff0c7, { tint: 0x8a6f70, emissive: 0xffd081 });
  creamMixture.emissiveIntensity = 0.018;
  const eggMixture = kit.material(0xf7b64b, { tint: 0x845664, emissive: 0xd97524 });
  eggMixture.emissiveIntensity = 0.025;

  const basePivot = kit.pivot('stand-mixer-base-pivot');
  const base = kit.mesh('stand-mixer-stepped-base-shell', rounded(3.08, 0.48, 3.8, 0.16), pinkMaterial, basePivot);
  base.position.set(0, 0.29, -0.15);
  base.userData.part = 'base-shell';
  const baseTop = kit.mesh('stand-mixer-base-upper-step', rounded(2.86, 0.2, 3.52, 0.09), pinkLightMaterial, basePivot, false);
  baseTop.position.set(0, 0.57, -0.12);
  baseTop.userData.explodeWithParent = true;

  const sharedFoot = rounded(0.42, 0.09, 0.4, 0.035);
  [[-1.25, 0.04, 1.42], [1.25, 0.04, 1.42], [-1.25, 0.04, -1.72], [1.25, 0.04, -1.72]].forEach(([x, y, z], i) => {
    const foot = kit.mesh(`stand-mixer-rubber-foot-${i + 1}`, sharedFoot, rubber, basePivot, false);
    foot.position.set(x, y, z);
    foot.userData.part = `foot-${i + 1}`;
  });

  const columnPivot = kit.pivot('stand-mixer-rear-column-pivot');
  columnPivot.position.set(0, 0.55, -0.78);
  const column = kit.mesh('stand-mixer-tapered-rear-column', columnGeometry(), pinkMaterial, columnPivot);
  column.userData.part = 'rear-column';
  const columnFace = kit.mesh('stand-mixer-column-front-highlight', rounded(0.72, 1.52, 0.06, 0.03), pinkLightMaterial, columnPivot, false);
  columnFace.position.set(0, 2.08, -0.035);
  columnFace.userData.explodeWithParent = true;

  const lowerDialPivot = kit.pivot('stand-mixer-lower-control-dial-pivot', columnPivot);
  lowerDialPivot.position.set(0, 0.56, -0.49);
  const lowerRing = kit.mesh('stand-mixer-lower-control-ring', new THREE.TorusGeometry(0.28, 0.065, 10, 28), pinkDarkMaterial, lowerDialPivot);
  lowerRing.userData.part = 'lower-control';
  const lowerDial = kit.mesh('stand-mixer-lower-cream-control-dial', new THREE.CylinderGeometry(0.2, 0.2, 0.08, 24), cream, lowerDialPivot, false);
  lowerDial.rotation.x = Math.PI * 0.5;
  lowerDial.position.z = 0.035;
  lowerDial.userData.explodeWithParent = true;

  const headPivot = kit.pivot('stand-mixer-motor-head-pivot');
  headPivot.position.set(0, 3.35, -1.5);
  headPivot.userData.rotationAxis = [1, 0, 0];
  kit.socket('stand-mixer-head-hinge-socket', columnPivot, [0, 2.8, -0.72]);
  const head = kit.mesh('stand-mixer-rounded-motor-head', rounded(1.82, 1.4, 3.55, 0.48), cream, headPivot);
  head.position.set(0, 0.38, 1.22);
  head.userData.part = 'motor-head-shell';
  const headHighlight = kit.mesh('stand-mixer-head-upper-highlight', rounded(1.55, 0.42, 3.28, 0.18), creamHighlight, headPivot, false);
  headHighlight.position.set(0, 0.83, 1.22);
  headHighlight.userData.explodeWithParent = true;
  const seamBand = kit.mesh('stand-mixer-continuous-pink-head-band', rounded(1.855, 0.11, 3.49, 0.04), pinkLightMaterial, headPivot, false);
  seamBand.position.set(0, -0.04, 1.22);
  seamBand.userData.part = 'head-seam-band';
  const lowerHeadRail = kit.mesh('stand-mixer-head-lower-cream-rail', rounded(1.78, 0.17, 3.39, 0.065), creamHighlight, headPivot, false);
  lowerHeadRail.position.set(0, -0.17, 1.22);
  lowerHeadRail.userData.explodeWithParent = true;

  [-1, 1].forEach((side, index) => {
    const hingePivot = kit.pivot(`stand-mixer-side-hinge-pivot-${index + 1}`);
    hingePivot.position.set(side * 0.62, 3.34, -1.48);
    const hinge = kit.mesh(`stand-mixer-side-hinge-cap-${index + 1}`, new THREE.CylinderGeometry(0.32, 0.32, 0.12, 28), pinkMaterial, hingePivot);
    hinge.rotation.z = Math.PI * 0.5;
    hinge.userData.part = `side-hinge-${index + 1}`;
    const inset = kit.mesh(`stand-mixer-side-hinge-inset-${index + 1}`, new THREE.CylinderGeometry(0.2, 0.2, 0.135, 24), pinkLightMaterial, hingePivot, false);
    inset.rotation.z = Math.PI * 0.5;
    inset.userData.explodeWithParent = true;
  });

  const speedDialPivot = kit.pivot('stand-mixer-front-speed-dial-pivot', headPivot);
  speedDialPivot.position.set(0, 0.28, 3.05);
  speedDialPivot.userData.rotationAxis = [0, 0, 1];
  kit.socket('stand-mixer-speed-control-socket', speedDialPivot, [0, 0, 0]);
  const speedOuter = kit.mesh('stand-mixer-front-speed-dial-outer-ring', new THREE.TorusGeometry(0.27, 0.05, 10, 28), pinkDarkMaterial, speedDialPivot);
  speedOuter.userData.part = 'speed-dial';
  const speedDial = kit.mesh('stand-mixer-front-speed-dial', new THREE.CylinderGeometry(0.21, 0.21, 0.11, 28), pinkLightMaterial, speedDialPivot, false);
  speedDial.rotation.x = Math.PI * 0.5;
  speedDial.position.z = 0.025;
  speedDial.userData.explodeWithParent = true;
  const dialMarker = kit.mesh('stand-mixer-speed-dial-index', rounded(0.035, 0.13, 0.02, 0.008), cavity, speedDialPivot, false);
  dialMarker.position.set(0, 0.08, 0.1);
  dialMarker.userData.explodeWithParent = true;

  const releasePivot = kit.pivot('stand-mixer-head-release-lever-pivot', headPivot);
  releasePivot.position.set(-0.98, -0.2, -0.05);
  releasePivot.userData.rotationAxis = [1, 0, 0];
  const release = kit.mesh('stand-mixer-stepped-head-release-lever', rounded(0.18, 0.18, 0.42, 0.07), pinkLightMaterial, releasePivot);
  release.position.z = 0.09;
  release.userData.part = 'head-release-lever';

  const rearVentPanel = kit.mesh('stand-mixer-arched-rear-vent-panel', rounded(0.82, 0.62, 0.04, 0.19), creamHighlight, headPivot, false);
  rearVentPanel.position.set(0, 0.2, -0.58);
  rearVentPanel.userData.part = 'rear-vent-panel';
  const ventGeometry = rounded(0.055, 0.31, 0.05, 0.024);
  for (let i = 0; i < 8; i += 1) {
    const vent = kit.mesh(`stand-mixer-rear-vent-slot-${i + 1}`, ventGeometry, cavity, headPivot, false);
    const x = (i - 3.5) * 0.095;
    vent.position.set(x, 0.21 - Math.abs(i - 3.5) * 0.012, -0.62);
    vent.userData.part = `rear-vent-slot-${i + 1}`;
  }

  const planetaryPivot = kit.pivot('stand-mixer-planetary-pivot', headPivot);
  planetaryPivot.position.set(0, -0.22, 1.9);
  planetaryPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('stand-mixer-tool-drive-socket', planetaryPivot, [0, -0.04, 0]);
  const hub = kit.mesh('stand-mixer-stepped-planetary-hub', new THREE.CylinderGeometry(0.34, 0.38, 0.28, 28), cream, planetaryPivot);
  hub.userData.part = 'planetary-hub';
  const hubStep = kit.mesh('stand-mixer-planetary-hub-lower-step', new THREE.CylinderGeometry(0.25, 0.29, 0.19, 24), creamHighlight, planetaryPivot, false);
  hubStep.position.y = -0.21;
  hubStep.userData.explodeWithParent = true;

  const beaterPivot = kit.pivot('stand-mixer-beater-spin-pivot', planetaryPivot);
  beaterPivot.position.set(0.12, -0.31, 0);
  beaterPivot.userData.rotationAxis = [0, 1, 0];
  beaterPivot.userData.attachment = {
    parentId: 'stand-mixer-planetary-pivot',
    parentSocket: 'stand-mixer-tool-drive-socket',
    localStart: [0.12, -0.31, 0],
    localEnd: [0.12, -1.79, 0],
    contactType: 'socket',
    overlap: 0.08,
    gapTolerance: 0.01,
  };
  const beaterShaft = kit.mesh('stand-mixer-beater-shaft', new THREE.CylinderGeometry(0.075, 0.075, 0.34, 16), steel, beaterPivot);
  beaterShaft.position.y = -0.15;
  beaterShaft.userData.part = 'beater-shaft';
  const collar = kit.mesh('stand-mixer-beater-collar', new THREE.CylinderGeometry(0.2, 0.18, 0.18, 20), cream, beaterPivot);
  collar.position.y = -0.34;
  collar.userData.part = 'beater-collar';
  for (let i = 0; i < 6; i += 1) {
    const wire = kit.mesh(`stand-mixer-whisk-wire-${i + 1}`, new THREE.TubeGeometry(whiskWireCurve(i * Math.PI / 3), 18, 0.026, 6, false), steel, beaterPivot);
    wire.position.y = -0.4;
    wire.userData.part = `whisk-wire-${i + 1}`;
  }
  const whiskRing = kit.mesh('stand-mixer-whisk-lower-ring', new THREE.TorusGeometry(0.14, 0.03, 6, 20), steel, beaterPivot, false);
  whiskRing.rotation.x = Math.PI * 0.5;
  whiskRing.position.y = -1.48;
  whiskRing.userData.explodeWithParent = true;

  const bowlLockPivot = kit.pivot('stand-mixer-bowl-lock-plate-pivot', basePivot);
  bowlLockPivot.position.set(0, 0.67, 0.43);
  kit.socket('stand-mixer-bowl-seat-socket', basePivot, [0, 0.66, 0.43]);
  const bowlSeat = kit.mesh('stand-mixer-raised-pink-bowl-seat', new THREE.CylinderGeometry(0.91, 0.96, 0.2, 36), pinkLightMaterial, bowlLockPivot);
  bowlSeat.position.y = 0.04;
  bowlSeat.userData.part = 'bowl-seat';
  for (let index = 0; index < 3; index += 1) {
    const angle = index * Math.PI * 2 / 3 + Math.PI * 0.5;
    const lug = kit.mesh(
      `stand-mixer-bowl-locking-lug-${index + 1}`,
      rounded(0.3, 0.09, 0.16, 0.035),
      pinkDarkMaterial,
      bowlLockPivot,
      false,
    );
    lug.position.set(Math.cos(angle) * 0.84, 0.16, Math.sin(angle) * 0.84);
    lug.rotation.y = -angle;
    lug.userData.part = `bowl-locking-lug-${index + 1}`;
  }

  // The lock plate stays fixed to the base. Only this bowl assembly pivot is
  // allowed to shake, so the performance reads as a captured bowl fighting
  // the drive rather than the whole machine coming loose.
  const bowlPivot = kit.pivot('stand-mixer-bowl-pivot');
  bowlPivot.position.set(0, 0.67, 0.43);
  bowlPivot.userData.attachment = {
    parentId: 'stand-mixer-bowl-lock-plate-pivot',
    parentSocket: 'stand-mixer-bowl-seat-socket',
    localStart: [0, 0, 0],
    localEnd: [0, 1.56, 0],
    contactType: 'socket',
    overlap: 0.12,
    gapTolerance: 0.015,
  };
  const bowl = kit.mesh('stand-mixer-deep-mixing-bowl', bowlGeometry(), cream, bowlPivot);
  bowl.position.y = 0.12;
  bowl.userData.part = 'mixing-bowl';
  const rim = kit.mesh('stand-mixer-rolled-bowl-rim', new THREE.TorusGeometry(1.11, 0.065, 10, 48), creamHighlight, bowlPivot, false);
  rim.rotation.x = Math.PI * 0.5;
  rim.position.y = 1.56;
  rim.userData.part = 'bowl-rim';
  [Math.PI * 0.75, Math.PI * 1.75].forEach((angle, i) => {
    const handle = kit.mesh(`stand-mixer-bowl-handle-${i + 1}`, new THREE.TubeGeometry(handleCurve(angle), 18, 0.095, 8, false), creamHighlight, bowlPivot);
    handle.position.y = 0.18;
    handle.userData.part = `bowl-handle-${i + 1}`;
  });

  const mixturePivot = kit.pivot('stand-mixer-mixture-pivot', bowlPivot);
  mixturePivot.position.y = 1.43;
  const mixtureSurface = kit.mesh('stand-mixer-visible-mixture-surface', vortexVolumeGeometry(), mixture, mixturePivot, false);
  mixtureSurface.userData.part = 'mixture-surface';
  mixtureSurface.userData.performanceProp = 'closed-volumetric-mixture-vortex';
  mixtureSurface.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];

  for (let index = 0; index < 3; index += 1) {
    const ridge = kit.mesh(
      `stand-mixer-mixture-wave-ridge-${index + 1}`,
      irregularLiquidRingGeometry(index),
      index === 2 ? eggMixture : creamMixture,
      mixturePivot,
      false,
    );
    ridge.position.y = 0.035 + index * 0.012;
    ridge.visible = false;
    ridge.userData.performanceEffect = true;
    ridge.userData.effectKind = 'volumetric-wave-ridge';
    ridge.userData.explodeWithParent = true;
  }

  const peak = kit.mesh(
    'stand-mixer-whipped-cream-settle-peak',
    creamPeakGeometry(),
    creamMixture,
    mixturePivot,
    false,
  );
  peak.position.set(0.08, -0.03, -0.03);
  peak.visible = false;
  peak.userData.performanceEffect = true;
  peak.userData.effectKind = 'settle-peak';
  peak.userData.explodeWithParent = true;

  const liquidEffectsPivot = kit.pivot('stand-mixer-volumetric-liquid-effects-pivot', bowlPivot);
  liquidEffectsPivot.position.y = 1.49;
  kit.socket('stand-mixer-liquid-effect-socket', liquidEffectsPivot, [0, 0, 0]);

  for (let index = 0; index < 7; index += 1) {
    const arc = kit.mesh(
      `stand-mixer-liquid-pull-arc-${index + 1}`,
      liquidArcGeometry(index),
      index % 3 === 0 ? eggMixture : creamMixture,
      liquidEffectsPivot,
      false,
    );
    const angle = index / 7 * Math.PI * 2;
    arc.position.set(Math.cos(angle) * 0.42, 0, Math.sin(angle) * 0.42);
    arc.rotation.y = -angle;
    arc.visible = false;
    arc.userData.performanceEffect = true;
    arc.userData.effectKind = 'volumetric-pull-arc';
    arc.userData.launchAngle = angle;
    arc.userData.explodeWithParent = true;
  }

  for (let index = 0; index < 9; index += 1) {
    const dollop = kit.mesh(
      `stand-mixer-volumetric-cream-dollop-${index + 1}`,
      new THREE.DodecahedronGeometry(0.16 + (index % 3) * 0.025, 1),
      index % 4 === 0 ? eggMixture : creamMixture,
      liquidEffectsPivot,
      false,
    );
    dollop.scale.set(1.05 + (index % 2) * 0.24, 0.8 + (index % 3) * 0.16, 0.9);
    dollop.visible = false;
    dollop.userData.performanceEffect = true;
    dollop.userData.effectKind = 'airborne-volume';
    dollop.userData.launchAngle = index / 9 * Math.PI * 2 + 0.24;
    dollop.userData.explodeWithParent = true;
  }

  for (let index = 0; index < 16; index += 1) {
    const drop = kit.mesh(
      `stand-mixer-volumetric-liquid-droplet-${index + 1}`,
      liquidDropGeometry(index),
      index % 5 === 0 ? eggMixture : creamMixture,
      liquidEffectsPivot,
      false,
    );
    drop.visible = false;
    drop.userData.performanceEffect = true;
    drop.userData.effectKind = 'airborne-droplet';
    drop.userData.launchAngle = index / 16 * Math.PI * 2 + 0.12;
    drop.userData.explodeWithParent = true;
  }

  kit.socket('stand-mixer-power-cable-socket', columnPivot, [0.48, 0.3, -0.43]);
  kit.indicator([0.62, 3.2, 1.5], 0.035);

  const build = kit.finish({
    referencePath: options.referencePath ?? REFERENCE_PATH,
    reconstructed: [
      'wide stepped pink base, four feet and raised circular bowl seat',
      'deep cream lathed bowl with rolled rim and two U handles',
      'tapered pink rear column with lower concentric control',
      'long cream rounded motor head with pink seam band and front layered dial',
      'mirrored side hinge caps, stepped release lever and eight rear vent slots',
      'stepped planetary hub, offset beater shaft and six curved metal whisk wires',
      'fixed three-lug bowl lock plate separated from the animated bowl assembly',
      'closed vortex volume, three wave ridges, a cream peak, pull arcs, dollops and droplets',
      'independent head, controls, planetary drive, bowl and mixture pivots with runtime sockets',
    ],
    inferred: [
      'internal motor, reduction gears and planetary transmission are hidden and omitted',
      'underside cable routing is not visible',
      'head hinge stop and tilt amplitude are inferred from typical mixer operation',
      'rear cable connection location and mixture motion are purpose-driven inferences',
    ],
  });

  applyStandMixerOutlineHierarchy(build.root);
  build.root.userData.visualRevision = 'sakura-stand-mixer-v2';
  build.root.userData.legacyReferencePath = 'references/intake/stand-mixer/front.png';
  build.root.userData.previewLightingProfile = 'sakura-appliance-v2';
  build.root.userData.outlineContract = {
    main: 0.0048,
    structure: 0.0041,
    detail: 0.0033,
    variation: 0.18,
    stable: true,
  };

  build.root.userData.referenceDimensions = { totalWidth: 3.08, totalHeight: 4.5, totalDepth: 3.8, headSize: [1.82, 1.4, 3.55], bowlDiameter: 2.28, bowlHeight: 1.43, hingeAxisHeight: 3.35 };
  build.root.userData.sculptRuntime.colliders = [
    { id: 'stand-mixer-base', type: 'box', node: 'stand-mixer-stepped-base-shell' },
    { id: 'stand-mixer-column', type: 'box', node: 'stand-mixer-tapered-rear-column' },
    { id: 'stand-mixer-head', type: 'box', node: 'stand-mixer-rounded-motor-head' },
    { id: 'stand-mixer-bowl', type: 'cylinder', node: 'stand-mixer-deep-mixing-bowl', trigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    ['stand-mixer-stepped-base-shell', 'stand-mixer-tapered-rear-column'],
    ['stand-mixer-rounded-motor-head', 'stand-mixer-continuous-pink-head-band'],
    ['stand-mixer-raised-pink-bowl-seat', 'stand-mixer-bowl-locking-lug-1', 'stand-mixer-bowl-locking-lug-2', 'stand-mixer-bowl-locking-lug-3'],
    ['stand-mixer-deep-mixing-bowl', 'stand-mixer-rolled-bowl-rim', 'stand-mixer-bowl-handle-1', 'stand-mixer-bowl-handle-2'],
    ['stand-mixer-stepped-planetary-hub', 'stand-mixer-beater-shaft', 'stand-mixer-whisk-lower-ring'],
  ];
  build.root.userData.standMixerPerformanceRig = {
    timelineOwner: 'AppliancePerformanceSystem',
    effectOwner: 'stand-mixer-model-rig',
    planetaryMechanism: 'offset beater spins on its own axis while the carrier orbits the bowl',
    bowlConstraint: 'bowl pivots against a fixed three-lug lock plate',
    liquidForms: ['closed vortex volume', 'irregular tube wave ridges', 'thick pull arcs', 'large low-poly dollops', 'lathed droplets', 'settle peak'],
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  };
  applyStandMixerOutlineHierarchy(build.root);
  return build;
}
