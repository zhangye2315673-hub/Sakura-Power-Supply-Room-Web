import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_20 (10).png';

function tone(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function taperedCupGeometry(): THREE.CylinderGeometry {
  const geometry = new THREE.CylinderGeometry(0.235, 0.175, 0.48, 18, 2, false);
  geometry.translate(0, 0.24, 0);
  return geometry;
}

function volumetricDropGeometry(): THREE.LatheGeometry {
  return new THREE.LatheGeometry([
    [0, 0.1], [0.035, 0.045], [0.065, -0.035], [0.052, -0.1], [0, -0.135],
  ].map(([radius, y]) => new THREE.Vector2(radius, y)), 10);
}

function beanCreaseGeometry(): THREE.TubeGeometry {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.008, -0.04, 0.043),
    new THREE.Vector3(0.007, -0.014, 0.048),
    new THREE.Vector3(-0.006, 0.012, 0.048),
    new THREE.Vector3(0.008, 0.04, 0.043),
  ]), 8, 0.006, 5, false);
}

function irregularSteamGeometry(radius: number, seed: number): THREE.IcosahedronGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < position.count; index += 1) {
    const scale = 0.88 + Math.sin(seed * 1.93 + index * 2.17) * 0.09;
    position.setXYZ(index, position.getX(index) * scale, position.getY(index) * scale, position.getZ(index) * scale);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function aromaCurlGeometry(index: number): THREE.TubeGeometry {
  const side = index % 2 === 0 ? -1 : 1;
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.04, 0, 0),
    new THREE.Vector3(side * 0.13, 0.22, 0.015),
    new THREE.Vector3(-side * 0.08, 0.46, -0.01),
    new THREE.Vector3(side * 0.16, 0.7, 0.025),
    new THREE.Vector3(-side * 0.05, 0.94, 0),
  ], false, 'centripetal'), 24, 0.014 + (index % 3) * 0.003, 6, false);
}

/**
 * Procedural three-view reconstruction of the compact counter coffee maker.
 *
 * Local frame: +Y up, +Z front, floor at Y=0. The cream upper appliance,
 * rear structural column, brewing cavity, cup and rear water tank are kept as
 * separate named assemblies so orbit review and activation remain readable.
 */
