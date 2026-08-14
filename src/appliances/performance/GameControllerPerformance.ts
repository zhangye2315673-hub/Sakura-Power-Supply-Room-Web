import * as THREE from 'three';

export type GameControllerPerformancePhase =
  | 'anticipation'
  | 'heartbeat-start'
  | 'frenzy-input'
  | 'ultimate-burst'
  | 'ready-finale'
  | 'settled';

export type GameControllerPerformanceDiagnostics = {
  time: number;
  phase: GameControllerPerformancePhase;
  wholeBodyDrop: number;
  inputIntensity: number;
  stickOrbitRadians: number;
  visibleStars: number;
  visibleElectricBolts: number;
  visibleImpactBodies: number;
  visibleEnergyPoints: number;
  readyFlash: number;
  timelineOwner: 'AppliancePerformanceSystem';
  effectOwner: 'game-controller-model-rig';
  forbiddenPrimitives: readonly ['PlaneGeometry', 'Sprite', 'Line'];
};

function pulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function pressPulse(time: number, at: number, duration = 0.14): number {
  return pulse(time, at, at + duration * 0.3, at + duration);
}

function phaseAt(time: number): GameControllerPerformancePhase {
  if (time < 0.44) return 'anticipation';
  if (time < 0.94) return 'heartbeat-start';
  if (time < 2.66) return 'frenzy-input';
  if (time < 4.04) return 'ultimate-burst';
  if (time < 5.08) return 'ready-finale';
  return 'settled';
}

function glow(node: THREE.Object3D | null, strength: number, color: number): void {
  if (!(node instanceof THREE.Mesh)) return;
  const materials = Array.isArray(node.material) ? node.material : [node.material];
  materials.forEach((material) => {
    const toon = material as THREE.MeshToonMaterial;
    if (!toon.emissive) return;
    toon.emissive.setHex(strength > 0.01 ? color : 0x000000);
    toon.emissiveIntensity = strength * 2.1;
  });
}

/**
 * One authored five-act timeline shared by game and gallery through
 * AppliancePerformanceSystem. The caller restores the captured rig baseline
 * before every sample, so this function only adds deterministic offsets.
 */
