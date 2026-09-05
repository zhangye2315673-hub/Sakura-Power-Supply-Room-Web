import { PRINTER_POWERED_ACTIVE_DURATION } from '../appliances/poweredAnimation';

const PRINTER_EVIDENCE_LOCK_DURATION_MS = 1_400;

export type SkillPresentationActivity = Readonly<{
  controllerActiveTimelines: number;
  transientEffectCount: number;
  elapsedMs?: number;
  maxVisualWaitMs?: number;
}>;

/** Keep production input locked until the printer's final page exits. */
export function printerSkillLockDurationMs(fixedPerformanceTime?: number): number {
  return Number.isFinite(fixedPerformanceTime)
    ? PRINTER_EVIDENCE_LOCK_DURATION_MS
    : PRINTER_POWERED_ACTIVE_DURATION * 1_000;
}

/** Do not let a following appliance cancel a skill effect that is still visible. */
export function skillPresentationStillActive(activity: SkillPresentationActivity): boolean {
  const active = activity.controllerActiveTimelines > 0 || activity.transientEffectCount > 0;
  if (!active) return false;
  if (
    Number.isFinite(activity.elapsedMs)
    && Number.isFinite(activity.maxVisualWaitMs)
    && (activity.elapsedMs ?? 0) >= (activity.maxVisualWaitMs ?? 0)
  ) return false;
  return true;
}
