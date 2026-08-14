import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月2日 19_55_18 (5).png';

function accentShift(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function latheShell(points: readonly (readonly [number, number])[], segments = 28): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([radius, y]) => new THREE.Vector2(radius, y)),
    segments,
  );
}

function dropletGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.15);
  shape.bezierCurveTo(0.085, 0.035, 0.11, -0.025, 0.11, -0.09);
  shape.bezierCurveTo(0.11, -0.19, 0.06, -0.25, 0, -0.25);
  shape.bezierCurveTo(-0.06, -0.25, -0.11, -0.19, -0.11, -0.09);
  shape.bezierCurveTo(-0.11, -0.025, -0.085, 0.035, 0, 0.15);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.018,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.009,
    bevelThickness: 0.008,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -0.009);
  return geometry;
}

/** A closed, irregular low-poly volume. It deliberately has a real cross-section
 * instead of a card or sprite so the plume/cloud stays readable while orbiting. */
function irregularVolume(radius: number, seed: number): THREE.IcosahedronGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const deformation = 1 + Math.sin(
      x * (8.3 + seed * 0.27)
      + y * (11.1 + seed * 0.19)
      + z * (9.7 + seed * 0.31)
      + seed * 1.41,
    ) * 0.14;
    position.setXYZ(index, x * deformation, y * deformation, z * deformation);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** A rotationally symmetric water drop with a pointed crown and rounded belly. */
function volumetricDropGeometry(): THREE.LatheGeometry {
  return new THREE.LatheGeometry([
    [0, 0.24],
    [0.055, 0.18],
    [0.13, 0.08],
    [0.17, -0.08],
    [0.14, -0.23],
    [0.075, -0.32],
    [0, -0.35],
  ].map(([radius, y]) => new THREE.Vector2(radius, y)), 10);
}

function lightningGeometry(): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.04, 0.78, 0.08),
    new THREE.Vector3(0.18, 0.44, 0.02),
    new THREE.Vector3(-0.07, 0.19, 0.12),
    new THREE.Vector3(0.08, -0.1, 0.03),
    new THREE.Vector3(-0.16, -0.42, 0.04),
  ], false, 'catmullrom', 0.1);
  return new THREE.TubeGeometry(curve, 10, 0.06, 5, false);
}

/**
 * Three-view procedural reconstruction of the supplied compact humidifier.
 *
 * Local frame: +Y up, +Z front, floor at Y=0. The water tank, water body,
 * control panel, dial, outlet, service panel and mist system remain separate
 * parts so the gallery can orbit and the activation system can animate them.
 */
