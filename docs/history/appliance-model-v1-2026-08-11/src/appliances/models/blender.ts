import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'references/intake/blender/front.png';
const ACTIVE_DURATION = 5.2;

function setPart(mesh: THREE.Mesh, part: string, relief = false): void {
  mesh.userData.part = part;
  if (relief) mesh.userData.explodeWithParent = true;
}

function rounded(width: number, height: number, depth: number, radius: number, segments = 4): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, segments, radius);
}

function taperedRoundedBox(
  width: number,
  height: number,
  depth: number,
  topScale: number,
  radius: number,
): RoundedBoxGeometry {
  const geometry = rounded(width, height, depth, radius, 5);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index);
    const normalizedY = THREE.MathUtils.clamp(y / height + 0.5, 0, 1);
    const scale = THREE.MathUtils.lerp(1, topScale, normalizedY);
    positions.setX(index, positions.getX(index) * scale);
    positions.setZ(index, positions.getZ(index) * scale);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function jarShellGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0.94, 0.02),
    new THREE.Vector2(1.01, 0.11),
    new THREE.Vector2(1.09, 1.25),
    new THREE.Vector2(1.2, 2.34),
    new THREE.Vector2(1.28, 2.5),
    new THREE.Vector2(1.28, 2.56),
    new THREE.Vector2(1.19, 2.56),
    new THREE.Vector2(1.17, 2.43),
    new THREE.Vector2(1.02, 1.24),
    new THREE.Vector2(0.89, 0.12),
    new THREE.Vector2(0.88, 0.05),
  ];
  const geometry = new THREE.LatheGeometry(points, 48);
  geometry.computeVertexNormals();
  return geometry;
}

function lidGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0, -0.09),
    new THREE.Vector2(0.72, -0.1),
    new THREE.Vector2(1.29, -0.12),
    new THREE.Vector2(1.35, -0.08),
    new THREE.Vector2(1.34, 0.01),
    new THREE.Vector2(1.24, 0.08),
    new THREE.Vector2(0.9, 0.19),
    new THREE.Vector2(0.42, 0.27),
    new THREE.Vector2(0, 0.28),
  ];
  const geometry = new THREE.LatheGeometry(points, 48);
  geometry.computeVertexNormals();
  return geometry;
}

function handleGeometry(): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.05, 2.19, -0.02),
    new THREE.Vector3(1.55, 2.17, -0.02),
    new THREE.Vector3(1.84, 1.94, -0.02),
    new THREE.Vector3(1.91, 1.54, -0.02),
    new THREE.Vector3(1.91, 0.72, -0.02),
    new THREE.Vector3(1.72, 0.38, -0.02),
    new THREE.Vector3(1.12, 0.18, -0.02),
  ]);
  return new THREE.TubeGeometry(curve, 44, 0.18, 12, false);
}

function jarRibGeometry(): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.24, 0.96),
    new THREE.Vector3(0, 0.65, 1.0),
    new THREE.Vector3(0, 1.38, 1.08),
    new THREE.Vector3(0, 2.2, 1.17),
  ]);
  return new THREE.TubeGeometry(curve, 20, 0.034, 7, false);
}

function bladeGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0.04, -0.065);
  shape.lineTo(0.72, -0.11);
  shape.lineTo(0.58, 0.045);
  shape.lineTo(0.04, 0.065);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 1, curveSegments: 1 });
  geometry.rotateX(-Math.PI * 0.5);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    positions.setY(index, positions.getY(index) + THREE.MathUtils.clamp(x - 0.2, 0, 0.55) * 0.16);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function strawberryGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(0.24, 2);
  geometry.scale(0.9, 1.18, 0.9);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index);
    const taper = THREE.MathUtils.lerp(0.58, 1, THREE.MathUtils.clamp((y + 0.29) / 0.55, 0, 1));
    positions.setX(index, positions.getX(index) * taper);
    positions.setZ(index, positions.getZ(index) * taper);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function appleGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(0.255, 18, 12);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const angle = Math.atan2(z, x);
    const lobe = 1 + Math.cos(angle * 5) * 0.035;
    const topDimple = y > 0.12 ? THREE.MathUtils.lerp(1, 0.82, (y - 0.12) / 0.14) : 1;
    positions.setX(index, x * lobe * topDimple);
    positions.setZ(index, z * lobe * topDimple);
    positions.setY(index, y * 0.94);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function bananaGeometry(): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, 0.02, 0),
    new THREE.Vector3(-0.2, -0.08, 0.02),
    new THREE.Vector3(0, -0.13, 0),
    new THREE.Vector3(0.22, -0.07, -0.02),
    new THREE.Vector3(0.36, 0.08, 0),
  ], false, 'centripetal', 0.45);
  return new THREE.TubeGeometry(curve, 24, 0.105, 9, false);
}

