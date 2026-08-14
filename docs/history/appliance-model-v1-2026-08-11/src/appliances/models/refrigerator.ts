import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_19 (7).png';

function shiftedAccent(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function roundedBar(
  kit: ApplianceModelKit,
  name: string,
  width: number,
  height: number,
  depth: number,
  radius: number,
  material: THREE.Material,
  parent: THREE.Object3D,
  outlined = true,
): THREE.Mesh {
  const mesh = kit.mesh(
    name,
    new RoundedBoxGeometry(width, height, depth, 3, radius),
    material,
    parent,
    outlined,
  );
  mesh.userData.explodeWithParent = true;
  return mesh;
}

/**
 * Programmatic reconstruction of the supplied three-view retro refrigerator.
 *
 * Local frame: +Y up, +Z front, floor at Y=0. Upper and lower doors are
 * children of separate right-edge hinge pivots. The rear service assembly is
 * isolated so compressor vibration never perturbs drag/drop transforms.
 */
export function createRefrigeratorModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = shiftedAccent(options.accent, 0.19, -0.12);
  const accentMid = shiftedAccent(options.accent, 0.06, -0.05);
  const accentDark = shiftedAccent(options.accent, -0.1, -0.02);

  const shellMaterial = kit.material(0xeee8dc, { tint: 0x71677e });
  const shellHighlightMaterial = kit.material(0xf8f1e6, { tint: 0x766b81 });
  const shellShadowMaterial = kit.material(0xd6cfc6, { tint: 0x665c71 });
  const accentMaterial = kit.material(accentMid, { tint: 0x685d73 });
  const accentLightMaterial = kit.material(accentLight, { tint: 0x74677c });
  const accentDarkMaterial = kit.material(accentDark, { tint: 0x5e5268 });
  const gasketMaterial = kit.material(0x696672, { tint: 0x4b4656 });
  const rubberMaterial = kit.material(0x5b5963, { tint: 0x403c49 });
  const metalMaterial = kit.material(0xaaa7ad, { tint: 0x615a69 });
  const coldLightMaterial = kit.material(accentLight, {
    tint: 0x71677e,
    emissive: accentLight,
    transparent: true,
    opacity: 0.62,
  });
  const interiorMaterial = kit.material(0xdce8e7, {
    tint: 0x6d7b86,
    emissive: accentLight,
  });
  interiorMaterial.emissiveIntensity = 0.04;
  const interiorShadowMaterial = kit.material(0x9eb8bb, {
    tint: 0x5f6d7b,
    emissive: accentLight,
  });
  interiorShadowMaterial.emissiveIntensity = 0.025;
  const shelfMaterial = kit.material(0xeaf3f1, {
    tint: 0x71808c,
    transparent: true,
    opacity: 0.78,
  });
  shelfMaterial.depthWrite = false;
  const cartonMaterial = kit.material(0xf3ead8, { tint: 0x8b7181 });
  const cartonAccentMaterial = kit.material(0xe8a6b8, { tint: 0x76596e });
  const fishMaterial = kit.material(0x8fc4c8, { tint: 0x536b7a });
  const fishBellyMaterial = kit.material(0xd8edef, { tint: 0x77818d });
  const steakMaterial = kit.material(0xc85f72, { tint: 0x754657 });
  const steakFatMaterial = kit.material(0xf1c7b4, { tint: 0x876a73 });
  const storageMaterial = kit.material(0xbddbd9, { tint: accentMid, transparent: true, opacity: 0.72 });
  storageMaterial.depthWrite = false;
  const storageLidMaterial = kit.material(0xf1a7be, { tint: 0x795d73 });
  const fruitRedMaterial = kit.material(0xd96878, { tint: 0x784957 });
  const fruitWarmMaterial = kit.material(0xe6a05f, { tint: 0x7b5a67 });
  const vegetableMaterial = kit.material(0x79a978, { tint: 0x526d66 });
  const vegetableLightMaterial = kit.material(0xafd18d, { tint: 0x647764 });
  const drinkMaterial = kit.material(0xf0b36f, { tint: 0x7b6170, transparent: true, opacity: 0.84 });
  drinkMaterial.depthWrite = false;
  const labelMaterial = kit.material(0xf6e3ee, { tint: accentMid });
  const darkFoodMaterial = kit.material(0x6d5868, { tint: 0x403a49 });

  // The old full-volume cabinet blocked the interior and forced every shelf to
  // masquerade as a shallow front plate. This load-bearing frame leaves two
  // genuinely open cavities while preserving the same rounded silhouette.
  const cabinetFrame = kit.pivot('refrigerator-cabinet-frame');
  const rearInset = roundedBar(
    kit,
    'refrigerator-rear-inset-shell',
    2.6,
    4.58,
    0.18,
    0.15,
    shellShadowMaterial,
    cabinetFrame,
  );
  rearInset.position.set(0, 2.61, -0.93);
  for (const [side, x] of [['left', -1.3], ['right', 1.3]] as const) {
    const rail = roundedBar(
      kit,
      `refrigerator-cabinet-side-${side}`,
      0.24,
      4.7,
      1.82,
      0.11,
      shellMaterial,
      cabinetFrame,
    );
    rail.position.set(x, 2.62, -0.01);
  }
  for (const [name, y, height] of [
    ['top', 4.98, 0.22],
    ['freezer-divider', 3.28, 0.2],
    ['bottom', 0.35, 0.22],
  ] as const) {
    const rail = roundedBar(
      kit,
      `refrigerator-cabinet-${name}`,
      2.44,
      height,
      1.82,
      0.09,
      name === 'freezer-divider' ? shellShadowMaterial : shellMaterial,
      cabinetFrame,
    );
    rail.position.set(0, y, -0.01);
  }

  const basePlinth = kit.mesh(
    'refrigerator-base-plinth',
    new RoundedBoxGeometry(2.72, 0.22, 1.82, 3, 0.07),
    shellShadowMaterial,
  );
  basePlinth.position.set(0, 0.26, -0.01);

  function addGasketFrame(prefix: string, centerY: number, height: number): void {
    for (const [edge, y] of [['top', centerY + height * 0.5], ['bottom', centerY - height * 0.5]] as const) {
      const bar = roundedBar(kit, `${prefix}-${edge}`, 2.58, 0.09, 0.08, 0.035, gasketMaterial, kit.root, false);
      bar.position.set(0, y, 0.99);
    }
    for (const [edge, x] of [['left', -1.245], ['right', 1.245]] as const) {
      const bar = roundedBar(kit, `${prefix}-${edge}`, 0.09, height - 0.12, 0.08, 0.035, gasketMaterial, kit.root, false);
      bar.position.set(x, centerY, 0.99);
    }
  }
  // A gasket is a perimeter seal, never a filled slab. The previous filled
  // geometry visually capped both openings and hid every correctly placed
  // shelf prop after the doors opened.
  addGasketFrame('refrigerator-upper-door-gasket', 4.31, 1.58);
  addGasketFrame('refrigerator-lower-door-gasket', 2.0, 2.9);

  // Real depth is supplied by separate back, side, ceiling and floor panels.
  // All pieces remain hidden until the shared performance opens the doors.
  const upperInteriorContent = kit.pivot('refrigerator-upper-interior-content');
  const lowerInteriorContent = kit.pivot('refrigerator-lower-interior-content');
  upperInteriorContent.visible = false;
  lowerInteriorContent.visible = false;
  function addCavity(
    prefix: string,
    parent: THREE.Object3D,
    centerY: number,
    height: number,
  ): void {
    const back = roundedBar(
      kit,
      `${prefix}-back-panel`,
      2.3,
      height,
      0.12,
      0.07,
      interiorShadowMaterial,
      parent,
    );
    back.position.set(0, centerY, -0.77);
    for (const [side, x] of [['left', -1.13], ['right', 1.13]] as const) {
      const wall = roundedBar(
        kit,
        `${prefix}-${side}-wall`,
        0.1,
        height,
        1.44,
        0.035,
        interiorMaterial,
        parent,
      );
      wall.position.set(x, centerY, -0.03);
    }
    for (const [surface, y] of [['ceiling', centerY + height * 0.5], ['floor', centerY - height * 0.5]] as const) {
      const panel = roundedBar(
        kit,
        `${prefix}-${surface}`,
        2.26,
        0.09,
        1.45,
        0.035,
        interiorMaterial,
        parent,
      );
      panel.position.set(0, y, -0.03);
    }
  }
  addCavity('refrigerator-freezer-cavity', upperInteriorContent, 4.29, 1.31);
  addCavity('refrigerator-main-cavity', lowerInteriorContent, 1.95, 2.67);

  const interiorLights: THREE.Mesh[] = [];
  for (const [index, [y, width]] of ([[4.79, 1.72], [3.08, 1.82]] as const).entries()) {
    const lightBar = roundedBar(
      kit,
      `refrigerator-interior-light-${index + 1}`,
      width,
      0.075,
      0.035,
      0.025,
      coldLightMaterial,
      index === 0 ? upperInteriorContent : lowerInteriorContent,
      false,
    );
    lightBar.position.set(0, y, -0.69);
    interiorLights.push(lightBar);
  }

  for (const [index, y] of [4.02, 2.43, 1.63].entries()) {
    const shelf = roundedBar(
      kit,
      `refrigerator-interior-shelf-${index + 1}`,
      2.12,
      0.075,
      1.32,
      0.025,
      shelfMaterial,
      index === 0 ? upperInteriorContent : lowerInteriorContent,
      false,
    );
    shelf.position.set(0, y, -0.03);
    shelf.renderOrder = 3;
    const shelfLip = roundedBar(
      kit,
      `refrigerator-interior-shelf-${index + 1}-front-lip`,
      2.1,
      0.09,
      0.06,
      0.018,
      interiorShadowMaterial,
      index === 0 ? upperInteriorContent : lowerInteriorContent,
      false,
    );
    shelfLip.position.set(0, y + 0.02, 0.65);
  }

  const produceDrawer = roundedBar(
    kit,
    'refrigerator-produce-drawer',
    1.98,
    0.54,
    1.2,
    0.08,
    interiorMaterial,
    lowerInteriorContent,
  );
  produceDrawer.position.set(0, 0.86, -0.02);
  const drawerInset = roundedBar(
    kit,
    'refrigerator-produce-drawer-inset',
    1.62,
    0.24,
    0.055,
    0.06,
    shelfMaterial,
    lowerInteriorContent,
    false,
  );
  drawerInset.position.set(0, 0.93, 0.595);

  const upperDoorPivot = kit.pivot('refrigerator-upper-door-pivot');
  upperDoorPivot.position.set(1.38, 4.31, 1.02);
  upperDoorPivot.userData.rotationAxis = [0, 1, 0];
  upperDoorPivot.userData.rotationRange = [0, 1.14];
  kit.socket('refrigerator-upper-door-socket', upperDoorPivot, [0, 0, 0]);

  const upperDoor = roundedBar(
    kit,
    'refrigerator-upper-door',
    2.73,
    1.59,
    0.22,
    0.21,
    shellHighlightMaterial,
    upperDoorPivot,
  );
  upperDoor.position.set(-1.365, 0, 0.1);

  const upperDoorFace = roundedBar(
    kit,
    'refrigerator-upper-door-face-border',
    2.53,
    1.4,
    0.035,
    0.16,
    shellMaterial,
    upperDoorPivot,
    false,
  );
  upperDoorFace.position.set(-1.365, 0, 0.226);

  const lowerDoorPivot = kit.pivot('refrigerator-lower-door-pivot');
  lowerDoorPivot.position.set(1.38, 2.0, 1.02);
  lowerDoorPivot.userData.rotationAxis = [0, 1, 0];
  lowerDoorPivot.userData.rotationRange = [0, 0.96];
  kit.socket('refrigerator-lower-door-socket', lowerDoorPivot, [0, 0, 0]);

  const lowerDoor = roundedBar(
    kit,
    'refrigerator-lower-door',
    2.73,
    2.91,
    0.22,
    0.22,
    shellHighlightMaterial,
    lowerDoorPivot,
  );
  lowerDoor.position.set(-1.365, 0, 0.1);

  const lowerDoorFace = roundedBar(
    kit,
    'refrigerator-lower-door-face-border',
    2.53,
    2.7,
    0.035,
    0.17,
    shellMaterial,
    lowerDoorPivot,
    false,
  );
  lowerDoorFace.position.set(-1.365, 0, 0.226);

  function addDoorInterior(
    pivot: THREE.Object3D,
    prefix: string,
    height: number,
    binYs: readonly number[],
  ): void {
    const liner = roundedBar(
      kit,
      `${prefix}-inner-liner`,
      2.42,
      height,
      0.08,
      0.13,
      interiorMaterial,
      pivot,
      false,
    );
    liner.position.set(-1.365, 0, -0.055);
    binYs.forEach((y, index) => {
      const base = roundedBar(
        kit,
        `${prefix}-door-bin-${index + 1}-base`,
        1.94,
        0.09,
        0.48,
        0.025,
        shelfMaterial,
        pivot,
        false,
      );
      base.position.set(-1.365, y, -0.29);
      const rail = roundedBar(
        kit,
        `${prefix}-door-bin-${index + 1}-front-rail`,
        1.94,
        0.23,
        0.06,
        0.025,
        interiorShadowMaterial,
        pivot,
        false,
      );
      rail.position.set(-1.365, y + 0.11, -0.53);
    });
  }
  addDoorInterior(upperDoorPivot, 'refrigerator-upper', 1.35, [-0.38]);
  addDoorInterior(lowerDoorPivot, 'refrigerator-lower', 2.64, [-0.88, 0.05, 0.92]);

  const foodPerformanceRoot = kit.pivot('refrigerator-food-performance-root');
  foodPerformanceRoot.visible = false;

  type DoorHome = { pivot: 'refrigerator-upper-door-pivot' | 'refrigerator-lower-door-pivot'; local: readonly [number, number, number] };
  function foodPivot(
    id: string,
    category: string,
    homeZone: string,
    home: readonly [number, number, number],
    launchIndex: number,
    routeSide: -1 | 1,
    doorHome?: DoorHome,
  ): THREE.Group {
    const pivot = kit.pivot(`refrigerator-prop-${id}-pivot`, foodPerformanceRoot);
    pivot.position.set(home[0], home[1], home[2]);
    pivot.userData.refrigeratorProp = {
      id,
      category,
      homeZone,
      homePosition: [...home],
      homeSocket: `refrigerator-home-${id}-socket`,
      launchIndex,
      routeSide,
      ...(doorHome ? { doorPivotName: doorHome.pivot, doorLocalHome: [...doorHome.local] } : {}),
    };
    const socketParent = doorHome
      ? (doorHome.pivot === 'refrigerator-upper-door-pivot' ? upperDoorPivot : lowerDoorPivot)
      : kit.root;
    kit.socket(
      `refrigerator-home-${id}-socket`,
      socketParent,
      doorHome?.local ?? home,
    );
    return pivot;
  }

  const milk = foodPivot('milk-carton', 'milk', 'main-upper-shelf', [-0.72, 2.79, 0.08], 0, -1);
  const milkProfile = new THREE.Shape();
  milkProfile.moveTo(-0.22, -0.36);
  milkProfile.lineTo(0.22, -0.36);
  milkProfile.lineTo(0.22, 0.18);
  milkProfile.lineTo(0.08, 0.38);
  milkProfile.lineTo(-0.08, 0.38);
  milkProfile.lineTo(-0.22, 0.18);
  milkProfile.closePath();
  const milkBody = kit.mesh(
    'refrigerator-prop-milk-carton-body',
    new THREE.ExtrudeGeometry(milkProfile, {
      depth: 0.32,
      steps: 1,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
    }).translate(0, 0, -0.16),
    cartonMaterial,
    milk,
  );
  milkBody.userData.explodeWithParent = true;
  const milkBand = roundedBar(kit, 'refrigerator-prop-milk-carton-band', 0.36, 0.13, 0.025, 0.025, cartonAccentMaterial, milk, false);
  milkBand.position.set(0, -0.04, 0.18);
  const milkCap = kit.mesh(
    'refrigerator-prop-milk-carton-cap',
    new THREE.CylinderGeometry(0.055, 0.065, 0.055, 12),
    accentDarkMaterial,
    milk,
    false,
  );
  milkCap.rotation.x = Math.PI * 0.5;
  milkCap.position.set(0.1, 0.28, 0.18);

  const fish = foodPivot('fish', 'fish', 'freezer-left-shelf', [-0.48, 4.35, 0.08], 1, 1);
  const fishBody = kit.mesh(
    'refrigerator-prop-fish-body',
    new THREE.SphereGeometry(0.26, 14, 9).scale(1.25, 0.58, 0.48),
    fishMaterial,
    fish,
  );
  fishBody.userData.explodeWithParent = true;
  const fishBelly = kit.mesh(
    'refrigerator-prop-fish-belly',
    new THREE.SphereGeometry(0.205, 12, 8).scale(1.22, 0.36, 0.51),
    fishBellyMaterial,
    fish,
    false,
  );
  fishBelly.position.set(0.02, -0.08, 0.02);
  const fishTail = kit.mesh(
    'refrigerator-prop-fish-tail',
    new THREE.ConeGeometry(0.18, 0.28, 3),
    fishMaterial,
    fish,
  );
  fishTail.rotation.z = -Math.PI * 0.5;
  fishTail.position.x = -0.42;
  const fishEye = kit.mesh(
    'refrigerator-prop-fish-eye',
    new THREE.SphereGeometry(0.035, 8, 6),
    darkFoodMaterial,
    fish,
    false,
  );
  fishEye.position.set(0.2, 0.06, 0.12);

  const steak = foodPivot('steak', 'steak', 'freezer-right-shelf', [0.55, 4.35, 0.08], 2, -1);
  const steakShape = new THREE.Shape();
  steakShape.moveTo(-0.29, -0.14);
  steakShape.bezierCurveTo(-0.34, 0.08, -0.15, 0.25, 0.08, 0.23);
  steakShape.bezierCurveTo(0.34, 0.2, 0.39, -0.04, 0.22, -0.18);
  steakShape.bezierCurveTo(0.05, -0.3, -0.2, -0.27, -0.29, -0.14);
  steakShape.closePath();
  const steakBody = kit.mesh(
    'refrigerator-prop-steak-body',
    new THREE.ExtrudeGeometry(steakShape, {
      depth: 0.15,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
    }).translate(0, 0, -0.075),
    steakMaterial,
    steak,
  );
  steakBody.userData.explodeWithParent = true;
  const fatShape = steakShape.clone();
  const steakFat = kit.mesh(
    'refrigerator-prop-steak-fat-cap',
    new THREE.ExtrudeGeometry(fatShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
    }).scale(0.82, 0.7, 1).translate(0.01, 0, 0.095),
    steakFatMaterial,
    steak,
    false,
  );
  steakFat.userData.explodeWithParent = true;

  const storage = foodPivot('storage-box', 'food-container', 'main-middle-shelf', [0.56, 1.92, 0.03], 3, 1);
  const storageBody = roundedBar(kit, 'refrigerator-prop-storage-box-body', 0.66, 0.36, 0.5, 0.07, storageMaterial, storage);
  storageBody.userData.explodeWithParent = true;
  const storageLid = roundedBar(kit, 'refrigerator-prop-storage-box-lid', 0.72, 0.09, 0.54, 0.045, storageLidMaterial, storage);
  storageLid.position.y = 0.22;
  for (const [index, [x, z]] of [[-0.16, -0.08], [0.12, 0.08], [0.02, -0.14]].entries()) {
    const content = kit.mesh(
      `refrigerator-prop-storage-box-content-${index + 1}`,
      new THREE.IcosahedronGeometry(0.1, 1),
      index === 1 ? vegetableMaterial : fruitWarmMaterial,
      storage,
      false,
    );
    content.position.set(x, 0.02, z);
  }

  const fruit = foodPivot('fruit-basket', 'fruit', 'main-lower-shelf', [-0.5, 1.88, 0.05], 4, -1);
  const fruitSpecs: ReadonlyArray<readonly [number, number, THREE.Material]> = [
    [-0.16, 0.02, fruitRedMaterial],
    [0.13, 0.0, fruitWarmMaterial],
    [0, 0.22, fruitRedMaterial],
  ];
  for (const [index, [x, y, color]] of fruitSpecs.entries()) {
    const piece = kit.mesh(
      `refrigerator-prop-fruit-${index + 1}`,
      new THREE.IcosahedronGeometry(0.18, 2),
      color,
      fruit,
    );
    piece.position.set(x, y, (index - 1) * 0.04);
    piece.scale.set(1, 0.92, 1);
    const stem = kit.mesh(
      `refrigerator-prop-fruit-${index + 1}-stem`,
      new THREE.CylinderGeometry(0.018, 0.025, 0.11, 7),
      darkFoodMaterial,
      fruit,
      false,
    );
    stem.position.set(x, y + 0.2, (index - 1) * 0.04);
  }

  const vegetables = foodPivot('vegetables', 'vegetables', 'produce-drawer', [0.05, 0.96, 0.05], 5, 1);
  const carrot = kit.mesh(
    'refrigerator-prop-vegetables-carrot',
    new THREE.ConeGeometry(0.13, 0.5, 10),
    fruitWarmMaterial,
    vegetables,
  );
  carrot.rotation.z = -0.5;
  carrot.position.set(-0.16, -0.02, 0);
  for (const [index, angle] of [-0.55, 0, 0.55].entries()) {
    const leaf = kit.mesh(
      `refrigerator-prop-vegetables-leaf-${index + 1}`,
      new THREE.ConeGeometry(0.075, 0.28, 7),
      vegetableLightMaterial,
      vegetables,
      false,
    );
    leaf.rotation.z = angle;
    leaf.position.set(0.05 + angle * 0.1, 0.28, 0);
  }
  const broccoliStem = kit.mesh(
    'refrigerator-prop-vegetables-broccoli-stem',
    new THREE.CylinderGeometry(0.07, 0.1, 0.3, 8),
    vegetableLightMaterial,
    vegetables,
    false,
  );
  broccoliStem.position.set(0.24, 0, 0.02);
  for (const [index, [x, y, z]] of [[0.16, 0.2, 0], [0.28, 0.22, 0.04], [0.24, 0.28, -0.05]].entries()) {
    const floret = kit.mesh(
      `refrigerator-prop-vegetables-broccoli-floret-${index + 1}`,
      new THREE.IcosahedronGeometry(0.13, 1),
      vegetableMaterial,
      vegetables,
      false,
    );
    floret.position.set(x, y, z);
  }

  const drinkDoorHome = { pivot: 'refrigerator-lower-door-pivot', local: [-1.365, -0.5, -0.44] } as const;
  const drink = foodPivot('drink-bottle', 'drink', 'lower-door-bin', [0.02, 1.5, 0.6], 6, -1, drinkDoorHome);
  const drinkBody = kit.mesh(
    'refrigerator-prop-drink-bottle-body',
    new THREE.CylinderGeometry(0.14, 0.16, 0.58, 12),
    drinkMaterial,
    drink,
  );
  drinkBody.position.y = 0.02;
  const drinkShoulder = kit.mesh(
    'refrigerator-prop-drink-bottle-shoulder',
    new THREE.CylinderGeometry(0.08, 0.14, 0.16, 12),
    drinkMaterial,
    drink,
    false,
  );
  drinkShoulder.position.y = 0.39;
  const drinkCap = kit.mesh(
    'refrigerator-prop-drink-bottle-cap',
    new THREE.CylinderGeometry(0.075, 0.075, 0.09, 12),
    accentDarkMaterial,
    drink,
    false,
  );
  drinkCap.position.y = 0.52;
  const drinkLabel = roundedBar(kit, 'refrigerator-prop-drink-bottle-label', 0.21, 0.2, 0.025, 0.045, labelMaterial, drink, false);
  drinkLabel.position.set(0, 0.02, 0.155);

  function addHandle(
    parent: THREE.Object3D,
    prefix: string,
    x: number,
    height: number,
  ): THREE.Group {
    const handlePivot = kit.pivot(`${prefix}-pivot`, parent);
    handlePivot.position.set(x, 0, 0.285);
    handlePivot.userData.travelAxis = [0, 0, 1];
    kit.socket(`${prefix}-socket`, handlePivot, [0, 0, 0]);
    const grip = roundedBar(
      kit,
      `${prefix}-grip`,
      0.17,
      height,
      0.14,
      0.07,
      accentLightMaterial,
      handlePivot,
    );
    grip.position.z = 0.075;
    for (const [index, y] of [-height * 0.4, height * 0.4].entries()) {
      const standoff = roundedBar(
        kit,
        `${prefix}-standoff-${index + 1}`,
        0.24,
        0.16,
        0.23,
        0.055,
        accentMaterial,
        handlePivot,
      );
      standoff.position.set(0, y, -0.01);
    }
    return handlePivot;
  }

  addHandle(upperDoorPivot, 'refrigerator-upper-handle', -2.15, 0.62);
  addHandle(lowerDoorPivot, 'refrigerator-lower-handle', -2.15, 1.16);

  const doorSeam = roundedBar(
    kit,
    'refrigerator-door-seam',
    2.66,
    0.09,
    0.105,
    0.035,
    accentDarkMaterial,
    kit.root,
    false,
  );
  doorSeam.position.set(0, 3.27, 1.125);
  const coldLight = roundedBar(
    kit,
    'refrigerator-door-seam-cold-light',
    2.47,
    0.026,
    0.018,
    0.01,
    coldLightMaterial,
    kit.root,
    false,
  );
  coldLight.position.set(0, 3.27, 1.185);

  for (const [index, y] of [4.84, 3.75, 2.82, 0.74].entries()) {
    const hingeCap = kit.mesh(
      `refrigerator-door-hinge-cap-${index + 1}`,
      new THREE.CylinderGeometry(0.075, 0.075, 0.16, 12),
      accentDarkMaterial,
      kit.root,
      false,
    );
    hingeCap.position.set(1.39, y, 1.08);
  }

  const compressorPivot = kit.pivot('refrigerator-compressor-pivot');
  const servicePanel = roundedBar(
    kit,
    'refrigerator-rear-service-panel',
    2.28,
    0.72,
    0.07,
    0.09,
    shellHighlightMaterial,
    compressorPivot,
  );
  servicePanel.position.set(0, 0.79, -1.13);
  kit.socket('refrigerator-rear-service-socket', servicePanel, [0, 0, -0.055]);

  for (let row = 0; row < 5; row += 1) {
    const vent = roundedBar(
      kit,
      `refrigerator-rear-vent-${row + 1}`,
      1.28,
      0.035,
      0.02,
      0.014,
      accentDarkMaterial,
      compressorPivot,
      false,
    );
    vent.position.set(0, 0.94 - row * 0.115, -1.174);
  }

  for (const [index, [x, y]] of [
    [-0.98, 1.04],
    [0.98, 1.04],
    [-0.98, 0.54],
    [0.98, 0.54],
  ].entries()) {
    const fastener = kit.mesh(
      `refrigerator-rear-fastener-${index + 1}`,
      new THREE.CylinderGeometry(0.035, 0.035, 0.025, 10),
      metalMaterial,
      compressorPivot,
      false,
    );
    fastener.rotation.x = Math.PI * 0.5;
    fastener.position.set(x, y, -1.177);
    fastener.userData.explodeWithParent = true;
  }

  const rearCablePort = kit.mesh(
    'refrigerator-rear-cable-port',
    new THREE.TorusGeometry(0.095, 0.03, 8, 18),
    gasketMaterial,
    compressorPivot,
    false,
  );
  rearCablePort.position.set(0.92, 0.4, -1.12);
  kit.socket('refrigerator-power-entry-socket', rearCablePort, [0, 0, -0.04]);

  for (const [x, z, side] of [
    [-1.08, -0.68, 'rear-left'],
    [1.08, -0.68, 'rear-right'],
    [-1.08, 0.68, 'front-left'],
    [1.08, 0.68, 'front-right'],
  ] as const) {
    const foot = kit.mesh(
      `refrigerator-foot-${side}`,
      new RoundedBoxGeometry(0.38, 0.2, 0.38, 2, 0.07),
      rubberMaterial,
      kit.root,
      false,
    );
    foot.position.set(x, 0.1, z);
  }

  kit.socket('refrigerator-freezer-exit-socket', kit.root, [0, 4.32, 1.42]);
  kit.socket('refrigerator-main-exit-socket', kit.root, [0, 2.2, 1.42]);
  kit.socket('refrigerator-party-left-front-waypoint', kit.root, [-1.92, 2.8, 1.42]);
  kit.socket('refrigerator-party-left-rear-waypoint', kit.root, [-1.92, 2.8, -1.42]);
  kit.socket('refrigerator-party-right-front-waypoint', kit.root, [1.92, 2.8, 1.42]);
  kit.socket('refrigerator-party-right-rear-waypoint', kit.root, [1.92, 2.8, -1.42]);

  kit.indicator([-0.98, 3.19, 1.2], 0.038);

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'tall rounded double-door cabinet with reference-matched freezer-to-main-door proportion',
        'separate upper and lower door slabs, face borders, gaskets and horizontal recessed seam',
        'two unequal left-biased handles assembled from grips and paired standoffs',
        'real side depth with door projection, rear inset shell, base plinth and four low feet',
        'rear lower service cover with repeated horizontal vents, fasteners and cable entry',
        'true open freezer and refrigerator cavities assembled from back, side, ceiling and floor panels',
        'three full-depth shelves, a volumetric produce drawer and four door-side storage bins',
        'named layered milk, fish, steak, container, fruit, vegetable and drink props at semantic home sockets',
        'independent hinge pivots, handle sockets, food home sockets and collision-clear party waypoints',
      ],
      inferred: [
        'right-edge hinge mechanism and exact hinge-cap count are inferred from the left-biased handles',
        'exact shelf spacing and food selection combine the supplied exterior reference with the cited real LG interior reference',
        'door interiors and storage-bin dimensions are stylized low-poly approximations of real refrigerator organization',
        'compressor, refrigerant tubing and internal fan are concealed; only service-cover vibration is represented',
        'rear cable entry depth, underside structure and leveling-foot mechanics are simplified inference',
      ],
    },
  );
  build.root.userData.sculptRuntime.colliders = [
    { id: 'refrigerator-left-wall', type: 'box', node: 'refrigerator-cabinet-side-left', halfExtents: [0.12, 2.35, 0.91] },
    { id: 'refrigerator-right-wall', type: 'box', node: 'refrigerator-cabinet-side-right', halfExtents: [0.12, 2.35, 0.91] },
    { id: 'refrigerator-rear-wall', type: 'box', node: 'refrigerator-rear-inset-shell', halfExtents: [1.3, 2.29, 0.09] },
    { id: 'refrigerator-freezer-opening', type: 'box-trigger', node: 'refrigerator-freezer-exit-socket', halfExtents: [1.08, 0.61, 0.42] },
    { id: 'refrigerator-main-opening', type: 'box-trigger', node: 'refrigerator-main-exit-socket', halfExtents: [1.08, 1.25, 0.42] },
  ];
  build.root.userData.refrigeratorRouteContract = {
    cabinetBounds: { min: [-1.42, 0.18, -1.05], max: [1.42, 5.12, 1.08] },
    sideClearance: 0.48,
    frontClearanceZ: 1.42,
    rearClearanceZ: -1.42,
    rule: 'rear-to-front travel must keep |x| >= 1.9 until z >= 1.42',
  };
  return build;
}
