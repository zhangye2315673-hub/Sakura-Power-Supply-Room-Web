import * as THREE from 'three';
import {
  ApplianceModelKit,
  orientCylinderBetween,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_16 (2).png';

function extrudedProfile(
  points: readonly (readonly [number, number])[],
  depth: number,
  bevelSize: number,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: bevelSize > 0,
    bevelSegments: 2,
    bevelSize,
    bevelThickness: bevelSize,
    curveSegments: 4,
  });
  geometry.translate(0, 0, -depth * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

function curvedBladeGeometry(): THREE.ExtrudeGeometry {
  const blade = new THREE.Shape();
  blade.moveTo(0.055, 0.005);
  // The blade tip stays inside the 0.62 outer-ring inner radius. The old
  // profile reached ~0.67 and visibly clipped the guard during rotation.
  blade.bezierCurveTo(0.14, 0.012, 0.26, 0.04, 0.36, 0.12);
  blade.bezierCurveTo(0.43, 0.2, 0.45, 0.3, 0.38, 0.36);
  blade.bezierCurveTo(0.31, 0.4, 0.2, 0.34, 0.145, 0.24);
  blade.bezierCurveTo(0.09, 0.15, 0.06, 0.075, 0.055, 0.005);
  const geometry = new THREE.ExtrudeGeometry(blade, {
    depth: 0.042,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.012,
    bevelThickness: 0.01,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -0.021);
  geometry.computeVertexNormals();
  return geometry;
}

function addRing(
  kit: ApplianceModelKit,
  name: string,
  radius: number,
  tube: number,
  z: number,
  material: THREE.Material,
  parent: THREE.Object3D,
  outlined = false,
): THREE.Mesh {
  const ring = kit.mesh(name, new THREE.TorusGeometry(radius, tube, 6, 32), material, parent, outlined);
  ring.position.z = z;
  return ring;
}

function addSpoke(
  kit: ApplianceModelKit,
  name: string,
  angle: number,
  innerRadius: number,
  outerRadius: number,
  z: number,
  material: THREE.Material,
  parent: THREE.Object3D,
): void {
  const start = new THREE.Vector3(
    Math.cos(angle) * innerRadius,
    Math.sin(angle) * innerRadius,
    z,
  );
  const end = new THREE.Vector3(
    Math.cos(angle) * outerRadius,
    Math.sin(angle) * outerRadius,
    z,
  );
  const spoke = kit.mesh(
    name,
    new THREE.CylinderGeometry(0.012, 0.012, 1, 6),
    material,
    parent,
    false,
  );
  orientCylinderBetween(spoke, start, end);
}

function addGuardBridge(
  kit: ApplianceModelKit,
  name: string,
  angle: number,
  radius: number,
  rearZ: number,
  frontZ: number,
  material: THREE.Material,
  parent: THREE.Object3D,
): void {
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const bridge = kit.mesh(
    name,
    new THREE.CylinderGeometry(0.026, 0.026, 1, 6),
    material,
    parent,
    false,
  );
  orientCylinderBetween(
    bridge,
    new THREE.Vector3(x, y, rearZ),
    new THREE.Vector3(x, y, frontZ),
  );
  bridge.userData.part = 'guard-cage';
}

function accentVariation(accent: number, lightnessOffset: number): number {
  const color = new THREE.Color(accent);
  color.offsetHSL(0, -0.06, lightnessOffset);
  return color.getHex();
}

export function createFanModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const shellMaterial = kit.material(0xeee8dc, { tint: 0x766a80 });
  const seamMaterial = kit.material(0x766f7c, { tint: 0x5e5668 });
  const accentMaterial = kit.material(options.accent, { tint: 0x665973 });
  const bladeMaterial = kit.material(accentVariation(options.accent, 0.1), { tint: 0x746077 });
  const guardMaterial = kit.material(0xf1eadf, { tint: 0x6c6274 });
  const darkMaterial = kit.material(0x5d5967, { tint: 0x4c4655 });

  const baseShell = kit.mesh(
    'fan-base-shell',
    extrudedProfile([
      [-0.5, -0.84],
      [0.5, -0.84],
      [0.44, -0.56],
      [-0.42, -0.56],
    ], 0.66, 0.045),
    shellMaterial,
  );
  baseShell.userData.part = 'base-shell';

  const baseRail = kit.mesh(
    'fan-base-accent-rail',
    extrudedProfile([
      [-0.52, -0.87],
      [0.52, -0.87],
      [0.5, -0.79],
      [-0.5, -0.79],
    ], 0.68, 0.025),
    accentMaterial,
  );
  baseRail.userData.explodeWithParent = true;

  const baseSeam = kit.mesh(
    'fan-base-panel-seam',
    new THREE.BoxGeometry(0.88, 0.012, 0.688),
    seamMaterial,
    kit.root,
    false,
  );
  baseSeam.position.y = -0.785;
  baseSeam.userData.explodeWithParent = true;

  const dialPivot = kit.pivot('fan-speed-dial-pivot');
  dialPivot.position.set(0, -0.675, 0.305);
  const dial = kit.mesh(
    'fan-speed-dial',
    new THREE.CylinderGeometry(0.105, 0.105, 0.075, 16),
    accentMaterial,
    dialPivot,
  );
  dial.rotation.x = Math.PI * 0.5;
  const dialInset = kit.mesh(
    'fan-speed-dial-index',
    new THREE.BoxGeometry(0.014, 0.075, 0.012),
    darkMaterial,
    dialPivot,
    false,
  );
  dialInset.position.set(0, 0.012, 0.045);
  dialInset.userData.explodeWithParent = true;
  kit.indicator([0, -0.535, 0.294], 0.025);

  const supportColumn = kit.mesh(
    'fan-support-column',
    extrudedProfile([
      [-0.115, 0.0],
      [0.115, 0.0],
      [0.085, 0.76],
      [-0.085, 0.76],
    ], 0.16, 0.022),
    shellMaterial,
  );
  supportColumn.position.set(0, -0.55, -0.33);
  supportColumn.userData.part = 'support-column';
  const supportCollar = kit.mesh(
    'fan-support-collar',
    new THREE.CylinderGeometry(0.13, 0.14, 0.065, 12),
    accentMaterial,
  );
  supportCollar.position.set(0, 0.2, -0.33);
  supportCollar.userData.part = 'support-column';

  // Only the head yaws. The former hierarchy parented the support column to
  // this pivot, sweeping the column through the guard and the base.
  const oscillationPivot = kit.pivot('fan-oscillation-pivot');
  oscillationPivot.position.set(0, 0.25, -0.33);

  const headHinge = kit.pivot('fan-head-hinge', oscillationPivot);
  headHinge.position.set(0, 0, 0.33);
  kit.socket('fan-head-socket', headHinge, [0, 0, 0]);
  const hingeBody = kit.mesh(
    'fan-head-hinge-body',
    new THREE.CylinderGeometry(0.12, 0.12, 0.26, 12),
    shellMaterial,
    headHinge,
  );
  hingeBody.rotation.z = Math.PI * 0.5;
  const hingeCap = kit.mesh(
    'fan-head-hinge-cap',
    new THREE.CylinderGeometry(0.074, 0.074, 0.03, 12),
    accentMaterial,
    headHinge,
  );
  hingeCap.rotation.z = Math.PI * 0.5;
  hingeCap.position.x = 0.145;

  const motorHousing = kit.pivot('fan-motor-housing', headHinge);
  const barrel = kit.mesh(
    'fan-motor-barrel',
    new THREE.CylinderGeometry(0.205, 0.25, 0.34, 14),
    shellMaterial,
    motorHousing,
  );
  barrel.rotation.x = Math.PI * 0.5;
  barrel.position.z = -0.39;
  const rearCap = kit.mesh(
    'fan-motor-rear-cap',
    new THREE.CylinderGeometry(0.175, 0.175, 0.055, 14),
    accentMaterial,
    motorHousing,
  );
  rearCap.rotation.x = Math.PI * 0.5;
  rearCap.position.z = -0.575;
  for (let index = 0; index < 5; index += 1) {
    const vent = kit.mesh(
      `fan-rear-vent-${index + 1}`,
      new THREE.BoxGeometry(0.12 - Math.abs(index - 2) * 0.012, 0.014, 0.012),
      darkMaterial,
      motorHousing,
      false,
    );
    vent.position.set(0, (index - 2) * 0.038, -0.608);
    vent.userData.explodeWithParent = true;
  }

  const motorShaft = kit.mesh(
    'fan-motor-shaft',
    new THREE.CylinderGeometry(0.045, 0.045, 0.22, 10),
    darkMaterial,
    motorHousing,
    false,
  );
  motorShaft.rotation.x = Math.PI * 0.5;
  motorShaft.position.z = -0.12;
  motorShaft.userData.part = 'motor-shaft';

  const rotorPivot = kit.pivot('fan-rotor-pivot', headHinge);
  rotorPivot.position.z = 0.02;
  kit.socket('fan-rotor-axis-socket', rotorPivot, [0, 0, 0]);
  for (let index = 0; index < 5; index += 1) {
    const bladeRoot = kit.pivot(`fan-blade-root-${index + 1}`, rotorPivot);
    bladeRoot.rotation.z = index * (Math.PI * 2 / 5);
    const blade = kit.mesh(
      `fan-blade-${index + 1}`,
      curvedBladeGeometry(),
      bladeMaterial,
      bladeRoot,
      true,
    );
    blade.rotation.z = -0.2;
  }
  const rotorHub = kit.mesh(
    'fan-rotor-hub',
    new THREE.CylinderGeometry(0.12, 0.12, 0.12, 14),
    accentMaterial,
    rotorPivot,
  );
  rotorHub.rotation.x = Math.PI * 0.5;

  const rearGuard = kit.pivot('fan-rear-guard', headHinge);
  rearGuard.position.z = -0.15;
  const frontGuard = kit.pivot('fan-front-guard', headHinge);
  frontGuard.position.z = 0.15;
  const frontAirSocket = kit.socket('fan-front-air-socket', frontGuard, [0, 0, 0.22]);
  frontAirSocket.userData.direction = [0, 0, 1];
  frontAirSocket.userData.spectacleEffect = {
    type: 'fan-sakura-gust',
    poolSize: 24,
    startTime: 0.4,
    climaxTime: 3.7,
    stopTime: 4.8,
    pushNearbyPetals: true,
    crossScreen: true,
  };
  const ringRadii = [0.27, 0.39, 0.51];
  addRing(kit, 'fan-front-outer-ring', 0.62, 0.035, 0, guardMaterial, frontGuard, true);
  addRing(kit, 'fan-rear-outer-ring', 0.61, 0.03, 0, guardMaterial, rearGuard, true);
  ringRadii.forEach((radius, index) => {
    addRing(kit, `fan-front-concentric-ring-${index + 1}`, radius, 0.013, 0.012, guardMaterial, frontGuard);
    addRing(kit, `fan-rear-concentric-ring-${index + 1}`, radius, 0.012, -0.012, guardMaterial, rearGuard);
  });
  for (let index = 0; index < 8; index += 1) {
    const angle = index * (Math.PI / 4);
    addSpoke(kit, `fan-front-spoke-${index + 1}`, angle, 0.15, 0.6, 0.02, guardMaterial, frontGuard);
    addSpoke(kit, `fan-rear-spoke-${index + 1}`, angle, 0.16, 0.59, -0.02, guardMaterial, rearGuard);
  }
  for (let index = 0; index < 4; index += 1) {
    addGuardBridge(
      kit,
      `fan-guard-cage-bridge-${index + 1}`,
      Math.PI * 0.25 + index * Math.PI * 0.5,
      0.6,
      -0.15,
      0.15,
      guardMaterial,
      headHinge,
    );
  }

  const frontMedallion = kit.mesh(
    'fan-front-hub-medallion',
    new THREE.CylinderGeometry(0.155, 0.155, 0.055, 16),
    shellMaterial,
    frontGuard,
  );
  frontMedallion.rotation.x = Math.PI * 0.5;
  frontMedallion.position.z = 0.05;
  for (let index = 0; index < 5; index += 1) {
    const angle = index * (Math.PI * 2 / 5) + Math.PI * 0.5;
    const petal = kit.mesh(
      `fan-front-medallion-sakura-petal-${index + 1}`,
      new THREE.SphereGeometry(0.033, 8, 5),
      accentMaterial,
      frontGuard,
      false,
    );
    petal.scale.set(1.35, 0.72, 0.2);
    petal.rotation.z = angle;
    petal.position.set(Math.cos(angle) * 0.048, Math.sin(angle) * 0.048, 0.085);
    petal.userData.explodeWithParent = true;
  }

  headHinge.rotation.x = -0.035;

  return kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'trapezoidal two-layer base with rotary speed dial and status lamp',
        'fixed rear support column beneath separate head-only yaw and tilt pivots',
        'tapered rear motor barrel, visible center shaft, rear cap and five vent slots',
        'depth-separated front and rear guards joined by four outer cage bridges',
        'five broad swept fan blades on an isolated rotor pivot',
        'front medallion with restrained Sakura blossom relief',
      ],
      inferred: [
        'internal guard clips and motor shaft bearing are hidden in the reference',
        'oscillation mechanism is represented by a procedural yaw pivot inside the support',
        'blade camber and underside are inferred from the front and side silhouettes',
      ],
    },
  );
}
