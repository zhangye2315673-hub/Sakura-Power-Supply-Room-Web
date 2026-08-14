import type { NightQualityTier } from './ThemeController';

const TIER_ORDER: readonly NightQualityTier[] = ['high', 'reduced', 'sparse', 'minimal'];

export class AdaptiveNightQuality {
  private tierIndex = 0;
  private lowDuration = 0;
  private highDuration = 0;
  private lastUpdateAt = performance.now();

  constructor(private readonly onTierChange: (tier: NightQualityTier) => void) {}

  get tier(): NightQualityTier {
    return TIER_ORDER[this.tierIndex];
  }

  update(delta: number): void {
    const now = performance.now();
    const wallDelta = Math.min(0.25, Math.max(delta, Math.max(0, (now - this.lastUpdateAt) / 1000)));
    this.lastUpdateAt = now;
    if (wallDelta <= 0) return;
    const fps = 1 / Math.max(delta, 0.001);
    if (fps < 52) {
      this.lowDuration += wallDelta;
      this.highDuration = 0;
    } else if (fps > 58) {
      this.highDuration += wallDelta;
      this.lowDuration = 0;
    } else {
      this.lowDuration = Math.max(0, this.lowDuration - wallDelta * 0.5);
      this.highDuration = Math.max(0, this.highDuration - wallDelta * 0.5);
    }
    if (this.lowDuration + 1e-6 >= 2 && this.tierIndex < TIER_ORDER.length - 1) {
      this.tierIndex += 1;
      this.lowDuration = 0;
      this.highDuration = 0;
      this.onTierChange(this.tier);
    } else if (this.highDuration + 1e-6 >= 8 && this.tierIndex > 0) {
      this.tierIndex -= 1;
      this.lowDuration = 0;
      this.highDuration = 0;
      this.onTierChange(this.tier);
    }
  }

  reset(tier: NightQualityTier = 'high'): void {
    this.tierIndex = Math.max(0, TIER_ORDER.indexOf(tier));
    this.lowDuration = 0;
    this.highDuration = 0;
    this.lastUpdateAt = performance.now();
    this.onTierChange(this.tier);
  }

  getDiagnostics(): { tier: NightQualityTier; lowDuration: number; highDuration: number } {
    return { tier: this.tier, lowDuration: this.lowDuration, highDuration: this.highDuration };
  }
}