export function applyGameControllerPerformance(root: THREE.Group, time: number, power: number): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const node = <T extends THREE.Object3D = THREE.Object3D>(name: string): T | null => (
    root.getObjectByName(name) as T | undefined
  ) ?? null;
  const prefixed = (prefix: string): THREE.Object3D[] => {
    const result: THREE.Object3D[] = [];
    root.traverse((object) => {
      if (object.name.startsWith(prefix) && object.userData.performanceEffect) result.push(object);
    });
    return result;
  };

  const motion = node<THREE.Group>('game-controller-motion-pivot');
  const sink = THREE.MathUtils.smoothstep(time, 0.02, 0.2)
    * (1 - THREE.MathUtils.smoothstep(time, 0.42, 0.7)) * p;
  const rebound = pulse(time, 0.4, 0.61, 0.92) * p;
  const frenzyGate = THREE.MathUtils.smoothstep(time, 0.9, 1.06)
    * (1 - THREE.MathUtils.smoothstep(time, 2.5, 2.68)) * p;
  const ultimateGate = THREE.MathUtils.smoothstep(time, 2.58, 2.76)
    * (1 - THREE.MathUtils.smoothstep(time, 3.92, 4.12)) * p;
  const readyFlash = pulse(time, 4.01, 4.2, 4.48) * p;

  if (motion) {
    motion.position.y += -0.44 * sink + 0.23 * rebound;
    motion.scale.x *= 1 + sink * 0.035 - rebound * 0.025;
    motion.scale.y *= 1 - sink * 0.11 + rebound * 0.08;
    motion.scale.z *= 1 + sink * 0.04;

    // Frenzy reads as directional controller recoil, not generic idle noise.
    motion.position.x += Math.sin(time * 38) * 0.035 * frenzyGate;
    motion.position.z += Math.sin(time * 31 + 0.8) * 0.055 * frenzyGate;
    motion.rotation.x += Math.sin(time * 19) * 0.075 * frenzyGate;
    motion.rotation.z += Math.sin(time * 27 + 0.45) * 0.055 * frenzyGate;

    // READY: a clear jump, impact compression, two aftershakes and exact settle.
    const jumpProgress = THREE.MathUtils.clamp((time - 4.16) / 0.58, 0, 1);
    const jump = time >= 4.16 && time <= 4.74 ? Math.sin(jumpProgress * Math.PI) * 0.88 * p : 0;
    const landing = pulse(time, 4.67, 4.76, 4.92) * p;
    const aftershake = (
      pressPulse(time, 4.78, 0.13) - pressPulse(time, 4.95, 0.11)
    ) * p;
    motion.position.y += jump - landing * 0.15;
    motion.scale.set(
      motion.scale.x * (1 + landing * 0.07),
      motion.scale.y * (1 - landing * 0.13),
      motion.scale.z * (1 + landing * 0.045),
    );
    motion.rotation.z += aftershake * 0.075;
  }

  // Heartbeat start: centre ignition and both sticks press/release together.
  const heartbeatPress = pulse(time, 0.43, 0.59, 0.82) * p;
  glow(node('game-controller-round-home-button'), Math.max(heartbeatPress, readyFlash), 0xff4f79);
  glow(node('game-controller-rose-status-lens'), Math.max(heartbeatPress * 1.35, readyFlash), 0xff315f);
  const stickPivots = [
    node<THREE.Group>('game-controller-stick-1-pivot'),
    node<THREE.Group>('game-controller-stick-2-pivot'),
  ];
  stickPivots.forEach((stick) => {
    if (stick) stick.position.z -= heartbeatPress * 0.19;
  });

  // Four face buttons fire in three deliberately different rhythmic runs.
  const facePresses = [0, 1, 2, 3].map((index) => Math.max(
    pressPulse(time, 0.98 + index * 0.13),
    pressPulse(time, 1.58 + (3 - index) * 0.115),
    pressPulse(time, 2.13 + index * 0.09, 0.12),
  ) * p);
  facePresses.forEach((press, index) => {
    const button = node<THREE.Group>(`game-controller-face-button-${index + 1}-pivot`);
    if (button) button.position.z -= press * 0.13;
    glow(node(`game-controller-face-button-${index + 1}`), readyFlash, 0xff456f);
  });

  // D-pad alternates four cardinal inputs by tilting around its true centre.
  const dpad = node<THREE.Group>('game-controller-dpad-pivot');
  const dpadTimes = [1.06, 1.37, 1.69, 2.01, 2.36];
  let dpadIntensity = 0;
  dpadTimes.forEach((at, index) => {
    const press = pressPulse(time, at, 0.15) * p;
    dpadIntensity = Math.max(dpadIntensity, press);
    if (!dpad) return;
    const angle = index * Math.PI * 0.5;
    dpad.rotation.x += Math.cos(angle) * press * 0.19;
    dpad.rotation.y += Math.sin(angle) * press * 0.19;
    dpad.position.z -= press * 0.045;
  });
  glow(node('game-controller-rounded-cross-dpad'), readyFlash, 0xff456f);

  // Bumpers and triggers answer each other as a left/right combo chain.
  const shoulderNames = [
    'game-controller-left-bumper-pivot', 'game-controller-right-bumper-pivot',
    'game-controller-left-trigger-pivot', 'game-controller-right-trigger-pivot',
  ] as const;
  const shoulderTimes = [1.18, 1.46, 1.78, 2.08, 2.34, 2.51];
  shoulderTimes.forEach((at, beatIndex) => {
    const target = node<THREE.Group>(shoulderNames[beatIndex % shoulderNames.length]);
    const press = pressPulse(time, at, 0.16) * p;
    if (target) target.rotation.x += press * 0.31;
  });
  [
    'game-controller-left-pink-bumper', 'game-controller-right-pink-bumper',
    'game-controller-left-pink-trigger', 'game-controller-right-pink-trigger',
    'game-controller-stick-1-pink-cap', 'game-controller-stick-2-pink-cap',
    'game-controller-horizontal-select-button',
  ].forEach((name) => glow(node(name), readyFlash, 0xff456f));

  // Ultimate: both sticks make one large, synchronized orbit with opposite phase.
  let stickOrbitRadians = 0;
  if (ultimateGate > 0.001) {
    const orbitProgress = THREE.MathUtils.clamp((time - 2.62) / 1.12, 0, 1);
    stickOrbitRadians = orbitProgress * Math.PI * 2;
    stickPivots.forEach((stick, index) => {
      if (!stick) return;
      const angle = stickOrbitRadians + index * Math.PI;
      stick.rotation.x += Math.sin(angle) * 0.55 * ultimateGate;
      stick.rotation.y += Math.cos(angle) * 0.55 * ultimateGate;
    });
  }

  let visibleStars = 0;
  prefixed('game-controller-ultimate-star-').forEach((effect, index) => {
    const local = ((time - 2.68 - index * 0.105) % 0.74 + 0.74) % 0.74;
    const life = Math.sin(THREE.MathUtils.clamp(local / 0.62, 0, 1) * Math.PI) * ultimateGate;
    effect.visible = life > 0.08;
    if (!effect.visible) return;
    visibleStars += 1;
    const side = index % 2 === 0 ? -1 : 1;
    effect.position.x += side * local * 0.42;
    effect.position.y += local * (0.46 + index * 0.035);
    effect.position.z += local * 0.22;
    effect.rotation.z += time * (2.4 + index * 0.22) * side;
    effect.scale.setScalar(0.42 + life * 0.82);
  });

  let visibleElectricBolts = 0;
  prefixed('game-controller-ultimate-electric-bolt-').forEach((effect, index) => {
    const flicker = Math.sin(time * 31 + index * 2.2) > -0.28;
    effect.visible = ultimateGate > 0.16 && flicker;
    if (!effect.visible) return;
    visibleElectricBolts += 1;
    effect.scale.set(0.72 + ultimateGate * 0.38, 0.78 + ultimateGate * 0.45, 0.82);
    effect.rotation.y += Math.sin(time * 12 + index) * 0.18;
  });

  let visibleImpactBodies = 0;
  prefixed('game-controller-ultimate-impact-shard-').forEach((effect, index) => {
    const angle = Number(effect.userData.burstAngle ?? (index / 8) * Math.PI * 2);
    const burst = THREE.MathUtils.clamp((time - 2.72 - (index % 3) * 0.08) / 0.82, 0, 1);
    const life = Math.sin(burst * Math.PI) * ultimateGate;
    effect.visible = life > 0.06;
    if (!effect.visible) return;
    visibleImpactBodies += 1;
    effect.position.x += Math.cos(angle) * burst * 1.18;
    effect.position.y += Math.sin(angle) * burst * 0.88 + burst * 0.24;
    effect.position.z += burst * 0.52;
    effect.rotation.set(time * (2.1 + index * 0.17), angle, time * 3.2);
    effect.scale.multiplyScalar(0.48 + life * 0.72);
  });

  let visibleEnergyPoints = 0;
  prefixed('game-controller-ultimate-energy-point-').forEach((effect, index) => {
    const angle = time * 4.4 + index * (Math.PI * 2 / 6);
    effect.visible = ultimateGate > 0.1;
    if (!effect.visible) return;
    visibleEnergyPoints += 1;
    // Orbit the controller's perimeter. The previous sub-unit orbit placed
    // points over the sticks and face buttons, making the burst read as an
    // internal overlay rather than an enclosing effect.
    effect.position.x = Math.cos(angle) * (2.9 + ultimateGate * 0.32);
    effect.position.y = 0.18 + Math.sin(angle) * (2.2 + ultimateGate * 0.28);
    effect.position.z += Math.sin(time * 7 + index) * 0.22;
    effect.scale.setScalar(0.72 + Math.sin(time * 11 + index) * 0.16);
  });

  const maxFacePress = Math.max(...facePresses);
  root.userData.gameControllerPerformanceDiagnostics = {
    time,
    phase: phaseAt(time),
    wholeBodyDrop: sink,
    inputIntensity: Math.max(maxFacePress, dpadIntensity, frenzyGate * 0.35),
    stickOrbitRadians,
    visibleStars,
    visibleElectricBolts,
    visibleImpactBodies,
    visibleEnergyPoints,
    readyFlash,
    timelineOwner: 'AppliancePerformanceSystem',
    effectOwner: 'game-controller-model-rig',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  } satisfies GameControllerPerformanceDiagnostics;
}

export function resetGameControllerPerformance(root: THREE.Group): void {
  root.userData.gameControllerPerformanceDiagnostics = {
    time: 0,
    phase: 'settled',
    wholeBodyDrop: 0,
    inputIntensity: 0,
    stickOrbitRadians: 0,
    visibleStars: 0,
    visibleElectricBolts: 0,
    visibleImpactBodies: 0,
    visibleEnergyPoints: 0,
    readyFlash: 0,
    timelineOwner: 'AppliancePerformanceSystem',
    effectOwner: 'game-controller-model-rig',
    forbiddenPrimitives: ['PlaneGeometry', 'Sprite', 'Line'],
  } satisfies GameControllerPerformanceDiagnostics;
}
