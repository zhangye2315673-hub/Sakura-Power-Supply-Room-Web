import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_19 (8).png';

function shiftColor(color: number, lightness: number, saturation = 0): number {
  return new THREE.Color(color).offsetHSL(0, saturation, lightness).getHex();
}

function roundedPart(
  kit: ApplianceModelKit,
  name: string,
  size: readonly [number, number, number],
  radius: number,
  material: THREE.Material,
  parent: THREE.Object3D = kit.root,
  outlined = true,
): THREE.Mesh {
  const part = kit.mesh(
    name,
    new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius),
    material,
    parent,
    outlined,
  );
  part.userData.explodeWithParent = true;
  return part;
}

function hose(
  kit: ApplianceModelKit,
  name: string,
  points: readonly THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  parent: THREE.Object3D,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3([...points], false, 'catmullrom', 0.32);
  const mesh = kit.mesh(
    name,
    new THREE.TubeGeometry(curve, 24, radius, 7, false),
    material,
    parent,
    false,
  );
  mesh.userData.explodeWithParent = true;
  return mesh;
}

/**
 * Procedural reconstruction of the supplied three-view front-load washer.
 *
 * Local frame: +Y up, +Z front, floor at Y=0. The glass door sits on a
 * right-edge hinge pivot; the visible drum and laundry use a separate rotor.
 */
