import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  orientCylinderBetween,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'D:/下载文件/ChatGPT Image 2026年8月3日 16_17_49 (8).png';
const ACTIVE_DURATION = 5.2;
const ORDINARY_BUBBLE_COUNT = 48;
const BURST_FRAGMENT_COUNT = 8;

function accentShift(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function roundedPlate(width: number, height: number, depth: number, radius: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, 4, radius);
}

function addRadialBar(
  kit: ApplianceModelKit,
  name: string,
  angle: number,
  innerRadius: number,
  outerRadius: number,
  z: number,
  radius: number,
  material: THREE.Material,
  parent: THREE.Object3D,
): THREE.Mesh {
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
  const bar = kit.mesh(
    name,
    new THREE.CylinderGeometry(radius, radius, 1, 8),
    material,
    parent,
    false,
  );
  orientCylinderBetween(bar, start, end);
  return bar;
}

function fanBladeGeometry(): THREE.ExtrudeGeometry {
  const blade = new THREE.Shape();
  blade.moveTo(0.07, 0.015);
  blade.bezierCurveTo(0.16, 0.025, 0.31, 0.09, 0.39, 0.2);
  blade.bezierCurveTo(0.43, 0.28, 0.4, 0.36, 0.31, 0.37);
  blade.bezierCurveTo(0.21, 0.34, 0.12, 0.19, 0.07, 0.015);
  const geometry = new THREE.ExtrudeGeometry(blade, {
    depth: 0.035,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    curveSegments: 7,
  });
  geometry.translate(0, 0, -0.0175);
  geometry.computeVertexNormals();
  return geometry;
}

type BubbleVisualResources = {
  sphereGeometry: THREE.SphereGeometry;
  rainbowArcGeometry: THREE.TorusGeometry;
  highlightGeometry: THREE.SphereGeometry;
  filmMaterial: THREE.MeshPhysicalMaterial;
  rimMaterial: THREE.MeshPhysicalMaterial;
  rainbowMaterials: readonly THREE.MeshPhysicalMaterial[];
  highlightMaterial: THREE.MeshBasicMaterial;
};

function performanceMesh(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  effectKind: string,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.userData.performanceEffect = true;
  mesh.userData.effectKind = effectKind;
  parent.add(mesh);
  return mesh;
}

function createBubbleVisual(
  name: string,
  parent: THREE.Object3D,
  resources: BubbleVisualResources,
  rainbowIndex: number,
): THREE.Group {
  const bubble = new THREE.Group();
  bubble.name = name;
  bubble.visible = false;
  bubble.userData.performanceEffect = true;
  bubble.userData.effectKind = 'iridescent-bubble';
  parent.add(bubble);

  const film = performanceMesh(
    `${name}-film-shell`,
    resources.sphereGeometry,
    resources.filmMaterial,
    bubble,
    'semi-transparent-spherical-film',
  );
  film.renderOrder = 21;

  const rim = performanceMesh(
    `${name}-rainbow-rim`,
    resources.sphereGeometry,
    resources.rimMaterial,
    bubble,
    'iridescent-spherical-rim',
  );
  rim.scale.setScalar(1.035);
  rim.renderOrder = 20;

  const warmArc = performanceMesh(
    `${name}-rainbow-arc-warm`,
    resources.rainbowArcGeometry,
    resources.rainbowMaterials[rainbowIndex % resources.rainbowMaterials.length],
    bubble,
    'volumetric-rainbow-film-arc',
  );
  warmArc.rotation.set(0.58 + rainbowIndex * 0.19, -0.42, 0.25 + rainbowIndex * 0.23);
  warmArc.renderOrder = 22;

  const coolArc = performanceMesh(
    `${name}-rainbow-arc-cool`,
    resources.rainbowArcGeometry,
    resources.rainbowMaterials[(rainbowIndex + 2) % resources.rainbowMaterials.length],
    bubble,
    'volumetric-rainbow-film-arc',
  );
  coolArc.rotation.set(-0.36, 0.72 + rainbowIndex * 0.13, Math.PI + 0.38);
  coolArc.scale.setScalar(0.94);
  coolArc.renderOrder = 22;

  const highlight = performanceMesh(
    `${name}-soft-highlight`,
    resources.highlightGeometry,
    resources.highlightMaterial,
    bubble,
    'volumetric-bubble-highlight',
  );
  highlight.position.set(-0.43, 0.48, 0.75);
  highlight.scale.set(0.58, 1.42, 0.38);
  highlight.rotation.z = 0.48;
  highlight.renderOrder = 23;
  return bubble;
}