export function createCoffeeMakerModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = tone(options.accent, 0.2, -0.08);
  const accentMid = tone(options.accent, 0.08, -0.04);
  const accentDark = tone(options.accent, -0.14, 0.01);

  const shell = kit.material(0xf4ede1, { tint: 0x746a7d });
  const shellLight = kit.material(0xfff7e9, { tint: 0x7b7084 });
  const accentLightMaterial = kit.material(accentLight, { tint: 0x71677c });
  const accent = kit.material(accentMid, { tint: 0x675a71 });
  const accentDeep = kit.material(accentDark, { tint: 0x554a60 });
  const seam = kit.material(0x696574, { tint: 0x4e4856 });
  const rubber = kit.material(0x4f4c59, { tint: 0x403b48 });
  const metal = kit.material(0x9e9ca5, { tint: 0x5c5663 });
  const coffee = kit.material(0x7b3d29, {
    tint: 0x4c3540,
    emissive: 0x5a251d,
    transparent: true,
    opacity: 0,
  });
  coffee.depthWrite = false;
  const waterTank = kit.material(accentLight, {
    tint: 0x667487,
    transparent: true,
    opacity: 0.46,
  });
  waterTank.depthWrite = false;
  waterTank.emissive.set(accentLight);
  waterTank.emissiveIntensity = 0.08;
  const hopperGlass = kit.material(0x777580, { tint: 0x4d4b56, transparent: true, opacity: 0.36 });
  hopperGlass.depthWrite = false;
  const beanMaterial = kit.material(0x6d321e, { tint: 0x3c2020 });
  const beanCreaseMaterial = kit.material(0x321812, { tint: 0x1b1013 });
  const steamMaterial = kit.material(0xfff4e8, {
    tint: 0x9b8793,
    emissive: 0xffdfc4,
    transparent: true,
    opacity: 0,
  });
  steamMaterial.depthWrite = false;
  steamMaterial.userData.coffeeMakerEffectMaterial = 'steam';
  const aromaMaterial = kit.material(0xd9a06b, {
    tint: 0x7c5360,
    emissive: 0xff9c52,
    transparent: true,
    opacity: 0,
  });
  aromaMaterial.depthWrite = false;
  aromaMaterial.userData.coffeeMakerEffectMaterial = 'aroma';
  const warmLightMaterial = kit.material(0xffb45c, {
    tint: 0xa85a45,
    emissive: 0xff7f32,
    transparent: true,
    opacity: 0,
  });
  warmLightMaterial.depthWrite = false;
  warmLightMaterial.userData.coffeeMakerEffectMaterial = 'warm-light';
  coffee.userData.coffeeMakerEffectMaterial = 'coffee-liquid';

  // Pass 1: the reference identity is an L-shaped appliance. The broad upper
  // shell overhangs a recessed brewing cavity while a full rear spine carries
  // the water system down to the separate base.
  const upperAssembly = kit.pivot('coffee-maker-upper-assembly-pivot');
  const upperShell = kit.mesh(
    'coffee-maker-upper-rounded-shell',
    new RoundedBoxGeometry(1.58, 0.72, 1.04, 4, 0.18),
    shell,
    upperAssembly,
  );
  upperShell.position.set(0, 1.66, 0.03);
  upperShell.userData.part = 'upper-shell';

  const upperCap = kit.mesh(
    'coffee-maker-upper-cap-highlight',
    new RoundedBoxGeometry(1.42, 0.1, 0.9, 3, 0.05),
    shellLight,
    upperAssembly,
    false,
  );
  upperCap.position.set(0, 2.01, 0.02);
  upperCap.userData.explodeWithParent = true;

  // A wide rectangular hopper carries the full top silhouette instead of
  // reading as a small cup perched on the cap. The translucent body still
  // exposes chunky low-poly beans with modeled longitudinal creases.
  const hopperPivot = kit.pivot('coffee-maker-bean-hopper-pivot', upperAssembly);
  hopperPivot.position.set(0, 2.07, -0.04);
  const hopperCollar = kit.mesh(
    'coffee-maker-bean-hopper-locking-collar',
    new RoundedBoxGeometry(1.12, 0.1, 0.66, 3, 0.05),
    seam,
    hopperPivot,
  );
  hopperCollar.position.y = 0.05;
  const hopper = kit.mesh(
    'coffee-maker-gray-translucent-bean-hopper',
    new RoundedBoxGeometry(1.34, 0.55, 0.78, 4, 0.11),
    hopperGlass,
    hopperPivot,
  );
  hopper.position.y = 0.36;
  hopper.renderOrder = 3;
  hopper.userData.part = 'bean-hopper';
  const hopperLid = kit.mesh(
    'coffee-maker-white-hopper-lid',
    new RoundedBoxGeometry(1.38, 0.075, 0.82, 3, 0.055),
    shellLight,
    hopperPivot,
  );
  hopperLid.position.y = 0.68;
  const beanBodyGeometry = new THREE.SphereGeometry(1, 10, 7);
  const creaseGeometry = beanCreaseGeometry();
  for (let index = 0; index < 30; index += 1) {
    const pivot = kit.pivot(`coffee-maker-hopper-bean-pivot-${index + 1}`, hopperPivot);
    const column = index % 6;
    const depthLane = Math.floor(index / 6) % 3;
    const layer = Math.floor(index / 18);
    pivot.position.set(
      (column - 2.5) * 0.19,
      0.19 + layer * 0.18 + (index % 2) * 0.015,
      (depthLane - 1) * 0.19,
    );
    pivot.rotation.set((index % 5) * 0.24, index * 0.53, (index % 7) * 0.31);
    pivot.userData.phaseOffset = index / 30;
    const bean = kit.mesh(`coffee-maker-sculpted-bean-${index + 1}`, beanBodyGeometry, beanMaterial, pivot, false);
    bean.scale.set(0.085, 0.055, 0.045);
    bean.userData.beanProfile = 'oval-seed-with-longitudinal-crease';
    const crease = kit.mesh(`coffee-maker-bean-central-crease-${index + 1}`, creaseGeometry, beanCreaseMaterial, pivot, false);
    crease.userData.explodeWithParent = true;
  }

  const rearSpine = kit.mesh(
    'coffee-maker-rear-l-shaped-spine',
    new RoundedBoxGeometry(1.42, 1.26, 0.38, 4, 0.14),
    accent,
  );
  rearSpine.position.set(0, 0.84, -0.35);
  rearSpine.userData.part = 'rear-spine';

  const cavityBack = kit.mesh(
    'coffee-maker-brewing-cavity-back-panel',
    new RoundedBoxGeometry(1.12, 0.9, 0.045, 3, 0.11),
    accentLightMaterial,
    kit.root,
    false,
  );
  cavityBack.position.set(-0.08, 0.84, -0.13);
  cavityBack.userData.explodeWithParent = true;

  const base = kit.mesh(
    'coffee-maker-separated-base',
    new RoundedBoxGeometry(1.56, 0.25, 1.08, 4, 0.12),
    shell,
  );
  base.position.set(0, 0.18, 0.02);
  base.userData.part = 'base';

  const baseAccent = kit.mesh(
    'coffee-maker-base-accent-rail',
    new RoundedBoxGeometry(1.48, 0.095, 1, 3, 0.045),
    accent,
  );
  baseAccent.position.set(0, 0.085, 0.02);
  baseAccent.userData.explodeWithParent = true;

  // Pass 2: large front dial and narrow state bar are separate parts. The dial
  // pivot is exposed for both gallery power feedback and later interaction.
  const dialPivot = kit.pivot('coffee-maker-control-dial-pivot', upperAssembly);
  dialPivot.position.set(-0.47, 1.72, 0.57);
  dialPivot.userData.rotationAxis = [0, 0, 1];
  dialPivot.userData.rotationRange = [-0.76, 0.25];
  kit.socket('coffee-maker-control-dial-socket', dialPivot, [0, 0, 0]);

  const dialSeat = kit.mesh(
    'coffee-maker-control-dial-seat',
    new THREE.CylinderGeometry(0.22, 0.22, 0.055, 20),
    accentDeep,
    dialPivot,
  );
  dialSeat.rotation.x = Math.PI * 0.5;
  const dial = kit.mesh(
    'coffee-maker-large-control-dial',
    new THREE.CylinderGeometry(0.18, 0.19, 0.09, 20),
    accent,
    dialPivot,
  );
  dial.rotation.x = Math.PI * 0.5;
  dial.position.z = 0.04;
  const dialMark = kit.mesh(
    'coffee-maker-dial-index',
    new RoundedBoxGeometry(0.018, 0.095, 0.018, 1, 0.006),
    seam,
    dialPivot,
    false,
  );
  dialMark.position.set(0, 0.055, 0.1);

  const statusLight = kit.mesh(
    'coffee-maker-narrow-status-light',
    new RoundedBoxGeometry(0.035, 0.19, 0.025, 2, 0.014),
    kit.indicatorMaterial,
    upperAssembly,
    false,
  );
  statusLight.position.set(0.45, 1.73, 0.56);

  // Brew head, outlet and shower ring are a nested moving assembly under the
  // overhang. The liquid stream originates at the dedicated outlet socket.
  const brewHeadPivot = kit.pivot('coffee-maker-brew-head-pivot', upperAssembly);
  brewHeadPivot.position.set(-0.12, 1.3, 0.31);
  brewHeadPivot.userData.rotationAxis = [0, 0, 1];
  brewHeadPivot.userData.rotationRange = [-0.03, 0.03];
  const brewHead = kit.mesh(
    'coffee-maker-brew-head-housing',
    new RoundedBoxGeometry(0.5, 0.18, 0.45, 3, 0.08),
    seam,
    brewHeadPivot,
  );
  brewHead.position.y = 0.02;
  const showerPlate = kit.mesh(
    'coffee-maker-brew-head-shower-plate',
    new THREE.CylinderGeometry(0.14, 0.16, 0.045, 18),
    metal,
    brewHeadPivot,
  );
  showerPlate.position.set(0, -0.09, 0.1);
  const nozzle = kit.mesh(
    'coffee-maker-outlet-nozzle',
    new THREE.CylinderGeometry(0.055, 0.045, 0.17, 12),
    accentDeep,
    brewHeadPivot,
  );
  nozzle.position.set(0, -0.18, 0.1);
  kit.socket('coffee-maker-brew-head-socket', brewHeadPivot, [0, 0, 0]);
  const liquidSocket = kit.socket('coffee-maker-liquid-outlet-socket', brewHeadPivot, [0, -0.275, 0.1]);

  // The drip tray is deliberately wider than the cup, matching the reference
  // cavity proportions. Repeated slots are independent relief pieces.
  const tray = kit.mesh(
    'coffee-maker-drip-tray',
    new RoundedBoxGeometry(1.05, 0.075, 0.62, 3, 0.06),
    seam,
  );
  tray.position.set(-0.08, 0.34, 0.28);
  tray.userData.part = 'drip-tray';
  for (let index = 0; index < 7; index += 1) {
    const slot = kit.mesh(
      `coffee-maker-drip-tray-slot-${index + 1}`,
      new RoundedBoxGeometry(0.055, 0.012, 0.42, 1, 0.012),
      metal,
      kit.root,
      false,
    );
    slot.position.set(-0.35 + index * 0.09, 0.382, 0.28);
    slot.userData.explodeWithParent = true;
  }

  // Cup has a real negative-space handle and separate liquid surface. Its
  // socket/pivot lets future game code swap or remove the cup without touching
  // the appliance shell.
  const cupPivot = kit.pivot('coffee-maker-cup-pivot');
  cupPivot.position.set(-0.08, 0.38, 0.38);
  cupPivot.userData.translationRange = [[-0.1, 0, 0], [0.1, 0.02, 0]];
  kit.socket('coffee-maker-cup-socket', cupPivot, [0, 0, 0]);
  const cupBody = kit.mesh('coffee-maker-cup-body', taperedCupGeometry(), shell, cupPivot);
  cupBody.userData.part = 'cup';
  const cupFootBand = kit.mesh(
    'coffee-maker-cup-accent-foot-band',
    new THREE.CylinderGeometry(0.18, 0.18, 0.055, 18),
    accent,
    cupPivot,
  );
  cupFootBand.position.y = 0.035;
  const cupRim = kit.mesh(
    'coffee-maker-cup-rim',
    new THREE.TorusGeometry(0.225, 0.024, 6, 20),
    accentDeep,
    cupPivot,
  );
  cupRim.rotation.x = Math.PI * 0.5;
  cupRim.position.y = 0.48;
  const cupHandle = kit.mesh(
    'coffee-maker-cup-handle',
    new THREE.TorusGeometry(0.13, 0.035, 7, 20),
    shellLight,
    cupPivot,
  );
  cupHandle.position.set(0.265, 0.28, 0);
  cupHandle.scale.y = 1.12;
  const liquidSurface = kit.mesh(
    'coffee-maker-cup-liquid-surface',
    new THREE.CylinderGeometry(0.19, 0.19, 0.026, 18),
    coffee,
    cupPivot,
    false,
  );
  liquidSurface.position.y = 0.445;
  // The cup starts empty; CoffeeMakerPerformance reveals and raises this
  // volume during extraction, then stop() returns to the exact empty pose.
  liquidSurface.visible = false;
  const steamSocket = kit.socket('coffee-maker-steam-socket', cupPivot, [0, 0.53, 0]);

  // All extraction feedback is real closed geometry owned by the coffee-maker
  // performance module. Nothing here uses cards, sprites, lines or pooled FX.
  const extractionRig = kit.pivot('coffee-maker-volumetric-extraction-rig', liquidSocket);
  extractionRig.userData.performanceEffect = true;
  for (let index = 0; index < 3; index += 1) {
    const dropPivot = kit.pivot(`coffee-maker-extraction-drop-pivot-${index + 1}`, extractionRig);
    dropPivot.visible = false;
    dropPivot.userData.phaseOffset = index;
    kit.mesh(
      `coffee-maker-volumetric-extraction-drop-${index + 1}`,
      volumetricDropGeometry(),
      coffee,
      dropPivot,
      false,
    );
  }
  const flow = kit.mesh(
    'coffee-maker-primary-extraction-flow-center',
    new THREE.CylinderGeometry(0.046, 0.058, 0.36, 12),
    coffee,
    extractionRig,
    false,
  );
  flow.position.set(0, -0.18, 0);
  flow.visible = false;
  flow.userData.performanceEffect = true;
  for (let index = 0; index < 2; index += 1) {
    const ripple = kit.mesh(
      `coffee-maker-cup-liquid-ripple-${index + 1}`,
      new THREE.TorusGeometry(0.09 + index * 0.055, 0.008, 5, 18),
      coffee,
      cupPivot,
      false,
    );
    ripple.rotation.x = Math.PI * 0.5;
    ripple.position.y = 0.462;
    ripple.visible = false;
  }

  const steamRig = kit.pivot('coffee-maker-volumetric-steam-rig', steamSocket);
  steamRig.position.z = 0.42;
  steamRig.userData.performanceEffect = true;
  steamRig.userData.clearance = 'forward-of-upper-white-shell';
  for (let index = 0; index < 12; index += 1) {
    const puff = kit.pivot(`coffee-maker-steam-volume-pivot-${index + 1}`, steamRig);
    puff.visible = false;
    puff.userData.phaseOffset = index / 12;
    puff.userData.lane = (index % 5) - 2;
    for (let lobeIndex = 0; lobeIndex < 3; lobeIndex += 1) {
      const lobe = kit.mesh(
        `coffee-maker-steam-volume-${index + 1}-lobe-${lobeIndex + 1}`,
        irregularSteamGeometry(0.08 + lobeIndex * 0.022, index * 5 + lobeIndex),
        steamMaterial,
        puff,
        false,
      );
      lobe.position.set((lobeIndex - 1) * 0.055, lobeIndex * 0.065, ((index + lobeIndex) % 3 - 1) * 0.035);
    }
  }
  for (let index = 0; index < 5; index += 1) {
    const aroma = kit.mesh(
      `coffee-maker-volumetric-aroma-curl-${index + 1}`,
      aromaCurlGeometry(index),
      aromaMaterial,
      steamRig,
      false,
    );
    aroma.visible = false;
    aroma.position.set((index - 2) * 0.08, 0, (index % 2) * 0.035);
    aroma.userData.phaseOffset = index / 5;
  }
  for (let index = 0; index < 16; index += 1) {
    const glow = kit.mesh(
      `coffee-maker-warm-aroma-light-point-${index + 1}`,
      new THREE.OctahedronGeometry(0.025 + (index % 3) * 0.007, 0),
      warmLightMaterial,
      steamRig,
      false,
    );
    glow.visible = false;
    glow.userData.phaseOffset = index / 16;
    glow.userData.lane = (index % 7) - 3;
  }

  // Transparent rear water tank is independently serviceable. Exact reservoir
  // baffling is not visible and is intentionally omitted.
  const tankPivot = kit.pivot('coffee-maker-water-tank-pivot');
  tankPivot.position.set(0.82, 1.02, -0.12);
  const tank = kit.mesh(
    'coffee-maker-visible-side-water-tank',
    new RoundedBoxGeometry(0.31, 1.28, 0.36, 4, 0.1),
    waterTank,
    tankPivot,
  );
  tank.renderOrder = 2;
  const tankCap = kit.mesh(
    'coffee-maker-water-tank-cap',
    new RoundedBoxGeometry(0.29, 0.12, 0.34, 3, 0.055),
    accentDeep,
    tankPivot,
  );
  tankCap.position.y = 0.65;
  kit.socket('coffee-maker-water-tank-service-socket', tankPivot, [0, 0.66, 0]);

  // Rear ventilation bank, service hatch and power inlet are visible only in
  // orbit. Their placement follows the supplied rear elevation; internal pump,
  // boiler, hoses and wiring remain declared inference.
  const rearPanel = kit.mesh(
    'coffee-maker-rear-service-panel',
    new RoundedBoxGeometry(0.74, 0.74, 0.045, 3, 0.09),
    accent,
    kit.root,
    false,
  );
  rearPanel.position.set(-0.18, 0.87, -0.565);
  for (let index = 0; index < 7; index += 1) {
    const vent = kit.mesh(
      `coffee-maker-rear-vent-${index + 1}`,
      new RoundedBoxGeometry(0.43, 0.025, 0.025, 1, 0.009),
      seam,
      kit.root,
      false,
    );
    vent.position.set(-0.18, 0.66 + index * 0.07, -0.6);
    vent.userData.explodeWithParent = true;
  }
  const powerInlet = kit.mesh(
    'coffee-maker-rear-power-inlet',
    new RoundedBoxGeometry(0.28, 0.2, 0.05, 2, 0.05),
    rubber,
    kit.root,
  );
  powerInlet.position.set(0.3, 0.28, -0.56);
  for (const offset of [-0.07, 0.07]) {
    const contact = kit.mesh(
      `coffee-maker-rear-power-contact-${offset < 0 ? 'left' : 'right'}`,
      new THREE.CylinderGeometry(0.025, 0.025, 0.035, 8),
      metal,
      kit.root,
      false,
    );
    contact.rotation.x = Math.PI * 0.5;
    contact.position.set(0.3 + offset, 0.28, -0.595);
  }
  kit.socket('coffee-maker-power-socket', powerInlet, [0, 0, -0.05]);

  for (const [index, x, z] of [
    [1, -0.57, 0.35],
    [2, 0.57, 0.35],
    [3, -0.57, -0.35],
    [4, 0.57, -0.35],
  ] as const) {
    const foot = kit.mesh(
      `coffee-maker-foot-${index}`,
      new THREE.CylinderGeometry(0.09, 0.105, 0.07, 10),
      rubber,
      kit.root,
      false,
    );
    foot.position.set(x, 0.035, z);
  }

  kit.root.userData.coffeeMakerEffectContract = {
    modelOwner: 'coffee-maker-model-rig',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
    usesPlaneGeometry: false,
    usesSprite: false,
    sculptedBeans: 30,
    preInfusionDrops: 3,
    extractionColumns: 1,
    steamVolumes: 12,
    aromaCurls: 5,
    warmLightPoints: 16,
  };

  return kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'reference-defining L-shaped silhouette with cream overhanging upper shell, open brewing cavity, rear accent spine and separate low base',
        'large front rotary control with index mark plus narrow vertical status light',
        'independent brew-head housing, shower plate, downward outlet and liquid socket',
        'wide slotted drip tray, tapered removable cup, negative-space handle, rim and separate rising coffee surface',
        'side/rear translucent water reservoir with removable cap and service socket',
        'rear ventilation bank, service panel, low power inlet and four rubber feet',
        'top-width rectangular translucent bean hopper containing thirty oval beans with modeled longitudinal creases',
        'model-owned volumetric extraction drops, one outlet-aligned heavy flow column, liquid ripples, steam volumes, aroma tubes and warm light bodies',
      ],
      inferred: [
        'the reference path was unavailable during this build session; proportions were reconstructed from the supplied tri-view shown in the task context',
        'internal pump, heater, pressure hose routing, valve and wiring are hidden and intentionally not modeled',
        'rear service-panel depth, power-inlet recess and tank attachment rails are inferred from the rear/side presentation',
        'the underside screw pattern and exact foot attachment method are not visible; a stable symmetric four-foot layout is used',
      ],
    },
  );
}
