import * as THREE from 'three';

/**
 * One deliberate powered knob gesture: turn, hold while the appliance runs,
 * then return before the shared 5.2 second activation window ends.
 */
export function poweredControlTurn(
  time: number,
  power: number,
  angle = Math.PI * 2 / 3,
): number {
  const p = THREE.MathUtils.clamp(power, 0, 1);
  const turnIn = THREE.MathUtils.smoothstep(time, 0.08, 0.68);
  const returnHome = THREE.MathUtils.smoothstep(time, 4.08, 4.92);
  const settleTime = Math.max(0, time - 0.68);
  const settle = Math.sin(settleTime * 10.5) * Math.exp(-settleTime * 4.8) * 0.055;
  return (angle * turnIn + settle) * (1 - returnHome) * p;
}
