import * as THREE from 'three';

export const BLENDER_CLIMAX_TIME = 3.45;
export const BLENDER_ACTIVE_DURATION = 5.2;

export type BlenderPerformanceDiagnostics = {
  timelineTime: number;
  phase: 'idle' | 'startup' | 'chop' | 'blend' | 'lid-bounce' | 'settle';
  baseSway: number;
  jarSway: number;
  jarToBaseAmplitudeRatio: number;
  wholeFruitScale: number;
  chunkScale: number;
  juiceFill: number;
  lidLift: number;
  lidBounceCount: 0 | 1 | 2;
  splashSocket: string;
  forbiddenLegacyEffects: readonly ['PlaneGeometry', 'Line', 'Sprite'];
};

function smoothPulse(time: number, start: number, peak: number, end: number): number {
  return THREE.MathUtils.smoothstep(time, start, peak)
    * (1 - THREE.MathUtils.smoothstep(time, peak, end));
}

function phaseAt(time: number, power: number): BlenderPerformanceDiagnostics['phase'] {
  if (power <= 0.01) return 'idle';
  if (time < 0.62) return 'startup';
  if (time < 1.72) return 'chop';
  if (time < 3.08) return 'blend';
  if (time < 4.05) return 'lid-bounce';
  return 'settle';
}

/**
 * Blender-only performance definition. It deliberately does not target any
 * stand-mixer node, so changing this choreography cannot alter the mixer.
 * ApplianceMechanics restores the captured model baseline before every call.
 */
