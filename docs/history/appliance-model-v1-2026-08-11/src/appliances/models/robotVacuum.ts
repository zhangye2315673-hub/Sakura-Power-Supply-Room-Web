import * as THREE from 'three';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import { ensureRobotVacuumPerformanceRig } from '../performance/RobotVacuumPerformance';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 20_03_03 (4).png';

function shade(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

/**
 * Builds a solid annular sector in the XZ plane with Y thickness.  A sector is
 * used instead of a flattened box so the bumper and sensor band keep the
 * circular silhouette from elevated three-quarter views.
 */
function annularSectorGeometry(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  height: number,
  segments = 40,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  for (let index = 0; index <= segments; index += 1) {
    const angle = THREE.MathUtils.lerp(startAngle, endAngle, index / segments);
    const x = Math.cos(angle) * outerRadius;
    const y = Math.sin(angle) * outerRadius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let index = segments; index >= 0; index -= 1) {
    const angle = THREE.MathUtils.lerp(startAngle, endAngle, index / segments);
    shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
  }
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.012,
    bevelThickness: 0.008,
    curveSegments: 4,
  });
  geometry.translate(0, 0, -height * 0.5);
  geometry.rotateX(-Math.PI * 0.5);
  geometry.computeVertexNormals();
  return geometry;
}

function addHorizontalRing(
  kit: ApplianceModelKit,
  name: string,
  radius: number,
  tube: number,
  y: number,
  material: THREE.Material,
  parent: THREE.Object3D,
  outlined = false,
): THREE.Mesh {
  const ring = kit.mesh(
    name,
    new THREE.TorusGeometry(radius, tube, 6, 32),
    material,
    parent,
    outlined,
  );
  ring.rotation.x = Math.PI * 0.5;
  ring.position.y = y;
  return ring;
}

/**
 * Procedural reconstruction of the supplied top / low-side / underside robot
 * vacuum sheet. Local frame: +Y up, +Z front. The model intentionally remains
 * a horizontal low disc; the elevated gameplay/gallery camera is responsible
 * for revealing the top identity features.
 */
