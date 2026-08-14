import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { setHullOutlineStyle } from '../../style/outline';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'E:/AI/codexAI/sakula/arrow-cube/references/intake/smart-bin/front.png';
const ACTIVE_DURATION = 5.2;
const LID_DEPTH = 0.86;
const OUTLINE = {
  main: 0.0048,
  structure: 0.0041,
  detail: 0.0033,
  variation: 0.18,
} as const;

function accentShift(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function rounded(width: number, height: number, depth: number, radius: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, 1, radius);
}

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) * (Math.PI * 2 / 10000);
}

function applySmartBinOutlineHierarchy(root: THREE.Object3D): void {
  const main = /body-(?:front|back|left|right)-wall|bottom-rose-skirt|rose-lid-shell|front-door-facet/;
  const structure = /upper-rose-rail|corner-armor|lid-crown|infrared-sensor-window|rear-handle-recess|lid-hinge-block|foot-/;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.isOutline === true) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => material.transparent) || /trash|inner-|sensor-glow/.test(object.name)) {
      object.userData.outlineTier = 'excluded';
      object.userData.outlineStable = true;
    }
  });
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object.userData.isOutline !== true) return;
    const source = object.parent?.name ?? object.name;
    const sourceMesh = object.parent instanceof THREE.Mesh ? object.parent : null;
    const sourceMaterials = sourceMesh
      ? (Array.isArray(sourceMesh.material) ? sourceMesh.material : [sourceMesh.material])
      : [];
    const excluded = sourceMaterials.some((material) => material.transparent)
      || /trash|inner-|sensor-glow/.test(source);
    if (excluded) {
      object.visible = false;
      object.userData.outlineTier = 'excluded';
      return;
    }
    const tier = main.test(source) ? 'main' : structure.test(source) ? 'structure' : 'detail';
    setHullOutlineStyle(object, {
      thickness: OUTLINE[tier],
      variation: OUTLINE.variation,
      phase: stableOutlinePhase(source),
    });
    object.userData.outlineTier = tier;
    object.userData.outlineStable = true;
    sourceMesh?.userData && (sourceMesh.userData.outlineTier = tier);
  });
}

function chamferedPanelGeometry(width: number, height: number, depth: number, inset: number): THREE.ExtrudeGeometry {
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + inset, halfHeight);
  shape.lineTo(halfWidth - inset, halfHeight);
  shape.lineTo(halfWidth, halfHeight - inset);
  shape.lineTo(halfWidth, -halfHeight + inset);
  shape.lineTo(halfWidth - inset, -halfHeight);
  shape.lineTo(-halfWidth + inset, -halfHeight);
  shape.lineTo(-halfWidth, -halfHeight + inset);
  shape.lineTo(-halfWidth, halfHeight - inset);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -depth * 0.5);
  return geometry;
}

const SMART_BIN_TRASH_TYPES = [
  'paper-ball', 'banana-peel', 'aluminum-can', 'plastic-bottle',
  'apple-core', 'coffee-cup', 'chip-bag', 'takeout-box',
] as const;

