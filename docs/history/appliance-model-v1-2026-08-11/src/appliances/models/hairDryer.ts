import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';
import {
  createHairDryerRibbonGeometry,
  HAIR_DRYER_RIBBON_PROFILES,
} from '../performance/HairDryerPerformance';

const REFERENCE_PATH = 'references/intake/hair-dryer/front.png';
const ACTIVE_DURATION = 5.2;

function rounded(width: number, height: number, depth: number, radius: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, 5, radius);
}

type NozzleRing = { x: number; radiusY: number; radiusZ: number };

/** Open variable-section loft: circular at the barrel socket, pinched, then flattened at the outlet. */
function nozzleLoftGeometry(): THREE.BufferGeometry {
  const rings: NozzleRing[] = [
    { x: -1.13, radiusY: 0.79, radiusZ: 0.76 },
    { x: -1.30, radiusY: 0.72, radiusZ: 0.67 },
    { x: -1.55, radiusY: 0.48, radiusZ: 0.45 },
    { x: -1.82, radiusY: 0.43, radiusZ: 0.34 },
    { x: -2.14, radiusY: 0.57, radiusZ: 0.25 },
    { x: -2.37, radiusY: 0.64, radiusZ: 0.23 },
  ];
  const segments = 28;
  const positions: number[] = [];
  const indices: number[] = [];
  rings.forEach((ring) => {
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2;
      positions.push(ring.x, Math.cos(angle) * ring.radiusY, Math.sin(angle) * ring.radiusZ);
    }
  });
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      const a = ring * segments + segment;
      const b = ring * segments + next;
      const c = (ring + 1) * segments + next;
      const d = (ring + 1) * segments + segment;
      indices.push(a, d, b, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addPerforationField(
  kit: ApplianceModelKit,
  parent: THREE.Object3D,
  material: THREE.Material,
): THREE.InstancedMesh {
  const points: Array<[number, number]> = [];
  const step = 0.145;
  for (let row = -5; row <= 5; row += 1) {
    for (let column = -5; column <= 5; column += 1) {
      const y = row * step;
      const z = column * step;
      if (Math.hypot(y, z) <= 0.72) points.push([y, z]);
    }
  }
  const geometry = new THREE.CircleGeometry(0.041, 8);
  const field = new THREE.InstancedMesh(geometry, material, points.length);
  field.name = 'hair-dryer-rear-perforation-field';
  field.castShadow = false;
  field.receiveShadow = true;
  field.userData.applianceId = kit.options.id;
  field.userData.part = 'rear-perforation-field';
  field.renderOrder = 3;
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI * 0.5, 0));
  const scale = new THREE.Vector3(1, 1, 1);
  points.forEach(([y, z], index) => {
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(0.155, y, z), quaternion, scale);
    field.setMatrixAt(index, matrix);
  });
  field.instanceMatrix.needsUpdate = true;
  parent.add(field);
  kit.interactiveMeshes.push(field);
  kit.nodes.set(field.name, field);
  return field;
}

