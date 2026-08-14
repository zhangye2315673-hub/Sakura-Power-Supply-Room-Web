import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  orientCylinderBetween,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

const REFERENCE_PATH = 'E:/AI/codexAI/sakula/arrow-cube/references/intake/alarm-clock/front.png';
const ACTIVE_DURATION = 5.2;

function rounded(width: number, height: number, depth: number, radius: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(width, height, depth, 4, radius);
}

function addBar(
  kit: ApplianceModelKit,
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  parent: THREE.Object3D,
  outlined = false,
): THREE.Mesh {
  const bar = kit.mesh(name, new THREE.CylinderGeometry(radius, radius, 1, 10), material, parent, outlined);
  orientCylinderBetween(bar, start, end);
  return bar;
}

/** Three-view procedural reconstruction of the Sakura twin-bell alarm clock. */
export function createAlarmClockModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accent = new THREE.Color(options.accent);
  const pink = accent.clone().offsetHSL(0, -0.03, 0.07).getHex();
  const pinkDark = accent.clone().offsetHSL(0, 0, -0.13).getHex();

  const shellMaterial = kit.material(0xf6b9b8, { tint: 0x8a6776 });
  const shellHighlightMaterial = kit.material(0xffd8cb, { tint: 0xa58383 });
  const dialMaterial = kit.material(0xfff2dc, { tint: 0x9d8790 });
  const dialGlassMaterial = kit.material(0xfff7e9, {
    tint: 0xb9a2a6,
    transparent: true,
    opacity: 0.16,
  });
  dialGlassMaterial.depthWrite = false;
  const handMaterial = kit.material(0x7b5863, { tint: 0x514452 });
  const hardwareMaterial = kit.material(0x6d5962, { tint: 0x49414d });
  const bellMaterial = kit.material(0xffecd9, { tint: 0xa58a84 });
  const cavityMaterial = kit.material(0x644d55, { tint: 0x423844 });
  const glowMaterial = kit.material(0xffb5c8, {
    tint: 0xb77893,
    emissive: 0xff94b8,
    transparent: true,
    opacity: 0.08,
  });

  const bodyPivot = kit.pivot('alarm-clock-body-pivot');
  bodyPivot.position.y = 1.18;
  const body = kit.mesh(
    'alarm-clock-circular-shell',
    new THREE.CylinderGeometry(0.98, 0.98, 0.42, 48),
    shellMaterial,
    bodyPivot,
  );
  body.rotation.x = Math.PI * 0.5;
  body.userData.part = 'main-shell';
  const shellBand = kit.mesh(
    'alarm-clock-shell-front-band',
    new THREE.TorusGeometry(0.91, 0.085, 10, 48),
    shellHighlightMaterial,
    bodyPivot,
  );
  shellBand.position.z = 0.225;
  const shellInnerBand = kit.mesh(
    'alarm-clock-shell-inner-seam',
    new THREE.TorusGeometry(0.82, 0.023, 7, 44),
    pinkDark ? kit.material(pinkDark, { tint: 0x6a5060 }) : shellMaterial,
    bodyPivot,
    false,
  );
  shellInnerBand.position.z = 0.244;

  const dialPivot = kit.pivot('alarm-clock-dial-assembly-pivot', bodyPivot);
  dialPivot.position.z = 0.245;
  kit.socket('alarm-clock-dial-axis-socket', dialPivot, [0, 0, 0.04]);
  const dial = kit.mesh('alarm-clock-ivory-dial', new THREE.CylinderGeometry(0.79, 0.79, 0.035, 48), dialMaterial, dialPivot, false);
  dial.rotation.x = Math.PI * 0.5;
  dial.position.z = 0.025;
  const dialRim = kit.mesh('alarm-clock-dial-raised-rim', new THREE.TorusGeometry(0.79, 0.028, 7, 44), shellHighlightMaterial, dialPivot, false);
  dialRim.position.z = 0.05;
  const glass = kit.mesh('alarm-clock-dial-transparent-cover', new THREE.CylinderGeometry(0.76, 0.76, 0.018, 48), dialGlassMaterial, dialPivot, false);
  glass.rotation.x = Math.PI * 0.5;
  glass.position.z = 0.075;
  glass.renderOrder = 6;
  const dialGlow = kit.mesh('alarm-clock-dial-powered-backlight', new THREE.CircleGeometry(0.68, 40), glowMaterial, dialPivot, false);
  dialGlow.position.z = 0.048;
  dialGlow.renderOrder = 1;

  const tickMaterial = kit.material(pink, { tint: 0x916f7f });
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI / 6;
    const inner = index % 3 === 0 ? 0.62 : 0.66;
    const outer = 0.72;
    const start = new THREE.Vector3(Math.sin(angle) * inner, Math.cos(angle) * inner, 0.085);
    const end = new THREE.Vector3(Math.sin(angle) * outer, Math.cos(angle) * outer, 0.085);
    const tick = addBar(kit, `alarm-clock-dial-tick-${index + 1}`, start, end, index % 3 === 0 ? 0.028 : 0.019, tickMaterial, dialPivot);
    tick.userData.explodeWithParent = true;
  }

  const handPivot = kit.pivot('alarm-clock-hands-pivot', dialPivot);
  handPivot.position.z = 0.11;
  handPivot.userData.rotationAxis = [0, 0, 1];
  kit.socket('alarm-clock-hands-center-socket', handPivot, [0, 0, 0.02]);
  const hourHandPivot = kit.pivot('alarm-clock-hour-hand-pivot', handPivot);
  const minuteHandPivot = kit.pivot('alarm-clock-minute-hand-pivot', handPivot);
  const hourHand = addBar(kit, 'alarm-clock-hour-hand', new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.32, 0.28, 0), 0.035, handMaterial, hourHandPivot, true);
  hourHand.userData.part = 'hour-hand';
  const minuteHand = addBar(kit, 'alarm-clock-minute-hand', new THREE.Vector3(0, 0, 0.012), new THREE.Vector3(0.46, 0.39, 0.012), 0.028, handMaterial, minuteHandPivot, true);
  minuteHand.userData.part = 'minute-hand';
  const handHub = kit.mesh('alarm-clock-hands-center-cap', new THREE.SphereGeometry(0.105, 16, 10), shellHighlightMaterial, handPivot, false);
  handHub.position.z = 0.035;

  const feetMaterial = kit.material(pinkDark, { tint: 0x5e4c5d });
  const footPositions: readonly [number, number, number][] = [[-0.62, -0.86, 0.03], [0.62, -0.86, 0.03]];
  footPositions.forEach(([x, y, z], index) => {
    const footPivot = kit.pivot(`alarm-clock-foot-${index + 1}-pivot`, bodyPivot);
    footPivot.position.set(x, y, z);
    footPivot.rotation.z = index === 0 ? 0.25 : -0.25;
    const foot = kit.mesh(`alarm-clock-foot-${index + 1}`, rounded(0.24, 0.42, 0.34, 0.08), feetMaterial, footPivot);
    foot.position.y = -0.15;
    foot.userData.part = `angled-foot-${index + 1}`;
    kit.socket(`alarm-clock-foot-${index + 1}-socket`, bodyPivot, [x, -0.72, z]);
  });

  const bellBaseAngles = [0.52, -0.52] as const;
  const bellPositions: readonly [number, number][] = [[-0.68, 0.44], [0.68, 0.44]];
  bellPositions.forEach(([x, z], index) => {
    const bellPivot = kit.pivot(`alarm-clock-bell-${index + 1}-pivot`, bodyPivot);
    bellPivot.position.set(x, 0.9, z);
    bellPivot.rotation.z = bellBaseAngles[index];
    bellPivot.userData.rotationAxis = [0, 0, 1];
    kit.socket(`alarm-clock-bell-${index + 1}-attachment-socket`, bodyPivot, [x, 0.54, z]);
    const bell = kit.mesh(`alarm-clock-bell-${index + 1}-dome`, new THREE.SphereGeometry(0.5, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), bellMaterial, bellPivot);
    bell.scale.set(1.08, 0.82, 0.88);
    bell.rotation.x = -0.08;
    const lip = kit.mesh(`alarm-clock-bell-${index + 1}-lower-lip`, new THREE.TorusGeometry(0.42, 0.055, 8, 28), shellHighlightMaterial, bellPivot, false);
    lip.rotation.x = Math.PI * 0.5;
    lip.position.y = -0.21;
    const cavity = kit.mesh(`alarm-clock-bell-${index + 1}-under-cavity`, new THREE.CylinderGeometry(0.35, 0.35, 0.065, 24), cavityMaterial, bellPivot, false);
    cavity.rotation.x = Math.PI * 0.5;
    cavity.position.z = 0.015;
    const post = kit.mesh(`alarm-clock-bell-${index + 1}-support-post`, rounded(0.13, 0.38, 0.14, 0.04), pinkDark ? kit.material(pinkDark) : shellMaterial, bodyPivot, false);
    post.position.set(x, 0.54, 0.02);
    post.rotation.z = index === 0 ? -0.16 : 0.16;

    const hammerPivot = kit.pivot(`alarm-clock-bell-hammer-${index + 1}-pivot`, bodyPivot);
    hammerPivot.position.set(x, 0.54, 0.35);
    hammerPivot.userData.rotationAxis = [0, 0, 1];
    const hammer = kit.mesh(`alarm-clock-bell-hammer-${index + 1}`, rounded(0.11, 0.45, 0.1, 0.045), hardwareMaterial, hammerPivot, true);
    hammer.position.y = 0.23;
    hammer.rotation.z = index === 0 ? -0.12 : 0.12;
    const hammerCap = kit.mesh(`alarm-clock-bell-hammer-cap-${index + 1}`, new THREE.SphereGeometry(0.09, 12, 8), shellHighlightMaterial, hammerPivot, false);
    hammerCap.position.y = 0.45;
    hammerCap.userData.explodeWithParent = true;
  });

  const handlePivot = kit.pivot('alarm-clock-carry-handle-pivot', bodyPivot);
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.73, 1, 0),
    new THREE.Vector3(-0.55, 1.45, 0),
    new THREE.Vector3(0, 1.66, 0),
    new THREE.Vector3(0.55, 1.45, 0),
    new THREE.Vector3(0.73, 1, 0),
  ]);
  const handle = kit.mesh('alarm-clock-arched-carry-handle', new THREE.TubeGeometry(handleCurve, 24, 0.065, 10, false), shellMaterial, handlePivot);
  handle.userData.part = 'carry-handle';
  kit.socket('alarm-clock-handle-left-socket', bodyPivot, [-0.73, 1, 0]);
  kit.socket('alarm-clock-handle-right-socket', bodyPivot, [0.73, 1, 0]);

  const alarmLeverPivot = kit.pivot('alarm-clock-top-alarm-lever-pivot', bodyPivot);
  alarmLeverPivot.position.set(0, 1, 0);
  alarmLeverPivot.userData.rotationAxis = [1, 0, 0];
  const leverPost = kit.mesh('alarm-clock-top-alarm-lever-post', rounded(0.1, 0.29, 0.1, 0.03), pinkDark ? kit.material(pinkDark) : shellMaterial, alarmLeverPivot);
  leverPost.position.y = 0.13;
  const leverBar = kit.mesh('alarm-clock-top-alarm-lever-bar', rounded(0.39, 0.1, 0.13, 0.045), shellMaterial, alarmLeverPivot);
  leverBar.position.y = 0.29;
  kit.socket('alarm-clock-alarm-lever-socket', alarmLeverPivot, [0, 0.18, 0]);

  const feedbackRig = kit.pivot('alarm-clock-ringing-feedback-rig', bodyPivot);
  feedbackRig.userData.effectOwner = 'alarm-clock-model-rig';
  ([-1, 1] as const).forEach((side) => {
    for (let index = 0; index < 3; index += 1) {
      const wave = kit.mesh(
        `alarm-clock-stereo-wave-${side < 0 ? 'left' : 'right'}-${index + 1}`,
        new THREE.TorusGeometry(0.2 + index * 0.075, 0.025 + index * 0.004, 7, 22),
        glowMaterial,
        feedbackRig,
        false,
      );
      wave.position.set(side * (1.08 + index * 0.11), 0.74 + index * 0.03, 0.08);
      wave.scale.set(0.7, 1.2, 0.82);
      wave.visible = false;
      wave.userData.performanceEffect = true;
      wave.userData.side = side;
      wave.userData.waveIndex = index;
    }
    for (let index = 0; index < 2; index += 1) {
      const x = side * (1.02 + index * 0.13);
      const arc = kit.mesh(
        `alarm-clock-vibration-arc-${side < 0 ? 'left' : 'right'}-${index + 1}`,
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, 0.42 - index * 0.06, 0.08),
          new THREE.Vector3(x + side * 0.16, 0.72, 0.12),
          new THREE.Vector3(x, 1.02 + index * 0.08, 0.08),
        ]), 12, 0.032, 7, false),
        shellHighlightMaterial,
        feedbackRig,
        false,
      );
      arc.visible = false;
      arc.userData.performanceEffect = true;
      arc.userData.side = side;
      arc.userData.arcIndex = index;
    }
  });

  const rearPivot = kit.pivot('alarm-clock-rear-service-pivot', bodyPivot);
  rearPivot.position.z = -0.24;
  const rearPlate = kit.mesh('alarm-clock-rear-circular-service-plate', new THREE.CylinderGeometry(0.79, 0.79, 0.035, 40), shellMaterial, rearPivot, false);
  rearPlate.rotation.x = Math.PI * 0.5;
  rearPlate.position.z = -0.03;
  const rearSeam = kit.mesh('alarm-clock-rear-service-seam', new THREE.TorusGeometry(0.68, 0.022, 7, 36), shellHighlightMaterial, rearPivot, false);
  rearSeam.position.z = -0.055;
  const knobPivots: THREE.Group[] = [];
  ([-0.3, 0.3] as const).forEach((x, index) => {
    const knobPivot = kit.pivot(`alarm-clock-rear-winding-knob-${index + 1}-pivot`, rearPivot);
    knobPivot.position.set(x, 0.04, -0.09);
    knobPivot.userData.rotationAxis = [0, 0, 1];
    const knob = kit.mesh(`alarm-clock-rear-winding-knob-${index + 1}`, new THREE.CylinderGeometry(0.13, 0.13, 0.09, 16), shellHighlightMaterial, knobPivot);
    knob.rotation.x = Math.PI * 0.5;
    knob.position.z = -0.02;
    knobPivots.push(knobPivot);
  });
  const rearPower = kit.mesh('alarm-clock-rear-power-inlet-inferred', rounded(0.2, 0.12, 0.06, 0.025), cavityMaterial, rearPivot, false);
  rearPower.position.set(0, -0.5, -0.07);
  kit.socket('alarm-clock-power-connection-socket', rearPivot, [0, -0.5, -0.13]);

  const build = kit.finish(
    {
      referencePath: options.referencePath ?? REFERENCE_PATH,
      reconstructed: [
        'round pink painted-metal shell with layered front rim and warm ivory dial',
        'twelve separate tick marks, independent hour/minute hands and transparent dial cover',
        'paired cream bell domes with lower lips, cavities and separate oscillating hammer pivots',
        'arched carry handle, top alarm lever, two angled front feet and circular rear service plate',
        'two rear winding knobs plus inferred rear-lower power inlet/socket',
      ],
      inferred: [
        'internal escapement, bell springs, battery compartment and gear train are hidden by the supplied views',
        'rear power inlet profile and exact knob shaft depth are inferred from appliance interaction conventions',
        'bell hammer attachment depth and underside shell thickness are conservative procedural estimates',
      ],
    },
  );
  build.root.userData.sculptRuntime.colliders = [
    { id: 'alarm-clock-body', type: 'cylinder', node: 'alarm-clock-circular-shell' },
    { id: 'alarm-clock-left-bell', type: 'sphere', node: 'alarm-clock-bell-1-dome' },
    { id: 'alarm-clock-right-bell', type: 'sphere', node: 'alarm-clock-bell-2-dome' },
  ];
  build.root.userData.sculptRuntime.destructionGroups = [
    { id: 'body-shell', nodes: ['alarm-clock-body-pivot'] },
    { id: 'dial-assembly', nodes: ['alarm-clock-dial-assembly-pivot'] },
    { id: 'bells', nodes: ['alarm-clock-bell-1-pivot', 'alarm-clock-bell-2-pivot'] },
    { id: 'rear-service', nodes: ['alarm-clock-rear-service-pivot'] },
  ];
  build.root.userData.activeDuration = ACTIVE_DURATION;
  build.root.userData.alarmClockEffectContract = {
    modelOwner: 'alarm-clock-model-rig',
    timelineOwner: 'AppliancePerformanceSystem',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
    structuralRoot: 'alarm-clock-body-pivot',
    stereoWaveVolumes: 6,
    vibrationArcVolumes: 4,
    flatEffects: 0,
  };
  return build;
}