function addBubblePerformanceRig(
  kit: ApplianceModelKit,
  emitterPosition: readonly [number, number, number],
): void {
  const performanceRig = kit.pivot('bubble-machine-performance-rig');
  performanceRig.userData.effectOwner = 'BubbleMachinePerformance';
  performanceRig.userData.sharedSpectacleEffects = 'disabled';
  performanceRig.userData.forbiddenPrimitives = ['PlaneGeometry', 'Sprite', 'Line'];

  const sphereGeometry = new THREE.SphereGeometry(1, 20, 14);
  const rainbowArcGeometry = new THREE.TorusGeometry(0.78, 0.052, 7, 28, Math.PI * 1.22);
  const highlightGeometry = new THREE.SphereGeometry(0.17, 10, 8);
  const filmMaterial = new THREE.MeshPhysicalMaterial({
    name: 'bubble-machine-iridescent-film-material',
    color: 0xcffaff,
    emissive: 0x739fb7,
    emissiveIntensity: 0.18,
    roughness: 0.06,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    transmission: 0.58,
    thickness: 0.035,
    ior: 1.33,
    iridescence: 1,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 460],
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const rimMaterial = new THREE.MeshPhysicalMaterial({
    name: 'bubble-machine-rainbow-rim-material',
    color: 0xffb9dc,
    emissive: 0xa94382,
    emissiveIntensity: 0.28,
    roughness: 0.08,
    metalness: 0,
    clearcoat: 1,
    transmission: 0.22,
    ior: 1.33,
    iridescence: 1,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [180, 520],
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const rainbowMaterials = [0xff8fc9, 0xffd474, 0x7ef5dd, 0x8cc8ff, 0xd49bff].map((color, index) => (
    new THREE.MeshPhysicalMaterial({
      name: `bubble-machine-rainbow-band-material-${index + 1}`,
      color,
      emissive: color,
      emissiveIntensity: 0.34,
      roughness: 0.1,
      metalness: 0,
      clearcoat: 1,
      transmission: 0.16,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    })
  ));
  const highlightMaterial = new THREE.MeshBasicMaterial({
    name: 'bubble-machine-soft-highlight-material',
    color: 0xffffff,
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
    toneMapped: false,
  });
  const resources: BubbleVisualResources = {
    sphereGeometry,
    rainbowArcGeometry,
    highlightGeometry,
    filmMaterial,
    rimMaterial,
    rainbowMaterials,
    highlightMaterial,
  };
  [filmMaterial, rimMaterial, ...rainbowMaterials, highlightMaterial].forEach((material) => {
    kit.materials.add(material);
  });

  const baseSizes = [0.12, 0.17, 0.24, 0.32] as const;
  for (let index = 0; index < ORDINARY_BUBBLE_COUNT; index += 1) {
    const bubble = createBubbleVisual(
      `bubble-machine-performance-bubble-${index + 1}`,
      performanceRig,
      resources,
      index,
    );
    const laneSide = index % 2 === 0 ? -1 : 1;
    const lateralTravel = laneSide * (9.5 + index % 5 * 0.72);
    const forwardTravel = 6.4 + index % 6 * 0.62;
    const riseTravel = 5.5 + index % 7 * 0.48;
    bubble.position.set(...emitterPosition);
    Object.assign(bubble.userData, {
      bubbleRole: 'ordinary',
      sizeClass: ['small', 'medium', 'large', 'hero-large'][index % baseSizes.length],
      baseRadius: baseSizes[index % baseSizes.length],
      launchTime: 0.22 + index * 0.05,
      flightDuration: 3.45 + index % 6 * 0.2,
      lateralTravel,
      riseTravel,
      forwardTravel,
      configuredTravelDistance: Math.hypot(lateralTravel, riseTravel, forwardTravel),
      driftAmplitude: 0.34 + index % 5 * 0.11,
      driftRate: 0.86 + index % 7 * 0.13,
      driftPhase: index * 1.61803398875,
    });
  }

  const giantBubble = createBubbleVisual(
    'bubble-machine-giant-bubble',
    performanceRig,
    resources,
    3,
  );
  giantBubble.position.set(...emitterPosition);
  Object.assign(giantBubble.userData, {
    bubbleRole: 'giant-climax',
    baseRadius: 0.94,
    launchTime: 3.18,
    burstTime: 4.62,
    riseTravel: 6.2,
    lateralTravel: 0.95,
    forwardTravel: 2.15,
  });

  const burstRig = kit.pivot('bubble-machine-giant-bubble-burst-rig', performanceRig);
  burstRig.visible = false;
  burstRig.position.set(...emitterPosition);
  burstRig.userData.performanceEffect = true;
  burstRig.userData.effectKind = 'giant-bubble-volumetric-burst';
  burstRig.userData.fragmentCount = BURST_FRAGMENT_COUNT;
  const burstLightGeometry = new THREE.IcosahedronGeometry(0.11, 1);
  const burstLightMaterial = new THREE.MeshBasicMaterial({
    name: 'bubble-machine-burst-light-material',
    color: 0xfff1ad,
    transparent: true,
    opacity: 0.92,
    toneMapped: false,
  });
  kit.materials.add(burstLightMaterial);
  for (let index = 0; index < BURST_FRAGMENT_COUNT; index += 1) {
    const isMiniBubble = index < BURST_FRAGMENT_COUNT / 2;
    const fragment = performanceMesh(
      isMiniBubble
        ? `bubble-machine-burst-mini-bubble-${index + 1}`
        : `bubble-machine-burst-light-point-${index + 1 - BURST_FRAGMENT_COUNT / 2}`,
      isMiniBubble ? sphereGeometry : burstLightGeometry,
      isMiniBubble ? filmMaterial : burstLightMaterial,
      burstRig,
      isMiniBubble ? 'volumetric-mini-bubble' : 'volumetric-light-point',
    );
    fragment.visible = false;
    fragment.userData.fragmentIndex = index;
    fragment.userData.fragmentDirection = new THREE.Vector3(
      Math.cos(index * Math.PI * 0.75) * (0.78 + index % 2 * 0.16),
      0.28 + (index % 3) * 0.38,
      Math.sin(index * Math.PI * 0.75) * (0.7 + index % 3 * 0.12),
    ).normalize().toArray();
  }

  kit.root.userData.bubbleMachinePerformanceRig = {
    ordinaryBubbleCount: ORDINARY_BUBBLE_COUNT,
    sizeClasses: ['small', 'medium', 'large', 'hero-large'],
    materialLanguage: 'layered MeshPhysicalMaterial film, spherical rim, volumetric rainbow arcs and soft sphere glint',
    minimumConfiguredTravelDistance: Math.min(...performanceRig.children
      .filter((child) => child.userData.bubbleRole === 'ordinary')
      .map((child) => Number(child.userData.configuredTravelDistance))),
    giantBubbleRadius: giantBubble.userData.baseRadius,
    burstFragmentCount: BURST_FRAGMENT_COUNT,
    burstFeedback: 'four volumetric mini bubbles and four icosahedral light points',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
    sharedSpectacleEffects: 'disabled',
  };
}

/**
 * Three-view procedural reconstruction of the supplied SAKURA bubble machine.
 *
 * Local frame: +Y up, +Z front, floor at Y=0. Every compound assembly is a
 * separate named node. Hidden pump, gearing, tubing and wiring are deliberately
 * omitted; only their runtime sockets are inferred from the appliance's use.
 */
export function createBubbleMachineModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = accentShift(options.accent, 0.14, -0.05);
  const accentMid = accentShift(options.accent, 0.04, -0.03);
  const accentDark = accentShift(options.accent, -0.12, 0.01);

  const shellMaterial = kit.material(0xf8ead8, { tint: 0x756a7f });
  const shellHighlightMaterial = kit.material(0xfff4e5, { tint: 0x807386 });
  const accentMaterial = kit.material(accentMid, { tint: 0x695c73 });
  const accentLightMaterial = kit.material(accentLight, { tint: 0x75677b });
  const accentDarkMaterial = kit.material(accentDark, { tint: 0x5d5066 });
  const cavityMaterial = kit.material(0x55453f, { tint: 0x433944 });
  const hardwareMaterial = kit.material(0x6f675f, { tint: 0x4d4653 });
  const rubberMaterial = kit.material(0x665f68, { tint: 0x494350 });
  const windowMaterial = kit.material(0x725a54, {
    tint: accentDark,
    transparent: true,
    opacity: 0.34,
  });
  windowMaterial.depthWrite = false;
  const reservoirMaterial = kit.material(accentLight, {
    tint: 0x8b6d82,
    transparent: true,
    opacity: 0.58,
  });
  reservoirMaterial.depthWrite = false;
  reservoirMaterial.emissive.set(accentLight);
  reservoirMaterial.emissiveIntensity = 0.08;
  const liquidFillMaterial = kit.material(accentLight, {
    tint: 0x7c7e98,
    emissive: accentLight,
    transparent: true,
    opacity: 0.24,
  });
  liquidFillMaterial.depthWrite = false;

  const housingPivot = kit.pivot('bubble-machine-housing-pivot');
  housingPivot.position.y = 1.24;
  const housingShell = kit.mesh(
    'bubble-machine-housing-shell',
    roundedPlate(2.16, 2.24, 1.44, 0.34),
    shellMaterial,
    housingPivot,
  );
  housingShell.userData.part = 'housing-shell';

  const shoulderHighlight = kit.mesh(
    'bubble-machine-upper-shoulder-highlight',
    roundedPlate(1.86, 0.42, 1.455, 0.18),
    shellHighlightMaterial,
    housingPivot,
    false,
  );
  shoulderHighlight.position.y = 0.72;
  shoulderHighlight.scale.z = 0.997;
  shoulderHighlight.userData.explodeWithParent = true;

  const lowerPanelRail = kit.mesh(
    'bubble-machine-lower-panel-seam',
    roundedPlate(2.12, 0.045, 1.46, 0.018),
    accentDarkMaterial,
    housingPivot,
    false,
  );
  lowerPanelRail.position.y = -0.73;
  lowerPanelRail.userData.explodeWithParent = true;

  const footGeometry = roundedPlate(0.36, 0.22, 0.42, 0.075);
  const footPositions: readonly (readonly [number, number, number, number])[] = [
    [-0.79, 0.12, 0.48, 0.08],
    [0.79, 0.12, 0.48, -0.08],
    [-0.79, 0.12, -0.48, -0.08],
    [0.79, 0.12, -0.48, 0.08],
  ];
  footPositions.forEach(([x, y, z, tilt], index) => {
    const footPivot = kit.pivot(`bubble-machine-foot-pivot-${index + 1}`);
    footPivot.position.set(x, y, z);
    footPivot.rotation.z = tilt;
    const foot = kit.mesh(
      `bubble-machine-foot-${index + 1}`,
      footGeometry,
      accentMaterial,
      footPivot,
      false,
    );
    foot.userData.part = `foot-${index + 1}`;
    const pad = kit.mesh(
      `bubble-machine-foot-pad-${index + 1}`,
      roundedPlate(0.27, 0.035, 0.33, 0.015),
      rubberMaterial,
      footPivot,
      false,
    );
    pad.position.y = -0.115;
    pad.userData.explodeWithParent = true;
  });

  // Front layered window: cavity, eight-ring wheel, transparent cover and rim.
  const frontAssembly = kit.pivot('bubble-machine-front-assembly-pivot', housingPivot);
  frontAssembly.position.set(0, 0.25, 0.725);
  kit.socket('bubble-machine-front-axis-socket', frontAssembly, [0, 0, 0.13]);
  // Stable outlet for detached bubbles. The wheel emitter socket rotates with
  // the ring carrier; detached performance bubbles must not inherit that pivot.
  kit.socket('bubble-machine-output-socket', frontAssembly, [-0.76, 0.04, 0.29]);

  const cavityDisc = kit.mesh(
    'bubble-machine-front-cavity',
    new THREE.CylinderGeometry(0.8, 0.8, 0.07, 36),
    cavityMaterial,
    frontAssembly,
    false,
  );
  cavityDisc.rotation.x = Math.PI * 0.5;
  cavityDisc.position.z = 0.025;

  const wheelPivot = kit.pivot('bubble-machine-bubble-wheel-pivot', frontAssembly);
  wheelPivot.position.z = 0.11;
  wheelPivot.userData.rotationAxis = [0, 0, 1];
  kit.socket('bubble-machine-bubble-emitter-socket', wheelPivot, [-0.7, 0.04, 0.13]);

  const ringGeometry = new THREE.TorusGeometry(0.13, 0.032, 7, 24);
  const ringInnerGeometry = new THREE.TorusGeometry(0.102, 0.012, 6, 20);
  for (let index = 0; index < 8; index += 1) {
    const angle = index * Math.PI / 4 + Math.PI / 2;
    addRadialBar(
      kit,
      `bubble-machine-wheel-spoke-${index + 1}`,
      angle,
      0.14,
      0.47,
      0,
      0.022,
      accentMaterial,
      wheelPivot,
    );
    const ringPivot = kit.pivot(`bubble-machine-bubble-ring-pivot-${index + 1}`, wheelPivot);
    ringPivot.position.set(Math.cos(angle) * 0.52, Math.sin(angle) * 0.52, 0.015);
    const ring = kit.mesh(
      `bubble-machine-bubble-ring-${index + 1}`,
      ringGeometry,
      accentLightMaterial,
      ringPivot,
      false,
    );
    ring.userData.part = `bubble-ring-${index + 1}`;
    const innerRing = kit.mesh(
      `bubble-machine-bubble-ring-inner-${index + 1}`,
      ringInnerGeometry,
      accentDarkMaterial,
      ringPivot,
      false,
    );
    innerRing.position.z = 0.006;
    innerRing.userData.explodeWithParent = true;
  }

  const wheelHub = kit.mesh(
    'bubble-machine-wheel-hub',
    new THREE.CylinderGeometry(0.17, 0.19, 0.12, 20),
    accentMaterial,
    wheelPivot,
  );
  wheelHub.rotation.x = Math.PI * 0.5;
  wheelHub.position.z = 0.035;
  const hubCap = kit.mesh(
    'bubble-machine-wheel-hub-cap',
    new THREE.CylinderGeometry(0.045, 0.045, 0.018, 14),
    accentLightMaterial,
    wheelPivot,
    false,
  );
  hubCap.rotation.x = Math.PI * 0.5;
  hubCap.position.z = 0.105;
  hubCap.userData.explodeWithParent = true;

  const transparentWindow = kit.mesh(
    'bubble-machine-smoked-front-window',
    new THREE.CylinderGeometry(0.82, 0.82, 0.026, 40),
    windowMaterial,
    frontAssembly,
    false,
  );
  transparentWindow.rotation.x = Math.PI * 0.5;
  transparentWindow.position.z = 0.225;
  transparentWindow.renderOrder = 5;

  const outerRim = kit.mesh(
    'bubble-machine-front-window-outer-rim',
    new THREE.TorusGeometry(0.86, 0.075, 10, 40),
    accentMaterial,
    frontAssembly,
  );
  outerRim.position.z = 0.23;
  const innerRim = kit.mesh(
    'bubble-machine-front-window-inner-rim',
    new THREE.TorusGeometry(0.78, 0.026, 7, 36),
    accentLightMaterial,
    frontAssembly,
    false,
  );
  innerRim.position.z = 0.247;
  innerRim.userData.explodeWithParent = true;

  const dripTrayPivot = kit.pivot('bubble-machine-drip-tray-pivot', housingPivot);
  dripTrayPivot.position.set(0, -0.58, 0.84);
  kit.socket('bubble-machine-drip-tray-socket', dripTrayPivot, [0, 0.02, 0]);
  const dripTray = kit.mesh(
    'bubble-machine-drip-tray',
    roundedPlate(0.92, 0.34, 0.22, 0.12),
    accentMaterial,
    dripTrayPivot,
  );
  dripTray.rotation.x = -0.035;
  const dripLip = kit.mesh(
    'bubble-machine-drip-tray-recessed-lip',
    roundedPlate(0.68, 0.055, 0.18, 0.022),
    accentDarkMaterial,
    dripTrayPivot,
    false,
  );
  dripLip.position.set(0, 0.11, 0.055);
  dripLip.userData.explodeWithParent = true;

  // The top control has an independent pivot and a bold index bar so its
  // powered turn is legible from the default three-quarter gallery camera.
  const controlPivot = kit.pivot('bubble-machine-control-knob-pivot', housingPivot);
  controlPivot.position.set(0, 1.2, 0.02);
  controlPivot.userData.rotationAxis = [0, 1, 0];
  kit.socket('bubble-machine-control-socket', controlPivot, [0, 0, 0]);
  const controlKnob = kit.mesh(
    'bubble-machine-control-knob',
    new THREE.CylinderGeometry(0.22, 0.22, 0.13, 20),
    accentMaterial,
    controlPivot,
  );
  controlKnob.userData.part = 'top-control-knob';
  const controlIndex = kit.mesh(
    'bubble-machine-control-index',
    roundedPlate(0.05, 0.025, 0.26, 0.01),
    cavityMaterial,
    controlPivot,
    false,
  );
  controlIndex.position.y = 0.075;
  controlIndex.userData.explodeWithParent = true;
  kit.indicator([0, 2.26, 0.735], 0.028);

  // Side liquid reservoir. The rear hanger and fluid connection socket are
  // reasonable inference because the turn sheet does not expose the valve.
  const reservoirPivot = kit.pivot('bubble-machine-liquid-reservoir-pivot', housingPivot);
  reservoirPivot.position.set(1.08, 0.06, -0.27);
  kit.socket('bubble-machine-reservoir-attachment-socket', housingPivot, [0.94, 0.06, -0.27]);
  kit.socket('bubble-machine-reservoir-fluid-socket', reservoirPivot, [-0.17, -0.48, 0]);
  const reservoirBracket = kit.mesh(
    'bubble-machine-reservoir-bracket-inferred',
    roundedPlate(0.19, 0.78, 0.36, 0.08),
    accentDarkMaterial,
    reservoirPivot,
    false,
  );
  reservoirBracket.position.x = -0.12;
  const reservoir = kit.mesh(
    'bubble-machine-translucent-liquid-reservoir',
    roundedPlate(0.52, 1.22, 0.72, 0.18),
    reservoirMaterial,
    reservoirPivot,
  );
  reservoir.position.x = 0.08;
  reservoir.renderOrder = 3;
  const fillLevel = kit.mesh(
    'bubble-machine-reservoir-fill-level',
    roundedPlate(0.42, 0.42, 0.61, 0.13),
    liquidFillMaterial,
    reservoirPivot,
    false,
  );
  fillLevel.position.set(0.08, -0.32, 0);
  fillLevel.userData.explodeWithParent = true;
  const reservoirCap = kit.mesh(
    'bubble-machine-reservoir-fill-cap',
    new THREE.CylinderGeometry(0.16, 0.18, 0.12, 18),
    accentMaterial,
    reservoirPivot,
  );
  reservoirCap.position.set(0.08, 0.68, 0);

  // Seven vertical side slots are real relief geometry and remain inexpensive.
  const ventGeometry = roundedPlate(0.035, 0.28, 0.075, 0.016);
  for (let index = 0; index < 7; index += 1) {
    const sideVent = kit.mesh(
      `bubble-machine-side-vent-${index + 1}`,
      ventGeometry,
      hardwareMaterial,
      housingPivot,
      false,
    );
    sideVent.rotation.y = Math.PI * 0.5;
    sideVent.position.set(1.085, -0.55, -0.32 + index * 0.105);
    sideVent.userData.explodeWithParent = true;
  }

  // Rear rotor and grille are separate: rotor spins while the concentric
  // protective geometry, spokes and fasteners remain fixed.
  const rearAssembly = kit.pivot('bubble-machine-rear-fan-assembly-pivot', housingPivot);
  rearAssembly.position.set(0, 0.18, -0.73);
  kit.socket('bubble-machine-rear-fan-axis-socket', rearAssembly, [0, 0, -0.06]);
  const rearCavity = kit.mesh(
    'bubble-machine-rear-fan-cavity',
    new THREE.CylinderGeometry(0.59, 0.59, 0.055, 32),
    cavityMaterial,
    rearAssembly,
    false,
  );
  rearCavity.rotation.x = Math.PI * 0.5;
  rearCavity.position.z = -0.015;

  const rearFanPivot = kit.pivot('bubble-machine-rear-fan-rotor-pivot', rearAssembly);
  rearFanPivot.position.z = -0.075;
  rearFanPivot.userData.rotationAxis = [0, 0, 1];
  const sharedBladeGeometry = fanBladeGeometry();
  for (let index = 0; index < 5; index += 1) {
    const bladePivot = kit.pivot(`bubble-machine-rear-fan-blade-pivot-${index + 1}`, rearFanPivot);
    bladePivot.rotation.z = index * Math.PI * 2 / 5;
    const blade = kit.mesh(
      `bubble-machine-rear-fan-blade-${index + 1}`,
      sharedBladeGeometry,
      accentDarkMaterial,
      bladePivot,
      false,
    );
    blade.rotation.z = -0.28;
  }
  const rearHub = kit.mesh(
    'bubble-machine-rear-fan-hub',
    new THREE.CylinderGeometry(0.2, 0.2, 0.1, 20),
    accentMaterial,
    rearFanPivot,
  );
  rearHub.rotation.x = Math.PI * 0.5;

  const grillePivot = kit.pivot('bubble-machine-rear-fan-grille-pivot', rearAssembly);
  grillePivot.position.z = -0.14;
  [0.25, 0.37, 0.49, 0.59].forEach((radius, index) => {
    const ring = kit.mesh(
      `bubble-machine-rear-grille-ring-${index + 1}`,
      new THREE.TorusGeometry(radius, index === 3 ? 0.035 : 0.022, 7, 36),
      accentMaterial,
      grillePivot,
      false,
    );
    ring.userData.explodeWithParent = true;
  });
  for (let index = 0; index < 8; index += 1) {
    addRadialBar(
      kit,
      `bubble-machine-rear-grille-spoke-${index + 1}`,
      index * Math.PI / 4,
      0.2,
      0.58,
      0.002,
      0.017,
      accentMaterial,
      grillePivot,
    ).userData.explodeWithParent = true;
  }
  const rearGrilleCap = kit.mesh(
    'bubble-machine-rear-grille-center-cap',
    new THREE.CylinderGeometry(0.21, 0.21, 0.075, 20),
    accentMaterial,
    grillePivot,
  );
  rearGrilleCap.rotation.x = Math.PI * 0.5;

  const fastenerGeometry = new THREE.SphereGeometry(0.052, 10, 7);
  const fastenerPositions: readonly (readonly [number, number])[] = [
    [-0.73, 0.72], [0.73, 0.72], [-0.73, -0.65], [0.73, -0.65],
  ];
  fastenerPositions.forEach(([x, y], index) => {
    const fastener = kit.mesh(
      `bubble-machine-rear-fastener-${index + 1}`,
      fastenerGeometry,
      hardwareMaterial,
      housingPivot,
      false,
    );
    fastener.scale.z = 0.38;
    fastener.position.set(x, y + 0.08, -0.743);
    fastener.userData.explodeWithParent = true;
  });

  // Inferred rear-lower power inlet: interaction requires a visible socket,
  // but the supplied turn sheet does not establish an exact connector type.
  const powerInlet = kit.mesh(
    'bubble-machine-power-inlet-inferred',
    roundedPlate(0.27, 0.2, 0.055, 0.045),
    accentDarkMaterial,
    housingPivot,
  );
  powerInlet.position.set(0.66, -0.72, -0.738);
  const powerCavity = kit.mesh(
    'bubble-machine-power-inlet-cavity',
    roundedPlate(0.17, 0.105, 0.02, 0.026),
    cavityMaterial,
    housingPivot,
    false,
  );
  powerCavity.position.set(0.66, -0.72, -0.771);
  kit.socket('bubble-machine-power-connection-socket', housingPivot, [0.66, -0.72, -0.79]);

  // Root-local outlet = housing Y + front assembly transform + stable socket.
  // The performance controller reads the named socket at runtime, while this
  // rest coordinate prevents an inactive frame from briefly flashing at 0,0,0.
  addBubblePerformanceRig(kit, [-0.76, 1.53, 1.015]);

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'rounded cream housing with broad shoulder radius, lower panel seam and four separate Sakura-pink feet',
        'layered front cavity, smoked transparent cover, thick double rim and independent drip tray',
        'front rotor with exactly eight named spokes, eight named bubble rings and a concentric hub cap',
        'right-rear translucent liquid reservoir with fill level, cap, inferred overlap bracket and fluid socket',
        'seven side ventilation slots and rear fan rotor behind four concentric grille rings and eight grille spokes',
        'four rear fasteners, inferred rear-lower power inlet and named power connection socket',
        'forty-eight pooled semi-transparent spherical bubbles in four clear size classes, layered iridescent film arcs and soft volumetric highlights',
        'one late giant bubble with a pre-exit volumetric burst of four mini bubbles and four light points',
      ],
      inferred: [
        'internal pump, motor, wheel gearing, liquid tubing and electrical wiring are hidden and intentionally omitted',
        'reservoir hanger/valve depth is represented by a shallow overlap bracket because its rear face is occluded',
        'power inlet position and connector profile are inferred at the rear-lower shell because no port is shown',
        'fan blade camber, internal axle bearings and underside fasteners are inferred from exterior silhouettes',
      ],
    },
  );

  build.root.userData.sculptRuntime.colliders = [
    { id: 'bubble-machine-body', type: 'box', node: 'bubble-machine-housing-shell' },
    { id: 'bubble-machine-reservoir', type: 'box', node: 'bubble-machine-translucent-liquid-reservoir' },
    { id: 'bubble-machine-front-assembly', type: 'cylinder', node: 'bubble-machine-front-assembly-pivot' },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'body-shell', nodes: ['bubble-machine-housing-shell'] },
    { id: 'front-wheel', nodes: ['bubble-machine-front-assembly-pivot'] },
    { id: 'liquid-reservoir', nodes: ['bubble-machine-liquid-reservoir-pivot'] },
    { id: 'rear-fan', nodes: ['bubble-machine-rear-fan-assembly-pivot'] },
  ];
  build.root.userData.activeDuration = ACTIVE_DURATION;
  return build;
}
