import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  ApplianceModelKit,
  type ApplianceModelBuild,
  type ApplianceModelOptions,
} from '../ApplianceModelKit';

function tone(accent: number, lightness: number, saturation = 0): number {
  return new THREE.Color(accent).offsetHSL(0, saturation, lightness).getHex();
}

function frontDisc(
  kit: ApplianceModelKit,
  name: string,
  radius: number,
  depth: number,
  material: THREE.Material,
  parent: THREE.Object3D,
  outlined = false,
): THREE.Mesh {
  const mesh = kit.mesh(
    name,
    new THREE.CylinderGeometry(radius, radius, depth, 18),
    material,
    parent,
    outlined,
  );
  mesh.rotation.x = Math.PI * 0.5;
  return mesh;
}

type Stroke = readonly [number, number, number, number];

const STROKE_FONT: Readonly<Record<string, readonly Stroke[]>> = {
  A: [[-0.5, -0.5, 0, 0.5], [0, 0.5, 0.5, -0.5], [-0.3, 0, 0.3, 0]],
  C: [[0.45, 0.42, 0.12, 0.5], [0.12, 0.5, -0.42, 0.3], [-0.42, 0.3, -0.42, -0.3], [-0.42, -0.3, 0.12, -0.5], [0.12, -0.5, 0.45, -0.42]],
  G: [[0.45, 0.42, 0.12, 0.5], [0.12, 0.5, -0.42, 0.3], [-0.42, 0.3, -0.42, -0.3], [-0.42, -0.3, 0.12, -0.5], [0.12, -0.5, 0.45, -0.25], [0.45, -0.25, 0.12, -0.25]],
  I: [[-0.42, 0.5, 0.42, 0.5], [0, 0.5, 0, -0.5], [-0.42, -0.5, 0.42, -0.5]],
  L: [[-0.42, 0.5, -0.42, -0.5], [-0.42, -0.5, 0.45, -0.5]],
  M: [[-0.5, -0.5, -0.5, 0.5], [-0.5, 0.5, 0, -0.05], [0, -0.05, 0.5, 0.5], [0.5, 0.5, 0.5, -0.5]],
  N: [[-0.5, -0.5, -0.5, 0.5], [-0.5, 0.5, 0.5, -0.5], [0.5, -0.5, 0.5, 0.5]],
  O: [[-0.36, 0.5, 0.36, 0.5], [0.36, 0.5, 0.5, 0.32], [0.5, 0.32, 0.5, -0.32], [0.5, -0.32, 0.36, -0.5], [0.36, -0.5, -0.36, -0.5], [-0.36, -0.5, -0.5, -0.32], [-0.5, -0.32, -0.5, 0.32], [-0.5, 0.32, -0.36, 0.5]],
};

function addStrokeText(
  kit: ApplianceModelKit,
  name: string,
  text: string,
  material: THREE.Material,
  parent: THREE.Object3D,
  size: number,
  spacing: number,
): THREE.Group {
  const group = kit.pivot(name, parent);
  const radius = size * 0.065;
  const advance = size + spacing;
  const startX = -((text.length - 1) * advance) * 0.5;
  text.split('').forEach((letter, letterIndex) => {
    const letterGroup = kit.pivot(`${name}-letter-${letterIndex + 1}-${letter}`, group);
    letterGroup.position.x = startX + letterIndex * advance;
    (STROKE_FONT[letter] ?? []).forEach(([x1, y1, x2, y2], strokeIndex) => {
      const start = new THREE.Vector3(x1 * size, y1 * size, 0);
      const end = new THREE.Vector3(x2 * size, y2 * size, 0);
      const direction = end.clone().sub(start);
      const stroke = kit.mesh(
        `${name}-letter-${letterIndex + 1}-stroke-${strokeIndex + 1}`,
        new THREE.CylinderGeometry(radius, radius, direction.length(), 7),
        material,
        letterGroup,
        false,
      );
      stroke.position.copy(start).lerp(end, 0.5);
      stroke.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      stroke.userData.explodeWithParent = true;
    });
  });
  return group;
}

function arcTubeGeometry(
  radius: number,
  startAngle: number,
  endAngle: number,
  tubeRadius: number,
): THREE.TubeGeometry {
  const points = Array.from({ length: 9 }, (_, index) => {
    const angle = THREE.MathUtils.lerp(startAngle, endAngle, index / 8);
    return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
  });
  const geometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points, false, 'centripetal'),
    18,
    tubeRadius,
    7,
    false,
  );
  geometry.userData.performanceProp = 'volumetric-phone-arc';
  return geometry;
}

