import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月3日 16_17_49 (7).png';

type CapsuleToyKind = 'star' | 'flower' | 'key' | 'bear';

function tone(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function pedestalGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(1.02, -0.72),
    new THREE.Vector2(1.06, -0.62),
    new THREE.Vector2(1.01, -0.48),
    new THREE.Vector2(0.94, 0.24),
    new THREE.Vector2(0.88, 0.64),
    new THREE.Vector2(0.82, 0.72),
  ];
  return new THREE.LatheGeometry(points, 36);
}

function lidDomeGeometry(): THREE.SphereGeometry {
  const geometry = new THREE.SphereGeometry(1.01, 36, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
  geometry.scale(1, 0.41, 0.84);
  return geometry;
}

function chuteFrameGeometry(): THREE.ExtrudeGeometry {
  const outer = new THREE.Shape();
  outer.moveTo(-0.42, -0.32);
  outer.lineTo(-0.42, 0.08);
  outer.bezierCurveTo(-0.42, 0.38, -0.28, 0.52, 0, 0.52);
  outer.bezierCurveTo(0.28, 0.52, 0.42, 0.38, 0.42, 0.08);
  outer.lineTo(0.42, -0.32);
  outer.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-0.28, -0.2);
  hole.lineTo(-0.28, 0.06);
  hole.bezierCurveTo(-0.28, 0.27, -0.18, 0.36, 0, 0.36);
  hole.bezierCurveTo(0.18, 0.36, 0.28, 0.27, 0.28, 0.06);
  hole.lineTo(0.28, -0.2);
  hole.closePath();
  outer.holes.push(hole);
  return new THREE.ExtrudeGeometry(outer, {
    depth: 0.13,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.035,
    bevelThickness: 0.025,
    curveSegments: 16,
  });
}

function tube(points: readonly THREE.Vector3[], radius: number): THREE.TubeGeometry {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([...points], false, 'centripetal'),
    20,
    radius,
    9,
    false,
  );
}

