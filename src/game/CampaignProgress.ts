export type CampaignResult = { timeMs: number; mistakes: number; stars: number };
export type CampaignSnapshot = {
  completed: number[];
  best: Record<string, CampaignResult>;
  totalStars: number;
  totalTimeMs: number;
  totalMistakes: number;
  recordedCount: number;
  nextLevel: number;
  replayLevel: number;
  allComplete: boolean;
};
export const CAMPAIGN_STATE_KEY = 'plug-spirits-campaign-state-v1';
export const campaignStars = (mistakes: number): number => mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
export const campaignTime = (ms: number): string => {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export class CampaignProgress {
  private completed = new Set<number>();
  private best: Record<string, CampaignResult> = {};
  private storage?: Pick<Storage, 'getItem' | 'setItem'>;

  constructor(readonly count: number, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
    try {
      this.storage = storage ?? globalThis.localStorage;
      const state = this.storage?.getItem(CAMPAIGN_STATE_KEY);
      if (state) {
        const parsed = JSON.parse(state);
        this.readResults(parsed?.best);
        if (Array.isArray(parsed?.completed)) {
          for (const id of parsed.completed) if (this.validId(id)) this.completed.add(id);
        }
      } else {
        this.readResults(JSON.parse(this.storage?.getItem('plug-spirits-campaign-results') ?? '{}'));
        const legacy = Number(this.storage?.getItem('plug-spirits-campaign-progress') ?? 0);
        if (Number.isInteger(legacy) && legacy >= 0 && legacy <= count) {
          for (let id = 1; id <= legacy; id++) this.completed.add(id);
        }
      }
    } catch { /* Corrupt or unavailable storage starts a playable session. */ }
    Object.keys(this.best).forEach(id => this.completed.add(Number(id)));
  }

  private validId(id: unknown): id is number {
    return typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= this.count;
  }

  private readResults(input: unknown): void {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return;
    for (const [key, value] of Object.entries(input)) {
      if (!this.validId(Number(key)) || !value || typeof value !== 'object') continue;
      const result = value as CampaignResult;
      if (!Number.isFinite(result.timeMs) || result.timeMs < 0 || !Number.isInteger(result.mistakes)
        || result.mistakes < 0 || result.stars !== campaignStars(result.mistakes)) continue;
      this.best[key] = { timeMs: result.timeMs, mistakes: result.mistakes, stars: result.stars };
    }
  }

  isUnlocked(id: number): boolean {
    return this.validId(id) && (id === 1 || this.completed.has(id) || this.completed.has(id - 1));
  }

  snapshot(): CampaignSnapshot {
    const completed = [...this.completed].sort((a, b) => a - b);
    const results = Object.values(this.best);
    const ids = Array.from({ length: this.count }, (_, i) => i + 1);
    const replayLevel = [...completed].sort((a, b) =>
      (this.best[a]?.stars ?? 0) - (this.best[b]?.stars ?? 0) || a - b)[0] ?? 1;
    return {
      completed, best: structuredClone(this.best),
      totalStars: results.reduce((sum, r) => sum + r.stars, 0),
      totalTimeMs: results.reduce((sum, r) => sum + r.timeMs, 0),
      totalMistakes: results.reduce((sum, r) => sum + r.mistakes, 0),
      recordedCount: results.length,
      nextLevel: ids.find(id => !this.completed.has(id)) ?? replayLevel,
      replayLevel, allComplete: completed.length === this.count,
    };
  }

  record(id: number, result: CampaignResult) {
    if (!this.validId(id)) throw new Error('Invalid campaign level');
    const previous = this.best[id];
    const nextWasLocked = id < this.count && !this.isUnlocked(id + 1);
    const isBetter = !previous || result.stars > previous.stars
      || (result.stars === previous.stars && result.mistakes < previous.mistakes)
      || (result.stars === previous.stars && result.mistakes === previous.mistakes && result.timeMs < previous.timeMs);
    const status = !previous ? 'first' : isBetter ? 'record' : 'unchanged';
    this.completed.add(id);
    if (isBetter) this.best[id] = { ...result };
    let persisted = false;
    try {
      this.storage?.setItem(CAMPAIGN_STATE_KEY, JSON.stringify({ completed: [...this.completed], best: this.best }));
      persisted = Boolean(this.storage);
    } catch { /* Keep progress available in memory when storage is full or blocked. */ }
    return { best: this.best[id], status, persisted, unlocked: nextWasLocked ? id + 1 : undefined, snapshot: this.snapshot() };
  }
}
export type CampaignOutcome = ReturnType<CampaignProgress['record']>;