export function applyBlenderPerformance(root: THREE.Group, time: number, power: number): void {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const startup = THREE.MathUtils.smoothstep(time, 0.08, 0.55);
  const settle = 1 - THREE.MathUtils.smoothstep(time, 4.58, BLENDER_ACTIVE_DURATION);
  const run = startup * settle * p;
  const node = (name: string): THREE.Object3D | null => root.getObjectByName(name) ?? null;

  const basePivot = node('blender-motor-base-pivot');
  const jarPivot = node('blender-removable-jar-pivot');
  const jarSeat = node('blender-jar-seat-pivot');
  const lidPivot = node('blender-removable-lid-pivot');
  const wholeFruit = node('blender-whole-fruit-pivot');
  const fruitChunks = node('blender-cut-fruit-chunk-pivot');
  const liquidPivot = node('blender-powered-liquid-vortex-pivot');
  const liquid = node('blender-powered-rising-smoothie-volume');
  const liquidSurface = node('blender-powered-smoothie-concave-surface');
  const liquidSpiral = node('blender-powered-smoothie-vortex-highlight');

  const baseSway = (
    Math.sin(time * 12.2) * 0.028
    + Math.sin(time * 21.7 + 0.4) * 0.01
  ) * run;
  const jarSway = (
    Math.sin(time * 12.2 - 0.46) * 0.081
    + Math.sin(time * 19.1 + 1.08) * 0.027
  ) * run;
  const jarPitch = (
    Math.sin(time * 9.3 - 0.85) * 0.036
    + Math.sin(time * 16.8 + 0.2) * 0.015
  ) * run;
  const jarRoll = (
    Math.sin(time * 12.2 - 0.55) * 0.071
    + Math.sin(time * 24.4 + 0.7) * 0.018
  ) * run;

  if (basePivot) {
    basePivot.position.x += baseSway;
    basePivot.rotation.z += baseSway * 0.28;
  }
  if (jarSeat) {
    jarSeat.position.x += baseSway * 0.72;
    jarSeat.rotation.z += baseSway * 0.16;
  }
  if (jarPivot) {
    jarPivot.position.x += jarSway;
    jarPivot.position.y += Math.sin(time * 23.6 + 0.9) * 0.008 * run;
    jarPivot.rotation.x += jarPitch;
    jarPivot.rotation.z += jarRoll;
  }

  const dial = node('blender-front-speed-dial-pivot');
  if (dial) dial.rotation.z = -Math.PI * 0.82 * THREE.MathUtils.smoothstep(time, 0.05, 0.48) * p;
  const blades = node('blender-four-blade-rotation-pivot');
  if (blades) blades.rotation.y = time * (24 + THREE.MathUtils.smoothstep(time, 1.1, 2.3) * 22) * run;
  if (liquidPivot) liquidPivot.rotation.y = -time * (7.5 + THREE.MathUtils.smoothstep(time, 1.6, 3.1) * 5.5) * run;

  const chopA = THREE.MathUtils.smoothstep(time, 0.72, 1.42);
  const chopB = THREE.MathUtils.smoothstep(time, 1.42, 2.72);
  const wholeFruitScale = p <= 0.01 ? 1 : THREE.MathUtils.lerp(1, 0.64, chopA) * (1 - chopB);
  if (wholeFruit) {
    wholeFruit.visible = wholeFruitScale > 0.025;
    wholeFruit.scale.multiplyScalar(Math.max(0.001, wholeFruitScale));
    wholeFruit.rotation.y += time * 2.8 * run;
    wholeFruit.rotation.x += Math.sin(time * 7.2) * 0.08 * run;
  }

  const chunkAppear = THREE.MathUtils.smoothstep(time, 0.92, 1.34);
  const chunkFade = 1 - THREE.MathUtils.smoothstep(time, 2.25, 3.08);
  const chunkScale = p <= 0.01 ? 0 : chunkAppear * chunkFade;
  if (fruitChunks) {
    fruitChunks.visible = chunkScale > 0.015;
    fruitChunks.scale.multiplyScalar(Math.max(0.001, chunkScale));
    fruitChunks.rotation.y += time * 8.6 * run;
    fruitChunks.rotation.z += Math.sin(time * 6.4) * 0.16 * run;
    fruitChunks.children.forEach((chunk, index) => {
      chunk.rotation.x += time * (1.7 + index * 0.11) * run;
      chunk.rotation.z += time * (1.1 + index * 0.08) * run;
    });
  }

  const juiceFill = p <= 0.01 ? 0 : THREE.MathUtils.smoothstep(time, 0.74, 3.28) * settle;
  if (liquid) {
    liquid.visible = juiceFill > 0.012;
    liquid.scale.y *= Math.max(0.012, juiceFill);
  }
  if (liquidSurface) {
    liquidSurface.visible = juiceFill > 0.012;
    liquidSurface.position.y *= Math.max(0.012, juiceFill);
    liquidSurface.scale.setScalar(THREE.MathUtils.lerp(0.76, 1, juiceFill));
  }
  if (liquidSpiral) {
    liquidSpiral.visible = juiceFill > 0.28;
    liquidSpiral.position.y -= 2.15 * (1 - juiceFill);
    liquidSpiral.scale.setScalar(THREE.MathUtils.lerp(0.7, 1, juiceFill));
    liquidSpiral.rotation.y += time * 3.2 * run;
  }

  const lidPreSway = smoothPulse(time, 2.55, 2.84, 3.16) * p;
  const firstBounce = smoothPulse(time, 3.08, 3.4, 3.64) * p;
  const secondBounce = smoothPulse(time, 3.54, 3.76, 4.03) * p;
  const lidLift = firstBounce * 0.48 + secondBounce * 0.29;
  if (lidPivot) {
    lidPivot.position.y += lidLift;
    lidPivot.position.x += Math.sin(time * 18.5) * 0.09 * lidPreSway;
    lidPivot.rotation.z += Math.sin(time * 17.2 + 0.45) * 0.11 * lidPreSway
      + firstBounce * 0.1 - secondBounce * 0.065;
    lidPivot.rotation.x += -firstBounce * 0.12 + secondBounce * 0.07;
  }

  let lidBounceCount: BlenderPerformanceDiagnostics['lidBounceCount'] = 0;
  if (time >= 3.08) lidBounceCount = 1;
  if (time >= 3.54) lidBounceCount = 2;
  root.userData.blenderPerformanceDiagnostics = {
    timelineTime: time,
    phase: phaseAt(time, p),
    baseSway,
    jarSway,
    jarToBaseAmplitudeRatio: Math.abs(baseSway) > 0.00001 ? Math.abs(jarSway / baseSway) : 3.8,
    wholeFruitScale,
    chunkScale,
    juiceFill,
    lidLift,
    lidBounceCount,
    splashSocket: 'blender-splash-mouth-socket',
    forbiddenLegacyEffects: ['PlaneGeometry', 'Line', 'Sprite'],
  } satisfies BlenderPerformanceDiagnostics;
}
