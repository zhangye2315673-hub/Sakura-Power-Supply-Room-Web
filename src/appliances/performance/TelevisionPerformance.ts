import * as THREE from 'three';

export const TELEVISION_TIMELINE_OWNER = 'AppliancePerformanceSystem';

export type TelevisionPerformancePhase =
  | 'power-on-collapse-reverse'
  | 'channel-one'
  | 'channel-two'
  | 'channel-three'
  | 'rapid-channel-surf'
  | 'power-off-line-collapse'
  | 'dark';

export type TelevisionPerformanceDiagnostics = {
  timelineOwner: typeof TELEVISION_TIMELINE_OWNER;
  effectOwner: 'television-model-rig';
  phase: TelevisionPerformancePhase;
  timeline: number;
  selectedChannel: 1 | 2 | 3 | null;
  selectorAngle: number;
  pressedChannelButton: 1 | 2 | 3 | null;
  powerButtonPress: number;
  signalInterference: number;
  staticVisible: boolean;
  visibleProgrammeCount: number;
  pictureScale: [number, number];
  shutdownLineVisible: boolean;
  shutdownLineScale: [number, number];
  forbiddenGenericEffects: readonly ['debris-particles', 'PlaneGeometry', 'Sprite', 'Line'];
};

type ChannelSample = {
  channel: 1 | 2 | 3;
  transitionCenter: number | null;
};

const CHANNEL_ANGLES = [-0.82, 0, 0.82] as const;
export const TELEVISION_INITIAL_SWITCHES = [0.94, 1.84] as const;
export const TELEVISION_RAPID_SWITCH_TIMES = [2.72, 3.0, 3.28, 3.56, 3.84, 4.12] as const;
export const TELEVISION_RECONSTRUCTION_FINAL_LOCK_TIME = 4.48;
export const TELEVISION_RECONSTRUCTION_COMMIT_TIME = 5.12;

const INITIAL_SWITCHES = TELEVISION_INITIAL_SWITCHES;
const RAPID_SWITCH_TIMES = TELEVISION_RAPID_SWITCH_TIMES;

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function channelAt(time: number): ChannelSample {
  if (time < INITIAL_SWITCHES[0]) return { channel: 1, transitionCenter: null };
  if (time < INITIAL_SWITCHES[1]) return { channel: 2, transitionCenter: INITIAL_SWITCHES[0] };
  if (time < RAPID_SWITCH_TIMES[0]) return { channel: 3, transitionCenter: INITIAL_SWITCHES[1] };
  let channel: 1 | 2 | 3 = 1;
  let transitionCenter: number | null = RAPID_SWITCH_TIMES[0];
  RAPID_SWITCH_TIMES.forEach((switchTime, index) => {
    if (time >= switchTime) {
      channel = ((index % 3) + 1) as 1 | 2 | 3;
      transitionCenter = switchTime;
    }
  });
  return { channel, transitionCenter };
}

function phaseAt(time: number): TelevisionPerformancePhase {
  if (time < 0.32) return 'power-on-collapse-reverse';
  if (time < INITIAL_SWITCHES[0]) return 'channel-one';
  if (time < INITIAL_SWITCHES[1]) return 'channel-two';
  if (time < RAPID_SWITCH_TIMES[0]) return 'channel-three';
  if (time < 4.48) return 'rapid-channel-surf';
  if (time < 5.12) return 'power-off-line-collapse';
  return 'dark';
}

function getNode<T extends THREE.Object3D = THREE.Object3D>(root: THREE.Group, name: string): T | null {
  return (root.getObjectByName(name) as T | undefined) ?? null;
}

function setMeshGlow(mesh: THREE.Mesh | null, strength: number, color: number): void {
  if (!mesh) return;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materials.forEach((material) => {
    const toon = material as THREE.MeshToonMaterial;
    toon.emissive?.setHex(strength > 0.001 ? color : 0x000000);
    toon.emissiveIntensity = strength;
  });
}

/**
 * Television-only authored performance. ApplianceMechanics restores the model
 * baseline before every sample; this function then writes one deterministic
 * pose used by both the game and the gallery.
 */