function capsuleToyShape(kind: CapsuleToyKind): THREE.Shape {
  const shape = new THREE.Shape();
  if (kind === 'star') {
    for (let index = 0; index < 10; index += 1) {
      const angle = Math.PI * 0.5 + index * Math.PI / 5;
      const radius = index % 2 === 0 ? 1 : 0.45;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }
  if (kind === 'flower') {
    for (let index = 0; index < 24; index += 1) {
      const angle = index * Math.PI / 12;
      const radius = 0.67 + Math.cos(angle * 6) * 0.27;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }
  if (kind === 'key') {
    shape.absarc(-0.42, 0.3, 0.46, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(-0.42, 0.3, 0.19, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    shape.moveTo(-0.1, 0.12);
    shape.lineTo(0.86, -0.84);
    shape.lineTo(1.04, -0.66);
    shape.lineTo(0.82, -0.44);
    shape.lineTo(1.04, -0.22);
    shape.lineTo(0.83, -0.01);
    shape.lineTo(-0.02, 0.28);
    shape.closePath();
    return shape;
  }
  shape.moveTo(-0.82, 0.34);
  shape.bezierCurveTo(-1.02, 0.74, -0.66, 1.02, -0.36, 0.72);
  shape.bezierCurveTo(-0.13, 0.85, 0.13, 0.85, 0.36, 0.72);
  shape.bezierCurveTo(0.66, 1.02, 1.02, 0.74, 0.82, 0.34);
  shape.bezierCurveTo(1.02, -0.3, 0.6, -0.91, 0, -0.96);
  shape.bezierCurveTo(-0.6, -0.91, -1.02, -0.3, -0.82, 0.34);
  shape.closePath();
  return shape;
}

function capsuleToyGeometry(kind: CapsuleToyKind): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(capsuleToyShape(kind), {
    // Keep the prize chunky enough to read as a real object through the globe
    // from oblique/side views instead of collapsing into a flat decal.
    depth: 0.38,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.07,
    bevelThickness: 0.06,
    curveSegments: 10,
  });
  geometry.center();
  geometry.scale(0.112, 0.112, 0.112);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function outputCapsuleShellGeometry(half: 'upper' | 'lower'): THREE.SphereGeometry {
  // The dispensed prize opens as two vertical hemispheres: a clear upper cap
  // and one complete pastel lower bowl. The previous azimuth + polar split
  // produced four quarter shells, which read as broken fragments on landing.
  const thetaStart = half === 'upper' ? 0 : Math.PI * 0.5;
  const geometry = new THREE.SphereGeometry(
    0.285,
    18,
    10,
    0,
    Math.PI * 2,
    thetaStart,
    Math.PI * 0.5,
  );
  return geometry;
}

function successStarGeometry(): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(capsuleToyShape('star'), {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.08,
    bevelThickness: 0.055,
    curveSegments: 2,
  });
  geometry.center();
  geometry.scale(0.16, 0.16, 0.16);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Procedural reconstruction of the supplied three-view capsule toy machine.
 * Local frame: +Y up, +Z front, floor at Y=0. Every serviceable or moving
 * assembly is named independently; hidden gearing and the underside remain
 * explicitly inferred rather than represented as observed geometry.
 */
export function createGumballMachineModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = tone(options.accent, 0.19, -0.07);
  const accentMid = tone(options.accent, 0.05, -0.03);
  const accentDark = tone(options.accent, -0.13, 0.02);

  const cream = kit.material(0xf6eede, { tint: 0x796f82 });
  const creamLight = kit.material(0xfff8ea, { tint: 0x81768a });
  const accent = kit.material(accentMid, { tint: 0x705f75 });
  const accentSoft = kit.material(accentLight, { tint: 0x78677c });
  const accentDeep = kit.material(accentDark, { tint: 0x594b61 });
  const cavity = kit.material(0x704e52, { tint: 0x453945 });
  const rubber = kit.material(0x9b6676, { tint: 0x50424f });
  const globe = kit.material(0xf7faf9, {
    tint: 0x8291a0,
    transparent: true,
    opacity: 0.22,
  });
  globe.depthWrite = false;
  const capsuleClear = kit.material(0xffffff, {
    tint: 0x9ab4c0,
    transparent: true,
    opacity: 0.34,
  });
  capsuleClear.depthWrite = false;
  const globeOutline = kit.material(0x78808c, {
    tint: 0x505463,
    transparent: true,
    opacity: 0.48,
  });
  globeOutline.depthWrite = false;
  const capsulePalette = [0x9dd6e8, 0xeca6b7, 0xf2cf79, 0x9ed3b9].map((color) => (
    kit.material(color, { tint: 0x6f687c })
  ));
  const toyPalette = [0xe5697f, 0x8a6fc2, 0xe7a647, 0x5fa991].map((color) => (
    kit.material(color, { tint: 0x55495f })
  ));
  const toyKinds: readonly CapsuleToyKind[] = ['star', 'flower', 'key', 'bear'];
  const toyGeometries = new Map<CapsuleToyKind, THREE.ExtrudeGeometry>(
    toyKinds.map((kind) => [kind, capsuleToyGeometry(kind)]),
  );
  const successStar = successStarGeometry();
  const successGlow = kit.material(0xffe7a6, { tint: 0x806075, emissive: 0xff8d5f });
  const statusMaterial = kit.indicatorMaterial;

  // Blockout: the two silhouette-defining masses are a broad globe and an
  // upward-tapered pedestal. The pedestal is a real surface of revolution,
  // not a straight cylinder or a stack of boxes.
  const motionPivot = kit.pivot('gumball-machine-motion-pivot');
  motionPivot.userData.performanceRoot = true;
  const basePivot = kit.pivot('gumball-machine-base-pivot', motionPivot);
  basePivot.position.y = 0.8;
  const baseShell = kit.mesh(
    'gumball-machine-rounded-frustum-base-shell',
    pedestalGeometry(),
    cream,
    basePivot,
  );
  baseShell.scale.z = 0.79;
  baseShell.userData.part = 'base-shell';

  const globePivot = kit.pivot('gumball-machine-globe-assembly-pivot', motionPivot);
  globePivot.position.y = 2.42;
  const globeShell = kit.mesh(
    'gumball-machine-transparent-globe-shell',
    new THREE.SphereGeometry(1.38, 40, 24),
    globe,
    globePivot,
    false,
  );
  // Only the transparent vessel grows. It bulges well beyond the original
  // lid/seat rings, then intersects their smaller openings to form a physical
  // neck at both ends instead of enlarging the pink hardware with it.
  globeShell.scale.set(1.08, 1.0, 0.9);
  globeShell.renderOrder = 6;
  globeShell.userData.part = 'globe-shell';
  const frontContour = kit.mesh(
    'gumball-machine-globe-front-silhouette-contour',
    new THREE.TorusGeometry(1.49, 0.009, 4, 64),
    globeOutline,
    globePivot,
    false,
  );
  frontContour.scale.y = 0.926;
  frontContour.renderOrder = 7;
  frontContour.userData.explodeWithParent = true;
  const sideContour = kit.mesh(
    'gumball-machine-globe-side-silhouette-contour',
    new THREE.TorusGeometry(1.38, 0.009, 4, 64),
    globeOutline,
    globePivot,
    false,
  );
  sideContour.rotation.y = Math.PI * 0.5;
  sideContour.scale.set(0.9, 1.0, 1);
  sideContour.renderOrder = 7;
  sideContour.userData.explodeWithParent = true;

  const topLidPivot = kit.pivot('gumball-machine-top-lid-pivot', globePivot);
  topLidPivot.position.y = 1.03;
  kit.socket('gumball-machine-lid-service-socket', topLidPivot, [0, 0, 0]);
  const lidDome = kit.mesh(
    'gumball-machine-domed-top-lid',
    lidDomeGeometry(),
    accent,
    topLidPivot,
  );
  lidDome.userData.part = 'top-lid';
  const lidRim = kit.mesh(
    'gumball-machine-wide-top-lid-rim',
    new THREE.TorusGeometry(1.02, 0.075, 8, 36),
    accentDeep,
    topLidPivot,
  );
  lidRim.rotation.x = Math.PI * 0.5;
  lidRim.userData.explodeWithParent = true;
  const crown = kit.mesh(
    'gumball-machine-cream-lid-crown',
    new THREE.CylinderGeometry(0.16, 0.18, 0.16, 18),
    creamLight,
    topLidPivot,
  );
  crown.position.y = 0.47;
  crown.userData.explodeWithParent = true;

  const lowerRing = kit.mesh(
    'gumball-machine-globe-seat-ring',
    new THREE.TorusGeometry(1.02, 0.075, 8, 36),
    accentDeep,
    globePivot,
  );
  lowerRing.rotation.x = Math.PI * 0.5;
  lowerRing.position.y = -1.03;
  lowerRing.userData.part = 'globe-seat-ring';
  const lowerRingHighlight = kit.mesh(
    'gumball-machine-globe-seat-upper-lip',
    new THREE.TorusGeometry(0.99, 0.034, 6, 36),
    accentSoft,
    globePivot,
    false,
  );
  lowerRingHighlight.rotation.x = Math.PI * 0.5;
  lowerRingHighlight.position.y = -0.97;
  lowerRingHighlight.userData.explodeWithParent = true;

  const centerColumn = kit.mesh(
    'gumball-machine-internal-center-column',
    new RoundedBoxGeometry(0.12, 1.34, 0.12, 3, 0.035),
    accent,
    globePivot,
  );
  centerColumn.position.set(0, 0.17, -0.2);
  centerColumn.userData.part = 'center-column';
  const dividerHub = kit.mesh(
    'gumball-machine-inferred-divider-hub',
    new THREE.CylinderGeometry(0.21, 0.23, 0.09, 18),
    accentDeep,
    globePivot,
  );
  dividerHub.position.set(0, -0.55, -0.04);
  dividerHub.userData.part = 'inferred-divider-hub';

  // Structure/form: each capsule is a group containing a clear upper
  // hemisphere, colored lower hemisphere and a thin equator seam. Deterministic
  // packing preserves browser performance and keeps powered motion repeatable.
  const capsuleData: Array<[number, number, number, number, number, number]> = [
    [-0.6, -0.42, 0.08, 0.1, 0.2, 0],
    [-0.28, -0.52, 0.35, -0.2, 0.12, 1],
    [0.08, -0.52, 0.38, 0.16, -0.2, 2],
    [0.45, -0.47, 0.23, -0.18, 0.18, 3],
    [0.63, -0.36, -0.14, 0.22, -0.14, 0],
    [-0.49, -0.25, -0.28, -0.12, 0.17, 3],
    [-0.13, -0.26, -0.12, 0.24, -0.22, 0],
    [0.28, -0.3, -0.22, -0.18, -0.12, 1],
    [0.54, -0.1, 0.05, 0.12, 0.26, 2],
    [-0.38, -0.03, 0.04, -0.16, 0.12, 1],
    [0.3, -0.23, 0.12, 0.18, -0.16, 2],
    [-0.72, -0.12, 0.34, 0.14, -0.16, 3],
    [0.69, -0.08, 0.34, -0.2, 0.15, 0],
    [-0.58, 0.14, -0.04, 0.18, 0.12, 2],
    [-0.08, 0.22, 0.2, -0.1, -0.18, 3],
    [0.38, 0.18, -0.2, 0.16, 0.19, 1],
    [0.03, 0.43, 0.03, -0.14, 0.1, 0],
  ];
  capsuleData.forEach(([x, y, z, rx, rz, palette], index) => {
    const capsulePivot = kit.pivot(`gumball-machine-capsule-${index + 1}-pivot`, globePivot);
    capsulePivot.position.set(x * 1.4, y * 1.5 + 0.08, z * 1.3);
    capsulePivot.rotation.set(rx, index * 0.37, rz);
    const upper = kit.mesh(
      `gumball-machine-capsule-${index + 1}-clear-upper-shell`,
      new THREE.SphereGeometry(0.255, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      capsuleClear,
      capsulePivot,
      false,
    );
    upper.renderOrder = 3;
    upper.userData.explodeWithParent = true;
    const lower = kit.mesh(
      `gumball-machine-capsule-${index + 1}-pastel-lower-shell`,
      new THREE.SphereGeometry(0.255, 18, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
      capsulePalette[palette],
      capsulePivot,
    );
    lower.userData.explodeWithParent = true;
    const seam = kit.mesh(
      `gumball-machine-capsule-${index + 1}-equator-seam`,
      new THREE.TorusGeometry(0.253, 0.018, 5, 18),
      accentSoft,
      capsulePivot,
      false,
    );
    seam.rotation.x = Math.PI * 0.5;
    seam.userData.explodeWithParent = true;
    const toyKind = toyKinds[index % toyKinds.length];
    // Counter most of the capsule yaw so every prize keeps a readable face,
    // then retain a small deterministic angle so the packed contents do not
    // look like identical front-facing stickers.
    const toyYaw = (((index * 2) % 5) - 2) * 0.1;
    const toyPivot = kit.pivot(`gumball-machine-capsule-${index + 1}-prize-pivot`, capsulePivot);
    toyPivot.position.set(0, 0.072, 0.018);
    toyPivot.rotation.set(-rx * 0.3, -index * 0.37 + toyYaw, -rz * 0.3);
    toyPivot.userData.capsulePrize = true;
    toyPivot.userData.capsuleIndex = index + 1;
    toyPivot.userData.prizeKind = toyKind;
    const toy = kit.mesh(
      `gumball-machine-capsule-${index + 1}-${toyKind}-prize`,
      toyGeometries.get(toyKind)!,
      toyPalette[index % toyPalette.length],
      toyPivot,
      false,
    );
    const toyScale = toyKind === 'key' ? 0.98 : toyKind === 'star' ? 1.07 : 1.12;
    toy.scale.setScalar(toyScale);
    toy.renderOrder = 2;
    toy.userData.part = `capsule-${index + 1}-${toyKind}-prize`;
    toy.userData.capsulePrize = true;
    toy.userData.capsuleIndex = index + 1;
    toy.userData.prizeKind = toyKind;
    toy.userData.explodeWithParent = true;
  });

  // Bottom ring and feet remain separate for rear/side orbit and assembly
  // review. The dark rear notch is a contained cable outlet, not a decal.
  const baseRing = kit.mesh(
    'gumball-machine-pink-lower-base-ring',
    new THREE.CylinderGeometry(1.065, 1.075, 0.2, 36),
    accent,
    basePivot,
  );
  baseRing.scale.z = 0.79;
  baseRing.position.y = -0.69;
  baseRing.userData.part = 'base-ring';
  for (const [index, x, z] of [
    [1, -0.72, 0.48],
    [2, 0.72, 0.48],
    [3, -0.72, -0.48],
    [4, 0.72, -0.48],
  ] as const) {
    const foot = kit.mesh(
      `gumball-machine-foot-${index}`,
      new RoundedBoxGeometry(0.26, 0.1, 0.23, 3, 0.04),
      rubber,
      basePivot,
    );
    foot.position.set(x, -0.79, z);
    foot.userData.part = `foot-${index}`;
  }

  // Front rotary mechanism. The entire stack lives below one axle pivot so
  // the transverse handle rotates without losing contact with its bearing.
  const frontCrankPivot = kit.pivot('gumball-machine-front-crank-pivot', basePivot);
  frontCrankPivot.position.set(0, 0.22, 0.79);
  frontCrankPivot.userData.rotationAxis = [0, 0, 1];
  frontCrankPivot.userData.rotationRange = [0, Math.PI * 2];
  kit.socket('gumball-machine-front-crank-socket', frontCrankPivot, [0, 0, 0]);
  const crankSeat = kit.mesh(
    'gumball-machine-front-crank-seat',
    new THREE.CylinderGeometry(0.35, 0.38, 0.12, 24),
    accentDeep,
    frontCrankPivot,
  );
  crankSeat.rotation.x = Math.PI * 0.5;
  crankSeat.userData.part = 'front-crank';
  const crankFace = kit.mesh(
    'gumball-machine-front-crank-face',
    new THREE.CylinderGeometry(0.29, 0.31, 0.15, 24),
    accent,
    frontCrankPivot,
  );
  crankFace.rotation.x = Math.PI * 0.5;
  crankFace.position.z = 0.08;
  crankFace.userData.explodeWithParent = true;
  const gripBar = kit.mesh(
    'gumball-machine-front-crank-cross-grip',
    new THREE.CapsuleGeometry(0.065, 0.38, 6, 14),
    accent,
    frontCrankPivot,
  );
  gripBar.rotation.z = Math.PI * 0.5;
  gripBar.position.z = 0.18;
  gripBar.userData.explodeWithParent = true;
  const crankBoss = kit.mesh(
    'gumball-machine-front-crank-center-boss',
    new THREE.SphereGeometry(0.08, 12, 8),
    accentDeep,
    frontCrankPivot,
    false,
  );
  crankBoss.position.z = 0.24;
  crankBoss.userData.explodeWithParent = true;

  const frontButton = kit.mesh(
    'gumball-machine-front-round-release-button',
    new THREE.CylinderGeometry(0.13, 0.14, 0.075, 18),
    accent,
    basePivot,
  );
  frontButton.rotation.x = Math.PI * 0.5;
  frontButton.position.set(0.57, 0.43, 0.8);
  frontButton.userData.part = 'release-button';

  // Side crank: actual axle pivot + arm + spherical hand grip. The pivot is on
  // the visible +X side used by model-review's side camera.
  const sideCrankPivot = kit.pivot('gumball-machine-side-crank-pivot', basePivot);
  sideCrankPivot.position.set(1.0, 0.34, 0.02);
  sideCrankPivot.userData.rotationAxis = [1, 0, 0];
  sideCrankPivot.userData.rotationRange = [0, Math.PI * 2];
  kit.socket('gumball-machine-side-crank-axle-socket', sideCrankPivot, [0, 0, 0]);
  const sideHub = kit.mesh(
    'gumball-machine-side-crank-hub',
    new THREE.CylinderGeometry(0.17, 0.19, 0.12, 18),
    accentDeep,
    sideCrankPivot,
  );
  sideHub.rotation.z = Math.PI * 0.5;
  sideHub.userData.part = 'side-crank';
  const sideArm = kit.mesh(
    'gumball-machine-side-crank-arm',
    tube([
      new THREE.Vector3(0.08, 0, 0),
      new THREE.Vector3(0.13, -0.18, 0.05),
      new THREE.Vector3(0.13, -0.39, 0.16),
    ], 0.035),
    accent,
    sideCrankPivot,
  );
  sideArm.userData.explodeWithParent = true;
  const sideGrip = kit.mesh(
    'gumball-machine-side-crank-ball-grip',
    new THREE.SphereGeometry(0.16, 16, 10),
    accentSoft,
    sideCrankPivot,
  );
  sideGrip.position.set(0.13, -0.39, 0.16);
  sideGrip.userData.explodeWithParent = true;
  kit.socket('gumball-machine-side-crank-grip-socket', sideCrankPivot, [0.13, -0.39, 0.16]);

  // Real arched negative-space frame, deep cavity and projecting tray. Their
  // depth order leaves room for the emerging animated capsule.
  const chutePivot = kit.pivot('gumball-machine-dispense-chute-pivot', basePivot);
  chutePivot.position.set(0, -0.34, 0.77);
  const chuteBack = kit.mesh(
    'gumball-machine-deep-arched-dispense-cavity',
    new RoundedBoxGeometry(0.6, 0.48, 0.12, 4, 0.18),
    cavity,
    chutePivot,
  );
  chuteBack.position.set(0, 0.07, 0.06);
  chuteBack.userData.part = 'dispense-cavity';
  const chuteFrame = kit.mesh(
    'gumball-machine-pink-arched-dispense-frame',
    chuteFrameGeometry(),
    accent,
    chutePivot,
  );
  chuteFrame.position.set(0, 0, 0.08);
  chuteFrame.userData.part = 'dispense-frame';
  const tray = kit.mesh(
    'gumball-machine-protruding-dispense-tray',
    new RoundedBoxGeometry(0.68, 0.15, 0.5, 4, 0.07),
    accent,
    chutePivot,
  );
  tray.position.set(0, -0.28, 0.28);
  tray.userData.part = 'dispense-tray';
  kit.socket('gumball-machine-dispense-socket', chutePivot, [0, 0.08, 0.24]);
  kit.socket('gumball-machine-dispense-tray-rest-socket', chutePivot, [0, -0.2, 0.35]);

  // Rear evidence: shallow rounded service panel and a contained lower cable
  // outlet. Interior latches, gear train and underside screws are not visible.
  const rearPanel = kit.mesh(
    'gumball-machine-rear-rounded-service-panel',
    new RoundedBoxGeometry(0.7, 0.62, 0.045, 4, 0.09),
    creamLight,
    basePivot,
    false,
  );
  rearPanel.position.set(0, 0.1, -0.73);
  rearPanel.userData.part = 'rear-service-panel';
  const rearPanelSeam = kit.mesh(
    'gumball-machine-rear-service-panel-seam',
    new RoundedBoxGeometry(0.73, 0.65, 0.018, 4, 0.1),
    accentDeep,
    basePivot,
    false,
  );
  rearPanelSeam.position.set(0, 0.1, -0.69);
  rearPanelSeam.userData.explodeWithParent = true;
  const rearNotch = kit.mesh(
    'gumball-machine-rear-cable-notch',
    new THREE.CylinderGeometry(0.16, 0.16, 0.1, 18, 1, false, 0, Math.PI),
    cavity,
    basePivot,
    false,
  );
  rearNotch.rotation.x = Math.PI * 0.5;
  rearNotch.position.set(0, -0.7, -0.68);
  rearNotch.userData.part = 'rear-cable-notch';
  kit.socket('gumball-machine-power-cable-socket', rearNotch, [0, 0, -0.08]);

  const indicator = kit.mesh(
    'gumball-machine-purpose-status-indicator',
    new THREE.SphereGeometry(0.045, 10, 7),
    statusMaterial,
    basePivot,
    false,
  );
  indicator.position.set(0.57, 0.25, 0.86);

  kit.socket('gumball-machine-capsule-drop-entry-socket', globePivot, [0.3, -0.23, 0.12]);

  // Model-owned result capsule. It reuses the exact clear shell, pastel lower
  // shell, seam and prize materials used inside the globe; the timeline swaps
  // visibility at the chute so a generic duplicate can never overlap it.
  const outputPivot = kit.pivot('gumball-machine-output-capsule-motion-pivot');
  outputPivot.visible = false;
  outputPivot.userData.performanceEffect = true;
  outputPivot.userData.effectOwner = 'gumball-machine-model-rig';
  const outputLeft = kit.pivot('gumball-machine-output-capsule-left-shell-pivot', outputPivot);
  const outputRight = kit.pivot('gumball-machine-output-capsule-right-shell-pivot', outputPivot);
  for (const [side, pivot] of [
    ['left', outputLeft],
    ['right', outputRight],
  ] as const) {
    const upper = kit.mesh(
      `gumball-machine-output-capsule-${side}-clear-upper-shell`,
      // Keep the historical left/right pivot names for the performance API;
      // geometrically they now represent upper and lower halves.
      outputCapsuleShellGeometry(side === 'left' ? 'upper' : 'lower'),
      capsuleClear,
      pivot,
      false,
    );
    upper.renderOrder = 3;
    upper.userData.explodeWithParent = true;
    if (side === 'right') {
      upper.userData.part = 'output-capsule-lower-blue-hemisphere';
      upper.material = capsulePalette[0];
    } else {
      upper.userData.part = 'output-capsule-clear-upper-hemisphere';
    }
  }
  const outputSeam = kit.mesh(
    'gumball-machine-output-capsule-equator-seam',
    new THREE.TorusGeometry(0.285, 0.018, 5, 24),
    accentSoft,
    outputPivot,
    false,
  );
  outputSeam.rotation.x = Math.PI * 0.5;
  outputSeam.userData.explodeWithParent = true;

  const outputToyPivot = kit.pivot('gumball-machine-output-prize-pivot', outputPivot);
  outputToyPivot.visible = false;
  outputToyPivot.position.set(0, 0.055, 0.02);
  outputToyPivot.rotation.set(-0.08, -0.16, 0.05);
  outputToyPivot.userData.performanceEffect = true;
  outputToyPivot.userData.prizeKind = 'flower';
  const outputToy = kit.mesh(
    'gumball-machine-output-flower-prize',
    toyGeometries.get('flower')!,
    toyPalette[1],
    outputToyPivot,
    false,
  );
  outputToy.scale.setScalar(1.12);
  outputToy.userData.part = 'output-flower-prize';
  outputToy.userData.capsulePrize = true;
  outputToy.userData.prizeKind = 'flower';
  outputToy.userData.explodeWithParent = true;

  // Exactly three chunky success bursts. They are bevelled extrusions with
  // measurable depth, not Plane/Sprite decoration.
  for (let index = 0; index < 3; index += 1) {
    const burstPivot = kit.pivot(`gumball-machine-success-burst-${index + 1}-pivot`);
    burstPivot.visible = false;
    burstPivot.userData.performanceEffect = true;
    burstPivot.userData.effectOwner = 'gumball-machine-model-rig';
    const burst = kit.mesh(
      `gumball-machine-success-burst-${index + 1}-volumetric-star`,
      successStar,
      index === 1 ? toyPalette[0] : successGlow,
      burstPivot,
      false,
    );
    burst.userData.performanceEffect = true;
    burst.userData.explodeWithParent = true;
  }

  kit.socket('gumball-machine-prize-exit-socket', chutePivot, [0, 0.08, 0.24]);
  kit.socket('gumball-machine-prize-landing-socket', kit.root, [-0.16, 0.23, 3.52]);

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'oversized transparent near-spherical globe whose 2.12-unit width nearly matches the 2.15-unit pedestal maximum, with the shell seated directly between enlarged pink lid and lower rings',
        'pink domed lid with wide rim and cream crown, double-lip lower globe seat and visible center column',
        'eleven independently grouped capsules with clear upper hemisphere, pastel lower hemisphere, equator seam and visible star, flower, key or bear prize',
        'front rotary crank with bearing seat, face, transverse grip and center boss',
        'side axle crank with curved arm and ball hand grip',
        'real-depth arched dispense cavity, separate pink frame and projecting tray',
        'rear rounded service hatch, lower cable notch, four feet and power-cable socket',
        'purpose-readable super-draw cycle: right crank full-turn/rebound, top-impact capsule frenzy, selection pause, one same-language capsule launch with two bounces and roll, split-shell opening, toy landing and three volumetric success stars',
      ],
      inferred: [
        'internal divider wheel, anti-double-feed flap and curved chute are hidden; only a collision-safe animation route and a restrained divider hub are provided',
        'side crank and front crank share a hidden gear train; the linkage is not claimed as observed',
        'rear hatch latch depth and inner service volume are concealed; a shallow molded panel is used',
        'underside fasteners, wiring and cable storage are not visible; four symmetric feet and a rear cable socket are inferred',
      ],
    },
  );

  // Publish semantic assembly groups after ApplianceModelKit creates the
  // shared runtime object. This keeps picking and explode semantics aligned.
  const runtime = build.root.userData.sculptRuntime as {
    destructionGroups: Array<{ id: string; nodes: string[] }>;
  };
  runtime.destructionGroups = [
    { id: 'globe-assembly', nodes: ['gumball-machine-transparent-globe-shell', 'gumball-machine-domed-top-lid', 'gumball-machine-globe-seat-ring'] },
    { id: 'control-assembly', nodes: ['gumball-machine-front-crank-pivot', 'gumball-machine-side-crank-pivot'] },
    { id: 'dispense-assembly', nodes: ['gumball-machine-dispense-chute-pivot'] },
    { id: 'prize-reveal-assembly', nodes: ['gumball-machine-output-capsule-motion-pivot', 'gumball-machine-output-prize-pivot'] },
    { id: 'service-assembly', nodes: ['gumball-machine-rear-rounded-service-panel', 'gumball-machine-rear-cable-notch'] },
  ];
  build.root.userData.activeDuration = 5.2;
  build.root.userData.externalPerformanceCue = {
    type: 'gumball-model-owned-prize-reveal',
    socket: 'gumball-machine-prize-exit-socket',
    climaxWindow: [2.13, 4.95],
    pooled: false,
  };
  return build;
}