function addTrashRig(
  kit: ApplianceModelKit,
  materials: readonly THREE.Material[],
): void {
  const rig = kit.pivot('smart-bin-trash-rig');
  rig.userData.effectOwner = 'smart-bin-model-rig';
  rig.userData.volumetricOnly = true;
  const add = (
    parent: THREE.Group,
    suffix: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: readonly [number, number, number] = [0, 0, 0],
  ): THREE.Mesh => {
    const mesh = kit.mesh(`${parent.name}-${suffix}`, geometry, material, parent, false);
    mesh.position.set(...position);
    mesh.userData.explodeWithParent = true;
    return mesh;
  };

  SMART_BIN_TRASH_TYPES.forEach((type, index) => {
    const item = kit.pivot(`smart-bin-trash-${type}-pivot`, rig);
    item.visible = false;
    item.userData.trashType = type;
    item.userData.flightIndex = index;
    item.userData.performanceOwner = 'SmartBinPerformance';
    const material = materials[index % materials.length];
    if (type === 'paper-ball') {
      add(item, 'crumpled-volume', new THREE.DodecahedronGeometry(0.18, 1).scale(1.08, 0.82, 0.94), material);
      add(item, 'fold-ridge', new THREE.TorusGeometry(0.105, 0.012, 5, 10, Math.PI * 1.25), materials[1]).rotation.x = 0.8;
    } else if (type === 'banana-peel') {
      add(item, 'stem', new THREE.CylinderGeometry(0.035, 0.055, 0.22, 7), materials[2], [0, 0.08, 0]);
      for (let lobe = 0; lobe < 3; lobe += 1) {
        const angle = lobe / 3 * Math.PI * 2;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.02, 0),
          new THREE.Vector3(Math.cos(angle) * 0.08, -0.05, Math.sin(angle) * 0.08),
          new THREE.Vector3(Math.cos(angle) * 0.19, -0.13, Math.sin(angle) * 0.19),
          new THREE.Vector3(Math.cos(angle) * 0.25, -0.04, Math.sin(angle) * 0.25),
        ]);
        add(item, `curved-lobe-${lobe + 1}`, new THREE.TubeGeometry(curve, 10, 0.038, 6, false), materials[2]);
      }
    } else if (type === 'aluminum-can') {
      add(item, 'can-body', new THREE.CylinderGeometry(0.105, 0.105, 0.34, 12), material);
      add(item, 'top-rim', new THREE.TorusGeometry(0.086, 0.012, 5, 12), materials[5], [0, 0.17, 0]).rotation.x = Math.PI * 0.5;
      add(item, 'bottom-rim', new THREE.TorusGeometry(0.086, 0.012, 5, 12), materials[5], [0, -0.17, 0]).rotation.x = Math.PI * 0.5;
    } else if (type === 'plastic-bottle') {
      const profile = [
        new THREE.Vector2(0.04, -0.25), new THREE.Vector2(0.105, -0.22),
        new THREE.Vector2(0.12, 0.1), new THREE.Vector2(0.075, 0.18),
        new THREE.Vector2(0.048, 0.29), new THREE.Vector2(0, 0.29),
      ];
      add(item, 'bottle-body', new THREE.LatheGeometry(profile, 12), material);
      add(item, 'bottle-cap', new THREE.CylinderGeometry(0.052, 0.052, 0.055, 10), materials[3], [0, 0.315, 0]);
    } else if (type === 'apple-core') {
      add(item, 'core-waist', new THREE.CylinderGeometry(0.075, 0.075, 0.27, 8), material);
      add(item, 'top-fruit', new THREE.DodecahedronGeometry(0.125, 0).scale(1.2, 0.55, 1.05), materials[4], [0, 0.14, 0]);
      add(item, 'bottom-fruit', new THREE.DodecahedronGeometry(0.115, 0).scale(1.15, 0.5, 1), materials[4], [0, -0.14, 0]);
      add(item, 'stem', new THREE.CylinderGeometry(0.018, 0.025, 0.13, 6), materials[0], [0.02, 0.27, 0]);
    } else if (type === 'coffee-cup') {
      add(item, 'cup-shell', new THREE.CylinderGeometry(0.13, 0.105, 0.31, 12, 1, true), material);
      add(item, 'cup-rim', new THREE.TorusGeometry(0.13, 0.015, 5, 12), materials[0], [0, 0.155, 0]).rotation.x = Math.PI * 0.5;
      add(item, 'cup-lid', new THREE.CylinderGeometry(0.142, 0.142, 0.035, 12), materials[0], [0, 0.18, 0]);
    } else if (type === 'chip-bag') {
      add(item, 'puffed-packet', rounded(0.29, 0.38, 0.13, 0.055), material);
      add(item, 'top-crimp', new THREE.CylinderGeometry(0.022, 0.022, 0.3, 6), materials[5], [0, 0.205, 0]).rotation.z = Math.PI * 0.5;
      add(item, 'bottom-crimp', new THREE.CylinderGeometry(0.022, 0.022, 0.3, 6), materials[5], [0, -0.205, 0]).rotation.z = Math.PI * 0.5;
    } else {
      add(item, 'lower-tray', rounded(0.36, 0.15, 0.29, 0.045), material, [0, -0.07, 0]);
      const lid = add(item, 'hinged-lid', rounded(0.35, 0.08, 0.28, 0.04), materials[0], [0, 0.08, -0.035]);
      lid.rotation.x = -0.18;
    }
  });
}