export function createHumidifierModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = accentShift(options.accent, 0.19, -0.08);
  const accentMid = accentShift(options.accent, 0.07, -0.05);
  const accentDark = accentShift(options.accent, -0.11, -0.02);

  const shellMaterial = kit.material(0xf3ede2, { tint: 0x756a7e });
  const shellHighlightMaterial = kit.material(0xfbf4e8, { tint: 0x7a6e82 });
  const accentMaterial = kit.material(accentMid, { tint: 0x6c5d74 });
  const accentDarkMaterial = kit.material(accentDark, { tint: 0x5b4f66 });
  const seamMaterial = kit.material(0x777180, { tint: 0x574f60 });
  const rubberMaterial = kit.material(0x5f5b68, { tint: 0x494350 });
  const waterTankMaterial = kit.material(0xe8f2f0, {
    tint: accentMid,
    transparent: true,
    opacity: 0.62,
  });
  waterTankMaterial.depthWrite = false;
  waterTankMaterial.emissive.set(0xd9eeed);
  waterTankMaterial.emissiveIntensity = 0.38;
  const waterMaterial = kit.material(accentLight, {
    tint: 0x677789,
    emissive: accentLight,
    transparent: true,
    opacity: 0.11,
  });
  waterMaterial.depthWrite = false;
  const mistMaterial = kit.material(0xf4fbf8, {
    tint: 0x7b8795,
    emissive: 0xd9fffb,
    transparent: true,
    opacity: 0.48,
  });
  mistMaterial.depthWrite = false;
  mistMaterial.emissiveIntensity = 0.08;
  mistMaterial.userData.humidifierEffectMaterial = 'mist-shell';
  mistMaterial.userData.baseOpacity = 0.48;
  const mistShadeMaterial = kit.material(0xb9d2d2, {
    tint: 0x667484,
    emissive: 0x9ddbd8,
    transparent: true,
    opacity: 0.34,
  });
  mistShadeMaterial.depthWrite = false;
  mistShadeMaterial.emissiveIntensity = 0.035;
  mistShadeMaterial.userData.humidifierEffectMaterial = 'mist-shade';
  mistShadeMaterial.userData.baseOpacity = 0.34;
  const stormMaterial = kit.material(0x536172, { tint: 0x242a36 });
  stormMaterial.userData.humidifierEffectMaterial = 'storm-shell';
  const stormBellyMaterial = kit.material(0x374352, { tint: 0x1d2230 });
  stormBellyMaterial.userData.humidifierEffectMaterial = 'storm-belly';
  const lightningMaterial = kit.material(0xfff09c, {
    tint: 0x9e6e38,
    emissive: 0xffd84d,
    transparent: true,
    opacity: 0,
  });
  lightningMaterial.depthWrite = false;
  lightningMaterial.emissiveIntensity = 0;
  lightningMaterial.userData.humidifierEffectMaterial = 'internal-lightning';
  lightningMaterial.userData.baseOpacity = 0;
  const rainMaterial = kit.material(0x8bdde4, {
    tint: 0x476f8a,
    emissive: 0x64cbd8,
    transparent: true,
    opacity: 0.84,
  });
  rainMaterial.depthWrite = false;
  rainMaterial.emissiveIntensity = 0.12;
  rainMaterial.userData.humidifierEffectMaterial = 'rain-drop';
  rainMaterial.userData.baseOpacity = 0.84;

  // Macro silhouette: stable low cream body, transparent upper reservoir and
  // a separate accent rail. The tapered lathe profiles preserve the broad,
  // rounded shoulder visible in all three supplied views.
  const lowerBody = kit.mesh(
    'humidifier-lower-body-shell',
    latheShell([
      [0, 0.21],
      [0.92, 0.21],
      [1.07, 0.27],
      [1.14, 0.39],
      [1.17, 0.96],
      [1.14, 1.17],
      [1.08, 1.23],
      [0, 1.23],
    ]),
    shellMaterial,
  );
  lowerBody.userData.part = 'lower-body-shell';

  const bottomRail = kit.mesh(
    'humidifier-bottom-accent-rail',
    latheShell([
      [0, 0.13],
      [0.87, 0.13],
      [1.02, 0.17],
      [1.1, 0.24],
      [1.07, 0.34],
      [0, 0.34],
    ]),
    accentMaterial,
  );
  bottomRail.userData.part = 'bottom-accent-rail';

  const reservoir = kit.mesh(
    'humidifier-transparent-water-reservoir',
    latheShell([
      [0, 1.19],
      [1.075, 1.19],
      [1.13, 1.28],
      [1.12, 2.34],
      [1.08, 2.58],
      [0.96, 2.74],
      [0.73, 2.81],
      [0, 2.81],
    ], 32),
    waterTankMaterial,
  );
  reservoir.renderOrder = 2;
  reservoir.userData.part = 'transparent-reservoir-shell';

  const innerWater = kit.mesh(
    'humidifier-inner-water-volume',
    latheShell([
      [0, 1.25],
      [1.0, 1.25],
      [1.04, 1.34],
      [1.02, 2.23],
      [0.96, 2.38],
      [0, 2.38],
    ], 24),
    waterMaterial,
    kit.root,
    false,
  );
  innerWater.renderOrder = 1;
  innerWater.userData.explodeWithParent = true;

  const tankSeam = kit.mesh(
    'humidifier-tank-body-seam',
    new THREE.TorusGeometry(1.092, 0.025, 6, 32),
    seamMaterial,
    kit.root,
    false,
  );
  tankSeam.rotation.x = Math.PI * 0.5;
  tankSeam.position.y = 1.22;
  tankSeam.userData.explodeWithParent = true;

  // Top outlet stack: recessed collar, independently rotatable cap and a true
  // mist socket. The reference does not expose the internal atomizer.
  const outletPivot = kit.pivot('humidifier-outlet-cap-pivot');
  outletPivot.position.set(0, 2.79, 0);
  outletPivot.userData.rotationAxis = [0, 1, 0];
  outletPivot.userData.rotationRange = [-0.45, 0.45];

  kit.mesh(
    'humidifier-outlet-recess-seat',
    new THREE.CylinderGeometry(0.31, 0.36, 0.055, 20),
    shellHighlightMaterial,
    outletPivot,
  );
  const outletCap = kit.mesh(
    'humidifier-outlet-rotary-cap',
    new THREE.CylinderGeometry(0.23, 0.27, 0.16, 20),
    shellHighlightMaterial,
    outletPivot,
  );
  outletCap.position.y = 0.09;
  const outletHole = kit.mesh(
    'humidifier-outlet-opening',
    new THREE.TorusGeometry(0.11, 0.035, 7, 20),
    seamMaterial,
    outletPivot,
    false,
  );
  outletHole.rotation.x = Math.PI * 0.5;
  outletHole.position.set(0, 0.18, 0.035);
  const mistSocket = kit.socket('humidifier-mist-outlet-socket', outletPivot, [0, 0.2, 0.035]);

  // Front control hierarchy: softly inset panel, circular rotary control,
  // engraved drop badge and restrained indicator lamp.
  const controlPanel = kit.mesh(
    'humidifier-front-control-panel',
    new RoundedBoxGeometry(0.58, 0.63, 0.03, 3, 0.14),
    shellMaterial,
    kit.root,
    false,
  );
  controlPanel.position.set(0, 0.73, 1.165);
  controlPanel.userData.part = 'front-control-panel';

  const dialPivot = kit.pivot('humidifier-control-dial-pivot');
  dialPivot.position.set(0, 0.62, 1.225);
  dialPivot.userData.rotationAxis = [0, 0, 1];
  dialPivot.userData.rotationRange = [-0.6, 0.6];
  kit.socket('humidifier-control-dial-socket', dialPivot, [0, 0, 0]);
  const dialOuter = kit.mesh(
    'humidifier-control-dial-outer-ring',
    new THREE.CylinderGeometry(0.25, 0.25, 0.065, 22),
    accentDarkMaterial,
    dialPivot,
  );
  dialOuter.rotation.x = Math.PI * 0.5;
  const dial = kit.mesh(
    'humidifier-control-dial',
    new THREE.CylinderGeometry(0.205, 0.215, 0.095, 22),
    accentMaterial,
    dialPivot,
  );
  dial.rotation.x = Math.PI * 0.5;
  dial.position.z = 0.055;
  const dialIndex = kit.mesh(
    'humidifier-control-dial-index',
    new RoundedBoxGeometry(0.018, 0.105, 0.018, 1, 0.007),
    accentDarkMaterial,
    dialPivot,
    false,
  );
  dialIndex.position.set(0, 0.055, 0.115);

  const dropBadge = kit.mesh(
    'humidifier-water-drop-badge',
    dropletGeometry(),
    accentDarkMaterial,
    kit.root,
    false,
  );
  dropBadge.position.set(0, 1.05, 1.235);
  dropBadge.scale.setScalar(0.38);
  kit.indicator([0, 0.93, 1.245], 0.032);

  // Rear gallery details are visible only in orbit. The image establishes the
  // vent bank and low rear cover; its internal ducting is therefore inferred.
  const rearPanel = kit.mesh(
    'humidifier-rear-service-panel',
    new RoundedBoxGeometry(0.68, 0.35, 0.055, 3, 0.08),
    shellHighlightMaterial,
  );
  rearPanel.position.set(0, 0.55, -1.11);
  for (let index = 0; index < 8; index += 1) {
    const vent = kit.mesh(
      `humidifier-rear-vent-${index + 1}`,
      new RoundedBoxGeometry(0.035, 0.18, 0.025, 1, 0.012),
      seamMaterial,
      kit.root,
      false,
    );
    vent.position.set(-0.245 + index * 0.07, 0.6, -1.147);
    vent.userData.explodeWithParent = true;
  }
  const rearCover = kit.mesh(
    'humidifier-rear-drain-cover',
    new RoundedBoxGeometry(0.36, 0.26, 0.05, 3, 0.07),
    accentMaterial,
  );
  rearCover.position.set(0, 0.29, -1.075);
  kit.socket('humidifier-rear-service-socket', rearCover, [0, 0, -0.06]);

  for (const [index, angle] of [0.42, Math.PI - 0.42, Math.PI + 0.42, -0.42].entries()) {
    const foot = kit.mesh(
      `humidifier-foot-${index + 1}`,
      new THREE.CylinderGeometry(0.11, 0.13, 0.12, 12),
      rubberMaterial,
      kit.root,
      false,
    );
    foot.position.set(Math.cos(angle) * 0.72, 0.06, Math.sin(angle) * 0.72);
  }

  // Water glints stay inside the reservoir. The weather rig below is attached
  // to the real outlet socket and reuses a small material palette.
  const waterGlints: THREE.Mesh[] = [];
  for (let index = 0; index < 3; index += 1) {
    const glint = kit.mesh(
      `humidifier-water-glint-${index + 1}`,
      new THREE.TorusGeometry(0.64 + index * 0.08, 0.012, 5, 24),
      waterMaterial,
      kit.root,
      false,
    );
    glint.rotation.x = Math.PI * 0.5;
    glint.position.y = 1.66 + index * 0.25;
    waterGlints.push(glint);
  }

  // Model-owned weather rig. These are closed, lit volumes rather than pooled
  // spheres/cards. The dedicated HumidifierPerformance timeline reveals and
  // moves them; their authored rest state remains invisible and compact so the
  // gallery frames the appliance body before the storm grows above it.
  const mistRig = kit.pivot('humidifier-volumetric-mist-rig', mistSocket);
  mistRig.userData.performanceEffect = true;
  mistRig.userData.effectGeometry = 'overlapping irregular IcosahedronGeometry lobes';
  for (let index = 0; index < 18; index += 1) {
    const pivot = kit.pivot(`humidifier-mist-volume-pivot-${index + 1}`, mistRig);
    pivot.visible = false;
    pivot.userData.performanceEffect = true;
    pivot.userData.phaseOffset = index / 18;
    pivot.userData.lane = (index % 7) - 3;
    pivot.userData.depthLane = ((index * 5) % 9) - 4;
    pivot.userData.baseScale = 0.78 + (index % 4) * 0.08;
    for (let lobeIndex = 0; lobeIndex < 4; lobeIndex += 1) {
      const lobe = kit.mesh(
        `humidifier-mist-volume-${index + 1}-lobe-${lobeIndex + 1}`,
        irregularVolume(0.17 + lobeIndex * 0.018, index * 5 + lobeIndex + 1),
        lobeIndex === 3 ? mistShadeMaterial : mistMaterial,
        pivot,
        false,
      );
      lobe.position.set(
        ((lobeIndex * 7 + index) % 5 - 2) * 0.055,
        lobeIndex * 0.105,
        ((lobeIndex * 3 + index) % 5 - 2) * 0.045,
      );
      lobe.scale.set(
        1.05 + (lobeIndex % 2) * 0.18,
        1.28 + (lobeIndex % 3) * 0.16,
        0.96 + ((lobeIndex + index) % 3) * 0.12,
      );
      lobe.userData.explodeWithParent = true;
      lobe.userData.volumeEffect = 'humidifier-condensed-mist';
    }
  }

  const cloudRig = kit.pivot('humidifier-volumetric-weather-cloud-rig');
  cloudRig.visible = false;
  cloudRig.scale.setScalar(0.001);
  cloudRig.userData.performanceEffect = true;
  cloudRig.userData.targetWorldSize = [4.1, 2.5, 2.05];
  cloudRig.userData.bodyVisualAreaRatio = 1.5;
  const cloudLobes = [
    [-1.42, 0.02, 0.02, 0.78, 1.02, 0.95, 1.04],
    [-0.78, 0.38, -0.1, 0.74, 1.08, 1.04, 1.08],
    [-0.08, 0.5, 0.08, 0.79, 1.12, 1.02, 1.1],
    [0.7, 0.36, -0.08, 0.73, 1.09, 0.98, 1.12],
    [1.43, 0.02, 0.04, 0.76, 1.01, 0.92, 1.06],
    [-1.05, -0.46, 0.04, 0.7, 1.04, 0.93, 1.12],
    [-0.35, -0.53, -0.1, 0.75, 1.12, 0.92, 1.08],
    [0.4, -0.5, 0.06, 0.73, 1.1, 0.9, 1.15],
    [1.08, -0.43, -0.05, 0.68, 1.03, 0.9, 1.1],
  ] as const;
  cloudLobes.forEach(([x, y, z, radius, sx, sy, sz], index) => {
    const lobe = kit.mesh(
      `humidifier-volumetric-weather-cloud-lobe-${index + 1}`,
      irregularVolume(radius, 71 + index * 3),
      index >= 5 ? stormBellyMaterial : stormMaterial,
      cloudRig,
      false,
    );
    lobe.position.set(x, y, z);
    lobe.scale.set(sx, sy, sz);
    lobe.userData.basePosition = [x, y, z];
    lobe.userData.explodeWithParent = true;
    lobe.userData.volumeEffect = 'large-low-poly-storm-cloud';
  });

  const internalLight = kit.pivot('humidifier-cloud-internal-light-pivot', cloudRig);
  internalLight.visible = false;
  internalLight.userData.performanceEffect = true;
  for (let index = 0; index < 3; index += 1) {
    const glow = kit.mesh(
      `humidifier-cloud-internal-light-${index + 1}`,
      irregularVolume(0.34 + index * 0.06, 103 + index),
      lightningMaterial,
      internalLight,
      false,
    );
    glow.position.set((index - 1) * 0.34, -0.08 - index * 0.07, 0.18 - index * 0.12);
    glow.scale.set(1.15, 0.72, 0.88);
    glow.userData.explodeWithParent = true;
    glow.userData.volumeEffect = 'cloud-internal-flash-body';
  }
  const mainBolt = kit.mesh(
    'humidifier-cloud-volumetric-lightning-bolt',
    lightningGeometry(),
    lightningMaterial,
    cloudRig,
    false,
  );
  mainBolt.visible = false;
  mainBolt.position.set(0.17, -0.22, 0.74);
  mainBolt.scale.set(1.05, 1.18, 1.05);
  mainBolt.userData.performanceEffect = true;
  mainBolt.userData.volumeEffect = 'closed-tube-lightning-bolt';

  const rainRig = kit.pivot('humidifier-volumetric-rain-rig');
  rainRig.visible = false;
  rainRig.userData.performanceEffect = true;
  rainRig.userData.effectGeometry = 'LatheGeometry pointed water drops';
  const rainDropGeometry = volumetricDropGeometry();
  for (let index = 0; index < 36; index += 1) {
    const pivot = kit.pivot(`humidifier-rain-drop-pivot-${index + 1}`, rainRig);
    pivot.visible = false;
    pivot.userData.performanceEffect = true;
    pivot.userData.phaseOffset = ((index * 13) % 37) / 37;
    pivot.userData.lane = ((index * 11) % 37) / 36 - 0.5;
    pivot.userData.depthLane = ((index * 17) % 29) / 28 - 0.5;
    pivot.userData.baseScale = 0.62 + (index % 6) * 0.07;
    const drop = kit.mesh(
      `humidifier-rain-drop-${index + 1}`,
      rainDropGeometry,
      rainMaterial,
      pivot,
      false,
    );
    drop.scale.set(0.62, 1, 0.62);
    drop.userData.explodeWithParent = true;
    drop.userData.volumeEffect = 'lathed-volumetric-raindrop';
  }

  kit.root.userData.humidifierEffectContract = {
    modelOwner: 'humidifier-model-rig',
    timelineOwner: 'AppliancePerformanceSystem',
    modelSpaceEffectRoot: kit.root.name,
    mistVolumes: 18,
    mistLobesPerVolume: 4,
    cloudLobes: cloudLobes.length,
    cloudWorldSize: [4.1, 2.5, 2.05],
    bodyVisualAreaRatio: 1.5,
    internalLightBodies: 3,
    lightningBolts: 1,
    volumetricRainDrops: 36,
    usesPlaneGeometry: false,
    usesSprite: false,
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  };
  // The powered storm grows above the idle silhouette. Gallery and review
  // cameras share this focus offset so the cloud remains inside their canvas.
  kit.root.userData.previewFocusOffsetY = 1.2;
  kit.root.userData.previewFramingScale = 1.42;

  return kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'broad rounded tapered silhouette with a stable cream lower body and separated accent foot rail',
        'large translucent upper water reservoir, internal water volume and pronounced tank-body seam',
        'independent recessed top outlet seat, rotary nozzle cap, opening and mist socket',
        'front inset control panel with layered round dial, index mark, water-drop badge and status lamp',
        'low feet plus rear service panel, repeated vertical ventilation slots and removable low cover',
        'model-owned weather rig with eighteen four-lobe mist volumes anchored to the real outlet',
        'large nine-lobe storm cloud sized to about 1.5 times the appliance visual area',
        'three internal flash volumes, one closed tubular lightning bolt and thirty-six lathed water drops',
      ],
      inferred: [
        'the transparent tank wall thickness and internal water volume are inferred from the three exterior views',
        'rear service cover, drainage route and ventilation duct depth are inferred because the reference hides the interior',
        'atomizer, fan, wick, electrical wiring and screw bosses are intentionally not fabricated inside the closed shell',
        'underside fasteners and exact foot attachment sockets are not visible and use a symmetric four-foot layout',
      ],
    },
  );
}
