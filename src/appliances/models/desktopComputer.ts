import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import { setHullOutlineStyle } from '../../style/outline';

const REFERENCE_PATH = 'references/intake-v2/desktop-computer/views/front.png';

function shifted(color: number, lightness: number, saturation = -0.04): number {
  return new THREE.Color(color).offsetHSL(0, saturation, lightness).getHex();
}

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 0xffffffff) * Math.PI * 2;
}

function applyDesktopOutlineHierarchy(root: THREE.Object3D): void {
  const mainSilhouette = /rounded-monitor-shell|crt-tapered-rear-bell|rounded-tower-shell|rounded-keyboard-shell|cream-mouse-lower-shell|pink-mouse-upper-shell/;
  const fineDetail = /front-io-strip|rear-monitor-mount/;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.isOutline !== true) return;
    const parentName = object.parent?.name ?? object.name;
    const tier = mainSilhouette.test(parentName) ? 'main' : fineDetail.test(parentName) ? 'detail' : 'structure';
    const thickness = tier === 'main' ? 0.0048 : tier === 'structure' ? 0.0041 : 0.0033;
    setHullOutlineStyle(object, {
      thickness,
      variation: 0.18,
      phase: stableOutlinePhase(parentName),
    });
    object.userData.outlineTier = tier;
  });
}

function rounded(width: number, height: number, depth: number, radius: number, segments = 1): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, width * 0.48, height * 0.48, depth * 0.48));
}