/**
 * Three-view procedural reconstruction of the SAKURA touchless smart bin.
 * Local frame: +Y up, +Z front, floor at Y=0. The rear/underside motor,
 * liner electronics and battery are inferred because they are occluded by
 * the supplied turn sheet; their runtime sockets remain explicit.
 */
export function createSmartBinModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const rose = accentShift(options.accent, 0.08, -0.08);
  const roseLight = accentShift(options.accent, 0.19, -0.12);
  const roseDark = accentShift(options.accent, -0.08, -0.02);

  const cream = kit.material(0xf4e7d5, { tint: 0x756a7b });
  const roseMaterial = kit.material(rose, { tint: 0x745b70 });
  const roseLightMaterial = kit.material(roseLight, { tint: 0x876d7c });
  const roseDarkMaterial = kit.material(roseDark, { tint: 0x5f5066 });
  const creamHighlight = kit.material(0xfff3df, { tint: 0x8e7d89 });
  const cavity = kit.material(0x5b4854, { tint: 0x433846 });
  const sensorMaterial = kit.material(0x18151c, { tint: 0x4e3b4d, emissive: 0x000000 });
  const linerMaterial = kit.material(0xe9ded0, {
    tint: 0x766a77,
    transparent: true,
    opacity: 0.16,
  });
  linerMaterial.depthWrite = false;

  // Main silhouette is assembled from four thick walls. Unlike the previous
  // single solid rounded box, this leaves a genuine top opening for the well.
  const bodyPivot = kit.pivot('smart-bin-body-pivot');
  bodyPivot.position.y = 0.58;
  const bodyShell = kit.pivot('smart-bin-body-shell', bodyPivot);
  bodyShell.userData.part = 'body-shell';
  [
    ['front', 1.62, 1.04, 0.18, 0, 0, 0.33],
    ['back', 1.62, 1.04, 0.18, 0, 0, -0.33],
    ['left', 0.20, 1.04, 0.50, -0.71, 0, 0],
    ['right', 0.20, 1.04, 0.50, 0.71, 0, 0],
  ].forEach(([name, width, height, depth, x, y, z]) => {
    const wall = kit.mesh(`smart-bin-body-${name}-wall`, rounded(width as number, height as number, depth as number, 0.085), cream, bodyShell);
    wall.position.set(x as number, y as number, z as number);
    wall.userData.explodeWithParent = true;
  });

  // An inset octagonal front plate breaks the former flat cabinet face into a
  // strong game-readable disposal-door mass without changing the outer shell.
  const frontDoor = kit.mesh(
    'smart-bin-front-door-facet',
    chamferedPanelGeometry(1.34, 0.72, 0.012, 0.105),
    creamHighlight,
    bodyPivot,
  );
  frontDoor.position.set(0, -0.025, 0.423);
  frontDoor.userData.part = 'front-door-facet';

  const upperRail = kit.pivot('smart-bin-upper-rose-rail', bodyPivot);
  upperRail.userData.explodeWithParent = true;
  [
    ['front', 1.65, 0.20, 0.13, 0, 0.49, 0.40],
    ['back', 1.65, 0.20, 0.13, 0, 0.49, -0.40],
    ['left', 0.13, 0.20, 0.68, -0.76, 0.49, 0],
    ['right', 0.13, 0.20, 0.68, 0.76, 0.49, 0],
  ].forEach(([name, width, height, depth, x, y, z]) => {
    const rail = kit.mesh(`smart-bin-upper-rose-rail-${name}`, rounded(width as number, height as number, depth as number, 0.045), roseMaterial, upperRail);
    rail.position.set(x as number, y as number, z as number);
    rail.userData.explodeWithParent = true;
  });

  const bottomSkirt = kit.mesh(
    'smart-bin-bottom-rose-skirt',
    rounded(1.64, 0.23, 0.86, 0.085),
    roseMaterial,
    bodyPivot,
  );
  bottomSkirt.position.y = -0.49;
  bottomSkirt.userData.part = 'bottom-skirt';

  const upperSeam = kit.mesh(
    'smart-bin-upper-shell-seam',
    rounded(1.53, 0.028, 0.848, 0.012),
    roseDarkMaterial,
    bodyPivot,
    false,
  );
  upperSeam.position.y = 0.37;
  upperSeam.userData.explodeWithParent = true;
  const lowerSeam = kit.mesh(
    'smart-bin-lower-shell-seam',
    rounded(1.53, 0.028, 0.848, 0.012),
    roseDarkMaterial,
    bodyPivot,
    false,
  );
  lowerSeam.position.y = -0.38;
  lowerSeam.userData.explodeWithParent = true;

  // Four vertical inner walls and a floor 0.82 units below the rim establish
  // real downward depth. There is deliberately no horizontal cap at the mouth.
  const cavityWell = kit.pivot('smart-bin-inner-cavity', bodyPivot);
  cavityWell.userData.part = 'inner-cavity';
  cavityWell.userData.openMouth = true;
  cavityWell.userData.depth = 0.82;
  const innerWalls = [
    ['front', 1.26, 0.78, 0.045, 0, 0.08, 0.25],
    ['back', 1.26, 0.78, 0.045, 0, 0.08, -0.25],
    ['left', 0.045, 0.78, 0.50, -0.61, 0.08, 0],
    ['right', 0.045, 0.78, 0.50, 0.61, 0.08, 0],
  ] as const;
  innerWalls.forEach(([name, width, height, depth, x, y, z]) => {
    const wall = kit.mesh(`smart-bin-inner-${name}-wall`, rounded(width, height, depth, 0.018), linerMaterial, cavityWell, false);
    wall.position.set(x, y, z);
    wall.userData.explodeWithParent = true;
  });
  const cavityFloor = kit.mesh('smart-bin-inner-deep-floor', rounded(1.22, 0.055, 0.48, 0.025), cavity, cavityWell, false);
  cavityFloor.position.y = -0.325;
  cavityFloor.userData.depthBelowRim = 0.82;
  cavityFloor.userData.explodeWithParent = true;

  // Rear-axis lid. The reference side view establishes the right circular
  // hinge barrel; the paired block layout is a symmetry-preserving inference.
  const lidPivot = kit.pivot('smart-bin-lid-hinge-pivot');
  lidPivot.position.set(0, 1.17, -0.43);
  lidPivot.userData.rotationAxis = [1, 0, 0];
  lidPivot.userData.rotationRange = [0, -1.25];
  kit.socket('smart-bin-lid-hinge-axis-socket', lidPivot, [0, 0, 0]);
  kit.socket('smart-bin-lid-inner-panel-socket', lidPivot, [0, 0.02, 0.12]);

  const lidShell = kit.mesh(
    'smart-bin-rose-lid-shell',
    rounded(1.57, 0.13, LID_DEPTH, 0.065),
    roseMaterial,
    lidPivot,
  );
  // Keep the closed lid centered over the shell while its rear-bottom edge
  // lands exactly on the hinge axis. Rotation therefore never happens around
  // the lid centre and cannot introduce the previous fore/aft offset.
  lidShell.position.set(0, 0.065, LID_DEPTH * 0.5);
  lidShell.userData.part = 'lid-shell';
  const lidInner = kit.mesh(
    'smart-bin-lid-inner-panel',
    rounded(1.34, 0.035, 0.60, 0.017),
    roseLightMaterial,
    lidPivot,
    false,
  );
  lidInner.position.set(0, -0.008, 0.43);
  lidInner.userData.explodeWithParent = true;
  const lidInnerShade = kit.mesh(
    'smart-bin-lid-inner-cavity-shade',
    rounded(1.18, 0.018, 0.43, 0.008),
    roseDarkMaterial,
    lidPivot,
    false,
  );
  lidInnerShade.position.set(0, -0.032, 0.43);
  lidInnerShade.userData.explodeWithParent = true;

  const lidCrown = kit.mesh(
    'smart-bin-lid-crown-facet',
    chamferedPanelGeometry(1.33, 0.65, 0.035, 0.12),
    creamHighlight,
    lidPivot,
  );
  lidCrown.rotation.x = -Math.PI * 0.5;
  lidCrown.position.set(0, 0.11, 0.43);
  lidCrown.userData.part = 'lid-crown-facet';

  const hingeGeometry = new THREE.CylinderGeometry(0.11, 0.11, 0.16, 16);
  [-0.48, 0.48].forEach((x, index) => {
    const hinge = kit.mesh(
      `smart-bin-lid-hinge-block-${index + 1}`,
      rounded(0.18, 0.17, 0.16, 0.04),
      roseLightMaterial,
      bodyPivot,
    );
    hinge.position.set(x, 0.59, -0.35);
    hinge.userData.part = `lid-hinge-${index + 1}`;
    const barrel = kit.mesh(
      `smart-bin-lid-hinge-barrel-${index + 1}`,
      hingeGeometry,
      roseDarkMaterial,
      bodyPivot,
      false,
    );
    barrel.rotation.z = Math.PI * 0.5;
    barrel.position.set(x, 0.59, -0.43);
    barrel.userData.explodeWithParent = true;
  });

  // Front sensor capsule and a small powered indicator, the key use cue.
  const sensor = kit.mesh(
    'smart-bin-infrared-sensor-window',
    rounded(0.27, 0.085, 0.042, 0.035),
    sensorMaterial,
    bodyPivot,
  );
  sensor.position.set(0, 0.49, 0.455);
  sensor.userData.part = 'sensor-window';
  const sensorBezel = kit.mesh(
    'smart-bin-sensor-bezel',
    chamferedPanelGeometry(0.42, 0.16, 0.018, 0.045),
    roseDarkMaterial,
    bodyPivot,
  );
  sensorBezel.position.set(0, 0.49, 0.441);
  sensorBezel.userData.part = 'sensor-bezel';
  // Draw the glass after the bezel so the frozen glow and trigger socket keep
  // their established front-face contact.
  sensor.renderOrder = 1;
  const sensorGlow = kit.mesh(
    'smart-bin-sensor-glow-strip',
    rounded(0.11, 0.018, 0.012, 0.008),
    kit.indicatorMaterial,
    bodyPivot,
    false,
  );
  sensorGlow.position.set(0, 0.492, 0.48);
  sensorGlow.userData.explodeWithParent = true;
  sensorGlow.visible = false;
  kit.socket('smart-bin-sensor-trigger-socket', bodyPivot, [0, 0.49, 0.5]);

  // Rear pull recess is visible in the closed back reference. Its exact depth
  // is inferred because the supplied image does not expose the inside wall.
  const rearHandle = kit.mesh(
    'smart-bin-rear-handle-recess',
    rounded(0.48, 0.12, 0.055, 0.03),
    cavity,
    bodyPivot,
  );
  rearHandle.position.set(0, 0.51, -0.455);
  rearHandle.userData.part = 'rear-handle-recess';
  const rearHandleLip = kit.mesh(
    'smart-bin-rear-handle-lip',
    rounded(0.43, 0.035, 0.035, 0.012),
    roseDarkMaterial,
    bodyPivot,
    false,
  );
  rearHandleLip.position.set(0, 0.59, -0.46);
  rearHandleLip.userData.explodeWithParent = true;

  // Four named support feet. Shared geometry keeps the appliance inexpensive.
  const footGeometry = rounded(0.25, 0.12, 0.24, 0.035);
  const footPositions: readonly (readonly [number, number, number])[] = [
    [-0.58, 0.02, 0.27], [0.58, 0.02, 0.27], [-0.58, 0.02, -0.27], [0.58, 0.02, -0.27],
  ];
  footPositions.forEach(([x, y, z], index) => {
    const footPivot = kit.pivot(`smart-bin-foot-pivot-${index + 1}`, bodyPivot);
    footPivot.position.set(x, y - 0.56, z);
    const foot = kit.mesh(`smart-bin-foot-${index + 1}`, footGeometry, roseMaterial, footPivot, false);
    foot.userData.part = `foot-${index + 1}`;
    const pad = kit.mesh(
      `smart-bin-foot-pad-${index + 1}`,
      rounded(0.19, 0.025, 0.18, 0.01),
      roseDarkMaterial,
      footPivot,
      false,
    );
    pad.position.y = -0.07;
    pad.userData.explodeWithParent = true;
  });

  // Inferred rear-lower power inlet and connection socket keep this prop
  // compatible with the existing plug-in interaction system.
  const powerInlet = kit.mesh(
    'smart-bin-power-inlet-inferred',
    rounded(0.23, 0.14, 0.05, 0.025),
    roseDarkMaterial,
    bodyPivot,
  );
  powerInlet.position.set(0.56, -0.42, -0.45);
  const powerCavity = kit.mesh(
    'smart-bin-power-inlet-cavity',
    rounded(0.14, 0.065, 0.018, 0.012),
    cavity,
    bodyPivot,
    false,
  );
  powerCavity.position.set(0.56, -0.42, -0.48);
  powerCavity.userData.explodeWithParent = true;
  kit.socket('smart-bin-power-connection-socket', bodyPivot, [0.56, -0.42, -0.5]);

  addTrashRig(kit, [
    cream,
    roseLightMaterial,
    kit.material(0xf3c85b, { tint: 0x8a694e }),
    kit.material(0x79b7bc, { tint: 0x4a6874, transparent: true, opacity: 0.78 }),
    kit.material(0xb6c56b, { tint: 0x637052 }),
    kit.material(0x92a0aa, { tint: 0x59616e }),
    kit.material(0xe9828f, { tint: 0x765063 }),
    kit.material(0xd3a56f, { tint: 0x75604d }),
  ]);

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'faceted cream cabinet with inset octagonal disposal door, Sakura corner armor, upper rail and lower skirt',
        'oversized rear-axis lid with chamfered cream crown, Sakura badge, inset inner panel and paired hinge blocks',
        'genuinely open mouth with four vertical liner walls and a floor recessed 0.82 units below the rim',
        'enlarged layered infrared sensor module, back-view handle recess with faceted grip, four independent feet and seam rails',
        'named inferred rear power inlet and sensor trigger socket for existing plug-in gameplay',
        'eight named volumetric trash props owned by the smart-bin performance rig',
        'three stable object-space outline tiers on solid shell geometry with transparent and animated effect exclusions',
      ],
      inferred: [
        'lid motor, battery, inner bag liner fastening and control PCB are hidden behind shell',
        'rear power inlet and handle recess depth are inferred from the back silhouette',
        'hinge axle bearing and underside screw bosses are not visible in supplied views',
      ],
    },
  );

  build.root.userData.sculptRuntime.colliders = [
    { id: 'smart-bin-body', type: 'box', node: 'smart-bin-body-pivot' },
    { id: 'smart-bin-lid', type: 'box', node: 'smart-bin-rose-lid-shell' },
    { id: 'smart-bin-sensor-trigger', type: 'box', node: 'smart-bin-infrared-sensor-window', isTrigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'body-shell', nodes: ['smart-bin-body-shell', 'smart-bin-front-door-facet', 'smart-bin-upper-rose-rail', 'smart-bin-bottom-rose-skirt', 'smart-bin-inner-cavity'] },
    { id: 'lid-assembly', nodes: ['smart-bin-lid-hinge-pivot', 'smart-bin-rose-lid-shell', 'smart-bin-lid-crown-facet', 'smart-bin-lid-inner-panel'] },
    { id: 'sensor-module', nodes: ['smart-bin-sensor-bezel', 'smart-bin-infrared-sensor-window', 'smart-bin-sensor-glow-strip'] },
    { id: 'foot-array', nodes: ['smart-bin-foot-pivot-1', 'smart-bin-foot-pivot-2', 'smart-bin-foot-pivot-3', 'smart-bin-foot-pivot-4'] },
  ];
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.externalPerformanceCue = {
    type: 'smart-bin-owned-volumetric-trash',
    socket: 'smart-bin-lid-inner-panel-socket',
    poolSize: 8,
    launchWindow: [0.72, 3.24],
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  };
  build.root.userData.outlineContract = {
    main: OUTLINE.main,
    structure: OUTLINE.structure,
    detail: OUTLINE.detail,
    variation: OUTLINE.variation,
    stable: true,
    style: 'SAKURA low-poly three-band ink; transparent liner, sensor glow and flying trash excluded',
  };
  build.root.userData.smartBinV2 = {
    geometryLanguage: 'faceted-touchless-disposal-totem',
    exaggeration: 'identity features enlarged within the archived package',
    referenceStatus: 'conditional-fallback-v1-four-view-not-gpt-image-2',
    frozenRuntime: [
      'smart-bin-body-pivot',
      'smart-bin-lid-hinge-pivot',
      'smart-bin-lid-hinge-axis-socket',
      'smart-bin-lid-inner-panel-socket',
      'smart-bin-sensor-trigger-socket',
      'smart-bin-power-connection-socket',
      ...SMART_BIN_TRASH_TYPES.map((type) => `smart-bin-trash-${type}-pivot`),
    ],
    envelopePolicy: 'archived v1 bounds, ground, colliders and animation contacts are authoritative',
  };
  applySmartBinOutlineHierarchy(build.root);
  return build;
}