function smoothieSurfaceGeometry(): THREE.LatheGeometry {
  const points = [
    new THREE.Vector2(0, -0.035),
    new THREE.Vector2(0.16, -0.055),
    new THREE.Vector2(0.48, -0.018),
    new THREE.Vector2(0.82, 0.035),
    new THREE.Vector2(1.075, 0.015),
    new THREE.Vector2(1.075, -0.055),
    new THREE.Vector2(0, -0.055),
  ];
  const geometry = new THREE.LatheGeometry(points, 40);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Procedural reconstruction of the supplied Sakura blender turn sheet.
 * Local frame: +Y up, +Z faces the speed dial, floor at Y=0.
 */
export function createBlenderModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const pink = accent.clone().offsetHSL(0, -0.045, 0.04).getHex();
  const pinkLight = accent.clone().offsetHSL(0, -0.08, 0.13).getHex();

  const cream = kit.material(0xf7eddc, { tint: 0x927e86 });
  const creamLight = kit.material(0xfff7ea, { tint: 0xa58f96 });
  const pinkShell = kit.material(pink, { tint: 0x8d6673 });
  const pinkEdge = kit.material(pinkLight, { tint: 0xa87883 });
  const pinkShadow = kit.material(accent.clone().offsetHSL(0, 0.01, -0.11).getHex(), { tint: 0x70525e });
  const mint = kit.material(0xbfd8d0, { tint: 0x718f91 });
  const cavity = kit.material(0x4e474d, { tint: 0x332f36 });
  const rubber = kit.material(0x494449, { tint: 0x2f2c32 });
  const steel = kit.material(0x68696c, { tint: 0x343943 });
  const jarMaterial = kit.material(0xf4f2e8, {
    tint: 0xa8bbc0,
    transparent: true,
    opacity: 0.22,
  });
  jarMaterial.depthWrite = false;
  const jarHighlight = kit.material(0xfffdf4, {
    tint: 0xb6c8ca,
    transparent: true,
    opacity: 0.62,
  });
  jarHighlight.depthWrite = false;
  const collarMaterial = kit.material(pinkLight, {
    tint: 0xa67982,
    transparent: true,
    opacity: 0.5,
  });
  collarMaterial.depthWrite = false;
  const smoothieMaterial = kit.material(0xf5a9b9, {
    tint: 0xb87088,
    emissive: 0xf080a4,
    transparent: true,
    opacity: 0.76,
  });
  smoothieMaterial.depthWrite = false;
  const smoothieHighlight = kit.material(0xffd3df, {
    tint: 0xc77e95,
    emissive: 0xff89ad,
    transparent: true,
    opacity: 0.64,
  });
  smoothieHighlight.depthWrite = false;
  const fruitRed = kit.material(0xe95763, { tint: 0x8c293d });
  const fruitRedLight = kit.material(0xff8a92, { tint: 0xa84050 });
  const fruitOrange = kit.material(0xf59b42, { tint: 0xa64e27 });
  const fruitYellow = kit.material(0xffd35c, { tint: 0xb27628 });
  const fruitGreen = kit.material(0x70ad6f, { tint: 0x345f4a });
  const blueberry = kit.material(0x5963a8, { tint: 0x303b75 });
  const blueberryBloom = kit.material(0xaab0df, { tint: 0x5d659c });
  // Blockout: lock the two-band motor base and overall taper first.
  const basePivot = kit.pivot('blender-motor-base-pivot');
  const lowerBase = kit.mesh(
    'blender-pink-lower-motor-base',
    taperedRoundedBox(3.25, 0.92, 3.05, 0.96, 0.18),
    pinkShell,
    basePivot,
  );
  lowerBase.position.y = 0.58;
  setPart(lowerBase, 'lower-base-shell');

  const upperBase = kit.mesh(
    'blender-cream-upper-motor-base',
    taperedRoundedBox(3.08, 0.76, 2.88, 0.9, 0.14),
    cream,
    basePivot,
  );
  upperBase.position.y = 1.37;
  setPart(upperBase, 'upper-base-shell');

  const seamBand = kit.mesh(
    'blender-horizontal-base-seam-band',
    rounded(3.08, 0.055, 2.88, 0.025, 2),
    pinkEdge,
    basePivot,
    false,
  );
  seamBand.position.y = 1.01;
  setPart(seamBand, 'base-seam-band', true);

  const jarSeatPivot = kit.pivot('blender-jar-seat-pivot');
  jarSeatPivot.position.y = 1.74;
  kit.socket('blender-jar-lock-socket', jarSeatPivot, [0, 0.05, 0]);
  const jarSeat = kit.mesh(
    'blender-shallow-pink-jar-seat',
    new THREE.CylinderGeometry(1.01, 1.08, 0.14, 40),
    pinkEdge,
    jarSeatPivot,
  );
  setPart(jarSeat, 'jar-seat');

  // The jar is a true lathed wall profile rather than an opaque cone.
  const jarPivot = kit.pivot('blender-removable-jar-pivot');
  jarPivot.position.y = 1.81;
  jarPivot.userData.translationAxis = [0, 1, 0];
  kit.socket('blender-handle-upper-socket', jarPivot, [1.05, 2.19, 0]);
  kit.socket('blender-handle-lower-socket', jarPivot, [1.12, 0.18, 0]);
  kit.socket('blender-lid-seat-socket', jarPivot, [0, 2.56, 0]);
  kit.socket('blender-blade-bearing-socket', jarPivot, [0, 0.16, 0]);
  const jar = kit.mesh(
    'blender-transparent-tapered-jar-shell',
    jarShellGeometry(),
    jarMaterial,
    jarPivot,
    false,
  );
  jar.renderOrder = 5;
  setPart(jar, 'jar-shell');

  const upperCollar = kit.mesh(
    'blender-translucent-pink-upper-jar-collar',
    new THREE.CylinderGeometry(1.265, 1.2, 0.34, 48, 1, true),
    collarMaterial,
    jarPivot,
    false,
  );
  upperCollar.position.y = 2.39;
  upperCollar.renderOrder = 6;
  setPart(upperCollar, 'jar-upper-collar');

  const jarRim = kit.mesh(
    'blender-rolled-transparent-jar-rim',
    new THREE.TorusGeometry(1.265, 0.035, 8, 48),
    jarHighlight,
    jarPivot,
    false,
  );
  jarRim.rotation.x = Math.PI * 0.5;
  jarRim.position.y = 2.53;
  jarRim.renderOrder = 7;
  setPart(jarRim, 'jar-rim', true);

  const ribGeometry = jarRibGeometry();
  for (let index = 0; index < 8; index += 1) {
    const rib = kit.mesh(
      `blender-molded-jar-rib-${index + 1}`,
      ribGeometry,
      jarHighlight,
      jarPivot,
      false,
    );
    rib.rotation.y = index * Math.PI / 4 + Math.PI / 8;
    rib.renderOrder = 7;
    setPart(rib, 'jar-rib-array', true);
  }

  const coupling = kit.mesh(
    'blender-inferred-dark-blade-coupling-ring',
    new THREE.CylinderGeometry(0.31, 0.38, 0.12, 28),
    cavity,
    jarPivot,
  );
  coupling.position.y = 0.1;
  setPart(coupling, 'coupling-ring');

  const bladePivot = kit.pivot('blender-four-blade-rotation-pivot', jarPivot);
  bladePivot.position.y = 0.19;
  bladePivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('blender-blade-axis-socket', bladePivot, [0, 0, 0]);
  const bladeHub = kit.mesh(
    'blender-stepped-central-blade-hub',
    new THREE.CylinderGeometry(0.19, 0.24, 0.2, 24),
    steel,
    bladePivot,
  );
  setPart(bladeHub, 'blade-hub');
  const sharedBladeGeometry = bladeGeometry();
  for (let index = 0; index < 4; index += 1) {
    const blade = kit.mesh(
      `blender-canted-metal-blade-${index + 1}`,
      sharedBladeGeometry,
      steel,
      bladePivot,
    );
    blade.rotation.y = index * Math.PI / 2;
    setPart(blade, 'blade-array');
  }

  const vortexPivot = kit.pivot('blender-powered-liquid-vortex-pivot', jarPivot);
  vortexPivot.position.y = 0.23;
  vortexPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('blender-liquid-effect-socket', vortexPivot, [0, 0, 0]);
  const liquidGeometry = new THREE.CylinderGeometry(1.15, 0.79, 2.18, 40, 4, false);
  liquidGeometry.translate(0, 1.09, 0);
  const liquid = kit.mesh(
    'blender-powered-rising-smoothie-volume',
    liquidGeometry,
    smoothieMaterial,
    vortexPivot,
    false,
  );
  liquid.renderOrder = 3;
  liquid.visible = false;
  setPart(liquid, 'liquid-vortex-pivot');

  const liquidSurface = kit.mesh(
    'blender-powered-smoothie-concave-surface',
    smoothieSurfaceGeometry(),
    smoothieHighlight,
    vortexPivot,
    false,
  );
  liquidSurface.position.y = 2.17;
  liquidSurface.renderOrder = 4;
  liquidSurface.visible = false;
  setPart(liquidSurface, 'liquid-vortex-pivot', true);

  const spiralCurve = new THREE.CatmullRomCurve3(Array.from({ length: 28 }, (_, index) => {
    const progress = index / 27;
    const angle = progress * Math.PI * 5.5;
    const radius = THREE.MathUtils.lerp(0.16, 0.96, progress);
    return new THREE.Vector3(Math.cos(angle) * radius, 2.13 + progress * 0.075, Math.sin(angle) * radius);
  }), false, 'centripetal', 0.4);
  const spiral = kit.mesh(
    'blender-powered-smoothie-vortex-highlight',
    new THREE.TubeGeometry(spiralCurve, 72, 0.026, 6, false),
    smoothieHighlight,
    vortexPivot,
    false,
  );
  spiral.visible = false;
  spiral.renderOrder = 4;
  setPart(spiral, 'liquid-vortex-pivot', true);

  // Pressure vents at the two lid/body seams. The mint knob remains a
  // separate lid part and is deliberately not used as a splash origin.
  const splashMouthSocket = kit.socket('blender-splash-mouth-socket', jarPivot, [-0.98, 2.52, 0.02]);
  splashMouthSocket.userData.direction = [-0.72, 0.34, 0.16];
  const splashRightSocket = kit.socket('blender-splash-right-gap-socket', jarPivot, [0.98, 2.52, 0.02]);
  splashRightSocket.userData.direction = [0.72, 0.34, 0.16];

  const wholeFruitPivot = kit.pivot('blender-whole-fruit-pivot', jarPivot);
  wholeFruitPivot.userData.jarInteriorRadius = 1.14;
  wholeFruitPivot.userData.jarInteriorTop = 2.34;
  const fruitSeeds = [
    { id: 'strawberry', position: [-0.38, 1.27, 0.17] as const, rotation: [0.12, -0.35, 0.22] as const, scale: 1.42 },
    { id: 'apple', position: [0.34, 1.38, -0.12] as const, rotation: [-0.08, 0.42, -0.12] as const, scale: 1.38 },
    { id: 'orange', position: [-0.17, 0.8, -0.32] as const, rotation: [0.15, 0.16, -0.08] as const, scale: 1.48 },
    { id: 'banana', position: [0.14, 1.02, 0.32] as const, rotation: [0.22, -0.42, 0.32] as const, scale: 1.28 },
  ];

  fruitSeeds.forEach((entry) => {
    const fruitPivot = kit.pivot(`blender-fruit-${entry.id}-pivot`, wholeFruitPivot);
    fruitPivot.position.set(entry.position[0], entry.position[1], entry.position[2]);
    fruitPivot.rotation.set(entry.rotation[0], entry.rotation[1], entry.rotation[2]);
    fruitPivot.scale.setScalar(entry.scale);
    fruitPivot.userData.pileScale = entry.scale;
    if (entry.id === 'strawberry') {
      const body = kit.mesh('blender-fruit-strawberry-body', strawberryGeometry(), fruitRed, fruitPivot);
      setPart(body, 'powered-fruit-assembly');
      for (let leafIndex = 0; leafIndex < 5; leafIndex += 1) {
        const leaf = kit.mesh(
          `blender-fruit-strawberry-leaf-${leafIndex + 1}`,
          new THREE.ConeGeometry(0.075, 0.2, 6),
          fruitGreen,
          fruitPivot,
          false,
        );
        leaf.position.y = 0.29;
        leaf.rotation.z = Math.PI * 0.5;
        leaf.rotation.y = leafIndex * Math.PI * 0.4;
        setPart(leaf, 'powered-fruit-assembly', true);
      }
    } else if (entry.id === 'apple') {
      const body = kit.mesh('blender-fruit-apple-lobed-body', appleGeometry(), fruitRedLight, fruitPivot);
      setPart(body, 'powered-fruit-assembly');
      const stem = kit.mesh('blender-fruit-apple-stem', new THREE.CylinderGeometry(0.025, 0.032, 0.17, 7), cavity, fruitPivot, false);
      stem.position.y = 0.3;
      stem.rotation.z = -0.16;
      setPart(stem, 'powered-fruit-assembly', true);
      const leaf = kit.mesh('blender-fruit-apple-leaf', new THREE.SphereGeometry(0.1, 9, 6), fruitGreen, fruitPivot, false);
      leaf.position.set(0.11, 0.32, 0);
      leaf.scale.set(1.45, 0.2, 0.66);
      leaf.rotation.z = -0.38;
      setPart(leaf, 'powered-fruit-assembly', true);
    } else if (entry.id === 'orange') {
      const body = kit.mesh('blender-fruit-orange-dimpled-body', new THREE.IcosahedronGeometry(0.265, 2), fruitOrange, fruitPivot);
      setPart(body, 'powered-fruit-assembly');
      const calyx = kit.mesh('blender-fruit-orange-calyx', new THREE.CylinderGeometry(0.055, 0.085, 0.035, 7), fruitGreen, fruitPivot, false);
      calyx.position.y = 0.27;
      setPart(calyx, 'powered-fruit-assembly', true);
    } else {
      const body = kit.mesh('blender-fruit-banana-curved-body', bananaGeometry(), fruitYellow, fruitPivot);
      setPart(body, 'powered-fruit-assembly');
      for (const [x, y, label] of [[-0.36, 0.08, 'left'], [0.37, 0.12, 'right']] as const) {
        const cap = kit.mesh(`blender-fruit-banana-${label}-cap`, new THREE.SphereGeometry(0.11, 9, 6), fruitYellow, fruitPivot, false);
        cap.position.set(x, y, 0);
        setPart(cap, 'powered-fruit-assembly', true);
      }
    }
  });

  const berryPivot = kit.pivot('blender-fruit-blueberry-cluster-pivot', wholeFruitPivot);
  berryPivot.position.set(0.38, 0.64, 0.05);
  berryPivot.scale.setScalar(1.34);
  berryPivot.userData.pileScale = 1.34;
  [[-0.11, 0.06, 0.03], [0.1, 0.08, -0.02], [0, 0.24, 0.04]].forEach((position, index) => {
    const berry = kit.mesh(`blender-fruit-blueberry-${index + 1}-body`, new THREE.DodecahedronGeometry(0.135, 1), blueberry, berryPivot);
    berry.position.set(position[0], position[1], position[2]);
    setPart(berry, 'powered-fruit-assembly');
    const crown = kit.mesh(`blender-fruit-blueberry-${index + 1}-crown`, new THREE.TorusGeometry(0.042, 0.012, 5, 8), blueberryBloom, berryPivot, false);
    crown.position.set(position[0], position[1] + 0.125, position[2]);
    crown.rotation.x = Math.PI * 0.5;
    setPart(crown, 'powered-fruit-assembly', true);
  });

  const fruitChunkPivot = kit.pivot('blender-cut-fruit-chunk-pivot', jarPivot);
  const chunkMaterials = [fruitRed, fruitOrange, fruitYellow, blueberry];
  const chunkPositions = [
    [-0.54, 0.5, 0.18], [-0.25, 0.62, -0.28], [0.06, 0.52, 0.4], [0.38, 0.66, -0.22],
    [0.57, 0.78, 0.12], [-0.42, 0.9, -0.16], [-0.05, 0.98, 0.25], [0.29, 1.08, -0.34],
    [-0.34, 1.18, 0.35], [0.42, 1.28, 0.18], [-0.08, 1.38, -0.42], [0.18, 1.5, 0.04],
  ] as const;
  chunkPositions.forEach((position, index) => {
    const chunk = kit.mesh(
      `blender-cut-fruit-chunk-${index + 1}`,
      index % 3 === 0 ? new THREE.TetrahedronGeometry(0.115, 1) : new THREE.DodecahedronGeometry(0.1, 0),
      chunkMaterials[index % chunkMaterials.length],
      fruitChunkPivot,
    );
    chunk.position.set(position[0], position[1], position[2]);
    chunk.rotation.set(index * 0.31, index * 0.57, index * 0.23);
    chunk.visible = false;
    setPart(chunk, 'powered-fruit-chunks');
  });

  const handlePivot = kit.pivot('blender-jar-handle-attachment-pivot', jarPivot);
  const handle = kit.mesh(
    'blender-cream-closed-loop-handle',
    handleGeometry(),
    cream,
    handlePivot,
  );
  setPart(handle, 'jar-handle');
  const handleRootGeometry = new THREE.SphereGeometry(1, 16, 10);
  for (const [x, y, label] of [[1.07, 2.18, 'upper'], [1.13, 0.18, 'lower']] as const) {
    const root = kit.mesh(
      `blender-handle-${label}-embedded-root`,
      handleRootGeometry,
      cream,
      jarPivot,
    );
    root.position.set(x, y, -0.02);
    root.scale.set(0.25, 0.22, 0.24);
    setPart(root, 'jar-handle', true);
  }

  const lidPivot = kit.pivot('blender-removable-lid-pivot', jarPivot);
  lidPivot.position.y = 2.58;
  lidPivot.userData.translationAxis = [0, 1, 0];
  const lid = kit.mesh('blender-domed-pink-lid', lidGeometry(), pinkShell, lidPivot);
  setPart(lid, 'lid-shell');
  const lidFlange = kit.mesh(
    'blender-thin-projecting-lid-flange',
    new THREE.TorusGeometry(1.31, 0.045, 8, 48),
    pinkEdge,
    lidPivot,
    false,
  );
  lidFlange.rotation.x = Math.PI * 0.5;
  lidFlange.position.y = -0.075;
  setPart(lidFlange, 'lid-flange', true);
  const lidKnob = kit.mesh(
    'blender-low-mint-lid-knob',
    new THREE.CylinderGeometry(0.46, 0.48, 0.14, 32),
    mint,
    lidPivot,
  );
  lidKnob.position.y = 0.34;
  setPart(lidKnob, 'lid-knob');

  // Front dial remains a separate action pivot even at blockout stage.
  const dialPivot = kit.pivot('blender-front-speed-dial-pivot');
  // Keep the control embedded by a few centimetres while clearing the wider
  // replacement base. The old depth belonged to the narrower blockout and
  // left the complete dial hidden inside the new lower shell.
  dialPivot.position.set(0, 0.77, 1.52);
  dialPivot.userData.rotationAxis = [0, 0, 1];
  kit.socket('blender-speed-control-socket', dialPivot, [0, 0, 0]);
  const dial = kit.mesh(
    'blender-large-mint-speed-dial',
    new THREE.CylinderGeometry(0.38, 0.4, 0.16, 36),
    mint,
    dialPivot,
  );
  dial.rotation.x = Math.PI * 0.5;
  setPart(dial, 'speed-dial');

  const dialShadowRing = kit.mesh(
    'blender-speed-dial-dark-rear-ring',
    new THREE.TorusGeometry(0.405, 0.035, 7, 36),
    pinkShadow,
    dialPivot,
    false,
  );
  dialShadowRing.position.z = 0.105;
  setPart(dialShadowRing, 'speed-dial', true);
  const dialFaceRing = kit.mesh(
    'blender-speed-dial-pale-face-ring',
    new THREE.TorusGeometry(0.345, 0.018, 6, 36),
    creamLight,
    dialPivot,
    false,
  );
  dialFaceRing.position.z = 0.105;
  setPart(dialFaceRing, 'speed-dial', true);
  const dialMarker = kit.mesh(
    'blender-vertical-speed-dial-marker',
    rounded(0.045, 0.2, 0.035, 0.018, 2),
    cavity,
    dialPivot,
    false,
  );
  dialMarker.position.set(0, 0.13, 0.125);
  setPart(dialMarker, 'dial-marker', true);

  const status = kit.indicator([0, 1.22, 1.39], 0.055);
  status.name = 'blender-small-front-status-indicator';
  status.userData.part = 'status-indicator';

  const rearServicePivot = kit.pivot('blender-rear-service-pivot');
  const rearPanel = kit.mesh(
    'blender-shallow-rear-service-panel',
    rounded(0.92, 0.5, 0.035, 0.08, 3),
    creamLight,
    rearServicePivot,
    false,
  );
  rearPanel.position.set(0, 1.34, -0.92);
  setPart(rearPanel, 'rear-service-panel', true);
  const ventGeometry = rounded(0.62, 0.045, 0.025, 0.02, 2);
  for (let index = 0; index < 5; index += 1) {
    const vent = kit.mesh(
      `blender-rear-horizontal-vent-slot-${index + 1}`,
      ventGeometry,
      cavity,
      rearServicePivot,
      false,
    );
    vent.position.set(0, 1.19 + index * 0.075, -0.945);
    setPart(vent, 'rear-vent-array', true);
  }

  const inletFrame = kit.mesh(
    'blender-rear-power-inlet-frame',
    rounded(0.48, 0.28, 0.075, 0.065, 3),
    pinkShadow,
    rearServicePivot,
  );
  inletFrame.position.set(0, 0.42, -1.055);
  setPart(inletFrame, 'rear-power-inlet');
  const inletCore = kit.mesh(
    'blender-rear-power-inlet-dark-core',
    rounded(0.34, 0.18, 0.04, 0.045, 3),
    cavity,
    rearServicePivot,
    false,
  );
  inletCore.position.set(0, 0.42, -1.1);
  setPart(inletCore, 'rear-power-inlet', true);
  for (const [x, label] of [[-0.08, 'left'], [0.08, 'right']] as const) {
    const pin = kit.mesh(
      `blender-rear-power-inlet-pin-${label}`,
      new THREE.SphereGeometry(0.035, 9, 6),
      rubber,
      rearServicePivot,
      false,
    );
    pin.position.set(x, 0.42, -1.13);
    setPart(pin, 'rear-power-inlet', true);
  }
  kit.socket('blender-power-cable-socket', rearServicePivot, [0, 0.42, -1.16]);

  const footGeometry = rounded(0.48, 0.12, 0.38, 0.055, 3);
  for (const [x, z, label] of [
    [-0.96, 0.72, 'front-left'],
    [0.96, 0.72, 'front-right'],
    [-0.96, -0.72, 'rear-left'],
    [0.96, -0.72, 'rear-right'],
  ] as const) {
    const foot = kit.mesh(`blender-rubber-foot-${label}`, footGeometry, rubber, kit.root, false);
    foot.position.set(x, 0.1, z);
    setPart(foot, 'foot-array');
  }

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'two-band tapered motor base with broad rounded lower footprint and narrower cream shoulder',
        'true-walled upward-flaring transparent jar with independent removable pivot and four named sockets',
        'eight transparent molded jar ribs, rolled rim, translucent pink upper collar and inferred dark coupling ring',
        'large cream curve-swept handle with visible negative space and embedded upper/lower roots',
        'broad shallow Sakura-pink domed lid with projecting flange and low mint knob',
        'four individually named canted steel blades on a dedicated bearing pivot and stepped hub',
        'layered front mint speed dial with vertical marker, independent status indicator and four separate feet',
        'rear service panel with five horizontal vent slots, framed two-pin inlet and cable socket',
        'five recognizable whole-fruit families with secondary silhouette details plus twelve deterministic cut-fruit chunks constrained inside the jar',
        'powered-use hierarchy with rising Sakura-pink smoothie volume, concave surface, visible spiral flow and a dedicated cup-mouth splash socket',
      ],
      inferred: [
        'jar wall thickness and handle-root reinforcement are inferred from the exterior silhouettes',
        'lid seal, jar lock, blade coupling depth, motor and wiring are hidden; only a shallow coupling ring is inferred',
        'the supplied turn-sheet handle projections are not perfectly orthographically consistent; its right-side loop orientation prioritizes the front and side identity views',
        'smoothie volume, ingredient pieces and spiral flow are powered-use cues and are not claimed as geometry present in the empty reference jar',
      ],
    },
  );

  build.root.userData.referenceDimensions = {
    overallWidthIncludingHandle: 3.7,
    overallHeight: 4.95,
    overallDepth: 2.72,
    baseWidth: 3.25,
    baseDepth: 3.05,
    baseHeight: 1.75,
    jarTopDiameter: 2.56,
    jarBottomDiameter: 1.88,
    jarHeight: 2.56,
  };
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.sculptRuntime.colliders = [
    { id: 'blender-motor-base', type: 'box', node: 'blender-motor-base-pivot' },
    { id: 'blender-jar', type: 'cylinder', node: 'blender-removable-jar-pivot' },
    { id: 'blender-handle', type: 'capsule', node: 'blender-jar-handle-attachment-pivot' },
    { id: 'blender-blade-trigger', type: 'cylinder', node: 'blender-four-blade-rotation-pivot', trigger: true },
    { id: 'blender-liquid-effect-trigger', type: 'cylinder', node: 'blender-powered-liquid-vortex-pivot', trigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'motor-base', nodes: ['blender-motor-base-pivot'] },
    { id: 'vessel-assembly', nodes: ['blender-jar-seat-pivot', 'blender-removable-jar-pivot', 'blender-jar-handle-attachment-pivot'] },
    { id: 'blade-and-coupling', nodes: ['blender-four-blade-rotation-pivot'] },
    { id: 'lid-assembly', nodes: ['blender-removable-lid-pivot'] },
    { id: 'control-system', nodes: ['blender-front-speed-dial-pivot'] },
    { id: 'rear-service', nodes: ['blender-rear-service-pivot'] },
    { id: 'powered-effects', nodes: ['blender-powered-liquid-vortex-pivot', 'blender-whole-fruit-pivot', 'blender-cut-fruit-chunk-pivot'] },
  ];
  return build;
}