export function applyTelevisionPerformance(root: THREE.Group, time: number, power: number): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const picture = getNode(root, 'television-picture-pivot');
  const staticGroup = getNode(root, 'television-static-snow-group');
  const shutdownLine = getNode(root, 'television-shutdown-phosphor-line');
  const selector = getNode(root, 'television-channel-selector-pivot');
  const powerButton = getNode(root, 'television-power-button-pivot');
  const screen = getNode<THREE.Mesh>(root, 'television-crt-bulged-screen');

  const bootPoint = THREE.MathUtils.smoothstep(time, 0.035, 0.095);
  const bootLine = THREE.MathUtils.smoothstep(time, 0.095, 0.19);
  const bootFull = THREE.MathUtils.smoothstep(time, 0.19, 0.34);
  const shutdownVertical = THREE.MathUtils.smoothstep(time, 4.54, 4.76);
  const shutdownHorizontal = THREE.MathUtils.smoothstep(time, 4.78, 5.02);
  const shutdownFade = 1 - THREE.MathUtils.smoothstep(time, 4.98, 5.14);
  const poweredEnvelope = p * (1 - THREE.MathUtils.smoothstep(time, 5.02, 5.18));

  let pictureScaleX = Math.max(0.018, bootLine) * (1 - shutdownHorizontal * 0.982);
  let pictureScaleY = Math.max(0.015, bootFull) * (1 - shutdownVertical * 0.985);
  if (picture) {
    picture.visible = bootPoint * poweredEnvelope > 0.001;
    picture.scale.set(pictureScaleX, pictureScaleY, 1);
  }

  const channelSample = channelAt(time);
  const shutdownActive = time >= 4.48;
  const transitionPulse = channelSample.transitionCenter === null
    ? pulse(time, 0.22, 0.29, 0.38)
    : pulse(time, channelSample.transitionCenter - 0.075, channelSample.transitionCenter, channelSample.transitionCenter + 0.13);
  const weakSignalFlicker = pulse(time, 2.34, 2.44, 2.58);
  const rapidSignal = time >= 2.72 && time < 4.32
    ? Math.max(0, Math.sin(time * 48 + 0.4)) * 0.42
    : 0;
  const signalInterference = shutdownActive
    ? 0
    : THREE.MathUtils.clamp(transitionPulse + weakSignalFlicker + rapidSignal, 0, 1);
  const staticVisible = signalInterference > 0.18 && pictureScaleX > 0.05 && pictureScaleY > 0.05;

  let visibleProgrammeCount = 0;
  for (let index = 0; index < 3; index += 1) {
    const channel = getNode(root, `television-channel-${index + 1}-${index === 0 ? 'sakura' : index === 1 ? 'test-card' : 'night-city'}`);
    if (!channel) continue;
    channel.visible = !shutdownActive && !staticVisible && channelSample.channel === index + 1 && poweredEnvelope > 0.01;
    if (channel.visible) visibleProgrammeCount += 1;
    channel.position.x = (staticVisible ? 0.025 : 0) * Math.sin(time * 71 + index);
  }
  if (staticGroup) {
    staticGroup.visible = staticVisible;
    staticGroup.position.x = Math.sin(time * 83) * 0.035 * signalInterference;
    staticGroup.position.y = Math.cos(time * 67) * 0.024 * signalInterference;
  }
  for (let index = 0; index < 48; index += 1) {
    const snow = getNode(root, `television-static-snow-bit-${index + 1}`);
    if (!snow) continue;
    const seed = Number(snow.userData.snowSeed ?? index);
    snow.position.x += Math.sin(time * (49 + seed % 11) + seed) * 0.026 * signalInterference;
    snow.position.y += Math.cos(time * (58 + seed % 7) + seed * 0.7) * 0.021 * signalInterference;
    snow.scale.x *= 0.55 + ((Math.floor(time * 40 + seed) % 5) / 4) * 0.75;
  }
  for (let index = 0; index < 2; index += 1) {
    const band = getNode(root, `television-static-signal-band-${index + 1}`);
    if (band) band.position.y += ((time * (1.8 + index * 0.7) + index * 0.39) % 1.12) - 0.56;
  }

  const switchImpact = channelSample.transitionCenter === null
    ? pulse(time, 0.16, 0.23, 0.32)
    : pulse(time, channelSample.transitionCenter - 0.075, channelSample.transitionCenter, channelSample.transitionCenter + 0.095);
  const selectorAngle = CHANNEL_ANGLES[channelSample.channel - 1];
  if (selector) selector.rotation.z += selectorAngle + Math.sin(time * 52) * 0.055 * switchImpact;

  let pressedChannelButton: 1 | 2 | 3 | null = null;
  for (let index = 0; index < 3; index += 1) {
    const button = getNode(root, `television-channel-button-${index + 1}-pivot`);
    const pressed = channelSample.channel === index + 1 ? switchImpact : 0;
    if (button) button.position.z -= pressed * 0.075;
    if (pressed > 0.08) pressedChannelButton = (index + 1) as 1 | 2 | 3;
  }

  const powerOnPress = pulse(time, 0.015, 0.075, 0.17);
  const powerOffPress = pulse(time, 4.42, 4.5, 4.63);
  const powerButtonPress = Math.max(powerOnPress, powerOffPress) * p;
  if (powerButton) powerButton.position.z -= powerButtonPress * 0.08;

  const shutdownLineVisible = shutdownVertical > 0.1 && shutdownFade > 0.01;
  const shutdownLineScaleX = Math.max(0.015, 1 - shutdownHorizontal * 0.985);
  const shutdownLineScaleY = 0.45 + shutdownVertical * 0.9;
  if (shutdownLine) {
    shutdownLine.visible = shutdownLineVisible;
    shutdownLine.scale.set(shutdownLineScaleX, shutdownLineScaleY, 1);
  }

  const scanline = getNode(root, 'television-scanline-pivot');
  if (scanline) {
    scanline.visible = pictureScaleY > 0.12 && poweredEnvelope > 0.01;
    scanline.position.y += ((time * 1.05) % 1.16) - 0.58;
  }
  const screenFlicker = (0.58 + Math.sin(time * 41) * 0.05 + signalInterference * 0.48) * poweredEnvelope;
  setMeshGlow(screen, screenFlicker, staticVisible ? 0xdfeaff : 0x78d7df);

  root.userData.televisionPerformanceDiagnostics = {
    timelineOwner: TELEVISION_TIMELINE_OWNER,
    effectOwner: 'television-model-rig',
    phase: phaseAt(time),
    timeline: time,
    selectedChannel: shutdownActive ? null : channelSample.channel,
    selectorAngle,
    pressedChannelButton,
    powerButtonPress,
    signalInterference,
    staticVisible,
    visibleProgrammeCount,
    pictureScale: [pictureScaleX, pictureScaleY],
    shutdownLineVisible,
    shutdownLineScale: [shutdownLineScaleX, shutdownLineScaleY],
    forbiddenGenericEffects: ['debris-particles', 'PlaneGeometry', 'Sprite', 'Line'],
  } satisfies TelevisionPerformanceDiagnostics;
}

export function resetTelevisionPerformance(root: THREE.Group): void {
  delete root.userData.televisionPerformanceDiagnostics;
}