function handsetGlyphGeometry(): THREE.TubeGeometry {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.085, 0.055, 0),
    new THREE.Vector3(-0.035, 0.012, 0),
    new THREE.Vector3(0.035, -0.012, 0),
    new THREE.Vector3(0.085, 0.055, 0),
  ], false, 'centripetal');
  return new THREE.TubeGeometry(path, 12, 0.019, 7, false);
}

/**
 * Original Sakura-style smartphone authored from the user's design brief.
 * There is deliberately no referencePath fallback: unlike the other appliances,
 * this replaces the removed vacuum and is not claimed as an image reconstruction.
 * Local frame is +Y up, +Z front, with a real 0.16-unit thick handset.
 */
export function createPhoneModel(options: ApplianceModelOptions): ApplianceModelBuild {
  const kit = new ApplianceModelKit(options);
  const accentLight = tone(options.accent, 0.18, -0.05);
  const accentMid = tone(options.accent, 0.04, -0.02);
  const accentDark = tone(options.accent, -0.16, 0.01);

  const cream = kit.material(0xf7f0e4, { tint: 0x766a7f });
  const creamLight = kit.material(0xfff8ec, { tint: 0x7d7185 });
  const rail = kit.material(accentMid, { tint: 0x665a72 });
  const railDark = kit.material(accentDark, { tint: 0x514759 });
  const lens = kit.material(0x252733, { tint: 0x1e1c28 });
  const metal = kit.material(0xaaa7b2, { tint: 0x696473 });
  const uiRose = kit.material(accentLight, {
    tint: 0x75677f,
    emissive: accentLight,
  });
  uiRose.emissiveIntensity = 0;
  const screenGlow = kit.material(0x4d536a, {
    tint: 0x3f394a,
    emissive: tone(options.accent, 0.1, -0.12),
  });
  screenGlow.emissiveIntensity = 0;
  const uiWhite = kit.material(0xfff6e6, { tint: 0x8d7b8b, emissive: 0xffd9e8 });
  uiWhite.emissiveIntensity = 0;
  const callGreen = kit.material(0x79e6b0, { tint: 0x547d76, emissive: 0x55d69d });
  callGreen.emissiveIntensity = 0;
  const callRed = kit.material(0xf17f9f, { tint: 0x805466, emissive: 0xf34b72 });
  callRed.emissiveIntensity = 0;
  const softCyan = kit.material(0x8adff1, { tint: 0x617899, emissive: 0x54cce9 });
  softCyan.emissiveIntensity = 0;
  const softGold = kit.material(0xffd98f, { tint: 0x967c70, emissive: 0xffb85c });
  softGold.emissiveIntensity = 0;
  const notificationGlow = kit.material(0xfff1e1, {
    tint: 0x786a7f,
    emissive: accentLight,
  });
  notificationGlow.emissiveIntensity = 0;

  const handsetPivot = kit.pivot('phone-handset-pivot');
  kit.socket('phone-body-socket', handsetPivot, [0, 0.96, 0]);

  // Blockout and silhouette: thin rounded slab with a visibly separate accent
  // perimeter rail and cream rear shell. The 0.16 depth avoids a remote-like
  // flat card reading in three-quarter and back views.
  const perimeterRail = kit.mesh(
    'phone-accent-perimeter-rail',
    new RoundedBoxGeometry(1.02, 1.92, 0.17, 5, 0.14),
    rail,
    handsetPivot,
  );
  perimeterRail.position.y = 0.98;
  perimeterRail.userData.part = 'perimeter-rail';

  const rearShell = kit.mesh(
    'phone-cream-rear-shell',
    new RoundedBoxGeometry(0.974, 1.87, 0.14, 5, 0.125),
    cream,
    handsetPivot,
  );
  rearShell.position.set(0, 0.98, -0.018);
  rearShell.userData.part = 'rear-shell';

  // Front display assembly. Every layer is a real thin volume so the narrow
  // bezel, dark glass and UI retain depth under orbit controls.
  const screenPivot = kit.pivot('phone-screen-assembly-pivot', handsetPivot);
  screenPivot.position.set(0, 0.99, 0.09);
  kit.socket('phone-screen-socket', screenPivot, [0, 0, 0]);

  const frontBezel = kit.mesh(
    'phone-front-cream-bezel',
    new RoundedBoxGeometry(0.94, 1.8, 0.035, 5, 0.112),
    creamLight,
    screenPivot,
  );
  frontBezel.userData.part = 'front-bezel';

  const screen = kit.mesh(
    'phone-layered-rounded-display-glass',
    new RoundedBoxGeometry(0.86, 1.69, 0.032, 5, 0.09),
    screenGlow,
    screenPivot,
  );
  screen.position.z = 0.027;
  screen.userData.part = 'display-glass';

  const earpiece = kit.mesh(
    'phone-front-earpiece-slot',
    new RoundedBoxGeometry(0.22, 0.026, 0.012, 2, 0.012),
    lens,
    screenPivot,
    false,
  );
  earpiece.position.set(0, 0.778, 0.051);
  earpiece.userData.explodeWithParent = true;

  const frontCamera = frontDisc(
    kit,
    'phone-front-camera-dot',
    0.028,
    0.012,
    lens,
    screenPivot,
  );
  frontCamera.position.set(0.31, 0.775, 0.051);
  frontCamera.userData.part = 'front-camera';

  // Incoming-call screen. These are tiny but real volumes rather than a
  // texture/Plane: the portrait, contact name, prompt and two response wells
  // remain readable while the phone is orbiting in the gallery.
  const incomingUiPivot = kit.pivot('phone-incoming-call-ui-pivot', screenPivot);
  incomingUiPivot.position.set(0, 0.03, 0.058);
  incomingUiPivot.visible = false;
  kit.socket('phone-incoming-call-ui-socket', incomingUiPivot, [0, 0, 0]);

  const avatarPivot = kit.pivot('phone-incoming-avatar-pivot', incomingUiPivot);
  avatarPivot.position.y = 0.31;
  const avatarHalo = kit.mesh(
    'phone-incoming-avatar-halo',
    new THREE.TorusGeometry(0.17, 0.018, 7, 24),
    uiRose,
    avatarPivot,
    false,
  );
  avatarHalo.userData.performanceRole = 'avatar-pulse';
  const avatarFace = kit.mesh(
    'phone-incoming-avatar-face',
    new THREE.SphereGeometry(0.125, 14, 9),
    creamLight,
    avatarPivot,
    false,
  );
  avatarFace.scale.set(1, 1, 0.48);
  avatarFace.position.z = 0.015;
  avatarFace.userData.performanceRole = 'avatar-pulse';
  const avatarHair = kit.mesh(
    'phone-incoming-avatar-hair',
    new THREE.SphereGeometry(0.145, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.56),
    railDark,
    avatarPivot,
    false,
  );
  avatarHair.scale.set(1, 0.72, 0.5);
  avatarHair.position.set(0, 0.05, 0.066);
  avatarHair.userData.explodeWithParent = true;
  const avatarBody = kit.mesh(
    'phone-incoming-avatar-body',
    new RoundedBoxGeometry(0.2, 0.09, 0.055, 3, 0.035),
    uiRose,
    avatarPivot,
    false,
  );
  avatarBody.position.set(0, -0.13, 0.01);
  avatarBody.userData.explodeWithParent = true;
  addStrokeText(kit, 'phone-contact-name-MOMO', 'MOMO', uiWhite, incomingUiPivot, 0.067, 0.075).position.y = 0.035;
  const callingLabel = addStrokeText(
    kit,
    'phone-incoming-label-CALLING',
    'CALLING',
    uiRose,
    incomingUiPivot,
    0.035,
    0.027,
  );
  callingLabel.position.y = -0.087;
  callingLabel.userData.performanceRole = 'prompt-flicker';

  const answerPivot = kit.pivot('phone-call-answer-button-pivot', incomingUiPivot);
  answerPivot.position.set(-0.22, -0.38, 0.005);
  answerPivot.userData.performanceRole = 'answer-pulse';
  const answerButton = frontDisc(kit, 'phone-call-answer-button', 0.105, 0.035, callGreen, answerPivot, false);
  answerButton.userData.controlAction = 'answer-call';
  const answerGlyph = kit.mesh('phone-call-answer-glyph', handsetGlyphGeometry(), uiWhite, answerPivot, false);
  answerGlyph.position.z = 0.026;
  answerGlyph.rotation.z = -0.18;
  answerGlyph.userData.explodeWithParent = true;
  kit.socket('phone-call-answer-socket', answerPivot, [0, 0, 0.045]);

  const hangupPivot = kit.pivot('phone-call-hangup-button-pivot', incomingUiPivot);
  hangupPivot.position.set(0.22, -0.38, 0.005);
  hangupPivot.userData.performanceRole = 'hangup-pulse';
  const hangupButton = frontDisc(kit, 'phone-call-hangup-button', 0.105, 0.035, callRed, hangupPivot, false);
  hangupButton.userData.controlAction = 'hangup-call';
  const hangupGlyph = kit.mesh('phone-call-hangup-glyph', handsetGlyphGeometry(), uiWhite, hangupPivot, false);
  hangupGlyph.position.z = 0.026;
  hangupGlyph.rotation.z = 0.18;
  hangupGlyph.scale.y = -1;
  hangupGlyph.userData.explodeWithParent = true;
  kit.socket('phone-call-hangup-socket', hangupPivot, [0, 0, 0.045]);

  // Model-owned call feedback. Every child is a closed volume and starts
  // hidden; PhonePerformance reveals and poses these on the shared timeline.
  const feedbackRoot = kit.pivot('phone-call-feedback-rig', handsetPivot);
  feedbackRoot.position.set(0, 0.98, 0.12);
  feedbackRoot.userData.performanceRig = 'phone-call-feedback';
  const feedbackMark = (mesh: THREE.Mesh, role: string): void => {
    mesh.userData.performanceEffect = role;
    mesh.userData.explodeWithParent = true;
    mesh.userData.part = 'call-feedback';
    mesh.visible = false;
  };

  for (let index = 0; index < 3; index += 1) {
    const wave = kit.mesh(
      `phone-stereo-wave-ring-${index + 1}`,
      new THREE.TorusGeometry(0.46, 0.018 + index * 0.004, 8, 28),
      index === 1 ? softCyan : uiRose,
      feedbackRoot,
      false,
    );
    wave.position.z = 0.05 + index * 0.008;
    wave.scale.set(0.72 + index * 0.08, 1.22 + index * 0.1, 1);
    wave.userData.effectIndex = index;
    feedbackMark(wave, 'stereo-wave-ring');
  }

  for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
    const side = sideIndex === 0 ? -1 : 1;
    for (let index = 0; index < 2; index += 1) {
      const arc = kit.mesh(
        `phone-vibration-pulse-${side < 0 ? 'left' : 'right'}-${index + 1}`,
        arcTubeGeometry(0.58 + index * 0.12, side < 0 ? 1.08 : 2.06, side < 0 ? 2.06 : 3.08, 0.018),
        softGold,
        feedbackRoot,
        false,
      );
      arc.position.x = side * 0.35;
      arc.position.y = -0.05 + index * 0.03;
      arc.position.z = 0.04;
      arc.userData.effectIndex = sideIndex * 2 + index;
      feedbackMark(arc, 'vibration-pulse');
    }
  }

  for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
    const side = sideIndex === 0 ? -1 : 1;
    for (let index = 0; index < 3; index += 1) {
      const arc = kit.mesh(
        `phone-call-signal-arc-${side < 0 ? 'left' : 'right'}-${index + 1}`,
        arcTubeGeometry(0.24 + index * 0.075, side < 0 ? 0.88 : 2.26, side < 0 ? 2.26 : 3.4, 0.014),
        softCyan,
        feedbackRoot,
        false,
      );
      arc.position.set(side * 0.28, 0.58, 0.052);
      arc.userData.effectIndex = sideIndex * 3 + index;
      feedbackMark(arc, 'call-signal-arc');
    }
  }

  const dotMaterials = [softCyan, softGold, uiRose] as const;
  for (let index = 0; index < 8; index += 1) {
    const dot = kit.mesh(
      `phone-soft-notification-light-${index + 1}`,
      new THREE.IcosahedronGeometry(0.026 + (index % 3) * 0.006, 1),
      dotMaterials[index % dotMaterials.length],
      feedbackRoot,
      false,
    );
    const angle = (index / 8) * Math.PI * 2 + 0.2;
    dot.position.set(Math.cos(angle) * 0.72, Math.sin(angle) * 0.95, 0.08 + (index % 2) * 0.04);
    dot.userData.effectIndex = index;
    dot.userData.baseAngle = angle;
    feedbackMark(dot, 'soft-light-point');
  }

  for (let index = 0; index < 6; index += 1) {
    const particlePivot = kit.pivot(`phone-information-particle-${index + 1}`, feedbackRoot);
    const side = index % 2 === 0 ? -1 : 1;
    particlePivot.position.set(side * (0.54 + (index % 3) * 0.1), -0.48 + Math.floor(index / 2) * 0.24, 0.09);
    particlePivot.userData.performanceEffect = 'information-particle';
    particlePivot.userData.effectIndex = index;
    particlePivot.visible = false;
    const body = kit.mesh(
      `phone-information-particle-${index + 1}-body`,
      new RoundedBoxGeometry(0.11 + (index % 2) * 0.03, 0.074, 0.045, 3, 0.025),
      index % 2 === 0 ? uiWhite : softCyan,
      particlePivot,
      false,
    );
    body.userData.explodeWithParent = true;
    const dotA = frontDisc(kit, `phone-information-particle-${index + 1}-dot-a`, 0.009, 0.01, uiRose, particlePivot, false);
    dotA.position.set(-0.028, 0, 0.028);
    dotA.userData.explodeWithParent = true;
    const dotB = frontDisc(kit, `phone-information-particle-${index + 1}-dot-b`, 0.009, 0.01, uiRose, particlePivot, false);
    dotB.position.set(0.028, 0, 0.028);
    dotB.userData.explodeWithParent = true;
  }

  // Physical controls: independent pivots and sockets instead of embossed
  // strips on the shell. Their depth is enough to read in side silhouette.
  const powerButtonBaseX = 0.525;
  const powerButtonPivot = kit.pivot('phone-power-button-pivot', handsetPivot);
  powerButtonPivot.position.set(powerButtonBaseX, 1.03, 0);
  powerButtonPivot.userData.translationAxis = [1, 0, 0];
  powerButtonPivot.userData.translationRange = [-0.02, 0.01];
  kit.socket('phone-power-button-socket', powerButtonPivot, [0, 0, 0]);
  const powerButton = kit.mesh(
    'phone-independent-power-button',
    new RoundedBoxGeometry(0.045, 0.27, 0.082, 2, 0.018),
    railDark,
    powerButtonPivot,
  );
  powerButton.userData.part = 'power-button';

  const volumePivot = kit.pivot('phone-volume-button-pivot', handsetPivot);
  volumePivot.position.set(-0.525, 1.26, 0);
  volumePivot.userData.translationAxis = [-1, 0, 0];
  volumePivot.userData.translationRange = [-0.01, 0.02];
  kit.socket('phone-volume-button-socket', volumePivot, [0, 0, 0]);
  for (const [index, y] of [[1, 0.105], [2, -0.105]] as const) {
    const button = kit.mesh(
      `phone-volume-button-${index}`,
      new RoundedBoxGeometry(0.045, 0.15, 0.082, 2, 0.018),
      railDark,
      volumePivot,
    );
    button.position.y = y;
    button.userData.part = 'volume-buttons';
  }

  // Bottom I/O. The Type-C recess, inner tongue, five speaker holes and
  // microphone hole are separate geometry on the underside.
  const ioPivot = kit.pivot('phone-bottom-io-pivot', handsetPivot);
  kit.socket('phone-bottom-io-socket', ioPivot, [0, 0.035, 0]);
  const usbPort = kit.mesh(
    'phone-bottom-type-c-recess',
    new RoundedBoxGeometry(0.235, 0.055, 0.09, 3, 0.025),
    lens,
    ioPivot,
  );
  usbPort.position.y = 0.035;
  usbPort.userData.part = 'usb-c-port';
  const usbTongue = kit.mesh(
    'phone-bottom-type-c-inner-tongue',
    new RoundedBoxGeometry(0.13, 0.012, 0.04, 2, 0.006),
    uiRose,
    ioPivot,
    false,
  );
  usbTongue.position.y = 0.003;
  usbTongue.userData.explodeWithParent = true;
  kit.socket('phone-usb-c-connection-socket', usbPort, [0, -0.045, 0]);

  for (let index = 0; index < 5; index += 1) {
    const speakerHole = kit.mesh(
      `phone-bottom-speaker-hole-${index + 1}`,
      new THREE.CylinderGeometry(0.017, 0.017, 0.055, 8),
      lens,
      ioPivot,
      false,
    );
    speakerHole.position.set(0.2 + index * 0.058, 0.035, 0);
    speakerHole.userData.explodeWithParent = true;
  }
  const microphoneHole = kit.mesh(
    'phone-bottom-microphone-hole',
    new THREE.CylinderGeometry(0.014, 0.014, 0.055, 8),
    lens,
    ioPivot,
    false,
  );
  microphoneHole.position.set(-0.27, 0.035, 0);

  // Rear camera assembly is intentionally restrained: a cream-accent island,
  // two separate lens stacks and flash. It is fully inferred because no rear
  // phone reference was supplied.
  const cameraPivot = kit.pivot('phone-rear-camera-island-pivot', handsetPivot);
  cameraPivot.position.set(-0.245, 1.585, -0.094);
  kit.socket('phone-rear-camera-island-socket', cameraPivot, [0, 0, 0]);
  const cameraIsland = kit.mesh(
    'phone-rear-rounded-camera-island',
    new RoundedBoxGeometry(0.39, 0.48, 0.045, 4, 0.09),
    rail,
    cameraPivot,
  );
  cameraIsland.userData.part = 'camera-island';

  for (const [index, x, y] of [
    [1, -0.085, 0.105],
    [2, 0.085, -0.095],
  ] as const) {
    const lensPivot = kit.pivot(`phone-rear-camera-lens-${index}-pivot`, cameraPivot);
    lensPivot.position.set(x, y, -0.035);
    kit.socket(`phone-camera-lens-${index}-socket`, lensPivot, [0, 0, 0]);
    const ring = kit.mesh(
      `phone-rear-camera-lens-${index}-metal-ring`,
      new THREE.TorusGeometry(0.082, 0.016, 7, 20),
      metal,
      lensPivot,
      false,
    );
    ring.userData.part = `camera-lens-${index}`;
    const glassLens = frontDisc(
      kit,
      `phone-rear-camera-lens-${index}-glass`,
      0.063,
      0.026,
      lens,
      lensPivot,
      false,
    );
    glassLens.position.z = -0.015;
    glassLens.scale.x = 0.94;
    glassLens.userData.explodeWithParent = true;
  }

  const rearFlash = frontDisc(
    kit,
    'phone-rear-camera-flash',
    0.038,
    0.018,
    notificationGlow,
    cameraPivot,
  );
  rearFlash.position.set(0.09, 0.125, -0.04);
  rearFlash.userData.part = 'camera-flash';

  // A small rear mark prevents the otherwise broad cream back from becoming
  // an identity-free plane without borrowing a real-world logo.
  const rearMotif = kit.mesh(
    'phone-rear-sakura-ring-motif',
    new THREE.TorusGeometry(0.075, 0.012, 6, 20),
    rail,
    handsetPivot,
    false,
  );
  rearMotif.position.set(0, 0.73, -0.095);

  // Indicator is kept separate from the UI materials so the shared appliance
  // connected/active state can still address it uniformly.
  kit.indicator([0.35, 1.7, 0.126], 0.018);

  const build = kit.finish(
    {
      referencePath: null,
      reconstructed: [
        'original Sakura-style thin rounded handset with real side thickness, cream rear shell and coloured perimeter rail',
        'layered front bezel, rounded dark display glass, earpiece slot and independent front-camera dot',
        'volumetric incoming-call screen with portrait, MOMO contact name, CALLING prompt and distinct answer/hang-up controls',
        'model-owned stereo wave rings, vibration pulses, call-signal arcs, soft light points and message-body particles',
        'independent right power button and paired left volume buttons with named pivots and sockets',
        'bottom-centred Type-C recess and tongue, five speaker perforations and a separate microphone perforation',
        'rear rounded camera island with two discrete lens stacks, flash and brand-neutral Sakura ring motif',
        'named screen, incoming-call controls, camera and bottom-I/O sockets for gallery orbit and powered animation',
      ],
      inferred: [
        'no phone reference image was supplied; the entire handset is an original design guided by the user brief and is not a reference reconstruction',
        'rear-camera island placement, lens count, flash, rear motif and cream back treatment are deliberate design inference',
        'Type-C recess depth, speaker-hole count, microphone location and side-button placement are functional layout inference',
        'internal battery, logic board, antenna breaks, haptics, lens optics, screen stack and all hidden fasteners are intentionally not modeled',
      ],
    },
  );
  build.root.userData.phoneEffectContract = {
    modelOwner: 'phone-model-rig',
    timelineOwner: 'AppliancePerformanceSystem',
    sharedSpectacleEffects: 'disabled',
    usesPlaneGeometry: false,
    usesSprite: false,
    forbiddenThemes: ['combat-star', 'electric-bolt', 'ultimate-attack'],
    volumeForms: [
      'torus-stereo-wave',
      'tube-vibration-pulse',
      'tube-call-signal-arc',
      'icosahedral-soft-light',
      'rounded-message-particle',
    ],
  };
  build.root.userData.sculptRuntime.destructionGroups.push({
    id: 'phone-call-feedback',
    nodes: ['phone-incoming-call-ui-pivot', 'phone-call-feedback-rig'],
  });
  return build;
}
