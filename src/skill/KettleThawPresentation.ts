import * as THREE from 'three';

export const KETTLE_THAW_DURATION = 2.9;

export type KettleThawPhase = 'idle' | 'heating' | 'melting' | 'release' | 'complete';

export type KettleThawDiagnostics = Readonly<{
  active: boolean;
  elapsed: number;
  duration: number;
  phase: KettleThawPhase;
  progress: number;
  heatAmount: number;
  targetCableIds: readonly string[];
}>;

type StartOptions = Readonly<{
  targetCableIds: readonly string[];
  getTimelineElapsed?: () => number;
}>;

const EMPTY_DIAGNOSTICS = (): KettleThawDiagnostics => ({
  active: false,
  elapsed: 0,
  duration: KETTLE_THAW_DURATION,
  phase: 'idle',
  progress: 0,
  heatAmount: 0,
  targetCableIds: [],
});

function phaseAt(progress: number): KettleThawPhase {
  if (progress < 0.2) return 'heating';
  if (progress < 0.72) return 'melting';
  if (progress < 1) return 'release';
  return 'complete';
}

export class KettleThawPresentation {
  private startedAt = 0;
  private timelineOrigin = 0;
  private getTimelineElapsed: (() => number) | null = null;
  private diagnosticsValue = EMPTY_DIAGNOSTICS();

  start(options: StartOptions): number {
    this.startedAt = performance.now() * 0.001;
    this.getTimelineElapsed = options.getTimelineElapsed ?? null;
    this.timelineOrigin = Math.max(0, this.getTimelineElapsed?.() ?? 0);
    this.diagnosticsValue = {
      active: true,
      elapsed: 0,
      duration: KETTLE_THAW_DURATION,
      phase: 'heating',
      progress: 0.0001,
      heatAmount: 0,
      targetCableIds: [...options.targetCableIds],
    };
    return KETTLE_THAW_DURATION * 1_000;
  }

  update(): void {
    if (!this.diagnosticsValue.active) return;
    const wallElapsed = Math.max(0, performance.now() * 0.001 - this.startedAt);
    const timelineElapsed = this.getTimelineElapsed?.();
    const elapsed = Number.isFinite(timelineElapsed)
      ? Math.max(0, (timelineElapsed ?? 0) - this.timelineOrigin)
      : wallElapsed;
    const progress = THREE.MathUtils.clamp(elapsed / KETTLE_THAW_DURATION, 0, 1);
    const heatIn = THREE.MathUtils.smoothstep(progress, 0.015, 0.2);
    const heatOut = 1 - THREE.MathUtils.smoothstep(progress, 0.74, 1);
    const active = progress < 1;
    this.diagnosticsValue = {
      ...this.diagnosticsValue,
      active,
      elapsed: Math.min(elapsed, KETTLE_THAW_DURATION),
      phase: phaseAt(progress),
      progress,
      heatAmount: heatIn * heatOut,
    };
  }

  reset(): void {
    this.startedAt = 0;
    this.timelineOrigin = 0;
    this.getTimelineElapsed = null;
    this.diagnosticsValue = EMPTY_DIAGNOSTICS();
  }

  get diagnostics(): KettleThawDiagnostics {
    return this.diagnosticsValue;
  }
}