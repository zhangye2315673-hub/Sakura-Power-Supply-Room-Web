import type { ApplianceKind } from './ApplianceCatalog';

export type AppliancePresentation = 'front-three-quarter' | 'top-three-quarter';

const TOP_THREE_QUARTER_KINDS = new Set<ApplianceKind>([
  'robot-vacuum',
  'induction-cooktop',
  'record-player',
  'printer',
  'toaster',
  'rice-cooker',
  'kettle',
  'alarm-clock',
  'portable-speaker',
]);

export function appliancePresentation(kind: ApplianceKind): AppliancePresentation {
  return TOP_THREE_QUARTER_KINDS.has(kind) ? 'top-three-quarter' : 'front-three-quarter';
}

export function applianceTopTilt(kind: ApplianceKind): number {
  if (kind === 'robot-vacuum') return 0.74;
  if (kind === 'induction-cooktop' || kind === 'record-player') return 0.62;
  return appliancePresentation(kind) === 'top-three-quarter' ? 0.48 : 0.14;
}
