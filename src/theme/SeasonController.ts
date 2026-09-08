import * as THREE from 'three';
import {
  SEASON_MODES,
  SEASON_PROFILES,
  cloneEnvironmentState,
  isSeasonMode,
  lerpEnvironmentState,
  type SeasonEnvironmentState,
  type SeasonMode,
} from './SeasonProfiles';

export type SeasonSnapshot = {
  mode: SeasonMode;
  targetMode: SeasonMode;
  transitioning: boolean;
  progress: number;
  weights: Record<SeasonMode, number>;
  source: 'query' | 'saved' | 'default' | 'manual' | 'automatic';
  reducedMotion: boolean;
  automatic: true;
  autoElapsed: number;
  autoInterval: number;
  autoRemaining: number;
};

export type SeasonResolution = Pick<SeasonSnapshot, 'mode' | 'source'>;

const STORAGE_KEY = 'sakura.season';
export const AUTO_SEASON_INTERVAL_SECONDS = 60;

export function nextSeason(mode: SeasonMode): SeasonMode {
  return SEASON_MODES[(SEASON_MODES.indexOf(mode) + 1) % SEASON_MODES.length];
}

export function resolveInitialSeason(
  search: string,
  savedSeason: string | null,
  internalEntry: boolean,
): SeasonResolution {
  const query = new URLSearchParams(search).get('season');
  if (isSeasonMode(query)) return { mode: query, source: 'query' };
  if (!internalEntry && isSeasonMode(savedSeason)) return { mode: savedSeason, source: 'saved' };
  return { mode: 'spring', source: 'default' };
}

function oneHot(mode: SeasonMode): Record<SeasonMode, number> {
  return Object.fromEntries(SEASON_MODES.map((entry) => [entry, entry === mode ? 1 : 0])) as Record<SeasonMode, number>;
}

export class SeasonController {
  private target: SeasonMode;
  private weightsValue: Record<SeasonMode, number>;
  private sourceWeights: Record<SeasonMode, number>;
  private transitionProgress = 1;
  private appliedThemeProgress = Number.NaN;
  private appliedTransitionProgress = Number.NaN;
  private appliedTarget: SeasonMode | null = null;
  private sourceValue: SeasonSnapshot['source'];
  private readonly listeners = new Set<(snapshot: SeasonSnapshot) => void>();
  private readonly motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  private reducedMotionValue = this.motionQuery.matches;
  private lastUpdateAt = performance.now();
  private autoElapsedValue = 0;
  private readonly autoIntervalValue: number;
  private readonly dayState = cloneEnvironmentState(SEASON_PROFILES.spring.day);
  private readonly nightState = cloneEnvironmentState(SEASON_PROFILES.spring.night);
  private readonly finalState = cloneEnvironmentState(SEASON_PROFILES.spring.day);

  constructor(options: { internalEntry?: boolean; autoIntervalSeconds?: number } = {}) {
    let savedSeason: string | null = null;
    try { savedSeason = localStorage.getItem(STORAGE_KEY); } catch { /* Optional storage. */ }
    const initial = resolveInitialSeason(window.location.search, savedSeason, options.internalEntry ?? false);
    this.target = initial.mode;
    this.weightsValue = oneHot(initial.mode);
    this.sourceWeights = { ...this.weightsValue };
    this.sourceValue = initial.source;
    const debugInterval = import.meta.env.DEV
      ? Number(new URLSearchParams(window.location.search).get('seasonAutoSeconds'))
      : Number.NaN;
    this.autoIntervalValue = options.autoIntervalSeconds
      ?? (Number.isFinite(debugInterval) && debugInterval >= 1 ? debugInterval : AUTO_SEASON_INTERVAL_SECONDS);
    this.motionQuery.addEventListener('change', this.onMotionPreferenceChange);
    this.applyDocumentSeason(0);
  }

  get snapshot(): SeasonSnapshot {
    return {
      mode: this.transitionProgress >= 1 ? this.target : this.dominantSeason,
      targetMode: this.target,
      transitioning: this.transitionProgress < 1,
      progress: this.transitionProgress,
      weights: { ...this.weightsValue },
      source: this.sourceValue,
      reducedMotion: this.reducedMotionValue,
      automatic: true,
      autoElapsed: this.autoElapsedValue,
      autoInterval: this.autoIntervalValue,
      autoRemaining: Math.max(0, this.autoIntervalValue - this.autoElapsedValue),
    };
  }

