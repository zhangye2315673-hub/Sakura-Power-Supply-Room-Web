import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { setHullOutlineStyle } from '../../style/outline';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_17 (4).png';
const ACTIVE_DURATION = 5.2;

function shiftedAccent(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) * (Math.PI * 2 / 10000);
}

function applyTelevisionOutlineHierarchy(root: THREE.Object3D): void {
  const main = /rear-shell|rear-cap|front-fascia|lower-accent-rail/;
  const structure = /screen-frame|screen-cavity|control-panel|control-brow|selector|channel-button|power-button|rear-service-panel|rear-port-panel|foot/;
  const excluded = /glass-skin|channel-[123]-|static-|shutdown-|active-scanline|raster-line/;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.isOutline !== true) return;
    const source = object.parent?.name ?? object.name;
    if (excluded.test(source)) {
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

function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + radius, -halfHeight);
  shape.lineTo(halfWidth - radius, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
  shape.lineTo(halfWidth, halfHeight - radius);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
  shape.lineTo(-halfWidth + radius, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
  shape.lineTo(-halfWidth, -halfHeight + radius);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
  return shape;
}

function bulgedScreenGeometry(
  width: number,
  height: number,
  radius: number,
  bulge: number,
): THREE.BufferGeometry {
  const geometry = new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 18);
  const position = geometry.getAttribute('position');
  for (let index = 0; index < position.count; index += 1) {
    const normalizedX = Math.abs(position.getX(index) / (width * 0.5));
    const normalizedY = Math.abs(position.getY(index) / (height * 0.5));
    const edge = Math.min(1, Math.pow(normalizedX, 4) + Math.pow(normalizedY, 4));
    position.setZ(index, bulge * (1 - edge));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function addRoundedBar(
  kit: ApplianceModelKit,
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  parent: THREE.Object3D,
  radius = Math.min(width, height) * 0.35,
): THREE.Mesh {
  const bar = kit.mesh(
    name,
    new RoundedBoxGeometry(width, height, depth, 2, Math.max(0.004, radius)),
    material,
    parent,
    false,
  );
  bar.userData.explodeWithParent = true;
  return bar;
}

/**
 * Procedural reconstruction of the supplied three-view retro CRT television.
 *
 * Local frame: +Y up, +Z front, floor at Y=0. The front fascia, display,
 * controls, rear service shell and feet are independent assemblies so the
 * gallery can inspect and animate them without turning the prop into one mesh.
 */
export function createTelevisionModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = shiftedAccent(options.accent, 0.18, -0.08);
  const accentMid = shiftedAccent(options.accent, 0.07, -0.04);
  const accentDark = shiftedAccent(options.accent, -0.09, -0.02);

  const shellMaterial = kit.material(0xf2ead9, { tint: 0x71667c });
  const shellHighlightMaterial = kit.material(0xfaf2e2, { tint: 0x776b81 });
  const shellShadowMaterial = kit.material(0xd7cfbf, { tint: 0x655c70 });
  const accentMaterial = kit.material(accentMid, { tint: 0x6c5e74 });
  const accentDarkMaterial = kit.material(accentDark, { tint: 0x5e5269 });
  const cavityMaterial = kit.material(0x343642, { tint: 0x282532 });
  const rubberMaterial = kit.material(0x585762, { tint: 0x403c48 });
  const metalMaterial = kit.material(0x9a9ca5, { tint: 0x56515f });
  const screenMaterial = kit.material(0x4b5358, {
    tint: 0x30313d,
    emissive: accentLight,
  });
  const screenGlassMaterial = kit.material(0x9caeb0, {
    tint: 0x5e6270,
    transparent: true,
    opacity: 0.12,
  });
  const scanlineMaterial = kit.material(accentLight, {
    tint: 0x6d6074,
    emissive: accentLight,
    transparent: true,
    opacity: 0.55,
  });
  const channelMaterials = {
    sky: kit.material(0x66c9e8, { tint: 0x47778f, emissive: 0x3284a4 }),
    sun: kit.material(0xffd45f, { tint: 0x9a7150, emissive: 0xffa43d }),
    hill: kit.material(0x5cc58b, { tint: 0x477b6a, emissive: 0x2d8f63 }),
    pink: kit.material(0xff7898, { tint: 0x915c72, emissive: 0xd6426b }),
    purple: kit.material(0x8f82df, { tint: 0x625783, emissive: 0x5d49b6 }),
    blue: kit.material(0x3f65ae, { tint: 0x394f72, emissive: 0x29477e }),
    cyan: kit.material(0x55dbd1, { tint: 0x3c7d7b, emissive: 0x2caaa2 }),
    white: kit.material(0xfff6df, { tint: 0x8b8191, emissive: 0xffdca2 }),
    staticDark: kit.material(0x576077, { tint: 0x343847, emissive: 0x27314d }),
  };

  const rearShell = kit.mesh(
    'television-rear-shell',
    new RoundedBoxGeometry(3.22, 2.18, 1.5, 2, 0.18),
    shellMaterial,
  );
  rearShell.position.set(0, 1.24, -0.11);

  // A subtly narrower rear cap makes the three-quarter silhouette read as a
  // true CRT volume instead of a flat modern screen.
  const rearCap = kit.mesh(
    'television-rear-cap',
    new RoundedBoxGeometry(2.88, 1.85, 0.28, 2, 0.15),
    shellShadowMaterial,
  );
  rearCap.position.set(0.02, 1.25, -0.89);

  const frontFascia = kit.mesh(
    'television-front-fascia',
    new RoundedBoxGeometry(3.45, 2.14, 0.31, 2, 0.17),
    shellHighlightMaterial,
  );
  frontFascia.position.set(0, 1.24, 0.71);

  const lowerAccentRail = kit.mesh(
    'television-lower-accent-rail',
    new RoundedBoxGeometry(3.25, 0.17, 1.35, 3, 0.065),
    accentMaterial,
  );
  lowerAccentRail.position.set(0, 0.22, -0.04);

  // Graphic side shoulders break up the formerly monolithic box while staying
  // inside the archived cabinet envelope. Their shallow, tapered placement
  // makes the CRT depth read clearly from game-scale three-quarter views.
  for (const side of [-1, 1]) {
    const shoulder = kit.mesh(
      `television-side-shoulder-${side < 0 ? 'left' : 'right'}`,
      new RoundedBoxGeometry(0.14, 1.63, 1.12, 1, 0.055),
      shellShadowMaterial,
    );
    shoulder.position.set(side * 1.565, 1.28, -0.12);
    shoulder.rotation.z = side * -0.025;
    shoulder.userData.explodeWithParent = true;
    const accentBlade = kit.mesh(
      `television-side-accent-blade-${side < 0 ? 'left' : 'right'}`,
      new RoundedBoxGeometry(0.045, 1.22, 0.72, 1, 0.02),
      accentDarkMaterial,
      kit.root,
      false,
    );
    accentBlade.position.set(side * 1.64, 1.22, 0.08);
    accentBlade.rotation.z = side * -0.025;
    accentBlade.userData.explodeWithParent = true;
  }

  // Front screen stack: raised frame, dark cavity, physically bulged display
  // face and a separate translucent glass skin.
  const screenFrame = kit.mesh(
    'television-screen-frame',
    new RoundedBoxGeometry(2.55, 1.77, 0.13, 2, 0.22),
    shellShadowMaterial,
  );
  screenFrame.position.set(-0.39, 1.3, 0.9);

  const screenCavity = kit.mesh(
    'television-screen-cavity',
    new RoundedBoxGeometry(2.34, 1.56, 0.09, 5, 0.18),
    cavityMaterial,
  );
  screenCavity.position.set(-0.39, 1.3, 0.985);

  const screenBrow = kit.mesh(
    'television-screen-upper-brow',
    new RoundedBoxGeometry(2.28, 0.095, 0.12, 1, 0.035),
    shellHighlightMaterial,
  );
  screenBrow.position.set(-0.39, 2.135, 0.995);
  screenBrow.userData.explodeWithParent = true;
  const screenSill = kit.mesh(
    'television-screen-lower-sill',
    new RoundedBoxGeometry(2.19, 0.075, 0.12, 1, 0.028),
    accentDarkMaterial,
  );
  screenSill.position.set(-0.39, 0.47, 0.995);
  screenSill.userData.explodeWithParent = true;

  const screenPivot = kit.pivot('television-crt-screen-pivot');
  screenPivot.position.set(-0.39, 1.3, 1.045);
  screenPivot.userData.rotationAxis = [0, 0, 1];
  kit.socket('television-screen-socket', screenPivot, [0, 0, 0]);
  const screen = kit.mesh(
    'television-crt-bulged-screen',
    bulgedScreenGeometry(2.18, 1.42, 0.19, 0.095),
    screenMaterial,
    screenPivot,
  );
  screen.userData.explodeWithParent = true;

  const glass = kit.mesh(
    'television-crt-glass-skin',
    bulgedScreenGeometry(2.2, 1.44, 0.2, 0.102),
    screenGlassMaterial,
    screenPivot,
    false,
  );
  glass.position.z = 0.065;
  glass.userData.explodeWithParent = true;

  // The picture owns the programme geometry. The glass and cabinet never
  // collapse: only the phosphor image performs the classic CRT line-to-dot
  // shutdown, so the television keeps its physical volume.
  const picturePivot = kit.pivot('television-picture-pivot', screenPivot);
  picturePivot.position.z = 0.135;
  picturePivot.userData.performanceRoot = true;
  picturePivot.userData.screenEffect = 'crt-picture-collapse';

  const channelGroups = [
    kit.pivot('television-channel-1-sakura', picturePivot),
    kit.pivot('television-channel-2-test-card', picturePivot),
    kit.pivot('television-channel-3-night-city', picturePivot),
  ];
  channelGroups.forEach((group, index) => {
    group.visible = false;
    group.userData.channelIndex = index;
    group.userData.performanceEffect = true;
  });

  const addPicturePart = (
    group: THREE.Object3D,
    name: string,
    width: number,
    height: number,
    material: THREE.Material,
    x: number,
    y: number,
    depth = 0.018,
  ): THREE.Mesh => {
    const part = addRoundedBar(kit, name, width, height, depth, material, group, Math.min(width, height) * 0.18);
    part.position.set(x, y, 0);
    part.userData.performanceEffect = true;
    return part;
  };

  // Channel 1: a cheerful sakura sunrise landscape, built from shallow solids.
  addPicturePart(channelGroups[0], 'television-channel-1-sky', 2.06, 1.31, channelMaterials.sky, 0, 0);
  const sun = kit.mesh(
    'television-channel-1-sun',
    new THREE.CylinderGeometry(0.22, 0.22, 0.025, 20),
    channelMaterials.sun,
    channelGroups[0],
    false,
  );
  sun.rotation.x = Math.PI * 0.5;
  sun.position.set(0.57, 0.28, 0.025);
  addPicturePart(channelGroups[0], 'television-channel-1-hill-back', 1.32, 0.34, channelMaterials.hill, -0.43, -0.34, 0.035).rotation.z = 0.12;
  addPicturePart(channelGroups[0], 'television-channel-1-hill-front', 1.48, 0.29, channelMaterials.pink, 0.41, -0.48, 0.042).rotation.z = -0.07;
  for (let index = 0; index < 5; index += 1) {
    const blossom = kit.mesh(
      `television-channel-1-sakura-${index + 1}`,
      new THREE.IcosahedronGeometry(0.065 + (index % 2) * 0.018, 0),
      channelMaterials.pink,
      channelGroups[0],
      false,
    );
    blossom.position.set(-0.78 + index * 0.32, 0.38 - (index % 2) * 0.16, 0.04);
  }

  // Channel 2: unmistakable analogue colour bars with real thickness.
  addPicturePart(channelGroups[1], 'television-channel-2-background', 2.06, 1.31, channelMaterials.white, 0, 0);
  [channelMaterials.sun, channelMaterials.cyan, channelMaterials.hill, channelMaterials.pink, channelMaterials.purple, channelMaterials.blue]
    .forEach((material, index) => {
      addPicturePart(
        channelGroups[1],
        `television-channel-2-colour-bar-${index + 1}`,
        0.29,
        0.9,
        material,
        -0.78 + index * 0.312,
        0.12,
        0.032,
      );
    });
  addPicturePart(channelGroups[1], 'television-channel-2-lower-band', 1.9, 0.18, channelMaterials.staticDark, 0, -0.48, 0.034);

  // Channel 3: a night-city programme with moon and varied skyline blocks.
  addPicturePart(channelGroups[2], 'television-channel-3-sky', 2.06, 1.31, channelMaterials.blue, 0, 0);
  const moon = kit.mesh(
    'television-channel-3-moon',
    new THREE.CylinderGeometry(0.17, 0.17, 0.026, 18),
    channelMaterials.sun,
    channelGroups[2],
    false,
  );
  moon.rotation.x = Math.PI * 0.5;
  moon.position.set(-0.62, 0.34, 0.028);
  [0.45, 0.7, 0.52, 0.86, 0.6, 0.76, 0.48].forEach((height, index) => {
    const material = index % 3 === 0 ? channelMaterials.purple : index % 3 === 1 ? channelMaterials.pink : channelMaterials.cyan;
    addPicturePart(channelGroups[2], `television-channel-3-building-${index + 1}`, 0.23, height, material, -0.83 + index * 0.276, -0.6 + height * 0.5, 0.035);
  });

  const staticGroup = kit.pivot('television-static-snow-group', picturePivot);
  staticGroup.visible = false;
  staticGroup.userData.performanceEffect = true;
  addPicturePart(staticGroup, 'television-static-background', 2.06, 1.31, channelMaterials.staticDark, 0, 0);
  const snowMaterials = [channelMaterials.white, channelMaterials.sky, channelMaterials.pink, channelMaterials.staticDark];
  for (let index = 0; index < 48; index += 1) {
    const column = index % 12;
    const row = Math.floor(index / 12);
    const snow = addPicturePart(
      staticGroup,
      `television-static-snow-bit-${index + 1}`,
      0.08 + ((index * 7) % 4) * 0.018,
      0.035 + ((index * 5) % 3) * 0.016,
      snowMaterials[index % snowMaterials.length],
      -0.91 + column * 0.166 + ((row * 3 + index) % 2) * 0.025,
      -0.49 + row * 0.31 + ((column + row) % 3) * 0.036,
      0.04,
    );
    snow.userData.snowSeed = (index * 37 + 11) % 101;
  }
  for (let index = 0; index < 2; index += 1) {
    const band = addPicturePart(
      staticGroup,
      `television-static-signal-band-${index + 1}`,
      1.92,
      0.07,
      index === 0 ? channelMaterials.white : channelMaterials.cyan,
      0,
      -0.34 + index * 0.52,
      0.052,
    );
    band.userData.signalBand = true;
  }

  const shutdownLine = addPicturePart(
    picturePivot,
    'television-shutdown-phosphor-line',
    1.96,
    0.035,
    channelMaterials.white,
    0,
    0,
    0.055,
  );
  shutdownLine.visible = false;
  shutdownLine.userData.performanceEffect = true;

  const scanPivot = kit.pivot('television-scanline-pivot', screenPivot);
  scanPivot.position.set(0, -0.58, 0.185);
  const scanLine = addRoundedBar(
    kit,
    'television-active-scanline',
    1.92,
    0.028,
    0.014,
    scanlineMaterial,
    scanPivot,
    0.012,
  );
  scanLine.position.set(0, 0, 0);

  // A small number of subdued raster lines provides CRT identity without
  // turning the screen into a noisy high-frequency texture.
  for (let index = 0; index < 7; index += 1) {
    const raster = addRoundedBar(
      kit,
      `television-raster-line-${index + 1}`,
      1.98,
      0.009,
      0.008,
      screenGlassMaterial,
      screenPivot,
      0.004,
    );
    raster.position.set(0, -0.5 + index * 0.165, 0.18);
  }

  // Real period control hierarchy: one indexed channel selector, three chunky
  // coloured preset keys and a separate power key. The former second generic
  // round knob is intentionally removed.
  const controlPanel = kit.mesh(
    'television-control-panel',
    new RoundedBoxGeometry(0.63, 1.73, 0.105, 2, 0.11),
    accentMaterial,
  );
  controlPanel.position.set(1.22, 1.28, 0.92);

  const controlBrow = kit.mesh(
    'television-control-brow',
    new RoundedBoxGeometry(0.51, 0.1, 0.11, 1, 0.035),
    accentDarkMaterial,
  );
  controlBrow.position.set(1.22, 2.075, 0.995);
  controlBrow.userData.explodeWithParent = true;

  const channelSelector = kit.pivot('television-channel-selector-pivot');
  channelSelector.position.set(1.22, 1.72, 1.005);
  channelSelector.userData.rotationAxis = [0, 0, 1];
  channelSelector.userData.rotationRange = [-1.12, 1.12];
  channelSelector.userData.detents = 3;
  kit.socket('television-channel-selector-socket', channelSelector, [0, 0, 0]);
  const selectorOuter = kit.mesh(
    'television-channel-selector-outer',
    new THREE.CylinderGeometry(0.245, 0.245, 0.085, 20),
    accentDarkMaterial,
    channelSelector,
  );
  selectorOuter.rotation.x = Math.PI * 0.5;
  const selectorDial = kit.mesh(
    'television-channel-selector-dial',
    new THREE.CylinderGeometry(0.195, 0.205, 0.125, 20),
    shellHighlightMaterial,
    channelSelector,
  );
  selectorDial.rotation.x = Math.PI * 0.5;
  selectorDial.position.z = 0.072;
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI * 2 / 12;
    const tooth = addRoundedBar(
      kit,
      `television-channel-selector-tooth-${index + 1}`,
      0.045,
      0.075,
      0.035,
      accentDarkMaterial,
      channelSelector,
      0.012,
    );
    tooth.position.set(Math.sin(angle) * 0.215, Math.cos(angle) * 0.215, 0.105);
    tooth.rotation.z = -angle;
  }
  const selectorMark = addRoundedBar(
    kit,
    'television-channel-selector-index',
    0.022,
    0.14,
    0.02,
    accentDarkMaterial,
    channelSelector,
    0.009,
  );
  selectorMark.position.set(0, 0.077, 0.145);
  for (let index = 0; index < 3; index += 1) {
    const angle = -0.82 + index * 0.82;
    const tick = addRoundedBar(
      kit,
      `television-channel-detent-${index + 1}`,
      0.025,
      0.065,
      0.018,
      channelMaterials.white,
      kit.root,
      0.01,
    );
    tick.position.set(1.22 + Math.sin(angle) * 0.3, 1.72 + Math.cos(angle) * 0.3, 1.08);
    tick.rotation.z = -angle;
  }

  const buttonMaterials = [channelMaterials.cyan, channelMaterials.sun, channelMaterials.pink];
  for (let index = 0; index < 3; index += 1) {
    const pivot = kit.pivot(`television-channel-button-${index + 1}-pivot`);
    pivot.position.set(1.06 + index * 0.16, 1.28, 1.015);
    pivot.userData.travelAxis = [0, 0, 1];
    pivot.userData.channelIndex = index;
    kit.socket(`television-channel-button-${index + 1}-socket`, pivot, [0, 0, 0]);
    const key = kit.mesh(
      `television-channel-button-${index + 1}`,
      new RoundedBoxGeometry(0.13, 0.2, 0.125, 3, 0.03),
      buttonMaterials[index],
      pivot,
    );
    key.position.z = 0.055;
    key.userData.controlAction = `select-channel-${index + 1}`;
  }

  const powerPivot = kit.pivot('television-power-button-pivot');
  powerPivot.position.set(1.22, 1.02, 1.015);
  powerPivot.userData.travelAxis = [0, 0, 1];
  kit.socket('television-power-button-socket', powerPivot, [0, 0, 0]);
  const powerButton = kit.mesh(
    'television-power-button',
    new RoundedBoxGeometry(0.24, 0.12, 0.12, 3, 0.035),
    channelMaterials.pink,
    powerPivot,
  );
  powerButton.position.z = 0.052;
  powerButton.userData.controlAction = 'power-toggle';
  kit.indicator([1.39, 1.02, 1.09], 0.028);

  for (let index = 0; index < 5; index += 1) {
    const slot = addRoundedBar(
      kit,
      `television-speaker-slot-${index + 1}`,
      0.34,
      0.025,
      0.025,
      cavityMaterial,
      kit.root,
      0.011,
    );
    slot.position.set(1.22, 0.82 - index * 0.065, 1.02);
  }
  kit.socket('television-speaker-socket', kit.root, [1.22, 0.68, 1.02]);

  // Rear service panel, repeated ventilation slots and connection bank are
  // modeled because the gallery provides free orbit inspection.
  const rearPanel = kit.mesh(
    'television-rear-service-panel',
    new RoundedBoxGeometry(2.75, 1.62, 0.055, 2, 0.13),
    shellHighlightMaterial,
  );
  rearPanel.position.set(0.02, 1.28, -1.045);

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 14; column += 1) {
      const vent = addRoundedBar(
        kit,
        `television-rear-upper-vent-r${row + 1}-c${column + 1}`,
        0.026,
        0.18,
        0.016,
        accentDarkMaterial,
        kit.root,
        0.01,
      );
      vent.position.set(-0.74 + column * 0.115, 1.72 - row * 0.2, -1.084);
    }
  }

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      const vent = addRoundedBar(
        kit,
        `television-rear-lower-vent-r${row + 1}-c${column + 1}`,
        0.025,
        0.16,
        0.016,
        accentDarkMaterial,
        kit.root,
        0.01,
      );
      vent.position.set(-0.94 + column * 0.12, 0.82 - row * 0.18, -1.084);
    }
  }

  const portPanel = kit.mesh(
    'television-rear-port-panel',
    new RoundedBoxGeometry(0.93, 0.31, 0.045, 3, 0.07),
    accentMaterial,
  );
  portPanel.position.set(0.79, 0.67, -1.085);
  kit.socket('television-rear-connection-socket', portPanel, [0, 0, -0.04]);

  const rectangularPort = kit.mesh(
    'television-rear-rectangular-port',
    new RoundedBoxGeometry(0.27, 0.1, 0.035, 2, 0.025),
    cavityMaterial,
  );
  rectangularPort.position.set(0.52, 0.67, -1.119);
  for (const [index, x] of [0.82, 1.08].entries()) {
    const socket = kit.mesh(
      `television-rear-round-port-${index + 1}`,
      new THREE.TorusGeometry(0.07, 0.024, 8, 16),
      index === 0 ? metalMaterial : accentDarkMaterial,
      kit.root,
      false,
    );
    socket.position.set(x, 0.67, -1.12);
  }

  for (const [index, [x, y]] of [
    [-1.28, 1.9],
    [1.32, 1.9],
    [-1.28, 0.52],
    [1.32, 0.52],
  ].entries()) {
    const fastener = kit.mesh(
      `television-rear-fastener-${index + 1}`,
      new THREE.CylinderGeometry(0.035, 0.035, 0.024, 10),
      metalMaterial,
      kit.root,
      false,
    );
    fastener.rotation.x = Math.PI * 0.5;
    fastener.position.set(x, y, -1.086);
    fastener.userData.explodeWithParent = true;
  }

  for (const x of [-1.28, 1.28]) {
    for (const z of [-0.55, 0.55]) {
      const foot = kit.mesh(
        `television-foot-${x < 0 ? 'left' : 'right'}-${z < 0 ? 'rear' : 'front'}`,
        new RoundedBoxGeometry(0.38, 0.18, 0.38, 2, 0.06),
        rubberMaterial,
        kit.root,
        false,
      );
      foot.position.set(x, 0.09, z);
    }
  }

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'deep rounded CRT cabinet with a narrower rear cap and separate front fascia',
        'large left-side rounded bezel with a genuinely bulged display surface and glass skin',
        'accent-colored right control bay with one indexed channel selector, three thick coloured channel keys, power button and speaker slots',
        'accent lower rail and four separated low feet',
        'rear recessed service panel, upper and lower repeated ventilation arrays, fasteners and port bank',
        'three modelled colour programmes, volumetric snow bits, scanline, phosphor shutdown line and synchronized physical controls',
      ],
      inferred: [
        'rear-cap taper and exact cabinet depth are inferred from the supplied side view',
        'the rectangular and two round rear ports reproduce the visible hierarchy but not an asserted electrical standard',
        'internal cathode-ray tube, speaker cone, tuner mechanism, wiring and electronics are intentionally omitted',
        'underside panel seams and internal foot fasteners are not visible and remain closed geometry',
      ],
    },
  );
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.televisionPerformanceRig = {
    owner: 'television-model-rig',
    timelineOwner: 'AppliancePerformanceSystem',
    picture: 'television-picture-pivot',
    channels: channelGroups.map((group) => group.name),
    static: 'television-static-snow-group',
    shutdownLine: shutdownLine.name,
    selector: channelSelector.name,
    buttons: [1, 2, 3].map((index) => `television-channel-button-${index}-pivot`),
    forbiddenGenericEffects: ['debris-particles', 'PlaneGeometry', 'Sprite', 'Line'],
  };
  build.root.userData.outlineContract = {
    main: 0.0048,
    structure: 0.0041,
    detail: 0.0033,
    variation: 0.18,
    stable: true,
    style: 'Sakura low-poly three-band ink; transparent glass and programme effects excluded',
  };
  build.root.userData.televisionV2 = {
    geometryLanguage: 'faceted-deep-crt-with-graphic-shoulders',
    referenceStatus: 'conditional-fallback-v1-views-not-gpt-image-2',
    frozenRuntime: [
      'television-crt-screen-pivot',
      'television-picture-pivot',
      'television-channel-selector-pivot',
      'television-power-button-pivot',
      'television-screen-socket',
      'television-speaker-socket',
      'television-rear-connection-socket',
    ],
    envelopePolicy: 'archived v1 package bounds authoritative',
  };
  applyTelevisionOutlineHierarchy(build.root);
  return build;
}