/** Programmatic three-view reconstruction of the SAKURA handheld hair dryer. */
export function createHairDryerModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const pink = accent.clone().offsetHSL(0, -0.04, 0.04).getHex();
  const pinkLight = accent.clone().offsetHSL(0, -0.08, 0.14).getHex();
  const pinkDark = accent.clone().offsetHSL(0, 0.02, -0.1).getHex();

  const cream = kit.material(0xf7ead6, { tint: 0x94828b });
  const creamHighlight = kit.material(0xfff4e4, { tint: 0xa88e92 });
  const pinkMaterial = kit.material(pink, { tint: 0x866678 });
  const pinkHighlight = kit.material(pinkLight, { tint: 0xa77d8c });
  const pinkShadow = kit.material(pinkDark, { tint: 0x695365 });
  const mint = kit.material(0xbfe1da, { tint: 0x789796 });
  const mintScreen = kit.material(0xd7eee7, { tint: 0x7e9e9a, transparent: true, opacity: 0.9 });
  mintScreen.depthWrite = false;
  const cavity = kit.material(0x4c4a4b, { tint: 0x33323a });
  const grille = kit.material(0x756f6d, { tint: 0x45454d });
  const cordMaterial = kit.material(0xeadfce, { tint: 0x807780 });
  const ribbonMaterials = [
    kit.material(0xf19ab3, { tint: 0x7f536d, transparent: true, opacity: 0 }),
    kit.material(0xf8d8a0, { tint: 0x856a5c, transparent: true, opacity: 0 }),
    kit.material(0x9fd8d0, { tint: 0x4f747b, transparent: true, opacity: 0 }),
    kit.material(0xc8b1df, { tint: 0x625875, transparent: true, opacity: 0 }),
    kit.material(0xf2b39d, { tint: 0x815861, transparent: true, opacity: 0 }),
  ];
  ribbonMaterials.forEach((material) => {
    material.side = THREE.DoubleSide;
    material.depthWrite = false;
  });

  const bodyPivot = kit.pivot('hair-dryer-body-pivot');
  bodyPivot.position.y = 1.35;
  bodyPivot.userData.rotationAxis = [1, 0, 0];
  const shell = kit.mesh(
    'hair-dryer-cream-motor-shell',
    new THREE.CylinderGeometry(0.82, 0.82, 2.52, 40, 1, false),
    cream,
    bodyPivot,
  );
  shell.rotation.z = Math.PI * 0.5;
  shell.userData.part = 'motor-shell';
  const shellHighlight = kit.mesh(
    'hair-dryer-motor-shell-upper-highlight',
    new THREE.CylinderGeometry(0.825, 0.825, 1.84, 40, 1, true, Math.PI * 0.12, Math.PI * 0.52),
    creamHighlight,
    bodyPivot,
    false,
  );
  shellHighlight.rotation.z = Math.PI * 0.5;
  shellHighlight.position.x = 0.05;
  shellHighlight.userData.explodeWithParent = true;

  const bodySeam = kit.mesh('hair-dryer-body-mould-seam', new THREE.TorusGeometry(0.78, 0.018, 6, 40), pinkShadow, bodyPivot, false);
  bodySeam.rotation.y = Math.PI * 0.5;
  bodySeam.position.x = 0.18;
  bodySeam.userData.explodeWithParent = true;
  const frontLip = kit.mesh('hair-dryer-cream-front-transition-lip', new THREE.TorusGeometry(0.775, 0.07, 10, 40), creamHighlight, bodyPivot, false);
  frontLip.rotation.y = Math.PI * 0.5;
  frontLip.position.x = -1.225;
  frontLip.userData.explodeWithParent = true;

  const nozzlePivot = kit.pivot('hair-dryer-nozzle-pivot', bodyPivot);
  nozzlePivot.userData.rotationAxis = [1, 0, 0];
  kit.socket('hair-dryer-nozzle-bayonet-socket', bodyPivot, [-1.18, 0, 0]);
  const nozzleCouplingSleeve = kit.mesh(
    'hair-dryer-wide-nozzle-coupling-sleeve',
    new THREE.CylinderGeometry(0.8, 0.78, 0.28, 40, 1, true),
    pinkHighlight,
    nozzlePivot,
    false,
  );
  nozzleCouplingSleeve.rotation.z = Math.PI * 0.5;
  nozzleCouplingSleeve.position.x = -1.19;
  nozzleCouplingSleeve.userData.part = 'nozzle-coupling-sleeve';
  const nozzle = kit.mesh('hair-dryer-pink-concentrator-nozzle', nozzleLoftGeometry(), pinkMaterial, nozzlePivot);
  nozzle.userData.part = 'concentrator-nozzle';
  const nozzleBand = kit.mesh('hair-dryer-nozzle-socket-band', new THREE.TorusGeometry(0.72, 0.045, 8, 40), pinkHighlight, nozzlePivot, false);
  nozzleBand.rotation.y = Math.PI * 0.5;
  nozzleBand.position.x = -1.17;
  nozzleBand.userData.explodeWithParent = true;
  const outlet = kit.mesh('hair-dryer-flat-outlet-cavity', rounded(0.055, 1.12, 0.38, 0.11), cavity, nozzlePivot, false);
  outlet.position.x = -2.385;
  outlet.userData.part = 'outlet-cavity';
  const outletRim = kit.mesh('hair-dryer-flat-outlet-rim', new THREE.TorusGeometry(0.57, 0.045, 8, 32), pinkHighlight, nozzlePivot, false);
  outletRim.rotation.y = Math.PI * 0.5;
  outletRim.position.x = -2.405;
  outletRim.scale.z = 0.36;
  outletRim.userData.explodeWithParent = true;
  for (let index = 0; index < 5; index += 1) {
    const louver = kit.mesh(`hair-dryer-outlet-louver-${index + 1}`, rounded(0.055, 0.055, 0.31, 0.018), grille, nozzlePivot, false);
    louver.position.set(-2.425, (index - 2) * 0.205, 0);
    louver.userData.explodeWithParent = true;
  }
  kit.socket('hair-dryer-airflow-emitter-socket', nozzlePivot, [-2.43, 0, 0]);

  const rearPivot = kit.pivot('hair-dryer-rear-intake-pivot', bodyPivot);
  rearPivot.position.x = 1.25;
  kit.socket('hair-dryer-rear-service-socket', bodyPivot, [1.25, 0, 0]);
  const rearCreamRing = kit.mesh('hair-dryer-rear-cream-bezel', new THREE.TorusGeometry(0.79, 0.115, 12, 44), creamHighlight, rearPivot);
  rearCreamRing.rotation.y = Math.PI * 0.5;
  rearCreamRing.userData.part = 'rear-cream-bezel';
  const rearMintRing = kit.mesh('hair-dryer-rear-mint-intake-ring', new THREE.TorusGeometry(0.64, 0.075, 10, 42), mint, rearPivot);
  rearMintRing.rotation.y = Math.PI * 0.5;
  rearMintRing.position.x = 0.125;
  rearMintRing.userData.part = 'rear-mint-ring';
  const rearCavity = kit.mesh('hair-dryer-rear-mint-perforated-plate', new THREE.CylinderGeometry(0.61, 0.61, 0.045, 40), mintScreen, rearPivot, false);
  rearCavity.rotation.z = Math.PI * 0.5;
  rearCavity.position.x = 0.132;
  rearCavity.renderOrder = 2;
  rearCavity.userData.part = 'rear-perforated-plate';

  const fanPivot = kit.pivot('hair-dryer-fan-rotor-pivot', rearPivot);
  fanPivot.position.x = 0.075;
  fanPivot.userData.rotationAxis = [1, 0, 0];
  kit.socket('hair-dryer-fan-axis-socket', rearPivot, [0.13, 0, 0]);
  const fanHub = kit.mesh('hair-dryer-fan-hub', new THREE.CylinderGeometry(0.15, 0.15, 0.08, 20), grille, fanPivot, false);
  fanHub.rotation.z = Math.PI * 0.5;
  fanHub.userData.part = 'fan-hub';
  fanHub.renderOrder = 1;
  for (let index = 0; index < 7; index += 1) {
    const blade = kit.mesh(`hair-dryer-fan-blade-${index + 1}`, rounded(0.055, 0.42, 0.14, 0.04), grille, fanPivot, false);
    const angle = index * Math.PI * 2 / 7;
    blade.position.set(0, Math.cos(angle) * 0.29, Math.sin(angle) * 0.29);
    blade.rotation.x = angle + 0.38;
    blade.scale.set(0.82, 0.78, 0.72);
    blade.renderOrder = 1;
    blade.userData.explodeWithParent = true;
  }
  addPerforationField(kit, rearPivot, cavity);

  const handlePivot = kit.pivot('hair-dryer-handle-pivot');
  handlePivot.position.set(0.45, 0.76, 0);
  handlePivot.userData.rotationAxis = [0, 0, 1];
  kit.socket('hair-dryer-handle-root-socket', bodyPivot, [0.45, -0.71, 0]);
  const handle = kit.mesh('hair-dryer-pink-rounded-handle-shell', rounded(0.74, 2.22, 0.66, 0.22), pinkMaterial, handlePivot);
  handle.position.y = -0.84;
  handle.userData.part = 'handle-shell';
  const handleFrontHighlight = kit.mesh('hair-dryer-handle-front-highlight', rounded(0.47, 1.72, 0.025, 0.11), pinkHighlight, handlePivot, false);
  handleFrontHighlight.position.set(0, -0.78, 0.345);
  handleFrontHighlight.userData.explodeWithParent = true;
  const handleSeam = kit.mesh('hair-dryer-handle-centre-seam', rounded(0.018, 1.82, 0.026, 0.006), pinkShadow, handlePivot, false);
  handleSeam.position.set(0, -0.82, -0.34);
  handleSeam.userData.explodeWithParent = true;

  const coolButtonPivot = kit.pivot('hair-dryer-cool-shot-button-pivot', handlePivot);
  coolButtonPivot.position.set(0, -0.43, 0.365);
  coolButtonPivot.userData.translationAxis = [0, 0, -1];
  kit.socket('hair-dryer-cool-button-socket', handlePivot, [0, -0.43, 0.35]);
  const coolButtonRing = kit.mesh('hair-dryer-cool-shot-button-ring', new THREE.TorusGeometry(0.15, 0.028, 8, 24), pinkShadow, coolButtonPivot, false);
  coolButtonRing.userData.part = 'cool-shot-control';
  const coolButton = kit.mesh('hair-dryer-round-cool-shot-button', new THREE.CylinderGeometry(0.125, 0.125, 0.055, 24), creamHighlight, coolButtonPivot, false);
  coolButton.rotation.x = Math.PI * 0.5;
  coolButton.position.z = 0.02;
  coolButton.userData.explodeWithParent = true;

  const switchPivot = kit.pivot('hair-dryer-power-slider-pivot', handlePivot);
  switchPivot.position.set(0, -1.03, 0.365);
  switchPivot.userData.translationAxis = [0, 1, 0];
  kit.socket('hair-dryer-power-switch-socket', handlePivot, [0, -1.03, 0.35]);
  const switchTrack = kit.mesh('hair-dryer-power-slider-track', rounded(0.31, 0.62, 0.06, 0.11), cream, switchPivot);
  switchTrack.userData.part = 'power-slider-track';
  const switchThumb = kit.mesh('hair-dryer-power-slider-thumb', rounded(0.26, 0.23, 0.09, 0.08), creamHighlight, switchPivot, false);
  switchThumb.position.set(0, 0.12, 0.055);
  switchThumb.userData.part = 'power-slider-thumb';
  const switchGroove = kit.mesh('hair-dryer-power-slider-groove', rounded(0.2, 0.035, 0.018, 0.012), pinkShadow, switchThumb, false);
  switchGroove.position.z = 0.055;
  switchGroove.userData.explodeWithParent = true;
  kit.indicator([0.45, -0.16, 0.37], 0.038);

  const cablePivot = kit.pivot('hair-dryer-cable-pivot', handlePivot);
  cablePivot.position.y = -1.96;
  kit.socket('hair-dryer-power-cable-socket', handlePivot, [0, -1.94, 0]);
  const collar = kit.mesh('hair-dryer-cream-cable-collar', new THREE.CylinderGeometry(0.34, 0.31, 0.22, 28), cream, cablePivot);
  collar.userData.part = 'cable-collar';
  for (let index = 0; index < 6; index += 1) {
    const topRadius = 0.23 - index * 0.021;
    const rib = kit.mesh(
      `hair-dryer-strain-relief-rib-${index + 1}`,
      new THREE.CylinderGeometry(topRadius - 0.012, topRadius, 0.105, 20),
      cordMaterial,
      cablePivot,
      false,
    );
    rib.position.y = -0.15 - index * 0.09;
    rib.userData.explodeWithParent = true;
  }
  const cord = kit.mesh('hair-dryer-visible-power-cord', new THREE.CylinderGeometry(0.075, 0.075, 0.62, 14), cordMaterial, cablePivot);
  cord.position.y = -0.8;
  cord.userData.part = 'power-cord';

  const ribbonField = kit.pivot('hair-dryer-ribbon-field-pivot', bodyPivot);
  ribbonField.userData.deformationSystem = 'deterministic-segmented-solid-ribbon';
  ribbonField.userData.releaseTime = 4.18;
  HAIR_DRYER_RIBBON_PROFILES.forEach((profile, index) => {
    const ribbon = kit.mesh(
      `hair-dryer-solid-wind-ribbon-${index + 1}`,
      createHairDryerRibbonGeometry(index),
      ribbonMaterials[index],
      ribbonField,
      false,
    );
    ribbon.visible = false;
    ribbon.castShadow = true;
    ribbon.receiveShadow = true;
    ribbon.userData.part = `wind-ribbon-${index + 1}`;
    ribbon.userData.anchorSocket = 'hair-dryer-airflow-emitter-socket';
    ribbon.userData.anchorLocal = [...profile.anchor];
    ribbon.userData.topologyClass = 'segmented-solid-ribbon';
    ribbon.userData.crossSection = 'rectangular-solid';
    ribbon.userData.deformation = {
      propagation: 'fixed-end-to-free-end',
      phase: profile.phase,
      frequency: profile.frequency,
      waveNumber: profile.waveNumber,
      twist: profile.twist,
      bend: profile.bend,
      turbulence: profile.turbulence,
    };
  });

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'long cream cylindrical motor shell with pink flattened concentrator nozzle and layered outlet',
        'round rear intake with cream bezel, mint ring, dark cavity and dense perforation field',
        'pink rounded vertical handle with front highlight, construction seam, cool-shot button and two-position slider',
        'cream lower collar, six-step strain-relief boot and visible power cord',
        'independent nozzle, fan, handle, controls, cable and airflow pivots with named runtime sockets',
        'five long solid-section fabric ribbons with individually parameterized propagation, twist, bend and deterministic turbulence',
      ],
      inferred: [
        'internal motor, heater coil, thermal fuse and electrical routing are hidden and omitted',
        'fan blade profile and exact rotor depth are inferred behind the intake perforations',
        'concentrator bayonet depth and outlet louver construction are inferred from the side silhouette',
        'body mould seam, hidden fasteners and cord attachment depth are reasonable manufacturing inferences',
        'the five SAKURA fabric ribbons are an intentionally stylized visualization of wind rather than literal dryer hardware',
      ],
    },
  );

  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.referenceDimensions = {
    barrelLength: 2.52,
    bodyDiameter: 1.64,
    nozzleLength: 1.24,
    outletSize: [1.12, 0.38],
    handleSize: [0.74, 2.22, 0.66],
    overallWidthWithoutEffects: 3.82,
    overallHeightWithoutCord: 4.05,
  };
  build.root.userData.sculptRuntime.colliders = [
    { id: 'hair-dryer-body', type: 'cylinder', node: 'hair-dryer-cream-motor-shell', axis: 'x' },
    { id: 'hair-dryer-handle', type: 'box', node: 'hair-dryer-pink-rounded-handle-shell' },
    { id: 'hair-dryer-nozzle', type: 'compound', node: 'hair-dryer-pink-concentrator-nozzle' },
    { id: 'hair-dryer-airflow-trigger', type: 'box', node: 'hair-dryer-ribbon-field-pivot', trigger: true },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'motor-housing', nodes: ['hair-dryer-body-pivot', 'hair-dryer-rear-intake-pivot'] },
    { id: 'concentrator', nodes: ['hair-dryer-nozzle-pivot'] },
    { id: 'handle-controls', nodes: ['hair-dryer-handle-pivot', 'hair-dryer-cool-shot-button-pivot', 'hair-dryer-power-slider-pivot'] },
    { id: 'power-cable', nodes: ['hair-dryer-cable-pivot'] },
    { id: 'wind-ribbons', nodes: ['hair-dryer-ribbon-field-pivot'] },
  ];
  return build;
}
