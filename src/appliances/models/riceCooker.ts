import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import { setHullOutlineStyle } from '../../style/outline';

const V2_REFERENCE_PATH = 'references/intake-v2/rice-cooker/views/front.png';

function stableOutlinePhase(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) * (Math.PI * 2 / 10000);
}

function applyRiceCookerOutlineHierarchy(root: THREE.Object3D): void {
  const mainSilhouette = /wide-rounded-lower-shell|lower-skirt|upper-body-shoulder|domed-lid-shell|rear-carry-latch/;
  const fineDetail = /status-lamp|power-hole|foot|kernel|steam-puff|top-steam-slot|lid-small-top-crown/;
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

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 20_03_02 (2).png';

function tone(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffledRiceAngles(count: number): number[] {
  const random = seededRandom(0x71ce5eed);
  const angles = Array.from({ length: count }, (_, index) => (
    (index + (random() - 0.5) * 0.55) / count * Math.PI * 2
  ));
  for (let index = angles.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [angles[index], angles[swapIndex]] = [angles[swapIndex], angles[index]];
  }
  return angles;
}

function tubeThrough(points: readonly THREE.Vector3[], radius: number): THREE.TubeGeometry {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([...points], false, 'centripetal'),
    28,
    radius,
    9,
    false,
  );
}

function addSculptedRiceKernel(
  kit: ApplianceModelKit,
  parent: THREE.Object3D,
  name: string,
  bodyGeometry: THREE.BufferGeometry,
  creaseGeometry: THREE.BufferGeometry,
  bodyMaterial: THREE.Material,
  creaseMaterial: THREE.Material,
): void {
  const body = kit.mesh(`${name}-body`, bodyGeometry, bodyMaterial, parent);
  body.userData.riceKernelRole = 'shared-sculpted-body';
  const crease = kit.mesh(`${name}-crease`, creaseGeometry, creaseMaterial, parent, false);
  crease.position.y = 0.034;
  crease.userData.riceKernelRole = 'shared-dorsal-crease';
}

function signedPower(value: number, exponent: number): number {
  if (value === 0) return 0;
  return Math.sign(value) * Math.abs(value) ** exponent;
}

function reverseWinding(geometry: THREE.BufferGeometry): void {
  const index = geometry.index;
  if (!index) return;
  for (let offset = 0; offset < index.count; offset += 3) {
    const second = index.getX(offset + 1);
    index.setX(offset + 1, index.getX(offset + 2));
    index.setX(offset + 2, second);
  }
  index.needsUpdate = true;
  geometry.computeVertexNormals();
}

/** Continuous superellipsoid used instead of a rounded box. It keeps the
 * front/side silhouette soft while retaining the reference's broad top and
 * rounded-rectangle plan. */
function softSuperellipsoid(
  xRadius: number,
  yRadius: number,
  zRadius: number,
  exponent: number,
): ParametricGeometry {
  const geometry = new ParametricGeometry((u, v, target) => {
    const longitude = u * Math.PI * 2 - Math.PI;
    const latitude = v * Math.PI - Math.PI * 0.5;
    const latitudeRadius = signedPower(Math.cos(latitude), exponent);
    target.set(
      xRadius * latitudeRadius * signedPower(Math.cos(longitude), exponent),
      yRadius * signedPower(Math.sin(latitude), exponent),
      zRadius * latitudeRadius * signedPower(Math.sin(longitude), exponent),
    );
  }, 12, 8);
  // ParametricGeometry's default tangent order points inward for this
  // longitude/latitude parameterisation. Reverse the triangle winding so the
  // toon shell, rather than only the back-face outline hull, is rendered.
  reverseWinding(geometry);
  return geometry;
}

/** Upper, truncated ellipsoid: broad at the seam, continuously curved toward
 * a small top crown. This is the lid's real dome rather than a scaled box. */
function softUpperDome(
  xRadius: number,
  yRadius: number,
  zRadius: number,
  planExponent = 0.78,
): ParametricGeometry {
  const maximumLatitude = 1.34;
  const geometry = new ParametricGeometry((u, v, target) => {
    const longitude = u * Math.PI * 2 - Math.PI;
    const latitude = v * maximumLatitude;
    const radial = Math.cos(latitude);
    target.set(
      xRadius * radial * signedPower(Math.cos(longitude), planExponent),
      yRadius * Math.sin(latitude),
      zRadius * radial * signedPower(Math.sin(longitude), planExponent),
    );
  }, 12, 7);
  reverseWinding(geometry);
  return geometry;
}

/**
 * Animation-ready reconstruction of the supplied three-view rice cooker.
 * Local frame: +Y up, +Z front, floor at Y=0. The proportions deliberately
 * favour a wide, soft belly and a thick domed lid so the prop cannot read as a
 * generic square appliance when reduced to gameplay scale.
 */
export function createRiceCookerModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = tone(options.accent, 0.2, -0.09);
  const accentMid = tone(options.accent, 0.08, -0.04);
  const accentDark = tone(options.accent, -0.14, 0.01);

  const shell = kit.material(0xf4ede2, { tint: 0x746a7e });
  const shellLight = kit.material(0xfff7e9, { tint: 0x7c7084 });
  const accent = kit.material(accentMid, { tint: 0x6c5e75 });
  const accentSoft = kit.material(accentLight, { tint: 0x74677c });
  const accentDeep = kit.material(accentDark, { tint: 0x554a60 });
  const seam = kit.material(0x696573, { tint: 0x4d4856 });
  const rubber = kit.material(0x4c4a55, { tint: 0x3e3945 });
  const innerPotMaterial = kit.material(0x454550, { tint: 0x34313d });
  const riceMaterial = kit.material(0xfff7dc, { tint: 0x9a8d80 });
  const riceCreaseMaterial = kit.material(0xd8cba8, { tint: 0x8c7e72 });
  const warmLamp = kit.material(0xc98170, { emissive: 0xff9f80 });
  warmLamp.emissiveIntensity = 0;

  // Pass 1 — wide horizontal silhouette. A large-radius shell plus a slightly
  // recessed skirt creates the soft, squat body visible in all three elevations.
  const bodyPivot = kit.pivot('rice-cooker-body-pivot');
  const bodyShell = kit.mesh(
    'rice-cooker-wide-rounded-lower-shell',
    softSuperellipsoid(0.92, 0.52, 0.71, 0.5),
    shell,
    bodyPivot,
  );
  bodyShell.position.set(0, 0.62, 0);
  bodyShell.userData.part = 'body-shell';

  const lowerSkirt = kit.mesh(
    'rice-cooker-lower-skirt',
    softSuperellipsoid(0.84, 0.13, 0.65, 0.58),
    shell,
    bodyPivot,
  );
  lowerSkirt.position.set(0, 0.16, 0);
  lowerSkirt.userData.part = 'lower-skirt';

  const upperShoulder = kit.mesh(
    'rice-cooker-upper-body-shoulder',
    softSuperellipsoid(0.91, 0.16, 0.7, 0.56),
    shell,
    bodyPivot,
  );
  upperShoulder.position.set(0, 1.0, 0);
  upperShoulder.userData.explodeWithParent = true;

  // The lid seat remains fixed while the pink lid pivots about the rear edge.
  // This preserves the strong horizontal seam even during the powered micro-lift.
  const lidSeam = kit.pivot('rice-cooker-lid-seat-seam', bodyPivot);
  for (const [name, width, depth, x, z] of [
    ['front', 1.24, 0.014, 0, 0.57],
    ['rear', 1.24, 0.014, 0, -0.57],
  ] as const) {
    const rail = kit.mesh(
      `rice-cooker-lid-seam-${name}`,
      new RoundedBoxGeometry(width, 0.016, depth, 2, 0.006),
      accentDeep,
      lidSeam,
      false,
    );
    rail.position.set(x, 1.115, z);
  }

  const lidPivot = kit.pivot('rice-cooker-lid-hinge-pivot', bodyPivot);
  lidPivot.position.set(0, 1.1, -0.61);
  lidPivot.userData.rotationAxis = [1, 0, 0];
  lidPivot.userData.rotationRange = [-0.34, 0];
  kit.socket('rice-cooker-lid-hinge-socket', lidPivot, [0, 0, 0]);

  const lidShell = kit.mesh(
    'rice-cooker-domed-lid-shell',
    softUpperDome(0.9, 0.4, 0.7),
    accent,
    lidPivot,
  );
  lidShell.position.set(0, 0.02, 0.61);
  lidShell.userData.part = 'lid-shell';

  const lidTopCrown = kit.mesh(
    'rice-cooker-lid-small-top-crown',
    new RoundedBoxGeometry(0.48, 0.055, 0.35, 3, 0.024),
    accentSoft,
    lidPivot,
    false,
  );
  lidTopCrown.position.set(0, 0.41, 0.61);
  lidTopCrown.userData.explodeWithParent = true;

  const releaseSeat = kit.mesh(
    'rice-cooker-front-lid-release-seat',
    new RoundedBoxGeometry(0.32, 0.15, 0.055, 3, 0.022),
    accentDeep,
    lidPivot,
    false,
  );
  releaseSeat.position.set(0, 0.19, 1.305);
  const releaseButton = kit.mesh(
    'rice-cooker-front-lid-release',
    new RoundedBoxGeometry(0.31, 0.135, 0.072, 4, 0.03),
    shellLight,
    lidPivot,
  );
  releaseButton.position.set(0, 0.19, 1.34);
  kit.socket('rice-cooker-release-button-socket', releaseButton, [0, 0, 0.045]);

  const steamSeat = kit.mesh(
    'rice-cooker-top-steam-seat',
    new RoundedBoxGeometry(0.38, 0.045, 0.14, 3, 0.02),
    accentDeep,
    lidPivot,
    false,
  );
  steamSeat.position.set(0, 0.445, 0.58);
  const steamSlot = kit.mesh(
    'rice-cooker-top-steam-slot',
    new RoundedBoxGeometry(0.27, 0.025, 0.045, 2, 0.01),
    seam,
    lidPivot,
    false,
  );
  steamSlot.position.set(0, 0.475, 0.58);
  kit.socket('rice-cooker-steam-socket', lidPivot, [0, 0.49, 0.58]);

  // The open-lid payoff needs a real dark inner pot and a readable bed of
  // individual white rice grains. These stay seated in the body while the lid
  // pivots independently from the rear hinge.
  const innerPotPivot = kit.pivot('rice-cooker-inner-pot-pivot', bodyPivot);
  const innerPot = kit.mesh(
    'rice-cooker-deep-gray-inner-pot',
    new THREE.CylinderGeometry(0.69, 0.61, 0.3, 28, 1, true),
    innerPotMaterial,
    innerPotPivot,
  );
  innerPot.position.y = 1.02;
  const innerRim = kit.mesh(
    'rice-cooker-inner-pot-rim',
    new THREE.TorusGeometry(0.69, 0.035, 8, 30),
    innerPotMaterial,
    innerPotPivot,
    false,
  );
  innerRim.rotation.x = Math.PI * 0.5;
  innerRim.position.y = 1.17;
  const riceSurface = kit.mesh(
    'rice-cooker-white-rice-surface',
    new THREE.CylinderGeometry(0.61, 0.61, 0.065, 28),
    riceMaterial,
    innerPotPivot,
    false,
  );
  riceSurface.position.y = 1.145;

  // One reusable volumetric kernel language serves both the rice bed and every
  // airborne grain. The capsule body preserves the established grain size;
  // the inset dorsal crease keeps the pale silhouette readable against the
  // bright scene without replacing the grain with a flat decal or sprite.
  const riceKernelGeometry = new THREE.CapsuleGeometry(0.038, 0.11, 5, 8);
  riceKernelGeometry.rotateZ(Math.PI * 0.5);
  const riceCreaseGeometry = tubeThrough([
    new THREE.Vector3(-0.046, 0, 0),
    new THREE.Vector3(0, -0.005, 0),
    new THREE.Vector3(0.046, 0, 0),
  ], 0.007);
  const riceBedLayout = [
    [-0.42, -0.26], [-0.2, -0.29], [0.03, -0.3], [0.27, -0.25],
    [-0.48, -0.04], [-0.25, -0.06], [0, -0.08], [0.24, -0.04], [0.46, -0.01],
    [-0.4, 0.18], [-0.18, 0.16], [0.06, 0.17], [0.29, 0.18],
    [-0.26, 0.36], [-0.04, 0.34], [0.2, 0.35],
    [-0.08, -0.46], [0.15, -0.44],
    [0.49, 0.12], [-0.46, 0.31], [0.43, 0.3], [-0.34, -0.42],
    [0.36, -0.4], [-0.12, -0.27], [0.13, -0.22], [-0.52, -0.2],
    [0.52, -0.18], [-0.33, 0.02], [0.37, 0.02], [0, 0.02],
  ] as const;
  riceBedLayout.forEach(([x, z], index) => {
    const kernel = kit.pivot(`rice-cooker-bed-kernel-${index + 1}-pivot`, innerPotPivot);
    kernel.position.set(x, 1.205 + (index % 3) * 0.006, z);
    kernel.rotation.y = ((index * 47) % 180) * Math.PI / 180;
    kernel.rotation.z = ((index % 3) - 1) * 0.08;
    addSculptedRiceKernel(
      kit,
      kernel,
      `rice-cooker-bed-kernel-${index + 1}`,
      riceKernelGeometry,
      riceCreaseGeometry,
      riceMaterial,
      riceCreaseMaterial,
    );
  });

  const airborneRiceRig = kit.pivot('rice-cooker-airborne-rice-rig');
  const airborneAngles = shuffledRiceAngles(28);
  const flightRandom = seededRandom(0xa17b00b5);
  for (let index = 0; index < 28; index += 1) {
    const kernel = kit.pivot(`rice-cooker-airborne-kernel-${index + 1}-pivot`, airborneRiceRig);
    const angle = airborneAngles[index];
    const outwardDistance = 1.5 + flightRandom() * 0.68;
    kernel.userData.flightIndex = index;
    kernel.userData.launchTime = 1.08 + index * 0.104;
    kernel.userData.flightDuration = 1.08 + flightRandom() * 0.14;
    kernel.userData.apexHeight = 1.05 + flightRandom() * 0.52;
    kernel.userData.startPosition = [
      Math.cos(angle) * (0.6 + flightRandom() * 0.08),
      1.16 + flightRandom() * 0.025,
      Math.sin(angle) * (0.53 + flightRandom() * 0.07),
    ];
    kernel.userData.driftX = Math.cos(angle) * outwardDistance;
    kernel.userData.driftZ = Math.sin(angle) * (outwardDistance * 0.9);
    kernel.position.fromArray(kernel.userData.startPosition as number[]);
    kernel.rotation.y = index * 0.73;
    kernel.visible = false;
    addSculptedRiceKernel(
      kit,
      kernel,
      `rice-cooker-airborne-kernel-${index + 1}`,
      riceKernelGeometry,
      riceCreaseGeometry,
      riceMaterial,
      riceCreaseMaterial,
    );
  }

  // Faceted multi-lobe steam volumes are socket-bound to the lid outlet. Each
  // puff owns a material so staggered rise/fade remains deterministic.
  const steamSocket = kit.root.getObjectByName('rice-cooker-steam-socket');
  if (steamSocket) {
    for (let index = 0; index < 8; index += 1) {
      const material = kit.material(0xfffbf3, {
        tint: 0x9d91aa,
        emissive: accentLight,
        transparent: true,
        opacity: 0,
      });
      material.depthWrite = false;
      const puff = kit.pivot(`rice-cooker-volumetric-steam-puff-${index + 1}-pivot`, steamSocket);
      puff.userData.steamPuffIndex = index;
      puff.userData.lateralBias = ((index % 3) - 1) * 0.055;
      puff.userData.baseScale = 0.82 + (index % 4) * 0.08;
      puff.visible = false;
      [
        [0, 0, 0, 0.17],
        [-0.12, 0.07, 0.015, 0.115],
        [0.12, 0.08, -0.018, 0.12],
        [-0.035, 0.18, 0.02, 0.105],
      ].forEach(([x, y, z, radius], lobeIndex) => {
        const lobe = kit.mesh(
          `rice-cooker-volumetric-steam-puff-${index + 1}-lobe-${lobeIndex + 1}`,
          new THREE.IcosahedronGeometry(radius, 1),
          material,
          puff,
          false,
        );
        lobe.position.set(x, y, z);
      });
    }
  }

  // Pass 2 — the front vertical control island is the main identity feature.
  const panel = kit.mesh(
    'rice-cooker-front-control-island',
    new THREE.CapsuleGeometry(0.19, 0.3, 4, 10),
    accent,
    bodyPivot,
  );
  panel.position.set(0, 0.6, 0.69);
  panel.scale.z = 0.19;
  panel.userData.part = 'control-island';

  const panelFrame = kit.mesh(
    'rice-cooker-front-control-island-frame',
    new THREE.CapsuleGeometry(0.225, 0.31, 4, 10),
    accentDeep,
    bodyPivot,
  );
  panelFrame.position.set(0, 0.6, 0.675);
  panelFrame.scale.z = 0.17;
  panelFrame.userData.explodeWithParent = true;

  const leftLamp = kit.mesh(
    'rice-cooker-status-lamp-left',
    new THREE.SphereGeometry(0.046, 8, 5),
    kit.indicatorMaterial,
    bodyPivot,
    false,
  );
  leftLamp.position.set(-0.09, 0.75, 0.745);
  const rightLamp = kit.mesh(
    'rice-cooker-status-lamp-right',
    new THREE.SphereGeometry(0.046, 8, 5),
    warmLamp,
    bodyPivot,
    false,
  );
  rightLamp.position.set(0.09, 0.75, 0.745);

  const switchPivot = kit.pivot('rice-cooker-cook-switch-pivot', bodyPivot);
  switchPivot.position.set(0, 0.48, 0.742);
  switchPivot.userData.rotationAxis = [1, 0, 0];
  switchPivot.userData.rotationRange = [-0.18, 0.08];
  kit.socket('rice-cooker-switch-socket', switchPivot, [0, 0, 0]);

  kit.mesh(
    'rice-cooker-switch-seat',
    new RoundedBoxGeometry(0.27, 0.16, 0.065, 3, 0.028),
    accentDeep,
    switchPivot,
    false,
  );
  const cookSwitch = kit.mesh(
    'rice-cooker-cook-switch',
    new RoundedBoxGeometry(0.22, 0.105, 0.085, 3, 0.032),
    shellLight,
    switchPivot,
  );
  cookSwitch.position.z = 0.055;

  // Small side control seen in the side elevation, kept subordinate to the
  // prominent front island.
  const sideControl = kit.mesh(
    'rice-cooker-side-control-seat',
    new RoundedBoxGeometry(0.07, 0.32, 0.25, 3, 0.03),
    accentDeep,
    bodyPivot,
    false,
  );
  sideControl.position.set(-0.88, 0.72, 0.03);
  const sideButton = kit.mesh(
    'rice-cooker-side-control',
    new RoundedBoxGeometry(0.055, 0.13, 0.15, 3, 0.025),
    accent,
    bodyPivot,
  );
  sideButton.position.set(-0.92, 0.74, 0.03);

  // Pass 3 — rear hinge and the broad U latch are separate assemblies. The
  // latch overlaps its collars so there are no floating attachments in orbit.
  const rearHinge = kit.mesh(
    'rice-cooker-rear-lid-hinge',
    new THREE.CylinderGeometry(0.1, 0.1, 0.58, 10),
    accentDeep,
    bodyPivot,
  );
  rearHinge.rotation.z = Math.PI * 0.5;
  rearHinge.position.set(0, 1.07, -0.68);

  for (const x of [-0.32, 0.32]) {
    const collar = kit.mesh(
      `rice-cooker-rear-hinge-collar-${x < 0 ? 'left' : 'right'}`,
      new THREE.CylinderGeometry(0.13, 0.13, 0.12, 10),
      accent,
      bodyPivot,
    );
    collar.rotation.z = Math.PI * 0.5;
    collar.position.set(x, 1.07, -0.68);
  }

  const latchPivot = kit.pivot('rice-cooker-rear-latch-pivot', bodyPivot);
  latchPivot.position.set(0, 1.08, -0.72);
  latchPivot.userData.rotationAxis = [1, 0, 0];
  latchPivot.userData.rotationRange = [-0.04, 0.06];
  kit.socket('rice-cooker-latch-socket', latchPivot, [0, 0, 0]);
  const latch = kit.mesh(
    'rice-cooker-rear-carry-latch',
    tubeThrough([
      new THREE.Vector3(-0.31, 0.02, 0),
      new THREE.Vector3(-0.31, -0.21, 0),
      new THREE.Vector3(-0.24, -0.34, 0),
      new THREE.Vector3(0.24, -0.34, 0),
      new THREE.Vector3(0.31, -0.21, 0),
      new THREE.Vector3(0.31, 0.02, 0),
    ], 0.085),
    shellLight,
    latchPivot,
  );
  latch.userData.part = 'rear-latch';

  const powerPlate = kit.mesh(
    'rice-cooker-rear-power-plate',
    new RoundedBoxGeometry(0.38, 0.25, 0.065, 3, 0.03),
    accent,
    bodyPivot,
  );
  powerPlate.position.set(0, 0.34, -0.705);
  const inlet = kit.mesh(
    'rice-cooker-figure-eight-inlet',
    new RoundedBoxGeometry(0.25, 0.13, 0.055, 3, 0.025),
    rubber,
    bodyPivot,
  );
  inlet.position.set(0, 0.34, -0.75);
  for (const x of [-0.055, 0.055]) {
    const hole = kit.mesh(
      `rice-cooker-power-hole-${x < 0 ? 'left' : 'right'}`,
      new THREE.CylinderGeometry(0.029, 0.029, 0.04, 9),
      seam,
      bodyPivot,
      false,
    );
    hole.rotation.x = Math.PI * 0.5;
    hole.position.set(x, 0.34, -0.79);
  }
  kit.socket('rice-cooker-power-socket', powerPlate, [0, 0, -0.08]);

  for (const [index, x, z] of [
    [1, -0.57, 0.44],
    [2, 0.57, 0.44],
    [3, -0.57, -0.44],
    [4, 0.57, -0.44],
  ] as const) {
    const foot = kit.mesh(
      `rice-cooker-foot-${index}`,
      new RoundedBoxGeometry(0.22, 0.1, 0.18, 2, 0.045),
      rubber,
      kit.root,
      false,
    );
    foot.position.set(x, 0.05, z);
  }

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? V2_REFERENCE_PATH,
      reconstructed: [
        'wide squat rounded cream cooker body with a recessed lower skirt and stable four-foot stance',
        'large pink domed lid with a fixed dark horizontal seam, broad upper crown, front release and top steam slot',
        'front vertical oval control island with paired lamps, inset panel and a large independently pivoted rocker switch',
        'small side control plus separate rear hinge tube, hinge collars and thick U-shaped latch/handle',
        'rear accent power plate, dark figure-eight inlet and two recessed socket holes',
        'activation-ready lid hinge, rear latch, cook switch, steam outlet and power sockets',
        'one reusable outlined rice-kernel form with a dorsal crease shared by the visible pot bed and every airborne grain',
        'socket-bound multi-lobe volumetric steam plus a powered high-low lid rhythm that settles without detaching the lid',
      ],
      inferred: [
        'the local reference image path was unavailable to this worker; proportions were reconstructed from the supplied front/side/rear task image',
        'the inner pot, heater plate, thermostat, insulation, wiring and lid seal are hidden and intentionally not modeled',
        'the exact rear hinge linkage and underside fastener pattern are concealed; closed attachment volumes are used',
        'the steam outlet follows the visible top slot, while the internal vapour channel is functional inference',
      ],
    },
  );
  build.root.userData.riceCookerEffectContract = {
    modelOwner: 'rice-cooker-model-rig',
    timelineOwner: 'RiceCookerPerformance',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
    riceBedKernels: riceBedLayout.length,
    airborneRiceKernels: 28,
    steamVolumes: 8,
    flatEffects: 0,
  };
  build.root.userData.legacyReferencePath = REFERENCE_PATH;
  applyRiceCookerOutlineHierarchy(build.root);
  build.root.userData.sculptRuntime.colliders = [
    { id: 'rice-cooker-body-collider', type: 'box', node: 'rice-cooker-body-pivot' },
    { id: 'rice-cooker-lid-collider', type: 'box', node: 'rice-cooker-lid-hinge-pivot' },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'rice-cooker-body-group', nodes: ['rice-cooker-body-pivot'] },
    { id: 'rice-cooker-lid-group', nodes: ['rice-cooker-lid-hinge-pivot'] },
    { id: 'rice-cooker-control-group', nodes: ['rice-cooker-cook-switch-pivot'] },
    { id: 'rice-cooker-rear-group', nodes: ['rice-cooker-rear-latch-pivot'] },
  ];
  return build;
}