export function createWasherModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = shiftColor(options.accent, 0.2, -0.08);
  const accentMid = shiftColor(options.accent, 0.075, -0.04);
  const accentDark = shiftColor(options.accent, -0.12, -0.02);

  const shellMaterial = kit.material(0xeee9df, { tint: 0x71667d });
  const shellLightMaterial = kit.material(0xf8f1e7, { tint: 0x776b80 });
  const shellShadowMaterial = kit.material(0xd8d1ca, { tint: 0x665c70 });
  const accentMaterial = kit.material(accentMid, { tint: 0x6c6076 });
  const accentLightMaterial = kit.material(accentLight, { tint: 0x75687e });
  const accentDarkMaterial = kit.material(accentDark, { tint: 0x594e65 });
  const rubberMaterial = kit.material(0x565461, { tint: 0x403b49 });
  const metalMaterial = kit.material(0xa8a7ac, { tint: 0x615b68 });
  const glassMaterial = kit.material(0x6d7480, {
    tint: 0x4f4c62,
    transparent: true,
    opacity: 0.34,
  });
  const drumMaterial = kit.material(0x92939a, { tint: 0x5d5867 });
  const displayMaterial = kit.material(0x666777, {
    tint: 0x484457,
    emissive: accentLight,
  });
  const laundryMaterials = [
    kit.material(shiftColor(options.accent, 0.12), { tint: 0x6f6178 }),
    kit.material(0xf0b0b9, { tint: 0x746376 }),
    kit.material(0x86b7b1, { tint: 0x566a70 }),
    kit.material(0xe7bf6a, { tint: 0x766653 }),
  ];

  const cabinet = roundedPart(
    kit,
    'washer-cabinet-back-core',
    [2.7, 2.9, 0.22],
    0.1,
    shellMaterial,
  );
  cabinet.position.set(0, 1.56, -0.9);

  for (const side of [-1, 1] as const) {
    const sideShell = roundedPart(
      kit,
      `washer-cabinet-${side < 0 ? 'left' : 'right'}-side-shell`,
      [0.3, 2.72, 1.86],
      0.1,
      shellMaterial,
    );
    sideShell.position.set(side * 1.2, 1.55, -0.01);
  }

  const topCap = roundedPart(
    kit,
    'washer-top-cap',
    [2.66, 0.18, 1.98],
    0.08,
    accentLightMaterial,
  );
  topCap.position.set(0, 2.97, 0);

  const frontFrameParts: Array<{
    name: string;
    size: readonly [number, number, number];
    position: readonly [number, number, number];
  }> = [
    { name: 'washer-front-left-stile', size: [0.48, 2.05, 0.16], position: [-1.05, 1.38, 1.01] },
    { name: 'washer-front-right-stile', size: [0.48, 2.05, 0.16], position: [1.05, 1.38, 1.01] },
    { name: 'washer-front-lower-apron', size: [2.58, 0.44, 0.16], position: [0, 0.36, 1.01] },
    { name: 'washer-front-upper-apron', size: [2.58, 0.34, 0.16], position: [0, 2.31, 1.01] },
  ];
  frontFrameParts.forEach((part) => {
    const frame = roundedPart(kit, part.name, part.size, 0.1, shellLightMaterial);
    frame.position.set(...part.position);
  });

  const controlBand = roundedPart(
    kit,
    'washer-control-band',
    [2.56, 0.49, 0.12],
    0.075,
    shellLightMaterial,
  );
  controlBand.position.set(0, 2.66, 1.13);

  const bandAccent = roundedPart(
    kit,
    'washer-control-band-top-accent',
    [2.53, 0.115, 0.035],
    0.035,
    accentLightMaterial,
    kit.root,
    false,
  );
  bandAccent.position.set(0, 2.895, 1.205);

  const drawerPivot = kit.pivot('washer-detergent-drawer-pivot');
  drawerPivot.position.set(-0.86, 2.65, 1.205);
  drawerPivot.userData.travelAxis = [0, 0, 1];
  drawerPivot.userData.travelRange = [0, 0.28];
  kit.socket('washer-detergent-drawer-socket', drawerPivot, [0, 0, 0]);
  roundedPart(
    kit,
    'washer-detergent-drawer',
    [0.78, 0.27, 0.11],
    0.055,
    shellShadowMaterial,
    drawerPivot,
  );
  const drawerHandle = roundedPart(
    kit,
    'washer-detergent-drawer-handle',
    [0.48, 0.075, 0.045],
    0.027,
    accentMaterial,
    drawerPivot,
    false,
  );
  drawerHandle.position.set(0, -0.015, 0.08);

  const dialPivot = kit.pivot('washer-program-dial-pivot');
  dialPivot.position.set(-0.05, 2.65, 1.22);
  dialPivot.userData.rotationAxis = [0, 0, 1];
  kit.socket('washer-program-dial-socket', dialPivot, [0, 0, 0]);
  const dialBezel = kit.mesh(
    'washer-program-dial-bezel',
    new THREE.CylinderGeometry(0.23, 0.23, 0.085, 18),
    accentMaterial,
    dialPivot,
  );
  dialBezel.rotation.x = Math.PI * 0.5;
  const dial = kit.mesh(
    'washer-program-dial',
    new THREE.CylinderGeometry(0.165, 0.18, 0.12, 18),
    shellLightMaterial,
    dialPivot,
  );
  dial.rotation.x = Math.PI * 0.5;
  dial.position.z = 0.075;
  const dialMark = roundedPart(
    kit,
    'washer-program-dial-index',
    [0.022, 0.095, 0.018],
    0.008,
    accentDarkMaterial,
    dialPivot,
    false,
  );
  dialMark.position.set(0, 0.065, 0.145);

  const display = roundedPart(
    kit,
    'washer-display',
    [0.72, 0.27, 0.055],
    0.055,
    displayMaterial,
    kit.root,
  );
  display.position.set(0.82, 2.69, 1.235);
  for (let index = 0; index < 3; index += 1) {
    const button = kit.mesh(
      `washer-control-button-${index + 1}`,
      new THREE.CylinderGeometry(0.043, 0.043, 0.03, 12),
      index === 2 ? accentLightMaterial : shellLightMaterial,
      kit.root,
      false,
    );
    button.rotation.x = Math.PI * 0.5;
    button.position.set(0.64 + index * 0.17, 2.65, 1.286);
  }

  const drumRotor = kit.pivot('washer-drum-rotor');
  drumRotor.position.set(-0.04, 1.42, 1.12);
  drumRotor.userData.rotationAxis = [0, 0, 1];
  kit.socket('washer-drum-axis-socket', drumRotor, [0, 0, -0.55]);

  drumMaterial.side = THREE.DoubleSide;
  const drumWall = kit.mesh(
    'washer-deep-perforated-drum-wall',
    new THREE.CylinderGeometry(0.69, 0.69, 0.98, 32, 1, true),
    drumMaterial,
    drumRotor,
    false,
  );
  drumWall.rotation.x = Math.PI * 0.5;
  drumWall.position.z = -0.48;

  const drumBack = kit.mesh(
    'washer-deep-drum-back',
    new THREE.CylinderGeometry(0.665, 0.665, 0.055, 32),
    drumMaterial,
    drumRotor,
    false,
  );
  drumBack.rotation.x = Math.PI * 0.5;
  drumBack.position.z = -0.965;

  kit.mesh(
    'washer-stainless-drum-mouth',
    new THREE.TorusGeometry(0.69, 0.045, 8, 40),
    metalMaterial,
    drumRotor,
    false,
  ).position.z = 0.01;

  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI * 2 / 12;
    const perforation = kit.mesh(
      `washer-drum-perforation-${index + 1}`,
      new THREE.SphereGeometry(0.026, 6, 4),
      rubberMaterial,
      drumRotor,
      false,
    );
    perforation.scale.z = 0.3;
    perforation.position.set(Math.cos(angle) * 0.49, Math.sin(angle) * 0.49, -0.92);
  }

  for (let index = 0; index < 3; index += 1) {
    const angle = index * Math.PI * 2 / 3;
    const baffle = roundedPart(
      kit,
      `washer-drum-lifter-baffle-${index + 1}`,
      [0.18, 0.48, 0.12],
      0.055,
      shellShadowMaterial,
      drumRotor,
      false,
    );
    baffle.position.set(Math.cos(angle) * 0.53, Math.sin(angle) * 0.53, -0.36);
    baffle.rotation.z = angle;
  }

  const laundry: THREE.Mesh[] = [];
  const laundryPositions: readonly (readonly [number, number, number])[] = [
    [-0.3, -0.22, 0.035],
    [0.2, -0.31, 0.07],
    [0.34, 0.06, 0.025],
    [-0.08, 0.25, 0.08],
    [-0.35, 0.13, 0.02],
  ];
  laundryPositions.forEach(([x, y, z], index) => {
    const cloth = kit.mesh(
      `washer-laundry-volume-${index + 1}`,
      new THREE.IcosahedronGeometry(0.22, 1),
      laundryMaterials[index % laundryMaterials.length],
      drumRotor,
      false,
    );
    cloth.position.set(x, y, z);
    cloth.rotation.z = index * 0.7;
    cloth.scale.set(1.18 + index % 2 * 0.16, 0.72 + index % 3 * 0.08, 0.5 + index % 2 * 0.08);
    cloth.userData.isVolumetricLaundry = true;
    laundry.push(cloth);
  });

  const sudsRig = kit.pivot('washer-tub-suds-rig', drumRotor);
  sudsRig.position.z = 0.06;
  for (let index = 0; index < 7; index += 1) {
    const foam = kit.mesh(
      `washer-volumetric-suds-bubble-${index + 1}`,
      new THREE.SphereGeometry(0.055 + index % 3 * 0.018, 8, 6),
      glassMaterial,
      sudsRig,
      false,
    );
    foam.position.set(-0.38 + index * 0.13, -0.48 + (index % 2) * 0.08, 0.08 + index % 3 * 0.025);
    foam.visible = false;
    foam.userData.performanceProp = 'closed-volume-suds';
  }

  const dropletRig = kit.pivot('washer-glass-droplet-rig');
  dropletRig.position.set(-0.04, 1.42, 1.23);
  for (let index = 0; index < 5; index += 1) {
    const drop = kit.mesh(
      `washer-volumetric-glass-droplet-${index + 1}`,
      new THREE.SphereGeometry(0.036, 8, 6),
      glassMaterial,
      dropletRig,
      false,
    );
    const angle = 0.62 + index * 1.06;
    drop.position.set(Math.cos(angle) * (0.38 + index % 2 * 0.12), Math.sin(angle) * 0.47, 0);
    drop.scale.set(0.72, 1.24 + index % 2 * 0.22, 0.55);
    drop.visible = false;
    drop.userData.performanceProp = 'glass-water-droplet-volume';
  }

  const fixedGasket = kit.mesh(
    'washer-fixed-rubber-door-gasket',
    new THREE.TorusGeometry(0.79, 0.105, 12, 40),
    rubberMaterial,
    kit.root,
  );
  fixedGasket.position.set(-0.04, 1.42, 1.105);

  const gasketThroat = kit.mesh(
    'washer-door-gasket-depth-throat',
    new THREE.CylinderGeometry(0.73, 0.67, 0.32, 36, 1, true),
    rubberMaterial,
    kit.root,
    false,
  );
  gasketThroat.rotation.x = Math.PI * 0.5;
  gasketThroat.position.set(-0.04, 1.42, 0.97);

  const doorHinge = kit.pivot('washer-door-hinge');
  doorHinge.position.set(0.93, 1.42, 1.18);
  doorHinge.userData.rotationAxis = [0, 1, 0];
  doorHinge.userData.rotationRange = [0, 1.9];
  kit.socket('washer-door-hinge-socket', doorHinge, [0, 0, 0]);

  const doorAssembly = kit.pivot('washer-door-assembly', doorHinge);
  doorAssembly.position.set(-0.97, 0, 0);
  kit.mesh(
    'washer-door-outer-ring',
    new THREE.TorusGeometry(0.88, 0.13, 10, 32),
    accentLightMaterial,
    doorAssembly,
  );
  const innerDoorRing = kit.mesh(
    'washer-door-inner-ring',
    new THREE.TorusGeometry(0.69, 0.065, 8, 32),
    rubberMaterial,
    doorAssembly,
  );
  innerDoorRing.position.z = 0.06;
  const glass = kit.mesh(
    'washer-door-glass',
    new THREE.CylinderGeometry(0.65, 0.69, 0.12, 28),
    glassMaterial,
    doorAssembly,
  );
  glass.rotation.x = Math.PI * 0.5;
  glass.position.z = 0.065;
  glass.renderOrder = 4;
  glassMaterial.depthWrite = false;

  const doorHandlePivot = kit.pivot('washer-door-handle-pivot', doorAssembly);
  doorHandlePivot.position.set(0.75, 0, 0.13);
  doorHandlePivot.userData.travelAxis = [1, 0, 0];
  kit.socket('washer-door-handle-socket', doorHandlePivot, [0, 0, 0]);
  roundedPart(
    kit,
    'washer-door-handle',
    [0.25, 0.58, 0.16],
    0.1,
    accentMaterial,
    doorHandlePivot,
  );
  const handleInset = roundedPart(
    kit,
    'washer-door-handle-inset',
    [0.07, 0.32, 0.035],
    0.025,
    shellShadowMaterial,
    doorHandlePivot,
    false,
  );
  handleInset.position.z = 0.1;

  for (const side of [-1, 1]) {
    const sidePanel = roundedPart(
      kit,
      `washer-side-service-panel-${side < 0 ? 'left' : 'right'}`,
      [0.035, 1.84, 1.36],
      0.12,
      shellShadowMaterial,
      kit.root,
      true,
    );
    sidePanel.position.set(side * 1.36, 1.56, -0.02);
  }

  const rearAssembly = kit.pivot('washer-rear-service-assembly');
  const rearInset = roundedPart(
    kit,
    'washer-rear-inset-panel',
    [2.42, 2.56, 0.075],
    0.16,
    shellShadowMaterial,
    rearAssembly,
  );
  rearInset.position.set(0, 1.58, -1.045);
  const rearInnerPanel = roundedPart(
    kit,
    'washer-rear-pressed-panel',
    [1.75, 1.75, 0.045],
    0.14,
    shellLightMaterial,
    rearAssembly,
    false,
  );
  rearInnerPanel.position.set(0.1, 1.63, -1.095);

  const lowerAccess = roundedPart(
    kit,
    'washer-rear-lower-access-panel',
    [0.82, 0.48, 0.055],
    0.06,
    shellLightMaterial,
    rearAssembly,
  );
  lowerAccess.position.set(0.08, 0.63, -1.13);

  const screwPositions: readonly (readonly [number, number])[] = [
    [-1.08, 2.76], [1.08, 2.76], [-1.08, 0.38], [1.08, 0.38],
    [-0.3, 0.79], [0.45, 0.79],
  ];
  screwPositions.forEach(([x, y], index) => {
    const screw = kit.mesh(
      `washer-rear-fastener-${index + 1}`,
      new THREE.CylinderGeometry(0.035, 0.035, 0.025, 10),
      metalMaterial,
      rearAssembly,
      false,
    );
    screw.rotation.x = Math.PI * 0.5;
    screw.position.set(x, y, -1.165);
  });

  const drainPort = kit.mesh(
    'washer-drain-port',
    new THREE.TorusGeometry(0.11, 0.035, 8, 16),
    rubberMaterial,
    rearAssembly,
    false,
  );
  drainPort.position.set(0.95, 2.44, -1.14);
  kit.socket('washer-drain-hose-socket', drainPort, [0, 0, -0.04]);
  hose(
    kit,
    'washer-drain-hose',
    [
      new THREE.Vector3(0.95, 2.44, -1.14),
      new THREE.Vector3(1.18, 2.2, -1.18),
      new THREE.Vector3(1.18, 1.28, -1.18),
      new THREE.Vector3(0.92, 0.72, -1.18),
    ],
    0.055,
    rubberMaterial,
    rearAssembly,
  );

  const powerPort = roundedPart(
    kit,
    'washer-power-entry',
    [0.23, 0.23, 0.06],
    0.055,
    accentMaterial,
    rearAssembly,
    false,
  );
  powerPort.position.set(-0.75, 2.49, -1.15);
  kit.socket('washer-power-cord-socket', powerPort, [0, 0, -0.04]);
  hose(
    kit,
    'washer-power-cord',
    [
      new THREE.Vector3(-0.75, 2.49, -1.16),
      new THREE.Vector3(-0.78, 2.22, -1.19),
      new THREE.Vector3(-0.89, 2.02, -1.19),
    ],
    0.025,
    rubberMaterial,
    rearAssembly,
  );
  const rearPlug = roundedPart(
    kit,
    'washer-stowed-power-plug',
    [0.18, 0.26, 0.08],
    0.035,
    rubberMaterial,
    rearAssembly,
    false,
  );
  rearPlug.position.set(-0.89, 1.91, -1.2);

  for (const [index, [x, z]] of [
    [-1.05, -0.72], [1.05, -0.72], [-1.05, 0.72], [1.05, 0.72],
  ].entries()) {
    const foot = roundedPart(
      kit,
      `washer-foot-${index + 1}`,
      [0.38, 0.18, 0.4],
      0.065,
      rubberMaterial,
      kit.root,
      false,
    );
    foot.position.set(x, 0.09, z);
  }

  kit.indicator([1.05, 2.67, 1.286], 0.034);


  return kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'near-square rigid cabinet with true side depth, open front frame, colored top cap and four rubber feet',
        'separate upper control band with detergent drawer, rotary program dial, display and three buttons',
        'large layered porthole with fixed boot gasket, depth throat, accent outer ring, transparent convex glass and right handle',
        'visible deep cylindrical drum with stainless mouth, rear perforations, three lifter baffles and volumetric laundry bundles',
        'closed model-owned rigs for seven volumetric suds bubbles and five glass water droplets',
        'large side service stamp panels and rear pressed service hierarchy with lower access cover and fasteners',
        'rear drain hose, power entry, short power cord and stowed plug built as separate assemblies',
        'animation-ready door hinge, drum rotor, drawer travel pivot and hose/power sockets',
      ],
      inferred: [
        'the drum depth, baffles, laundry volume and internal suspension are hidden behind the tinted glass and are inferred',
        'the exact side-panel stamping depth and left/right symmetry are inferred from the single visible side view',
        'rear hose routing, connection depths, power-cord slack and lower access-cover function are simplified from the visible rear drawing',
        'door gasket cross-section, hinge internals, latch travel and underside leveling mechanisms are not visible and are simplified',
      ],
    },
  );
}
