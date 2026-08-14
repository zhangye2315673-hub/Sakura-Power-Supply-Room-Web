export type RushRoundPhase = 'briefing' | 'running' | 'succeeded' | 'failed';

/**
 * Owns the one and only pressure rule in RUSH: a single whole-round clock.
 * Cable removals and mistakes are recorded for diagnostics, but neither can
 * mutate the authored time limit.
 */
export class RushRound {
  private remaining = 0;
  private removals = 0;
  private mistakes = 0;
  private startedAtSeconds = 0;
  phase: RushRoundPhase = 'briefing';

  constructor(readonly timeLimitSeconds: number) {
    if (!Number.isFinite(timeLimitSeconds) || timeLimitSeconds <= 0) {
      throw new Error('RUSH time limit must be a positive finite number.');
    }
    this.remaining = timeLimitSeconds;
  }

  get remainingSeconds(): number {
    return this.remaining;
  }

  get removalCount(): number {
    return this.removals;
  }

  get mistakeCount(): number {
    return this.mistakes;
  }

  start(nowSeconds = 0): void {
    if (this.phase !== 'briefing') return;
    this.startedAtSeconds = nowSeconds;
    this.phase = 'running';
  }

  update(nowSeconds: number): RushRoundPhase {
    if (this.phase !== 'running') return this.phase;
    this.remaining = Math.max(
      0,
      this.timeLimitSeconds - Math.max(0, nowSeconds - this.startedAtSeconds),
    );
    if (this.remaining === 0) this.phase = 'failed';
    return this.phase;
  }

  recordRemoval(): void {
    if (this.phase === 'running') this.removals += 1;
  }

  recordMistake(): void {
    if (this.phase === 'running') this.mistakes += 1;
  }

  succeed(): void {
    if (this.phase === 'running') this.phase = 'succeeded';
  }

  reset(): void {
    this.remaining = this.timeLimitSeconds;
    this.removals = 0;
    this.mistakes = 0;
    this.startedAtSeconds = 0;
    this.phase = 'briefing';
  }
}