  setMode(mode: SeasonMode, persist = false): void {
    if (persist) {
      this.autoElapsedValue = 0;
      this.sourceValue = 'manual';
      try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* Optional storage. */ }
    }
    if (mode === this.target && this.transitionProgress >= 1) return;
    this.sourceWeights = { ...this.weightsValue };
    this.target = mode;
    this.transitionProgress = 0;
    this.emit();
  }

  update(delta: number, themeProgress: number): void {
    const now = performance.now();
    // Preserve the requested ~2.4s wall-clock transition even while a frame is
    // delayed by WebGL compilation. A stall longer than the full transition is
    // equivalent to the transition having elapsed while no frame could render.
    const wallDelta = Math.min(2.4, Math.max(delta, Math.max(0, (now - this.lastUpdateAt) / 1000)));
    this.lastUpdateAt = now;
    this.autoElapsedValue += Math.min(1, Math.max(0, delta));
    if (this.autoElapsedValue >= this.autoIntervalValue) {
      this.autoElapsedValue %= this.autoIntervalValue;
      this.sourceValue = 'automatic';
      this.setMode(nextSeason(this.target));
    }
    if (this.transitionProgress < 1) {
      const duration = this.reducedMotionValue ? 0.25 : 2.4;
      this.transitionProgress = Math.min(1, this.transitionProgress + wallDelta / duration);
      const eased = THREE.MathUtils.smoothstep(this.transitionProgress, 0, 1);
      for (const mode of SEASON_MODES) {
        this.weightsValue[mode] = THREE.MathUtils.lerp(this.sourceWeights[mode], mode === this.target ? 1 : 0, eased);
      }
      this.emit();
    }
    this.applyDocumentSeason(themeProgress);
  }

  resolveEnvironment(themeProgress: number): Readonly<SeasonEnvironmentState> {
    this.mixSeasonState('day', this.dayState);
    this.mixSeasonState('night', this.nightState);
    return lerpEnvironmentState(this.finalState, this.dayState, this.nightState, themeProgress);
  }

  subscribe(listener: (snapshot: SeasonSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.motionQuery.removeEventListener('change', this.onMotionPreferenceChange);
    this.listeners.clear();
  }

  private get dominantSeason(): SeasonMode {
    return SEASON_MODES.reduce((best, mode) => this.weightsValue[mode] > this.weightsValue[best] ? mode : best, 'spring');
  }

  private mixSeasonState(time: 'day' | 'night', target: SeasonEnvironmentState): void {
    target.skyTop.setRGB(0, 0, 0); target.skyMid.setRGB(0, 0, 0); target.skyHaze.setRGB(0, 0, 0);
    target.cloud.setRGB(0, 0, 0); target.cloudShade.setRGB(0, 0, 0); target.fog.setRGB(0, 0, 0);
    target.sun.setRGB(0, 0, 0); target.fill.setRGB(0, 0, 0); target.bounce.setRGB(0, 0, 0);
    target.hemiSky.setRGB(0, 0, 0); target.hemiGround.setRGB(0, 0, 0); target.pageBackground.setRGB(0, 0, 0);
    target.startWash.setRGB(0, 0, 0);
    target.cloudOpacity = 0; target.cloudShadeOpacity = 0; target.fogNearScale = 0; target.fogFarScale = 0;
    target.sunIntensity = 0; target.fillIntensity = 0; target.bounceIntensity = 0; target.hemiIntensity = 0;
    for (const mode of SEASON_MODES) {
      const source = SEASON_PROFILES[mode][time];
      const weight = this.weightsValue[mode];
      for (const key of ['skyTop','skyMid','skyHaze','cloud','cloudShade','fog','sun','fill','bounce','hemiSky','hemiGround','pageBackground','startWash'] as const) {
        target[key].r += source[key].r * weight;
        target[key].g += source[key].g * weight;
        target[key].b += source[key].b * weight;
      }
      for (const key of ['cloudOpacity','cloudShadeOpacity','fogNearScale','fogFarScale','sunIntensity','fillIntensity','bounceIntensity','hemiIntensity'] as const) {
        target[key] += source[key] * weight;
      }
    }
  }

  private applyDocumentSeason(themeProgress: number): void {
    if (this.appliedThemeProgress === themeProgress
      && this.appliedTransitionProgress === this.transitionProgress
      && this.appliedTarget === this.target) return;
    this.appliedThemeProgress = themeProgress;
    this.appliedTransitionProgress = this.transitionProgress;
    this.appliedTarget = this.target;
    const environment = this.resolveEnvironment(themeProgress);
    const root = document.documentElement;
    const cssColor = `#${environment.pageBackground.getHexString()}`;
    const cssRgb = (color: THREE.Color) => {
      const srgb = color.clone().convertLinearToSRGB();
      return [srgb.r, srgb.g, srgb.b]
      .map((channel) => Math.round(THREE.MathUtils.clamp(channel, 0, 1) * 255))
      .join(', ');
    };
    root.dataset.season = this.transitionProgress >= 1 ? this.target : this.dominantSeason;
    root.dataset.seasonTarget = this.target;
    root.classList.toggle('season-transitioning', this.transitionProgress < 1);
    root.style.setProperty('--season-progress', this.transitionProgress.toFixed(4));
    root.style.setProperty('--page-background', cssColor);
    root.style.setProperty('--season-page-rgb', cssRgb(environment.pageBackground));
    root.style.setProperty('--start-wash-rgb', cssRgb(environment.startWash));
    // Spring keeps the original two-layer wash. For the added seasons, the
    // daytime Canvas color is already carried by startWash, so remove the
    // extra page-color layer while preserving it during night and transitions.
    const nightBlend = THREE.MathUtils.clamp(themeProgress, 0, 1);
    const pageLayerScale = THREE.MathUtils.lerp(this.weightsValue.spring, 1, nightBlend);
    root.style.setProperty('--start-wash-page-opacity', (0.14 * pageLayerScale).toFixed(4));
    root.style.setProperty('--start-wash-page-mid-opacity', (0.06 * pageLayerScale).toFixed(4));
    document.body.style.backgroundColor = cssColor;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = cssColor;
  }

  private readonly onMotionPreferenceChange = (event: MediaQueryListEvent) => {
    this.reducedMotionValue = event.matches;
    this.emit();
  };

  private emit(): void {
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
