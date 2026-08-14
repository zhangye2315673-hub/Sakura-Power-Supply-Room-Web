import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import { setHullOutlineStyle } from '../../style/outline';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_20 (9).png';

function shiftedAccent(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

const V2_REFERENCE_PATH = 'references/intake-v2/microwave/views/front.png';

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) * (Math.PI * 2 / 10000);
}

function applyMicrowaveOutlineHierarchy(root: THREE.Object3D): void {
  const mainSilhouette = /cabinet-shell|cabinet-(?:top-bridge|bottom-bridge|left-side-wall)|top-hood|side-facet-panel|lower-rail|door-outer-frame|control-panel|rear-service-panel/;
  const fineDetail = /display-digit|sequence-indicator|dial-(?:index|tick)|small-round-button-index|rear-(?:vent|fastener|power-contact)|food-topping|foot-/;
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

function facetedPanelGeometry(width: number, height: number, depth: number, chamfer: number): THREE.ExtrudeGeometry {
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const cut = Math.min(chamfer, halfWidth * 0.45, halfHeight * 0.45);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + cut, -halfHeight);
  shape.lineTo(halfWidth - cut, -halfHeight);
  shape.lineTo(halfWidth, -halfHeight + cut);
  shape.lineTo(halfWidth, halfHeight - cut);
  shape.lineTo(halfWidth - cut, halfHeight);
  shape.lineTo(-halfWidth + cut, halfHeight);
  shape.lineTo(-halfWidth, halfHeight - cut);
  shape.lineTo(-halfWidth, -halfHeight + cut);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: false });
  geometry.translate(0, 0, -depth * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

function roundedBar(
  kit: ApplianceModelKit,
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  parent: THREE.Object3D,
  radius = Math.min(width, height) * 0.32,
  outlined = true,
): THREE.Mesh {
  const mesh = kit.mesh(
    name,
    facetedPanelGeometry(width, height, depth, Math.max(0.004, Math.min(radius, width * 0.35, height * 0.35))),
    material,
    parent,
    outlined,
  );
  mesh.userData.explodeWithParent = true;
  return mesh;
}

function tag(mesh: THREE.Mesh, part: string, relief = false): void {
  mesh.userData.part = part;
  if (relief) mesh.userData.explodeWithParent = true;
}

function volumetricSteamLobeGeometry(seed: number): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(0.12, 1);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    vertex.fromBufferAttribute(positions, index);
    const irregularity = 1
      + Math.sin(index * 2.17 + seed * 1.91) * 0.12
      + Math.cos(index * 0.83 + seed * 2.71) * 0.07;
    vertex.multiplyScalar(irregularity);
    positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function volumetricHeatWaveGeometry(seed: number): THREE.BufferGeometry {
  const geometry = new THREE.TorusGeometry(0.24, 0.032, 6, 28);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    vertex.fromBufferAttribute(positions, index);
    const angle = Math.atan2(vertex.y, vertex.x);
    const radialWarp = 1 + Math.sin(angle * 5 + seed * 1.37) * 0.038;
    vertex.x *= radialWarp;
    vertex.y *= radialWarp;
    vertex.z += Math.sin(angle * 3 + seed * 0.73) * 0.009;
    positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Three-view procedural reconstruction of the supplied rounded countertop
 * microwave. Local frame: +Y up, +Z front, floor at Y=0.
 */
export function createMicrowaveModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = shiftedAccent(options.accent, 0.2, -0.1);
  const accentMid = shiftedAccent(options.accent, 0.07, -0.04);
  const accentDark = shiftedAccent(options.accent, -0.11, -0.03);

  const shellMaterial = kit.material(0xf1eadb, { tint: 0x73677d });
  const shellHighlightMaterial = kit.material(0xfaf3e6, { tint: 0x786d83 });
  const shellShadowMaterial = kit.material(0xd8cebe, { tint: 0x665c70 });
  const accentMaterial = kit.material(accentMid, { tint: 0x6d6076 });
  const accentDarkMaterial = kit.material(accentDark, { tint: 0x5d5268 });
  const cavityMaterial = kit.material(0x282a33, { tint: 0x24212c });
  const meshMaterial = kit.material(0x464650, {
    tint: 0x302d39,
    transparent: true,
    opacity: 0.016,
  });
  const glassMaterial = kit.material(0xdde9e6, {
    tint: 0x565662,
    transparent: true,
    opacity: 0.018,
  });
  const trayGlassMaterial = kit.material(0xdce2df, {
    tint: 0x7a7182,
    transparent: true,
    opacity: 0.58,
  });
  const rubberMaterial = kit.material(0x56535d, { tint: 0x3d3945 });
  const metalMaterial = kit.material(0x9697a0, { tint: 0x56515f });
  const warmInteriorMaterial = kit.material(0x978b82, {
    tint: 0x6f6670,
  });
  const foodMaterial = kit.material(accentLight, {
    tint: 0x796879,
    emissive: accentLight,
  });
  const displayMaterial = kit.material(0x424653, {
    tint: 0x2d2b35,
    emissive: 0xa9d8cf,
  });
  const digitMaterial = kit.material(0xcff5e9, {
    tint: 0x628184,
    emissive: 0xa9d8cf,
  });
  meshMaterial.depthWrite = false;
  glassMaterial.depthWrite = false;
  trayGlassMaterial.depthWrite = false;

  // Macro silhouette: a wide, deep, softly rounded shell with a separate
  // front fascia. The reference ratio is approximately 1.72:1 width:height.
  // Keep the control-side housing as the primary cabinet collider, then bridge
  // around the cavity with separate structural panels. A full-width solid box
  // here would place an opaque front face directly behind the glass.
  const cabinet = kit.mesh(
    'microwave-cabinet-shell',
    facetedPanelGeometry(1.24, 2.06, 1.58, 0.16),
    shellMaterial,
  );
  cabinet.position.set(1.16, 1.16, 0);
  tag(cabinet, 'cabinet-frame');

  const cabinetTopBridge = kit.mesh(
    'microwave-cabinet-top-bridge',
    facetedPanelGeometry(2.34, 0.23, 1.58, 0.1),
    shellMaterial,
  );
  cabinetTopBridge.position.set(-0.63, 2.075, 0);
  tag(cabinetTopBridge, 'cabinet-frame');

  const cabinetBottomBridge = kit.mesh(
    'microwave-cabinet-bottom-bridge',
    facetedPanelGeometry(2.34, 0.23, 1.58, 0.09),
    shellMaterial,
  );
  cabinetBottomBridge.position.set(-0.63, 0.245, 0);
  tag(cabinetBottomBridge, 'cabinet-frame');

  const cabinetLeftWall = kit.mesh(
    'microwave-cabinet-left-side-wall',
    facetedPanelGeometry(0.28, 1.72, 1.58, 0.09),
    shellMaterial,
  );
  cabinetLeftWall.position.set(-1.64, 1.16, 0);
  tag(cabinetLeftWall, 'cabinet-frame');

  const topHood = kit.mesh(
    'microwave-top-hood',
    facetedPanelGeometry(3.34, 0.18, 1.44, 0.13),
    shellHighlightMaterial,
  );
  topHood.position.set(-0.055, 2.1, -0.02);
  tag(topHood, 'top-hood');

  const topHoodStep = kit.mesh(
    'microwave-top-hood-pink-step',
    facetedPanelGeometry(2.62, 0.075, 1.36, 0.055),
    accentMaterial,
  );
  topHoodStep.position.set(-0.49, 2.02, 0.03);
  tag(topHoodStep, 'top-hood', true);

  const sideFacetPanel = kit.mesh(
    'microwave-side-facet-panel',
    facetedPanelGeometry(1.42, 1.74, 0.035, 0.14),
    shellHighlightMaterial,
  );
  sideFacetPanel.rotation.y = Math.PI * 0.5;
  sideFacetPanel.position.set(1.762, 1.18, -0.02);
  tag(sideFacetPanel, 'side-shell-system');

  // The reference has a real front opening. Keep only the fascia rails around
  // the window so the cavity is not hidden behind a solid red slab.
  const frontFascia = roundedBar(
    kit,
    'microwave-front-fascia',
    2.62,
    0.19,
    0.16,
    accentMaterial,
    kit.root,
    0.07,
  );
  frontFascia.position.set(-0.49, 2.08, 0.78);
  tag(frontFascia, 'door-surround');
  for (const [name, x] of [['left', -1.8], ['right', 0.82]] as const) {
    const rail = roundedBar(
      kit,
      `microwave-front-fascia-${name}-rail`,
      0.19,
      1.84,
      0.16,
      accentMaterial,
      kit.root,
      0.07,
    );
    rail.position.set(x, 1.16, 0.78);
    tag(rail, 'door-surround');
  }
  const lowerFascia = roundedBar(
    kit,
    'microwave-front-fascia-lower-rail',
    2.62,
    0.19,
    0.16,
    accentMaterial,
    kit.root,
    0.07,
  );
  lowerFascia.position.set(-0.49, 0.24, 0.78);
  tag(lowerFascia, 'door-surround');

  const lowerRail = kit.mesh(
    'microwave-lower-rail',
    facetedPanelGeometry(3.35, 0.17, 1.38, 0.06),
    shellShadowMaterial,
  );
  lowerRail.position.set(0, 0.24, -0.02);
  tag(lowerRail, 'lower-plinth');

  // The complete door lives under a true left-edge hinge pivot. Closed child
  // coordinates are offset from the pivot so future opening is a rotation,
  // not a translation masquerading as a hinge.
  const doorPivot = kit.pivot('microwave-door-hinge-pivot');
  doorPivot.position.set(-1.66, 0, 0);
  doorPivot.userData.rotationAxis = [0, 1, 0];
  doorPivot.userData.rotationRange = [0, -1.72];
  kit.socket('microwave-door-hinge-socket', doorPivot, [0, 1.18, 0.88]);

  // Build the door as real perimeter rails. The previous solid rounded boxes
  // filled the entire window aperture, so the transparent glass could never
  // reveal the rotating interior even though the tray was physically behind
  // it. Overlapping rails keep the soft Sakura outline at the four corners.
  const addDoorRails = (
    prefix: string,
    width: number,
    height: number,
    rail: number,
    depth: number,
    z: number,
    material: THREE.Material,
  ) => {
    for (const [side, x] of [['left', 1.17 - width * 0.5 + rail * 0.5], ['right', 1.17 + width * 0.5 - rail * 0.5]] as const) {
      const vertical = roundedBar(
        kit,
        `microwave-${prefix}-${side}-rail`,
        rail,
        height,
        depth,
        material,
        doorPivot,
        Math.min(0.11, rail * 0.42),
      );
      vertical.position.set(x, 1.2, z);
      tag(vertical, prefix.includes('outer') ? 'door-outer-frame' : 'door-inner-gasket');
    }
    for (const [side, y] of [['top', 1.2 + height * 0.5 - rail * 0.5], ['bottom', 1.2 - height * 0.5 + rail * 0.5]] as const) {
      const horizontal = roundedBar(
        kit,
        `microwave-${prefix}-${side}-rail`,
        width,
        rail,
        depth,
        material,
        doorPivot,
        Math.min(0.11, rail * 0.42),
      );
      horizontal.position.set(1.17, y, z);
      tag(horizontal, prefix.includes('outer') ? 'door-outer-frame' : 'door-inner-gasket');
    }
  };
  addDoorRails('door-outer-frame', 2.56, 1.73, 0.17, 0.17, 0.92, accentMaterial);
  addDoorRails('door-inner-frame', 2.36, 1.52, 0.09, 0.08, 1.025, cavityMaterial);

  // The cavity is fixed to the cabinet rather than parented to the door. Its
  // rear wall sits deep inside the shell so the floor, tray and food produce
  // real parallax instead of reading as objects pasted behind a grey panel.
  const cavityBack = kit.mesh(
    'microwave-interior-back-wall',
    new RoundedBoxGeometry(2.28, 1.42, 0.045, 3, 0.08),
    warmInteriorMaterial,
    kit.root,
    false,
  );
  cavityBack.position.set(-0.49, 1.22, -0.49);

  const cavityFloor = kit.mesh(
    'microwave-interior-floor',
    new RoundedBoxGeometry(2.24, 0.045, 1.56, 2, 0.025),
    warmInteriorMaterial,
    kit.root,
    false,
  );
  cavityFloor.position.set(-0.49, 0.49, 0.29);

  const cavityCeiling = kit.mesh(
    'microwave-interior-ceiling',
    new RoundedBoxGeometry(2.24, 0.04, 1.56, 2, 0.02),
    warmInteriorMaterial,
    kit.root,
    false,
  );
  cavityCeiling.position.set(-0.49, 1.95, 0.29);

  for (const [side, x] of [['left', -1.5], ['right', 0.52]] as const) {
    const cavityWall = kit.mesh(
      `microwave-interior-${side}-wall`,
    new RoundedBoxGeometry(0.04, 1.42, 1.56, 2, 0.018),
      warmInteriorMaterial,
      kit.root,
      false,
    );
    cavityWall.position.set(x, 1.22, 0.29);
  }

  const trayPivot = kit.pivot('microwave-tray-rotor-pivot');
  // Keep the complete rotating assembly inside a true cylindrical safety
  // envelope. The complete assembly now stays behind Z=0.94, leaving a deep
  // visual safety margin behind the smoked glass at Z=1.135. This prevents
  // perspective and transparent-layer sorting from making the tray appear to
  // project through the door or lower fascia.
  trayPivot.position.set(-0.49, 0.54, 0.16);
  trayPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('microwave-tray-rotor-socket', trayPivot, [0, 0, 0]);

  const tray = kit.mesh(
    'microwave-glass-tray',
    new THREE.CylinderGeometry(0.68, 0.68, 0.04, 28),
    trayGlassMaterial,
    trayPivot,
    false,
  );
  tray.position.y = 0.018;

  const trayRim = kit.mesh(
    'microwave-glass-tray-rim',
    new THREE.TorusGeometry(0.65, 0.02, 6, 28),
    trayGlassMaterial,
    trayPivot,
    false,
  );
  trayRim.rotation.x = Math.PI * 0.5;
  trayRim.position.y = 0.042;

  const foodPivot = kit.pivot('microwave-food-pivot', trayPivot);
  foodPivot.position.y = 0.068;
  kit.socket('microwave-food-socket', foodPivot, [0, 0, 0]);
  const plate = kit.mesh(
    'microwave-food-plate',
    new THREE.CylinderGeometry(0.57, 0.54, 0.06, 24),
    shellHighlightMaterial,
    foodPivot,
    false,
  );
  plate.position.y = 0.012;
  const food = kit.mesh(
    'microwave-food-main-volume',
    new RoundedBoxGeometry(0.82, 0.3, 0.56, 3, 0.11),
    foodMaterial,
    foodPivot,
    false,
  );
  food.position.set(0.05, 0.145, 0);
  food.rotation.y = 0.28;

  for (const [index, [x, z, scale]] of [
    [-0.18, 0.06, 0.92],
    [0.03, -0.1, 0.78],
    [0.22, 0.09, 0.72],
  ].entries()) {
    const topping = kit.mesh(
      `microwave-food-topping-${index + 1}`,
      new THREE.DodecahedronGeometry(0.115, 0),
      foodMaterial,
      foodPivot,
      false,
    );
    topping.position.set(x, 0.36, z);
    topping.scale.set(scale * 1.3, scale * 0.62, scale);
    topping.userData.explodeWithParent = true;
  }

  // Safety mesh: one bounded cross-hatch system rather than hundreds of
  // individual dots, preserving the reference's inner mesh identity at game scale.
  const meshLayer = kit.pivot('microwave-window-mesh-layer', doorPivot);
  meshLayer.position.set(1.17, 1.2, 1.105);
  for (let row = 0; row < 4; row += 1) {
    const bar = roundedBar(
      kit,
      `microwave-window-mesh-horizontal-${row + 1}`,
      2.12,
      0.01,
      0.006,
      meshMaterial,
      meshLayer,
      0.007,
      false,
    );
    bar.position.y = -0.48 + row * 0.32;
  }
  for (let column = 0; column < 6; column += 1) {
    const bar = roundedBar(
      kit,
      `microwave-window-mesh-vertical-${column + 1}`,
      0.006,
      1.16,
      0.012,
      meshMaterial,
      meshLayer,
      0.006,
      false,
    );
    bar.position.x = -0.9 + column * 0.36;
  }

  const doorGlass = kit.mesh(
    'microwave-smoked-door-glass',
    new RoundedBoxGeometry(2.36, 1.48, 0.018, 4, 0.1),
    glassMaterial,
    doorPivot,
    false,
  );
  doorGlass.position.set(1.17, 1.2, 1.13);
  doorGlass.renderOrder = 20;
  glassMaterial.depthTest = true;
  glassMaterial.depthWrite = false;
  glassMaterial.side = THREE.DoubleSide;

  const interiorLight = new THREE.PointLight(0xffe5dc, 0, 2.8, 1.4);
  interiorLight.name = 'microwave-interior-work-light';
  interiorLight.position.set(-0.49, 1.38, 0.12);
  interiorLight.castShadow = false;
  kit.root.add(interiorLight);
  kit.nodes.set(interiorLight.name, interiorLight);

  const steamRoot = kit.pivot('microwave-volumetric-steam-root');
  steamRoot.position.set(-0.49, 0.93, 0.78);
  const steamOffsets = [
    [-0.25, 0.01, -0.05], [-0.08, 0.04, 0.04], [0.13, 0, -0.03],
    [0.29, 0.03, 0.02], [-0.18, 0.09, 0.07], [0.03, 0.12, -0.08],
    [0.22, 0.1, 0.06], [-0.02, 0.18, 0.02],
  ] as const;
  steamOffsets.forEach(([x, y, z], index) => {
    const puff = kit.pivot(`microwave-steam-puff-${index + 1}`, steamRoot);
    puff.position.set(x, y, z);
    puff.visible = false;
    const material = kit.material(index % 2 === 0 ? 0xfff3e7 : 0xffd9c5, {
      tint: 0xd69bab,
      emissive: 0xffb777,
      transparent: true,
      opacity: 0,
    });
    for (let lobeIndex = 0; lobeIndex < 3; lobeIndex += 1) {
      const lobe = kit.mesh(
        `microwave-steam-puff-${index + 1}-lobe-${lobeIndex + 1}`,
        volumetricSteamLobeGeometry(index * 3 + lobeIndex),
        material,
        puff,
        false,
      );
      lobe.position.set(
        (lobeIndex - 1) * 0.085,
        lobeIndex === 1 ? 0.08 : 0,
        (lobeIndex % 2 === 0 ? -1 : 1) * 0.035,
      );
      lobe.scale.set(1 + lobeIndex * 0.1, 0.85 + lobeIndex * 0.16, 0.9);
      lobe.userData.explodeWithParent = true;
      lobe.userData.performanceProp = 'volumetric-low-poly-steam-lobe';
      lobe.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
    }
  });

  const heatWaveRoot = kit.pivot('microwave-volumetric-heat-wave-root');
  heatWaveRoot.position.set(-0.49, 1.02, 0.96);
  for (let index = 0; index < 4; index += 1) {
    const material = kit.material(index % 2 === 0 ? 0xff9b5c : 0xffd36b, {
      tint: 0xd64e76,
      emissive: 0xff6a45,
      transparent: true,
      opacity: 0,
    });
    const wave = kit.mesh(
      `microwave-heat-energy-wave-${index + 1}`,
      volumetricHeatWaveGeometry(index),
      material,
      heatWaveRoot,
      false,
    );
    wave.visible = false;
    wave.userData.performanceProp = 'thick-irregular-heat-energy-ring';
    wave.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];
  }

  const handlePivot = kit.pivot('microwave-door-handle-pivot', doorPivot);
  handlePivot.position.set(2.36, 1.2, 1.16);
  handlePivot.userData.rotationAxis = [1, 0, 0];
  kit.socket('microwave-door-handle-socket', handlePivot, [0, 0, 0]);
  const handleShadow = roundedBar(
    kit,
    'microwave-door-handle-shadow-gap',
    0.23,
    1.28,
    0.055,
    cavityMaterial,
    handlePivot,
    0.1,
  );
  handleShadow.position.z = -0.04;
  const handle = roundedBar(
    kit,
    'microwave-door-handle',
    0.17,
    1.16,
    0.11,
    shellHighlightMaterial,
    handlePivot,
    0.075,
  );
  handle.position.z = 0.025;
  tag(handle, 'door-handle');

  for (const [name, y] of [['upper', 0.49], ['lower', -0.49]] as const) {
    const mount = roundedBar(
      kit,
      `microwave-door-handle-${name}-mount`,
      0.27,
      0.23,
      0.16,
      accentMaterial,
      handlePivot,
      0.055,
    );
    mount.position.set(0, y, -0.02);
    tag(mount, 'door-handle', true);
  }

  // Fixed right control column with independent animated controls and sockets.
  const controlPanel = kit.mesh(
    'microwave-control-panel',
    facetedPanelGeometry(0.68, 1.68, 0.1, 0.1),
    accentMaterial,
  );
  controlPanel.position.set(1.25, 1.2, 0.94);
  tag(controlPanel, 'control-assembly');
  kit.socket('microwave-control-panel-socket', controlPanel, [0, 0, 0.07]);

  const display = kit.mesh(
    'microwave-control-display',
    facetedPanelGeometry(0.42, 0.24, 0.045, 0.045),
    displayMaterial,
  );
  display.position.set(1.25, 1.78, 1.0);
  tag(display, 'display-system');

  const displayDigits = kit.pivot('microwave-display-digits-pivot');
  displayDigits.position.set(1.25, 1.78, 1.025);
  for (const [index, x] of [-0.11, -0.035, 0.055, 0.13].entries()) {
    const digit = roundedBar(
      kit,
      `microwave-display-digit-${index + 1}`,
      0.035,
      0.095,
      0.01,
      digitMaterial,
      displayDigits,
      0.01,
    );
    digit.position.x = x;
  }

  for (let index = 0; index < 3; index += 1) {
    const indicatorMaterial = kit.material(0x6e6677, {
      tint: 0x4f4858,
      emissive: index === 2 ? 0xffd36b : 0xff7c78,
    });
    const sequenceIndicator = kit.mesh(
      `microwave-sequence-indicator-${index + 1}`,
      new THREE.CylinderGeometry(0.024, 0.024, 0.018, 8),
      indicatorMaterial,
      kit.root,
      false,
    );
    sequenceIndicator.rotation.x = Math.PI * 0.5;
    sequenceIndicator.position.set(1.08 + index * 0.09, 1.94, 1.015);
    sequenceIndicator.userData.performanceProp = 'sequential-work-state-indicator';
  }

  const smallButtonPivot = kit.pivot('microwave-small-button-pivot');
  smallButtonPivot.position.set(1.25, 1.5, 1.01);
  smallButtonPivot.userData.travelAxis = [0, 0, 1];
  kit.socket('microwave-small-button-socket', smallButtonPivot, [0, 0, 0]);
  const smallButton = kit.mesh(
    'microwave-small-round-button',
    new THREE.CylinderGeometry(0.075, 0.075, 0.055, 16),
    shellHighlightMaterial,
    smallButtonPivot,
  );
  smallButton.rotation.x = Math.PI * 0.5;
  const smallButtonIndex = roundedBar(
    kit,
    'microwave-small-round-button-index',
    0.015,
    0.054,
    0.012,
    accentDarkMaterial,
    smallButtonPivot,
    0.006,
  );
  smallButtonIndex.position.set(0, 0.025, 0.032);

  const dialPivot = kit.pivot('microwave-control-dial-pivot');
  dialPivot.position.set(1.25, 1.14, 1.02);
  dialPivot.userData.rotationAxis = [0, 0, 1];
  dialPivot.userData.rotationRange = [-1.25, 1.25];
  kit.socket('microwave-control-dial-socket', dialPivot, [0, 0, 0]);
  const dialOuter = kit.mesh(
    'microwave-control-dial-outer',
    new THREE.CylinderGeometry(0.255, 0.255, 0.07, 12),
    accentDarkMaterial,
    dialPivot,
  );
  dialOuter.rotation.x = Math.PI * 0.5;
  const dial = kit.mesh(
    'microwave-control-dial',
    new THREE.CylinderGeometry(0.215, 0.225, 0.1, 12),
    shellHighlightMaterial,
    dialPivot,
  );
  dial.rotation.x = Math.PI * 0.5;
  dial.position.z = 0.055;
  const dialMark = roundedBar(
    kit,
    'microwave-control-dial-index',
    0.018,
    0.115,
    0.015,
    accentDarkMaterial,
    dialPivot,
    0.008,
  );
  dialMark.position.set(0, 0.072, 0.115);

  for (let index = 0; index < 8; index += 1) {
    const angle = -Math.PI * 0.78 + (index / 7) * Math.PI * 1.56;
    const mark = roundedBar(
      kit,
      `microwave-control-dial-tick-${index + 1}`,
      0.012,
      0.035,
      0.012,
      accentDarkMaterial,
      kit.root,
      0.005,
    );
    mark.position.set(1.25 + Math.sin(angle) * 0.295, 1.14 + Math.cos(angle) * 0.295, 1.015);
    mark.rotation.z = -angle;
  }

  const lowerButtonPivot = kit.pivot('microwave-lower-button-pivot');
  lowerButtonPivot.position.set(1.25, 0.72, 1.0);
  lowerButtonPivot.userData.travelAxis = [0, 0, 1];
  kit.socket('microwave-lower-button-socket', lowerButtonPivot, [0, 0, 0]);
  roundedBar(
    kit,
    'microwave-lower-button',
    0.42,
    0.23,
    0.055,
    shellHighlightMaterial,
    lowerButtonPivot,
    0.055,
  );

  kit.indicator([1.48, 1.48, 1.035], 0.026);

  // Rear service identity remains visible in free-orbit gallery inspection.
  const rearPanel = kit.mesh(
    'microwave-rear-service-panel',
    facetedPanelGeometry(3.03, 1.6, 0.055, 0.13),
    accentMaterial,
  );
  rearPanel.position.set(0, 1.2, -0.82);
  tag(rearPanel, 'rear-service-panel');

  const ventPanel = kit.mesh(
    'microwave-rear-vent-recess',
    facetedPanelGeometry(2.14, 0.86, 0.035, 0.1),
    shellShadowMaterial,
  );
  ventPanel.position.set(0.15, 1.45, -0.857);
  tag(ventPanel, 'rear-service-panel', true);

  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      const vent = roundedBar(
        kit,
        `microwave-rear-vent-r${row + 1}-c${column + 1}`,
        0.3,
        0.034,
        0.018,
        accentDarkMaterial,
        kit.root,
        0.016,
        false,
      );
      vent.position.set(-0.61 + column * 0.37, 1.71 - row * 0.19, -0.883);
    }
  }

  for (const [index, [x, y]] of [
    [-1.43, 1.91],
    [1.43, 1.91],
    [-1.43, 0.49],
    [1.43, 0.49],
  ].entries()) {
    const screw = kit.mesh(
      `microwave-rear-fastener-${index + 1}`,
      new THREE.CylinderGeometry(0.036, 0.036, 0.022, 10),
      metalMaterial,
      kit.root,
      false,
    );
    screw.rotation.x = Math.PI * 0.5;
    screw.position.set(x, y, -0.858);
  }

  const inletPlate = kit.mesh(
    'microwave-rear-power-inlet-plate',
    facetedPanelGeometry(0.48, 0.3, 0.035, 0.055),
    accentMaterial,
  );
  inletPlate.position.set(0.9, 0.61, -0.86);
  const inlet = kit.mesh(
    'microwave-rear-power-inlet',
    facetedPanelGeometry(0.29, 0.17, 0.045, 0.035),
    cavityMaterial,
  );
  inlet.position.set(0.9, 0.61, -0.89);
  kit.socket('microwave-rear-power-socket', inlet, [0, 0, -0.04]);
  for (const x of [0.84, 0.96]) {
    const pin = kit.mesh(
      `microwave-rear-power-contact-${x < 0.9 ? 'left' : 'right'}`,
      new THREE.CylinderGeometry(0.018, 0.018, 0.024, 8),
      metalMaterial,
      kit.root,
      false,
    );
    pin.rotation.x = Math.PI * 0.5;
    pin.position.set(x, 0.61, -0.924);
  }

  for (const x of [-1.38, 1.38]) {
    for (const z of [-0.55, 0.55]) {
      const foot = kit.mesh(
        `microwave-foot-${x < 0 ? 'left' : 'right'}-${z < 0 ? 'rear' : 'front'}`,
        facetedPanelGeometry(0.38, 0.18, 0.38, 0.055),
        rubberMaterial,
        kit.root,
        true,
      );
      foot.position.set(x, 0.09, z);
      tag(foot, 'foot-system');
    }
  }

  kit.socket('microwave-left-connection-socket', kit.root, [-1.93, 1.095, 1.275]);
  kit.socket('microwave-right-connection-socket', kit.root, [1.815, 1.095, 1.275]);
  kit.socket('microwave-top-connection-socket', kit.root, [-0.0575, 2.225, 1.275]);
  kit.socket('microwave-bottom-connection-socket', kit.root, [-0.0575, -0.035, 1.275]);
  applyMicrowaveOutlineHierarchy(kit.root);

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? V2_REFERENCE_PATH,
      reconstructed: [
        'wide low clipped-corner cabinet with a stepped cream hood, pink plinth, broad right side facet and four faceted feet',
        'left-hinged three-depth door with pink outer frame, dark gasket, smoked glass, restrained safety mesh and thick mounted ivory handle',
        'faceted right control tower with mint display, small indexed button, oversized twelve-sided dial and lower clipped button',
        'stepped rear service cassette with four-by-five vent field, four corner fasteners and frozen recessed power inlet',
        'bright fixed-depth interior cavity with enlarged horizontal glass turntable, plate and readable food volume behind the clear door window',
        'model-owned irregular low-poly steam lobes and thick torus heat-energy waves staged inside the cavity',
        'independent door hinge, Y-axis tray rotor, controls, rear inlet and four frozen scene-edge cable sockets',
        'stable main, structure and detail outline tiers with object-space plus/minus eighteen percent variation',
      ],
      inferred: [
        'interior cavity depth, glass tray support, plate and food silhouette are inferred because the door is closed in every source view',
        'door gasket cross-section and hinge barrel interior are inferred from typical domestic microwave construction',
        'underside service seams, magnetron, waveguide, wiring and electronics are not visible and intentionally omitted',
        'rear power inlet preserves the reference hierarchy but does not assert a specific electrical standard',
      ],
    },
  );
  build.root.userData.microwavePerformanceRig = {
    timelineOwner: 'AppliancePerformanceSystem',
    effectOwner: 'microwave-model-rig',
    wholeMachineNode: build.root.name,
    rotatingAssembly: 'microwave-tray-rotor-pivot',
    foodNode: 'microwave-food-pivot',
    steamRoot: 'microwave-volumetric-steam-root',
    heatWaveRoot: 'microwave-volumetric-heat-wave-root',
    indicatorNodes: [
      'microwave-sequence-indicator-1',
      'microwave-sequence-indicator-2',
      'microwave-sequence-indicator-3',
    ],
    volumetricForms: ['irregular icosahedral steam clusters', 'thick irregular torus heat-energy rings'],
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  };
  build.root.userData.previewLightingProfile = 'sakura-appliance-v2';
  build.root.userData.previewFramingScale = 0.91;
  build.root.userData.legacyReferencePath = REFERENCE_PATH;
  build.root.userData.referenceDimensions = {
    archivedBounds: { min: [-1.895, 0, -0.936], max: [1.78, 2.19, 1.24] },
    doorHinge: [-1.66, 0, 0],
    trayRotor: [-0.49, 0.54, 0.16],
    dialPivot: [1.25, 1.14, 1.02],
  };
  build.root.userData.sculptRuntime.colliders = [
    { id: 'microwave-cabinet', type: 'box', node: 'microwave-cabinet-shell' },
    { id: 'microwave-door', type: 'box', node: 'microwave-door-hinge-pivot', trigger: true },
    { id: 'microwave-tray', type: 'cylinder', node: 'microwave-tray-rotor-pivot', trigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    ['microwave-cabinet-shell', 'microwave-front-fascia', 'microwave-lower-rail'],
    ['microwave-door-hinge-pivot', 'microwave-door-handle-pivot'],
    ['microwave-tray-rotor-pivot', 'microwave-food-pivot'],
    ['microwave-control-panel', 'microwave-control-dial-pivot'],
  ];
  return build;
}
