import * as THREE from 'three';

const FREEZE_COMPLETE_TIME = 3.45;
const ACTIVE_DURATION = 5.2;
const PERSISTENT_ENVIRONMENT_AMOUNT = 0.86;
const THAW_DURATION = 1.05;
const MAX_VISUAL_FRAME_STEP = 0.2;

export type RefrigeratorFreezePhase = 'idle' | 'freezing' | 'persistent' | 'thawing';

export type RefrigeratorFreezeDiagnostics = Readonly<{
  phase: RefrigeratorFreezePhase;
  elapsed: number;
  environmentAmount: number;
  cableAmount: number;
  cableProgress: number;
  targetCableIds: readonly string[];
}>;

/**
 * Owns only the refrigerator's visual timeline. Gameplay locking remains in
 * SkillChallengeEngine; this controller keeps frost visible until that status
 * is actually removed, then performs a short thaw instead of a hard cut.
 */
export class RefrigeratorFreezePresentation {
  private phaseValue: RefrigeratorFreezePhase = 'idle';
  private elapsedValue = 0;
  private lastUpdateAt = 0;
  private environmentAmountValue = 0;
  private cableAmountValue = 0;
  private cableProgressValue = 0;
  private readonly targetCableIdsValue = new Set<string>();

  activate(cableIds: readonly string[]): void {
    this.targetCableIdsValue.clear();
    cableIds.forEach((id) => this.targetCableIdsValue.add(id));
    this.phaseValue = this.targetCableIdsValue.size > 0 ? 'freezing' : 'idle';
    this.elapsedValue = 0;
    this.lastUpdateAt = performance.now() * 0.001;
    this.environmentAmountValue = 0;
    this.cableAmountValue = this.targetCableIdsValue.size > 0 ? 1 : 0;
    this.cableProgressValue = 0;
  }

  syncStatus(cableIds: readonly string[]): void {
    if (cableIds.length > 0) {
      if (this.targetCableIdsValue.size === 0) {
        cableIds.forEach((id) => this.targetCableIdsValue.add(id));
        this.phaseValue = 'persistent';
        this.environmentAmountValue = PERSISTENT_ENVIRONMENT_AMOUNT;
        this.cableAmountValue = 1;
        this.cableProgressValue = 1;
      }
      return;
    }
    if (this.targetCableIdsValue.size > 0 && this.phaseValue !== 'thawing') {
      this.phaseValue = 'thawing';
      this.elapsedValue = 0;
      this.lastUpdateAt = performance.now() * 0.001;
    }
  }

  update(delta: number): void {
    // Shader compilation and first-time ice geometry creation can stall one
    // render frame for hundreds of milliseconds. Do not let that wall-clock
    // hitch skip the visible crystal-growth sequence and reveal a complete
    // border in a single frame.
    const now = performance.now() * 0.001;
    const wallStep = this.lastUpdateAt > 0
      ? Math.min(Math.max(0, now - this.lastUpdateAt), MAX_VISUAL_FRAME_STEP)
      : 0;
    this.lastUpdateAt = now;
    const step = Math.max(
      Math.min(Math.max(0, delta), MAX_VISUAL_FRAME_STEP),
      wallStep,
    );
    if (this.phaseValue === 'freezing') {
      this.elapsedValue = Math.min(ACTIVE_DURATION, this.elapsedValue + step);
      // The cold grade starts immediately at a very low level. Individual
      // frost plates still use their own delayed birth thresholds in the
      // post-process field, so this does not reveal the border as one piece.
      const freeze = THREE.MathUtils.smoothstep(this.elapsedValue, 0, FREEZE_COMPLETE_TIME);
      this.cableProgressValue = freeze;
      this.cableAmountValue = 1;
      if (this.elapsedValue <= FREEZE_COMPLETE_TIME) {
        this.environmentAmountValue = freeze;
      } else {
        const settle = THREE.MathUtils.smoothstep(this.elapsedValue, 4.35, ACTIVE_DURATION);
        this.environmentAmountValue = THREE.MathUtils.lerp(1, PERSISTENT_ENVIRONMENT_AMOUNT, settle);
      }
      if (this.elapsedValue >= ACTIVE_DURATION - 1e-6) {
        this.elapsedValue = ACTIVE_DURATION;
        this.phaseValue = 'persistent';
        this.environmentAmountValue = PERSISTENT_ENVIRONMENT_AMOUNT;
        this.cableProgressValue = 1;
      }
      return;
    }
    if (this.phaseValue === 'persistent') {
      this.environmentAmountValue = PERSISTENT_ENVIRONMENT_AMOUNT;
      this.cableAmountValue = 1;
      this.cableProgressValue = 1;
      return;
    }
    if (this.phaseValue === 'thawing') {
      this.elapsedValue = Math.min(THAW_DURATION, this.elapsedValue + step);
      const remaining = 1 - THREE.MathUtils.smoothstep(this.elapsedValue, 0, THAW_DURATION);
      this.environmentAmountValue = PERSISTENT_ENVIRONMENT_AMOUNT * remaining;
      this.cableAmountValue = remaining;
      this.cableProgressValue = 1;
      if (this.elapsedValue >= THAW_DURATION - 1e-6) this.reset();
    }
  }

  reset(): void {
    this.phaseValue = 'idle';
    this.elapsedValue = 0;
    this.lastUpdateAt = 0;
    this.environmentAmountValue = 0;
    this.cableAmountValue = 0;
    this.cableProgressValue = 0;
    this.targetCableIdsValue.clear();
  }

  hasTarget(cableId: string): boolean {
    return this.targetCableIdsValue.has(cableId);
  }

  get visible(): boolean {
    return this.phaseValue !== 'idle' && this.environmentAmountValue > 0.001;
  }

  get environmentAmount(): number {
    return this.environmentAmountValue;
  }

  get cableAmount(): number {
    return this.cableAmountValue;
  }

  get cableProgress(): number {
    return this.cableProgressValue;
  }

  get diagnostics(): RefrigeratorFreezeDiagnostics {
    return {
      phase: this.phaseValue,
      elapsed: this.elapsedValue,
      environmentAmount: this.environmentAmountValue,
      cableAmount: this.cableAmountValue,
      cableProgress: this.cableProgressValue,
      targetCableIds: [...this.targetCableIdsValue],
    };
  }
}
