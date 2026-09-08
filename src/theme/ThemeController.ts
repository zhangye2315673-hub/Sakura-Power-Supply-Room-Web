import * as THREE from 'three';

export type ThemeMode = 'day' | 'night';
export type NightQualityTier = 'high' | 'reduced' | 'sparse' | 'minimal';

export type ThemeSnapshot = {
  mode: ThemeMode;
  targetMode: ThemeMode;
  progress: number;
  transitioning: boolean;
  reducedMotion: boolean;
  source: 'query' | 'saved' | 'default' | 'manual' | 'automatic';
  automatic: boolean;
  autoElapsed: number;
  autoInterval: number;
  autoRemaining: number;
};

export type ThemeResolution = Pick<ThemeSnapshot, 'mode' | 'source'>;

const STORAGE_KEY = 'sakura.theme';
export const AUTO_THEME_INTERVAL_SECONDS = 45;
const DAY_COLOR = new THREE.Color(0xd4e8fa);
const NIGHT_COLOR = new THREE.Color(0x11152c);
const START_INK_DAY = new THREE.Color(0x39324f);
const START_INK_NIGHT = new THREE.Color(0xd9d9e8);
const START_MUTED_DAY = new THREE.Color(0x625b72);
const START_MUTED_NIGHT = new THREE.Color(0xb7b8cd);
const START_FAINT_DAY = new THREE.Color(0x81798f);
const START_FAINT_NIGHT = new THREE.Color(0x969ab8);

export function resolveInitialTheme(
  search: string,
  savedTheme: string | null,
  internalEntry: boolean,
): ThemeResolution {
  const query = new URLSearchParams(search).get('theme');
  if (query === 'day' || query === 'night') return { mode: query, source: 'query' };
  if (!internalEntry && (savedTheme === 'day' || savedTheme === 'night')) {
    return { mode: savedTheme, source: 'saved' };
  }
  return { mode: 'day', source: 'default' };
}

export class ThemeController {
  private progressValue: number;
  private target: ThemeMode;
  private sourceValue: ThemeSnapshot['source'];
  private readonly listeners = new Set<(snapshot: ThemeSnapshot) => void>();
  private readonly motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  private reducedMotionValue = this.motionQuery.matches;
  private lastUpdateAt = performance.now();
  private autoElapsedValue = 0;
  private automaticValue = true;
  private automaticTransition = false;

  constructor(options: { internalEntry?: boolean } = {}) {
    let savedTheme: string | null = null;
    try {
      savedTheme = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage is optional. The current session still supports theme changes.
    }
    const initial = resolveInitialTheme(
      window.location.search,
      savedTheme,
      options.internalEntry ?? false,
    );
    this.target = initial.mode;
    this.progressValue = initial.mode === 'night' ? 1 : 0;
    this.sourceValue = initial.source;
    this.motionQuery.addEventListener('change', this.onMotionPreferenceChange);
    this.applyDocumentTheme();
  }

  get progress(): number {
    return this.progressValue;
  }

  get targetMode(): ThemeMode {
    return this.target;
  }

  get snapshot(): ThemeSnapshot {
    const settled = this.progressValue <= 0 ? 'day' : this.progressValue >= 1 ? 'night' : this.target;
    return {
      mode: settled,
      targetMode: this.target,
      progress: this.progressValue,
      transitioning: this.progressValue > 0 && this.progressValue < 1,
      reducedMotion: this.reducedMotionValue,
      source: this.sourceValue,
      automatic: this.automaticValue,
      autoElapsed: this.autoElapsedValue,
      autoInterval: AUTO_THEME_INTERVAL_SECONDS,
      autoRemaining: Math.max(0, AUTO_THEME_INTERVAL_SECONDS - this.autoElapsedValue),
    };
  }

  toggle(): void {
    this.setMode(this.target === 'night' ? 'day' : 'night', true);
  }

  setMode(mode: ThemeMode, persist = false): void {
    this.automaticTransition = false;
    if (persist) {
      this.autoElapsedValue = 0;
      this.sourceValue = 'manual';
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // Storage is optional. The active session still switches immediately.
      }
    }
    if (mode === this.target && !persist) return;
    this.target = mode;
    this.emit();
  }

  update(delta: number, automatic = true): void {
    const now = performance.now();
    const elapsed = Math.min(1, Math.max(0, delta, (now - this.lastUpdateAt) / 1000));
    this.automaticValue = automatic;
    if (automatic && !document.hidden) {
      this.autoElapsedValue += elapsed;
      if (this.autoElapsedValue >= AUTO_THEME_INTERVAL_SECONDS) {
        this.autoElapsedValue %= AUTO_THEME_INTERVAL_SECONDS;
        this.sourceValue = 'automatic';
        this.setMode(this.target === 'night' ? 'day' : 'night');
        this.automaticTransition = true;
      }
    }
    const wallDelta = Math.min(this.automaticTransition ? 1 : 0.05, elapsed);
    this.lastUpdateAt = now;
    const targetProgress = this.target === 'night' ? 1 : 0;
    if (this.progressValue === targetProgress) return;
    const duration = this.reducedMotionValue
      ? this.target === 'night' ? 0.2 : 0.16
      : this.automaticTransition ? 5 : this.target === 'night' ? 1.1 : 0.8;
    this.progressValue = THREE.MathUtils.clamp(
      this.progressValue + Math.sign(targetProgress - this.progressValue) * wallDelta / duration,
      0,
      1,
    );
    if (Math.abs(this.progressValue - targetProgress) < 0.0001) this.progressValue = targetProgress;
    this.applyDocumentTheme();
    this.emit();
  }

  subscribe(listener: (snapshot: ThemeSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.motionQuery.removeEventListener('change', this.onMotionPreferenceChange);
    this.listeners.clear();
  }

  private readonly onMotionPreferenceChange = (event: MediaQueryListEvent) => {
    this.reducedMotionValue = event.matches;
    this.applyDocumentTheme();
    this.emit();
  };

  private emit(): void {
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private applyDocumentTheme(): void {
    const color = DAY_COLOR.clone().lerp(NIGHT_COLOR, this.progressValue);
    const startInk = START_INK_DAY.clone().lerp(START_INK_NIGHT, this.progressValue);
    const startMuted = START_MUTED_DAY.clone().lerp(START_MUTED_NIGHT, this.progressValue);
    const startFaint = START_FAINT_DAY.clone().lerp(START_FAINT_NIGHT, this.progressValue);
    const cssColor = `#${color.getHexString()}`;
    const root = document.documentElement;
    root.style.setProperty('--theme-progress', this.progressValue.toFixed(4));
    root.style.setProperty('--page-background', cssColor);
    root.style.setProperty('--start-night-opacity', this.progressValue.toFixed(4));
    root.style.setProperty('--start-ink', `#${startInk.getHexString()}`);
    root.style.setProperty('--start-muted', `#${startMuted.getHexString()}`);
    root.style.setProperty('--start-faint', `#${startFaint.getHexString()}`);
    root.dataset.theme = this.progressValue >= 0.5 ? 'night' : 'day';
    root.classList.toggle('theme-transitioning', this.progressValue > 0 && this.progressValue < 1);
    root.classList.toggle('reduced-motion', this.reducedMotionValue);
    document.body.style.backgroundColor = cssColor;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = cssColor;
  }
}