export function createRobotVacuumModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const cream = kit.material(0xf4eee2, { tint: 0x776b80 });
  const creamLight = kit.material(0xfff8eb, { tint: 0x7c7086 });
  const accent = kit.material(options.accent, { tint: 0x6d5f77 });
  const accentLight = kit.material(shade(options.accent, 0.14, -0.06), { tint: 0x76677f });
  const accentDark = kit.material(shade(options.accent, -0.14), { tint: 0x554b60 });
  const sensor = kit.material(0x3f414c, { tint: 0x34323f });
  const rubber = kit.material(0x56545f, { tint: 0x403d49 });
  const metal = kit.material(0xa6a4aa, { tint: 0x6d6874 });
  const brush = kit.material(0x393844, { tint: 0x302d39 });
  const statusRingMaterial = kit.material(shade(options.accent, 0.2, 0.04), {
    tint: 0x79677f,
    emissive: shade(options.accent, 0.12),
  });
  statusRingMaterial.emissiveIntensity = 0;

  const motionPivot = kit.pivot('robot-vacuum-motion-pivot');
  const chassisPivot = kit.pivot('robot-vacuum-chassis-pivot', motionPivot);
  kit.socket('robot-vacuum-chassis-socket', chassisPivot, [0, 0.3, 0]);
  kit.socket('robot-vacuum-left-connection-socket', chassisPivot, [-0.96, 0.34, 0]);
  kit.socket('robot-vacuum-right-connection-socket', chassisPivot, [0.96, 0.34, 0]);

  // Pass 1: low circular silhouette. The cream stepped chassis is deliberately
  // broader than the coloured cover and leaves a visible protective rim.
  const lowerChassis = kit.mesh(
    'robot-vacuum-lower-chassis',
    new THREE.CylinderGeometry(0.93, 0.96, 0.31, 36),
    cream,
    chassisPivot,
  );
  lowerChassis.position.y = 0.28;
  lowerChassis.userData.part = 'lower-chassis';

  const lowerSkirt = kit.mesh(
    'robot-vacuum-lower-rubber-skirt',
    new THREE.CylinderGeometry(0.9, 0.92, 0.075, 36),
    rubber,
    chassisPivot,
  );
  lowerSkirt.position.y = 0.105;
  lowerSkirt.userData.part = 'lower-skirt';

  const topAssembly = kit.pivot('robot-vacuum-top-assembly-pivot', chassisPivot);
  topAssembly.position.y = 0.41;
  kit.socket('robot-vacuum-top-assembly-socket', topAssembly, [0, 0, 0]);

  const topRim = kit.mesh(
    'robot-vacuum-cream-top-rim',
    new THREE.CylinderGeometry(0.91, 0.93, 0.12, 36),
    creamLight,
    topAssembly,
  );
  topRim.position.y = 0.015;
  topRim.userData.part = 'top-rim';

  const topCover = kit.mesh(
    'robot-vacuum-large-accent-top-cover',
    new THREE.CylinderGeometry(0.835, 0.865, 0.075, 36),
    accentLight,
    topAssembly,
  );
  topCover.position.y = 0.085;
  topCover.userData.part = 'top-cover';
  addHorizontalRing(
    kit,
    'robot-vacuum-top-cover-seam',
    0.855,
    0.018,
    0.105,
    accentDark,
    topAssembly,
  ).userData.explodeWithParent = true;

  // The front bumper is a true curved, independent shell with two visible end
  // splits. It can be pressed without moving the circular top cover.
  const bumperPivot = kit.pivot('robot-vacuum-front-bumper-pivot', chassisPivot);
  bumperPivot.position.y = 0.315;
  bumperPivot.userData.translationAxis = [0, 0, 1];
  bumperPivot.userData.translationRange = [-0.025, 0.01];
  kit.socket('robot-vacuum-bumper-socket', bumperPivot, [0, 0, 0.93]);

  const frontBumper = kit.mesh(
    'robot-vacuum-front-semicircle-bumper',
    annularSectorGeometry(0.79, 0.985, Math.PI, Math.PI * 2, 0.22),
    cream,
    bumperPivot,
  );
  frontBumper.userData.part = 'front-bumper';

  const sensorBand = kit.mesh(
    'robot-vacuum-front-black-sensor-band',
    annularSectorGeometry(0.968, 1.008, Math.PI * 1.08, Math.PI * 1.92, 0.105),
    sensor,
    bumperPivot,
    false,
  );
  sensorBand.position.y = -0.045;
  sensorBand.userData.part = 'front-sensor-band';

  for (const side of [-1, 1]) {
    const split = kit.mesh(
      `robot-vacuum-bumper-end-split-${side < 0 ? 'left' : 'right'}`,
      new THREE.BoxGeometry(0.022, 0.19, 0.13),
      accentDark,
      bumperPivot,
      false,
    );
    split.position.set(side * 0.925, 0.005, 0.12);
    split.rotation.y = side * 0.14;
    split.userData.explodeWithParent = true;
  }

  // Pass 2: raised LiDAR turret and the two vertically arranged top buttons
  // provide the identity that was absent in the old low, eye-level primitive.
  const lidarPivot = kit.pivot('robot-vacuum-lidar-rotor-pivot', topAssembly);
  lidarPivot.position.set(0, 0.14, -0.32);
  lidarPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('robot-vacuum-lidar-axis-socket', lidarPivot, [0, 0, 0]);

  const lidarSeat = kit.mesh(
    'robot-vacuum-lidar-recessed-seat',
    new THREE.CylinderGeometry(0.2, 0.22, 0.04, 24),
    cream,
    lidarPivot,
  );
  lidarSeat.position.y = -0.02;
  const lidarTower = kit.mesh(
    'robot-vacuum-raised-lidar-tower',
    new THREE.CylinderGeometry(0.145, 0.16, 0.135, 24),
    creamLight,
    lidarPivot,
  );
  lidarTower.position.y = 0.06;
  lidarTower.userData.part = 'lidar-tower';
  const lidarCap = kit.mesh(
    'robot-vacuum-lidar-accent-cap',
    new THREE.CylinderGeometry(0.142, 0.142, 0.04, 24),
    accent,
    lidarPivot,
  );
  lidarCap.position.y = 0.145;
  const lidarWindow = kit.mesh(
    'robot-vacuum-lidar-window',
    new THREE.BoxGeometry(0.12, 0.055, 0.018),
    sensor,
    lidarPivot,
    false,
  );
  lidarWindow.position.set(0, 0.07, 0.154);
  addHorizontalRing(
    kit,
    'robot-vacuum-lidar-status-ring',
    0.151,
    0.018,
    0.165,
    statusRingMaterial,
    lidarPivot,
  );

  const buttonPivot = kit.pivot('robot-vacuum-top-button-cluster-pivot', topAssembly);
  buttonPivot.position.set(0, 0.145, 0.08);
  kit.socket('robot-vacuum-button-cluster-socket', buttonPivot, [0, 0, 0]);
  const buttonRotors: THREE.Group[] = [];
  for (const [index, z] of [[0, -0.03], [1, 0.12]] as const) {
    const buttonRotor = kit.pivot(
      `robot-vacuum-top-${index === 0 ? 'power' : 'home'}-button-rotor`,
      buttonPivot,
    );
    buttonRotor.position.z = z;
    buttonRotors.push(buttonRotor);
    const buttonMaterial = index === 0 ? kit.indicatorMaterial : creamLight;
    kit.mesh(
      `robot-vacuum-top-${index === 0 ? 'power' : 'home'}-button`,
      new THREE.CylinderGeometry(0.057, 0.057, 0.025, 16),
      buttonMaterial,
      buttonRotor,
      false,
    );
    const glyph = kit.mesh(
      `robot-vacuum-top-${index === 0 ? 'power' : 'home'}-glyph`,
      index === 0
        ? new THREE.TorusGeometry(0.023, 0.006, 5, 12, Math.PI * 1.68)
        : new THREE.ConeGeometry(0.025, 0.026, 4),
      accentDark,
      buttonRotor,
      false,
    );
    glyph.rotation.x = Math.PI * 0.5;
    glyph.position.set(0, 0.017, 0);
    glyph.userData.explodeWithParent = true;
  }

  // Pass 3: underside assemblies. These are real independent components so an
  // orbit below the prop exposes a readable cleaner mechanism rather than a
  // featureless disc.
  const undersidePivot = kit.pivot('robot-vacuum-underside-assembly-pivot', chassisPivot);
  kit.socket('robot-vacuum-underside-socket', undersidePivot, [0, 0.08, 0]);
  const undersidePlate = kit.mesh(
    'robot-vacuum-underside-recessed-plate',
    new THREE.CylinderGeometry(0.76, 0.8, 0.055, 32),
    creamLight,
    undersidePivot,
  );
  undersidePlate.position.y = 0.075;
  undersidePlate.userData.part = 'underside-plate';

  const batteryCover = kit.mesh(
    'robot-vacuum-underside-battery-cover',
    new THREE.BoxGeometry(0.72, 0.035, 0.33),
    cream,
    undersidePivot,
    false,
  );
  batteryCover.position.set(0, 0.038, -0.5);
  batteryCover.userData.part = 'battery-cover';

  const casterPivot = kit.pivot('robot-vacuum-front-caster-pivot', undersidePivot);
  casterPivot.position.set(0, 0.015, 0.61);
  kit.socket('robot-vacuum-front-caster-socket', casterPivot, [0, 0, 0]);
  const caster = kit.mesh(
    'robot-vacuum-front-caster-wheel',
    new THREE.SphereGeometry(0.08, 12, 8),
    rubber,
    casterPivot,
  );
  caster.scale.set(0.7, 0.55, 1);

  for (const [index, x] of [[0, -0.19], [1, 0.19]] as const) {
    const contact = kit.mesh(
      `robot-vacuum-charging-contact-${index + 1}`,
      new THREE.BoxGeometry(0.13, 0.025, 0.11),
      metal,
      undersidePivot,
      false,
    );
    contact.position.set(x, 0.035, 0.52);
    contact.userData.part = 'charging-contact';
  }

  const leftWheelPivot = kit.pivot('robot-vacuum-left-drive-wheel-pivot', undersidePivot);
  const rightWheelPivot = kit.pivot('robot-vacuum-right-drive-wheel-pivot', undersidePivot);
  leftWheelPivot.position.set(-0.55, 0.04, 0.03);
  rightWheelPivot.position.set(0.55, 0.04, 0.03);
  leftWheelPivot.userData.rotationAxis = [1, 0, 0];
  rightWheelPivot.userData.rotationAxis = [1, 0, 0];
  kit.socket('robot-vacuum-left-wheel-axle-socket', leftWheelPivot, [0, 0, 0]);
  kit.socket('robot-vacuum-right-wheel-axle-socket', rightWheelPivot, [0, 0, 0]);

  for (const [name, parent] of [
    ['left', leftWheelPivot],
    ['right', rightWheelPivot],
  ] as const) {
    const wheel = kit.mesh(
      `robot-vacuum-${name}-drive-wheel`,
      new THREE.CylinderGeometry(0.145, 0.145, 0.2, 14),
      rubber,
      parent,
    );
    wheel.rotation.z = Math.PI * 0.5;
    wheel.userData.part = `${name}-drive-wheel`;
    for (const x of [-0.075, -0.025, 0.025, 0.075]) {
      const tread = kit.mesh(
        `robot-vacuum-${name}-wheel-tread-${x}`,
        new THREE.TorusGeometry(0.145, 0.012, 5, 14),
        sensor,
        parent,
        false,
      );
      tread.rotation.y = Math.PI * 0.5;
      tread.position.x = x;
      tread.userData.explodeWithParent = true;
    }
  }

  const mainBrushBay = kit.mesh(
    'robot-vacuum-main-brush-bay',
    new THREE.BoxGeometry(0.74, 0.04, 0.31),
    accent,
    undersidePivot,
    false,
  );
  mainBrushBay.position.set(0, 0.022, 0.12);
  mainBrushBay.userData.part = 'main-brush-bay';

  const mainBrushPivot = kit.pivot('robot-vacuum-main-brush-pivot', undersidePivot);
  mainBrushPivot.position.set(0, -0.005, 0.12);
  mainBrushPivot.userData.rotationAxis = [1, 0, 0];
  kit.socket('robot-vacuum-main-brush-axis-socket', mainBrushPivot, [0, 0, 0]);
  const roller = kit.mesh(
    'robot-vacuum-main-brush-roller',
    new THREE.CylinderGeometry(0.08, 0.08, 0.58, 12),
    brush,
    mainBrushPivot,
  );
  roller.rotation.z = Math.PI * 0.5;
  roller.userData.part = 'main-brush';
  for (let index = 0; index < 8; index += 1) {
    const fin = kit.mesh(
      `robot-vacuum-main-brush-fin-${index + 1}`,
      new THREE.BoxGeometry(0.54, 0.018, 0.105),
      index % 2 === 0 ? accentDark : rubber,
      mainBrushPivot,
      false,
    );
    fin.rotation.x = index * Math.PI / 4;
    fin.userData.explodeWithParent = true;
  }

  // Real underside layouts commonly use two edge-sweeping brushes ahead of
  // the central roller. Keep each brush as its own visible, action-ready rig;
  // a single centre disc reads as a wheel cap from the underside.
  for (const [side, x] of [['left', -0.58], ['right', 0.58]] as const) {
    const sideBrushPivot = kit.pivot(`robot-vacuum-${side}-side-brush-pivot`, undersidePivot);
    sideBrushPivot.position.set(x, -0.015, 0.47);
    sideBrushPivot.userData.rotationAxis = [0, 1, 0];
    sideBrushPivot.userData.brushSide = side;
    kit.socket(`robot-vacuum-${side}-side-brush-axis-socket`, sideBrushPivot, [0, 0, 0]);
    const sideBrushHub = kit.mesh(
      `robot-vacuum-${side}-side-brush-hub`,
      new THREE.CylinderGeometry(0.073, 0.073, 0.04, 12),
      accent,
      sideBrushPivot,
    );
    sideBrushHub.userData.part = `${side}-side-brush`;
    for (let armIndex = 0; armIndex < 3; armIndex += 1) {
      const armPivot = kit.pivot(`robot-vacuum-${side}-side-brush-arm-${armIndex + 1}`, sideBrushPivot);
      armPivot.rotation.y = armIndex * Math.PI * 2 / 3;
      const arm = kit.mesh(
        `robot-vacuum-${side}-side-brush-arm-stem-${armIndex + 1}`,
        new THREE.BoxGeometry(0.034, 0.028, 0.36),
        brush,
        armPivot,
        false,
      );
      arm.position.z = 0.18;
      for (let bristleIndex = 0; bristleIndex < 3; bristleIndex += 1) {
        const bristle = kit.mesh(
          `robot-vacuum-${side}-side-brush-bristle-${armIndex + 1}-${bristleIndex + 1}`,
          new THREE.BoxGeometry(0.02, 0.02, 0.2),
          brush,
          armPivot,
          false,
        );
        bristle.position.set((bristleIndex - 1) * 0.03, -0.015, 0.43);
        bristle.rotation.y = (bristleIndex - 1) * 0.11;
        bristle.userData.explodeWithParent = true;
      }
    }
  }

  // Underside fasteners and perimeter cliff sensors are visible in the supplied
  // bottom view. They remain low-cost primitive instances for browser runtime.
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4 + Math.PI / 8;
    const screw = kit.mesh(
      `robot-vacuum-underside-fastener-${index + 1}`,
      new THREE.CylinderGeometry(0.022, 0.022, 0.018, 8),
      metal,
      undersidePivot,
      false,
    );
    screw.position.set(Math.cos(angle) * 0.67, 0.022, Math.sin(angle) * 0.67);
  }
  for (const [index, angle] of [0.15, 1.42, 2.85, 4.4].entries()) {
    const cliffSensor = kit.mesh(
      `robot-vacuum-cliff-sensor-${index + 1}`,
      new THREE.BoxGeometry(0.12, 0.025, 0.075),
      sensor,
      undersidePivot,
      false,
    );
    cliffSensor.position.set(Math.cos(angle) * 0.7, 0.025, Math.sin(angle) * 0.7);
    cliffSensor.rotation.y = -angle + Math.PI * 0.5;
  }

  ensureRobotVacuumPerformanceRig(kit.root, kit.materials);
  return kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'low circular cream chassis with a larger coloured top cover and a clearly stepped protective rim',
        'independent front semicircle bumper with end splits and a dark curved sensor band',
        'raised rear-biased LiDAR cylinder with accent cap, side window and separate status ring',
        'two vertically aligned top buttons on a dedicated button-cluster pivot',
        'underside plate with front caster, paired charging contacts, battery cover and perimeter fasteners',
        'independent left/right drive wheels, central roller brush bay and clearly visible left/right three-arm edge brushes',
        'named pivots and sockets for top assembly, bumper, LiDAR rotor, wheels, main brush and both side brushes',
        'powered motion using brushes, wheels, LiDAR, status ring and a complete large-radius return loop',
      ],
      inferred: [
        'the referenced local PNG was unavailable to this worker; proportions follow the supplied top, low-side and underside image visible in the task',
        'the motor, gearbox, fan duct, dust bin, battery cells, internal LiDAR optics and wiring are hidden and intentionally not modeled',
        'the exact underside screw thread, wheel suspension travel and bumper microswitch linkage are inferred as closed attachment volumes',
        'the cliff-sensor depth and optical internals are inferred; their external windows follow the visible bottom-view placement language',
      ],
    },
  );
}