function facetedCrtBell(
  frontWidth: number,
  frontHeight: number,
  backWidth: number,
  backHeight: number,
  depth: number,
): THREE.BufferGeometry {
  const ring = (width: number, height: number, z: number): THREE.Vector3[] => {
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    const chamfer = Math.min(width, height) * 0.13;
    return [
      new THREE.Vector3(-halfWidth + chamfer, -halfHeight, z),
      new THREE.Vector3(halfWidth - chamfer, -halfHeight, z),
      new THREE.Vector3(halfWidth, -halfHeight + chamfer, z),
      new THREE.Vector3(halfWidth, halfHeight - chamfer, z),
      new THREE.Vector3(halfWidth - chamfer, halfHeight, z),
      new THREE.Vector3(-halfWidth + chamfer, halfHeight, z),
      new THREE.Vector3(-halfWidth, halfHeight - chamfer, z),
      new THREE.Vector3(-halfWidth, -halfHeight + chamfer, z),
    ];
  };
  const front = ring(frontWidth, frontHeight, depth * 0.5);
  const back = ring(backWidth, backHeight, -depth * 0.5);
  const positions: number[] = [];
  const triangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  for (let index = 0; index < front.length; index += 1) {
    const next = (index + 1) % front.length;
    triangle(front[index], back[index], back[next]);
    triangle(front[index], back[next], front[next]);
  }
  const frontCenter = new THREE.Vector3(0, 0, depth * 0.5);
  const backCenter = new THREE.Vector3(0, 0, -depth * 0.5);
  for (let index = 0; index < front.length; index += 1) {
    const next = (index + 1) % front.length;
    triangle(frontCenter, front[index], front[next]);
    triangle(backCenter, back[next], back[index]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.topology = 'faceted-tapered-crt-bell';
  return geometry;
}

function keyboardWedge(width: number, frontHeight: number, rearHeight: number, depth: number): THREE.BufferGeometry {
  const halfWidth = width * 0.5;
  const halfDepth = depth * 0.5;
  const chamfer = Math.min(width, depth) * 0.105;
  const maxHeight = Math.max(frontHeight, rearHeight);
  const bottomY = -maxHeight * 0.5;
  const footprint = [
    new THREE.Vector2(-halfWidth + chamfer, -halfDepth),
    new THREE.Vector2(halfWidth - chamfer, -halfDepth),
    new THREE.Vector2(halfWidth, -halfDepth + chamfer),
    new THREE.Vector2(halfWidth, halfDepth - chamfer),
    new THREE.Vector2(halfWidth - chamfer, halfDepth),
    new THREE.Vector2(-halfWidth + chamfer, halfDepth),
    new THREE.Vector2(-halfWidth, halfDepth - chamfer),
    new THREE.Vector2(-halfWidth, -halfDepth + chamfer),
  ];
  const topY = (z: number): number => bottomY + THREE.MathUtils.lerp(
    rearHeight,
    frontHeight,
    THREE.MathUtils.clamp(z / depth + 0.5, 0, 1),
  );
  const bottom = footprint.map((point) => new THREE.Vector3(point.x, bottomY, point.y));
  const top = footprint.map((point) => new THREE.Vector3(point.x, topY(point.y), point.y));
  const positions: number[] = [];
  const triangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  for (let index = 0; index < footprint.length; index += 1) {
    const next = (index + 1) % footprint.length;
    triangle(bottom[index], bottom[next], top[next]);
    triangle(bottom[index], top[next], top[index]);
  }
  const bottomCenter = new THREE.Vector3(0, bottomY, 0);
  const topCenter = new THREE.Vector3(0, topY(0), 0);
  for (let index = 0; index < footprint.length; index += 1) {
    const next = (index + 1) % footprint.length;
    triangle(bottomCenter, bottom[next], bottom[index]);
    triangle(topCenter, top[index], top[next]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.topology = 'faceted-keyboard-wedge';
  return geometry;
}

function flowerGeometry(radius: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const steps = 40;
  for (let i = 0; i <= steps; i += 1) {
    const angle = i / steps * Math.PI * 2 + Math.PI * 0.5;
    const r = radius * (0.77 + Math.cos(angle * 5) * 0.23);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: depth * 0.38,
    bevelThickness: depth * 0.38,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -depth * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

function cursorGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.2);
  shape.lineTo(0, -0.2);
  shape.lineTo(0.11, -0.08);
  shape.lineTo(0.18, -0.23);
  shape.lineTo(0.25, -0.19);
  shape.lineTo(0.17, -0.04);
  shape.lineTo(0.31, -0.03);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 4);
}

function addInstanced(
  kit: ApplianceModelKit,
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  matrices: THREE.Matrix4[],
  part: string,
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.applianceId = kit.options.id;
  mesh.userData.part = part;
  matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  kit.interactiveMeshes.push(mesh);
  kit.nodes.set(name, mesh);
  return mesh;
}

function matrix(
  position: THREE.Vector3,
  rotation = new THREE.Euler(),
  scale = new THREE.Vector3(1, 1, 1),
): THREE.Matrix4 {
  return new THREE.Matrix4().compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
}

function irregularSmokeGeometry(variant: number): THREE.BufferGeometry {
  const phase = variant * 1.137;
  const lobes = Array.from({ length: 4 + variant % 3 }, (_, index) => {
    const angle = phase + index * 2.18;
    const radius = 0.16 + ((variant + index * 2) % 4) * 0.028;
    return new THREE.IcosahedronGeometry(radius, index % 2 === 0 ? 1 : 0)
      .scale(0.84 + index * 0.055, 0.9 + (index % 3) * 0.12, 0.78 + ((index + variant) % 3) * 0.1)
      .translate(
        Math.cos(angle) * (0.09 + index * 0.018),
        index * 0.105,
        Math.sin(angle) * (0.075 + index * 0.014),
      );
  });
  const normalized = lobes.map((lobe) => lobe.index ? lobe.toNonIndexed() : lobe);
  const geometry = mergeGeometries(normalized, false);
  normalized.forEach((lobe) => lobe.dispose());
  lobes.forEach((lobe, index) => {
    if (lobe !== normalized[index]) lobe.dispose();
  });
  if (!geometry) throw new Error('Unable to create desktop computer smoke volume.');
  geometry.computeVertexNormals();
  geometry.userData.performanceProp = 'desktop-computer-irregular-volumetric-smoke';
  geometry.userData.variant = variant;
  geometry.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
  return geometry;
}

export function createDesktopComputerModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const pink = shifted(options.accent, -0.03, 0.03);
  const pinkLight = shifted(options.accent, 0.13, -0.09);
  const pinkDark = shifted(options.accent, -0.11, -0.01);
  const cream = kit.material(0xf3dfc3, { tint: 0x756b82 });
  const creamHighlight = kit.material(0xffedd3, { tint: 0x827589 });
  const pinkMaterial = kit.material(pink, { tint: 0x76647a });
  const pinkLightMaterial = kit.material(pinkLight, { tint: 0x806d7e });
  const pinkDarkMaterial = kit.material(pinkDark, { tint: 0x665667 });
  const cavity = kit.material(0x574f59, { tint: 0x3d3943 });
  const screenOff = new THREE.MeshBasicMaterial({ color: 0x302f3c, toneMapped: false });
  kit.materials.add(screenOff);
  const screenBlue = kit.material(0x7bc4dc, { tint: 0x536c8b, emissive: 0x6bd5f2 });
  const screenLight = kit.material(0xdff8f7, { tint: 0x72819c, emissive: 0xc5ffff });
  const screenPink = kit.material(pinkLight, { tint: 0x806d7e, emissive: 0xffaac5 });
  const blueScreenMaterial = kit.material(0x1757b8, { tint: 0x123c7c, emissive: 0x1b62d6 });
  const blueScreenText = kit.material(0xf4f7ff, { tint: 0xb9c4d6, emissive: 0xeaf2ff });
  const rubber = kit.material(0x9e767c, { tint: 0x554b58 });
  screenBlue.emissiveIntensity = 0;
  screenLight.emissiveIntensity = 0;
  screenPink.emissiveIntensity = 0;

  const monitorPivot = kit.pivot('desktop-computer-monitor-assembly-pivot');
  monitorPivot.position.set(-1.7, 0, 0);
  const standPivot = kit.pivot('desktop-computer-monitor-stand-pivot', monitorPivot);
  const standBaseLower = kit.mesh('desktop-computer-monitor-base-lower', rounded(3.24, 0.38, 2.18, 0.17), cream, standPivot);
  standBaseLower.position.set(0, 0.3, -0.34);
  standBaseLower.userData.part = 'monitor-stand-base';
  const standBasePink = kit.mesh('desktop-computer-monitor-base-pink-step', rounded(3.0, 0.19, 1.94, 0.09), pinkMaterial, standPivot, false);
  standBasePink.position.set(0, 0.5, -0.34);
  standBasePink.userData.explodeWithParent = true;

  const columnPivot = kit.pivot('desktop-computer-monitor-column-pivot', standPivot);
  columnPivot.position.set(0, 0.5, -0.58);
  columnPivot.rotation.x = -0.06;
  columnPivot.userData.rotationAxis = [1, 0, 0];
  kit.socket('desktop-computer-monitor-hinge-socket', columnPivot, [0, 1.0, 0]);
  const column = kit.mesh('desktop-computer-leaning-pink-column', rounded(1.42, 1.1, 1.24, 0.18), pinkMaterial, columnPivot);
  column.position.y = 0.52;
  column.userData.part = 'monitor-stand-column';
  const columnInset = kit.mesh('desktop-computer-column-cream-inset', rounded(1.08, 0.72, 0.16, 0.07), creamHighlight, columnPivot, false);
  columnInset.position.set(0, 0.52, -0.66);
  columnInset.userData.explodeWithParent = true;

  const screenTiltPivot = kit.pivot('desktop-computer-screen-tilt-pivot', monitorPivot);
  screenTiltPivot.position.set(0, 3.0, 0.12);
  screenTiltPivot.userData.rotationAxis = [1, 0, 0];
  const monitorShell = kit.mesh('desktop-computer-rounded-monitor-shell', rounded(5.72, 3.5, 0.62, 0.22), cream, screenTiltPivot);
  monitorShell.position.z = -0.08;
  monitorShell.userData.part = 'monitor-shell';
  const rearShellHighlight = kit.mesh('desktop-computer-monitor-rear-highlight', rounded(5.15, 3.12, 1.58, 0.34), creamHighlight, screenTiltPivot);
  rearShellHighlight.position.z = -0.91;
  rearShellHighlight.userData.part = 'monitor-crt-belly';
  const crtBell = kit.mesh(
    'desktop-computer-crt-tapered-rear-bell',
    facetedCrtBell(4.38, 2.66, 3.68, 2.12, 1.42),
    cream,
    screenTiltPivot,
  );
  crtBell.position.z = -2.18;
  crtBell.userData.part = 'monitor-crt-rear-bell';
  const crtRearCap = kit.mesh('desktop-computer-crt-rear-service-cap', rounded(3.64, 2.14, 0.34, 0.16), pinkLightMaterial, screenTiltPivot);
  crtRearCap.position.z = -3.02;
  crtRearCap.userData.part = 'monitor-crt-rear-cap';

  for (let index = 0; index < 9; index += 1) {
    const topVent = kit.mesh(
      `desktop-computer-crt-top-vent-${index + 1}`,
      rounded(0.16, 0.065, 0.92, 0.025),
      cavity,
      screenTiltPivot,
      false,
    );
    topVent.position.set(-1.45 + index * 0.36, 1.59, -1.42);
    topVent.rotation.x = -0.03;
    topVent.userData.part = 'monitor-crt-top-vents';
  }
  [-1, 1].forEach((side) => {
    for (let index = 0; index < 6; index += 1) {
      const sideVent = kit.mesh(
        `desktop-computer-crt-side-${side < 0 ? 'left' : 'right'}-vent-${index + 1}`,
        rounded(0.07, 0.13, 0.7, 0.025),
        cavity,
        screenTiltPivot,
        false,
      );
      sideVent.position.set(side * 2.48, 0.57 - index * 0.23, -1.45);
      sideVent.rotation.z = side * 0.025;
      sideVent.userData.part = 'monitor-crt-side-vents';
    }
  });

  const bezelDepth = 0.17;
  const topBezel = kit.mesh('desktop-computer-monitor-bezel-top', rounded(5.45, 0.34, bezelDepth, 0.1), creamHighlight, screenTiltPivot);
  topBezel.position.set(0, 1.56, 0.29);
  topBezel.userData.part = 'monitor-bezel';
  const bottomBezel = kit.mesh('desktop-computer-monitor-bezel-bottom', rounded(5.45, 0.34, bezelDepth, 0.1), creamHighlight, screenTiltPivot, false);
  bottomBezel.position.set(0, -1.54, 0.29);
  bottomBezel.userData.explodeWithParent = true;
  [-1, 1].forEach((side, i) => {
    const rail = kit.mesh(`desktop-computer-monitor-bezel-side-${i + 1}`, rounded(0.34, 3.08, bezelDepth, 0.1), creamHighlight, screenTiltPivot, false);
    rail.position.set(side * 2.59, 0, 0.29);
    rail.userData.explodeWithParent = true;
  });
  const screen = kit.mesh('desktop-computer-recessed-screen-glass', rounded(5.12, 2.96, 0.07, 0.11), screenOff, screenTiltPivot, false);
  screen.position.z = 0.295;
  screen.userData.part = 'screen-panel';
  const innerFrameParts = [
    ['top', 5.22, 0.14, 0, 1.48],
    ['bottom', 5.22, 0.14, 0, -1.48],
    ['left', 0.14, 2.88, -2.51, 0],
    ['right', 0.14, 2.88, 2.51, 0],
  ] as const;
  innerFrameParts.forEach(([part, width, height, x, y]) => {
    const frame = kit.mesh(
      `desktop-computer-monitor-inner-frame-${part}`,
      rounded(width, height, 0.055, 0.035),
      cavity,
      screenTiltPivot,
      false,
    );
    frame.position.set(x, y, 0.34);
    frame.userData.part = 'monitor-inner-frame';
  });
  const monitorStatus = kit.mesh('desktop-computer-monitor-status-dot', new THREE.SphereGeometry(0.035, 10, 7), kit.indicatorMaterial, screenTiltPivot, false);
  monitorStatus.position.set(0, -1.55, 0.4);
  monitorStatus.userData.explodeWithParent = true;

  const rearMount = kit.mesh('desktop-computer-pink-rear-monitor-mount', rounded(1.38, 1.32, 0.25, 0.13), pinkMaterial, screenTiltPivot);
  rearMount.position.set(0, -0.64, -3.21);
  rearMount.userData.part = 'monitor-mount-plate';
  const monitorEmblem = kit.mesh('desktop-computer-monitor-flower-emblem', flowerGeometry(0.28, 0.055), pinkMaterial, screenTiltPivot, false);
  monitorEmblem.position.set(0, 0.43, -3.205);
  monitorEmblem.rotation.y = Math.PI;
  monitorEmblem.userData.part = 'monitor-rear-emblem';
  const monitorEmblemCenter = kit.mesh('desktop-computer-monitor-emblem-center', new THREE.SphereGeometry(0.065, 12, 8), creamHighlight, screenTiltPivot, false);
  monitorEmblemCenter.position.set(0, 0.43, -3.25);
  monitorEmblemCenter.userData.explodeWithParent = true;

  const screenStatePivot = kit.pivot('desktop-computer-screen-state-pivot', screenTiltPivot);
  screenStatePivot.position.z = 0.342;
  const desktopBackground = kit.mesh('desktop-computer-desktop-background', rounded(4.94, 2.78, 0.014, 0.08), screenBlue, screenStatePivot, false);
  desktopBackground.userData.part = 'screen-gui-layer';
  const taskbar = kit.mesh('desktop-computer-screen-taskbar', rounded(4.7, 0.18, 0.017, 0.04), screenPink, screenStatePivot, false);
  taskbar.position.set(0, -1.22, 0.014);
  taskbar.userData.explodeWithParent = true;
  const mainWindowPivot = kit.pivot('desktop-computer-main-window-pivot', screenStatePivot);
  mainWindowPivot.position.set(-0.65, 0.12, 0.025);
  const mainWindow = kit.mesh('desktop-computer-main-window', rounded(2.8, 1.63, 0.018, 0.1), screenLight, mainWindowPivot, false);
  mainWindow.userData.part = 'screen-main-window';
  const windowHeader = kit.mesh('desktop-computer-main-window-header', rounded(2.62, 0.2, 0.02, 0.05), screenPink, mainWindowPivot, false);
  windowHeader.position.set(0, 0.61, 0.018);
  windowHeader.userData.explodeWithParent = true;
  const sidebar = kit.mesh('desktop-computer-main-window-sidebar', rounded(0.42, 1.13, 0.02, 0.05), screenBlue, mainWindowPivot, false);
  sidebar.position.set(-1.0, -0.04, 0.02);
  sidebar.scale.set(0.95, 0.95, 1);
  sidebar.userData.explodeWithParent = true;
  const secondaryWindowPivot = kit.pivot('desktop-computer-secondary-window-pivot', screenStatePivot);
  secondaryWindowPivot.position.set(1.4, 0.42, 0.04);
  const secondaryWindow = kit.mesh('desktop-computer-secondary-window', rounded(1.42, 0.98, 0.018, 0.08), screenPink, secondaryWindowPivot, false);
  secondaryWindow.userData.part = 'screen-secondary-window';
  const cursorPivot = kit.pivot('desktop-computer-screen-cursor-pivot', screenStatePivot);
  const cursor = kit.mesh('desktop-computer-screen-cursor', cursorGeometry(), screenLight, cursorPivot, false);
  cursor.position.z = 0.07;
  cursor.scale.setScalar(0.65);
  cursor.userData.part = 'screen-cursor';
  const bootPivot = kit.pivot('desktop-computer-boot-logo-pivot', screenStatePivot);
  const bootLogo = kit.mesh('desktop-computer-boot-flower-logo', flowerGeometry(0.42, 0.018), screenPink, bootPivot, false);
  bootLogo.position.z = 0.06;
  bootLogo.userData.part = 'screen-boot-logo';
  const blueScreenPivot = kit.pivot('desktop-computer-classic-blue-screen-pivot', screenStatePivot);
  const blueScreenPanel = kit.mesh(
    'desktop-computer-classic-blue-screen-panel',
    rounded(4.9, 2.65, 0.035, 0.06),
    blueScreenMaterial,
    blueScreenPivot,
    false,
  );
  blueScreenPanel.position.z = 0.075;
  const blueScreenLines = [2.7, 3.8, 2.2, 4.25, 3.15];
  blueScreenLines.forEach((width, index) => {
    const line = kit.mesh(
      `desktop-computer-blue-screen-text-line-${index + 1}`,
      rounded(width, index === 0 ? 0.13 : 0.08, 0.02, 0.02),
      blueScreenText,
      blueScreenPivot,
      false,
    );
    line.position.set(-0.3 + (width - 3) * 0.08, 0.72 - index * 0.34, 0.1);
  });
  blueScreenPivot.visible = false;

  const towerPivot = kit.pivot('desktop-computer-tower-assembly-pivot');
  towerPivot.position.set(3.65, 0, -0.72);
  const towerShell = kit.mesh('desktop-computer-rounded-tower-shell', rounded(2.72, 5.0, 3.02, 0.25), cream, towerPivot);
  towerShell.position.y = 2.68;
  towerShell.userData.part = 'tower-shell';
  const towerFront = kit.mesh('desktop-computer-tower-front-highlight', rounded(2.38, 4.57, 0.13, 0.18), creamHighlight, towerPivot, false);
  towerFront.position.set(0, 2.66, 1.51);
  towerFront.userData.explodeWithParent = true;
  const topCap = kit.mesh('desktop-computer-pink-tower-top-cap', rounded(2.82, 0.38, 3.08, 0.2), pinkMaterial, towerPivot);
  topCap.position.set(0, 5.05, 0);
  topCap.userData.part = 'tower-top-cap';
  const topSmokeVentMatrices = [-2, -1, 0, 1, 2].flatMap((x) => [-2, -1, 0, 1, 2].map((z) => matrix(
    new THREE.Vector3(0.3 + x * 0.16, 5.255, z * 0.16),
  )));
  addInstanced(
    kit,
    'desktop-computer-tower-top-smoke-vent-grid',
    new THREE.CylinderGeometry(0.055, 0.055, 0.045, 8),
    cavity,
    towerPivot,
    topSmokeVentMatrices,
    'tower-top-smoke-vent',
  );
  const sideSeam = kit.mesh('desktop-computer-tower-side-panel-seam', rounded(0.035, 4.18, 0.045, 0.012), pinkDarkMaterial, towerPivot, false);
  sideSeam.position.set(1.375, 2.63, 0.38);
  sideSeam.userData.part = 'tower-side-seam';

  const towerEmblem = kit.mesh('desktop-computer-tower-flower-emblem', flowerGeometry(0.27, 0.06), pinkMaterial, towerPivot, false);
  towerEmblem.position.set(0.23, 3.85, 1.59);
  towerEmblem.userData.part = 'tower-front-emblem';
  const towerEmblemCenter = kit.mesh('desktop-computer-tower-emblem-center', new THREE.SphereGeometry(0.06, 12, 8), creamHighlight, towerPivot, false);
  towerEmblemCenter.position.set(0.23, 3.85, 1.63);
  towerEmblemCenter.userData.explodeWithParent = true;

  const frontIoPivot = kit.pivot('desktop-computer-front-io-pivot', towerPivot);
  frontIoPivot.position.set(0.79, 2.35, 1.56);
  const frontIo = kit.mesh('desktop-computer-pink-front-io-strip', rounded(0.58, 2.02, 0.12, 0.12), pinkMaterial, frontIoPivot);
  frontIo.userData.part = 'tower-front-io';
  const powerButtonPivot = kit.pivot('desktop-computer-power-button-pivot', frontIoPivot);
  powerButtonPivot.position.set(0, 0.65, 0.09);
  powerButtonPivot.userData.rotationAxis = [0, 0, 1];
  const powerRing = kit.mesh('desktop-computer-power-button-ring', new THREE.TorusGeometry(0.17, 0.035, 10, 24), creamHighlight, powerButtonPivot, false);
  powerRing.userData.part = 'tower-front-controls';
  const powerButton = kit.mesh('desktop-computer-power-button', new THREE.CylinderGeometry(0.12, 0.12, 0.07, 24), pinkLightMaterial, powerButtonPivot, false);
  powerButton.rotation.x = Math.PI * 0.5;
  powerButton.position.z = 0.015;
  powerButton.userData.explodeWithParent = true;
  const powerMark = kit.mesh('desktop-computer-power-mark', rounded(0.025, 0.1, 0.025, 0.008), cavity, powerButtonPivot, false);
  powerMark.position.set(0, 0.015, 0.075);
  powerMark.userData.explodeWithParent = true;
  const powerLed = kit.mesh('desktop-computer-power-led', new THREE.SphereGeometry(0.045, 10, 7), kit.indicatorMaterial, frontIoPivot, false);
  powerLed.position.set(0, 0.22, 0.12);
  powerLed.userData.explodeWithParent = true;
  const usbGeometry = rounded(0.25, 0.12, 0.07, 0.025);
  [0, -0.31].forEach((y, i) => {
    const usb = kit.mesh(`desktop-computer-front-usb-port-${i + 1}`, usbGeometry, cavity, frontIoPivot, false);
    usb.position.set(0, -0.18 + y, 0.12);
    usb.userData.part = `front-usb-port-${i + 1}`;
  });

  const sideVentMatrices: THREE.Matrix4[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      sideVentMatrices.push(matrix(
        new THREE.Vector3(1.385, 1.4 + row * 0.18, -0.92 + col * 0.18),
        new THREE.Euler(0, 0, Math.PI * 0.5),
      ));
    }
  }
  addInstanced(kit, 'desktop-computer-side-vent-grid', new THREE.CylinderGeometry(0.045, 0.045, 0.075, 8), cavity, towerPivot, sideVentMatrices, 'tower-side-vents');

  kit.socket('desktop-computer-top-vent-socket', towerPivot, [0.3, 5.28, 0]);

  const rearPanel = kit.mesh('desktop-computer-pink-rear-panel', rounded(2.34, 4.34, 0.11, 0.16), pinkMaterial, towerPivot);
  rearPanel.position.set(0, 2.68, -1.54);
  rearPanel.userData.part = 'tower-rear-panel';
  const rearCreamInset = kit.mesh('desktop-computer-rear-cream-io-inset', rounded(0.65, 3.05, 0.07, 0.1), creamHighlight, towerPivot, false);
  rearCreamInset.position.set(-0.73, 3.02, -1.615);
  rearCreamInset.userData.explodeWithParent = true;
  const rearVentMatrices: THREE.Matrix4[] = [];
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      rearVentMatrices.push(matrix(new THREE.Vector3(-0.68 + col * 0.13, 3.28 + row * 0.15, -1.615), new THREE.Euler(Math.PI * 0.5, 0, 0)));
    }
  }
  for (let row = 0; row < 11; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      rearVentMatrices.push(matrix(new THREE.Vector3(0.18 + col * 0.15, 3.2 + row * 0.16, -1.615), new THREE.Euler(Math.PI * 0.5, 0, 0)));
    }
  }
  addInstanced(kit, 'desktop-computer-rear-vent-fields', new THREE.CylinderGeometry(0.04, 0.04, 0.07, 8), cavity, towerPivot, rearVentMatrices, 'tower-rear-vents');

  const rearIoPivot = kit.pivot('desktop-computer-rear-io-pivot', towerPivot);
  rearIoPivot.position.set(-0.72, 2.45, -1.62);
  const rearAudio = kit.mesh('desktop-computer-rear-audio-port', new THREE.CylinderGeometry(0.065, 0.065, 0.06, 14), cavity, rearIoPivot, false);
  rearAudio.rotation.x = Math.PI * 0.5;
  rearAudio.position.set(0, 0.31, 0);
  rearAudio.userData.part = 'tower-rear-io';
  [-0.02, -0.29, -0.56].forEach((y, i) => {
    const port = kit.mesh(`desktop-computer-rear-io-port-${i + 1}`, rounded(i === 2 ? 0.3 : 0.25, 0.13, 0.07, 0.025), cavity, rearIoPivot, false);
    port.position.set(0, y, 0);
    port.userData.part = `rear-io-port-${i + 1}`;
  });
  const servicePanel = kit.mesh('desktop-computer-rear-service-panel', rounded(0.85, 0.34, 0.08, 0.07), pinkLightMaterial, towerPivot, false);
  servicePanel.position.set(-0.52, 1.05, -1.62);
  servicePanel.userData.part = 'tower-service-panel';
  const powerInletFrame = kit.mesh('desktop-computer-rear-power-inlet-frame', rounded(0.58, 0.42, 0.09, 0.08), cavity, towerPivot, false);
  powerInletFrame.position.set(0.74, 1.04, -1.63);
  powerInletFrame.userData.part = 'tower-power-inlet';
  const powerInlet = kit.mesh('desktop-computer-rear-power-inlet', rounded(0.37, 0.24, 0.05, 0.04), pinkDarkMaterial, towerPivot, false);
  powerInlet.position.set(0.74, 1.04, -1.69);
  powerInlet.userData.explodeWithParent = true;

  const sharedFoot = rounded(0.42, 0.22, 0.52, 0.08);
  const footMatrices = [-1, 1].flatMap((x) => [-1, 1].map((z) => matrix(new THREE.Vector3(x * 0.94, 0.13, z * 1.08))));
  addInstanced(kit, 'desktop-computer-four-tower-feet', sharedFoot, rubber, towerPivot, footMatrices, 'tower-feet');

  const keyboardPivot = kit.pivot('desktop-computer-keyboard-assembly-pivot');
  keyboardPivot.position.set(-1.75, 0, 2.2);
  const keyboardShell = kit.mesh('desktop-computer-rounded-keyboard-shell', keyboardWedge(5.35, 0.42, 0.68, 1.72), cream, keyboardPivot);
  keyboardShell.position.y = 0.36;
  keyboardShell.userData.part = 'keyboard-shell';
  const keyboardLip = kit.mesh('desktop-computer-keyboard-front-lip', rounded(5.08, 0.19, 0.22, 0.08), creamHighlight, keyboardPivot, false);
  keyboardLip.position.set(0, 0.37, 0.81);
  keyboardLip.userData.explodeWithParent = true;
  const keyDeck = kit.mesh('desktop-computer-pink-keyboard-deck', rounded(5.02, 0.16, 1.46, 0.1), pinkLightMaterial, keyboardPivot, false);
  keyDeck.position.set(0, 0.61, -0.05);
  keyDeck.userData.part = 'keyboard-deck';
  const keybedPivot = kit.pivot('desktop-computer-keybed-pivot', keyboardPivot);
  const keyGeometry = rounded(0.29, 0.22, 0.25, 0.035, 1);
  const pinkKeyMatrices: THREE.Matrix4[] = [];
  const creamKeyMatrices: THREE.Matrix4[] = [];
  const rowCounts = [14, 14, 13, 12, 11, 9];
  const activeKeyCells = [
    [1, 4], [1, 8], [2, 3], [2, 7], [3, 5], [4, 6],
  ] as const;
  const activeKeyIds = new Set(activeKeyCells.map(([row, col]) => `${row}:${col}`));
  rowCounts.forEach((count, row) => {
    const z = -0.62 + row * 0.235;
    const spacing = 0.355;
    const startX = -(count - 1) * spacing * 0.5;
    for (let col = 0; col < count; col += 1) {
      if (activeKeyIds.has(`${row}:${col}`)) continue;
      if (row === 5 && col >= 3 && col <= 5) continue;
      const target = row === 0 || col === 0 || col === count - 1 || (row === 5 && col > 5) ? pinkKeyMatrices : creamKeyMatrices;
      target.push(matrix(new THREE.Vector3(startX + col * spacing, 0.77 + row * 0.008, z)));
    }
  });
  addInstanced(kit, 'desktop-computer-cream-keycap-field', keyGeometry, creamHighlight, keybedPivot, creamKeyMatrices, 'keyboard-row-system');
  addInstanced(kit, 'desktop-computer-pink-keycap-field', keyGeometry, pinkMaterial, keybedPivot, pinkKeyMatrices, 'keyboard-row-system');
  activeKeyCells.forEach(([row, col], index) => {
    const count = rowCounts[row];
    const spacing = 0.355;
    const pivot = kit.pivot(`desktop-computer-active-key-${index + 1}-pivot`, keybedPivot);
    pivot.position.set(-(count - 1) * spacing * 0.5 + col * spacing, 0.77 + row * 0.008, -0.62 + row * 0.235);
    pivot.userData.baseY = pivot.position.y;
    const activeKey = kit.mesh(`desktop-computer-active-input-key-${index + 1}`, keyGeometry, creamHighlight, pivot, false);
    activeKey.userData.part = `keyboard-active-key-${index + 1}`;
  });
  const spacebarPivot = kit.pivot('desktop-computer-spacebar-pivot', keybedPivot);
  spacebarPivot.position.set(-0.1, 0.8, 0.555);
  const spacebar = kit.mesh('desktop-computer-long-pink-spacebar', rounded(1.82, 0.22, 0.27, 0.05), pinkMaterial, spacebarPivot, false);
  spacebar.userData.part = 'keyboard-spacebar';

  const mousePivot = kit.pivot('desktop-computer-mouse-assembly-pivot');
  // Keep the mouse in its own front-right bay. The extra lateral and front
  // clearance prevents the animated cursor movement from intersecting the
  // keyboard edge or the tower footprint.
  mousePivot.position.set(2.55, 0, 2.55);
  mousePivot.rotation.y = Math.PI;
  const mouseLower = kit.mesh('desktop-computer-cream-mouse-lower-shell', rounded(1.42, 0.42, 1.72, 0.28), cream, mousePivot);
  mouseLower.position.y = 0.29;
  mouseLower.userData.part = 'mouse-shell';
  const mouseTop = kit.mesh('desktop-computer-pink-mouse-upper-shell', new THREE.SphereGeometry(0.75, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), pinkMaterial, mousePivot);
  mouseTop.scale.set(0.93, 0.8, 1.12);
  mouseTop.position.set(0, 0.31, 0.02);
  mouseTop.userData.part = 'mouse-top-shell';
  const mouseButtonPivot = kit.pivot('desktop-computer-mouse-button-pivot', mousePivot);
  mouseButtonPivot.position.set(0, 0.76, 0.44);
  mouseButtonPivot.userData.rotationAxis = [1, 0, 0];
  [-1, 1].forEach((side, i) => {
    const button = kit.mesh(`desktop-computer-mouse-button-${i + 1}`, rounded(0.6, 0.1, 0.68, 0.08), pinkLightMaterial, mouseButtonPivot, false);
    button.position.set(side * 0.29, 0, 0);
    button.rotation.x = -0.085;
    button.rotation.z = -side * 0.075;
    button.userData.part = `mouse-button-${i + 1}`;
  });
  const mouseWheelPivot = kit.pivot('desktop-computer-mouse-wheel-pivot', mouseButtonPivot);
  mouseWheelPivot.position.set(0, 0.08, -0.05);
  mouseWheelPivot.userData.rotationAxis = [1, 0, 0];
  const mouseWheel = kit.mesh('desktop-computer-mouse-wheel', new THREE.CylinderGeometry(0.11, 0.11, 0.17, 10), cavity, mouseWheelPivot, false);
  mouseWheel.rotation.z = Math.PI * 0.5;
  mouseWheel.userData.part = 'mouse-wheel';

  kit.socket('desktop-computer-monitor-power-socket', monitorPivot, [2.65, 2.2, -0.24]);
  kit.socket('desktop-computer-monitor-display-socket', monitorPivot, [1.9, 2.2, -0.24]);
  kit.socket('desktop-computer-tower-power-socket', towerPivot, [0.75, 1.05, -1.64]);
  kit.socket('desktop-computer-keyboard-link-socket', keyboardPivot, [2.55, 0.35, -0.72]);
  kit.socket('desktop-computer-mouse-link-socket', mousePivot, [0, 0.25, 0.8]);
  kit.socket('desktop-computer-screen-effect-socket', screenStatePivot, [0, 0, 0.08]);
  // Freeze the four scene-edge cable targets to the archived v1 Box3 fallback.
  // These zero-geometry sockets are discovered before the model is re-centered,
  // so the coordinates intentionally use the original root-local frame.
  kit.socket('desktop-computer-left-connection-socket', kit.root, [-4.595, 3.0208085, 3.445]);
  kit.socket('desktop-computer-right-connection-socket', kit.root, [5.1075, 3.0208085, 3.445]);
  kit.socket('desktop-computer-top-connection-socket', kit.root, [0.25625005, 6.056617, 3.445]);
  kit.socket('desktop-computer-bottom-connection-socket', kit.root, [0.25625005, -0.015, 3.445]);

  const smokePivot = kit.pivot('desktop-computer-overheat-smoke-pivot', towerPivot);
  smokePivot.position.set(0.3, 5.26, 0);
  for (let index = 0; index < 10; index += 1) {
    const material = kit.material(index % 3 === 0 ? 0x786f78 : index % 3 === 1 ? 0x8d838b : 0x655f69, {
      tint: 0x4e4854,
      transparent: true,
      opacity: 0,
    });
    material.depthWrite = false;
    const puff = new THREE.Mesh(irregularSmokeGeometry(index), material);
    puff.name = `desktop-computer-volumetric-smoke-puff-${index + 1}`;
    puff.visible = false;
    puff.castShadow = true;
    puff.userData.applianceId = options.id;
    puff.userData.part = 'desktop-computer-volumetric-smoke';
    puff.userData.performanceProp = 'irregular-low-poly-smoke-cluster';
    puff.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
    smokePivot.add(puff);
    kit.nodes.set(puff.name, puff);
  }

  screenStatePivot.visible = false;
  bootPivot.visible = false;
  mainWindowPivot.scale.setScalar(0.001);
  secondaryWindowPivot.scale.setScalar(0.001);
  cursorPivot.visible = false;

  applyDesktopOutlineHierarchy(kit.root);

  const build = kit.finish({
    referencePath: options.referencePath ?? REFERENCE_PATH,
    reconstructed: [
      'wide cream CRT monitor with a preserved recessed screen and a deep stepped rear tube enclosure',
      'squat load-bearing CRT neck, broad two-stage base, rear service cap and thick rounded front collar',
      'top and side monitor ventilation slots distributed across the deep CRT enclosure',
      'rounded cream tower with pink top cap, front flower badge, vertical power/USB panel and four feet',
      'side and rear ventilation fields without the removed fan prop, rear I/O column, service panel and IEC-like inlet',
      'rounded keyboard shell with pink deck, six rows of independent two-tone keycaps and long pink spacebar',
      'cream lower mouse shell, pink arched upper shell, two buttons and independent wheel pivot',
      'independent screen GUI layers, boot emblem, windows and cursor for a purpose-readable powered state',
      'ten reusable irregular multi-lobed low-poly smoke volumes bound to the tower top vent',
    ],
    inferred: [
      'motherboard, graphics card, CPU cooler, power supply and internal cable routing are hidden and omitted',
      'exact CRT tube geometry is hidden; the deep narrowing enclosure is based on period side and rear references',
      'monitor hinge bearings, cable tunnel and pitch stops are hidden; the squat support pivot is inferred',
      'keyboard switches, PCB, underside feet and exact matrix are hidden; visible key rows are approximated',
      'mouse sensor, microswitches and underside glides are hidden and omitted',
      'rear socket protocols are not asserted; only visible port silhouettes and placement are reconstructed',
    ],
  });

  build.root.userData.referenceDimensions = {
    totalWidth: 9.8,
    totalHeight: 5.12,
    totalDepth: 6.8,
    monitorOuter: [5.72, 3.5, 3.35],
    towerOuter: [2.72, 5.0, 3.02],
    keyboardOuter: [5.35, 0.54, 1.72],
    mouseOuter: [1.42, 0.78, 1.72],
  };
  build.root.userData.previewLightingProfile = 'sakura-appliance-v2';
  build.root.userData.sculptRuntime.colliders = [
    { id: 'desktop-computer-monitor', type: 'compound-box', node: 'desktop-computer-screen-tilt-pivot' },
    { id: 'desktop-computer-stand', type: 'compound-box', node: 'desktop-computer-monitor-stand-pivot' },
    { id: 'desktop-computer-tower', type: 'box', node: 'desktop-computer-rounded-tower-shell' },
    { id: 'desktop-computer-keyboard', type: 'box', node: 'desktop-computer-rounded-keyboard-shell' },
    { id: 'desktop-computer-mouse', type: 'ellipsoid', node: 'desktop-computer-cream-mouse-lower-shell' },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    ['desktop-computer-rounded-monitor-shell', 'desktop-computer-monitor-rear-highlight', 'desktop-computer-crt-tapered-rear-bell', 'desktop-computer-crt-rear-service-cap', 'desktop-computer-recessed-screen-glass'],
    ['desktop-computer-monitor-base-lower', 'desktop-computer-leaning-pink-column'],
    ['desktop-computer-rounded-tower-shell', 'desktop-computer-pink-tower-top-cap', 'desktop-computer-pink-front-io-strip', 'desktop-computer-pink-rear-panel'],
    ['desktop-computer-rounded-keyboard-shell', 'desktop-computer-cream-keycap-field', 'desktop-computer-pink-keycap-field', 'desktop-computer-long-pink-spacebar'],
    ['desktop-computer-cream-mouse-lower-shell', 'desktop-computer-pink-mouse-upper-shell', 'desktop-computer-mouse-wheel'],
  ];
  return build;
}
