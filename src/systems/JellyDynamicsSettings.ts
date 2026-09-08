export const JELLY_CONTROLS = {
  radius: { label: '捏住范围', min: 0.12, max: 1.2, step: 0.02, value: 0.46, help: '小范围捏角，大范围像手掌包住' },
  gravity: { label: '坠落重力', min: 0.5, max: 3, step: 0.1, value: 1.4, help: '越高提起后下落越有重量' },
  bounce: { label: '落地弹性', min: 0, max: 0.7, step: 0.05, value: 0.25, help: '落地后整机反弹的高度' },
  inertia: { label: '形变惯性', min: 0, max: 2, step: 0.1, value: 1, help: '落地晃动，以及进出场时顶部滞后的幅度' },
  stiffness: { label: '回弹硬度', min: 12, max: 100, step: 1, value: 48, help: '越高恢复越快，越低更软' },
  damping: { label: '消振阻尼', min: 1.5, max: 14, step: 0.1, value: 4.5, help: '越低来回晃动越久' },
  coupling: { label: '内部联动', min: 8, max: 90, step: 1, value: 32, help: '越高零件与整机越紧密相连' },
  grab: { label: '抓取力度', min: 40, max: 220, step: 5, value: 110, help: '越高越贴手，越低越有滞后' },
  stretch: { label: '形变上限', min: 0.12, max: 0.4, step: 0.01, value: 0.32, help: '限制最大拉伸，避免过度变形' },
  volume: { label: '体积保持', min: 0, max: 1, step: 0.05, value: 0.8, help: '越高越饱满，压缩后向周围鼓起' },
} as const;
export type JellyKey = keyof typeof JELLY_CONTROLS;
export type JellySettings = Record<JellyKey, number>;
export const jellyDefaults = Object.fromEntries(Object.entries(JELLY_CONTROLS).map(([k,v])=>[k,v.value])) as JellySettings;
const storageKey = 'sakura-jelly-dynamics-v1';
export const jellyDynamics: JellySettings = { ...jellyDefaults };
export function setJellyDynamics(values: Partial<JellySettings>): void {
  for (const key of Object.keys(JELLY_CONTROLS) as JellyKey[]) {
    const v = values[key], c = JELLY_CONTROLS[key];
    if (typeof v === 'number' && Number.isFinite(v)) jellyDynamics[key] = Math.max(c.min, Math.min(c.max, v));
  }
}
try {
  if (typeof localStorage !== 'undefined') {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (saved && typeof saved === 'object') setJellyDynamics(saved);
  }
} catch { /* Unavailable storage or an older invalid value uses defaults. */ }
export function saveJellyDynamics(): boolean {
  try { localStorage.setItem(storageKey, JSON.stringify(jellyDynamics)); return true; } catch { return false; }
}

/** Player-facing controls map to a coherent spring/volume profile. */
export function setJellyFeel(q: number): void {
  const t = Math.max(0, Math.min(1, q / 100));
  setJellyDynamics({ stiffness: 75-39*t, damping: 9-6*t, coupling: 55-25*t,
    grab: 150, stretch: 0.24+0.14*t, volume: 0.85, inertia: 0.4+1.1*t, bounce: 0.08+0.37*t });
}
export function getJellyFeel(): number { return Math.round(Math.max(0,Math.min(1,(9-jellyDynamics.damping)/6))*100); }
