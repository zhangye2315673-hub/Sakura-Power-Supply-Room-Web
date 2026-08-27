import type { ApplianceKind } from '../systems/ApplianceCatalog';
import { PRINTER_PAPER_STOP_END } from './performance/PrinterPaperProfiles';

export type PoweredAnimationDriver = {
  update: (time: number, power: number) => void;
  stop: () => void;
  signal: () => number;
};

/** Default activation window used by appliances without an authored override. */
export const POWERED_ACTIVE_DURATION = 5.2;
export const PRINTER_POWERED_ACTIVE_DURATION = PRINTER_PAPER_STOP_END;
/** Washer skill presentation lasts 6.6s; keep its appliance alive past the final regroup frame. */
export const WASHER_POWERED_ACTIVE_DURATION = 6.75;
export const POWERED_WIND_DOWN_DURATION = 0.55;
export const POWERED_PREVIEW_CYCLE_DURATION = 7.1;

export function poweredActiveDuration(kind?: ApplianceKind): number {
  if (kind === 'printer') return PRINTER_POWERED_ACTIVE_DURATION;
  if (kind === 'washer') return WASHER_POWERED_ACTIVE_DURATION;
  return POWERED_ACTIVE_DURATION;
}

export function poweredPreviewCycleDuration(kind?: ApplianceKind): number {
  const idleGap = POWERED_PREVIEW_CYCLE_DURATION - POWERED_ACTIVE_DURATION;
  return poweredActiveDuration(kind) + idleGap;
}

export type PoweredAnimationState = {
  /** Elapsed time passed to the model animation, clamped to zero. */
  time: number;
  /** Remaining powered intensity during the wind-down window. */
  power: number;
  active: boolean;
};

export function poweredAnimationState(
  elapsed: number,
  kind?: ApplianceKind,
): PoweredAnimationState {
  const time = Math.max(0, elapsed);
  const activeDuration = poweredActiveDuration(kind);
  const active = time < activeDuration;
  return {
    time,
    power: active
      ? Math.max(0, Math.min(1, (activeDuration - time) / POWERED_WIND_DOWN_DURATION))
      : 0,
    active,
  };
}

/** Apply the same model animation contract used by the live game and gallery. */
export function drivePoweredAnimation(
  animation: PoweredAnimationDriver,
  elapsed: number,
  kind?: ApplianceKind,
): PoweredAnimationState {
  const state = poweredAnimationState(elapsed, kind);
  if (state.active) animation.update(state.time, state.power);
  else animation.stop();
  return state;
}
